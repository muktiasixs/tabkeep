import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import workspaceImage from "~assets/help/workspace.png";
import tabPickerImage from "~assets/help/tab-picker.png";
import contextMenuImage from "~assets/help/context-menu.png";
import pinnedBarImage from "~assets/help/pinned-bar.png";
import listImage from "~assets/help/list-view.png";
import gridImage from "~assets/help/grid-view.png";
import graphImage from "~assets/help/graph-view.png";
import lastViewImage from "~assets/help/last-view.png";
import analyticsImage from "~assets/help/analytics.png";
import allSessionsMenuImage from "~assets/help/all-sessions-menu.png";
import sessionMenuImage from "~assets/help/session-menu.png";
import settingsImage from "~assets/help/settings-panel.png";
import trashImage from "~assets/help/trash-panel.png";

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const guideGroups = [
    {
        number: "01",
        title: "Saving & Workspace",
        description: "Capture tabs first, then use the left workspace and pinned bar to move through your collection.",
        panels: [
            {
                title: "Tab Picker",
                image: tabPickerImage,
                full: true,
                points: ["Select the tabs you want to save, or use Select all.", "Save to Tabkeep repeats your last save behavior.", "Use the arrow to choose Save & close tabs or Save & keep open.", "Open Keep jumps to the full Tabkeep workspace."],
            },
            {
                title: "Send selected tabs from the browser",
                image: contextMenuImage,
                full: true,
                points: ["Select several browser tabs with Ctrl-click or Shift-click on the tab strip.", "Right-click one of the selected tabs and choose Send selected tabs to Tabkeep.", "A single selected tab works too.", "This shortcut saves and closes the selected tabs immediately without opening Tab Picker; pinned tabs and the Tabkeep dashboard are skipped."],
            },
            {
                title: "Left Workspace",
                image: workspaceImage,
                points: ["All Sessions is the root of the collection.", "Chevrons reveal folders, sessions, and pinned links without changing the main view.", "Click a session to jump to its card.", "New Folder creates a group; Trash stores deleted sessions."],
            },
            {
                title: "Pinned bookmarks",
                image: pinnedBarImage,
                points: ["Pinned pages appear above the All Sessions title.", "Click a favicon to open it.", "Scroll over the strip with the mouse wheel when it contains more items than the available width.", "Show or hide this bar from the All Sessions menu."],
            },
        ],
    },
    {
        number: "02",
        title: "All Sessions views",
        description: "The same data can be explored as a detailed list, compact cards, or a lightweight hierarchy.",
        panels: [
            {
                title: "List view",
                image: listImage,
                full: true,
                points: ["Best for reading titles, URLs, timestamps, and status indicators.", "Click a title to open it; Ctrl/Cmd-click opens it in the background.", "Expand or collapse individual sessions and folders.", "Drag tabs or sessions using the blue insertion indicators."],
            },
            {
                title: "Grid view",
                image: gridImage,
                full: true,
                points: ["Best for scanning many sessions in less space.", "Tabs become favicon tiles; hover one to update Last View Tab.", "Rows can be collapsed independently.", "Closing the right sidebar automatically gives Grid room for another column."],
            },
            {
                title: "Graph view",
                image: graphImage,
                full: true,
                points: ["Graph loads one level at a time: All Sessions, folder, session, then tabs.", "Click a node to move deeper into the hierarchy.", "The breadcrumb shows your current path and lets you jump back to any parent.", "Use Graph for exploration; return to List or Grid for detailed editing."],
            },
        ],
    },
    {
        number: "03",
        title: "Details & Actions",
        description: "The right sidebar explains the item under your pointer, while menus contain workspace and session actions.",
        panels: [
            {
                title: "Last View Tab",
                image: lastViewImage,
                points: ["Hover a tab, bookmark, or graph tab node to preview it here.", "Shows the saved title, URL, page type, and timestamp.", "Use the edge arrow to collapse or reopen the right sidebar."],
            },
            {
                title: "System Analytics",
                image: analyticsImage,
                points: ["Shows total sessions and saved tabs.", "Usage Distribution groups links by category.", "Memory Saved is an estimate, not live browser memory usage.", "Activity Trend summarizes recent saving activity."],
            },
            {
                title: "All Sessions menu",
                image: allSessionsMenuImage,
                points: ["Copy or paste many links at once.", "Collapse or expand the complete workspace.", "Show or hide bookmarks, remove duplicate URLs, or group tabs by website.", "Actions marked red can modify many items, so review the result before continuing."],
            },
            {
                title: "Session menu",
                image: sessionMenuImage,
                points: ["Restore a session in this window or a new window.", "Switch Session replaces the current browsing set with the saved session.", "Copy, sort, move, rename, star, paste, or remove duplicate links.", "Delete Session moves it to Trash first."],
            },
        ],
    },
    {
        number: "04",
        title: "Settings & Recovery",
        description: "Choose how Tabkeep behaves, protect your data, and recover accidental deletions.",
        panels: [
            {
                title: "Settings",
                image: settingsImage,
                full: true,
                points: [
                    "Remove them from your list: restored tabs disappear from the saved session.",
                    "Keep them in your list: restored tabs stay saved and can be opened again later.",
                    "Mark them as archived: restored tabs stay saved with a gray striped archived indicator.",
                    "Allow duplicates: the same URL may be stored more than once.",
                    "Silently reject duplicates: a URL already stored in Tabkeep is not added again.",
                    "Highlight duplicate pages: matching URLs receive a soft gray background; this only changes their appearance.",
                    "URL display — None hides URLs, Domain only shows the website, Abbreviated shortens long URLs, and Full shows the complete URL.",
                    "Enable Auto-Sync schedules Google Drive backups every 1, 3, or 6 hours.",
                    "Include preview images also backs up thumbnails, but makes the backup larger.",
                    "Auto-Sync is best effort: sleep, shutdown, no internet, or expired Google authorization can delay or skip it.",
                    "Download TXT creates a simple portable link list; Download JSON creates a complete restorable Tabkeep backup.",
                    "Sync to Google Drive uploads the JSON backup; Copy all copies the current backup text.",
                    "Import accepts pasted content or a TXT/JSON file. Import from Google Drive loads the cloud backup, then Import applies it.",
                    "Run a manual export or Google Drive sync before major changes."
                ],
            },
            {
                title: "Trash",
                image: trashImage,
                full: true,
                points: ["Restore returns a deleted session to the workspace.", "Delete Forever removes one session permanently.", "Empty Trash permanently removes every item currently in Trash.", "Export a backup before permanently deleting valuable collections."],
            },
        ],
    },
];

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
            <div role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(event) => event.stopPropagation()} className={`flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-200 dark:border-[#333] dark:bg-[#1e1e1e] ${isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"}`}>
                <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-[#333] sm:px-6">
                    <div>
                        <h2 id="help-title" className="text-xl font-black text-gray-900 dark:text-white">Tabkeep Guide</h2>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Real interface examples, grouped by the task you want to complete.</p>
                    </div>
                    <button aria-label="Close guide" onClick={onClose} className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white"><X size={17} /></button>
                </header>

                <div className="custom-scrollbar overflow-y-auto p-5 sm:p-6">
                    <div className="mx-auto max-w-5xl space-y-10">
                        {guideGroups.map((group) => (
                            <section key={group.number}>
                                <div className="mb-4 flex items-start gap-3">
                                    <span className="font-mono text-xs font-bold text-blue-500">{group.number}</span>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{group.title}</h3>
                                        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{group.description}</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {group.panels.map((panel) => (
                                        <article key={panel.title} className={`overflow-hidden rounded-xl border border-gray-200 bg-gray-50/60 dark:border-[#333] dark:bg-white/[0.02] ${panel.full ? "sm:col-span-2" : ""}`}>
                                            <div className="flex min-h-48 items-center justify-center border-b border-gray-200 bg-[#171717] p-3 dark:border-[#333]">
                                                <img src={panel.image} alt={`${panel.title} in Tabkeep`} loading="lazy" className="max-h-[520px] max-w-full rounded-md object-contain" />
                                            </div>
                                            <div className="p-4">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{panel.title}</h4>
                                                <ul className="mt-2 space-y-1.5 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                                    {panel.points.map((point) => <li key={point} className="flex gap-2"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />{point}</li>)}
                                                </ul>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        ))}

                        <div className="rounded-xl bg-gray-100 p-4 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-300">
                            Shortcuts: <kbd className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">Ctrl</kbd>/<kbd className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">Cmd</kbd> opens links in the background, <kbd className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">Shift</kbd>-click selects a range, and <kbd className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">Esc</kbd> closes the active modal.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
