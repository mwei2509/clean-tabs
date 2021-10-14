chrome.action.onClicked.addListener(() => consolidateTabs());

async function consolidateTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  // best is active and last
  const tabsToClose = [];
  // url: [tab ids]
  const urlMap = {};

  tabs.forEach(tab => {
    // if url exists
    const tabGroup = urlMap[tab.url];
    if (tabGroup) {
      tabGroup.push(tab.id);

      // if tab is active, move all other tabs to close
      if (tab.active) {
        tabsToClose.concat(tabGroup);
      } else {
        tabsToClose.push(tab.id);
      }
    } else {
      urlMap[tab.url] = [tab.id];
    }
  });

  await chrome.tabs.remove(tabsToClose);
}