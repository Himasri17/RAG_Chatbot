const BASE_URL = "http://127.0.0.1:8000";

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function processVideo(url: string) {
  const response = await fetch(`${BASE_URL}/process-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return response.json();
}

export async function chat(query: string, history: HistoryMessage[] = []) {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, history }),
  });
  return response.json();
}