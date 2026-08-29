from typing import List, Optional
from app.models.schemas import TriageInput, RedFlag, RedFlagCheckResult, EsiLevel

def evaluate_deterministic_red_flags(data: TriageInput) -> RedFlagCheckResult:
    flags: List[RedFlag] = []
    override_esi: Optional[EsiLevel] = None
    routing = None
    
    complaint_lower = (data.chief_complaint or "").lower()
    symptoms_lower = [s.lower() for s in data.symptoms]
    obs_lower = (data.nurse_observations or "").lower()
    combined_text = f"{complaint_lower} {' '.join(symptoms_lower)} {obs_lower}"
    
    v = data.vitals
    
    # 1. CRITICAL RESUSCITATION RULES (ESI 1)
    if data.gcs_score is not None and data.gcs_score < 9:
        flags.append(RedFlag(
            code="RF_GCS_CRITICAL",
            category="Neurological",
            severity="CRITICAL",
            description="Severe altered level of consciousness (GCS < 9)",
            triggered_by=f"GCS score: {data.gcs_score}",
            deterministic=True
        ))
        override_esi = EsiLevel.LEVEL_1
        routing = "Resuscitation Bay (Trauma / Shock Room)"
        
    if v and v.oxygen_saturation is not None and v.oxygen_saturation < 85:
        flags.append(RedFlag(
            code="RF_SEVERE_HYPOXIA",
            category="Respiratory",
            severity="CRITICAL",
            description="Critical hypoxia (SpO2 < 85%)",
            triggered_by=f"SpO2: {v.oxygen_saturation}%",
            deterministic=True
        ))
        override_esi = EsiLevel.LEVEL_1
        routing = "Resuscitation Bay - Immediate High-Flow O2 / Intubation Prep"

    if v and v.systolic_bp is not None and v.systolic_bp < 80:
        flags.append(RedFlag(
            code="RF_SEVERE_HYPOTENSION_SHOCK",
            category="Cardiovascular / Shock",
            severity="CRITICAL",
            description="Severe hypotension / decompensated shock (SBP < 80 mmHg)",
            triggered_by=f"Systolic BP: {v.systolic_bp} mmHg",
            deterministic=True
        ))
        override_esi = EsiLevel.LEVEL_1
        routing = "Resuscitation Bay - Immediate IV Access / Resuscitation"

    if any(k in combined_text for k in ["unresponsive", "not breathing", "pulseless", "cardiac arrest", "respiratory arrest"]):
        flags.append(RedFlag(
            code="RF_CARDIOPULMONARY_ARREST",
            category="Resuscitation",
            severity="CRITICAL",
            description="Unresponsive or acute cardiopulmonary arrest pattern",
            triggered_by="Observations / Chief Complaint indicator",
            deterministic=True
        ))
        override_esi = EsiLevel.LEVEL_1
        routing = "Resuscitation Bay (Code Blue / Immediate Life Support)"

    # 2. HIGH RISK EMERGENT RULES (ESI 2)
    # Cardiac / ACS Check
    is_cardiac_symptom = any(k in combined_text for k in [
        "chest pain", "chest tightness", "pressure in chest", "angina", "left arm pain", "substernal", "diaphoretic"
    ])
    has_cardiac_risk = (
        data.demographics.age >= 35 or 
        any("cardiac" in m.lower() or "hypertension" in m.lower() or "diabetes" in m.lower() for m in data.demographics.medical_history) or
        "diaphoretic" in combined_text or
        "sweating" in combined_text or
        "shortness of breath" in combined_text
    )
    if is_cardiac_symptom and has_cardiac_risk:
        flags.append(RedFlag(
            code="RF_POSSIBLE_ACS",
            category="Cardiology",
            severity="CRITICAL",
            description="Potential Acute Coronary Syndrome (ACS) / Myocardial Infarction",
            triggered_by="Chest pain with associated cardiac risk profile / diaphoresis",
            deterministic=True
        ))
        if override_esi != EsiLevel.LEVEL_1:
            override_esi = EsiLevel.LEVEL_2
            routing = "Acute Cardiac Bay - Stat 12-Lead ECG & Troponin"

    # Acute Stroke FAST Check
    stroke_keywords = ["facial droop", "slurred speech", "one-sided weakness", "hemiparesis", "aphasia", "stroke", "sudden numbness", "loss of speech"]
    if any(k in combined_text for k in stroke_keywords):
        duration_note = f" (Duration: {data.symptom_duration_hours}h)" if data.symptom_duration_hours is not None else ""
        flags.append(RedFlag(
            code="RF_ACUTE_STROKE_FAST",
            category="Neurological",
            severity="CRITICAL",
            description=f"Suspected Acute Ischemic / Hemorrhagic Stroke (FAST Protocol){duration_note}",
            triggered_by="Focal neurological deficits / acute speech or motor loss",
            deterministic=True
        ))
        if override_esi != EsiLevel.LEVEL_1:
            override_esi = EsiLevel.LEVEL_2
            routing = "Stat CT Neuro / Stroke Team Alert"

    # Sepsis Screening
    sepsis_criteria = 0
    sepsis_triggers = []
    if v:
        if v.temperature_celsius is not None and (v.temperature_celsius >= 38.3 or v.temperature_celsius < 36.0):
            sepsis_criteria += 1
            sepsis_triggers.append(f"Temp {v.temperature_celsius}C")
        if v.heart_rate is not None and v.heart_rate > 95:
            sepsis_criteria += 1
            sepsis_triggers.append(f"HR {v.heart_rate} bpm")
        if v.respiratory_rate is not None and v.respiratory_rate >= 22:
            sepsis_criteria += 1
            sepsis_triggers.append(f"RR {v.respiratory_rate}/min")
        if v.systolic_bp is not None and v.systolic_bp <= 100:
            sepsis_criteria += 1
            sepsis_triggers.append(f"SBP {v.systolic_bp} mmHg")
            
    is_infection_complaint = any(k in combined_text for k in ["fever", "chills", "cough", "dysuria", "cellulitis", "wound infection", "lethargic", "confused"])
    if sepsis_criteria >= 2 and is_infection_complaint:
        flags.append(RedFlag(
            code="RF_SEPSIS_WARNING",
            category="Infectious / Sepsis",
            severity="HIGH",
            description="Potential Severe Sepsis / Septic Shock Criteria (SIRS/qSOFA positive)",
            triggered_by=", ".join(sepsis_triggers),
            deterministic=True
        ))
        if override_esi not in [EsiLevel.LEVEL_1, EsiLevel.LEVEL_2]:
            override_esi = EsiLevel.LEVEL_2
            routing = "Rapid Assessment - Sepsis Protocol (Blood cultures + IV Lactate/Fluids)"

    # Anaphylaxis / Severe Airway Risk
    anaphylaxis_keywords = ["throat closing", "tongue swelling", "stridor", "wheezing", "peanut allergy", "bee sting", "anaphylaxis", "lip swelling"]
    if any(k in combined_text for k in anaphylaxis_keywords):
        flags.append(RedFlag(
            code="RF_ANAPHYLAXIS_AIRWAY",
            category="Immunology / Airway",
            severity="CRITICAL",
            description="High risk for severe Anaphylaxis or imminent Airway Compromise",
            triggered_by="Upper airway swelling / allergen exposure pattern",
            deterministic=True
        ))
        if override_esi != EsiLevel.LEVEL_1:
            override_esi = EsiLevel.LEVEL_2
            routing = "Resuscitation / Airway Bay - Immediate IM Epinephrine Prep"

    # Severe Respiratory Distress (SpO2 85-89% or RR > 30)
    if v and ((v.oxygen_saturation is not None and 85 <= v.oxygen_saturation < 90) or (v.respiratory_rate is not None and v.respiratory_rate >= 30)):
        flags.append(RedFlag(
            code="RF_ACUTE_RESPIRATORY_DISTRESS",
            category="Respiratory",
            severity="HIGH",
            description="Severe acute respiratory distress / hypoxia",
            triggered_by=f"SpO2: {v.oxygen_saturation}%, RR: {v.respiratory_rate}",
            deterministic=True
        ))
        if override_esi not in [EsiLevel.LEVEL_1, EsiLevel.LEVEL_2]:
            override_esi = EsiLevel.LEVEL_2
            routing = "Acute Respiratory Bed - Supplemental O2 / Nebulizer"

    # Pediatric high fever in neonate/infant (< 3 months)
    if data.demographics.age == 0 and v and v.temperature_celsius is not None and v.temperature_celsius >= 38.0:
        flags.append(RedFlag(
            code="RF_PEDIATRIC_NEONATAL_FEVER",
            category="Pediatrics",
            severity="HIGH",
            description="Neonatal / Infant Fever (< 3 months of age, temp >= 38.0C)",
            triggered_by=f"Age: infant, Temp: {v.temperature_celsius}C",
            deterministic=True
        ))
        if override_esi not in [EsiLevel.LEVEL_1, EsiLevel.LEVEL_2]:
            override_esi = EsiLevel.LEVEL_2
            routing = "Pediatric Emergency Zone - Stat Full Sepsis Workup"

    # Severe Pain Score 9-10
    if v and v.pain_score is not None and v.pain_score >= 9:
        flags.append(RedFlag(
            code="RF_SEVERE_INTRACTABLE_PAIN",
            category="Pain Management",
            severity="MODERATE",
            description="Severe intractable acute pain (Score >= 9/10)",
            triggered_by=f"Pain score: {v.pain_score}/10",
            deterministic=True
        ))
        if override_esi not in [EsiLevel.LEVEL_1, EsiLevel.LEVEL_2]:
            override_esi = EsiLevel.LEVEL_2

    has_critical = any(f.severity in ["CRITICAL", "HIGH"] for f in flags)
    return RedFlagCheckResult(
        has_critical_red_flag=has_critical,
        override_esi=override_esi,
        flags=flags,
        recommended_routing=routing
    )
