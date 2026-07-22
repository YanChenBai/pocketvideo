export type FlexDirection = "row" | "column";
export type Align = "start" | "center" | "end" | "stretch";
export type Justify = Align | "space-between";

export interface HostStyle {
  display?: "flex" | "none";
  position?: "relative" | "absolute";
  flexDirection?: FlexDirection;
  alignItems?: Align;
  justifyContent?: Justify;
  gap?: number;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  left?: number;
  top?: number;
  padding?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  backgroundColor?: string;
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  lineHeight?: number;
  textAlign?: "left" | "center" | "right";
  objectFit?: "fill" | "contain" | "cover";
  overflow?: "visible" | "hidden";
  translateX?: number;
  translateY?: number;
  scale?: number;
  rotate?: number;
  zIndex?: number;
}

export type StyleKey = keyof HostStyle;
export type InlineStyle = Readonly<HostStyle>;

export interface CompiledStyle {
  readonly base: InlineStyle;
  readonly focus?: InlineStyle;
  readonly active?: InlineStyle;
}

export type StyleTable = Readonly<Record<string, CompiledStyle>>;

export interface StyleState {
  readonly focused: boolean;
  readonly active: boolean;
}

const STYLE_KEYS = new Set<StyleKey>([
  "display",
  "position",
  "flexDirection",
  "alignItems",
  "justifyContent",
  "gap",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "left",
  "top",
  "padding",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "paddingBottom",
  "backgroundColor",
  "color",
  "opacity",
  "borderColor",
  "borderWidth",
  "borderRadius",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "textAlign",
  "objectFit",
  "overflow",
  "translateX",
  "translateY",
  "scale",
  "rotate",
  "zIndex",
]);

export function defineStyles<const Table extends StyleTable>(table: Table): Table {
  for (const [className, style] of Object.entries(table)) {
    if (!className.trim()) throw new TypeError("Style class names must not be empty.");
    validateStyle(style.base);
    if (style.focus) validateStyle(style.focus);
    if (style.active) validateStyle(style.active);
  }
  return table;
}

export class StyleRegistry {
  private readonly styles = new Map<string, CompiledStyle>();

  constructor(table: StyleTable = {}) {
    this.register(table);
  }

  register(table: StyleTable): void {
    defineStyles(table);
    for (const [className, style] of Object.entries(table)) {
      this.styles.set(className, style);
      this.styles.set(canonicalClassName(className), style);
    }
  }

  resolve(
    className: string | undefined,
    inline: InlineStyle | undefined,
    state: StyleState,
  ): HostStyle {
    const compiled = className ? this.lookup(className) : undefined;
    if (inline) validateStyle(inline);
    return {
      ...compiled?.base,
      ...(state.focused ? compiled?.focus : undefined),
      ...(state.active ? compiled?.active : undefined),
      ...inline,
    };
  }

  private lookup(className: string): CompiledStyle {
    const style = this.styles.get(className) ?? this.styles.get(canonicalClassName(className));
    if (!style) {
      throw new TypeError(`Unknown compiled class literal: ${JSON.stringify(className)}`);
    }
    return style;
  }
}

export function validateStyle(style: InlineStyle): void {
  for (const key of Object.keys(style)) {
    if (!STYLE_KEYS.has(key as StyleKey)) {
      throw new TypeError(`Unknown PocketVideo style property: ${key}`);
    }
  }
}

function canonicalClassName(className: string): string {
  return className.trim().split(/\s+/u).sort().join(" ");
}
