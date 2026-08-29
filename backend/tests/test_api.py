import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_triage_evaluation_pipeline():
    payload = {
        "demographics": {
            "age": 45,
            "sex": "MALE",
            "allergies": ["Penicillin"],
            "medical_history": ["Asthma"]
        },
        "chief_complaint": "Acute onset shortness of breath and wheezing",
        "symptoms": ["Shortness of breath", "Wheezing"],
        "vitals": {
            "heart_rate": 115,
            "systolic_bp": 135,
            "diastolic_bp": 85,
            "oxygen_saturation": 91,
            "respiratory_rate": 26,
            "pain_score": 3
        }
    }
    response = client.post("/api/v1/triage/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["esi_level"] in [1, 2]
    assert data["confidence_score"] > 0.0
    assert len(data["primary_drivers"]) > 0
    assert data["clinician_review_required"] is True
    assert "TRIAGEFLOW SAFETY NOTICE" in data["safety_disclaimer"]

def test_malformed_input_validation():
    payload = {
        "chief_complaint": "Headache"
    }
    response = client.post("/api/v1/triage/evaluate", json=payload)
    assert response.status_code == 422
