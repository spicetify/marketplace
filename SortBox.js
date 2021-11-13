/// <reference path="OptionsMenu.js" />
// eslint-disable-next-line no-redeclare, no-unused-vars
class SortBox extends react.Component {
    constructor(props) {
        super(props);
    }

    render() {
        // TODO: need to make sure this works for the main card sorting as well for the colour schemes
        const sortBySelected = this.props.sortByOptions.filter(a => a.key === sortConfig.by)[0];

        return react.createElement("div", {
            className: "marketplace-sort-bar",
        }, react.createElement("div", {
            className: "marketplace-sort-container",
        }, react.createElement(OptionsMenu, {
            options: this.props.sortByOptions,
            onSelect: (value) => this.props.onChange(value),
            selected: sortBySelected,
        })));
    }
}
