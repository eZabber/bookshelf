import { getBooks, addBooks, wipeAllData, initStorage } from './storage.js';
import { showToast } from './dom-utils.js';

export const downloadJSON = () => {
    const data = {
        meta: {
            version: 2,
            exportedAt: new Date().toISOString(),
            source: 'MyBookShelf_Backup'
        },
        books: getBooks()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mybookshelf_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Backup File Downloaded');
};

export const restoreJSON = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (!json.books || !Array.isArray(json.books)) {
                    throw new Error('Invalid Backup Format');
                }

                if (confirm(`Restore ${json.books.length} books? This will MERGE with existing data.`)) {
                    // We use addBooks which handles deduplication
                    await addBooks(json.books);
                    showToast('Backup Restored Successfully');
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (err) {
                console.error(err);
                showToast('Error: Invalid JSON File');
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

export const initBackupWiring = () => {
    const exportBtn = document.getElementById('export-json-btn');
    const importBtn = document.getElementById('import-json-trigger');
    const fileInput = document.getElementById('import-json-file');

    if (exportBtn) {
        exportBtn.addEventListener('click', downloadJSON);
    }

    if (importBtn && fileInput) {
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (file) {
                await restoreJSON(file);
                fileInput.value = ''; // Reset
            }
        });
    }
};
