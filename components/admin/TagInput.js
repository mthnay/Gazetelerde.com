"use client";
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

// Etiket girişi: Enter / virgül ile ekler, mevcut etiketlerden öneri sunar
export default function TagInput({ value = [], onChange, max = 10 }) {
    const [text, setText] = useState('');
    const [suggest, setSuggest] = useState([]);

    useEffect(() => {
        const q = text.trim();
        if (q.length < 2) return;
        const t = setTimeout(() => {
            fetch(`/api/admin/tags?q=${encodeURIComponent(q)}`).then((r) => r.json())
                .then((d) => setSuggest((d.tags || []).filter((x) => !value.some((v) => v.toLocaleLowerCase('tr') === x.name.toLocaleLowerCase('tr')))))
                .catch(() => {});
        }, 200);
        return () => clearTimeout(t);
    }, [text, value]);

    const add = (name) => {
        const n = name.replace(/\s+/g, ' ').trim().slice(0, 60);
        setText(''); setSuggest([]);
        if (!n || value.length >= max || value.some((v) => v.toLocaleLowerCase('tr') === n.toLocaleLowerCase('tr'))) return;
        onChange([...value, n]);
    };

    return (
        <div className="tag-input">
            <div className="tag-chips">
                {value.map((t) => (
                    <span key={t} className="tag-chip">{t}
                        <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`${t} etiketini kaldır`}><X size={12} /></button>
                    </span>
                ))}
                {value.length < max && (
                    <input className="admin-input" value={text} placeholder={value.length ? 'Ekle…' : 'ör. Voleybol, Filenin Sultanları'} aria-label="Etiket ekle"
                        onChange={(e) => { setText(e.target.value); if (e.target.value.trim().length < 2) setSuggest([]); }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); }
                            else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
                        }}
                        onBlur={() => text.trim() && add(text)} />
                )}
            </div>
            {suggest.length > 0 && (
                <div className="tag-suggest">
                    {suggest.slice(0, 6).map((s) => (
                        <button type="button" key={s.id} onMouseDown={(e) => e.preventDefault()} onClick={() => add(s.name)}>{s.name} <small>{s.count}</small></button>
                    ))}
                </div>
            )}
        </div>
    );
}
