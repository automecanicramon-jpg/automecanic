import { supabase } from "./supabase.js";
import { obtenerMecanicosConHistorial } from "./personalService.js";

/* ============================================================
   UTILIDADES
============================================================ */

const hoyISO = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    now.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const fechaHoraCita = (cita) => {
  if (
    !cita?.fecha ||
    !cita?.hora
  ) {
    return null;
  }

  const value =
    `${cita.fecha}T${cita.hora}`;

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
};


/* ============================================================
   ACTIVIDADES DE MECÁNICOS
============================================================ */

export const obtenerActividadesMecanicos =
  async (idMecanico = null) => {
    let actividadQuery = supabase
      .from("actividad_mecanico")
      .select(`
        id_actividad,
        id_mecanico,
        tipo_accion,
        modulo,
        descripcion,
        referencia_id,
        fecha_registro
      `);

    if (idMecanico !== null) {
      actividadQuery = actividadQuery.eq(
        "id_mecanico",
        idMecanico,
      );
    }

    const {
      data: actividades,
      error: actividadError,
    } = await actividadQuery.order(
      "fecha_registro",
      {
        ascending: false,
      },
    );

    if (actividadError) {
      throw actividadError;
    }

    if (!actividades?.length) {
      return [];
    }

    const mecanicosIds = [
      ...new Set(
        actividades
          .map(
            item =>
              item.id_mecanico,
          )
          .filter(Boolean),
      ),
    ];

    const mecanicos =
      await obtenerMecanicosConHistorial(mecanicosIds);

    const usuarioIds = [
      ...new Set(
        mecanicos
          .map(
            item =>
              item.id_usuario,
          )
          .filter(Boolean),
      ),
    ];

    let usuarios = [];

    if (usuarioIds.length) {
      const {
        data,
        error,
      } = await supabase
        .from("usuario")
        .select(`
          id_usuario,
          nombre,
          apellido_paterno,
          apellido_materno,
          correo,
          estatus
        `)
        .in(
          "id_usuario",
          usuarioIds,
        );

      if (error) {
        throw error;
      }

      usuarios =
        data || [];
    }

    const usuariosMap =
      new Map(
        usuarios.map(
          usuario => [
            usuario.id_usuario,
            usuario,
          ],
        ),
      );

    const mecanicosMap =
      new Map(
        mecanicos
          .map(
            mecanico => [
              mecanico.id_mecanico,
              {
                ...mecanico,

                usuario:
                  mecanico.usuario ||
                  usuariosMap.get(
                    mecanico.id_usuario,
                  ) || null,
              },
            ],
          ),
      );

    return actividades.map(
      actividad => ({
        ...actividad,

        mecanico:
          mecanicosMap.get(
            actividad.id_mecanico,
          ) || null,
      }),
    );
  };


/* ============================================================
   REGISTRAR ACTIVIDAD
============================================================ */

export const registrarActividadMecanico =
  async ({
    id_mecanico,
    tipo_accion,
    modulo,
    descripcion,
    referencia_id = null,
  }) => {
    if (!id_mecanico) {
      throw new Error(
        "No se especificó el mecánico.",
      );
    }

    if (!tipo_accion) {
      throw new Error(
        "No se especificó la acción.",
      );
    }

    if (!modulo) {
      throw new Error(
        "No se especificó el módulo.",
      );
    }

    if (!descripcion) {
      throw new Error(
        "No se especificó la descripción.",
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("actividad_mecanico")
      .insert({
        id_mecanico:
          Number(id_mecanico),

        tipo_accion,

        modulo,

        descripcion,

        referencia_id:
          referencia_id
            ? Number(
                referencia_id,
              )
            : null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  };


/* ============================================================
   CITAS - UTILIDADES
============================================================ */

const normalizarEstadoCita = value =>
  String(value || "")
    .trim()
    .toUpperCase();


const validarIdNumerico = (
  value,
  mensaje,
) => {
  const id =
    Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(mensaje);
  }

  return id;
};


const obtenerClienteAutenticadoCita =
  async () => {
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (
      authError ||
      !authData?.user?.id
    ) {
      throw new Error(
        "No fue posible identificar la sesión del cliente.",
      );
    }

    const {
      data: usuario,
      error: usuarioError,
    } = await supabase
      .from("usuario")
      .select(`
        id_usuario,
        auth_id,
        nombre,
        apellido_paterno,
        apellido_materno,
        correo,
        telefono,
        estatus
      `)
      .eq(
        "auth_id",
        authData.user.id,
      )
      .maybeSingle();

    if (usuarioError) {
      throw usuarioError;
    }

    if (!usuario?.id_usuario) {
      throw new Error(
        "No se encontró el usuario asociado a la sesión actual.",
      );
    }

    const {
      data: cliente,
      error: clienteError,
    } = await supabase
      .from("cliente")
      .select(`
        id_cliente,
        id_usuario,
        direccion
      `)
      .eq(
        "id_usuario",
        usuario.id_usuario,
      )
      .maybeSingle();

    if (clienteError) {
      throw clienteError;
    }

    if (!cliente?.id_cliente) {
      throw new Error(
        "La cuenta actual no tiene un perfil de cliente asociado.",
      );
    }

    return {
      ...cliente,
      usuario,
    };
  };


const validarFechaHoraFutura = (
  fecha,
  hora,
) => {
  const fechaLimpia =
    String(fecha || "").trim();

  const horaLimpia =
    String(hora || "").trim();

  if (!fechaLimpia) {
    throw new Error(
      "Selecciona la fecha de la cita.",
    );
  }

  if (!horaLimpia) {
    throw new Error(
      "Selecciona la hora de la cita.",
    );
  }

  const fechaCita =
    fechaHoraCita({
      fecha: fechaLimpia,
      hora: horaLimpia,
    });

  if (!fechaCita) {
    throw new Error(
      "La fecha u hora de la cita no es válida.",
    );
  }

  if (
    fechaCita.getTime() <=
    Date.now()
  ) {
    throw new Error(
      "La cita debe programarse para una fecha y hora futuras.",
    );
  }

  return {
    fecha:
      fechaLimpia,

    hora:
      horaLimpia,

    fechaCita,
  };
};


const enriquecerCitas =
  async citas => {
    if (!citas?.length) {
      return [];
    }

    const clienteIds = [
      ...new Set(
        citas
          .map(
            item =>
              item.id_cliente,
          )
          .filter(Boolean),
      ),
    ];

    const vehiculoIds = [
      ...new Set(
        citas
          .map(
            item =>
              item.id_vehiculo,
          )
          .filter(Boolean),
      ),
    ];

    const mecanicoIds = [
      ...new Set(
        citas
          .map(
            item =>
              item.id_mecanico,
          )
          .filter(Boolean),
      ),
    ];

    const [
      clientesResult,
      vehiculosResult,
      mecanicosResult,
    ] = await Promise.all([
      clienteIds.length
        ? supabase
            .from("cliente")
            .select(`
              id_cliente,
              id_usuario,
              direccion
            `)
            .in(
              "id_cliente",
              clienteIds,
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),

      vehiculoIds.length
        ? supabase
            .from("vehiculo")
            .select(`
              id_vehiculo,
              id_cliente,
              id_mecanico,
              no_economico,
              placas,
              numero_serie,
              marca,
              modelo,
              anio_modelo,
              tipo_unidad,
              kilometraje_actual,
              estatus
            `)
            .in(
              "id_vehiculo",
              vehiculoIds,
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),

      mecanicoIds.length
        ? supabase
            .from("mecanico")
            .select(`
              id_mecanico,
              id_usuario,
              especialidad
            `)
            .in(
              "id_mecanico",
              mecanicoIds,
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),
    ]);

    if (clientesResult.error) {
      throw clientesResult.error;
    }

    if (vehiculosResult.error) {
      throw vehiculosResult.error;
    }

    if (mecanicosResult.error) {
      throw mecanicosResult.error;
    }

    const usuariosIds = [
      ...new Set(
        [
          ...(
            clientesResult.data ||
            []
          ).map(
            item =>
              item.id_usuario,
          ),

          ...(
            mecanicosResult.data ||
            []
          ).map(
            item =>
              item.id_usuario,
          ),
        ].filter(Boolean),
      ),
    ];

    let usuarios = [];

    if (usuariosIds.length) {
      const {
        data,
        error,
      } = await supabase
        .from("usuario")
        .select(`
          id_usuario,
          nombre,
          apellido_paterno,
          apellido_materno,
          correo,
          telefono,
          estatus
        `)
        .in(
          "id_usuario",
          usuariosIds,
        );

      if (error) {
        throw error;
      }

      usuarios =
        data || [];
    }

    const usuarioMap =
      new Map(
        usuarios.map(
          usuario => [
            usuario.id_usuario,
            usuario,
          ],
        ),
      );

    const clienteMap =
      new Map(
        (
          clientesResult.data ||
          []
        ).map(
          cliente => [
            cliente.id_cliente,
            {
              ...cliente,

              usuario:
                usuarioMap.get(
                  cliente.id_usuario,
                ) || null,
            },
          ],
        ),
      );

    const vehiculoMap =
      new Map(
        (
          vehiculosResult.data ||
          []
        ).map(
          vehiculo => [
            vehiculo.id_vehiculo,
            vehiculo,
          ],
        ),
      );

    const mecanicoMap =
      new Map(
        (
          mecanicosResult.data ||
          []
        ).map(
          mecanico => [
            mecanico.id_mecanico,
            {
              ...mecanico,

              usuario:
                usuarioMap.get(
                  mecanico.id_usuario,
                ) || null,
            },
          ],
        ),
      );

    return citas.map(
      cita => ({
        ...cita,

        cliente:
          clienteMap.get(
            cita.id_cliente,
          ) || null,

        vehiculo:
          vehiculoMap.get(
            cita.id_vehiculo,
          ) || null,

        mecanico:
          mecanicoMap.get(
            cita.id_mecanico,
          ) || null,
      }),
    );
  };


/* ============================================================
   CITAS - ADMINISTRADOR
============================================================ */

export const obtenerCitas =
  async () => {
    await actualizarCitasVencidas();

    const {
      data: citas,
      error: citasError,
    } = await supabase
      .from("cita")
      .select(`
        id_cita,
        id_cliente,
        id_vehiculo,
        id_mecanico,
        fecha,
        hora,
        motivo,
        observaciones,
        estado,
        fecha_registro
      `)
      .order(
        "fecha_registro",
        {
          ascending: false,
          nullsFirst: false,
        },
      )
      .order(
        "id_cita",
        {
          ascending: false,
        },
      );

    if (citasError) {
      throw citasError;
    }

    return enriquecerCitas(
      citas || [],
    );
  };


/* ============================================================
   CITAS - MECÁNICO
============================================================ */

export const obtenerCitasMecanico =
  async idMecanico => {
    const id =
      Number(idMecanico);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(
        "El identificador del mecánico no es válido.",
      );
    }

    const {
      error: vencidasError,
    } = await supabase.rpc(
      "actualizar_citas_vencidas_mecanico",
    );

    if (vencidasError) {
      throw vencidasError;
    }

    const [
      clientesResult,
      vehiculosResult,
    ] = await Promise.all([
      supabase
        .from("mecanico_cliente")
        .select("id_cliente")
        .eq("id_mecanico", id),

      supabase
        .from("vehiculo")
        .select("id_vehiculo, id_cliente")
        .eq("id_mecanico", id),
    ]);

    if (clientesResult.error) {
      throw clientesResult.error;
    }

    if (vehiculosResult.error) {
      throw vehiculosResult.error;
    }

    const clienteIds = [
      ...new Set([
        ...(clientesResult.data || []).map(item => item.id_cliente),
        ...(vehiculosResult.data || []).map(item => item.id_cliente),
      ].filter(Boolean)),
    ];
    const vehiculoIds = [
      ...new Set(
        (vehiculosResult.data || [])
          .map(item => item.id_vehiculo)
          .filter(Boolean),
      ),
    ];
    const citaFilters = [
      `id_mecanico.eq.${id}`,
    ];

    if (clienteIds.length) {
      citaFilters.push(
        `and(id_mecanico.is.null,id_vehiculo.is.null,id_cliente.in.(${clienteIds.join(",")}))`,
      );
    }

    if (vehiculoIds.length) {
      citaFilters.push(
        `and(id_vehiculo.in.(${vehiculoIds.join(",")}),or(id_mecanico.is.null,id_mecanico.eq.${id}))`,
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("cita")
      .select(`
        id_cita,
        id_cliente,
        id_vehiculo,
        id_mecanico,
        fecha,
        hora,
        fecha_propuesta,
        hora_propuesta,
        estado_reprogramacion,
        motivo,
        observaciones,
        estado,
        fecha_registro
      `)
      .or(citaFilters.join(","))
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true });

    if (error) {
      throw error;
    }

    return enriquecerCitas(data || []);
  };


export const cambiarEstadoCitaMecanico =
  async (
    idCita,
    estado,
  ) => {
    const id =
      validarIdNumerico(
        idCita,
        "La cita seleccionada no es válida.",
      );
    const estadoDestino =
      normalizarEstadoCita(estado);

    if (
      ![
        "EN_ATENCION",
        "ATENDIDA",
      ].includes(estadoDestino)
    ) {
      throw new Error(
        "La transición solicitada no está permitida.",
      );
    }

    const {
      error,
    } = await supabase.rpc(
      "cambiar_estado_cita_mecanico",
      {
        p_id_cita: id,
        p_estado: estadoDestino,
      },
    );

    if (error) {
      throw error;
    }

    return true;
  };

export const proponerReprogramacionCita =
  async (idCita, fecha, hora) => {
    const id = validarIdNumerico(
      idCita,
      "La cita seleccionada no es válida.",
    );

    const {
      error,
    } = await supabase.rpc(
      "proponer_reprogramacion_cita",
      {
        p_id_cita: id,
        p_fecha: fecha,
        p_hora: hora,
      },
    );

    if (error) {
      throw error;
    }

    return true;
  };

export const rechazarCitaMecanico =
  async idCita => {
    const id = validarIdNumerico(
      idCita,
      "La cita seleccionada no es válida.",
    );

    const {
      error,
    } = await supabase.rpc(
      "rechazar_cita_mecanico",
      { p_id_cita: id },
    );

    if (error) {
      throw error;
    }

    return true;
  };

export const resolverReprogramacionCitaCliente =
  async (idCita, aceptar) => {
    const id = validarIdNumerico(
      idCita,
      "La cita seleccionada no es válida.",
    );

    const {
      error,
    } = await supabase.rpc(
      "resolver_reprogramacion_cita_cliente",
      {
        p_id_cita: id,
        p_aceptar: Boolean(aceptar),
      },
    );

    if (error) {
      throw error;
    }

    return true;
  };


/* ============================================================
   CITAS - CLIENTE
============================================================ */

export const obtenerCitasCliente =
  async () => {
    await actualizarCitasVencidas();

    const cliente =
      await obtenerClienteAutenticadoCita();

    const {
      data,
      error,
    } = await supabase
      .from("cita")
      .select(`
        id_cita,
        id_cliente,
        id_vehiculo,
        id_mecanico,
        fecha,
        hora,
        fecha_propuesta,
        hora_propuesta,
        estado_reprogramacion,
        motivo,
        observaciones,
        estado,
        fecha_registro
      `)
      .eq(
        "id_cliente",
        cliente.id_cliente,
      )
      .order(
        "fecha",
        {
          ascending: false,
        },
      )
      .order(
        "hora",
        {
          ascending: false,
        },
      );

    if (error) {
      throw error;
    }

    return enriquecerCitas(
      data || [],
    );
  };


export const crearCitaCliente =
  async ({
    idVehiculo,
    id_vehiculo,
    fecha,
    hora,
    motivo,
    observaciones = null,
  } = {}) => {
    const cliente =
      await obtenerClienteAutenticadoCita();

    const idVehiculoNumerico =
      validarIdNumerico(
        idVehiculo ??
          id_vehiculo,
        "Selecciona un vehículo válido.",
      );

    const {
      fecha: fechaValidada,
      hora: horaValidada,
    } = validarFechaHoraFutura(
      fecha,
      hora,
    );

    const motivoLimpio =
      String(motivo || "")
        .trim();

    const observacionesLimpias =
      String(
        observaciones || "",
      ).trim();

    if (!motivoLimpio) {
      throw new Error(
        "Describe el motivo de la cita.",
      );
    }

    const {
      data: vehiculo,
      error: vehiculoError,
    } = await supabase
      .from("vehiculo")
      .select(`
        id_vehiculo,
        id_cliente,
        id_mecanico,
        placas,
        marca,
        modelo,
        estatus
      `)
      .eq(
        "id_vehiculo",
        idVehiculoNumerico,
      )
      .eq(
        "id_cliente",
        cliente.id_cliente,
      )
      .maybeSingle();

    if (vehiculoError) {
      throw vehiculoError;
    }

    if (!vehiculo) {
      throw new Error(
        "El vehículo seleccionado no pertenece al cliente autenticado.",
      );
    }

    const estatusVehiculo =
      String(
        vehiculo.estatus || "",
      )
        .trim()
        .toUpperCase();

    if (
      estatusVehiculo ===
        "INACTIVO" ||
      estatusVehiculo ===
        "INACTIVA"
    ) {
      throw new Error(
        "No se puede programar una cita para un vehículo inactivo.",
      );
    }

    const {
      data: duplicada,
      error: duplicadaError,
    } = await supabase
      .from("cita")
      .select(`
        id_cita,
        estado
      `)
      .eq(
        "id_cliente",
        cliente.id_cliente,
      )
      .eq(
        "id_vehiculo",
        idVehiculoNumerico,
      )
      .eq(
        "fecha",
        fechaValidada,
      )
      .eq(
        "hora",
        horaValidada,
      )
      .in(
        "estado",
        [
          "PROXIMA",
          "EN_ATENCION",
        ],
      )
      .limit(1)
      .maybeSingle();

    if (duplicadaError) {
      throw duplicadaError;
    }

    if (duplicada) {
      throw new Error(
        "Ya existe una cita activa para este vehículo en la misma fecha y hora.",
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("cita")
      .insert({
        id_cliente:
          cliente.id_cliente,

        id_vehiculo:
          idVehiculoNumerico,

        id_mecanico:
          vehiculo.id_mecanico || null,

        fecha:
          fechaValidada,

        hora:
          horaValidada,

        motivo:
          motivoLimpio,

        observaciones:
          observacionesLimpias ||
          null,

        estado:
          "PROXIMA",
      })
      .select(`
        id_cita,
        id_cliente,
        id_vehiculo,
        id_mecanico,
        fecha,
        hora,
        motivo,
        observaciones,
        estado,
        fecha_registro
      `)
      .single();

    if (error) {
      throw error;
    }

    // ============================================================
    // NOTIFICAR AL ADMINISTRADOR POR CORREO (vía Brevo)
    // Se ejecuta en segundo plano: NO bloquea ni retrasa la
    // confirmación de la cita al cliente.
    // ============================================================
    supabase.functions
      .invoke('enviar-notificacion-cita-admin', {
        body: { id_cita: data.id_cita },
      })
      .then(({ error: notificationError }) => {
        if (notificationError) {
          console.error(
            'La cita se creó, pero falló la notificación al administrador:',
            notificationError,
          );
        } else {
          console.log('Correo de notificación enviado al administrador.');
        }
      });

    return data;
  };


export const cancelarCitaCliente =
  async idCita => {
    const id =
      validarIdNumerico(
        idCita,
        "La cita seleccionada no es válida.",
      );

    const cliente =
      await obtenerClienteAutenticadoCita();

    await actualizarCitasVencidas();

    const {
      data: cita,
      error: consultaError,
    } = await supabase
      .from("cita")
      .select(`
        id_cita,
        id_cliente,
        id_vehiculo,
        fecha,
        hora,
        estado
      `)
      .eq(
        "id_cita",
        id,
      )
      .eq(
        "id_cliente",
        cliente.id_cliente,
      )
      .maybeSingle();

    if (consultaError) {
      throw consultaError;
    }

    if (!cita) {
      throw new Error(
        "No se encontró la cita o no pertenece al cliente autenticado.",
      );
    }

    const estadoActual =
      normalizarEstadoCita(
        cita.estado,
      );

    if (
      estadoActual !==
      "PROXIMA"
    ) {
      throw new Error(
        "Solo se pueden cancelar citas que todavía están próximas.",
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("cita")
      .update({
        estado:
          "CANCELADA",
      })
      .eq(
        "id_cita",
        id,
      )
      .eq(
        "id_cliente",
        cliente.id_cliente,
      )
      .eq(
        "estado",
        "PROXIMA",
      )
      .select(`
        id_cita,
        id_cliente,
        id_vehiculo,
        id_mecanico,
        fecha,
        hora,
        motivo,
        observaciones,
        estado,
        fecha_registro
      `)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        "La cita ya cambió de estado y no puede cancelarse.",
      );
    }

    return data;
  };


/* ============================================================
   ACTUALIZAR CITAS VENCIDAS
============================================================ */

export const actualizarCitasVencidas =
  async () => {
    const {
      data,
      error,
    } = await supabase
      .from("cita")
      .select(`
        id_cita,
        fecha,
        hora,
        estado
      `)
      .eq(
        "estado",
        "PROXIMA",
      );

    if (error) {
      throw error;
    }

    const now =
      new Date();

    const vencidas =
      (data || [])
        .filter(
          cita => {
            const fechaCita =
              fechaHoraCita(
                cita,
              );

            return (
              fechaCita &&
              fechaCita < now
            );
          },
        );

    if (!vencidas.length) {
      return 0;
    }

    const ids =
      vencidas.map(
        item =>
          item.id_cita,
      );

    const {
      error: updateError,
    } = await supabase
      .from("cita")
      .update({
        estado:
          "VENCIDA",
      })
      .in(
        "id_cita",
        ids,
      )
      .eq(
        "estado",
        "PROXIMA",
      );

    if (updateError) {
      throw updateError;
    }

    return ids.length;
  };


/* ============================================================
   CREAR ALERTA POR CANCELACIÓN DE CITA (ADMIN → CLIENTE)
   La alerta aparece en el panel del cliente y activa el correo transaccional.
============================================================ */

const crearAlertaCancelacionCita =
  async cita => {
    try {
      if (!cita?.id_cliente) {
        return;
      }

      const {
        data: cliente,
        error: clienteError,
      } = await supabase
        .from("cliente")
        .select(`
          id_cliente,
          id_usuario
        `)
        .eq(
          "id_cliente",
          cita.id_cliente,
        )
        .maybeSingle();

      if (
        clienteError ||
        !cliente?.id_usuario
      ) {
        console.error(
          "No se pudo obtener el cliente para crear la alerta de cancelación:",
          clienteError,
        );

        return;
      }

      const fechaBonita =
        new Date(
          `${cita.fecha}T12:00:00`,
        ).toLocaleDateString(
          "es-MX",
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
          },
        );

      const horaBonita =
        String(
          cita.hora || "",
        ).substring(0, 5);

      const mensaje =
        `Tu cita del ${fechaBonita}` +
        (
          horaBonita
            ? ` a las ${horaBonita}`
            : ""
        ) +
        " ha sido cancelada por el taller. " +
        "Por favor, comunícate con nosotros para reprogramarla.";

      const {
        error: alertaError,
      } = await supabase
        .from("alerta")
        .insert({
          id_vehiculo:
            cita.id_vehiculo ||
            null,

          id_usuario:
            cliente.id_usuario,

          tipo_alerta:
            "CITA_CANCELADA",

          nivel:
            "ADVERTENCIA",

          mensaje,

          estado:
            "PENDIENTE",

          fecha_programada:
            hoyISO(),

          fecha_lectura:
            null,
        });

      if (alertaError) {
        console.error(
          "No se pudo crear la alerta de cancelación:",
          alertaError,
        );
      }
    } catch (error) {
      // No rompemos la cancelación si falla la alerta.
      console.error(
        "Error creando alerta de cancelación de cita:",
        error,
      );
    }
  };


/* ============================================================
   CAMBIAR ESTADO DE CITA - ADMINISTRADOR
============================================================ */

export const cambiarEstadoCita =
  async (
    idCita,
    estado,
  ) => {
    const id =
      validarIdNumerico(
        idCita,
        "La cita seleccionada no es válida.",
      );

    const estadoDestino =
      normalizarEstadoCita(
        estado,
      );

    if (
      ![
        "EN_ATENCION",
        "ATENDIDA",
        "CANCELADA",
      ].includes(
        estadoDestino,
      )
    ) {
      throw new Error(
        "La transición solicitada no está permitida.",
      );
    }

    await actualizarCitasVencidas();

    const {
      data: cita,
      error: consultaError,
    } = await supabase
      .from("cita")
      .select(`
        id_cita,
        id_cliente,
        id_vehiculo,
        id_mecanico,
        fecha,
        hora,
        motivo,
        observaciones,
        estado,
        fecha_registro
      `)
      .eq(
        "id_cita",
        id,
      )
      .maybeSingle();

    if (consultaError) {
      throw consultaError;
    }

    if (!cita) {
      throw new Error(
        "La cita indicada no existe.",
      );
    }

    const estadoActual =
      normalizarEstadoCita(
        cita.estado,
      );

    const transicionesPermitidas = {
      PROXIMA: [
        "EN_ATENCION",
        "CANCELADA",
      ],

      EN_ATENCION: [
        "ATENDIDA",
      ],

      ATENDIDA: [],
      VENCIDA: [],
      CANCELADA: [],
    };

    const destinos =
      transicionesPermitidas[
        estadoActual
      ] || [];

    if (
      !destinos.includes(
        estadoDestino,
      )
    ) {
      throw new Error(
        `No se puede cambiar una cita ${estadoActual || "sin estado"} a ${estadoDestino}.`,
      );
    }

    if (
      estadoDestino ===
        "EN_ATENCION" &&
      !cita.id_mecanico
    ) {
      throw new Error(
        "Asigna un mecánico antes de iniciar la atención de la cita.",
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("cita")
      .update({
        estado:
          estadoDestino,
      })
      .eq(
        "id_cita",
        id,
      )
      .eq(
        "estado",
        estadoActual,
      )
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        "La cita cambió de estado antes de completar la operación. Actualiza la información e inténtalo nuevamente.",
      );
    }

    // La alerta también activa el envío del correo transaccional al cliente.
    if (
      estadoDestino ===
      "CANCELADA"
    ) {
      await crearAlertaCancelacionCita(
        data,
      );
    }

    return data;
  };


/* ============================================================
   MECÁNICOS DISPONIBLES PARA CITAS
============================================================ */

export const obtenerMecanicosCitas =
  async () => {
    const {
      data: mecanicos,
      error: mecanicosError,
    } = await supabase
      .from("mecanico")
      .select(`
        id_mecanico,
        id_usuario,
        especialidad
      `)
      .order(
        "id_mecanico",
        {
          ascending: true,
        },
      );

    if (mecanicosError) {
      throw mecanicosError;
    }

    if (!mecanicos?.length) {
      return [];
    }

    const usuarioIds = [
      ...new Set(
        mecanicos
          .map(
            mecanico =>
              mecanico.id_usuario,
          )
          .filter(Boolean),
      ),
    ];

    let usuarios = [];

    if (usuarioIds.length) {
      const {
        data,
        error,
      } = await supabase
        .from("usuario")
        .select(`
          id_usuario,
          nombre,
          apellido_paterno,
          apellido_materno,
          correo,
          telefono,
          estatus
        `)
        .in(
          "id_usuario",
          usuarioIds,
        );

      if (error) {
        throw error;
      }

      usuarios =
        data || [];
    }

    const usuarioMap =
      new Map(
        usuarios.map(
          usuario => [
            usuario.id_usuario,
            usuario,
          ],
        ),
      );

    return mecanicos
      .map(
        mecanico => ({
          ...mecanico,

          usuario:
            usuarioMap.get(
              mecanico.id_usuario,
            ) || null,
        }),
      )
      .filter(
        mecanico => {
          const estado =
            String(
              mecanico.usuario?.estatus ||
                "",
            )
              .trim()
              .toUpperCase();

          return ![
            "INACTIVO",
            "INACTIVA",
          ].includes(
            estado,
          );
        },
      );
  };


/* ============================================================
   ASIGNAR MECÁNICO A CITA - ADMINISTRADOR
============================================================ */

export const asignarMecanicoCita =
  async (
    idCita,
    idMecanico,
  ) => {
    const id =
      validarIdNumerico(
        idCita,
        "La cita seleccionada no es válida.",
      );

    const mecanicoId =
      idMecanico === null ||
      idMecanico === undefined ||
      idMecanico === ""
        ? null
        : validarIdNumerico(
            idMecanico,
            "El mecánico seleccionado no es válido.",
          );

    await actualizarCitasVencidas();

    const {
      data: cita,
      error: citaError,
    } = await supabase
      .from("cita")
      .select(`
        id_cita,
        id_mecanico,
        estado
      `)
      .eq(
        "id_cita",
        id,
      )
      .maybeSingle();

    if (citaError) {
      throw citaError;
    }

    if (!cita) {
      throw new Error(
        "La cita indicada no existe.",
      );
    }

    const estadoActual =
      normalizarEstadoCita(
        cita.estado,
      );

    if (
      ![
        "PROXIMA",
        "EN_ATENCION",
      ].includes(
        estadoActual,
      )
    ) {
      throw new Error(
        "No se puede modificar el mecánico de una cita finalizada, cancelada o vencida.",
      );
    }

    if (
      estadoActual ===
        "EN_ATENCION" &&
      mecanicoId === null
    ) {
      throw new Error(
        "Una cita en atención debe conservar un mecánico asignado.",
      );
    }

    if (mecanicoId !== null) {
      const {
        data: mecanico,
        error: mecanicoError,
      } = await supabase
        .from("mecanico")
        .select(`
          id_mecanico,
          id_usuario,
          especialidad
        `)
        .eq(
          "id_mecanico",
          mecanicoId,
        )
        .maybeSingle();

      if (mecanicoError) {
        throw mecanicoError;
      }

      if (!mecanico) {
        throw new Error(
          "El mecánico seleccionado no existe.",
        );
      }

      if (mecanico.id_usuario) {
        const {
          data: usuario,
          error: usuarioError,
        } = await supabase
          .from("usuario")
          .select(`
            id_usuario,
            estatus
          `)
          .eq(
            "id_usuario",
            mecanico.id_usuario,
          )
          .maybeSingle();

        if (usuarioError) {
          throw usuarioError;
        }

        const estatus =
          String(
            usuario?.estatus || "",
          )
            .trim()
            .toUpperCase();

        if (
          [
            "INACTIVO",
            "INACTIVA",
          ].includes(
            estatus,
          )
        ) {
          throw new Error(
            "No se puede asignar un mecánico inactivo.",
          );
        }
      }
    }

    const {
      data,
      error,
    } = await supabase
      .from("cita")
      .update({
        id_mecanico:
          mecanicoId,
      })
      .eq(
        "id_cita",
        id,
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  };


/* ============================================================
   ENVIAR CORREO DE ALERTA
============================================================ */

const enviarCorreoAlerta =
  async idAlerta => {
    try {
      const id =
        Number(idAlerta);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return false;
      }

      const {
        data,
        error,
      } =
        await supabase
          .functions
          .invoke(
            "enviar-alerta-correo",
            {
              body: {
                id_alerta:
                  id,
              },
            },
          );

      if (error) {
        console.error(
          "La alerta fue creada, pero no fue posible enviar el correo:",
          error,
        );

        return false;
      }

      console.log(
        "Correo de alerta enviado correctamente:",
        data,
      );

      return true;
    } catch (error) {
      console.error(
        "Error enviando correo de alerta:",
        error,
      );

      return false;
    }
  };


/* ============================================================
   EVALUAR ALERTA AUTOMÁTICA DE MANTENIMIENTO
============================================================ */

export const evaluarAlertaMantenimientoVehiculo =
  async idVehiculo => {
    const idVehiculoNumerico =
      Number(idVehiculo);

    if (
      !Number.isInteger(
        idVehiculoNumerico,
      ) ||
      idVehiculoNumerico <= 0
    ) {
      throw new Error(
        "El identificador del vehículo no es válido.",
      );
    }

    const {
      data: vehiculo,
      error: vehiculoError,
    } = await supabase
      .from("vehiculo")
      .select(`
        id_vehiculo,
        id_cliente,
        placas,
        marca,
        modelo,
        kilometraje_actual,
        estatus
      `)
      .eq(
        "id_vehiculo",
        idVehiculoNumerico,
      )
      .single();

    if (vehiculoError) {
      throw vehiculoError;
    }

    if (!vehiculo?.id_cliente) {
      return {
        estado:
          "SIN_CLIENTE",

        alerta:
          null,
      };
    }

    const {
      data: configuracion,
      error: configuracionError,
    } = await supabase
      .from(
        "configuracion_mantenimiento",
      )
      .select(`
        id_configuracion,
        id_vehiculo,
        ultimo_km_registrado,
        intervalo,
        proximo_servicio
      `)
      .eq(
        "id_vehiculo",
        idVehiculoNumerico,
      )
      .order(
        "id_configuracion",
        {
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle();

    if (configuracionError) {
      throw configuracionError;
    }

    const kilometrajeActual =
      Number(
        vehiculo.kilometraje_actual,
      );

    const proximoServicio =
      Number(
        configuracion?.proximo_servicio,
      );

    if (
      !configuracion ||
      !Number.isFinite(
        kilometrajeActual,
      ) ||
      !Number.isFinite(
        proximoServicio,
      )
    ) {
      return {
        estado:
          "SIN_CONFIGURAR",

        alerta:
          null,
      };
    }

    const {
      data: cliente,
      error: clienteError,
    } = await supabase
      .from("cliente")
      .select(`
        id_cliente,
        id_usuario
      `)
      .eq(
        "id_cliente",
        vehiculo.id_cliente,
      )
      .single();

    if (clienteError) {
      throw clienteError;
    }

    if (!cliente?.id_usuario) {
      return {
        estado:
          "SIN_USUARIO",

        alerta:
          null,
      };
    }

    const idUsuario =
      Number(
        cliente.id_usuario,
      );

    const diferencia =
      proximoServicio -
      kilometrajeActual;

    let estadoMantenimiento =
      "AL_DIA";

    if (diferencia <= 0) {
      estadoMantenimiento =
        "VENCIDO";
    } else if (
      diferencia <= 1000
    ) {
      estadoMantenimiento =
        "PROXIMO";
    }

    const tiposMantenimiento = [
      "MANTENIMIENTO_PROXIMO",
      "MANTENIMIENTO_VENCIDO",
    ];

    const {
      data: alertasActivas,
      error: alertasActivasError,
    } = await supabase
      .from("alerta")
      .select(`
        id_alerta,
        id_vehiculo,
        id_usuario,
        tipo_alerta,
        nivel,
        mensaje,
        estado,
        fecha_programada,
        fecha_lectura
      `)
      .eq(
        "id_vehiculo",
        idVehiculoNumerico,
      )
      .eq(
        "id_usuario",
        idUsuario,
      )
      .in(
        "tipo_alerta",
        tiposMantenimiento,
      )
      .neq(
        "estado",
        "LEIDA",
      )
      .order(
          "id_alerta",
          {
            ascending: false,
          },
      );

    if (alertasActivasError) {
      throw alertasActivasError;
    }

    /*
     * AL DÍA:
     * cerramos cualquier alerta preventiva anterior.
     */
    if (
      estadoMantenimiento ===
      "AL_DIA"
    ) {
      const idsCerrar =
        (alertasActivas || [])
          .map(
            item =>
              item.id_alerta,
          )
          .filter(Boolean);

      if (idsCerrar.length) {
        const {
          error,
        } = await supabase
          .from("alerta")
          .update({
            estado:
              "LEIDA",

            fecha_lectura:
              new Date()
                .toISOString(),
          })
          .in(
            "id_alerta",
            idsCerrar,
          );

        if (error) {
          throw error;
        }
      }

      return {
        estado:
          "AL_DIA",

        kilometrosRestantes:
          diferencia,

        kilometrosExcedidos:
          0,

        alerta:
          null,
      };
    }

    const descripcionVehiculo =
      [
        vehiculo.marca,
        vehiculo.modelo,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      vehiculo.placas ||
      `vehículo #${idVehiculoNumerico}`;

    const formatKm =
      value =>
        new Intl.NumberFormat(
          "es-MX",
          {
            maximumFractionDigits:
              0,
          },
        ).format(
          Math.abs(
            Number(value) || 0,
          ),
        );

    let tipoAlerta;
    let nivel;
    let mensaje;

    if (
      estadoMantenimiento ===
      "VENCIDO"
    ) {
      tipoAlerta =
        "MANTENIMIENTO_VENCIDO";

      nivel =
        "URGENTE";

      if (diferencia === 0) {
        mensaje =
          `El mantenimiento de tu ${descripcionVehiculo} ya alcanzó el kilometraje programado de ${formatKm(proximoServicio)} km.`;
      } else {
        mensaje =
          `El mantenimiento de tu ${descripcionVehiculo} está vencido. Se ha excedido en ${formatKm(diferencia)} km el servicio programado a los ${formatKm(proximoServicio)} km.`;
      }
    } else {
      tipoAlerta =
        "MANTENIMIENTO_PROXIMO";

      nivel =
        "ADVERTENCIA";

      mensaje =
        `El mantenimiento de tu ${descripcionVehiculo} está próximo. Faltan ${formatKm(diferencia)} km para el servicio programado a los ${formatKm(proximoServicio)} km.`;
    }

    /*
     * Si cambió de próximo a vencido o viceversa,
     * cerramos el estado anterior.
     */
    const idsTipoAnterior =
      (alertasActivas || [])
        .filter(
          item =>
            item.tipo_alerta !==
            tipoAlerta,
        )
        .map(
          item =>
            item.id_alerta,
        )
        .filter(Boolean);

    if (
      idsTipoAnterior.length
    ) {
      const {
        error,
      } = await supabase
        .from("alerta")
        .update({
          estado:
            "LEIDA",

          fecha_lectura:
            new Date()
              .toISOString(),
        })
        .in(
          "id_alerta",
          idsTipoAnterior,
        );

      if (error) {
        throw error;
      }
    }

    const alertaMismoTipo =
      (alertasActivas || [])
        .find(
          item =>
            item.tipo_alerta ===
            tipoAlerta,
        );

    /*
     * Evita duplicados y evita reenviar correo.
     */
    if (alertaMismoTipo) {
      if (
        alertaMismoTipo.mensaje !==
          mensaje ||
        alertaMismoTipo.nivel !==
          nivel
      ) {
        const {
          data,
          error,
        } = await supabase
          .from("alerta")
          .update({
            nivel,
            mensaje,
          })
          .eq(
            "id_alerta",
            alertaMismoTipo.id_alerta,
          )
          .select()
          .single();

        if (error) {
          throw error;
        }

        return {
          estado:
            estadoMantenimiento,

          kilometrosRestantes:
            diferencia > 0
              ? diferencia
              : 0,

          kilometrosExcedidos:
            diferencia < 0
              ? Math.abs(
                  diferencia,
                )
              : 0,

          alerta:
            data,

          creada:
            false,
        };
      }

      return {
        estado:
          estadoMantenimiento,

        kilometrosRestantes:
          diferencia > 0
            ? diferencia
            : 0,

        kilometrosExcedidos:
          diferencia < 0
            ? Math.abs(
                diferencia,
              )
            : 0,

        alerta:
          alertaMismoTipo,

        creada:
          false,
      };
    }

    const {
      data: alerta,
      error: alertaError,
    } = await supabase
      .from("alerta")
      .insert({
        id_vehiculo:
          idVehiculoNumerico,

        id_usuario:
          idUsuario,

        tipo_alerta:
          tipoAlerta,

        nivel,

        mensaje,

        estado:
          "PENDIENTE",

        fecha_programada:
          hoyISO(),

        fecha_lectura:
          null,
      })
      .select()
      .single();

    if (alertaError) {
      throw alertaError;
    }

    await enviarCorreoAlerta(
      alerta.id_alerta,
    );

    return {
      estado:
        estadoMantenimiento,

      kilometrosRestantes:
        diferencia > 0
          ? diferencia
          : 0,

      kilometrosExcedidos:
        diferencia < 0
          ? Math.abs(
              diferencia,
            )
          : 0,

      alerta,

      creada:
        true,
    };
  };


/* ============================================================
   CREAR ALERTA DE MANTENIMIENTO PROGRAMADO
   Se conserva por compatibilidad con código anterior.
============================================================ */

export const crearAlertaMantenimientoProgramado =
  async ({
    idVehiculo,
    proximoServicio,
  }) => {
    const idVehiculoNumerico =
      Number(idVehiculo);

    const proximoServicioNumerico =
      Number(
        proximoServicio,
      );

    if (
      !Number.isInteger(
        idVehiculoNumerico,
      ) ||
      idVehiculoNumerico <= 0
    ) {
      throw new Error(
        "El identificador del vehículo no es válido.",
      );
    }

    if (
      !Number.isFinite(
        proximoServicioNumerico,
      ) ||
      proximoServicioNumerico < 0
    ) {
      return null;
    }

    const {
      data: vehiculo,
      error: vehiculoError,
    } = await supabase
      .from("vehiculo")
      .select(`
        id_vehiculo,
        id_cliente,
        placas,
        marca,
        modelo,
        estatus
      `)
      .eq(
        "id_vehiculo",
        idVehiculoNumerico,
      )
      .single();

    if (vehiculoError) {
      throw vehiculoError;
    }

    if (!vehiculo?.id_cliente) {
      throw new Error(
        "El vehículo no tiene un cliente asociado.",
      );
    }

    const {
      data: cliente,
      error: clienteError,
    } = await supabase
      .from("cliente")
      .select(`
        id_cliente,
        id_usuario
      `)
      .eq(
        "id_cliente",
        vehiculo.id_cliente,
      )
      .single();

    if (clienteError) {
      throw clienteError;
    }

    const idUsuario =
      Number(
        cliente?.id_usuario,
      );

    if (
      !Number.isInteger(
        idUsuario,
      )
    ) {
      return null;
    }

    const descripcionVehiculo =
      [
        vehiculo.marca,
        vehiculo.modelo,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      vehiculo.placas;

    const km =
      new Intl.NumberFormat(
        "es-MX",
        {
          maximumFractionDigits:
            0,
        },
      ).format(
        proximoServicioNumerico,
      );

    const mensaje =
      `El próximo mantenimiento de tu ${descripcionVehiculo} está programado a los ${km} km.`;

    const {
      data: existente,
      error,
    } = await supabase
      .from("alerta")
      .select("*")
      .eq(
        "id_vehiculo",
        idVehiculoNumerico,
      )
      .eq(
        "id_usuario",
        idUsuario,
      )
      .eq(
        "tipo_alerta",
        "MANTENIMIENTO_PROGRAMADO",
      )
      .eq(
        "mensaje",
        mensaje,
      )
      .neq(
        "estado",
        "LEIDA",
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (existente) {
      return existente;
    }

    const {
      data: alerta,
      error: insertError,
    } = await supabase
      .from("alerta")
      .insert({
        id_vehiculo:
          idVehiculoNumerico,

        id_usuario:
          idUsuario,

        tipo_alerta:
          "MANTENIMIENTO_PROGRAMADO",

        nivel:
          "INFO",

        mensaje,

        estado:
          "PENDIENTE",

        fecha_programada:
          hoyISO(),

        fecha_lectura:
          null,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    await enviarCorreoAlerta(
      alerta.id_alerta,
    );

    return alerta;
  };


/* ============================================================
   CREAR ALERTA POR CONDICIÓN DE LLANTA
============================================================ */

export const crearAlertaCondicionLlanta =
  async ({
    idVehiculo,
    llanta,
  }) => {
    const idVehiculoNumerico =
      Number(idVehiculo);

    if (
      !Number.isInteger(
        idVehiculoNumerico,
      ) ||
      idVehiculoNumerico <= 0
    ) {
      throw new Error(
        "El identificador del vehículo no es válido.",
      );
    }

    if (!llanta) {
      return null;
    }

    const condicion =
      String(
        llanta.condicion ||
          "",
      )
        .trim()
        .toLowerCase();

    const requiereAtencion =
      condicion ===
      "requiere atención";

    const requiereReemplazo =
      condicion ===
      "reemplazar";

    if (
      !requiereAtencion &&
      !requiereReemplazo
    ) {
      return null;
    }

    const {
      data: vehiculo,
      error: vehiculoError,
    } = await supabase
      .from("vehiculo")
      .select(`
        id_vehiculo,
        id_cliente,
        placas,
        marca,
        modelo,
        estatus
      `)
      .eq(
        "id_vehiculo",
        idVehiculoNumerico,
      )
      .single();

    if (vehiculoError) {
      throw vehiculoError;
    }

    if (!vehiculo?.id_cliente) {
      throw new Error(
        "El vehículo no tiene un cliente asociado.",
      );
    }

    const {
      data: cliente,
      error: clienteError,
    } = await supabase
      .from("cliente")
      .select(`
        id_cliente,
        id_usuario
      `)
      .eq(
        "id_cliente",
        vehiculo.id_cliente,
      )
      .single();

    if (clienteError) {
      throw clienteError;
    }

    if (!cliente?.id_usuario) {
      throw new Error(
        "El cliente propietario no tiene un usuario asociado.",
      );
    }

    const idUsuario =
      Number(
        cliente.id_usuario,
      );

    const descripcionVehiculo =
      [
        vehiculo.marca,
        vehiculo.modelo,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      vehiculo.placas ||
      `vehículo #${idVehiculoNumerico}`;

    const posicion =
      String(
        llanta.posicion ||
          `posición #${llanta.id_llanta || ""}`,
      ).trim();

    const tipoAlerta =
      requiereReemplazo
        ? "CAMBIO_LLANTA"
        : "LLANTA_ATENCION";

    const nivel =
      requiereReemplazo
        ? "URGENTE"
        : "ADVERTENCIA";

    const mensaje =
      requiereReemplazo
        ? `La llanta ${posicion.toLowerCase()} de tu ${descripcionVehiculo} requiere reemplazo según la última inspección realizada.`
        : `La llanta ${posicion.toLowerCase()} de tu ${descripcionVehiculo} requiere atención según la última inspección realizada.`;

    const {
      data: alertaExistente,
      error: duplicadoError,
    } = await supabase
      .from("alerta")
      .select("*")
      .eq(
        "id_vehiculo",
        idVehiculoNumerico,
      )
      .eq(
        "id_usuario",
        idUsuario,
      )
      .eq(
        "tipo_alerta",
        tipoAlerta,
      )
      .eq(
        "mensaje",
        mensaje,
      )
      .neq(
        "estado",
        "LEIDA",
      )
      .limit(1)
      .maybeSingle();

    if (duplicadoError) {
      throw duplicadoError;
    }

    if (alertaExistente) {
      return alertaExistente;
    }

    const {
      data: alerta,
      error: alertaError,
    } = await supabase
      .from("alerta")
      .insert({
        id_vehiculo:
          idVehiculoNumerico,

        id_usuario:
          idUsuario,

        tipo_alerta:
          tipoAlerta,

        nivel,

        mensaje,

        estado:
          "PENDIENTE",

        fecha_programada:
          hoyISO(),

        fecha_lectura:
          null,
      })
      .select()
      .single();

    if (alertaError) {
      throw alertaError;
    }

    await enviarCorreoAlerta(
      alerta.id_alerta,
    );

    return alerta;
  };


/* ============================================================
   ALERTAS DEL CLIENTE
============================================================ */

export const obtenerAlertasCliente =
  async idUsuario => {
    const id =
      Number(idUsuario);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(
        "El identificador del usuario del cliente no es válido.",
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("alerta")
      .select(`
        id_alerta,
        id_vehiculo,
        id_usuario,
        tipo_alerta,
        nivel,
        mensaje,
        estado,
        fecha_programada,
        fecha_registro,
        fecha_lectura
      `)
      .eq(
        "id_usuario",
        id,
      )
      .order(
        "fecha_registro",
        {
          ascending: false,
          nullsFirst: false,
        },
      )
      .order(
        "fecha_programada",
        {
          ascending: false,
          nullsFirst: false,
        },
      )
      .order(
        "id_alerta",
        {
          ascending: false,
        },
      );

    if (error) {
      throw error;
    }

    return data || [];
  };


/* ============================================================
   MARCAR ALERTA DEL CLIENTE COMO LEÍDA
============================================================ */

export const marcarAlertaClienteLeida =
  async idAlerta => {
    const id =
      Number(idAlerta);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(
        "El identificador de la alerta no es válido.",
      );
    }

    const {
      data,
      error,
    } = await supabase.rpc(
      "marcar_alerta_cliente_leida",
      {
        p_id_alerta:
          id,
      },
    );

    if (error) {
      throw error;
    }

    if (data !== true) {
      throw new Error(
        "No fue posible marcar la alerta como leída.",
      );
    }

    return true;
  };


/* ============================================================
   OBSERVACIONES DE TRANSMISIÓN
============================================================ */

export const obtenerObservacionesTransmisionClientes =
  async (idMecanico = null) => {
    let registroQuery = supabase
      .from(
        "registro_transmision_cliente",
      )
      .select(`
        id_registro,
        id_cliente,
        id_vehiculo,
        fecha_observacion,
        sintomas,
        descripcion,
        atencion_externa,
        detalle_atencion_externa,
        estado,
        fecha_registro,
        fecha_revision
      `);

    if (idMecanico !== null) {
      const id = Number(idMecanico);

      if (!Number.isInteger(id) || id <= 0) {
        throw new Error(
          "El identificador del mecánico no es válido.",
        );
      }

      const [
        clientesResult,
        vehiculosResult,
      ] = await Promise.all([
        supabase
          .from("mecanico_cliente")
          .select("id_cliente")
          .eq("id_mecanico", id),
        supabase
          .from("vehiculo")
          .select("id_vehiculo, id_cliente")
          .eq("id_mecanico", id),
      ]);

      if (clientesResult.error) {
        throw clientesResult.error;
      }

      if (vehiculosResult.error) {
        throw vehiculosResult.error;
      }

      const clienteIds = [
        ...new Set([
          ...(clientesResult.data || []).map(item => item.id_cliente),
          ...(vehiculosResult.data || []).map(item => item.id_cliente),
        ].filter(Boolean)),
      ];
      const vehiculoIds = [
        ...new Set(
          (vehiculosResult.data || [])
            .map(item => item.id_vehiculo)
            .filter(Boolean),
        ),
      ];
      const observationFilters = [];

      if (clienteIds.length) {
        observationFilters.push(
          `id_cliente.in.(${clienteIds.join(",")})`,
        );
      }

      if (vehiculoIds.length) {
        observationFilters.push(
          `id_vehiculo.in.(${vehiculoIds.join(",")})`,
        );
      }

      if (!observationFilters.length) {
        return [];
      }

      registroQuery = registroQuery.or(
        observationFilters.join(","),
      );
    }

    const {
      data: registros,
      error: registrosError,
    } = await registroQuery
      .order("fecha_registro", { ascending: false })
      .order("id_registro", { ascending: false });

    if (registrosError) {
      throw registrosError;
    }

    if (!registros?.length) {
      return [];
    }

    const clienteIds = [
      ...new Set(
        registros
          .map(
            item =>
              item.id_cliente,
          )
          .filter(Boolean),
      ),
    ];

    const vehiculoIds = [
      ...new Set(
        registros
          .map(
            item =>
              item.id_vehiculo,
          )
          .filter(Boolean),
      ),
    ];

    const [
      clientesResult,
      vehiculosResult,
    ] = await Promise.all([
      clienteIds.length
        ? supabase
            .from("cliente")
            .select(`
              id_cliente,
              id_usuario,
              direccion
            `)
            .in(
              "id_cliente",
              clienteIds,
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),

      vehiculoIds.length
        ? supabase
            .from("vehiculo")
            .select(`
              id_vehiculo,
              id_cliente,
              id_mecanico,
              no_economico,
              placas,
              numero_serie,
              marca,
              modelo,
              anio_modelo,
              tipo_unidad,
              kilometraje_actual,
              estatus
            `)
            .in(
              "id_vehiculo",
              vehiculoIds,
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),
    ]);

    if (clientesResult.error) {
      throw clientesResult.error;
    }

    if (vehiculosResult.error) {
      throw vehiculosResult.error;
    }

    const usuarioIds = [
      ...new Set(
        (
          clientesResult.data ||
          []
        )
          .map(
            item =>
              item.id_usuario,
          )
          .filter(Boolean),
      ),
    ];

    let usuarios = [];

    if (usuarioIds.length) {
      const {
        data,
        error,
      } = await supabase
        .from("usuario")
        .select(`
          id_usuario,
          nombre,
          apellido_paterno,
          apellido_materno,
          correo,
          telefono,
          estatus
        `)
        .in(
          "id_usuario",
          usuarioIds,
        );

      if (error) {
        throw error;
      }

      usuarios =
        data || [];
    }

    const usuariosMap =
      new Map(
        usuarios.map(
          usuario => [
            usuario.id_usuario,
            usuario,
          ],
        ),
      );

    const clientesMap =
      new Map(
        (
          clientesResult.data ||
          []
        ).map(
          cliente => [
            cliente.id_cliente,
            {
              ...cliente,

              usuario:
                usuariosMap.get(
                  cliente.id_usuario,
                ) || null,
            },
          ],
        ),
      );

    const vehiculosMap =
      new Map(
        (
          vehiculosResult.data ||
          []
        ).map(
          vehiculo => [
            vehiculo.id_vehiculo,
            vehiculo,
          ],
        ),
      );

    const mechanicVehicleIds = idMecanico !== null
      ? new Set(
          (vehiculosResult.data || []).map(
            vehiculo => String(vehiculo.id_vehiculo),
          ),
        )
      : null;

    return registros
      .filter(registro =>
        !mechanicVehicleIds ||
        !registro.id_vehiculo ||
        mechanicVehicleIds.has(String(registro.id_vehiculo)),
      )
      .map(
        registro => ({
          ...registro,

          cliente:
            clientesMap.get(
              registro.id_cliente,
            ) || null,

          vehiculo:
            vehiculosMap.get(
              registro.id_vehiculo,
            ) || null,
        }),
      );
  };


/* ============================================================
   CAMBIAR ESTADO DE OBSERVACIÓN DE TRANSMISIÓN
============================================================ */

export const cambiarEstadoObservacionTransmision =
  async (
    idRegistro,
    nuevoEstado,
  ) => {
    const id =
      Number(idRegistro);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(
        "El identificador de la observación no es válido.",
      );
    }

    const estadoDestino =
      String(
        nuevoEstado || "",
      )
        .trim()
        .toUpperCase();

    if (
      ![
        "REVISADO",
        "ATENDIDO",
      ].includes(
        estadoDestino,
      )
    ) {
      throw new Error(
        "El nuevo estado de la observación no es válido.",
      );
    }

    const {
      data: actual,
      error: consultaError,
    } = await supabase
      .from(
        "registro_transmision_cliente",
      )
      .select(`
        id_registro,
        estado,
        fecha_revision
      `)
      .eq(
        "id_registro",
        id,
      )
      .single();

    if (consultaError) {
      throw consultaError;
    }

    const estadoActual =
      String(
        actual?.estado || "",
      )
        .trim()
        .toUpperCase();

    if (
      estadoActual ===
        "PENDIENTE" &&
      estadoDestino !==
        "REVISADO"
    ) {
      throw new Error(
        "La observación debe marcarse como revisada antes de atenderse.",
      );
    }

    if (
      estadoActual ===
        "REVISADO" &&
      estadoDestino !==
        "ATENDIDO"
    ) {
      throw new Error(
        "La observación revisada solo puede marcarse como atendida.",
      );
    }

    if (
      estadoActual ===
      "ATENDIDO"
    ) {
      throw new Error(
        "La observación ya fue atendida.",
      );
    }

    const cambios = {
      estado:
        estadoDestino,
    };

    if (
      estadoDestino ===
        "REVISADO" &&
      !actual?.fecha_revision
    ) {
      cambios.fecha_revision =
        new Date()
          .toISOString();
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "registro_transmision_cliente",
      )
      .update(cambios)
      .eq(
        "id_registro",
        id,
      )
      .select(`
        id_registro,
        id_cliente,
        id_vehiculo,
        fecha_observacion,
        sintomas,
        descripcion,
        atencion_externa,
        detalle_atencion_externa,
        estado,
        fecha_registro,
        fecha_revision
      `)
      .single();

    if (error) {
      throw error;
    }

    return data;
  };


export const actualizarEstadoObservacionTransmision =
  cambiarEstadoObservacionTransmision;


/* ============================================================
   ALERTAS DEL SISTEMA
============================================================ */

export const obtenerAlertasSistema =
  async (idUsuario = null, idMecanico = null) => {
    let alertQuery = supabase
      .from("alerta")
      .select(`
        id_alerta,
        id_vehiculo,
        id_usuario,
        tipo_alerta,
        nivel,
        mensaje,
        estado,
        fecha_programada,
        fecha_registro,
        fecha_lectura
      `);

    alertQuery = alertQuery.neq(
      "tipo_alerta",
      "ACCION_MECANICO_CLIENTE",
    );

    if (idUsuario !== null) {
      alertQuery = alertQuery.eq(
        "id_usuario",
        idUsuario,
      );
    }

    const {
      data,
      error,
    } = await alertQuery
      .order(
        "fecha_registro",
        {
          ascending: false,
          nullsFirst: false,
        },
      )
      .order(
      "id_alerta",
      {
        ascending: false,
      },
      );

    if (error) {
      throw error;
    }

    const alerts = data || [];

    if (idMecanico === null) {
      return alerts;
    }

    const mechanicId = Number(idMecanico);

    if (!Number.isInteger(mechanicId) || mechanicId <= 0) {
      throw new Error(
        "El identificador del mecánico no es válido.",
      );
    }

    const mechanicAlerts = alerts.filter(
      alert => alert.tipo_alerta !== "ACCION_MECANICO",
    );
    const alertsWithVehicle = alerts.filter(alert =>
      ["CITA_NUEVA", "TRANSMISION_CLIENTE"].includes(alert.tipo_alerta) &&
      alert.id_vehiculo,
    );
    const vehicleIds = [
      ...new Set(
        alertsWithVehicle.map(alert => alert.id_vehiculo),
      ),
    ];

    if (!vehicleIds.length) {
      return mechanicAlerts;
    }

    const {
      data: vehicles,
      error: vehiclesError,
    } = await supabase
      .from("vehiculo")
      .select("id_vehiculo")
      .eq("id_mecanico", mechanicId)
      .in("id_vehiculo", vehicleIds);

    if (vehiclesError) {
      throw vehiclesError;
    }

    const ownedVehicleIds = new Set(
      (vehicles || []).map(vehicle => String(vehicle.id_vehiculo)),
    );

    return mechanicAlerts.filter(alert =>
      !["CITA_NUEVA", "TRANSMISION_CLIENTE"].includes(alert.tipo_alerta) ||
      !alert.id_vehiculo ||
      ownedVehicleIds.has(String(alert.id_vehiculo)),
    );
  };


/* ============================================================
   MARCAR ALERTA COMO LEÍDA
============================================================ */

export const marcarAlertaLeida =
  async (idAlerta, idUsuario = null) => {
    let alertUpdate = supabase
      .from("alerta")
      .update({
        estado:
          "LEIDA",

        fecha_lectura:
          new Date()
            .toISOString(),
      })
      .eq("id_alerta", idAlerta);

    if (idUsuario !== null) {
      alertUpdate = alertUpdate.eq(
        "id_usuario",
        idUsuario,
      );
    }

    const {
      error,
    } = await alertUpdate;

    if (error) {
      throw error;
    }

    return true;
  };


/* ============================================================
   CONTADOR GENERAL
============================================================ */

export const obtenerContadorAlertas =
  async () => {
    await actualizarCitasVencidas();

    const [
      alertasResult,
      citasProximasResult,
    ] = await Promise.all([
      supabase
        .from("alerta")
        .select(
          "id_alerta",
          {
            count:
              "exact",

            head:
              true,
          },
        )
        .neq(
          "estado",
          "LEIDA",
        )
        .neq(
          "tipo_alerta",
          "ACCION_MECANICO_CLIENTE",
        ),

      supabase
        .from("cita")
        .select(
          "id_cita",
          {
            count:
              "exact",

            head:
              true,
          },
        )
        .eq(
          "estado",
          "PROXIMA",
        )
        .eq(
          "fecha",
          hoyISO(),
        ),
    ]);

    if (alertasResult.error) {
      throw alertasResult.error;
    }

    if (
      citasProximasResult.error
    ) {
      throw citasProximasResult.error;
    }

    return (
      Number(
        alertasResult.count ||
          0,
      ) +
      Number(
        citasProximasResult.count ||
          0,
      )
    );
  };