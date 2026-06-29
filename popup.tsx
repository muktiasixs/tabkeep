import { useState } from "react"
import "~style.css"
import { TabPickerView } from "~components/TabPickerView"
import { persistSession } from "~lib/storage"
import { openOrFocusDashboard } from "~lib/navigation"
import type { SavedTab } from "~types"

type View = "home" | "pick"

function IndexPopup() {
    const [view, setView] = useState<View>("home");

    const saveAllTabs = async () => {
        const allTabs = await chrome.tabs.query({ currentWindow: true });
        const tabsToSave: SavedTab[] = allTabs
            .filter((tab) => tab.url && !tab.url.includes("dashboard.html"))
            .map((tab) => ({
                title: tab.title || "No Title",
                url: tab.url || "",
                favIconUrl: tab.favIconUrl || ""
            }));

        if (tabsToSave.length === 0) return;

        const idsToClose = allTabs
            .filter((tab) => tab.url && !tab.url.includes("dashboard.html"))
            .map((t) => t.id)
            .filter((id): id is number => id !== undefined);

        await persistSession(tabsToSave);
        chrome.tabs.remove(idsToClose);
        await openOrFocusDashboard();
    };

    if (view === "pick") {
        return (
            <div className="w-72 bg-[#0F0F0F] text-white border border-[#1e1e1e]">
                <TabPickerView onBack={() => setView("home")} />
            </div>
        );
    }

    return (
        <div className="w-72 bg-[#0F0F0F] text-white border border-[#1e1e1e]">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-[#1e1e1e]">
                <h2 className="text-xl font-black italic tracking-tighter text-white">
                    Tab<span className="text-blue-500">keep</span>
                </h2>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">Tab Manager</p>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-2">
                <button
                    onClick={saveAllTabs}
                    className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                >
                    <span className="text-lg">📦</span>
                    <div className="text-left">
                        <div>Kemas Semua Tab</div>
                        <div className="text-[10px] text-blue-200/60 font-normal">Simpan & tutup semua tab</div>
                    </div>
                </button>

                <button
                    onClick={() => setView("pick")}
                    className="w-full flex items-center gap-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-[#3a3a3a] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                >
                    <span className="text-lg">🗂️</span>
                    <div className="text-left">
                        <div>Pilih Tab yang Dikemas</div>
                        <div className="text-[10px] text-gray-600 font-normal">Centang tab yang ingin disimpan</div>
                    </div>
                </button>

                <div className="pt-1 border-t border-[#1e1e1e]">
                    <button
                        onClick={openOrFocusDashboard}
                        className="w-full text-gray-600 hover:text-gray-300 py-2 text-xs font-medium transition-colors hover:bg-[#1a1a1a] rounded-lg"
                    >
                        Buka Dashboard →
                    </button>
                </div>
            </div>
        </div>
    );
}

export default IndexPopup;