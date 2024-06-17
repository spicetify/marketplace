import React, { Component } from "react";
import { DragDropContext, Draggable, type DropResult, Droppable } from "react-beautiful-dnd";
import { LOCALSTORAGE_KEYS } from "../../../constants";
import type { Config, TabItemConfig } from "../../../types/marketplace-types";

const DnDList = (props: {
  modalConfig: Config;
  updateConfig: (CONFIG: Config) => void;
}) => {
  const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: "none",
    padding: 16,
    margin: "0 8px 0 0",
    background: isDragging ? "lightgreen" : "grey",
    ...draggableStyle
  });

  const getListStyle = (isDraggingOver) => ({
    display: "flex",
    padding: 8,
    overflow: "auto",
    background: isDraggingOver ? "lightblue" : "lightgrey"
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

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable" direction="horizontal">
        {(provided, snapshot) => (
          <div ref={provided.innerRef} style={getListStyle(snapshot.isDraggingOver)} {...provided.droppableProps}>
            {props.modalConfig.tabs.map((item, index) => (
              <Draggable key={item.name} draggableId={item.name} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                  >
                    {item.name}
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
