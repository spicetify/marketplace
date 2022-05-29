import React from "react";

const LoadingIcon = () => {
  //   return React.createElement("svg", {
  //       width: "100px", height: "100px", viewBox: "0 0 100 100", preserveAspectRatio: "xMidYMid",
  //   }, React.createElement("circle", {
  //       cx: "50", cy: "50", r: "0", fill: "none", stroke: "currentColor", "stroke-width": "2",
  //   }, React.createElement("animate", {
  //       attributeName: "r", repeatCount: "indefinite", dur: "1s", values: "0;40", keyTimes: "0;1", keySplines: "0 0.2 0.8 1", calcMode: "spline", begin: "0s",
  //   }), React.createElement("animate", {
  //       attributeName: "opacity", repeatCount: "indefinite", dur: "1s", values: "1;0", keyTimes: "0;1", keySplines: "0.2 0 0.8 1", calcMode: "spline", begin: "0s",
  //   })), React.createElement("circle", {
  //       cx: "50", cy: "50", r: "0", fill: "none", stroke: "currentColor", "stroke-width": "2",
  //   }, React.createElement("animate", {
  //       attributeName: "r", repeatCount: "indefinite", dur: "1s", values: "0;40", keyTimes: "0;1", keySplines: "0 0.2 0.8 1", calcMode: "spline", begin: "-0.5s",
  //   }), React.createElement("animate", {
  //       attributeName: "opacity", repeatCount: "indefinite", dur: "1s", values: "1;0", keyTimes: "0;1", keySplines: "0.2 0 0.8 1", calcMode: "spline", begin: "-0.5s",
  //   })));

  return (
    <svg width="100px" height="100px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
      <circle cx="50" cy="50" r="0" fill="none" stroke="currentColor" strokeWidth="2">
        <animate attributeName="r" repeatCount="indefinite" dur="1s" values="0;40" keyTimes="0;1" keySplines="0 0.2 0.8 1" calcMode="spline" begin="0s" />
        <animate attributeName="opacity" repeatCount="indefinite" dur="1s" values="1;0" keyTimes="0;1" keySplines="0.2 0 0.8 1" calcMode="spline" begin="0s" />
      </circle>
      <circle cx="50" cy="50" r="0" fill="none" stroke="currentColor" strokeWidth="2">
        <animate attributeName="r" repeatCount="indefinite" dur="1s" values="0;40" keyTimes="0;1" keySplines="0 0.2 0.8 1" calcMode="spline" begin="-0.5s" />
        <animate attributeName="opacity" repeatCount="indefinite" dur="1s" values="1;0" keyTimes="0;1" keySplines="0.2 0 0.8 1" calcMode="spline" begin="-0.5s" />
      </circle>
    </svg>
  );
};

export default LoadingIcon;
