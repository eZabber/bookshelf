// Basic wrapper around html5-qrcode
// Note: We need to load the library from CDN in the HTML
// <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>

export class ISBNScanner {
    constructor(elementId, onScanSuccess, onScanFailure) {
        this.elementId = elementId;
        this.onScanSuccess = onScanSuccess;
        this.onScanFailure = onScanFailure;
        this.html5QrcodeScanner = null;
        this.isScanning = false;
    }

    async start() {
        if (this.isScanning) return;

        try {
            this.html5QrcodeScanner = new Html5Qrcode(this.elementId);
            const config = { fps: 10, qrbox: { width: 250, height: 150 } };

            await this.html5QrcodeScanner.start(
                { facingMode: "environment" },
                config,
                (decodedText, decodedResult) => {
                    // Check if it looks like an ISBN (10 or 13 digits)
                    const clean = decodedText.replace(/[^0-9X]/gi, '');
                    if (clean.length === 10 || clean.length === 13) {
                        this.onScanSuccess(clean);
                        this.stop();
                    }
                },
                (errorMessage) => {
                    // ignore errors for each frame
                    if (this.onScanFailure) this.onScanFailure(errorMessage);
                }
            );
            this.isScanning = true;
        } catch (err) {
            console.error("Error starting scanner", err);
            throw err;
        }
    }

    async stop() {
        if (this.html5QrcodeScanner && this.isScanning) {
            try {
                await this.html5QrcodeScanner.stop();
                this.html5QrcodeScanner.clear();
                this.isScanning = false;
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
    }
}
