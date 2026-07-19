import "./style.css";
import {
  demoComposition,
  VIDEO_DURATION,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./composition.ts";
import { OglAuroraLayout } from "./layouts/ogl-aurora-layout.ts";
import { renderFrameToCanvas } from "./renderer.ts";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new TypeError("Missing #app element.");
}

app.innerHTML = `
  <div class="page-shell">
    <header class="topbar">
      <a class="brand" href="https://github.com/YanChenBai/pocketvideo" target="_blank" rel="noreferrer">
        <span class="brand-mark">P</span>
        <span>PocketVideo</span>
      </a>
      <div class="status"><span></span> Core prototype</div>
    </header>

    <main class="workspace">
      <section class="preview-column">
        <div class="section-heading">
          <div>
            <p class="kicker">COMPOSITION / CORE-DEMO</p>
            <h1>Deterministic frame preview</h1>
          </div>
          <div class="resolution">${VIDEO_WIDTH} × ${VIDEO_HEIGHT}</div>
        </div>

        <div class="stage-frame">
          <div id="ogl-layout" class="render-layer" aria-hidden="true"></div>
          <canvas id="preview" class="render-layer" width="${VIDEO_WIDTH}" height="${VIDEO_HEIGHT}"></canvas>
        </div>

        <div class="transport">
          <button class="play-button" id="play" type="button" aria-label="播放">▶</button>
          <button class="step-button" id="previous" type="button" aria-label="上一帧">−1</button>
          <button class="step-button" id="next" type="button" aria-label="下一帧">+1</button>
          <input id="timeline" type="range" min="0" max="${VIDEO_DURATION - 1}" value="0" aria-label="时间轴" />
          <output id="frame-output">000 / ${VIDEO_DURATION - 1}</output>
        </div>
      </section>

      <aside class="inspector">
        <div class="inspector-title">
          <p class="kicker">FRAME INSPECTOR</p>
          <span id="play-state">PAUSED</span>
        </div>

        <dl class="metrics">
          <div><dt>Frame</dt><dd id="metric-frame">0</dd></div>
          <div><dt>Seconds</dt><dd id="metric-seconds">0.000</dd></div>
          <div><dt>Exact time</dt><dd id="metric-exact">0</dd></div>
          <div><dt>Active tracks</dt><dd id="metric-tracks">0</dd></div>
        </dl>

        <div class="track-panel">
          <div class="track-heading"><span>Active tracks</span><span>Layer</span></div>
          <div id="track-list" class="track-list"></div>
        </div>

        <div class="core-note">
          <span class="note-icon">⌁</span>
          <p><strong>No browser clock inside core.</strong> The UI only selects a frame; Composition evaluates the exact result.</p>
        </div>

      </aside>
    </main>
  </div>
`;

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new TypeError(`Missing element: ${selector}.`);
  return element;
}

const canvas = requiredElement<HTMLCanvasElement>("#preview");
const oglLayoutHost = requiredElement<HTMLDivElement>("#ogl-layout");
const canvasContext = canvas.getContext("2d");
if (!canvasContext) throw new TypeError("Canvas 2D is unavailable.");
const context: CanvasRenderingContext2D = canvasContext;
const oglLayout = new OglAuroraLayout(VIDEO_WIDTH, VIDEO_HEIGHT);
oglLayoutHost.appendChild(oglLayout.canvas);

const playButton = requiredElement<HTMLButtonElement>("#play");
const previousButton = requiredElement<HTMLButtonElement>("#previous");
const nextButton = requiredElement<HTMLButtonElement>("#next");
const timeline = requiredElement<HTMLInputElement>("#timeline");
const frameOutput = requiredElement<HTMLOutputElement>("#frame-output");
const playState = requiredElement<HTMLSpanElement>("#play-state");
const metricFrame = requiredElement<HTMLElement>("#metric-frame");
const metricSeconds = requiredElement<HTMLElement>("#metric-seconds");
const metricExact = requiredElement<HTMLElement>("#metric-exact");
const metricTracks = requiredElement<HTMLElement>("#metric-tracks");
const trackList = requiredElement<HTMLDivElement>("#track-list");

let currentFrame = 0;
let playing = false;
let previousTimestamp: number | undefined;
let accumulatedTime = 0;
let renderVersion = 0;

async function render(): Promise<void> {
  const version = ++renderVersion;
  const rendered = await demoComposition.renderFrame(currentFrame);
  if (version !== renderVersion) return;

  oglLayout.renderFrame(rendered);
  renderFrameToCanvas(context, rendered);

  timeline.value = String(currentFrame);
  frameOutput.value = `${String(currentFrame).padStart(3, "0")} / ${VIDEO_DURATION - 1}`;
  metricFrame.textContent = String(currentFrame);
  metricSeconds.textContent = rendered.time.toNumber().toFixed(3);
  metricExact.textContent = rendered.time.toString();
  metricTracks.textContent = String(rendered.tracks.length);
  trackList.innerHTML = rendered.tracks
    .map(
      (track) => `
        <div class="track-row">
          <span><i></i>${track.id}</span>
          <code>${track.layer}</code>
        </div>
      `,
    )
    .join("");
}

function setPlaying(nextPlaying: boolean): void {
  playing = nextPlaying;
  playButton.textContent = playing ? "Ⅱ" : "▶";
  playButton.setAttribute("aria-label", playing ? "暂停" : "播放");
  playState.textContent = playing ? "PLAYING" : "PAUSED";
  playState.classList.toggle("is-playing", playing);
  previousTimestamp = undefined;
  accumulatedTime = 0;

  if (playing) requestAnimationFrame(tick);
}

function seek(frame: number): void {
  currentFrame = Math.min(VIDEO_DURATION - 1, Math.max(0, frame));
  void render();
}

function tick(timestamp: number): void {
  if (!playing) return;

  if (previousTimestamp === undefined) previousTimestamp = timestamp;
  accumulatedTime += timestamp - previousTimestamp;
  previousTimestamp = timestamp;

  const frameDuration = 1000 / VIDEO_FPS;
  const framesToAdvance = Math.floor(accumulatedTime / frameDuration);

  if (framesToAdvance > 0) {
    accumulatedTime -= framesToAdvance * frameDuration;
    currentFrame = (currentFrame + framesToAdvance) % VIDEO_DURATION;
    void render();
  }

  requestAnimationFrame(tick);
}

playButton.addEventListener("click", () => setPlaying(!playing));
previousButton.addEventListener("click", () => seek(currentFrame - 1));
nextButton.addEventListener("click", () => seek(currentFrame + 1));
timeline.addEventListener("input", () => {
  setPlaying(false);
  seek(Number(timeline.value));
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    setPlaying(!playing);
  } else if (event.code === "ArrowLeft") {
    seek(currentFrame - 1);
  } else if (event.code === "ArrowRight") {
    seek(currentFrame + 1);
  }
});

window.addEventListener(
  "pagehide",
  () => {
    oglLayout.dispose();
  },
  { once: true },
);

void render();
