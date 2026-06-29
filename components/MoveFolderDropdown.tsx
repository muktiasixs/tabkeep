import { useEffect, useRef, useState } from "react";
import { Check, Folder } from "lucide-react";
import { MoveRight } from "lucide-react";
import type { Folder as FolderType } from "~types";

interface Props {
    sessionId: string;
    currentFolderId: string | null;
    folders: FolderType[];
    onMove: (sessionId: string, folderId: string | null) => void;
}

export function MoveFolderDropdown({ sessionId, currentFolderId, folders, onMove }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleMove = (folderId: string | null) => {
        onMove(sessionId, folderId);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                title="Pindah ke folder"
                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-blue-400 font-bold transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
                <MoveRight size={11} />
                Pindahkan
            </button>

            {open && (
                <div className="absolute right-0 top-7 z-50 bg-[#252525] border border-[#444] rounded-lg shadow-2xl py-1 w-48 animate-in fade-in duration-100">
                    <div className="px-3 py-1.5 text-[10px] text-gray-600 font-bold uppercase tracking-wider border-b border-[#333] mb-1">
                        Pindah ke folder
                    </div>
                    <button
                        onClick={() => handleMove(null)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors text-left ${currentFolderId === null ? "text-blue-400" : "text-gray-400"}`}
                    >
                        <Folder size={12} className="text-gray-500" />
                        Uncategorized
                        {currentFolderId === null && <Check size={11} className="ml-auto text-blue-400" />}
                    </button>
                    {folders.map(folder => (
                        <button
                            key={folder.id}
                            onClick={() => handleMove(folder.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors text-left ${currentFolderId === folder.id ? "text-blue-400" : "text-gray-400"}`}
                        >
                            <Folder size={12} className="text-blue-500/70" />
                            <span className="truncate">{folder.name}</span>
                            {currentFolderId === folder.id && <Check size={11} className="ml-auto text-blue-400 flex-shrink-0" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
