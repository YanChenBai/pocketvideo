import { describe, expect, it } from "vite-plus/test";
import { SkiaRenderer } from "../src/index.ts";

describe("SkiaRenderer", () => {
  it("exports a PNG image", async () => {
    const renderer = new SkiaRenderer({ width: 8, height: 6 });
    renderer.context.fillStyle = "#8b5cf6";
    renderer.context.fillRect(0, 0, 8, 6);

    const png = await renderer.png();

    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  });

  it("exports tightly packed RGBA pixels", async () => {
    const renderer = new SkiaRenderer({ width: 2, height: 2 });
    renderer.context.fillStyle = "#ff0000";
    renderer.context.fillRect(0, 0, 2, 2);

    const rgba = await renderer.rgba();

    expect(rgba).toHaveLength(2 * 2 * 4);
    expect([...rgba.subarray(0, 4)]).toEqual([255, 0, 0, 255]);
  });
});
