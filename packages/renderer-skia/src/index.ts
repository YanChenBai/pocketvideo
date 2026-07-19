import { Canvas, type CanvasRenderingContext2D } from "skia-canvas";

export interface SkiaRendererOptions {
  readonly width: number;
  readonly height: number;
  /**
   * Raw frame export repeatedly copies pixels back to the CPU. The CPU backend
   * avoids that transfer and is therefore the default for video rendering.
   */
  readonly gpu?: boolean;
}

export type SkiaDraw = (context: CanvasRenderingContext2D) => void | Promise<void>;

export class SkiaRenderer {
  readonly canvas: Canvas;
  readonly context: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;

  constructor(options: SkiaRendererOptions) {
    if (!Number.isInteger(options.width) || options.width <= 0) {
      throw new RangeError("width must be a positive integer");
    }

    if (!Number.isInteger(options.height) || options.height <= 0) {
      throw new RangeError("height must be a positive integer");
    }

    this.width = options.width;
    this.height = options.height;
    this.canvas = new Canvas(options.width, options.height);
    this.canvas.gpu = options.gpu ?? false;
    this.context = this.canvas.getContext("2d");
  }

  clear(): void {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  async draw(draw: SkiaDraw): Promise<void> {
    await draw(this.context);
  }

  async png(): Promise<Buffer> {
    return this.canvas.toBuffer("png");
  }

  async rgba(): Promise<Buffer> {
    return this.canvas.toBuffer("raw", { colorType: "rgba" });
  }
}
