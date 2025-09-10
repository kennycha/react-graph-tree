import {
  useEffect,
  useCallback,
  useState,
  useRef,
  useMemo,
  type FunctionComponent,
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
  useGraphStore,
} from "./stores/graphStore";
import { CanvasContextMenu, NodeContextMenu } from "./components/ContextMenu";
import type {
  CanvasContextMenuItem,
  ContextMenuItem,
  Edge,
  Node,
  Graph,
  NodeTypeConfig,
} from "./types/graph";
import { validateGraphWithNodeTypes } from "./utils/graph";
export interface GraphEditorConfig {
  nodeTypes: NodeTypeConfig[];
  canvasContextMenuItems?: CanvasContextMenuItem[];
  defaultNodeContextMenuItems?: ContextMenuItem[];
  theme?: Partial<Theme>;
  width?: number | string;
  height?: number | string;
  graph?: Graph;
  onNodeChange?: (
    nodeId: string,
    changeType: "title" | "payload" | "position",
    data?: unknown
  ) => void | Promise<void>;
  onGraphChange?: (
    graph: Graph,
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

export const GraphEditor: FunctionComponent<GraphEditorProps> = ({
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

  const nodeTypeConfigMap = useMemo(() => {
    const map = new Map<string, NodeTypeConfig>();
    config.nodeTypes.forEach((nodeType) => {
      map.set(nodeType.id, nodeType);
    });
    return map;
  }, [config.nodeTypes]);

  useEffect(() => {
    setNodeTypeConfigMap(nodeTypeConfigMap);
  }, [nodeTypeConfigMap, setNodeTypeConfigMap]);

  const nodeContextMenuItems = useMemo((): ContextMenuItem[] => {
    if (config.defaultNodeContextMenuItems) {
      return config.defaultNodeContextMenuItems;
    }

    return [
      {
        id: "edit-title",
        label: "Edit Title",
        onClick: async (id: string) => {
          if (onNodeChangeRef.current) {
            const result = onNodeChangeRef.current(id, "title");
            if (result instanceof Promise) {
              await result;
            }
          } else {
            const node = nodes.find((n) => n.id === id);
            if (node) {
              const newTitle = prompt("Enter new title:", node.title);
              if (newTitle !== null && newTitle.trim() !== "") {
                updateNode(id, { title: newTitle.trim() });
              }
            }
          }
        },
      },
      {
        id: "edit-payload",
        label: "Edit Properties",
        onClick: async (id: string) => {
          if (onNodeChangeRef.current) {
            const node = nodes.find((n) => n.id === id);
            const result = onNodeChangeRef.current(
              id,
              "payload",
              node?.payload
            );
            if (result instanceof Promise) {
              await result;
            }
          } else {
            const node = nodes.find((n) => n.id === id);
            if (node) {
              const payloadStr = JSON.stringify(node.payload, null, 2);
              const newPayloadStr = prompt(
                "Edit properties in JSON format:",
                payloadStr
              );
              if (newPayloadStr !== null) {
                try {
                  const newPayload = JSON.parse(newPayloadStr);
                  updateNode(id, { payload: newPayload });
                } catch (error) {
                  console.error(error);
                  alert("Invalid JSON format.");
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
        label: "Duplicate",
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
        label: "Disconnect All",
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
        label: "Delete",
        onClick: (id: string) => removeNodeById(id),
      },
    ];
  }, [
    config.defaultNodeContextMenuItems,
    nodes,
    updateNode,
    duplicateNode,
    disconnectAllFromNode,
    removeNodeById,
  ]);

  const canvasContextMenuItems = useMemo((): CanvasContextMenuItem[] => {
    if (config.canvasContextMenuItems) {
      return config.canvasContextMenuItems;
    }

    const nodeTypeSubmenu: CanvasContextMenuItem[] = config.nodeTypes.map(
      (nodeType) => ({
        id: `add-${nodeType.id}`,
        label: nodeType.label,
        onClick: (position) => {
          addNode(nodeType.id, position, {
            title: nodeType.label,
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
        label: "Zoom In",
        onClick: () => {
          const currentZoom = viewState.zoom;
          setZoom(Math.min(2.0, currentZoom * 1.25));
        },
      },
      {
        id: "zoom-out",
        label: "Zoom Out",
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
        label: "Add Node",
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

  const theme = useMemo(() => {
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
        ...nodeTypeColors,
      },
    };
  }, [config.nodeTypes, config.theme]);

  const onGraphChangeRef = useRef(config.onGraphChange);
  const onNodeChangeRef = useRef(config.onNodeChange);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (config.graph) {
      const validation = validateGraphWithNodeTypes(config.graph, config.nodeTypes);
      if (!validation.valid) {
        console.error("Graph validation failed:", validation.errors);
        throw new Error(`Graph validation failed: ${validation.errors.join(', ')}`);
      }

      if (isFirstRender.current) {
        setInitialGraph(config.graph);
        isFirstRender.current = false;
      } else {
        // Update only nodes and edges, preserve viewState and UI state
        const currentState = useGraphStore.getState();
        useGraphStore.setState({
          graph: {
            ...config.graph,
            viewState: currentState.graph?.viewState,
          },
        });
      }
    }
  }, [config.graph, setInitialGraph, config.nodeTypes]);

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

  const screenToWorldPosition = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();

      const canvasX = screenX - rect.left;
      const canvasY = screenY - rect.top;

      return {
        x: (canvasX - viewState.offset.x * viewState.zoom) / viewState.zoom,
        y: (canvasY - viewState.offset.y * viewState.zoom) / viewState.zoom,
      };
    },
    [viewState]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
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

  useEffect(() => {
    if (contextMenuState.isVisible) {
      const handleClickOutside = (e: Event) => {
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

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

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
                contextMenuItems: nodeContextMenuItems,
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
                  menuItems={canvasContextMenuItems}
                  onClose={hideContextMenu}
                />
              )}
            {contextMenuState.type === "node" && contextMenuState.nodeId && (
              <NodeContextMenu
                position={contextMenuState.position}
                nodeId={contextMenuState.nodeId}
                menuItems={nodeContextMenuItems}
                onClose={hideContextMenu}
              />
            )}
          </>
        )}
      </div>
    </ThemeProvider>
  );
};
