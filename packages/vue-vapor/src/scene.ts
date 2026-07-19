import type {
  VideoAlign,
  VideoNodeKind,
  VideoNodeStyle,
  VideoPoint,
  VideoSceneNode,
} from "./types.ts";

export class VideoScene {
  private nextId = 1;
  private readonly nodes = new Map<number, VideoSceneNode>();
  private readonly images = new Map<string, Promise<CanvasImageSource>>();

  create(kind: VideoNodeKind, parent?: VideoSceneNode): VideoSceneNode {
    const node: VideoSceneNode = {
      id: this.nextId++,
      kind,
      parentId: parent?.id,
      children: [],
      style: {},
    };
    this.nodes.set(node.id, node);
    parent?.children.push(node);
    return node;
  }

  update(node: VideoSceneNode, style: VideoNodeStyle, text?: string): void {
    node.style = { ...style };
    node.text = text;
  }

  remove(node: VideoSceneNode): void {
    const parent = node.parentId === undefined ? undefined : this.nodes.get(node.parentId);
    if (parent) {
      const index = parent.children.indexOf(node);
      if (index >= 0) parent.children.splice(index, 1);
    }
    while (node.children[0]) this.remove(node.children[0]);
    this.nodes.delete(node.id);
  }

  snapshot(): readonly VideoSceneNode[] {
    return flattenNodes(this.roots()).map(cloneNode);
  }

  async prepare(): Promise<void> {
    const pending: Promise<CanvasImageSource>[] = [];
    for (const node of this.nodes.values()) {
      const source = node.style.source;
      if (node.kind === "image" && typeof source === "string") {
        pending.push(this.loadImage(source));
      }
    }
    await Promise.all(pending);
  }

  draw(context: CanvasRenderingContext2D, width: number, height: number): void {
    context.clearRect(0, 0, width, height);
    for (const node of sortNodes(this.roots())) {
      drawNode(this, context, node, width, height, 0, 0);
    }
  }

  resolveImage(source: string | CanvasImageSource | undefined): CanvasImageSource | undefined {
    if (typeof source !== "string") return source;
    const loaded = this.images.get(source) as ImagePromise | undefined;
    return loaded?.value;
  }

  private roots(): VideoSceneNode[] {
    return [...this.nodes.values()].filter((node) => node.parentId === undefined);
  }

  private loadImage(source: string): Promise<CanvasImageSource> {
    const existing = this.images.get(source);
    if (existing) return existing;
    if (typeof Image === "undefined") {
      return Promise.reject(new Error(`Image loading requires a DOM host: ${source}`));
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    const promise = new Promise<CanvasImageSource>((resolve, reject) => {
      image.addEventListener("load", () => {
        (promise as ImagePromise).value = image;
        resolve(image);
      });
      image.addEventListener("error", () => reject(new Error(`Unable to load image: ${source}`)));
    }) as ImagePromise;
    image.src = source;
    this.images.set(source, promise);
    return promise;
  }
}

interface ImagePromise extends Promise<CanvasImageSource> {
  value?: CanvasImageSource;
}

function drawNode(
  scene: VideoScene,
  context: CanvasRenderingContext2D,
  node: VideoSceneNode,
  parentWidth: number,
  parentHeight: number,
  layoutX: number,
  layoutY: number,
): void {
  const style = node.style;
  const x = layoutX + (style.x ?? 0);
  const y = layoutY + (style.y ?? 0);
  const width = style.width ?? parentWidth;
  const height = style.height ?? parentHeight;

  context.save();
  context.globalAlpha *= clamp(style.opacity ?? 1, 0, 1);
  context.translate(x + (style.translateX ?? 0), y + (style.translateY ?? 0));
  if (style.rotate) context.rotate((style.rotate * Math.PI) / 180);
  if (style.scale !== undefined) context.scale(style.scale, style.scale);
  context.shadowColor = style.shadowColor ?? "transparent";
  context.shadowBlur = style.shadowBlur ?? 0;
  if (style.filter) context.filter = style.filter;
  if (style.blendMode) context.globalCompositeOperation = style.blendMode;
  if (style.clip) {
    roundedRect(context, 0, 0, width, height, style.radius ?? 0);
    context.clip();
  }

  switch (node.kind) {
    case "stage":
    case "rect":
      drawRect(context, width, height, style);
      break;
    case "circle":
      drawCircle(context, width, height, style);
      break;
    case "ellipse":
      drawEllipse(context, width, height, style);
      break;
    case "line":
      drawLine(context, width, height, style);
      break;
    case "path":
      drawPath(context, style);
      break;
    case "text":
      drawText(context, node.text ?? "", width, style);
      break;
    case "image":
      drawImage(context, scene.resolveImage(style.source), width, height, style);
      break;
    case "custom":
      style.draw?.(context, { width, height });
      break;
    case "progress":
      drawProgress(context, width, height, style);
      break;
    case "grid":
      drawGrid(context, width, height, style);
      break;
    case "aurora":
      drawAurora(context, width, height, style);
      break;
    case "group":
      break;
  }

  drawChildren(scene, context, node, width, height);
  context.restore();
}

function drawChildren(
  scene: VideoScene,
  context: CanvasRenderingContext2D,
  parent: VideoSceneNode,
  width: number,
  height: number,
): void {
  const children = sortNodes(parent.children);
  const layout = parent.style.layout ?? "none";
  const padding = parent.style.padding ?? 0;
  const gap = parent.style.gap ?? 0;
  const relative = children.filter((child) => child.style.position !== "absolute");
  const mainAvailable = (layout === "row" ? width : height) - padding * 2;
  const mainSize = relative.reduce(
    (total, child) =>
      total + (layout === "row" ? (child.style.width ?? 0) : (child.style.height ?? 0)),
    0,
  );
  const totalGap = Math.max(0, relative.length - 1) * gap;
  let cursor = justifyOffset(parent.style.justify, mainAvailable, mainSize + totalGap);
  const resolvedGap =
    parent.style.justify === "space-between" && relative.length > 1
      ? (mainAvailable - mainSize) / (relative.length - 1)
      : gap;

  for (const child of children) {
    let layoutX = 0;
    let layoutY = 0;
    if (layout !== "none" && child.style.position !== "absolute") {
      if (layout === "row") {
        layoutX = padding + cursor;
        layoutY =
          padding + crossOffset(parent.style.align, height - padding * 2, child.style.height ?? 0);
        cursor += (child.style.width ?? 0) + resolvedGap;
      } else {
        layoutX =
          padding + crossOffset(parent.style.align, width - padding * 2, child.style.width ?? 0);
        layoutY = padding + cursor;
        cursor += (child.style.height ?? 0) + resolvedGap;
      }
    }
    drawNode(scene, context, child, width, height, layoutX, layoutY);
  }
}

function drawRect(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: VideoNodeStyle,
): void {
  roundedRect(context, 0, 0, width, height, style.radius ?? 0);
  context.fillStyle = fillStyle(context, width, height, style);
  context.fill();
  strokeCurrentPath(context, style);
}

function drawCircle(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: VideoNodeStyle,
): void {
  const radius = Math.min(width, height) / 2;
  context.beginPath();
  context.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
  context.fillStyle = fillStyle(context, width, height, style);
  context.fill();
  strokeCurrentPath(context, style);
}

function drawEllipse(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: VideoNodeStyle,
): void {
  context.beginPath();
  context.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  context.fillStyle = fillStyle(context, width, height, style);
  context.fill();
  strokeCurrentPath(context, style);
}

function drawLine(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: VideoNodeStyle,
): void {
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(width, height);
  applyStroke(context, style);
  context.stroke();
}

function drawPath(context: CanvasRenderingContext2D, style: VideoNodeStyle): void {
  if (style.points?.length) {
    drawPoints(context, style.points, style.closePath ?? false);
    if (style.fill) {
      context.fillStyle = style.fill;
      context.fill();
    }
    applyStroke(context, style);
    context.stroke();
    return;
  }
  if (!style.path || typeof Path2D === "undefined") return;
  const path = new Path2D(style.path);
  if (style.fill) {
    context.fillStyle = style.fill;
    context.fill(path);
  }
  applyStroke(context, style);
  context.stroke(path);
}

function drawPoints(
  context: CanvasRenderingContext2D,
  points: readonly VideoPoint[],
  close: boolean,
): void {
  const first = points[0];
  if (!first) return;
  context.beginPath();
  context.moveTo(first[0], first[1]);
  for (const point of points.slice(1)) context.lineTo(point[0], point[1]);
  if (close) context.closePath();
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  width: number,
  style: VideoNodeStyle,
): void {
  const size = style.fontSize ?? 16;
  context.fillStyle = style.color ?? style.fill ?? "#ffffff";
  context.font = `${style.fontWeight ?? 400} ${size}px ${style.fontFamily ?? "Inter, ui-sans-serif, system-ui, sans-serif"}`;
  context.textBaseline = "top";
  context.textAlign = style.textAlign ?? "left";
  const x = context.textAlign === "center" ? width / 2 : context.textAlign === "right" ? width : 0;
  const lineHeight = style.lineHeight ?? size * 1.2;
  const lines = style.wrap && width > 0 ? wrapText(context, text, width) : text.split("\n");
  const maxLines = style.maxLines ?? lines.length;
  for (const [index, original] of lines.slice(0, maxLines).entries()) {
    const clipped = index === maxLines - 1 && lines.length > maxLines;
    const line = clipped ? fitEllipsis(context, original, width, style.ellipsis ?? "…") : original;
    context.fillText(line, x, index * lineHeight);
  }
}

function drawImage(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource | undefined,
  width: number,
  height: number,
  style: VideoNodeStyle,
): void {
  if (!source) return;
  context.imageSmoothingEnabled = style.smoothing ?? true;
  const dimensions = sourceDimensions(source);
  if (!dimensions || style.fit === "fill") {
    context.drawImage(source, 0, 0, width, height);
    return;
  }
  const scale =
    style.fit === "contain"
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

function drawProgress(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: VideoNodeStyle,
): void {
  const radius = style.radius ?? height / 2;
  roundedRect(context, 0, 0, width, height, radius);
  context.fillStyle = style.trackColor ?? "rgba(255,255,255,0.14)";
  context.fill();
  const progressWidth = Math.max(height, width * clamp(style.progress ?? 0, 0, 1));
  roundedRect(context, 0, 0, progressWidth, height, radius);
  context.fillStyle = fillStyle(context, width, height, style);
  context.fill();
}

function drawGrid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: VideoNodeStyle,
): void {
  const columns = Math.max(1, style.columns ?? 12);
  const rows = Math.max(1, style.rows ?? 8);
  context.beginPath();
  for (let column = 0; column <= columns; column += 1) {
    const x = (column / columns) * width;
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = (row / rows) * height;
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.strokeStyle = style.lineColor ?? "rgba(255,255,255,0.06)";
  context.lineWidth = style.lineWidth ?? 1;
  context.stroke();
}

function drawAurora(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: VideoNodeStyle,
): void {
  const phase = style.phase ?? 0;
  const centerX = width * (0.68 + Math.sin(phase) * 0.08);
  const centerY = height * (0.2 + Math.cos(phase * 0.7) * 0.06);
  const radius = Math.max(width, height) * 0.62;
  const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, style.fill ?? "rgba(139,92,246,0.55)");
  gradient.addColorStop(0.45, style.fillTo ?? "rgba(34,211,238,0.18)");
  gradient.addColorStop(1, "rgba(8,7,15,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function fillStyle(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: VideoNodeStyle,
): string | CanvasGradient {
  if (!style.fillTo) return style.fill ?? "transparent";
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, style.fill ?? "transparent");
  gradient.addColorStop(1, style.fillTo);
  return gradient;
}

function strokeCurrentPath(context: CanvasRenderingContext2D, style: VideoNodeStyle): void {
  if ((style.borderWidth ?? style.strokeWidth ?? 0) <= 0) return;
  applyStroke(context, style);
  context.stroke();
}

function applyStroke(context: CanvasRenderingContext2D, style: VideoNodeStyle): void {
  context.strokeStyle = style.stroke ?? style.borderColor ?? "transparent";
  context.lineWidth = style.strokeWidth ?? style.borderWidth ?? 1;
  context.lineCap = style.lineCap ?? "butt";
  context.lineJoin = style.lineJoin ?? "miter";
}

function wrapText(context: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const segment of paragraph.split(/(?<=\s)|(?=\s)/u)) {
      const candidate = line + segment;
      if (line && context.measureText(candidate).width > width) {
        lines.push(line.trimEnd());
        line = segment.trimStart();
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

function fitEllipsis(
  context: CanvasRenderingContext2D,
  value: string,
  width: number,
  ellipsis: string,
): string {
  let result = value;
  while (result && context.measureText(result + ellipsis).width > width)
    result = result.slice(0, -1);
  return result + ellipsis;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, Math.min(radius, width / 2, height / 2));
}

function justifyOffset(
  justify: VideoNodeStyle["justify"],
  available: number,
  content: number,
): number {
  if (justify === "center") return (available - content) / 2;
  if (justify === "end") return available - content;
  return 0;
}

function crossOffset(align: VideoAlign | undefined, available: number, child: number): number {
  if (align === "center") return (available - child) / 2;
  if (align === "end") return available - child;
  return 0;
}

function sortNodes(nodes: readonly VideoSceneNode[]): VideoSceneNode[] {
  return [...nodes].sort((left, right) => (left.style.zIndex ?? 0) - (right.style.zIndex ?? 0));
}

function flattenNodes(nodes: readonly VideoSceneNode[]): VideoSceneNode[] {
  return sortNodes(nodes).flatMap((node) => [node, ...flattenNodes(node.children)]);
}

function cloneNode(node: VideoSceneNode): VideoSceneNode {
  return {
    ...node,
    children: node.children.map(cloneNode),
    style: { ...node.style },
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
