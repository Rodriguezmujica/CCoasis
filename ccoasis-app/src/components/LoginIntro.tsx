import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginIntro.css';

const FULL_MS = 1500; // temporizador de seguridad (animación: 1450 ms)
const REDUCED_MS = 200; // fundido de 150 ms + margen

type Mode = 'open' | 'close';

const Symbol: React.FC = () => (
  <svg className="oasis-intro__symbol" viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <path d="M50 14 V70" stroke="#23d5da" strokeWidth="9" strokeLinecap="round" />
    <path d="M30 34 H70" stroke="#23d5da" strokeWidth="9" strokeLinecap="round" />
    <path
      d="M20 82 C 31 72, 42 80, 50 80 C 58 80, 69 72, 80 82"
      stroke="#23d5da"
      strokeWidth="7"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Capa superpuesta: el libro se abre cuando aparece una sesión (login o
 * apertura de la app con sesión guardada) y se cierra al cerrar sesión.
 * Solo observa la sesión; no participa en la navegación ni en la carga de
 * roles, y se retira con un temporizador propio.
 */
export const LoginIntro: React.FC = () => {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const prevUserId = useRef<string | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);

  // useLayoutEffect: la capa se pinta en el mismo fotograma que la app (sin parpadeo).
  useLayoutEffect(() => {
    const prev = prevUserId.current;
    prevUserId.current = userId;
    if (userId && !prev) setMode('open');
    else if (!userId && prev) setMode('close');
  }, [userId]);

  // Temporizador de seguridad + saltar con clic, toque o tecla.
  useEffect(() => {
    if (!mode) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const hide = () => setMode(null);
    const timer = window.setTimeout(hide, reduced ? REDUCED_MS : FULL_MS);
    window.addEventListener('keydown', hide);
    window.addEventListener('pointerdown', hide);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', hide);
      window.removeEventListener('pointerdown', hide);
    };
  }, [mode]);

  if (!mode) return null;

  return (
    <div
      className={`oasis-intro oasis-intro--${mode}`}
      aria-hidden="true"
      onClick={() => setMode(null)}
    >
      <div className="oasis-intro__book">
        <div className="oasis-intro__pages" />
        <div className="oasis-intro__cover">
          <div className="oasis-intro__face oasis-intro__face--front">
            <Symbol />
          </div>
          <div className="oasis-intro__face oasis-intro__face--back" />
        </div>
      </div>
    </div>
  );
};
