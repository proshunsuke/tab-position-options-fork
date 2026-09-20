type StartupTab = { id?: number; windowId: number; active: boolean };
type SessionRestoreState = {
  tabs: Record<string, number>;
  activations: Record<string, number>;
};

let state: SessionRestoreState = { tabs: {}, activations: {} };
let pendingStorageWrite = Promise.resolve();
const newTabs = new Set<number>();

export const initializeSessionRestoreState = async () => {
  const stored = await chrome.storage.session
    .get<{ sessionRestoreState?: SessionRestoreState }>("sessionRestoreState")
    .catch(() => ({ sessionRestoreState: undefined }));
  state = stored.sessionRestoreState ?? { tabs: {}, activations: {} };
  return stored.sessionRestoreState === undefined;
};

export const markSessionRestoreTabs = (tabs: StartupTab[]) => {
  for (const tab of tabs) {
    if (tab.id === undefined || newTabs.has(tab.id) || state.tabs[tab.id] !== undefined) {
      continue;
    }
    state.tabs[tab.id] = tab.windowId;
    if (tab.active) {
      state.activations[tab.windowId] = tab.id;
    }
  }
  // 空でも保存し、ブラウザ起動と同じセッション内のWorker再起動を区別する。
  persistState();
};

export const isSessionRestoreTab = (tabId: number) => state.tabs[tabId] !== undefined;

export const recordNewSessionTab = (tabId: number) => {
  // onStartupのquery完了が後着しても、処理済みの通常タブを復元対象にしない。
  newTabs.add(tabId);
};

export const consumeSessionRestoreActivation = (windowId: number, tabId: number) => {
  const expected = state.activations[windowId];
  if (expected === undefined) {
    return false;
  }
  // 別タブへのユーザー操作が先に来た場合も解除し、その後の再選択を抑止しない。
  delete state.activations[windowId];
  persistState();
  return expected === tabId;
};

export const isSessionRestoreWindow = (windowId: number) =>
  Object.values(state.tabs).includes(windowId);

export const clearSessionRestoreTab = (tabId: number) => {
  newTabs.delete(tabId);
  const windowId = state.tabs[tabId];
  if (windowId === undefined) {
    return;
  }
  delete state.tabs[tabId];
  if (state.activations[windowId] === tabId) {
    delete state.activations[windowId];
  }
  persistState();
};

export const resetSessionRestoreState = () => {
  state = { tabs: {}, activations: {} };
  newTabs.clear();
  pendingStorageWrite = Promise.resolve();
};

const persistState = () => {
  // 判定はメモリで同期的に行い、保存をタブ操作の前提にしない。
  pendingStorageWrite = pendingStorageWrite.finally(() =>
    chrome.storage.session.set({ sessionRestoreState: state }).catch(() => {}),
  );
};
