import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.109.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const recordMechanicAction = async ({
  adminClient,
  mechanicId,
  description,
  clientId,
}: {
  adminClient: ReturnType<typeof createClient>;
  mechanicId: number | string;
  description: string;
  clientId: number | string;
}) => {
  const { data, error } = await adminClient.rpc(
    "registrar_accion_mecanico_y_notificar_admin",
    {
      p_id_mecanico: Number(mechanicId),
      p_tipo_accion: "CREAR",
      p_modulo: "Clientes",
      p_descripcion: description,
      p_referencia_id: Number(clientId),
      p_id_vehiculo: null,
    },
  );

  if (error) {
    throw error;
  }

  return data;
};

const notifyMechanic = async ({
  adminClient,
  mechanicUserId,
  description,
}: {
  adminClient: ReturnType<typeof createClient>;
  mechanicUserId: number | string;
  description: string;
}) => {
  const { error } = await adminClient
    .from("alerta")
    .insert({
      id_vehiculo: null,
      id_usuario: mechanicUserId,
      tipo_alerta: "ACCION_MECANICO",
      nivel: "INFO",
      mensaje: description,
      estado: "PENDIENTE",
      fecha_programada: new Date().toISOString().slice(0, 10),
      fecha_lectura: null,
    });

  if (error) {
    throw error;
  }
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return respond({ success: false, error: "Método no permitido." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return respond({
      success: false,
      error: "No se pudo validar la sesión o configurar el servicio.",
    }, 401);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !authUser) {
      return respond({ success: false, error: "La sesión no es válida." }, 401);
    }

    const { data: mechanicUser, error: profileError } = await adminClient
      .from("usuario")
      .select("id_usuario, id_rol")
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!mechanicUser || Number(mechanicUser.id_rol) !== 2) {
      return respond({
        success: false,
        error: "Solo una cuenta de mecánico puede registrar clientes desde este módulo.",
      }, 403);
    }

    const { data: mechanic, error: mechanicError } = await adminClient
      .from("mecanico")
      .select(`
        id_mecanico,
        usuario:id_usuario (
          nombre,
          apellido_paterno,
          apellido_materno
        )
      `)
      .eq("id_usuario", mechanicUser.id_usuario)
      .single();

    if (mechanicError) throw mechanicError;

    const payload = await request.json();
    const nombre = String(payload.nombre || "").trim();
    const apellidoPaterno = String(payload.apellido_paterno || "").trim();
    const apellidoMaterno = String(payload.apellido_materno || "").trim();
    const correo = String(payload.correo || "").trim().toLowerCase();
    const contrasenia = String(payload.contrasenia || "");
    const telefono = String(payload.telefono || "").trim();
    const direccion = String(payload.direccion || "").trim();
    const estatus = String(payload.estatus || "").trim();

    if (
      !nombre ||
      !apellidoPaterno ||
      !apellidoMaterno ||
      !correo ||
      !telefono ||
      !direccion ||
      contrasenia.length < 6
    ) {
      return respond({
        success: false,
        error: "Todos los campos son obligatorios y la contraseña debe tener al menos 6 caracteres.",
      }, 400);
    }

    if (estatus !== "Activo" && estatus !== "Inactivo") {
      return respond({ success: false, error: "El estado seleccionado no es válido." }, 400);
    }

    const { data: existingUser, error: existingUserError } = await adminClient
      .from("usuario")
      .select("id_usuario")
      .ilike("correo", correo)
      .maybeSingle();

    if (existingUserError) throw existingUserError;
    if (existingUser) {
      return respond({ success: false, error: "El correo electrónico ya está registrado." }, 409);
    }

    const { data: createdAuth, error: createAuthError } = await adminClient.auth.admin
      .createUser({
        email: correo,
        password: contrasenia,
        email_confirm: true,
        user_metadata: { nombre, apellido_paterno: apellidoPaterno },
      });

    if (createAuthError) throw createAuthError;

    const authId = createdAuth.user.id;
    let idUsuario: number | string | null = null;
    let idCliente: number | string | null = null;

    try {
      const { data: createdProfile, error: createProfileError } = await adminClient
        .from("usuario")
        .insert({
          auth_id: authId,
          id_rol: 3,
          nombre,
          apellido_paterno: apellidoPaterno,
          apellido_materno: apellidoMaterno || null,
          correo,
          telefono: telefono || null,
          estatus,
        })
        .select("id_usuario")
        .single();

      if (createProfileError) throw createProfileError;
      idUsuario = createdProfile.id_usuario;

      const { data: createdCustomer, error: createCustomerError } = await adminClient
        .from("cliente")
        .insert({
          id_usuario: idUsuario,
          direccion: direccion || null,
        })
        .select("id_cliente")
        .single();

      if (createCustomerError) throw createCustomerError;
      idCliente = createdCustomer.id_cliente;

      const { error: linkError } = await adminClient
        .from("mecanico_cliente")
        .insert({
          id_mecanico: mechanic.id_mecanico,
          id_cliente: createdCustomer.id_cliente,
        });

      if (linkError) throw linkError;

      const mechanicName = [
        mechanic.usuario?.nombre,
        mechanic.usuario?.apellido_paterno,
        mechanic.usuario?.apellido_materno,
      ].filter(Boolean).join(" ").trim() || "Mecánico";
      const clientName = [
        nombre,
        apellidoPaterno,
        apellidoMaterno,
      ].filter(Boolean).join(" ").trim();
      const description = `${mechanicName} registró al cliente ${clientName} (${correo}).`;

      await notifyMechanic({
        adminClient,
        mechanicUserId: mechanicUser.id_usuario,
        description,
      });

      const activityId = await recordMechanicAction({
        adminClient,
        mechanicId: mechanic.id_mecanico,
        description,
        clientId: createdCustomer.id_cliente,
      });

      return respond({
        success: true,
        id_cliente: idCliente,
        id_mecanico: mechanic.id_mecanico,
        id_actividad: activityId,
      });
    } catch (error) {
      if (idCliente !== null) {
        const { error: linkRollbackError } = await adminClient
          .from("mecanico_cliente")
          .delete()
          .eq("id_mecanico", mechanic.id_mecanico)
          .eq("id_cliente", idCliente);
        if (linkRollbackError) {
          console.error("No se pudo revertir la asignación del cliente:", linkRollbackError);
        }

        const { error: customerRollbackError } = await adminClient
          .from("cliente")
          .delete()
          .eq("id_cliente", idCliente);
        if (customerRollbackError) {
          console.error("No se pudo revertir el registro del cliente:", customerRollbackError);
        }
      }

      if (idUsuario !== null) {
        const { error: profileRollbackError } = await adminClient
          .from("usuario")
          .delete()
          .eq("id_usuario", idUsuario);
        if (profileRollbackError) {
          console.error("No se pudo revertir el perfil creado:", profileRollbackError);
        }
      }
      const { error: rollbackError } = await adminClient.auth.admin.deleteUser(authId);
      if (rollbackError) {
        console.error("No se pudo revertir la cuenta de autenticación creada:", rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error registrando cliente para el mecánico:", error);
    return respond({
      success: false,
      error: error instanceof Error ? error.message : "No fue posible registrar el cliente.",
    }, 500);
  }
});
