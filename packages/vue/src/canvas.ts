import type { CanvasLike } from "@pocketvideo/canvas";
import {
  computed,
  defineComponent,
  h,
  nextTick,
  provide,
  shallowRef,
  type Component,
  type ComputedRef,
  type ShallowRef,
} from "vue";
import type { NodeMirror } from "./node.ts";
import { createVueBinding } from "./renderer.ts";
import type { HostStyle, StyleTable } from "./styles.ts";
import {
  requireSurface,
  surfaceKey,
  type SurfaceContext,
  type VideoConfig,
  type VideoFrameState,
} from "./surface-context.ts";

export { Canvas } from "./components/index.ts";
export type { CanvasProps } from "./components/index.ts";
export type { VideoConfig, VideoFrameState } from "./surface-context.ts";

export interface CanvasSurfaceOptions<T> extends VideoConfig {
  readonly component: Component;
  readonly canvas: CanvasLike;
  readonly initialData: T;
  readonly styles?: StyleTable;
}

/** Mounts a regular Vue component into PocketVideo's host tree and paints it to Canvas 2D. */
export class CanvasSurface<T> {
  readonly frame: ShallowRef<VideoFrameState<T>>;
  readonly binding;
  private readonly canvas: ShallowRef<CanvasLike>;
  private readonly config: Readonly<VideoConfig>;
  private readonly app;
  private readonly images = new Map<string, ImageRecord>();

  constructor(options: CanvasSurfaceOptions<T>) {
    this.canvas = shallowRef(options.canvas);
    this.frame = shallowRef({ frame: 0, fps: options.fps, time: 0, data: options.initialData });
    this.config = Object.freeze({
      width: options.width,
      height: options.height,
      fps: options.fps,
      durationInFrames: options.durationInFrames,
    });
    options.canvas.width = options.width;
    options.canvas.height = options.height;
    this.binding = createVueBinding({ styles: options.styles });
    const context: SurfaceContext<T> = {
      canvas: this.canvas,
      frame: this.frame,
      config: this.config,
    };
    const Root = defineComponent({
      name: "CanvasSurfaceRoot",
      setup: () => {
        provide(surfaceKey, context as SurfaceContext<unknown>);
        return () => h(options.component);
      },
    });
    this.app = this.binding.mount(Root);
  }

  setCanvas(canvas: CanvasLike): void {
    canvas.width = this.config.width;
    canvas.height = this.config.height;
    this.canvas.value = canvas;
  }

  async renderFrame(frame: number, data: T): Promise<void> {
    this.frame.value = { frame, fps: this.config.fps, time: frame / this.config.fps, data };
    await nextTick();
    if (!hasDrawableNode(this.binding.root)) return;
    await this.prepareImages(this.binding.root);
    const context = this.canvas.value.getContext("2d");
    if (!isCanvas2DContext(context)) {
      throw new TypeError("CanvasSurface requires a Canvas 2D context.");
    }
    context.clearRect(0, 0, this.config.width, this.config.height);
    for (const node of sortNodes(this.binding.root.children)) {
      drawNode(context, node, this.config.width, this.config.height, 0, 0, this.images);
    }
  }

  dispose(): void {
    this.app.unmount();
    this.images.clear();
  }

  private async prepareImages(node: NodeMirror): Promise<void> {
    const pending: Promise<CanvasImageSource>[] = [];
    visit(node, (current) => {
      if (current.type !== "image" || !current.source) return;
      let record = this.images.get(current.source);
      if (!record) {
        record = loadImage(current.source);
        this.images.set(current.source, record);
      }
      pending.push(record.promise);
    });
    await Promise.all(pending);
  }
}

export function useVideoFrame<T>(): ShallowRef<VideoFrameState<T>> {
  return requireSurface().frame as ShallowRef<VideoFrameState<T>>;
}

export function useFrame(): ComputedRef<number> {
  const frame = requireSurface().frame;
  return computed(() => frame.value.frame);
}

export function useTime(): ComputedRef<number> {
  const frame = requireSurface().frame;
  return computed(() => frame.value.time);
}

export function useFPS(): number {
  return requireSurface().config.fps;
}

export function useVideoConfig(): Readonly<VideoConfig> {
  return requireSurface().config;
}

interface ImageRecord {
  promise: Promise<CanvasImageSource>;
  value?: CanvasImageSource;
}

function loadImage(source: string): ImageRecord {
  if (typeof Image === "undefined") {
    throw new Error(`Image loading requires a DOM host: ${source}`);
  }
  const image = new Image();
  image.crossOrigin = "anonymous";
  const record = {} as ImageRecord;
  record.promise = new Promise((resolve, reject) => {
    image.addEventListener("load", () => {
      record.value = image;
      resolve(image);
    });
    image.addEventListener("error", () => reject(new Error(`Unable to load image: ${source}`)));
  });
  image.src = source;
  return record;
}

function drawNode(
  context: CanvasRenderingContext2D,
  node: NodeMirror,
  parentWidth: number,
  parentHeight: number,
  layoutX: number,
  layoutY: number,
  images: ReadonlyMap<string, ImageRecord>,
): void {
  if (node.type === "#comment" || node.type === "#text" || node.style.display === "none") return;
  const style = node.style;
  const x = layoutX + (style.left ?? 0);
  const y = layoutY + (style.top ?? 0);
  const width = resolveSize(style.width, parentWidth, style.minWidth, style.maxWidth);
  const height = resolveSize(
    style.height,
    node.type === "text" ? (style.lineHeight ?? (style.fontSize ?? 16) * 1.2) : parentHeight,
    style.minHeight,
    style.maxHeight,
  );

  context.save();
  context.globalAlpha *= clamp(style.opacity ?? 1, 0, 1);
  context.translate(x + (style.translateX ?? 0), y + (style.translateY ?? 0));
  if (style.rotate) context.rotate((style.rotate * Math.PI) / 180);
  if (style.scale !== undefined) context.scale(style.scale, style.scale);
  if (style.overflow === "hidden") {
    roundedRect(context, width, height, style.borderRadius ?? 0);
    context.clip();
  }

  if (node.type === "view") drawView(context, width, height, style);
  if (node.type === "text") drawText(context, textContent(node), width, style);
  if (node.type === "image") drawImage(context, node, width, height, style, images);

  drawChildren(context, node, width, height, images);
  context.restore();
}

function drawView(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: HostStyle,
): void {
  if (!style.backgroundColor && !style.borderColor) return;
  roundedRect(context, width, height, style.borderRadius ?? 0);
  if (style.backgroundColor) {
    context.fillStyle = style.backgroundColor;
    context.fill();
  }
  if (style.borderColor && (style.borderWidth ?? 0) > 0) {
    context.strokeStyle = style.borderColor;
    context.lineWidth = style.borderWidth ?? 1;
    context.stroke();
  }
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  width: number,
  style: HostStyle,
): void {
  const size = style.fontSize ?? 16;
  context.fillStyle = style.color ?? "#000000";
  context.font = `${style.fontWeight ?? 400} ${size}px ${style.fontFamily ?? "sans-serif"}`;
  context.textBaseline = "top";
  context.textAlign = style.textAlign ?? "left";
  const x = context.textAlign === "center" ? width / 2 : context.textAlign === "right" ? width : 0;
  const lineHeight = style.lineHeight ?? size * 1.2;
  for (const [index, line] of text.split("\n").entries()) {
    context.fillText(line, x, index * lineHeight);
  }
}

function drawImage(
  context: CanvasRenderingContext2D,
  node: NodeMirror,
  width: number,
  height: number,
  style: HostStyle,
  images: ReadonlyMap<string, ImageRecord>,
): void {
  const source = node.source ? images.get(node.source)?.value : undefined;
  if (!source) return;
  const dimensions = sourceDimensions(source);
  if (!dimensions || style.objectFit === "fill") {
    context.drawImage(source, 0, 0, width, height);
    return;
  }
  const scale =
    style.objectFit === "contain"
      ? Math.min(width / dimensions.width, height / dimensions.height)
      : Math.max(width / dimensions.width, height / dimensions.height);
  const drawWidth = dimensions.width * scale;
  const drawHeight = dimensions.height * scale;
  context.drawImage(
    source,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

function drawChildren(
  context: CanvasRenderingContext2D,
  parent: NodeMirror,
  width: number,
  height: number,
  images: ReadonlyMap<string, ImageRecord>,
): void {
  const style = parent.style;
  const children = sortNodes(parent.children).filter(
    (child) => child.type !== "#text" && child.type !== "#comment",
  );
  const direction = style.flexDirection ?? "column";
  const paddingLeft = style.paddingLeft ?? style.padding ?? 0;
  const paddingRight = style.paddingRight ?? style.padding ?? 0;
  const paddingTop = style.paddingTop ?? style.padding ?? 0;
  const paddingBottom = style.paddingBottom ?? style.padding ?? 0;
  const relative = children.filter((child) => child.style.position !== "absolute");
  const gap = style.gap ?? 0;
  const available =
    direction === "row" ? width - paddingLeft - paddingRight : height - paddingTop - paddingBottom;
  const occupied = relative.reduce(
    (total, child) =>
      total +
      (direction === "row"
        ? (child.style.width ?? 0)
        : (child.style.height ?? child.style.lineHeight ?? child.style.fontSize ?? 0)),
    0,
  );
  const baseGaps = Math.max(0, relative.length - 1) * gap;
  let cursor = justifyOffset(style.justifyContent, available, occupied + baseGaps);
  const resolvedGap =
    style.justifyContent === "space-between" && relative.length > 1
      ? (available - occupied) / (relative.length - 1)
      : gap;

  for (const child of children) {
    let childX = 0;
    let childY = 0;
    if (child.style.position !== "absolute") {
      const childWidth = child.style.width ?? width - paddingLeft - paddingRight;
      const childHeight = child.style.height ?? child.style.lineHeight ?? child.style.fontSize ?? 0;
      if (direction === "row") {
        childX = paddingLeft + cursor;
        childY =
          paddingTop +
          crossOffset(style.alignItems, height - paddingTop - paddingBottom, childHeight);
        cursor += childWidth + resolvedGap;
      } else {
        childX =
          paddingLeft +
          crossOffset(style.alignItems, width - paddingLeft - paddingRight, childWidth);
        childY = paddingTop + cursor;
        cursor += childHeight + resolvedGap;
      }
    }
    drawNode(context, child, width, height, childX, childY, images);
  }
}

function textContent(node: NodeMirror): string {
  return node.children
    .map((child) => (child.type === "#text" ? (child.text ?? "") : textContent(child)))
    .join("");
}

function roundedRect(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
): void {
  const value = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(value, 0);
  context.lineTo(width - value, 0);
  context.quadraticCurveTo(width, 0, width, value);
  context.lineTo(width, height - value);
  context.quadraticCurveTo(width, height, width - value, height);
  context.lineTo(value, height);
  context.quadraticCurveTo(0, height, 0, height - value);
  context.lineTo(0, value);
  context.quadraticCurveTo(0, 0, value, 0);
  context.closePath();
}

function sourceDimensions(
  source: CanvasImageSource,
): { width: number; height: number } | undefined {
  if ("naturalWidth" in source) return { width: source.naturalWidth, height: source.naturalHeight };
  if ("videoWidth" in source) return { width: source.videoWidth, height: source.videoHeight };
  if ("width" in source && "height" in source) {
    return { width: Number(source.width), height: Number(source.height) };
  }
  return undefined;
}

function resolveSize(
  value: number | undefined,
  fallback: number,
  minimum?: number,
  maximum?: number,
): number {
  return Math.min(maximum ?? Number.POSITIVE_INFINITY, Math.max(minimum ?? 0, value ?? fallback));
}

function justifyOffset(
  justify: HostStyle["justifyContent"],
  available: number,
  content: number,
): number {
  if (justify === "center") return (available - content) / 2;
  if (justify === "end") return available - content;
  return 0;
}

function crossOffset(align: HostStyle["alignItems"], available: number, child: number): number {
  if (align === "center") return (available - child) / 2;
  if (align === "end") return available - child;
  return 0;
}

function sortNodes(nodes: readonly NodeMirror[]): NodeMirror[] {
  return [...nodes].sort((left, right) => (left.style.zIndex ?? 0) - (right.style.zIndex ?? 0));
}

function visit(node: NodeMirror, callback: (node: NodeMirror) => void): void {
  callback(node);
  for (const child of node.children) visit(child, callback);
}

function hasDrawableNode(node: NodeMirror): boolean {
  return (
    node.type === "view" ||
    node.type === "text" ||
    node.type === "image" ||
    node.children.some(hasDrawableNode)
  );
}

function isCanvas2DContext(value: unknown): value is CanvasRenderingContext2D {
  return (
    typeof value === "object" && value !== null && "clearRect" in value && "drawImage" in value
  );
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
