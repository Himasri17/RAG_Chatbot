"use client";

import { useState } from "react";

export default function VideoForm({
  onSubmit,
}: {
  onSubmit: (url: string) => void;
}) {
  const [url, setUrl] = useState("");

  return (
    <div className="flex gap-2">

      <input
        className="border p-2 flex-1"
        placeholder="Paste YouTube or Instagram URL"
        value={url}
        onChange={(e) =>
          setUrl(e.target.value)
        }
      />

      <button
        onClick={() => onSubmit(url)}
        className="bg-blue-600 text-white px-4 py-2"
      >
        Process
      </button>

    </div>
  );
}