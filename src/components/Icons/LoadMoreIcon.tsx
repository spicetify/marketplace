import React from "react";

export default class LoadMoreIcon extends React.Component<{onClick: () => void}> {
  render() {
    return (
      <div className="MarketplaceIcon--loadMore" onClick={this.props.onClick}>
        <p>»</p>
        <span>Load more</span>
      </div>
    );
  }
}
