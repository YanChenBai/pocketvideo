import type { RenderedFrame } from "@pocketvideo/core";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import { AURORA_COLOR_STOPS, type AuroraLayer, type DemoLayer } from "../composition.ts";

const VERTEX_SHADER = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x
      + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
    0.5 - vec3(
      dot(x0, x0),
      dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)
    ),
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) { \
  int index = 0; \
  for (int i = 0; i < 2; i++) { \
    ColorStop currentColor = colors[i]; \
    bool isInBetween = currentColor.position <= factor; \
    index = int(mix(float(index), float(i), float(isInBetween))); \
  } \
  ColorStop currentColor = colors[index]; \
  ColorStop nextColor = colors[index + 1]; \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25));
  height = exp(height * 0.5 * uAmplitude);
  height = uv.y * 2.0 - height + 0.2;
  float intensity = 0.6 * height;

  float midPoint = 0.2;
  float auroraAlpha = smoothstep(
    midPoint - uBlend * 0.5,
    midPoint + uBlend * 0.5,
    intensity
  );
  vec3 auroraColor = intensity * rampColor;

  vec3 base = vec3(0.025, 0.022, 0.055);
  fragColor = vec4(base + auroraColor * auroraAlpha, 1.0);
}
`;

function colorStopsValue(colorStops: AuroraLayer["colorStops"]): number[][] {
  return colorStops.map((hex) => {
    const color = new Color(hex);
    return [color.r, color.g, color.b];
  });
}

export class OglAuroraLayout {
  readonly canvas: HTMLCanvasElement;

  private readonly renderer: Renderer;
  private readonly program: Program;
  private readonly mesh: Mesh;
  private readonly width: number;
  private readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.renderer = new Renderer({
      width,
      height,
      dpr: 1,
      alpha: false,
      antialias: true,
    });

    const gl = this.renderer.gl;
    this.canvas = gl.canvas;
    gl.clearColor(0.025, 0.022, 0.055, 1);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) delete geometry.attributes.uv;

    this.program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.82 },
        uColorStops: { value: colorStopsValue(AURORA_COLOR_STOPS) },
        uResolution: { value: [width, height] },
        uBlend: { value: 0.68 },
      },
    });
    this.mesh = new Mesh(gl, { geometry, program: this.program });
  }

  renderFrame(frame: RenderedFrame<DemoLayer>): void {
    const track = frame.tracks.find(({ output }) => output.type === "ogl-aurora");
    if (!track || track.output.type !== "ogl-aurora") return;

    const layer = track.output;
    this.program.uniforms.uTime.value = layer.time;
    this.program.uniforms.uAmplitude.value = layer.amplitude;
    this.program.uniforms.uBlend.value = layer.blend;
    this.program.uniforms.uColorStops.value = colorStopsValue(layer.colorStops);
    this.program.uniforms.uResolution.value = [this.width, this.height];
    this.renderer.render({ scene: this.mesh });
  }

  dispose(): void {
    this.renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
    this.canvas.remove();
  }
}
