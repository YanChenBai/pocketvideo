import type { RenderedFrame } from "@pocketvideo/core";
import type { ExportScene } from "./composition.ts";

const FONT =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const MONO = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

export function renderExportFrame(
  context: CanvasRenderingContext2D,
  rendered: RenderedFrame<ExportScene>,
): void {
  const scene = rendered.tracks[0]?.output;
  if (!scene) throw new Error("The WebCodecs scene track is inactive.");

  const width = context.canvas.width;
  const height = context.canvas.height;
  context.clearRect(0, 0, width, height);

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#070b16");
  background.addColorStop(0.52, "#10152a");
  background.addColorStop(1, "#080b14");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  drawGlow(
    context,
    760 + Math.cos(scene.orbit) * 68,
    105 + Math.sin(scene.orbit) * 42,
    270,
    [73, 96, 255],
  );
  drawGlow(context, 172 + Math.sin(scene.orbit * 0.7) * 44, 420, 230, [39, 211, 184]);
  drawGrid(context, width, height, scene.progress);

  roundedRect(context, 36, 34, width - 72, height - 68, 26);
  context.fillStyle = "rgba(8, 12, 26, 0.68)";
  context.fill();
  context.strokeStyle = "rgba(167, 180, 255, 0.17)";
  context.lineWidth = 1;
  context.stroke();

  drawTopBar(context, scene.frame);
  drawRibbons(context, scene);
  drawHero(context, scene);
  drawEncoderCard(context, scene);
  drawTimeline(context, scene.progress, scene.frame);
}

function drawTopBar(context: CanvasRenderingContext2D, frame: number): void {
  context.fillStyle = "#f4f6ff";
  context.font = `650 16px ${FONT}`;
  context.fillText("PocketVideo", 70, 83);

  context.fillStyle = "#78829d";
  context.font = `500 11px ${MONO}`;
  context.fillText("NATIVE BROWSER EXPORT", 194, 82);

  context.beginPath();
  context.arc(812, 76, 4, 0, Math.PI * 2);
  context.fillStyle = "#35e1bc";
  context.fill();
  context.shadowColor = "#35e1bc";
  context.shadowBlur = 12;
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = "#a6afc8";
  context.font = `500 11px ${MONO}`;
  context.fillText(`FRAME ${String(frame).padStart(3, "0")}`, 826, 80);
}

function drawHero(context: CanvasRenderingContext2D, scene: ExportScene): void {
  context.fillStyle = "rgba(98, 255, 221, 0.11)";
  roundedRect(context, 70, 132, 174, 30, 15);
  context.fill();
  context.fillStyle = "#76efd4";
  context.font = `600 10px ${MONO}`;
  context.fillText("WEB CODECS / AVC", 89, 151);

  const reveal = easeOut(Math.min(1, scene.progress * 7));
  context.save();
  context.globalAlpha = reveal;
  context.translate(0, (1 - reveal) * 18);
  context.fillStyle = "#f5f7ff";
  context.font = `700 52px ${FONT}`;
  context.fillText("Frames become", 70, 230);
  context.fillStyle = "#95a5ff";
  context.fillText("video, natively.", 70, 286);
  context.restore();

  context.fillStyle = "#8c96b0";
  context.font = `400 15px ${FONT}`;
  context.fillText("Canvas → VideoEncoder → Mediabunny → MP4", 72, 330);

  const chips = ["NO WASM", "NO UPLOAD", "FRAME-ACCURATE"];
  let x = 70;
  for (const chip of chips) {
    const chipWidth = context.measureText(chip).width + 28;
    roundedRect(context, x, 356, chipWidth, 30, 9);
    context.fillStyle = "rgba(131, 145, 190, 0.1)";
    context.fill();
    context.strokeStyle = "rgba(159, 174, 224, 0.14)";
    context.stroke();
    context.fillStyle = "#929dbb";
    context.font = `600 9px ${MONO}`;
    context.fillText(chip, x + 14, 375);
    x += chipWidth + 9;
  }
}

function drawEncoderCard(context: CanvasRenderingContext2D, scene: ExportScene): void {
  const x = 632;
  const y = 130;
  roundedRect(context, x, y, 254, 270, 20);
  context.fillStyle = "rgba(12, 18, 39, 0.82)";
  context.fill();
  context.strokeStyle = "rgba(141, 158, 219, 0.18)";
  context.stroke();

  context.fillStyle = "#818dab";
  context.font = `600 10px ${MONO}`;
  context.fillText("ENCODER PIPELINE", x + 22, y + 32);

  const rows = [
    ["01", "Composition", "evaluate"],
    ["02", "Canvas 2D", "capture"],
    ["03", "H.264", "encode"],
    ["04", "MP4", "mux"],
  ] as const;

  rows.forEach(([number, label, action], index) => {
    const rowY = y + 57 + index * 45;
    const active = scene.progress * rows.length >= index;
    context.beginPath();
    context.arc(x + 31, rowY + 8, 10, 0, Math.PI * 2);
    context.fillStyle = active ? "rgba(76, 226, 194, 0.18)" : "rgba(112, 124, 159, 0.1)";
    context.fill();
    context.fillStyle = active ? "#69e8cc" : "#67718e";
    context.font = `600 8px ${MONO}`;
    context.fillText(number, x + 25, rowY + 11);
    context.fillStyle = active ? "#e1e6f5" : "#79839e";
    context.font = `550 13px ${FONT}`;
    context.fillText(label, x + 51, rowY + 7);
    context.fillStyle = "#59637e";
    context.font = `500 9px ${MONO}`;
    context.fillText(action.toUpperCase(), x + 51, rowY + 22);
    if (index < rows.length - 1) {
      context.fillStyle = active ? "rgba(78, 226, 195, 0.28)" : "rgba(115, 128, 165, 0.13)";
      context.fillRect(x + 30, rowY + 20, 1, 25);
    }
  });

  const rate = Math.round(24 + scene.pulse * 7);
  context.fillStyle = "#66708c";
  context.font = `500 9px ${MONO}`;
  context.fillText("THROUGHPUT", x + 22, y + 245);
  context.fillStyle = "#dfe5f6";
  context.font = `650 12px ${MONO}`;
  context.fillText(`${rate} FPS`, x + 173, y + 245);
}

function drawRibbons(context: CanvasRenderingContext2D, scene: ExportScene): void {
  context.save();
  context.globalCompositeOperation = "screen";
  context.lineCap = "round";

  for (let index = 0; index < 3; index += 1) {
    const offset = index * 34;
    context.beginPath();
    context.moveTo(390, 418 + offset * 0.2);
    context.bezierCurveTo(
      470 + Math.sin(scene.orbit + index) * 34,
      350 - offset,
      574 + Math.cos(scene.orbit * 0.8 + index) * 28,
      444 + offset * 0.25,
      667,
      348 - offset * 0.1,
    );
    const gradient = context.createLinearGradient(390, 360, 667, 390);
    gradient.addColorStop(0, index === 1 ? "rgba(65, 235, 200, 0)" : "rgba(105, 125, 255, 0)");
    gradient.addColorStop(
      0.48,
      index === 1 ? "rgba(65, 235, 200, 0.38)" : "rgba(105, 125, 255, 0.33)",
    );
    gradient.addColorStop(1, "rgba(170, 105, 255, 0)");
    context.strokeStyle = gradient;
    context.lineWidth = 10 - index * 2;
    context.shadowColor = index === 1 ? "#35dec0" : "#687cff";
    context.shadowBlur = 22;
    context.stroke();
  }
  context.restore();
}

function drawTimeline(context: CanvasRenderingContext2D, progress: number, frame: number): void {
  const x = 70;
  const y = 448;
  const width = 816;
  context.fillStyle = "rgba(138, 152, 193, 0.15)";
  roundedRect(context, x, y, width, 4, 2);
  context.fill();

  const gradient = context.createLinearGradient(x, 0, x + width, 0);
  gradient.addColorStop(0, "#37e3bd");
  gradient.addColorStop(0.55, "#6c83ff");
  gradient.addColorStop(1, "#ad6cff");
  context.fillStyle = gradient;
  roundedRect(context, x, y, Math.max(4, width * progress), 4, 2);
  context.fill();

  const handleX = x + width * progress;
  context.beginPath();
  context.arc(handleX, y + 2, 5, 0, Math.PI * 2);
  context.fillStyle = "#eef2ff";
  context.shadowColor = "#8094ff";
  context.shadowBlur = 14;
  context.fill();
  context.shadowBlur = 0;

  context.fillStyle = "#68738f";
  context.font = `500 9px ${MONO}`;
  context.fillText("00:00", x, y + 28);
  context.textAlign = "right";
  context.fillText(`00:05 · ${String(frame).padStart(3, "0")}/149`, x + width, y + 28);
  context.textAlign = "left";
}

function drawGlow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: readonly [number, number, number],
): void {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${color.join(",")}, 0.2)`);
  gradient.addColorStop(1, `rgba(${color.join(",")}, 0)`);
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawGrid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
): void {
  context.save();
  context.translate((progress * 24) % 24, 0);
  context.strokeStyle = "rgba(131, 146, 193, 0.035)";
  context.lineWidth = 1;
  for (let x = -24; x < width; x += 24) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y < height; y += 24) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.restore();
}

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

function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 3;
}
