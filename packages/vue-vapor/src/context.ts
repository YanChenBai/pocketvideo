import {
  inject,
  onScopeDispose,
  shallowRef,
  watchEffect,
  type InjectionKey,
  type ShallowRef,
} from "vue";
import type { VideoScene } from "./scene.ts";
import type { VideoFrameState, VideoNodeKind, VideoNodeStyle, VideoSceneNode } from "./types.ts";

export const sceneKey: InjectionKey<VideoScene> = Symbol("pocketvideo-scene");
export const frameKey: InjectionKey<ShallowRef<VideoFrameState<unknown>>> =
  Symbol("pocketvideo-frame");
export const parentNodeKey: InjectionKey<VideoSceneNode> = Symbol("pocketvideo-parent-node");

export function useVideoFrame<T>(): ShallowRef<VideoFrameState<T>> {
  const frame = inject(frameKey);
  if (!frame) throw new Error("useVideoFrame() must run inside a PocketVideoSurface.");
  return frame as ShallowRef<VideoFrameState<T>>;
}

export function useVideoNode(
  kind: VideoNodeKind,
  read: () => { readonly style: VideoNodeStyle; readonly text?: string },
): VideoSceneNode {
  const scene = inject(sceneKey);
  if (!scene) throw new Error("Video components must run inside a PocketVideoSurface.");
  const parent = inject(parentNodeKey, undefined);
  const node = scene.create(kind, parent);
  watchEffect(() => {
    const next = read();
    scene.update(node, next.style, next.text);
  });
  onScopeDispose(() => scene.remove(node));
  return node;
}

export function emptyFrame<T>(data: T): ShallowRef<VideoFrameState<T>> {
  return shallowRef({ frame: 0, fps: 30, time: 0, data });
}
