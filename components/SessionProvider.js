"use client";
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Giriş yapan kullanıcı bilgisi tarayıcıda /api/me ile alınır.
// Böylece herkese açık sayfalar kullanıcıdan bağımsız olur ve önbelleğe alınabilir.
const SessionContext = createContext({ user: null, loading: true, refresh: () => { } });

export function SessionProvider({ children }) {
    const pathname = usePathname();
    const [state, setState] = useState({ user: null, loading: true });

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/me', { cache: 'no-store' });
            const data = await res.json();
            setState({ user: data.user ?? null, loading: false });
        } catch {
            setState((s) => ({ ...s, loading: false }));
        }
    }, []);

    // Sayfa değişince (ör. girişten sonra yönlendirme) yeniden kontrol et
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refresh();
    }, [pathname, refresh]);

    return <SessionContext.Provider value={{ ...state, refresh }}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
