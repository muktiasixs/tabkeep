import React, { useState } from "react";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { SessionBox } from "./SessionBox";
import type { Folder as FolderType, Session, SavedTab } from "~types";

interface Props {
    folder: FolderType;
    sessions: Session[];
    allFolders: FolderType[];
    onDeleteSession: (id: string) => void;
    onMoveFolder: (sessionId: string, folderId: string | null) => void;
    onMoveTab?: (sourceSessionId: string, targetSessionId: string, tabIndex: number) => void;
    onDeleteTab?: (sessionId: string, tabIndex: number) => void;
    onTabHover: (tab: (SavedTab & { sessionTimestamp?: string; sessionId?: string }) | null) => void;
    theme: "light" | "dark";
}

export function MainFolderAccordion({ folder, sessions, allFolders, onDeleteSession, onMoveFolder, onMoveTab, onDeleteTab, onTabHover, theme }: Props) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (sessions.length === 0) return null;

    return (
        <div className="mb-8">
            <div 
                className="flex items-center gap-3 mb-3 cursor-pointer group w-max"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="p-1 rounded-md bg-gray-200 dark:bg-[#252525] group-hover:bg-gray-300 dark:group-hover:bg-[#2a2a2a] transition-colors">
                    {isExpanded ? <ChevronDown size={14} className="text-gray-600 dark:text-gray-400" /> : <ChevronRight size={14} className="text-gray-600 dark:text-gray-400" />}
                </div>
                <Folder size={18} className="text-blue-500 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{folder.name}</h3>
                <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-white/10 px-2 py-0.5 rounded-full">
                    {sessions.length}
                </span>
            </div>

            {isExpanded && (
                <div className="space-y-3 pl-2 border-l-2 border-transparent transition-all">
                    {sessions.map(s => (
                        <SessionBox
                            key={s.id}
                            session={s}
                            folders={allFolders}
                            onDelete={onDeleteSession}
                            onMoveFolder={onMoveFolder}
                            onMoveTab={onMoveTab}
                            onDeleteTab={onDeleteTab}
                            onTabHover={onTabHover}
                            theme={theme}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
