# TransitOps AI Service (FastAPI)

This is the Python microservice that powers the Hybrid BM25 RAG Chatbot. It connects to the Node.js backend to provide intelligent, context-aware responses using real-time PostgreSQL data and Qdrant vectorized policies.

## How to Run Locally

1. **Navigate to the AI service directory:**
   ```bash
   cd ai-service
   ```

2. **Activate the Virtual Environment:**
   *(Assuming you created it using `uv venv`)*
   ```bash
   .\.venv\Scripts\activate
   ```

3. **Install Dependencies:**
   ```bash
   uv pip install -r requirements.txt
   ```

4. **Start the FastAPI Server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

Once running, the server will be available at `http://localhost:8000`. The Node.js API Gateway (`chat.service.ts`) will automatically forward all chat requests to this address!

## Configuration
All AI configurations (like `OPENROUTER_API_KEY`, model names, and Qdrant URLs) are automatically loaded from your Node.js `backend/.env` file. You do not need a separate `.env` file here.
