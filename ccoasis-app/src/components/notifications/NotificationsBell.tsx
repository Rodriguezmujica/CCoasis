import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  X,
  Megaphone,
  Mic,
  Calendar,
  AlertCircle,
  Info,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useNotifications } from '../../lib/useNotifications';
import {
  UserNotification,
  NOTIFICATION_TYPE_CONFIG,
  formatRelativeNotificationTime,
} from '../../types/notifications';

interface NotificationsBellProps {
  className?: string;
}

export const NotificationsBell: React.FC<NotificationsBellProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    actionLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleNotificationClick = async (notif: UserNotification) => {
    if (!notif.read_at) {
      await markAsRead(notif.id);
    }
    handleClose();
    if (notif.link_url) {
      navigate(notif.link_url);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  // Renderiza el icono correspondiente al tipo de notificación
  const renderTypeIcon = (notif: UserNotification) => {
    switch (notif.type) {
      case 'anuncio':
        return <Megaphone className="w-4 h-4 text-amber-600" />;
      case 'turno': {
        const titleLower = notif.title.toLowerCase();
        if (titleLower.includes('predicación') || titleLower.includes('alabanza') || titleLower.includes('dirección')) {
          return <Mic className="w-4 h-4 text-blue-600" />;
        }
        return <Calendar className="w-4 h-4 text-blue-600" />;
      }
      case 'alerta':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <>
      {/* Botón de la Campana */}
      <button
        type="button"
        onClick={handleOpen}
        title="Notificaciones"
        aria-label={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} no leídas)` : ''}`}
        className={`relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-95 ${className}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-rose-600 text-white text-[11px] font-bold rounded-full border-2 border-white shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modal / Drawer de Notificaciones */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end sm:p-4">
          {/* Backdrop con desenfoque suave */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Panel Lateral / Drawer táctil */}
          <div className="relative w-full sm:max-w-md h-full sm:h-[90vh] sm:max-h-[700px] bg-white sm:rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Cabecera del Panel */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base leading-tight">
                    Notificaciones
                  </h2>
                  <p className="text-xs text-slate-500">
                    {unreadCount === 0
                      ? 'No hay avisos pendientes'
                      : `${unreadCount} ${unreadCount === 1 ? 'aviso no leído' : 'avisos no leídos'}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={actionLoading}
                    title="Marcar todas como leídas"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100/70 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Marcar leídas</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                  aria-label="Cerrar panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lista de Notificaciones con scroll táctil */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Cargando notificaciones...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
                    <Bell className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">
                    Bandeja limpia
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    No tienes avisos ni turnos pendientes en este momento.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const typeConf = NOTIFICATION_TYPE_CONFIG[notif.type] || NOTIFICATION_TYPE_CONFIG.info;
                  const isUnread = !notif.read_at;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 transition-colors cursor-pointer group flex items-start gap-3.5 relative ${
                        isUnread
                          ? 'bg-blue-50/50 hover:bg-blue-50'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      {/* Indicador visual de no leída */}
                      {isUnread && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-blue-600 rounded-full" />
                      )}

                      {/* Icono del tipo */}
                      <div
                        className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border ${typeConf.iconBg} ${typeConf.badgeBorder}`}
                      >
                        {renderTypeIcon(notif)}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${typeConf.badgeBg} ${typeConf.badgeText} ${typeConf.badgeBorder}`}
                          >
                            {typeConf.label}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                            {formatRelativeNotificationTime(notif.created_at)}
                          </span>
                        </div>

                        <h4
                          className={`text-sm leading-snug mb-1 ${
                            isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-800'
                          }`}
                        >
                          {notif.title}
                        </h4>

                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-1.5">
                          {notif.message}
                        </p>

                        {/* Enlace o acción */}
                        {notif.link_url && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                            <span>Ver detalles</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Botón táctil para eliminar */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, notif.id)}
                        title="Eliminar notificación"
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all flex-shrink-0 self-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pie del Panel */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                <span>{notifications.length} {notifications.length === 1 ? 'notificación' : 'notificaciones'} en total</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={actionLoading}
                    className="font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
