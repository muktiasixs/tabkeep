let activeTarget: { id: string; clear: () => void } | null = null;

export function activateDropTarget(id: string, clear: () => void) {
    if (activeTarget?.id === id) return;
    activeTarget?.clear();
    activeTarget = { id, clear };
}

export function clearDropTarget(id: string) {
    if (activeTarget?.id !== id) return;
    activeTarget.clear();
    activeTarget = null;
}

export function resetDropTarget() {
    activeTarget?.clear();
    activeTarget = null;
}

export function setCompactDragImage(dataTransfer: DataTransfer, text: string) {
    const ghost = document.createElement("div");
    ghost.textContent = text;
    Object.assign(ghost.style, {
        position: "fixed",
        top: "-100px",
        left: "-100px",
        maxWidth: "220px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        padding: "5px 10px",
        borderRadius: "8px",
        background: "#2563eb",
        color: "white",
        font: "600 12px system-ui",
        pointerEvents: "none"
    });
    document.body.appendChild(ghost);
    dataTransfer.setDragImage(ghost, 14, 14);
    requestAnimationFrame(() => ghost.remove());
}
