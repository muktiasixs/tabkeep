import React, { useState } from "react";
import { X, Upload, Download, Globe } from "lucide-react";
import { useTabkeepStorage } from "~hooks/useTabkeepStorage";
import { updateSessions, updateSettings } from "~lib/storage";
import type { Session, Settings } from "~types";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    // We can pass current theme or other props here if needed
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { sessions, setSessions, settings } = useTabkeepStorage();
    const [importData, setImportData] = useState("");

    const exportData = sessions.map(session => session.tabs.map(tab => tab.url).join("\n")).join("\n\n");

    const handleImport = async () => {
        if (!importData.trim()) return;
        const sessionBlocks = importData.split(/\n\s*\n/);
        const newSessions: Session[] = sessionBlocks.map(block => {
            const urls = block.split("\n").map(line => line.trim()).filter(line => line.length > 0);
            return {
                id: `session-imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: "Imported Session",
                tabs: urls.map(url => ({ title: url, url: url })),
                timestamp: new Date().toLocaleString(),
                folderId: null
            };
        }).filter(session => session.tabs.length > 0);

        if (newSessions.length > 0) {
            const updatedSessions = [...newSessions, ...sessions];
            setSessions(updatedSessions);
            await updateSessions(updatedSessions);
            setImportData("");
            alert(`Berhasil mengimpor ${newSessions.length} sesi!`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-[#f5f5f7] dark:bg-[#171717] w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 dark:border-[#333] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#333]">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        Setting
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg bg-gray-200 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8 text-gray-800 dark:text-gray-200">

                    {/* When restoring tabs */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border border-gray-200 dark:border-[#333]">
                        <h3 className="font-bold mb-3 text-sm">When restoring tabs:</h3>
                        <div className="flex flex-col gap-3">
                            <label className="flex gap-3 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="restoreOption" 
                                    className="mt-1" 
                                    checked={settings.restoreOption === "remove"} 
                                    onChange={() => updateSettings({ ...settings, restoreOption: "remove" })}
                                />
                                <div>
                                    <div className="font-semibold text-sm">Remove them from your list</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Hold the Ctrl or Cmd key to open tabs in the background.</div>
                                </div>
                            </label>
                            <label className="flex gap-3 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="restoreOption" 
                                    className="mt-1" 
                                    checked={settings.restoreOption === "keep"} 
                                    onChange={() => updateSettings({ ...settings, restoreOption: "keep" })}
                                />
                                <div>
                                    <div className="font-semibold text-sm">Keep them in your list</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Hold the Ctrl or Cmd key to open tabs in the background.</div>
                                </div>
                            </label>
                            <label className="flex gap-3 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="restoreOption" 
                                    className="mt-1" 
                                    checked={settings.restoreOption === "archived"} 
                                    onChange={() => updateSettings({ ...settings, restoreOption: "archived" })}
                                />
                                <div>
                                    <div className="font-semibold text-sm">Mark them as archived</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Restoring tabs will mark it and give it a gray striped background, this provides a visual indicator that you have read or interacted with the tabs.</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Duplicates */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border border-gray-200 dark:border-[#333]">
                        <h3 className="font-bold mb-3 text-sm">Duplicates:</h3>
                        <div className="flex flex-col gap-3">
                            <label className="flex gap-3 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="duplicateOption" 
                                    className="mt-1" 
                                    checked={settings.duplicateOption === "allow"} 
                                    onChange={() => updateSettings({ ...settings, duplicateOption: "allow" })}
                                />
                                <div>
                                    <div className="font-semibold text-sm">Allow duplicates</div>
                                </div>
                            </label>
                            <label className="flex gap-3 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="duplicateOption" 
                                    className="mt-1" 
                                    checked={settings.duplicateOption === "reject"} 
                                    onChange={() => updateSettings({ ...settings, duplicateOption: "reject" })}
                                />
                                <div>
                                    <div className="font-semibold text-sm">Silently reject duplicates</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">If Tabkeep already contains the tab, it will not be added again.</div>
                                </div>
                            </label>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-4 italic">This setting can be overridden inside the main popup window (if you've enabled the option popup).</p>
                    </div>

                    {/* URL display */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border border-gray-200 dark:border-[#333]">
                        <h3 className="font-bold mb-3 text-sm">URL display:</h3>
                        <div className="flex flex-col gap-4">

                            {/* None */}
                            <label className="flex gap-3 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="urlDisplayOption" 
                                    className="mt-1" 
                                    checked={settings.urlDisplayOption === "none"} 
                                    onChange={() => updateSettings({ ...settings, urlDisplayOption: "none" })}
                                />
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="font-semibold text-sm">None</div>
                                    <div className="bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg p-3 flex items-start gap-3 w-11/12 max-w-md">
                                        <Globe size={16} className="text-gray-400 dark:text-blue-400 shrink-0 mt-0.5" />
                                        <div className="flex flex-col">
                                            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Example website page title</span>
                                        </div>
                                    </div>
                                </div>
                            </label>

                            {/* Domain only */}
                            <label className="flex gap-3 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="urlDisplayOption" 
                                    className="mt-1" 
                                    checked={settings.urlDisplayOption === "domain"} 
                                    onChange={() => updateSettings({ ...settings, urlDisplayOption: "domain" })}
                                />
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="font-semibold text-sm">Domain only</div>
                                    <div className="bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg p-3 flex items-start gap-3 w-11/12 max-w-md">
                                        <Globe size={16} className="text-gray-400 dark:text-blue-400 shrink-0 mt-0.5" />
                                        <div className="flex flex-col">
                                            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Example website page title</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">example.com</span>
                                        </div>
                                    </div>
                                </div>
                            </label>

                            {/* Abbreviated */}
                            <label className="flex gap-3 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="urlDisplayOption" 
                                    className="mt-1" 
                                    checked={settings.urlDisplayOption === "abbreviated"} 
                                    onChange={() => updateSettings({ ...settings, urlDisplayOption: "abbreviated" })}
                                />
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="font-semibold text-sm">Abbreviated</div>
                                    <div className="bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg p-3 flex items-start gap-3 w-11/12 max-w-xl">
                                        <Globe size={16} className="text-gray-400 dark:text-blue-400 shrink-0 mt-0.5" />
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Example website page title</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full block mt-1">www.example.com/abc/def?g=01234567890123456789&h=01234567890123...</span>
                                        </div>
                                    </div>
                                </div>
                            </label>

                            {/* Full */}
                            <label className="flex gap-3 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="urlDisplayOption" 
                                    className="mt-1" 
                                    checked={settings.urlDisplayOption === "full"} 
                                    onChange={() => updateSettings({ ...settings, urlDisplayOption: "full" })}
                                />
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="font-semibold text-sm">Full</div>
                                    <div className="bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg p-3 flex items-start gap-3 w-11/12 max-w-2xl">
                                        <Globe size={16} className="text-gray-400 dark:text-blue-400 shrink-0 mt-0.5" />
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Example website page title</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 break-all mt-1">www.example.com/abc/def?g=01234567890123456789&h=01234567890123456789&i=01234567890123456789&k=01234567890123456789</span>
                                        </div>
                                    </div>
                                </div>
                            </label>

                        </div>
                    </div>

                    {/* Backup / Export */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-black mb-3">Backup / Export</h3>
                        <textarea
                            className="w-full h-32 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-blue-500 mb-2"
                            readOnly
                            value={exportData}
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={() => navigator.clipboard.writeText(exportData)}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 px-6 rounded-lg transition-colors text-sm"
                            >
                                Copy all
                            </button>
                        </div>
                    </div>

                    {/* Import */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-black mb-3">Import</h3>
                        <textarea
                            className="w-full h-32 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-lg p-3 text-sm font-mono mb-2 focus:outline-none focus:border-blue-500 whitespace-pre"
                            placeholder="Paste here.."
                            value={importData}
                            onChange={(e) => setImportData(e.target.value)}
                        />
                        <div className="flex justify-between items-end w-full">
                            <label className="flex flex-col items-center justify-center w-32 h-24 border-2 border-dashed border-gray-300 dark:border-[#444] rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                                <Upload size={24} className="text-gray-400 mb-2" />
                                <span className="text-[10px] text-gray-500 text-center px-2">Upload JSON file here</span>
                                <input type="file" className="hidden" accept=".json" />
                            </label>
                            <button
                                onClick={handleImport}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-lg transition-colors h-fit text-sm"
                            >
                                Import
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
