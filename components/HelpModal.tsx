import React, { useEffect, useState } from "react";
import { ArrowUpDown, Bookmark, Database, FolderTree, Grid2X2, Keyboard, LayoutDashboard, List, Network, PanelRight, Settings, X } from "lucide-react";

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const guideSections = [
    {
        title: "1. Screen layout",
        description: "Tabkeep is divided into four working areas.",
        items: ["Top bar: search, theme, Help, About, and Settings.", "Left sidebar: All Sessions, session tree, folders, and Trash.", "Main area: your sessions in List, Grid, or Graph view.", "Right sidebar: live details for the tab currently under your pointer."],
    },
    {
        title: "2. Left sidebar",
        description: "Use the left side to move through a large workspace quickly.",
        items: ["All Sessions shows everything, including sessions outside folders.", "Click a chevron to reveal a session, folder, or pinned item without leaving the current page.", "Click a session name to jump directly to its card in the main area.", "Create a folder with Folder Baru. Deleted sessions can be restored from Trash."],
    },
    {
        title: "3. Search, bookmarks, and header menu",
        description: "The top controls stay available while you organize tabs.",
        items: ["Search matches both page titles and URLs.", "Pinned bookmarks appear as favicons above All Sessions; click one to open it.", "Place the pointer over the bookmark strip and use the mouse wheel to scroll it horizontally.", "The All Sessions three-dot menu can show or hide bookmarks, collapse or expand everything, paste links, copy all links, group by website, and remove duplicates."],
    },
    {
        title: "4. List view",
        description: "Best when titles and URLs matter.",
        items: ["Each session displays complete tab rows with title, optional URL, time, pin, and delete actions.", "Click a title to open it. Ctrl-click or Cmd-click opens it in the background.", "Double-click a session title to rename it.", "Use the session chevron to collapse or expand its tab list."],
    },
    {
        title: "5. Grid view",
        description: "Best for scanning many tabs with less space.",
        items: ["Tabs become compact favicon tiles; hover a tile to see its details on the right.", "When the right sidebar is closed, another session column is added automatically.", "The chevron beside each grid row collapses only that row.", "Session titles and tab counts remain visible while long names are shortened safely."],
    },
    {
        title: "6. Graph view",
        description: "A lightweight map for exploring relationships without drawing every tab at once.",
        items: ["Overview shows All Sessions and folder nodes.", "Open All Sessions or a folder to reveal only its sessions.", "Open a session to reveal only the tabs inside that session.", "Hover a tab node to update the right sidebar; use the back button inside the graph to return one level."],
    },
    {
        title: "7. Right sidebar",
        description: "A preview panel that follows your pointer.",
        items: ["Hover a tab, bookmark, or graph tab node to show its title, URL, favicon, and saved time.", "Analytics summarize sessions, tabs, estimated memory saved, and recent activity.", "Use the edge arrow to close or reopen the sidebar.", "Closing it gives the main area more room; Grid view uses that room automatically."],
    },
    {
        title: "8. Session and tab actions",
        description: "Most actions live in the three-dot menu or appear when you hover an item.",
        items: ["Session actions: restore all, rename, star, copy, paste, sort, move, merge, remove duplicates, or delete.", "Tab actions: open, pin or unpin, select, move, reorder, or delete.", "Pinned tabs stay available in the bookmark strip even when you browse another folder.", "Restored tabs follow the behavior selected in Settings: remove, keep, or archive."],
    },
    {
        title: "9. Drag and drop",
        description: "The position of the indicator tells you what will happen before you release.",
        items: ["A thin blue line at an edge means insert before or after that session or tab.", "A subtle highlight in the middle means move into or merge with that destination.", "Drag a session onto a folder to move the whole session.", "Select several tabs first, then drag one selected tab to move the entire selection together."],
    },
    {
        title: "10. Status indicators",
        description: "Small visual changes communicate state without extra text.",
        items: ["Green dot: at least one saved URL is currently open in Chrome.", "Soft gray tab background: the same page is saved more than once, when duplicate highlighting is enabled.", "Striped or crossed-out row: the tab has been archived after restoration.", "Amber pin or star: the tab is bookmarked or the session is marked as important."],
    },
    {
        title: "11. Settings, import, and backup",
        description: "Settings control restoration, duplicates, URL display, and data protection.",
        items: ["Choose whether restored tabs are removed, kept, or archived.", "Allow or reject duplicates, and independently turn duplicate highlighting on or off.", "Choose no URL, domain only, abbreviated URL, or full URL in List view.", "Paste links or choose a TXT/JSON file to import. Copy, export, or sync a backup to Google Drive.", "Google Drive Auto-Sync is best effort: Chrome, internet access, and a valid Google login are required. Run a manual sync before important changes."],
    },
    {
        title: "12. Keyboard and mouse shortcuts",
        description: "These shortcuts make large collections faster to operate.",
        items: ["Ctrl-click / Cmd-click: open a link in the background.", "Shift-click a checkbox: select a continuous range of tabs.", "Double-click a session name: rename it.", "Mouse wheel over bookmarks: scroll horizontally. Escape: close an open modal or cancel a stuck drag indicator."],
    },
];

const guideIcons = [LayoutDashboard, FolderTree, Bookmark, List, Grid2X2, Network, PanelRight, Settings, ArrowUpDown, Bookmark, Database, Keyboard];

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const [isRendered, setIsRendered] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(isOpen);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isOpen) {
            setIsRendered(true);
            timer = setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
            timer = setTimeout(() => setIsRendered(false), 200);
        }
        return () => clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [isOpen, onClose]);

    if (!isRendered) return null;

    return (
        <div onClick={onClose} className={`fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm transition-opacity duration-200 dark:bg-black/60 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <div role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(event) => event.stopPropagation()} className={`flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-200 dark:border-[#333] dark:bg-[#1e1e1e] ${isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"}`}>
                <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-[#333] sm:px-6">
                    <div>
                        <h2 id="help-title" className="text-xl font-black text-gray-900 dark:text-white">Tabkeep Guide</h2>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Save, organize, and restore tabs without losing your place.</p>
                    </div>
                    <button aria-label="Close guide" onClick={onClose} className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white"><X size={17} /></button>
                </header>

                <div className="custom-scrollbar overflow-y-auto p-5 sm:p-6">
                    <div className="mx-auto max-w-3xl">
                        <div className="mb-3 rounded-xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900 dark:bg-blue-500/10 dark:text-blue-200">
                            Start with the screen layout, then read only the view or feature you need. Every section explains what you see, what it means, and what you can do.
                        </div>
                    <div className="flex flex-col">
                        {guideSections.map((section, index) => (
                            <section key={section.title} className="border-b border-gray-200 px-2 py-7 first:pt-5 last:border-0 dark:border-[#333]">
                                <h3 className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                        {React.createElement(guideIcons[index], { size: 16 })}
                                    </span>
                                    {section.title}
                                </h3>
                                <div className="ml-11 mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                    <p>{section.description}</p>
                                </div>
                                <ul className="ml-16 mt-3 list-disc space-y-2 text-sm leading-6 text-gray-600 marker:text-blue-400 dark:text-gray-300">
                                    {section.items.map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </section>
                        ))}
                    </div>

                    <div className="mt-3 rounded-xl bg-gray-100 p-4 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-300">
                        Tip: press <kbd className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">Ctrl</kbd> or <kbd className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">Cmd</kbd> while opening a link to keep it in the background. Press <kbd className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">Esc</kbd> to close this guide.
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
