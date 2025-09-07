export type NodeType = string;

export interface NodeTypeConfig {
  id: string;
  label: string;
  color: string;
  allowMultipleInputs?: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  onClick: (nodeId: string) => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
}

export interface CanvasContextMenuItem {
  id: string;
  label: string;
  onClick?: (position: Position) => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: CanvasContextMenuItem[];
}

export interface RawNode {
  id: string;
  type: NodeType;
  title: string;
  position: Position;
  payload: Record<string, unknown>;
}

export interface Node extends RawNode {
  allowMultipleInputs: boolean;
  contextMenuItems?: ContextMenuItem[];
}

export interface Edge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface ViewState {
  zoom: number;
  offset: Position;
}

export interface RawGraph {
  nodes: RawNode[];
  edges: Edge[];
  viewState: ViewState;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  viewState: ViewState;
}

export interface Port {
  nodeId: string;
  type: "input" | "output";
}

export interface ConnectionState {
  isConnecting: boolean;
  sourcePort?: Port;
  currentPosition?: Position;
}

export interface ContextMenuState {
  isVisible: boolean;
  position: { x: number; y: number };
  type: "canvas" | "node";
  nodeId?: string;
  canvasPosition?: Position;
}
