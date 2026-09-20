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

export type Settings = {
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
