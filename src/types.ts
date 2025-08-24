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

export type Settings = {
  newTab: {
    position: TabPosition;
    openInBackground: boolean;
  };
  loadingPage: {
    position: TabPosition;
  };
  afterTabClosing: {
    activateTab: TabActivation;
  };
  tabOnActivate: {
    behavior: TabOnActivateBehavior;
  };
  popup: {
    openAsNewTab: boolean;
  };
};

export const DEFAULT_SETTINGS: Settings = {
  newTab: {
    position: "default",
    openInBackground: false,
  },
  loadingPage: {
    position: "default",
  },
  afterTabClosing: {
    activateTab: "default",
  },
  tabOnActivate: {
    behavior: "default",
  },
  popup: {
    openAsNewTab: false,
  },
};
