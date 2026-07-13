import React, { useEffect, useMemo, useRef, useState } from "react"
import "~style.css"
import {
    FolderOpen, Archive, Search, X,
    Trash2, FolderPlus, LayoutGrid, LayoutList, Network, Library,
    Sun, Moon, RotateCcw, Settings,
    MoreHorizontal, Copy, Link, Layers, Globe
} from "lucide-react"
import { useTabkeepStorage } from "~hooks/useTabkeepStorage"
import { updateSessions, updateFolders, updateDeletedSessions, updatePinnedLinks } from "~lib/storage"
import { parseImportedLines } from "~lib/linkParser"
import { SessionBox } from "~components/SessionBox"
import { DeletedSessionBox } from "~components/DeletedSessionBox"
import { SidebarTree } from "~components/SidebarTree"
import { RightSidebar } from "~components/RightSidebar"
import { MainFolderAccordion } from "~components/MainFolderAccordion"
import { PinnedLinks } from "~components/PinnedLinks"
import { SettingsModal } from "~components/SettingsModal"
import { GraphView } from "~components/GraphView"
import type { Folder as FolderType, SavedTab, PinnedLink, Session, SelectedTab } from "~types"

export default function TabkeepDashboard() {
    const { sessions, setSessions, folders, setFolders, deletedSessions, setDeletedSessions, pinnedLinks, setPinnedLinks } = useTabkeepStorage();

    const [activeFolderId, setActiveFolderId] = useState<string | "all" | "trash">("all");
    const [viewMode, setViewMode] = useState<"list" | "grid" | "graph">("list");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const newFolderInputRef = useRef<HTMLInputElement>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [hoveredTab, setHoveredTab] = useState<(SavedTab & { sessionTimestamp?: string; sessionId?: string }) | null>(null);
    const [isAllSessionsDragOver, setIsAllSessionsDragOver] = useState(false);
    const [isMainDragOver, setIsMainDragOver] = useState(false);
    
    // Header Menu State
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const headerMenuRef = useRef<HTMLDivElement>(null);

    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
                setIsHeaderMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Selection state
    const [selectedTabs, setSelectedTabs] = useState<SelectedTab[]>([]);
    const [lastClickedTab, setLastClickedTab] = useState<{ sessionId: string, tabIndex: number } | null>(null);

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

    useEffect(() => {
        const handlePasteToFolder = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { folderId, tabs } = customEvent.detail;
            const newSession: Session = {
                id: crypto.randomUUID(),
                name: "Pasted Links",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                tabs: tabs,
                folderId: folderId
            };
            setSessions(prev => {
                const updated = [newSession, ...prev];
                updateSessions(updated);
                return updated;
            });
        };

        const handleDedupFolder = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { folderId } = customEvent.detail;
            setSessions(prev => {
                const seen = new Set();
                const updated = prev.map(s => {
                    if (s.folderId !== folderId) return s;
                    const uniqueTabs = s.tabs.filter(t => {
                        if (seen.has(t.url)) return false;
                        seen.add(t.url);
                        return true;
                    });
                    return { ...s, tabs: uniqueTabs };
                });
                updateSessions(updated);
                return updated;
            });
        };

        const handleGroupByWeb = (e: CustomEvent) => {
            const folderId = e.detail.folderId;
            setSessions(prev => {
                let newSessions = [...prev];
                const targetFolders = folderId === 'all' 
                    ? [...new Set(prev.map(s => s.folderId))] 
                    : [folderId];
        
                targetFolders.forEach(fId => {
                    const sessionsInFolder = newSessions.filter(s => s.folderId === fId);
                    if (sessionsInFolder.length === 0) return;
        
                    const allTabs = sessionsInFolder.flatMap(s => s.tabs);
                    const grouped: Record<string, SavedTab[]> = {};
                    
                    allTabs.forEach(tab => {
                        let domain = "other";
                        try {
                            const url = new URL(tab.url);
                            domain = url.hostname.replace(/^www\./, '');
                        } catch(err) {}
                        if (!grouped[domain]) grouped[domain] = [];
                        grouped[domain].push(tab);
                    });
        
                    newSessions = newSessions.filter(s => s.folderId !== fId);
        
                    const createdSessions = Object.entries(grouped).map(([domain, tabs]) => ({
                        id: crypto.randomUUID(),
                        name: domain,
                        tabs,
                        timestamp: new Date().toLocaleString(),
                        isStarred: false,
                        folderId: fId
                    }));
        
                    newSessions.push(...createdSessions);
                });
        
                updateSessions(newSessions);
                return newSessions;
            });
        };

        document.addEventListener('tabkeep-paste-to-folder', handlePasteToFolder as EventListener);
        document.addEventListener('tabkeep-dedup-folder', handleDedupFolder as EventListener);
        document.addEventListener('tabkeep-groupby-web', handleGroupByWeb as EventListener);
        
        return () => {
            document.removeEventListener('tabkeep-paste-to-folder', handlePasteToFolder as EventListener);
            document.removeEventListener('tabkeep-dedup-folder', handleDedupFolder as EventListener);
            document.removeEventListener('tabkeep-groupby-web', handleGroupByWeb as EventListener);
        };
    }, []);

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

    const handleUpdateSession = async (id: string, updates: Partial<Session>) => {
        const updated = sessions.map(s => s.id === id ? { ...s, ...updates } : s);
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

    const handleMoveTab = async (sourceSessionId: string, targetSessionId: string, tabIndex: number, insertIndex?: number) => {
        if (sourceSessionId === targetSessionId) return;

        const sourceSession = sessions.find(s => s.id === sourceSessionId);
        const targetSession = sessions.find(s => s.id === targetSessionId);
        if (!sourceSession || !targetSession) return;

        const tabToMove = sourceSession.tabs[tabIndex];

        const newSourceTabs = [...sourceSession.tabs];
        newSourceTabs.splice(tabIndex, 1);

        const newTargetTabs = [...targetSession.tabs];
        if (insertIndex !== undefined) {
            newTargetTabs.splice(insertIndex, 0, tabToMove);
        } else {
            newTargetTabs.push(tabToMove);
        }

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

    const handleMoveTabToFolder = async (sourceSessionId: string, tabIndex: number, folderId: string | null, targetSessionId?: string, insertPosition?: "before" | "after") => {
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

        // Compute insertion index
        if (targetSessionId && insertPosition) {
            const tIndex = updatedSessions.findIndex(s => s.id === targetSessionId);
            if (tIndex !== -1) {
                const insertIdx = insertPosition === "before" ? tIndex : tIndex + 1;
                updatedSessions.splice(insertIdx, 0, newSession);
            } else {
                updatedSessions = [newSession, ...updatedSessions];
            }
        } else {
            // Add the new session at the top
            updatedSessions = [newSession, ...updatedSessions];
        }

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

    const handleMoveMultiTabs = async (tabsToMove: SelectedTab[], targetSessionId: string, insertIndex?: number) => {
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
            if (s.id === targetSessionId) {
                const newTabs = [...s.tabs];
                if (insertIndex !== undefined) {
                    newTabs.splice(insertIndex, 0, ...extractedTabs);
                } else {
                    newTabs.push(...extractedTabs);
                }
                return { ...s, tabs: newTabs };
            }
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

    const handleMoveMultiTabsToFolder = async (tabsToMove: SelectedTab[], folderId: string | null, targetSessionId?: string, insertPosition?: "before" | "after") => {
        if (tabsToMove.length === 0) return;
        let updatedSessions = [...sessions];
        let updatedPins = [...pinnedLinks];

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

            for (const idx of indices) {
                const tab = newTabs[idx];
                extractedTabs.unshift(tab);

                if (session.folderId !== folderId) {
                    updatedPins = updatedPins.map(p => p.url === tab.url ? { ...p, folderId } : p);
                }

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
            name: "Extracted Tabs",
            tabs: extractedTabs,
            timestamp: new Date().toLocaleString(),
            folderId
        };

        // Compute insertion index
        if (targetSessionId && insertPosition) {
            const tIndex = updatedSessions.findIndex(s => s.id === targetSessionId);
            if (tIndex !== -1) {
                const insertIdx = insertPosition === "before" ? tIndex : tIndex + 1;
                updatedSessions.splice(insertIdx, 0, newSession);
            } else {
                updatedSessions = [newSession, ...updatedSessions];
            }
        } else {
            updatedSessions = [newSession, ...updatedSessions];
        }
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

    const handleRestoreSelected = async () => {
        if (selectedTabs.length === 0) return;

        for (const sel of selectedTabs) {
            const session = sessions.find(s => s.id === sel.sessionId);
            if (session) {
                const tab = session.tabs[sel.tabIndex];
                if (tab && tab.url) {
                    await chrome.tabs.create({ url: tab.url, active: false });
                }
            }
        }
        handleClearSelection();
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
                    id: `session-del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

    const handleDropPinnedLink = async (link: PinnedLink, sessionId: string | null, folderId: string | null, targetSessionId?: string, insertPosition?: "before" | "after") => {
        if (!link) return;

        if (sessionId && !insertPosition) {
            // Drop INTO an existing session
            const sessionIdx = sessions.findIndex(s => s.id === sessionId);
            if (sessionIdx !== -1) {
                const session = sessions[sessionIdx];
                const alreadyHasLink = session.tabs.some(t => t.url === link.url);
                if (!alreadyHasLink) {
                    const newTabs = [...session.tabs, { title: link.title, url: link.url, favIconUrl: link.favIconUrl }];
                    const newSessions = [...sessions];
                    newSessions[sessionIdx] = { ...session, tabs: newTabs };
                    setSessions(newSessions);
                    await updateSessions(newSessions);
                }
            }
        } else {
            // Drop outside (create new session or insert at position)
            const newSession: Session = {
                id: `session-${Date.now()}`,
                name: "Pinned Link",
                tabs: [{ title: link.title, url: link.url, favIconUrl: link.favIconUrl }],
                timestamp: new Date().toLocaleString(),
                folderId
            };

            let newSessions = [...sessions];
            if (targetSessionId && insertPosition) {
                const tIndex = newSessions.findIndex(s => s.id === targetSessionId);
                if (tIndex !== -1) {
                    const insertIdx = insertPosition === "before" ? tIndex : tIndex + 1;
                    newSessions.splice(insertIdx, 0, newSession);
                } else {
                    newSessions = [newSession, ...newSessions];
                }
            } else {
                newSessions = [newSession, ...newSessions];
            }
            setSessions(newSessions);
            await updateSessions(newSessions);
        }
    };

    // Ã¢â€â‚¬Ã¢â€â‚¬ Reorder handlers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    const handleReorderFolders = async (draggedId: string, targetId: string, position: "before" | "after") => {
        if (draggedId === targetId) return;
        const copy = [...folders];
        const fromIdx = copy.findIndex(f => f.id === draggedId);
        if (fromIdx === -1) return;
        const [item] = copy.splice(fromIdx, 1);
        const toIdx = copy.findIndex(f => f.id === targetId);
        if (toIdx === -1) return;
        copy.splice(position === "before" ? toIdx : toIdx + 1, 0, item);
        setFolders(copy);
        await updateFolders(copy);
    };

    const handleReorderSessions = async (draggedId: string, targetId: string, position: "before" | "after") => {
        if (draggedId === targetId) return;
        const copy = [...sessions];
        const fromIdx = copy.findIndex(s => s.id === draggedId);
        const targetSession = copy.find(s => s.id === targetId);
        if (fromIdx === -1 || !targetSession) return;
        const [item] = copy.splice(fromIdx, 1);
        // If cross-folder, update folderId to match target
        const updated = { ...item, folderId: targetSession.folderId };
        const toIdx = copy.findIndex(s => s.id === targetId);
        if (toIdx === -1) return;
        copy.splice(position === "before" ? toIdx : toIdx + 1, 0, updated);
        setSessions(copy);
        await updateSessions(copy);
    };

    const handleReorderTabs = async (sessionId: string, fromIdx: number, toIdx: number) => {
        if (fromIdx === toIdx) return;
        const updated = sessions.map(s => {
            if (s.id !== sessionId) return s;
            const tabs = [...s.tabs];
            const [moved] = tabs.splice(fromIdx, 1);
            tabs.splice(toIdx, 0, moved);
            return { ...s, tabs };
        });
        setSessions(updated);
        await updateSessions(updated);
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

    const handleCopyAllSessions = () => {
        const allUrls = sessions.flatMap(s => s.tabs.map(t => t.url));
        if (allUrls.length > 0) {
            navigator.clipboard.writeText(allUrls.join("\n"));
            alert(`${allUrls.length} links copied to clipboard!`);
        }
        setIsHeaderMenuOpen(false);
    };

    const handlePasteToNewSession = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) return;
            const newTabs = parseImportedLines(text);
            if (newTabs.length > 0) {
                const newSession: Session = {
                    id: `session-${Date.now()}`,
                    name: "Pasted Links",
                    tabs: newTabs,
                    timestamp: new Date().toLocaleString(),
                    folderId: null
                };
                const updated = [newSession, ...sessions];
                setSessions(updated);
                await updateSessions(updated);
            } else {
                alert("Tidak ada link valid yang ditemukan di clipboard.");
            }
        } catch (err) {
            console.error("Failed to read clipboard", err);
            alert("Gagal membaca clipboard. Pastikan izin akses clipboard aktif.");
        }
        setIsHeaderMenuOpen(false);
    };

    const handleRemoveAllDuplicates = async () => {
        const seenUrls = new Set<string>();
        const updatedSessions = sessions.map(session => {
            const uniqueTabs = session.tabs.filter(tab => {
                if (seenUrls.has(tab.url)) return false;
                seenUrls.add(tab.url);
                return true;
            });
            return { ...session, tabs: uniqueTabs };
        }).filter(session => session.tabs.length > 0);

        const removedCount = sessions.reduce((acc, s) => acc + s.tabs.length, 0) - updatedSessions.reduce((acc, s) => acc + s.tabs.length, 0);

        if (removedCount > 0) {
            setSessions(updatedSessions);
            await updateSessions(updatedSessions);
            alert(`${removedCount} duplikat berhasil dihapus!`);
        } else {
            alert("Tidak ada tab duplikat yang ditemukan.");
        }
        setIsHeaderMenuOpen(false);
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
    const searchedSessions = useMemo(() => {
        if (!searchQuery.trim()) return sessions;
        
        const query = searchQuery.toLowerCase().trim();
        return sessions
            .map(session => {
                const sessionTitleMatches = session.id.toLowerCase().includes(query) || 
                    (session.timestamp && new Date(session.timestamp).toLocaleDateString().toLowerCase().includes(query));
                
                const matchedTabs = session.tabs.filter(tab => 
                    tab.title.toLowerCase().includes(query) || 
                    tab.url.toLowerCase().includes(query)
                );
                
                if (sessionTitleMatches || matchedTabs.length > 0) {
                    return {
                        ...session,
                        tabs: matchedTabs.length > 0 ? matchedTabs : session.tabs
                    };
                }
                return null;
            })
            .filter((s): s is Session => s !== null);
    }, [sessions, searchQuery]);

    const filteredSessions = useMemo(() => {
        if (activeFolderId === "all") return searchedSessions;
        return searchedSessions.filter(s => s.folderId === activeFolderId);
    }, [searchedSessions, activeFolderId]);

    const displayedTabsCount = useMemo(() => {
        if (activeFolderId === "trash") {
            return deletedSessions.reduce((acc, s) => acc + s.tabs.length, 0);
        }
        const activeSessions = activeFolderId === "all"
            ? searchedSessions
            : searchedSessions.filter(s => s.folderId === activeFolderId);
        return activeSessions.reduce((acc, s) => acc + s.tabs.length, 0);
    }, [searchedSessions, activeFolderId, deletedSessions]);

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
            <header className="flex items-center justify-between px-6 h-16 bg-white dark:bg-[#1e1e1e] shrink-0 z-20 shadow-md transition-colors duration-200">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter" style={{ fontFamily: "'BBH Hegarty', sans-serif" }}>Tabkeep</h1>

                <div className="flex-1 max-w-5xl mx-8 relative">
                    <div className="relative w-full">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search size={16} className="text-gray-400 dark:text-gray-500" />
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tabs.."
                            className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-[#121212]/80 text-gray-950 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all shadow-inner"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="p-1.5 rounded-none text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-1.5 rounded-none text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        title="Settings"
                    >
                        <Settings size={14} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR */}
                <aside className="w-64 bg-white dark:bg-[#1e1e1e] flex flex-col p-4 shrink-0 overflow-y-auto custom-scrollbar transition-colors duration-200 z-10 shadow-lg dark:shadow-none">
                    <div className="mb-3 px-1 text-sm font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] opacity-60">
                        Workspace
                    </div>

                    <div className="flex-1">
                        <SidebarTree
                            sessions={sessions}
                            folders={folders}
                            pinnedLinks={pinnedLinks}
                            activeFolderId={activeFolderId}
                            onSetActive={setActiveFolderId}
                            onRenameFolder={handleRenameFolder}
                            onDeleteFolder={handleDeleteFolder}
                            onRenameSession={handleRenameSession}
                            onUpdateSession={handleUpdateSession}
                            onDeleteSession={handleDeleteSession}
                            onMoveFolder={handleMoveFolder}
                            onMoveTabToFolder={handleMoveTabToFolder}
                            onMoveMultiTabsToFolder={handleMoveMultiTabsToFolder}
                            onMoveTab={handleMoveTab}
                            onMoveMultiTabs={handleMoveMultiTabs}
                            onDropPinnedLink={handleDropPinnedLink}
                            onReorderFolder={handleReorderFolders}
                            onReorderSession={handleReorderSessions}
                        />

                        {/* Input folder baru */}
                        {isCreatingFolder && (
                            <div className="flex items-center gap-2 py-1.5 px-2 rounded-none bg-gray-50 dark:bg-[#252525] border border-blue-500/30 mt-2">
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
                                className="w-full flex items-center gap-2 py-1 px-1 rounded-none text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 transition-all text-[13px] mt-2"
                            >
                                <FolderPlus size={14} />
                                <span>Folder Baru</span>
                            </button>
                        )}
                    </div>

                    <div
                        onClick={() => setActiveFolderId("trash")}
                        className={`mt-auto pt-4 border-t border-gray-200 dark:border-[#333] flex items-center justify-between cursor-pointer transition-colors group px-2 py-1.5 rounded-none ${activeFolderId === "trash"
                            ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold"
                            : "text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Trash2 size={16} className={activeFolderId === "trash" ? "text-red-600 dark:text-red-400" : "group-hover:text-red-500 dark:group-hover:text-red-400"} />
                            <span className="text-[15px]">Histori Hapus</span>
                        </div>
                        <span className="text-[11px] font-mono">{deletedSessions.length}</span>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main
                    className="flex-1 px-8 py-6 overflow-y-auto bg-[#f5f5f7] dark:bg-[#171717] custom-scrollbar transition-colors duration-200"
                    onDragOver={(e) => {
                        if (activeFolderId !== "trash" && (e.dataTransfer.types.includes("application/tabkeep-session") || e.dataTransfer.types.includes("application/tabkeep-pinned-link") || e.dataTransfer.types.includes("application/json") || e.dataTransfer.types.includes("application/tabkeep-multi-tabs"))) {
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
                            } else if (e.dataTransfer.types.includes("application/tabkeep-multi-tabs")) {
                                e.preventDefault();
                                try {
                                    const data = JSON.parse(e.dataTransfer.getData("application/tabkeep-multi-tabs"));
                                    if (Array.isArray(data) && data.length > 0) {
                                        handleMoveMultiTabsToFolder(data, targetFolderId);
                                    }
                                } catch (err) { }
                            }
                        }
                    }}
                >
                    <div className="w-full max-w-5xl mx-auto transition-all duration-300">
                        <div className="flex items-center gap-4 mb-6 border-b border-gray-200 dark:border-[#333] pb-4">
                            {activeFolderId === "all"
                                ? <Archive className="text-gray-800 dark:text-white" size={32} strokeWidth={2.5} />
                                : <FolderOpen className="text-blue-500 dark:text-blue-400" size={32} strokeWidth={2.5} />
                            }
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white">{mainTitle}</h2>

                            {/* View Mode Switcher */}
                            {activeFolderId !== "trash" && (
                                <div className="ml-auto flex items-center bg-gray-200/50 dark:bg-[#252525] rounded-none p-1 border border-gray-200/80 dark:border-[#333]">
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={`p-1.5 rounded-none transition-colors ${viewMode === "list" ? "bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"}`}
                                        title="List View"
                                    >
                                        <LayoutList size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`p-1.5 rounded-none transition-colors ${viewMode === "grid" ? "bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"}`}
                                        title="Grid View"
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("graph")}
                                        className={`p-1.5 rounded-none transition-colors ${viewMode === "graph" ? "bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"}`}
                                        title="Graph View"
                                    >
                                        <Network size={18} />
                                    </button>
                                </div>
                            )}

                            {/* Dropdown for All Sessions */}
                            {activeFolderId === "all" && (
                                <div className="relative" ref={headerMenuRef}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsHeaderMenuOpen(!isHeaderMenuOpen);
                                        }}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-none hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                                    >
                                        <MoreHorizontal size={24} />
                                    </button>
                                    
                                    {isHeaderMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-none shadow-xl py-1 z-30">
                                            <button
                                                onClick={handleCopyAllSessions}
                                                className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
                                            >
                                                <Copy size={16} />
                                                Copy all to clipboard
                                            </button>
                                            <button
                                                onClick={handlePasteToNewSession}
                                                className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
                                            >
                                                <Link size={16} />
                                                Paste link
                                            </button>
                                            <button
                                                onClick={handleRemoveAllDuplicates}
                                                className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium"
                                            >
                                                <Layers size={16} />
                                                Remove all duplicate
                                            </button>
                                            <div className="h-px bg-gray-200 dark:bg-[#333] my-1 mx-2" />
                                            <button
                                                onClick={() => {
                                                    setIsHeaderMenuOpen(false);
                                                    const event = new CustomEvent('tabkeep-groupby-web', { detail: { folderId: 'all' } });
                                                    document.dispatchEvent(event);
                                                }}
                                                className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
                                            >
                                                <Globe size={16} />
                                                Group by web
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeFolderId === "trash" && deletedSessions.length > 0 && (
                                <button
                                    onClick={handleEmptyTrash}
                                    className="ml-auto flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-none transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Empty Trash
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {activeFolderId === "trash" ? (
                                deletedSessions.length > 0 ? (
                                    <div className="space-y-1.5">
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
                            ) : searchQuery.trim() && filteredSessions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-300 dark:border-[#222] rounded-[2rem] bg-white dark:bg-[#1a1a1a]/30 shadow-sm dark:shadow-none pointer-events-none">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#222] rounded-full flex items-center justify-center mb-4">
                                        <Search size={24} className="text-gray-400 dark:text-gray-700" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-600 italic text-sm font-medium">Tidak ada tab yang cocok dengan "{searchQuery}"</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-700 uppercase mt-2 tracking-widest font-black">No Search Results</p>
                                </div>
                            ) : (filteredSessions.length > 0 || (activeFolderId === "all" && folders.length > 0)) ? (
                                viewMode === "graph" ? (
                                    <div className="w-full h-[600px] mt-4">
                                        <GraphView 
                                            folders={folders} 
                                            sessions={sessions} 
                                            theme={theme} 
                                            onMoveFolder={handleMoveFolder}
                                            onMoveTab={handleMoveTab}
                                            onMoveTabToFolder={handleMoveTabToFolder}
                                        />
                                    </div>
                                ) : activeFolderId === "all" ? (
                                    <>
                                        {/* Uncategorized Sessions Dropzone */}
                                        <div className={`transition-all mb-1.5 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-1.5"} ${isMainDragOver && searchedSessions.filter(s => s.folderId === null).length > 0 ? "p-2 rounded-none border-2 border-blue-500 border-dashed bg-blue-50/30 dark:bg-blue-500/10" : ""}`}>
                                            {searchedSessions.filter(s => s.folderId === null).length === 0 && isMainDragOver && (
                                                <div className="py-24 flex items-center justify-center text-center text-blue-500 dark:text-blue-400 text-sm font-bold uppercase tracking-widest border-2 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 rounded-none pointer-events-none">
                                                    Drop here to Uncategorize
                                                </div>
                                            )}
                                            {searchedSessions.filter(s => s.folderId === null).map(s => (
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
                                                    onMoveTabToFolder={handleMoveTabToFolder}
                                                    onMoveMultiTabsToFolder={handleMoveMultiTabsToFolder}
                                                    onMergeSessions={handleMergeSessions}
                                                    onDeleteTab={handleDeleteTab}
                                                    onTabHover={setHoveredTab}
                                                    selectedTabs={selectedTabs}
                                                    onToggleTabSelection={handleToggleTabSelection}
                                                    onPinTab={handlePinLink}
                                                    onUnpinTab={handleUnpinLink}
                                                    onDropPinnedLinkToSession={(link, sId, targetId, pos) => handleDropPinnedLink(link, pos ? null : sId, null, targetId, pos)}
                                                    onReorderTab={handleReorderTabs}
                                                    onReorderSession={handleReorderSessions}
                                                    viewMode={viewMode}
                                                    theme={theme}
                                                />
                                            ))}
                                        </div>

                                        {/* Folders rendered as Accordions */}
                                        {folders.map(f => {
                                            const folderSessions = searchedSessions.filter(s => s.folderId === f.id);
                                            if (searchQuery.trim() && folderSessions.length === 0) return null;
                                            return (
                                                <MainFolderAccordion
                                                    key={f.id}
                                                    folder={f}
                                                    sessions={folderSessions}
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
                                                    onDropPinnedLinkToSession={(link, sId, targetId, pos) => handleDropPinnedLink(link, pos ? null : sId, f.id, targetId, pos)}
                                                    onReorderTab={handleReorderTabs}
                                                    onReorderSession={handleReorderSessions}
                                                    onReorderFolder={handleReorderFolders}
                                                    viewMode={viewMode}
                                                    theme={theme}
                                                />
                                            );
                                        })}
                                    </>
                                ) : (
                                    <div className="space-y-1.5">
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
                                                onMoveTabToFolder={handleMoveTabToFolder}
                                                onMoveMultiTabsToFolder={handleMoveMultiTabsToFolder}
                                                onMergeSessions={handleMergeSessions}
                                                onDeleteTab={handleDeleteTab}
                                                onTabHover={setHoveredTab}
                                                selectedTabs={selectedTabs}
                                                onToggleTabSelection={handleToggleTabSelection}
                                                onPinTab={handlePinLink}
                                                onUnpinTab={handleUnpinLink}
                                                onDropPinnedLinkToSession={(link, sId, targetId, pos) => handleDropPinnedLink(link, pos ? null : sId, activeFolderId === "all" ? null : activeFolderId, targetId, pos)}
                                                onReorderTab={handleReorderTabs}
                                                onReorderSession={handleReorderSessions}
                                                viewMode={viewMode}
                                                theme={theme}
                                            />
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-300 dark:border-[#222] rounded-[2rem] bg-white dark:bg-[#1a1a1a]/30 shadow-sm dark:shadow-none pointer-events-none">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#222] rounded-full flex items-center justify-center mb-4">
                                        {activeFolderId === "all"
                                            ? <Library size={24} className="text-gray-400 dark:text-gray-700" />
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
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-none shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 z-50">
                        <span className="text-sm font-bold">{selectedTabs.length} tab{selectedTabs.length > 1 ? 's' : ''} selected</span>
                        <div className="w-px h-4 bg-gray-700 dark:bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRestoreSelected}
                                className="flex items-center gap-1.5 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-none transition-colors"
                            >
                                <RotateCcw size={12} />
                                Restore
                            </button>
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-1.5 text-xs font-bold bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-none transition-colors"
                            >
                                <Trash2 size={12} />
                                Delete
                            </button>
                            <button
                                onClick={handleClearSelection}
                                className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-900 px-3 py-1.5 rounded-none transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}