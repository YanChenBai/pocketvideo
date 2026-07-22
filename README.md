# PocketVideo

[English](./README.en.md) | 简体中文

一个受 PocketJS 启发的确定性、渲染器无关视频渲染框架，使用 TypeScript、
Vite+ 和 Bun 构建。

> 项目目前处于早期开发阶段。确定性时间轴、浏览器预览、Node/Skia 像素渲染和
> 基础 FFmpeg 视频编码已经可以端到端运行；媒体解码与音频混音仍在规划中。

## 核心目标

- 使用 Vue 或其他声明式组件描述视频画面。
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
- 基于 WebCodecs 与 Mediabunny 的浏览器原生 Canvas 到 H.264 MP4 导出。
- Vue custom renderer 绑定，公开与 PocketJS 一致的 `View`、`Text`、`Image` 基础原语。
- 支持普通 Vue SFC、响应式逐帧更新、样式表、焦点顺序、`onPress` 冒泡和键盘输入。
- 特殊根 `Canvas` 与 `CanvasSurface`，同一组件树可切换浏览器或 Node Canvas。

## 仓库结构

```text
packages/
  core/       确定性时间轴与轨道协议
  canvas/     跨平台 Canvas 协议与可选的 Node/Skia 子入口
  exporter/   FFmpeg 与 WebCodecs 平台导出入口
  vue/        Vue host 绑定：View、Text、Image、样式与基础焦点事件
  video/      视频与图片轨道（计划中）
  audio/      音频轨道与混音（计划中）
apps/
  demo/       Canvas 实时预览与时间轴检查器
  webcodecs-demo/ 独立浏览器原生 MP4 导出演示
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

仓库内置了一个基于现有核心的网页 Demo。视频画面本身由普通 Vue SFC 编写；
custom renderer 将响应式组件映射为 PocketVideo 的 `View`、`Text`、`Image` 节点树，
Canvas Surface 再按固定分辨率绘制。播放、逐帧、拖拽时间轴和活动轨道
检查器仍由同一个确定性播放头控制。

```bash
bun install
bun run dev
```

打开终端中显示的本地地址即可预览。空格键控制播放或暂停，左右方向键用于逐帧。

### Vue SFC 与基础原语

SFC 构建属于应用层，可使用标准 Vue 插件：

```ts
import vue from "@vitejs/plugin-vue";

export default {
  plugins: [vue()],
};
```

视频组件只组合三个宿主原语；矩形、圆角卡片、进度条等都由 `View` 的样式表达：

```vue
<script setup lang="ts">
import { Text, View } from "@pocketvideo/vue";

defineProps<{ title: string; opacity: number }>();
</script>

<template>
  <View
    :style="{
      position: 'absolute',
      left: 72,
      top: 96,
      width: 420,
      height: 180,
      opacity,
      borderRadius: 24,
      backgroundColor: '#18142a',
      padding: 24,
    }"
  >
    <Text :style="{ color: '#fff', fontSize: 42 }">{{ title }}</Text>
  </View>
</template>
```

`View` 是容器和唯一可聚焦节点，`Text` 显示文本，`Image` 引用图片。它们不是浏览器
HTML/CSS 的完整复刻；固定的样式集合由 Canvas backend 确定性绘制。

`CanvasSurface` 在创建时接收固定的 `width`、`height` 与 `fps`。同一棵组件
场景树可以切换目标 Canvas，因此 WebCodecs 导出无需重新实现一套画面渲染逻辑。

Composition 使用特殊的根 `<Canvas>` 组件，但它向模板 ref 暴露的是普通 Canvas 接口。
可以继续使用 Vue 原生的 `useTemplateRef`、`watchEffect` 和 `onScopeDispose`，并自由选择
Canvas2D、OGL 或宿主支持的其他绘图上下文：

```vue
<script setup lang="ts">
import type { CanvasRef } from "@pocketvideo/vue";
import { Canvas, useFPS, useFrame } from "@pocketvideo/vue";
import { useTemplateRef } from "vue";

const canvas = useTemplateRef<CanvasRef>("canvas");
const fps = useFPS();
const frame = useFrame();
</script>

<template>
  <Canvas ref="canvas" :width="1920" :height="1080" />
</template>
```

`useFPS()` 等函数读取当前 Composition 的作用域，不使用进程级全局状态，因此多个预览
和并行导出可以拥有不同的帧率。底层 Node/Web 差异由 `@pocketvideo/canvas` 适配边界处理。
Node 环境按需从 `@pocketvideo/canvas/skia` 创建普通 Canvas；浏览器入口不会加载
`skia-canvas` 原生依赖。

## 浏览器 / WebCodecs 导出

网页端默认且仅使用 WebCodecs + Mediabunny，不包含 ffmpeg.wasm。Composition 按帧求值，
CanvasSource 捕获当前 Canvas，浏览器原生 `VideoEncoder` 负责编码 H.264，Mediabunny
负责封装 MP4：

```text
Composition frame → Vue SFC → View/Text/Image → Canvas 2D → WebCodecs VideoEncoder
                  → Mediabunny MP4 muxer → MP4 Blob → Preview / Download
```

独立 Demo 会导出 5 秒、960 × 540、30 FPS 的 MP4，并在页面内提供预览和下载。
所有帧都留在本地设备，不会上传：

```bash
bun run dev:webcodecs
```

WebCodecs 需要 HTTPS 或 localhost，并且 H.264 编码能力取决于浏览器与设备。Demo
启动时会检测实际编码配置，不支持时会给出明确提示。`BufferTarget` 会把完整视频保留
在内存中，适合短片；长视频后续应切换 Mediabunny 的流式 Target。

> 许可证提示：PocketVideo 源码为 MIT；依赖 Mediabunny 单独采用 MPL-2.0。

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
- [x] Vue custom renderer、Canvas Surface 与基础宿主组件
- [ ] Solid 组件适配器
- [ ] GSAP 与 Motion 适配器
- [x] Raw RGBA/FFmpeg 基础导出器
- [x] 浏览器 WebCodecs/Mediabunny 基础导出器
- [x] 基础 Canvas 实时预览
- [ ] 完整开发工具

## 许可证

[MIT](./LICENSE) © PocketVideo contributors
