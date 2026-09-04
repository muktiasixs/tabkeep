import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { Folder, SavedTab, Session } from "~types";

interface GraphViewProps {
    folders: Folder[];
    sessions: Session[];
    theme: "light" | "dark";
    onSelectSession?: (session: Session) => void;
    onSelectTab?: (tab: SavedTab, session: Session) => void;
}

type GraphNode = {
    id: string;
    type: "root" | "folder" | "session" | "tab";
    name: string;
    count: number;
    folderId?: string;
    session?: Session;
    tab?: SavedTab;
    favIconUrl?: string;
    x?: number;
    y?: number;
};

export function GraphView({ folders, sessions, theme, onSelectSession, onSelectTab }: GraphViewProps) {
    const graphRef = useRef<any>();
    const containerRef = useRef<HTMLDivElement>(null);
    const imageCache = useRef(new Map<string, HTMLImageElement>());
    const [folderId, setFolderId] = useState<string | "all" | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [size, setSize] = useState({ width: 800, height: 600 });
    const isDark = theme === "dark";

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (folderId && folderId !== "all" && !folders.some((folder) => folder.id === folderId)) setFolderId(null);
        if (sessionId && !sessions.some((session) => session.id === sessionId)) setSessionId(null);
    }, [folderId, folders, sessionId, sessions]);

    const graphData = useMemo(() => {
        const nodes: GraphNode[] = [];
        const links: { source: string; target: string }[] = [];
        const selectedSession = sessions.find((session) => session.id === sessionId);

        if (selectedSession) {
            const parentId = `session-${selectedSession.id}`;
            nodes.push({
                id: parentId,
                type: "session",
                name: selectedSession.name,
                count: selectedSession.tabs.length,
                session: selectedSession,
                favIconUrl: selectedSession.tabs[0]?.favIconUrl
            });
            selectedSession.tabs.forEach((tab, index) => {
                const id = `tab-${selectedSession.id}-${index}`;
                nodes.push({ id, type: "tab", name: tab.title || tab.url, count: 0, session: selectedSession, tab, favIconUrl: tab.favIconUrl });
                links.push({ source: parentId, target: id });
            });
        } else if (!folderId) {
            nodes.push({
                id: "root",
                type: "root",
                name: "All Sessions",
                count: sessions.reduce((total, session) => total + session.tabs.length, 0)
            });

            const sessionCounts = new Map<string | null, number>();
            sessions.forEach((session) => {
                sessionCounts.set(session.folderId, (sessionCounts.get(session.folderId) || 0) + session.tabs.length);
            });

            folders.forEach((folder) => {
                const id = `folder-${folder.id}`;
                nodes.push({ id, type: "folder", name: folder.name, count: sessionCounts.get(folder.id) || 0, folderId: folder.id });
                links.push({ source: "root", target: id });
            });
        } else {
            const scopedSessions = folderId === "all" ? sessions : sessions.filter((session) => session.folderId === folderId);
            const folder = folders.find((item) => item.id === folderId);
            if (folderId !== "all" && !folder) return { nodes, links };

            const parentId = folderId === "all" ? "root" : `folder-${folder!.id}`;
            nodes.push({
                id: parentId,
                type: folderId === "all" ? "root" : "folder",
                name: folderId === "all" ? "All Sessions" : folder!.name,
                count: scopedSessions.reduce((total, session) => total + session.tabs.length, 0),
                folderId: folder?.id
            });

            scopedSessions.forEach((session) => {
                const id = `session-${session.id}`;
                nodes.push({
                    id,
                    type: "session",
                    name: session.name,
                    count: session.tabs.length,
                    session,
                    favIconUrl: session.tabs[0]?.favIconUrl
                });
                links.push({ source: parentId, target: id });
            });
        }

        return { nodes, links };
    }, [folderId, folders, sessionId, sessions]);

    useEffect(() => {
        const graph = graphRef.current;
        if (!graph) return;
        graph.d3Force("charge")?.strength(-24);
        graph.d3Force("link")?.distance(20).strength(0.9);
        graph.d3ReheatSimulation();
    }, [graphData]);

    const getImage = useCallback((url?: string) => {
        if (!url) return null;
        const cached = imageCache.current.get(url);
        if (cached) return cached;
        const image = new Image();
        image.src = url;
        imageCache.current.set(url, image);
        return image;
    }, []);

    const paintNode = useCallback((node: GraphNode, context: CanvasRenderingContext2D) => {
        const itemSize = node.type === "tab" ? 7 : 9;
        const half = itemSize / 2;

        context.save();
        context.beginPath();
        if (node.type === "root") {
            context.fillStyle = isDark ? "#f5f5f5" : "#171717";
            context.arc(node.x!, node.y!, 7, 0, Math.PI * 2);
            context.fill();
        } else if (node.type === "folder") {
            context.fillStyle = "#3b82f6";
            context.arc(node.x!, node.y!, 5.5, 0, Math.PI * 2);
            context.fill();
        } else {
            context.roundRect(node.x! - half, node.y! - half, itemSize, itemSize, 2);
            context.fillStyle = isDark ? "#292929" : "#ffffff";
            context.strokeStyle = isDark ? "#4b5563" : "#d1d5db";
            context.lineWidth = 0.6;
            context.fill();
            context.stroke();

            const image = getImage(node.favIconUrl);
            if (image?.complete && image.naturalWidth) {
                context.drawImage(image, node.x! - half + 1, node.y! - half + 1, itemSize - 2, itemSize - 2);
            } else {
                context.fillStyle = isDark ? "#737373" : "#9ca3af";
                context.beginPath();
                context.arc(node.x!, node.y!, 2, 0, Math.PI * 2);
                context.fill();
            }
        }
        context.restore();
    }, [getImage, isDark]);

    return (
        <div ref={containerRef} className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-[#f5f5f7] dark:border-[#333] dark:bg-[#171717]">
            {(folderId || sessionId) && (
                <button
                    onClick={() => sessionId ? setSessionId(null) : setFolderId(null)}
                    className="absolute left-4 top-4 z-10 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 text-xs font-bold text-gray-700 shadow-sm backdrop-blur hover:bg-white dark:border-[#333] dark:bg-[#252525]/90 dark:text-gray-200"
                >
                    ← {sessionId ? (folderId === "all" ? "All Sessions" : folders.find((folder) => folder.id === folderId)?.name) : "Overview"}
                </button>
            )}
            <ForceGraph2D
                ref={graphRef}
                width={size.width}
                height={size.height}
                graphData={graphData}
                nodeCanvasObject={paintNode as any}
                nodeCanvasObjectMode={() => "replace"}
                nodeLabel={(node: GraphNode) => node.type === "tab" ? "" : `${node.name} · ${node.count} tab${node.count === 1 ? "" : "s"}`}
                linkColor={() => isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.12)"}
                linkWidth={0.8}
                backgroundColor={isDark ? "#171717" : "#f5f5f7"}
                cooldownTicks={50}
                d3AlphaDecay={0.08}
                d3VelocityDecay={0.45}
                onEngineStop={() => {
                    const graph = graphRef.current;
                    if (!graph) return;
                    if (graphData.nodes.length <= 20) {
                        graph.centerAt(0, 0, 300);
                        graph.zoom(1.8, 300);
                    } else {
                        graph.zoomToFit(450, 80);
                    }
                }}
                onNodeHover={(node: GraphNode | null) => {
                    if (node?.type === "tab" && node.tab && node.session) onSelectTab?.(node.tab, node.session);
                }}
                onNodeClick={(node: GraphNode) => {
                    if (!folderId && node.type === "root") setFolderId("all");
                    if (!folderId && node.type === "folder" && node.folderId) setFolderId(node.folderId);
                    if (!sessionId && node.type === "session" && node.session) {
                        setSessionId(node.session.id);
                        onSelectSession?.(node.session);
                    }
                    if (node.type === "tab" && node.tab && node.session) onSelectTab?.(node.tab, node.session);
                }}
            />
        </div>
    );
}
