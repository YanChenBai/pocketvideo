import { isDescendantOrSelf, type NodeMirror } from "./node.ts";

export const BTN = {
  SELECT: 0x0001,
  START: 0x0008,
  UP: 0x0010,
  RIGHT: 0x0020,
  DOWN: 0x0040,
  LEFT: 0x0080,
  LTRIGGER: 0x0100,
  RTRIGGER: 0x0200,
  TRIANGLE: 0x1000,
  CIRCLE: 0x2000,
  CROSS: 0x4000,
  SQUARE: 0x8000,
} as const;

export type ButtonMask = number;

export class InputController {
  private focused: NodeMirror | null = null;
  private previousButtons = 0;
  private activeNode: NodeMirror | null = null;
  private readonly root: NodeMirror;
  private readonly updateNodeState: (node: NodeMirror) => void;

  constructor(root: NodeMirror, updateNodeState: (node: NodeMirror) => void) {
    this.root = root;
    this.updateNodeState = updateNodeState;
  }

  getFocused(): NodeMirror | null {
    return this.focused;
  }

  focusNode(node: NodeMirror | null): void {
    if (node && (!node.focusable || !isDescendantOrSelf(node, this.root))) {
      throw new TypeError("Only a mounted focusable View can receive focus.");
    }
    if (this.focused === node) return;
    if (this.focused) {
      this.focused.focused = false;
      this.updateNodeState(this.focused);
    }
    this.focused = node;
    if (node) {
      node.focused = true;
      this.updateNodeState(node);
    }
  }

  focusNext(): void {
    this.moveFocus(1);
  }

  focusPrevious(): void {
    this.moveFocus(-1);
  }

  pressFocused(): void {
    const node = this.focused;
    if (!node) return;
    this.setActive(node);
    try {
      this.invokePress(node);
    } finally {
      this.setActive(null);
    }
  }

  dispatchButtons(buttons: ButtonMask): void {
    const pressed = buttons & ~this.previousButtons;
    if (pressed & (BTN.DOWN | BTN.RIGHT)) this.focusNext();
    else if (pressed & (BTN.UP | BTN.LEFT)) this.focusPrevious();

    if (pressed & BTN.CIRCLE) {
      const node = this.focused;
      if (node) {
        this.setActive(node);
        this.invokePress(node);
      }
    }
    if (!(buttons & BTN.CIRCLE)) this.setActive(null);
    this.previousButtons = buttons;
  }

  beforeRemove(node: NodeMirror): void {
    if (!this.focused || !isDescendantOrSelf(this.focused, node)) return;
    const order = focusableNodes(this.root);
    const index = order.indexOf(this.focused);
    const next = order.slice(index + 1).find((candidate) => !isDescendantOrSelf(candidate, node));
    const previous = order
      .slice(0, Math.max(0, index))
      .reverse()
      .find((candidate) => !isDescendantOrSelf(candidate, node));
    let ancestor = node.parent;
    while (ancestor && !ancestor.focusable) ancestor = ancestor.parent;
    this.focusNode(next ?? previous ?? ancestor ?? null);
  }

  focusabilityChanged(node: NodeMirror): void {
    if (node === this.focused && !node.focusable) this.focusNode(null);
  }

  private moveFocus(direction: 1 | -1): void {
    const order = focusableNodes(this.root);
    if (order.length === 0) {
      this.focusNode(null);
      return;
    }
    const currentIndex = this.focused ? order.indexOf(this.focused) : -1;
    const nextIndex =
      currentIndex < 0
        ? direction > 0
          ? 0
          : order.length - 1
        : Math.min(order.length - 1, Math.max(0, currentIndex + direction));
    this.focusNode(order[nextIndex] ?? null);
  }

  private invokePress(node: NodeMirror): void {
    for (let current: NodeMirror | null = node; current; current = current.parent) {
      if (current.onPress) {
        current.onPress();
        return;
      }
    }
  }

  private setActive(node: NodeMirror | null): void {
    if (this.activeNode === node) return;
    if (this.activeNode) {
      this.activeNode.active = false;
      this.updateNodeState(this.activeNode);
    }
    this.activeNode = node;
    if (node) {
      node.active = true;
      this.updateNodeState(node);
    }
  }
}

export function connectKeyboard(input: InputController, target: Window = window): () => void {
  let buttons = 0;
  const onKeyDown = (event: KeyboardEvent) => {
    const button = keyboardButton(event);
    if (!button) return;
    event.preventDefault();
    buttons |= button;
    input.dispatchButtons(buttons);
  };
  const onKeyUp = (event: KeyboardEvent) => {
    const button = keyboardButton(event);
    if (!button) return;
    event.preventDefault();
    buttons &= ~button;
    input.dispatchButtons(buttons);
  };
  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);
  return () => {
    target.removeEventListener("keydown", onKeyDown);
    target.removeEventListener("keyup", onKeyUp);
  };
}

function focusableNodes(root: NodeMirror): NodeMirror[] {
  return root.children.flatMap(flatten).filter((node) => node.type === "view" && node.focusable);
}

function flatten(node: NodeMirror): NodeMirror[] {
  return [node, ...node.children.flatMap(flatten)];
}

function keyboardButton(event: KeyboardEvent): number {
  if (event.key === "ArrowUp") return BTN.UP;
  if (event.key === "ArrowRight") return BTN.RIGHT;
  if (event.key === "ArrowDown") return BTN.DOWN;
  if (event.key === "ArrowLeft") return BTN.LEFT;
  if (event.key === "Enter" || event.key.toLowerCase() === "z") return BTN.CIRCLE;
  if (event.key.toLowerCase() === "x") return BTN.CROSS;
  if (event.key.toLowerCase() === "a") return BTN.SQUARE;
  if (event.key.toLowerCase() === "s") return BTN.TRIANGLE;
  if (event.key === "Shift") return BTN.SELECT;
  if (event.key === " ") return BTN.START;
  if (["l", "q"].includes(event.key.toLowerCase())) return BTN.LTRIGGER;
  if (["r", "e"].includes(event.key.toLowerCase())) return BTN.RTRIGGER;
  return 0;
}
