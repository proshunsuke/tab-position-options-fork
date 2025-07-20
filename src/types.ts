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

export const defaultSettings: Settings = {
  newTab: {
    position: "default",
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
