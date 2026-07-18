import { AnimationProperties } from "./animation.ts";
import { assertFrame, frameToTime, Rational, type FrameRate, type Time } from "./time.ts";
import type { EvaluatedTrack, Track, TrackFrameContext, TrackOutput } from "./track.ts";

export interface CompositionConfig {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly frameRate: FrameRate;
  readonly durationInFrames: number;
}

export interface RenderedFrame<TOutput extends TrackOutput = TrackOutput> {
  readonly frame: number;
  readonly time: Time;
  readonly tracks: readonly EvaluatedTrack<TOutput>[];
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive safe integer, got ${value}.`);
  }
}

function validateTrack(track: Track): void {
  if (track.id.length === 0) {
    throw new TypeError("Track id cannot be empty.");
  }

  assertFrame(track.startFrame);
  assertPositiveInteger(track.durationInFrames, "Track durationInFrames");

  if ((track.playbackRate ?? Rational.one()).compare(Rational.zero()) <= 0) {
    throw new RangeError("Track playbackRate must be greater than zero.");
  }
}

export class Composition<TOutput extends TrackOutput = TrackOutput> {
  readonly config: CompositionConfig;
  readonly #tracks: readonly Track<TOutput>[];

  constructor(config: CompositionConfig, tracks: readonly Track<TOutput>[]) {
    if (config.id.length === 0) {
      throw new TypeError("Composition id cannot be empty.");
    }

    assertPositiveInteger(config.width, "Composition width");
    assertPositiveInteger(config.height, "Composition height");
    assertPositiveInteger(config.durationInFrames, "Composition durationInFrames");

    if (config.frameRate.compare(Rational.zero()) <= 0) {
      throw new RangeError("Composition frameRate must be greater than zero.");
    }

    const ids = new Set<string>();
    for (const track of tracks) {
      validateTrack(track);
      if (ids.has(track.id)) {
        throw new TypeError(`Duplicate track id: ${track.id}.`);
      }
      ids.add(track.id);
    }

    this.config = Object.freeze({ ...config });
    this.#tracks = Object.freeze([...tracks]);
  }

  async renderFrame(frame: number): Promise<RenderedFrame<TOutput>> {
    assertFrame(frame);

    if (frame >= this.config.durationInFrames) {
      throw new RangeError(
        `Frame ${frame} is outside composition ${this.config.id} ` +
          `(duration ${this.config.durationInFrames}).`,
      );
    }

    const time = frameToTime(frame, this.config.frameRate);
    const activeTracks = this.#tracks
      .map((track, order) => ({ track, order }))
      .filter(({ track }) => {
        const endFrame = track.startFrame + track.durationInFrames;
        return frame >= track.startFrame && frame < endFrame;
      })
      .sort(
        (left, right) =>
          (left.track.layer ?? 0) - (right.track.layer ?? 0) || left.order - right.order,
      );

    const evaluated = await Promise.all(
      activeTracks.map(async ({ track }) => {
        const localFrame = frame - track.startFrame;
        const playbackRate = track.playbackRate ?? Rational.one();
        const inPoint = track.inPoint ?? Rational.zero();
        const localTime = frameToTime(localFrame, this.config.frameRate)
          .multiply(playbackRate)
          .add(inPoint);
        const properties = new AnimationProperties();

        for (const animation of track.animations ?? []) {
          animation.evaluate(localTime, properties);
        }

        const context: TrackFrameContext = Object.freeze({
          compositionFrame: frame,
          compositionTime: time,
          localFrame,
          localTime,
          properties,
        });
        const output = await track.evaluate(context);

        return Object.freeze({
          id: track.id,
          layer: track.layer ?? 0,
          localFrame,
          localTime,
          properties: properties.toObject(),
          output,
        });
      }),
    );

    return Object.freeze({
      frame,
      time,
      tracks: Object.freeze(evaluated),
    });
  }

  dispose(): void {
    for (const track of this.#tracks) {
      for (const animation of track.animations ?? []) {
        animation.dispose?.();
      }
    }
  }
}

export function defineComposition<TOutput extends TrackOutput>(
  config: CompositionConfig,
  tracks: readonly Track<TOutput>[],
): Composition<TOutput> {
  return new Composition(config, tracks);
}
