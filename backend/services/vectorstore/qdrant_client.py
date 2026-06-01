import os
import uuid

from dotenv import load_dotenv

from qdrant_client import QdrantClient

from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct
)

# -----------------------------
# Load Environment Variables
# -----------------------------

load_dotenv("../.env")

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

# -----------------------------
# Qdrant Client
# -----------------------------

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)

COLLECTION_NAME = "social_media"

# -----------------------------
# Create Collection
# -----------------------------

def create_collection():

    collections = client.get_collections()

    existing_collections = [

        collection.name

        for collection in collections.collections

    ]

    if COLLECTION_NAME not in existing_collections:

        client.create_collection(

            collection_name=COLLECTION_NAME,

            vectors_config=VectorParams(

                size=384,  # all-MiniLM-L6-v2 dimension

                distance=Distance.COSINE

            )

        )

        print(
            f"Created collection: {COLLECTION_NAME}"
        )

    else:

        print(
            f"Collection already exists: {COLLECTION_NAME}"
        )

# -----------------------------
# Store Chunks
# -----------------------------

def store_chunks(
    chunks,
    embeddings,
    metadata
):

    create_collection()

    points = []

    for chunk, embedding in zip(
        chunks,
        embeddings
    ):

        point = PointStruct(

            id=str(uuid.uuid4()),

            vector=embedding.tolist(),

            payload={

                "text": chunk,

                "title": metadata.get(
                    "title"
                ),

                "creator": metadata.get(
                    "creator"
                ),

                "views": metadata.get(
                    "views"
                ),

                "upload_date": metadata.get(
                    "upload_date"
                )

            }

        )

        points.append(point)

    client.upsert(

        collection_name=COLLECTION_NAME,

        points=points

    )

    print(
        f"Stored {len(points)} chunks in Qdrant"
    )

# -----------------------------
# Search Collection
# -----------------------------

def search_chunks(
    query_embedding,
    limit=5
):

    results = client.search(

        collection_name=COLLECTION_NAME,

        query_vector=query_embedding.tolist(),

        limit=limit

    )

    return results