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

def generate_answer(prompt):

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "mistral:latest",
            "prompt": prompt,
            "stream": False
        }
    )

    response.raise_for_status()

    return response.json()["response"]