import React, { useEffect, useState } from 'react';
import './LoginIntro.css';

/** Evento que emite LoginView tras un inicio de sesión correcto. */
export const LOGIN_SUCCESS_EVENT = 'oasis:login-success';
const PLAYED_KEY = 'oasis-intro-played';
const FULL_MS = 1500; // temporizador de seguridad (animación: 1450 ms)
const REDUCED_MS = 200; // fundido de 150 ms + margen

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
 * Capa superpuesta de una sola reproducción por sesión. No participa en la
 * navegación ni en la carga de roles: se retira con un temporizador propio.
 */
export const LoginIntro: React.FC = () => {
  const [active, setActive] = useState(false);

  // Escucha el login correcto; solo una vez por sesión del navegador.
  useEffect(() => {
    const onLogin = () => {
      try {
        if (sessionStorage.getItem(PLAYED_KEY)) return;
        sessionStorage.setItem(PLAYED_KEY, '1');
      } catch {
        /* sessionStorage no disponible: se reproduce igualmente */
      }
      setActive(true);
    };
    window.addEventListener(LOGIN_SUCCESS_EVENT, onLogin);
    return () => window.removeEventListener(LOGIN_SUCCESS_EVENT, onLogin);
  }, []);

  // Temporizador de seguridad + saltar con clic, toque o tecla.
  useEffect(() => {
    if (!active) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const hide = () => setActive(false);
    const timer = window.setTimeout(hide, reduced ? REDUCED_MS : FULL_MS);
    window.addEventListener('keydown', hide);
    window.addEventListener('pointerdown', hide);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', hide);
      window.removeEventListener('pointerdown', hide);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="oasis-intro" aria-hidden="true" onClick={() => setActive(false)}>
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
