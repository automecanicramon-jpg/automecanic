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

const obtenerMensajeErrorFuncion = async error => {
  const response = error?.context

  if (!response || typeof response.clone !== 'function') {
    return ''
  }

  try {
    const body = await response.clone().json()
    return limpiarTexto(body?.error || body?.message)
  } catch (parseError) {
    console.warn(
      'No fue posible leer la respuesta de crear-usuario-administrativo:',
      parseError
    )
    return ''
  }
}


/* ============================================================
   OBTENER PERSONAL
============================================================ */

export const obtenerPersonal = async () => {
  const {
    data: mecanicos,
    error: mecanicosError
  } = await supabase
    .from('mecanico')
    .select(`
      id_mecanico,
      id_usuario,
      especialidad
    `)
    .order('id_mecanico', {
      ascending: false
    })

  if (mecanicosError) {
    throw mecanicosError
  }

  if (!mecanicos?.length) {
    return []
  }

  const usuariosIds = mecanicos
    .map(item => item.id_usuario)
    .filter(Boolean)

  if (!usuariosIds.length) {
    return mecanicos.map(mecanico => ({
      ...mecanico,

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
    .in(
      'id_usuario',
      usuariosIds
    )

  if (usuariosError) {
    throw usuariosError
  }

  const usuariosMap = new Map(
    (usuarios || []).map(usuario => [
      usuario.id_usuario,
      usuario
    ])
  )

  return mecanicos.map(mecanico => ({
    ...mecanico,

    usuario:
      usuariosMap.get(
        mecanico.id_usuario
      ) || null
  }))
}


/* ============================================================
   OBTENER UN MECÁNICO
============================================================ */

export const obtenerPersonalPorId = async idMecanico => {
  const {
    data: mecanico,
    error: mecanicoError
  } = await supabase
    .from('mecanico')
    .select(`
      id_mecanico,
      id_usuario,
      especialidad
    `)
    .eq(
      'id_mecanico',
      idMecanico
    )
    .single()

  if (mecanicoError) {
    throw mecanicoError
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
      mecanico.id_usuario
    )
    .single()

  if (usuarioError) {
    throw usuarioError
  }

  return {
    ...mecanico,
    usuario
  }
}


/* ============================================================
   OBTENER MECÁNICOS PARA HISTORIAL
============================================================ */

export const obtenerMecanicosConHistorial = async ids => {
  const idsUnicos = [
    ...new Set(
      (ids || [])
        .filter(id => id !== null && id !== undefined)
        .map(String)
    )
  ]

  if (!idsUnicos.length) {
    return []
  }

  const [
    mecanicosResult,
    historialResult
  ] = await Promise.all([
    supabase
      .from('mecanico')
      .select(`
        id_mecanico,
        id_usuario,
        especialidad
      `)
      .in(
        'id_mecanico',
        idsUnicos
      ),

    supabase
      .from('mecanico_eliminado_historial')
      .select(`
        id_mecanico,
        nombre,
        apellido_paterno,
        apellido_materno,
        especialidad
      `)
      .in(
        'id_mecanico',
        idsUnicos
      )
  ])

  if (mecanicosResult.error) {
    throw mecanicosResult.error
  }

  if (historialResult.error) {
    throw historialResult.error
  }

  const mecanicos = mecanicosResult.data || []
  const mecanicosIds = new Set(
    mecanicos.map(mecanico => String(mecanico.id_mecanico))
  )

  const mecanicosEliminados =
    (historialResult.data || [])
      .filter(
        mecanico =>
          !mecanicosIds.has(String(mecanico.id_mecanico))
      )
      .map(mecanico => ({
        id_mecanico: mecanico.id_mecanico,
        id_usuario: null,
        especialidad: mecanico.especialidad,
        usuario: {
          nombre: mecanico.nombre,
          apellido_paterno: mecanico.apellido_paterno,
          apellido_materno: mecanico.apellido_materno,
          estatus: 'Eliminado'
        }
      }))

  return [
    ...mecanicos,
    ...mecanicosEliminados
  ]
}


/* ============================================================
   VERIFICAR CORREO
============================================================ */

export const existeCorreoPersonal = async (
  correo,
  idUsuarioExcluir = null
) => {
  const correoLimpio =
    normalizarCorreo(correo)

  let query = supabase
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
    query = query.neq(
      'id_usuario',
      idUsuarioExcluir
    )
  }

  const {
    count,
    error
  } = await query

  if (error) {
    const mensajeErrorFuncion =
      await obtenerMensajeErrorFuncion(error)

    if (mensajeErrorFuncion) {
      throw new Error(mensajeErrorFuncion)
    }

    throw error
  }

  return Number(count || 0) > 0
}


/* ============================================================
   REGISTRAR PERSONAL
============================================================ */

export const registrarPersonal = async datos => {
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
    String(
      datos.contrasenia || ''
    )

  const telefono =
    limpiarTexto(datos.telefono)

  const especialidad =
    limpiarTexto(
      datos.especialidad
    )

  const estatus =
    limpiarTexto(
      datos.estatus
    ) || 'Activo'


  /* ----------------------------------------------------------
     VALIDACIONES
  ---------------------------------------------------------- */

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

  if (!especialidad) {
    throw new Error(
      'La especialidad es obligatoria.'
    )
  }


  /* ----------------------------------------------------------
     EVITAR CORREO DUPLICADO
  ---------------------------------------------------------- */

  const correoExiste =
    await existeCorreoPersonal(
      correo
    )

  if (correoExiste) {
    throw new Error(
      'El correo electrónico ya está registrado.'
    )
  }


  /* ----------------------------------------------------------
     EDGE FUNCTION EXISTENTE
  ---------------------------------------------------------- */

  const {
    data,
    error
  } =
    await supabase.functions.invoke(
      'crear-usuario-administrativo',
      {
        body: {
          tipo: 'mecanico',

          nombre,

          apellido_paterno:
            apellidoPaterno,

          apellido_materno:
            apellidoMaterno,

          correo,

          contrasenia,

          telefono,

          especialidad
        }
      }
    )

  if (error) {
    throw error
  }


  /*
   * La Edge Function que ya utilizaba el proyecto
   * crea auth.users + usuario + mecanico.
   *
   * Después buscamos el usuario creado para asegurarnos
   * de colocar el estatus elegido en el formulario.
   */

  const {
    data: usuarioCreado,
    error: usuarioError
  } = await supabase
    .from('usuario')
    .select(`
      id_usuario,
      correo
    `)
    .ilike(
      'correo',
      correo
    )
    .maybeSingle()

  if (usuarioError) {
    console.warn(
      'El personal fue creado, pero no fue posible recuperar el usuario:',
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
   ACTUALIZAR PERSONAL
============================================================ */

export const actualizarPersonal = async (
  idMecanico,
  datos
) => {
  const personalActual =
    await obtenerPersonalPorId(
      idMecanico
    )

  if (!personalActual?.usuario) {
    throw new Error(
      'No se encontró el usuario relacionado con el mecánico.'
    )
  }

  const idUsuario =
    personalActual.usuario.id_usuario

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

  const especialidad =
    limpiarTexto(
      datos.especialidad
    )

  const estatus =
    limpiarTexto(
      datos.estatus
    ) || 'Activo'


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

  if (!especialidad) {
    throw new Error(
      'La especialidad es obligatoria.'
    )
  }


  const correoExiste =
    await existeCorreoPersonal(
      correo,
      idUsuario
    )

  if (correoExiste) {
    throw new Error(
      'El correo electrónico ya pertenece a otro usuario.'
    )
  }


  /* ----------------------------------------------------------
     ACTUALIZAR TABLA USUARIO
  ---------------------------------------------------------- */

  const {
    error: usuarioError
  } = await supabase
    .from('usuario')
    .update({
      nombre,

      apellido_paterno:
        apellidoPaterno,

      apellido_materno:
        apellidoMaterno || null,

      correo,

      telefono:
        telefono || null,

      estatus
    })
    .eq(
      'id_usuario',
      idUsuario
    )

  if (usuarioError) {
    throw usuarioError
  }


  /* ----------------------------------------------------------
     ACTUALIZAR TABLA MECANICO
  ---------------------------------------------------------- */

  const {
    error: mecanicoError
  } = await supabase
    .from('mecanico')
    .update({
      especialidad
    })
    .eq(
      'id_mecanico',
      idMecanico
    )

  if (mecanicoError) {
    throw mecanicoError
  }


  return true
}


/* ============================================================
   CAMBIAR ESTADO
============================================================ */

export const cambiarEstadoPersonal = async (
  idMecanico,
  nuevoEstado
) => {
  const personal =
    await obtenerPersonalPorId(
      idMecanico
    )

  if (!personal?.usuario) {
    throw new Error(
      'No se encontró el usuario relacionado.'
    )
  }

  const {
    error
  } = await supabase
    .from('usuario')
    .update({
      estatus: nuevoEstado
    })
    .eq(
      'id_usuario',
      personal.usuario.id_usuario
    )

  if (error) {
    throw error
  }

  return true
}


/* ============================================================
   VERIFICAR DEPENDENCIAS
============================================================ */

export const obtenerDependenciasPersonal = async idMecanico => {
  const [
    vehiculos,
    clientes,
    citasActivas
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
        'id_mecanico',
        idMecanico
      ),

    supabase
      .from('mecanico_cliente')
      .select(
        'id_cliente',
        {
          count: 'exact',
          head: true
        }
      )
      .eq(
        'id_mecanico',
        idMecanico
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
        'id_mecanico',
        idMecanico
      )
      .in(
        'estado',
        ['PROXIMA', 'EN_ATENCION']
      )
  ])

  if (vehiculos.error) {
    throw vehiculos.error
  }

  if (clientes.error) {
    throw clientes.error
  }

  if (citasActivas.error) {
    throw citasActivas.error
  }

  return {
    vehiculos:
      Number(
        vehiculos.count || 0
      ),

    clientes:
      Number(
        clientes.count || 0
      ),

    citasActivas:
      Number(
        citasActivas.count || 0
      )
  }
}


/* ============================================================
   ELIMINAR PERSONAL
============================================================ */

export const eliminarPersonal = async idMecanico => {
  const {
    data,
    error
  } = await supabase.functions.invoke(
    'eliminar-personal-administrativo',
    {
      body: {
        id_mecanico: String(idMecanico)
      }
    }
  )

  if (error) {
    const response = error.context

    if (response && typeof response.clone === 'function') {
      let body = null

      try {
        body = await response.clone().json()
      } catch {
        body = null
      }

      const message =
        limpiarTexto(body?.error || body?.message)

      if (message) {
        throw new Error(message)
      }
    }

    throw error
  }

  if (data?.success !== true) {
    throw new Error(
      'La base de datos no confirmó la eliminación del mecánico.'
    )
  }

  return true
}