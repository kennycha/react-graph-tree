# @kennycha/react-graph-tree

[![npm version](https://badge.fury.io/js/@kennycha%2Freact-graph-tree.svg)](https://www.npmjs.com/package/@kennycha/react-graph-tree)

A visual graph editor React component for building node-based workflows.

## Demo

**[Live Demo](https://kennycha.github.io/react-graph-tree-sample/)**

## Installation

```bash
npm install @kennycha/react-graph-tree
# or
pnpm add @kennycha/react-graph-tree
```

## Quick Start

```tsx
import { useState } from "react";
import { GraphEditor } from "@kennycha/react-graph-tree";

const INITIAL_GRAPH = {
  nodes: [
    {
      id: "detector1",
      title: "Detector 1",
      type: "detector",
      position: { x: 50, y: 100 },
      payload: {},
      allowMultipleInputs: false,
    },
    {
      id: "output1",
      title: "Output 1", 
      type: "output",
      position: { x: 400, y: 100 },
      payload: {},
      allowMultipleInputs: true,
    },
  ],
  edges: [
    { id: "edge1", sourceNodeId: "detector1", targetNodeId: "output1" },
  ],
  viewState: {
    offset: { x: 0, y: 0 },
    zoom: 1.0,
  },
};

function App() {
  const [currentGraph, setCurrentGraph] = useState(INITIAL_GRAPH);

  const config = {
    graph: currentGraph,
    nodeTypes: [
      { id: "detector", label: "Detector", color: "red" },
      { id: "tracker", label: "Tracker", color: "blue" },
      { id: "feature", label: "Feature", color: "green" },
      { id: "filter", label: "Filter", color: "purple" },
      { id: "output", label: "Output", color: "orange", allowMultipleInputs: true },
    ],
    onGraphChange: (graph) => {
      setCurrentGraph(graph);
    },
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <GraphEditor config={config} />
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
