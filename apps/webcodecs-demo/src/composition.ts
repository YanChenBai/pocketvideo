import { defineComposition, frameRate, type Track, type TrackOutput } from "@pocketvideo/core";

export const EXPORT_WIDTH = 960;
export const EXPORT_HEIGHT = 540;
export const EXPORT_FPS = 30;
export const EXPORT_FRAMES = 150;

export interface ExportScene extends TrackOutput {
  readonly type: "webcodecs-scene";
  readonly frame: number;
  readonly progress: number;
  readonly seconds: number;
  readonly orbit: number;
  readonly pulse: number;
}

const sceneTrack: Track<ExportScene> = {
  id: "webcodecs-scene",
  startFrame: 0,
  durationInFrames: EXPORT_FRAMES,
  layer: 0,
  evaluate: ({ compositionFrame, localTime }) => {
    const progress = compositionFrame / (EXPORT_FRAMES - 1);
    return {
      type: "webcodecs-scene",
      frame: compositionFrame,
      progress,
      seconds: localTime.toNumber(),
      orbit: progress * Math.PI * 4,
      pulse: 0.5 + Math.sin(progress * Math.PI * 6) * 0.5,
    };
  },
};

export const webCodecsComposition = defineComposition(
  {
    id: "webcodecs-export-demo",
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    frameRate: frameRate(EXPORT_FPS),
    durationInFrames: EXPORT_FRAMES,
  },
  [sceneTrack],
);
