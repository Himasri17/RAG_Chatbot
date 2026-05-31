import re
import os
import subprocess
import tempfile

from youtube_transcript_api import YouTubeTranscriptApi


def extract_video_id(url):

    patterns = [

        r"(?:v=)([^&\n?#]+)",
        r"(?:youtu\.be/)([^&\n?#]+)",
        r"(?:shorts/)([^&\n?#]+)",
        r"(?:embed/)([^&\n?#]+)",

    ]

    for pattern in patterns:

        match = re.search(pattern, url)

        if match:

            return match.group(1)

    raise ValueError("Invalid YouTube URL")


def transcript_api_method(video_id):

    api = YouTubeTranscriptApi()

    transcript = api.fetch(video_id)

    segments = [

        {

            "start": round(seg.start, 2),

            "duration": round(seg.duration, 2),

            "text": seg.text

        }

        for seg in transcript.snippets

    ]

    return {

        "method": "youtube-transcript-api",

        "language": transcript.language,

        "generated": transcript.is_generated,

        "segments": segments,

        "full_text": " ".join(
            s["text"] for s in segments
        )

    }


def ytdlp_method(video_id):

    with tempfile.TemporaryDirectory() as tmp:

        subprocess.run(

            [

                "yt-dlp",

                "--write-auto-subs",

                "--skip-download",

                "--sub-format", "vtt",

                "--sub-langs", "en",

                "-o", f"{tmp}/%(id)s",

                f"https://youtube.com/watch?v={video_id}"

            ],

            capture_output=True,

            timeout=60

        )

        vtt_files = [

            f for f in os.listdir(tmp)

            if f.endswith(".vtt")

        ]

        if not vtt_files:

            raise Exception("No subtitle file")

        with open(

            os.path.join(tmp, vtt_files[0]),

            "r",

            encoding="utf-8"

        ) as file:

            raw = file.read()

        text = re.sub(
            r"<[^>]+>",
            "",
            raw
        )

        text = re.sub(
            r"\d{2}:\d{2}:\d{2}\.\d{3} --> .*",
            "",
            text
        )

        return {

            "method": "yt-dlp",

            "language": "en",

            "generated": True,

            "segments": [],

            "full_text": text

        }


def extract_transcript(url):

    video_id = extract_video_id(url)

    try:

        transcript = transcript_api_method(
            video_id
        )

    except Exception:

        transcript = ytdlp_method(
            video_id
        )

    return transcript