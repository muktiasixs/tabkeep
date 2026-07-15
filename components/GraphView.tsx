import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { Folder as FolderType, Session, SavedTab } from "~types";

interface GraphViewProps {
    folders: FolderType[];
    sessions: Session[];
    theme: string;
    onMoveFolder?: (sessionId: string, folderId: string | null) => void;
    onMoveTab?: (sourceSessionId: string, targetSessionId: string, tabIndex: number) => void;
    onMoveTabToFolder?: (sourceSessionId: string, tabIndex: number, folderId: string | null) => void;
}

// ponytail: only render folder + session nodes (no individual tabs).
// With 10,000+ links, rendering each tab as a node would create 10k+ nodes + 10k+ links = unusable.
// Upgrade path: progressive disclosure — click session to expand its tab nodes on demand.

export const GraphView: React.FC<GraphViewProps> = ({ folders, sessions, theme, onMoveFolder, onMoveTab, onMoveTabToFolder }) => {
    const fgRef = useRef<any>();
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef<HTMLDivElement>(null);

    // ponytail: cache node positions across re-renders so graph doesn't "explode"
    const positionCacheRef = useRef<Map<string, { x: number; y: number }>>(new Map());
    // ponytail: cache loaded favicon images
    const imgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

    useEffect(() => {
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            setDimensions({ width: clientWidth, height: clientHeight });
        }
        
        const handleResize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setDimensions({ width: clientWidth, height: clientHeight });
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const graphData = useMemo(() => {
        const nodes: any[] = [];
        const links: any[] = [];

        // Add root node
        const totalTabs = sessions.reduce((acc, s) => acc + s.tabs.length, 0);
        nodes.push({ id: "root", name: "Workspace", type: "root", val: 30, tabCount: totalTabs });

        // Add folders
        folders.forEach(f => {
            const folderSessions = sessions.filter(s => s.folderId === f.id);
            const tabCount = folderSessions.reduce((acc, s) => acc + s.tabs.length, 0);
            nodes.push({ id: `folder-${f.id}`, name: f.name, type: "folder", val: 20, realId: f.id, tabCount });
            links.push({ source: "root", target: `folder-${f.id}` });
        });

        // Add sessions (NOT individual tabs — that's the key optimization)
        sessions.forEach(s => {
            const sessionId = `session-${s.id}`;
            // Get a representative favicon from the first tab
            const firstTab = s.tabs[0];
            nodes.push({
                id: sessionId,
                name: s.name || `Session ${s.timestamp}`,
                type: "session",
                val: Math.max(6, Math.min(15, s.tabs.length)), // size based on tab count
                realId: s.id,
                folderId: s.folderId,
                tabCount: s.tabs.length,
                favIconUrl: firstTab?.favIconUrl
            });
            
            if (s.folderId) {
                links.push({ source: `folder-${s.folderId}`, target: sessionId });
            } else {
                links.push({ source: "root", target: sessionId });
            }
        });

        // ponytail: restore cached positions for nodes that still exist
        const cache = positionCacheRef.current;
        nodes.forEach(node => {
            const cached = cache.get(node.id);
            if (cached) {
                node.x = cached.x;
                node.y = cached.y;
            }
        });

        return { nodes, links };
    }, [folders, sessions]);

    // Save positions when simulation ticks
    const handleEngineTick = useCallback(() => {
        const cache = positionCacheRef.current;
        graphData.nodes.forEach(n => {
            if (n.x !== undefined && n.y !== undefined) {
                cache.set(n.id, { x: n.x, y: n.y });
            }
        });
    }, [graphData]);

    // Update simulation forces
    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('charge').strength(-200);
            
            const linkForce = fgRef.current.d3Force('link');
            if (linkForce) {
                linkForce.distance(60);
                linkForce.strength(0.5);
            }
            
            // ponytail: only reheat if this is a fresh graph (no cached positions)
            const hasCachedPositions = graphData.nodes.some(n => positionCacheRef.current.has(n.id));
            if (!hasCachedPositions) {
                fgRef.current.d3ReheatSimulation();
            }
        }
    }, [graphData]);

    const isDark = theme === "dark";

    // ponytail: get or load an image, cached in ref across renders
    const getImage = useCallback((url: string): HTMLImageElement | null => {
        const cache = imgCacheRef.current;
        if (cache.has(url)) return cache.get(url)!;
        const img = new Image();
        img.src = url;
        img.onerror = () => {
            const fallback = new Image();
            fallback.src = "https://www.google.com/s2/favicons?domain=google.com&sz=32";
            cache.set(url, fallback);
        };
        cache.set(url, img);
        return null; // not loaded yet, will be available on next paint
    }, []);

    const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.name;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;

        // Draw drop target highlight
        if (node.isDragTarget) {
            ctx.beginPath();
            const r = node.type === "root" ? 14 : node.type === "folder" ? 12 : 10;
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
            ctx.fill();
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw node shape
        ctx.beginPath();
        if (node.type === "root") {
            ctx.fillStyle = isDark ? "#ffffff" : "#000000";
            ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
            ctx.fill();
        } else if (node.type === "folder") {
            ctx.fillStyle = "#3b82f6";
            ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
            ctx.fill();
        } else if (node.type === "session") {
            // Draw session as a rounded square with favicon
            const size = 10;
            const halfSize = size / 2;

            // Background
            ctx.fillStyle = isDark ? "#2a2a2a" : "#ffffff";
            ctx.strokeStyle = isDark ? "#444" : "#ddd";
            ctx.lineWidth = 0.5;
            ctx.roundRect(node.x - halfSize, node.y - halfSize, size, size, 2);
            ctx.fill();
            ctx.stroke();

            // Favicon inside
            if (node.favIconUrl) {
                const img = getImage(node.favIconUrl);
                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.drawImage(img, node.x - halfSize + 1, node.y - halfSize + 1, size - 2, size - 2);
                } else {
                    ctx.fillStyle = isDark ? "#555" : "#bbb";
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI, false);
                    ctx.fill();
                }
            } else {
                ctx.fillStyle = isDark ? "#555" : "#bbb";
                ctx.beginPath();
                ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI, false);
                ctx.fill();
            }
        }

        // Draw label text
        if (node.type === "folder" || node.type === "root") {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = isDark ? "#d1d5db" : "#374151";
            ctx.fillText(label, node.x, node.y + (node.type === "root" ? 14 : 12));
        } else if (node.type === "session" && globalScale > 2) {
            // Only show session labels when zoomed in enough
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
            const displayName = node.tabCount > 0 ? `${label} (${node.tabCount})` : label;
            ctx.fillText(displayName, node.x, node.y + 10);
        }

        // Tab count badge for sessions (always visible)
        if (node.type === "session" && node.tabCount > 0 && globalScale <= 2) {
            const badgeText = String(node.tabCount);
            const badgeFontSize = 8 / globalScale;
            ctx.font = `bold ${badgeFontSize}px Sans-Serif`;
            const tw = ctx.measureText(badgeText).width;
            const bx = node.x + 5;
            const by = node.y - 5;
            ctx.fillStyle = "#3b82f6";
            ctx.beginPath();
            ctx.arc(bx, by, Math.max(tw / 2 + 2, 5 / globalScale), 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(badgeText, bx, by);
        }
    }, [isDark, getImage]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[600px] flex-1 bg-[#f5f5f7] dark:bg-[#171717] rounded-lg overflow-hidden border border-gray-200 dark:border-[#333]">
            <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeCanvasObject={paintNode}
                nodeCanvasObjectMode={() => "replace"}
                nodeLabel={(node: any) => {
                    if (node.type === "session") return `${node.name} (${node.tabCount} tabs)`;
                    if (node.type === "folder") return `${node.name} (${node.tabCount} tabs)`;
                    return node.name;
                }}
                nodeRelSize={4}
                linkColor={() => isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                linkWidth={1}
                backgroundColor={isDark ? "#171717" : "#f5f5f7"}
                d3AlphaDecay={0.05}
                d3VelocityDecay={0.4}
                cooldownTicks={60}
                onEngineTick={handleEngineTick}
                onNodeClick={(node) => {
                    // Center/zoom on node
                    if (fgRef.current) {
                        fgRef.current.centerAt(node.x, node.y, 1000);
                        fgRef.current.zoom(node.type === "session" ? 6 : 3, 1000);
                    }
                }}
                onNodeDragEnd={(node: any) => {
                    // Save final position
                    positionCacheRef.current.set(node.id, { x: node.x, y: node.y });
                    
                    // Clear drag targets
                    graphData.nodes.forEach(n => {
                        if (n.isDragTarget) n.isDragTarget = false;
                    });
                    
                    // Find if dropped on another node (within 20px distance)
                    const dropTarget = graphData.nodes.find(n => n.id !== node.id && n.x !== undefined && n.y !== undefined && Math.hypot(n.x - node.x, n.y - node.y) < 20);
                    if (dropTarget) {
                        if (node.type === "session") {
                            if (dropTarget.type === "folder" && onMoveFolder) {
                                onMoveFolder(node.realId, dropTarget.realId);
                            } else if (dropTarget.type === "root" && onMoveFolder) {
                                onMoveFolder(node.realId, null);
                            }
                        }
                    }
                }}
                onNodeDrag={(node: any) => {
                    // Clear previous target
                    graphData.nodes.forEach(n => {
                        if (n.isDragTarget) n.isDragTarget = false;
                    });
                    
                    const dropTarget = graphData.nodes.find(n => n.id !== node.id && n.x !== undefined && n.y !== undefined && Math.hypot(n.x - node.x, n.y - node.y) < 20);
                    if (dropTarget) {
                        let isValid = false;
                        if (node.type === "session" && (dropTarget.type === "folder" || dropTarget.type === "root")) {
                            isValid = true;
                        }
                        if (isValid) {
                            dropTarget.isDragTarget = true;
                        }
                    }
                }}
            />
        </div>
    );
};
