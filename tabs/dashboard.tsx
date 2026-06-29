import React, { useEffect, useMemo, useRef, useState } from "react"
import "~style.css"
import {
    FolderOpen, LayoutGrid, Clock, Search, X,
    Trash2, Plus, FolderPlus, Folder, Layers,
    Sun, Moon
} from "lucide-react"
import { useTabkeepStorage } from "~hooks/useTabkeepStorage"
import { updateSessions, updateFolders, updateDeletedSessions } from "~lib/storage"
import { SessionBox } from "~components/SessionBox"
import { DeletedSessionBox } from "~components/DeletedSessionBox"
import { SidebarFolderItem } from "~components/SidebarFolderItem"
import { RightSidebar } from "~components/RightSidebar"
import { MainFolderAccordion } from "~components/MainFolderAccordion"
import type { Folder as FolderType, SavedTab } from "~types"

export default function TabkeepDashboard() {
    const { sessions, setSessions, folders, setFolders, deletedSessions, setDeletedSessions } = useTabkeepStorage();

    const [activeFolderId, setActiveFolderId] = useState<string | "all" | "trash">("all");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const newFolderInputRef = useRef<HTMLInputElement>(null);

    const [hoveredTab, setHoveredTab] = useState<(SavedTab & { sessionTimestamp?: string; sessionId?: string }) | null>(null);

    const [theme, setTheme] = useState<"light" | "dark">(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem("tabkeep-theme") as "light" | "dark") || "dark";
        }
        return "dark";
    });

    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("tabkeep-theme", theme);
    }, [theme]);

    // Auto-reload if extension context becomes invalidated (e.g. extension updated/reloaded)
    useEffect(() => {
        const interval = setInterval(() => {
            try {
                if (!chrome.runtime || !chrome.runtime.id) {
                    window.location.reload();
                }
            } catch (e) {
                window.location.reload();
            }
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    // Auto-select first tab on start
    React.useEffect(() => {
        if (!hoveredTab && sessions.length > 0 && sessions[0].tabs && sessions[0].tabs.length > 0) {
            setHoveredTab({
                ...sessions[0].tabs[0],
                sessionTimestamp: sessions[0].timestamp,
                sessionId: sessions[0].id
            });
        }
    }, [sessions, hoveredTab]);

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
        const sessionToDelete = sessions.find(s => s.id === id);
        if (sessionToDelete) {
            const newDeletedSession = { 
                ...sessionToDelete, 
                deletedAt: new Date().toLocaleString() 
            };
            const updatedDeleted = [newDeletedSession, ...deletedSessions];
            setDeletedSessions(updatedDeleted);
            await updateDeletedSessions(updatedDeleted);
        }

        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        await updateSessions(updated);
    };

    const handleMoveTab = async (sourceSessionId: string, targetSessionId: string, tabIndex: number) => {
        if (sourceSessionId === targetSessionId) return;

        const sourceSession = sessions.find(s => s.id === sourceSessionId);
        const targetSession = sessions.find(s => s.id === targetSessionId);
        if (!sourceSession || !targetSession) return;

        const tabToMove = sourceSession.tabs[tabIndex];
        
        const newSourceTabs = [...sourceSession.tabs];
        newSourceTabs.splice(tabIndex, 1);

        const newTargetTabs = [...targetSession.tabs, tabToMove];

        let updatedSessions = sessions.map(s => {
            if (s.id === sourceSessionId) return { ...s, tabs: newSourceTabs };
            if (s.id === targetSessionId) return { ...s, tabs: newTargetTabs };
            return s;
        });

        // Auto delete empty sessions
        updatedSessions = updatedSessions.filter(s => s.tabs.length > 0);

        setSessions(updatedSessions);
        await updateSessions(updatedSessions);
    };

    const handleDeleteTab = async (sessionId: string, tabIndex: number) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;

        const newTabs = [...session.tabs];
        newTabs.splice(tabIndex, 1);

        let updatedSessions = sessions.map(s => {
            if (s.id === sessionId) return { ...s, tabs: newTabs };
            return s;
        });

        // Auto delete empty sessions
        updatedSessions = updatedSessions.filter(s => s.tabs.length > 0);

        setSessions(updatedSessions);
        await updateSessions(updatedSessions);
    };

    const handleRestoreSession = async (id: string) => {
        const sessionToRestore = deletedSessions.find(s => s.id === id);
        if (sessionToRestore) {
            const restoredSession = { ...sessionToRestore, folderId: null };
            delete restoredSession.deletedAt;
            const updatedSessions = [restoredSession, ...sessions];
            setSessions(updatedSessions);
            await updateSessions(updatedSessions);
            
            const updatedDeleted = deletedSessions.filter(s => s.id !== id);
            setDeletedSessions(updatedDeleted);
            await updateDeletedSessions(updatedDeleted);
        }
    };

    const handlePermanentDeleteSession = async (id: string) => {
        const updated = deletedSessions.filter(s => s.id !== id);
        setDeletedSessions(updated);
        await updateDeletedSessions(updated);
    };

    const handleEmptyTrash = async () => {
        if (!confirm("Kosongkan histori hapus secara permanen?")) return;
        setDeletedSessions([]);
        await updateDeletedSessions([]);
    };

    const handleMoveFolder = async (sessionId: string, folderId: string | null) => {
        const updated = sessions.map(s => s.id === sessionId ? { ...s, folderId } : s);
        setSessions(updated);
        await updateSessions(updated);
    };

    // --- Computed ---
    const filteredSessions = useMemo(() => {
        if (activeFolderId === "all") return sessions;
        return sessions.filter(s => s.folderId === activeFolderId);
    }, [sessions, activeFolderId]);

    const totalTabs = sessions.reduce((acc, s) => acc + s.tabs.length, 0);
    const activeFolder = folders.find(f => f.id === activeFolderId);
    const mainTitle = activeFolderId === "all"
        ? "All Sessions"
        : activeFolderId === "trash"
        ? "Histori Hapus"
        : activeFolder?.name ?? "Sessions";

    return (
        <div className="bg-[#f5f5f7] dark:bg-[#171717] text-gray-700 dark:text-gray-300 font-sans h-screen flex flex-col overflow-hidden transition-colors duration-200">
            {/* NAVBAR */}
            <header className="flex items-center justify-between px-6 h-16 bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#333] shrink-0 z-20 shadow-md transition-colors duration-200">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter">Tabkeep</h1>

                <div className="flex-1 max-w-xl mx-8 relative">
                    {/* Search bar removed */}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 transition-colors"
                        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-tighter">
                        {sessions.length} sessions · {totalTabs} tabs
                    </span>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR */}
                <aside className="w-64 bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-[#333] flex flex-col p-4 shrink-0 overflow-y-auto transition-colors duration-200">
                    <div className="mb-3 px-2 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] opacity-60">
                        Workspace
                    </div>

                    <div className="space-y-0.5">
                        {/* All Sessions */}
                        <div
                            onClick={() => setActiveFolderId("all")}
                            className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all ${activeFolderId === "all" ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-white font-semibold dark:font-normal" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525] hover:text-gray-900 dark:hover:text-white"}`}
                        >
                            <Layers size={14} className={activeFolderId === "all" ? "text-blue-500 dark:text-white" : "text-gray-400 dark:text-gray-500"} />
                            <span className="text-sm flex-1">All Sessions</span>
                            <span className="text-[10px] font-mono text-gray-600">{sessions.length}</span>
                        </div>

                        {folders.length > 0 && <div className="border-t border-gray-100 dark:border-[#2a2a2a] my-2 mx-2" />}

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
                                theme={theme}
                            />
                        ))}

                        {/* Input folder baru */}
                        {isCreatingFolder && (
                            <div className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-gray-50 dark:bg-[#252525] border border-blue-500/30">
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
                                    className="flex-1 bg-transparent text-sm text-gray-950 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 min-w-0"
                                />
                            </div>
                        )}

                        {!isCreatingFolder && (
                            <button
                                onClick={() => { setIsCreatingFolder(true); setNewFolderName(""); }}
                                className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525] transition-all text-sm mt-1"
                            >
                                <Plus size={14} />
                                <span>Folder Baru</span>
                            </button>
                        )}
                    </div>

                    <div
                        onClick={() => setActiveFolderId("trash")}
                        className={`mt-auto pt-4 border-t border-gray-200 dark:border-[#333] flex items-center justify-between cursor-pointer transition-colors group px-2 py-1.5 rounded-md ${
                            activeFolderId === "trash"
                                ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold"
                                : "text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Trash2 size={16} className={activeFolderId === "trash" ? "text-red-600 dark:text-red-400" : "group-hover:text-red-500 dark:group-hover:text-red-400"} />
                            <span className="text-sm">Histori Hapus</span>
                        </div>
                        <span className="text-[10px] font-mono">{deletedSessions.length}</span>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 p-10 overflow-y-auto bg-[#f5f5f7] dark:bg-[#171717] custom-scrollbar transition-colors duration-200">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-10 border-b border-gray-200 dark:border-[#333] pb-6">
                            <div className="p-2 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                                {activeFolderId === "all"
                                    ? <LayoutGrid className="text-gray-800 dark:text-white" size={24} />
                                    : <FolderOpen className="text-blue-500 dark:text-blue-400" size={24} />
                                }
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter">{mainTitle}</h2>
                                <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em] font-bold mt-1">
                                    {activeFolderId === "trash" ? `${deletedSessions.length} deleted sessions` : `${filteredSessions.length} sessions`}
                                </p>
                            </div>
                            
                            {activeFolderId === "trash" && deletedSessions.length > 0 && (
                                <button
                                    onClick={handleEmptyTrash}
                                    className="ml-auto flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 px-3 py-1.5 rounded transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Empty Trash
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {activeFolderId === "trash" ? (
                                deletedSessions.length > 0 ? (
                                    <div className="space-y-3">
                                        {deletedSessions.map(s => (
                                            <DeletedSessionBox
                                                key={s.id}
                                                session={s}
                                                onRestore={handleRestoreSession}
                                                onPermanentDelete={handlePermanentDeleteSession}
                                                theme={theme}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-300 dark:border-[#222] rounded-[2rem] bg-white dark:bg-[#1a1a1a]/30 shadow-sm dark:shadow-none">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-[#222] rounded-full flex items-center justify-center mb-4">
                                            <Trash2 size={24} className="text-gray-400 dark:text-gray-700" />
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-600 italic text-sm font-medium">Histori hapus kosong</p>
                                    </div>
                                )
                            ) : filteredSessions.length > 0 ? (
                                activeFolderId === "all" ? (
                                    <>
                                        {/* Uncategorized Sessions rendered directly */}
                                        <div className="space-y-3 mb-8">
                                            {sessions.filter(s => s.folderId === null).map(s => (
                                                <SessionBox
                                                    key={s.id}
                                                    session={s}
                                                    folders={folders}
                                                    onDelete={handleDeleteSession}
                                                    onMoveFolder={handleMoveFolder}
                                                    onMoveTab={handleMoveTab}
                                                    onDeleteTab={handleDeleteTab}
                                                    onTabHover={setHoveredTab}
                                                    theme={theme}
                                                />
                                            ))}
                                        </div>

                                        {/* Folders rendered as Accordions */}
                                        {folders.map(f => (
                                            <MainFolderAccordion
                                                key={f.id}
                                                folder={f}
                                                sessions={sessions.filter(s => s.folderId === f.id)}
                                                allFolders={folders}
                                                onDeleteSession={handleDeleteSession}
                                                onMoveFolder={handleMoveFolder}
                                                onMoveTab={handleMoveTab}
                                                onDeleteTab={handleDeleteTab}
                                                onTabHover={setHoveredTab}
                                                theme={theme}
                                            />
                                        ))}
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredSessions.map(s => (
                                            <SessionBox
                                                key={s.id}
                                                session={s}
                                                folders={folders}
                                                onDelete={handleDeleteSession}
                                                onMoveFolder={handleMoveFolder}
                                                onMoveTab={handleMoveTab}
                                                onDeleteTab={handleDeleteTab}
                                                onTabHover={setHoveredTab}
                                                theme={theme}
                                            />
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-300 dark:border-[#222] rounded-[2rem] bg-white dark:bg-[#1a1a1a]/30 shadow-sm dark:shadow-none">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#222] rounded-full flex items-center justify-center mb-4">
                                        {activeFolderId === "all"
                                            ? <Clock size={24} className="text-gray-400 dark:text-gray-700" />
                                            : <FolderOpen size={24} className="text-gray-400 dark:text-gray-700" />
                                        }
                                    </div>
                                    {activeFolderId === "all" ? (
                                        <>
                                            <p className="text-gray-500 dark:text-gray-600 italic text-sm font-medium">Klik ikon Tabkeep lalu "Kemas Semua Tab"</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-700 uppercase mt-2 tracking-widest font-black">No Active Sessions</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-500 dark:text-gray-600 italic text-sm font-medium">Folder ini masih kosong</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-700 uppercase mt-2 tracking-widest font-black">Pindahkan session ke sini</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* RIGHT SIDEBAR */}
                <RightSidebar hoveredTab={hoveredTab} allSessions={sessions} theme={theme} />
            </div>
        </div>
    );
}