import React, {
  useEffect,
  useCallback,
  useState,
  useRef,
  useMemo,
} from "react";
import { ThemeProvider } from "styled-components";
import { defaultTheme, type Theme } from "./types/theme";
import { GraphCanvas } from "./components/GraphCanvas";
import { NodeCard } from "./components/NodeCard";
import { EdgeLayer } from "./components/EdgeLayer";
import {
  useNodes,
  useViewState,
  useContextMenuState,
  useConnectionState,
  useSetInitialGraph,
  useAddNode,
  useUpdateNode,
  useDuplicateNode,
  useDisconnectAllFromNode,
  useRemoveNodeById,
  useSetZoom,
  useUpdateConnectionPosition,
  useCancelConnection,
  useShowContextMenu,
  useHideContextMenu,
  useSetNodeTypeConfigMap,
  useSetOnGraphChange,
  useSetOnNodeChange,
} from "./stores/graphStore";
import { CanvasContextMenu, NodeContextMenu } from "./components/ContextMenu";
import type {
  CanvasContextMenuItem,
  ContextMenuItem,
  Edge,
  Node,
  Graph,
  RawGraph,
  NodeTypeConfig,
} from "./types/graph";
export interface GraphEditorConfig {
  nodeTypes: NodeTypeConfig[];
  canvasContextMenuItems?: CanvasContextMenuItem[];
  defaultNodeContextMenuItems?: ContextMenuItem[];
  theme?: Partial<Theme>;
  width?: number | string;
  height?: number | string;
  initialGraph?: RawGraph;
  onNodeChange?: (
    nodeId: string,
    changeType: "title" | "payload",
    data?: unknown
  ) => void | Promise<void>;
  onGraphChange?: (
    graph: RawGraph,
    node?: Node,
    edges?: Edge[]
  ) => void | Promise<void>;
}

export interface GraphEditorProps {
  config: GraphEditorConfig;
  container?: HTMLElement;
  width?: number | string;
  height?: number | string;
}

export const GraphEditor: React.FC<GraphEditorProps> = ({
  config,
  width = "100%",
  height = "100%",
}) => {
  const nodes = useNodes();
  const viewState = useViewState();
  const connectionState = useConnectionState();
  const contextMenuState = useContextMenuState();

  const setInitialGraph = useSetInitialGraph();
  const addNode = useAddNode();
  const updateNode = useUpdateNode();
  const duplicateNode = useDuplicateNode();
  const disconnectAllFromNode = useDisconnectAllFromNode();
  const removeNodeById = useRemoveNodeById();
  const setZoom = useSetZoom();
  const updateConnectionPosition = useUpdateConnectionPosition();
  const cancelConnection = useCancelConnection();
  const showContextMenu = useShowContextMenu();
  const hideContextMenu = useHideContextMenu();
  const setNodeTypeConfigMap = useSetNodeTypeConfigMap();
  const setOnGraphChange = useSetOnGraphChange();
  const setOnNodeChange = useSetOnNodeChange();

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentMousePosition, setCurrentMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // 노드 타입별 설정을 맵으로 생성
  const nodeTypeConfigMap = useMemo(() => {
    const map = new Map<string, NodeTypeConfig>();
    config.nodeTypes.forEach((nodeType) => {
      map.set(nodeType.id, nodeType);
    });
    return map;
  }, [config.nodeTypes]);

  // nodeTypeConfigMap을 스토어에 설정
  useEffect(() => {
    setNodeTypeConfigMap(nodeTypeConfigMap);
  }, [nodeTypeConfigMap, setNodeTypeConfigMap]);

  // 기본 노드 컨텍스트 메뉴 아이템들
  const getNodeContextMenuItems = useCallback((): ContextMenuItem[] => {
    if (config.defaultNodeContextMenuItems) {
      return config.defaultNodeContextMenuItems;
    }

    return [
      {
        id: "edit-title",
        label: "제목 편집",
        onClick: async (id: string) => {
          if (config.onNodeChange) {
            const result = config.onNodeChange(id, "title");
            if (result instanceof Promise) {
              await result;
            }
          } else {
            // 기본 fallback
            const node = nodes.find((n) => n.id === id);
            if (node) {
              const newTitle = prompt("새 제목을 입력하세요:", node.title);
              if (newTitle !== null && newTitle.trim() !== "") {
                updateNode(id, { title: newTitle.trim() });
              }
            }
          }
        },
      },
      {
        id: "edit-payload",
        label: "속성 편집",
        onClick: async (id: string) => {
          if (config.onNodeChange) {
            const node = nodes.find((n) => n.id === id);
            const result = config.onNodeChange(id, "payload", node?.payload);
            if (result instanceof Promise) {
              await result;
            }
          } else {
            // 기본 fallback
            const node = nodes.find((n) => n.id === id);
            if (node) {
              const payloadStr = JSON.stringify(node.payload, null, 2);
              const newPayloadStr = prompt(
                "속성을 JSON 형태로 편집하세요:",
                payloadStr
              );
              if (newPayloadStr !== null) {
                try {
                  const newPayload = JSON.parse(newPayloadStr);
                  updateNode(id, { payload: newPayload });
                } catch (error) {
                  console.error(error);
                  alert("잘못된 JSON 형식입니다.");
                }
              }
            }
          }
        },
      },
      {
        id: "separator1",
        label: "",
        separator: true,
        onClick: () => {},
      },
      {
        id: "duplicate",
        label: "복제",
        onClick: (id: string) => duplicateNode(id),
      },
      {
        id: "separator2",
        label: "",
        separator: true,
        onClick: () => {},
      },
      {
        id: "disconnect",
        label: "모든 연결 끊기",
        onClick: (id: string) => disconnectAllFromNode(id),
      },
      {
        id: "separator3",
        label: "",
        separator: true,
        onClick: () => {},
      },
      {
        id: "delete",
        label: "삭제",
        onClick: (id: string) => removeNodeById(id),
      },
    ];
  }, [
    config,
    nodes,
    updateNode,
    duplicateNode,
    disconnectAllFromNode,
    removeNodeById,
  ]);

  // 캔버스 컨텍스트 메뉴 아이템들
  const getCanvasContextMenuItems = useCallback((): CanvasContextMenuItem[] => {
    if (config.canvasContextMenuItems) {
      return config.canvasContextMenuItems;
    }

    // 노드 타입들을 submenu로 구성
    const nodeTypeSubmenu: CanvasContextMenuItem[] = config.nodeTypes.map(
      (nodeType) => ({
        id: `add-${nodeType.id}`,
        label: nodeType.label,
        onClick: (position) => {
          // config의 nodeType 정보를 사용해서 노드 생성
          addNode(nodeType.id, position, {
            title: nodeType.label,
            // 노드 타입의 기본 설정을 사용하되, undefined인 경우 생략하여 런타임에 결정하도록 함
            ...(nodeType.allowMultipleInputs !== undefined && {
              allowMultipleInputs: nodeType.allowMultipleInputs,
            }),
          });
        },
      })
    );

    const zoomItems: CanvasContextMenuItem[] = [
      {
        id: "zoom-in",
        label: "줌 인",
        onClick: () => {
          const currentZoom = viewState.zoom;
          setZoom(Math.min(2.0, currentZoom * 1.25));
        },
      },
      {
        id: "zoom-out",
        label: "줌 아웃",
        onClick: () => {
          const currentZoom = viewState.zoom;
          setZoom(Math.max(0.5, currentZoom * 0.8));
        },
      },
      {
        id: "zoom-reset",
        label: "100%",
        onClick: () => setZoom(1.0),
      },
    ];

    return [
      {
        id: "add-node",
        label: "노드 추가",
        submenu: nodeTypeSubmenu,
      },
      {
        id: "separator1",
        label: "",
        separator: true,
      },
      ...zoomItems,
    ];
  }, [
    config.canvasContextMenuItems,
    config.nodeTypes,
    addNode,
    setZoom,
    viewState.zoom,
  ]);

  // 노드 타입별 색상 테마 생성
  const createNodeTypeTheme = useCallback(() => {
    const nodeTypeColors: Record<string, string> = {};
    config.nodeTypes.forEach((nodeType) => {
      nodeTypeColors[nodeType.id] = nodeType.color;
    });

    return {
      ...defaultTheme,
      ...config.theme,
      colors: {
        ...defaultTheme.colors,
        ...config.theme?.colors,
        // 동적으로 생성된 노드 타입 색상들 추가
        ...nodeTypeColors,
      },
    };
  }, [config.nodeTypes, config.theme]);

  // Graph change callback을 ref로 저장하여 무한 루프 방지
  const onGraphChangeRef = useRef(config.onGraphChange);
  const onNodeChangeRef = useRef(config.onNodeChange);

  // Initialize graph with provided initial data
  useEffect(() => {
    if (config.initialGraph) {
      const convertedNodes: Node[] = config.initialGraph.nodes.map(
        (rawNode) => {
          return {
            ...rawNode,
            allowMultipleInputs:
              nodeTypeConfigMap.get(rawNode.type)?.allowMultipleInputs ?? false,
            contextMenuItems: undefined, // 초기화 시에는 undefined로 설정
          };
        }
      );

      const convertedGraph: Graph = {
        ...config.initialGraph,
        nodes: convertedNodes,
      };

      setInitialGraph(convertedGraph);
    }
  }, [config.initialGraph, setInitialGraph, nodeTypeConfigMap]);

  // 컨테이너 크기 감지
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    onGraphChangeRef.current = config.onGraphChange;
    onNodeChangeRef.current = config.onNodeChange;
  }, [config.onGraphChange, config.onNodeChange]);

  useEffect(() => {
    // ref를 통해 콜백 설정
    setOnGraphChange((graph, node, edges) => {
      if (onGraphChangeRef.current) {
        const result = onGraphChangeRef.current(graph, node, edges);
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error("Graph change callback error:", error);
          });
        }
      }
    });

    setOnNodeChange((nodeId, changeType, data) => {
      if (onNodeChangeRef.current) {
        const result = onNodeChangeRef.current(nodeId, changeType, data);
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error("Node change callback error:", error);
          });
        }
      }
    });
  }, [setOnGraphChange, setOnNodeChange]);

  // 마우스 좌표를 월드 좌표로 변환하는 헬퍼 함수
  const screenToWorldPosition = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();

      // CSS transform: scale() translate()이므로
      // offset은 이미 zoom의 영향을 받음
      const canvasX = screenX - rect.left;
      const canvasY = screenY - rect.top;

      return {
        x: (canvasX - viewState.offset.x * viewState.zoom) / viewState.zoom,
        y: (canvasY - viewState.offset.y * viewState.zoom) / viewState.zoom,
      };
    },
    [viewState]
  );

  // Handle mouse move for connection preview
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // 현재 마우스 화면 위치 저장
      setCurrentMousePosition({ x: e.clientX, y: e.clientY });

      if (connectionState.isConnecting) {
        const worldPosition = screenToWorldPosition(e.clientX, e.clientY);
        if (worldPosition) {
          updateConnectionPosition(worldPosition);
        }
      }
    },
    [
      connectionState.isConnecting,
      updateConnectionPosition,
      screenToWorldPosition,
    ]
  );

  // 줌이 변경될 때 연결 미리보기 업데이트
  useEffect(() => {
    if (connectionState.isConnecting && currentMousePosition) {
      const worldPosition = screenToWorldPosition(
        currentMousePosition.x,
        currentMousePosition.y
      );
      if (worldPosition) {
        updateConnectionPosition(worldPosition);
      }
    }
  }, [
    viewState.zoom,
    viewState.offset,
    connectionState.isConnecting,
    currentMousePosition,
    screenToWorldPosition,
    updateConnectionPosition,
  ]);

  // Handle escape key to cancel connection
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && connectionState.isConnecting) {
        cancelConnection();
      }
    },
    [connectionState.isConnecting, cancelConnection]
  );

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleMouseMove, handleKeyDown]);

  // Handle context menu close
  useEffect(() => {
    if (contextMenuState.isVisible) {
      const handleClickOutside = (e: Event) => {
        // contextmenu 이벤트는 무시 (우클릭으로 메뉴를 여는 것과 충돌 방지)
        if (e.type === "contextmenu") {
          return;
        }
        hideContextMenu();
      };

      document.addEventListener("click", handleClickOutside);

      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [contextMenuState.isVisible, hideContextMenu]);

  // Handle right-click context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      // Convert screen coordinates to canvas coordinates
      const target = e.currentTarget;
      if (!(target instanceof HTMLElement)) return;
      const canvasRect = target.getBoundingClientRect();
      const canvasPosition = {
        x: (e.clientX - canvasRect.left - viewState.offset.x) / viewState.zoom,
        y: (e.clientY - canvasRect.top - viewState.offset.y) / viewState.zoom,
      };

      showContextMenu(
        "canvas",
        { x: e.clientX, y: e.clientY },
        undefined,
        canvasPosition
      );
    },
    [viewState, showContextMenu]
  );

  const theme = createNodeTypeTheme();

  return (
    <ThemeProvider theme={theme}>
      <div
        ref={containerRef}
        style={{
          width,
          height,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <GraphCanvas
          onContextMenu={handleContextMenu}
          isConnecting={connectionState.isConnecting}
        >
          <EdgeLayer width={canvasSize.width} height={canvasSize.height} />

          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={{
                ...node,
                contextMenuItems: getNodeContextMenuItems(),
              }}
            />
          ))}
        </GraphCanvas>

        {contextMenuState.isVisible && (
          <>
            {contextMenuState.type === "canvas" &&
              contextMenuState.canvasPosition && (
                <CanvasContextMenu
                  position={contextMenuState.position}
                  canvasPosition={contextMenuState.canvasPosition}
                  menuItems={getCanvasContextMenuItems()}
                  onClose={hideContextMenu}
                />
              )}
            {contextMenuState.type === "node" && contextMenuState.nodeId && (
              <NodeContextMenu
                position={contextMenuState.position}
                nodeId={contextMenuState.nodeId}
                menuItems={getNodeContextMenuItems()}
                onClose={hideContextMenu}
              />
            )}
          </>
        )}
      </div>
    </ThemeProvider>
  );
};
