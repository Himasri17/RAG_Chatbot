export interface VideoData {
  platform: string;

  title: string;

  creator?: string;

  views?: number;

  likes?: number;

  comments?: number;

  upload_date?: string;

  num_chunks: number;

  message: string;
}