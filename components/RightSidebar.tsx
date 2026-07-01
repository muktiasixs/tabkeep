import React, { useState, useEffect, useMemo } from "react";
import { Globe, Tv, Briefcase, BookOpen, Database, HelpCircle, Activity } from "lucide-react";
import type { Session, SavedTab } from "~types";
import { getThumbnail } from "~lib/db";

interface RightSidebarProps {
    hoveredTab: (SavedTab & { sessionTimestamp?: string; sessionId?: string }) | null;
    allSessions: Session[];
    theme?: string;
}

export function RightSidebar({ hoveredTab, allSessions, theme }: RightSidebarProps) {
    // State to track if the screenshot image is loading or failed
    const [imgState, setImgState] = useState<"loading" | "loaded" | "error">("loading");
    // State to hold the object URL from IndexedDB
    const [idbImage, setIdbImage] = useState<string | null>(null);

    // Reset image state whenever the hovered tab URL changes
    useEffect(() => {
        setImgState("loading");
        
        let objectUrl: string | null = null;
        
        const fetchImage = async () => {
            if (hoveredTab?.url) {
                const blob = await getThumbnail(hoveredTab.url);
                if (blob) {
                    objectUrl = URL.createObjectURL(blob);
                    setIdbImage(objectUrl);
                } else {
                    setIdbImage(null);
                }
            } else {
                setIdbImage(null);
            }
        };
        
        fetchImage();
        
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [hoveredTab?.url]);

    // Helpers to classify URLs
    const classifyTab = (url: string): "Ent" | "Work" | "Res" | "Other" => {
        if (!url) return "Other";
        const lowercaseUrl = url.toLowerCase();

        // Entertainment
        if (
            lowercaseUrl.includes("youtube.com") ||
            lowercaseUrl.includes("netflix.com") ||
            lowercaseUrl.includes("twitch.tv") ||
            lowercaseUrl.includes("tiktok.com") ||
            lowercaseUrl.includes("spotify.com") ||
            lowercaseUrl.includes("disneyplus.com") ||
            lowercaseUrl.includes("primevideo.com") ||
            lowercaseUrl.includes("hulu.com") ||
            lowercaseUrl.includes("roblox.com") ||
            lowercaseUrl.includes("anime") ||
            lowercaseUrl.includes("manga") ||
            lowercaseUrl.includes("game")
        ) {
            return "Ent";
        }

        // Work/Development
        if (
            lowercaseUrl.includes("github.com") ||
            lowercaseUrl.includes("gitlab.com") ||
            lowercaseUrl.includes("stackoverflow.com") ||
            lowercaseUrl.includes("figma.com") ||
            lowercaseUrl.includes("slack.com") ||
            lowercaseUrl.includes("trello.com") ||
            lowercaseUrl.includes("jira") ||
            lowercaseUrl.includes("vercel.com") ||
            lowercaseUrl.includes("npmjs.com") ||
            lowercaseUrl.includes("google.com/docs") ||
            lowercaseUrl.includes("docs.google.com") ||
            lowercaseUrl.includes("drive.google.com") ||
            lowercaseUrl.includes("localhost") ||
            lowercaseUrl.endsWith(".ts") ||
            lowercaseUrl.endsWith(".tsx") ||
            lowercaseUrl.endsWith(".json")
        ) {
            return "Work";
        }

        // Research/Resources
        if (
            lowercaseUrl.includes("wikipedia.org") ||
            lowercaseUrl.includes("medium.com") ||
            lowercaseUrl.includes("reddit.com") ||
            lowercaseUrl.includes("dev.to") ||
            lowercaseUrl.includes("google.com/search") ||
            lowercaseUrl.includes("bing.com") ||
            lowercaseUrl.includes("duckduckgo.com") ||
            lowercaseUrl.includes("developer.mozilla") ||
            lowercaseUrl.includes("w3schools.com")
        ) {
            return "Res";
        }

        return "Other";
    };

    // Calculate dynamic analytics from all sessions
    const analytics = useMemo(() => {
        let entCount = 0;
        let workCount = 0;
        let resCount = 0;
        let otherCount = 0;
        let totalTabsCount = 0;

        allSessions.forEach(session => {
            session.tabs.forEach(tab => {
                totalTabsCount++;
                const cat = classifyTab(tab.url);
                if (cat === "Ent") entCount++;
                else if (cat === "Work") workCount++;
                else if (cat === "Res") resCount++;
                else otherCount++;
            });
        });

        const pct = (count: number) => {
            if (totalTabsCount === 0) return 0;
            return Math.round((count / totalTabsCount) * 100);
        };

        const entPct = pct(entCount);
        const workPct = pct(workCount);
        const resPct = pct(resCount);
        // Ensure they add up to 100%
        const otherPct = totalTabsCount === 0 ? 0 : 100 - (entPct + workPct + resPct);

        // Memory savings calculation (~75MB per tab)
        const savedMemoryMB = totalTabsCount * 75;
        const memoryFormatted =
            savedMemoryMB >= 1000
                ? `${(savedMemoryMB / 1024).toFixed(1)} GB`
                : `${savedMemoryMB} MB`;

        // 7-day Activity Trend
        const getSessionDate = (session: Session): Date => {
            const parts = session.id.split("-");
            if (parts.length > 1) {
                const ms = parseInt(parts[1], 10);
                if (!isNaN(ms)) return new Date(ms);
            }
            return new Date(session.timestamp);
        };

        const now = new Date();
        const dailyCounts = Array(7).fill(0);
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(now.getDate() - (6 - i));
            return d;
        });

        allSessions.forEach(session => {
            const sessionDate = getSessionDate(session);
            const diffDays = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 7) {
                const index = 6 - diffDays;
                dailyCounts[index] += session.tabs.length;
            }
        });

        const maxCount = Math.max(...dailyCounts, 1);
        const chartData = last7Days.map((date, idx) => ({
            label: dayNames[date.getDay()],
            count: dailyCounts[idx],
            heightPct: Math.round((dailyCounts[idx] / maxCount) * 100),
            isToday: idx === 6
        }));

        return {
            entPct,
            workPct,
            resPct,
            otherPct,
            totalTabsCount,
            memoryFormatted,
            chartData
        };
    }, [allSessions]);

    // Parse the relative time for the hovered tab
    const relativeTime = useMemo(() => {
        if (!hoveredTab) return "";
        let tabDate: Date | null = null;

        if (hoveredTab.sessionId) {
            const parts = hoveredTab.sessionId.split("-");
            if (parts.length > 1) {
                const ms = parseInt(parts[1], 10);
                if (!isNaN(ms)) tabDate = new Date(ms);
            }
        }
        if (!tabDate && hoveredTab.sessionTimestamp) {
            tabDate = new Date(hoveredTab.sessionTimestamp);
        }

        if (!tabDate || isNaN(tabDate.getTime())) return hoveredTab.sessionTimestamp || "Recently";

        const now = new Date();
        const diffMs = now.getTime() - tabDate.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${tabDate.toLocaleDateString()} - ${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        } else if (diffMins > 0) {
            return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
        } else {
            return "Just now";
        }
    }, [hoveredTab]);

    // Determine if we have a local screenshot or need a remote one
    const localScreenshot = idbImage || hoveredTab?.screenshot;
    const showRemoteScreenshot = !localScreenshot && hoveredTab && hoveredTab.url.startsWith("http");
    const remoteScreenshotUrl = showRemoteScreenshot
        ? `https://image.thum.io/get/width/400/crop/800/${hoveredTab.url}`
        : "";

    // Fallback UI helper
    const renderFallbackPreview = () => {
        if (!hoveredTab) return null;
        let IconComponent = Globe;
        let categoryName = "Web Page";

        if (hoveredTab.url.startsWith("chrome://") || hoveredTab.url.startsWith("about:")) {
            IconComponent = Database;
            categoryName = "System Tab";
        } else if (hoveredTab.url.includes("localhost") || hoveredTab.url.includes("127.0.0.1")) {
            IconComponent = Briefcase;
            categoryName = "Development";
        }

        return (
            <div className="w-full h-full bg-gradient-to-br from-gray-200/50 via-gray-100/30 to-gray-50 dark:from-gray-800/40 dark:via-gray-900/30 dark:to-black flex flex-col items-center justify-center p-4 text-center">
                <IconComponent className="text-gray-400 dark:text-gray-600 mb-2" size={36} />
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-black">{categoryName}</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-600 truncate max-w-full mt-1 px-4">{hoveredTab.url}</span>
            </div>
        );
    };

    return (
        <aside className="w-80 bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-[#333] p-5 overflow-y-auto shrink-0 flex flex-col gap-6 z-10 shadow-lg transition-colors duration-200">
            {/* LAST VIEW TAB PANEL (BLUE BOX) */}
            <div className="border border-gray-200 dark:border-blue-500/30 bg-gray-50 dark:bg-[#252525]/60 rounded-xl p-4 flex flex-col shadow-inner select-none transition-all">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-widest">Last View Tab</span>
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                </div>

                {hoveredTab ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 italic tracking-tight" title={hoveredTab.title}>
                                {hoveredTab.title || "Untitled Tab"}
                            </h4>
                            <a
                                href={hoveredTab.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-blue-600 dark:text-blue-500 hover:underline truncate hover:text-blue-400 font-medium"
                            >
                                {hoveredTab.url}
                            </a>
                        </div>

                        {/* Image Preview Container */}
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-center">
                            {localScreenshot ? (
                                <img
                                    src={localScreenshot}
                                    alt={hoveredTab.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : showRemoteScreenshot && imgState !== "error" ? (
                                <>
                                    {imgState === "loading" && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    <img
                                        src={remoteScreenshotUrl}
                                        alt={hoveredTab.title}
                                        onLoad={() => setImgState("loaded")}
                                        onError={() => setImgState("error")}
                                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                                            imgState === "loaded" ? "opacity-100" : "opacity-0"
                                        }`}
                                    />
                                </>
                            ) : (
                                renderFallbackPreview()
                            )}
                        </div>

                        <span className="text-[9px] text-gray-500 font-mono italic text-right mt-1">
                            {relativeTime}
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Globe className="text-gray-700 mb-2 animate-pulse" size={24} />
                        <p className="text-xs text-gray-600 italic">Hover any tab to preview</p>
                    </div>
                )}
            </div>

            {/* SYSTEM ANALYTICS PANEL (RED BOX) */}
            <div className="border border-gray-200 dark:border-red-500/20 bg-gray-50 dark:bg-[#252525]/30 rounded-xl p-4 flex flex-col shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-[#333] pb-2">
                    <Activity className="text-red-500 dark:text-red-400" size={16} />
                    <span className="text-[10px] text-gray-700 dark:text-gray-200 font-black uppercase tracking-widest">System Analytics</span>
                </div>

                {/* Tab Usage Distribution */}
                <div className="flex flex-col gap-2 mb-5">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400">
                        <span>Tab Usage Distribution</span>
                    </div>
                    {/* Segmented bar chart */}
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-[#171717] overflow-hidden flex">
                        {analytics.totalTabsCount > 0 ? (
                            <>
                                <div
                                    style={{ width: `${analytics.workPct}%` }}
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    title={`Work: ${analytics.workPct}%`}
                                ></div>
                                <div
                                    style={{ width: `${analytics.entPct}%` }}
                                    className="h-full bg-purple-500 transition-all duration-500"
                                    title={`Entertainment: ${analytics.entPct}%`}
                                ></div>
                                <div
                                    style={{ width: `${analytics.resPct}%` }}
                                    className="h-full bg-emerald-500 transition-all duration-500"
                                    title={`Research: ${analytics.resPct}%`}
                                ></div>
                                <div
                                    style={{ width: `${analytics.otherPct}%` }}
                                    className="h-full bg-gray-500 transition-all duration-500"
                                    title={`Others: ${analytics.otherPct}%`}
                                ></div>
                            </>
                        ) : (
                            <div className="w-full h-full bg-[#2a2a2a]"></div>
                        )}
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[9px] font-bold text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Work {analytics.workPct}%
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Ent. {analytics.entPct}%
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Res. {analytics.resPct}%
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> Other {analytics.otherPct}%
                        </span>
                    </div>
                </div>

                {/* Memory Impact Card */}
                <div className="bg-white dark:bg-[#171717] rounded-lg p-3 border border-gray-200 dark:border-[#2a2a2a] flex justify-between items-center mb-5 hover:border-red-500/20 transition-colors shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-2">
                        <Database className="text-gray-400 dark:text-gray-500" size={14} />
                        <span className="text-[11px] text-gray-600 dark:text-gray-400 font-semibold">Memory Saved</span>
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white font-mono">{analytics.memoryFormatted}</span>
                </div>

                {/* Activity Trend (7d) */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Activity Trend (7d)</span>
                    <div className="h-20 flex items-end justify-between px-1 bg-white dark:bg-[#171717]/60 rounded-lg p-2 border border-gray-200 dark:border-[#2a2a2a]/40 pt-4 shadow-sm dark:shadow-none">
                        {analytics.chartData.map((day, idx) => (
                            <div key={idx} className="flex flex-col items-center flex-1 gap-1">
                                <div
                                    style={{ height: `${day.heightPct ? Math.max(day.heightPct * 0.4, 4) : 4}px` }}
                                    className={`w-4 rounded-t-sm transition-all duration-500 ${
                                        day.isToday
                                            ? "bg-gradient-to-t from-blue-600 to-blue-400 shadow-md shadow-blue-500/20"
                                            : "bg-gray-200 dark:bg-[#2b2b2b] hover:bg-gray-300 dark:hover:bg-[#3b3b3b]"
                                    }`}
                                    title={`${day.count} tabs saved on ${day.label}`}
                                ></div>
                                <span className="text-[8px] font-bold text-gray-500 dark:text-gray-600 font-mono">{day.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}
