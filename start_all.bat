@echo off
echo ===================================================
echo Starting TriageFlow Full-Stack System
echo ===================================================

echo [1/2] Launching Python FastAPI AI Engine on port 8000...
start cmd /k "cd backend && python run_server.py"

timeout /t 2 >nul

echo [2/2] Launching Next.js Frontend on port 3000...
start cmd /k "cd frontend && npm run dev"

echo ===================================================
echo TriageFlow is now running!
echo Frontend: http://localhost:3000
echo AI Engine Swagger API: http://127.0.0.1:8000/docs
echo ===================================================
