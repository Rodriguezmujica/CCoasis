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

    // 4. Cliente administrativo con clave service_role (para auth.admin)
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 5. Verificar que el usuario invocador tenga rol 'admin' mediante función RPC SECURITY DEFINER
    const { data: isAdmin, error: rpcError } = await callerClient.rpc('is_admin');

    if (rpcError) {
      return new Response(
        JSON.stringify({ error: `Error al verificar permisos de administrador: ${rpcError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado: solo los administradores pueden crear nuevos usuarios.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Leer y validar cuerpo de la petición
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Cuerpo de solicitud inválido (se esperaba formato JSON).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, first_name, last_name, roles, person_id } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Debes proporcionar un correo electrónico válido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'La contraseña inicial debe tener al menos 6 caracteres.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFirstName = typeof first_name === 'string' ? first_name.trim() : '';
    const cleanLastName = typeof last_name === 'string' ? last_name.trim() : '';

    if (!person_id && (!cleanFirstName || !cleanLastName)) {
      return new Response(
        JSON.stringify({ error: 'Nombre y apellido son obligatorios para crear el usuario.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validRoles = ['admin', 'tesorero', 'maestro', 'alumno'];
    const assignedRoles: string[] = Array.isArray(roles) && roles.length > 0
      ? roles.filter((r: any) => validRoles.includes(r))
      : ['alumno'];

    if (assignedRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Debes seleccionar al menos un rol válido (admin, tesorero, maestro, alumno).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Si se indicó una persona existente, verificar su validez (usando callerClient con fallback adminClient)
    let existingPerson: any = null;
    if (person_id) {
      let pData = null;
      let pErr = null;

      const resCaller = await callerClient
        .from('persons')
        .select('id, first_name, last_name, email, user_id, deleted_at')
        .eq('id', person_id)
        .maybeSingle();

      if (resCaller.error) {
        const resAdmin = await adminClient
          .from('persons')
          .select('id, first_name, last_name, email, user_id, deleted_at')
          .eq('id', person_id)
          .maybeSingle();
        pData = resAdmin.data;
        pErr = resAdmin.error;
      } else {
        pData = resCaller.data;
      }

      if (pErr || !pData) {
        return new Response(
          JSON.stringify({ error: 'La persona seleccionada no existe en la base de datos.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (pData.deleted_at) {
        return new Response(
          JSON.stringify({ error: 'No es posible vincular una cuenta a una persona archivada.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (pData.user_id) {
        return new Response(
          JSON.stringify({ error: 'La persona seleccionada ya cuenta con un usuario vinculado.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      existingPerson = pData;
    }

    // 8. Crear el usuario en Supabase Auth mediante adminClient (requiere clave de servicio)
    const finalFirstName = cleanFirstName || existingPerson?.first_name || '';
    const finalLastName = cleanLastName || existingPerson?.last_name || '';

    const { data: createData, error: createUserError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: finalFirstName,
        last_name: finalLastName,
      },
    });

    if (createUserError || !createData.user) {
      let friendlyMsg = createUserError?.message || 'Error al crear usuario en autenticación.';
      const lower = friendlyMsg.toLowerCase();
      if (lower.includes('already registered') || lower.includes('already been registered') || lower.includes('email_exists')) {
        friendlyMsg = 'Ya existe un usuario registrado con este correo electrónico.';
      }
      return new Response(
        JSON.stringify({ error: friendlyMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = createData.user.id;
    let resolvedPersonId = person_id;

    // 9. Crear persona o vincular con link_person_to_user
    if (!person_id) {
      let newPersonData: any = null;
      let newPersonError: any = null;

      // Usar callerClient (el usuario invocador tiene rol admin y permisos plenos concedidos en public)
      const resCaller = await callerClient
        .from('persons')
        .insert({
          user_id: newUserId,
          first_name: finalFirstName,
          last_name: finalLastName,
          email: cleanEmail,
          status: 'activo',
        })
        .select('id')
        .single();

      if (resCaller.error) {
        // Fallback administrativo si callerClient encuentra algún impedimento
        const resAdmin = await adminClient
          .from('persons')
          .insert({
            user_id: newUserId,
            first_name: finalFirstName,
            last_name: finalLastName,
            email: cleanEmail,
            status: 'activo',
          })
          .select('id')
          .single();

        newPersonData = resAdmin.data;
        newPersonError = resAdmin.error || resCaller.error;
      } else {
        newPersonData = resCaller.data;
      }

      if (newPersonError || !newPersonData) {
        // Rollback: borrar usuario auth recién creado
        await adminClient.auth.admin.deleteUser(newUserId);

        let pErrMsg = newPersonError?.message || 'Error al guardar persona';
        if (pErrMsg.includes('idx_persons_email_unique') || pErrMsg.includes('duplicate key')) {
          pErrMsg = 'Ya existe una persona registrada con ese correo electrónico en la congregación.';
        }
        return new Response(
          JSON.stringify({ error: `Error al crear la ficha de persona: ${pErrMsg}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      resolvedPersonId = newPersonData.id;
    } else {
      // Vincular llamando a link_person_to_user mediante la sesión admin del invocador
      let linked = false;
      try {
        const { error: rpcError } = await callerClient.rpc('link_person_to_user', {
          p_person_id: person_id,
          p_email: cleanEmail,
        });
        if (!rpcError) {
          linked = true;
        }
      } catch {
        linked = false;
      }

      if (!linked) {
        // Fallback: actualizar persons directamente con callerClient
        const resCallerUpdate = await callerClient
          .from('persons')
          .update({
            user_id: newUserId,
            email: existingPerson?.email || cleanEmail,
          })
          .eq('id', person_id);

        if (!resCallerUpdate.error) {
          linked = true;
        } else {
          const resAdminUpdate = await adminClient
            .from('persons')
            .update({
              user_id: newUserId,
              email: existingPerson?.email || cleanEmail,
            })
            .eq('id', person_id);

          if (!resAdminUpdate.error) {
            linked = true;
          } else {
            await adminClient.auth.admin.deleteUser(newUserId);
            return new Response(
              JSON.stringify({
                error: `Error al vincular persona: ${resCallerUpdate.error.message || resAdminUpdate.error.message}`,
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // 10. Asignar roles en public.user_roles (usando callerClient con fallback adminClient)
    const roleRecords = assignedRoles.map((role) => ({
      user_id: newUserId,
      role,
    }));

    let rolesInsertError: any = null;
    const resCallerRoles = await callerClient
      .from('user_roles')
      .insert(roleRecords);

    if (resCallerRoles.error) {
      const resAdminRoles = await adminClient
        .from('user_roles')
        .insert(roleRecords);
      rolesInsertError = resAdminRoles.error;
    }

    if (rolesInsertError) {
      // Rollback de persona y usuario auth
      if (person_id) {
        await callerClient.from('persons').update({ user_id: null }).eq('id', person_id);
      } else if (resolvedPersonId) {
        await callerClient.from('persons').delete().eq('id', resolvedPersonId);
      }
      await adminClient.auth.admin.deleteUser(newUserId);

      return new Response(
        JSON.stringify({ error: `Error al asignar roles: ${rolesInsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 11. Respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        person_id: resolvedPersonId,
        email: cleanEmail,
        roles: assignedRoles,
        message: 'Usuario creado y configurado exitosamente.',
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
