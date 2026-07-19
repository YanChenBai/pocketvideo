export interface VideoFrameState<T> {
  readonly frame: number;
  readonly fps: number;
  readonly time: number;
  readonly data: T;
}

export type VideoNodeKind =
  | "stage"
  | "group"
  | "rect"
  | "circle"
  | "ellipse"
  | "line"
  | "path"
  | "text"
  | "image"
  | "custom"
  | "progress"
  | "grid"
  | "aurora";

export type VideoLayout = "none" | "row" | "column";
export type VideoAlign = "start" | "center" | "end";
export type VideoFit = "fill" | "contain" | "cover";
export type VideoPoint = readonly [x: number, y: number];
export type VideoDrawCallback = (
  context: CanvasRenderingContext2D,
  box: { readonly width: number; readonly height: number },
) => void;

export interface VideoNodeStyle {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  fillTo?: string;
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  textAlign?: CanvasTextAlign;
  lineHeight?: number;
  translateX?: number;
  translateY?: number;
  scale?: number;
  rotate?: number;
  shadowColor?: string;
  shadowBlur?: number;
  filter?: string;
  blendMode?: GlobalCompositeOperation;
  clip?: boolean;
  layout?: VideoLayout;
  position?: "relative" | "absolute";
  gap?: number;
  padding?: number;
  align?: VideoAlign;
  justify?: VideoAlign | "space-between";
  progress?: number;
  trackColor?: string;
  columns?: number;
  rows?: number;
  lineColor?: string;
  lineWidth?: number;
  phase?: number;
  source?: string | CanvasImageSource;
  fit?: VideoFit;
  smoothing?: boolean;
  path?: string;
  points?: readonly VideoPoint[];
  closePath?: boolean;
  stroke?: string;
  strokeWidth?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  wrap?: boolean;
  maxLines?: number;
  ellipsis?: string;
  draw?: VideoDrawCallback;
  zIndex?: number;
}

export interface VideoSceneNode {
  readonly id: number;
  readonly kind: VideoNodeKind;
  parentId?: number;
  readonly children: VideoSceneNode[];
  text?: string;
  style: VideoNodeStyle;
}
