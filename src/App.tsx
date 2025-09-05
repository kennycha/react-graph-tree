import React, { useEffect, useCallback, useState } from 'react';
import { GraphCanvas } from './components/GraphCanvas';
import { NodeCard } from './components/NodeCard';
import { EdgeLayer } from './components/EdgeLayer';
import { useGraphStore } from './stores/graphStore';
import type { NodeType } from './types/graph';

function App() {
  const { 
    graph, 
    addNode, 
    updateConnectionPosition, 
    cancelConnection, 
    connectionState,
    setOnConnect,
    setOnDisconnect,
    setOnNodeAdd,
    setOnNodeRemove,
    setOnNodeUpdate
  } = useGraphStore();
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Set up callbacks
  useEffect(() => {
    setOnConnect((sourceId, targetId, edgeId) => {
      console.log(`Connected: ${sourceId} -> ${targetId} (${edgeId})`);
    });

    setOnDisconnect((sourceId, targetId, edgeId) => {
      console.log(`Disconnected: ${sourceId} -> ${targetId} (${edgeId})`);
    });

    setOnNodeAdd((node) => {
      console.log(`Node added: ${node.type} (${node.id})`);
    });

    setOnNodeRemove((nodeId) => {
      console.log(`Node removed: ${nodeId}`);
    });

    setOnNodeUpdate((nodeId, updates) => {
      console.log(`Node updated: ${nodeId}`, updates);
    });
  }, [setOnConnect, setOnDisconnect, setOnNodeAdd, setOnNodeRemove, setOnNodeUpdate]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mouse move for connection preview
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (connectionState.isConnecting) {
      // Screen coordinates를 world coordinates로 변환
      const worldPosition = {
        x: (e.clientX - graph.viewState.offset.x) / graph.viewState.zoom,
        y: (e.clientY - graph.viewState.offset.y) / graph.viewState.zoom
      };
      updateConnectionPosition(worldPosition);
    }
  }, [connectionState.isConnecting, updateConnectionPosition, graph.viewState]);

  // Handle escape key to cancel connection
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && connectionState.isConnecting) {
      cancelConnection();
    }
  }, [connectionState.isConnecting, cancelConnection]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseMove, handleKeyDown]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // Simple context menu for now - add a random node type
    const nodeTypes: NodeType[] = ['Detector', 'Tracker', 'G/A', 'SF', 'Event'];
    const randomType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
    
    // Convert screen coordinates to canvas coordinates
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const canvasRect = target.getBoundingClientRect();
    const position = {
      x: (e.clientX - canvasRect.left - graph.viewState.offset.x) / graph.viewState.zoom,
      y: (e.clientY - canvasRect.top - graph.viewState.offset.y) / graph.viewState.zoom
    };
    
    addNode(randomType, position);
  }, [addNode, graph.viewState]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <GraphCanvas>
        <div onContextMenu={handleContextMenu}>
          <EdgeLayer width={canvasSize.width} height={canvasSize.height} />
          
          {graph.nodes.map(node => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>
      </GraphCanvas>
    </div>
  );
}

export default App;
