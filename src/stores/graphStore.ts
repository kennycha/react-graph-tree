import { create } from 'zustand';
import type { Graph, Node, Position, ConnectionState, NodeType } from '../types/graph';
import { 
  createNode, 
  createEdge, 
  validateConnection, 
  removeNode, 
  removeEdge, 
  updateNodePosition 
} from '../utils/graph';

interface GraphStore {
  // State
  graph: Graph;
  selectedNodeId: string | null;
  connectionState: ConnectionState;
  
  // Callbacks
  onConnect?: (sourceNodeId: string, targetNodeId: string, edgeId: string) => void;
  onDisconnect?: (sourceNodeId: string, targetNodeId: string, edgeId: string) => void;
  onNodeAdd?: (node: Node) => void;
  onNodeRemove?: (nodeId: string) => void;
  onNodeUpdate?: (nodeId: string, updates: Partial<Node>) => void;
  
  // Actions
  addNode: (type: NodeType, position: Position) => void;
  removeNodeById: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  moveNode: (nodeId: string, position: Position) => void;
  
  addEdge: (sourceNodeId: string, targetNodeId: string) => boolean;
  removeEdgeById: (edgeId: string) => void;
  
  setSelectedNode: (nodeId: string | null) => void;
  
  startConnection: (sourceNodeId: string, position: Position) => void;
  updateConnectionPosition: (position: Position) => void;
  completeConnection: (targetNodeId: string) => boolean;
  cancelConnection: () => void;
  
  setZoom: (zoom: number) => void;
  setOffset: (offset: Position) => void;
  updateViewState: (updates: Partial<Graph['viewState']>) => void;
  
  // Callback setters
  setOnConnect: (callback: (sourceNodeId: string, targetNodeId: string, edgeId: string) => void) => void;
  setOnDisconnect: (callback: (sourceNodeId: string, targetNodeId: string, edgeId: string) => void) => void;
  setOnNodeAdd: (callback: (node: Node) => void) => void;
  setOnNodeRemove: (callback: (nodeId: string) => void) => void;
  setOnNodeUpdate: (callback: (nodeId: string, updates: Partial<Node>) => void) => void;
}

const initialGraph: Graph = {
  nodes: [
    {
      id: 'detector-1',
      type: 'Detector',
      title: 'Object Detector',
      position: { x: 100, y: 100 },
      payload: {
        model: 'yolo-v8',
        confidence: 0.7,
        classes: ['person', 'car', 'truck']
      },
      allowMultipleInputs: false // 1:N only
    },
    {
      id: 'tracker-1',
      type: 'Tracker',
      title: 'Multi-Object Tracker',
      position: { x: 400, y: 100 },
      payload: {
        algorithm: 'deep-sort',
        max_age: 30,
        n_init: 3
      },
      allowMultipleInputs: false // 1:N only
    },
    {
      id: 'ga-1',
      type: 'G/A',
      title: 'Gait Analysis',
      position: { x: 700, y: 50 },
      payload: {
        features: ['step_length', 'cadence', 'stride_width'],
        window_size: 60
      },
      allowMultipleInputs: false // 1:N only
    },
    {
      id: 'sf-1',
      type: 'SF',
      title: 'Safety Filter',
      position: { x: 700, y: 200 },
      payload: {
        safety_zones: ['entrance', 'exit', 'danger_zone'],
        alert_threshold: 0.8
      },
      allowMultipleInputs: false // 1:N only
    },
    {
      id: 'event-1',
      type: 'Event',
      title: 'Event Generator',
      position: { x: 1000, y: 125 },
      payload: {
        event_types: ['fall_detection', 'intrusion', 'loitering'],
        output_format: 'json'
      },
      allowMultipleInputs: true // N:M 허용! 여러 소스로부터 이벤트 수집 가능
    },
    // 추가 테스트 노드들
    {
      id: 'detector-2',
      type: 'Detector',
      title: 'Face Detector',
      position: { x: 100, y: 300 },
      payload: {
        model: 'retinaface',
        min_confidence: 0.8,
        detect_landmarks: true
      },
      allowMultipleInputs: false
    },
    {
      id: 'tracker-2',
      type: 'Tracker',
      title: 'Face Tracker',
      position: { x: 400, y: 300 },
      payload: {
        algorithm: 'kcf',
        update_interval: 5
      },
      allowMultipleInputs: false
    },
    {
      id: 'ga-2',
      type: 'G/A',
      title: 'Emotion Analysis',
      position: { x: 700, y: 350 },
      payload: {
        emotions: ['happy', 'sad', 'angry', 'surprised'],
        confidence_threshold: 0.7
      },
      allowMultipleInputs: false
    },
    {
      id: 'sf-2',
      type: 'SF',
      title: 'Privacy Filter',
      position: { x: 400, y: 500 },
      payload: {
        blur_faces: true,
        anonymize_data: true,
        retention_days: 30
      },
      allowMultipleInputs: true // 여러 소스의 데이터를 필터링할 수 있음
    },
    {
      id: 'event-2',
      type: 'Event',
      title: 'Alert System',
      position: { x: 1000, y: 350 },
      payload: {
        alert_types: ['security_breach', 'unauthorized_access'],
        notification_channels: ['email', 'sms', 'webhook']
      },
      allowMultipleInputs: true
    }
  ],
  edges: [
    // 첫 번째 파이프라인: Object Detection → Tracking → Analysis/Safety → Event
    {
      id: 'edge-1',
      sourceNodeId: 'detector-1',
      targetNodeId: 'tracker-1'
    },
    {
      id: 'edge-2',
      sourceNodeId: 'tracker-1',
      targetNodeId: 'ga-1'
    },
    {
      id: 'edge-3',
      sourceNodeId: 'tracker-1',
      targetNodeId: 'sf-1'
    },
    {
      id: 'edge-4',
      sourceNodeId: 'ga-1',
      targetNodeId: 'event-1'
    },
    {
      id: 'edge-5',
      sourceNodeId: 'sf-1',
      targetNodeId: 'event-1'
    },
    // 두 번째 파이프라인: Face Detection → Face Tracking → Emotion Analysis
    {
      id: 'edge-6',
      sourceNodeId: 'detector-2',
      targetNodeId: 'tracker-2'
    },
    {
      id: 'edge-7',
      sourceNodeId: 'tracker-2',
      targetNodeId: 'ga-2'
    }
    // 나머지는 수동으로 연결 테스트 가능
    // - Privacy Filter는 allowMultipleInputs: true이므로 여러 입력 가능
    // - Alert System도 allowMultipleInputs: true이므로 여러 입력 가능
  ],
  viewState: {
    zoom: 1,
    offset: { x: 0, y: 0 }
  }
};

export const useGraphStore = create<GraphStore>((set, get) => ({
  // Initial state
  graph: initialGraph,
  selectedNodeId: null,
  connectionState: {
    isConnecting: false
  },

  // Actions
  addNode: (type, position) => {
    const newNode = createNode(type, position);
    set((state) => ({
      graph: {
        ...state.graph,
        nodes: [...state.graph.nodes, newNode]
      }
    }));
    
    const state = get();
    state.onNodeAdd?.(newNode);
  },

  removeNodeById: (nodeId) => {
    set((state) => ({
      graph: removeNode(nodeId, state.graph),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
    }));
    
    const state = get();
    state.onNodeRemove?.(nodeId);
  },

  updateNode: (nodeId, updates) => {
    set((state) => ({
      graph: {
        ...state.graph,
        nodes: state.graph.nodes.map(node =>
          node.id === nodeId ? { ...node, ...updates } : node
        )
      }
    }));
    
    const state = get();
    state.onNodeUpdate?.(nodeId, updates);
  },

  moveNode: (nodeId, position) => set((state) => ({
    graph: updateNodePosition(nodeId, position, state.graph)
  })),

  addEdge: (sourceNodeId, targetNodeId) => {
    const state = get();
    const validation = validateConnection(sourceNodeId, targetNodeId, state.graph);
    
    if (!validation.valid) {
      console.warn('Connection failed:', validation.reason);
      return false;
    }

    const newEdge = createEdge(sourceNodeId, targetNodeId);
    set((state) => ({
      graph: {
        ...state.graph,
        edges: [...state.graph.edges, newEdge]
      }
    }));

    const updatedState = get();
    updatedState.onConnect?.(sourceNodeId, targetNodeId, newEdge.id);
    return true;
  },

  removeEdgeById: (edgeId) => {
    const state = get();
    const edge = state.graph.edges.find(e => e.id === edgeId);
    
    set((state) => ({
      graph: removeEdge(edgeId, state.graph)
    }));
    
    if (edge) {
      const updatedState = get();
      updatedState.onDisconnect?.(edge.sourceNodeId, edge.targetNodeId, edgeId);
    }
  },

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

  startConnection: (sourceNodeId, position) => set({
    connectionState: {
      isConnecting: true,
      sourcePort: { nodeId: sourceNodeId, type: 'output' },
      currentPosition: position
    }
  }),

  updateConnectionPosition: (position) => set((state) => ({
    connectionState: {
      ...state.connectionState,
      currentPosition: position
    }
  })),

  completeConnection: (targetNodeId) => {
    const state = get();
    const sourceNodeId = state.connectionState.sourcePort?.nodeId;
    
    if (!sourceNodeId) return false;

    const success = state.addEdge(sourceNodeId, targetNodeId);
    
    set({
      connectionState: { isConnecting: false }
    });

    return success;
  },

  cancelConnection: () => set({
    connectionState: { isConnecting: false }
  }),

  setZoom: (zoom) => set((state) => ({
    graph: {
      ...state.graph,
      viewState: { ...state.graph.viewState, zoom }
    }
  })),

  setOffset: (offset) => set((state) => ({
    graph: {
      ...state.graph,
      viewState: { ...state.graph.viewState, offset }
    }
  })),

  updateViewState: (updates) => set((state) => ({
    graph: {
      ...state.graph,
      viewState: { ...state.graph.viewState, ...updates }
    }
  })),

  // Callback setters
  setOnConnect: (callback) => set({ onConnect: callback }),
  setOnDisconnect: (callback) => set({ onDisconnect: callback }),
  setOnNodeAdd: (callback) => set({ onNodeAdd: callback }),
  setOnNodeRemove: (callback) => set({ onNodeRemove: callback }),
  setOnNodeUpdate: (callback) => set({ onNodeUpdate: callback }),
}));