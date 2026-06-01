from services.embeddings.embedder import (
    generate_embeddings
)

from services.vectorstore.qdrant_client import (
    store_chunks
)

chunks = [

    "hello world",

    "this is another chunk"

]

vectors = generate_embeddings(
    chunks
)

metadata = {

    "title": "Test Video",

    "creator": "Sashank"

}

store_chunks(

    chunks,

    vectors,

    metadata

)

print("Stored Successfully")