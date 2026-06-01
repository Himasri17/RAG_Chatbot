import os
import subprocess
import tempfile

from faster_whisper import WhisperModel


def extract_transcript(url):

    try:

        with tempfile.TemporaryDirectory() as tmp:

            audio_path = os.path.join(
                tmp,
                "audio.mp3"
            )

            cmd = [

                "yt-dlp",

                "--no-check-certificates",

                "-x",

                "--audio-format",
                "mp3",

                "--audio-quality",
                "5",

                "-o",
                audio_path,

                url

            ]

            result = subprocess.run(

                cmd,

                capture_output=True,

                text=True,

                timeout=120

            )

            if not os.path.exists(audio_path):

                audio_files = [

                    f

                    for f in os.listdir(tmp)

                    if f.startswith("audio")
                    and not f.endswith(".part")

                ]

                if not audio_files:

                    return {

                        "error":
                        "Audio download failed"

                    }

                audio_path = os.path.join(

                    tmp,

                    audio_files[0]

                )

            model = WhisperModel(

                "tiny",

                device="cpu",

                compute_type="int8"

            )

            segments_gen, info = model.transcribe(

                audio_path,

                beam_size=1,

                vad_filter=True

            )

            segments = []

            full_text = []

            for seg in segments_gen:

                text = seg.text.strip()

                if text:

                    segments.append({

                        "start": round(
                            seg.start,
                            2
                        ),

                        "end": round(
                            seg.end,
                            2
                        ),

                        "text": text

                    })

                    full_text.append(text)

            return {

                "language":
                info.language,

                "segments":
                segments,

                "full_text":
                " ".join(full_text)

            }

    except Exception as e:

        return {

            "error": str(e)

        }