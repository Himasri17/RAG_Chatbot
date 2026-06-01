import { VideoData } from "@/types/video";

interface VideoInfoProps {
  data: VideoData | null;
}

export default function VideoInfo({
  data,
}: VideoInfoProps) {

  if (!data) return null;

  return (
    <div className="border rounded-lg p-4 mt-4">

      <h2 className="font-bold text-xl">
        {data.title}
      </h2>

      <p>
        Platform: {data.platform}
      </p>

      <p>
        Chunks Created: {data.num_chunks}
      </p>

      <p>
        Status: {data.message}
      </p>

    </div>
  );
}