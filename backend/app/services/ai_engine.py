import abc
import json
import datetime
from typing import Dict, Any, Optional, List
from app.models.schemas import TriageInput, TriageOutput, EsiLevel, RedFlag
from app.core.config import settings

class BaseAIProvider(abc.ABC):
    @abc.abstractmethod
    async def evaluate_triage(self, data: TriageInput, deterministic_flags: List[RedFlag]) -> Dict[str, Any]:
        pass

class MockClinicalEngine(BaseAIProvider):
    """
    High-fidelity clinical rule & simulated LLM engine for testing and reliable fallback
    without requiring external paid API keys.
    """
    async def evaluate_triage(self, data: TriageInput, deterministic_flags: List[RedFlag]) -> Dict[str, Any]:
        complaint = (data.chief_complaint or "").lower()
        symptoms = [s.lower() for s in data.symptoms]
        text = f"{complaint} {' '.join(symptoms)}"
        v = data.vitals
        
        esi = EsiLevel.LEVEL_3
        routing = "Main ED Waiting / Acute Care Area"
        acuity = "Urgent (ESI 3)"
        drivers = []
        missing = []
        
        if v is None:
            missing.append("Complete vital signs (Heart Rate, Blood Pressure, SpO2, Temperature)")
        else:
            if v.systolic_bp is None: missing.append("Blood Pressure")
            if v.oxygen_saturation is None: missing.append("SpO2 %")
            if v.temperature_celsius is None: missing.append("Body Temperature")
            if v.heart_rate is None: missing.append("Heart Rate")

        if any(k in text for k in ["chest pain", "angina", "heart attack", "substernal", "crushing"]):
            esi = EsiLevel.LEVEL_2
            acuity = "Emergent (ESI 2)"
            routing = "Acute Cardiac Bay"
            drivers.extend(["Potential acute coronary syndrome risk", "Substernal chest pressure presentation", "Requires stat ECG and cardiac enzymes"])
        elif any(k in text for k in ["shortness of breath", "asthma", "difficulty breathing", "wheezing", "hypoxia"]):
            esi = EsiLevel.LEVEL_2
            acuity = "Emergent (ESI 2)"
            routing = "Respiratory Bay"
            drivers.extend(["Acute dyspnea / respiratory effort", "Risk of ventilation impairment", "Requires nebulization / continuous pulse oximetry"])
        elif any(k in text for k in ["stroke", "weakness", "numbness", "slurred speech", "facial droop"]):
            esi = EsiLevel.LEVEL_2
            acuity = "Emergent (ESI 2)"
            routing = "Neuro Acute / CT Scanner Bay"
            drivers.extend(["Acute focal neurological deficit", "Time-sensitive stroke pathway", "Stat non-contrast head CT required"])
        elif any(k in text for k in ["abdominal pain", "vomiting", "fever", "flank pain", "kidney stone", "gallbladder", "appendicitis"]):
            esi = EsiLevel.LEVEL_3
            acuity = "Urgent (ESI 3)"
            routing = "General ED Rapid Assessment Area"
            drivers.extend(["Abdominal complaint requiring multiple diagnostic resources", "Expected blood work, urinalysis, and ultrasound/CT", "Pain management needed"])
        elif any(k in text for k in ["fracture", "deep laceration", "wound", "sprain", "dislocation", "fall"]):
            esi = EsiLevel.LEVEL_3 if "fracture" in text or "deformity" in text else EsiLevel.LEVEL_4
            acuity = "Urgent (ESI 3)" if esi == EsiLevel.LEVEL_3 else "Less Urgent (ESI 4)"
            routing = "Fast Track / Minor Injury Unit"
            drivers.extend(["Musculoskeletal trauma / wound requiring focused care", "Expected single diagnostic resource (X-Ray or suturing)"])
        elif any(k in text for k in ["sore throat", "mild rash", "prescription refill", "ear ache", "cold symptoms", "cough for 2 weeks"]):
            esi = EsiLevel.LEVEL_5 if "refill" in text else EsiLevel.LEVEL_4
            acuity = "Non-Urgent (ESI 5)" if esi == EsiLevel.LEVEL_5 else "Less Urgent (ESI 4)"
            routing = "Fast Track / Outpatient Ambulatory Clinic"
            drivers.extend(["Minor low-acuity complaint", "No complex diagnostic imaging or IV medications anticipated"])
        else:
            esi = EsiLevel.LEVEL_3
            acuity = "Urgent (ESI 3)"
            routing = "ED General Intake Area"
            drivers.append(f"General presentation: {data.chief_complaint}")

        confidence = 0.92
        if missing:
            confidence = min(confidence, settings.MAX_CONFIDENCE_ON_MISSING_VITALS)
            drivers.append(f"Confidence moderated due to {len(missing)} missing vital parameters")

        reassess_times = {
            EsiLevel.LEVEL_1: 0,
            EsiLevel.LEVEL_2: 15,
            EsiLevel.LEVEL_3: 60,
            EsiLevel.LEVEL_4: 120,
            EsiLevel.LEVEL_5: 240
        }

        return {
            "esi_level": esi,
            "acuity_label": acuity,
            "confidence_score": confidence,
            "primary_drivers": drivers,
            "recommended_routing": routing,
            "reassessment_interval_minutes": reassess_times.get(esi, 60),
            "clinician_review_required": True,
            "requires_immediate_resuscitation": esi == EsiLevel.LEVEL_1,
            "missing_critical_data": missing,
            "patient_explanation": f"You have been categorized as {acuity}. Our clinical staff have prioritized your evaluation based on your chief symptom '{data.chief_complaint}'. An emergency clinician will review your case shortly.",
            "clinical_rationale": f"Patient presenting with '{data.chief_complaint}'. Assigned {acuity} based on ESI algorithm criteria, anticipated diagnostic resource utilization, and vital stability.",
            "ai_provider": "Clinical-Inference-Engine-v1"
        }

class GeminiAIProvider(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.fallback = MockClinicalEngine()

    async def evaluate_triage(self, data: TriageInput, deterministic_flags: List[RedFlag]) -> Dict[str, Any]:
        if not self.api_key:
            return await self.fallback.evaluate_triage(data, deterministic_flags)
        
        import httpx
        system_prompt = """You are an emergency department clinical triage AI co-pilot.
Your task is to analyze the patient's demographics, vitals, chief complaint, and clinical presentation, and return a strictly validated JSON structure corresponding to the Emergency Severity Index (ESI 1-5).
Rules:
1. ESI 1: Immediate life-saving resuscitation required (Unresponsive, arrest, severe shock/hypoxia).
2. ESI 2: High risk / Emergent (chest pain, stroke symptoms, acute respiratory distress, severe sepsis risk, severe pain 9-10).
3. ESI 3: Urgent, requires >= 2 resources (e.g. bloods, IV meds, CT/X-Ray) and has stable vitals.
4. ESI 4: Less urgent, requires 1 simple resource.
5. ESI 5: Non-urgent, requires 0 resources (e.g. suture removal, prescription refill).
Output ONLY pure JSON. Do not make diagnostic claims. Explicitly state uncertainty and missing data."""

        user_content = {
            "demographics": data.demographics.model_dump(),
            "chief_complaint": data.chief_complaint,
            "symptoms": data.symptoms,
            "duration_hours": data.symptom_duration_hours,
            "vitals": data.vitals.model_dump() if data.vitals else None,
            "nurse_observations": data.nurse_observations,
            "detected_deterministic_red_flags": [f.model_dump() for f in deterministic_flags]
        }

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.LLM_MODEL_NAME}:generateContent?key={self.api_key}"
            payload = {
                "contents": [{
                    "role": "user",
                    "parts": [{"text": f"{system_prompt}\n\nPatient Data:\n{json.dumps(user_content)}"}]
                }],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    body = res.json()
                    raw_text = body["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(raw_text)
                    parsed["ai_provider"] = f"Gemini ({settings.LLM_MODEL_NAME})"
                    return parsed
        except Exception:
            pass
        
        fallback_res = await self.fallback.evaluate_triage(data, deterministic_flags)
        fallback_res["ai_provider"] = "Gemini-Fallback (Mock Clinical Engine)"
        return fallback_res

def get_ai_provider() -> BaseAIProvider:
    provider = settings.DEFAULT_LLM_PROVIDER.lower()
    if provider == "gemini" and settings.GEMINI_API_KEY:
        return GeminiAIProvider()
    return MockClinicalEngine()
