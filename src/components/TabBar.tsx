import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import OptionsMenu from "./OptionsMenu";

class TabBarItem extends React.Component<{
  item: {
    key: string;
    value: string;
    active: boolean;
    enabled: boolean;
  };
  switchTo: Function;
}> {
  constructor(props) {
    super(props);
  }

  render() {
    if (!this.props.item.enabled) return null;

    return React.createElement("li", {
      className: "marketplace-tabBar-headerItem",
      "data-tab": this.props.item.value,
      onClick: (event) => {
        event.preventDefault();
        this.props.switchTo(this.props.item.key);
      },
    }, React.createElement("a", {
      "aria-current": "page",
      className: `marketplace-tabBar-headerItemLink ${this.props.item.active ? "marketplace-tabBar-active" : ""}`,
      draggable: "false",
      href: "",
    }, React.createElement("span", {
      className: "main-type-mestoBold",
    }, this.props.item.value)));
  }
}

// TODO: is this the right type stuff?
const TabBarMore = React.memo<{
  items: any;
  switchTo: Function
}>(({ items, switchTo }) => {
  const activeItem = items.find((item) => item.active);

  return <li className={`marketplace-tabBar-headerItem ${activeItem ? "marketplace-tabBar-active" : ""}`}>
    <OptionsMenu options={items} onSelect={switchTo} selected={activeItem} defaultValue="More" bold={true} />
  </li>;
});

export const TopBarContent = ({ links, activeLink, switchCallback }) => {
  const resizeHost = document.querySelector(".Root__main-view .os-resize-observer-host");
  if (!resizeHost) return null;

  const [windowSize, setWindowSize] = useState(resizeHost.clientWidth);
  const resizeHandler = () => setWindowSize(resizeHost.clientWidth);

  useEffect(() => {
    const observer = new ResizeObserver(resizeHandler);
    observer.observe(resizeHost);
    return () => {
      observer.disconnect();
    };
  }, [resizeHandler]);

  return React.createElement(TabBarContext, null, React.createElement(TabBar, {
    links,
    activeLink,
    windowSize,
    switchCallback,
  }));
};

const TabBarContext = ({ children }) => {
  return ReactDOM.createPortal(
    React.createElement("div", {
      className: "main-topBar-topbarContent",
    }, children),
    document.querySelector(".main-topBar-topbarContentWrapper"),
  );
};

// TODO: figure out types
const TabBar = React.memo<{
  links: any;
  activeLink: any;
  switchCallback: any;
  windowSize: any
}>(({ links, activeLink, switchCallback, windowSize = Infinity }) => {
  const tabBarRef = React.useRef(null);
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
    const itemsToHide: any = [];
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

  return React.createElement("nav", {
    className: "marketplace-tabBar marketplace-tabBar-nav",
  }, React.createElement("ul", {
    className: "marketplace-tabBar-header",
    ref: tabBarRef,
  }, options
    .filter((_, id) => !droplistItem.includes(id))
    .map(item => React.createElement(TabBarItem, {
      item,
      switchTo: switchCallback,
    })),
  (droplistItem.length || childrenSizes.length === 0) ?
    React.createElement(TabBarMore, {
      items: droplistItem.map(i => options[i]).filter(i => i),
      switchTo: switchCallback,
    }) : null),
  );
});
