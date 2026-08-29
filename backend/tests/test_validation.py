import pytest
from starlette.testclient import TestClient
from app.main import app
from app.models.schemas import EsiLevel

client = TestClient(app)

def test_pediatric_fever_red_flag():
    payload = {
        "demographics": {
            "age": 0,
            "sex": "FEMALE",
            "medical_history": []
        },
        "chief_complaint": "2-month-old infant irritable with high fever",
        "symptoms": ["Fever", "Poor feeding", "Lethargy"],
        "vitals": {
            "heart_rate": 160,
            "temperature_celsius": 38.6,
            "oxygen_saturation": 97
        }
    }
    response = client.post("/api/v1/triage/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["esi_level"] == 2
    assert any(f["code"] == "RF_PEDIATRIC_NEONATAL_FEVER" for f in data["detected_red_flags"])

def test_anaphylaxis_airway_red_flag():
    payload = {
        "demographics": {
            "age": 28,
            "sex": "MALE",
            "allergies": ["Peanuts"]
        },
        "chief_complaint": "Ate cookies with nuts, throat closing and lip swelling",
        "symptoms": ["Throat closing", "Lip swelling", "Difficulty breathing"],
        "vitals": {
            "heart_rate": 125,
            "oxygen_saturation": 92,
            "respiratory_rate": 28
        }
    }
    response = client.post("/api/v1/triage/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["esi_level"] in [1, 2]
    assert any(f["code"] == "RF_ANAPHYLAXIS_AIRWAY" for f in data["detected_red_flags"])

def test_missing_vitals_conservative_default():
    payload = {
        "demographics": {
            "age": 35,
            "sex": "FEMALE"
        },
        "chief_complaint": "Moderate abdominal cramping and nausea",
        "symptoms": ["Nausea", "Abdominal pain"],
        "vitals": None
    }
    response = client.post("/api/v1/triage/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["confidence_score"] <= 0.65
    assert len(data["missing_critical_data"]) > 0
