# @kennycha/react-graph-tree

A visual graph editor React component for building node-based workflows.

## Installation

```bash
npm install @kennycha/react-graph-tree
# or
pnpm add @kennycha/react-graph-tree
```

## Quick Start

```tsx
import { GraphEditor } from "@kennycha/react-graph-tree";

const config = {
  nodeTypes: [
    { id: "input", label: "Input", color: "#3b82f6" },
    { id: "process", label: "Process", color: "#10b981" },
    { id: "transform", label: "Transform", color: "#f59e0b" },
    { id: "filter", label: "Filter", color: "#ef4444" },
    { id: "output", label: "Output", color: "#8b5cf6" },
  ],
  onGraphChange: (graph, node, edges) => {
    // ...
  },
  onNodeChange: (nodeId, changeType, data) => {
    // ...
  },
};

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <GraphEditor config={config} width="100%" height="100%" />
    </div>
  );
}
```

## Requirements

- React >= 18.0.0
- styled-components >= 5.0.0
- zustand >= 4.0.0

## Features

- **Visual Graph Editing**: Drag nodes, create connections by dragging from output ports
- **Context Menus**: Right-click nodes/canvas for actions (duplicate, delete, add nodes, zoom)
- **Pan & Zoom**: Mouse wheel to zoom, drag to pan
- **Connection Rules**: Configurable input limits per node type
- **Theming**: Customizable colors and styling

## Controls

- **Add Node**: Right-click canvas → select node type
- **Connect Nodes**: Drag from right side (output) to left side (input) of nodes
- **Delete Connection**: Double-click connection line
- **Pan**: Left-click drag on empty canvas
- **Zoom**: Mouse wheel
- **Node Actions**: Right-click node → duplicate/delete/disconnect
- **Cancel Connection**: Press Escape while connecting
