import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Session } from "~types";

interface Props {
    sessions: Session[];
    columns: 3 | 4;
    grid?: boolean;
    children: (session: Session, rowExpanded?: boolean) => ReactNode;
}

export function SessionGridRows({ sessions, columns, grid = true, children }: Props) {
    const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());
    if (!grid) return <div className="space-y-1.5">{sessions.map((session) => children(session))}</div>;
    const rows = Array.from({ length: Math.ceil(sessions.length / columns) }, (_, index) => sessions.slice(index * columns, (index + 1) * columns));

    return (
        <div className="space-y-3">
            {rows.map((row) => {
                const rowId = row.map((session) => session.id).join("|");
                const collapsed = collapsedRows.has(rowId);
                return (
                    <div key={rowId} className="relative pl-6">
                        <button
                            onClick={() => setCollapsedRows((current) => {
                                const next = new Set(current);
                                collapsed ? next.delete(rowId) : next.add(rowId);
                                return next;
                            })}
                            className="absolute left-0 top-2 flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-[#2a2a2a] dark:hover:text-gray-200"
                            title={collapsed ? "Expand row" : "Collapse row"}
                        >
                            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                        </button>

                        <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${columns === 4 ? "xl:grid-cols-3 2xl:grid-cols-4" : "xl:grid-cols-3"}`}>
                            {row.map((session) => children(session, !collapsed))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
