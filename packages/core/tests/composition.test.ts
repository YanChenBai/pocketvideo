import { describe, expect, test, vi } from "vite-plus/test";
import {
  defineComposition,
  frameRate,
  Rational,
  seconds,
  type AnimationDriver,
  type Track,
  type TrackOutput,
} from "../src/index.ts";

interface TestOutput extends TrackOutput {
  readonly type: "test";
  readonly value: string;
}

function createTrack(overrides: Partial<Track<TestOutput>> = {}): Track<TestOutput> {
  return {
    id: "title",
    startFrame: 10,
    durationInFrames: 20,
    evaluate: ({ localFrame }) => ({
      type: "test",
      value: `frame:${localFrame}`,
    }),
    ...overrides,
  };
}

describe("Composition", () => {
  test("uses a half-open active range", async () => {
    const composition = defineComposition(
      {
        id: "main",
        width: 1920,
        height: 1080,
        frameRate: frameRate(30),
        durationInFrames: 60,
      },
      [createTrack()],
    );

    expect((await composition.renderFrame(9)).tracks).toHaveLength(0);
    expect((await composition.renderFrame(10)).tracks[0]?.localFrame).toBe(0);
    expect((await composition.renderFrame(29)).tracks[0]?.localFrame).toBe(19);
    expect((await composition.renderFrame(30)).tracks).toHaveLength(0);
  });

  test("maps global frames to exact source time", async () => {
    const composition = defineComposition(
      {
        id: "main",
        width: 1080,
        height: 1920,
        frameRate: frameRate(30),
        durationInFrames: 90,
      },
      [
        createTrack({
          startFrame: 30,
          durationInFrames: 60,
          inPoint: seconds(2),
          playbackRate: new Rational(2),
        }),
      ],
    );

    const rendered = await composition.renderFrame(45);

    expect(rendered.time.toString()).toBe("3/2");
    expect(rendered.tracks[0]?.localTime.toString()).toBe("3");
  });

  test("evaluates animation drivers at track-local time", async () => {
    const dispose = vi.fn();
    const animation: AnimationDriver = {
      evaluate(time, sink) {
        sink.set("opacity", time.toNumber());
      },
      dispose,
    };
    const track = createTrack({
      startFrame: 0,
      animations: [animation],
      evaluate: ({ properties }) => ({
        type: "test",
        value: String(properties.get("opacity")),
      }),
    });
    const composition = defineComposition(
      {
        id: "main",
        width: 1920,
        height: 1080,
        frameRate: frameRate(30),
        durationInFrames: 30,
      },
      [track],
    );

    const first = await composition.renderFrame(15);
    const second = await composition.renderFrame(15);

    expect(first.tracks[0]?.properties).toEqual({ opacity: 0.5 });
    expect(second).toEqual(first);

    composition.dispose();
    expect(dispose).toHaveBeenCalledOnce();
  });

  test("returns tracks in stable layer order", async () => {
    const composition = defineComposition(
      {
        id: "main",
        width: 1920,
        height: 1080,
        frameRate: frameRate(24),
        durationInFrames: 24,
      },
      [
        createTrack({ id: "foreground", startFrame: 0, layer: 10 }),
        createTrack({ id: "background", startFrame: 0, layer: -1 }),
        createTrack({ id: "middle", startFrame: 0, layer: 0 }),
      ],
    );

    expect((await composition.renderFrame(0)).tracks.map(({ id }) => id)).toEqual([
      "background",
      "middle",
      "foreground",
    ]);
  });

  test("validates composition bounds and duplicate tracks", async () => {
    const config = {
      id: "main",
      width: 1920,
      height: 1080,
      frameRate: frameRate(30),
      durationInFrames: 30,
    };

    expect(() => defineComposition(config, [createTrack(), createTrack()])).toThrowError(
      "Duplicate track id",
    );

    const composition = defineComposition(config, [createTrack({ startFrame: 0 })]);
    await expect(composition.renderFrame(30)).rejects.toThrowError("outside composition");

    expect(() => defineComposition({ ...config, frameRate: Rational.zero() }, [])).toThrowError(
      "frameRate",
    );
  });
});
