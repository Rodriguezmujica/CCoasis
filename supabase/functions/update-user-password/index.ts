import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // 1. Manejo de preflight CORS (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método no permitido. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 2. Verificar cabecera de autorización
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: falta cabecera de autenticación.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Configuración del servidor incompleta (variables de entorno no encontradas).' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Cliente con sesión del usuario invocador (rol authenticated)
    const callerClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey, {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user: callerUser },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Sesión no válida o expirada. Por favor, inicia sesión de nuevo.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Verificar que el usuario invocador tenga rol 'admin' mediante función RPC SECURITY DEFINER
    const { data: isAdmin, error: rpcError } = await callerClient.rpc('is_admin');

    if (rpcError) {
      return new Response(
        JSON.stringify({ error: `Error al verificar permisos de administrador: ${rpcError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado: solo los administradores pueden cambiar la contraseña de otros usuarios.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Leer y validar cuerpo de la petición
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Cuerpo de solicitud inválido (se esperaba formato JSON).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id, password } = body;

    if (!user_id || typeof user_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Debes proporcionar un ID de usuario válido (user_id).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Cliente administrativo con clave service_role (para auth.admin)
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 7. Actualizar la contraseña del usuario objetivo en Supabase Auth
    const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(
      user_id,
      { password: password }
    );

    if (updateError || !updateData?.user) {
      let friendlyMsg = updateError?.message || 'Error al actualizar la contraseña del usuario.';
      const lower = friendlyMsg.toLowerCase();
      if (lower.includes('user not found')) {
        friendlyMsg = 'El usuario especificado no fue encontrado en el sistema.';
      } else if (lower.includes('password should be different')) {
        friendlyMsg = 'La nueva contraseña debe ser diferente a la contraseña anterior.';
      }
      return new Response(
        JSON.stringify({ error: friendlyMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Registrar en audit_logs desde el servidor si la tabla existe
    try {
      await adminClient.from('audit_logs').insert({
        user_id: callerUser.id,
        user_email: callerUser.email,
        action: 'UPDATE_PASSWORD',
        target_table: 'users',
        target_id: user_id,
        details: {
          action_type: 'ADMIN_RESET_PASSWORD',
          target_user_id: user_id,
          target_email: updateData.user.email,
          updated_by: callerUser.email,
        },
      });
    } catch (_auditErr) {
      // Ignorar si falla el log en servidor (el cliente también lo registra de forma resiliente)
    }

    // 9. Respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        user_id: user_id,
        message: 'Contraseña actualizada correctamente.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Error interno del servidor: ${err?.message || String(err)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
