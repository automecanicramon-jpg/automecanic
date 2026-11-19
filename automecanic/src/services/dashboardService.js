import { supabase } from './supabase.js'

export const obtenerResumenDashboard = async () => {
  const [
    personalResult,
    clientesResult,
    vehiculosResult,
    serviciosResult,
    alertasResult
  ] = await Promise.all([
    supabase
      .from('mecanico')
      .select(
        `
        id_mecanico,
        especialidad,
        usuario:id_usuario (
          id_usuario,
          nombre,
          apellido_paterno,
          apellido_materno,
          estatus
        )
        `
      ),

    supabase
      .from('cliente')
      .select(
        `
        id_cliente,
        direccion,
        usuario:id_usuario (
          id_usuario,
          nombre,
          apellido_paterno,
          apellido_materno,
          estatus
        )
        `
      ),

    supabase
      .from('vehiculo')
      .select(
        `
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
        `
      )
      .order(
        'id_vehiculo',
        {
          ascending: false
        }
      ),

    supabase
      .from('servicio')
      .select(
        `
        id_servicio,
        id_vehiculo,
        id_mecanico,
        fecha_servicio,
        kilometraje,
        observaciones_generales
        `
      )
      .order(
        'fecha_servicio',
        {
          ascending: false
        }
      ),

    supabase
      .from('alerta')
      .select(
        `
        id_alerta,
        estado
        `
      )
  ])

  const errors = [
    personalResult.error,
    clientesResult.error,
    vehiculosResult.error,
    serviciosResult.error,
    alertasResult.error
  ].filter(Boolean)

  if (errors.length) {
    throw errors[0]
  }

  return {
    personal:
      personalResult.data || [],

    clientes:
      clientesResult.data || [],

    vehiculos:
      vehiculosResult.data || [],

    servicios:
      serviciosResult.data || [],

    alertas:
      alertasResult.data || []
  }
}