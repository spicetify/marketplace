import React from "react";
import Dropdown, { Option } from "react-dropdown";

const SortBox = (props) => {

  const _onSelect = (item: Option) => {
    props.onChange(item.value);
  };

  const options: Option[] = props.sortBoxOptions.map((item) => {
    return {
      value: item.key,
      label: item.value,
    };
  });

  const sortBySelected = props.sortBoxOptions.find(props.sortBySelectedFn);
  // console.log(sortBySelected);
  return (
    // Create a drop down menu for the color scheme selector
    <div className="marketplace-sortBox">
      <div className="marketplace-sortBox-header">
        <div className="marketplace-sortBox-header-title">
        </div>

        <Dropdown className="marketplace-sortBox-header-selector-select"
          options={options} value={sortBySelected.key} placeholder="Select an option"
          onChange={_onSelect}
        />

      </div>
    </div>
  );
};

export default SortBox;