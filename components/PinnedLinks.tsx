import React, { useState } from "react";
import { Pin, X, Plus, ExternalLink } from "lucide-react";
import type { PinnedLink } from "~types";

interface Props {
    pinnedLinks: PinnedLink[];
    onUnpin: (id: string) => void;
    onAdd: (link: { title: string; url: string; favIconUrl?: string }) => void;
    theme?: string;
}

export function PinnedLinks({ pinnedLinks, onUnpin, onAdd, theme }: Props) {
    const [isAdding, setIsAdding] = useState(false);
    const [inputUrl, setInputUrl] = useState("");

    const handleAdd = () => {
        const url = inputUrl.trim();
        if (!url) { setIsAdding(false); return; }
        const fullUrl = url.startsWith("http") ? url : `https://${url}`;
        let hostname = "";
        try { hostname = new URL(fullUrl).hostname; } catch { }
        const title = hostname || fullUrl;
        const favIconUrl = hostname
            ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
            : "";
        onAdd({ title, url: fullUrl, favIconUrl });
        setInputUrl("");
        setIsAdding(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleAdd();
        if (e.key === "Escape") { setIsAdding(false); setInputUrl(""); }
    };

    return (
        <div className="mb-4">
            {/* Section header */}
            <div className="mb-2 px-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Pin size={11} className="text-gray-400 dark:text-gray-600" />
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] opacity-70">Pinned</span>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    title="Pin link baru"
                    className="text-gray-400 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors rounded p-0.5"
                >
                    <Plus size={12} />
                </button>
            </div>

            {/* Add input */}
            {isAdding && (
                <div className="mx-1 mb-2 flex items-center gap-2 px-2 py-1.5 rounded-md bg-gray-50 dark:bg-[#252525] border border-blue-500/40">
                    <Pin size={11} className="text-blue-400 flex-shrink-0" />
                    <input
                        autoFocus
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleAdd}
                        placeholder="Masukkan URL..."
                        className="flex-1 bg-transparent text-xs text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 min-w-0"
                    />
                </div>
            )}

            {/* Pin list */}
            <div className="space-y-0.5">
                {pinnedLinks.length === 0 && !isAdding ? (
                    <p className="text-[10px] text-gray-400 dark:text-gray-700 italic px-2 py-1">
                        Belum ada link yang di-pin
                    </p>
                ) : (
                    pinnedLinks.map((link) => (
                        <div
                            key={link.id}
                            className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors cursor-pointer"
                            onClick={() => chrome.tabs.create({ url: link.url, active: true })}
                            title={link.url}
                        >
                            <img
                                src={link.favIconUrl || `https://www.google.com/s2/favicons?domain=${link.url}&sz=32`}
                                className="w-3.5 h-3.5 flex-shrink-0 opacity-70 group-hover:opacity-100 rounded-sm"
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=google.com"; }}
                                draggable={false}
                            />
                            <span className="flex-1 text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white truncate transition-colors">
                                {link.title}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <ExternalLink size={10} className="text-gray-400 dark:text-gray-600" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUnpin(link.id); }}
                                    title="Unpin"
                                    className="text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                    <X size={11} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Divider */}
            {(pinnedLinks.length > 0 || isAdding) && (
                <div className="border-t border-gray-100 dark:border-white/5 mt-3 mb-1" />
            )}
        </div>
    );
}
