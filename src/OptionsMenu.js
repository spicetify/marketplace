const OptionsMenuItemIcon = react.createElement("svg", {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "currentColor",
}, react.createElement("path", {
    d: "M13.985 2.383L5.127 12.754 1.388 8.375l-.658.77 4.397 5.149 9.618-11.262z",
}));

// @ts-ignore
const OptionsMenuItem = react.memo(({ onSelect, value, isSelected }) => {
    return react.createElement(Spicetify.ReactComponent.MenuItem, {
        onClick: onSelect,
        icon: isSelected ? OptionsMenuItemIcon : null,
    }, value);
});

// eslint-disable-next-line no-redeclare, no-unused-vars
const OptionsMenu = react.memo(({
    // @ts-ignore
    options,
    // @ts-ignore
    onSelect,
    // @ts-ignore
    selected,
    // @ts-ignore
    defaultValue,
    // @ts-ignore
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
    let menuRef = react.useRef(null);
    return react.createElement(Spicetify.ReactComponent.ContextMenu, {
        menu: react.createElement(Spicetify.ReactComponent.Menu, {
        }, options.map(({ key, value }) => react.createElement(OptionsMenuItem, {
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
    }, react.createElement("button", {
        className: "optionsMenu-dropBox",
        ref: menuRef,
    },
    react.createElement("span", {
        className: bold ? "main-type-mestoBold" : "main-type-mesto",
    }, selected?.value || defaultValue),
    react.createElement("svg", {
        height: "16",
        width: "16",
        fill: "currentColor",
        viewBox: "0 0 16 16",
    }, react.createElement("path", {
        d: "M3 6l5 5.794L13 6z",
    }))));
});
