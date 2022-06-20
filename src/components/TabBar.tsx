import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Dropdown, { Option } from "react-dropdown";
import { TabItemConfig } from "../types/marketplace-types";
import PropTypes from "prop-types";

// NOTE: The label and value are the same (e.g. "Extensions")
type TabOptionConfig = Option & {
  active: boolean;
  enabled: boolean;
};

class TabBarItem extends React.Component<{
  item: TabOptionConfig;
  switchTo: (option: Option) => void;
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
          this.props.switchTo(this.props.item);
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

interface TabBarMoreProps {
  items: TabOptionConfig[];
  switchTo: (option: Option) => void;
}
const TabBarMore = React.memo<TabBarMoreProps>(
  function TabBarMore({ items, switchTo } : TabBarMoreProps) {
    return (
      <li className="marketplace-tabBar-headerItem">
        <Dropdown className="main-type-mestoBold"
          options={items} value="More" placeholder="More"
          onChange={switchTo}
        />
      </li>
    );
  },
);

const TabBarContext = ({ children }) => {
  if (!children) return null;
  return ReactDOM.createPortal(
    <div className="main-topBar-topbarContent">
      {children}
    </div>,
    document.querySelector(".main-topBar-topbarContentWrapper") as Element,
  );
};

TabBarContext.propTypes = {
  children: PropTypes.element,
};

export const TopBarContent = (props: {
  links: TabItemConfig[];
  activeLink: string;
  switchCallback: (option: Option) => void;
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

interface TabBarProps {
  links: TabItemConfig[];
  activeLink: string;
  switchCallback: (option: Option) => void;
  windowSize: number;
}
const TabBar = React.memo<TabBarProps>(
  function TabBar({ links, activeLink, switchCallback, windowSize = Infinity } : TabBarProps) {
    const tabBarRef = React.useRef(null);
    const [childrenSizes, setChildrenSizes] = useState([] as number[]);
    const [availableSpace, setAvailableSpace] = useState(0);
    const [droplistItem, setDroplistItems] = useState([] as number[]);

    // Key is the tab name, value is also the tab name, active is if it's active
    const options = links.map(({ name, enabled }) => {
      const active = name === activeLink;
      return ({ label: name, value: name, active, enabled } as TabOptionConfig);
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
                key={item.value}
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
  },
);
