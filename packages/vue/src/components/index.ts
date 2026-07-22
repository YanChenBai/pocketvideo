import type { DefineComponent, DefineSetupFnComponent } from "vue";
import CanvasComponent from "./Canvas.vue";
import ImageComponent from "./Image.vue";
import TextComponent from "./Text.vue";
import ViewComponent from "./View.vue";
import type { CanvasProps, ImageProps, TextProps, ViewProps } from "./types.ts";

export const Canvas = CanvasComponent as DefineComponent<CanvasProps>;
export const View = ViewComponent as DefineSetupFnComponent<ViewProps>;
export const Text = TextComponent as DefineSetupFnComponent<TextProps>;
export const Image = ImageComponent as unknown as DefineSetupFnComponent<ImageProps>;

export type { CanvasProps, CommonProps, ImageProps, TextProps, ViewProps } from "./types.ts";
export type { NodeMirror } from "../node.ts";
