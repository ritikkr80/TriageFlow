import datetime
from app.models.schemas import TriageInput, TriageOutput, EsiLevel
from app.rules.clinical_rules import evaluate_deterministic_red_flags
from app.services.ai_engine import get_ai_provider
from app.core.config import settings

class TriageOrchestrator:
    def __init__(self):
        self.ai_provider = get_ai_provider()

    async def evaluate_patient(self, input_data: TriageInput) -> TriageOutput:
        safety_check = evaluate_deterministic_red_flags(input_data)
        ai_raw = await self.ai_provider.evaluate_triage(input_data, safety_check.flags)
        
        final_esi: EsiLevel = ai_raw.get("esi_level", EsiLevel.LEVEL_3)
        if isinstance(final_esi, int):
            final_esi = EsiLevel(final_esi)
            
        routing = ai_raw.get("recommended_routing", "ED General Care Area")
        confidence = float(ai_raw.get("confidence_score", 0.85))
        drivers = list(ai_raw.get("primary_drivers", []))
        
        if safety_check.has_critical_red_flag and safety_check.override_esi is not None:
            if safety_check.override_esi.value < final_esi.value:
                final_esi = safety_check.override_esi
                drivers.insert(0, f"DETERMINISTIC SAFETY OVERRIDE: Escalated to ESI {final_esi.value} due to critical red-flag triggers.")
                if safety_check.recommended_routing:
                    routing = safety_check.recommended_routing
                confidence = 0.98

        missing_vitals = []
        if not input_data.vitals:
            missing_vitals.append("All baseline vitals (HR, BP, SpO2, Temp, RR)")
            confidence = min(confidence, settings.MAX_CONFIDENCE_ON_MISSING_VITALS)
            if final_esi.value > 3:
                final_esi = EsiLevel.LEVEL_3
                drivers.append("Safety default applied: Leaned conservative to ESI 3 due to missing vital parameters")

        acuity_labels = {
            EsiLevel.LEVEL_1: "Immediate Resuscitation (ESI 1)",
            EsiLevel.LEVEL_2: "Emergent (ESI 2)",
            EsiLevel.LEVEL_3: "Urgent (ESI 3)",
            EsiLevel.LEVEL_4: "Less Urgent (ESI 4)",
            EsiLevel.LEVEL_5: "Non-Urgent (ESI 5)",
        }
        
        reassess_intervals = {
            EsiLevel.LEVEL_1: 0,
            EsiLevel.LEVEL_2: 15,
            EsiLevel.LEVEL_3: 60,
            EsiLevel.LEVEL_4: 120,
            EsiLevel.LEVEL_5: 240
        }

        safety_disclaimer = (
            "TRIAGEFLOW SAFETY NOTICE: This assessment is an automated clinical decision-support recommendation "
            "and does NOT constitute a definitive medical diagnosis. A licensed clinician must review and confirm "
            "all acuity levels and clinical routing. If the patient's condition changes or deteriorates at any point, "
            "alert emergency medical staff immediately."
        )

        return TriageOutput(
            esi_level=final_esi,
            acuity_label=acuity_labels.get(final_esi, f"ESI {final_esi.value}"),
            confidence_score=round(confidence, 2),
            primary_drivers=drivers,
            detected_red_flags=safety_check.flags,
            recommended_routing=routing,
            reassessment_interval_minutes=reassess_intervals.get(final_esi, 60),
            clinician_review_required=True,
            requires_immediate_resuscitation=final_esi == EsiLevel.LEVEL_1,
            missing_critical_data=missing_vitals + ai_raw.get("missing_critical_data", []),
            patient_explanation=ai_raw.get(
                "patient_explanation",
                f"You have been assigned triage category {acuity_labels.get(final_esi)}. Our emergency team has logged your symptoms and a healthcare professional will examine you."
            ),
            clinical_rationale=ai_raw.get("clinical_rationale", f"Acuity {final_esi.value} assigned based on presentation and deterministic safety validation."),
            safety_disclaimer=safety_disclaimer,
            ai_provider=ai_raw.get("ai_provider", "Clinical-AI-Safety-Engine"),
            evaluated_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
        )

triage_orchestrator = TriageOrchestrator()
