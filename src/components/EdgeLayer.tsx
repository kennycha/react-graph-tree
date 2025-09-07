import React, { useMemo } from "react";
import styled from "styled-components";
import { useNodes, useEdges, useConnectionState, useRemoveEdgeById } from "../stores/graphStore";
import type { Node } from "../types/graph";

const SVGContainer = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
  overflow: visible; /* 중요: SVG가 잘리지 않도록 */
`;

const EdgePath = styled.path<{ $isActive?: boolean }>`
  fill: none;
  stroke: ${(props) =>
    props.$isActive
      ? props.theme.colors.connectionActive
      : props.theme.colors.connection};
  stroke-width: 2;
  pointer-events: stroke;
  cursor: pointer;

  &:hover {
    stroke: ${(props) => props.theme.colors.connectionActive};
    stroke-width: 3;
  }
`;

const ConnectionPreview = styled.path`
  fill: none;
  stroke: ${(props) => props.theme.colors.connectionActive};
  stroke-width: 2;
  stroke-dasharray: 5, 5;
  pointer-events: none;
`;

interface EdgeLayerProps {
  width: number;
  height: number;
}

const createCurvedPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string => {
  // ComfyUI style curved connection
  const dx = x2 - x1;

  // Control points for smooth curve
  const controlPointOffset = Math.max(Math.abs(dx) * 0.5, 100);
  const cp1x = x1 + controlPointOffset;
  const cp1y = y1;
  const cp2x = x2 - controlPointOffset;
  const cp2y = y2;

  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
};

const getNodePortPosition = (node: Node, portType: "input" | "output") => {
  const nodeWidth = 200;
  const nodeHeight = 80;

  if (portType === "input") {
    return {
      x: node.position.x,
      y: node.position.y + nodeHeight / 2,
    };
  } else {
    return {
      x: node.position.x + nodeWidth,
      y: node.position.y + nodeHeight / 2,
    };
  }
};

export const EdgeLayer: React.FC<EdgeLayerProps> = ({ width, height }) => {
  const nodes = useNodes();
  const edges = useEdges();
  const connectionState = useConnectionState();
  const removeEdgeById = useRemoveEdgeById();

  // 큰 고정 크기 SVG 사용 - 간단하고 안전한 방법
  const svgSize = {
    width: Math.max(width * 3, 3000), // 최소 3000px 또는 캔버스의 3배
    height: Math.max(height * 3, 3000),
  };

  const edgePaths = useMemo(() => {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));

    return edges
      .map((edge) => {
        const sourceNode = nodeMap.get(edge.sourceNodeId);
        const targetNode = nodeMap.get(edge.targetNodeId);

        if (!sourceNode || !targetNode) return null;

        const sourcePos = getNodePortPosition(sourceNode, "output");
        const targetPos = getNodePortPosition(targetNode, "input");

        return {
          edge,
          path: createCurvedPath(
            sourcePos.x,
            sourcePos.y,
            targetPos.x,
            targetPos.y
          ),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [nodes, edges]);

  const connectionPreviewPath = useMemo(() => {
    if (
      !connectionState.isConnecting ||
      !connectionState.sourcePort ||
      !connectionState.currentPosition
    ) {
      return null;
    }

    const sourceNode = nodes.find(
      (node) => node.id === connectionState.sourcePort!.nodeId
    );
    if (!sourceNode) return null;

    const sourcePos = getNodePortPosition(sourceNode, "output");

    // EdgeLayer는 CSS transform 안에 있으므로 currentPosition을 그대로 사용
    return createCurvedPath(
      sourcePos.x,
      sourcePos.y,
      connectionState.currentPosition.x,
      connectionState.currentPosition.y
    );
  }, [connectionState, nodes]);

  const handleEdgeClick = (edgeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.detail === 2) {
      // Double click
      removeEdgeById(edgeId);
    }
  };

  return (
    <SVGContainer width={svgSize.width} height={svgSize.height}>
      {/* Existing edges */}
      {edgePaths.map(({ edge, path }) => (
        <EdgePath
          key={edge.id}
          d={path}
          onClick={(e) => handleEdgeClick(edge.id, e)}
        />
      ))}

      {/* Connection preview */}
      {connectionPreviewPath && <ConnectionPreview d={connectionPreviewPath} />}
    </SVGContainer>
  );
};
