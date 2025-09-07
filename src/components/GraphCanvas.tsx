import React, { useRef, useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useViewState, useUpdateViewState } from "../stores/graphStore";
import type { Position } from "../types/graph";

const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: ${(props) => props.theme.colors.background};
  cursor: grab;

  &.grabbing {
    cursor: grabbing;
  }
`;

const CanvasContent = styled.div<{ $zoom: number; $offset: Position }>`
  width: 100%;
  height: 100%;
  transform: scale(${(props) => props.$zoom})
    translate(${(props) => props.$offset.x}px, ${(props) => props.$offset.y}px);
  transform-origin: 0 0;
  position: relative;
`;

const GridBackground = styled.div<{ $zoom: number; $offset: Position }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(
    circle,
    ${(props) => props.theme.colors.border} 1px,
    transparent 1px
  );
  background-size: ${(props) => 20 * props.$zoom}px
    ${(props) => 20 * props.$zoom}px;
  background-position: ${(props) => props.$offset.x * props.$zoom}px
    ${(props) => props.$offset.y * props.$zoom}px;
  opacity: 0.3;
`;

interface GraphCanvasProps {
  children: React.ReactNode;
  onContextMenu?: (e: React.MouseEvent) => void;
  isConnecting?: boolean;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  children,
  onContextMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });

  const viewState = useViewState();
  const updateViewState = useUpdateViewState();
  const { zoom, offset } = viewState;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        // Left mouse button
        setIsPanning(true);
        setPanStart({
          x: e.clientX - offset.x,
          y: e.clientY - offset.y,
        });
      }
    },
    [offset]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (onContextMenu) {
        onContextMenu(e);
      }
    },
    [onContextMenu]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        updateViewState({
          offset: {
            x: e.clientX - panStart.x,
            y: e.clientY - panStart.y,
          },
        });
      }
    },
    [isPanning, panStart, updateViewState]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate zoom (25% of original speed)
      const zoomFactor = e.deltaY > 0 ? 0.975 : 1.025;
      const newZoom = Math.max(0.5, Math.min(2.0, zoom * zoomFactor)); // 최소 줌 0.5로 제한

      // Calculate new offset to zoom towards mouse position
      const zoomRatio = newZoom / zoom;
      const newOffset = {
        x: mouseX - (mouseX - offset.x) * zoomRatio,
        y: mouseY - (mouseY - offset.y) * zoomRatio,
      };

      updateViewState({
        zoom: newZoom,
        offset: newOffset,
      });
    },
    [zoom, offset, updateViewState]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleMouseMove, handleMouseUp, handleWheel]);

  return (
    <CanvasContainer
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      className={isPanning ? "grabbing" : ""}
    >
      <GridBackground $zoom={zoom} $offset={offset} />
      <CanvasContent $zoom={zoom} $offset={offset}>
        {children}
      </CanvasContent>
    </CanvasContainer>
  );
};
