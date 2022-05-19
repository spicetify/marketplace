import React from "react";

const OptionsMenuItemIcon = (
  <svg width="16px" height="16px" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.985 2.383L5.127 12.754 1.388 8.375l-.658.77 4.397 5.149 9.618-11.262z" />
  </svg>
);

// @ts-ignore
const OptionsMenuItem = React.memo(({ onSelect, value, isSelected }) => {
  return (
    <Spicetify.ReactComponent.MenuItem
      onClick={onSelect}
      icon={isSelected ? OptionsMenuItemIcon : null}
    >
      {value}
    </Spicetify.ReactComponent.MenuItem>
  );
});

const OptionsMenu = React.memo<{
  options: any[];
  onSelect: Function;
  selected: any;
  defaultValue?: string;
  bold?: boolean;
}>(({
  options,
  onSelect,
  selected,
  defaultValue = "",
  bold = false,
}) => {
  /**
   * <Spicetify.ReactComponent.ContextMenu
   *      menu = { options.map(a => <OptionsMenuItem>) }
   * >
   *      <button>
   *          <span> {select.value} </span>
   *          <svg> arrow icon </svg>
   *      </button>
   * </Spicetify.ReactComponent.ContextMenu>
   */
  let menuRef = React.useRef(null);
  return React.createElement(Spicetify.ReactComponent.ContextMenu, {
      menu: React.createElement(Spicetify.ReactComponent.Menu, {
      }, options.map(({ key, value }) => React.createElement(OptionsMenuItem, {
          // @ts-ignore
          value,
          onSelect: () => {
              onSelect(key);
              // Close menu on item click
              menuRef.current?.click();
          },
          isSelected: selected?.key === key,
      })),
      ),
      trigger: "click",
      action: "toggle",
      renderInline: true,
  }, React.createElement("button", {
      className: "optionsMenu-dropBox",
      ref: menuRef,
  },
  React.createElement("span", {
      className: bold ? "main-type-mestoBold" : "main-type-mesto",
  }, selected?.value || defaultValue),
  React.createElement("svg", {
      height: "16",
      width: "16",
      fill: "currentColor",
      viewBox: "0 0 16 16",
  }, React.createElement("path", {
      d: "M3 6l5 5.794L13 6z",
  }))));
});

export default OptionsMenu;
