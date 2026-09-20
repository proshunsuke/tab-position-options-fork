import { getSortedTabs } from "@/src/commands/sort";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import {
  getActivationHistory,
  getTabFromActivationHistory,
  recordTabActivation,
} from "@/src/tabs/state/activationHistory";
import { clearPendingCloseTarget } from "@/src/tabs/state/pendingCloseTarget";
import {
  getActiveTabSnapshot,
  getTabSnapshot,
  moveTabInSnapshot,
  refreshWindowTabSnapshot,
  setActiveTabInSnapshot,
} from "@/src/tabs/state/tabSnapshot";
import { cancelActivationMove } from "@/src/tabs/tabOnActivate";

const sortingWindows = new Set<number>();

export const setupCommandHandlers = () => {
  chrome.commands.onCommand.addListener((command, tab) => {
    void handleCommand(command, tab).catch(error => console.error("Tab command failed:", error));
  });
};

export const handleCommand = async (command: string, tab?: chrome.tabs.Tab) => {
  if (command !== "sort-title" && command !== "sort-url" && command !== "toggle-last-active") {
    return;
  }
  if (needsInitialization()) {
    // Worker再起動時のみ、履歴とsnapshotの復元が必要。
    await initializeAllStates();
  }
  // 通常はcommandイベントのタブを使い、タブが渡されない場合だけ対象を取得する。
  const windowId = tab?.windowId ?? (await chrome.windows.getLastFocused()).id;
  if (windowId === undefined) {
    return;
  }
  cancelActivationMove(windowId);
  if (command === "toggle-last-active") {
    const current = getActiveTabSnapshot(windowId);
    const target = getTabFromActivationHistory(
      getTabSnapshot(windowId),
      current ? [current.id] : [],
      getActivationHistory(windowId),
    );
    if (target === null) {
      return;
    }
    clearPendingCloseTarget(windowId);
    setActiveTabInSnapshot(windowId, target);
    recordTabActivation(windowId, target);
    return chrome.tabs
      .update(target, { active: true })
      .catch(error => {
        void refreshWindowTabSnapshot(windowId);
        throw error;
      })
      .then(() => {});
  }
  if (sortingWindows.has(windowId)) {
    return;
  }
  sortingWindows.add(windowId);
  try {
    // タイトル・URL・グループ情報はsnapshotにないため、明示的なソート時だけ取得する。
    const tabs = await chrome.tabs.query({ windowId });
    cancelActivationMove(windowId);
    const sorted = getSortedTabs(tabs, command === "sort-title" ? "title" : "url");
    const order = tabs.toSorted((a, b) => a.index - b.index).map(item => item.id);
    for (let index = 0; index < sorted.length; index++) {
      const item = sorted[index];
      if (item.id === undefined || item.pinned || order[index] === item.id) {
        continue;
      }
      moveTabInSnapshot(windowId, item.id, index);
      // 各移動で後続のindexが変わるため、このソート内だけ完了順序を保証する。
      await chrome.tabs.move(item.id, { index });
      order.splice(order.indexOf(item.id), 1);
      order.splice(index, 0, item.id);
    }
  } finally {
    sortingWindows.delete(windowId);
    void refreshWindowTabSnapshot(windowId);
  }
};
