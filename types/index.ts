// Satu-satunya sumber kebenaran untuk semua tipe data Tabkeep.
// Semua file lain wajib import dari sini.

export interface SavedTab {
    title: string;
    url: string;
    favIconUrl: string;
    screenshot?: string; // Base64 data URL
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
