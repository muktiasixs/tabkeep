/**
 * Helper untuk integrasi Google Drive REST API menggunakan chrome.identity.
 */

// 1. Fungsi untuk mendapatkan Token Akses Google OAuth2
export function getAuthToken(interactive = true): Promise<string> {
    console.log("GDrive Debug: Memanggil chrome.identity.getAuthToken dengan interactive =", interactive);
    return new Promise((resolve, reject) => {
        try {
            chrome.identity.getAuthToken({ interactive }, (token) => {
                console.log("GDrive Debug: Callback dipanggil!");
                if (chrome.runtime.lastError) {
                    console.error("GDrive Debug: lastError ditemukan:", chrome.runtime.lastError);
                    return reject(new Error(chrome.runtime.lastError.message));
                }
                console.log("GDrive Debug: Token didapatkan:", token ? "ADA (Disamarkan)" : "TIDAK ADA");
                if (!token) {
                    return reject(new Error("Gagal mendapatkan Google OAuth token."));
                }
                resolve(token);
            });
        } catch (error) {
            console.error("GDrive Debug: Catch error:", error);
            reject(error);
        }
    });
}

// 2. Mencari file backup di Google Drive berdasarkan nama
async function findBackupFile(token: string, filename = "tabkeep-backup.txt"): Promise<string | null> {
    const query = encodeURIComponent(`name = '${filename}' and trashed = false`);
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Gagal mencari file di GDrive: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
        return data.files[0].id;
    }
    return null;
}

// 3. Mengunggah atau memperbarui file backup ke Google Drive
export async function uploadToGDrive(content: string, filename = "tabkeep-backup.txt"): Promise<void> {
    const token = await getAuthToken(true);
    const fileId = await findBackupFile(token, filename);

    if (fileId) {
        // Jika file sudah ada, perbarui isinya (PATCH)
        const response = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "text/plain; charset=UTF-8"
                },
                body: content
            }
        );

        if (!response.ok) {
            throw new Error(`Gagal memperbarui file di GDrive: ${response.statusText}`);
        }
    } else {
        // Jika file belum ada:
        // Langkah A: Buat metadata file terlebih dahulu
        const metadataResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: filename,
                mimeType: "text/plain"
            })
        });

        if (!metadataResponse.ok) {
            throw new Error(`Gagal membuat metadata file di GDrive: ${metadataResponse.statusText}`);
        }

        const metadata = await metadataResponse.json();
        const newFileId = metadata.id;

        // Langkah B: Unggah isi file ke ID yang baru dibuat (PATCH)
        const response = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${newFileId}?uploadType=media`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "text/plain; charset=UTF-8"
                },
                body: content
            }
        );

        if (!response.ok) {
            throw new Error(`Gagal mengunggah konten file ke GDrive: ${response.statusText}`);
        }
    }
}

// 4. Mengunduh isi file backup dari Google Drive
export async function downloadFromGDrive(filename = "tabkeep-backup.txt"): Promise<string> {
    const token = await getAuthToken(true);
    const fileId = await findBackupFile(token, filename);

    if (!fileId) {
        throw new Error("File backup 'tabkeep-backup.txt' tidak ditemukan di Google Drive kamu.");
    }

    // Ambil konten file mentah menggunakan alt=media
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Gagal mengunduh file dari GDrive: ${response.statusText}`);
    }

    return await response.text();
}
