type PendingNavigation = { url: string; timeStamp: number; restoring: boolean };
type LoadingPageState = {
  pending: Record<string, PendingNavigation>;
  restoredTabs: Record<string, true>;
};

let state: LoadingPageState = { pending: {}, restoredTabs: {} };
let pendingStorageWrite = Promise.resolve();
const positioningRevisions = new Map<number, number>();

export const initializeLoadingPageState = async () => {
  const stored = await chrome.storage.session
    .get<{ loadingPageState?: LoadingPageState }>("loadingPageState")
    .catch(() => ({ loadingPageState: undefined }));
  state = stored.loadingPageState ?? { pending: {}, restoredTabs: {} };
  return stored.loadingPageState === undefined;
};

export const recordLoadingNavigation = (
  tabId: number,
  url: string,
  timeStamp: number,
  restoring: boolean,
) => {
  state.pending[tabId] = { url, timeStamp, restoring };
  persistState();
};

export const consumeLoadingNavigation = (tabId: number, timeStamp: number) => {
  const pending = state.pending[tabId];
  if (pending && pending.timeStamp > timeStamp) {
    return null;
  }
  const restored = !!state.restoredTabs[tabId];
  const restoring = !!pending?.restoring;
  delete state.pending[tabId];
  delete state.restoredTabs[tabId];
  if (pending || restored) {
    persistState();
  }
  return { url: pending?.url, restoring, restored };
};

export const markInitialLoadingTabs = (tabIds: number[]) => {
  for (const tabId of tabIds) {
    state.restoredTabs[tabId] = true;
  }
  // 空の状態も保存し、同じセッション内のWorker再起動と区別する。
  persistState();
};

export const markRestoredLoadingTab = (tabId: number) => {
  state.restoredTabs[tabId] = true;
  persistState();
};

export const clearLoadingTab = (tabId: number) => {
  const changed = state.pending[tabId] || state.restoredTabs[tabId];
  delete state.pending[tabId];
  delete state.restoredTabs[tabId];
  positioningRevisions.delete(tabId);
  if (changed) {
    persistState();
  }
};

export const getLoadingPositionRevision = (tabId: number) => positioningRevisions.get(tabId) ?? 0;

export const recordLoadingPosition = (tabId: number) => {
  positioningRevisions.set(tabId, getLoadingPositionRevision(tabId) + 1);
};

export const resetLoadingPageState = () => {
  state = { pending: {}, restoredTabs: {} };
  positioningRevisions.clear();
  pendingStorageWrite = Promise.resolve();
};

const persistState = () => {
  // メモリへは即時反映し、移動APIをストレージ保存で待たせない。
  pendingStorageWrite = pendingStorageWrite.finally(() =>
    chrome.storage.session.set({ loadingPageState: state }).catch(() => {}),
  );
};
