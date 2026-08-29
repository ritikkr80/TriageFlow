from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class ArrivalMode(str, Enum):
    WALK_IN = "WALK_IN"
    AMBULANCE = "AMBULANCE"
    WHEELCHAIR = "WHEELCHAIR"
    OTHER = "OTHER"

class Sex(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"

class EsiLevel(int, Enum):
    LEVEL_1 = 1  # Resuscitation
    LEVEL_2 = 2  # Emergent
    LEVEL_3 = 3  # Urgent
    LEVEL_4 = 4  # Less Urgent
    LEVEL_5 = 5  # Non-Urgent

class VitalsInput(BaseModel):
    heart_rate: Optional[int] = Field(None, ge=20, le=260, description="Heart rate in bpm")
    systolic_bp: Optional[int] = Field(None, ge=40, le=300, description="Systolic Blood Pressure mmHg")
    diastolic_bp: Optional[int] = Field(None, ge=20, le=200, description="Diastolic Blood Pressure mmHg")
    oxygen_saturation: Optional[int] = Field(None, ge=40, le=100, description="SpO2 %")
    respiratory_rate: Optional[int] = Field(None, ge=4, le=70, description="Breaths per minute")
    temperature_celsius: Optional[float] = Field(None, ge=25.0, le=45.0, description="Body Temp in Celsius")
    pain_score: Optional[int] = Field(None, ge=0, le=10, description="0-10 numeric pain rating")

class PatientDemographics(BaseModel):
    age: int = Field(..., ge=0, le=130)
    sex: Sex
    is_pregnant: Optional[bool] = False
    allergies: List[str] = Field(default_factory=list)
    medical_history: List[str] = Field(default_factory=list)
    current_medications: List[str] = Field(default_factory=list)

class TriageInput(BaseModel):
    patient_id: Optional[str] = None
    session_id: Optional[str] = None
    demographics: PatientDemographics
    arrival_mode: ArrivalMode = ArrivalMode.WALK_IN
    chief_complaint: str = Field(..., min_length=2, max_length=500)
    symptoms: List[str] = Field(default_factory=list)
    symptom_duration_hours: Optional[float] = Field(None, ge=0)
    vitals: Optional[VitalsInput] = None
    nurse_observations: Optional[str] = Field(None, max_length=1000)
    gcs_score: Optional[int] = Field(None, ge=3, le=15, description="Glasgow Coma Scale")

class RedFlag(BaseModel):
    code: str
    category: str
    severity: str = "CRITICAL"  # CRITICAL, HIGH, MODERATE
    description: str
    triggered_by: str
    deterministic: bool = True

class TriageOutput(BaseModel):
    esi_level: EsiLevel
    acuity_label: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    primary_drivers: List[str]
    detected_red_flags: List[RedFlag]
    recommended_routing: str
    reassessment_interval_minutes: int
    clinician_review_required: bool
    requires_immediate_resuscitation: bool
    missing_critical_data: List[str]
    patient_explanation: str
    clinical_rationale: str
    safety_disclaimer: str
    ai_provider: str
    evaluated_at: str

class RedFlagCheckResult(BaseModel):
    has_critical_red_flag: bool
    override_esi: Optional[EsiLevel]
    flags: List[RedFlag]
    recommended_routing: Optional[str]
