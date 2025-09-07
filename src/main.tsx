import React from "react";
import ReactDOM from "react-dom/client";
import { GraphEditor, type GraphEditorConfig } from "./GraphEditor";
import type { RawGraph } from "./types/graph";
import "./index.css";

const initialGraph: RawGraph = {
  nodes: [
    {
      id: "detector-1",
      type: "detector",
      title: "Detector",
      position: { x: 100, y: 100 },
      payload: {
        model: "yolo-v8",
        confidence: 0.7,
        classes: ["person", "car", "truck"],
      },
    },
    {
      id: "tracker-1",
      type: "tracker",
      title: "Tracker",
      position: { x: 400, y: 100 },
      payload: {
        algorithm: "deep-sort",
        max_age: 30,
        n_init: 3,
      },
    },
    {
      id: "ga-1",
      type: "ga",
      title: "G/A",
      position: { x: 700, y: 50 },
      payload: {
        features: ["step_length", "cadence", "stride_width"],
        window_size: 60,
      },
    },
    {
      id: "sf-1",
      type: "sf",
      title: "SF",
      position: { x: 700, y: 200 },
      payload: {
        safety_zones: ["entrance", "exit", "danger_zone"],
        alert_threshold: 0.8,
      },
    },
    {
      id: "event-1",
      type: "event",
      title: "Event",
      position: { x: 1000, y: 125 },
      payload: {
        event_types: ["fall_detection", "intrusion", "loitering"],
        output_format: "json",
      },
    },
  ],
  edges: [
    {
      id: "edge-1",
      sourceNodeId: "detector-1",
      targetNodeId: "tracker-1",
    },
    {
      id: "edge-2",
      sourceNodeId: "tracker-1",
      targetNodeId: "ga-1",
    },
    {
      id: "edge-3",
      sourceNodeId: "tracker-1",
      targetNodeId: "sf-1",
    },
    {
      id: "edge-4",
      sourceNodeId: "ga-1",
      targetNodeId: "event-1",
    },
    {
      id: "edge-5",
      sourceNodeId: "sf-1",
      targetNodeId: "event-1",
    },
  ],
  viewState: {
    zoom: 1,
    offset: { x: 0, y: 0 },
  },
};

const config: GraphEditorConfig = {
  initialGraph,
  nodeTypes: [
    {
      id: "detector",
      label: "Detector",
      color: "#ff6b6b",
      allowMultipleInputs: false,
    },
    {
      id: "tracker",
      label: "Tracker",
      color: "#4ecdc4",
      allowMultipleInputs: false,
    },
    {
      id: "ga",
      label: "G/A",
      color: "#45b7d1",
      allowMultipleInputs: true,
    },
    {
      id: "sf",
      label: "SF",
      color: "#96ceb4",
      allowMultipleInputs: true,
    },
    {
      id: "event",
      label: "Event",
      color: "#ffeaa7",
      allowMultipleInputs: true,
    },
  ],
  onGraphChange: (graph, node, edges) => {
    console.log("Graph changed:", graph);
    if (node) {
      console.log("Related node:", node);
    }
    if (edges && edges.length > 0) {
      console.log("Related edges:", edges);
    }
  },
  onNodeChange: (nodeId, changeType, data) => {
    console.log("Node changed:", { nodeId, changeType, data });
  },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GraphEditor config={config} width="100vw" height="100vh" />
  </React.StrictMode>
);
