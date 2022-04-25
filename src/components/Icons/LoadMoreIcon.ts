import React from "react";

export default class LoadMoreIcon extends React.Component<
{onClick: Function}
> {
    render() {
        return React.createElement("div", {
            onClick: this.props.onClick,
        }, React.createElement("p", {
            style: {
                fontSize: 100,
                lineHeight: "65px",
            },
        }, "»"), React.createElement("span", {
            style: {
                fontSize: 20,
            },
        }, "Load more"));
    }
}
