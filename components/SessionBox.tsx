import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, GripVertical, RotateCcw, X, Pin, PinOff, MoreHorizontal, ExternalLink, Monitor, Copy, Pencil, Star, Link, Layers, FolderPlus } from "lucide-react";
import type { Session, Folder, SavedTab, PinnedLink, SelectedTab } from "~types";
import { useTabkeepStorage } from "~hooks/useTabkeepStorage";
import { updateSessions } from "~lib/storage";
import { parseImportedLines } from "~lib/linkParser";

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
    viewMode?: "list" | "grid" | "graph";
    theme?: string;
}

export function SessionBox({ session, folders, pinnedLinks, onDelete, onRenameSession, onMoveFolder, onMoveTab, onMoveMultiTabs, onMoveTabToFolder, onMoveMultiTabsToFolder, onMergeSessions, onDeleteTab, onTabHover, onPinTab, onUnpinTab, onDropPinnedLinkToSession, onReorderTab, onReorderSession, selectedTabs, onToggleTabSelection, viewMode = "list", theme }: Props) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDragOver, setIsDragOver] = useState(false);
    const [sessionDropPos, setSessionDropPos] = useState<"before" | "after" | null>(null);
    const [tabDropTarget, setTabDropTarget] = useState<{ idx: number; pos: "before" | "after" } | null>(null);

    const { settings, sessions, setSessions } = useTabkeepStorage();
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(session.name || "");
    const inputRef = useRef<HTMLInputElement>(null);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuView, setMenuView] = useState<'main' | 'sort' | 'move'>('main');
    const menuRef = useRef<HTMLDivElement>(null);

    const handleUpdateSession = (updates: Partial<Session>) => {
        const updated = sessions.map(s => s.id === session.id ? { ...s, ...updates } : s);
        setSessions(updated);
        updateSessions(updated);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
                setMenuView('main');
            }
        };
        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

    if (!session || !session.tabs) return null;

    const handleSwitchSession = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        setMenuView('main');

        const currentTabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
            chrome.tabs.query({ currentWindow: true }, resolve);
        });

        const tabsToSave = currentTabs.filter(t => t.url && !t.url.includes("dashboard.html") && !t.pinned);
        const newSavedTabs = tabsToSave.map(t => ({
            title: t.title || "No Title",
            url: t.url || "",
            favIconUrl: t.favIconUrl || "",
            id: crypto.randomUUID()
        }));

        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        handleUpdateSession({ tabs: newSavedTabs, timestamp: now });

        for (const tab of session.tabs) {
            if (tab.url) {
                await chrome.tabs.create({ url: tab.url, active: false });
            }
        }

        const tabIdsToRemove = tabsToSave.map(t => t.id).filter(id => id !== undefined) as number[];
        if (tabIdsToRemove.length > 0) {
            await chrome.tabs.remove(tabIdsToRemove);
        }
    };

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

            // Allow dropping between sessions for all these types
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
                } catch { }
            } else if (e.dataTransfer.types.includes("application/json")) {
                try {
                    const data = JSON.parse(e.dataTransfer.getData("application/json"));
                    if (data.sourceSessionId) {
                        onMoveTabToFolder?.(data.sourceSessionId, data.tabIndex, session.folderId, session.id, dropPos);
                        if (!isExpanded) setIsExpanded(true);
                    }
                } catch { }
            } else if (e.dataTransfer.types.includes("application/tabkeep-multi-tabs")) {
                try {
                    const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-multi-tabs"));
                    if (data && data.length > 0) {
                        onMoveMultiTabsToFolder?.(data, session.folderId, session.id, dropPos);
                        if (!isExpanded) setIsExpanded(true);
                    }
                } catch { }
            } else if (e.dataTransfer.types.includes("application/tabkeep-pinned-link")) {
                try {
                    const link = JSON.parse(e.dataTransfer.getData("application/tabkeep-pinned-link"));
                    if (link) {
                        onDropPinnedLinkToSession?.(link, session.id, session.id, dropPos);
                        if (!isExpanded) setIsExpanded(true);
                    }
                } catch { }
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
            } catch (err) { }
        } else if (e.dataTransfer.types.includes("application/json")) {
            e.preventDefault();
            e.stopPropagation();
            try {
                const data = JSON.parse(e.dataTransfer.getData("application/json"));
                if (data.sourceSessionId && data.sourceSessionId !== session.id) {
                    onMoveTab?.(data.sourceSessionId, session.id, data.tabIndex);
                    if (!isExpanded) setIsExpanded(true);
                }
            } catch (err) { }
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
            } catch (err) { }
        }
    };

    return (
        <div className="relative pb-4">
            {/* Session reorder drop indicator ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ before */}
            {sessionDropPos === "before" && (
                <div className="absolute top-[-2px] left-1 right-1 h-1 bg-blue-500 rounded-full pointer-events-none z-10" />
            )}
            <div
                draggable
                onDragStart={handleSessionDragStart}
                className={`bg-white dark:bg-[#1a1a1a] rounded-none shadow-sm dark:shadow-none transition-all animate-in fade-in duration-300 ${isDragOver ? "ring-2 ring-blue-500/50 shadow-blue-500/20" : ""
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Header */}
                <div
                    className={`group/header p-4 bg-transparent flex justify-between items-start hover:bg-gray-50/50 dark:hover:bg-white/[0.02] rounded-none ${!isExpanded ? 'rounded-none' : ''}`}
                >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Chevron button to toggle expand/collapse */}
                        <div 
                            className="p-1 rounded-none hover:bg-gray-200 dark:hover:bg-[#333] transition-colors cursor-pointer mt-0.5"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                        >
                            {isExpanded
                                ? <ChevronDown size={14} className="text-gray-600 dark:text-gray-400" />
                                : <ChevronRight size={14} className="text-gray-600 dark:text-gray-400" />
                            }
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                        {editing ? (
                            <input
                                ref={inputRef}
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
                                className="text-lg font-bold text-gray-900 dark:text-white tracking-tight flex-1 break-words hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-text flex items-center gap-2"
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    startEdit(e);
                                }}
                                title="Double click to rename"
                            >
                                {(session.name || "Unnamed Session")}
                                {(session as any).isStarred && (
                                    <Star size={16} className="fill-amber-500 text-amber-500 flex-shrink-0" />
                                )}
                            </h3>
                        )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4 mt-0.5">
                        
                        <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-white/10 px-2 py-0.5 rounded-full">
                            {session.tabs.length} tabs
                        </span>
                        
                        <div className="relative opacity-0 group-hover/header:opacity-100 transition-opacity" ref={menuRef}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(!isMenuOpen);
                                    if (isMenuOpen) setMenuView('main');
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1.5 rounded-none hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                            >
                                <MoreHorizontal size={16} />
                            </button>
                            
                            {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-none shadow-xl z-50 py-1 text-left flex flex-col overflow-hidden">
                                    {menuView === 'main' && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    setMenuView('main');
                                                    handleRestoreAll(e);
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                            >
                                                <ExternalLink size={14} /> Restore in new window
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    setMenuView('main');
                                                    session.tabs.forEach(tab => chrome.tabs.create({ url: tab.url, active: false }));
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                            >
                                                <Monitor size={14} /> Restore in this window
                                            </button>
                                            <button
                                                onClick={handleSwitchSession}
                                                className="flex items-center gap-3 px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                            >
                                                <RotateCcw size={14} /> Switch session
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    setMenuView('main');
                                                    navigator.clipboard.writeText(session.tabs.map(t => t.url).join("\n"));
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                            >
                                                <Copy size={14} /> Copy to clipboard
                                            </button>
                                            
                                            <div className="h-px bg-gray-200 dark:bg-[#333] my-1" />
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuView('sort');
                                                }}
                                                className="flex items-center justify-between px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] w-full"
                                            >
                                                <div className="flex items-center gap-3"><Layers size={14} /> Sort session</div>
                                                <ChevronRight size={14} />
                                            </button>
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuView('move');
                                                }}
                                                className="flex items-center justify-between px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] w-full"
                                            >
                                                <div className="flex items-center gap-3"><FolderPlus size={14} /> Move to folder</div>
                                                <ChevronRight size={14} />
                                            </button>
                                            
                                            <div className="h-px bg-gray-200 dark:bg-[#333] my-1" />
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    setMenuView('main');
                                                    startEdit(e as any);
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                            >
                                                <Pencil size={14} /> Rename
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    setMenuView('main');
                                                    handleUpdateSession({ isStarred: !(session as any).isStarred });
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                            >
                                                <Star size={14} className={(session as any).isStarred ? "fill-amber-500 text-amber-500" : ""} /> {(session as any).isStarred ? "Unstar" : "Star"}
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    setMenuView('main');
                                                    try {
                                                        const text = await navigator.clipboard.readText();
                                                        const newTabs = parseImportedLines(text);
                                                        if (newTabs.length > 0) {
                                                            handleUpdateSession({ tabs: [...newTabs, ...session.tabs] as SavedTab[] });
                                                        }
                                                    } catch (err) { }
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                            >
                                                <Link size={14} /> Paste link here
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    setMenuView('main');
                                                    const seen = new Set();
                                                    const uniqueTabs = session.tabs.filter(t => {
                                                        if (seen.has(t.url)) return false;
                                                        seen.add(t.url);
                                                        return true;
                                                    });
                                                    handleUpdateSession({ tabs: uniqueTabs });
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                            >
                                                <Layers size={14} /> Remove duplicate
                                            </button>
                                            
                                            <div className="h-px bg-gray-200 dark:bg-[#333] my-1" />
                                            
                                            <button
                                                onClick={handleDelete}
                                                className="flex items-center gap-3 px-3 py-2 text-[12px] text-red-500 hover:bg-gray-100 dark:hover:bg-[#333]"
                                            >
                                                <X size={14} /> Delete Session
                                            </button>
                                        </>
                                    )}

                                    {menuView === 'sort' && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuView('main');
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-b border-gray-100 dark:border-[#333] mb-1"
                                            >
                                                <ChevronDown size={14} className="rotate-90" /> Back
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    setMenuView('main');
                                                    const sortedTabs = [...session.tabs].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
                                                    handleUpdateSession({ tabs: sortedTabs });
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                            >
                                                Sort by Title
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    setMenuView('main');
                                                    const sortedTabs = [...session.tabs].sort((a, b) => (a.url || "").localeCompare(b.url || ""));
                                                    handleUpdateSession({ tabs: sortedTabs });
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                            >
                                                Sort by Web
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    setMenuView('main');
                                                    const sortedTabs = [...session.tabs].reverse();
                                                    handleUpdateSession({ tabs: sortedTabs });
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                            >
                                                Sort Reverse
                                            </button>
                                        </>
                                    )}

                                    {menuView === 'move' && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuView('main');
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-b border-gray-100 dark:border-[#333] mb-1"
                                            >
                                                <ChevronDown size={14} className="rotate-90" /> Back
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    setMenuView('main');
                                                    onMoveFolder?.(session.id, null);
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                            >
                                                <FolderPlus size={14} /> Uncategorized
                                            </button>
                                            {folders.map(folder => (
                                                <button
                                                    key={folder.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsMenuOpen(false);
                                                        setMenuView('main');
                                                        onMoveFolder?.(session.id, folder.id);
                                                    }}
                                                    className="flex items-center gap-3 px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] truncate"
                                                >
                                                    <FolderPlus size={14} className="flex-shrink-0" /> <span className="truncate">{folder.name}</span>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tab list */}
                {isExpanded && (
                    <>
                        <hr className="mx-5 border-gray-100 dark:border-[#333]" />
                        <ul className={`py-1 px-3 bg-transparent ${viewMode === "grid" ? "flex flex-wrap gap-1" : ""}`}>
                            {session.tabs.map((tab, idx) => {
                                const isPinned = pinnedLinks.some(p => p.url === tab.url);
                                const isSelected = selectedTabs?.some(t => t.sessionId === session.id && t.tabIndex === idx) || false;
                                const isArchived = tab.archived;

                                return (
                                    <React.Fragment key={idx}>
                                        {/* Tab reorder drop indicator – before */}
                                        {tabDropTarget?.idx === idx && tabDropTarget.pos === "before" && (
                                            <div 
                                                className={viewMode === "grid"
                                                    ? "h-7 w-0.5 bg-blue-500 rounded-full pointer-events-none z-10"
                                                    : "absolute left-2 right-2 h-0.5 bg-blue-500 rounded-full pointer-events-none z-10"}
                                                style={viewMode === "grid" ? { margin: "0 -1px", position: "relative" } : {}}
                                            />
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
                                                    const pos = viewMode === "grid"
                                                        ? (e.clientX < rect.left + rect.width / 2 ? "before" : "after")
                                                        : (e.clientY < rect.top + rect.height / 2 ? "before" : "after");
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
                                                    } catch { }
                                                    setTabDropTarget(null);
                                                }
                                            }}
                                            onMouseEnter={() => onTabHover?.({ ...tab, sessionTimestamp: session.timestamp })}
                                            title={viewMode === "grid" ? tab.title || "Untitled Tab" : undefined}
                                            className={`flex items-center cursor-grab active:cursor-grabbing group transition-colors ${viewMode === "grid" ? "justify-center p-1 rounded-none w-7 h-7 relative" : "gap-2.5 py-1 px-2 rounded-none"} ${isSelected
                                                ? "bg-blue-50 dark:bg-blue-900/30"
                                                : isArchived
                                                    ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.02)_10px,rgba(0,0,0,0.02)_20px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                                                    : "hover:bg-blue-50/50 dark:hover:bg-[#252525]"
                                                }`}
                                        >
                                            {viewMode !== "grid" && (
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
                                                    className="w-3 h-3 cursor-pointer accent-blue-500 rounded-none border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800"
                                                />
                                                </div>
                                            )}
                                            <img loading="lazy"
                                                src={tab.favIconUrl || "https://www.google.com/s2/favicons?domain=google.com&sz=32"}
                                                className={`${viewMode === "grid" ? "w-4 h-4" : "w-3.5 h-3.5"} opacity-60 group-hover:opacity-100 flex-shrink-0`}
                                                onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=google.com"; }}
                                                draggable={false}
                                            />
                                            {viewMode !== "grid" && (
                                                <>
                                                <div className="flex-1 overflow-hidden flex flex-col justify-center">
                                                    <span
                                                        onClick={(e) => { e.stopPropagation(); handleOpenTab(tab.url, e, idx); }}
                                                        className={`text-[14px] font-normal select-none cursor-pointer transition-colors truncate block ${isArchived ? "text-gray-400 dark:text-gray-500 line-through decoration-gray-300 dark:decoration-gray-600" : "text-[#4a90e2] dark:text-[#58a6ff] hover:underline"}`}
                                                    >
                                                    {tab.title || "Untitled Tab"}
                                                </span>
                                                {settings.urlDisplayOption !== "none" && (
                                                    <span className={`text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 ${settings.urlDisplayOption === "full" ? "break-all whitespace-normal" : "truncate block"
                                                        }`}>
                                                        {settings.urlDisplayOption === "domain"
                                                            ? (function () { try { return new URL(tab.url).hostname.replace("www.", ""); } catch { return tab.url; } })()
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
                                                className={`transition-all p-1 rounded-none flex-shrink-0 ${isPinned
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
                                                </>
                                            )}
                                        </li>
                                        {/* Tab reorder drop indicator – after last item */}
                                        {tabDropTarget?.idx === idx && tabDropTarget.pos === "after" && (
                                            <div 
                                                className={viewMode === "grid"
                                                    ? "h-7 w-0.5 bg-blue-500 rounded-full pointer-events-none z-10"
                                                    : "absolute left-2 right-2 h-0.5 bg-blue-500 rounded-full pointer-events-none z-10"}
                                                style={viewMode === "grid" ? { margin: "0 -1px", position: "relative" } : {}}
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </ul>
                        <div className="px-4 py-2 flex justify-end border-t border-gray-50 dark:border-white/[0.02]">
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono italic">
                                {session.timestamp || "Just now"}
                            </span>
                        </div>
                    </>
                )}
            </div>
            {/* Session reorder drop indicator ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ after */}
            {sessionDropPos === "after" && (
                <div className="absolute bottom-[-2px] left-1 right-1 h-1 bg-blue-500 rounded-full pointer-events-none z-10" />
            )}
        </div>
    );
}
