# Vue binding

`@pocketvideo/vue` is PocketVideo's framework binding for Vue. It does not ship a JSX, SFC, or
Vite transform. Applications use Vue's own state and lifecycle APIs, then mount Vue components
into PocketVideo's host tree through `createVueBinding`.

The public host surface intentionally follows PocketJS's minimal model:

- `View` is the only container and the only focusable primitive.
- `Text` concatenates its text children into one host text subtree.
- `Image` references an image by `src` and has no children.
- Vue reactivity comes directly from `vue`; PocketVideo does not wrap `ref`, `computed`, or
  lifecycle hooks.

## Binding without a compiler plugin

The components themselves use Vue's `h()` API, so the binding has no authoring-transform
dependency:

```ts
import { computed, h, ref } from "vue";
import { createVueBinding, defineStyles } from "@pocketvideo/vue";
import { Text, View } from "@pocketvideo/vue/components";

const styles = defineStyles({
  "button label": {
    base: { width: 180, height: 44, backgroundColor: "#334155" },
    focus: { backgroundColor: "#0ea5e9", scale: 1.05 },
    active: { scale: 0.95 },
  },
});

const count = ref(0);
const label = computed(() => `Count: ${count.value}`);

const App = {
  setup: () => () =>
    h(
      View,
      {
        class: "button label",
        focusable: true,
        onPress: () => count.value++,
      },
      () => h(Text, {}, () => label.value),
    ),
};

const binding = createVueBinding({ styles });
binding.mount(App);
binding.input.focusNext();
binding.input.pressFocused();
```

Applications may choose an SFC compiler, a standard Vue JSX transform, or render functions. None
of those choices are part of `@pocketvideo/vue`.

## Canvas surface

`CanvasSurface` mounts the component with fixed video configuration and updates its scoped frame
state before drawing. A root `Canvas` exposes the current native canvas through an ordinary Vue
template ref and follows `setCanvas()` when preview and export targets are switched. The scoped
`useFPS`, `useFrame`, `useTime`, `useVideoConfig`, and `useVideoFrame` composables contain no
process-global mutable state.

When the host tree contains `View`, `Text`, or `Image`, the built-in Canvas2D backend paints it.
When the root `Canvas` has no host primitives, the surface does not request a 2D context; code
using the template ref may own OGL, WebGL, WebGPU, or another context directly.

## Styles

`class` is a lookup key into a precompiled `StyleTable`; it is never parsed as Tailwind at runtime.
The complete literal must already exist in the table. Token-order aliases are normalized, but an
unknown class throws instead of silently doing nothing.

`style` is the dynamic escape hatch. It accepts typed individual properties and overrides the
resolved base/focus/active record. Unknown properties throw. A future PocketVideo build tool may
produce these tables from utility classes without changing the Vue binding.

## Focus and press events

The first binding phase implements the base PocketJS interaction semantics:

- one focused `View` or no focus;
- depth-first document-order traversal, clamped at each end;
- `onPress` activation from the focused node;
- press bubbling to the nearest ancestor handler;
- compiled `focus` and `active` style records;
- focus repair when a focused subtree is removed;
- the portable `BTN` bitmask and optional browser keyboard mapping.

Focus scopes, grids, portals, modal shells, animation, and a style compiler are deliberately not
part of this first primitive layer.
