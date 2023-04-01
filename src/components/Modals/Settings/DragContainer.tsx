import React, { Component, ReactNode, DragEvent } from "react";

interface ContainerProps {
  children: ReactNode[];
}

interface ContainerState {
  name: string;
  draggedL: number | null;
  dragged: HTMLElement | null;
  draggedOver: HTMLElement | null;
  draggedOverL: number | null;
  content: ReactNode[];
}

export default class DragContainer extends Component<ContainerProps, ContainerState> {
  constructor(props: ContainerProps) {
    super(props);
    this.state = {
      name: "React",
      draggedL: null,
      dragged: null,
      draggedOver: null,
      draggedOverL: null,
      content: this.props.children,
    };
    this.dragStart = this.dragStart.bind(this);
    this.over = this.over.bind(this);
    this.onDrop = this.onDrop.bind(this);
  }

  dragStart(ev: DragEvent<HTMLElement>): void {
    const dragged = ev.target as HTMLElement;
    const location = [].indexOf.call(ev.target.parentNode?.children, ev.target);
    this.setState({ dragged: dragged, draggedL: location });
    ev.dataTransfer.effectAllowed = "copy";
  }

  onDrop(ev: DragEvent<HTMLElement>): void {
    const { draggedL, draggedOverL, content } = this.state;
    const newContent = [...content];

    const movingValue = newContent.splice(draggedL as number, 1)[0];
    newContent.splice(draggedOverL as number, 0, content[draggedL as number]);
    console.log("dropped", draggedL, draggedOverL, movingValue, newContent);
    this.setState({ content: newContent });
  }

  prevent(ev: DragEvent<HTMLElement>): void {
    ev.preventDefault();
  }

  over(ev: DragEvent<HTMLElement>): void {
    if (ev.target === this.state.draggedOver) return;
    const location = [].indexOf.call(ev.target.parentNode?.children, ev.target);
    this.setState({ draggedOver: ev.target as HTMLElement, draggedOverL: location });
  }

  render() {
    const draggableChildren = React.Children.map(this.state.content, (child: ReactNode) =>
      React.cloneElement(child as React.ReactElement<any>, {
        onDragStart: this.dragStart,
        onDragEnter: this.over,
        onDrop: this.onDrop,
        onDragOver: this.prevent,
      }),
    );

    return (
      <div id="container">
        {draggableChildren}
      </div>
    );
  }
}
