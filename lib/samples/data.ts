/**
 * サンプルPodcastデータ
 * デモや説明画像用に使用するダミーデータ
 */

export interface SamplePodcast {
  id: string;
  title: string;
  description: string;
  thumbnailPath: string;
}

export const samplePodcasts: SamplePodcast[] = [
  {
    id: "podcast-1",
    title: "テクノロジーの未来 - AI革命の最前線",
    description:
      "人工知能がもたらす変革について、業界の専門家が深掘りする番組。最新のAI技術から社会への影響まで、幅広いトピックを分かりやすく解説します。",
    thumbnailPath: "/samples/podcast-1.png",
  },
  {
    id: "podcast-2",
    title: "スタートアップ成功の秘訣",
    description:
      "起業家へのインタビューを通じて、成功への道のりを探る番組。失敗談から学ぶ教訓、資金調達のコツ、チームビルディングなど、実践的なアドバイスをお届けします。",
    thumbnailPath: "/samples/podcast-2.png",
  },
  {
    id: "podcast-3",
    title: "日々のマインドフルネス習慣",
    description:
      "忙しい現代人のための瞑想とマインドフルネスのガイド。10分間の簡単なエクササイズから、ストレス管理のテクニックまで、心の健康を保つためのヒントを紹介。",
    thumbnailPath: "/samples/podcast-3.png",
  },
];

export function getSamplePodcast(id: string): SamplePodcast | undefined {
  return samplePodcasts.find((podcast) => podcast.id === id);
}

export function getAllSampleIds(): string[] {
  return samplePodcasts.map((podcast) => podcast.id);
}
