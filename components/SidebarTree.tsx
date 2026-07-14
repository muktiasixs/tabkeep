import React, { useState, useEffect, useRef } from "react";
import {
    ChevronDown, ChevronRight, Folder, FolderOpen,
    Layers, Pin, Pencil, X, Clock, Archive, Library,
    MoreHorizontal, Copy, ExternalLink, Monitor, Link, Star, Trash2
} from "lucide-react";
import type { Folder as FolderType, Session, PinnedLink } from "~types";
import { parseImportedLines } from "~lib/linkParser";
import { useTabkeepStorage } from "~hooks/useTabkeepStorage";
import { updateSessions } from "~lib/storage";

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Session Row ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

interface SessionRowProps {
    session: Session;
    pinnedLinks: PinnedLink[];
    depth: number;
    onRenameSession?: (id: string, newName: string) => void;
    onMoveTabToSession?: (sourceSessionId: string, targetSessionId: string, tabIndex: number) => void;
    onMoveMultiTabsToSession?: (tabsToMove: any[], targetSessionId: string) => void;
    onDropPinnedLinkToSession?: (link: any, targetSessionId: string, position?: "before" | "after") => void;
    onReorderSession?: (draggedId: string, targetId: string, position: "before" | "after") => void;
    onUpdateSession?: (id: string, updates: Partial<Session>) => void;
    onDeleteSession?: (id: string) => void;
}

function SessionRow({
    session, pinnedLinks, depth,
    onRenameSession, onMoveTabToSession, onMoveMultiTabsToSession, onDropPinnedLinkToSession, onReorderSession,
    onUpdateSession, onDeleteSession
}: SessionRowProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(session.name || "");
    const [isDropOver, setIsDropOver] = useState(false);
    const [sessionDropPos, setSessionDropPos] = useState<"before" | "after" | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { settings, sessions: allSessions, setSessions } = useTabkeepStorage();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

    const pins = session.tabs
        .filter(tab => pinnedLinks.some(p => p.url === tab.url))
        .map(tab => pinnedLinks.find(p => p.url === tab.url)!);

    const indentPx = depth * 16;

    const commitEdit = () => {
        const trimmed = editValue.trim();
        if (trimmed && onRenameSession) onRenameSession(session.id, trimmed);
        setEditing(false);
    };

    return (
        <div>
            {/* Session header row */}
            <div
                draggable
                onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData("application/tabkeep-session", JSON.stringify({ sessionId: session.id }));
                    e.dataTransfer.setData("application/tabkeep-reorder-session", JSON.stringify({ sessionId: session.id }));
                    e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                    if (e.dataTransfer.types.includes("application/json") || e.dataTransfer.types.includes("application/tabkeep-multi-tabs") || e.dataTransfer.types.includes("application/tabkeep-reorder-session") || e.dataTransfer.types.includes("application/tabkeep-pinned-link")) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "move";
                        
                        const rect = e.currentTarget.getBoundingClientRect();
                        const relativeY = e.clientY - rect.top;
                        if (relativeY < rect.height * 0.25) {
                            setSessionDropPos("before");
                            if (isDropOver) setIsDropOver(false);
                        } else if (relativeY > rect.height * 0.75) {
                            setSessionDropPos("after");
                            if (isDropOver) setIsDropOver(false);
                        } else {
                            setSessionDropPos(null);
                            if (!isDropOver) setIsDropOver(true);
                        }
                    }
                }}
                onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsDropOver(false);
                        setSessionDropPos(null);
                    }
                }}
                onDrop={(e) => {
                    setIsDropOver(false);
                    if (e.dataTransfer.types.includes("application/tabkeep-reorder-session")) {
                        e.preventDefault(); e.stopPropagation();
                        try {
                            const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-reorder-session"));
                            if (data.sessionId && data.sessionId !== session.id && onReorderSession) {
                                onReorderSession(data.sessionId, session.id, sessionDropPos || "after");
                            }
                        } catch { }
                        setSessionDropPos(null);
                    } else if (e.dataTransfer.types.includes("application/json")) {
                        e.preventDefault(); e.stopPropagation();
                        try {
                            const data = JSON.parse(e.dataTransfer.getData("application/json"));
                            if (data.sourceSessionId && data.tabIndex !== undefined && onMoveTabToSession)
                                onMoveTabToSession(data.sourceSessionId, session.id, data.tabIndex);
                        } catch { }
                    } else if (e.dataTransfer.types.includes("application/tabkeep-multi-tabs")) {
                        e.preventDefault(); e.stopPropagation();
                        try {
                            const tabs = JSON.parse(e.dataTransfer.getData("application/tabkeep-multi-tabs"));
                            if (tabs?.length > 0 && onMoveMultiTabsToSession)
                                onMoveMultiTabsToSession(tabs, session.id);
                        } catch { }
                    } else if (e.dataTransfer.types.includes("application/tabkeep-pinned-link")) {
                        e.preventDefault(); e.stopPropagation();
                        try {
                            const link = JSON.parse(e.dataTransfer.getData("application/tabkeep-pinned-link"));
                            if (link && onDropPinnedLinkToSession) {
                                onDropPinnedLinkToSession(link, session.id, sessionDropPos || undefined);
                            }
                        } catch { }
                    }
                }}
                className={`group flex flex-col cursor-grab active:cursor-grabbing rounded-lg transition-all select-none ${isDropOver
                    ? "bg-blue-100 dark:bg-blue-500/15 ring-1 ring-blue-400 dark:ring-blue-500"
                    : "hover:bg-gray-100/80 dark:hover:bg-white/5"
                    }`}
            >
                {sessionDropPos === "before" && (
                    <div className="h-0.5 bg-blue-500 rounded-full pointer-events-none" style={{ marginLeft: `${indentPx}px` }} />
                )}
                <div className="flex items-center gap-1.5 py-[3px] pr-2" style={{ paddingLeft: `${indentPx}px` }}>
                    {/* chevron ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ only show if has pins */}
                    <button
                        onClick={(e) => { e.stopPropagation(); if (pins.length > 0) setIsOpen(v => !v); }}
                        className={`flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-lg transition-colors ${pins.length > 0 ? "text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400" : "text-transparent pointer-events-none"}`}
                    >
                        {pins.length > 0 ? (isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span className="w-2.5" />}
                    </button>

                    <Layers size={14} className="flex-shrink-0 text-gray-400 dark:text-gray-600" />

                    {editing ? (
                        <input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }}
                            onClick={e => e.stopPropagation()}
                            className="flex-1 bg-gray-100 dark:bg-[#333] text-gray-900 dark:text-white text-[14px] rounded-lg px-1 py-0 outline-none border border-blue-500/50 min-w-0"
                        />
                    ) : (
                        <span
                            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); setEditValue(session.name || ""); }}
                            className={`flex-1 text-[14px] truncate leading-tight transition-colors flex items-center gap-1.5 ${session.isStarred ? "text-amber-600 dark:text-amber-500 font-medium" : "text-gray-600 dark:text-gray-400"}`}
                        >
                            <span className="truncate">{session.name || `Session ${session.timestamp}`}</span>
                            {session.isStarred && <Star size={12} className="fill-amber-500 text-amber-500 flex-shrink-0" />}
                        </span>
                    )}

                    {!editing && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Are you sure you want to delete this session?")) {
                                        onDeleteSession?.(session.id);
                                    }
                                }}
                                className="flex-shrink-0 text-red-400 hover:text-red-600 dark:text-red-500/70 dark:hover:text-red-500 p-0.5 rounded-lg"
                                title="Delete session"
                            >
                                <X size={11} />
                            </button>
                            
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                                    className="flex-shrink-0 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded-lg"
                                    title="More options"
                                >
                                    <MoreHorizontal size={13} />
                                </button>
                                
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg shadow-lg z-50 py-1 flex flex-col overflow-hidden">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                const urls = session.tabs.map(t => t.url).filter(Boolean);
                                                if (urls.length > 0) {
                                                    const inBackground = e.ctrlKey || e.metaKey;
                                                    chrome.windows.create({ url: urls, focused: !inBackground });
                                                }
                                                if (settings.restoreOption === "remove" && onDeleteSession) {
                                                    onDeleteSession(session.id);
                                                } else if (settings.restoreOption === "archived" && onUpdateSession) {
                                                    onUpdateSession(session.id, { tabs: session.tabs.map(t => ({ ...t, archived: true })) });
                                                }
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                        >
                                            <ExternalLink size={12} /> Restore in new window
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                const inBackground = e.ctrlKey || e.metaKey;
                                                session.tabs.forEach(t => {
                                                    if (t.url) chrome.tabs.create({ url: t.url, active: !inBackground });
                                                });
                                                if (settings.restoreOption === "remove" && onDeleteSession) {
                                                    onDeleteSession(session.id);
                                                } else if (settings.restoreOption === "archived" && onUpdateSession) {
                                                    onUpdateSession(session.id, { tabs: session.tabs.map(t => ({ ...t, archived: true })) });
                                                }
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                        >
                                            <Monitor size={12} /> Restore in this window
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                navigator.clipboard.writeText(session.tabs.map(t => t.url).join("\n"));
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                        >
                                            <Copy size={12} /> Copy to clipboard
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                setEditing(true); setEditValue(session.name || "");
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                        >
                                            <Pencil size={12} /> Rename
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                onUpdateSession?.(session.id, { isStarred: !session.isStarred });
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                        >
                                            <Star size={12} className={session.isStarred ? "fill-amber-500 text-amber-500" : ""} /> {session.isStarred ? "Unstar" : "Stars"}
                                        </button>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                try {
                                                    const text = await navigator.clipboard.readText();
                                                    const newTabs = parseImportedLines(text);
                                                    if (newTabs.length > 0 && onUpdateSession) {
                                                        onUpdateSession(session.id, { tabs: [...session.tabs, ...newTabs] });
                                                    }
                                                } catch (err) {
                                                    console.error("Paste failed", err);
                                                }
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                        >
                                            <Link size={12} /> Paste link here
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                if (!onUpdateSession) return;
                                                const seen = new Set();
                                                const uniqueTabs = session.tabs.filter(t => {
                                                    if (seen.has(t.url)) return false;
                                                    seen.add(t.url);
                                                    return true;
                                                });
                                                if (uniqueTabs.length !== session.tabs.length) {
                                                    onUpdateSession(session.id, { tabs: uniqueTabs });
                                                }
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                        >
                                            <Layers size={12} /> Remove duplicate
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {sessionDropPos === "after" && (
                    <div className="h-0.5 bg-blue-500 rounded-full pointer-events-none" style={{ marginLeft: `${indentPx}px` }} />
                )}
            </div>

            {/* Pinned links */}
            {isOpen && pins.map(link => (
                <div
                    key={link.id}
                    draggable
                    onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData("application/tabkeep-pinned-link", JSON.stringify(link));
                        e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => chrome.tabs.create({ url: link.url, active: true })}
                    title={link.title}
                    className="group/pin flex items-center gap-1.5 py-[3px] pr-2 cursor-pointer rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5 transition-colors"
                    style={{ paddingLeft: `${indentPx + 18}px` }}
                >
                    <Pin size={8} className="flex-shrink-0 text-amber-500 dark:text-amber-400" />
                    <img loading="lazy"
                        src={link.favIconUrl || `https://www.google.com/s2/favicons?domain=${link.url}&sz=32`}
                        className="w-3 h-3 flex-shrink-0 opacity-60 group-hover/pin:opacity-100 rounded-lg transition-opacity"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=google.com"; }}
                        draggable={false}
                    />
                    <span className="text-[12px] text-gray-500 dark:text-gray-500 group-hover/pin:text-blue-600 dark:group-hover/pin:text-blue-400 truncate transition-colors">
                        {link.title || "Untitled"}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Folder Row ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

interface FolderRowProps {
    folder: FolderType;
    sessions: Session[];
    pinnedLinks: PinnedLink[];
    isActive: boolean;
    depth: number;
    onClick: () => void;
    onRename: (id: string, name: string) => void;
    onDelete: (id: string) => void;
    onMoveSessionToFolder?: (sessionId: string, folderId: string | null) => void;
    onMoveTabToFolder?: (sourceSessionId: string, tabIndex: number, folderId: string | null) => void;
    onMoveMultiTabsToFolder?: (tabsToMove: any[], folderId: string | null) => void;
    onMoveTabToSession?: (sourceSessionId: string, targetSessionId: string, tabIndex: number) => void;
    onMoveMultiTabsToSession?: (tabsToMove: any[], targetSessionId: string) => void;
    onDropPinnedLinkToFolder?: (link: any, folderId: string) => void;
    onDropPinnedLinkToSession?: (link: any, targetSessionId: string, position?: "before" | "after") => void;
    onRenameSession?: (id: string, newName: string) => void;
    onReorderFolder?: (draggedId: string, targetId: string, position: "before" | "after") => void;
    onReorderSession?: (draggedId: string, targetId: string, position: "before" | "after") => void;
    onUpdateSession?: (id: string, updates: Partial<Session>) => void;
    onDeleteSession?: (id: string) => void;
}

function FolderRow({
    folder, sessions, pinnedLinks, isActive, depth,
    onClick, onRename, onDelete,
    onMoveSessionToFolder, onMoveTabToFolder, onMoveMultiTabsToFolder,
    onMoveTabToSession, onMoveMultiTabsToSession,
    onDropPinnedLinkToFolder, onDropPinnedLinkToSession, onRenameSession, onReorderFolder, onReorderSession,
    onUpdateSession, onDeleteSession
}: FolderRowProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(folder.name);
    const [isDragOver, setIsDragOver] = useState(false);
    const [folderDropPos, setFolderDropPos] = useState<"before" | "after" | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { settings, sessions: allSessions, setSessions } = useTabkeepStorage();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

    const indentPx = depth * 16;

    const commitEdit = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== folder.name) onRename(folder.id, trimmed);
        setEditing(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (
            e.dataTransfer.types.includes("application/tabkeep-session") ||
            e.dataTransfer.types.includes("application/json") ||
            e.dataTransfer.types.includes("application/tabkeep-multi-tabs") ||
            e.dataTransfer.types.includes("application/tabkeep-pinned-link") ||
            e.dataTransfer.types.includes("application/tabkeep-reorder-folder") ||
            e.dataTransfer.types.includes("application/tabkeep-multi-tabs")
        ) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";
            if (!e.dataTransfer.types.includes("application/tabkeep-reorder-folder")) {
                setIsDragOver(true);
            }
            if (e.dataTransfer.types.includes("application/tabkeep-reorder-folder")) {
                const rect = e.currentTarget.getBoundingClientRect();
                setFolderDropPos(e.clientY < rect.top + rect.height / 2 ? "before" : "after");
            }
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        setIsDragOver(false);
        if (e.dataTransfer.types.includes("application/tabkeep-session")) {
            e.preventDefault(); e.stopPropagation();
            try {
                const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-session"));
                if (data.sessionId && onMoveSessionToFolder) onMoveSessionToFolder(data.sessionId, folder.id);
            } catch { }
        } else if (e.dataTransfer.types.includes("application/json")) {
            e.preventDefault(); e.stopPropagation();
            try {
                const data = JSON.parse(e.dataTransfer.getData("application/json"));
                if (data.sourceSessionId && data.tabIndex !== undefined && onMoveTabToFolder)
                    onMoveTabToFolder(data.sourceSessionId, data.tabIndex, folder.id);
            } catch { }
        } else if (e.dataTransfer.types.includes("application/tabkeep-multi-tabs")) {
            e.preventDefault(); e.stopPropagation();
            try {
                const tabs = JSON.parse(e.dataTransfer.getData("application/tabkeep-multi-tabs"));
                if (tabs?.length > 0 && onMoveMultiTabsToFolder)
                    onMoveMultiTabsToFolder(tabs, folder.id);
            } catch { }
        } else if (e.dataTransfer.types.includes("application/tabkeep-pinned-link")) {
            e.preventDefault(); e.stopPropagation();
            try {
                const link = JSON.parse(e.dataTransfer.getData("application/tabkeep-pinned-link"));
                if (link && onDropPinnedLinkToFolder) onDropPinnedLinkToFolder(link, folder.id);
            } catch { }
        } else if (e.dataTransfer.types.includes("application/tabkeep-reorder-folder")) {
            e.preventDefault(); e.stopPropagation();
            try {
                const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-reorder-folder"));
                if (data.folderId && data.folderId !== folder.id && onReorderFolder) {
                    onReorderFolder(data.folderId, folder.id, folderDropPos || "after");
                }
            } catch { }
            setFolderDropPos(null);
        }
    };

    return (
        <div className="relative">
            {/* Folder reorder drop indicator ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ before */}
            {folderDropPos === "before" && (
                <div className="h-0.5 bg-blue-500 rounded-full mb-[1px] pointer-events-none" style={{ marginLeft: `${indentPx}px` }} />
            )}
            <div
                onDragOver={handleDragOver}
                onDragLeave={(e) => {
                    // Only clear if leaving the folder area entirely
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsDragOver(false);
                        setFolderDropPos(null);
                    }
                }}
                onDrop={handleDrop}
                className={`rounded-lg transition-all ${isDragOver && !folderDropPos
                    ? "ring-1 ring-blue-400 dark:ring-blue-500 bg-blue-50/50 dark:bg-blue-500/10"
                    : ""
                    }`}
            >
                {/* Folder header row */}
                <div
                    draggable
                    onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData("application/tabkeep-reorder-folder", JSON.stringify({ folderId: folder.id }));
                        e.dataTransfer.effectAllowed = "move";
                    }}
                    className={`group flex items-center gap-1.5 py-[3px] pr-2 rounded-lg transition-all select-none cursor-pointer ${isDragOver && !folderDropPos
                        ? "text-blue-600 dark:text-blue-400"
                        : isActive
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "hover:bg-gray-100/80 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                        }`}
                    style={{ paddingLeft: `${indentPx}px` }}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(v => !v); }}
                        className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                    >
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>

                    <button onClick={onClick} className="flex items-center gap-1.5 flex-1 min-w-0">
                        {isActive || isDragOver
                            ? <FolderOpen size={16} className={`flex-shrink-0 ${isDragOver ? "text-blue-500" : "text-blue-500 dark:text-blue-400"}`} />
                            : <Folder size={16} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                        }
                        {editing ? (
                            <input
                                autoFocus
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }}
                                onClick={e => e.stopPropagation()}
                                className="flex-1 bg-gray-100 dark:bg-[#333] text-gray-900 dark:text-white text-[15px] rounded-lg px-1 py-0 outline-none border border-blue-500/50 min-w-0"
                            />
                        ) : (
                            <span
                                onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); setEditValue(folder.name); }}
                                className={`flex-1 text-[15px] font-medium truncate text-left leading-tight transition-colors ${isActive || isDragOver ? "text-blue-600 dark:text-blue-400" : ""}`}
                            >
                                {folder.name}
                            </span>
                        )}
                    </button>

                    <span className={`text-[11px] font-mono flex-shrink-0 ${isActive || isDragOver ? "text-blue-500/70 dark:text-blue-400/60" : "text-gray-400 dark:text-gray-600"}`}>
                        {sessions.length}
                    </span>

                    {!editing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                                onClick={e => { e.stopPropagation(); onDelete(folder.id); }}
                                title="Delete folder"
                                className="flex-shrink-0 text-red-400 hover:text-red-600 dark:text-red-500/70 dark:hover:text-red-500 p-0.5 rounded-lg transition-colors"
                            >
                                <X size={11} />
                            </button>

                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                                    className="flex-shrink-0 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded-lg transition-colors"
                                    title="More options"
                                >
                                    <MoreHorizontal size={13} />
                                </button>
                                
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg shadow-lg z-50 py-1 flex flex-col overflow-hidden text-left">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                const allUrls = sessions.flatMap(s => s.tabs.map(t => t.url)).filter(Boolean);
                                                if (allUrls.length > 0) {
                                                    const inBackground = e.ctrlKey || e.metaKey;
                                                    chrome.windows.create({ url: allUrls, focused: !inBackground });
                                                }
                                                
                                                if (settings.restoreOption === "remove") {
                                                    const folderSessionIds = new Set(sessions.map(s => s.id));
                                                    const updated = allSessions.filter(s => !folderSessionIds.has(s.id));
                                                    setSessions(updated);
                                                    updateSessions(updated);
                                                } else if (settings.restoreOption === "archived") {
                                                    const folderSessionIds = new Set(sessions.map(s => s.id));
                                                    const updated = allSessions.map(s => {
                                                        if (folderSessionIds.has(s.id)) {
                                                            return { ...s, tabs: s.tabs.map(t => ({ ...t, archived: true })) };
                                                        }
                                                        return s;
                                                    });
                                                    setSessions(updated);
                                                    updateSessions(updated);
                                                }
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]"
                                        >
                                            <ExternalLink size={12} /> Restore all in new window
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                const allUrls = sessions.flatMap(s => s.tabs.map(t => t.url)).filter(Boolean);
                                                const inBackground = e.ctrlKey || e.metaKey;
                                                allUrls.forEach(url => chrome.tabs.create({ url, active: !inBackground }));
                                                
                                                if (settings.restoreOption === "remove") {
                                                    const folderSessionIds = new Set(sessions.map(s => s.id));
                                                    const updated = allSessions.filter(s => !folderSessionIds.has(s.id));
                                                    setSessions(updated);
                                                    updateSessions(updated);
                                                } else if (settings.restoreOption === "archived") {
                                                    const folderSessionIds = new Set(sessions.map(s => s.id));
                                                    const updated = allSessions.map(s => {
                                                        if (folderSessionIds.has(s.id)) {
                                                            return { ...s, tabs: s.tabs.map(t => ({ ...t, archived: true })) };
                                                        }
                                                        return s;
                                                    });
                                                    setSessions(updated);
                                                    updateSessions(updated);
                                                }
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
                                                setEditing(true); setEditValue(folder.name);
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
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sessions inside folder */}
                {isOpen && (
                    <div className="relative">
                        {/* Vertical connector line */}
                        <div
                            className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-[#2a2a2a]"
                            style={{ left: `${indentPx + 6}px` }}
                        />
                        {sessions.length === 0 ? (
                            <div
                                className="flex items-center py-1.5 text-[12px] text-gray-400 dark:text-gray-700 italic"
                                style={{ paddingLeft: `${indentPx + 20}px` }}
                            >
                                {isDragOver ? "Drop di sini" : "Belum ada session"}
                            </div>
                        ) : (
                            sessions.map(session => (
                                <SessionRow
                                    key={session.id}
                                    session={session}
                                    pinnedLinks={pinnedLinks}
                                    depth={depth + 1}
                                    onRenameSession={onRenameSession}
                                    onMoveTabToSession={onMoveTabToSession}
                                    onMoveMultiTabsToSession={onMoveMultiTabsToSession}
                                    onDropPinnedLinkToSession={onDropPinnedLinkToSession}
                                    onReorderSession={onReorderSession}
                                    onUpdateSession={onUpdateSession}
                                    onDeleteSession={onDeleteSession}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
            {/* Folder reorder drop indicator ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ after */}
            {folderDropPos === "after" && (
                <div className="h-0.5 bg-blue-500 rounded-full mt-[1px] pointer-events-none" style={{ marginLeft: `${indentPx}px` }} />
            )}
        </div>
    );
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Main SidebarTree ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

interface SidebarTreeProps {
    sessions: Session[];
    folders: FolderType[];
    pinnedLinks: PinnedLink[];
    activeFolderId: string;
    onSetActive: (id: string) => void;
    onRenameFolder: (id: string, name: string) => void;
    onDeleteFolder: (id: string) => void;
    onRenameSession: (id: string, name: string) => void;
    onMoveFolder: (sessionId: string, folderId: string | null) => void;
    onMoveTabToFolder: (sourceSessionId: string, tabIndex: number, folderId: string | null) => void;
    onMoveMultiTabsToFolder: (tabsToMove: any[], folderId: string | null) => void;
    onMoveTab?: (sourceSessionId: string, targetSessionId: string, tabIndex: number, insertIndex?: number) => void;
    onMoveMultiTabs?: (tabsToMove: any[], targetSessionId: string, insertIndex?: number) => void;
    onDropPinnedLink: (link: any, sessionId: string | null, folderId: string | null, targetSessionId?: string, position?: "before" | "after") => void;
    onReorderFolder?: (draggedId: string, targetId: string, position: "before" | "after") => void;
    onReorderSession?: (draggedId: string, targetId: string, position: "before" | "after") => void;
    onUpdateSession?: (id: string, updates: Partial<Session>) => void;
    onDeleteSession?: (id: string) => void;
}

export function SidebarTree({
    sessions, folders, pinnedLinks, activeFolderId,
    onSetActive, onRenameFolder, onDeleteFolder, onRenameSession,
    onMoveFolder, onMoveTabToFolder, onMoveMultiTabsToFolder,
    onMoveTab, onMoveMultiTabs, onDropPinnedLink,
    onReorderFolder, onReorderSession,
    onUpdateSession, onDeleteSession
}: SidebarTreeProps) {
    const [rootOpen, setRootOpen] = useState(true);
    const [isRootDragOver, setIsRootDragOver] = useState(false);

    const uncategorized = sessions.filter(s => s.folderId === null);

    return (
        <div className="flex flex-col gap-0">
            {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Root: All Sessions ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
            <div
                onDragOver={(e) => {
                    if (
                        e.dataTransfer.types.includes("application/tabkeep-session") ||
                        e.dataTransfer.types.includes("application/json") ||
                        e.dataTransfer.types.includes("application/tabkeep-pinned-link")
                    ) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setIsRootDragOver(true);
                    }
                }}
                onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsRootDragOver(false);
                }}
                onDrop={(e) => {
                    setIsRootDragOver(false);
                    if (e.dataTransfer.types.includes("application/tabkeep-session")) {
                        e.preventDefault();
                        try {
                            const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-session"));
                            if (data.sessionId) onMoveFolder(data.sessionId, null);
                        } catch { }
                    } else if (e.dataTransfer.types.includes("application/json")) {
                        e.preventDefault();
                        try {
                            const data = JSON.parse(e.dataTransfer.getData("application/json"));
                            if (data.sourceSessionId && data.tabIndex !== undefined)
                                onMoveTabToFolder(data.sourceSessionId, data.tabIndex, null);
                        } catch { }
                    } else if (e.dataTransfer.types.includes("application/tabkeep-pinned-link")) {
                        e.preventDefault();
                        try {
                            const link = JSON.parse(e.dataTransfer.getData("application/tabkeep-pinned-link"));
                            if (link) onDropPinnedLink(link, null, null, null, null);
                        } catch { }
                    }
                }}
            >
                {/* Root header */}
                <div
                    className={`group flex items-center gap-1.5 py-[5px] pr-2 pl-1 rounded-lg transition-all select-none ${isRootDragOver
                        ? "bg-blue-100 dark:bg-blue-500/15 ring-1 ring-blue-400 dark:ring-blue-500"
                        : activeFolderId === "all"
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "hover:bg-gray-100/80 dark:hover:bg-white/5 text-gray-700 dark:text-gray-400"
                        }`}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setRootOpen(v => !v); }}
                        className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                    >
                        {rootOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>

                    <button onClick={() => onSetActive("all")} className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Library size={16} className={`flex-shrink-0 ${isRootDragOver ? "text-blue-500" : activeFolderId === "all" ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`} />
                        <span className={`text-[15px] font-semibold flex-1 text-left leading-tight tracking-tight ${activeFolderId === "all" ? "text-blue-600 dark:text-blue-400" : ""}`}>
                            All Sessions
                        </span>
                    </button>

                    <span className={`text-[11px] font-mono flex-shrink-0 ${activeFolderId === "all" ? "text-blue-500/70 dark:text-blue-400/60" : "text-gray-400 dark:text-gray-600"}`}>
                        {sessions.length}
                    </span>
                </div>

                {/* Tree body */}
                {rootOpen && (
                    <div className="relative mt-0.5">
                        {/* Vertical connector line from root */}
                        <div className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-[#2a2a2a]" style={{ left: "6px" }} />

                        {/* Uncategorized sessions */}
                        {uncategorized.map(session => (
                            <SessionRow
                                key={session.id}
                                session={session}
                                pinnedLinks={pinnedLinks}
                                depth={1}
                                onRenameSession={onRenameSession}
                                onMoveTabToSession={onMoveTab}
                                onMoveMultiTabsToSession={onMoveMultiTabs}
                                onDropPinnedLinkToSession={(link, sId, pos) => onDropPinnedLink(link, pos ? null : sId, null, sId, pos)}
                                onReorderSession={onReorderSession}
                                onUpdateSession={onUpdateSession}
                                onDeleteSession={onDeleteSession}
                            />
                        ))}

                        {/* Folders */}
                        {folders.map(folder => (
                            <FolderRow
                                key={folder.id}
                                folder={folder}
                                sessions={sessions.filter(s => s.folderId === folder.id)}
                                pinnedLinks={pinnedLinks}
                                isActive={activeFolderId === folder.id}
                                depth={1}
                                onClick={() => onSetActive(folder.id)}
                                onRename={onRenameFolder}
                                onDelete={onDeleteFolder}
                                onMoveSessionToFolder={onMoveFolder}
                                onMoveTabToFolder={onMoveTabToFolder}
                                onMoveMultiTabsToFolder={onMoveMultiTabsToFolder}
                                onMoveTabToSession={onMoveTab}
                                onMoveMultiTabsToSession={onMoveMultiTabs}
                                onDropPinnedLinkToFolder={(link, fId) => onDropPinnedLink(link, null, fId)}
                                onDropPinnedLinkToSession={(link, sId, pos) => onDropPinnedLink(link, pos ? null : sId, folder.id, sId, pos)}
                                onRenameSession={onRenameSession}
                                onReorderFolder={onReorderFolder}
                                onReorderSession={onReorderSession}
                                onUpdateSession={onUpdateSession}
                                onDeleteSession={onDeleteSession}
                            />
                        ))}

                        {uncategorized.length === 0 && folders.length === 0 && (
                            <div className="flex items-center py-1.5 text-[10px] text-gray-400 dark:text-gray-700 italic" style={{ paddingLeft: "20px" }}>
                                Belum ada session
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
