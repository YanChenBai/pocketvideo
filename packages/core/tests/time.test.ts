import { describe, expect, test } from "vite-plus/test";
import { frameRate, frameToTime, Rational } from "../src/index.ts";

describe("Rational", () => {
  test("normalizes values", () => {
    expect(new Rational(10, -20).toString()).toBe("-1/2");
    expect(new Rational(1, 3).add(new Rational(1, 6)).toString()).toBe("1/2");
  });

  test("keeps NTSC frame times exact", () => {
    const ntsc = frameRate(30_000, 1_001);

    expect(frameToTime(30_000, ntsc).toString()).toBe("1001");
    expect(frameToTime(1, ntsc).toString()).toBe("1001/30000");
  });

  test("rejects invalid values", () => {
    expect(() => new Rational(1, 0)).toThrowError(RangeError);
    expect(() => new Rational(0.5)).toThrowError("safe integer");
    expect(() => frameRate(0)).toThrowError(RangeError);
    expect(() => frameToTime(-1, frameRate(30))).toThrowError(RangeError);
  });
});
