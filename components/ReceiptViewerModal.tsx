import React from 'react';
import { X, Download, ZoomIn } from 'lucide-react';

interface ReceiptViewerModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  imageUrl,
  onClose
}) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `GriyaKas_Struk_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full max-h-[90vh] flex flex-col items-center">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between p-3 text-white mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <ZoomIn size={16} /> Lampiran Bukti Struk
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Download Foto"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Tutup"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="w-full rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Foto Struk Nota"
            className="w-full max-h-[75vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
};
