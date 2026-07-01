import React, { useState } from "react";
import { ChevronDown, ChevronRight, Folder, X } from "lucide-react";
import { SessionBox } from "./SessionBox";
import type { Folder as FolderType, Session, SavedTab, PinnedLink, SelectedTab } from "~types";

interface Props {
    folder: FolderType;
    sessions: Session[];
    allFolders: FolderType[];
    onDeleteSession: (id: string) => void;
    onRenameSession: (id: string, newName: string) => void;
    onRenameFolder: (id: string, newName: string) => void;
    onDeleteFolder: (id: string) => void;
    onMoveFolder: (sessionId: string, folderId: string | null) => void;
    onMoveTab?: (sourceSessionId: string, targetSessionId: string, tabIndex: number, insertIndex?: number) => void;
    onMoveMultiTabs?: (tabsToMove: SelectedTab[], targetSessionId: string, insertIndex?: number) => void;
    onMoveTabToFolder?: (sourceSessionId: string, tabIndex: number, folderId: string | null, targetSessionId?: string, insertPosition?: "before" | "after") => void;
    onMoveMultiTabsToFolder?: (tabsToMove: SelectedTab[], folderId: string | null, targetSessionId?: string, insertPosition?: "before" | "after") => void;
    onMergeSessions?: (sourceSessionId: string, targetSessionId: string) => void;
    onDeleteTab?: (sessionId: string, tabIndex: number) => void;
    onTabHover: (tab: (SavedTab & { sessionTimestamp?: string; sessionId?: string }) | null) => void;
    pinnedLinks: PinnedLink[];
    onPinTab: (tab: SavedTab, folderId: string | null) => void;
    onUnpinTab: (url: string) => void;
    onDropPinnedLinkToFolder?: (link: any, folderId: string) => void;
    onDropPinnedLinkToSession?: (link: any, sessionId: string, targetSessionId?: string, insertPosition?: "before" | "after") => void;
    onReorderFolder?: (draggedId: string, targetId: string, position: "before" | "after") => void;
    onReorderSession?: (draggedId: string, targetId: string, position: "before" | "after") => void;
    onReorderTab?: (sessionId: string, fromIdx: number, toIdx: number) => void;
    selectedTabs?: SelectedTab[];
    onToggleTabSelection?: (sessionId: string, tabIndex: number, url: string, isShift: boolean) => void;
    theme: "light" | "dark";
}

export function MainFolderAccordion({ folder, sessions, allFolders, onDeleteSession, onRenameSession, onRenameFolder, onDeleteFolder, onMoveFolder, onMoveTab, onMoveMultiTabs, onMoveTabToFolder, onMoveMultiTabsToFolder, onMergeSessions, onDeleteTab, onTabHover, pinnedLinks, onPinTab, onUnpinTab, onDropPinnedLinkToFolder, onDropPinnedLinkToSession, onReorderFolder, onReorderSession, onReorderTab, selectedTabs, onToggleTabSelection, theme }: Props) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDragOver, setIsDragOver] = useState(false);
    const [folderDropPos, setFolderDropPos] = useState<"before" | "after" | null>(null);
    
    // Edit folder state
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(folder.name);

    const handleDragOver = (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes("application/tabkeep-session") || e.dataTransfer.types.includes("application/json") || e.dataTransfer.types.includes("application/tabkeep-pinned-link") || e.dataTransfer.types.includes("application/tabkeep-reorder-folder") || e.dataTransfer.types.includes("application/tabkeep-multi-tabs")) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";
            if (!isDragOver) setIsDragOver(true);
            
            if (e.dataTransfer.types.includes("application/tabkeep-reorder-folder")) {
                const rect = e.currentTarget.getBoundingClientRect();
                setFolderDropPos(e.clientY < rect.top + rect.height / 2 ? "before" : "after");
            }
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
            setFolderDropPos(null);
        }
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
            } catch (err) { }
        } else if (e.dataTransfer.types.includes("application/tabkeep-multi-tabs")) {
            e.preventDefault();
            try {
                const tabsToMove = JSON.parse(e.dataTransfer.getData("application/tabkeep-multi-tabs"));
                if (tabsToMove && tabsToMove.length > 0 && onMoveMultiTabsToFolder) {
                    onMoveMultiTabsToFolder(tabsToMove, folder.id);
                }
            } catch (err) {}
        } else if (e.dataTransfer.types.includes("application/tabkeep-pinned-link")) {
            e.preventDefault();
            e.stopPropagation();
            try {
                const link = JSON.parse(e.dataTransfer.getData("application/tabkeep-pinned-link"));
                if (link && onDropPinnedLinkToFolder) {
                    onDropPinnedLinkToFolder(link, folder.id);
                    if (!isExpanded) setIsExpanded(true);
                }
            } catch (err) { }
        } else if (e.dataTransfer.types.includes("application/json")) {
            e.preventDefault();
            e.stopPropagation();
            try {
                const data = JSON.parse(e.dataTransfer.getData("application/json"));
                if (data.sourceSessionId && data.tabIndex !== undefined && onMoveTabToFolder) {
                    onMoveTabToFolder(data.sourceSessionId, data.tabIndex, folder.id);
                    if (!isExpanded) setIsExpanded(true);
                }
            } catch (err) {}
        } else if (e.dataTransfer.types.includes("application/tabkeep-reorder-folder")) {
            e.preventDefault();
            e.stopPropagation();
            try {
                const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-reorder-folder"));
                if (data.folderId && data.folderId !== folder.id && onReorderFolder) {
                    onReorderFolder(data.folderId, folder.id, folderDropPos || "after");
                }
            } catch (err) {}
            setFolderDropPos(null);
        }
    };
    
    const startEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditing(true);
        setEditValue(folder.name);
    };

    const commitEdit = () => {
        if (editValue.trim() && editValue !== folder.name) {
            onRenameFolder(folder.id, editValue.trim());
        } else {
            setEditValue(folder.name);
        }
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") commitEdit();
        if (e.key === "Escape") setEditing(false);
    };

    return (
        <div className={`relative mb-6 last:mb-0 bg-white dark:bg-[#1a1a1a] rounded-2xl border transition-all ${isDragOver && !folderDropPos
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-gray-200 dark:border-[#333]"
        }`}>
            {/* Folder reorder drop indicator – before */}
            {folderDropPos === "before" && (
                <div className="absolute -top-3 left-0 right-0 h-1 bg-blue-500 rounded-full pointer-events-none z-10" />
            )}
            <div
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData("application/tabkeep-reorder-folder", JSON.stringify({ folderId: folder.id }));
                    e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex items-center gap-3 cursor-pointer group p-4 transition-all rounded-t-2xl ${!isExpanded ? "rounded-b-2xl" : ""} ${isExpanded ? "border-b border-gray-100 dark:border-white/10" : ""}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="p-1 rounded-md bg-gray-200 dark:bg-[#333] group-hover:bg-gray-300 dark:group-hover:bg-[#444] transition-colors">
                    {isExpanded ? <ChevronDown size={14} className="text-gray-600 dark:text-gray-400" /> : <ChevronRight size={14} className="text-gray-600 dark:text-gray-400" />}
                </div>
                <Folder size={18} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
                
                {editing ? (
                    <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-[#1a1a1a] border border-blue-500 rounded px-2 py-0.5 text-lg font-bold text-gray-900 dark:text-white outline-none flex-1 min-w-0"
                    />
                ) : (
                    <h3 
                        className="text-lg font-bold text-gray-900 dark:text-white tracking-tight flex-1 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            startEdit(e);
                        }}
                        title="Double click to rename"
                    >
                        {folder.name}
                    </h3>
                )}
                
                <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-white/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    {sessions.length}
                </span>
                
                {!editing && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFolder(folder.id);
                        }}
                        title="Hapus folder"
                        className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-[#333]"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="p-4 space-y-3 bg-gray-50/50 dark:bg-black/20 rounded-b-2xl">
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
                                onMoveMultiTabs={onMoveMultiTabs}
                                onMoveTabToFolder={onMoveTabToFolder}
                                onMoveMultiTabsToFolder={onMoveMultiTabsToFolder}
                                onMergeSessions={onMergeSessions}
                                onDeleteTab={onDeleteTab}
                                onTabHover={onTabHover}
                                selectedTabs={selectedTabs}
                                onToggleTabSelection={onToggleTabSelection}
                                onPinTab={onPinTab}
                                onUnpinTab={onUnpinTab}
                                onDropPinnedLinkToSession={onDropPinnedLinkToSession}
                                onReorderTab={onReorderTab}
                                onReorderSession={onReorderSession}
                                theme={theme}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Folder reorder drop indicator – after */}
            {folderDropPos === "after" && (
                <div className="absolute -bottom-3 left-0 right-0 h-1 bg-blue-500 rounded-full pointer-events-none z-10" />
            )}
        </div>
    );
}
