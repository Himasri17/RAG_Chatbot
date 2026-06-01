from services.embeddings.embedder import (
    generate_embeddings
)

vectors = generate_embeddings([

    "hello world",

    "this is a test"

])

print(vectors.shape)