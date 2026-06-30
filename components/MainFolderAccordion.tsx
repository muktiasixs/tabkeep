import React, { useState } from "react";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { SessionBox } from "./SessionBox";
import type { Folder as FolderType, Session, SavedTab, PinnedLink } from "~types";

interface Props {
    folder: FolderType;
    sessions: Session[];
    allFolders: FolderType[];
    onDeleteSession: (id: string) => void;
    onRenameSession: (id: string, newName: string) => void;
    onMoveFolder: (sessionId: string, folderId: string | null) => void;
    onMoveTab?: (sourceSessionId: string, targetSessionId: string, tabIndex: number) => void;
    onDeleteTab?: (sessionId: string, tabIndex: number) => void;
    onTabHover: (tab: (SavedTab & { sessionTimestamp?: string; sessionId?: string }) | null) => void;
    pinnedLinks: PinnedLink[];
    onPinTab: (tab: SavedTab, folderId: string | null) => void;
    onUnpinTab: (url: string) => void;
    theme: "light" | "dark";
}

export function MainFolderAccordion({ folder, sessions, allFolders, onDeleteSession, onRenameSession, onMoveFolder, onMoveTab, onDeleteTab, onTabHover, pinnedLinks, onPinTab, onUnpinTab, theme }: Props) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes("application/tabkeep-session") || e.dataTransfer.types.includes("application/json")) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";
            if (!isDragOver) setIsDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        setIsDragOver(false);
        if (e.dataTransfer.types.includes("application/tabkeep-session")) {
            e.preventDefault();
            e.stopPropagation();
            try {
                const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-session"));
                if (data.sessionId && onMoveFolder) {
                    onMoveFolder(data.sessionId, folder.id);
                }
            } catch (err) {}
        }
    };

    return (
        <div 
            className={`mb-8 border rounded-xl overflow-hidden transition-all shadow-sm dark:shadow-none ${
                isDragOver ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 outline-dashed outline-2 outline-blue-500" : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a]"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div 
                className={`flex items-center gap-3 cursor-pointer group p-4 transition-all ${
                    isExpanded ? "border-b border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-[#222]" : "hover:bg-gray-50 dark:hover:bg-[#252525]"
                }`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="p-1 rounded-md bg-gray-200 dark:bg-[#333] group-hover:bg-gray-300 dark:group-hover:bg-[#444] transition-colors">
                    {isExpanded ? <ChevronDown size={14} className="text-gray-600 dark:text-gray-400" /> : <ChevronRight size={14} className="text-gray-600 dark:text-gray-400" />}
                </div>
                <Folder size={18} className="text-blue-500 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{folder.name}</h3>
                <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-white/10 px-2 py-0.5 rounded-full">
                    {sessions.length}
                </span>
            </div>

            {isExpanded && (
                <div className="p-4 space-y-3 bg-gray-50/30 dark:bg-transparent">
                    {sessions.length === 0 ? (
                        <p className="text-[10px] text-gray-400 dark:text-gray-600 italic">Folder kosong</p>
                    ) : (
                        sessions.map(s => (
                            <SessionBox
                                key={s.id}
                                session={s}
                                folders={allFolders}
                                pinnedLinks={pinnedLinks}
                                onDelete={onDeleteSession}
                                onRenameSession={onRenameSession}
                                onMoveFolder={onMoveFolder}
                                onMoveTab={onMoveTab}
                                onDeleteTab={onDeleteTab}
                                onTabHover={onTabHover}
                                onPinTab={onPinTab}
                                onUnpinTab={onUnpinTab}
                                theme={theme}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
