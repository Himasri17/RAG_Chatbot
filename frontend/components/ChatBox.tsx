"use client";

import { useState } from "react";

export default function ChatBox({
  onAsk,
}: {
  onAsk: (q: string) => void;
}) {

  const [query, setQuery] =
    useState("");

  return (

    <div className="mt-4">

      <input
        className="border p-2 w-full"
        placeholder="Ask a question..."
        value={query}
        onChange={(e) =>
          setQuery(e.target.value)
        }
      />

      <button
        onClick={() => onAsk(query)}
        className="mt-2 bg-green-600 text-white px-4 py-2"
      >
        Ask
      </button>

    </div>

  );
}