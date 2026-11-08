import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePublicWelcomeData } from '../lib/usePublicWelcomeData';
import { PublicHeader } from '../components/publica/PublicHeader';
import { PublicHeroSection } from '../components/publica/PublicHeroSection';
import { PublicUpcomingEventsSection } from '../components/publica/PublicUpcomingEventsSection';
import { VidaEnOasisSection } from '../components/publica/VidaEnOasisSection';
import { PublicSchedulesAndFirstTimeSection } from '../components/publica/PublicSchedulesAndFirstTimeSection';
import { PublicContactAndPwaSection } from '../components/publica/PublicContactAndPwaSection';

export const PublicWelcomeView: React.FC = () => {
  const { session } = useAuth();
  const {
    settings,
    nextPublicCulto,
    upcomingPublicEvents,
    news,
    settingsState,
    eventsState,
    newsState,
  } = usePublicWelcomeData();

  const hasSession = Boolean(session);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] flex flex-col">
      {/* A) Cabecera pública superior (cian #23d5da con texto #1a1a1a + barra magenta #ae4a84 con texto blanco) */}
      <PublicHeader hasSession={hasSession} slogan={settings.slogan} />

      <main className="flex-1 pb-6">
        {/* B) Portada (Hero) con degradado Oasis (#0f9aa2 -> #ae4a84) y tarjeta del próximo culto */}
        <PublicHeroSection
          settings={settings}
          nextPublicCulto={nextPublicCulto}
          eventsState={eventsState}
        />

        {/* C) Sección "Próximos eventos" (calendario público en solo lectura) */}
        <PublicUpcomingEventsSection
          upcomingPublicEvents={upcomingPublicEvents}
          eventsState={eventsState}
        />

        {/* D) Sección "Vida en Oasis" (momentos y recuerdos de la comunidad) */}
        <VidaEnOasisSection
          news={news}
          loading={newsState.loading}
          error={newsState.error}
          onRetry={() => void newsState.retry()}
          instagramUrl={settings.instagram_url}
          variant="public"
        />

        {/* E) Sección "Horarios y ¿Primera vez?" */}
        <PublicSchedulesAndFirstTimeSection
          settings={settings}
          settingsState={settingsState}
        />

        {/* F) Contacto y Redes Sociales + G) Guía rápida PWA y Pie de página */}
        <PublicContactAndPwaSection
          settings={settings}
          hasSession={hasSession}
        />
      </main>
    </div>
  );
};

export default PublicWelcomeView;
