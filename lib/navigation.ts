export async function openOrFocusDashboard() {
    const url = chrome.runtime.getURL("tabs/dashboard.html");
    const tabs = await chrome.tabs.query({});
    const existing = tabs.find((t) => t.url === url);

    if (existing && existing.id) {
        // Jika sudah ada, fokuskan ke tab tersebut
        await chrome.tabs.update(existing.id, { active: true });
        
        // Pastikan jendelanya juga difokuskan (kalau beda window)
        if (existing.windowId) {
            await chrome.windows.update(existing.windowId, { focused: true });
        }
    } else {
        // Jika belum ada (misal tidak sengaja tertutup), buat baru
        await chrome.tabs.create({ url: "./tabs/dashboard.html" });
    }
}
