import os
import requests
from qdrant_client import QdrantClient
from qdrant_client.http import models

class HybridRetriever:
    def __init__(self, collection_name="transit_policies"):
        qdrant_url = os.environ.get("QDRANT_URL", "http://localhost:6333")
        self.client = QdrantClient(url=qdrant_url)
        self.collection_name = collection_name
        self.ollama_url = os.environ.get("OLLAMA_EMBED_URL", "http://localhost:11434/api/embeddings")
        self.embed_model = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text:latest")

        # Note: True hybrid BM25 + Dense requires initializing sparse vectors in Qdrant.
        # For this hackathon scope, we assume the collection is either pre-configured 
        # or we fallback to pure dense retrieval if sparse isn't set up.

    def _get_dense_embedding(self, text: str) -> list[float]:
        try:
            response = requests.post(self.ollama_url, json={
                "model": self.embed_model,
                "prompt": text
            })
            response.raise_for_status()
            return response.json().get("embedding", [])
        except Exception as e:
            print(f"Error fetching dense embedding from Ollama: {e}")
            return []

    def retrieve(self, query: str, limit: int = 3) -> str:
        vector = self._get_dense_embedding(query)
        if not vector:
            return ""

        try:
            # Performs a Dense Search. 
            # In a full FastEmbed setup, this would use model.query() for hybrid.
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=vector,
                limit=limit
            )
            
            context_docs = []
            for i, res in enumerate(results):
                payload_text = res.payload.get("text", str(res.payload))
                context_docs.append(f"Document {i+1}: {payload_text}")
                
            return "\n\n".join(context_docs)
        except Exception as e:
            print(f"Qdrant retrieval error: {e}")
            return ""
