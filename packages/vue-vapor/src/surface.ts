import { createVaporApp, nextTick, shallowRef, type ShallowRef, type VaporComponent } from "vue";
import { frameKey, sceneKey } from "./context.ts";
import { VideoScene } from "./scene.ts";
import type { VideoFrameState } from "./types.ts";

export interface PocketVideoSurfaceOptions<T> {
  readonly component: VaporComponent;
  readonly context: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly initialData: T;
}

export class PocketVideoSurface<T> {
  readonly scene = new VideoScene();
  readonly frame: ShallowRef<VideoFrameState<T>>;
  private context: CanvasRenderingContext2D;
  private readonly width: number;
  private readonly height: number;
  private readonly fps: number;
  private readonly app;
  private readonly mountTarget: HTMLDivElement;

  constructor(options: PocketVideoSurfaceOptions<T>) {
    this.context = options.context;
    this.width = options.width;
    this.height = options.height;
    this.fps = options.fps;
    this.frame = shallowRef({ frame: 0, fps: options.fps, time: 0, data: options.initialData });
    this.mountTarget = document.createElement("div");
    this.app = createVaporApp(options.component);
    this.app.provide(sceneKey, this.scene);
    this.app.provide(frameKey, this.frame as ShallowRef<VideoFrameState<unknown>>);
    this.app.mount(this.mountTarget);
  }

  setContext(context: CanvasRenderingContext2D): void {
    this.context = context;
  }

  async renderFrame(frame: number, data: T): Promise<void> {
    this.frame.value = {
      frame,
      fps: this.fps,
      time: frame / this.fps,
      data,
    };
    await nextTick();
    await this.scene.prepare();
    this.scene.draw(this.context, this.width, this.height);
  }

  dispose(): void {
    this.app.unmount();
  }
}
