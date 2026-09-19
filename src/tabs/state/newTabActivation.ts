// onCreatedで配置済みのタブは、後続のonActivatedで二重に配置しない。
const NEW_TAB_ACTIVATION_WINDOW_MS = 1000;
let newTabActivationState: Record<string, { tabId: number; expiresAt: number }> = {};

export const recordNewTabActivation = (windowId: number, tabId: number) => {
  newTabActivationState[String(windowId)] = {
    tabId,
    expiresAt: Date.now() + NEW_TAB_ACTIVATION_WINDOW_MS,
  };
};

export const consumeNewTabActivation = (windowId: number, tabId: number) => {
  const key = String(windowId);
  const transition = newTabActivationState[key];
  delete newTabActivationState[key];
  return transition?.tabId === tabId && Date.now() <= transition.expiresAt;
};

export const resetNewTabActivation = () => {
  newTabActivationState = {};
};
