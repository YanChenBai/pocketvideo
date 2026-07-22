import { h, nextTick, ref } from "vue";
import { canvasToPng, createSkiaCanvas } from "@pocketvideo/canvas/skia";
import { describe, expect, it } from "vite-plus/test";
import { Canvas, CanvasSurface } from "../src/canvas.ts";
import { Image, Text, View } from "../src/components/index.ts";
import { createVueBinding } from "../src/renderer.ts";
import { defineStyles, type InlineStyle } from "../src/styles.ts";

const styles = defineStyles({
  "flex-col gap-2": {
    base: { display: "flex", flexDirection: "column", gap: 8 },
  },
  button: {
    base: { backgroundColor: "#334155", width: 120, height: 36 },
    focus: { backgroundColor: "#0ea5e9", scale: 1.05 },
    active: { scale: 0.95 },
  },
  label: {
    base: { color: "#f8fafc", fontSize: 16 },
  },
});

describe("Vue host binding", () => {
  it("renders the primitive tree through a Canvas surface", async () => {
    const canvas = createSkiaCanvas({ width: 160, height: 90 });
    const surface = new CanvasSurface({
      component: {
        setup: () => () =>
          h(Canvas, { width: 160, height: 90 }, () =>
            h(
              View,
              {
                style: {
                  position: "absolute",
                  width: 160,
                  height: 90,
                  backgroundColor: "#112233",
                },
              },
              () =>
                h(
                  Text,
                  {
                    style: {
                      position: "absolute",
                      left: 12,
                      top: 10,
                      color: "#ffffff",
                      fontSize: 18,
                    },
                  },
                  () => "PocketVideo",
                ),
            ),
          ),
      },
      canvas,
      width: 160,
      height: 90,
      fps: 30,
      initialData: { title: "first" },
    });

    await surface.renderFrame(2, { title: "next" });
    expect(surface.frame.value).toMatchObject({ frame: 2, fps: 30, time: 2 / 30 });
    expect(surface.binding.snapshot().children.some((node) => node.type === "view")).toBe(true);
    expect((await canvasToPng(canvas)).byteLength).toBeGreaterThan(100);
    surface.dispose();
  });

  it("mounts only View, Text, and Image host primitives", () => {
    const binding = createVueBinding({ styles });
    const app = binding.mount({
      setup: () => () =>
        h(View, { class: "gap-2 flex-col", debugName: "card" }, () => [
          h(Text, { class: "label" }, () => "PocketVideo"),
          h(Image, { src: "cover.png", style: { width: 64, height: 64 } }),
        ]),
    });

    const root = binding.snapshot();
    const view = root.children[0];
    expect(view?.type).toBe("view");
    expect(view?.debugName).toBe("card");
    expect(view?.style).toMatchObject({ flexDirection: "column", gap: 8 });
    expect(view?.children.map((node) => node.type)).toEqual(["text", "image"]);
    expect(view?.children[1]?.source).toBe("cover.png");
    app.unmount();
  });

  it("updates inline styles through Vue reactivity", async () => {
    const width = ref(80);
    const binding = createVueBinding({ styles });
    const app = binding.mount({
      setup: () => () => h(View, { class: "button", style: { width: width.value } }),
    });

    expect(binding.snapshot().children[0]?.style.width).toBe(80);
    width.value = 144;
    await nextTick();
    expect(binding.snapshot().children[0]?.style.width).toBe(144);
    app.unmount();
  });

  it("moves focus in document order and applies focus styles", () => {
    const binding = createVueBinding({ styles });
    const app = binding.mount({
      setup: () => () =>
        h(View, {}, () => [
          h(View, { class: "button", focusable: true, debugName: "first" }),
          h(View, { class: "button", focusable: true, debugName: "second" }),
        ]),
    });

    binding.input.focusNext();
    expect(binding.input.getFocused()?.debugName).toBe("first");
    expect(binding.input.getFocused()?.style.backgroundColor).toBe("#0ea5e9");
    binding.input.focusNext();
    expect(binding.input.getFocused()?.debugName).toBe("second");
    binding.input.focusNext();
    expect(binding.input.getFocused()?.debugName).toBe("second");
    binding.input.focusPrevious();
    expect(binding.input.getFocused()?.debugName).toBe("first");
    app.unmount();
  });

  it("bubbles a press to the nearest ancestor handler", () => {
    let presses = 0;
    const binding = createVueBinding({ styles });
    const app = binding.mount({
      setup: () => () =>
        h(View, { onPress: () => presses++ }, () => h(View, { class: "button", focusable: true })),
    });

    binding.input.focusNext();
    binding.input.pressFocused();
    expect(presses).toBe(1);
    app.unmount();
  });

  it("repairs focus when the focused subtree is removed", async () => {
    const showFirst = ref(true);
    const binding = createVueBinding({ styles });
    const app = binding.mount({
      setup: () => () =>
        h(View, {}, () => [
          showFirst.value
            ? h(View, { class: "button", focusable: true, debugName: "first" })
            : null,
          h(View, { class: "button", focusable: true, debugName: "second" }),
        ]),
    });

    binding.input.focusNext();
    expect(binding.input.getFocused()?.debugName).toBe("first");
    showFirst.value = false;
    await nextTick();
    expect(binding.input.getFocused()?.debugName).toBe("second");
    app.unmount();
  });

  it("fails loudly for unknown classes and style properties", () => {
    const unknownClass = createVueBinding({ styles });
    expect(() =>
      unknownClass.mount({ setup: () => () => h(View, { class: "not-compiled" }) }),
    ).toThrow(/Unknown compiled class literal/u);

    const unknownStyle = createVueBinding({ styles });
    expect(() =>
      unknownStyle.mount({
        setup: () => () =>
          h(View, {
            style: { unsupported: 1 } as unknown as InlineStyle,
          }),
      }),
    ).toThrow(/Unknown PocketVideo style property/u);
  });
});
