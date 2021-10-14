const consolidateTabButton = document.getElementById('consolidateTabs');
const ignoreUrlParamsButton = document.getElementById('ignoreUrlParams');
const consolidateWindowsButton = document.getElementById('consolidateWindows');

consolidateTabButton.addEventListener('click', async () => consolidateTabs());

async function consolidateTabs() {
  console.log(ignoreUrlParamsButton.checked);

  const windows = await chrome.windows.getAll();
  const currentWindow = await chrome.windows.getCurrent();

  let tabs = [];
  if (consolidateWindowsButton.checked) {
    for (const window of windows) {
      const windowTabs = await chrome.tabs.query({ windowId: window.id });
      tabs = tabs.concat(windowTabs);
    }
  } else {
    tabs = await chrome.tabs.query({ currentWindow: true });
  }

  console.log(tabs);

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

  // move windows
  const tabsToMove = Object.values(urlMap)
    .filter(tab => tab.windowId !== currentWindow.id)
    .map(tab => tab.id);

  await chrome.tabs.remove(tabsToClose);
  await chrome.tabs.move(tabsToMove, { windowId: currentWindow.id, index: -1 });
}