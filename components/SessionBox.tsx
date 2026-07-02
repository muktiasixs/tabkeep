import React, { useState } from "react";
import { ChevronDown, ChevronRight, GripVertical, RotateCcw, X, Pin, PinOff } from "lucide-react";
import type { Session, Folder, SavedTab, PinnedLink, SelectedTab } from "~types";
import { MoveFolderDropdown } from "./MoveFolderDropdown";
import { useTabkeepStorage } from "~hooks/useTabkeepStorage";
import { updateSessions } from "~lib/storage";

interface Props {
    session: Session;
    folders: Folder[];
    pinnedLinks: PinnedLink[];
    onDelete: (id: string) => void;
    onMoveFolder?: (sessionId: string, folderId: string | null) => void;
    onMoveTab?: (sourceSessionId: string, targetSessionId: string, tabIndex: number, insertIndex?: number) => void;
    onMoveMultiTabs?: (tabsToMove: SelectedTab[], targetSessionId: string, insertIndex?: number) => void;
    onMoveTabToFolder?: (sourceSessionId: string, tabIndex: number, folderId: string | null, targetSessionId?: string, insertPosition?: "before" | "after") => void;
    onMoveMultiTabsToFolder?: (tabsToMove: SelectedTab[], folderId: string | null, targetSessionId?: string, insertPosition?: "before" | "after") => void;
    onMergeSessions?: (sourceSessionId: string, targetSessionId: string) => void;
    onDeleteTab?: (sessionId: string, tabIndex: number) => void;
    onTabHover?: (tab: SavedTab & { sessionTimestamp?: string }) => void;
    onPinTab?: (tab: SavedTab, folderId: string | null) => void;
    onUnpinTab?: (url: string) => void;
    onRenameSession?: (id: string, newName: string) => void;
    onDropPinnedLinkToSession?: (link: any, sessionId: string, targetSessionId?: string, insertPosition?: "before" | "after") => void;
    onReorderTab?: (sessionId: string, fromIdx: number, toIdx: number) => void;
    onReorderSession?: (draggedId: string, targetId: string, position: "before" | "after") => void;
    selectedTabs?: SelectedTab[];
    onToggleTabSelection?: (sessionId: string, tabIndex: number, url: string, isShift: boolean) => void;
    theme?: string;
}

export function SessionBox({ session, folders, pinnedLinks, onDelete, onRenameSession, onMoveFolder, onMoveTab, onMoveMultiTabs, onMoveTabToFolder, onMoveMultiTabsToFolder, onMergeSessions, onDeleteTab, onTabHover, onPinTab, onUnpinTab, onDropPinnedLinkToSession, onReorderTab, onReorderSession, selectedTabs, onToggleTabSelection, theme }: Props) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDragOver, setIsDragOver] = useState(false);
    const [sessionDropPos, setSessionDropPos] = useState<"before" | "after" | null>(null);
    const [tabDropTarget, setTabDropTarget] = useState<{ idx: number; pos: "before" | "after" } | null>(null);

    const { settings, sessions, setSessions } = useTabkeepStorage();

    // Rename state
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(session.name || "");
    const inputRef = React.useRef<HTMLInputElement>(null);

    if (!session || !session.tabs) return null;

    const handleRestoreAll = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        let shouldRemove = false;
        let shouldArchive = false;

        if (settings.restoreOption === "remove") {
            shouldRemove = true; // Selalu hapus jika opsinya 'remove'
        } else if (settings.restoreOption === "keep") {
            shouldRemove = false; // Selalu simpan jika opsinya 'keep'
        } else if (settings.restoreOption === "archived") {
            shouldArchive = true;
        }

        for (const tab of session.tabs) {
            if (tab.url) await chrome.tabs.create({ url: tab.url, active: false });
        }

        if (shouldRemove) {
            onDelete(session.id);
        } else if (shouldArchive) {
            const updatedSessions = sessions.map(s => {
                if (s.id === session.id) {
                    return { ...s, tabs: s.tabs.map(t => ({ ...t, archived: true })) };
                }
                return s;
            });
            setSessions(updatedSessions);
            updateSessions(updatedSessions);
        }
    };

    const handleOpenTab = (url: string, e?: React.MouseEvent, tabIndex?: number) => {
        if (url) {
            const openInForeground = e ? !(e.ctrlKey || e.metaKey) : true;
            chrome.tabs.create({ url, active: openInForeground });
        }

        if (e && tabIndex !== undefined) {
            let shouldRemove = false;
            let shouldArchive = false;

            if (settings.restoreOption === "remove") {
                shouldRemove = true; // Selalu hapus jika opsinya 'remove'
            } else if (settings.restoreOption === "keep") {
                shouldRemove = false; // Selalu simpan jika opsinya 'keep'
            } else if (settings.restoreOption === "archived") {
                shouldArchive = true;
            }

            if (shouldRemove && onDeleteTab) {
                onDeleteTab(session.id, tabIndex);
            } else if (shouldArchive) {
                const updatedSessions = sessions.map(s => {
                    if (s.id === session.id) {
                        const newTabs = [...s.tabs];
                        newTabs[tabIndex] = { ...newTabs[tabIndex], archived: true };
                        return { ...s, tabs: newTabs };
                    }
                    return s;
                });
                setSessions(updatedSessions);
                updateSessions(updatedSessions);
            }
        }
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
        e.dataTransfer.setData("application/tabkeep-reorder-session", JSON.stringify({ sessionId: session.id }));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes("application/tabkeep-session") || e.dataTransfer.types.includes("application/tabkeep-reorder-session") || e.dataTransfer.types.includes("application/json") || e.dataTransfer.types.includes("application/tabkeep-pinned-link") || e.dataTransfer.types.includes("application/tabkeep-multi-tabs")) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";
            
            if (e.dataTransfer.types.includes("application/tabkeep-reorder-session")) {
                const rect = e.currentTarget.getBoundingClientRect();
                const relativeY = e.clientY - rect.top;
                if (relativeY < rect.height * 0.25) {
                    setSessionDropPos("before");
                    if (isDragOver) setIsDragOver(false);
                } else if (relativeY > rect.height * 0.75) {
                    setSessionDropPos("after");
                    if (isDragOver) setIsDragOver(false);
                } else {
                    setSessionDropPos(null);
                    if (!isDragOver) setIsDragOver(true);
                }
            } else {
                if (!isDragOver) setIsDragOver(true);
            }
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
            setSessionDropPos(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        setIsDragOver(false);
        const dropPos = sessionDropPos;
        setSessionDropPos(null);

        if (dropPos) {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.types.includes("application/tabkeep-reorder-session")) {
                try {
                    const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-reorder-session"));
                    if (data.sessionId && data.sessionId !== session.id && onReorderSession)
                        onReorderSession(data.sessionId, session.id, dropPos);
                } catch {}
            } else if (e.dataTransfer.types.includes("application/json")) {
                try {
                    const data = JSON.parse(e.dataTransfer.getData("application/json"));
                    if (data.sourceSessionId) {
                        onMoveTabToFolder?.(data.sourceSessionId, data.tabIndex, session.folderId, session.id, dropPos);
                        if (!isExpanded) setIsExpanded(true);
                    }
                } catch {}
            } else if (e.dataTransfer.types.includes("application/tabkeep-multi-tabs")) {
                try {
                    const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-multi-tabs"));
                    if (data && data.length > 0) {
                        onMoveMultiTabsToFolder?.(data, session.folderId, session.id, dropPos);
                        if (!isExpanded) setIsExpanded(true);
                    }
                } catch {}
            } else if (e.dataTransfer.types.includes("application/tabkeep-pinned-link")) {
                try {
                    const link = JSON.parse(e.dataTransfer.getData("application/tabkeep-pinned-link"));
                    if (link) {
                        onDropPinnedLinkToSession?.(link, session.id, session.id, dropPos);
                        if (!isExpanded) setIsExpanded(true);
                    }
                } catch {}
            }
        } else if (e.dataTransfer.types.includes("application/tabkeep-session")) {
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
            } catch (err) {}
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
        <div className="relative pb-4">
            {/* Session reorder drop indicator – before */}
            {sessionDropPos === "before" && (
                <div className="absolute top-[-2px] left-1 right-1 h-1 bg-blue-500 rounded-full pointer-events-none z-10" />
            )}
        <div
            draggable
            onDragStart={handleSessionDragStart}
            className={`bg-white dark:bg-[#1e1e1e] rounded-lg border overflow-hidden shadow-sm dark:shadow-lg transition-all animate-in fade-in duration-300 ${isDragOver ? "border-blue-500 shadow-blue-500/20" : "border-gray-200 dark:border-[#333]"
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
                        const isArchived = tab.archived;
                        
                        return (
                            <React.Fragment key={idx}>
                                {/* Tab reorder drop indicator – before */}
                                {tabDropTarget?.idx === idx && tabDropTarget.pos === "before" && (
                                    <div className="absolute left-2 right-2 h-0.5 bg-blue-500 rounded-full pointer-events-none z-10" />
                                )}
                            <li
                                draggable
                                onDragStart={(e) => {
                                    e.stopPropagation();
                                    handleDragStartTab(e, idx);
                                    e.dataTransfer.setData("application/tabkeep-reorder-tab", JSON.stringify({ sessionId: session.id, tabIndex: idx }));
                                }}
                                onDragOver={(e) => {
                                    if (e.dataTransfer.types.includes("application/tabkeep-reorder-tab") || e.dataTransfer.types.includes("application/json") || e.dataTransfer.types.includes("application/tabkeep-multi-tabs")) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const pos = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
                                        setTabDropTarget({ idx, pos });
                                    }
                                }}
                                onDragLeave={() => setTabDropTarget(null)}
                                onDrop={(e) => {
                                    if (e.dataTransfer.types.includes("application/tabkeep-reorder-tab") || e.dataTransfer.types.includes("application/json") || e.dataTransfer.types.includes("application/tabkeep-multi-tabs")) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const pos = tabDropTarget?.pos || "after";
                                        const toIdx = pos === "before" ? idx : idx + 1;
                                        
                                        try {
                                            if (e.dataTransfer.types.includes("application/tabkeep-multi-tabs")) {
                                                const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-multi-tabs"));
                                                if (Array.isArray(data) && data.length > 0) {
                                                    onMoveMultiTabs?.(data, session.id, toIdx);
                                                    if (!isExpanded) setIsExpanded(true);
                                                }
                                            } else if (e.dataTransfer.types.includes("application/tabkeep-reorder-tab") || e.dataTransfer.types.includes("application/json")) {
                                                let sourceSessionId = null, tabIndex = null;
                                                
                                                if (e.dataTransfer.types.includes("application/tabkeep-reorder-tab")) {
                                                    const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-reorder-tab"));
                                                    sourceSessionId = data.sessionId;
                                                    tabIndex = data.tabIndex;
                                                } else if (e.dataTransfer.types.includes("application/json")) {
                                                    const data = JSON.parse(e.dataTransfer.getData("application/json"));
                                                    sourceSessionId = data.sourceSessionId;
                                                    tabIndex = data.tabIndex;
                                                }

                                                if (sourceSessionId && tabIndex !== null && tabIndex !== undefined) {
                                                    if (sourceSessionId === session.id) {
                                                        if (tabIndex !== idx) {
                                                            onReorderTab?.(session.id, tabIndex, tabIndex < idx ? toIdx - 1 : toIdx);
                                                        }
                                                    } else {
                                                        // Dropped from a different session
                                                        onMoveTab?.(sourceSessionId, session.id, tabIndex, toIdx);
                                                        if (!isExpanded) setIsExpanded(true);
                                                    }
                                                }
                                            }
                                        } catch {}
                                        setTabDropTarget(null);
                                    }
                                }}
                                onMouseEnter={() => onTabHover?.({ ...tab, sessionTimestamp: session.timestamp })}
                                className={`flex items-center gap-3 p-2 rounded cursor-grab active:cursor-grabbing group transition-colors ${
                                    isSelected 
                                    ? "bg-blue-50 dark:bg-blue-900/30" 
                                    : isArchived
                                    ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.02)_10px,rgba(0,0,0,0.02)_20px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
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
                                <div className="flex-1 overflow-hidden flex flex-col justify-center">
                                    <span 
                                        onClick={(e) => { e.stopPropagation(); handleOpenTab(tab.url, e, idx); }}
                                        className={`text-xs hover:text-blue-600 dark:hover:text-blue-400 font-medium select-none cursor-pointer transition-colors truncate block ${isArchived ? "text-gray-400 dark:text-gray-500 line-through decoration-gray-300 dark:decoration-gray-600" : "text-gray-600 dark:text-gray-400"}`}
                                    >
                                        {tab.title || "Untitled Tab"}
                                    </span>
                                    {settings.urlDisplayOption !== "none" && (
                                        <span className={`text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 ${
                                            settings.urlDisplayOption === "full" ? "break-all whitespace-normal" : "truncate block"
                                        }`}>
                                            {settings.urlDisplayOption === "domain" 
                                                ? (function() { try { return new URL(tab.url).hostname.replace("www.", ""); } catch { return tab.url; } })() 
                                                : tab.url}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono whitespace-nowrap">
                                    {session.timestamp.includes(' ') ? session.timestamp.split(' ').pop() : session.timestamp}
                                </span>
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
                                {onDeleteTab && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteTab(session.id, idx); }}
                                        title="Hapus tab"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0"
                                    >
                                        <X size={11} />
                                    </button>
                                )}
                            </li>
                                {/* Tab reorder drop indicator – after last item */}
                                {tabDropTarget?.idx === idx && tabDropTarget.pos === "after" && (
                                    <div className="absolute left-2 right-2 h-0.5 bg-blue-500 rounded-full pointer-events-none z-10" />
                                )}
                            </React.Fragment>
                        );
                    })}
                </ul>
            )}
        </div>
            {/* Session reorder drop indicator – after */}
            {sessionDropPos === "after" && (
                <div className="absolute bottom-[-2px] left-1 right-1 h-1 bg-blue-500 rounded-full pointer-events-none z-10" />
            )}
        </div>
    );
}
