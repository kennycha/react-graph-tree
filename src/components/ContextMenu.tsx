import React, { useState } from "react";
import styled from "styled-components";
import type {
  ContextMenuItem,
  CanvasContextMenuItem,
  Position,
} from "../types/graph";

const MenuContainer = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  top: ${(props) => props.$y}px;
  left: ${(props) => props.$x}px;
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  box-shadow: ${(props) => props.theme.shadows.lg};
  z-index: 9999;
  min-width: 160px;
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
`;

const MenuItem = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  padding: ${(props) => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  border: none;
  background: none;
  color: ${(props) =>
    props.$disabled
      ? props.theme.colors.textSecondary
      : props.theme.colors.text};
  font-size: 14px;
  text-align: left;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.sm};

  &:hover {
    background-color: ${(props) =>
      props.$disabled ? "transparent" : props.theme.colors.backgroundSecondary};
  }
`;

const MenuSeparator = styled.div`
  height: 1px;
  background-color: ${(props) => props.theme.colors.border};
  margin: ${(props) => `${props.theme.spacing.xs} 0`};
`;

const SubMenuContainer = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  top: ${(props) => props.$y}px;
  left: ${(props) => props.$x}px;
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  box-shadow: ${(props) => props.theme.shadows.lg};
  min-width: 160px;
  z-index: 10001;
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
`;

const MenuItemWithSubmenu = styled(MenuItem)`
  position: relative;

  &:after {
    content: "▶";
    position: absolute;
    right: 8px;
    font-size: 10px;
    color: ${(props) => props.theme.colors.textSecondary};
  }
`;

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface NodeContextMenuProps {
  position: ContextMenuPosition;
  nodeId: string;
  menuItems: ContextMenuItem[];
  onClose: () => void;
}

interface CanvasContextMenuProps {
  position: ContextMenuPosition;
  canvasPosition: Position;
  menuItems: CanvasContextMenuItem[];
  onClose: () => void;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  position,
  nodeId,
  menuItems,
  onClose,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled || item.submenu) return;

    item.onClick(nodeId);
    onClose();
  };

  const handleItemHover = (item: ContextMenuItem) => {
    if (item.submenu && item.submenu.length > 0) {
      setHoveredItem(item.id);

      const mainMenu = document.getElementById("node-context-menu");
      if (mainMenu) {
        const rect = mainMenu.getBoundingClientRect();
        setSubmenuPosition({
          x: position.x + rect.width - 1,
          y: position.y,
        });
      } else {
        setSubmenuPosition({
          x: position.x + 160,
          y: position.y,
        });
      }
    } else {
      setHoveredItem(null);
      setSubmenuPosition(null);
    }
  };

  const handleMenuAreaLeave = () => {
    setHoveredItem(null);
    setSubmenuPosition(null);
  };

  if (menuItems.length === 0) {
    return null;
  }

  return (
    <div onMouseLeave={handleMenuAreaLeave}>
      <MenuContainer
        id="node-context-menu"
        $x={position.x}
        $y={position.y}
        onClick={handleMenuClick}
      >
        {menuItems.map((item, index) => {
          if (item.separator) {
            return <MenuSeparator key={`separator-${index}`} />;
          }

          if (item.submenu && item.submenu.length > 0) {
            return (
              <MenuItemWithSubmenu
                key={item.id}
                $disabled={item.disabled}
                onMouseEnter={() => handleItemHover(item)}
                onClick={() => handleItemClick(item)}
              >
                {item.label}
              </MenuItemWithSubmenu>
            );
          }

          return (
            <MenuItem
              key={item.id}
              $disabled={item.disabled}
              onMouseEnter={() => handleItemHover(item)}
              onClick={() => handleItemClick(item)}
            >
              {item.label}
            </MenuItem>
          );
        })}
      </MenuContainer>

      {hoveredItem &&
        submenuPosition &&
        (() => {
          const hoveredMenuItem = menuItems.find(
            (item) => item.id === hoveredItem
          );
          if (!hoveredMenuItem?.submenu) return null;

          return (
            <SubMenuContainer
              $x={submenuPosition.x}
              $y={submenuPosition.y}
              onClick={handleMenuClick}
            >
              {hoveredMenuItem.submenu.map((subItem, subIndex) => {
                if (subItem.separator) {
                  return <MenuSeparator key={`sub-separator-${subIndex}`} />;
                }

                return (
                  <MenuItem
                    key={subItem.id}
                    $disabled={subItem.disabled}
                    onClick={() => handleItemClick(subItem)}
                  >
                    {subItem.label}
                  </MenuItem>
                );
              })}
            </SubMenuContainer>
          );
        })()}
    </div>
  );
};

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  position,
  canvasPosition,
  menuItems,
  onClose,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleItemClick = (item: CanvasContextMenuItem) => {
    if (item.disabled || item.submenu) return;

    if (item.onClick) {
      item.onClick(canvasPosition);
      onClose();
    }
  };

  const handleItemHover = (item: CanvasContextMenuItem) => {
    if (item.submenu && item.submenu.length > 0) {
      setHoveredItem(item.id);

      const mainMenu = document.getElementById("canvas-context-menu");
      if (mainMenu) {
        const rect = mainMenu.getBoundingClientRect();
        setSubmenuPosition({
          x: position.x + rect.width - 1,
          y: position.y,
        });
      } else {
        setSubmenuPosition({
          x: position.x + 160,
          y: position.y,
        });
      }
    } else {
      setHoveredItem(null);
      setSubmenuPosition(null);
    }
  };

  const handleMenuAreaLeave = () => {
    setHoveredItem(null);
    setSubmenuPosition(null);
  };

  if (menuItems.length === 0) {
    return null;
  }

  return (
    <div onMouseLeave={handleMenuAreaLeave}>
      <MenuContainer
        id="canvas-context-menu"
        $x={position.x}
        $y={position.y}
        onClick={handleMenuClick}
      >
        {menuItems.map((item, index) => {
          if (item.separator) {
            return <MenuSeparator key={`separator-${index}`} />;
          }

          if (item.submenu && item.submenu.length > 0) {
            return (
              <MenuItemWithSubmenu
                key={item.id}
                $disabled={item.disabled}
                onMouseEnter={() => handleItemHover(item)}
                onClick={() => handleItemClick(item)}
              >
                {item.label}
              </MenuItemWithSubmenu>
            );
          }

          return (
            <MenuItem
              key={item.id}
              $disabled={item.disabled}
              onMouseEnter={() => handleItemHover(item)}
              onClick={() => handleItemClick(item)}
            >
              {item.label}
            </MenuItem>
          );
        })}
      </MenuContainer>

      {hoveredItem &&
        submenuPosition &&
        (() => {
          const hoveredMenuItem = menuItems.find(
            (item) => item.id === hoveredItem
          );
          if (!hoveredMenuItem?.submenu) return null;

          return (
            <SubMenuContainer
              $x={submenuPosition.x}
              $y={submenuPosition.y}
              onClick={handleMenuClick}
            >
              {hoveredMenuItem.submenu.map((subItem, subIndex) => {
                if (subItem.separator) {
                  return <MenuSeparator key={`sub-separator-${subIndex}`} />;
                }

                return (
                  <MenuItem
                    key={subItem.id}
                    $disabled={subItem.disabled}
                    onClick={() => handleItemClick(subItem)}
                  >
                    {subItem.label}
                  </MenuItem>
                );
              })}
            </SubMenuContainer>
          );
        })()}
    </div>
  );
};
