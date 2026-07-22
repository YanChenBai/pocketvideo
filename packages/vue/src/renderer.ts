import {
  createRenderer,
  type App,
  type Component,
  type CreateAppFunction,
  type InjectionKey,
  type RendererOptions,
} from "vue";
import { InputController } from "./input.ts";
import { snapshotNode, type HostNodeType, type NodeMirror, type NodeSnapshot } from "./node.ts";
import { StyleRegistry, type InlineStyle, type StyleTable } from "./styles.ts";

export interface VueBindingOptions {
  readonly styles?: StyleTable;
  readonly onMutation?: (root: NodeMirror) => void;
}

export interface PocketVueApp {
  readonly root: NodeMirror;
  readonly input: InputController;
  mount(component: Component, props?: Record<string, unknown>): App<NodeMirror>;
  snapshot(): NodeSnapshot;
}

export function createVueBinding(options: VueBindingOptions = {}): PocketVueApp {
  const styles = new StyleRegistry(options.styles);
  let nextId = 1;
  const root = createNode(0, "root");
  const refreshStyle = (node: NodeMirror) => {
    node.style = styles.resolve(node.className, node.inlineStyle, {
      focused: node.focused,
      active: node.active,
    });
    options.onMutation?.(root);
  };
  const input = new InputController(root, refreshStyle);
  const renderer = createRenderer<NodeMirror, NodeMirror>(
    rendererOptions({
      create(type) {
        return createNode(nextId++, type);
      },
      refreshStyle,
      input,
      mutate: () => options.onMutation?.(root),
    }),
  );

  return {
    root,
    input,
    mount(component, props) {
      const app = (renderer.createApp as CreateAppFunction<NodeMirror>)(component, props);
      app.provide(Symbol.for("v-scx") as InjectionKey<{ modules: Set<string> }>, {
        modules: new Set<string>(),
      });
      app.mount(root);
      return app;
    },
    snapshot: () => snapshotNode(root),
  };
}

interface RendererContext {
  readonly create: (type: HostNodeType) => NodeMirror;
  readonly refreshStyle: (node: NodeMirror) => void;
  readonly input: InputController;
  readonly mutate: () => void;
}

function rendererOptions(context: RendererContext): RendererOptions<NodeMirror, NodeMirror> {
  return {
    patchProp(node, key, _previous, next) {
      if (key === "class" || key === "className") {
        node.className = optionalString(next, key);
        context.refreshStyle(node);
        return;
      }
      if (key === "style") {
        node.inlineStyle = next == null ? undefined : (next as InlineStyle);
        context.refreshStyle(node);
        return;
      }
      if (key === "focusable") {
        if (node.type !== "view") throw new TypeError("Only View supports focusable.");
        node.focusable = Boolean(next);
        context.input.focusabilityChanged(node);
        context.mutate();
        return;
      }
      if (key === "onPress") {
        if (node.type !== "view") throw new TypeError("Only View supports onPress.");
        node.onPress = next == null ? undefined : requireFunction(next, key);
        context.mutate();
        return;
      }
      if (key === "src") {
        if (node.type !== "image") throw new TypeError("Only Image supports src.");
        node.source = requireString(next, key);
        context.mutate();
        return;
      }
      if (key === "nodeRef") {
        node.nodeRef?.(null);
        node.nodeRef = next == null ? undefined : requireFunction(next, key);
        node.nodeRef?.(node);
        return;
      }
      if (key === "debugName") {
        node.debugName = optionalString(next, key);
        context.mutate();
        return;
      }
      throw new TypeError(`Unknown ${node.type} property: ${key}`);
    },
    insert(child, parent, anchor) {
      detach(child);
      child.parent = parent;
      if (!anchor) parent.children.push(child);
      else {
        const index = parent.children.indexOf(anchor);
        if (index < 0) throw new TypeError("Insert anchor is not a child of the target parent.");
        parent.children.splice(index, 0, child);
      }
      context.mutate();
    },
    remove(node) {
      context.input.beforeRemove(node);
      detach(node);
      visit(node, (current) => current.nodeRef?.(null));
      context.mutate();
    },
    createElement(type) {
      if (type !== "view" && type !== "text" && type !== "image") {
        throw new TypeError(`Unknown PocketVideo host element: ${type}`);
      }
      return context.create(type);
    },
    createText(text) {
      const node = context.create("#text");
      node.text = text;
      return node;
    },
    createComment(text) {
      const node = context.create("#comment");
      node.text = text;
      return node;
    },
    setText(node, text) {
      node.text = text;
      context.mutate();
    },
    setElementText(node, text) {
      for (const child of node.children) child.parent = null;
      node.children.length = 0;
      if (text) {
        const child = context.create("#text");
        child.text = text;
        child.parent = node;
        node.children.push(child);
      }
      context.mutate();
    },
    parentNode: (node) => node.parent,
    nextSibling(node) {
      if (!node.parent) return null;
      const index = node.parent.children.indexOf(node);
      return node.parent.children[index + 1] ?? null;
    },
  };
}

function createNode(id: number, type: HostNodeType): NodeMirror {
  return {
    id,
    type,
    parent: null,
    children: [],
    style: {},
    focusable: false,
    focused: false,
    active: false,
  };
}

function detach(node: NodeMirror): void {
  if (!node.parent) return;
  const index = node.parent.children.indexOf(node);
  if (index >= 0) node.parent.children.splice(index, 1);
  node.parent = null;
}

function visit(node: NodeMirror, callback: (node: NodeMirror) => void): void {
  callback(node);
  for (const child of node.children) visit(child, callback);
}

function requireString(value: unknown, key: string): string {
  if (typeof value !== "string") throw new TypeError(`${key} must be a string.`);
  return value;
}

function optionalString(value: unknown, key: string): string | undefined {
  return value == null ? undefined : requireString(value, key);
}

function requireFunction<FunctionType extends (...arguments_: never[]) => unknown>(
  value: unknown,
  key: string,
): FunctionType {
  if (typeof value !== "function") throw new TypeError(`${key} must be a function.`);
  return value as FunctionType;
}
