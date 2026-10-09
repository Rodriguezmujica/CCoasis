import { AppRole } from '../types/auth';
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  ShieldCheck, 
  BookOpen,
  Calendar,
  ShieldAlert,
  LucideIcon 
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  allowedRoles: AppRole[];
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'calendario',
    label: 'Calendario',
    path: '/calendario',
    allowedRoles: ['admin', 'tesorero', 'maestro', 'alumno'],
    icon: Calendar,
    description: 'Agenda de cultos, oración, eventos y actividades congregacionales',
  },
  {
    id: 'personas',
    label: 'Personas',
    path: '/personas',
    allowedRoles: ['admin'],
    icon: Users,
    description: 'Directorio de miembros, visitas y contactos congregacionales',
  },
  {
    id: 'clases',
    label: 'Clases',
    path: '/clases',
    allowedRoles: ['admin'],
    icon: GraduationCap,
    description: 'Gestión global de cursos, ciclos y asignación académica',
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    path: '/finanzas',
    allowedRoles: ['admin', 'tesorero'],
    icon: Wallet,
    description: 'Control de ingresos, ofrendas y egresos con comprobantes',
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    path: '/usuarios',
    allowedRoles: ['admin'],
    icon: ShieldCheck,
    description: 'Administración de accesos y asignación de roles del sistema',
  },
  {
    id: 'auditoria',
    label: 'Auditoría',
    path: '/auditoria',
    allowedRoles: ['admin'],
    icon: ShieldAlert,
    description: 'Registro cronológico y control de acciones críticas del sistema',
  },
  {
    id: 'mis-clases',
    label: 'Mis clases',
    path: '/mis-clases',
    allowedRoles: ['maestro', 'alumno'],
    icon: BookOpen,
    description: 'Portal de aprendizaje, sesiones, asistencias y entregas',
  },
];

/**
 * Filtra los elementos de navegación accesibles según los roles del usuario.
 * Un usuario puede poseer múltiples roles y recibirá la unión de módulos permitidos.
 */
export function getAvailableNavItems(userRoles: AppRole[]): NavItemConfig[] {
  if (!userRoles || userRoles.length === 0) return [];
  return NAV_ITEMS.filter((item) =>
    item.allowedRoles.some((role) => userRoles.includes(role))
  );
}

/**
 * Comprueba si un usuario con determinados roles tiene permiso para una ruta específica.
 */
export function canAccessPath(path: string, userRoles: AppRole[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  const match = NAV_ITEMS.find((item) => item.path === path);
  if (!match) return false;
  return match.allowedRoles.some((role) => userRoles.includes(role));
}

/**
 * Obtiene la ruta por defecto a la que redirigir según los roles del usuario.
 */
export function getDefaultPathForRoles(userRoles: AppRole[]): string {
  const available = getAvailableNavItems(userRoles);
  if (available.length > 0) {
    return available[0].path;
  }
  return '/sin-permisos';
}
