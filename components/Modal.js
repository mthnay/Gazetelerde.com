"use client";
import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, footer }) {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [isOpen, onClose]);

    if (!isOpen) return null;
    return (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
                <div className="modal-head">
                    <h3>{title}</h3>
                    <button type="button" onClick={onClose} className="icon-btn" aria-label="Kapat"><X size={18} /></button>
                </div>
                <div className="modal-body">{children}</div>
                <div className="modal-foot">
                    {footer ?? <button type="button" onClick={onClose} className="btn btn-primary btn-sm">Okudum, anladım</button>}
                </div>
            </div>
        </div>
    );
}
