import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      ffmpeg: "src/ffmpeg.ts",
      webcodecs: "src/webcodecs.ts",
    },
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
