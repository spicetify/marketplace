import React, { Children, useState } from "react";

/**
 * A Draggable component
 * @param props
 */
const Draggable = (props: {
  children: React.ReactNode;
  onDragEnd: (currentPos: any, newPos: any) => void;
}) => {
  const [dragId, setDragId] = useState();

  const handleDrag = (ev) => {
    console.log(`Grabbed ${ev.currentTarget.dataset.dragId}`);
    setDragId(ev.currentTarget.dataset.dragId);
  };

  const handleDrop = (ev) => {
    console.log(`Dropped ${dragId} onto ${ev.currentTarget.dataset.dragId}`);
    // if (ev.defaultPrevented) {
    //   return;
    // }
    props.onDragEnd(dragId, ev.currentTarget.dataset.dragId);
    setDragId(undefined);
  };

  const handleDragOver = (ev) => {
    console.log("Running drag over");
    ev.preventDefault();
  };

  return (
    <div className="Draggable"
      // onDragOver={handleDragOver} onDragEnter={handleDragOver}
    >
      {Children.map(props.children, (child, index) => {
        return (
          <div
            className="DraggableItem"
            data-drag-id={index}
            draggable={true}
            // Cancel these
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            // Handle these
            onDragStart={handleDrag}
            onDrop={handleDrop}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};

export default Draggable;
