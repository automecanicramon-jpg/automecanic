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
  action,
  description,
  clientId,
}: {
  adminClient: ReturnType<typeof createClient>;
  mechanicId: number | string;
  action: "ACTUALIZAR" | "ELIMINAR";
  description: string;
  clientId: number | string;
}) => {
  const { error } = await adminClient.rpc(
    "registrar_accion_mecanico_y_notificar_admin",
    {
      p_id_mecanico: Number(mechanicId),
      p_tipo_accion: action,
      p_modulo: "Clientes",
      p_descripcion: description,
      p_referencia_id: Number(clientId),
      p_id_vehiculo: null,
    },
  );

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
        error: "Solo una cuenta de mecánico puede administrar clientes desde este módulo.",
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
    const mechanicName = [
      mechanic.usuario?.nombre,
      mechanic.usuario?.apellido_paterno,
      mechanic.usuario?.apellido_materno,
    ].filter(Boolean).join(" ").trim() || "El mecánico";

    const payload = await request.json();
    const action = String(payload.action || "");
    const idCliente = Number(payload.id_cliente);

    if (!Number.isInteger(idCliente) || idCliente < 1) {
      return respond({ success: false, error: "El identificador del cliente no es válido." }, 400);
    }

    const { data: clientLink, error: linkLookupError } = await adminClient
      .from("mecanico_cliente")
      .select("id_cliente")
      .eq("id_mecanico", mechanic.id_mecanico)
      .eq("id_cliente", idCliente)
      .maybeSingle();

    if (linkLookupError) throw linkLookupError;

    const { data: assignedVehicles, error: vehicleLookupError } = await adminClient
      .from("vehiculo")
      .select("id_vehiculo")
      .eq("id_mecanico", mechanic.id_mecanico)
      .eq("id_cliente", idCliente)
      .limit(1);

    if (vehicleLookupError) throw vehicleLookupError;

    if (!clientLink && !assignedVehicles?.length) {
      return respond({
        success: false,
        error: "El cliente no pertenece a la cartera de este mecánico.",
      }, 403);
    }

    const { data: customer, error: customerError } = await adminClient
      .from("cliente")
      .select("id_cliente, id_usuario, direccion")
      .eq("id_cliente", idCliente)
      .maybeSingle();

    if (customerError) throw customerError;
    if (!customer) {
      return respond({ success: false, error: "No se encontró el cliente." }, 404);
    }

    const { data: customerUser, error: customerUserError } = await adminClient
      .from("usuario")
      .select("id_usuario, id_rol, auth_id, nombre, apellido_paterno, apellido_materno, correo, telefono, estatus")
      .eq("id_usuario", customer.id_usuario)
      .maybeSingle();

    if (customerUserError) throw customerUserError;
    if (!customerUser || Number(customerUser.id_rol) !== 3) {
      return respond({ success: false, error: "No se encontró un perfil de cliente válido." }, 404);
    }

    if (action === "update-status") {
      const status = String(payload.estatus || "");
      if (status !== "Activo" && status !== "Inactivo") {
        return respond({ success: false, error: "El estado seleccionado no es válido." }, 400);
      }

      const { error } = await adminClient
        .from("usuario")
        .update({ estatus: status })
        .eq("id_usuario", customerUser.id_usuario);

      if (error) throw error;

      const customerName = [
        customerUser.nombre,
        customerUser.apellido_paterno,
        customerUser.apellido_materno,
      ].filter(Boolean).join(" ").trim() || `cliente #${idCliente}`;

      await recordMechanicAction({
        adminClient,
        mechanicId: mechanic.id_mecanico,
        action: "ACTUALIZAR",
        description: `${mechanicName} cambió el estado del cliente ${customerName} de ${customerUser.estatus} a ${status}.`,
        clientId: idCliente,
      });

      return respond({ success: true });
    }

    if (action === "update") {
      const nombre = String(payload.nombre || "").trim();
      const apellidoPaterno = String(payload.apellido_paterno || "").trim();
      const apellidoMaterno = String(payload.apellido_materno || "").trim();
      const correo = String(payload.correo || "").trim().toLowerCase();
      const telefono = String(payload.telefono || "").trim();
      const direccion = String(payload.direccion || "").trim();
      const estatus = String(payload.estatus || "").trim();

      if (!nombre || !apellidoPaterno || !correo) {
        return respond({
          success: false,
          error: "Nombre, apellido paterno y correo son obligatorios.",
        }, 400);
      }

      if (estatus !== "Activo" && estatus !== "Inactivo") {
        return respond({ success: false, error: "El estado seleccionado no es válido." }, 400);
      }

      const { data: existingUser, error: existingUserError } = await adminClient
        .from("usuario")
        .select("id_usuario")
        .ilike("correo", correo)
        .neq("id_usuario", customerUser.id_usuario)
        .maybeSingle();

      if (existingUserError) throw existingUserError;
      if (existingUser) {
        return respond({ success: false, error: "El correo electrónico ya está registrado." }, 409);
      }

      const oldEmail = customerUser.correo;
      if (customerUser.auth_id && oldEmail !== correo) {
        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
          customerUser.auth_id,
          { email: correo, email_confirm: true },
        );
        if (authUpdateError) throw authUpdateError;
      }

      const { error: profileUpdateError } = await adminClient
        .from("usuario")
        .update({
          nombre,
          apellido_paterno: apellidoPaterno,
          apellido_materno: apellidoMaterno || null,
          correo,
          telefono: telefono || null,
          estatus,
        })
        .eq("id_usuario", customerUser.id_usuario);

      if (profileUpdateError) {
        if (customerUser.auth_id && oldEmail !== correo) {
          const { error: rollbackError } = await adminClient.auth.admin.updateUserById(
            customerUser.auth_id,
            { email: oldEmail, email_confirm: true },
          );
          if (rollbackError) {
            console.error("No se pudo revertir el correo de autenticación:", rollbackError);
          }
        }
        throw profileUpdateError;
      }

      const { error: addressUpdateError } = await adminClient
        .from("cliente")
        .update({ direccion: direccion || null })
        .eq("id_cliente", idCliente);

      if (addressUpdateError) {
        console.error("El perfil se actualizó, pero falló la dirección:", addressUpdateError);
        const { error: profileRollbackError } = await adminClient
          .from("usuario")
          .update({
            nombre: customerUser.nombre,
            apellido_paterno: customerUser.apellido_paterno,
            apellido_materno: customerUser.apellido_materno,
            correo: oldEmail,
            telefono: customerUser.telefono,
            estatus: customerUser.estatus,
          })
          .eq("id_usuario", customerUser.id_usuario);
        if (profileRollbackError) {
          console.error("No se pudo revertir el perfil actualizado:", profileRollbackError);
        }

        if (customerUser.auth_id && oldEmail !== correo) {
          const { error: authRollbackError } = await adminClient.auth.admin.updateUserById(
            customerUser.auth_id,
            { email: oldEmail, email_confirm: true },
          );
          if (authRollbackError) {
            console.error("No se pudo revertir el correo de autenticación:", authRollbackError);
          }
        }

        return respond({
          success: false,
          error: "El perfil se actualizó, pero no fue posible guardar la dirección.",
        }, 500);
      }

      const customerName = [
        nombre,
        apellidoPaterno,
        apellidoMaterno,
      ].filter(Boolean).join(" ").trim();

      await recordMechanicAction({
        adminClient,
        mechanicId: mechanic.id_mecanico,
        action: "ACTUALIZAR",
        description: `${mechanicName} actualizó los datos del cliente ${customerName} (${correo}).`,
        clientId: idCliente,
      });

      return respond({ success: true });
    }

    if (action === "delete") {
      const [vehiclesResult, appointmentsResult] = await Promise.all([
        adminClient
          .from("vehiculo")
          .select("id_vehiculo", { count: "exact", head: true })
          .eq("id_cliente", idCliente),
        adminClient
          .from("cita")
          .select("id_cita", { count: "exact", head: true })
          .eq("id_cliente", idCliente),
      ]);

      if (vehiclesResult.error) throw vehiclesResult.error;
      if (appointmentsResult.error) throw appointmentsResult.error;

      const vehicles = Number(vehiclesResult.count || 0);
      const appointments = Number(appointmentsResult.count || 0);
      if (vehicles + appointments > 0) {
        return respond({
          success: false,
          error: `No se puede eliminar este cliente porque tiene información relacionada. Vehículos: ${vehicles}, citas: ${appointments}. Puedes cambiar su estado a Inactivo.`,
        }, 409);
      }

      const { count: otherMechanicLinks, error: otherLinksError } = await adminClient
        .from("mecanico_cliente")
        .select("id_cliente", { count: "exact", head: true })
        .eq("id_cliente", idCliente)
        .neq("id_mecanico", mechanic.id_mecanico);

      if (otherLinksError) throw otherLinksError;
      if (Number(otherMechanicLinks || 0) > 0) {
        return respond({
          success: false,
          error: "Este cliente también pertenece a otro mecánico y no se puede eliminar desde esta cuenta.",
        }, 409);
      }

      const { error: linksError } = await adminClient
        .from("mecanico_cliente")
        .delete()
        .eq("id_mecanico", mechanic.id_mecanico)
        .eq("id_cliente", idCliente);

      if (linksError) throw linksError;

      const { error: deleteCustomerError } = await adminClient
        .from("cliente")
        .delete()
        .eq("id_cliente", idCliente);

      if (deleteCustomerError) throw deleteCustomerError;

      const { error: deleteProfileError } = await adminClient
        .from("usuario")
        .delete()
        .eq("id_usuario", customerUser.id_usuario);

      if (deleteProfileError) throw deleteProfileError;

      if (customerUser.auth_id) {
        const { error: deleteAuthError } = await adminClient.auth.admin
          .deleteUser(customerUser.auth_id);
        if (deleteAuthError) throw deleteAuthError;
      }

      const deletedCustomerName = [
        customerUser.nombre,
        customerUser.apellido_paterno,
        customerUser.apellido_materno,
      ].filter(Boolean).join(" ").trim() || `cliente #${idCliente}`;

      await recordMechanicAction({
        adminClient,
        mechanicId: mechanic.id_mecanico,
        action: "ELIMINAR",
        description: `${mechanicName} eliminó al cliente ${deletedCustomerName}.`,
        clientId: idCliente,
      });

      return respond({ success: true });
    }

    return respond({ success: false, error: "La acción solicitada no es válida." }, 400);
  } catch (error) {
    console.error("Error gestionando cliente del mecánico:", error);
    return respond({
      success: false,
      error: error instanceof Error ? error.message : "No fue posible completar la operación.",
    }, 500);
  }
});
