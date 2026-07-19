import {
  AURORA_COLOR_STOPS,
  demoComposition,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  type AuroraLayer,
} from "@pocketvideo/demo/composition";
import { renderFrameToCanvas } from "@pocketvideo/demo/renderer";
import type { RenderedFrame } from "@pocketvideo/core";
import type { DemoLayer } from "@pocketvideo/demo/composition";
import { SkiaRenderer } from "../../../packages/renderer-skia/src/index.ts";

type SkiaContext = SkiaRenderer["context"];

export class SkiaDemoRenderer {
  readonly renderer = new SkiaRenderer({
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    gpu: false,
  });

  async render(frameNumber: number): Promise<RenderedFrame<DemoLayer>> {
    const frame = await demoComposition.renderFrame(frameNumber);
    const context = this.renderer.context;

    this.renderer.clear();

    const aurora = frame.tracks.find(
      (track): track is typeof track & { output: AuroraLayer } =>
        track.output.type === "ogl-aurora",
    )?.output;

    renderSkiaAurora(context, aurora);
    renderFrameToCanvas(context as unknown as CanvasRenderingContext2D, frame, { clear: false });

    return frame;
  }

  png(): Promise<Buffer> {
    return this.renderer.png();
  }

  rgba(): Promise<Buffer> {
    return this.renderer.rgba();
  }
}

function renderSkiaAurora(context: SkiaContext, layer?: AuroraLayer): void {
  const time = layer?.time ?? 0;
  const amplitude = layer?.amplitude ?? 0.82;
  const colors = layer?.colorStops ?? AURORA_COLOR_STOPS;

  const base = context.createLinearGradient(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  base.addColorStop(0, "#070612");
  base.addColorStop(0.48, "#100b22");
  base.addColorStop(1, "#07111b");
  context.fillStyle = base;
  context.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

  const glow = context.createRadialGradient(930, 100, 0, 930, 100, 520);
  glow.addColorStop(0, "rgba(139, 92, 246, 0.25)");
  glow.addColorStop(0.5, "rgba(34, 211, 238, 0.08)");
  glow.addColorStop(1, "rgba(7, 6, 18, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

  context.save();
  context.globalCompositeOperation = "screen";

  for (let band = 0; band < 5; band += 1) {
    const gradient = context.createLinearGradient(0, 0, VIDEO_WIDTH, 0);
    gradient.addColorStop(0, withAlpha(colors[0], 0));
    gradient.addColorStop(0.2, withAlpha(colors[0], 0.72));
    gradient.addColorStop(0.54, withAlpha(colors[1], 0.78));
    gradient.addColorStop(0.84, withAlpha(colors[2], 0.65));
    gradient.addColorStop(1, withAlpha(colors[2], 0));

    const phase = time * (0.42 + band * 0.035) + band * 1.31;
    const baseline = 280 + band * 42;
    const frequency = 0.0052 + band * 0.00045;
    const height = 92 * amplitude - band * 7;

    context.beginPath();
    context.moveTo(0, VIDEO_HEIGHT);

    for (let x = 0; x <= VIDEO_WIDTH; x += 24) {
      const primary = Math.sin(x * frequency + phase) * height;
      const detail = Math.sin(x * frequency * 2.15 - phase * 0.63) * height * 0.32;
      const y = baseline + primary + detail;
      context.lineTo(x, y);
    }

    context.lineTo(VIDEO_WIDTH, VIDEO_HEIGHT);
    context.closePath();
    context.globalAlpha = 0.22 - band * 0.027;
    context.fillStyle = gradient;
    context.fill();
  }

  context.restore();
}

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
