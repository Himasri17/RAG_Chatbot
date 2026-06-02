# from openai import OpenAI

# client = OpenAI()

# def generate_answer(prompt):

#     response = client.chat.completions.create(

#         model="gpt-4o-mini",

#         messages=[

#             {
#                 "role": "user",
#                 "content": prompt
#             }

#         ]

#     )

#     return response.choices[0].message.content

import requests
import time
from datetime import datetime


def generate_answer(prompt):

    start_time = time.time()

    print("\n" + "=" * 50)
    print("OLLAMA REQUEST STARTED")
    print("Time:", datetime.now().strftime("%H:%M:%S"))
    print("=" * 50)

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2:1b",
            "prompt": prompt,
            "stream": False
        }
    )

    response.raise_for_status()

    end_time = time.time()

    print("\n" + "=" * 50)
    print("OLLAMA RESPONSE RECEIVED")
    print("Time:", datetime.now().strftime("%H:%M:%S"))
    print(
        f"Generation Time: {end_time - start_time:.2f} seconds"
    )
    print("=" * 50)

    return response.json()["response"]