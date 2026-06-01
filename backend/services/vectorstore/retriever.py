from services.embeddings.embedder import (
    generate_embeddings
)

from services.vectorstore.qdrant_client import (
    search_chunks
)

def retrieve(query, limit=5):

    query_vector = generate_embeddings(
        [query]
    )[0]

    results = search_chunks(
        query_vector,
        limit=3
    )

    return results