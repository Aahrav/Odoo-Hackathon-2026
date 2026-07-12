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

# Comprehensive TransitOps Company Handbook 2026
POLICIES = [
    # Driver Safety & Compliance
    "DRIVER SAFETY POLICY 101: Drivers must never exceed 12 consecutive hours of driving in a single 24-hour period. A mandatory 8-hour uninterrupted rest period is required before resuming duties. Violations will result in immediate suspension pending review.",
    "DRIVER SAFETY POLICY 102: All drivers must complete a pre-trip inspection of their vehicle, checking tire pressure, brake functionality, and fluid levels. This must be logged electronically before marking a trip as 'dispatched'.",
    "DRIVER SAFETY POLICY 103: In severe weather conditions (e.g., heavy rain, snow, fog), speed limits must be reduced by at least 20 km/h below the posted speed limit. Dispatch has the authority to cancel trips if visibility drops below 50 meters.",
    "DRIVER COMPLIANCE 201: A trip can only be dispatched if the assigned driver's commercial license is valid for at least 30 more days from the dispatch date. If a license expires during a trip, the driver must pull over and await a relief driver.",
    "DRIVER CONDUCT 202: The use of mobile devices while operating a TransitOps vehicle is strictly prohibited unless connected to a hands-free system and used solely for navigation or communication with Dispatch.",

    # Vehicle Maintenance & Fleet Operations
    "MAINTENANCE PROTOCOL 301: Any vehicle exceeding 15,000 km since its last recorded service must be immediately marked as 'Maintenance Required' and taken off active dispatch. Operating a vehicle past this limit is a severe compliance violation.",
    "MAINTENANCE PROTOCOL 302: Vehicles reporting engine warning lights or brake degradation must be categorized as 'AOG' (Aircraft on Ground / Vehicle Grounded). They cannot be assigned to any future trips until a certified mechanic clears the vehicle.",
    "FLEET MANAGEMENT 401: Fleet utilization should ideally be maintained above 75%. If utilization drops below 50% for more than 3 consecutive days, a fleet reassessment report must be generated for executive review.",
    "FUEL USAGE 402: Idling for more than 5 consecutive minutes is strictly prohibited to reduce fuel expenses and environmental impact. Vehicles equipped with auto-shutoff must have this feature permanently enabled.",

    # Cargo & Payload Regulations
    "CARGO LIMITS 501: VAN class vehicles have a strict maximum payload capacity of 1,200kg. TRUCK class vehicles have a maximum payload capacity of 15,000kg. Overloading vehicles compromises braking distance and is a severe safety hazard.",
    "CARGO LIMITS 502: Hazardous materials (HazMat) require a specialized HazMat certified driver and a Class-A certified heavy-duty truck. HazMat cannot be transported in standard VANs under any circumstances.",
    "CARGO HANDLING 503: All cargo must be secured using industrial-grade ratchet straps. Load distribution must be even; placing more than 60% of the weight over the rear axle is prohibited to prevent fishtailing.",

    # Emergency & Incident Response
    "INCIDENT RESPONSE 601: In the event of a collision, the driver's first priority is safety. Secure the vehicle, check for injuries, and call emergency services if necessary. Dispatch must be notified within 15 minutes of the incident.",
    "INCIDENT RESPONSE 602: If cargo is damaged during transit, the driver must document the damage with photographs and submit a 'Cargo Integrity Report' upon arrival at the destination. Do not dispose of damaged goods without client authorization.",
    "EMERGENCY PROTOCOL 603: If a vehicle breaks down in an active traffic lane, the driver must deploy reflective warning triangles at 10m, 50m, and 100m behind the vehicle. The hazard lights must remain active.",

    # Customer Relations & Service Level Agreements (SLAs)
    "SLA AGREEMENT 701: Standard delivery windows allow for a 2-hour grace period. If a driver anticipates being more than 2 hours late, Dispatch must be notified immediately to communicate the delay to the client.",
    "CLIENT RELATIONS 702: Drivers represent TransitOps. Professional attire (company-issued uniform) is required at all pickup and drop-off locations. Confrontations with clients must be avoided; escalate any disputes to the Dispatch Manager."
]

def get_embedding(text: str):
    print(f"Fetching embedding from Ollama for: '{text[:50]}...'")
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
    print(f"Preparing to embed {len(POLICIES)} comprehensive policy documents...")
    for i, policy in enumerate(POLICIES):
        vector = get_embedding(policy)
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "text": policy, 
                    "source": "TransitOps Comprehensive Handbook 2026",
                    "doc_id": f"POL-{100+i}"
                }
            )
        )
    
    print("Uploading vectorized policies to Qdrant...")
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )
    
    print("✅ Qdrant seeded successfully with comprehensive documentation! The bot is now a domain expert.")

if __name__ == "__main__":
    seed()
