export type NodeType = string; // 동적 노드 타입 지원

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
  separator?: boolean; // 구분선 표시
  submenu?: ContextMenuItem[]; // 서브메뉴 지원
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

// 라이브러리 내부에서 사용하는 완전한 노드 데이터
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

// 사용자가 제공하는 원시 그래프 데이터
export interface RawGraph {
  nodes: RawNode[];
  edges: Edge[];
  viewState: ViewState;
}

// 라이브러리 내부에서 사용하는 완전한 그래프 데이터
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
