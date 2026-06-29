import React, { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw, X } from "lucide-react";
import type { Session, Folder, SavedTab } from "~types";
import { MoveFolderDropdown } from "./MoveFolderDropdown";

interface Props {
    session: Session;
    folders: Folder[];
    onDelete: (id: string) => void;
    onMoveFolder: (sessionId: string, folderId: string | null) => void;
    onTabHover?: (tab: SavedTab & { sessionTimestamp?: string }) => void;
    theme?: string;
}

export function SessionBox({ session, folders, onDelete, onMoveFolder, onTabHover, theme }: Props) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!session || !session.tabs) return null;

    const handleRestoreAll = async (e: React.MouseEvent) => {
        e.stopPropagation();
        for (const tab of session.tabs) {
            if (tab.url) await chrome.tabs.create({ url: tab.url, active: false });
        }
    };

    const handleOpenTab = (url: string) => {
        if (url) chrome.tabs.create({ url, active: true });
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(session.id);
    };

    return (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-[#333] mb-4 overflow-hidden shadow-sm dark:shadow-lg transition-all animate-in fade-in duration-300">
            {/* Header */}
            <div
                className="p-4 bg-gray-50 dark:bg-[#252525] border-b border-gray-100 dark:border-[#333] flex justify-between items-center cursor-pointer hover:bg-gray-100/50 dark:hover:bg-[#2a2a2a]"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {isExpanded
                        ? <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
                        : <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
                    }
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white italic tracking-tight">
                        {session.tabs.length} tabs
                    </h3>
                </div>

                <div className="text-right flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono italic">
                        {session.timestamp || "Just now"}
                    </span>
                    <MoveFolderDropdown
                        sessionId={session.id}
                        currentFolderId={session.folderId}
                        folders={folders}
                        onMove={onMoveFolder}
                        theme={theme}
                    />
                    <button
                        onClick={handleRestoreAll}
                        title="Restore semua tab"
                        className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-500 font-bold hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    >
                        <RotateCcw size={11} />
                        Restore All
                    </button>
                    <button
                        onClick={handleDelete}
                        title="Hapus session"
                        className="text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-1"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Tab list */}
            {isExpanded && (
                <ul className="p-2 space-y-1 bg-white dark:bg-[#1a1a1a]/50 border-t border-gray-100 dark:border-[#333]">
                    {session.tabs.map((tab, idx) => (
                        <li
                            key={idx}
                            onClick={() => handleOpenTab(tab.url)}
                            onMouseEnter={() => onTabHover?.({ ...tab, sessionTimestamp: session.timestamp })}
                            className="flex items-center gap-3 hover:bg-blue-50/50 dark:hover:bg-[#252525] p-2 rounded cursor-pointer group transition-colors"
                        >
                            <img
                                src={tab.favIconUrl || "https://www.google.com/s2/favicons?domain=google.com&sz=32"}
                                className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 bg-gray-100 dark:bg-white/10 rounded-sm flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=google.com"; }}
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate flex-1 font-medium">
                                {tab.title || "Untitled Tab"}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
