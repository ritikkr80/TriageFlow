from fastapi import APIRouter, HTTPException, status
from app.models.schemas import TriageInput, TriageOutput, RedFlagCheckResult
from app.rules.clinical_rules import evaluate_deterministic_red_flags
from app.services.triage_service import triage_orchestrator

router = APIRouter()

@router.get("/health", summary="Health Check")
async def health_check():
    return {
        "status": "healthy",
        "service": "TriageFlow AI Engine",
        "version": "1.0.0"
    }

@router.post(
    "/triage/evaluate",
    response_model=TriageOutput,
    summary="Evaluate Patient Triage with AI & Deterministic Safety Engine",
    status_code=status.HTTP_200_OK
)
async def evaluate_triage(data: TriageInput):
    try:
        result = await triage_orchestrator.evaluate_patient(data)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical Triage Evaluation Failed: {str(e)}"
        )

@router.post(
    "/triage/safety-check",
    response_model=RedFlagCheckResult,
    summary="Evaluate Deterministic Red Flags Only",
    status_code=status.HTTP_200_OK
)
async def check_safety_rules(data: TriageInput):
    return evaluate_deterministic_red_flags(data)
