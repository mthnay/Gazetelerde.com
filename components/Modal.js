"use client";
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2000,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="modal-content" style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                animation: 'fadeIn 0.2s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div style={{
                    padding: '24px',
                    overflowY: 'auto',
                    lineHeight: '1.6',
                    color: 'var(--text-secondary)',
                    fontSize: '0.95rem'
                }}>
                    {children}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px',
                    borderTop: '1px solid var(--border)',
                    textAlign: 'right'
                }}>
                    <button
                        onClick={onClose}
                        className="btn btn-primary"
                        style={{ padding: '8px 24px', fontSize: '14px' }}
                    >
                        Okudum, Anladım
                    </button>
                </div>
            </div>
        </div>
    );
}
