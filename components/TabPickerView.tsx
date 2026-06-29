// View "Pilih Tab yang Dikemas" yang ditampilkan di popup.
// Didesain ulang sesuai dengan mockup kedua user:
// - Header dengan judul besar, sub-titel, dan tombol "Open Keep".
// - Checkbox "Select all".
// - List tab dengan checkbox, favicon, dan text title berwarna sky-blue link.
// - Baris tombol di bagian bawah: "Save to tabkeep" (biru), "Copy link" (biru), dan "Paste clipboard link" (hijau zaitun).

import { useEffect, useState } from "react";
import { persistSession } from "~lib/storage";
import { openOrFocusDashboard } from "~lib/navigation";
import type { SavedTab } from "~types";

interface TabItem {
    id: number;
    title: string;
    url: string;
    favIconUrl: string;
}

export function TabPickerView() {
    const [tabs, setTabs] = useState<TabItem[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

    useEffect(() => {
        chrome.tabs.query({ currentWindow: true }).then((allTabs) => {
            const filtered = allTabs.filter(
                (t) => t.url && !t.url.includes("dashboard.html")
            ) as TabItem[];
            setTabs(filtered);
            // Default: semua dipilih
            setSelected(new Set(filtered.map((t) => t.id).filter((id): id is number => id !== undefined)));
        });
    }, []);

    const handleTabClick = (e: React.MouseEvent, clickedId: number, clickedIndex: number) => {
        // Jika mengklik elemen link (A), jangan ubah status check/uncheck
        if ((e.target as HTMLElement).tagName === "A") {
            return;
        }

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

    const handleSave = async () => {
        if (selected.size === 0) return;
        setSaving(true);
        const tabIdsToClose = [...selected];

        // Fetch screenshots dari background cache (dengan fallback timeout 500ms)
        let screenshots: Record<number, string> = {};
        try {
            screenshots = await new Promise((resolve) => {
                const timer = setTimeout(() => {
                    resolve({});
                }, 500);

                chrome.runtime.sendMessage(
                    { action: "getScreenshots", tabIds: tabIdsToClose },
                    (response) => {
                        clearTimeout(timer);
                        if (chrome.runtime.lastError) {
                            // Diamkan error jika background tidak responsif
                        }
                        resolve(response || {});
                    }
                );
            });
        } catch (e) {
            // Abaikan error
        }

        const tabsToSave: SavedTab[] = tabs
            .filter((t) => selected.has(t.id))
            .map((t) => ({
                title: t.title || "No Title",
                url: t.url,
                favIconUrl: t.favIconUrl,
                screenshot: screenshots[t.id]
            }));

        await persistSession(tabsToSave);
        chrome.tabs.remove(tabIdsToClose);
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
                // Tutup popup secara otomatis setelah membuka tab
                window.close();
            } else {
                alert("Tidak ada link URL valid yang ditemukan di clipboard.");
            }
        } catch (err) {
            console.error("Gagal membaca clipboard atau membuka tab: ", err);
            alert("Gagal membaca clipboard. Pastikan izin akses clipboard aktif.");
        }
    };

    const allSelected = tabs.length > 0 && selected.size === tabs.length;
    const noneSelected = selected.size === 0;

    return (
        <div className="flex flex-col p-4 bg-[#111111] text-white rounded-lg select-none" style={{ maxHeight: "560px" }}>
            {/* TOP BAR / HEADER */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-white leading-none">Tabkeep</h2>
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">TAB MANAGER</span>
                    </div>
                </div>
                <button
                    onClick={openOrFocusDashboard}
                    className="bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[11px] px-3.5 py-1.5 rounded font-bold transition-all shadow-md active:scale-95"
                >
                    Open Keep
                </button>
            </div>

            {/* SELECT ALL CHECKBOX */}
            <label className="flex items-center gap-2.5 pb-2 mb-2 border-b border-white/5 cursor-pointer hover:opacity-85 select-none">
                <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-gray-600 bg-transparent text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-gray-300 font-semibold">Select all</span>
            </label>

            {/* TAB LIST */}
            <div className="overflow-y-auto flex-1 max-h-[320px] custom-scrollbar space-y-1 py-1">
                {tabs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500 italic">
                        Tidak ada tab aktif di window ini
                    </div>
                ) : (
                    tabs.map((tab, idx) => {
                        const isChecked = selected.has(tab.id);
                        return (
                            <div
                                key={tab.id}
                                onClick={(e) => handleTabClick(e, tab.id, idx)}
                                className={`flex items-center gap-3 py-1.5 rounded transition-all group cursor-pointer ${isChecked ? "bg-white/5" : "hover:bg-white/[0.02]"}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    readOnly
                                    className="w-3.5 h-3.5 rounded border-gray-600 bg-transparent text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer ml-1 pointer-events-none"
                                />

                                <img
                                    src={tab.favIconUrl || "https://www.google.com/s2/favicons?domain=google.com&sz=32"}
                                    className="w-3.5 h-3.5 flex-shrink-0 rounded-sm"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=google.com"; }}
                                />

                                <div className="flex-1 min-w-0 pr-2">
                                    <a
                                        href={tab.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-[#38bdf8] hover:text-[#7dd3fc] hover:underline font-semibold block truncate leading-tight"
                                        title={tab.title}
                                    >
                                        {tab.title || "Untitled"}
                                    </a>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* BOTTOM BUTTON BAR */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={noneSelected || saving}
                        className={`text-xs font-bold px-3 py-2 rounded transition-all shadow-sm ${
                            noneSelected || saving
                                ? "bg-[#222] text-gray-600 cursor-not-allowed"
                                : "bg-[#0ea5e9] hover:bg-[#0284c7] text-white active:scale-95"
                        }`}
                    >
                        {saving ? "Saving..." : "Save to tabkeep"}
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={noneSelected}
                        className={`text-xs font-bold px-3 py-2 rounded transition-all shadow-sm ${
                            noneSelected
                                ? "bg-[#222] text-gray-600 cursor-not-allowed"
                                : "bg-[#0ea5e9] hover:bg-[#0284c7] text-white active:scale-95"
                        }`}
                    >
                        {copied ? "Copied!" : "Copy link"}
                    </button>
                </div>
                <button
                    onClick={handlePasteClipboard}
                    className="bg-[#707530] hover:bg-[#616527] text-white text-xs font-bold px-3 py-2 rounded transition-all shadow-sm active:scale-95"
                >
                    Paste clipboard link
                </button>
            </div>
        </div>
    );
}
