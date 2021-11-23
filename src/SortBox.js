/// <reference path="OptionsMenu.js" />
// eslint-disable-next-line no-redeclare, no-unused-vars
const SortBox = (props) => {
    // constructor(props) {
    //     super(props);
    // }

    // useEffect(() => {
    //     setSortBySelected(props.sortBoxOptions.find(props.sortBySelectedFn));
    // }, [props.sortBoxOptions]);

    // if (this.props.sortBoxOptions.length === 0) return null;
    // TODO: need to make sure this works for the main card sorting as well for the colour schemes
    // const sortBySelected = this.props.sortBoxOptions.filter(a => a.key === sortConfig.by)[0];
    // const [sortBySelected, setSortBySelected] = useState(props.sortBoxOptions.find(props.sortBySelectedFn));
    const sortBySelected = props.sortBoxOptions.find(props.sortBySelectedFn);
    // console.log(sortBySelected);

    return react.createElement("div", {
        className: "marketplace-sort-bar",
    }, react.createElement("div", {
        className: "marketplace-sort-container",
    }, react.createElement(OptionsMenu, {
        options: props.sortBoxOptions,
        onSelect: (value) => props.onChange(value),
        selected: sortBySelected,
    })));
};
