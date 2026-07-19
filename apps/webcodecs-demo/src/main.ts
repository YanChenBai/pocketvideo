import "./style.css";
import type { RenderedFrame } from "@pocketvideo/core";
import { PocketVideoSurface } from "@pocketvideo/vue-vapor";
import {
  exportCanvasVideo,
  inspectWebCodecsSupport,
} from "../../../packages/exporter-webcodecs/src/index.ts";
import {
  EXPORT_FPS,
  EXPORT_FRAMES,
  EXPORT_HEIGHT,
  EXPORT_WIDTH,
  webCodecsComposition,
} from "./composition.ts";
import type { ExportScene } from "./composition.ts";
import VideoComposition from "./VideoComposition.vue";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new TypeError("Missing #app element.");

app.innerHTML = `
  <div class="shell">
    <header class="topbar">
      <a class="brand" href="https://github.com/YanChenBai/pocketvideo" target="_blank" rel="noreferrer">
        <span class="brand-mark">PV</span>
        <span>PocketVideo</span>
      </a>
      <span class="page-label">INDEPENDENT DEMO / 01</span>
    </header>

    <main>
      <section class="intro">
        <div>
          <p class="eyebrow">WEB EXPORTER</p>
          <h1>Native video export,<br /><span>inside the browser.</span></h1>
        </div>
        <p class="lede">The same deterministic Composition drives preview and export. WebCodecs encodes every Canvas frame; Mediabunny writes the final MP4 container.</p>
      </section>

      <section class="workspace">
        <div class="preview-panel panel">
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">LIVE COMPOSITION</span>
              <strong>webcodecs-export-demo</strong>
            </div>
            <code>${EXPORT_WIDTH} × ${EXPORT_HEIGHT} / ${EXPORT_FPS} FPS</code>
          </div>
          <div class="canvas-frame">
            <canvas id="preview" width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}"></canvas>
          </div>
          <div class="transport">
            <button id="play" type="button" aria-label="Play">▶</button>
            <input id="timeline" type="range" min="0" max="${EXPORT_FRAMES - 1}" value="0" aria-label="Timeline" />
            <output id="frame-output">000 / ${EXPORT_FRAMES - 1}</output>
          </div>
        </div>

        <aside class="export-panel panel">
          <div class="panel-heading compact">
            <div>
              <span class="panel-kicker">MP4 OUTPUT</span>
              <strong>WebCodecs + Mediabunny</strong>
            </div>
          </div>

          <div id="capability" class="capability checking">
            <span></span>
            <div><strong>Checking encoder</strong><small>Querying H.264 support…</small></div>
          </div>

          <dl class="specs">
            <div><dt>Container</dt><dd>MP4</dd></div>
            <div><dt>Codec</dt><dd>H.264 / AVC</dd></div>
            <div><dt>Duration</dt><dd>5 seconds</dd></div>
            <div><dt>Frames</dt><dd>${EXPORT_FRAMES}</dd></div>
          </dl>

          <button id="export" class="export-button" type="button" disabled>
            <span>Export MP4 locally</span><i>→</i>
          </button>
          <div class="progress-row">
            <progress id="progress" max="1" value="0"></progress>
            <output id="progress-label">READY</output>
          </div>
          <p id="status" class="status">Frames stay on this device. Nothing is uploaded.</p>

          <div id="result" class="result" hidden>
            <video id="result-video" controls playsinline></video>
            <div>
              <span><strong>Export complete</strong><small id="result-meta"></small></span>
              <a id="download" download="pocketvideo-webcodecs.mp4">Download MP4</a>
            </div>
          </div>
        </aside>
      </section>

      <footer>
        <span>Composition</span><i></i><span>Canvas 2D</span><i></i><span>VideoEncoder</span><i></i><span>MP4</span>
      </footer>
    </main>
  </div>
`;

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new TypeError(`Missing element: ${selector}.`);
  return element;
}

const previewCanvas = requiredElement<HTMLCanvasElement>("#preview");
const previewContext = previewCanvas.getContext("2d");
if (!previewContext) throw new TypeError("Canvas 2D is unavailable.");
const context: CanvasRenderingContext2D = previewContext;
let surface: PocketVideoSurface<RenderedFrame<ExportScene>> | undefined;

const playButton = requiredElement<HTMLButtonElement>("#play");
const timeline = requiredElement<HTMLInputElement>("#timeline");
const frameOutput = requiredElement<HTMLOutputElement>("#frame-output");
const capabilityElement = requiredElement<HTMLDivElement>("#capability");
const exportButton = requiredElement<HTMLButtonElement>("#export");
const progress = requiredElement<HTMLProgressElement>("#progress");
const progressLabel = requiredElement<HTMLOutputElement>("#progress-label");
const status = requiredElement<HTMLParagraphElement>("#status");
const result = requiredElement<HTMLDivElement>("#result");
const resultVideo = requiredElement<HTMLVideoElement>("#result-video");
const resultMeta = requiredElement<HTMLElement>("#result-meta");
const download = requiredElement<HTMLAnchorElement>("#download");

let currentFrame = 0;
let playing = false;
let previousTimestamp: number | undefined;
let accumulator = 0;
let renderVersion = 0;
let resultUrl: string | undefined;

async function renderPreview(frame: number): Promise<void> {
  const version = ++renderVersion;
  const rendered = await webCodecsComposition.renderFrame(frame);
  if (version !== renderVersion) return;
  surface ??= new PocketVideoSurface({
    component: VideoComposition,
    context,
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    fps: EXPORT_FPS,
    initialData: rendered,
  });
  await surface.renderFrame(frame, rendered);
  timeline.value = String(frame);
  frameOutput.value = `${String(frame).padStart(3, "0")} / ${EXPORT_FRAMES - 1}`;
}

function seek(frame: number): void {
  currentFrame = Math.min(EXPORT_FRAMES - 1, Math.max(0, frame));
  void renderPreview(currentFrame);
}

function setPlaying(next: boolean): void {
  playing = next;
  playButton.textContent = next ? "Ⅱ" : "▶";
  playButton.setAttribute("aria-label", next ? "Pause" : "Play");
  previousTimestamp = undefined;
  accumulator = 0;
  if (next) requestAnimationFrame(tick);
}

function tick(timestamp: number): void {
  if (!playing) return;
  previousTimestamp ??= timestamp;
  accumulator += timestamp - previousTimestamp;
  previousTimestamp = timestamp;
  const frameDuration = 1000 / EXPORT_FPS;
  const elapsedFrames = Math.floor(accumulator / frameDuration);

  if (elapsedFrames > 0) {
    accumulator -= elapsedFrames * frameDuration;
    currentFrame = (currentFrame + elapsedFrames) % EXPORT_FRAMES;
    void renderPreview(currentFrame);
  }
  requestAnimationFrame(tick);
}

playButton.addEventListener("click", () => setPlaying(!playing));
timeline.addEventListener("input", () => {
  setPlaying(false);
  seek(Number(timeline.value));
});

exportButton.addEventListener("click", async () => {
  setPlaying(false);
  exportButton.disabled = true;
  result.hidden = true;
  progress.value = 0;
  progressLabel.value = "0%";
  status.textContent = "Rendering deterministic frames into the native encoder…";

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = EXPORT_WIDTH;
  exportCanvas.height = EXPORT_HEIGHT;
  const exportContext = exportCanvas.getContext("2d");
  if (!exportContext) throw new TypeError("Export Canvas 2D is unavailable.");

  try {
    if (!surface) throw new Error("The Vue Vapor surface has not mounted.");
    surface.setContext(exportContext);
    const startedAt = performance.now();
    const blob = await exportCanvasVideo({
      canvas: exportCanvas,
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      frameCount: EXPORT_FRAMES,
      fps: EXPORT_FPS,
      bitrate: 4_000_000,
      renderFrame: async ({ frame }) => {
        const rendered = await webCodecsComposition.renderFrame(frame);
        await surface?.renderFrame(frame, rendered);
      },
      onProgress: ({ frame, progress: nextProgress }) => {
        progress.value = nextProgress;
        progressLabel.value = `${Math.round(nextProgress * 100)}%`;
        status.textContent = `Encoding frame ${frame + 1} of ${EXPORT_FRAMES}…`;
      },
    });

    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);
    resultVideo.src = resultUrl;
    download.href = resultUrl;
    const elapsed = ((performance.now() - startedAt) / 1000).toFixed(1);
    resultMeta.textContent = `${formatBytes(blob.size)} · encoded in ${elapsed}s`;
    result.hidden = false;
    progress.value = 1;
    progressLabel.value = "DONE";
    status.textContent = "MP4 is ready to preview or download.";
  } catch (error) {
    console.error(error);
    progressLabel.value = "ERROR";
    status.textContent = error instanceof Error ? error.message : "Video export failed.";
  } finally {
    surface?.setContext(context);
    await renderPreview(currentFrame);
    exportButton.disabled = false;
  }
});

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function initialize(): Promise<void> {
  await renderPreview(0);
  const capability = await inspectWebCodecsSupport({
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    bitrate: 4_000_000,
  });

  capabilityElement.classList.remove("checking");
  if (capability.supported) {
    capabilityElement.classList.add("supported");
    capabilityElement.innerHTML = `
      <span></span>
      <div><strong>Native encoder ready</strong><small>H.264 hardware/software encoder available</small></div>
    `;
    exportButton.disabled = false;
  } else {
    capabilityElement.classList.add("unsupported");
    capabilityElement.innerHTML = `
      <span></span>
      <div><strong>Encoder unavailable</strong><small>${escapeHtml(capability.reason ?? "Try a current Chromium browser.")}</small></div>
    `;
    status.textContent = "This demo requires WebCodecs on HTTPS or localhost.";
  }
}

function escapeHtml(value: string): string {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

window.addEventListener(
  "pagehide",
  () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    surface?.dispose();
    webCodecsComposition.dispose();
  },
  { once: true },
);

void initialize();
