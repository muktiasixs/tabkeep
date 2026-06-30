import { persistSession } from "~lib/storage";

export { }

const DASHBOARD_URL = chrome.runtime.getURL("tabs/dashboard.html");

// In-memory cache for screenshots: tabId -> base64 data URL
const screenshotCache = new Map<number, string>();

// Helper to capture a tab's visible area
async function captureTab(tabId: number) {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.active && tab.status === "complete" && tab.url && tab.url.startsWith("http")) {
            const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
                format: "jpeg",
                quality: 35 // Compressed to save space and memory
            });
            screenshotCache.set(tabId, dataUrl);
        }
    } catch (e) {
        // Silently catch exceptions (e.g., when capturing chrome:// tabs or extension popups)
    }
}

// Track active tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
    captureTab(activeInfo.tabId);
});

// Track page loads/updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.active) {
        captureTab(tabId);
    }
});

// Clean up cache when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    screenshotCache.delete(tabId);
});

// Listen to messages requesting screenshots
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getScreenshots" && Array.isArray(message.tabIds)) {
        const result: Record<number, string> = {};
        message.tabIds.forEach((id: number) => {
            const cached = screenshotCache.get(id);
            if (cached) {
                result[id] = cached;
            }
        });
        sendResponse(result);
        return false; // Synchronous response
    }
});

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
        contexts: ["tab"] as any[]
    });
});

// Tangani klik context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "send-to-tabkeep") {
        const selectedTabs = await chrome.tabs.query({ highlighted: true, currentWindow: true });
        const tabsToSave = selectedTabs.filter(t => !t.url.includes("dashboard.html"));

        if (tabsToSave.length > 0) {
            const savedTabs = tabsToSave.map(t => {
                const screenshot = t.id ? screenshotCache.get(t.id) : undefined;
                return {
                    title: t.title || "No Title",
                    url: t.url || "",
                    favIconUrl: t.favIconUrl || "",
                    screenshot
                };
            });
            await persistSession(savedTabs);
            tabsToSave.forEach(t => chrome.tabs.remove(t.id));
        }
    }
});

// Jalankan pin saat browser dibuka
chrome.runtime.onStartup.addListener(ensurePinned);