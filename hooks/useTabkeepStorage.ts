// Custom hook yang meng-handle load awal sessions & folders dari storage,
// serta mendengarkan perubahan storage secara real-time.

import { useEffect, useState } from "react";
import type { Session, Folder, PinnedLink, Settings } from "~types";
import { getSessions, getFolders, getDeletedSessions, getPinnedLinks, getSettings, defaultSettings } from "~lib/storage";

export function useTabkeepStorage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [deletedSessions, setDeletedSessions] = useState<Session[]>([]);
    const [pinnedLinks, setPinnedLinks] = useState<PinnedLink[]>([]);
    const [settings, setSettings] = useState<Settings>(defaultSettings);

    useEffect(() => {
        // Load awal
        const load = async () => {
            if (typeof chrome === "undefined" || !chrome.storage) return;
            setSessions(await getSessions());
            setFolders(await getFolders());
            setDeletedSessions(await getDeletedSessions());
            setPinnedLinks(await getPinnedLinks());
            setSettings(await getSettings());
        };
        load();

        // Dengarkan perubahan storage (misal: dari background.ts atau popup)
        const handleChange = (changes: Record<string, chrome.storage.StorageChange>) => {
            if (changes.sessions) {
                const updated = (changes.sessions.newValue || []) as Session[];
                setSessions(updated.map(s => ({
                    ...s,
                    folderId: s.folderId !== undefined ? s.folderId : null
                })));
            }
            if (changes.folders) {
                setFolders(changes.folders.newValue || []);
            }
            if (changes.deletedSessions) {
                setDeletedSessions(changes.deletedSessions.newValue || []);
            }
            if (changes.pinnedLinks) {
                setPinnedLinks(changes.pinnedLinks.newValue || []);
            }
            if (changes.settings) {
                setSettings({ ...defaultSettings, ...(changes.settings.newValue || {}) });
            }
        };

        chrome.storage.onChanged.addListener(handleChange);
        return () => chrome.storage.onChanged.removeListener(handleChange);
    }, []);

    return { sessions, setSessions, folders, setFolders, deletedSessions, setDeletedSessions, pinnedLinks, setPinnedLinks, settings, setSettings };
}
