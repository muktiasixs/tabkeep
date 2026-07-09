/**
 * Helper untuk integrasi Google Drive REST API menggunakan chrome.identity.
 */

// 1. Fungsi untuk mendapatkan Token Akses Google OAuth2 (Mendukung semua browser Chromium: Chrome, Edge, Brave, dll)
export function getAuthToken(interactive = true): Promise<string> {
    console.log("GDrive Debug: Memanggil chrome.identity.launchWebAuthFlow dengan interactive =", interactive);
    
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2?.client_id;
    if (!clientId) {
        return Promise.reject(new Error("Client ID tidak ditemukan di manifest (package.json)."));
    }

    const extensionId = chrome.runtime.id;
    const redirectUri = `https://${extensionId}.chromiumapp.org/`;
    const scope = encodeURIComponent("https://www.googleapis.com/auth/drive.file");
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;

    return new Promise((resolve, reject) => {
        try {
            chrome.identity.launchWebAuthFlow({
                url: authUrl,
                interactive: interactive
            }, (redirectUrl) => {
                console.log("GDrive Debug: Callback launchWebAuthFlow dipanggil!");
                if (chrome.runtime.lastError) {
                    console.error("GDrive Debug: lastError ditemukan:", chrome.runtime.lastError);
                    return reject(new Error(chrome.runtime.lastError.message));
                }
                if (!redirectUrl) {
                    return reject(new Error("Otentikasi dibatalkan atau gagal."));
                }

                // Parse access_token dari hash URL pengalihan
                const url = new URL(redirectUrl);
                const params = new URLSearchParams(url.hash.substring(1));
                const token = params.get("access_token");

                console.log("GDrive Debug: Token didapatkan dari WebAuthFlow:", token ? "ADA (Disamarkan)" : "TIDAK ADA");
                if (!token) {
                    return reject(new Error("Token tidak ditemukan dalam URL pengalihan."));
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
