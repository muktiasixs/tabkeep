import React, { useEffect, useState } from "react"
import "~style.css"
import {
    ChevronDown, ChevronRight, Folder, FolderOpen, Search,
    Moon, Sun, Trash2, Upload, LayoutGrid, Clock, MoreHorizontal
} from 'lucide-react';

// --- Komponen Folder Sidebar dengan Garis Menyambung ---
const SidebarFolder = ({ name, children, isRoot = false }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="relative">
            {/* GARIS VERTIKAL PENYAMBUNG */}
            {!isRoot && (
                <div className="absolute left-[-11px] top-0 bottom-0 w-[1px] bg-[#333]" />
            )}

            <div
                className="flex items-center gap-2 py-1 px-2 hover:bg-[#252525] rounded cursor-pointer group relative z-10"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="w-3 flex justify-center">
                    {children ? (isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : null}
                </div>
                <Folder size={14} className={isRoot ? "text-blue-500 fill-blue-500/10" : "text-gray-500"} />
                <span className={`text-sm truncate ${isRoot ? "text-white font-bold" : "text-gray-400 group-hover:text-white"}`}>
                    {name}
                </span>
            </div>

            {isOpen && children && (
                <div className="ml-[18px] mt-1 space-y-1 relative">
                    {/* Garis Horizontal Kecil untuk sub-item (Opsional) */}
                    {children}
                </div>
            )}
        </div>
    );
};

// --- Komponen Kotak Sesi (Bisa Collapse/Expand) ---
const SessionBox = ({ session }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // Safety check: Jika data tabs tidak ada, jangan render untuk cegah layar putih
    if (!session || !session.tabs) return null;

    return (
        <div className="bg-[#1e1e1e] rounded-lg border border-[#333] mb-4 overflow-hidden shadow-lg transition-all animate-in fade-in duration-300">
            <div
                className="p-4 bg-[#252525] border-b border-[#333] flex justify-between items-center cursor-pointer hover:bg-[#2a2a2a]"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                    <h3 className="text-sm font-bold text-white italic tracking-tight">
                        {session.tabs.length} tabs
                    </h3>
                </div>
                <div className="text-right flex items-center gap-4">
                    <span className="text-[10px] text-gray-500 font-mono italic">{session.timestamp || "Just now"}</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); /* Logic Restore di sini */ }}
                        className="text-[11px] text-blue-500 font-bold hover:text-blue-400 hover:underline"
                    >
                        Restore All
                    </button>
                </div>
            </div>

            {isExpanded && (
                <ul className="p-2 space-y-1 bg-[#1a1a1a]/50">
                    {session.tabs.map((tab, idx) => (
                        <li key={idx} className="flex items-center gap-3 hover:bg-[#252525] p-2 rounded cursor-pointer group transition-colors">
                            <img
                                src={tab.favIconUrl || `https://www.google.com/s2/favicons?domain=google.com&sz=32`}
                                className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 bg-white/10 rounded-sm"
                                onError={(e) => { (e.target as any).src = "https://www.google.com/s2/favicons?domain=google.com"; }}
                            />
                            <span className="text-xs text-gray-400 group-hover:text-blue-400 truncate flex-1 font-medium">
                                {tab.title || "Untitled Tab"}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default function TabkeepDashboard() {
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        const load = async () => {
            if (typeof chrome !== "undefined" && chrome.storage) {
                const data = await chrome.storage.local.get(["sessions"]);
                if (data.sessions) setSessions(data.sessions);
            }
        };
        load();

        // Listen perubahan data agar langsung update tanpa refresh
        const handleChange = (changes) => {
            if (changes.sessions) {
                setSessions(changes.sessions.newValue || []);
            }
        };
        chrome.storage.onChanged.addListener(handleChange);
        return () => chrome.storage.onChanged.removeListener(handleChange);
    }, []);

    return (
        <div className="bg-[#171717] text-gray-300 font-sans h-screen flex flex-col overflow-hidden">
            {/* NAVBAR */}
            <header className="flex items-center justify-between px-6 h-16 bg-[#1e1e1e] border-b border-[#333] shrink-0 z-20 shadow-md">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-white italic tracking-tighter">Tabkeep</h1>
                </div>
                <div className="flex-1 max-w-xl mx-8 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-600" size={16} />
                    <input
                        type="text"
                        placeholder="Search saved sessions.."
                        className="w-full bg-[#121212] border border-[#333] rounded-md py-2 pl-10 text-sm focus:outline-none focus:border-gray-500 transition-all text-gray-200"
                    />
                </div>
                <div className="flex items-center gap-5 text-xs font-bold text-gray-500 uppercase tracking-tighter">
                    <button className="hover:text-white transition-colors">Import & Export</button>
                    <span className="text-[#333]">|</span>
                    <button className="hover:text-white transition-colors">Privacy</button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR */}
                <aside className="w-64 bg-[#1e1e1e] border-r border-[#333] flex flex-col p-4 shrink-0 overflow-y-auto">
                    <div className="mb-6 px-2 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] opacity-60">Workspace</div>

                    <div className="space-y-1">
                        <SidebarFolder name="All" isRoot>
                            <SidebarFolder name="Work">
                                <div className="relative pl-4 py-1 text-xs text-gray-500 hover:text-white cursor-pointer group flex items-center gap-2">
                                    <div className="absolute left-[-11px] top-1/2 w-2 h-[1px] bg-[#333]" />
                                    Code
                                </div>
                                <div className="relative pl-4 py-1 text-xs text-gray-500 hover:text-white cursor-pointer group flex items-center gap-2">
                                    <div className="absolute left-[-11px] top-1/2 w-2 h-[1px] bg-[#333]" />
                                    Design
                                </div>
                            </SidebarFolder>
                            <SidebarFolder name="Chill">
                                <div className="relative pl-4 py-1 text-xs text-gray-500 hover:text-white cursor-pointer group flex items-center gap-2">
                                    <div className="absolute left-[-11px] top-1/2 w-2 h-[1px] bg-[#333]" />
                                    Youtube
                                </div>
                                <div className="relative pl-4 py-1 text-xs text-gray-500 hover:text-white cursor-pointer group flex items-center gap-2">
                                    <div className="absolute left-[-11px] top-1/2 w-2 h-[1px] bg-[#333]" />
                                    Game
                                </div>
                            </SidebarFolder>
                        </SidebarFolder>
                    </div>

                    <div className="mt-auto pt-4 border-t border-[#333] flex items-center gap-3 text-gray-600 hover:text-red-400 cursor-pointer transition-colors group">
                        <Trash2 size={16} className="group-hover:animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest">Trash</span>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 p-10 overflow-y-auto bg-[#171717] custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-10 border-b border-[#333] pb-6">
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                <LayoutGrid className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white italic tracking-tighter">All Sessions</h2>
                                <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-bold mt-1">Stored Locally</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {sessions.length > 0 ? (
                                sessions.map(s => <SessionBox key={s.id} session={s} />)
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-[#222] rounded-[2rem] bg-[#1a1a1a]/30">
                                    <div className="w-16 h-16 bg-[#222] rounded-full flex items-center justify-center mb-4">
                                        <Clock size={24} className="text-gray-700" />
                                    </div>
                                    <p className="text-gray-600 italic text-sm font-medium">Right-click a tab bar and select "Send to Tabkeep".</p>
                                    <p className="text-[10px] text-gray-800 uppercase mt-2 tracking-widest font-black">No Active Sessions</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}