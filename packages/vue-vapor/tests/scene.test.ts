import { describe, expect, it } from "vite-plus/test";
import { VideoScene } from "../src/scene.ts";

describe("VideoScene", () => {
  it("keeps a stable z-ordered retained scene", () => {
    const scene = new VideoScene();
    const text = scene.create("text");
    const background = scene.create("stage");
    scene.update(text, { zIndex: 10, x: 12 }, "PocketVideo");
    scene.update(background, { zIndex: -10, fill: "#08070f" });

    expect(scene.snapshot().map((node) => node.kind)).toEqual(["stage", "text"]);
    expect(scene.snapshot()[1]?.text).toBe("PocketVideo");

    scene.remove(text);
    expect(scene.snapshot()).toHaveLength(1);
  });

  it("retains nested component ownership and removes a whole subtree", () => {
    const scene = new VideoScene();
    const layer = scene.create("group");
    const card = scene.create("rect", layer);
    const title = scene.create("text", card);

    scene.update(layer, { x: 40, y: 50, zIndex: 2 });
    scene.update(card, { x: 12, y: 16, width: 240, height: 120 });
    scene.update(title, { x: 20, y: 24, zIndex: 1 }, "Nested Vue component");

    const snapshot = scene.snapshot();
    expect(snapshot.map((node) => node.kind)).toEqual(["group", "rect", "text"]);
    expect(snapshot[1]?.parentId).toBe(layer.id);
    expect(snapshot[2]?.parentId).toBe(card.id);

    scene.remove(layer);
    expect(scene.snapshot()).toEqual([]);
  });
});
