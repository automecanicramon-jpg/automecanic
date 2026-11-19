import { supabase } from './supabase.js'

/* ============================================================
   UTILIDADES
============================================================ */

const limpiarTexto = value => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

const normalizarCorreo = correo => {
  return limpiarTexto(correo).toLowerCase()
}

/* ============================================================
   PERFIL DEL CLIENTE AUTENTICADO
============================================================ */

const obtenerPerfilClientePorAuthId = async authId => {
  if (!authId) {
    throw new Error(
      'No fue posible identificar al usuario autenticado.'
    )
  }

  const {
    data: usuario,
    error: usuarioError
  } = await supabase
    .from('usuario')
    .select(`
      id_usuario,
      id_rol,
      nombre,
      apellido_paterno,
      apellido_materno,
      correo,
      telefono,
      estatus,
      fecha_registro,
      auth_id
    `)
    .eq('auth_id', authId)
    .single()

  if (usuarioError) {
    throw usuarioError
  }

  if (Number(usuario?.id_rol) !== 3) {
    throw new Error(
      'La cuenta ingresada no corresponde a un cliente.'
    )
  }

  const estado =
    limpiarTexto(usuario?.estatus).toLowerCase()

  if (estado && estado !== 'activo') {
    throw new Error(
      'La cuenta del cliente se encuentra inactiva.'
    )
  }

  const {
    data: cliente,
    error: clienteError
  } = await supabase
    .from('cliente')
    .select(`
      id_cliente,
      id_usuario,
      direccion
    `)
    .eq('id_usuario', usuario.id_usuario)
    .single()

  if (clienteError) {
    throw clienteError
  }

  return {
    ...cliente,
    ...usuario,
    usuario,
    auth_id: usuario.auth_id,
    id_cliente: cliente.id_cliente,
    id_usuario: usuario.id_usuario,
    direccion: cliente.direccion
  }
}

/* ============================================================
   INICIAR SESIÓN DEL CLIENTE
============================================================ */

export const iniciarSesionCliente = async (
  correo,
  contrasenia
) => {
  const email = normalizarCorreo(correo)
  const password = limpiarTexto(contrasenia)

  if (!email) {
    throw new Error(
      'Ingresa tu correo electrónico.'
    )
  }

  if (!password) {
    throw new Error(
      'Ingresa tu contraseña.'
    )
  }

  const {
    data: authData,
    error: authError
  } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError) {
    throw new Error(
      authError.message ||
      'Correo o contraseña incorrectos.'
    )
  }

  try {
    return await obtenerPerfilClientePorAuthId(
      authData?.user?.id
    )
  } catch (error) {
    await supabase.auth.signOut()
    throw error
  }
}

/* ============================================================
   OBTENER SESIÓN DEL CLIENTE
============================================================ */

export const obtenerSesionCliente = async () => {
  const {
    data,
    error
  } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  const authId = data?.session?.user?.id

  if (!authId) {
    return null
  }

  try {
    return await obtenerPerfilClientePorAuthId(
      authId
    )
  } catch (error) {
    await supabase.auth.signOut()
    throw error
  }
}

/* ============================================================
   CERRAR SESIÓN DEL CLIENTE
============================================================ */

export const cerrarSesionCliente = async () => {
  const { error } =
    await supabase.auth.signOut()

  if (error) {
    throw error
  }

  return true
}

/* ============================================================
   OBTENER CLIENTES
============================================================ */

export const obtenerClientes = async () => {
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
    .order('id_cliente', {
      ascending: false
    })

  if (clientesError) {
    throw clientesError
  }

  if (!clientes?.length) {
    return []
  }

  const usuariosIds =
    clientes
      .map(cliente => cliente.id_usuario)
      .filter(Boolean)

  if (!usuariosIds.length) {
    return clientes.map(cliente => ({
      ...cliente,
      usuario: null
    }))
  }

  const {
    data: usuarios,
    error: usuariosError
  } = await supabase
    .from('usuario')
    .select(`
      id_usuario,
      id_rol,
      nombre,
      apellido_paterno,
      apellido_materno,
      correo,
      telefono,
      estatus,
      fecha_registro,
      auth_id
    `)
    .in('id_usuario', usuariosIds)

  if (usuariosError) {
    throw usuariosError
  }

  const usuariosMap =
    new Map(
      (usuarios || []).map(usuario => [
        usuario.id_usuario,
        usuario
      ])
    )

  return clientes.map(cliente => ({
    ...cliente,
    usuario:
      usuariosMap.get(
        cliente.id_usuario
      ) || null
  }))
}

/* ============================================================
   CLIENTES ASIGNADOS A UN MECÁNICO

   La asignación se representa desde vehiculo:
   cada unidad relaciona id_mecanico con id_cliente.
============================================================ */

export const obtenerClientesMecanico = async idMecanico => {
  if (
    idMecanico === null ||
    idMecanico === undefined ||
    idMecanico === ''
  ) {
    throw new Error(
      'Se requiere el identificador del mecánico.'
    )
  }

  const [
    vehicleAssignmentsResult,
    directAssignmentsResult
  ] = await Promise.all([
    supabase
      .from('vehiculo')
      .select('id_cliente')
      .eq('id_mecanico', idMecanico),
    supabase
      .from('mecanico_cliente')
      .select('id_cliente')
      .eq('id_mecanico', idMecanico)
  ])

  if (vehicleAssignmentsResult.error) {
    throw vehicleAssignmentsResult.error
  }

  if (directAssignmentsResult.error) {
    throw directAssignmentsResult.error
  }

  const asignacionesVehiculo = vehicleAssignmentsResult.data || []
  const asignacionesDirectas = directAssignmentsResult.data || []

  const idsClientes = [
    ...new Map(
      [...asignacionesVehiculo, ...asignacionesDirectas]
        .filter(asignacion =>
          asignacion.id_cliente !== null &&
          asignacion.id_cliente !== undefined
        )
        .map(asignacion => [
          String(asignacion.id_cliente),
          asignacion.id_cliente
        ])
    ).values()
  ]

  if (!idsClientes.length) {
    return {
      clientes: [],
      vehiculosAsignados: asignacionesVehiculo.length,
      vehiculosSinCliente: asignacionesVehiculo.filter(
        asignacion => asignacion.id_cliente === null || asignacion.id_cliente === undefined
      ).length,
      perfilesIncompletos: 0
    }
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
    .order('id_cliente', {
      ascending: false
    })

  if (clientesError) {
    throw clientesError
  }

  const usuarioIds = [
    ...new Set(
      (clientes || [])
        .map(cliente => cliente.id_usuario)
        .filter(Boolean)
    )
  ]

  if (!usuarioIds.length) {
    return {
      clientes: [],
      vehiculosAsignados: asignacionesVehiculo.length,
      vehiculosSinCliente: asignacionesVehiculo.filter(
        asignacion => asignacion.id_cliente === null || asignacion.id_cliente === undefined
      ).length,
      perfilesIncompletos: (clientes || []).length
    }
  }

  const {
    data: usuarios,
    error: usuariosError
  } = await supabase
    .from('usuario')
    .select(`
      id_usuario,
      id_rol,
      nombre,
      apellido_paterno,
      apellido_materno,
      correo,
      telefono,
      estatus,
      fecha_registro,
      auth_id
    `)
    .in('id_usuario', usuarioIds)

  if (usuariosError) {
    throw usuariosError
  }

  const usuariosPorId = new Map(
    (usuarios || []).map(usuario => [
      usuario.id_usuario,
      usuario
    ])
  )

  const clientesCompletos = (clientes || []).map(cliente => ({
    ...cliente,
    usuario: usuariosPorId.get(cliente.id_usuario) || null
  }))

  const clientesVisibles = clientesCompletos.filter(cliente => {
    const usuario = cliente.usuario
    return Boolean(
      usuario &&
      (
        usuario.nombre ||
        usuario.correo ||
        usuario.telefono
      )
    )
  })

  return {
    clientes: clientesVisibles,
    vehiculosAsignados: asignacionesVehiculo.length,
    vehiculosSinCliente: asignacionesVehiculo.filter(
      asignacion => asignacion.id_cliente === null || asignacion.id_cliente === undefined
    ).length,
    perfilesIncompletos: clientesCompletos.length - clientesVisibles.length
  }
}

/* ============================================================
   REGISTRAR CLIENTE PARA MECÁNICO
============================================================ */

export const registrarClienteMecanico = async (
  datos,
  idMecanico
) => {
  if (
    idMecanico === null ||
    idMecanico === undefined ||
    idMecanico === ''
  ) {
    throw new Error(
      'No se pudo identificar al mecánico que registra el cliente.'
    )
  }

  const { data, error } = await supabase.functions.invoke(
    'crear-cliente-mecanico',
    {
      body: {
        ...datos,
        id_mecanico: Number(idMecanico)
      }
    }
  )

  if (error) {
    const response = error.context
    let responseBody = null

    if (response instanceof Response) {
      try {
        responseBody = await response.clone().json()
      } catch {
        responseBody = null
      }
    }

    if (
      responseBody?.code === 'NOT_FOUND' ||
      responseBody?.message === 'Requested function was not found'
    ) {
      throw new Error(
        'La función crear-cliente-mecanico no está desplegada en Supabase. Despliégala y vuelve a intentar.'
      )
    }

    throw new Error(
      responseBody?.error ||
      error.message ||
      'No fue posible conectar con el servicio de registro de clientes.'
    )
  }

  if (!data?.success) {
    throw new Error(
      data?.error || 'No fue posible registrar el cliente.'
    )
  }

  return data
}

/* ============================================================
   OBTENER CLIENTE POR ID
============================================================ */

export const obtenerClientePorId = async idCliente => {
  const {
    data: cliente,
    error: clienteError
  } = await supabase
    .from('cliente')
    .select(`
      id_cliente,
      id_usuario,
      direccion
    `)
    .eq('id_cliente', idCliente)
    .single()

  if (clienteError) {
    throw clienteError
  }

  const {
    data: usuario,
    error: usuarioError
  } = await supabase
    .from('usuario')
    .select(`
      id_usuario,
      id_rol,
      nombre,
      apellido_paterno,
      apellido_materno,
      correo,
      telefono,
      estatus,
      fecha_registro,
      auth_id
    `)
    .eq(
      'id_usuario',
      cliente.id_usuario
    )
    .single()

  if (usuarioError) {
    throw usuarioError
  }

  return {
    ...cliente,
    usuario
  }
}

/* ============================================================
   VERIFICAR CORREO
============================================================ */

export const existeCorreoCliente = async (
  correo,
  idUsuarioExcluir = null
) => {
  const correoLimpio =
    normalizarCorreo(correo)

  let query =
    supabase
      .from('usuario')
      .select(
        'id_usuario',
        {
          count: 'exact',
          head: true
        }
      )
      .ilike(
        'correo',
        correoLimpio
      )

  if (idUsuarioExcluir) {
    query =
      query.neq(
        'id_usuario',
        idUsuarioExcluir
      )
  }

  const {
    count,
    error
  } = await query

  if (error) {
    throw error
  }

  return Number(count || 0) > 0
}

/* ============================================================
   REGISTRAR CLIENTE
============================================================ */

export const registrarCliente = async datos => {
  const nombre =
    limpiarTexto(datos.nombre)

  const apellidoPaterno =
    limpiarTexto(
      datos.apellido_paterno
    )

  const apellidoMaterno =
    limpiarTexto(
      datos.apellido_materno
    )

  const correo =
    normalizarCorreo(datos.correo)

  const contrasenia =
    String(datos.contrasenia || '')

  const telefono =
    limpiarTexto(datos.telefono)

  const direccion =
    limpiarTexto(datos.direccion)

  const estatus =
    limpiarTexto(datos.estatus) ||
    'Activo'

  if (!nombre) {
    throw new Error(
      'El nombre es obligatorio.'
    )
  }

  if (!apellidoPaterno) {
    throw new Error(
      'El apellido paterno es obligatorio.'
    )
  }

  if (!correo) {
    throw new Error(
      'El correo electrónico es obligatorio.'
    )
  }

  if (!contrasenia) {
    throw new Error(
      'La contraseña es obligatoria.'
    )
  }

  if (contrasenia.length < 6) {
    throw new Error(
      'La contraseña debe contener al menos 6 caracteres.'
    )
  }

  const correoExiste =
    await existeCorreoCliente(correo)

  if (correoExiste) {
    throw new Error(
      'El correo electrónico ya está registrado.'
    )
  }

  const {
    data,
    error
  } =
    await supabase
      .functions
      .invoke(
        'crear-usuario-administrativo',
        {
          body: {
            tipo: 'cliente',
            nombre,
            apellido_paterno:
              apellidoPaterno,
            apellido_materno:
              apellidoMaterno,
            correo,
            contrasenia,
            telefono,
            direccion
          }
        }
      )

  if (error) {
    throw error
  }

  const {
    data: usuarioCreado,
    error: usuarioError
  } = await supabase
    .from('usuario')
    .select(`
      id_usuario,
      correo
    `)
    .ilike('correo', correo)
    .maybeSingle()

  if (usuarioError) {
    console.warn(
      'Cliente creado, pero no fue posible localizar el usuario:',
      usuarioError
    )
  }

  if (usuarioCreado?.id_usuario) {
    const {
      error: statusError
    } = await supabase
      .from('usuario')
      .update({
        estatus
      })
      .eq(
        'id_usuario',
        usuarioCreado.id_usuario
      )

    if (statusError) {
      console.warn(
        'No fue posible actualizar el estatus inicial:',
        statusError
      )
    }
  }

  return data
}

/* ============================================================
   ACTUALIZAR CLIENTE
============================================================ */

export const actualizarCliente = async (
  idCliente,
  datos,
  { mechanicMode = false } = {}
) => {
  const clienteActual =
    await obtenerClientePorId(
      idCliente
    )

  if (!clienteActual?.usuario) {
    throw new Error(
      'No se encontró el usuario relacionado con el cliente.'
    )
  }

  const idUsuario =
    clienteActual.usuario.id_usuario

  const nombre =
    limpiarTexto(datos.nombre)

  const apellidoPaterno =
    limpiarTexto(
      datos.apellido_paterno
    )

  const apellidoMaterno =
    limpiarTexto(
      datos.apellido_materno
    )

  const correo =
    normalizarCorreo(datos.correo)

  const telefono =
    limpiarTexto(datos.telefono)

  const direccion =
    limpiarTexto(datos.direccion)

  const estatus =
    limpiarTexto(datos.estatus) ||
    'Activo'

  if (!nombre) {
    throw new Error(
      'El nombre es obligatorio.'
    )
  }

  if (!apellidoPaterno) {
    throw new Error(
      'El apellido paterno es obligatorio.'
    )
  }

  if (!correo) {
    throw new Error(
      'El correo electrónico es obligatorio.'
    )
  }

  if (
    estatus !== 'Activo' &&
    estatus !== 'Inactivo'
  ) {
    throw new Error(
      'El estado del cliente no es válido.'
    )
  }

  const correoExiste =
    await existeCorreoCliente(
      correo,
      idUsuario
    )

  if (correoExiste) {
    throw new Error(
      'El correo electrónico ya pertenece a otro usuario.'
    )
  }

  if (mechanicMode) {
    return gestionarClienteMecanico({
      action: 'update',
      id_cliente: Number(idCliente),
      nombre,
      apellido_paterno: apellidoPaterno,
      apellido_materno: apellidoMaterno || null,
      correo,
      telefono: telefono || null,
      direccion: direccion || null,
      estatus
    })
  }

  const {
    data,
    error
  } =
    await supabase
      .functions
      .invoke(
        'actualizar-usuario-administrativo',
        {
          body: {
            id_cliente:
              Number(idCliente),

            nombre,

            apellido_paterno:
              apellidoPaterno,

            apellido_materno:
              apellidoMaterno || null,

            correo,

            telefono:
              telefono || null,

            direccion:
              direccion || null,

            estatus
          }
        }
      )

  if (error) {
    console.error(
      'Error actualizando cliente:',
      error
    )

    throw error
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
      'No fue posible actualizar el cliente.'
    )
  }

  return data
}

/* ============================================================
   CAMBIAR ESTADO
============================================================ */

export const cambiarEstadoCliente = async (
  idCliente,
  nuevoEstado,
  { mechanicMode = false } = {}
) => {
  if (mechanicMode) {
    return gestionarClienteMecanico({
      action: 'update-status',
      id_cliente: Number(idCliente),
      estatus: nuevoEstado
    })
  }

  const cliente =
    await obtenerClientePorId(
      idCliente
    )

  if (!cliente?.usuario) {
    throw new Error(
      'No se encontró el usuario relacionado.'
    )
  }

  const { error } =
    await supabase
      .from('usuario')
      .update({
        estatus: nuevoEstado
      })
      .eq(
        'id_usuario',
        cliente.usuario.id_usuario
      )

  if (error) {
    throw error
  }

  return true
}

/* ============================================================
   DEPENDENCIAS DEL CLIENTE
============================================================ */

export const obtenerDependenciasCliente = async idCliente => {
  const [
    vehiculosResult,
    citasResult
  ] = await Promise.all([
    supabase
      .from('vehiculo')
      .select(
        'id_vehiculo',
        {
          count: 'exact',
          head: true
        }
      )
      .eq(
        'id_cliente',
        idCliente
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
        'id_cliente',
        idCliente
      )
  ])

  if (vehiculosResult.error) {
    throw vehiculosResult.error
  }

  if (citasResult.error) {
    console.warn(
      'No fue posible consultar las citas del cliente:',
      citasResult.error
    )
  }

  return {
    vehiculos:
      Number(
        vehiculosResult.count || 0
      ),

    citas:
      Number(
        citasResult.count || 0
      )
  }
}

/* ============================================================
   ELIMINAR CLIENTE
============================================================ */

export const eliminarCliente = async (
  idCliente,
  { mechanicMode = false } = {}
) => {
  if (mechanicMode) {
    return gestionarClienteMecanico({
      action: 'delete',
      id_cliente: Number(idCliente)
    })
  }

  const cliente =
    await obtenerClientePorId(
      idCliente
    )

  if (!cliente) {
    throw new Error(
      'No se encontró el cliente.'
    )
  }

  const dependencias =
    await obtenerDependenciasCliente(
      idCliente
    )

  const totalDependencias =
    dependencias.vehiculos +
    dependencias.citas

  if (totalDependencias > 0) {
    throw new Error(
      `No se puede eliminar este cliente porque tiene información relacionada. ` +
      `Vehículos: ${dependencias.vehiculos}, ` +
      `citas: ${dependencias.citas}. ` +
      `Puedes cambiar su estado a Inactivo.`
    )
  }

  const idUsuario =
    cliente.id_usuario

  const {
    error: clienteError
  } = await supabase
    .from('cliente')
    .delete()
    .eq(
      'id_cliente',
      idCliente
    )

  if (clienteError) {
    throw clienteError
  }

  if (idUsuario) {
    const {
      error: usuarioError
    } = await supabase
      .from('usuario')
      .delete()
      .eq(
        'id_usuario',
        idUsuario
      )

    if (usuarioError) {
      throw usuarioError
    }
  }

  return true
}

const gestionarClienteMecanico = async body => {
  const { data, error } = await supabase.functions.invoke(
    'gestionar-cliente-mecanico',
    { body }
  )

  if (error) {
    const response = error.context
    let responseBody = null

    if (response instanceof Response) {
      try {
        responseBody = await response.clone().json()
      } catch {
        responseBody = null
      }
    }

    throw new Error(
      responseBody?.error ||
      error.message ||
      'No fue posible completar la operación del cliente.'
    )
  }

  if (!data?.success) {
    throw new Error(data?.error || 'No fue posible actualizar el cliente.')
  }

  return data
}

/* ============================================================
   OBTENER VEHÍCULOS DEL CLIENTE

   PUNTO 2:
   - Mantenimiento preventivo visible al cliente.

   PUNTO 4:
   - Última inspección de llantas visible al cliente.
============================================================ */

export const obtenerVehiculosCliente = async idCliente => {
  const {
    data: vehiculos,
    error: vehiculosError
  } = await supabase
    .from('vehiculo')
    .select(`
      id_vehiculo,
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
      'id_cliente',
      idCliente
    )
    .order(
      'id_vehiculo',
      {
        ascending: false
      }
    )

  if (vehiculosError) {
    throw vehiculosError
  }

  if (!vehiculos?.length) {
    return []
  }

  const vehiculosIds =
    vehiculos
      .map(
        vehiculo =>
          vehiculo.id_vehiculo
      )
      .filter(Boolean)

  if (!vehiculosIds.length) {
    return vehiculos.map(
      vehiculo => ({
        ...vehiculo,

        configuracion_mantenimiento:
          null,

        inspeccion_llantas:
          null
      })
    )
  }

  /* ==========================================================
     PUNTO 2
     CONFIGURACIÓN DE MANTENIMIENTO
  ========================================================== */

  const {
    data: configuraciones,
    error: configuracionesError
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
    .in(
      'id_vehiculo',
      vehiculosIds
    )
    .order(
      'id_configuracion',
      {
        ascending: false
      }
    )

  if (configuracionesError) {
    throw configuracionesError
  }

  const configuracionesMap =
    new Map()

  for (
    const configuracion of
    configuraciones || []
  ) {
    const key =
      String(
        configuracion.id_vehiculo
      )

    if (!configuracionesMap.has(key)) {
      configuracionesMap.set(
        key,
        configuracion
      )
    }
  }

  /* ==========================================================
     PUNTO 4
     OBTENER SERVICIOS DE LOS VEHÍCULOS DEL CLIENTE
  ========================================================== */

  const {
    data: serviciosLlantas,
    error: serviciosLlantasError
  } = await supabase
    .from('servicio')
    .select(`
      id_servicio,
      id_vehiculo,
      fecha_servicio,
      kilometraje
    `)
    .in(
      'id_vehiculo',
      vehiculosIds
    )
    .order(
      'fecha_servicio',
      {
        ascending: false
      }
    )
    .order(
      'id_servicio',
      {
        ascending: false
      }
    )

  if (serviciosLlantasError) {
    throw serviciosLlantasError
  }

  const serviciosIds =
    (serviciosLlantas || [])
      .map(
        servicio =>
          servicio.id_servicio
      )
      .filter(Boolean)

  let detallesLlantas = []
  let tiposLlantas = []

  if (serviciosIds.length) {
    const [
      detallesResult,
      tiposResult
    ] = await Promise.all([
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
          serviciosIds
        )
        .order(
          'id_detalle',
          {
            ascending: true
          }
        ),

      supabase
        .from('tipo_llanta')
        .select(`
          id_tipo,
          posicion,
          tipo_unidad,
          numero_llanta
        `)
        .order(
          'id_tipo',
          {
            ascending: true
          }
        )
    ])

    if (detallesResult.error) {
      throw detallesResult.error
    }

    if (tiposResult.error) {
      throw tiposResult.error
    }

    detallesLlantas =
      detallesResult.data || []

    tiposLlantas =
      tiposResult.data || []
  }

  const tiposLlantasMap =
    new Map(
      tiposLlantas.map(
        tipo => [
          String(tipo.id_tipo),
          tipo
        ]
      )
    )

  const detallesPorServicio =
    new Map()

  for (
    const detalle of
    detallesLlantas
  ) {
    const key =
      String(
        detalle.id_servicio
      )

    if (!detallesPorServicio.has(key)) {
      detallesPorServicio.set(
        key,
        []
      )
    }

    const tipo =
      tiposLlantasMap.get(
        String(
          detalle.id_llanta
        )
      ) || null

    detallesPorServicio
      .get(key)
      .push({
        ...detalle,

        posicion:
          tipo?.posicion ||
          'Posición no especificada',

        numero_llanta:
          tipo?.numero_llanta ??
          null,

        tipo_unidad:
          tipo?.tipo_unidad ||
          null,

        tipo_llanta:
          tipo
      })
  }

  const inspeccionPorVehiculo =
    new Map()

  for (
    const servicio of
    serviciosLlantas || []
  ) {
    const detalles =
      detallesPorServicio.get(
        String(
          servicio.id_servicio
        )
      ) || []

    if (!detalles.length) {
      continue
    }

    const vehicleKey =
      String(
        servicio.id_vehiculo
      )

    if (
      !inspeccionPorVehiculo.has(
        vehicleKey
      )
    ) {
      inspeccionPorVehiculo.set(
        vehicleKey,
        {
          id_servicio:
            servicio.id_servicio,

          fecha_servicio:
            servicio.fecha_servicio,

          kilometraje:
            servicio.kilometraje,

          llantas:
            detalles
        }
      )
    }
  }

  return vehiculos.map(
    vehiculo => ({
      ...vehiculo,

      configuracion_mantenimiento:
        configuracionesMap.get(
          String(
            vehiculo.id_vehiculo
          )
        ) || null,

      inspeccion_llantas:
        inspeccionPorVehiculo.get(
          String(
            vehiculo.id_vehiculo
          )
        ) || null
    })
  )
}

/* ============================================================
   OBTENER ÚLTIMA INSPECCIÓN DE LLANTAS DEL CLIENTE

   PUNTO 4:
   - Compatible con ClientDashboard.vue.
   - Conserva la lógica existente de obtenerVehiculosCliente.
============================================================ */

export const obtenerUltimaInspeccionLlantasCliente =
  async idVehiculo => {
    const idVehiculoNumerico =
      Number(idVehiculo)

    if (
      !Number.isInteger(
        idVehiculoNumerico
      ) ||
      idVehiculoNumerico <= 0
    ) {
      throw new Error(
        'No fue posible identificar el vehículo.'
      )
    }

    const {
      data: vehiculo,
      error: vehiculoError
    } = await supabase
      .from('vehiculo')
      .select(`
        id_vehiculo,
        id_cliente
      `)
      .eq(
        'id_vehiculo',
        idVehiculoNumerico
      )
      .maybeSingle()

    if (vehiculoError) {
      throw vehiculoError
    }

    if (!vehiculo) {
      return null
    }

    const vehiculos =
      await obtenerVehiculosCliente(
        vehiculo.id_cliente
      )

    const vehiculoEncontrado =
      vehiculos.find(
        item =>
          Number(item.id_vehiculo) ===
          idVehiculoNumerico
      )

    return (
      vehiculoEncontrado
        ?.inspeccion_llantas ||
      null
    )
  }

/* ============================================================
   TRANSMISIÓN DEL CLIENTE
============================================================ */

/* ============================================================
   OBTENER REGISTROS DE TRANSMISIÓN DEL CLIENTE
============================================================ */

export const obtenerRegistrosTransmisionCliente =
  async idCliente => {
    const idClienteNumerico =
      Number(idCliente)

    if (
      !Number.isInteger(
        idClienteNumerico
      ) ||
      idClienteNumerico <= 0
    ) {
      throw new Error(
        'No fue posible identificar al cliente.'
      )
    }

    const {
      data,
      error
    } = await supabase
      .from(
        'registro_transmision_cliente'
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
      .eq(
        'id_cliente',
        idClienteNumerico
      )
      .order(
        'fecha_registro',
        {
          ascending: false
        }
      )
      .order(
        'id_registro',
        {
          ascending: false
        }
      )

    if (error) {
      throw error
    }

    return data || []
  }

/* ============================================================
   REGISTRAR INFORMACIÓN DE TRANSMISIÓN
============================================================ */

export const registrarTransmisionCliente =
  async datos => {
    const idCliente =
      Number(
        datos?.id_cliente
      )

    const idVehiculo =
      Number(
        datos?.id_vehiculo
      )

    const fechaObservacion =
      limpiarTexto(
        datos?.fecha_observacion
      )

    const descripcion =
      limpiarTexto(
        datos?.descripcion
      )

    const atencionExterna =
      Boolean(
        datos?.atencion_externa
      )

    const detalleAtencionExterna =
      limpiarTexto(
        datos?.detalle_atencion_externa
      )

    const sintomas =
      Array.isArray(
        datos?.sintomas
      )
        ? [
            ...new Set(
              datos.sintomas
                .map(
                  sintoma =>
                    limpiarTexto(
                      sintoma
                    )
                )
                .filter(Boolean)
            )
          ]
        : []

    if (
      !Number.isInteger(
        idCliente
      ) ||
      idCliente <= 0
    ) {
      throw new Error(
        'No fue posible identificar al cliente.'
      )
    }

    if (
      !Number.isInteger(
        idVehiculo
      ) ||
      idVehiculo <= 0
    ) {
      throw new Error(
        'Selecciona un vehículo válido.'
      )
    }

    if (!fechaObservacion) {
      throw new Error(
        'Selecciona la fecha de la observación.'
      )
    }

    if (sintomas.length === 0) {
      throw new Error(
        'Selecciona al menos un síntoma o comportamiento observado.'
      )
    }

    if (!descripcion) {
      throw new Error(
        'Describe el comportamiento que presenta la transmisión.'
      )
    }

    if (descripcion.length < 10) {
      throw new Error(
        'Describe con un poco más de detalle lo que presenta el vehículo.'
      )
    }

    if (descripcion.length > 1500) {
      throw new Error(
        'La descripción no puede superar los 1500 caracteres.'
      )
    }

    if (
      atencionExterna &&
      !detalleAtencionExterna
    ) {
      throw new Error(
        'Indica qué atención recibió el vehículo fuera de Automecanic.'
      )
    }

    if (
      detalleAtencionExterna.length >
      1500
    ) {
      throw new Error(
        'El detalle de la atención externa no puede superar los 1500 caracteres.'
      )
    }

    const {
      data: vehiculo,
      error: vehiculoError
    } = await supabase
      .from('vehiculo')
      .select(`
        id_vehiculo,
        id_cliente,
        placas,
        marca,
        modelo,
        estatus
      `)
      .eq(
        'id_vehiculo',
        idVehiculo
      )
      .eq(
        'id_cliente',
        idCliente
      )
      .maybeSingle()

    if (vehiculoError) {
      throw vehiculoError
    }

    if (!vehiculo) {
      throw new Error(
        'El vehículo seleccionado no pertenece a tu cuenta.'
      )
    }

    const registro = {
      id_cliente:
        idCliente,

      id_vehiculo:
        idVehiculo,

      fecha_observacion:
        fechaObservacion,

      sintomas,

      descripcion,

      atencion_externa:
        atencionExterna,

      detalle_atencion_externa:
        atencionExterna
          ? detalleAtencionExterna
          : 'NO APLICA'
    }

    const {
      data,
      error
    } = await supabase
      .from(
        'registro_transmision_cliente'
      )
      .insert(
        registro
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
      .single()

    if (error) {
      throw error
    }

    return data
  }