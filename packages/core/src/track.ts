import type { AnimationDriver, AnimationProperties } from "./animation.ts";
import { Rational, type Time } from "./time.ts";

export interface TrackOutput {
  readonly type: string;
}

export interface TrackTiming {
  /** First composition frame on which this track is active. */
  readonly startFrame: number;
  /** Number of composition frames. The active interval is [start, end). */
  readonly durationInFrames: number;
  /** Source offset, expressed in seconds. */
  readonly inPoint?: Time;
  /** Source-time multiplier. Defaults to 1. */
  readonly playbackRate?: Rational;
}

export interface TrackFrameContext {
  readonly compositionFrame: number;
  readonly compositionTime: Time;
  readonly localFrame: number;
  readonly localTime: Time;
  readonly properties: AnimationProperties;
}

export interface Track<TOutput extends TrackOutput = TrackOutput> extends TrackTiming {
  readonly id: string;
  /** Higher layers are returned later, ready for painter-style compositing. */
  readonly layer?: number;
  readonly animations?: readonly AnimationDriver[];
  evaluate(context: TrackFrameContext): TOutput | Promise<TOutput>;
}

export interface EvaluatedTrack<TOutput extends TrackOutput = TrackOutput> {
  readonly id: string;
  readonly layer: number;
  readonly localFrame: number;
  readonly localTime: Time;
  readonly properties: Readonly<Record<string, boolean | number | string>>;
  readonly output: TOutput;
}
