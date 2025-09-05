export type NodeType = 'Detector' | 'Tracker' | 'G/A' | 'SF' | 'Event';

export interface Position {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  type: NodeType;
  title: string;
  position: Position;
  payload: Record<string, unknown>;
  allowMultipleInputs?: boolean; // 기본값: false (1:N), true면 N:M 허용
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

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  viewState: ViewState;
}

export interface Port {
  nodeId: string;
  type: 'input' | 'output';
}

export interface ConnectionState {
  isConnecting: boolean;
  sourcePort?: Port;
  currentPosition?: Position;
}