// View "Pilih Tab yang Dikemas" yang ditampilkan di popup.
// Didesain ulang sesuai dengan mockup kedua user:
// - Header dengan judul besar, sub-titel, dan tombol "Open Keep".
// - Checkbox "Select all".
// - List tab dengan checkbox, favicon, dan text title berwarna sky-blue link.
// - Baris tombol di bagian bawah: "Save to tabkeep" (biru), "Copy link" (biru), dan "Paste clipboard link" (hijau zaitun).

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { persistSession } from "~lib/storage";
import { openOrFocusDashboard } from "~lib/navigation";
import type { SavedTab } from "~types";

interface TabItem {
    id: number;
    title: string;
    url: string;
    favIconUrl: string;
}

type SaveBehavior = "close" | "keep";
const SAVE_BEHAVIOR_KEY = "tabPickerSaveBehavior";

export function TabPickerView() {
    const [tabs, setTabs] = useState<TabItem[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saveBehavior, setSaveBehavior] = useState<SaveBehavior>("close");
    const [showSaveMenu, setShowSaveMenu] = useState(false);
    const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

    useEffect(() => {
        chrome.storage.local.get(SAVE_BEHAVIOR_KEY).then((data) => {
            if (data[SAVE_BEHAVIOR_KEY] === "keep") setSaveBehavior("keep");
        });
        chrome.tabs.query({ currentWindow: true }).then((allTabs) => {
            const filtered = allTabs.filter(
                (t) => t.url && !t.url.includes("dashboard.html") && !t.pinned
            ) as TabItem[];
            setTabs(filtered);
            // Default: semua dipilih
            setSelected(new Set(filtered.map((t) => t.id).filter((id): id is number => id !== undefined)));
        });
    }, []);

    const handleTabClick = (e: React.MouseEvent, clickedId: number, clickedIndex: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            const isCurrentlyChecked = next.has(clickedId);
            const targetCheckedState = !isCurrentlyChecked;

            if (e.shiftKey && lastClickedIndex !== null) {
                // Range selection (Shift-click)
                const start = Math.min(lastClickedIndex, clickedIndex);
                const end = Math.max(lastClickedIndex, clickedIndex);

                for (let i = start; i <= end; i++) {
                    const tabId = tabs[i].id;
                    if (targetCheckedState) {
                        next.add(tabId);
                    } else {
                        next.delete(tabId);
                    }
                }
            } else {
                // Single select biasa
                if (targetCheckedState) {
                    next.add(clickedId);
                } else {
                    next.delete(clickedId);
                }
            }
            return next;
        });

        setLastClickedIndex(clickedIndex);
    };

    const toggleAll = () => {
        if (selected.size === tabs.length) {
            setSelected(new Set()); // Batal semua
        } else {
            setSelected(new Set(tabs.map((t) => t.id).filter((id): id is number => id !== undefined))); // Pilih semua
        }
    };

    const handleSave = async (behavior = saveBehavior) => {
        if (selected.size === 0) return;
        setSaving(true);
        setShowSaveMenu(false);
        setSaveBehavior(behavior);
        await chrome.storage.local.set({ [SAVE_BEHAVIOR_KEY]: behavior });
        const tabIdsToClose = [...selected];

        const tabsToSave: SavedTab[] = tabs
            .filter((t) => selected.has(t.id))
            .map((t) => ({
                title: t.title || "No Title",
                url: t.url,
                favIconUrl: t.favIconUrl,
                // Screenshot fetched lazily via IndexedDB
                screenshot: undefined
            }));

        await persistSession(tabsToSave);
        if (behavior === "close") await chrome.tabs.remove(tabIdsToClose);
        await openOrFocusDashboard();
    };

    const handleCopy = async () => {
        const selectedTabs = tabs.filter((t) => selected.has(t.id));
        if (selectedTabs.length === 0) return;
        const textToCopy = selectedTabs.map((t) => t.url).join("\n");
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error("Gagal menyalin link: ", err);
        }
    };

    const handlePasteClipboard = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            // Ekstrak URL yang valid
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const foundUrls = clipboardText.match(urlRegex) || [];

            if (foundUrls.length > 0) {
                // Buka setiap URL di tab baru
                for (const url of foundUrls) {
                    await chrome.tabs.create({ url, active: false });
                }
                window.close();
            } else {
                alert("No valid URL links found in clipboard.");
            }
        } catch (err) {
            console.error("Failed to read clipboard or open tab: ", err);
            alert("Failed to read clipboard. Make sure clipboard access permission is granted.");
        }
    };

    const allSelected = tabs.length > 0 && selected.size === tabs.length;
    const noneSelected = selected.size === 0;

    return (
        <div className="flex flex-col p-4 bg-transparent text-gray-900 dark:text-white rounded-lg select-none transition-colors" style={{ maxHeight: "560px" }}>
            {/* TOP BAR / HEADER */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-none">Tabkeep</h2>
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">TAB MANAGER</span>
                    </div>
                </div>
                <button
                    onClick={openOrFocusDashboard}
                    className="bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[11px] px-3.5 py-1.5 rounded-lg font-bold transition-all shadow-md active:scale-95"
                >
                    Open Keep
                </button>
            </div>

            {/* SELECT ALL CHECKBOX */}
            <label className="flex items-center gap-2.5 pb-2 mb-2 border-b border-gray-200 dark:border-white/5 cursor-pointer hover:opacity-85 select-none transition-colors">
                <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded-lg border-gray-300 dark:border-gray-600 bg-transparent text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">Select all</span>
            </label>

            {/* TAB LIST */}
            <div className="overflow-y-auto flex-1 max-h-[320px] custom-scrollbar py-0.5">
                {tabs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500 italic">
                        No active tabs in this window
                    </div>
                ) : (
                    tabs.map((tab, idx) => {
                        const isChecked = selected.has(tab.id);
                        return (
                            <div
                                key={tab.id}
                                onClick={(e) => handleTabClick(e, tab.id, idx)}
                                className={`flex items-center gap-2 py-0.5 px-1 transition-all group cursor-pointer ${isChecked ? "bg-blue-100/50 dark:bg-blue-900/30 rounded-none" : "hover:bg-gray-100 dark:hover:bg-white/[0.02] rounded-lg"}`}
                            >
                                <img loading="lazy"
                                    src={tab.favIconUrl || "https://www.google.com/s2/favicons?domain=google.com&sz=32"}
                                    className="w-3.5 h-3.5 flex-shrink-0 rounded-lg ml-2"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=google.com"; }}
                                />

                                <div className="flex-1 min-w-0 pr-2">
                                    <span
                                        className="text-xs text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-semibold block truncate leading-tight"
                                        title={tab.title}
                                    >
                                        {tab.title || "Untitled"}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* BOTTOM BUTTON BAR */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 shrink-0 transition-colors">
                <div className="relative">
                    <div className={`flex overflow-hidden rounded-lg shadow-md transition-colors ${noneSelected || saving
                        ? "bg-[#222] text-gray-600"
                        : "bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700"
                        }`}>
                        <button
                            onClick={() => handleSave()}
                            disabled={noneSelected || saving}
                            title={saveBehavior === "keep" ? "Save and keep tabs open" : "Save and close tabs"}
                            className="px-3.5 py-2 text-xs font-bold tracking-wide disabled:cursor-not-allowed active:bg-black/10"
                        >
                            {saving ? "Saving..." : "Save to Tabkeep"}
                        </button>
                        <button
                            onClick={() => setShowSaveMenu((open) => !open)}
                            disabled={noneSelected || saving}
                            aria-label="Choose save behavior"
                            aria-expanded={showSaveMenu}
                            className="flex w-8 items-center justify-center border-l border-white/20 disabled:cursor-not-allowed hover:bg-white/10 active:bg-black/10"
                        >
                            <ChevronDown size={14} className={`transition-transform ${showSaveMenu ? "rotate-180" : ""}`} />
                        </button>
                    </div>
                    {showSaveMenu && (
                        <div className="absolute bottom-full left-0 z-20 mb-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-[#242424]">
                            <button onClick={() => handleSave("close")} className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-semibold transition-colors ${saveBehavior === "close" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" : "text-gray-800 hover:bg-gray-100 dark:text-white dark:hover:bg-white/5"}`}>
                                Save & close tabs
                                {saveBehavior === "close" && <span>✓</span>}
                            </button>
                            <button onClick={() => handleSave("keep")} className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-semibold transition-colors ${saveBehavior === "keep" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" : "text-gray-800 hover:bg-gray-100 dark:text-white dark:hover:bg-white/5"}`}>
                                Save & keep open
                                {saveBehavior === "keep" && <span>✓</span>}
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        disabled={noneSelected}
                        className={`text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-sm ${noneSelected
                            ? "bg-gray-200/60 dark:bg-[#222] text-gray-400 dark:text-gray-600 cursor-not-allowed"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white active:scale-95"
                            }`}
                    >
                        {copied ? "Copied!" : "Copy link"}
                    </button>
                    <button
                        onClick={handlePasteClipboard}
                        style={{ backgroundColor: "white", color: "black" }}
                        className="text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-sm active:scale-95 hover:bg-gray-200 hover:text-black"
                    >
                        Paste clipboard link
                    </button>
                </div>
            </div>
        </div>
    );
}
