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

export const GraphView: React.FC<GraphViewProps> = ({ folders, sessions, theme, onMoveFolder, onMoveTab, onMoveTabToFolder }) => {
    const fgRef = useRef<any>();
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef<HTMLDivElement>(null);

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
        nodes.push({ id: "root", name: "Workspace", type: "root", val: 30 });

        // Add folders
        folders.forEach(f => {
            nodes.push({ id: `folder-${f.id}`, name: f.name, type: "folder", val: 20, realId: f.id });
            links.push({ source: "root", target: `folder-${f.id}` });
        });

        // Add sessions
        sessions.forEach((s, idx) => {
            const sessionId = `session-${s.id}`;
            nodes.push({ id: sessionId, name: s.name || `Session ${s.timestamp}`, type: "session", val: 10, realId: s.id, folderId: s.folderId });
            
            if (s.folderId) {
                links.push({ source: `folder-${s.folderId}`, target: sessionId });
            } else {
                links.push({ source: "root", target: sessionId });
            }

            // Add tabs
            s.tabs.forEach((t, tIdx) => {
                const tabId = `tab-${s.id}-${tIdx}`;
                nodes.push({ 
                    id: tabId, 
                    name: t.title || t.url, 
                    type: "tab", 
                    favIconUrl: t.favIconUrl,
                    url: t.url,
                    sessionId: s.id,
                    tabIndex: tIdx,
                    val: 5 
                });
                links.push({ source: sessionId, target: tabId });
            });
        });

        return { nodes, links };
    }, [folders, sessions]);

    const isDark = theme === "dark";

    const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.name;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;

        // Draw drop target highlight
        if (node.isDragTarget) {
            ctx.beginPath();
            if (node.type === "root") {
                ctx.arc(node.x, node.y, 14, 0, 2 * Math.PI, false);
            } else if (node.type === "folder") {
                ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI, false);
            } else if (node.type === "session") {
                ctx.rect(node.x - 8, node.y - 8, 16, 16);
            }
            ctx.fillStyle = "rgba(59, 130, 246, 0.4)"; // blue-500 with opacity
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
            ctx.fillStyle = "#3b82f6"; // blue-500
            ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
            ctx.fill();
        } else if (node.type === "session") {
            ctx.fillStyle = isDark ? "#4b5563" : "#9ca3af"; // gray-500
            ctx.rect(node.x - 4, node.y - 4, 8, 8);
            ctx.fill();
        } else if (node.type === "tab") {
            const size = 6;
            if (node.favIconUrl) {
                if (!node.img) {
                    const img = new Image();
                    img.src = node.favIconUrl || "https://www.google.com/s2/favicons?domain=google.com&sz=32";
                    img.onload = () => {
                        node.img = img;
                        node.loaded = true;
                    };
                    img.onerror = () => {
                        node.img = new Image();
                        node.img.src = "https://www.google.com/s2/favicons?domain=google.com&sz=32";
                        node.loaded = true;
                    };
                    // fallback while loading
                    ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
                    ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI, false);
                    ctx.fill();
                } else if (node.loaded) {
                    ctx.drawImage(node.img, node.x - size/2, node.y - size/2, size, size);
                } else {
                    ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
                    ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI, false);
                    ctx.fill();
                }
            } else {
                ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
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
        }
    }, [isDark]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[600px] flex-1 bg-[#f5f5f7] dark:bg-[#171717] rounded-none overflow-hidden border border-gray-200 dark:border-[#333]">
            <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeCanvasObject={paintNode}
                nodeCanvasObjectMode={() => "replace"}
                nodeLabel={(node: any) => (node.type === "tab" || node.type === "session") ? node.name : ""}
                nodeRelSize={4}
                linkColor={() => isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                linkWidth={1}
                backgroundColor={isDark ? "#171717" : "#f5f5f7"}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.4}
                cooldownTicks={100}
                onNodeClick={(node) => {
                    if (node.type === "tab" && node.url) {
                        window.open(node.url, "_blank");
                    } else {
                        // Center/zoom on node
                        if (fgRef.current) {
                            fgRef.current.centerAt(node.x, node.y, 1000);
                            fgRef.current.zoom(8, 2000);
                        }
                    }
                }}
                onNodeDragEnd={(node: any) => {
                    // Clear drag targets
                    graphData.nodes.forEach(n => {
                        if (n.isDragTarget) n.isDragTarget = false;
                    });
                    
                    // Find if dropped on another node (within 20px distance)
                    const dropTarget = graphData.nodes.find(n => n.id !== node.id && n.x !== undefined && n.y !== undefined && Math.hypot(n.x - node.x, n.y - node.y) < 20);
                    if (dropTarget) {
                        if (node.type === "tab") {
                            if (dropTarget.type === "session" && onMoveTab) {
                                onMoveTab(node.sessionId, dropTarget.realId, node.tabIndex);
                            } else if (dropTarget.type === "folder" && onMoveTabToFolder) {
                                onMoveTabToFolder(node.sessionId, node.tabIndex, dropTarget.realId);
                            }
                        } else if (node.type === "session") {
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
                        if (node.type === "tab" && (dropTarget.type === "session" || dropTarget.type === "folder")) {
                            isValid = true;
                        } else if (node.type === "session" && (dropTarget.type === "folder" || dropTarget.type === "root")) {
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
