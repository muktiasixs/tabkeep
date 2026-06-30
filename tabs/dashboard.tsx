import React, { useEffect, useMemo, useRef, useState } from "react"
import "~style.css"
import {
    FolderOpen, LayoutGrid, Clock, Search, X,
    Trash2, Plus, FolderPlus, Folder, Layers,
    Sun, Moon, Pin
} from "lucide-react"
import { useTabkeepStorage } from "~hooks/useTabkeepStorage"
import { updateSessions, updateFolders, updateDeletedSessions, updatePinnedLinks } from "~lib/storage"
import { SessionBox } from "~components/SessionBox"
import { DeletedSessionBox } from "~components/DeletedSessionBox"
import { SidebarFolderItem } from "~components/SidebarFolderItem"
import { RightSidebar } from "~components/RightSidebar"
import { MainFolderAccordion } from "~components/MainFolderAccordion"
import { PinnedLinks } from "~components/PinnedLinks"
import type { Folder as FolderType, SavedTab, PinnedLink, Session, SelectedTab } from "~types"

export default function TabkeepDashboard() {
    const { sessions, setSessions, folders, setFolders, deletedSessions, setDeletedSessions, pinnedLinks, setPinnedLinks } = useTabkeepStorage();

    const [activeFolderId, setActiveFolderId] = useState<string | "all" | "trash">("all");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const newFolderInputRef = useRef<HTMLInputElement>(null);

    const [hoveredTab, setHoveredTab] = useState<(SavedTab & { sessionTimestamp?: string; sessionId?: string }) | null>(null);
    const [isAllSessionsDragOver, setIsAllSessionsDragOver] = useState(false);
    const [isMainDragOver, setIsMainDragOver] = useState(false);
    
    // Selection state
    const [selectedTabs, setSelectedTabs] = useState<SelectedTab[]>([]);
    const [lastClickedTab, setLastClickedTab] = useState<{sessionId: string, tabIndex: number} | null>(null);

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

    // Global drag end listener to prevent stuck dragover states
    React.useEffect(() => {
        const handleDragEndGlobal = () => {
            setIsMainDragOver(false);
            setIsAllSessionsDragOver(false);
        };
        window.addEventListener("dragend", handleDragEndGlobal, true);
        window.addEventListener("drop", handleDragEndGlobal, true);
        return () => {
            window.removeEventListener("dragend", handleDragEndGlobal, true);
            window.removeEventListener("drop", handleDragEndGlobal, true);
        };
    }, []);

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
    const handleRenameSession = async (id: string, newName: string) => {
        const updated = sessions.map(s => s.id === id ? { ...s, name: newName } : s);
        setSessions(updated);
        await updateSessions(updated);
    };
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

            // Remove pinned links that belonged to this session
            const tabUrls = new Set(sessionToDelete.tabs.map(t => t.url));
            const remainingPins = pinnedLinks.filter(p => !tabUrls.has(p.url));
            if (remainingPins.length !== pinnedLinks.length) {
                setPinnedLinks(remainingPins);
                await updatePinnedLinks(remainingPins);
            }
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

        // Also update pinned links folderId if any
        if (sourceSession.folderId !== targetSession.folderId) {
            const isPinned = pinnedLinks.some(p => p.url === tabToMove.url);
            if (isPinned) {
                const updatedPins = pinnedLinks.map(p =>
                    p.url === tabToMove.url ? { ...p, folderId: targetSession.folderId } : p
                );
                setPinnedLinks(updatedPins);
                await updatePinnedLinks(updatedPins);
            }
        }
    };

    const handleMoveTabToFolder = async (sourceSessionId: string, tabIndex: number, folderId: string | null) => {
        const sourceSession = sessions.find(s => s.id === sourceSessionId);
        if (!sourceSession) return;
        const tabToMove = sourceSession.tabs[tabIndex];

        const newSourceTabs = [...sourceSession.tabs];
        newSourceTabs.splice(tabIndex, 1);

        const newSession: Session = {
            id: `session-${Date.now()}`,
            name: "Extracted Tab",
            tabs: [tabToMove],
            timestamp: new Date().toLocaleString(),
            folderId
        };

        let updatedSessions = sessions.map(s => {
            if (s.id === sourceSessionId) return { ...s, tabs: newSourceTabs };
            return s;
        });

        // Add the new session at the top
        updatedSessions = [newSession, ...updatedSessions];

        // Remove empty sessions
        updatedSessions = updatedSessions.filter(s => s.tabs.length > 0);

        setSessions(updatedSessions);
        await updateSessions(updatedSessions);

        // Also update pinned links if any
        const isPinned = pinnedLinks.some(p => p.url === tabToMove.url);
        if (isPinned) {
            const updatedPins = pinnedLinks.map(p =>
                p.url === tabToMove.url ? { ...p, folderId } : p
            );
            if (JSON.stringify(updatedPins) !== JSON.stringify(pinnedLinks)) {
                setPinnedLinks(updatedPins);
                await updatePinnedLinks(updatedPins);
            }
        }
    };

    const handleMoveMultiTabs = async (tabsToMove: SelectedTab[], targetSessionId: string) => {
        if (tabsToMove.length === 0) return;
        const targetSession = sessions.find(s => s.id === targetSessionId);
        if (!targetSession) return;

        let updatedSessions = [...sessions];
        let updatedPins = [...pinnedLinks];
        
        // Group by session
        const bySession: Record<string, number[]> = {};
        for (const tab of tabsToMove) {
            // Ignore if moving to same session
            if (tab.sessionId === targetSessionId) continue;
            
            if (!bySession[tab.sessionId]) bySession[tab.sessionId] = [];
            bySession[tab.sessionId].push(tab.tabIndex);
        }

        const extractedTabs: SavedTab[] = [];

        for (const sessionId of Object.keys(bySession)) {
            const session = updatedSessions.find(s => s.id === sessionId);
            if (!session) continue;

            const indices = bySession[sessionId].sort((a, b) => b - a);
            const newTabs = [...session.tabs];

            // Extract tabs backwards
            for (const idx of indices) {
                const tab = newTabs[idx];
                extractedTabs.unshift(tab);
                
                // Update pin folder if needed
                if (session.folderId !== targetSession.folderId) {
                    updatedPins = updatedPins.map(p => p.url === tab.url ? { ...p, folderId: targetSession.folderId } : p);
                }
                
                newTabs.splice(idx, 1);
            }

            updatedSessions = updatedSessions.map(s => {
                if (s.id === sessionId) return { ...s, tabs: newTabs };
                return s;
            });
        }
        
        if (extractedTabs.length === 0) return;

        updatedSessions = updatedSessions.map(s => {
            if (s.id === targetSessionId) return { ...s, tabs: [...s.tabs, ...extractedTabs] };
            return s;
        });

        // Auto delete empty sessions
        updatedSessions = updatedSessions.filter(s => s.tabs.length > 0);

        setSessions(updatedSessions);
        await updateSessions(updatedSessions);
        
        if (JSON.stringify(updatedPins) !== JSON.stringify(pinnedLinks)) {
            setPinnedLinks(updatedPins);
            await updatePinnedLinks(updatedPins);
        }
        
        setSelectedTabs([]); // Clear selection after moving
    };

    const handleMoveMultiTabsToFolder = async (tabsToMove: SelectedTab[], folderId: string | null) => {
        if (tabsToMove.length === 0) return;
        
        let updatedSessions = [...sessions];
        let updatedPins = [...pinnedLinks];
        
        // Group by session
        const bySession: Record<string, number[]> = {};
        for (const tab of tabsToMove) {
            if (!bySession[tab.sessionId]) bySession[tab.sessionId] = [];
            bySession[tab.sessionId].push(tab.tabIndex);
        }

        const extractedTabs: SavedTab[] = [];

        for (const sessionId of Object.keys(bySession)) {
            const session = updatedSessions.find(s => s.id === sessionId);
            if (!session) continue;

            const indices = bySession[sessionId].sort((a, b) => b - a);
            const newTabs = [...session.tabs];

            // Extract tabs backwards
            for (const idx of indices) {
                const tab = newTabs[idx];
                extractedTabs.unshift(tab);
                
                // Update pin folder if needed
                updatedPins = updatedPins.map(p => p.url === tab.url ? { ...p, folderId } : p);
                
                newTabs.splice(idx, 1);
            }

            updatedSessions = updatedSessions.map(s => {
                if (s.id === sessionId) return { ...s, tabs: newTabs };
                return s;
            });
        }
        
        if (extractedTabs.length === 0) return;
        
        const newSession: Session = {
            id: `session-${Date.now()}`,
            name: `Extracted Tabs (${extractedTabs.length})`,
            tabs: extractedTabs,
            timestamp: new Date().toLocaleString(),
            folderId
        };

        updatedSessions = [newSession, ...updatedSessions];
        updatedSessions = updatedSessions.filter(s => s.tabs.length > 0);

        setSessions(updatedSessions);
        await updateSessions(updatedSessions);
        
        if (JSON.stringify(updatedPins) !== JSON.stringify(pinnedLinks)) {
            setPinnedLinks(updatedPins);
            await updatePinnedLinks(updatedPins);
        }
        
        setSelectedTabs([]);
    };

    const handleMergeSessions = async (sourceSessionId: string, targetSessionId: string) => {
        const sourceSession = sessions.find(s => s.id === sourceSessionId);
        const targetSession = sessions.find(s => s.id === targetSessionId);
        if (!sourceSession || !targetSession) return;

        let updatedSessions = sessions.map(s => {
            if (s.id === targetSessionId) {
                return { ...s, tabs: [...sourceSession.tabs, ...s.tabs] };
            }
            return s;
        });

        updatedSessions = updatedSessions.filter(s => s.id !== sourceSessionId);

        setSessions(updatedSessions);
        await updateSessions(updatedSessions);
    };

    const handleDeleteTab = async (sessionId: string, tabIndex: number) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;

        const tabToDelete = session.tabs[tabIndex];

        // Unpin if pinned
        const remainingPins = pinnedLinks.filter(p => p.url !== tabToDelete.url);
        if (remainingPins.length !== pinnedLinks.length) {
            setPinnedLinks(remainingPins);
            await updatePinnedLinks(remainingPins);
        }

        // Add to history as a single-tab session
        const newDeletedSession: Session = {
            id: `session-del-${Date.now()}`,
            name: session.name || "Deleted Tab",
            tabs: [tabToDelete],
            timestamp: session.timestamp,
            folderId: session.folderId,
            deletedAt: new Date().toLocaleString(),
            originalSessionId: session.id
        };
        const updatedDeleted = [newDeletedSession, ...deletedSessions];
        setDeletedSessions(updatedDeleted);
        await updateDeletedSessions(updatedDeleted);

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
        
        // Remove from selection if deleted
        setSelectedTabs(prev => prev.filter(t => !(t.sessionId === sessionId && t.tabIndex === tabIndex)));
    };

    const handleToggleTabSelection = (sessionId: string, tabIndex: number, url: string, isShift: boolean) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        setSelectedTabs(prev => {
            const exists = prev.some(t => t.sessionId === sessionId && t.tabIndex === tabIndex);
            
            if (isShift && lastClickedTab && lastClickedTab.sessionId === sessionId) {
                // Range selection within the same session
                const start = Math.min(lastClickedTab.tabIndex, tabIndex);
                const end = Math.max(lastClickedTab.tabIndex, tabIndex);
                
                // We'll figure out if we are checking or unchecking based on whether the clicked item currently exists
                const targetCheckedState = !exists;
                
                let next = [...prev];
                for (let i = start; i <= end; i++) {
                    const tabUrl = session.tabs[i].url;
                    const itemExists = next.some(t => t.sessionId === sessionId && t.tabIndex === i);
                    
                    if (targetCheckedState && !itemExists) {
                        next.push({ sessionId, tabIndex: i, url: tabUrl });
                    } else if (!targetCheckedState && itemExists) {
                        next = next.filter(t => !(t.sessionId === sessionId && t.tabIndex === i));
                    }
                }
                return next;
            } else {
                // Single select
                if (exists) {
                    return prev.filter(t => !(t.sessionId === sessionId && t.tabIndex === tabIndex));
                } else {
                    return [...prev, { sessionId, tabIndex, url }];
                }
            }
        });
        
        setLastClickedTab({ sessionId, tabIndex });
    };

    const handleClearSelection = () => {
        setSelectedTabs([]);
        setLastClickedTab(null);
    };

    const handleDeleteSelected = async () => {
        if (selectedTabs.length === 0) return;
        
        let updatedSessions = [...sessions];
        let updatedPins = [...pinnedLinks];
        let newDeleted: Session[] = [...deletedSessions];
        
        // Group by session to make removal easier (remove from back to front to avoid index shift)
        const bySession: Record<string, number[]> = {};
        for (const tab of selectedTabs) {
            if (!bySession[tab.sessionId]) bySession[tab.sessionId] = [];
            bySession[tab.sessionId].push(tab.tabIndex);
        }
        
        for (const sessionId of Object.keys(bySession)) {
            const session = updatedSessions.find(s => s.id === sessionId);
            if (!session) continue;
            
            // Sort descending so index doesn't shift when splicing
            const indices = bySession[sessionId].sort((a, b) => b - a);
            const newTabs = [...session.tabs];
            
            for (const idx of indices) {
                const tabToDelete = newTabs[idx];
                
                // Add to history
                newDeleted.unshift({
                    id: `session-del-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
                    name: session.name || "Deleted Tab",
                    tabs: [tabToDelete],
                    timestamp: session.timestamp,
                    folderId: session.folderId,
                    deletedAt: new Date().toLocaleString(),
                    originalSessionId: session.id
                });
                
                // Remove pins
                updatedPins = updatedPins.filter(p => p.url !== tabToDelete.url);
                
                // Splice
                newTabs.splice(idx, 1);
            }
            
            // Update session
            updatedSessions = updatedSessions.map(s => {
                if (s.id === sessionId) return { ...s, tabs: newTabs };
                return s;
            });
        }
        
        // Auto delete empty sessions
        updatedSessions = updatedSessions.filter(s => s.tabs.length > 0);
        
        setSessions(updatedSessions);
        await updateSessions(updatedSessions);
        
        if (updatedPins.length !== pinnedLinks.length) {
            setPinnedLinks(updatedPins);
            await updatePinnedLinks(updatedPins);
        }
        
        setDeletedSessions(newDeleted);
        await updateDeletedSessions(newDeleted);
        
        setSelectedTabs([]);
    };

    const handleDropPinnedLink = async (link: PinnedLink, targetSessionId: string | null = null, folderId: string | null = null) => {
        const newTab = {
            title: link.title,
            url: link.url,
            favIconUrl: link.favIconUrl || ""
        };

        if (targetSessionId) {
            let updatedSessions = sessions.map(s => {
                if (s.id === targetSessionId) {
                    return { ...s, tabs: [...s.tabs, newTab] };
                }
                return s;
            });
            setSessions(updatedSessions);
            await updateSessions(updatedSessions);
        } else {
            const newSession: Session = {
                id: `session-${Date.now()}`,
                name: "Dropped Link",
                tabs: [newTab],
                timestamp: new Date().toLocaleString(),
                folderId
            };
            const updatedSessions = [newSession, ...sessions];
            setSessions(updatedSessions);
            await updateSessions(updatedSessions);
        }
    };

    const handleRestoreSession = async (id: string) => {
        const sessionToRestore = deletedSessions.find(s => s.id === id);
        if (sessionToRestore) {
            // Check if the original folder still exists
            let targetFolderId = sessionToRestore.folderId;
            if (targetFolderId && !folders.some(f => f.id === targetFolderId)) {
                targetFolderId = null;
            }

            let updatedSessions = [...sessions];

            // If it has an originalSessionId, try to merge it back
            if (sessionToRestore.originalSessionId) {
                const targetSessionIdx = updatedSessions.findIndex(s => s.id === sessionToRestore.originalSessionId);
                if (targetSessionIdx !== -1) {
                    // Original session still exists! Merge tabs back in.
                    updatedSessions[targetSessionIdx] = {
                        ...updatedSessions[targetSessionIdx],
                        tabs: [...updatedSessions[targetSessionIdx].tabs, ...sessionToRestore.tabs]
                    };
                } else {
                    // Original session is gone, restore as standalone
                    const restoredSession = { ...sessionToRestore, folderId: targetFolderId };
                    delete restoredSession.deletedAt;
                    delete restoredSession.originalSessionId;
                    updatedSessions = [restoredSession, ...updatedSessions];
                }
            } else {
                // Regular session restore
                const restoredSession = { ...sessionToRestore, folderId: targetFolderId };
                delete restoredSession.deletedAt;
                delete restoredSession.originalSessionId;
                updatedSessions = [restoredSession, ...updatedSessions];
            }

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
        const movedSession = sessions.find(s => s.id === sessionId);
        const updated = sessions.map(s => s.id === sessionId ? { ...s, folderId } : s);
        setSessions(updated);
        await updateSessions(updated);

        // Also update folderId on any pinned links from this session's tabs
        if (movedSession) {
            const tabUrls = new Set(movedSession.tabs.map(t => t.url));
            const updatedPins = pinnedLinks.map(p =>
                tabUrls.has(p.url) ? { ...p, folderId } : p
            );
            if (JSON.stringify(updatedPins) !== JSON.stringify(pinnedLinks)) {
                setPinnedLinks(updatedPins);
                await updatePinnedLinks(updatedPins);
            }
        }
    };

    const handlePinLink = async (tab: { title: string; url: string; favIconUrl?: string }, folderId: string | null = null) => {
        const alreadyPinned = pinnedLinks.some(p => p.url === tab.url);
        if (alreadyPinned) return;
        const newPin: PinnedLink = {
            id: `pin-${Date.now()}`,
            title: tab.title,
            url: tab.url,
            favIconUrl: tab.favIconUrl,
            pinnedAt: new Date().toLocaleString(),
            folderId,
        };
        const updated = [newPin, ...pinnedLinks];
        setPinnedLinks(updated);
        await updatePinnedLinks(updated);
    };

    const handleUnpinLink = async (urlOrId: string) => {
        // support both id and url for unpin
        const updated = pinnedLinks.filter(p => p.id !== urlOrId && p.url !== urlOrId);
        setPinnedLinks(updated);
        await updatePinnedLinks(updated);
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
                            className={`mb-2 rounded-md transition-all border overflow-hidden ${isAllSessionsDragOver ? "bg-blue-100 dark:bg-blue-500/10 border-blue-500 outline-dashed outline-2 outline-blue-500" :
                                activeFolderId === "all"
                                    ? "bg-blue-50/30 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30"
                                    : "border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10"
                                }`}
                            onDragOver={(e) => {
                                if (e.dataTransfer.types.includes("application/tabkeep-session") || e.dataTransfer.types.includes("application/json") || e.dataTransfer.types.includes("application/tabkeep-pinned-link")) {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "move";
                                    if (!isAllSessionsDragOver) setIsAllSessionsDragOver(true);
                                }
                            }}
                            onDragLeave={() => setIsAllSessionsDragOver(false)}
                            onDrop={(e) => {
                                setIsAllSessionsDragOver(false);
                                if (e.dataTransfer.types.includes("application/tabkeep-session")) {
                                    e.preventDefault();
                                    try {
                                        const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-session"));
                                        if (data.sessionId) handleMoveFolder(data.sessionId, null);
                                    } catch (err) { }
                                } else if (e.dataTransfer.types.includes("application/json")) {
                                    e.preventDefault();
                                    try {
                                        const data = JSON.parse(e.dataTransfer.getData("application/json"));
                                        if (data.sourceSessionId && data.tabIndex !== undefined) {
                                            handleMoveTabToFolder(data.sourceSessionId, data.tabIndex, null);
                                        }
                                    } catch (err) { }
                                } else if (e.dataTransfer.types.includes("application/tabkeep-pinned-link")) {
                                    e.preventDefault();
                                    try {
                                        const link = JSON.parse(e.dataTransfer.getData("application/tabkeep-pinned-link"));
                                        if (link) handleDropPinnedLink(link, null, null);
                                    } catch (err) { }
                                }
                            }}
                        >
                            {/* Header */}
                            <div
                                onClick={() => setActiveFolderId("all")}
                                className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-all ${activeFolderId === "all" ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                    } border-b border-gray-200 dark:border-white/5 bg-transparent dark:bg-black/10`}
                            >
                                <Layers size={14} className={activeFolderId === "all" ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"} />
                                <span className="text-sm flex-1">All Sessions</span>
                                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600">{sessions.length}</span>
                            </div>

                            {/* Pinned links from uncategorized sessions only */}
                            {(() => {
                                const uncatPins = pinnedLinks.filter(p => p.folderId === null);
                                const uncatSessions = sessions.filter(s => s.folderId === null);

                                if (uncatSessions.length === 0) {
                                    return (
                                        <div className="px-3 py-1.5">
                                            <span className="text-[10px] text-gray-400 dark:text-gray-700 italic">
                                                Belum ada session
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="pb-1">
                                        {uncatSessions.map((session) => {
                                            const pins = session.tabs
                                                .filter(tab => uncatPins.some(p => p.url === tab.url))
                                                .map(tab => uncatPins.find(p => p.url === tab.url)!);

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
                                                            draggable
                                                            onDragStart={(e) => {
                                                                e.stopPropagation();
                                                                e.dataTransfer.setData("application/tabkeep-pinned-link", JSON.stringify(link));
                                                                e.dataTransfer.effectAllowed = "move";
                                                            }}
                                                            onClick={() => chrome.tabs.create({ url: link.url, active: true })}
                                                            title={link.url}
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

                        {folders.length > 0 && <div className="border-t border-gray-100 dark:border-[#2a2a2a] my-2 mx-2" />}

                        {/* Folder list */}
                        {folders.map(folder => (
                                <SidebarFolderItem
                                    key={folder.id}
                                    folder={folder}
                                    isActive={activeFolderId === folder.id}
                                    sessions={sessions.filter(s => s.folderId === folder.id)}
                                    pinnedLinks={pinnedLinks}
                                    onClick={() => setActiveFolderId(folder.id)}
                                    onRename={handleRenameFolder}
                                    onDelete={handleDeleteFolder}
                                    onMoveSessionToFolder={handleMoveFolder}
                                    onMoveTabToFolder={handleMoveTabToFolder}
                                    onMoveMultiTabsToFolder={handleMoveMultiTabsToFolder}
                                    onDropPinnedLinkToFolder={(link, folderId) => handleDropPinnedLink(link, null, folderId)}
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
                        className={`mt-auto pt-4 border-t border-gray-200 dark:border-[#333] flex items-center justify-between cursor-pointer transition-colors group px-2 py-1.5 rounded-md ${activeFolderId === "trash"
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
                <main
                    className="flex-1 p-10 overflow-y-auto bg-[#f5f5f7] dark:bg-[#171717] custom-scrollbar transition-colors duration-200"
                    onDragOver={(e) => {
                        if (activeFolderId !== "trash" && (e.dataTransfer.types.includes("application/tabkeep-session") || e.dataTransfer.types.includes("application/tabkeep-pinned-link") || e.dataTransfer.types.includes("application/json"))) {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (!isMainDragOver) setIsMainDragOver(true);
                        }
                    }}
                    onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setIsMainDragOver(false);
                        }
                    }}
                    onDrop={(e) => {
                        if (activeFolderId !== "trash") {
                            setIsMainDragOver(false);
                            const targetFolderId = activeFolderId === "all" ? null : activeFolderId;
                            if (e.dataTransfer.types.includes("application/tabkeep-session")) {
                                e.preventDefault();
                                try {
                                    const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-session"));
                                    if (data.sessionId) handleMoveFolder(data.sessionId, targetFolderId);
                                } catch (err) { }
                            } else if (e.dataTransfer.types.includes("application/tabkeep-pinned-link")) {
                                e.preventDefault();
                                try {
                                    const link = JSON.parse(e.dataTransfer.getData("application/tabkeep-pinned-link"));
                                    if (link) handleDropPinnedLink(link, null, targetFolderId);
                                } catch (err) { }
                            } else if (e.dataTransfer.types.includes("application/json")) {
                                e.preventDefault();
                                try {
                                    const data = JSON.parse(e.dataTransfer.getData("application/json"));
                                    if (data.sourceSessionId && data.tabIndex !== undefined) {
                                        handleMoveTabToFolder(data.sourceSessionId, data.tabIndex, targetFolderId);
                                    }
                                } catch (err) { }
                            }
                        }
                    }}
                >
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
                            ) : (filteredSessions.length > 0 || (activeFolderId === "all" && folders.length > 0)) ? (
                                activeFolderId === "all" ? (
                                    <>
                                        {/* Uncategorized Sessions Dropzone */}
                                        <div className={`space-y-3 mb-8 transition-all ${isMainDragOver && sessions.filter(s => s.folderId === null).length > 0 ? "p-2 rounded-xl border-2 border-blue-500 border-dashed bg-blue-50/30 dark:bg-blue-500/10" : ""}`}>
                                            {sessions.filter(s => s.folderId === null).length === 0 && isMainDragOver && (
                                                <div className="py-12 text-center text-blue-500 dark:text-blue-400 text-sm font-bold uppercase tracking-widest border-2 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                                                    Drop here to Uncategorize
                                                </div>
                                            )}
                                            {sessions.filter(s => s.folderId === null).map(s => (
                                                <SessionBox
                                                    key={s.id}
                                                    session={s}
                                                    folders={folders}
                                                    pinnedLinks={pinnedLinks}
                                                    onDelete={handleDeleteSession}
                                                    onRenameSession={handleRenameSession}
                                                    onMoveFolder={handleMoveFolder}
                                                    onMoveTab={handleMoveTab}
                                                    onMoveMultiTabs={handleMoveMultiTabs}
                                                    onMergeSessions={handleMergeSessions}
                                                    onDeleteTab={handleDeleteTab}
                                                    onTabHover={setHoveredTab}
                                                    selectedTabs={selectedTabs}
                                                    onToggleTabSelection={handleToggleTabSelection}
                                                    onPinTab={handlePinLink}
                                                    onUnpinTab={handleUnpinLink}
                                                    onDropPinnedLinkToSession={(link, sId) => handleDropPinnedLink(link, sId, null)}
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
                                                onRenameSession={handleRenameSession}
                                                onRenameFolder={handleRenameFolder}
                                                onDeleteFolder={handleDeleteFolder}
                                                onMoveFolder={handleMoveFolder}
                                                onMoveTab={handleMoveTab}
                                                onMoveTabToFolder={handleMoveTabToFolder}
                                                onMoveMultiTabs={handleMoveMultiTabs}
                                                onMoveMultiTabsToFolder={handleMoveMultiTabsToFolder}
                                                onMergeSessions={handleMergeSessions}
                                                onDeleteTab={handleDeleteTab}
                                                onTabHover={setHoveredTab}
                                                selectedTabs={selectedTabs}
                                                onToggleTabSelection={handleToggleTabSelection}
                                                pinnedLinks={pinnedLinks}
                                                onPinTab={handlePinLink}
                                                onUnpinTab={handleUnpinLink}
                                                onDropPinnedLinkToFolder={(link, folderId) => handleDropPinnedLink(link, null, folderId)}
                                                onDropPinnedLinkToSession={(link, sId) => handleDropPinnedLink(link, sId, f.id)}
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
                                                pinnedLinks={pinnedLinks}
                                                onDelete={handleDeleteSession}
                                                onRenameSession={handleRenameSession}
                                                onMoveFolder={handleMoveFolder}
                                                onMoveTab={handleMoveTab}
                                                onMoveMultiTabs={handleMoveMultiTabs}
                                                onMergeSessions={handleMergeSessions}
                                                onDeleteTab={handleDeleteTab}
                                                onTabHover={setHoveredTab}
                                                selectedTabs={selectedTabs}
                                                onToggleTabSelection={handleToggleTabSelection}
                                                onPinTab={handlePinLink}
                                                onUnpinTab={handleUnpinLink}
                                                onDropPinnedLinkToSession={(link, sId) => handleDropPinnedLink(link, sId, activeFolderId)}
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
                
                {/* FLOATING ACTION BAR FOR MULTI-SELECTION */}
                {selectedTabs.length > 0 && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 z-50">
                        <span className="text-sm font-bold">{selectedTabs.length} tab{selectedTabs.length > 1 ? 's' : ''} selected</span>
                        <div className="w-px h-4 bg-gray-700 dark:bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-1.5 text-xs font-bold bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full transition-colors"
                            >
                                <Trash2 size={12} />
                                Delete
                            </button>
                            <button
                                onClick={handleClearSelection}
                                className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-900 px-3 py-1.5 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}