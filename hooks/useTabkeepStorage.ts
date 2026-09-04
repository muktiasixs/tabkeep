import { useSyncExternalStore, type Dispatch, type SetStateAction } from "react";
import type { Session, Folder, PinnedLink, Settings } from "~types";
import { getSessions, getFolders, getDeletedSessions, getPinnedLinks, getSettings, defaultSettings } from "~lib/storage";

type Snapshot = {
    sessions: Session[];
    folders: Folder[];
    deletedSessions: Session[];
    pinnedLinks: PinnedLink[];
    settings: Settings;
};

let snapshot: Snapshot = { sessions: [], folders: [], deletedSessions: [], pinnedLinks: [], settings: defaultSettings };
let initialized = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());
const update = <K extends keyof Snapshot>(key: K, value: SetStateAction<Snapshot[K]>) => {
    const next = typeof value === "function" ? (value as (current: Snapshot[K]) => Snapshot[K])(snapshot[key]) : value;
    snapshot = { ...snapshot, [key]: next };
    emit();
};

const setSessions: Dispatch<SetStateAction<Session[]>> = (value) => update("sessions", value);
const setFolders: Dispatch<SetStateAction<Folder[]>> = (value) => update("folders", value);
const setDeletedSessions: Dispatch<SetStateAction<Session[]>> = (value) => update("deletedSessions", value);
const setPinnedLinks: Dispatch<SetStateAction<PinnedLink[]>> = (value) => update("pinnedLinks", value);
const setSettings: Dispatch<SetStateAction<Settings>> = (value) => update("settings", value);

const initialize = () => {
    if (initialized || typeof chrome === "undefined" || !chrome.storage) return;
    initialized = true;

    Promise.all([getSessions(), getFolders(), getDeletedSessions(), getPinnedLinks(), getSettings()]).then(([sessions, folders, deletedSessions, pinnedLinks, settings]) => {
        snapshot = { sessions, folders, deletedSessions, pinnedLinks, settings };
        emit();
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local") return;
        const next = { ...snapshot };
        if (changes.sessions) next.sessions = ((changes.sessions.newValue || []) as Session[]).map((session) => ({ ...session, folderId: session.folderId ?? null }));
        if (changes.folders) next.folders = changes.folders.newValue || [];
        if (changes.deletedSessions) next.deletedSessions = changes.deletedSessions.newValue || [];
        if (changes.pinnedLinks) next.pinnedLinks = changes.pinnedLinks.newValue || [];
        if (changes.settings) next.settings = { ...defaultSettings, ...(changes.settings.newValue || {}) };
        snapshot = next;
        emit();
    });
};

const subscribe = (listener: () => void) => {
    initialize();
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export function useTabkeepStorage() {
    const current = useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
    return { ...current, setSessions, setFolders, setDeletedSessions, setPinnedLinks, setSettings };
}
