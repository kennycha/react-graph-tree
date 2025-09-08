import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  Graph,
  Node,
  Edge,
  Position,
  ConnectionState,
  NodeType,
  ContextMenuState,
  RawGraph,
  NodeTypeConfig,
} from "../types/graph";
import {
  createNode,
  createEdge,
  validateConnection,
  removeNode,
  removeEdge,
  updateNodePosition,
} from "../utils/graph";

interface GraphState {
  graph: Graph;
}

interface UIState {
  selectedNodeId: string | null;
  connectionState: ConnectionState;
  contextMenuState: ContextMenuState;
}

interface CallbackState {
  nodeTypeConfigMap?: Map<string, NodeTypeConfig>;
  onNodeChange?: (
    nodeId: string,
    changeType: "title" | "payload" | "position",
    data?: unknown
  ) => void | Promise<void>;
  onGraphChange?: (
    graph: RawGraph,
    node?: Node,
    edges?: Edge[]
  ) => void | Promise<void>;
}

interface GraphActions {
  setInitialGraph: (graph: Graph) => void;
  addNode: (
    type: NodeType,
    position: Position,
    options?: { title?: string }
  ) => void;
  removeNodeById: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  moveNode: (nodeId: string, position: Position) => void;
  duplicateNode: (nodeId: string) => void;
  disconnectAllFromNode: (nodeId: string) => void;
  addEdge: (sourceNodeId: string, targetNodeId: string) => boolean;
  removeEdgeById: (edgeId: string) => void;
  setZoom: (zoom: number) => void;
  setOffset: (offset: Position) => void;
  updateViewState: (updates: Partial<Graph["viewState"]>) => void;
}

interface UIActions {
  setSelectedNode: (nodeId: string | null) => void;
  startConnection: (sourceNodeId: string, position: Position) => void;
  updateConnectionPosition: (position: Position) => void;
  completeConnection: (targetNodeId: string) => boolean;
  cancelConnection: () => void;
  showContextMenu: (
    type: "canvas" | "node",
    position: { x: number; y: number },
    nodeId?: string,
    canvasPosition?: Position
  ) => void;
  hideContextMenu: () => void;
}

interface CallbackActions {
  setNodeTypeConfigMap: (configMap: Map<string, NodeTypeConfig>) => void;
  setOnNodeChange: (
    callback: (
      nodeId: string,
      changeType: "title" | "payload" | "position",
      data?: unknown
    ) => void | Promise<void>
  ) => void;
  setOnGraphChange: (
    callback: (
      graph: RawGraph,
      node?: Node,
      edges?: Edge[]
    ) => void | Promise<void>
  ) => void;
}

type GraphStore = GraphState &
  UIState &
  CallbackState &
  GraphActions &
  UIActions &
  CallbackActions;

const defaultInitialGraph: Graph = {
  nodes: [],
  edges: [],
  viewState: {
    zoom: 1,
    offset: { x: 0, y: 0 },
  },
};

export const useGraphStore = create<GraphStore>()(
  subscribeWithSelector((set, get) => {
    // Helper function to convert Graph to RawGraph
    const convertGraphToRawGraph = (graph: Graph): RawGraph => {
      const rawNodes = graph.nodes.map(({ ...rawNode }) => rawNode);
      return {
        ...graph,
        nodes: rawNodes,
      };
    };

    // Helper function to call onGraphChange callback
    const callGraphChangeCallback = (
      newGraph: Graph,
      node?: Node,
      edges?: Edge[]
    ) => {
      const state = get();
      if (state.onGraphChange) {
        const rawGraph = convertGraphToRawGraph(newGraph);
        const result = state.onGraphChange(rawGraph, node, edges);
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error("Graph change callback error:", error);
          });
        }
      }
    };

    return {
      // Initial state
      graph: defaultInitialGraph,
      selectedNodeId: null,
      connectionState: {
        isConnecting: false,
      },
      contextMenuState: {
        isVisible: false,
        position: { x: 0, y: 0 },
        type: "canvas",
      },
      nodeTypeConfigMap: undefined,

      // Graph Actions
      setInitialGraph: (graph) => {
        set({
          graph,
          selectedNodeId: null,
          connectionState: { isConnecting: false },
          contextMenuState: {
            isVisible: false,
            position: { x: 0, y: 0 },
            type: "canvas",
          },
        });
      },

      addNode: (type, position, options) => {
        const state = get();

        // Determine allowMultipleInputs: options → node type config → default false
        let allowMultipleInputs = false;
        if (state.nodeTypeConfigMap) {
          const nodeTypeConfig = state.nodeTypeConfigMap.get(type);
          allowMultipleInputs = nodeTypeConfig?.allowMultipleInputs ?? false;
        }

        const newNode = createNode(type, position, allowMultipleInputs);

        if (options?.title) {
          newNode.title = options.title;
        }

        const newGraph = {
          ...state.graph,
          nodes: [...state.graph.nodes, newNode],
        };

        set({ graph: newGraph });
        callGraphChangeCallback(newGraph, newNode);
      },

      removeNodeById: (nodeId) => {
        const currentState = get();
        const removedNode = currentState.graph.nodes.find(
          (node) => node.id === nodeId
        );
        const newGraph = removeNode(nodeId, currentState.graph);

        set({
          graph: newGraph,
          selectedNodeId:
            currentState.selectedNodeId === nodeId
              ? null
              : currentState.selectedNodeId,
        });

        callGraphChangeCallback(newGraph, removedNode);
      },

      updateNode: (nodeId, updates) => {
        const currentState = get();
        const newGraph = {
          ...currentState.graph,
          nodes: currentState.graph.nodes.map((node) =>
            node.id === nodeId ? { ...node, ...updates } : node
          ),
        };

        set({ graph: newGraph });

        const state = get();
        const updatedNode = newGraph.nodes.find((node) => node.id === nodeId);

        if (state.onNodeChange) {
          if (updates.title !== undefined) {
            state.onNodeChange(nodeId, "title", updates.title);
          } else if (updates.payload !== undefined) {
            state.onNodeChange(nodeId, "payload", updates.payload);
          }
        }

        callGraphChangeCallback(newGraph, updatedNode);
      },

      moveNode: (nodeId, position) => {
        set((state) => ({
          graph: updateNodePosition(nodeId, position, state.graph),
        }));

        const state = get();
        if (state.onNodeChange) {
          state.onNodeChange(nodeId, "position", position);
        }
      },

      duplicateNode: (nodeId) => {
        const state = get();
        const originalNode = state.graph.nodes.find(
          (node) => node.id === nodeId
        );
        if (!originalNode) return;

        const newNode = createNode(
          originalNode.type,
          {
            x: originalNode.position.x + 50,
            y: originalNode.position.y + 50,
          },
          originalNode.allowMultipleInputs
        );

        newNode.payload = { ...originalNode.payload };
        newNode.title = originalNode.title + " (copy)";

        const newGraph = {
          ...state.graph,
          nodes: [...state.graph.nodes, newNode],
        };

        set({ graph: newGraph });
        callGraphChangeCallback(newGraph, newNode);
      },

      disconnectAllFromNode: (nodeId) => {
        const currentState = get();
        const disconnectedNode = currentState.graph.nodes.find(
          (node) => node.id === nodeId
        );
        const removedEdges = currentState.graph.edges.filter(
          (edge) => edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId
        );

        const newGraph = {
          ...currentState.graph,
          edges: currentState.graph.edges.filter(
            (edge) =>
              edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId
          ),
        };

        set({ graph: newGraph });
        callGraphChangeCallback(newGraph, disconnectedNode, removedEdges);
      },

      addEdge: (sourceNodeId, targetNodeId) => {
        const state = get();
        const validation = validateConnection(
          sourceNodeId,
          targetNodeId,
          state.graph
        );

        if (!validation.valid) {
          console.warn("Connection failed:", validation.reason);
          return false;
        }

        const newEdge = createEdge(sourceNodeId, targetNodeId);
        const newGraph = {
          ...state.graph,
          edges: [...state.graph.edges, newEdge],
        };

        set({ graph: newGraph });
        callGraphChangeCallback(newGraph, undefined, [newEdge]);
        return true;
      },

      removeEdgeById: (edgeId) => {
        const state = get();
        const removedEdge = state.graph.edges.find(
          (edge) => edge.id === edgeId
        );
        const newGraph = removeEdge(edgeId, state.graph);

        set({ graph: newGraph });
        callGraphChangeCallback(
          newGraph,
          undefined,
          removedEdge ? [removedEdge] : undefined
        );
      },

      setZoom: (zoom) =>
        set((state) => ({
          graph: {
            ...state.graph,
            viewState: { ...state.graph.viewState, zoom },
          },
        })),

      setOffset: (offset) =>
        set((state) => ({
          graph: {
            ...state.graph,
            viewState: { ...state.graph.viewState, offset },
          },
        })),

      updateViewState: (updates) =>
        set((state) => ({
          graph: {
            ...state.graph,
            viewState: { ...state.graph.viewState, ...updates },
          },
        })),

      // UI Actions
      setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

      startConnection: (sourceNodeId, position) =>
        set({
          connectionState: {
            isConnecting: true,
            sourcePort: { nodeId: sourceNodeId, type: "output" },
            currentPosition: position,
          },
        }),

      updateConnectionPosition: (position) =>
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            currentPosition: position,
          },
        })),

      completeConnection: (targetNodeId) => {
        const state = get();
        const sourceNodeId = state.connectionState.sourcePort?.nodeId;

        if (!sourceNodeId) return false;

        const success = state.addEdge(sourceNodeId, targetNodeId);

        set({
          connectionState: { isConnecting: false },
        });

        return success;
      },

      cancelConnection: () =>
        set({
          connectionState: { isConnecting: false },
        }),

      showContextMenu: (type, position, nodeId, canvasPosition) =>
        set(() => ({
          contextMenuState: {
            isVisible: true,
            position,
            type,
            nodeId,
            canvasPosition,
          },
        })),

      hideContextMenu: () =>
        set({
          contextMenuState: {
            isVisible: false,
            position: { x: 0, y: 0 },
            type: "canvas",
          },
        }),

      // Callback setters
      setNodeTypeConfigMap: (configMap) =>
        set({ nodeTypeConfigMap: configMap }),
      setOnNodeChange: (callback) => set({ onNodeChange: callback }),
      setOnGraphChange: (callback) => set({ onGraphChange: callback }),
    };
  })
);

// State selectors - subscribe only to needed parts
export const useGraph = () => useGraphStore((state) => state.graph);
export const useNodes = () => useGraphStore((state) => state.graph.nodes);
export const useEdges = () => useGraphStore((state) => state.graph.edges);
export const useViewState = () =>
  useGraphStore((state) => state.graph.viewState);
export const useZoom = () =>
  useGraphStore((state) => state.graph.viewState.zoom);
export const useOffset = () =>
  useGraphStore((state) => state.graph.viewState.offset);

export const useSelectedNode = () =>
  useGraphStore((state) => state.selectedNodeId);
export const useConnectionState = () =>
  useGraphStore((state) => state.connectionState);
export const useContextMenuState = () =>
  useGraphStore((state) => state.contextMenuState);

// Selector that subscribes to a specific node only
export const useNode = (nodeId: string) =>
  useGraphStore((state) =>
    state.graph.nodes.find((node) => node.id === nodeId)
  );

// Subscribe to edges connected to a specific node only
export const useNodeEdges = (nodeId: string) =>
  useGraphStore((state) =>
    state.graph.edges.filter(
      (edge) => edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId
    )
  );

// Use actions separately - individual selectors for stable references
export const useSetInitialGraph = () =>
  useGraphStore((state) => state.setInitialGraph);
export const useAddNode = () => useGraphStore((state) => state.addNode);
export const useRemoveNodeById = () =>
  useGraphStore((state) => state.removeNodeById);
export const useUpdateNode = () => useGraphStore((state) => state.updateNode);
export const useMoveNode = () => useGraphStore((state) => state.moveNode);
export const useDuplicateNode = () =>
  useGraphStore((state) => state.duplicateNode);
export const useDisconnectAllFromNode = () =>
  useGraphStore((state) => state.disconnectAllFromNode);
export const useAddEdge = () => useGraphStore((state) => state.addEdge);
export const useRemoveEdgeById = () =>
  useGraphStore((state) => state.removeEdgeById);
export const useSetZoom = () => useGraphStore((state) => state.setZoom);
export const useSetOffset = () => useGraphStore((state) => state.setOffset);
export const useUpdateViewState = () =>
  useGraphStore((state) => state.updateViewState);

export const useSetSelectedNode = () =>
  useGraphStore((state) => state.setSelectedNode);
export const useStartConnection = () =>
  useGraphStore((state) => state.startConnection);
export const useUpdateConnectionPosition = () =>
  useGraphStore((state) => state.updateConnectionPosition);
export const useCompleteConnection = () =>
  useGraphStore((state) => state.completeConnection);
export const useCancelConnection = () =>
  useGraphStore((state) => state.cancelConnection);
export const useShowContextMenu = () =>
  useGraphStore((state) => state.showContextMenu);
export const useHideContextMenu = () =>
  useGraphStore((state) => state.hideContextMenu);

export const useSetNodeTypeConfigMap = () =>
  useGraphStore((state) => state.setNodeTypeConfigMap);
export const useSetOnNodeChange = () =>
  useGraphStore((state) => state.setOnNodeChange);
export const useSetOnGraphChange = () =>
  useGraphStore((state) => state.setOnGraphChange);
