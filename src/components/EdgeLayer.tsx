import React, { useMemo } from "react";
import styled from "styled-components";
import {
  useNodes,
  useEdges,
  useConnectionState,
  useRemoveEdgeById,
} from "../stores/graphStore";
import type { Node } from "../types/graph";

const SVGContainer = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
  overflow: visible;
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
  const dx = x2 - x1;

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

  const svgSize = {
    width: Math.max(width * 3, 3000),
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
      removeEdgeById(edgeId);
    }
  };

  return (
    <SVGContainer width={svgSize.width} height={svgSize.height}>
      {edgePaths.map(({ edge, path }) => (
        <EdgePath
          key={edge.id}
          d={path}
          onClick={(e) => handleEdgeClick(edge.id, e)}
        />
      ))}

      {connectionPreviewPath && <ConnectionPreview d={connectionPreviewPath} />}
    </SVGContainer>
  );
};
