import React from "react";
import Dropdown, { Option } from "react-dropdown";
import { SortBoxOption } from "../types/marketplace-types";

interface Props {
  sortBoxOptions: SortBoxOption[];
  onChange: (value: string) => void;
  sortBySelectedFn: (item: SortBoxOption) => boolean;
}

const SortBox = (props: Props) => {

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
    // Create a drop down menu
    <div className="marketplace-sortBox">
      <div className="marketplace-sortBox-header">
        <div className="marketplace-sortBox-header-title">
        </div>

        <Dropdown placeholder="Select an option"
          options={options} value={sortBySelected?.key}
          onChange={_onSelect}
        />

      </div>
    </div>
  );
};

export default SortBox;
