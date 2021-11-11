/// <reference path="OptionsMenu.js" />
// eslint-disable-next-line no-redeclare, no-unused-vars
class SortBox extends react.Component {
    constructor(props) {
        super(props);
        this.sortByOptions = [
            { key: "hot", value: "Hot" },
            { key: "new", value: "New" },
            { key: "top", value: "Top" },
            { key: "rising", value: "Rising" },
            { key: "controversial", value: "Controversial" },
        ];

    }

    render() {
        const sortBySelected = this.sortByOptions.filter(a => a.key === sortConfig.by)[0];

        return react.createElement("div", {
            className: "marketplace-sort-bar",
        }, react.createElement("div", {
            className: "marketplace-sort-container",
        }, react.createElement(OptionsMenu, {
            options: this.sortByOptions,
            onSelect: (by) => this.props.onChange(by, null),
            selected: sortBySelected,
        })));
    }
}
