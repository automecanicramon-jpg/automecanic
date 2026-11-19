import { supabase } from "./supabase.js";

import {
  crearAlertaCondicionLlanta,
  evaluarAlertaMantenimientoVehiculo,
} from "./alertaService.js";


const limpiarTexto = value => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};


const numeroONull = value => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};


/* ============================================================
   VEHÍCULOS
============================================================ */

export const obtenerVehiculosServicio =
  async () => {
    const {
      data,
      error,
    } = await supabase
      .from("vehiculo")
      .select(`
        id_vehiculo,
        id_cliente,
        id_mecanico,
        no_economico,
        placas,
        marca,
        modelo,
        anio_modelo,
        tipo_unidad,
        kilometraje_actual,
        estatus
      `)
      .order(
        "id_vehiculo",
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
   MECÁNICOS
============================================================ */

export const obtenerMecanicosServicio =
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
          ascending: false,
        },
      );

    if (mecanicosError) {
      throw mecanicosError;
    }

    if (!mecanicos?.length) {
      return [];
    }

    const ids =
      mecanicos
        .map(
          item =>
            item.id_usuario,
        )
        .filter(Boolean);

    const {
      data: usuarios,
      error: usuariosError,
    } = await supabase
      .from("usuario")
      .select(`
        id_usuario,
        nombre,
        apellido_paterno,
        apellido_materno,
        estatus
      `)
      .in(
        "id_usuario",
        ids,
      );

    if (usuariosError) {
      throw usuariosError;
    }

    const usuarioMap =
      new Map(
        (usuarios || [])
          .map(
            usuario => [
              usuario.id_usuario,
              usuario,
            ],
          ),
      );

    return mecanicos.map(
      mecanico => ({
        ...mecanico,

        usuario:
          usuarioMap.get(
            mecanico.id_usuario,
          ) || null,
      }),
    );
  };


/* ============================================================
   TIPOS DE ACEITE
============================================================ */

export const obtenerTiposAceiteServicio =
  async () => {
    const {
      data,
      error,
    } = await supabase
      .from("tipo_aceite")
      .select(`
        id_tipo_aceite,
        nombre
      `)
      .order(
        "nombre",
        {
          ascending: true,
        },
      );

    if (error) {
      throw error;
    }

    return data || [];
  };


/* ============================================================
   MARCAS DE ACEITE
============================================================ */

export const obtenerMarcasAceiteServicio =
  async () => {
    const {
      data,
      error,
    } = await supabase
      .from("marca_aceite")
      .select(`
        id_marca_aceite,
        nombre
      `)
      .order(
        "nombre",
        {
          ascending: true,
        },
      );

    if (error) {
      throw error;
    }

    return data || [];
  };


/* ============================================================
   POSICIONES DE LLANTA
============================================================ */

export const obtenerPosicionesLlanta =
  async tipoUnidad => {
    if (!tipoUnidad) {
      return [];
    }

    const {
      data,
      error,
    } = await supabase
      .from("tipo_llanta")
      .select(`
        id_tipo,
        posicion,
        tipo_unidad,
        numero_llanta
      `)
      .ilike(
        "tipo_unidad",
        tipoUnidad,
      )
      .order(
        "numero_llanta",
        {
          ascending: true,
        },
      );

    if (error) {
      throw error;
    }

    return data || [];
  };


/* ============================================================
   HISTORIAL
============================================================ */

export const obtenerHistorialServicios =
  async idVehiculo => {
    let query = supabase
      .from("servicio")
      .select(`
        id_servicio,
        id_vehiculo,
        id_mecanico,
        fecha_servicio,
        kilometraje,
        observaciones_generales
      `)

    if (idVehiculo !== undefined && idVehiculo !== null) {
      query = query.eq("id_vehiculo", Number(idVehiculo))
    }

    const {
      data,
      error,
    } = await query
      .order(
        "fecha_servicio",
        {
          ascending: false,
        },
      )
      .order(
        "id_servicio",
        {
          ascending: false,
        },
      );

    if (error) {
      throw error;
    }

    return data || [];
  };


export const obtenerHistorialServiciosMecanico =
  async idMecanico => {
    const mechanicId = Number(idMecanico)

    if (
      idMecanico === null ||
      idMecanico === undefined ||
      idMecanico === '' ||
      !Number.isSafeInteger(mechanicId) ||
      mechanicId < 1
    ) {
      throw new Error(
        'El identificador del mecánico no es válido.'
      )
    }

    const {
      data,
      error
    } = await supabase
      .from('servicio')
      .select(`
        id_servicio,
        id_vehiculo,
        id_mecanico,
        fecha_servicio,
        kilometraje,
        observaciones_generales
      `)
      .eq('id_mecanico', mechanicId)
      .order('fecha_servicio', {
        ascending: false
      })
      .order('id_servicio', {
        ascending: false
      })

    if (error) {
      throw error
    }

    return data || []
  }


/* ============================================================
   DETALLE SERVICIO
============================================================ */

export const obtenerDetalleServicio =
  async idServicio => {
    const [
      servicioResult,
      motorResult,
      transmisionResult,
      llantasResult,
      tiposAceiteResult,
      posicionesLlantaResult,
    ] = await Promise.all([
      supabase
        .from("servicio")
        .select(`
          id_servicio,
          id_vehiculo,
          id_mecanico,
          fecha_servicio,
          kilometraje,
          observaciones_generales
        `)
        .eq(
          "id_servicio",
          idServicio,
        )
        .single(),

      supabase
        .from("servicio_motor")
        .select(`
          id_servicio,
          id_tipo_aceite,
          aceite_motor,
          filtro_aceite,
          filtro_aire,
          filtro_diesel_primario,
          filtro_diesel_auxiliar,
          filtro_cabina,
          bujias,
          filtro_de_gasolina
        `)
        .eq(
          "id_servicio",
          idServicio,
        )
        .maybeSingle(),

      supabase
        .from(
          "servicio_transmision",
        )
        .select(`
          id_servicio,
          tipo_transmision,
          aceite_transmision,
          filtro_de_aceite,
          junta_de_carter,
          color_del_aceite
        `)
        .eq(
          "id_servicio",
          idServicio,
        )
        .maybeSingle(),

      supabase
        .from("detalle_llanta")
        .select(`
          id_detalle,
          id_servicio,
          id_llanta,
          medida,
          marca,
          psi,
          desgaste_mm,
          tipo_desgaste,
          condicion
        `)
        .eq(
          "id_servicio",
          idServicio,
        )
        .order(
          "id_detalle",
          {
            ascending: true,
          },
        ),

      supabase
        .from("tipo_aceite")
        .select(`
          id_tipo_aceite,
          nombre
        `),

      supabase
        .from("tipo_llanta")
        .select(`
          id_tipo,
          posicion,
          tipo_unidad,
          numero_llanta
        `),
    ]);

    if (servicioResult.error) {
      throw servicioResult.error;
    }

    if (
      motorResult.error &&
      motorResult.error.code !==
        "PGRST116"
    ) {
      throw motorResult.error;
    }

    if (
      transmisionResult.error &&
      transmisionResult.error.code !==
        "PGRST116"
    ) {
      throw transmisionResult.error;
    }

    if (llantasResult.error) {
      throw llantasResult.error;
    }

    if (tiposAceiteResult.error) {
      throw tiposAceiteResult.error;
    }

    if (
      posicionesLlantaResult.error
    ) {
      throw posicionesLlantaResult.error;
    }

    const tiposAceiteMap =
      new Map(
        (
          tiposAceiteResult.data ||
          []
        ).map(
          tipo => [
            Number(
              tipo.id_tipo_aceite,
            ),
            tipo.nombre,
          ],
        ),
      );

    const posicionesLlantaMap =
      new Map(
        (
          posicionesLlantaResult.data ||
          []
        ).map(
          posicion => [
            Number(
              posicion.id_tipo,
            ),
            posicion,
          ],
        ),
      );

    const motor =
      motorResult.data
        ? {
            ...motorResult.data,

            tipo_aceite_nombre:
              tiposAceiteMap.get(
                Number(
                  motorResult.data
                    .id_tipo_aceite,
                ),
              ) || null,
          }
        : null;

    const llantas =
      (
        llantasResult.data ||
        []
      ).map(
        llanta => {
          const posicion =
            posicionesLlantaMap.get(
              Number(
                llanta.id_llanta,
              ),
            );

          return {
            ...llanta,

            posicion:
              posicion?.posicion ||
              null,

            numero_llanta:
              posicion?.numero_llanta ??
              null,

            tipo_unidad:
              posicion?.tipo_unidad ||
              null,
          };
        },
      );

    return {
      servicio:
        servicioResult.data,

      motor,

      transmision:
        transmisionResult.data ||
        null,

      llantas,
    };
  };


/* ============================================================
   CONFIGURACIÓN DE MANTENIMIENTO
============================================================ */

const guardarConfiguracionMantenimiento =
  async (
    idVehiculo,
    kilometraje,
    intervalo,
  ) => {
    if (
      intervalo === null ||
      intervalo <= 0
    ) {
      return null;
    }

    const proximoServicio =
      Number(kilometraje) +
      Number(intervalo);

    const {
      data: existente,
      error: consultaError,
    } = await supabase
      .from(
        "configuracion_mantenimiento",
      )
      .select(`
        id_configuracion
      `)
      .eq(
        "id_vehiculo",
        idVehiculo,
      )
      .maybeSingle();

    if (consultaError) {
      throw consultaError;
    }

    if (
      existente?.id_configuracion
    ) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "configuracion_mantenimiento",
        )
        .update({
          ultimo_km_registrado:
            kilometraje,

          intervalo,

          proximo_servicio:
            proximoServicio,
        })
        .eq(
          "id_configuracion",
          existente.id_configuracion,
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "configuracion_mantenimiento",
      )
      .insert({
        id_vehiculo:
          idVehiculo,

        ultimo_km_registrado:
          kilometraje,

        intervalo,

        proximo_servicio:
          proximoServicio,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  };


const actualizarKilometrajeVehiculo =
  async (
    idVehiculo,
    kilometraje,
  ) => {
    const {
      error,
    } = await supabase
      .from("vehiculo")
      .update({
        kilometraje_actual:
          kilometraje,
      })
      .eq(
        "id_vehiculo",
        idVehiculo,
      );

    if (error) {
      throw error;
    }
  };


/* ============================================================
   REGISTRAR SERVICIO COMPLETO
============================================================ */

export const registrarServicioCompleto =
  async datos => {
    const idVehiculo =
      Number(
        datos.general.id_vehiculo,
      );

    const idMecanico =
      datos.general.id_mecanico
        ? Number(
            datos.general.id_mecanico,
          )
        : null;

    const kilometraje =
      numeroONull(
        datos.general.kilometraje,
      );

    const intervalo =
      numeroONull(
        datos.mantenimiento
          .intervalo,
      );

    const llantas =
      Array.isArray(
        datos.llantas,
      )
        ? datos.llantas
        : [];

    if (!idVehiculo) {
      throw new Error(
        "Selecciona un vehículo.",
      );
    }

    if (
      !datos.general
        .fecha_servicio
    ) {
      throw new Error(
        "Selecciona la fecha del servicio.",
      );
    }

    if (
      kilometraje === null ||
      kilometraje < 0
    ) {
      throw new Error(
        "Captura un kilometraje válido.",
      );
    }

    if (
      !datos.incluirMotor ||
      !Object.values(datos.motor || {}).some(
        value => limpiarTexto(value),
      )
    ) {
      throw new Error(
        "Completa el módulo Motor antes de registrar el servicio.",
      );
    }

    if (
      !datos.incluirTransmision ||
      !Object.values(datos.transmision || {}).some(
        value => limpiarTexto(value),
      )
    ) {
      throw new Error(
        "Completa el módulo Transmisión antes de registrar el servicio.",
      );
    }

    if (
      intervalo === null ||
      intervalo <= 0
    ) {
      throw new Error(
        "Indica un intervalo de mantenimiento mayor a 0 km.",
      );
    }

    if (
      !llantas.length ||
      llantas.some(
        llanta => !limpiarTexto(llanta.condicion),
      )
    ) {
      throw new Error(
        "Completa la inspección y condición de las llantas antes de registrar el servicio.",
      );
    }

    let idServicioCreado =
      null;

    let servicioRegistrado =
      null;

    let configuracionMantenimiento =
      null;

    try {
      const {
        data: servicio,
        error: servicioError,
      } = await supabase
        .from("servicio")
        .insert({
          id_vehiculo:
            idVehiculo,

          id_mecanico:
            idMecanico,

          fecha_servicio:
            datos.general
              .fecha_servicio,

          kilometraje,

          observaciones_generales:
            limpiarTexto(
              datos.general
                .observaciones_generales,
            ) || null,
        })
        .select()
        .single();

      if (servicioError) {
        throw servicioError;
      }

      idServicioCreado =
        servicio.id_servicio;

      servicioRegistrado =
        servicio;

      if (datos.incluirMotor) {
        const {
          error,
        } = await supabase
          .from("servicio_motor")
          .insert({
            id_servicio:
              idServicioCreado,

            id_tipo_aceite:
              datos.motor
                .id_tipo_aceite
                ? Number(
                    datos.motor
                      .id_tipo_aceite,
                  )
                : null,

            aceite_motor:
              limpiarTexto(
                datos.motor
                  .aceite_motor,
              ) || null,

            filtro_aceite:
              limpiarTexto(
                datos.motor
                  .filtro_aceite,
              ) || null,

            filtro_aire:
              limpiarTexto(
                datos.motor
                  .filtro_aire,
              ) || null,

            filtro_diesel_primario:
              limpiarTexto(
                datos.motor
                  .filtro_diesel_primario,
              ) || null,

            filtro_diesel_auxiliar:
              limpiarTexto(
                datos.motor
                  .filtro_diesel_auxiliar,
              ) || null,

            filtro_cabina:
              limpiarTexto(
                datos.motor
                  .filtro_cabina,
              ) || null,

            bujias:
              limpiarTexto(
                datos.motor.bujias,
              ) || null,

            filtro_de_gasolina:
              limpiarTexto(
                datos.motor
                  .filtro_de_gasolina,
              ) || null,
          });

        if (error) {
          throw error;
        }
      }

      if (
        datos.incluirTransmision
      ) {
        const {
          error,
        } = await supabase
          .from(
            "servicio_transmision",
          )
          .insert({
            id_servicio:
              idServicioCreado,

            tipo_transmision:
              limpiarTexto(
                datos.transmision
                  .tipo_transmision,
              ) || null,

            aceite_transmision:
              limpiarTexto(
                datos.transmision
                  .aceite_transmision,
              ) || null,

            filtro_de_aceite:
              limpiarTexto(
                datos.transmision
                  .filtro_de_aceite,
              ) || null,

            junta_de_carter:
              limpiarTexto(
                datos.transmision
                  .junta_de_carter,
              ) || null,

            color_del_aceite:
              limpiarTexto(
                datos.transmision
                  .color_del_aceite,
              ) || null,
          });

        if (error) {
          throw error;
        }
      }

      if (llantas.length) {
        const payload =
          llantas.map(
            llanta => ({
              id_servicio:
                idServicioCreado,

              id_llanta:
                Number(
                  llanta.id_llanta,
                ),

              medida:
                limpiarTexto(
                  llanta.medida,
                ) || null,

              marca:
                limpiarTexto(
                  llanta.marca,
                ) || null,

              psi:
                numeroONull(
                  llanta.psi,
                ),

              desgaste_mm:
                numeroONull(
                  llanta.desgaste_mm,
                ),

              tipo_desgaste:
                limpiarTexto(
                  llanta.tipo_desgaste,
                ) || null,

              condicion:
                limpiarTexto(
                  llanta.condicion,
                ) || null,
            }),
          );

        const {
          error,
        } = await supabase
          .from("detalle_llanta")
          .insert(payload);

        if (error) {
          throw error;
        }
      }

      configuracionMantenimiento =
        await guardarConfiguracionMantenimiento(
          idVehiculo,
          kilometraje,
          intervalo,
        );

      await actualizarKilometrajeVehiculo(
        idVehiculo,
        kilometraje,
      );
    } catch (error) {
      if (idServicioCreado) {
        try {
          await supabase
            .from(
              "detalle_llanta",
            )
            .delete()
            .eq(
              "id_servicio",
              idServicioCreado,
            );

          await supabase
            .from(
              "servicio_motor",
            )
            .delete()
            .eq(
              "id_servicio",
              idServicioCreado,
            );

          await supabase
            .from(
              "servicio_transmision",
            )
            .delete()
            .eq(
              "id_servicio",
              idServicioCreado,
            );

          await supabase
            .from("servicio")
            .delete()
            .eq(
              "id_servicio",
              idServicioCreado,
            );
        } catch (
          cleanupError
        ) {
          console.error(
            "No fue posible limpiar el servicio incompleto:",
            cleanupError,
          );
        }
      }

      throw error;
    }

    if (
      configuracionMantenimiento
    ) {
      try {
        await evaluarAlertaMantenimientoVehiculo(
          idVehiculo,
        );
      } catch (error) {
        console.error(
          "El servicio fue registrado, pero no fue posible evaluar la alerta de mantenimiento:",
          error,
        );
      }
    }

    for (
      const llanta of
      llantas
    ) {
      try {
        await crearAlertaCondicionLlanta({
          idVehiculo,
          llanta,
        });
      } catch (error) {
        console.error(
          `No fue posible generar la alerta de la llanta ${llanta.posicion || llanta.id_llanta}:`,
          error,
        );
      }
    }

    return servicioRegistrado;
  };