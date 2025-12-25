
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface BookScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
}

const BookScanner: React.FC<BookScannerProps> = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    const config = { fps: 10, qrbox: { width: 250, height: 150 } };

    scanner.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // Most ISBN barcodes are EAN-13
        if (decodedText.length >= 10) {
          onScan(decodedText);
          stopScanner();
        }
      },
      (errorMessage) => {
        // Skip common scan errors to avoid noise
      }
    ).then(() => setIsScanning(true))
    .catch(err => console.error("Camera error:", err));

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear();
      }).catch(err => console.error("Error stopping scanner:", err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={onClose}
          className="p-2 bg-white/20 rounded-full text-white backdrop-blur-md"
        >
          <X size={24} />
        </button>
      </div>

      <div className="w-full max-w-md px-6">
        <div id="reader" className="w-full overflow-hidden rounded-2xl border-2 border-white/30 shadow-2xl"></div>
        
        <div className="mt-8 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Scan ISBN Barcode</h2>
          <p className="text-white/60 text-sm">Point your camera at the barcode on the back of the book.</p>
        </div>
      </div>

      {!isScanning && (
        <div className="text-white flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span>Initializing camera...</span>
        </div>
      )}
    </div>
  );
};

export default BookScanner;
