import type { SavedTab } from "~types";

export function parseImportedLines(text: string): SavedTab[] {
    if (!text) return [];
    
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const parsedTabs: SavedTab[] = [];
    
    for (const line of lines) {
        let url = line;
        let title = line;
        
        // Handle "URL | Title" format with robust regex (any whitespace)
        const match = line.match(/^(\S+)\s*\|\s*(.*)$/);
        if (match) {
            url = match[1];
            title = match[2] || url;
        }
        
        // Fallback to ensuring URL has protocol
        if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("chrome://") && !url.startsWith("file://")) {
            url = `https://${url}`;
            if (title === line) {
                title = url;
            }
        }
        
        let domain = "";
        try {
            domain = new URL(url).hostname;
        } catch(e) {}
        
        parsedTabs.push({
            title,
            url,
            favIconUrl: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : ""
        });
    }
    
    return parsedTabs;
}
