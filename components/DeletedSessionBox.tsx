import React, { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw, Trash2 } from "lucide-react";
import type { Session } from "~types";

interface Props {
    session: Session;
    onRestore: (id: string) => void;
    onPermanentDelete: (id: string) => void;
    theme: "light" | "dark";
}

export function DeletedSessionBox({ session, onRestore, onPermanentDelete, theme }: Props) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!session || !session.tabs) return null;

    const handleRestore = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRestore(session.id);
    };

    const handlePermanentDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onPermanentDelete(session.id);
    };

    return (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-200 dark:border-[#333] mb-4 overflow-hidden shadow-sm dark:shadow-lg transition-all duration-300">
            {/* Header */}
            <div
                className="p-4 bg-gray-50 dark:bg-[#252525] border-b border-gray-200 dark:border-[#333] flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {isExpanded
                        ? <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
                        : <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
                    }
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white italic tracking-tight opacity-70">
                        {session.tabs.length} tabs <span className="text-xs font-normal not-italic text-gray-500 ml-2">(Deleted {session.deletedAt})</span>
                    </h3>
                </div>

                <div className="text-right flex items-center gap-3">
                    <button
                        onClick={handleRestore}
                        title="Pulihkan session ke Uncategorized"
                        className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-500 font-bold hover:text-blue-500 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded bg-blue-50 dark:bg-blue-500/10"
                    >
                        <RotateCcw size={12} />
                        Restore
                    </button>
                    <button
                        onClick={handlePermanentDelete}
                        title="Hapus permanen"
                        className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-500 font-bold hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 rounded bg-red-50 dark:bg-red-500/10"
                    >
                        <Trash2 size={12} />
                        Delete Forever
                    </button>
                </div>
            </div>

            {/* Tab list */}
            {isExpanded && (
                <ul className="p-2 space-y-1 bg-white/50 dark:bg-[#1a1a1a]/50">
                    {session.tabs.map((tab, idx) => (
                        <li
                            key={idx}
                            className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#252525] p-2 rounded group transition-colors opacity-60"
                        >
                            <img
                                src={tab.favIconUrl || "https://www.google.com/s2/favicons?domain=google.com&sz=32"}
                                className="w-3.5 h-3.5 flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=google.com"; }}
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 font-medium line-through decoration-gray-300 dark:decoration-gray-600">
                                {tab.title || "Untitled Tab"}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
