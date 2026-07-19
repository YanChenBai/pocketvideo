import { spawn, spawnSync, type ChildProcessByStdio } from "node:child_process";
import { once } from "node:events";
import type { Readable, Writable } from "node:stream";

export interface FfmpegBinaryProvider {
  readonly name: string;
  resolve(): string | undefined | Promise<string | undefined>;
}

export interface ResolveFfmpegOptions {
  readonly path?: string;
  readonly providers?: readonly FfmpegBinaryProvider[];
}

export interface RawVideoEncoderOptions {
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly output: string;
  readonly ffmpegPath?: string;
  readonly ffmpegProviders?: readonly FfmpegBinaryProvider[];
  readonly codec?: string;
  readonly pixelFormat?: string;
  readonly preset?: string;
  readonly crf?: number;
  readonly overwrite?: boolean;
}

export async function resolveFfmpegPath(options: ResolveFfmpegOptions = {}): Promise<string> {
  const candidates: string[] = [];

  if (options.path) candidates.push(options.path);
  if (process.env.POCKETVIDEO_FFMPEG_PATH) {
    candidates.push(process.env.POCKETVIDEO_FFMPEG_PATH);
  }

  for (const provider of options.providers ?? []) {
    const candidate = await provider.resolve();
    if (candidate) candidates.push(candidate);
  }

  candidates.push("ffmpeg");

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["-version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    if (result.status === 0) return candidate;
  }

  throw new Error(
    "FFmpeg was not found. Set POCKETVIDEO_FFMPEG_PATH, pass ffmpegPath, or install ffmpeg in PATH.",
  );
}

export function createRawVideoArguments(options: RawVideoEncoderOptions): string[] {
  const overwrite = options.overwrite ?? true;

  return [
    overwrite ? "-y" : "-n",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "rawvideo",
    "-pixel_format",
    "rgba",
    "-video_size",
    `${options.width}x${options.height}`,
    "-framerate",
    String(options.fps),
    "-i",
    "pipe:0",
    "-an",
    "-c:v",
    options.codec ?? "libx264",
    "-preset",
    options.preset ?? "medium",
    "-crf",
    String(options.crf ?? 18),
    "-pix_fmt",
    options.pixelFormat ?? "yuv420p",
    "-movflags",
    "+faststart",
    options.output,
  ];
}

export class RawVideoEncoder {
  readonly frameByteLength: number;
  private readonly process: ChildProcessByStdio<Writable, null, Readable>;
  private readonly stderr: string[] = [];
  private closed = false;

  private constructor(
    process: ChildProcessByStdio<Writable, null, Readable>,
    width: number,
    height: number,
  ) {
    this.process = process;
    this.frameByteLength = width * height * 4;
    process.stderr.setEncoding("utf8");
    process.stderr.on("data", (chunk: string) => this.stderr.push(chunk));
  }

  static async create(options: RawVideoEncoderOptions): Promise<RawVideoEncoder> {
    assertPositiveInteger(options.width, "width");
    assertPositiveInteger(options.height, "height");

    if (!Number.isFinite(options.fps) || options.fps <= 0) {
      throw new RangeError("fps must be a positive finite number");
    }

    const ffmpegPath = await resolveFfmpegPath({
      path: options.ffmpegPath,
      providers: options.ffmpegProviders,
    });
    const child = spawn(ffmpegPath, createRawVideoArguments(options), {
      stdio: ["pipe", "ignore", "pipe"],
    });

    await Promise.race([
      once(child, "spawn"),
      once(child, "error").then(([error]) => Promise.reject(error)),
    ]);

    return new RawVideoEncoder(child, options.width, options.height);
  }

  async writeFrame(frame: Uint8Array): Promise<void> {
    if (this.closed) throw new Error("Cannot write to a closed FFmpeg encoder");
    if (frame.byteLength !== this.frameByteLength) {
      throw new RangeError(
        `Expected ${this.frameByteLength} RGBA bytes, received ${frame.byteLength}`,
      );
    }

    if (!this.process.stdin.write(frame)) {
      await once(this.process.stdin, "drain");
    }
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.process.stdin.end();

    const [code, signal] = (await once(this.process, "close")) as [number | null, NodeJS.Signals];
    if (code !== 0) {
      const reason = signal ? `signal ${signal}` : `exit code ${String(code)}`;
      throw new Error(`FFmpeg failed with ${reason}: ${this.stderr.join("").trim()}`);
    }
  }
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}
