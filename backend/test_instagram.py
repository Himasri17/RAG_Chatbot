# test_instagram.py

from services.instagram.metadata import extract_metadata
from services.instagram.transcript import extract_transcript

url = "https://www.instagram.com/reel/DYbrZfOMqoV/"

print("METADATA:")
print(extract_metadata(url))

print("\nTRANSCRIPT:")
print(extract_transcript(url))