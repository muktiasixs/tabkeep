import React, { useState, useEffect } from "react";
import { X, BookOpen, FileText, Users, Shield, Heart } from "lucide-react";
import qrDonate from "~assets/qrdonate.png";

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
    const [isRendered, setIsRendered] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(isOpen);
    const [activeTab, setActiveTab] = useState<"about" | "tos">("about");

    useEffect(() => {
        let renderTimer: ReturnType<typeof setTimeout>;
        let visibleTimer: ReturnType<typeof setTimeout>;

        if (isOpen) {
            setIsRendered(true);
            visibleTimer = setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
            renderTimer = setTimeout(() => setIsRendered(false), 200);
        }

        return () => {
            clearTimeout(renderTimer);
            clearTimeout(visibleTimer);
        };
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
        <div onClick={onClose} className={`fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm transition-opacity duration-200 dark:bg-black/60 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={e => e.stopPropagation()} className={`flex h-[calc(100vh-2rem)] max-h-[760px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-200 dark:border-[#333] dark:bg-[#1e1e1e] ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 sm:px-6">
                    <h2 id="about-title" className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen size={20} /> About & Legal
                    </h2>
                    <button
                        aria-label="Close about"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-5 pt-2 dark:border-[#333] sm:px-6">
                    <button
                        onClick={() => setActiveTab("about")}
                        className={`relative flex-1 pb-3 text-sm font-semibold transition-colors ${activeTab === "about" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 hover:text-gray-900 dark:text-white/70 dark:hover:text-white"}`}
                    >
                        <span className="flex items-center justify-center gap-2"><Users size={16} /> About Us</span>
                        {activeTab === "about" && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("tos")}
                        className={`relative flex-1 pb-3 text-sm font-semibold transition-colors ${activeTab === "tos" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 hover:text-gray-900 dark:text-white/70 dark:hover:text-white"}`}
                    >
                        <span className="flex items-center justify-center gap-2"><Shield size={16} /> Terms of Service</span>
                        {activeTab === "tos" && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 text-gray-900 custom-scrollbar dark:text-white sm:p-6">
                    {activeTab === "about" ? (
                        <div className="space-y-4 text-sm leading-relaxed p-2">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 flex items-center gap-2 mb-3">Welcome to Tabkeep</h3>
                            <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed space-y-2 ml-6">
                                <p>
                                    Tabkeep was born out of a simple necessity: we were tired of losing our browser tabs, our research, and our sanity to cluttered browser windows.
                                </p>
                                <p>
                                    Our mission is to provide a clean, fast, and privacy-focused tab management solution that lives entirely inside your browser. We believe your data belongs to you, which is why Tabkeep operates locally by default, with optional secure sync to your own Google Drive.
                                </p>
                            </div>
                            <div className="mt-6 p-4 bg-gray-50/50 dark:bg-[#252525]/50 rounded-xl border border-gray-200/50 dark:border-[#333]/50">
                                <h4 className="font-bold text-gray-800 dark:text-white/90 mb-1">Open Source Commitment</h4>
                                <p className="text-xs text-gray-600 dark:text-white/70">
                                    Tabkeep is built for the community. We are constantly listening to feedback to improve the tab management experience for power users everywhere.
                                </p>
                            </div>

                            <div className="mt-6 flex flex-col items-center justify-center p-6 bg-white/40 dark:bg-black/20 rounded-xl border border-gray-200/50 dark:border-white/10 text-center">
                                <h4 className="font-bold text-gray-800 dark:text-white/90 mb-2 flex items-center justify-center gap-2">
                                    <Heart size={16} className="text-red-500" fill="currentColor" /> Support Tabkeep
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-white/70 mb-4 max-w-sm">
                                    If you find Tabkeep useful, consider buying us a coffee! Your support helps keep this extension free and continuously updated.
                                </p>
                                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 dark:border-[#333]">
                                    <img src={qrDonate} alt="Donate QR Code" className="w-40 h-40 object-contain rounded-lg" />
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-3 font-bold">Scan to Donate</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5 text-sm leading-relaxed p-2">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 flex items-center gap-2 mb-3">Terms of Service</h3>

                            <div className="ml-6">
                                <h4 className="font-bold text-gray-800 dark:text-white/90 mb-1">1. Acceptance of Terms</h4>
                                <p className="text-sm text-gray-600 dark:text-white/70">By using the Tabkeep extension, you agree to these terms. If you do not agree, please do not use the extension.</p>
                            </div>

                            <div className="ml-6">
                                <h4 className="font-bold text-gray-800 dark:text-white/90 mb-1">2. Data Privacy & Storage</h4>
                                <p className="text-sm text-gray-600 dark:text-white/70">
                                    Tabkeep is designed with privacy in mind. All your tab data, folders, and settings are stored locally on your device. We do not collect, transmit, or sell your personal data to third-party servers.
                                    If you enable Google Drive Sync, your data is securely transferred and stored only in your personal Google Drive account.
                                </p>
                            </div>

                            <div className="ml-6">
                                <h4 className="font-bold text-gray-800 dark:text-white/90 mb-1">3. Permissions</h4>
                                <p className="text-sm text-gray-600 dark:text-white/70">
                                    Tabkeep requires certain browser permissions (such as reading your browsing tabs and accessing storage) strictly for its core functionality. We only use these permissions to save and organize your tabs as requested by you.
                                </p>
                            </div>

                            <div className="ml-6">
                                <h4 className="font-bold text-gray-800 dark:text-white/90 mb-1">4. As-Is Service</h4>
                                <p className="text-sm text-gray-600 dark:text-white/70">
                                    Tabkeep is provided "as is" without warranties of any kind. We are not responsible for any accidental loss of data or tabs. We highly recommend using the Google Drive backup feature to safeguard your sessions.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
