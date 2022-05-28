// e.g. CONFIG.tabs
export type TabItemConfig = {
  name: string;
  enabled: boolean;
};

export type CardType = "extension" | "theme" | "snippet";

export type RepoType = "extension" | "theme";

export type Author = {
  name: string;
  url: string;
};

// From snippets.json
export type Snippet = {
  title: string;
  description: string;
  code: string;

  // TODO: clean this up somehow
  // It complains bitterly in Card.tsx
  // if I don't have all the same properties as CardItem
  manifest: undefined;
  subtitle: undefined;
  authors: undefined;
  user: undefined;
  repo: undefined;
  branch: undefined;
  imageURL: undefined;
  extensionURL: undefined;
  readmeURL: undefined;
  stars: undefined;
  tags: undefined;
  cssURL: undefined;
  schemesURL: undefined;
  include: undefined;
};

// From `fetchExtensionManifest()` and `fetchThemeManifest()`
export type Manifest = {
  name: string;
  description: string;
  main: string;
  authors: Author[];
  preview: string;
  readme: string;

  // TODO: split these into different types?
  tags?: string[];
  usercss?: string;
  schemes?: string[];
  include?: string[];
};

// From fetchExtensionManifest
// (Card.props.item)
export type CardItem = {
  manifest: Manifest;
  title: string;
  subtitle: string;
  authors: Author[];
  user: string;
  repo: string;
  branch: string;
  imageURL: string;
  extensionURL: string;
  readmeURL: string;
  stars: number;
  tags: string[];

  // For themes only
  cssURL?: string;
  schemesURL?: string;
  include?: string[];

  // TODO: clean this up somehow
  // It complains bitterly in Card.tsx
  // if I don't have all the same properties as CardItem
  code: undefined;
  description: undefined;
};

// TODO: use this in `fetchThemeManifest()`
// export type ThemeCardItem = CardItem & {
//   cssURL?: string;
//   schemesURL?: string;
//   include?: string[];
// };
