# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite project for building a web-based visual graph editor with ComfyUI as the primary UX reference. The goal is to create an editor where teams can visually compose ML analysis pipelines (detector → tracker → G/A → SF → event) as a directed acyclic graph (DAG).

**ComfyUI Reference**: https://github.com/Comfy-Org/ComfyUI_frontend

## Current Implementation Status

✅ **Fully Implemented:**
- ComfyUI-style visual graph editor
- Pan/zoom canvas with precise coordinate transformations
- Drag-and-drop node positioning (zoom-aware)
- Port-based connection system with curved SVG edges
- Configurable connection rules (1:N vs N:M per node)
- Real-time connection validation and visual feedback
- Zustand-based state management with callback system
- TypeScript strict mode compliance
- 10 example nodes with realistic ML pipeline data

## Key Architecture Points

- **Graph Model**: Flexible DAG structure with per-node connection rules
- **Connection Rules**: `allowMultipleInputs` boolean per node (default: 1:N, optional: N:M)
- **Node Types**: 5 main types (Detector, Tracker, G/A, SF, Event) with type-specific colors
- **State Management**: Zustand with callback hooks for external integration
- **Rendering Strategy**: 
  - Nodes: DOM-based (Card components) with transform-aware drag handling
  - Edges: Single SVG layer with ComfyUI-style curved routing
  - View transforms: CSS transform with proper coordinate conversion
- **Tech Stack**: React 19 + TypeScript + Vite + Styled-Components + Zustand

## Development Commands

```bash
# Start development server
pnpm dev

# Build the project (TypeScript compilation + Vite build)
pnpm build

# Lint the codebase
pnpm lint

# Preview production build
pnpm preview
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
│   └── EdgeLayer.tsx      # SVG edge rendering
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

## Next Steps: Library Preparation

The codebase is ready for library conversion with:
- Clean component architecture
- TypeScript strict compliance
- Callback system for external integration
- Zero external dependencies beyond React ecosystem