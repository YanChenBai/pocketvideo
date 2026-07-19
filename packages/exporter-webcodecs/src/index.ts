import {
  BufferTarget,
  CanvasSource,
  canEncodeVideo,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  type Quality,
  type VideoCodec,
} from "mediabunny";

export type { VideoCodec } from "mediabunny";

export interface WebCodecsCapabilityOptions {
  readonly codec?: VideoCodec;
  readonly width: number;
  readonly height: number;
  readonly bitrate?: number | Quality;
}

export interface WebCodecsCapability {
  readonly supported: boolean;
  readonly codec: VideoCodec;
  readonly reason?: string;
}

export interface CanvasFrameContext {
  readonly frame: number;
  readonly timestamp: number;
  readonly duration: number;
  readonly progress: number;
}

export interface CanvasVideoExportOptions extends WebCodecsCapabilityOptions {
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  readonly frameCount: number;
  readonly fps: number;
  readonly keyFrameInterval?: number;
  readonly signal?: AbortSignal;
  readonly renderFrame: (context: CanvasFrameContext) => Promise<void> | void;
  readonly onProgress?: (context: CanvasFrameContext) => void;
}

export interface FrameTiming {
  readonly frame: number;
  readonly timestamp: number;
  readonly duration: number;
}

export function frameTimingAt(frame: number, fps: number): FrameTiming {
  assertNonNegativeInteger(frame, "frame");
  assertPositiveFinite(fps, "fps");

  return {
    frame,
    timestamp: frame / fps,
    duration: 1 / fps,
  };
}

export async function inspectWebCodecsSupport(
  options: WebCodecsCapabilityOptions,
): Promise<WebCodecsCapability> {
  const codec = options.codec ?? "avc";
  assertPositiveInteger(options.width, "width");
  assertPositiveInteger(options.height, "height");

  if (typeof VideoEncoder === "undefined") {
    return {
      supported: false,
      codec,
      reason: "This browser does not expose the WebCodecs VideoEncoder API.",
    };
  }

  if (typeof isSecureContext !== "undefined" && !isSecureContext) {
    return {
      supported: false,
      codec,
      reason: "WebCodecs requires HTTPS or localhost.",
    };
  }

  try {
    const supported = await canEncodeVideo(codec, {
      width: options.width,
      height: options.height,
      bitrate: options.bitrate ?? QUALITY_HIGH,
    });

    return {
      supported,
      codec,
      ...(supported ? {} : { reason: `No ${codec} encoder is available for this configuration.` }),
    };
  } catch (error) {
    return {
      supported: false,
      codec,
      reason: error instanceof Error ? error.message : "Unable to query the browser encoder.",
    };
  }
}

export async function exportCanvasVideo(options: CanvasVideoExportOptions): Promise<Blob> {
  validateExportOptions(options);
  options.signal?.throwIfAborted();

  const capability = await inspectWebCodecsSupport(options);
  if (!capability.supported) {
    throw new Error(capability.reason ?? `The ${capability.codec} encoder is unavailable.`);
  }

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat(),
    target,
  });
  const source = new CanvasSource(options.canvas, {
    codec: options.codec ?? "avc",
    bitrate: options.bitrate ?? QUALITY_HIGH,
    keyFrameInterval: options.keyFrameInterval ?? 2,
    latencyMode: "quality",
  });

  output.addVideoTrack(source, { frameRate: options.fps });
  let started = false;

  try {
    await output.start();
    started = true;

    for (let frame = 0; frame < options.frameCount; frame += 1) {
      options.signal?.throwIfAborted();
      const timing = frameTimingAt(frame, options.fps);
      const context: CanvasFrameContext = {
        ...timing,
        progress: frame / options.frameCount,
      };

      await options.renderFrame(context);
      options.signal?.throwIfAborted();
      await source.add(timing.timestamp, timing.duration);
      options.onProgress?.({ ...context, progress: (frame + 1) / options.frameCount });
    }

    await output.finalize();
    const buffer = target.buffer;
    if (!buffer) throw new Error("Mediabunny finalized without producing an MP4 buffer.");
    return new Blob([buffer], { type: "video/mp4" });
  } catch (error) {
    if (started && output.state !== "finalized") {
      await output.cancel().catch(() => undefined);
    }
    throw error;
  }
}

function validateExportOptions(options: CanvasVideoExportOptions): void {
  assertPositiveInteger(options.width, "width");
  assertPositiveInteger(options.height, "height");
  assertPositiveInteger(options.frameCount, "frameCount");
  assertPositiveFinite(options.fps, "fps");

  if (options.canvas.width !== options.width || options.canvas.height !== options.height) {
    throw new RangeError(
      `Canvas size ${options.canvas.width}×${options.canvas.height} does not match ` +
        `${options.width}×${options.height}.`,
    );
  }
}

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number`);
  }
}
