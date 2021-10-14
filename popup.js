const consolidateTabButton = document.getElementById('consolidateTabs');
const ignoreUrlParamsButton = document.getElementById('ignoreUrlParams');
const consolidateWindowsButton = document.getElementById('consolidateWindows');
const groupTabsButton = document.getElementById('groupTabs');

consolidateTabButton.addEventListener('click', consolidateTabs);

async function consolidateTabs() {
  const windows = await chrome.windows.getAll();
  const currentWindow = await chrome.windows.getCurrent();

  let tabs = [];
  // if consolidating windows, collect tabs from all windows
  if (consolidateWindowsButton.checked) {
    for (const window of windows) {
      const windowTabs = await chrome.tabs.query({ windowId: window.id });
      tabs = tabs.concat(windowTabs);
    }
  } else {
    tabs = await chrome.tabs.query({ currentWindow: true });
  }

  // best is active and last
  let tabsToClose = [];
  
  // tab to keep for each url
  const urlMap = {};

  for (tab of tabs) {
    const url = ignoreUrlParamsButton.checked
      ? tab.url.split('?')[0]
      : tab.url;

    const existingTab = urlMap[url];
    if (existingTab) {
      if (tab.active) {
        tabsToClose.push(existingTab.id);
        urlMap[url] = tab; // replace
      } else {
        tabsToClose.push(tab.id)
      }
    } else {
      urlMap[url] = tab;
    }
  }

  // remove duplicate tabs
  await chrome.tabs.remove(tabsToClose);

  if (groupTabsButton.checked) {
    // sort tabs by domain
    const sortedTabs = Object.values(urlMap)
      .map(tab => ({
        windowId: tab.windowId,
        id: tab.id,
        domain: getDomain(tab.url)
      }))
      .sort((a,b) => (a.domain > b.domain) ? 1 : ((b.domain > a.domain) ? -1 : 0));

    sortedTabs.forEach(async (tab, index) => {
      chrome.tabs.move([tab.id], { windowId: currentWindow.id, index });
    })

    await chrome.tabs.move(sortedTabs, { windowId: currentWindow.id, index: -1 });
  } else {
    const tabsToMove = Object.values(urlMap)
      .filter(tab => tab.windowId !== currentWindow.id)
      .map(tab => tab.id);

    if (tabsToMove.length) {
      await chrome.tabs.move(tabsToMove, { windowId: currentWindow.id, index: -1 });
    }
  }
}

function getDomain(url) {
  let domain = url.split('://')[1];
  return domain.split('/')[0];
}
