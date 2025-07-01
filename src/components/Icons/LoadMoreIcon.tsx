import React from "react";

export default class LoadMoreIcon extends React.Component<{ onClick: () => void }> {
  render() {
    return (
      <button
        style={{
          marginTop: "60px",
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer"
        }}
        onClick={this.props.onClick}
      >
        <p
          style={{
            fontSize: 100,
            lineHeight: "65px"
          }}
        >
          »
        </p>
        <span
          style={{
            fontSize: 20
          }}
        >
          Load more
        </span>
      </button>
    );
  }
}
