import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { ClassMaterial } from '../types/classroom';
import { parseClassroomError } from './useClassroom';

// Tiempo de validez de la URL firmada (1 hora)
const SIGNED_URL_EXPIRY = 3600;

export function useMaterials(cycleId: string) {
  const [materials, setMaterials] = useState<ClassMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cargar materiales del ciclo
  const fetchMaterials = useCallback(async () => {
    if (!cycleId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('class_materials')
        .select('*')
        .eq('cycle_id', cycleId)
        .order('created_at', { ascending: false });

      if (!mountedRef.current) return;
      if (err) {
        setError(parseClassroomError(err));
      } else {
        setMaterials((data || []) as ClassMaterial[]);
      }
    } catch (err) {
      if (mountedRef.current) setError(parseClassroomError(err));
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [cycleId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  /**
   * Añadir un material tipo ENLACE (URL externa).
   */
  const addLink = async (params: {
    title: string;
    description?: string;
    external_url: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error: insErr } = await supabase.from('class_materials').insert({
        cycle_id: cycleId,
        title: params.title.trim(),
        description: params.description?.trim() || null,
        external_url: params.external_url.trim(),
        file_url: null,
      });
      if (insErr) return { ok: false, error: parseClassroomError(insErr) };
      await fetchMaterials();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  /**
   * Añadir un material tipo ARCHIVO: sube el File al bucket 'materials'
   * en la ruta <cycleId>/<nombre_sanitizado>, luego registra la ruta en la tabla.
   */
  const addFile = async (
    file: File,
    params: { title: string; description?: string }
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      // Sanitizar el nombre del archivo para evitar caracteres problemáticos
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${cycleId}/${Date.now()}_${sanitizedName}`;

      const { error: uploadErr } = await supabase.storage
        .from('materials')
        .upload(filePath, file, { upsert: false });

      if (uploadErr) {
        return {
          ok: false,
          error: `Error al subir el archivo: ${uploadErr.message}`,
        };
      }

      const { error: insErr } = await supabase.from('class_materials').insert({
        cycle_id: cycleId,
        title: params.title.trim(),
        description: params.description?.trim() || null,
        file_url: filePath,
        external_url: null,
      });

      if (insErr) {
        // Intentar borrar el archivo huérfano del Storage
        await supabase.storage.from('materials').remove([filePath]);
        return { ok: false, error: parseClassroomError(insErr) };
      }

      await fetchMaterials();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  /**
   * Obtener una URL firmada para un archivo del bucket 'materials'.
   * Válida SIGNED_URL_EXPIRY segundos.
   */
  const getSignedUrl = async (
    filePath: string
  ): Promise<{ url: string | null; error?: string }> => {
    try {
      const { data, error: signErr } = await supabase.storage
        .from('materials')
        .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

      if (signErr || !data?.signedUrl) {
        return { url: null, error: `No se pudo generar el enlace de descarga: ${signErr?.message}` };
      }
      return { url: data.signedUrl };
    } catch (err: any) {
      return { url: null, error: err?.message || 'Error al generar el enlace' };
    }
  };

  /**
   * Eliminar un material: borra el registro de la tabla y, si es archivo,
   * también lo elimina del bucket de Storage.
   */
  const deleteMaterial = async (
    material: ClassMaterial
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      // 1. Borrar el registro de la tabla
      const { error: delErr } = await supabase
        .from('class_materials')
        .delete()
        .eq('id', material.id);

      if (delErr) return { ok: false, error: parseClassroomError(delErr) };

      // 2. Si tiene archivo en Storage, borrarlo
      if (material.file_url) {
        const { error: storageErr } = await supabase.storage
          .from('materials')
          .remove([material.file_url]);
        if (storageErr) {
          // No es crítico: el registro ya está borrado, solo loguear
          console.warn('No se pudo eliminar el archivo del Storage:', storageErr.message);
        }
      }

      await fetchMaterials();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  return {
    materials,
    isLoading,
    error,
    fetchMaterials,
    addLink,
    addFile,
    getSignedUrl,
    deleteMaterial,
  };
}
