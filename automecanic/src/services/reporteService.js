import { supabase } from './supabase.js'
import { obtenerMecanicosConHistorial } from './personalService.js'


/* ============================================================
   UTILIDADES
============================================================ */

const unique = array => {
  return [
    ...new Set(
      array.filter(Boolean)
    )
  ]
}


const nombreCompleto = usuario => {
  if (!usuario) {
    return 'Sin información'
  }

  return `
    ${usuario.nombre || ''}
    ${usuario.apellido_paterno || ''}
    ${usuario.apellido_materno || ''}
  `
    .replace(/\s+/g, ' ')
    .trim() || 'Sin nombre'
}


/* ============================================================
   CREAR RANGO DEL REPORTE
============================================================ */

export const crearRangoReporte = filtros => {
  const {
    fecha,
    mes,
     anio,
     desde,
     hasta
   } = filtros


   /*
    * Prioridad:
    * 1. Rango explícito
    * 2. Fecha específica
    * 3. Mes + año
    * 4. Solo año
   */

   if (desde && hasta && desde <= hasta) {
     return {
       desde,
       hasta,
       tipo: 'rango'
     }
   }

  if (fecha) {
    return {
      desde: fecha,
      hasta: fecha,
      tipo: 'fecha'
    }
  }


  if (mes && anio) {
    const month =
      String(mes).padStart(2, '0')

    const lastDay =
      new Date(
        Number(anio),
        Number(mes),
        0
      ).getDate()


    return {
      desde:
        `${anio}-${month}-01`,

      hasta:
        `${anio}-${month}-${String(lastDay).padStart(2, '0')}`,

      tipo: 'mes'
    }
  }


  if (anio) {
    return {
      desde:
        `${anio}-01-01`,

      hasta:
        `${anio}-12-31`,

      tipo: 'anio'
    }
  }


  return null
}


/* ============================================================
   SERVICIOS
============================================================ */

const obtenerServiciosPeriodo = async (
  rango,
  idVehiculos = [],
  idMecanico = null
) => {
  let query =
    supabase
      .from('servicio')
      .select(`
        id_servicio,
        id_vehiculo,
        id_mecanico,
        fecha_servicio,
        kilometraje,
        observaciones_generales
      `)
      .order(
        'fecha_servicio',
        {
          ascending: true
        }
      )


  if (rango) {
    query =
      query
        .gte(
          'fecha_servicio',
          rango.desde
        )
        .lte(
          'fecha_servicio',
          rango.hasta
        )
  }


  if (idVehiculos.length) {
    query =
      query.in(
        'id_vehiculo',
        idVehiculos
      )
  }

  if (idMecanico !== null && idMecanico !== undefined) {
    query = query.eq('id_mecanico', Number(idMecanico))
  }


  const {
    data,
    error
  } = await query


  if (error) {
    throw error
  }


  return data || []
}


/* ============================================================
   CITAS
============================================================ */

const obtenerCitasPeriodo = async (
  rango,
  idVehiculos = [],
  idMecanico = null
) => {
  let query =
    supabase
      .from('cita')
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
        'fecha',
        {
          ascending: true
        }
      )


  if (rango) {
    query =
      query
        .gte(
          'fecha',
          rango.desde
        )
        .lte(
          'fecha',
          rango.hasta
        )
  }

  if (idVehiculos.length) {
    query =
      query.in(
        'id_vehiculo',
        idVehiculos
      )
  }

  if (idMecanico !== null && idMecanico !== undefined) {
    query = query.eq('id_mecanico', Number(idMecanico))
  }


  const {
    data,
    error
  } = await query


  if (error) {
    throw error
  }


  return data || []
}


/* ============================================================
   ALERTAS
============================================================ */

const obtenerAlertasPeriodo = async (
  rango,
  idVehiculos = []
) => {
  let query =
    supabase
      .from('alerta')
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
      .order(
        'fecha_programada',
        {
          ascending: true
        }
      )


  if (rango) {
    query =
      query
        .gte(
          'fecha_programada',
          rango.desde
        )
        .lte(
          'fecha_programada',
          rango.hasta
        )
  }

  if (idVehiculos.length) {
    query =
      query.in(
        'id_vehiculo',
        idVehiculos
      )
  }


  const {
    data,
    error
  } = await query


  if (error) {
    throw error
  }


  return data || []
}


/* ============================================================
   VEHÍCULOS
============================================================ */

const obtenerVehiculos = async ids => {
  if (!ids.length) {
    return []
  }


  const {
    data,
    error
  } = await supabase
    .from('vehiculo')
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
    .in(
      'id_vehiculo',
      ids
    )


  if (error) {
    throw error
  }


  return data || []
}


/* ============================================================
   VEHÍCULOS DISPONIBLES PARA REPORTES
============================================================ */

export const obtenerVehiculosReporte = async (idMecanico = null) => {
  let query = supabase
    .from('vehiculo')
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
      'no_economico',
      {
        ascending: true
      }
    )

  if (idMecanico !== null && idMecanico !== undefined) {
    const mechanicId = Number(idMecanico)

    if (!Number.isInteger(mechanicId) || mechanicId <= 0) {
      throw new Error('El identificador del mecánico no es válido.')
    }

    query = query.eq('id_mecanico', mechanicId)
  }

  const {
    data,
    error
  } = await query


  if (error) {
    throw error
  }

  const vehicles = data || []

  if (idMecanico === null || !vehicles.length) {
    return vehicles
  }

  const clientIds = unique(vehicles.map(vehicle => vehicle.id_cliente))
  const clients = await obtenerClientes(clientIds)
  const userIds = unique(clients.map(client => client.id_usuario))
  const users = await obtenerUsuarios(userIds)
  const usersById = new Map(users.map(user => [String(user.id_usuario), user]))
  const clientsById = new Map(clients.map(client => [
    String(client.id_cliente),
    {
      ...client,
      usuario: usersById.get(String(client.id_usuario)) || null
    }
  ]))

  return vehicles.map(vehicle => ({
    ...vehicle,
    cliente: clientsById.get(String(vehicle.id_cliente)) || null
  }))
}


/* ============================================================
   CLIENTES
============================================================ */

const obtenerClientes = async ids => {
  if (!ids.length) {
    return []
  }


  const {
    data,
    error
  } = await supabase
    .from('cliente')
    .select(`
      id_cliente,
      id_usuario,
      direccion
    `)
    .in(
      'id_cliente',
      ids
    )


  if (error) {
    throw error
  }


  return data || []
}


/* ============================================================
   MECÁNICOS
============================================================ */

const obtenerMecanicos = async ids => {
  return obtenerMecanicosConHistorial(ids)
}


/* ============================================================
   USUARIOS
============================================================ */

const obtenerUsuarios = async ids => {
  if (!ids.length) {
    return []
  }


  const {
    data,
    error
  } = await supabase
    .from('usuario')
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
      'id_usuario',
      ids
    )


  if (error) {
    throw error
  }


  return data || []
}


/* ============================================================
   DETALLES DE SERVICIOS
============================================================ */

const obtenerDetallesServicios = async idsServicios => {
  if (!idsServicios.length) {
    return {
      motores: [],
      transmisiones: [],
      llantas: []
    }
  }


  const [
    motoresResult,
    transmisionesResult,
    llantasResult
  ] = await Promise.all([
    supabase
      .from('servicio_motor')
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
      .in(
        'id_servicio',
        idsServicios
      ),

    supabase
      .from('servicio_transmision')
      .select(`
        id_servicio,
        tipo_transmision,
        aceite_transmision,
        filtro_de_aceite,
        junta_de_carter,
        color_del_aceite
      `)
      .in(
        'id_servicio',
        idsServicios
      ),

    supabase
      .from('detalle_llanta')
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
      .in(
        'id_servicio',
        idsServicios
      )
  ])


  if (motoresResult.error) {
    throw motoresResult.error
  }


  if (transmisionesResult.error) {
    throw transmisionesResult.error
  }


  if (llantasResult.error) {
    throw llantasResult.error
  }


  return {
    motores:
      motoresResult.data || [],

    transmisiones:
      transmisionesResult.data || [],

    llantas:
      llantasResult.data || []
  }
}


/* ============================================================
   TIPOS DE LLANTA
============================================================ */

const obtenerTiposLlanta = async ids => {
  if (!ids.length) {
    return []
  }


  const {
    data,
    error
  } = await supabase
    .from('tipo_llanta')
    .select(`
      id_tipo,
      posicion,
      tipo_unidad,
      numero_llanta
    `)
    .in(
      'id_tipo',
      ids
    )


  if (error) {
    throw error
  }


  return data || []
}


/* ============================================================
   MANTENIMIENTOS
============================================================ */

const obtenerMantenimientos = async vehiculoIds => {
  if (!vehiculoIds.length) {
    return []
  }


  const {
    data,
    error
  } = await supabase
    .from('configuracion_mantenimiento')
    .select(`
      id_configuracion,
      id_vehiculo,
      ultimo_km_registrado,
      intervalo,
      proximo_servicio
    `)
    .in(
      'id_vehiculo',
      vehiculoIds
    )


  if (error) {
    throw error
  }


  return data || []
}


/* ============================================================
   REPORTE COMPLETO
============================================================ */

export const obtenerReporte = async filtros => {
  const rango =
    crearRangoReporte(
      filtros
    )


  if (!rango) {
    throw new Error(
      'Selecciona una fecha o indica el mes y año del reporte.'
    )
  }


  const idVehiculos =
    unique([
      ...(Array.isArray(filtros?.idVehiculos)
        ? filtros.idVehiculos
        : []),
      filtros?.idVehiculo
    ])

  const idMecanico = filtros?.idMecanico === null ||
    filtros?.idMecanico === undefined
    ? null
    : Number(filtros.idMecanico)

  if (idMecanico !== null && (!Number.isInteger(idMecanico) || idMecanico <= 0)) {
    throw new Error('El identificador del mecánico no es válido.')
  }


  const [
    servicios,
    citas,
    alertas
  ] = await Promise.all([
    obtenerServiciosPeriodo(
      rango,
      idVehiculos,
      idMecanico
    ),

    obtenerCitasPeriodo(
      rango,
      idVehiculos,
      idMecanico
    ),

    obtenerAlertasPeriodo(
      rango,
      idVehiculos
    )
  ])


  /* ========================================================
     IDS PRINCIPALES
  ======================================================== */

  const vehiculoIds =
    unique([
      ...servicios.map(
        item =>
          item.id_vehiculo
      ),

      ...citas.map(
        item =>
          item.id_vehiculo
      ),

      ...alertas.map(
        item =>
          item.id_vehiculo
      ),

      ...idVehiculos
    ])


  const mecanicoIds =
    unique([
      ...servicios.map(
        item =>
          item.id_mecanico
      ),

      ...citas.map(
        item =>
          item.id_mecanico
      )
    ])


  const citaClienteIds =
    unique(
      citas.map(
        item =>
          item.id_cliente
      )
    )


  /* ========================================================
     DATOS RELACIONADOS PRINCIPALES
  ======================================================== */

  const [
    vehiculos,
    mecanicos,
    detalles
  ] = await Promise.all([
    obtenerVehiculos(
      vehiculoIds
    ),

    obtenerMecanicos(
      mecanicoIds
    ),

    obtenerDetallesServicios(
      servicios.map(
        item =>
          item.id_servicio
      )
    )
  ])


  /* ========================================================
     TIPOS / POSICIONES DE LLANTA
  ======================================================== */

  const tipoLlantaIds =
    unique(
      detalles.llantas.map(
        item =>
          item.id_llanta
      )
    )


  const tiposLlanta =
    await obtenerTiposLlanta(
      tipoLlantaIds
    )


  /* ========================================================
     CLIENTES
  ======================================================== */

  const clienteIds =
    unique([
      ...citaClienteIds,

      ...vehiculos.map(
        item =>
          item.id_cliente
      )
    ])


  const clientes =
    await obtenerClientes(
      clienteIds
    )


  /* ========================================================
     USUARIOS
  ======================================================== */

  const usuarioIds =
    unique([
      ...clientes.map(
        item =>
          item.id_usuario
      ),

      ...mecanicos.map(
        item =>
          item.id_usuario
      ),

      ...alertas.map(
        item =>
          item.id_usuario
      )
    ])


  const usuarios =
    await obtenerUsuarios(
      usuarioIds
    )


  /* ========================================================
     MANTENIMIENTO
  ======================================================== */

  const mantenimientos =
    await obtenerMantenimientos(
      vehiculoIds
    )


  /* ========================================================
     MAPA DE USUARIOS
  ======================================================== */

  const usuarioMap =
    new Map(
      usuarios.map(
        usuario => [
          usuario.id_usuario,
          usuario
        ]
      )
    )


  /* ========================================================
     MAPA DE CLIENTES
  ======================================================== */

  const clienteMap =
    new Map(
      clientes.map(
        cliente => [
          cliente.id_cliente,
          {
            ...cliente,

            usuario:
              usuarioMap.get(
                cliente.id_usuario
              ) || null
          }
        ]
      )
    )


  /* ========================================================
     MAPA DE MECÁNICOS
  ======================================================== */

  const mecanicoMap =
    new Map(
      mecanicos.map(
        mecanico => [
          mecanico.id_mecanico,
          {
            ...mecanico,

            usuario:
              mecanico.usuario ||
              usuarioMap.get(
                mecanico.id_usuario
              ) || null
          }
        ]
      )
    )


  /* ========================================================
     MAPA DE VEHÍCULOS
  ======================================================== */

  const vehiculoMap =
    new Map(
      vehiculos.map(
        vehiculo => [
          vehiculo.id_vehiculo,
          {
            ...vehiculo,

            cliente:
              clienteMap.get(
                vehiculo.id_cliente
              ) || null,

            mecanico:
              mecanicoMap.get(
                vehiculo.id_mecanico
              ) || null
          }
        ]
      )
    )


  /* ========================================================
     MAPA MOTOR
  ======================================================== */

  const motorMap =
    new Map(
      detalles.motores.map(
        item => [
          item.id_servicio,
          item
        ]
      )
    )


  /* ========================================================
     MAPA TRANSMISIÓN
  ======================================================== */

  const transmisionMap =
    new Map(
      detalles.transmisiones.map(
        item => [
          item.id_servicio,
          item
        ]
      )
    )


  /* ========================================================
     MAPA TIPOS DE LLANTA
  ======================================================== */

  const tipoLlantaMap =
    new Map(
      tiposLlanta.map(
        item => [
          item.id_tipo,
          item
        ]
      )
    )


  /* ========================================================
     LLANTAS ENRIQUECIDAS

     Agregamos:
     - posición
     - número de llanta
     - tipo de unidad

     Esto permite que el reporte de inspección muestre
     correctamente la posición de cada neumático.
  ======================================================== */

  const llantasCompletas =
    detalles.llantas.map(
      llanta => {
        const tipo =
          tipoLlantaMap.get(
            llanta.id_llanta
          ) || null


        return {
          ...llanta,

          tipo_llanta:
            tipo,

          posicion:
            tipo?.posicion ||
            null,

          numero_llanta:
            tipo?.numero_llanta ||
            null,

          tipo_unidad:
            tipo?.tipo_unidad ||
            null
        }
      }
    )


  /* ========================================================
     SERVICIOS ENRIQUECIDOS
  ======================================================== */

  const serviciosCompletos =
    servicios.map(
      servicio => ({
        ...servicio,

        vehiculo:
          vehiculoMap.get(
            servicio.id_vehiculo
          ) || null,

        mecanico:
          mecanicoMap.get(
            servicio.id_mecanico
          ) || null,

        motor:
          motorMap.get(
            servicio.id_servicio
          ) || null,

        transmision:
          transmisionMap.get(
            servicio.id_servicio
          ) || null,

        llantas:
          llantasCompletas.filter(
            llanta =>
              Number(
                llanta.id_servicio
              ) ===
              Number(
                servicio.id_servicio
              )
          )
      })
    )


  /* ========================================================
     CITAS ENRIQUECIDAS
  ======================================================== */

  const citasCompletas =
    citas.map(
      cita => ({
        ...cita,

        cliente:
          clienteMap.get(
            cita.id_cliente
          ) || null,

        vehiculo:
          vehiculoMap.get(
            cita.id_vehiculo
          ) || null,

        mecanico:
          mecanicoMap.get(
            cita.id_mecanico
          ) || null
      })
    )


  /* ========================================================
     ALERTAS ENRIQUECIDAS
  ======================================================== */

  const alertasCompletas =
    alertas.map(
      alerta => ({
        ...alerta,

        vehiculo:
          vehiculoMap.get(
            alerta.id_vehiculo
          ) || null,

        usuario:
          usuarioMap.get(
            alerta.id_usuario
          ) || null
      })
    )


  /* ========================================================
     MANTENIMIENTOS ENRIQUECIDOS
  ======================================================== */

  const mantenimientosCompletos =
    mantenimientos.map(
      item => ({
        ...item,

        vehiculo:
          vehiculoMap.get(
            item.id_vehiculo
          ) || null
      })
    )


  /* ========================================================
     VEHÍCULO SELECCIONADO
  ======================================================== */

  const vehiculoSeleccionado =
    idVehiculos.length === 1
      ? vehiculos.find(
          vehiculo =>
            String(vehiculo.id_vehiculo) ===
            String(idVehiculos[0])
        ) || null
      : null


  /* ========================================================
     RETORNO
  ======================================================== */

  return {
    rango,

    filtros: {
      ...filtros,
      idVehiculos
    },

    vehiculoSeleccionado,

    servicios:
      serviciosCompletos,

    citas:
      citasCompletas,

    alertas:
      alertasCompletas,

    mantenimientos:
      mantenimientosCompletos,

    vehiculos,

    clientes,

    mecanicos,

    usuarios,

    tiposLlanta,

    resumen: {
      servicios:
        servicios.length,

      vehiculos:
        unique(
          servicios.map(
            item =>
              item.id_vehiculo
          )
        ).length,

      mecanicos:
        unique(
          servicios.map(
            item =>
              item.id_mecanico
          )
        ).length,

      citas:
        citas.length,

      citasAtendidas:
        citas.filter(
          item =>
            item.estado ===
            'ATENDIDA'
        ).length,

      citasVencidas:
        citas.filter(
          item =>
            item.estado ===
            'VENCIDA'
        ).length,

      alertas:
        alertas.length,

      llantasInspeccionadas:
        llantasCompletas.length,

      serviciosMotor:
        detalles.motores.length,

      serviciosTransmision:
        detalles.transmisiones.length
    },

    helpers: {
      nombreCompleto
    }
  }
}


/* ============================================================
   GUARDAR REPORTE GENERADO
============================================================ */

export const guardarReporteGenerado = async ({
  tipoReporte,
  mes,
  anio,
  periodo,
  orientacion = 'portrait',
  idMecanico = null,
  idVehiculo = null,
  datos
}) => {
  if (!tipoReporte) {
    throw new Error(
      'No se especificó el tipo de reporte.'
    )
  }


  if (!mes || !anio) {
    throw new Error(
      'El mes y el año son obligatorios para guardar el reporte.'
    )
  }


  if (!datos) {
    throw new Error(
      'No existen datos del reporte para guardar.'
    )
  }


  const {
    data,
    error
  } = await supabase
    .from('reporte_generado')
    .insert({
      tipo_reporte:
        tipoReporte,

      mes:
        Number(mes),

      anio:
        Number(anio),

      periodo:
        periodo || '',

      orientacion:
        orientacion || 'portrait',

      id_mecanico:
        idMecanico,

      id_vehiculo:
        idVehiculo,

      datos
    })
    .select(`
      id_reporte,
      tipo_reporte,
      generado_automaticamente,
      id_mecanico,
      id_vehiculo,
      mes,
      anio,
      periodo,
      orientacion,
      datos,
      fecha_generacion
    `)
    .single()


  if (error) {
    throw error
  }


  return data
}


/* ============================================================
   OBTENER HISTORIAL DE REPORTES
============================================================ */

export const obtenerHistorialReportes = async (idMecanico = null) => {
  let query = supabase
    .from('reporte_generado')
    .select(`
      id_reporte,
      tipo_reporte,
      generado_automaticamente,
      id_mecanico,
      id_vehiculo,
      mes,
      anio,
      periodo,
      orientacion,
      datos,
      fecha_generacion
    `)
    .order(
      'fecha_generacion',
      {
        ascending: false
      }
    )

  if (idMecanico !== null && idMecanico !== undefined) {
    query = query.eq('id_mecanico', Number(idMecanico))
  }

  const {
    data,
    error
  } = await query


  if (error) {
    throw error
  }


  return data || []
}