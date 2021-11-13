/// <reference path="OptionsMenu.js" />
// eslint-disable-next-line no-redeclare, no-unused-vars
class SortBox extends react.Component {
    constructor(props) {
        super(props);
    }

    render() {
        // TODO: what does this sortConfig filter do?
        const sortBySelected = this.props.sortByOptions.filter(a => a.key === sortConfig.by)[0];

        return react.createElement("div", {
            className: "marketplace-sort-bar",
        }, react.createElement("div", {
            className: "marketplace-sort-container",
        }, react.createElement(OptionsMenu, {
            options: this.props.sortByOptions,
            onSelect: (by) => this.props.onChange(by, null),
            selected: sortBySelected,
        })));
    }
}
