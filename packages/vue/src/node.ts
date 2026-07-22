import type { HostStyle, InlineStyle } from "./styles.ts";

export type HostNodeType = "root" | "view" | "text" | "image" | "#text" | "#comment";
export type NodeRef = (node: NodeMirror | null) => void;

export interface NodeMirror {
  readonly id: number;
  readonly type: HostNodeType;
  parent: NodeMirror | null;
  readonly children: NodeMirror[];
  text?: string;
  className?: string;
  inlineStyle?: InlineStyle;
  style: HostStyle;
  source?: string;
  focusable: boolean;
  focused: boolean;
  active: boolean;
  onPress?: () => void;
  nodeRef?: NodeRef;
  debugName?: string;
}

export interface NodeSnapshot {
  readonly id: number;
  readonly type: HostNodeType;
  readonly text?: string;
  readonly source?: string;
  readonly className?: string;
  readonly style: Readonly<HostStyle>;
  readonly focusable: boolean;
  readonly focused: boolean;
  readonly active: boolean;
  readonly debugName?: string;
  readonly children: readonly NodeSnapshot[];
}

export function snapshotNode(node: NodeMirror): NodeSnapshot {
  return {
    id: node.id,
    type: node.type,
    text: node.text,
    source: node.source,
    className: node.className,
    style: { ...node.style },
    focusable: node.focusable,
    focused: node.focused,
    active: node.active,
    debugName: node.debugName,
    children: node.children.map(snapshotNode),
  };
}

export function isDescendantOrSelf(node: NodeMirror, ancestor: NodeMirror): boolean {
  for (let current: NodeMirror | null = node; current; current = current.parent) {
    if (current === ancestor) return true;
  }
  return false;
}
