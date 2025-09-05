import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import type { Node, NodeType, Position } from '../types/graph';
import { useGraphStore } from '../stores/graphStore';

const NodeContainer = styled.div<{ $selected: boolean; $nodeType: NodeType }>`
  position: absolute;
  width: 200px;
  min-height: 80px;
  background-color: ${props => props.theme.colors.surface};
  border: 2px solid ${props => props.$selected ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.md};
  cursor: move;
  user-select: none;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const NodeHeader = styled.div<{ $nodeType: NodeType }>`
  background-color: ${props => {
    const typeColors = {
      'Detector': props.theme.colors.detector,
      'Tracker': props.theme.colors.tracker,
      'G/A': props.theme.colors.ga,
      'SF': props.theme.colors.sf,
      'Event': props.theme.colors.event,
    };
    return typeColors[props.$nodeType];
  }};
  color: white;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm} ${props => props.theme.borderRadius.sm} 0 0;
  font-weight: 600;
  font-size: 14px;
`;

const NodeBody = styled.div`
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text};
`;

const NodeTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const NodeSummary = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.4;
`;

const PortContainer = styled.div`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.surface};
  cursor: crosshair;
  z-index: 10;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background-color: ${props => props.theme.colors.primary};
  }
`;

const InputPort = styled(PortContainer)<{ $allowMultiple?: boolean }>`
  left: -8px;
  
  ${props => props.$allowMultiple && `
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
  
  const { 
    selectedNodeId, 
    setSelectedNode, 
    moveNode,
    startConnection,
    completeConnection,
    connectionState,
    graph
  } = useGraphStore();

  const isSelected = selectedNodeId === node.id;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(node.id);
    
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      // 현재 zoom과 offset을 고려한 screen coordinates와 node position 차이를 계산
      const screenX = node.position.x * graph.viewState.zoom + graph.viewState.offset.x;
      const screenY = node.position.y * graph.viewState.zoom + graph.viewState.offset.y;
      
      setDragStart({
        x: e.clientX - screenX,
        y: e.clientY - screenY
      });
    }
  }, [node.id, node.position, setSelectedNode, graph.viewState]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      // Screen coordinates에서 dragStart offset을 빼고, zoom과 canvas offset을 고려하여 world coordinates로 변환
      const screenX = e.clientX - dragStart.x;
      const screenY = e.clientY - dragStart.y;
      
      const newPosition = {
        x: (screenX - graph.viewState.offset.x) / graph.viewState.zoom,
        y: (screenY - graph.viewState.offset.y) / graph.viewState.zoom
      };
      
      moveNode(node.id, newPosition);
    }
  }, [isDragging, dragStart, moveNode, node.id, graph.viewState]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputPortMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Input ports don't start connections, they complete them
    if (connectionState.isConnecting && connectionState.sourcePort) {
      completeConnection(node.id);
    }
  }, [node.id, completeConnection, connectionState]);

  const handleOutputPortMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // 노드의 world coordinates에서 출력 포트 위치 계산
    const nodeWidth = 200;
    const nodeHeight = 80;
    const position = {
      x: node.position.x + nodeWidth,
      y: node.position.y + nodeHeight / 2
    };
    startConnection(node.id, position);
  }, [node.id, node.position, startConnection]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getNodeSummary = () => {
    const payloadEntries = Object.entries(node.payload);
    if (payloadEntries.length === 0) return 'No configuration';
    
    // Show first few key-value pairs
    const summary = payloadEntries.slice(0, 2).map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.length} items]`;
      }
      if (typeof value === 'object') {
        return `${key}: {...}`;
      }
      return `${key}: ${value}`;
    }).join(', ');
    
    const remaining = payloadEntries.length - 2;
    return summary + (remaining > 0 ? ` (+${remaining} more)` : '');
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
    >
      <NodeHeader $nodeType={node.type}>
        {node.type}
      </NodeHeader>
      
      <NodeBody>
        <NodeTitle>{node.title}</NodeTitle>
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