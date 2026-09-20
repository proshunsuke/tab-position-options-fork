type SortTab = Pick<chrome.tabs.Tab, "id" | "index" | "pinned" | "groupId" | "title" | "url">;

export const getSortedTabs = (tabs: SortTab[], key: "title" | "url") => {
  const result = tabs.toSorted((a, b) => a.index - b.index);
  for (let start = 0; start < result.length; ) {
    if (result[start].pinned) {
      start++;
      continue;
    }
    let end = start + 1;
    while (
      end < result.length &&
      !result[end].pinned &&
      result[end].groupId === result[start].groupId
    ) {
      end++;
    }
    const sorted = result.slice(start, end).sort((a, b) => {
      const left = a[key] ?? "";
      const right = b[key] ?? "";
      if (!left || !right) {
        return Number(!left) - Number(!right) || a.index - b.index;
      }
      return left.localeCompare(right) || a.index - b.index;
    });
    result.splice(start, end - start, ...sorted);
    start = end;
  }
  return result;
};
