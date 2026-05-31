from fastapi import APIRouter, HTTPException
from models.video_request import VideoRequest


from services.youtube.metadata import extract_metadata as yt_metadata
from services.youtube.transcript import extract_transcript as yt_transcript

from services.instagram.metadata import extract_metadata as ig_metadata
from services.instagram.transcript import extract_transcript as ig_transcript


router = APIRouter()

@router.post("/process-video")
def process_video(req: VideoRequest):

    try:

        url = req.url

        if "youtube" in url or "youtu.be" in url:

            platform = "youtube"

            metadata = yt_metadata(url)

            transcript_data = yt_transcript(url)

            transcript = transcript_data.get(
                "full_text",
                ""
            )

        elif "instagram" in url:

            platform = "instagram"

            metadata = ig_metadata(url)

            transcript_data = ig_transcript(url)

            transcript = transcript_data.get(
                "full_text",
                ""
            )

        else:

            raise HTTPException(
                status_code=400,
                detail="Unsupported URL"
            )

        return {

            "platform": platform,

            "metadata": metadata,

            "transcript": transcript

        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )