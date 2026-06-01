import re
import instaloader


def extract_metadata(url):

    try:

        shortcode_match = re.search(
            r'/(p|reel)/([^/]+)/',
            url
        )

        if not shortcode_match:

            return {}

        shortcode = shortcode_match.group(2)

        L = instaloader.Instaloader()

        post = instaloader.Post.from_shortcode(
            L.context,
            shortcode
        )

        views = post.video_view_count or 0

        likes = post.likes or 0

        comments = post.comments or 0

        engagement = 0

        if views:

            engagement = round(
                ((likes + comments) / views) * 100,
                2
            )

        return {

            "title": (
                post.caption[:100]
                if post.caption
                else "Instagram Reel"
            ),

            "creator":
            post.owner_username,

            "followers":
            post.owner_profile.followers,

            "views":
            views,

            "likes":
            likes,

            "comments":
            comments,

            "upload_date":
            str(post.date),

            "duration":
            post.video_duration,

            "caption":
            post.caption,

            "hashtags":
            post.caption_hashtags,

            "is_video":
            post.is_video,

            "engagement_rate":
            f"{engagement}%"

        }

    except Exception as e:

        print(
            f"Instagram metadata error: {e}"
        )

        return {}