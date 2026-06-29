import React, { useMemo, useRef, useState } from "react"
import "~style.css"
import {
    FolderOpen, LayoutGrid, Clock, Search, X,
    Trash2, Plus, FolderPlus, Folder, Layers
} from "lucide-react"
import { useTabkeepStorage } from "~hooks/useTabkeepStorage"
import { updateSessions, updateFolders } from "~lib/storage"
import { SessionBox } from "~components/SessionBox"
import { SidebarFolderItem } from "~components/SidebarFolderItem"
import type { Folder as FolderType } from "~types"

export default function TabkeepDashboard() {
    const { sessions, setSessions, folders, setFolders } = useTabkeepStorage();

    const [searchQuery, setSearchQuery] = useState("");
    const [activeFolderId, setActiveFolderId] = useState<string | "all" | "uncategorized">("all");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const newFolderInputRef = useRef<HTMLInputElement>(null);

    // --- Folder Actions ---
    const handleCreateFolder = async () => {
        const name = newFolderName.trim();
        if (!name) { setIsCreatingFolder(false); return; }
        const newFolder: FolderType = {
            id: `folder-${Date.now()}`,
            name,
            createdAt: new Date().toLocaleString()
        };
        const updated = [...folders, newFolder];
        setFolders(updated);
        await updateFolders(updated);
        setNewFolderName("");
        setIsCreatingFolder(false);
        setActiveFolderId(newFolder.id);
    };

    const handleRenameFolder = async (id: string, newName: string) => {
        const updated = folders.map(f => f.id === id ? { ...f, name: newName } : f);
        setFolders(updated);
        await updateFolders(updated);
    };

    const handleDeleteFolder = async (id: string) => {
        const updatedSessions = sessions.map(s => s.folderId === id ? { ...s, folderId: null } : s);
        const updatedFolders = folders.filter(f => f.id !== id);
        setSessions(updatedSessions);
        setFolders(updatedFolders);
        await updateSessions(updatedSessions);
        await updateFolders(updatedFolders);
        if (activeFolderId === id) setActiveFolderId("all");
    };

    // --- Session Actions ---
    const handleDeleteSession = async (id: string) => {
        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        await updateSessions(updated);
    };

    const handleDeleteAll = async () => {
        if (!confirm("Hapus semua session?")) return;
        setSessions([]);
        await updateSessions([]);
    };

    const handleMoveFolder = async (sessionId: string, folderId: string | null) => {
        const updated = sessions.map(s => s.id === sessionId ? { ...s, folderId } : s);
        setSessions(updated);
        await updateSessions(updated);
    };

    // --- Computed ---
    const filteredByFolder = useMemo(() => {
        if (activeFolderId === "all") return sessions;
        if (activeFolderId === "uncategorized") return sessions.filter(s => s.folderId === null);
        return sessions.filter(s => s.folderId === activeFolderId);
    }, [sessions, activeFolderId]);

    const filteredSessions = useMemo(() => {
        if (!searchQuery.trim()) return filteredByFolder;
        const q = searchQuery.toLowerCase();
        return filteredByFolder.filter(s =>
            s.tabs.some(tab =>
                tab.title.toLowerCase().includes(q) || tab.url.toLowerCase().includes(q)
            )
        );
    }, [filteredByFolder, searchQuery]);

    const totalTabs = sessions.reduce((acc, s) => acc + s.tabs.length, 0);
    const uncategorizedCount = sessions.filter(s => s.folderId === null).length;
    const activeFolder = folders.find(f => f.id === activeFolderId);
    const mainTitle = activeFolderId === "all"
        ? "All Sessions"
        : activeFolderId === "uncategorized"
        ? "Uncategorized"
        : activeFolder?.name ?? "Sessions";

    return (
        <div className="bg-[#171717] text-gray-300 font-sans h-screen flex flex-col overflow-hidden">
            {/* NAVBAR */}
            <header className="flex items-center justify-between px-6 h-16 bg-[#1e1e1e] border-b border-[#333] shrink-0 z-20 shadow-md">
                <h1 className="text-2xl font-black text-white italic tracking-tighter">Tabkeep</h1>

                <div className="flex-1 max-w-xl mx-8 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-600" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari session atau tab..."
                        className="w-full bg-[#121212] border border-[#333] rounded-md py-2 pl-10 text-sm focus:outline-none focus:border-gray-500 transition-all text-gray-200"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-gray-500 hover:text-white">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">
                    {sessions.length} sessions · {totalTabs} tabs
                </span>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR */}
                <aside className="w-64 bg-[#1e1e1e] border-r border-[#333] flex flex-col p-4 shrink-0 overflow-y-auto">
                    <div className="mb-3 px-2 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] opacity-60">
                        Workspace
                    </div>

                    <div className="space-y-0.5">
                        {/* All Sessions */}
                        <div
                            onClick={() => setActiveFolderId("all")}
                            className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all ${activeFolderId === "all" ? "bg-white/10 text-white" : "text-gray-400 hover:bg-[#252525] hover:text-white"}`}
                        >
                            <Layers size={14} className={activeFolderId === "all" ? "text-white" : "text-gray-500"} />
                            <span className="text-sm flex-1">All Sessions</span>
                            <span className="text-[10px] font-mono text-gray-600">{sessions.length}</span>
                        </div>

                        {/* Uncategorized */}
                        <div
                            onClick={() => setActiveFolderId("uncategorized")}
                            className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all ${activeFolderId === "uncategorized" ? "bg-white/10 text-white" : "text-gray-400 hover:bg-[#252525] hover:text-white"}`}
                        >
                            <Folder size={14} className={activeFolderId === "uncategorized" ? "text-white" : "text-gray-500"} />
                            <span className="text-sm flex-1">Uncategorized</span>
                            <span className="text-[10px] font-mono text-gray-600">{uncategorizedCount}</span>
                        </div>

                        {folders.length > 0 && <div className="border-t border-[#2a2a2a] my-2 mx-2" />}

                        {/* Folder list */}
                        {folders.map(folder => (
                            <SidebarFolderItem
                                key={folder.id}
                                folder={folder}
                                isActive={activeFolderId === folder.id}
                                sessions={sessions.filter(s => s.folderId === folder.id)}
                                onClick={() => setActiveFolderId(folder.id)}
                                onRename={handleRenameFolder}
                                onDelete={handleDeleteFolder}
                            />
                        ))}

                        {/* Input folder baru */}
                        {isCreatingFolder && (
                            <div className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-[#252525] border border-blue-500/30">
                                <FolderPlus size={14} className="text-blue-400 flex-shrink-0" />
                                <input
                                    ref={newFolderInputRef}
                                    autoFocus
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreateFolder();
                                        if (e.key === "Escape") { setIsCreatingFolder(false); setNewFolderName(""); }
                                    }}
                                    onBlur={handleCreateFolder}
                                    placeholder="Nama folder..."
                                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600 min-w-0"
                                />
                            </div>
                        )}

                        {!isCreatingFolder && (
                            <button
                                onClick={() => { setIsCreatingFolder(true); setNewFolderName(""); }}
                                className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-gray-600 hover:text-gray-300 hover:bg-[#252525] transition-all text-sm mt-1"
                            >
                                <Plus size={14} />
                                <span>Folder Baru</span>
                            </button>
                        )}
                    </div>

                    {sessions.length > 0 && (
                        <div
                            onClick={handleDeleteAll}
                            className="mt-auto pt-4 border-t border-[#333] flex items-center gap-3 text-gray-600 hover:text-red-400 cursor-pointer transition-colors group"
                        >
                            <Trash2 size={16} className="group-hover:animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-widest">Hapus Semua</span>
                        </div>
                    )}
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 p-10 overflow-y-auto bg-[#171717] custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-10 border-b border-[#333] pb-6">
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                {activeFolderId === "all"
                                    ? <LayoutGrid className="text-white" size={24} />
                                    : <FolderOpen className="text-blue-400" size={24} />
                                }
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white italic tracking-tighter">{mainTitle}</h2>
                                <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-bold mt-1">
                                    {searchQuery ? `${filteredSessions.length} hasil ditemukan` : `${filteredSessions.length} sessions`}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {filteredSessions.length > 0 ? (
                                filteredSessions.map(s => (
                                    <SessionBox
                                        key={s.id}
                                        session={s}
                                        folders={folders}
                                        onDelete={handleDeleteSession}
                                        onMoveFolder={handleMoveFolder}
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-[#222] rounded-[2rem] bg-[#1a1a1a]/30">
                                    <div className="w-16 h-16 bg-[#222] rounded-full flex items-center justify-center mb-4">
                                        {activeFolderId === "all" || activeFolderId === "uncategorized"
                                            ? <Clock size={24} className="text-gray-700" />
                                            : <FolderOpen size={24} className="text-gray-700" />
                                        }
                                    </div>
                                    {searchQuery ? (
                                        <p className="text-gray-600 italic text-sm font-medium">Tidak ada hasil untuk "{searchQuery}"</p>
                                    ) : activeFolderId === "all" ? (
                                        <>
                                            <p className="text-gray-600 italic text-sm font-medium">Klik ikon Tabkeep lalu "Kemas Semua Tab"</p>
                                            <p className="text-[10px] text-gray-700 uppercase mt-2 tracking-widest font-black">No Active Sessions</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-600 italic text-sm font-medium">Folder ini masih kosong</p>
                                            <p className="text-[10px] text-gray-700 uppercase mt-2 tracking-widest font-black">Pindahkan session ke sini</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}