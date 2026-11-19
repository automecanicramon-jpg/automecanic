import { supabase } from './supabase.js'
import { evaluarAlertaMantenimientoVehiculo } from './alertaService.js'


const limpiarTexto = value => {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  return String(value).trim()
}


const normalizarPlacas =
  placas =>
    limpiarTexto(
      placas
    ).toUpperCase()


/* ============================================================
   VEHÍCULOS
============================================================ */

export const obtenerVehiculos =
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
        'id_vehiculo',
        {
          ascending: false
        }
      )

    if (error) {
      throw error
    }

    return data || []
  }


export const obtenerVehiculoPorId =
  async idVehiculo => {
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
        idVehiculo
      )
      .single()

    if (error) {
      throw error
    }

    return data
  }

/* ============================================================
   VEHÍCULOS ASIGNADOS A UN MECÁNICO
============================================================ */

export const obtenerVehiculosMecanico =
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
      data: vehiculos,
      error: vehiculosError
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
      .eq('id_mecanico', mechanicId)
      .order('id_vehiculo', {
        ascending: false
      })

    if (vehiculosError) {
      throw vehiculosError
    }

    if (!vehiculos?.length) {
      return []
    }

    const [
      directAssignmentsResult,
      linkedVehiclesResult
    ] = await Promise.all([
      supabase
        .from('mecanico_cliente')
        .select('id_cliente')
        .eq('id_mecanico', mechanicId),
      supabase
        .from('vehiculo')
        .select('id_cliente')
        .eq('id_mecanico', mechanicId)
    ])

    if (directAssignmentsResult.error) {
      throw directAssignmentsResult.error
    }

    if (linkedVehiclesResult.error) {
      throw linkedVehiclesResult.error
    }

    const idsClientes = [
      ...new Set(
        [
          ...vehiculos.map(vehiculo => vehiculo.id_cliente),
          ...(directAssignmentsResult.data || []).map(item => item.id_cliente),
          ...(linkedVehiclesResult.data || []).map(item => item.id_cliente)
        ]
          .filter(idCliente =>
            idCliente !== null &&
            idCliente !== undefined
          )
      )
    ]

    if (!idsClientes.length) {
      return vehiculos.map(vehiculo => ({
        ...vehiculo,
        cliente: null
      }))
    }

    const {
      data: clientes,
      error: clientesError
    } = await supabase
      .from('cliente')
      .select(`
        id_cliente,
        id_usuario,
        direccion
      `)
      .in('id_cliente', idsClientes)

    if (clientesError) {
      throw clientesError
    }

    const idsUsuarios = [
      ...new Set(
        (clientes || [])
          .map(cliente => cliente.id_usuario)
          .filter(Boolean)
      )
    ]

    let usuarios = []

    if (idsUsuarios.length) {
      const {
        data,
        error: usuariosError
      } = await supabase
        .from('usuario')
        .select(`
          id_usuario,
          nombre,
          apellido_paterno,
          apellido_materno,
          correo,
          telefono,
          estatus,
          fecha_registro
        `)
        .in('id_usuario', idsUsuarios)

      if (usuariosError) {
        throw usuariosError
      }

      usuarios = data || []
    }

    const usuariosPorId = new Map(
      usuarios.map(usuario => [
        usuario.id_usuario,
        usuario
      ])
    )

    const clientesPorId = new Map(
      (clientes || []).map(cliente => [
        cliente.id_cliente,
        {
          ...cliente,
          usuario: usuariosPorId.get(cliente.id_usuario) || null
        }
      ])
    )

    return vehiculos.map(vehiculo => ({
      ...vehiculo,
      cliente: clientesPorId.get(vehiculo.id_cliente) || null
    }))
  }


/* ============================================================
   CLIENTES
============================================================ */

export const obtenerClientesVehiculo =
  async () => {
    const {
      data: clientes,
      error
    } = await supabase
      .from('cliente')
      .select(`
        id_cliente,
        id_usuario
      `)
      .order(
        'id_cliente',
        {
          ascending: false
        }
      )

    if (error) {
      throw error
    }

    if (!clientes?.length) {
      return []
    }

    const ids =
      clientes
        .map(
          item =>
            item.id_usuario
        )
        .filter(Boolean)

    if (!ids.length) {
      return clientes.map(
        cliente => ({
          ...cliente,
          usuario: null
        })
      )
    }

    const {
      data: usuarios,
      error:
        usuariosError
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

    if (usuariosError) {
      throw usuariosError
    }

    const map =
      new Map(
        (usuarios || [])
          .map(
            usuario => [
              usuario.id_usuario,
              usuario
            ]
          )
      )

    return clientes.map(
      cliente => ({
        ...cliente,

        usuario:
          map.get(
            cliente.id_usuario
          ) || null
      })
    )
  }


/* ============================================================
   MECÁNICOS
============================================================ */

export const obtenerMecanicosVehiculo =
  async () => {
    const {
      data: mecanicos,
      error
    } = await supabase
      .from('mecanico')
      .select(`
        id_mecanico,
        id_usuario,
        especialidad
      `)
      .order(
        'id_mecanico',
        {
          ascending: false
        }
      )

    if (error) {
      throw error
    }

    if (!mecanicos?.length) {
      return []
    }

    const ids =
      mecanicos
        .map(
          item =>
            item.id_usuario
        )
        .filter(Boolean)

    if (!ids.length) {
      return mecanicos.map(
        mecanico => ({
          ...mecanico,
          usuario: null
        })
      )
    }

    const {
      data: usuarios,
      error:
        usuariosError
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

    if (usuariosError) {
      throw usuariosError
    }

    const map =
      new Map(
        (usuarios || [])
          .map(
            usuario => [
              usuario.id_usuario,
              usuario
            ]
          )
      )

    return mecanicos.map(
      mecanico => ({
        ...mecanico,

        usuario:
          map.get(
            mecanico.id_usuario
          ) || null
      })
    )
  }


/* ============================================================
   VALIDAR PLACAS
============================================================ */

export const existePlaca =
  async (
    placas,
    idVehiculoExcluir = null
  ) => {
    const valor =
      normalizarPlacas(
        placas
      )

    let query =
      supabase
        .from('vehiculo')
        .select(
          'id_vehiculo',
          {
            count: 'exact',
            head: true
          }
        )
        .ilike(
          'placas',
          valor
        )

    if (idVehiculoExcluir) {
      query =
        query.neq(
          'id_vehiculo',
          idVehiculoExcluir
        )
    }

    const {
      count,
      error
    } = await query

    if (error) {
      throw error
    }

    return (
      Number(
        count || 0
      ) > 0
    )
  }


/* ============================================================
   REGISTRAR VEHÍCULO
============================================================ */

export const registrarVehiculo =
  async datos => {
    const placas =
      normalizarPlacas(
        datos.placas
      )

    const marca =
      limpiarTexto(
        datos.marca
      )

    const modelo =
      limpiarTexto(
        datos.modelo
      )

    if (!datos.id_cliente) {
      throw new Error(
        'Selecciona un cliente.'
      )
    }

    if (!placas) {
      throw new Error(
        'Las placas son obligatorias.'
      )
    }

    if (!marca) {
      throw new Error(
        'La marca es obligatoria.'
      )
    }

    if (!modelo) {
      throw new Error(
        'El modelo es obligatorio.'
      )
    }

    if (
      await existePlaca(
        placas
      )
    ) {
      throw new Error(
        'Las placas ingresadas ya están registradas.'
      )
    }

    const {
      data,
      error
    } = await supabase
      .from('vehiculo')
      .insert({
        id_cliente:
          Number(
            datos.id_cliente
          ),

        id_mecanico:
          datos.id_mecanico
            ? Number(
                datos.id_mecanico
              )
            : null,

        no_economico:
          limpiarTexto(
            datos.no_economico
          ) || null,

        placas,

        numero_serie:
          limpiarTexto(
            datos.numero_serie
          ) || null,

        marca,

        modelo,

        anio_modelo:
          datos.anio_modelo !== ''
            ? Number(
                datos.anio_modelo
              )
            : null,

        tipo_unidad:
          limpiarTexto(
            datos.tipo_unidad
          ) || null,

        kilometraje_actual:
          datos.kilometraje_actual !== ''
            ? Number(
                datos.kilometraje_actual
              )
            : null,

        estatus:
          limpiarTexto(
            datos.estatus
          ) || 'Activo'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }


/* ============================================================
   REGISTRAR VEHÍCULO + MANTENIMIENTO
============================================================ */

export const registrarVehiculoConMantenimiento =
  async (
    datosVehiculo,
    mantenimiento
  ) => {
    const ultimoKm =
      Number(
        mantenimiento
          ?.ultimo_km_registrado
      )

    const intervalo =
      Number(
        mantenimiento
          ?.intervalo
      )

    if (
      !Number.isFinite(
        ultimoKm
      ) ||
      ultimoKm < 0
    ) {
      throw new Error(
        'El kilometraje del último mantenimiento no es válido.'
      )
    }

    if (
      !Number.isFinite(
        intervalo
      ) ||
      intervalo <= 0
    ) {
      throw new Error(
        'El intervalo de mantenimiento debe ser mayor a 0 km.'
      )
    }

    const actual =
      Number(
        datosVehiculo
          ?.kilometraje_actual ||
          0
      )

    if (
      ultimoKm > actual
    ) {
      throw new Error(
        'El último mantenimiento no puede ser mayor que el kilometraje actual del vehículo.'
      )
    }

    let vehiculoCreado =
      null

    try {
      vehiculoCreado =
        await registrarVehiculo(
          datosVehiculo
        )

      const {
        data: configuracion,
        error
      } = await supabase
        .from(
          'configuracion_mantenimiento'
        )
        .insert({
          id_vehiculo:
            vehiculoCreado
              .id_vehiculo,

          ultimo_km_registrado:
            ultimoKm,

          intervalo,

          proximo_servicio:
            ultimoKm +
            intervalo
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      try {
        await evaluarAlertaMantenimientoVehiculo(
          vehiculoCreado
            .id_vehiculo
        )
      } catch (
        alertaError
      ) {
        console.error(
          'El vehículo fue registrado, pero no fue posible evaluar su alerta de mantenimiento:',
          alertaError
        )
      }

      return {
        vehiculo:
          vehiculoCreado,

        configuracion
      }
    } catch (error) {
      if (
        vehiculoCreado
          ?.id_vehiculo
      ) {
        const {
          error:
            rollbackError
        } = await supabase
          .from('vehiculo')
          .delete()
          .eq(
            'id_vehiculo',
            vehiculoCreado
              .id_vehiculo
          )

        if (rollbackError) {
          console.error(
            'No fue posible revertir el vehículo:',
            rollbackError
          )
        }
      }

      throw error
    }
  }


/* ============================================================
   ACTUALIZAR VEHÍCULO
============================================================ */

export const actualizarVehiculo =
  async (
    idVehiculo,
    datos
  ) => {
    if (!idVehiculo) {
      throw new Error(
        'No se encontró el vehículo.'
      )
    }

    if (!datos.id_cliente) {
      throw new Error(
        'Selecciona un cliente.'
      )
    }

    const placas =
      normalizarPlacas(
        datos.placas
      )

    const marca =
      limpiarTexto(
        datos.marca
      )

    const modelo =
      limpiarTexto(
        datos.modelo
      )

    if (
      !placas ||
      !marca ||
      !modelo
    ) {
      throw new Error(
        'Placas, marca y modelo son obligatorios.'
      )
    }

    if (
      await existePlaca(
        placas,
        idVehiculo
      )
    ) {
      throw new Error(
        'Las placas ingresadas pertenecen a otro vehículo.'
      )
    }

    const {
      data,
      error
    } = await supabase
      .from('vehiculo')
      .update({
        id_cliente:
          Number(
            datos.id_cliente
          ),

        id_mecanico:
          datos.id_mecanico
            ? Number(
                datos.id_mecanico
              )
            : null,

        no_economico:
          limpiarTexto(
            datos.no_economico
          ) || null,

        placas,

        numero_serie:
          limpiarTexto(
            datos.numero_serie
          ) || null,

        marca,

        modelo,

        anio_modelo:
          datos.anio_modelo !== ''
            ? Number(
                datos.anio_modelo
              )
            : null,

        tipo_unidad:
          limpiarTexto(
            datos.tipo_unidad
          ) || null,

        kilometraje_actual:
          datos.kilometraje_actual !== ''
            ? Number(
                datos.kilometraje_actual
              )
            : null,

        estatus:
          limpiarTexto(
            datos.estatus
          ) || 'Activo'
      })
      .eq(
        'id_vehiculo',
        idVehiculo
      )
      .select()
      .single()

    if (error) {
      throw error
    }

    /*
     * Aquí se detecta automáticamente si el nuevo
     * kilometraje cambió a PRÓXIMO o VENCIDO.
     */
    try {
      await evaluarAlertaMantenimientoVehiculo(
        idVehiculo
      )
    } catch (error) {
      console.error(
        'El vehículo fue actualizado, pero no fue posible evaluar la alerta:',
        error
      )
    }

    return data
  }


/* ============================================================
   CAMBIAR ESTADO
============================================================ */

export const cambiarEstadoVehiculo =
  async (
    idVehiculo,
    nuevoEstado
  ) => {
    const {
      error
    } = await supabase
      .from('vehiculo')
      .update({
        estatus:
          nuevoEstado
      })
      .eq(
        'id_vehiculo',
        idVehiculo
      )

    if (error) {
      throw error
    }

    return true
  }


/* ============================================================
   DEPENDENCIAS
============================================================ */

export const obtenerDependenciasVehiculo =
  async idVehiculo => {
    const [
      servicios,
      alertas,
      configuraciones,
      citas
    ] = await Promise.all([
      supabase
        .from('servicio')
        .select(
          'id_servicio',
          {
            count: 'exact',
            head: true
          }
        )
        .eq(
          'id_vehiculo',
          idVehiculo
        ),

      supabase
        .from('alerta')
        .select(
          'id_alerta',
          {
            count: 'exact',
            head: true
          }
        )
        .eq(
          'id_vehiculo',
          idVehiculo
        ),

      supabase
        .from(
          'configuracion_mantenimiento'
        )
        .select(
          'id_configuracion',
          {
            count: 'exact',
            head: true
          }
        )
        .eq(
          'id_vehiculo',
          idVehiculo
        ),

      supabase
        .from('cita')
        .select(
          'id_cita',
          {
            count: 'exact',
            head: true
          }
        )
        .eq(
          'id_vehiculo',
          idVehiculo
        )
    ])

    if (servicios.error) {
      throw servicios.error
    }

    if (alertas.error) {
      throw alertas.error
    }

    if (
      configuraciones.error
    ) {
      throw configuraciones.error
    }

    return {
      servicios:
        Number(
          servicios.count || 0
        ),

      alertas:
        Number(
          alertas.count || 0
        ),

      configuraciones:
        Number(
          configuraciones.count ||
          0
        ),

      citas:
        Number(
          citas.count || 0
        )
    }
  }


/* ============================================================
   ELIMINAR
============================================================ */

export const eliminarVehiculo =
  async idVehiculo => {
    if (!idVehiculo) {
      throw new Error(
        'No se encontró el vehículo.'
      )
    }

    const dependencias =
      await obtenerDependenciasVehiculo(
        idVehiculo
      )

    const total =
      dependencias.servicios +
      dependencias.alertas +
      dependencias.configuraciones +
      dependencias.citas

    if (total > 0) {
      throw new Error(
        `No se puede eliminar este vehículo porque tiene información relacionada. ` +
        `Servicios: ${dependencias.servicios}, ` +
        `alertas: ${dependencias.alertas}, ` +
        `configuraciones: ${dependencias.configuraciones}, ` +
        `citas: ${dependencias.citas}. ` +
        `Puedes cambiar su estado a Inactivo.`
      )
    }

    const {
      error
    } = await supabase
      .from('vehiculo')
      .delete()
      .eq(
        'id_vehiculo',
        idVehiculo
      )

    if (error) {
      throw error
    }

    return true
  }