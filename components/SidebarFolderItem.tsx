import React, { useRef, useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Pencil, Pin, X } from "lucide-react";
import type { Folder as FolderType, Session, PinnedLink } from "~types";

interface Props {
    folder: FolderType;
    isActive: boolean;
    sessions: Session[];
    pinnedLinks: PinnedLink[];
    onClick: () => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    onMoveSessionToFolder?: (sessionId: string, folderId: string | null) => void;
    onMoveTabToFolder?: (sourceSessionId: string, tabIndex: number, folderId: string | null) => void;
    theme?: string;
}

export function SidebarFolderItem({ folder, isActive, sessions, pinnedLinks, onClick, onRename, onDelete, onMoveSessionToFolder, onMoveTabToFolder, theme }: Props) {
    const [isOpen, setIsOpen] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(folder.name);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const startEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditValue(folder.name);
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const commitEdit = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== folder.name) onRename(folder.id, trimmed);
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") commitEdit();
        if (e.key === "Escape") setEditing(false);
    };

    const handleOpenTab = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        if (url) chrome.tabs.create({ url, active: true });
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes("application/tabkeep-session") || e.dataTransfer.types.includes("application/json")) {
            e.preventDefault();
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
            try {
                const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-session"));
                if (data.sessionId && onMoveSessionToFolder) {
                    onMoveSessionToFolder(data.sessionId, folder.id);
                }
            } catch (err) { }
        } else if (e.dataTransfer.types.includes("application/json")) {
            e.preventDefault();
            try {
                const data = JSON.parse(e.dataTransfer.getData("application/json"));
                if (data.sourceSessionId && data.tabIndex !== undefined && onMoveTabToFolder) {
                    onMoveTabToFolder(data.sourceSessionId, data.tabIndex, folder.id);
                }
            } catch (err) { }
        }
    };

    return (
        <div
            className={`mb-2 rounded-md transition-all border overflow-hidden ${isDragOver ? "bg-blue-100 dark:bg-blue-500/10 border-blue-500 outline-dashed outline-2 outline-blue-500" :
                    isActive
                        ? "bg-blue-50/30 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30"
                        : "border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10"
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header folder */}
            <div
                onClick={onClick}
                className={`group flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-all ${isActive
                        ? "text-blue-600 dark:text-blue-400 font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    } ${isOpen ? "border-b border-gray-200 dark:border-white/5 bg-transparent dark:bg-black/10" : ""}`}
            >
                {/* Chevron toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    className="flex-shrink-0 text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>

                {isActive
                    ? <FolderOpen size={14} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
                    : <Folder size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                }

                {editing ? (
                    <input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-gray-50 dark:bg-[#333] text-gray-900 dark:text-white text-sm rounded px-1 py-0 outline-none border border-blue-500/50 min-w-0"
                    />
                ) : (
                    <span className="flex-1 text-sm truncate">{folder.name}</span>
                )}

                <span className={`text-[10px] font-mono flex-shrink-0 ${isActive ? "text-blue-600/70 dark:text-blue-400/60" : "text-gray-400 dark:text-gray-600"}`}>
                    {sessions.length}
                </span>

                {!editing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={startEdit} title="Rename folder" className="text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            <Pencil size={11} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}
                            title="Hapus folder"
                            className="text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                            <X size={11} />
                        </button>
                    </div>
                )}
            </div>

            {/* Pinned links that belong to this folder */}
            {isOpen && (() => {
                const folderPins = pinnedLinks.filter(p => p.folderId === folder.id);

                if (sessions.length === 0) {
                    return (
                        <div className="px-3 py-1.5">
                            <span className="text-[10px] text-gray-400 dark:text-gray-700 italic flex items-center gap-1">
                                Belum ada session di folder ini
                            </span>
                        </div>
                    );
                }

                return (
                    <div className="pb-1">
                        {sessions.map((session) => {
                            const pins = session.tabs
                                .filter(tab => folderPins.some(p => p.url === tab.url))
                                .map(tab => folderPins.find(p => p.url === tab.url)!);

                            return (
                                <div key={session.id} className="mb-2">
                                    <div
                                        draggable
                                        onDragStart={(e) => {
                                            e.stopPropagation();
                                            e.dataTransfer.setData("application/tabkeep-session", JSON.stringify({ sessionId: session.id }));
                                            e.dataTransfer.effectAllowed = "move";
                                        }}
                                        className="px-2 py-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate flex items-center justify-between group/session-title cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors rounded-sm"
                                    >
                                        <span>{session.name || "Unnamed Session"}</span>
                                        <span className="text-[8px] opacity-0 group-hover/session-title:opacity-100 transition-opacity">
                                            {pins.length > 0 ? `${pins.length} pinned` : ""}
                                        </span>
                                    </div>
                                    {pins.map((link) => (
                                        <div
                                            key={link.id}
                                            onClick={(e) => handleOpenTab(e, link.url)}
                                            title={link.title}
                                            className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] group/tab transition-colors"
                                        >
                                            <Pin size={9} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
                                            <img
                                                src={link.favIconUrl || `https://www.google.com/s2/favicons?domain=${link.url}&sz=32`}
                                                className="w-3 h-3 flex-shrink-0 opacity-60 group-hover/tab:opacity-100 bg-gray-100 dark:bg-white/5 rounded-sm"
                                                onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=google.com"; }}
                                                draggable={false}
                                            />
                                            <span className="text-[11px] text-gray-500 group-hover/tab:text-blue-600 dark:group-hover/tab:text-blue-400 truncate transition-colors">
                                                {link.title || "Untitled"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                );
            })()}
        </div>
    );
}
