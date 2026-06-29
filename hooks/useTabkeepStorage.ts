// Custom hook yang meng-handle load awal sessions & folders dari storage,
// serta mendengarkan perubahan storage secara real-time.

import { useEffect, useState } from "react";
import type { Session, Folder } from "~types";
import { getSessions, getFolders } from "~lib/storage";

export function useTabkeepStorage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);

    useEffect(() => {
        // Load awal
        const load = async () => {
            if (typeof chrome === "undefined" || !chrome.storage) return;
            setSessions(await getSessions());
            setFolders(await getFolders());
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
        };

        chrome.storage.onChanged.addListener(handleChange);
        return () => chrome.storage.onChanged.removeListener(handleChange);
    }, []);

    return { sessions, setSessions, folders, setFolders };
}
