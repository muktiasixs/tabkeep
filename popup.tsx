import "~style.css"

function IndexPopup() {
  const saveAllTabs = async () => {
    // 1. Ambil semua tab di jendela saat ini (kecuali tab dashboard itu sendiri)
    const allTabs = await chrome.tabs.query({ currentWindow: true });
    const tabsToSave = allTabs.filter(tab => !tab.url.includes("dashboard.html"));

    // 2. Ambil data lama dari storage
    const result = await chrome.storage.local.get(["savedTabs"]);
    const currentList = result.savedTabs || [];

    // 3. Gabungkan data lama dengan tab baru
    const newEntries = tabsToSave.map(tab => ({
      id: Math.random().toString(36).substr(2, 9),
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      timestamp: new Date().toLocaleString(),
      folder: "All"
    }));

    const updatedList = [...newEntries, ...currentList];

    // 4. Simpan ke storage & tutup tab yang sudah disimpan
    await chrome.storage.local.set({ savedTabs: updatedList });

    // Opsional: Tutup semua tab yang baru saja disimpan
    const idsToClose = tabsToSave.map(t => t.id);
    chrome.tabs.remove(idsToClose);

    // 5. Buka dashboard
    chrome.tabs.create({ url: "./tabs/dashboard.html" });
  };

  return (
    <div className="w-64 p-4 bg-[#0F0F0F] text-white border border-[#222]">
      <h2 className="text-xl font-bold mb-4 tracking-tight text-blue-500">Tabkeep</h2>
      <div className="space-y-2">
        <button
          onClick={saveAllTabs}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-sm font-semibold transition-all"
        >
          Kemas Semua Tab
        </button>
        <button
          onClick={() => chrome.tabs.create({ url: "./tabs/dashboard.html" })}
          className="w-full bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] py-2 rounded-lg text-sm transition-all"
        >
          Buka Dashboard
        </button>
      </div>
    </div>
  );
}

export default IndexPopup;