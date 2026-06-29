// View "Pilih Tab yang Dikemas" yang ditampilkan di popup.
// Dipisah agar popup.tsx tetap ramping dan komponen ini bisa ditest sendiri.

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

interface Props {
    onBack: () => void;
}

export function TabPickerView({ onBack }: Props) {
    const [tabs, setTabs] = useState<TabItem[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [saving, setSaving] = useState(false);

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

    const toggleTab = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        setSelected(selected.size === tabs.length ? new Set() : new Set(tabs.map((t) => t.id)));
    };

    const handleSave = async () => {
        if (selected.size === 0) return;
        setSaving(true);
        const tabsToSave: SavedTab[] = tabs
            .filter((t) => selected.has(t.id))
            .map((t) => ({ title: t.title || "No Title", url: t.url, favIconUrl: t.favIconUrl }));
        await persistSession(tabsToSave);
        chrome.tabs.remove([...selected]);
        await openOrFocusDashboard();
    };

    const allSelected = tabs.length > 0 && selected.size === tabs.length;
    const noneSelected = selected.size === 0;

    return (
        <div className="flex flex-col" style={{ maxHeight: "560px" }}>
            {/* Header */}
            <div className="px-4 pt-3 pb-2 border-b border-[#1e1e1e] flex items-center gap-2 shrink-0">
                <button
                    onClick={onBack}
                    className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
                    title="Kembali"
                >
                    ←
                </button>
                <div className="flex-1">
                    <h2 className="text-sm font-bold text-white">Pilih Tab</h2>
                    <p className="text-[10px] text-gray-600">{selected.size} dari {tabs.length} dipilih</p>
                </div>
                <button
                    onClick={toggleAll}
                    className="text-[10px] text-blue-500 hover:text-blue-400 font-bold transition-colors"
                >
                    {allSelected ? "Batal Semua" : "Pilih Semua"}
                </button>
            </div>

            {/* Daftar tab */}
            <div className="overflow-y-auto flex-1 py-1">
                {tabs.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-600 italic">
                        Tidak ada tab yang bisa disimpan
                    </div>
                ) : (
                    tabs.map((tab) => {
                        const isChecked = selected.has(tab.id);
                        return (
                            <label
                                key={tab.id}
                                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors group ${isChecked ? "bg-blue-600/10" : "hover:bg-[#1a1a1a]"}`}
                            >
                                {/* Checkbox custom */}
                                <div
                                    className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-all ${isChecked ? "bg-blue-600 border-blue-600" : "border-[#444] group-hover:border-[#666]"}`}
                                    onClick={() => toggleTab(tab.id)}
                                >
                                    {isChecked && (
                                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                                            <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>

                                <img
                                    src={tab.favIconUrl || "https://www.google.com/s2/favicons?domain=google.com&sz=32"}
                                    className={`w-4 h-4 flex-shrink-0 rounded-sm transition-opacity ${isChecked ? "opacity-100" : "opacity-50 group-hover:opacity-80"}`}
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=google.com"; }}
                                    onClick={() => toggleTab(tab.id)}
                                />

                                <div className="flex-1 min-w-0" onClick={() => toggleTab(tab.id)}>
                                    <div className={`text-xs font-medium truncate transition-colors ${isChecked ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}>
                                        {tab.title || "Untitled"}
                                    </div>
                                    <div className="text-[10px] text-gray-700 truncate">
                                        {tab.url ? new URL(tab.url).hostname : ""}
                                    </div>
                                </div>
                            </label>
                        );
                    })
                )}
            </div>

            {/* Footer tombol simpan */}
            <div className="p-3 border-t border-[#1e1e1e] shrink-0">
                <button
                    onClick={handleSave}
                    disabled={noneSelected || saving}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${noneSelected || saving ? "bg-[#1a1a1a] text-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                >
                    {saving ? "Menyimpan..." : noneSelected ? "Pilih tab dulu" : `Kemas ${selected.size} Tab`}
                </button>
            </div>
        </div>
    );
}
