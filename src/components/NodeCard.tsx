import React, { useCallback, useRef, useState } from "react";
import styled from "styled-components";
import type { Node, NodeType, Position } from "../types/graph";
import {
  useSelectedNode,
  useViewState,
  useConnectionState,
  useSetSelectedNode,
  useShowContextMenu,
  useStartConnection,
  useCompleteConnection,
  useMoveNode,
} from "../stores/graphStore";

const NodeContainer = styled.div<{ $selected: boolean; $nodeType: NodeType }>`
  position: absolute;
  width: 200px;
  min-height: 80px;
  background-color: ${(props) => props.theme.colors.surface};
  border: 2px solid
    ${(props) =>
      props.$selected ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  box-shadow: ${(props) => props.theme.shadows.md};
  cursor: move;
  user-select: none;

  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const NodeHeader = styled.div<{ $nodeType: NodeType }>`
  background-color: ${(props) => {
    const color = (props.theme.colors as Record<string, string>)[
      props.$nodeType
    ];
    return color || props.theme.colors.primary;
  }};
  color: white;
  padding: ${(props) => props.theme.spacing.sm};
  border-radius: ${(props) => props.theme.borderRadius.sm}
    ${(props) => props.theme.borderRadius.sm} 0 0;
  font-weight: 600;
  font-size: 14px;
`;

const NodeBody = styled.div`
  padding: ${(props) => props.theme.spacing.md};
  color: ${(props) => props.theme.colors.text};
`;

const NodeSummary = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.colors.textSecondary};
  line-height: 1.4;
`;

const PortContainer = styled.div`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid ${(props) => props.theme.colors.border};
  background-color: ${(props) => props.theme.colors.surface};
  cursor: crosshair;
  z-index: 10;

  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
    background-color: ${(props) => props.theme.colors.primary};
  }
`;

const InputPort = styled(PortContainer)<{ $allowMultiple?: boolean }>`
  left: -8px;

  ${(props) =>
    props.$allowMultiple &&
    `
    border-color: ${props.theme.colors.success};
    &:hover {
      border-color: ${props.theme.colors.success};
      background-color: ${props.theme.colors.success};
    }
  `}
`;

const OutputPort = styled(PortContainer)`
  right: -8px;
`;

interface NodeCardProps {
  node: Node;
}

export const NodeCard: React.FC<NodeCardProps> = ({ node }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

  const selectedNodeId = useSelectedNode();
  const viewState = useViewState();
  const connectionState = useConnectionState();
  const setSelectedNode = useSetSelectedNode();
  const showContextMenu = useShowContextMenu();
  const startConnection = useStartConnection();
  const completeConnection = useCompleteConnection();
  const moveNode = useMoveNode();

  const isSelected = selectedNodeId === node.id;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedNode(node.id);

      if (e.button === 0) {
        setIsDragging(true);
        const screenX = node.position.x * viewState.zoom + viewState.offset.x;
        const screenY = node.position.y * viewState.zoom + viewState.offset.y;

        setDragStart({
          x: e.clientX - screenX,
          y: e.clientY - screenY,
        });
      }
    },
    [node.id, node.position, setSelectedNode, viewState]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const screenX = e.clientX - dragStart.x;
        const screenY = e.clientY - dragStart.y;

        const newPosition = {
          x: (screenX - viewState.offset.x) / viewState.zoom,
          y: (screenY - viewState.offset.y) / viewState.zoom,
        };

        moveNode(node.id, newPosition);
      }
    },
    [isDragging, dragStart, moveNode, node.id, viewState]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputPortMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (connectionState.isConnecting && connectionState.sourcePort) {
        completeConnection(node.id);
      }
    },
    [node.id, completeConnection, connectionState]
  );

  const handleOutputPortMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const nodeWidth = 200;
      const nodeHeight = 80;
      const position = {
        x: node.position.x + nodeWidth,
        y: node.position.y + nodeHeight / 2,
      };

      startConnection(node.id, position);
    },
    [node.id, node.position, startConnection]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (node.contextMenuItems && node.contextMenuItems.length > 0) {
        showContextMenu("node", { x: e.clientX, y: e.clientY }, node.id);
      }
    },
    [node.contextMenuItems, node.id, showContextMenu]
  );

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getNodeSummary = () => {
    const payloadEntries = Object.entries(node.payload);
    if (payloadEntries.length === 0) return "No configuration";

    const summary = payloadEntries
      .slice(0, 2)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: [${value.length} items]`;
        }
        if (typeof value === "object") {
          return `${key}: {...}`;
        }
        return `${key}: ${value}`;
      })
      .join(", ");

    const remaining = payloadEntries.length - 2;
    return summary + (remaining > 0 ? ` (+${remaining} more)` : "");
  };

  return (
    <NodeContainer
      ref={nodeRef}
      $selected={isSelected}
      $nodeType={node.type}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <NodeHeader $nodeType={node.type}>{node.title}</NodeHeader>

      <NodeBody>
        <NodeSummary>{getNodeSummary()}</NodeSummary>
      </NodeBody>

      <InputPort
        $allowMultiple={node.allowMultipleInputs}
        onMouseDown={handleInputPortMouseDown}
      />
      <OutputPort onMouseDown={handleOutputPortMouseDown} />
    </NodeContainer>
  );
};
