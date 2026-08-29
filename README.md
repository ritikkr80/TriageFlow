# TriageFlow — AI Emergency Patient Triage System

> 🏥 **Accenture Innovation Challenge 2026** · Team **NeutronHunter** · IIT ISM Dhanbad

## 🔗 Live Links

| | URL |
|---|---|
| 🚀 **Live App (Vercel)** | [triageflow-one.vercel.app](https://triageflow-one.vercel.app) |
| 📦 **GitHub Repository** | [github.com/ritikkr80/TriageFlow](https://github.com/ritikkr80/TriageFlow) |
| 🔍 **Vercel Dashboard** | [vercel.com/ritikkr80s-projects/triageflow](https://vercel.com/ritikkr80s-projects/triageflow) |

---

TriageFlow is a production-oriented emergency triage decision-support platform designed to assist emergency department nurses and clinicians. It combines **deterministic emergency red-flag safety rules** with **structured AI clinical reasoning (ESI 1?5 triage)**, human-in-the-loop clinician confirmation, robust audit logging, and role-based access control.

Developed for the **Accenture Innovation Challenge 2026** by Team **NeutronHunter** (IIT ISM Dhanbad).

---

## ?? Key Features & Safety Principles

1. **Deterministic Safety Supremacy:**
   - Emergency red flags (e.g. crushing chest pain with diaphoresis, stroke FAST signs, severe shock vitals SBP < 80 mmHg, hypoxia SpO2 < 85%, pediatric fever in neonates) trigger immediate ESI 1/2 safety overrides independently of the LLM.
2. **Structured Pydantic Validation:**
   - AI outputs are strictly constrained to JSON schemas and validated with Pydantic. Free-form text never dictates clinical triage disposition directly.
3. **Human-in-the-Loop Oversight:**
   - The AI only recommends; licensed nurses/physicians make the final decision with 1-click confirmation or structured override with mandatory clinical rationale.
4. **Immutable Audit Trail:**
   - Every patient intake, red flag activation, and clinician decision is recorded in a normalized PostgreSQL/SQLite audit log.
5. **Conservative Uncertainty Defaults:**
   - Missing or ambiguous patient vitals automatically reduce confidence scores and default to conservative higher-acuity tiers.

---

## ??? Tech Stack

- **Frontend & App Backend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM.
- **AI Microservice:** Python 3.12, FastAPI, Pydantic v2, Pytest, Uvicorn.
- **AI Models:** Extensible Provider Abstraction (Google Gemini 2.5/3.0, OpenAI GPT-4o, and High-Fidelity Local Clinical Simulator).

---

## ?? Quick Start Guide

### Option A: 1-Click Launch (Windows)
Double click `start_all.bat` or run:
```bash
.\start_all.bat
```

### Option B: Manual Launch
```bash
# 1. Start Python AI Microservice (Port 8000)
cd backend
python run_server.py

# 2. In a separate terminal, start Next.js (Port 3000)
cd frontend
npm run dev
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **FastAPI AI Docs & Swagger:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## ?? Automated Testing

```bash
# Run backend safety & API test suite
python -m pytest backend/tests -v
```

---

## ?? Role Dashboards

- **Patient Portal (`/patient`):** 4-step intake wizard, instant red-flag interceptor modal, plain-language triage result card.
- **Clinician ED Board (`/clinician`):** Live waiting queue sorted by ESI urgency, side-by-side AI vs. deterministic red flags, 1-click confirm / override drawer.
- **Admin & Governance (`/admin`):** Filterable audit logs, AI provider selector, safety rule toggles.
