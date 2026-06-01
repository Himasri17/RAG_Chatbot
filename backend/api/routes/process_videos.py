from fastapi import APIRouter, HTTPException
import traceback

from models.video_request import VideoRequest

from services.youtube.metadata import (
    extract_metadata as yt_metadata
)

from services.youtube.transcript import (
    extract_transcript as yt_transcript
)

from services.instagram.metadata import (
    extract_metadata as ig_metadata
)

from services.instagram.transcript import (
    extract_transcript as ig_transcript
)

from preprocessing.cleaner import clean_text
from preprocessing.chunker import chunk_text

from services.embeddings.embedder import (
    generate_embeddings
)

from services.vectorstore.qdrant_client import (
    store_chunks
)

router = APIRouter()

@router.post("/process-video")
def process_video(req: VideoRequest):

    try:

        print("\n" + "=" * 50)
        print("PROCESS VIDEO STARTED")
        print("=" * 50)

        url = req.url

        print(f"URL: {url}")

        # -----------------------------
        # PLATFORM DETECTION
        # -----------------------------

        if "youtube" in url or "youtu.be" in url:

            platform = "youtube"

            print("Platform: YouTube")

            metadata = yt_metadata(url)

            print("Metadata extracted")
            print(metadata)

            transcript_data = yt_transcript(url)

            print("Transcript extracted")

            if isinstance(transcript_data, str):

                transcript = transcript_data

            else:

                transcript = transcript_data.get(
                    "full_text",
                    ""
                )

        elif "instagram" in url:

            platform = "instagram"

            print("Platform: Instagram")

            metadata = ig_metadata(url)

            print("Metadata extracted")
            print(metadata)

            transcript_data = ig_transcript(url)

            print("Transcript extracted")

            print("\nINSTAGRAM TRANSCRIPT DATA:")
            print(transcript_data)
            print()

            if isinstance(transcript_data, str):

                transcript = transcript_data

            else:

                transcript = transcript_data.get(
                    "full_text",
                    ""
                )

        else:

            raise HTTPException(
                status_code=400,
                detail="Unsupported URL"
            )

        # -----------------------------
        # TRANSCRIPT VALIDATION
        # -----------------------------

        if not transcript or not transcript.strip():

            print(
                "\nNo speech transcript found."
            )

            if platform == "instagram":

                print(
                    "Using Instagram caption as transcript."
                )

                transcript = metadata.get(
                    "caption",
                    ""
                )

            if not transcript or not transcript.strip():

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Transcript and caption are both empty"
                    )
                )

        print("\nTranscript Length:")
        print(len(transcript))

        print("\nFirst 300 chars:")
        print(transcript[:300])

        # -----------------------------
        # CLEANING
        # -----------------------------

        cleaned_text = clean_text(
            transcript
        )

        print("\nText cleaned")

        print(
            f"Cleaned length: {len(cleaned_text)}"
        )

        # -----------------------------
        # CHUNKING
        # -----------------------------

        chunks = chunk_text(
            cleaned_text
        )

        print("\nChunks created")

        print(
            f"Number of chunks: {len(chunks)}"
        )

        # -----------------------------
        # CHUNK VALIDATION
        # -----------------------------

        if len(chunks) == 0:

            raise HTTPException(
                status_code=400,
                detail="No chunks created from transcript"
            )

        print(
            "\nFirst chunk preview:"
        )

        print(
            chunks[0][:200]
        )

        # -----------------------------
        # EMBEDDINGS
        # -----------------------------

        embeddings = generate_embeddings(
            chunks
        )

        print("\nEmbeddings generated")

        print(
            f"Embedding shape: {embeddings.shape}"
        )

        # -----------------------------
        # STORE IN QDRANT
        # -----------------------------

        print(
            "\nStoring in Qdrant..."
        )

        store_chunks(

            chunks=chunks,

            embeddings=embeddings,

            metadata=metadata

        )

        print(
            "Stored successfully in Qdrant"
        )

        print(
            "\nPROCESS VIDEO COMPLETED"
        )

        return {

            "platform": platform,

            "title": metadata.get(
                "title",
                "Unknown"
            ),

            "creator": metadata.get(
                "creator",
                "Unknown"
            ),

            "views": metadata.get(
                "views",
                0
            ),

            "num_chunks": len(chunks),

            "message":
            "Stored successfully in Qdrant"

        }

    except HTTPException:

        raise

    except Exception as e:

        print("\n" + "=" * 50)

        print("ERROR OCCURRED")

        print("=" * 50)

        traceback.print_exc()

        print("\nException:")
        print(str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )