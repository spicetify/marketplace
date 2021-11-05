// eslint-disable-next-line no-redeclare, no-unused-vars
class TabBarItem extends react.Component {
    /**
     * @param {object} props
     * @param {object} props.item
     * @param {string} props.item.key
     * @param {string} props.item.value
     * @param {boolean} props.item.active
     * @param {boolean} props.item.enabled
     * @param {function} props.switchTo
     */
    constructor(props) {
        super(props);
    }

    render() {
        if (!this.props.item.enabled) return null;

        return react.createElement("li", {
            className: "marketplace-tabBar-headerItem",
            "data-tab": this.props.item.value,
            onClick: (event) => {
                event.preventDefault();
                this.props.switchTo(this.props.item.key);
            },
        }, react.createElement("a", {
            "aria-current": "page",
            className: `marketplace-tabBar-headerItemLink ${this.props.item.active ? "marketplace-tabBar-active" : ""}`,
            draggable: "false",
            href: "",
        }, react.createElement("span", {
            className: "main-type-mestoBold",
        }, this.props.item.value)));
    }
}

const TabBarMore = react.memo(({ items, switchTo }) => {
    const activeItem = items.find((item) => item.active);

    return react.createElement("li", {
        className: `marketplace-tabBar-headerItem ${activeItem ? "marketplace-tabBar-active" : ""}`,
    }, react.createElement(OptionsMenu, {
        options: items,
        onSelect: switchTo,
        selected: activeItem,
        defaultValue: "More",
        bold: true,
    }));
});

// eslint-disable-next-line no-redeclare, no-unused-vars
const TopBarContent = ({ links, activeLink, switchCallback }) => {
    const resizeHost = document.querySelector(".Root__main-view .os-resize-observer-host");
    const [windowSize, setWindowSize] = useState(resizeHost.clientWidth);
    const resizeHandler = () => setWindowSize(resizeHost.clientWidth);

    useEffect(() => {
        const observer = new ResizeObserver(resizeHandler);
        observer.observe(resizeHost);
        return () => {
            observer.disconnect();
        };
    }, [resizeHandler]);

    return react.createElement(TabBarContext, null, react.createElement(TabBar, {
        className: "queue-queueHistoryTopBar-tabBar",
        links,
        activeLink,
        windowSize,
        switchCallback,
    }));
};

const TabBarContext = ({ children }) => {
    return reactDOM.createPortal(
        react.createElement("div", {
            className: "main-topBar-topbarContent",
        }, children),
        document.querySelector(".main-topBar-topbarContentWrapper"),
    );
};

const TabBar = react.memo(({ links, activeLink, switchCallback, windowSize = Infinity }) => {
    const tabBarRef = react.useRef(null);
    const [childrenSizes, setChildrenSizes] = useState([]);
    const [availableSpace, setAvailableSpace] = useState(0);
    const [droplistItem, setDroplistItems] = useState([]);

    // Key is the tab name, value is also the tab name, active is if it's active
    const options = links.map(({ name, enabled }) => {
        const active = name === activeLink;
        return ({ key: name, value: name, active, enabled });
    });

    useEffect(() => {
        if (!tabBarRef.current) return;
        setAvailableSpace(tabBarRef.current.clientWidth);
    }, [windowSize]);

    useEffect(() => {
        if (!tabBarRef.current) return;

        const children = Array.from(tabBarRef.current.children);
        const tabbarItemSizes = children.map(child => child.clientWidth);

        setChildrenSizes(tabbarItemSizes);
    }, [links]);

    useEffect(() => {
        if (!tabBarRef.current) return;

        const totalSize = childrenSizes.reduce((a, b) => a + b, 0);

        // Can we render everything?
        if (totalSize <= availableSpace) {
            setDroplistItems([]);
            return;
        }

        // The `More` button can be set to _any_ of the children. So we
        // reserve space for the largest item instead of always taking
        // the last item.
        const viewMoreButtonSize = Math.max(...childrenSizes);

        // Figure out how many children we can render while also showing
        // the More button
        const itemsToHide = [];
        let stopWidth = viewMoreButtonSize;

        childrenSizes.forEach((childWidth, i) => {
            if (availableSpace >= stopWidth + childWidth) {
                stopWidth += childWidth;
            } else {
                itemsToHide.push(i);
            }
        });

        setDroplistItems(itemsToHide);
    }, [availableSpace, childrenSizes]);

    return react.createElement("nav", {
        className: "marketplace-tabBar marketplace-tabBar-nav",
    }, react.createElement("ul", {
        className: "marketplace-tabBar-header",
        ref: tabBarRef,
    }, options
        .filter((_, id) => !droplistItem.includes(id))
        .map(item => react.createElement(TabBarItem, {
            item,
            switchTo: switchCallback,
        })),
    (droplistItem.length || childrenSizes.length === 0) ?
        react.createElement(TabBarMore, {
            items: droplistItem.map(i => options[i]).filter(i => i),
            switchTo: switchCallback,
        }) : null),
    );
});
