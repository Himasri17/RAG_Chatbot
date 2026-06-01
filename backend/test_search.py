from services.embeddings.embedder import (
    generate_embeddings
)

from services.vectorstore.qdrant_client import (
    search_chunks
)

query_vector = generate_embeddings(
    ["hello world"]
)[0]

results = search_chunks(
    query_vector
)

for r in results:

    print(r.payload)