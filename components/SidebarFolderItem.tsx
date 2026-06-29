import React, { useRef, useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Pencil, X } from "lucide-react";
import type { Folder as FolderType, Session } from "~types";

interface Props {
    folder: FolderType;
    isActive: boolean;
    sessions: Session[];
    onClick: () => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    theme?: string;
}

export function SidebarFolderItem({ folder, isActive, sessions, onClick, onRename, onDelete, theme }: Props) {
    const [isOpen, setIsOpen] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(folder.name);
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

    return (
        <div>
            {/* Header folder */}
            <div
                onClick={onClick}
                className={`group flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all ${
                    isActive 
                        ? "bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-semibold" 
                        : "hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
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

            {/* Dropdown: session list + 4 tab pertama */}
            {isOpen && sessions.length > 0 && (
                <div className="ml-5 mt-0.5 space-y-1">
                    {sessions.map((session) => (
                        <div key={session.id} className="py-1">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 mb-0.5">
                                <div className="w-[1px] h-3 bg-gray-200 dark:bg-[#333] flex-shrink-0" />
                                <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono italic">
                                    {session.tabs.length} tabs · {session.timestamp}
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                {session.tabs.slice(0, 4).map((tab, idx) => (
                                    <div
                                        key={idx}
                                        onClick={(e) => handleOpenTab(e, tab.url)}
                                        title={tab.title}
                                        className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] group/tab transition-colors"
                                    >
                                        <div className="w-[1px] h-3 bg-gray-200 dark:bg-[#333] flex-shrink-0" />
                                        <img
                                            src={tab.favIconUrl || "https://www.google.com/s2/favicons?domain=google.com&sz=32"}
                                            className="w-3 h-3 flex-shrink-0 opacity-60 group-hover/tab:opacity-100 bg-gray-100 dark:bg-white/5 rounded-sm"
                                            onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=google.com"; }}
                                        />
                                        <span className="text-[11px] text-gray-500 group-hover/tab:text-blue-600 dark:group-hover/tab:text-blue-400 truncate transition-colors">
                                            {tab.title || "Untitled"}
                                        </span>
                                    </div>
                                ))}
                                {session.tabs.length > 4 && (
                                    <div className="flex items-center gap-2 px-2 py-0.5">
                                        <div className="w-[1px] h-3 bg-gray-200 dark:bg-[#333] flex-shrink-0" />
                                        <span className="text-[10px] text-gray-400 dark:text-gray-700 italic">
                                            +{session.tabs.length - 4} tab lainnya...
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isOpen && sessions.length === 0 && (
                <div className="ml-5 mt-0.5 px-2 py-1">
                    <span className="text-[10px] text-gray-400 dark:text-gray-700 italic">Folder kosong</span>
                </div>
            )}
        </div>
    );
}
