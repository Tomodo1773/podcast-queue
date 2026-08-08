/**
 * 興味プロファイルの合成（純粋関数）
 *
 * 負例の扱いを他の方式（閾値による除外、候補ごとの減点）と比較した経緯は
 * docs/adr/0001-recommendation-negative-feedback.md に残してある
 */

/** ゼロベクトルはそのまま返す（0除算回避） */
function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (norm === 0) return vector
  return vector.map((value) => value / norm)
}

/**
 * Rocchio方式で興味プロファイルを補正する
 * profile = normalize(正例センチロイド) - gamma * normalize(負例センチロイド)
 *
 * 正規化は必須。avg()は要素ごとの平均なので、多様な正例を多数平均するとノルムが縮み、
 * 似た負例を少数平均するとノルムが大きいままになる。件数が少ないほうが長くなる逆転が
 * 起きるため、正規化せずに引くと少数の負例がプロファイルの向きを乗っ取る。
 *
 * 負例が1件のときの負例センチロイドはその動画のembeddingそのものなので、
 * 初回の「興味なし」から gamma の強さがそのままかかる。
 */
export function buildProfile(positive: number[], negative: number[] | null, gamma: number): number[] {
  const base = normalize(positive)
  if (!negative) return base

  const penalty = normalize(negative)
  return base.map((value, i) => value - gamma * penalty[i])
}
