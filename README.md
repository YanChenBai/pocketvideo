# PocketVideo

[English](./README.en.md) | 简体中文

一个受 PocketJS 启发的确定性、渲染器无关视频渲染框架，使用 TypeScript、
Vite+ 和 Bun 构建。

> 项目目前处于早期开发阶段。确定性时间轴、浏览器预览、Node/Skia 像素渲染和
> 基础 FFmpeg 视频编码已经可以端到端运行；媒体解码与音频混音仍在规划中。

## 核心目标

- 使用 Vue Vapor、Solid 或其他声明式组件描述视频画面。
- 不依赖浏览器时钟，支持确定性的任意帧渲染。
- 将渲染核心、音频轨、视频轨和编码器保持为独立包。
- 支持 GSAP、Motion 风格动画，但由 PocketVideo 统一控制播放头。
- 为并行渲染、分片渲染和原生 GPU 后端保留扩展能力。

## 当前能力

- 精确的有理数帧率与时间戳，包括 `30000/1001`。
- Composition 与左闭右开的轨道区间。
- `inPoint`、`playbackRate` 和轨道局部时间映射。
- 稳定的画面层级排序。
- 面向 GSAP、Motion 和原生动画的无时钟 `AnimationDriver` 协议。
- 渲染器无关、类型安全的 `TrackOutput`。
- 基于 `skia-canvas`（非 `@napi-rs/canvas`）的 Node Canvas2D 渲染器。
- 单帧 PNG、Raw RGBA 帧，以及通过 FFmpeg stdin 直出的 H.264 MP4。

## 仓库结构

```text
packages/
  core/       确定性时间轴与轨道协议
  renderer-skia/ Node/Skia Canvas2D 与 PNG、RGBA 输出
  exporter-ffmpeg/ Raw RGBA 到 FFmpeg 的编码管道
  video/      视频与图片轨道（计划中）
  audio/      音频轨道与混音（计划中）
apps/
  demo/       Canvas 实时预览与时间轴检查器
tools/
  render-skia/ 将同一 Demo composition 导出为 PNG 或 MP4
```

## 示例

```ts
import { defineComposition, frameRate, type Track, type TrackOutput } from "@pocketvideo/core";

interface TextLayer extends TrackOutput {
  type: "text";
  text: string;
}

const title: Track<TextLayer> = {
  id: "title",
  startFrame: 30,
  durationInFrames: 60,
  layer: 10,
  evaluate: ({ localFrame, properties }) => ({
    type: "text",
    text: `Local frame ${localFrame}, opacity ${properties.get("opacity") ?? 1}`,
  }),
};

const composition = defineComposition(
  {
    id: "main",
    width: 1920,
    height: 1080,
    frameRate: frameRate(30),
    durationInFrames: 300,
  },
  [title],
);

const frame = await composition.renderFrame(45);
```

## 交互式演示

仓库内置了一个基于现有核心的网页 Demo。它将 Composition 的轨道输出分发到
独立布局：OGL/WebGL 布局绘制 Aurora Shader，Canvas2D 布局绘制文字、卡片和
时间轴。两个布局由同一个确定性播放头控制，并提供播放、逐帧、拖拽时间轴和
活动轨道检查器。

```bash
bun install
bun run dev
```

打开终端中显示的本地地址即可预览。空格键控制播放或暂停，左右方向键用于逐帧。

## Node / Skia 导出

Node 渲染不启动浏览器。`render-skia` 读取与网页 Demo 相同的 Composition，使用
Skia 绘制服务端 Aurora layout 和共享 Canvas2D overlay。每次调用都由指定帧号
求值，因此预览、PNG 和 MP4 使用同一个确定性时间轴。

```bash
# 第 120 帧 PNG
bun run render:image -- --frame 120

# 完整 10 秒 / 300 帧 MP4
bun run render:video

# 只编码一段，便于快速验证
bun run render:video -- --from 60 --frames 90 --output artifacts/clip.mp4
```

视频链路为：

```text
Composition frame → Skia Canvas2D → packed RGBA Buffer
                  → FFmpeg stdin (rawvideo/rgba) → H.264/yuv420p MP4
```

FFmpeg 按显式 `--ffmpeg`、`POCKETVIDEO_FFMPEG_PATH`、自定义
`FfmpegBinaryProvider`、系统 `PATH` 的顺序查找。仓库不直接捆绑大型平台二进制，
但 provider 接口允许宿主接入随应用分发的 FFmpeg。Skia 视频导出默认使用 CPU
后端，以避免逐帧读取 RGBA 时产生额外的 GPU 到 CPU 回读。

动画适配器需要实现：

```ts
interface AnimationDriver {
  evaluate(time: Time, sink: AnimationPropertySink): void;
  dispose?(): void;
}
```

适配器本身不能持有实时播放时钟。例如 GSAP 适配器应创建暂停的 Timeline，
根据 `time` 主动移动播放头，再将计算结果写入 `sink`。

## 开发

需要 Bun 1.3.14 和 Vite+ 0.2.5。

```bash
bun install
bun run ready
```

`ready` 会依次执行格式检查、Lint、类型检查、单元测试和构建。

## 路线图

- [x] 精确时间与帧率模型
- [x] Composition 与通用轨道协议
- [x] 动画驱动协议
- [ ] 视频与图片轨道
- [ ] 音频轨道与混音
- [x] Node/Skia Canvas2D 渲染后端
- [ ] Vue Vapor 与 Solid 组件适配器
- [ ] GSAP 与 Motion 适配器
- [x] Raw RGBA/FFmpeg 基础导出器
- [x] 基础 Canvas 实时预览
- [ ] 完整开发工具

## 许可证

[MIT](./LICENSE) © PocketVideo contributors
