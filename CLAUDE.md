# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite library project for building a web-based visual graph editor. Published as `@kennycha/react-graph-tree` on npm, it provides components for teams to visually compose node-based workflows as a directed acyclic graph (DAG).

## Current Implementation Status

✅ **Fully Implemented:**
- Visual graph editor with intuitive interface
- Pan/zoom canvas with precise coordinate transformations
- Drag-and-drop node positioning (zoom-aware)
- Port-based connection system with curved SVG edges
- Configurable connection rules (1:N vs N:M per node)
- Real-time connection validation and visual feedback
- Zustand-based state management with callback system
- TypeScript strict mode compliance
- Flexible node type configuration

## Key Architecture Points

- **Graph Model**: Flexible DAG structure with per-node connection rules
- **Connection Rules**: `allowMultipleInputs` boolean per node (default: 1:N, optional: N:M)
- **Node Types**: Configurable node types with custom labels and colors
- **State Management**: Zustand with callback hooks for external integration
- **Rendering Strategy**: 
  - Nodes: DOM-based (Card components) with transform-aware drag handling
  - Edges: Single SVG layer with curved routing
  - View transforms: CSS transform with proper coordinate conversion
- **Tech Stack**: React 19 + TypeScript + Vite + Styled-Components + Zustand

## Development Commands

```bash
# Start development server
pnpm dev

# Build library for distribution (TypeScript + Vite library build)
pnpm build:lib

# Lint the codebase
pnpm lint

# Preview production build
pnpm preview

# Publish to npm (after build:lib)
npm publish --access public
```

## Implemented Features

✅ **Core Graph Editor:**
- Node creation via right-click (currently random type, ready for context menu)
- Smooth drag-and-drop node positioning with zoom awareness
- Port-based connection system with curved SVG edges
- Real-time connection validation with visual feedback
- Canvas pan/zoom with mouse wheel (2.5% increment for precision)
- Node selection and deletion (double-click edges to delete)

✅ **Connection System:**
- Direction: Left (input) ← Right (output)
- Configurable per-node connection rules (`allowMultipleInputs`)
- Cycle detection prevents DAG violations
- Visual port highlighting (green = N:M capable, default = 1:N only)
- Connection preview with rubber-band effect

✅ **State Management & Integration:**
- Zustand store with callback system for external integration
- `onConnect`, `onDisconnect`, `onNodeAdd`, `onNodeRemove`, `onNodeUpdate` callbacks
- Type-safe throughout with strict TypeScript

## Project Structure

```
src/
├── components/          # React components
│   ├── GraphCanvas.tsx    # Main canvas with pan/zoom
│   ├── NodeCard.tsx       # Individual node component
│   ├── EdgeLayer.tsx      # SVG edge rendering
│   └── ContextMenu.tsx    # Context menu components
├── stores/              # State management
│   └── graphStore.ts      # Zustand store with callbacks
├── types/               # TypeScript definitions
│   ├── graph.ts           # Core graph types
│   ├── theme.ts           # Styling theme
│   └── styled.d.ts        # Styled-components theme
├── utils/               # Utility functions
│   └── graph.ts           # Graph manipulation utilities
└── main.tsx             # React entry point
```

## Core Architecture Patterns

### State Management (graphStore.ts)
- **Zustand Store**: Single centralized store with subscribeWithSelector middleware
- **State Separation**: GraphState (core data), UIState (interactions), CallbackState (external hooks)
- **Selective Subscriptions**: Fine-grained selectors prevent unnecessary re-renders
- **Callback Integration**: External `onGraphChange`/`onNodeChange` callbacks for library integration

### Component Architecture
- **GraphEditor**: Main wrapper component handling configuration and callbacks
- **GraphCanvas**: Canvas container with pan/zoom transforms
- **NodeCard**: Individual node rendering with drag handling
- **EdgeLayer**: SVG-based edge rendering layer
- **ContextMenu**: Dynamic menu system (canvas/node specific)

### Type System Architecture
- **NodeTypeConfig**: Configuration-driven node type system
- **Flexible NodeType**: String-based for dynamic node types
- **Strict TypeScript**: All components use strict mode with comprehensive typing

### Build System
- **Dual Build**: Development (Vite dev server) + Library (rollup build)
- **Library Mode**: ES/CJS modules with TypeScript declarations
- **External Dependencies**: React, styled-components, zustand as peer dependencies
- **TypeScript Config**: Separate configs for app (`tsconfig.app.json`) and library (`tsconfig.lib.json`)

## Library Status

✅ **Published as npm package**: `@kennycha/react-graph-tree`
- Clean component architecture with proper exports
- TypeScript strict compliance with declaration files
- Callback system for external integration  
- Peer dependencies: react, react-dom, styled-components, zustand
- ES/CJS module support with source maps
- Ready for production use

## Usage as Library

```tsx
import { GraphEditor } from "@kennycha/react-graph-tree";
// See README.md for complete usage examples
```

## Important Development Notes

- **Connection Logic**: All connection validation happens in `utils/graph.ts:validateConnection`
- **Coordinate System**: World coordinates (graph space) vs screen coordinates (DOM space) conversion in GraphEditor
- **Drag Handling**: Zoom-aware drag calculations in NodeCard component
- **Edge Rendering**: SVG curves calculated in EdgeLayer with proper port positioning
- **Context Menus**: Dynamic menu generation based on GraphEditorConfig
- **State Callbacks**: Async callback support with proper error handling

## Testing & Quality

- **Lint Command**: `pnpm lint` (ESLint with React hooks plugin)
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Build Verification**: `pnpm build:lib` creates distribution files
- **Library Testing**: Use `pnpm example` to test in example project