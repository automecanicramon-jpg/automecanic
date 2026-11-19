import { supabase } from './supabase.js'
import { evaluarAlertaMantenimientoVehiculo } from './alertaService.js'


export const MARGEN_MANTENIMIENTO_PROXIMO = 1000


const numeroValido = value => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  const numero =
    Number(value)

  return Number.isFinite(numero)
    ? numero
    : null
}


const validarId = (
  value,
  mensaje
) => {
  const id =
    Number(value)

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      mensaje
    )
  }

  return id
}


/* ============================================================
   CALCULAR PRÓXIMO SERVICIO
============================================================ */

export const calcularProximoServicio = (
  ultimoKm,
  intervalo
) => {
  const ultimo =
    numeroValido(
      ultimoKm
    )

  const intervaloNumerico =
    numeroValido(
      intervalo
    )

  if (
    ultimo === null ||
    ultimo < 0
  ) {
    throw new Error(
      'El último kilometraje registrado no es válido.'
    )
  }

  if (
    intervaloNumerico === null ||
    intervaloNumerico <= 0
  ) {
    throw new Error(
      'El intervalo de mantenimiento debe ser mayor a 0 km.'
    )
  }

  return (
    ultimo +
    intervaloNumerico
  )
}


/* ============================================================
   CALCULAR ESTADO
============================================================ */

export const calcularEstadoMantenimiento = ({
  kilometrajeActual,
  proximoServicio,
  margenProximo =
    MARGEN_MANTENIMIENTO_PROXIMO
} = {}) => {
  const actual =
    numeroValido(
      kilometrajeActual
    )

  const proximo =
    numeroValido(
      proximoServicio
    )

  if (
    actual === null ||
    proximo === null
  ) {
    return {
      estado:
        'SIN_CONFIGURAR',

      kilometrosRestantes:
        null,

      kilometrosExcedidos:
        null
    }
  }

  const diferencia =
    proximo -
    actual

  if (
    diferencia <= 0
  ) {
    return {
      estado:
        'VENCIDO',

      kilometrosRestantes:
        0,

      kilometrosExcedidos:
        Math.abs(
          diferencia
        )
    }
  }

  if (
    diferencia <=
    margenProximo
  ) {
    return {
      estado:
        'PROXIMO',

      kilometrosRestantes:
        diferencia,

      kilometrosExcedidos:
        0
    }
  }

  return {
    estado:
      'AL_DIA',

    kilometrosRestantes:
      diferencia,

    kilometrosExcedidos:
      0
  }
}


/* ============================================================
   VEHÍCULOS
============================================================ */

export const obtenerVehiculosMantenimiento =
  async () => {
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
        numero_serie,
        marca,
        modelo,
        anio_modelo,
        tipo_unidad,
        kilometraje_actual,
        estatus
      `)
      .order(
        'marca',
        {
          ascending: true
        }
      )
      .order(
        'modelo',
        {
          ascending: true
        }
      )

    if (error) {
      throw error
    }

    return data || []
  }


/* ============================================================
   CONFIGURACIONES
============================================================ */

export const obtenerConfiguracionesMantenimiento =
  async () => {
    const {
      data: configuraciones,
      error
    } = await supabase
      .from(
        'configuracion_mantenimiento'
      )
      .select(`
        id_configuracion,
        id_vehiculo,
        ultimo_km_registrado,
        intervalo,
        proximo_servicio
      `)
      .order(
        'id_configuracion',
        {
          ascending: false
        }
      )

    if (error) {
      throw error
    }

    if (
      !configuraciones?.length
    ) {
      return []
    }

    const ids = [
      ...new Set(
        configuraciones
          .map(
            item =>
              item.id_vehiculo
          )
          .filter(Boolean)
      )
    ]

    let vehiculos = []

    if (ids.length) {
      const {
        data,
        error:
          vehiculosError
      } = await supabase
        .from('vehiculo')
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
          'id_vehiculo',
          ids
        )

      if (vehiculosError) {
        throw vehiculosError
      }

      vehiculos =
        data || []
    }

    const map =
      new Map(
        vehiculos.map(
          vehiculo => [
            vehiculo.id_vehiculo,
            vehiculo
          ]
        )
      )

    return configuraciones.map(
      configuracion => {
        const vehiculo =
          map.get(
            configuracion.id_vehiculo
          ) || null

        const estado =
          calcularEstadoMantenimiento({
            kilometrajeActual:
              vehiculo
                ?.kilometraje_actual,

            proximoServicio:
              configuracion
                .proximo_servicio
          })

        return {
          ...configuracion,

          vehiculo,

          estado_mantenimiento:
            estado.estado,

          kilometros_restantes:
            estado
              .kilometrosRestantes,

          kilometros_excedidos:
            estado
              .kilometrosExcedidos
        }
      }
    )
  }


export const obtenerConfiguracionPorVehiculo =
  async idVehiculo => {
    const id =
      validarId(
        idVehiculo,
        'El vehículo seleccionado no es válido.'
      )

    const {
      data,
      error
    } = await supabase
      .from(
        'configuracion_mantenimiento'
      )
      .select(`
        id_configuracion,
        id_vehiculo,
        ultimo_km_registrado,
        intervalo,
        proximo_servicio
      `)
      .eq(
        'id_vehiculo',
        id
      )
      .order(
        'id_configuracion',
        {
          ascending: false
        }
      )
      .limit(1)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data || null
  }


const obtenerVehiculoMantenimientoPorId =
  async idVehiculo => {
    const id =
      validarId(
        idVehiculo,
        'El vehículo seleccionado no es válido.'
      )

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
        numero_serie,
        marca,
        modelo,
        anio_modelo,
        tipo_unidad,
        kilometraje_actual,
        estatus
      `)
      .eq(
        'id_vehiculo',
        id
      )
      .single()

    if (error) {
      throw error
    }

    return data
  }


const validarDatosConfiguracion =
  async ({
    id_vehiculo,
    ultimo_km_registrado,
    intervalo
  }) => {
    const idVehiculo =
      validarId(
        id_vehiculo,
        'Selecciona un vehículo.'
      )

    const ultimoKm =
      numeroValido(
        ultimo_km_registrado
      )

    const intervaloKm =
      numeroValido(
        intervalo
      )

    if (
      ultimoKm === null
    ) {
      throw new Error(
        'Ingresa el último kilometraje de mantenimiento.'
      )
    }

    if (
      ultimoKm < 0
    ) {
      throw new Error(
        'El último kilometraje registrado no puede ser negativo.'
      )
    }

    if (
      intervaloKm === null ||
      intervaloKm <= 0
    ) {
      throw new Error(
        'El intervalo de mantenimiento debe ser mayor a 0 km.'
      )
    }

    const vehiculo =
      await obtenerVehiculoMantenimientoPorId(
        idVehiculo
      )

    const actual =
      numeroValido(
        vehiculo
          .kilometraje_actual
      )

    if (
      actual !== null &&
      ultimoKm > actual
    ) {
      throw new Error(
        `El último kilometraje de mantenimiento (${ultimoKm} km) no puede ser mayor al kilometraje actual del vehículo (${actual} km).`
      )
    }

    return {
      idVehiculo,

      ultimoKm,

      intervaloKm,

      proximoServicio:
        calcularProximoServicio(
          ultimoKm,
          intervaloKm
        ),

      vehiculo
    }
  }


/* ============================================================
   CREAR
============================================================ */

export const crearConfiguracionMantenimiento =
  async datos => {
    const {
      idVehiculo,
      ultimoKm,
      intervaloKm,
      proximoServicio
    } =
      await validarDatosConfiguracion(
        datos
      )

    const existente =
      await obtenerConfiguracionPorVehiculo(
        idVehiculo
      )

    if (existente) {
      throw new Error(
        'Este vehículo ya tiene una configuración de mantenimiento. Puedes actualizarla.'
      )
    }

    const {
      data,
      error
    } = await supabase
      .from(
        'configuracion_mantenimiento'
      )
      .insert({
        id_vehiculo:
          idVehiculo,

        ultimo_km_registrado:
          ultimoKm,

        intervalo:
          intervaloKm,

        proximo_servicio:
          proximoServicio
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    try {
      await evaluarAlertaMantenimientoVehiculo(
        idVehiculo
      )
    } catch (error) {
      console.error(
        'La configuración fue creada, pero no fue posible evaluar la alerta:',
        error
      )
    }

    return data
  }


/* ============================================================
   ACTUALIZAR
============================================================ */

export const actualizarConfiguracionMantenimiento =
  async (
    idConfiguracion,
    datos
  ) => {
    const id =
      validarId(
        idConfiguracion,
        'La configuración seleccionada no es válida.'
      )

    const {
      idVehiculo,
      ultimoKm,
      intervaloKm,
      proximoServicio
    } =
      await validarDatosConfiguracion(
        datos
      )

    const {
      data:
        otrasConfiguraciones,
      error:
        duplicadoError
    } = await supabase
      .from(
        'configuracion_mantenimiento'
      )
      .select(`
        id_configuracion
      `)
      .eq(
        'id_vehiculo',
        idVehiculo
      )
      .neq(
        'id_configuracion',
        id
      )
      .limit(1)

    if (duplicadoError) {
      throw duplicadoError
    }

    if (
      otrasConfiguraciones
        ?.length
    ) {
      throw new Error(
        'Ya existe otra configuración de mantenimiento para este vehículo.'
      )
    }

    const {
      data,
      error
    } = await supabase
      .from(
        'configuracion_mantenimiento'
      )
      .update({
        id_vehiculo:
          idVehiculo,

        ultimo_km_registrado:
          ultimoKm,

        intervalo:
          intervaloKm,

        proximo_servicio:
          proximoServicio
      })
      .eq(
        'id_configuracion',
        id
      )
      .select()
      .single()

    if (error) {
      throw error
    }

    try {
      await evaluarAlertaMantenimientoVehiculo(
        idVehiculo
      )
    } catch (error) {
      console.error(
        'La configuración fue actualizada, pero no fue posible evaluar la alerta:',
        error
      )
    }

    return data
  }


/* ============================================================
   GUARDAR
============================================================ */

export const guardarConfiguracionMantenimiento =
  async datos => {
    if (
      !datos?.id_vehiculo
    ) {
      throw new Error(
        'Selecciona un vehículo.'
      )
    }

    const existente =
      await obtenerConfiguracionPorVehiculo(
        datos.id_vehiculo
      )

    if (existente) {
      return actualizarConfiguracionMantenimiento(
        existente
          .id_configuracion,
        datos
      )
    }

    return crearConfiguracionMantenimiento(
      datos
    )
  }


/* ============================================================
   ELIMINAR
============================================================ */

export const eliminarConfiguracionMantenimiento =
  async idConfiguracion => {
    const id =
      validarId(
        idConfiguracion,
        'La configuración seleccionada no es válida.'
      )

    const {
      error
    } = await supabase
      .from(
        'configuracion_mantenimiento'
      )
      .delete()
      .eq(
        'id_configuracion',
        id
      )

    if (error) {
      throw error
    }

    return true
  }


/* ============================================================
   RESUMEN
============================================================ */

export const obtenerResumenMantenimiento =
  async () => {
    const configuraciones =
      await obtenerConfiguracionesMantenimiento()

    const resumen = {
      total:
        configuraciones.length,

      alDia:
        0,

      proximos:
        0,

      vencidos:
        0
    }

    configuraciones.forEach(
      configuracion => {
        switch (
          configuracion
            .estado_mantenimiento
        ) {
          case 'AL_DIA':
            resumen.alDia++
            break

          case 'PROXIMO':
            resumen.proximos++
            break

          case 'VENCIDO':
            resumen.vencidos++
            break

          default:
            break
        }
      }
    )

    return resumen
  }