export type TabPosition = "first" | "last" | "right" | "left" | "default";
export type TabActivation =
  | "first"
  | "last"
  | "left"
  | "right"
  | "inActivatedOrder"
  | "sourceTab"
  | "sourceTabAndOrder"
  | "default";
export type TabOnActivateBehavior = "default" | "last" | "first";

export type NewTabUrlRule = {
  url: string;
  position: TabPosition;
  active: "foreground" | "background";
};

export type LoadingPageUrlRule = {
  url: string;
  position: "first" | "middle" | "last";
};

export const EXTERNAL_LINK_ACTIONS = [
  "exclude-page",
  "new-page",
  "background-page",
  "current-page",
  "new-link",
  "background-link",
  "current-link",
] as const;

export type ExternalLinkRule = {
  url: string;
  action: (typeof EXTERNAL_LINK_ACTIONS)[number];
};

export type Settings = {
  externalLinks: {
    enabled: boolean;
    urlRules: ExternalLinkRule[];
  };
  newTab: {
    position: TabPosition;
    openInBackground: boolean;
    urlRules?: NewTabUrlRule[];
  };
  loadingPage: {
    urlRules?: LoadingPageUrlRule[];
  };
  afterTabClosing: {
    activateTab: TabActivation;
  };
  tabOnActivate: {
    behavior: TabOnActivateBehavior;
  };
  popup: {
    openAsNewTab: boolean;
    exceptions?: { url: string }[];
  };
};

export const DEFAULT_SETTINGS: Settings = {
  externalLinks: { enabled: false, urlRules: [] },
  newTab: {
    position: "default",
    openInBackground: false,
    urlRules: [],
  },
  loadingPage: {
    urlRules: [],
  },
  afterTabClosing: {
    activateTab: "default",
  },
  tabOnActivate: {
    behavior: "default",
  },
  popup: {
    openAsNewTab: false,
    exceptions: [],
  },
};
