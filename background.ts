import { persistSession, getSessions, getFolders, getSettings, getPinnedLinks } from "~lib/storage";
import { saveThumbnail, getAllThumbnails } from "~lib/db";
import { uploadToGDrive } from "~lib/gdrive";

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
                quality: 80 // Get a decent initial image before resizing
            });

            // Convert base64 to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            
            // Resize using OffscreenCanvas with high quality downscaling
            const bitmap = await createImageBitmap(blob, { resizeWidth: 320, resizeQuality: 'high' });
            
            // Calculate aspect ratio height to maintain proportions
            const aspectRatio = bitmap.width / bitmap.height;
            const targetHeight = Math.round(320 / aspectRatio);
            
            const canvas = new OffscreenCanvas(320, targetHeight);
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(bitmap, 0, 0, 320, targetHeight);
                const webpBlob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.8 });
                
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
        const tabsToSave = selectedTabs.filter(t => t.url && !t.url.includes("dashboard.html") && !t.pinned);

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

// --- Google Drive Auto-Sync Background Logic ---

// 1. Function to run silent upload of JSON data
async function runGDriveSync() {
    console.log("Auto-Sync: Starting GDrive background sync...");
    try {
        const settings = await getSettings();
        if (!settings.autoSync) return;

        const sessions = await getSessions();
        const folders = await getFolders();
        const pinnedLinks = await getPinnedLinks();
        
        let thumbnails: Record<string, string> = {};
        if (settings.backupThumbnails) {
            thumbnails = await getAllThumbnails();
        }

        const backupData = {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            sessions,
            folders,
            pinnedLinks,
            settings,
            thumbnails
        };

        await uploadToGDrive(JSON.stringify(backupData, null, 2), "tabkeep-backup.json", false);
        console.log("Auto-Sync: Background sync completed successfully.");
    } catch (error) {
        console.error("Auto-Sync: Error running GDrive background sync:", error);
    }
}

// 2. Setup or teardown alarm based on settings
async function updateAutoSyncAlarm() {
    const settings = await getSettings();
    const ALARM_NAME = "tabkeep-gdrive-auto-sync";

    if (settings.autoSync && settings.autoSyncInterval) {
        const periodInMinutes = settings.autoSyncInterval * 60;
        // Clear existing first
        await chrome.alarms.clear(ALARM_NAME);
        // Create new alarm
        chrome.alarms.create(ALARM_NAME, {
            delayInMinutes: periodInMinutes,
            periodInMinutes: periodInMinutes
        });
        console.log(`Auto-Sync: Alarm set for every ${settings.autoSyncInterval} hours.`);
    } else {
        await chrome.alarms.clear(ALARM_NAME);
        console.log("Auto-Sync: Alarm cleared.");
    }
}

// 3. Listen to alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "tabkeep-gdrive-auto-sync") {
        runGDriveSync();
    }
});

// 4. Listen to storage changes to update alarm
chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "local" && changes.settings) {
        await updateAutoSyncAlarm();
    }
});

// 5. Initialize alarm on startup
chrome.runtime.onStartup.addListener(() => {
    updateAutoSyncAlarm();
});

// Also run update alarm on install helper
chrome.runtime.onInstalled.addListener(() => {
    updateAutoSyncAlarm();
});

// Jalankan pin saat browser dibuka
chrome.runtime.onStartup.addListener(ensurePinned);