import type { CanvasLike } from "@pocketvideo/canvas";
import { inject, type InjectionKey, type ShallowRef } from "vue";

export interface VideoConfig {
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly durationInFrames?: number;
}

export interface VideoFrameState<T> {
  readonly frame: number;
  readonly fps: number;
  readonly time: number;
  readonly data: T;
}

export interface SurfaceContext<T> {
  readonly canvas: ShallowRef<CanvasLike>;
  readonly frame: ShallowRef<VideoFrameState<T>>;
  readonly config: Readonly<VideoConfig>;
}

export const surfaceKey: InjectionKey<SurfaceContext<unknown>> = Symbol("pocketvideo-surface");

export function requireSurface(): SurfaceContext<unknown> {
  const surface = inject(surfaceKey);
  if (!surface) throw new Error("Canvas APIs must run inside a CanvasSurface.");
  return surface;
}
