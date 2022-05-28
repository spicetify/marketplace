import React from "react";



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
console.log(props)
  return (
    // Create a drop down menu for the color scheme selector
    <div className="marketplace-sortBox">
      <div className="marketplace-sortBox-header">
        <div className="marketplace-sortBox-header-title">
        </div>
        <div className="marketplace-sortBox-header-selector">
          <select
            className="marketplace-sortBox-header-selector-select"
            onChange={(event) => {
              // console.log(event.target.value);
              props.onChange(event.target.value);
            }
            }
            value={sortBySelected.key}
          >
            {props.sortBoxOptions.map((item) => {
              return (
                <option
                  key={item.key}
                  value={item.key}
                  className={`marketplace-sortBox-header-selector-option ${
                    item.key === sortBySelected.key ? "marketplace-sortBox-header-selector-option-selected" : ""
                  }`}
                >
                  {item.value}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </div>
  );
};
  

export default SortBox;
