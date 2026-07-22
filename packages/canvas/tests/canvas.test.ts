import { describe, expect, it } from "vite-plus/test";
import type { CanvasFrameReader, CanvasLike } from "../src/index.ts";

describe("Canvas contracts", () => {
  it("accepts a platform canvas without prescribing its graphics API", async () => {
    const canvas: CanvasLike<string> = {
      width: 2,
      height: 1,
      getContext: (contextId) => (contextId === "custom" ? "context" : null),
    };
    const reader: CanvasFrameReader<typeof canvas> = {
      readRgba: (target) => ({
        width: target.width,
        height: target.height,
        format: "rgba8",
        origin: "top-left",
        data: new Uint8Array(target.width * target.height * 4),
      }),
    };

    expect(canvas.getContext("custom")).toBe("context");
    expect((await reader.readRgba(canvas)).data).toHaveLength(8);
  });
});
