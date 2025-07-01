import React, { useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "react-beautiful-dnd";
import { LOCALSTORAGE_KEYS } from "../../../constants";
import type { Config, TabItemConfig } from "../../../types/marketplace-types";

const DnDList = (props: { modalConfig: Config; updateConfig: (CONFIG: Config) => void }) => {
  const colorVariable = getComputedStyle(document.body).getPropertyValue("--spice-button-disabled");
  const [currentSize, setCurrentSize] = useState({ width: window.innerWidth });

  useEffect(() => {
    const onResize = () => setCurrentSize({ width: window.innerWidth });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const adjustTransform = (transform: string) => {
    const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
    if (!match) return transform;
    const isMaximized = currentSize.width >= window.screen.width * 0.95;
    const offsetX = isMaximized ? 600 : 430;
    const offsetY = isMaximized ? 120 : 70;
    const x = Number.parseFloat(match[1]) - offsetX;
    const y = Number.parseFloat(match[2]) - offsetY;
    return `translate(${x}px, ${y}px)`;
  };

  const getItemStyle = (isDragging, draggableStyle, isEnabled) => {
    const style = { ...draggableStyle };
    if (isDragging && style.transform) {
      style.transform = adjustTransform(style.transform);
    }
    return {
      borderRadius: "5px",
      border: isEnabled ? `2px solid ${colorVariable}` : "2px solid red",
      userSelect: "none",
      paddingTop: 12,
      paddingBottom: 12,
      width: "110px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: isEnabled ? "none" : "line-through",
      cursor: "pointer",
      ...style
    };
  };

  const getListStyle = () => ({
    display: "flex",
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8
  });

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    reorder(props.modalConfig.tabs, source.index, destination.index);
  };

  function reorder(tabs: TabItemConfig[], start: number, end: number) {
    const result = Array.from(tabs);
    const [removed] = result.splice(start, 1);
    result.splice(end, 0, removed);

    props.modalConfig.tabs = result;

    localStorage.setItem(LOCALSTORAGE_KEYS.tabs, JSON.stringify(props.modalConfig.tabs));

    props.updateConfig(props.modalConfig);
  }

  const onToggleEnabled = (name) => {
    const updatedTabs = props.modalConfig.tabs.map((tab) => (tab.name === name ? { ...tab, enabled: !tab.enabled } : tab));

    props.modalConfig.tabs = updatedTabs;
    localStorage.setItem(LOCALSTORAGE_KEYS.tabs, JSON.stringify(props.modalConfig.tabs));
    props.updateConfig(props.modalConfig);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable" direction="horizontal">
        {(provided, _snapshot) => (
          <div ref={provided.innerRef} style={getListStyle()} {...provided.droppableProps}>
            {props.modalConfig.tabs.map((item, index) => (
              <Draggable key={item.name} draggableId={item.name} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={getItemStyle(snapshot.isDragging, provided.draggableProps.style, item.enabled)}
                  >
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: Spotify stylings */}
                    <div className="dnd-box" {...provided.dragHandleProps} onClick={() => onToggleEnabled(item.name)}>
                      <svg
                        className="dnd-icon"
                        fill="currentColor"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-label="Drag icon"
                        role="img"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M7.375 3.67c0-.645-.56-1.17-1.25-1.17s-1.25.525-1.25 1.17c0 .646.56 1.17 1.25 1.17s1.25-.524 1.25-1.17zm0 8.66c0-.646-.56-1.17-1.25-1.17s-1.25.524-1.25 1.17c0 .645.56 1.17 1.25 1.17s1.25-.525 1.25-1.17zm-1.25-5.5c.69 0 1.25.525 1.25 1.17 0 .645-.56 1.17-1.25 1.17S4.875 8.645 4.875 8c0-.645.56-1.17 1.25-1.17zm5-3.16c0-.645-.56-1.17-1.25-1.17s-1.25.525-1.25 1.17c0 .646.56 1.17 1.25 1.17s1.25-.524 1.25-1.17zm-1.25 7.49c.69 0 1.25.524 1.25 1.17 0 .645-.56 1.17-1.25 1.17s-1.25-.525-1.25-1.17c0-.646.56-1.17 1.25-1.17zM11.125 8c0-.645-.56-1.17-1.25-1.17s-1.25.525-1.25 1.17c0 .645.56 1.17 1.25 1.17s1.25-.525 1.25-1.17z"
                        />
                      </svg>
                      {item.name === "Extensions" ? "Extens." : item.name}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DnDList;
