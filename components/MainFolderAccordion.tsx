import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, Folder, X, MoreHorizontal, ExternalLink, Pencil, Monitor, Copy, Link, Layers, Globe } from "lucide-react";
import { SessionBox } from "./SessionBox";
import type { Folder as FolderType, Session, SavedTab, PinnedLink, SelectedTab } from "~types";
import { parseImportedLines } from "~lib/linkParser";

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
    viewMode?: "list" | "grid" | "graph";
    theme: "light" | "dark";
}

export function MainFolderAccordion({ folder, sessions, allFolders, onDeleteSession, onRenameSession, onRenameFolder, onDeleteFolder, onMoveFolder, onMoveTab, onMoveMultiTabs, onMoveTabToFolder, onMoveMultiTabsToFolder, onMergeSessions, onDeleteTab, onTabHover, pinnedLinks, onPinTab, onUnpinTab, onDropPinnedLinkToFolder, onDropPinnedLinkToSession, onReorderFolder, onReorderSession, onReorderTab, selectedTabs, onToggleTabSelection, viewMode = "list", theme }: Props) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDragOver, setIsDragOver] = useState(false);
    const [folderDropPos, setFolderDropPos] = useState<"before" | "after" | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Edit folder state
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(folder.name);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
            } catch (err) { }
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
            } catch (err) { }
        } else if (e.dataTransfer.types.includes("application/tabkeep-reorder-folder")) {
            e.preventDefault();
            e.stopPropagation();
            try {
                const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-reorder-folder"));
                if (data.folderId && data.folderId !== folder.id && onReorderFolder) {
                    onReorderFolder(data.folderId, folder.id, folderDropPos || "after");
                }
            } catch (err) { }
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
        <div className={`relative mb-1.5 last:mb-0 bg-white dark:bg-[#1a1a1a] rounded-none shadow-sm dark:shadow-none transition-all ${isDragOver && !folderDropPos
            ? "ring-2 ring-blue-500/50"
            : ""
            }`}>
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
                onDrop={handleDrop}
                className={`flex items-center gap-3 group p-4 transition-all rounded-none ${!isExpanded ? "rounded-none" : ""}`}
            >
                <div 
                    className="p-1 rounded-none bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#444] transition-colors cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                >
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
                        className="bg-white dark:bg-[#1a1a1a] border border-blue-500 rounded-none px-2 py-0.5 text-lg font-bold text-gray-900 dark:text-white outline-none flex-1 min-w-0"
                    />
                ) : (
                    <h3
                        className="text-lg font-bold text-gray-900 dark:text-white tracking-tight flex-1 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-text"
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

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-none hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                    >
                        <MoreHorizontal size={16} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-none shadow-lg py-1 z-20">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(false);
                                    const allUrls = sessions.flatMap(s => s.tabs.map(t => t.url));
                                    chrome.windows.create({ url: allUrls });
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                            >
                                <ExternalLink size={12} /> Restore all in new window
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(false);
                                    const allUrls = sessions.flatMap(s => s.tabs.map(t => t.url));
                                    allUrls.forEach(url => chrome.tabs.create({ url, active: false }));
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                            >
                                <Monitor size={12} /> Restore all in this window
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(false);
                                    const allUrls = sessions.flatMap(s => s.tabs.map(t => t.url));
                                    navigator.clipboard.writeText(allUrls.join("\n"));
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                            >
                                <Copy size={12} /> Copy to clipboard
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(false);
                                    startEdit(e as any);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                            >
                                <Pencil size={12} /> Rename
                            </button>
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(false);
                                    try {
                                        const text = await navigator.clipboard.readText();
                                        const newTabs = parseImportedLines(text);
                                        if (newTabs.length > 0) {
                                            const event = new CustomEvent('tabkeep-paste-to-folder', { detail: { folderId: folder.id, tabs: newTabs } });
                                            document.dispatchEvent(event);
                                        }
                                    } catch (err) { }
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                            >
                                <Link size={12} /> Paste link here
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(false);
                                    const event = new CustomEvent('tabkeep-dedup-folder', { detail: { folderId: folder.id } });
                                    document.dispatchEvent(event);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                            >
                                <Layers size={12} /> Remove duplicate
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(false);
                                    const event = new CustomEvent('tabkeep-groupby-web', { detail: { folderId: folder.id } });
                                    document.dispatchEvent(event);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                            >
                                <Globe size={12} /> Group by web
                            </button>
                            <div className="h-px bg-gray-200 dark:bg-[#333] my-1" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(false);
                                    onDeleteFolder(folder.id);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <X size={12} /> Delete folder
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
                <>
                    <div className={`border-t border-gray-100 dark:border-[#222] ${viewMode === "grid" ? "p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 dark:bg-[#131313]" : "p-4 space-y-1.5 bg-gray-50/50 dark:bg-transparent rounded-none"}`}>
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
                                    viewMode={viewMode}
                                    theme={theme}
                                />
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Folder reorder drop indicator Ã¢â‚¬â€œ after */}
            {folderDropPos === "after" && (
                <div className="absolute -bottom-3 left-0 right-0 h-1 bg-blue-500 rounded-full pointer-events-none z-10" />
            )}
        </div>
    );
}
