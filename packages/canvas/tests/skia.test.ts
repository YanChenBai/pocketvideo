import { Buffer } from "node:buffer";
import { describe, expect, it } from "vite-plus/test";
import { canvasToPng, canvasToRgba, createSkiaCanvas } from "../src/skia.ts";

describe("Skia Canvas adapter", () => {
  it("exports a PNG image", async () => {
    const canvas = createSkiaCanvas({ width: 8, height: 6 });
    const context = canvas.getContext("2d");
    context.fillStyle = "#8b5cf6";
    context.fillRect(0, 0, 8, 6);

    const png = await canvasToPng(canvas);

    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  });

  it("exports tightly packed RGBA pixels", async () => {
    const canvas = createSkiaCanvas({ width: 2, height: 2 });
    const context = canvas.getContext("2d");
    context.fillStyle = "#ff0000";
    context.fillRect(0, 0, 2, 2);

    const rgba = await canvasToRgba(canvas);

    expect(rgba).toHaveLength(2 * 2 * 4);
    expect([...rgba.subarray(0, 4)]).toEqual([255, 0, 0, 255]);
  });
});
