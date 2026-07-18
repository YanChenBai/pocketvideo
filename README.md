# PocketVideo

[English](./README.en.md) | 简体中文

一个受 PocketJS 启发的确定性、渲染器无关视频渲染框架，使用 TypeScript、
Vite+ 和 Bun 构建。

> 项目目前处于早期开发阶段，现阶段仅实现时间轴核心，尚不包含像素渲染、
> 媒体解码与视频编码。

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

## 仓库结构

```text
packages/
  core/       确定性时间轴与轨道协议
  video/      视频与图片轨道（计划中）
  audio/      音频轨道与混音（计划中）
  exporter/   渲染与编码调度（计划中）
apps/
  demo/       Canvas 实时预览与时间轴检查器
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

仓库内置了一个基于现有核心的网页 Demo。它将 Composition 的轨道输出绘制到
Canvas，并提供播放、逐帧、拖拽时间轴和活动轨道检查器。

```bash
bun install
bun run dev
```

打开终端中显示的本地地址即可预览。空格键控制播放或暂停，左右方向键用于逐帧。

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
- [ ] PocketJS/Rust 渲染后端
- [ ] Vue Vapor 与 Solid 组件适配器
- [ ] GSAP 与 Motion 适配器
- [ ] FFmpeg 导出器
- [x] 基础 Canvas 实时预览
- [ ] 完整开发工具

## 许可证

[MIT](./LICENSE) © PocketVideo contributors
