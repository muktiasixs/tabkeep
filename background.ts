import { persistSession } from "~lib/storage";

export { }

const DASHBOARD_URL = chrome.runtime.getURL("tabs/dashboard.html");

// Fungsi Pin Dashboard
async function ensurePinned() {
    const tabs = await chrome.tabs.query({});
    const exists = tabs.find(t => t.url === DASHBOARD_URL);
    if (!exists) {
        await chrome.tabs.create({ url: DASHBOARD_URL, pinned: true, index: 0 });
    } else {
        await chrome.tabs.update(exists.id, { pinned: true });
        await chrome.tabs.move(exists.id, { index: 0 });
    }
}

// Buat context menu saat extension diinstall
chrome.runtime.onInstalled.addListener(() => {
    ensurePinned();
    chrome.contextMenus.create({
        id: "send-to-tabkeep",
        title: "Send selected tabs to Tabkeep",
        contexts: ["tab"]
    });
});

// Tangani klik context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "send-to-tabkeep") {
        const selectedTabs = await chrome.tabs.query({ highlighted: true, currentWindow: true });
        const tabsToSave = selectedTabs.filter(t => !t.url.includes("dashboard.html"));

        if (tabsToSave.length > 0) {
            await persistSession(tabsToSave.map(t => ({
                title: t.title || "No Title",
                url: t.url || "",
                favIconUrl: t.favIconUrl || ""
            })));
            tabsToSave.forEach(t => chrome.tabs.remove(t.id));
        }
    }
});

// Jalankan pin saat browser dibuka
chrome.runtime.onStartup.addListener(ensurePinned);