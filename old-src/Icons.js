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

const SETTINGS_ICON = react.createElement("svg", {
    height: "16",
    role: "img",
    width: "16",
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
}, react.createElement("path", {
    d: "M24 13.616v-3.232c-1.651-.587-2.694-.752-3.219-2.019v-.001c-.527-1.271.1-2.134.847-3.707l-2.285-2.285c-1.561.742-2.433 1.375-3.707.847h-.001c-1.269-.526-1.435-1.576-2.019-3.219h-3.232c-.582 1.635-.749 2.692-2.019 3.219h-.001c-1.271.528-2.132-.098-3.707-.847l-2.285 2.285c.745 1.568 1.375 2.434.847 3.707-.527 1.271-1.584 1.438-3.219 2.02v3.232c1.632.58 2.692.749 3.219 2.019.53 1.282-.114 2.166-.847 3.707l2.285 2.286c1.562-.743 2.434-1.375 3.707-.847h.001c1.27.526 1.436 1.579 2.019 3.219h3.232c.582-1.636.75-2.69 2.027-3.222h.001c1.262-.524 2.12.101 3.698.851l2.285-2.286c-.744-1.563-1.375-2.433-.848-3.706.527-1.271 1.588-1.44 3.221-2.021zm-12 2.384c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z",
    fill: "currentColor",
}));

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

/* eslint-enable no-redeclare, no-unused-vars */
