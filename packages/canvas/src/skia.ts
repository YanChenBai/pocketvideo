import { Canvas, type CanvasRenderingContext2D } from "skia-canvas";
import type { CanvasLike } from "./index.ts";

export interface SkiaCanvasOptions {
  readonly width: number;
  readonly height: number;
  /**
   * Raw frame export repeatedly copies pixels back to the CPU. The CPU backend
   * avoids that transfer and is therefore the default for video rendering.
   */
  readonly gpu?: boolean;
}

export type SkiaCanvas = Canvas & CanvasLike<CanvasRenderingContext2D>;
export type SkiaCanvasRenderingContext2D = CanvasRenderingContext2D;

/** Creates the Node implementation of the same Canvas interface used on the web. */
export function createSkiaCanvas(options: SkiaCanvasOptions): SkiaCanvas {
  assertDimension("width", options.width);
  assertDimension("height", options.height);

  const canvas = new Canvas(options.width, options.height);
  canvas.gpu = options.gpu ?? false;
  return canvas as SkiaCanvas;
}

export function canvasToPng(canvas: SkiaCanvas): Promise<Buffer> {
  return canvas.toBuffer("png");
}

export function canvasToRgba(canvas: SkiaCanvas): Promise<Buffer> {
  return canvas.toBuffer("raw", { colorType: "rgba" });
}

function assertDimension(name: "width" | "height", value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}
