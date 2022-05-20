export type Author = {
  name: string;
  url: string;
};

// From `fetchExtensionManifest()`, `fetchThemeManifest()`, and snippets.json
export type Manifest = {
  name: string;
  description: string;
  main: string;
  authors: Author[];
  preview: string;
  readme: string;

  // TODO: split these into different types?
  tags?: string[];
  code?: string;
  usercss?: string;
  schemes?: string[];
  includes?: string[];
};

// From fetchExtensionManifest
// TODO: Is this the card props essentially?
export type CardManifest = {
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
};
