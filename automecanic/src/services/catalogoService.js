import { supabase } from './supabase.js'


/* ============================================================
   UTILIDADES
============================================================ */

const limpiarTexto = value => {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  return String(value).trim()
}


/* ============================================================
   TIPOS DE ACEITE
============================================================ */

export const obtenerTiposAceite = async () => {
  const {
    data,
    error
  } = await supabase
    .from('tipo_aceite')
    .select(`
      id_tipo_aceite,
      nombre
    `)
    .order(
      'id_tipo_aceite',
      {
        ascending: true
      }
    )

  if (error) {
    throw error
  }

  return data || []
}


export const agregarTipoAceite = async nombre => {
  const nombreLimpio =
    limpiarTexto(nombre)


  if (!nombreLimpio) {
    throw new Error(
      'Ingresa el nombre del tipo de aceite.'
    )
  }


  const {
    data: existente,
    error: consultaError
  } = await supabase
    .from('tipo_aceite')
    .select(`
      id_tipo_aceite,
      nombre
    `)
    .ilike(
      'nombre',
      nombreLimpio
    )
    .maybeSingle()


  if (consultaError) {
    throw consultaError
  }


  if (existente) {
    throw new Error(
      'Ese tipo de aceite ya está registrado.'
    )
  }


  const {
    data,
    error
  } = await supabase
    .from('tipo_aceite')
    .insert({
      nombre:
        nombreLimpio
    })
    .select()
    .single()


  if (error) {
    throw error
  }


  return data
}


export const eliminarTipoAceite = async idTipoAceite => {
  const {
    count,
    error: dependenciasError
  } = await supabase
    .from('servicio_motor')
    .select(
      'id_servicio',
      {
        count: 'exact',
        head: true
      }
    )
    .eq(
      'id_tipo_aceite',
      idTipoAceite
    )


  if (dependenciasError) {
    throw dependenciasError
  }


  if (
    Number(
      count || 0
    ) > 0
  ) {
    throw new Error(
      'No se puede eliminar este tipo de aceite porque ya está relacionado con servicios registrados.'
    )
  }


  const {
    error
  } = await supabase
    .from('tipo_aceite')
    .delete()
    .eq(
      'id_tipo_aceite',
      idTipoAceite
    )


  if (error) {
    throw error
  }


  return true
}


/* ============================================================
   MARCAS DE ACEITE
============================================================ */

export const obtenerMarcasAceite = async () => {
  const {
    data,
    error
  } = await supabase
    .from('marca_aceite')
    .select(`
      id_marca_aceite,
      nombre
    `)
    .order(
      'id_marca_aceite',
      {
        ascending: true
      }
    )


  if (error) {
    throw error
  }


  return data || []
}


export const agregarMarcaAceite = async nombre => {
  const nombreLimpio =
    limpiarTexto(nombre)


  if (!nombreLimpio) {
    throw new Error(
      'Ingresa el nombre de la marca de aceite.'
    )
  }


  const {
    data: existente,
    error: consultaError
  } = await supabase
    .from('marca_aceite')
    .select(`
      id_marca_aceite,
      nombre
    `)
    .ilike(
      'nombre',
      nombreLimpio
    )
    .maybeSingle()


  if (consultaError) {
    throw consultaError
  }


  if (existente) {
    throw new Error(
      'Esa marca de aceite ya está registrada.'
    )
  }


  const {
    data,
    error
  } = await supabase
    .from('marca_aceite')
    .insert({
      nombre:
        nombreLimpio
    })
    .select()
    .single()


  if (error) {
    throw error
  }


  return data
}


export const eliminarMarcaAceite = async idMarcaAceite => {
  /*
   * Actualmente marca_aceite es un catálogo independiente.
   * servicio_motor no tiene id_marca_aceite en tu esquema.
   */

  const {
    error
  } = await supabase
    .from('marca_aceite')
    .delete()
    .eq(
      'id_marca_aceite',
      idMarcaAceite
    )


  if (error) {
    throw error
  }


  return true
}


/* ============================================================
   POSICIONES DE LLANTA
============================================================ */

export const obtenerPosicionesLlantaCatalogo = async tipoUnidad => {
  let query =
    supabase
      .from('tipo_llanta')
      .select(`
        id_tipo,
        posicion,
        tipo_unidad,
        numero_llanta
      `)


  if (tipoUnidad) {
    query =
      query.ilike(
        'tipo_unidad',
        tipoUnidad
      )
  }


  const {
    data,
    error
  } = await query
    .order(
      'numero_llanta',
      {
        ascending: true
      }
    )
    .order(
      'id_tipo',
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
   OBTENER SIGUIENTE NÚMERO
============================================================ */

export const obtenerSiguienteNumeroLlanta = async tipoUnidad => {
  if (!tipoUnidad) {
    return 1
  }

  const posiciones =
    await obtenerPosicionesLlantaCatalogo(
      tipoUnidad
    )

  if (!posiciones.length) {
    return 1
  }

  const numerosOcupados =
    new Set(
      posiciones
        .map(
          item =>
            Number(
              item.numero_llanta
            )
        )
        .filter(
          numero =>
            Number.isInteger(numero) &&
            numero > 0
        )
    )

  let siguienteNumero = 1

  while (
    numerosOcupados.has(
      siguienteNumero
    )
  ) {
    siguienteNumero++
  }

  return siguienteNumero
}

/* ============================================================
   INSERTAR POSICIÓN
============================================================ */

export const agregarPosicionLlanta = async datos => {
  const tipoUnidad =
    limpiarTexto(
      datos.tipo_unidad
    )

  const posicion =
    limpiarTexto(
      datos.posicion
    )

  const numeroLlanta =
    Number(
      datos.numero_llanta
    )


  if (!tipoUnidad) {
    throw new Error(
      'Selecciona un tipo de vehículo.'
    )
  }


  if (!posicion) {
    throw new Error(
      'Ingresa la posición de la llanta.'
    )
  }


  if (
    !Number.isInteger(
      numeroLlanta
    ) ||
    numeroLlanta <= 0
  ) {
    throw new Error(
      'El número de llanta debe ser mayor a cero.'
    )
  }


  const {
    data: existentePosicion,
    error: posicionError
  } = await supabase
    .from('tipo_llanta')
    .select(`
      id_tipo
    `)
    .ilike(
      'tipo_unidad',
      tipoUnidad
    )
    .ilike(
      'posicion',
      posicion
    )
    .maybeSingle()


  if (posicionError) {
    throw posicionError
  }


  if (existentePosicion) {
    throw new Error(
      `La posición "${posicion}" ya está registrada para ${tipoUnidad}.`
    )
  }


  const {
    data: existenteNumero,
    error: numeroError
  } = await supabase
    .from('tipo_llanta')
    .select(`
      id_tipo
    `)
    .ilike(
      'tipo_unidad',
      tipoUnidad
    )
    .eq(
      'numero_llanta',
      numeroLlanta
    )
    .maybeSingle()


  if (numeroError) {
    throw numeroError
  }


  if (existenteNumero) {
    throw new Error(
      `La llanta número ${numeroLlanta} ya existe para ${tipoUnidad}.`
    )
  }


  const {
    data,
    error
  } = await supabase
    .from('tipo_llanta')
    .insert({
      tipo_unidad:
        tipoUnidad,

      posicion,

      numero_llanta:
        numeroLlanta
    })
    .select()
    .single()


  if (error) {
    throw error
  }


  return data
}


/* ============================================================
   ELIMINAR POSICIÓN
============================================================ */

export const eliminarPosicionLlanta = async idTipo => {
  const {
    count,
    error: dependenciasError
  } = await supabase
    .from('detalle_llanta')
    .select(
      'id_detalle',
      {
        count: 'exact',
        head: true
      }
    )
    .eq(
      'id_llanta',
      idTipo
    )


  if (dependenciasError) {
    throw dependenciasError
  }


  if (
    Number(
      count || 0
    ) > 0
  ) {
    throw new Error(
      'No se puede eliminar esta posición porque ya tiene inspecciones de llantas relacionadas.'
    )
  }


  const {
    error
  } = await supabase
    .from('tipo_llanta')
    .delete()
    .eq(
      'id_tipo',
      idTipo
    )


  if (error) {
    throw error
  }


  return true
}