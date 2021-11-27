// eslint-disable-next-line no-redeclare, no-unused-vars
class LoadingIcon extends react.Component {
    render() {
        return react.createElement("svg", {
            width: "100px", height: "100px", viewBox: "0 0 100 100", preserveAspectRatio: "xMidYMid",
        }, react.createElement("circle", {
            cx: "50", cy: "50", r: "0", fill: "none", stroke: "currentColor", "stroke-width": "2",
        }, react.createElement("animate", {
            attributeName: "r", repeatCount: "indefinite", dur: "1s", values: "0;40", keyTimes: "0;1", keySplines: "0 0.2 0.8 1", calcMode: "spline", begin: "0s",
        }), react.createElement("animate", {
            attributeName: "opacity", repeatCount: "indefinite", dur: "1s", values: "1;0", keyTimes: "0;1", keySplines: "0.2 0 0.8 1", calcMode: "spline", begin: "0s",
        })), react.createElement("circle", {
            cx: "50", cy: "50", r: "0", fill: "none", stroke: "currentColor", "stroke-width": "2",
        }, react.createElement("animate", {
            attributeName: "r", repeatCount: "indefinite", dur: "1s", values: "0;40", keyTimes: "0;1", keySplines: "0 0.2 0.8 1", calcMode: "spline", begin: "-0.5s",
        }), react.createElement("animate", {
            attributeName: "opacity", repeatCount: "indefinite", dur: "1s", values: "1;0", keyTimes: "0;1", keySplines: "0.2 0 0.8 1", calcMode: "spline", begin: "-0.5s",
        })));
    }
}

// eslint-disable-next-line no-redeclare, no-unused-vars
class LoadMoreIcon extends react.Component {
    render() {
        return react.createElement("div", {
            onClick: this.props.onClick,
        }, react.createElement("p", {
            style: {
                fontSize: 100,
                lineHeight: "65px",
            },
        }, "»"), react.createElement("span", {
            style: {
                fontSize: 20,
            },
        }, "Load more"));
    }
}

/* eslint-disable no-redeclare, no-unused-vars */
const TRASH_ICON = react.createElement("svg", {
    height: "16",
    role: "img",
    width: "16",
    viewBox: "0 0 448 512",
    "aria-hidden": "true",
}, react.createElement("path", {
    d: "M53.21 467c1.562 24.84 23.02 45 47.9 45h245.8c24.88 0 46.33-20.16 47.9-45L416 128H32L53.21 467zM432 32H320l-11.58-23.16c-2.709-5.42-8.25-8.844-14.31-8.844H153.9c-6.061 0-11.6 3.424-14.31 8.844L128 32H16c-8.836 0-16 7.162-16 16V80c0 8.836 7.164 16 16 16h416c8.838 0 16-7.164 16-16V48C448 39.16 440.8 32 432 32z",
    fill: "currentColor",
}));

const DOWNLOAD_ICON = react.createElement("svg", {
    height: "16",
    role: "img",
    width: "16",
    viewBox: "0 0 512 512",
    "aria-hidden": "true",
}, react.createElement("path", {
    d: "M480 352h-133.5l-45.25 45.25C289.2 409.3 273.1 416 256 416s-33.16-6.656-45.25-18.75L165.5 352H32c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h448c17.67 0 32-14.33 32-32v-96C512 366.3 497.7 352 480 352zM432 456c-13.2 0-24-10.8-24-24c0-13.2 10.8-24 24-24s24 10.8 24 24C456 445.2 445.2 456 432 456zM233.4 374.6C239.6 380.9 247.8 384 256 384s16.38-3.125 22.62-9.375l128-128c12.49-12.5 12.49-32.75 0-45.25c-12.5-12.5-32.76-12.5-45.25 0L288 274.8V32c0-17.67-14.33-32-32-32C238.3 0 224 14.33 224 32v242.8L150.6 201.4c-12.49-12.5-32.75-12.5-45.25 0c-12.49 12.5-12.49 32.75 0 45.25L233.4 374.6z",
    fill: "currentColor",
}));

/* eslint-enable no-redeclare, no-unused-vars */
