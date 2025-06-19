import { use } from "i18next";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Dropdown, { type Option } from "react-dropdown";
import { withTranslation } from "react-i18next";
import type { TabItemConfig } from "../types/marketplace-types";

// NOTE: The label and value are the same (e.g. "Extensions")
type TabOptionConfig = Option & {
  active: boolean;
  enabled: boolean;
};

class TabBarItem extends React.Component<{
  item: TabOptionConfig;
  switchTo: (option: Option) => void;
  // TODO: there's probably a better way to make TS not complain about the withTranslation HOC
  t: (key: string) => string;
}> {
  render() {
    const { t } = this.props;
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
          className={`marketplace-tabBar-headerItemLink ${this.props.item.active ? "marketplace-tabBar-active" : ""}`}
          draggable="false"
          href="##"
        >
          <span className="main-type-mestoBold">{t(`tabs.${this.props.item.value}`)}</span>
        </a>
      </li>
    );
  }
}

const TabBarItemWithTranslation = withTranslation()(TabBarItem);

interface TabBarMoreProps {
  items: TabOptionConfig[];
  switchTo: (option: Option) => void;
}
const TabBarMore = React.memo<TabBarMoreProps>(function TabBarMore({ items, switchTo }: TabBarMoreProps) {
  return (
    <li className="marketplace-tabBar-headerItem">
      <Dropdown className="main-type-mestoBold" options={items} value="More" placeholder="More" onChange={switchTo} />
    </li>
  );
});

export const TopBarContent = (props: {
  links: TabItemConfig[];
  activeLink: string;
  switchCallback: (option: Option) => void;
}) => {
  const tabBar = useRef<HTMLElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: This is a callback that needs to be stable
  const contextHandler = useCallback(() => {
    // Move the marketplace-tabBar item to the main-topBar-topbarContent div
    const topBarContent = document.querySelector(".main-topBar-topbarContentWrapper");
    if (!tabBar?.current || !topBarContent) {
      setTimeout(contextHandler, 100);
      return;
    }

    topBarContent.appendChild(tabBar.current);
    document.querySelector(".main-topBar-container")?.setAttribute("style", "contain: unset;");
  }, [tabBar.current]);

  useEffect(() => {
    contextHandler();
    return () => {
      (tabBar.current || document.querySelector(".marketplace-tabBar"))?.remove();
      document.querySelector(".main-topBar-container")?.removeAttribute("style");
    };
  });

  return <TabBar ref={tabBar} links={props.links} activeLink={props.activeLink} switchCallback={props.switchCallback} />;
};

interface TabBarProps {
  links: TabItemConfig[];
  activeLink: string;
  switchCallback: (option: Option) => void;
}
const TabBar = React.forwardRef(function TabBar({ links, activeLink, switchCallback }: TabBarProps, ref: React.ForwardedRef<HTMLElement>) {
  const tabBarRef = useRef<HTMLUListElement | null>(null);
  const [childrenSizes, setChildrenSizes] = useState([0]);
  const [availableSpace, setAvailableSpace] = useState(0);
  const [droplistItem, setDroplistItems] = useState([0]);

  // Key is the tab name, value is also the tab name, active is if it's active
  const options = links.map(({ name, enabled }) => {
    const active = name === activeLink;
    return { label: name, value: name, active, enabled } as TabOptionConfig;
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: Run when tabBarRef changes
  useEffect(() => {
    if (!tabBarRef.current) return;

    const observer = new ResizeObserver((entries) => setAvailableSpace(entries[0].contentRect.width));
    observer.observe(tabBarRef.current);
    return () => {
      observer.disconnect();
    };
  }, [tabBarRef.current]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Run when links change
  useEffect(() => {
    if (!tabBarRef.current) return;

    const children = Array.from(tabBarRef.current.children);
    const tabbarItemSizes = children.map((child) => child.clientWidth);

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
    <nav className="marketplace-tabBar marketplace-tabBar-nav" ref={ref}>
      <ul className="marketplace-tabBar-header" ref={tabBarRef}>
        {options
          .filter((_, id) => !droplistItem.includes(id))
          .map((item) => (
            <TabBarItemWithTranslation key={item.value} item={item} switchTo={switchCallback} />
          ))}
        {droplistItem.length || childrenSizes.length === 0 ? (
          <TabBarMore items={droplistItem.map((i) => options[i]).filter((i) => i)} switchTo={switchCallback} />
        ) : null}
      </ul>
    </nav>
  );
});
