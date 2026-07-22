/**
 * The smallest common shape shared by browser, offscreen and Node canvases.
 * Graphics APIs stay outside this package: callers decide which context to request.
 */
export interface CanvasLike<TContext = unknown> {
  width: number;
  height: number;
  getContext(contextId: string, options?: unknown): TContext | null;
}

/** Public instance exposed by PocketVideo's Vue <Canvas> platform component. */
export interface CanvasRef<TCanvas extends CanvasLike = CanvasLike> extends CanvasLike {
  readonly native: TCanvas;
}

export interface RgbaFrame {
  readonly width: number;
  readonly height: number;
  readonly format: "rgba8";
  readonly origin: "top-left" | "bottom-left";
  readonly data: Uint8Array;
}

/** Platform-only adapter used by exporters; authoring code receives the native canvas. */
export interface CanvasFrameReader<TCanvas extends CanvasLike = CanvasLike> {
  readRgba(canvas: TCanvas): RgbaFrame | Promise<RgbaFrame>;
}
