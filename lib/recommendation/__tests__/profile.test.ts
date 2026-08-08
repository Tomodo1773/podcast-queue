import { describe, expect, it } from "vitest"
import { buildProfile } from "../profile"

describe("buildProfile", () => {
  it("負例がない場合は正例を正規化して返す", () => {
    expect(buildProfile([3, 4], null, 0.25)).toEqual([0.6, 0.8])
  })

  it("負例方向の成分がgamma分だけ差し引かれる", () => {
    expect(buildProfile([1, 0], [0, 1], 0.25)).toEqual([1, -0.25])
  })

  // 正規化を外すと、ノルムの大きいほうがプロファイルの向きを支配してしまう。
  // この設計の核心なのでノルムだけを変えた2ケースが一致することを確認する
  it("正例・負例のノルムの大きさに結果が左右されない", () => {
    const small = buildProfile([0.6, 0], [0, 9], 0.25)
    const large = buildProfile([60, 0], [0, 0.09], 0.25)

    expect(small[0]).toBeCloseTo(1)
    expect(small[1]).toBeCloseTo(-0.25)
    expect(large[0]).toBeCloseTo(small[0])
    expect(large[1]).toBeCloseTo(small[1])
  })

  it("gammaが0のときは負例が無視される", () => {
    expect(buildProfile([1, 0], [0, 1], 0)).toEqual([1, 0])
  })

  it("負例がゼロベクトルでもNaNを返さない", () => {
    expect(buildProfile([1, 0], [0, 0], 0.25)).toEqual([1, 0])
  })
})
