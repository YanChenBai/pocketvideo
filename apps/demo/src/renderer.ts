import type { RenderedFrame } from "@pocketvideo/core";
import { VIDEO_HEIGHT, VIDEO_WIDTH, type DemoLayer } from "./composition.ts";

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function renderBackground(context: CanvasRenderingContext2D): void {
  const background = context.createLinearGradient(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  background.addColorStop(0, "rgba(8, 7, 15, 0.76)");
  background.addColorStop(0.5, "rgba(13, 11, 24, 0.38)");
  background.addColorStop(1, "rgba(8, 10, 18, 0.68)");
  context.fillStyle = background;
  context.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

  context.save();
  context.globalAlpha = 0.12;
  context.strokeStyle = "#a78bfa";
  context.lineWidth = 1;

  for (let x = 0; x <= VIDEO_WIDTH; x += 64) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, VIDEO_HEIGHT);
    context.stroke();
  }

  for (let y = 0; y <= VIDEO_HEIGHT; y += 64) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(VIDEO_WIDTH, y);
    context.stroke();
  }

  context.restore();
}

function renderOrb(context: CanvasRenderingContext2D, layer: Extract<DemoLayer, { type: "orb" }>) {
  const gradient = context.createRadialGradient(
    layer.x,
    layer.y,
    0,
    layer.x,
    layer.y,
    layer.radius,
  );
  gradient.addColorStop(0, "rgba(139, 92, 246, 0.95)");
  gradient.addColorStop(0.35, "rgba(91, 33, 182, 0.55)");
  gradient.addColorStop(1, "rgba(30, 27, 75, 0)");

  context.save();
  context.globalAlpha = layer.opacity;
  context.fillStyle = gradient;
  context.fillRect(
    layer.x - layer.radius,
    layer.y - layer.radius,
    layer.radius * 2,
    layer.radius * 2,
  );
  context.restore();
}

function renderIntro(
  context: CanvasRenderingContext2D,
  layer: Extract<DemoLayer, { type: "intro" }>,
): void {
  context.save();
  context.globalAlpha = layer.opacity;
  context.translate(0, layer.translateY);

  context.font = "600 15px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillStyle = "#a78bfa";
  context.fillText(layer.eyebrow, 72, 94);

  context.font = "700 62px Inter, ui-sans-serif, system-ui, sans-serif";
  context.fillStyle = "#f8fafc";
  context.fillText(layer.title, 68, 177);

  context.font = "400 21px Inter, ui-sans-serif, system-ui, sans-serif";
  context.fillStyle = "#a7a2b8";
  context.fillText(layer.description, 72, 222);
  context.restore();
}

function renderCard(
  context: CanvasRenderingContext2D,
  layer: Extract<DemoLayer, { type: "card" }>,
) {
  const width = 352;
  const height = 210;
  const gap = 30;
  const x = 72 + layer.index * (width + gap);
  const y = 306 + layer.translateY;

  context.save();
  context.globalAlpha = layer.opacity;

  roundedRect(context, x, y, width, height, 24);
  context.fillStyle = "rgba(20, 17, 33, 0.82)";
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.10)";
  context.lineWidth = 1;
  context.stroke();

  roundedRect(context, x + 24, y + 24, 44, 8, 4);
  context.fillStyle = layer.accent;
  context.fill();

  context.font = "600 13px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillStyle = "#8f899f";
  context.fillText(layer.label, x + 24, y + 72);

  context.font = "650 30px Inter, ui-sans-serif, system-ui, sans-serif";
  context.fillStyle = "#f4f1fa";
  context.fillText(layer.value, x + 24, y + 122);

  context.font = "400 16px Inter, ui-sans-serif, system-ui, sans-serif";
  context.fillStyle = "#9993a8";
  context.fillText(layer.detail, x + 24, y + 164);
  context.restore();
}

function renderTimeline(
  context: CanvasRenderingContext2D,
  layer: Extract<DemoLayer, { type: "timeline" }>,
): void {
  const x = 72;
  const y = 630;
  const width = VIDEO_WIDTH - 144;

  context.fillStyle = "rgba(255, 255, 255, 0.12)";
  roundedRect(context, x, y, width, 4, 2);
  context.fill();

  const progressWidth = Math.max(4, width * layer.progress);
  const gradient = context.createLinearGradient(x, 0, x + width, 0);
  gradient.addColorStop(0, "#8b5cf6");
  gradient.addColorStop(1, "#22d3ee");
  context.fillStyle = gradient;
  roundedRect(context, x, y, progressWidth, 4, 2);
  context.fill();

  context.beginPath();
  context.arc(x + width * layer.progress, y + 2, 7, 0, Math.PI * 2);
  context.fillStyle = "#f8fafc";
  context.fill();

  context.font = "500 13px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillStyle = "#7d778d";
  context.fillText(`FRAME ${String(layer.frame).padStart(3, "0")}`, x, y + 36);
  context.textAlign = "right";
  context.fillText("10.0 SEC / 30 FPS", x + width, y + 36);
  context.textAlign = "left";
}

function assertNever(value: never): never {
  throw new TypeError(`Unknown demo layer: ${JSON.stringify(value)}`);
}

export function renderFrameToCanvas(
  context: CanvasRenderingContext2D,
  frame: RenderedFrame<DemoLayer>,
): void {
  context.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

  for (const track of frame.tracks) {
    const layer = track.output;

    if (layer.type === "ogl-aurora") continue;

    switch (layer.type) {
      case "background":
        renderBackground(context);
        break;
      case "orb":
        renderOrb(context, layer);
        break;
      case "intro":
        renderIntro(context, layer);
        break;
      case "card":
        renderCard(context, layer);
        break;
      case "timeline":
        renderTimeline(context, layer);
        break;
      default:
        assertNever(layer);
    }
  }
}
