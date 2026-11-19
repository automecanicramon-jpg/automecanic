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

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "No fue posible eliminar el mecánico.";
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

    const { data: adminProfile, error: profileError } = await adminClient
      .from("usuario")
      .select("id_rol")
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!adminProfile || Number(adminProfile.id_rol) !== 1) {
      return respond({
        success: false,
        error: "Solo un administrador puede eliminar personal.",
      }, 403);
    }

    let payload: Record<string, unknown>;

    try {
      payload = await request.json();
    } catch {
      return respond({ success: false, error: "La solicitud no contiene JSON válido." }, 400);
    }

    const mechanicId = String(payload.id_mecanico || "").trim();

    if (!mechanicId) {
      return respond({ success: false, error: "Falta el identificador del mecánico." }, 400);
    }

    const { data: mechanic, error: mechanicError } = await adminClient
      .from("mecanico")
      .select("id_mecanico, id_usuario")
      .eq("id_mecanico", mechanicId)
      .maybeSingle();

    if (mechanicError) throw mechanicError;

    let authId: string | null = null;

    if (mechanic) {
      const { data: mechanicUser, error: userError } = await adminClient
        .from("usuario")
        .select("auth_id")
        .eq("id_usuario", mechanic.id_usuario)
        .maybeSingle();

      if (userError) throw userError;
      authId = mechanicUser?.auth_id || null;

      const { data, error } = await authClient.rpc(
        "eliminar_personal_admin",
        { p_id_mecanico: mechanicId },
      );

      if (error) throw error;
      if (data !== true) {
        throw new Error("La base de datos no confirmó la eliminación del mecánico.");
      }
    } else {
      const { data: archivedMechanic, error: archiveError } = await adminClient
        .from("mecanico_eliminado_historial")
        .select("auth_id")
        .eq("id_mecanico", mechanicId)
        .maybeSingle();

      if (archiveError) throw archiveError;
      if (!archivedMechanic) {
        return respond({ success: false, error: "No se encontró el mecánico." }, 404);
      }

      authId = archivedMechanic.auth_id;
    }

    if (authId) {
      const {
        data: authRecord,
        error: lookupError,
      } = await adminClient.auth.admin.getUserById(authId);

      if (lookupError && lookupError.status !== 404) {
        throw lookupError;
      }

      if (authRecord?.user) {
        const { error: deleteAuthError } =
          await adminClient.auth.admin.deleteUser(authId);

        if (deleteAuthError) throw deleteAuthError;
      }

      const { error: clearAuthIdError } = await adminClient
        .from("mecanico_eliminado_historial")
        .update({ auth_id: null })
        .eq("id_mecanico", mechanicId);

      if (clearAuthIdError) throw clearAuthIdError;
    }

    return respond({ success: true });
  } catch (error) {
    console.error("Error eliminando personal:", error);

    return respond({
      success: false,
      error: getErrorMessage(error),
    }, 500);
  }
});
