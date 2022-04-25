import React from "react";

export default class Card extends React.Component {
  render() {
    return React.createElement("div", {
      className: "card",
    }, React.createElement("h2", {
      className: "card-title",
    }, "TODO: add card component"));
  }
}
