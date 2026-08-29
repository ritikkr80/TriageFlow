import pytest
from app.models.schemas import TriageInput, PatientDemographics, VitalsInput, Sex, ArrivalMode, EsiLevel
from app.rules.clinical_rules import evaluate_deterministic_red_flags

def test_stemi_chest_pain_red_flag():
    patient = TriageInput(
        demographics=PatientDemographics(
            age=55,
            sex=Sex.MALE,
            medical_history=["Hypertension", "Type 2 Diabetes"]
        ),
        chief_complaint="Crushing substernal chest pain radiating to left arm",
        symptoms=["Chest Pain", "Diaphoresis", "Shortness of Breath"],
        symptom_duration_hours=1.5,
        vitals=VitalsInput(heart_rate=105, systolic_bp=165, diastolic_bp=95, oxygen_saturation=94, respiratory_rate=20),
        nurse_observations="Patient appears pale, sweating, clutching chest"
    )
    result = evaluate_deterministic_red_flags(patient)
    assert result.has_critical_red_flag is True
    assert result.override_esi == EsiLevel.LEVEL_2
    assert any(f.code == "RF_POSSIBLE_ACS" for f in result.flags)

def test_severe_shock_hypotension_esi1():
    patient = TriageInput(
        demographics=PatientDemographics(age=40, sex=Sex.FEMALE),
        chief_complaint="Severe abdominal pain and dizziness after MVC",
        vitals=VitalsInput(heart_rate=140, systolic_bp=75, diastolic_bp=45, oxygen_saturation=91, respiratory_rate=28),
        nurse_observations="Lethargic, cold clammy extremities"
    )
    result = evaluate_deterministic_red_flags(patient)
    assert result.has_critical_red_flag is True
    assert result.override_esi == EsiLevel.LEVEL_1
    assert any(f.code == "RF_SEVERE_HYPOTENSION_SHOCK" for f in result.flags)

def test_critical_hypoxia_esi1():
    patient = TriageInput(
        demographics=PatientDemographics(age=68, sex=Sex.MALE),
        chief_complaint="Severe COPD exacerbation, gasping for air",
        vitals=VitalsInput(heart_rate=120, systolic_bp=130, diastolic_bp=80, oxygen_saturation=82, respiratory_rate=36)
    )
    result = evaluate_deterministic_red_flags(patient)
    assert result.has_critical_red_flag is True
    assert result.override_esi == EsiLevel.LEVEL_1
    assert any(f.code == "RF_SEVERE_HYPOXIA" for f in result.flags)

def test_acute_stroke_fast_protocol():
    patient = TriageInput(
        demographics=PatientDemographics(age=72, sex=Sex.FEMALE),
        chief_complaint="Sudden onset slurred speech and right arm weakness",
        symptom_duration_hours=1.0,
        vitals=VitalsInput(heart_rate=88, systolic_bp=170, diastolic_bp=95, oxygen_saturation=98, respiratory_rate=16)
    )
    result = evaluate_deterministic_red_flags(patient)
    assert result.has_critical_red_flag is True
    assert result.override_esi == EsiLevel.LEVEL_2
    assert any(f.code == "RF_ACUTE_STROKE_FAST" for f in result.flags)

def test_minor_complaint_no_red_flags():
    patient = TriageInput(
        demographics=PatientDemographics(age=24, sex=Sex.MALE),
        chief_complaint="Twisted right ankle while playing basketball 2 hours ago",
        symptoms=["Ankle swelling", "Mild pain on weight bearing"],
        vitals=VitalsInput(heart_rate=72, systolic_bp=118, diastolic_bp=76, oxygen_saturation=99, respiratory_rate=14, pain_score=4)
    )
    result = evaluate_deterministic_red_flags(patient)
    assert result.has_critical_red_flag is False
    assert result.override_esi is None
