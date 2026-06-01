import os
import re
import requests

from datetime import datetime
from dotenv import load_dotenv


load_dotenv()

API_KEY = os.getenv("YOUTUBE_API_KEY")
BASE = "https://www.googleapis.com/youtube/v3"


def extract_video_id(url: str) -> str:

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


def parse_duration(duration: str):

    match = re.match(
        r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?",
        duration
    )

    if not match:

        return duration

    h = int(match.group(1) or 0)
    m = int(match.group(2) or 0)
    s = int(match.group(3) or 0)

    if h:
        return f"{h}h {m}m {s}s"

    if m:
        return f"{m}m {s}s"

    return f"{s}s"


def format_count(n: int):

    if n >= 1_000_000:
        return f"{n/1_000_000:.1f}M"

    if n >= 1_000:
        return f"{n/1_000:.1f}K"

    return str(n)


def extract_metadata(video_url: str):

    video_id = extract_video_id(video_url)

    response = requests.get(

        f"{BASE}/videos",

        params={

            "id": video_id,
            "part": "snippet,statistics,contentDetails",
            "key": API_KEY

        }

    )

    data = response.json()
    print(data) 
    if not data["items"]:

        raise Exception("Video not found")

    item = data["items"][0]

    snippet = item["snippet"]

    stats = item["statistics"]

    details = item["contentDetails"]

    views = int(stats.get("viewCount", 0))

    likes = int(stats.get("likeCount", 0))

    comments = int(stats.get("commentCount", 0))

    return {

        "video_id": video_id,

        "title": snippet.get("title"),

        "creator": snippet.get("channelTitle"),

        "views": views,

        "views_fmt": format_count(views),

        "likes": likes,

        "likes_fmt": format_count(likes),

        "comments": comments,

        "duration": parse_duration(
            details.get("duration", "")
        ),

        "upload_date": snippet.get(
            "publishedAt"
        )

    }