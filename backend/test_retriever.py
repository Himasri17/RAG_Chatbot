from services.vectorstore.retriever import (
    retrieve
)

results = retrieve(
    "What is this video about?"
)

for r in results:

    print("\n")
    print(r.score)
    print(r.payload["text"])