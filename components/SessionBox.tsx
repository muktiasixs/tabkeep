import React, { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw, X, Pin, PinOff } from "lucide-react";
import type { Session, Folder, SavedTab, PinnedLink } from "~types";
import { MoveFolderDropdown } from "./MoveFolderDropdown";

interface Props {
    session: Session;
    folders: Folder[];
    pinnedLinks: PinnedLink[];
    onDelete: (id: string) => void;
    onMoveFolder: (sessionId: string, folderId: string | null) => void;
    onMoveTab?: (sourceSessionId: string, targetSessionId: string, tabIndex: number) => void;
    onDeleteTab?: (sessionId: string, tabIndex: number) => void;
    onTabHover?: (tab: SavedTab & { sessionTimestamp?: string }) => void;
    onPinTab?: (tab: SavedTab, folderId: string | null) => void;
    onUnpinTab?: (url: string) => void;
    onRenameSession?: (id: string, newName: string) => void;
    theme?: string;
}

export function SessionBox({ session, folders, pinnedLinks, onDelete, onRenameSession, onMoveFolder, onMoveTab, onDeleteTab, onTabHover, onPinTab, onUnpinTab, theme }: Props) {
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
        e.dataTransfer.setData("application/json", JSON.stringify({ sourceSessionId: session.id, tabIndex }));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleSessionDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("application/tabkeep-session", JSON.stringify({ sessionId: session.id }));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes("application/json")) {
            e.preventDefault();
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
        if (e.dataTransfer.types.includes("application/json")) {
            e.preventDefault();
            try {
                const data = JSON.parse(e.dataTransfer.getData("application/json"));
                if (data.sourceSessionId && data.sourceSessionId !== session.id) {
                    onMoveTab?.(data.sourceSessionId, session.id, data.tabIndex);
                    if (!isExpanded) setIsExpanded(true);
                }
            } catch (err) {
                // ignore invalid drops
            }
        }
    };

    return (
        <div
            draggable
            onDragStart={handleSessionDragStart}
            className={`bg-white dark:bg-[#1e1e1e] rounded-lg border mb-4 overflow-hidden shadow-sm dark:shadow-lg transition-all animate-in fade-in duration-300 ${
                isDragOver ? "border-blue-500 shadow-blue-500/20" : "border-gray-200 dark:border-[#333]"
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
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
                        return (
                            <li
                                key={idx}
                                draggable
                                onDragStart={(e) => handleDragStartTab(e, idx)}
                                onClick={() => handleOpenTab(tab.url)}
                                onMouseEnter={() => onTabHover?.({ ...tab, sessionTimestamp: session.timestamp })}
                                className="flex items-center gap-3 hover:bg-blue-50/50 dark:hover:bg-[#252525] p-2 rounded cursor-grab active:cursor-grabbing group transition-colors"
                            >
                                <img
                                    src={tab.favIconUrl || "https://www.google.com/s2/favicons?domain=google.com&sz=32"}
                                    className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 bg-gray-100 dark:bg-white/10 rounded-sm flex-shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=google.com"; }}
                                    draggable={false}
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate flex-1 font-medium select-none">
                                    {tab.title || "Untitled Tab"}
                                </span>
                                {/* Pin button */}
                                <button
                                    onClick={(e) => handlePinTabClick(e, tab)}
                                    title={isPinned ? "Unpin dari sidebar" : "Pin ke sidebar"}
                                    className={`transition-all p-1 rounded-sm flex-shrink-0 ${
                                        isPinned
                                            ? "text-amber-500 dark:text-amber-400 opacity-100"
                                            : "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-500 dark:hover:text-amber-400"
                                    }`}
                                >
                                    {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
                                </button>
                                {/* Delete button */}
                                <button
                                    onClick={(e) => handleDeleteTabClick(e, idx)}
                                    title="Hapus tab ini"
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity p-1 rounded-sm flex-shrink-0"
                                >
                                    <X size={14} />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
