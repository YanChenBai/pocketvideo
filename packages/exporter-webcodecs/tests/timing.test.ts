import { describe, expect, it } from "vite-plus/test";
import { frameTimingAt, inspectWebCodecsSupport } from "../src/index.ts";

describe("frameTimingAt", () => {
  it("creates deterministic timestamps for a constant frame rate", () => {
    expect(frameTimingAt(75, 30)).toEqual({
      frame: 75,
      timestamp: 2.5,
      duration: 1 / 30,
    });
  });

  it("rejects invalid frames and frame rates", () => {
    expect(() => frameTimingAt(-1, 30)).toThrow(RangeError);
    expect(() => frameTimingAt(0, 0)).toThrow(RangeError);
  });
});

describe("inspectWebCodecsSupport", () => {
  it("reports an unavailable encoder outside a WebCodecs browser", async () => {
    const capability = await inspectWebCodecsSupport({ width: 960, height: 540 });
    expect(capability.codec).toBe("avc");
    expect(capability.supported).toBe(false);
    expect(capability.reason).toContain("VideoEncoder");
  });
});
