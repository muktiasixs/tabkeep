import React, { useState, useEffect } from "react";
import { X, Info, MousePointer2, FolderPlus, Layers, Star, Pin, Trash2, Search, ArrowUpDown, GripVertical, CheckSquare, Globe, Settings, RotateCcw, Download, Upload, Monitor } from "lucide-react";

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const [isRendered, setIsRendered] = useState(isOpen)
    const [isVisible, setIsVisible] = useState(isOpen);

    useEffect(() => {
        let renderTimer: ReturnType<typeof setTimeout>;
        let visibleTimer: ReturnType<typeof setTimeout>;

        if (isOpen) {
            setIsRendered(true);
            visibleTimer = setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
            renderTimer = setTimeout(() => setIsRendered(false), 200);
        }

        return () => {
            clearTimeout(renderTimer);
            clearTimeout(visibleTimer);
        };
    }, [isOpen]);

    if (!isRendered) return null;

    return (
        <div onClick={onClose} className={`fixed inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-black/40 backdrop-blur-md transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div onClick={e => e.stopPropagation()} className={`w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-200 transform ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
                <div className="flex items-center justify-between px-6 py-4">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 drop-shadow-sm dark:drop-shadow-md">
                        <Info size={20} /> Panduan Tabkeep
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8 text-gray-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">

                    {/* Apa Itu Tabkeep */}
                    <div className="p-2">
                        <h3 className="font-bold mb-3 text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            <Globe size={16} className="text-blue-500" /> Apa Itu Tabkeep?
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed space-y-2 ml-6">
                            <p>
                                Tabkeep adalah ekstensi Chrome yang membantu kamu <strong className="text-gray-900 dark:text-white">menyimpan, mengatur, dan mengelola semua tab browser</strong> kamu dalam satu tempat. Tidak perlu lagi khawatir kehilangan tab penting saat browser ditutup!
                            </p>
                            <p>
                                Setiap kali kamu mengklik ikon Tabkeep di toolbar Chrome, semua tab yang terbuka akan otomatis disimpan sebagai satu <strong className="text-gray-900 dark:text-white">Sesi (Session)</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Menyimpan Tab */}
                    <div className="p-2">
                        <h3 className="font-bold mb-3 text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            <MousePointer2 size={16} className="text-green-500" /> Menyimpan Tab
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed space-y-2 ml-6">
                            <p>
                                <strong className="text-gray-900 dark:text-white">Klik ikon Tabkeep</strong> di toolbar Chrome (pojok kanan atas). Semua tab yang sedang terbuka akan langsung tersimpan menjadi satu sesi baru.
                            </p>
                            <p>
                                Tab-tab yang sudah disimpan bisa dilihat di <strong className="text-gray-900 dark:text-white">Dashboard Tabkeep</strong> (halaman utama ekstensi).
                            </p>
                            <p>
                                Kamu juga bisa memilih tab tertentu saja untuk disimpan melalui <strong className="text-gray-900 dark:text-white">Tab Picker</strong> — cukup centang tab yang ingin disimpan, lalu klik tombol "Save".
                            </p>
                        </div>
                    </div>

                    {/* Membuka / Restore Tab */}
                    <div className="p-2">
                        <h3 className="font-bold mb-3 text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            <RotateCcw size={16} className="text-purple-500" /> Membuka Kembali (Restore) Tab
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed space-y-2 ml-6">
                            <p>
                                <strong className="text-gray-900 dark:text-white">Klik judul link</strong> pada sesi mana saja untuk membuka tab tersebut di browser.
                            </p>
                            <p>
                                Untuk membuka <strong className="text-gray-900 dark:text-white">semua tab sekaligus</strong> dalam satu sesi, klik tombol menu (<strong>⋯</strong>) di pojok kanan header sesi, lalu pilih "Open All Tabs".
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Tips:</strong> Tahan tombol <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-[#333] rounded text-xs font-mono">Ctrl</kbd> atau <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-[#333] rounded text-xs font-mono">Cmd</kbd> saat mengklik link untuk membukanya di background tanpa berpindah tab.
                            </p>
                        </div>
                    </div>

                    {/* Mengatur Sesi */}
                    <div className="p-2">
                        <h3 className="font-bold mb-3 text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            <Layers size={16} className="text-orange-500" /> Mengatur Sesi
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed space-y-2 ml-6">
                            <p>
                                <strong className="text-gray-900 dark:text-white">Rename:</strong> Klik dua kali (double-click) pada nama sesi di sidebar atau klik tombol menu (<strong>⋯</strong>) lalu pilih "Rename" untuk mengubah nama sesi.
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Star / Favorit:</strong> Tandai sesi yang penting dengan bintang agar mudah ditemukan. Sesi berbintang akan ditampilkan dengan warna kuning.
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Merge:</strong> Gabungkan beberapa sesi menjadi satu lewat tombol menu (<strong>⋯</strong>) lalu pilih "Merge".
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Sort:</strong> Urutkan tab di dalam sesi berdasarkan nama, URL, atau tanggal melalui menu sort.
                            </p>
                        </div>
                    </div>

                    {/* Folder */}
                    <div className="p-2">
                        <h3 className="font-bold mb-3 text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            <FolderPlus size={16} className="text-blue-500" /> Folder
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed space-y-2 ml-6">
                            <p>
                                Buat folder baru dengan mengklik tombol <strong className="text-gray-900 dark:text-white">ikon folder (+)</strong> di sidebar kiri bawah, lalu ketik nama folder dan tekan Enter.
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Pindahkan sesi ke folder</strong> dengan cara drag and drop (seret dan lepas) sesi dari sidebar ke folder yang diinginkan, atau gunakan menu (<strong>⋯</strong>) → "Move to Folder".
                            </p>
                            <p>
                                Klik nama folder di sidebar untuk melihat hanya sesi-sesi yang ada di folder tersebut. Klik "All Sessions" untuk melihat semua sesi.
                            </p>
                        </div>
                    </div>

                    {/* Drag & Drop */}
                    <div className="p-2">
                        <h3 className="font-bold mb-3 text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            <GripVertical size={16} className="text-indigo-500" /> Drag & Drop
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed space-y-2 ml-6">
                            <p>
                                <strong className="text-gray-900 dark:text-white">Pindah tab antar sesi:</strong> Seret link dari satu sesi dan lepaskan ke sesi lain untuk memindahkannya.
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Urutkan ulang sesi:</strong> Seret sesi ke atas atau ke bawah untuk mengubah urutannya.
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Urutkan ulang tab:</strong> Seret tab ke posisi yang berbeda dalam satu sesi untuk mengatur urutannya.
                            </p>
                        </div>
                    </div>

                    {/* Multi-Select */}
                    <div className="p-2">
                        <h3 className="font-bold mb-3 text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            <CheckSquare size={16} className="text-teal-500" /> Multi-Select
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed space-y-2 ml-6">
                            <p>
                                <strong className="text-gray-900 dark:text-white">Centang checkbox</strong> di samping tab untuk memilih beberapa tab sekaligus.
                            </p>
                            <p>
                                Tahan <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-[#333] rounded text-xs font-mono">Shift</kbd> lalu klik tab lain untuk memilih semua tab di antara kedua tab tersebut (range selection).
                            </p>
                            <p>
                                Setelah memilih beberapa tab, kamu bisa <strong className="text-gray-900 dark:text-white">menyeretnya bersamaan</strong> ke sesi lain, atau gunakan floating action bar di bagian bawah layar untuk melakukan aksi massal (hapus, pindah, buka).
                            </p>
                        </div>
                    </div>

                    {/* Pinned Links */}
                    <div className="p-2">
                        <h3 className="font-bold mb-3 text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            <Pin size={16} className="text-rose-500" /> Pinned Links
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed space-y-2 ml-6">
                            <p>
                                Klik ikon <strong className="text-gray-900 dark:text-white">pin (📌)</strong> di samping tab untuk menyematkannya ke sidebar kanan sebagai "Pinned Link".
                            </p>
                            <p>
                                Pinned Links akan <strong className="text-gray-900 dark:text-white">selalu terlihat</strong> dan tidak terpengaruh oleh filter folder. Gunakan fitur ini untuk menyimpan link yang sering diakses.
                            </p>
                        </div>
                    </div>

                    {/* Sidebar Navigasi */}
                    <div className="p-2">
                        <h3 className="font-bold mb-3 text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            <Search size={16} className="text-cyan-500" /> Search & Navigasi Sidebar
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed space-y-2 ml-6">
                            <p>
                                Gunakan <strong className="text-gray-900 dark:text-white">search bar</strong> di header untuk mencari tab berdasarkan judul atau URL.
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Klik nama sesi di sidebar kiri</strong> untuk langsung men-scroll ke sesi tersebut di bagian tengah halaman. Sangat berguna ketika kamu punya banyak sesi!
                            </p>
                            <p>
                                Indikator hijau yang berkedip (<span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>) pada badge sesi menandakan bahwa ada tab aktif yang sedang terbuka di browser milik sesi tersebut.
                            </p>
                        </div>
                    </div>

                    {/* Tampilan */}
                    <div className="p-2">
                        <h3 className="font-bold mb-3 text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            <Monitor size={16} className="text-yellow-500" /> Tampilan (View Mode)
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed space-y-2 ml-6">
                            <p>
                                <strong className="text-gray-900 dark:text-white">List View:</strong> Tampilkan tab sebagai daftar dengan judul dan URL lengkap (default).
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Grid View:</strong> Tampilkan tab sebagai grid favicon kecil — cocok untuk sesi dengan banyak tab.
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Graph View:</strong> Visualisasi semua sesi dan tab sebagai grafik interaktif — berguna untuk melihat hubungan antar sesi.
                            </p>
                            <p>
                                Tombol untuk mengganti tampilan ada di header area tengah, di sebelah kanan judul folder/sesi.
                            </p>
                        </div>
                    </div>

                    {/* Trash */}
                    <div className="p-2">
                        <h3 className="font-bold mb-3 text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            <Trash2 size={16} className="text-red-500" /> Trash / Sampah
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed space-y-2 ml-6">
                            <p>
                                Sesi yang dihapus tidak langsung hilang! Mereka akan dipindahkan ke <strong className="text-gray-900 dark:text-white">Trash</strong> yang bisa diakses melalui sidebar kiri.
                            </p>
                            <p>
                                Di trash, kamu bisa <strong className="text-gray-900 dark:text-white">restore (pulihkan)</strong> sesi yang tidak sengaja terhapus, atau menghapusnya secara permanen.
                            </p>
                        </div>
                    </div>

                    {/* Backup & Sync */}
                    <div className="p-2">
                        <h3 className="font-bold mb-3 text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            <Settings size={16} className="text-gray-500" /> Backup & Sync
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed space-y-2 ml-6">
                            <p>
                                Buka <strong className="text-gray-900 dark:text-white">Settings</strong> (ikon gear di header) untuk mengakses fitur backup:
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Export (TXT):</strong> Unduh semua URL tab sebagai file teks biasa.
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Import:</strong> Tempel (paste) daftar URL ke dalam kotak import, atau unggah file backup JSON untuk memulihkan data.
                            </p>
                            <p>
                                <strong className="text-gray-900 dark:text-white">Google Drive Sync:</strong> Cadangkan seluruh data Tabkeep (sesi, folder, pinned links, dan pengaturan) ke Google Drive. Kamu juga bisa memulihkan data dari backup Google Drive sebelumnya.
                            </p>
                        </div>
                    </div>

                    {/* Keyboard Shortcuts */}
                    <div className="p-2">
                        <h3 className="font-bold mb-3 text-sm text-gray-800 dark:text-white/90 flex items-center gap-2">
                            ⌨️ Keyboard Tips
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-white/70 leading-relaxed ml-6">
                            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                                <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-[#333] rounded text-xs font-mono text-center">Ctrl + Klik</kbd>
                                <span>Buka link di background (tanpa berpindah tab)</span>

                                <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-[#333] rounded text-xs font-mono text-center">Shift + Klik</kbd>
                                <span>Range select — pilih semua tab di antara dua klik</span>

                                <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-[#333] rounded text-xs font-mono text-center">Double Click</kbd>
                                <span>Rename sesi (di sidebar)</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer note */}
                    <div className="p-2 pt-4 border-t border-gray-200 dark:border-[#333]">
                        <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
                            Tabkeep — Simpan tab, atur hidup. 🚀
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
