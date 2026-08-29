from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    PROJECT_NAME: str = "TriageFlow AI Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    BACKEND_PORT: int = 8000
    BACKEND_HOST: str = "127.0.0.1"
    
    DEFAULT_LLM_PROVIDER: str = "mock"
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    LLM_MODEL_NAME: str = "gemini-2.5-flash"
    
    CONSERVATIVE_OVERRIDE_ENABLED: bool = True
    MAX_CONFIDENCE_ON_MISSING_VITALS: float = 0.65

settings = Settings()
