import React, { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw, X, Pin, PinOff } from "lucide-react";
import type { Session, Folder, SavedTab, PinnedLink, SelectedTab } from "~types";
import { MoveFolderDropdown } from "./MoveFolderDropdown";

interface Props {
    session: Session;
    folders: Folder[];
    pinnedLinks: PinnedLink[];
    onDelete: (id: string) => void;
    onMoveFolder: (sessionId: string, folderId: string | null) => void;
    onMoveTab?: (sourceSessionId: string, targetSessionId: string, tabIndex: number) => void;
    onMoveMultiTabs?: (tabsToMove: SelectedTab[], targetSessionId: string) => void;
    onMergeSessions?: (sourceSessionId: string, targetSessionId: string) => void;
    onDeleteTab?: (sessionId: string, tabIndex: number) => void;
    onTabHover?: (tab: SavedTab & { sessionTimestamp?: string }) => void;
    onPinTab?: (tab: SavedTab, folderId: string | null) => void;
    onUnpinTab?: (url: string) => void;
    onRenameSession?: (id: string, newName: string) => void;
    onDropPinnedLinkToSession?: (link: any, sessionId: string) => void;
    selectedTabs?: SelectedTab[];
    onToggleTabSelection?: (sessionId: string, tabIndex: number, url: string, isShift: boolean) => void;
    theme?: string;
}

export function SessionBox({ session, folders, pinnedLinks, onDelete, onRenameSession, onMoveFolder, onMoveTab, onMoveMultiTabs, onMergeSessions, onDeleteTab, onTabHover, onPinTab, onUnpinTab, onDropPinnedLinkToSession, selectedTabs, onToggleTabSelection, theme }: Props) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDragOver, setIsDragOver] = useState(false);

    // Rename state
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(session.name || "");
    const inputRef = React.useRef<HTMLInputElement>(null);

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

    const handleDeleteTabClick = (e: React.MouseEvent, tabIndex: number) => {
        e.stopPropagation();
        if (onDeleteTab) onDeleteTab(session.id, tabIndex);
    };

    const startEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditValue(session.name || "");
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const commitEdit = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== session.name && onRenameSession) {
            onRenameSession(session.id, trimmed);
        }
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") commitEdit();
        if (e.key === "Escape") setEditing(false);
    };

    const handlePinTabClick = (e: React.MouseEvent, tab: SavedTab) => {
        e.stopPropagation();
        const isPinned = pinnedLinks.some(p => p.url === tab.url);
        if (isPinned) {
            onUnpinTab?.(tab.url);
        } else {
            onPinTab?.(tab, session.folderId);
        }
    };

    const handleDragStartTab = (e: React.DragEvent, tabIndex: number) => {
        e.stopPropagation();
        const tab = session.tabs[tabIndex];
        
        // If this tab is part of a selection, drag all selected tabs
        if (selectedTabs && selectedTabs.some(t => t.sessionId === session.id && t.tabIndex === tabIndex)) {
            e.dataTransfer.setData("application/tabkeep-multi-tabs", JSON.stringify(selectedTabs));
            e.dataTransfer.effectAllowed = "move";
        } else {
            // Drag single tab
            e.dataTransfer.setData("application/json", JSON.stringify({ sourceSessionId: session.id, tabIndex }));
            e.dataTransfer.effectAllowed = "move";
        }
    };

    const handleSessionDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("application/tabkeep-session", JSON.stringify({ sessionId: session.id }));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes("application/tabkeep-session") || e.dataTransfer.types.includes("application/json") || e.dataTransfer.types.includes("application/tabkeep-pinned-link") || e.dataTransfer.types.includes("application/tabkeep-multi-tabs")) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";
            if (!isDragOver) setIsDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        setIsDragOver(false);
        if (e.dataTransfer.types.includes("application/tabkeep-session")) {
            e.preventDefault();
            e.stopPropagation();
            try {
                const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-session"));
                if (data.sessionId && data.sessionId !== session.id && onMergeSessions) {
                    onMergeSessions(data.sessionId, session.id);
                    if (!isExpanded) setIsExpanded(true);
                }
            } catch (err) {}
        } else if (e.dataTransfer.types.includes("application/json")) {
            e.preventDefault();
            e.stopPropagation();
            try {
                const data = JSON.parse(e.dataTransfer.getData("application/json"));
                if (data.sourceSessionId && data.sourceSessionId !== session.id) {
                    onMoveTab?.(data.sourceSessionId, session.id, data.tabIndex);
                    if (!isExpanded) setIsExpanded(true);
                }
            } catch (err) {
                // ignore invalid drops
            }
        } else if (e.dataTransfer.types.includes("application/tabkeep-pinned-link")) {
            e.preventDefault();
            e.stopPropagation();
            try {
                const link = JSON.parse(e.dataTransfer.getData("application/tabkeep-pinned-link"));
                if (link && onDropPinnedLinkToSession) {
                    onDropPinnedLinkToSession(link, session.id);
                    if (!isExpanded) setIsExpanded(true);
                }
            } catch (err) { }
        } else if (e.dataTransfer.types.includes("application/tabkeep-multi-tabs")) {
            e.preventDefault();
            e.stopPropagation();
            try {
                const tabsToMove = JSON.parse(e.dataTransfer.getData("application/tabkeep-multi-tabs"));
                if (tabsToMove && tabsToMove.length > 0 && onMoveMultiTabs) {
                    onMoveMultiTabs(tabsToMove, session.id);
                    if (!isExpanded) setIsExpanded(true);
                }
            } catch (err) {}
        }
    };

    return (
        <div
            draggable
            onDragStart={handleSessionDragStart}
            className={`bg-white dark:bg-[#1e1e1e] rounded-lg border mb-4 overflow-hidden shadow-sm dark:shadow-lg transition-all animate-in fade-in duration-300 ${isDragOver ? "border-blue-500 shadow-blue-500/20" : "border-gray-200 dark:border-[#333]"
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div
                className="p-4 bg-gray-50 dark:bg-[#252525] border-b border-gray-100 dark:border-[#333] flex justify-between items-center cursor-pointer hover:bg-gray-100/50 dark:hover:bg-[#2a2a2a]"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3 group/header">
                    {isExpanded
                        ? <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
                        : <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
                    }
                    {editing ? (
                        <input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-[#1a1a1a] border border-blue-500 rounded px-2 py-0.5 text-sm text-gray-900 dark:text-white outline-none w-48"
                        />
                    ) : (
                        <h3
                            className="text-sm font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => {
                                if (e.detail === 2) startEdit(e); // double click to edit
                            }}
                        >
                            {session.name || "Unnamed Session"}
                            <span className="text-xs font-normal text-gray-500 ml-1 italic opacity-80">
                                ({session.tabs.length} tabs)
                            </span>
                        </h3>
                    )}

                    {!editing && onRenameSession && (
                        <button
                            onClick={startEdit}
                            title="Rename session"
                            className="text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors opacity-0 group-hover/header:opacity-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                        </button>
                    )}
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
                    {session.tabs.map((tab, idx) => {
                        const isPinned = pinnedLinks.some(p => p.url === tab.url);
                        const isSelected = selectedTabs?.some(t => t.sessionId === session.id && t.tabIndex === idx) || false;
                        
                        return (
                            <li
                                key={idx}
                                draggable
                                onDragStart={(e) => handleDragStartTab(e, idx)}
                                onClick={(e) => {
                                    // if user clicked the checkbox area, it's handled by the input
                                    // otherwise open tab
                                    handleOpenTab(tab.url);
                                }}
                                onMouseEnter={() => onTabHover?.({ ...tab, sessionTimestamp: session.timestamp })}
                                className={`flex items-center gap-3 p-2 rounded cursor-grab active:cursor-grabbing group transition-colors ${
                                    isSelected 
                                    ? "bg-blue-50 dark:bg-blue-900/30" 
                                    : "hover:bg-blue-50/50 dark:hover:bg-[#252525]"
                                }`}
                            >
                                <div className={`flex items-center justify-center transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         onToggleTabSelection?.(session.id, idx, tab.url, e.shiftKey);
                                     }}
                                >
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        readOnly
                                        className="w-3.5 h-3.5 cursor-pointer accent-blue-500 rounded-sm border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800"
                                    />
                                </div>
                                <img
                                    src={tab.favIconUrl || "https://www.google.com/s2/favicons?domain=google.com&sz=32"}
                                    className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 bg-gray-100 dark:bg-white/10 rounded-sm flex-shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=google.com"; }}
                                    draggable={false}
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate flex-1 font-medium select-none">
                                    {tab.title || "Untitled Tab"}
                                </span>
                                {/* Time */}
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono whitespace-nowrap">
                                    {session.timestamp.includes(' ') ? session.timestamp.split(' ').pop() : session.timestamp}
                                </span>
                                {/* Pin button */}
                                <button
                                    onClick={(e) => handlePinTabClick(e, tab)}
                                    title={isPinned ? "Unpin dari sidebar" : "Pin ke sidebar"}
                                    className={`transition-all p-1 rounded-sm flex-shrink-0 ${isPinned
                                            ? "text-amber-500 dark:text-amber-400 opacity-100"
                                            : "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-500 dark:hover:text-amber-400"
                                        }`}
                                >
                                    {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
