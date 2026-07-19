import {
  defineComposition,
  frameRate,
  type AnimationDriver,
  type AnimationPropertySink,
  type AnimationProperties,
  type Track,
  type TrackOutput,
} from "@pocketvideo/core";

export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;
export const VIDEO_FPS = 30;
export const VIDEO_DURATION = 300;

export interface BackgroundLayer extends TrackOutput {
  readonly type: "background";
}

export interface AuroraLayer extends TrackOutput {
  readonly type: "ogl-aurora";
  readonly time: number;
  readonly amplitude: number;
  readonly blend: number;
  readonly colorStops: readonly [string, string, string];
}

export interface OrbLayer extends TrackOutput {
  readonly type: "orb";
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly opacity: number;
}

export interface IntroLayer extends TrackOutput {
  readonly type: "intro";
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly opacity: number;
  readonly translateY: number;
}

export interface CardLayer extends TrackOutput {
  readonly type: "card";
  readonly index: number;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly accent: string;
  readonly opacity: number;
  readonly translateY: number;
}

export interface TimelineLayer extends TrackOutput {
  readonly type: "timeline";
  readonly progress: number;
  readonly frame: number;
}

export type DemoLayer =
  | AuroraLayer
  | BackgroundLayer
  | CardLayer
  | IntroLayer
  | OrbLayer
  | TimelineLayer;

type Ease = (progress: number) => number;

interface Tween {
  readonly property: string;
  readonly from: number;
  readonly to: number;
  readonly duration: number;
  readonly delay?: number;
  readonly ease?: Ease;
}

const easeOutCubic: Ease = (progress) => 1 - (1 - progress) ** 3;

class TweenDriver implements AnimationDriver {
  private readonly tweens: readonly Tween[];

  constructor(tweens: readonly Tween[]) {
    this.tweens = tweens;
  }

  evaluate(time: { toNumber(): number }, sink: AnimationPropertySink): void {
    const seconds = time.toNumber();

    for (const tween of this.tweens) {
      const delay = tween.delay ?? 0;
      const rawProgress = (seconds - delay) / tween.duration;
      const progress = Math.min(1, Math.max(0, rawProgress));
      const eased = (tween.ease ?? easeOutCubic)(progress);
      sink.set(tween.property, tween.from + (tween.to - tween.from) * eased);
    }
  }
}

class AmbientDriver implements AnimationDriver {
  evaluate(time: { toNumber(): number }, sink: AnimationPropertySink): void {
    const seconds = time.toNumber();
    sink.set("x", 980 + Math.sin(seconds * 0.68) * 92);
    sink.set("y", 156 + Math.cos(seconds * 0.52) * 46);
    sink.set("radius", 160 + Math.sin(seconds * 0.9) * 22);
    sink.set("opacity", 0.42 + Math.sin(seconds * 0.74) * 0.08);
  }
}

function numberProperty(properties: AnimationProperties, key: string, fallback: number): number {
  const value = properties.get(key);
  return typeof value === "number" ? value : fallback;
}

function revealAnimation(delay = 0): AnimationDriver {
  return new TweenDriver([
    { property: "opacity", from: 0, to: 1, duration: 0.7, delay },
    { property: "translateY", from: 32, to: 0, duration: 0.8, delay },
  ]);
}

const tracks: readonly Track<DemoLayer>[] = [
  {
    id: "ogl-aurora-layout",
    startFrame: 0,
    durationInFrames: VIDEO_DURATION,
    layer: 0,
    evaluate: ({ localTime }) => ({
      type: "ogl-aurora",
      time: localTime.toNumber(),
      amplitude: 1,
      blend: 0.52,
      colorStops: ["#171D22", "#7CFF67", "#171D22"],
    }),
  },
  {
    id: "background",
    startFrame: 0,
    durationInFrames: VIDEO_DURATION,
    layer: 1,
    evaluate: () => ({ type: "background" }),
  },
  {
    id: "ambient-orb",
    startFrame: 0,
    durationInFrames: VIDEO_DURATION,
    layer: 2,
    animations: [new AmbientDriver()],
    evaluate: ({ properties }) => ({
      type: "orb",
      x: numberProperty(properties, "x", 980),
      y: numberProperty(properties, "y", 156),
      radius: numberProperty(properties, "radius", 160),
      opacity: numberProperty(properties, "opacity", 0.4),
    }),
  },
  {
    id: "intro",
    startFrame: 0,
    durationInFrames: VIDEO_DURATION,
    layer: 10,
    animations: [revealAnimation(0.08)],
    evaluate: ({ properties }) => ({
      type: "intro",
      eyebrow: "POCKETVIDEO / CORE PREVIEW",
      title: "Frame-accurate by design.",
      description: "One composition clock. Deterministic tracks. Any frame, on demand.",
      opacity: numberProperty(properties, "opacity", 0),
      translateY: numberProperty(properties, "translateY", 32),
    }),
  },
  ...[
    {
      id: "exact-time",
      startFrame: 30,
      label: "TIME MODEL",
      value: "30000 / 1001",
      detail: "Exact rational timestamps",
      accent: "#8b5cf6",
    },
    {
      id: "track-range",
      startFrame: 48,
      label: "TRACK RANGE",
      value: "[ start, end )",
      detail: "Predictable active boundaries",
      accent: "#22d3ee",
    },
    {
      id: "clockless",
      startFrame: 66,
      label: "ANIMATION",
      value: "Clockless",
      detail: "GSAP / Motion-ready drivers",
      accent: "#f59e0b",
    },
  ].map<Track<DemoLayer>>((card, index) => ({
    id: card.id,
    startFrame: card.startFrame,
    durationInFrames: VIDEO_DURATION - card.startFrame,
    layer: 20 + index,
    animations: [revealAnimation()],
    evaluate: ({ properties }) => ({
      type: "card",
      index,
      label: card.label,
      value: card.value,
      detail: card.detail,
      accent: card.accent,
      opacity: numberProperty(properties, "opacity", 0),
      translateY: numberProperty(properties, "translateY", 32),
    }),
  })),
  {
    id: "timeline",
    startFrame: 0,
    durationInFrames: VIDEO_DURATION,
    layer: 100,
    evaluate: ({ compositionFrame }) => ({
      type: "timeline",
      frame: compositionFrame,
      progress: compositionFrame / (VIDEO_DURATION - 1),
    }),
  },
];

export const demoComposition = defineComposition(
  {
    id: "core-demo",
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    frameRate: frameRate(VIDEO_FPS),
    durationInFrames: VIDEO_DURATION,
  },
  tracks,
);
