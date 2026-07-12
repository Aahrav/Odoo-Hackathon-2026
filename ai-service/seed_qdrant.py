import os
import requests
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance, PointStruct
import uuid
from dotenv import load_dotenv

# Load config
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
OLLAMA_URL = os.environ.get("OLLAMA_EMBED_URL", "http://localhost:11434/api/embeddings")
OLLAMA_MODEL = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text:latest")
COLLECTION_NAME = "transit_policies"

# Sample Policies to seed
POLICIES = [
    "SAFETY POLICY: Drivers must never exceed 12 consecutive hours of driving in a single 24-hour period. A mandatory 8-hour rest is required.",
    "MAINTENANCE PROTOCOL: Any vehicle exceeding 15,000 km since its last service must be immediately marked as 'Maintenance Required' and taken off active dispatch.",
    "CARGO LIMITS: VAN class vehicles have a strict maximum capacity of 500kg. TRUCK class vehicles have a maximum capacity of 5000kg. Overloading is a severe compliance violation.",
    "DISPATCH RULES: A trip can only be dispatched if the assigned driver's license is valid for at least 30 more days from the dispatch date."
]

def get_embedding(text: str):
    print(f"Fetching embedding from Ollama for: '{text[:30]}...'")
    res = requests.post(OLLAMA_URL, json={"model": OLLAMA_MODEL, "prompt": text})
    res.raise_for_status()
    return res.json()["embedding"]

def seed():
    print(f"Connecting to Qdrant at {QDRANT_URL}...")
    client = QdrantClient(url=QDRANT_URL)

    # 1. Create or recreate the collection
    if client.collection_exists(COLLECTION_NAME):
        print(f"Collection '{COLLECTION_NAME}' exists. Deleting it to start fresh...")
        client.delete_collection(COLLECTION_NAME)

    # Note: nomic-embed-text generates 768-dimensional vectors.
    print(f"Creating collection '{COLLECTION_NAME}'...")
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=768, distance=Distance.COSINE),
    )

    # 2. Generate embeddings and upload
    points = []
    for i, policy in enumerate(POLICIES):
        vector = get_embedding(policy)
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={"text": policy, "source": "Company Handbook 2026"}
            )
        )
    
    print("Uploading vectors to Qdrant...")
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )
    
    print("✅ Qdrant seeded successfully! The bot can now search these policies.")

if __name__ == "__main__":
    seed()
