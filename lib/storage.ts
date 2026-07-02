// Semua operasi chrome.storage terpusat di sini.
// Komponen & hooks tidak boleh memanggil chrome.storage langsung.

import type { Session, Folder, SavedTab, PinnedLink, Settings } from "~types"

export const defaultSettings: Settings = {
    restoreOption: "remove",
    duplicateOption: "allow",
    urlDisplayOption: "domain"
};

// --- Getters ---

export async function getSessions(): Promise<Session[]> {
    const data = await chrome.storage.local.get("sessions");
    const raw = (data.sessions || []) as Session[];
    // Migrate: pastikan semua session punya folderId
    return raw.map(s => ({
        ...s,
        folderId: s.folderId !== undefined ? s.folderId : null
    }));
}

export async function getFolders(): Promise<Folder[]> {
    const data = await chrome.storage.local.get("folders");
    return (data.folders || []) as Folder[];
}

export async function getDeletedSessions(): Promise<Session[]> {
    const data = await chrome.storage.local.get("deletedSessions");
    return (data.deletedSessions || []) as Session[];
}

// --- Setters ---

export async function updateSessions(sessions: Session[]): Promise<void> {
    await chrome.storage.local.set({ sessions });
}

export async function updateFolders(folders: Folder[]): Promise<void> {
    await chrome.storage.local.set({ folders });
}

export async function updateDeletedSessions(deletedSessions: Session[]): Promise<void> {
    await chrome.storage.local.set({ deletedSessions });
}

export async function getPinnedLinks(): Promise<PinnedLink[]> {
    const data = await chrome.storage.local.get("pinnedLinks");
    return (data.pinnedLinks || []) as PinnedLink[];
}

export async function updatePinnedLinks(pinnedLinks: PinnedLink[]): Promise<void> {
    await chrome.storage.local.set({ pinnedLinks });
}

export async function getSettings(): Promise<Settings> {
    const data = await chrome.storage.local.get("settings");
    return { ...defaultSettings, ...(data.settings || {}) };
}

export async function updateSettings(settings: Settings): Promise<void> {
    await chrome.storage.local.set({ settings });
}

// --- Helpers ---

/**
 * Buat session baru dari daftar tab dan simpan ke storage.
 * Session masuk ke Uncategorized (folderId: null) secara default.
 */
export async function persistSession(tabsToSave: SavedTab[]): Promise<void> {
    const sessions = await getSessions();
    const settings = await getSettings();

    let finalTabs = tabsToSave;
    
    if (settings.duplicateOption === "reject") {
        const existingUrls = new Set<string>();
        sessions.forEach(s => s.tabs.forEach(t => existingUrls.add(t.url)));
        finalTabs = tabsToSave.filter(t => !existingUrls.has(t.url));
    }

    if (finalTabs.length === 0) return;

    const newSession: Session = {
        id: `session-${Date.now()}`,
        name: `Session ${new Date().toLocaleTimeString()}`,
        timestamp: new Date().toLocaleString(),
        folderId: null,
        tabs: finalTabs
    };
    await updateSessions([newSession, ...sessions]);
}
