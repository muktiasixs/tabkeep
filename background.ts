import { persistSession } from "~lib/storage";
import { saveThumbnail } from "~lib/db";

export { }

const DASHBOARD_URL = chrome.runtime.getURL("tabs/dashboard.html");

let captureDebounce: ReturnType<typeof setTimeout>;

// Helper to capture a tab's visible area and save to IndexedDB
async function captureTab(tabId: number) {
    try {
        const tab = await chrome.tabs.get(tabId);
        // Only capture active tabs that are fully loaded and not discarded
        if (tab.active && tab.status === "complete" && tab.url && tab.url.startsWith("http") && !tab.discarded) {
            const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
                format: "jpeg",
                quality: 50 // Get a decent initial image before resizing
            });

            // Convert base64 to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            
            // Resize using OffscreenCanvas
            const bitmap = await createImageBitmap(blob, { resizeWidth: 320, resizeQuality: 'low' });
            
            // Calculate aspect ratio height to maintain proportions (assuming 16:9 for generic tabs, or dynamically based on bitmap)
            const aspectRatio = bitmap.width / bitmap.height;
            const targetHeight = Math.round(320 / aspectRatio);
            
            const canvas = new OffscreenCanvas(320, targetHeight);
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(bitmap, 0, 0, 320, targetHeight);
                const webpBlob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.5 });
                
                // Save to IndexedDB using URL as key
                await saveThumbnail(tab.url, webpBlob);
            }
        }
    } catch (e) {
        // Silently catch exceptions (e.g., when capturing chrome:// tabs or extension popups)
        console.error("Failed to capture tab:", e);
    }
}

// Track active tab changes
chrome.tabs.onActivated.addListener(({ tabId }) => {
    clearTimeout(captureDebounce);
    // Wait for user to settle on the tab before capturing
    captureDebounce = setTimeout(() => captureTab(tabId), 1000);
});

// Track page loads/updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.active) {
        clearTimeout(captureDebounce);
        captureDebounce = setTimeout(() => captureTab(tabId), 1000);
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
                return {
                    title: t.title || "No Title",
                    url: t.url || "",
                    favIconUrl: t.favIconUrl || "",
                    // We no longer populate screenshot here. It is fetched lazily via IndexedDB.
                    screenshot: undefined 
                };
            });
            await persistSession(savedTabs);
            tabsToSave.forEach(t => chrome.tabs.remove(t.id));
        }
    }
});

// Jalankan pin saat browser dibuka
chrome.runtime.onStartup.addListener(ensurePinned);