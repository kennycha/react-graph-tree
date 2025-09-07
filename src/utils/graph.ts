import type { Graph, Node, Edge } from "../types/graph";

export const generateId = (): string => {
  return Math.random().toString(36).slice(2, 9);
};

export const createNode = (
  type: Node["type"],
  position: { x: number; y: number },
  allowMultipleInputs: boolean
): Node => {
  return {
    id: generateId(),
    type,
    title: `${type} Node`,
    position,
    payload: {},
    allowMultipleInputs,
  };
};

export const createEdge = (
  sourceNodeId: string,
  targetNodeId: string
): Edge => {
  return {
    id: generateId(),
    sourceNodeId,
    targetNodeId,
  };
};

export const validateConnection = (
  sourceNodeId: string,
  targetNodeId: string,
  graph: Graph
): { valid: boolean; reason?: string } => {
  if (sourceNodeId === targetNodeId) {
    return { valid: false, reason: "Cannot connect node to itself" };
  }

  const existingEdge = graph.edges.find(
    (edge) =>
      edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId
  );
  if (existingEdge) {
    return { valid: false, reason: "Connection already exists" };
  }

  const targetNode = graph.nodes.find((node) => node.id === targetNodeId);
  if (!targetNode) {
    return { valid: false, reason: "Target node not found" };
  }

  if (!targetNode.allowMultipleInputs) {
    const existingInputEdge = graph.edges.find(
      (edge) => edge.targetNodeId === targetNodeId
    );
    if (existingInputEdge) {
      return {
        valid: false,
        reason: "This node can only have one input connection",
      };
    }
  }

  const wouldCreateCycle = (
    startNodeId: string,
    currentNodeId: string,
    visited: Set<string>
  ): boolean => {
    if (visited.has(currentNodeId)) {
      return currentNodeId === startNodeId;
    }

    visited.add(currentNodeId);

    const outgoingEdges = graph.edges.filter(
      (edge) => edge.sourceNodeId === currentNodeId
    );
    for (const edge of outgoingEdges) {
      if (wouldCreateCycle(startNodeId, edge.targetNodeId, new Set(visited))) {
        return true;
      }
    }

    return false;
  };

  if (wouldCreateCycle(targetNodeId, sourceNodeId, new Set())) {
    return { valid: false, reason: "Connection would create a cycle" };
  }

  return { valid: true };
};

export const removeNode = (nodeId: string, graph: Graph): Graph => {
  return {
    ...graph,
    nodes: graph.nodes.filter((node) => node.id !== nodeId),
    edges: graph.edges.filter(
      (edge) => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId
    ),
  };
};

export const removeEdge = (edgeId: string, graph: Graph): Graph => {
  return {
    ...graph,
    edges: graph.edges.filter((edge) => edge.id !== edgeId),
  };
};

export const updateNodePosition = (
  nodeId: string,
  position: { x: number; y: number },
  graph: Graph
): Graph => {
  return {
    ...graph,
    nodes: graph.nodes.map((node) =>
      node.id === nodeId ? { ...node, position } : node
    ),
  };
};
