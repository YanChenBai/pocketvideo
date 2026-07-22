import type { NodeRef } from "../node.ts";
import type { InlineStyle } from "../styles.ts";

export interface CommonProps {
  readonly class?: string;
  readonly style?: InlineStyle;
  readonly nodeRef?: NodeRef;
  readonly debugName?: string;
}

export interface ViewProps extends CommonProps {
  readonly focusable?: boolean;
  readonly onPress?: () => void;
}

export interface TextProps extends CommonProps {}

export interface ImageProps extends CommonProps {
  readonly src: string;
}

export interface CanvasProps {
  readonly width: number;
  readonly height: number;
}

export const commonProps = ["class", "style", "nodeRef", "debugName"] as const;
