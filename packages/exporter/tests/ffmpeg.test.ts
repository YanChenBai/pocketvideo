import { describe, expect, it } from "vite-plus/test";
import { createRawVideoArguments } from "../src/ffmpeg.ts";

describe("createRawVideoArguments", () => {
  it("describes an RGBA pipe and browser-compatible H.264 output", () => {
    const arguments_ = createRawVideoArguments({
      width: 1280,
      height: 720,
      fps: 30,
      output: "demo.mp4",
    });

    expect(arguments_).toContain("rawvideo");
    expect(arguments_).toContain("rgba");
    expect(arguments_).toContain("1280x720");
    expect(arguments_).toContain("libx264");
    expect(arguments_).toContain("yuv420p");
    expect(arguments_.at(-1)).toBe("demo.mp4");
  });
});
