import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  demoComposition,
  VIDEO_DURATION,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "@pocketvideo/demo/composition";
import { RawVideoEncoder, resolveFfmpegPath } from "@pocketvideo/exporter/ffmpeg";
import { SkiaDemoRenderer } from "./skia-demo-renderer.ts";

interface CliOptions {
  readonly mode: "image" | "video";
  readonly output: string;
  readonly frame: number;
  readonly from: number;
  readonly frames: number;
  readonly ffmpegPath?: string;
}

const options = parseArguments(process.argv.slice(2));

if (options.mode === "image") {
  await renderImage(options);
} else {
  await renderVideo(options);
}

async function renderImage(options: CliOptions): Promise<void> {
  const renderer = new SkiaDemoRenderer();
  await renderer.render(options.frame);
  const output = resolve(options.output);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, await renderer.png());
  console.log(`Rendered frame ${options.frame} to ${output}`);
}

async function renderVideo(options: CliOptions): Promise<void> {
  const output = resolve(options.output);
  await mkdir(dirname(output), { recursive: true });

  const ffmpegPath = await resolveFfmpegPath({ path: options.ffmpegPath });
  const encoder = await RawVideoEncoder.create({
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    fps: VIDEO_FPS,
    output,
    ffmpegPath,
  });
  const renderer = new SkiaDemoRenderer();

  for (let offset = 0; offset < options.frames; offset += 1) {
    const frame = options.from + offset;
    await renderer.render(frame);
    await encoder.writeFrame(await renderer.rgba());

    if ((offset + 1) % VIDEO_FPS === 0 || offset + 1 === options.frames) {
      console.log(`Rendered ${offset + 1}/${options.frames} frames`);
    }
  }

  await encoder.close();
  console.log(`Encoded ${options.frames} frames with ${ffmpegPath} to ${output}`);
}

function parseArguments(arguments_: readonly string[]): CliOptions {
  const mode = arguments_[0] === "video" ? "video" : "image";
  const values = new Map<string, string>();

  for (let index = 1; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (!argument?.startsWith("--")) continue;
    const value = arguments_[index + 1];
    if (!value || value.startsWith("--")) {
      throw new TypeError(`Missing value for ${argument}`);
    }
    values.set(argument, value);
    index += 1;
  }

  const frame = integerOption(values, "--frame", 120);
  const from = integerOption(values, "--from", 0);
  const maximumFrames = VIDEO_DURATION - from;
  const frames = integerOption(values, "--frames", maximumFrames);

  if (frame < 0 || frame >= demoComposition.config.durationInFrames) {
    throw new RangeError(`--frame must be between 0 and ${VIDEO_DURATION - 1}`);
  }
  if (from < 0 || from >= VIDEO_DURATION) {
    throw new RangeError(`--from must be between 0 and ${VIDEO_DURATION - 1}`);
  }
  if (frames <= 0 || frames > maximumFrames) {
    throw new RangeError(`--frames must be between 1 and ${maximumFrames}`);
  }

  return {
    mode,
    frame,
    from,
    frames,
    ffmpegPath: values.get("--ffmpeg"),
    output:
      values.get("--output") ??
      (mode === "image"
        ? `artifacts/pocketvideo-skia-frame-${frame}.png`
        : "artifacts/pocketvideo-skia.mp4"),
  };
}

function integerOption(values: ReadonlyMap<string, string>, key: string, fallback: number): number {
  const raw = values.get(key);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value)) throw new TypeError(`${key} must be an integer`);
  return value;
}
