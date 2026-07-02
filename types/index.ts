// Satu-satunya sumber kebenaran untuk semua tipe data Tabkeep.
// Semua file lain wajib import dari sini.

export interface SavedTab {
    title: string;
    url: string;
    favIconUrl: string;
    screenshot?: string; // Base64 data URL
    archived?: boolean; // For "mark as archived" restore option
}

export interface SelectedTab {
    sessionId: string;
    tabIndex: number;
    url: string;
}

export interface Session {
    id: string;
    name: string;
    timestamp: string;
    tabs: SavedTab[];
    folderId: string | null; // null = Uncategorized
    deletedAt?: string;
    originalSessionId?: string;
}

export interface Folder {
    id: string;
    name: string;
    createdAt: string;
}

export interface PinnedLink {
    id: string;
    title: string;
    url: string;
    favIconUrl?: string;
    pinnedAt: string;
    folderId: string | null; // which folder the source session belongs to
}

export interface Settings {
    restoreOption: "remove" | "keep" | "archived";
    duplicateOption: "allow" | "reject";
    urlDisplayOption: "none" | "domain" | "abbreviated" | "full";
}
