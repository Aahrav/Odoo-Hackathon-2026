# TransitOps — Smart Transport Operations Platform

> **Modern logistics and fleet management powered by Hybrid RAG AI.**

TransitOps is a comprehensive, full-stack fleet management platform designed to modernize logistics. It tracks vehicles, dispatches trips, enforces strict safety rules, and features **TransitBot**—an intelligent, context-aware AI assistant that combines live operational data with deep company policy knowledge.

---

## Key Features

* **Command Center Dashboard:** Real-time KPIs tracking active vehicles, fleet utilization, active trips, revenue vs expenses, and fuel efficiency via dynamic Recharts.
* **Strict Logistics Enforcement:** Complex PostgreSQL triggers ensure that vehicles in maintenance cannot be dispatched, and driver licenses are validated before trips.
* **Role-Based Access Control (RBAC):** Distinct roles and views for Admins, Fleet Managers, Drivers, and Safety Officers.
* **TransitBot (Hybrid RAG AI):**
  * **Live Context:** Injects real-time database snapshots into the LLM prompt so the bot always knows exactly how many vehicles are available *right now*.
  * **Policy Retrieval:** Uses a **Qdrant Vector Database** to embed and retrieve the 2026 Company Handbook, answering complex compliance questions on the fly.
  * **Conversational Memory:** Uses **Redis** to maintain chat history and context across user sessions.

---

## Tech Stack

### Frontend
* **React 19 & Vite:** Fast, modern UI development.
* **Tailwind CSS v4:** Beautiful, responsive utility-first styling.
* **Recharts:** Interactive data visualization.

### Node.js Backend (API Gateway)
* **Node.js, Express & TypeScript:** Strongly typed, robust API.
* **PostgreSQL:** Primary relational database with complex constraints and triggers.
* **JWT Authentication:** Secure role-based session management.

### AI Microservice
* **Python & FastAPI:** High-performance async microservice for the AI bot.
* **Qdrant:** Vector database running in Docker for RAG (Retrieval-Augmented Generation).
* **Redis:** In-memory data store for persistent conversational memory.
* **Ollama / OpenRouter:** Embedding generation and LLM inference.

---

## Quick Start Guide

### 1. Prerequisites
Ensure you have the following installed:
* **Node.js** (v18+)
* **Python** (v3.10+) with `uv` package manager
* **Docker & Docker Compose**

### 2. Start Infrastructure (Docker)
Start PostgreSQL (if configured via docker), Qdrant, and Redis.
```bash
docker compose up -d
```

### 3. Setup the Node.js Backend
```bash
cd backend
npm install
npm run db:init   # Initializes the PostgreSQL schema
npm run db:seed   # Seeds the database with mock data and test users
npm run dev       # Starts the backend on port 3001
```

### 4. Setup the AI Service
Open a new terminal.
```bash
cd ai-service
# (Optional but recommended: create and activate a virtual environment)
uv pip install -r requirements.txt
python seed_qdrant.py  # Embeds the company policies into Qdrant
uvicorn main:app --reload --port 8000  # Starts the AI service
```

### 5. Setup the Frontend
Open a new terminal.
```bash
cd frontend
npm install
npm run dev       # Starts the frontend on port 5173
```

---

## Test Credentials

Use any of the following accounts to log into the application at `http://localhost:5173`.
All accounts share the same password.

* **Password:** `password123`

| Role | Email |
| :--- | :--- |
| **Admin** | `admin@transitops.in` |
| **Fleet Manager** | `manager@transitops.in` |
| **Driver** | `driver@transitops.in` |
| **Safety Officer** | `mechanic@transitops.in` |

---

## Architecture Flow

1. User sends a message via the **Frontend Chat Interface**.
2. **Node.js API Gateway** intercepts the request and queries PostgreSQL for a live summary of fleet utilization.
3. Node.js forwards the message, user `sessionId`, and live context to the **Python FastAPI Service**.
4. FastAPI queries **Qdrant** for relevant policy documents.
5. FastAPI pulls conversational history from **Redis**.
6. FastAPI formats a rich prompt and sends it to the LLM via **OpenRouter**.
7. The response is saved back to **Redis** and returned to the user in milliseconds.
