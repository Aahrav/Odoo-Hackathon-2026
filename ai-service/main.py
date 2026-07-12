import os
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any, Dict
from dotenv import load_dotenv

# Load the API key from the Node backend .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from retrieval import HybridRetriever
from prompts import SYSTEM_PROMPT

app = FastAPI(title="TransitOps AI Service")
retriever = HybridRetriever()

class ChatRequest(BaseModel):
    message: str
    live_context: Dict[str, Any]

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    if not openrouter_key:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is not set in environment.")

    # 1. Retrieve Qdrant Context
    qdrant_context = retriever.retrieve(req.message, limit=2)
    
    # 2. Format Prompt
    prompt = SYSTEM_PROMPT.format(
        qdrant_context=qdrant_context if qdrant_context else "No specific policies retrieved.",
        live_context=req.live_context
    )

    # 3. Call OpenRouter
    llm_model = os.environ.get("LLM_MODEL_NAME", "openai/gpt-4o")
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {openrouter_key}",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "TransitOps Fast API Service",
                "Content-Type": "application/json"
            },
            json={
                "model": llm_model, 
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": req.message}
                ]
            }
        )
        response.raise_for_status()
        data = response.json()
        reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {"success": True, "data": {"reply": reply}}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenRouter API Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
