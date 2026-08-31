import React, { useEffect, useState } from 'react';
import { Delete, Lock } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  mode: 'UNLOCK' | 'SETUP';
  verifyPin?: (pin: string) => Promise<boolean> | boolean;
  onSuccess: (newPin?: string) => void | Promise<void>;
  onCancel?: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, mode, verifyPin, onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'ENTER' | 'CONFIRM'>('ENTER');
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) { setPin(''); setConfirmPin(''); setStep('ENTER'); setErrorMsg(''); setBusy(false); }
  }, [isOpen]);

  if (!isOpen) return null;

  const fail = (message: string, clearConfirm = false) => {
    setErrorMsg(message);
    window.setTimeout(() => {
      if (clearConfirm) setConfirmPin(''); else setPin('');
      setErrorMsg('');
      setBusy(false);
    }, 850);
  };

  const handleKeyPress = async (num: string) => {
    if (busy) return;
    setErrorMsg('');
    if (mode === 'UNLOCK') {
      if (pin.length >= 4) return;
      const next = pin + num;
      setPin(next);
      if (next.length === 4) {
        setBusy(true);
        try {
          const valid = verifyPin ? await verifyPin(next) : false;
          if (valid) await onSuccess(); else fail('PIN yang dimasukkan salah!');
        } catch { fail('PIN tidak dapat diverifikasi.'); }
      }
      return;
    }

    if (step === 'ENTER') {
      if (pin.length >= 4) return;
      const next = pin + num;
      setPin(next);
      if (next.length === 4) window.setTimeout(() => setStep('CONFIRM'), 180);
      return;
    }

    if (confirmPin.length >= 4) return;
    const next = confirmPin + num;
    setConfirmPin(next);
    if (next.length === 4) {
      if (next === pin) await onSuccess(pin);
      else fail('Konfirmasi PIN tidak cocok!', true);
    }
  };

  const currentValue = mode === 'UNLOCK' ? pin : step === 'ENTER' ? pin : confirmPin;
  const handleDelete = () => {
    if (busy) return;
    if (mode === 'UNLOCK' || step === 'ENTER') setPin((value) => value.slice(0, -1));
    else setConfirmPin((value) => value.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6" role="dialog" aria-modal="true" aria-label={mode === 'UNLOCK' ? 'Buka GriyaKas' : 'Atur PIN GriyaKas'}>
        <div className="space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30"><Lock size={28} /></div>
          <h3 className="font-extrabold text-lg text-white">{mode === 'UNLOCK' ? 'Masukkan PIN Keamanan' : step === 'ENTER' ? 'Buat PIN 4 Digit' : 'Ulangi PIN'}</h3>
          <p className="text-xs text-slate-400">{mode === 'UNLOCK' ? 'Buka data keuangan di perangkat ini' : 'PIN disimpan sebagai hash PBKDF2, bukan teks biasa'}</p>
        </div>
        <div className="flex gap-4" aria-label={`${currentValue.length} dari 4 digit terisi`}>
          {[0,1,2,3].map((index) => <div key={index} className={`w-4 h-4 rounded-full transition-all ${index < currentValue.length ? 'bg-emerald-400 scale-110' : 'bg-slate-800 border border-slate-700'}`} />)}
        </div>
        {errorMsg && <p className="text-xs font-bold text-rose-400" role="alert">{errorMsg}</p>}
        <div className="grid grid-cols-3 gap-4 w-full pt-2">
          {['1','2','3','4','5','6','7','8','9'].map((num) => <button type="button" disabled={busy} key={num} onClick={() => void handleKeyPress(num)} className="w-16 h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xl mx-auto border border-slate-800 disabled:opacity-50">{num}</button>)}
          {onCancel ? <button type="button" onClick={onCancel} disabled={busy} className="w-16 h-16 rounded-2xl text-slate-400 hover:text-white text-xs font-bold mx-auto">Batal</button> : <div />}
          <button type="button" disabled={busy} onClick={() => void handleKeyPress('0')} className="w-16 h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xl mx-auto border border-slate-800 disabled:opacity-50">0</button>
          <button type="button" disabled={busy} onClick={handleDelete} aria-label="Hapus digit terakhir" className="w-16 h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center mx-auto border border-slate-800 disabled:opacity-50"><Delete size={20} /></button>
        </div>
      </div>
    </div>
  );
};
