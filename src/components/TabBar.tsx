import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Dropdown, { Option } from "react-dropdown";
import { TabItemConfig, TabType } from "../types/marketplace-types";

type TabOptionConfig = {
  key: string;
  value: string;
  active: boolean;
  enabled: boolean;
};

class TabBarItem extends React.Component<{
  item: TabOptionConfig;
  switchTo: Function;
}> {
  constructor(props) {
    super(props);
  }

  render() {
    if (!this.props.item.enabled) return null;

    return (
      <li
        className="marketplace-tabBar-headerItem"
        data-tab={this.props.item.value}
        onClick={(event) => {
          event.preventDefault();
          this.props.switchTo(this.props.item.key);
        }}
      >
        <a
          aria-current="page"
          className={`marketplace-tabBar-headerItemLink ${
            this.props.item.active ? "marketplace-tabBar-active" : ""
          }`}
          draggable="false"
          href=""
        >
          <span className="main-type-mestoBold">{this.props.item.value}</span>
        </a>
      </li>
    );
  }
}

// TODO: is this the right type stuff?
const TabBarMore = React.memo<{
  items: TabOptionConfig[];
  switchTo: (value: TabType) => void;
}>(({ items, switchTo }) => {

  // TODO: refactor the `switchTo` function to just be what's expected by react-dropdown
  // Transform this into the format that react-dropdown expects
  const transformedOptions: Option[] = items.map((item) => {
    return {
      value: item.key,
      label: item.value,
    };
  });

  // TODO: refactor the `switchTo` function to just be what's expected by react-dropdown
  const _onSelect = (item: Option) => {
    switchTo(item.value as TabType);
  };

  // It was this before
  // const activeItem = items.find((item) => item.active);
  // <OptionsMenu options={items} onSelect={switchTo} selected={activeItem} defaultValue="More" bold={true} />
  // return <li className={`marketplace-tabBar-headerItem ${activeItem ? "marketplace-tabBar-active" : ""}`}>

  // TODO: figure out how to get the styling matching the other tabs, or how it was before
  // TODO: remove any unused styles
  return (
    <li className={"marketplace-tabBar-headerItem"}>
      <Dropdown className="marketplace-sortBox-header-selector-select"
        options={transformedOptions} value="More" placeholder="More"
        onChange={_onSelect}
      />
    </li>
  );
});

const TabBarContext = ({ children }) => {
  return ReactDOM.createPortal(
    <div className="main-topBar-topbarContent">
      {children}
    </div>,
    document.querySelector(".main-topBar-topbarContentWrapper") as Element,
  );
};

export const TopBarContent = (props: {
  links: TabItemConfig[];
  activeLink: string;
  switchCallback: (value: TabType) => void;
}) => {
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

  return (
    <TabBarContext>
      <TabBar
        windowSize={windowSize}
        links={props.links}
        activeLink={props.activeLink}
        switchCallback={props.switchCallback}
      />
    </TabBarContext>
  );
};

const TabBar = React.memo<{
  links: TabItemConfig[];
  activeLink: string;
  switchCallback: (value: TabType) => void;
  windowSize: any; // TODO: add type
}>(({ links, activeLink, switchCallback, windowSize = Infinity }) => {
  const tabBarRef = React.useRef(null);
  const [childrenSizes, setChildrenSizes] = useState([] as number[]);
  const [availableSpace, setAvailableSpace] = useState(0);
  const [droplistItem, setDroplistItems] = useState([] as number[]);

  // Key is the tab name, value is also the tab name, active is if it's active
  const options = links.map(({ name, enabled }) => {
    const active = name === activeLink;
    return ({ key: name, value: name, active, enabled } as TabOptionConfig);
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
    const itemsToHide = [] as number[];
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

  return (
    <nav className="marketplace-tabBar marketplace-tabBar-nav">
      <ul className="marketplace-tabBar-header" ref={tabBarRef}>
        {options
          .filter((_, id) => !droplistItem.includes(id))
          .map(item => (
            <TabBarItem
              key={item.key}
              item={item}
              switchTo={switchCallback}
            />
          ))}
        {droplistItem.length || childrenSizes.length === 0 ? (
          <TabBarMore
            items={droplistItem.map(i => options[i]).filter(i => i)}
            switchTo={switchCallback}
          />
        ) : null}
      </ul>
    </nav>
  );
});