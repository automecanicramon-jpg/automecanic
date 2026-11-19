<template>
  <div class="mechanic-alerts">
    <div class="mechanic-alert-actions">
      <div v-if="errorMessage" class="mechanic-alert-message is-error" role="alert">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <span>{{ errorMessage }}</span>
      </div>
      <div v-else-if="successMessage" class="mechanic-alert-message is-success" role="status">
        <i class="bi bi-check-circle-fill"></i>
        <span>{{ successMessage }}</span>
      </div>

      <button class="mechanic-alert-refresh" type="button" :disabled="loading" @click="loadData">
        <i class="bi" :class="loading ? 'bi-arrow-repeat mechanic-spin' : 'bi-arrow-clockwise'"></i>
        Actualizar
      </button>
    </div>

    <section class="mechanic-alert-stats">
      <article v-for="stat in summaryStats" :key="stat.label" class="mechanic-stat-card">
        <div class="mechanic-stat-icon"><i :class="stat.icon"></i></div>
        <div>
          <span>{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
        </div>
      </article>
    </section>

    <section v-if="unreadAlerts.length" class="mechanic-pending-alerts">
      <div class="mechanic-pending-heading">
        <div>
          <i class="bi bi-bell-fill"></i>
          <div>
            <strong>Alertas pendientes</strong>
            <span>{{ unreadAlerts.length }} sin leer</span>
          </div>
        </div>
        <button type="button" @click="showPendingAlerts = !showPendingAlerts">
          {{ showPendingAlerts ? 'Ocultar' : 'Mostrar' }}
          <i class="bi" :class="showPendingAlerts ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
        </button>
      </div>

      <div v-if="showPendingAlerts" class="mechanic-pending-list">
        <article v-for="alert in unreadAlerts" :key="alert.id_alerta" class="mechanic-pending-card">
          <span class="mechanic-pending-icon"><i :class="getAlertIcon(alert)"></i></span>
          <div class="mechanic-pending-copy">
            <div>
              <strong>{{ getAlertTitle(alert) }}</strong>
              <time>{{ formatDate(alert.fecha_programada) }}</time>
            </div>
            <p>{{ alert.mensaje || 'Sin descripción' }}</p>
          </div>
          <button
            class="mechanic-pending-read"
            type="button"
            :aria-label="`Marcar como leída: ${getAlertTitle(alert)}`"
            :disabled="processingAlertId === alert.id_alerta"
            @click="markAlertRead(alert)"
          >
            <i class="bi" :class="processingAlertId === alert.id_alerta ? 'bi-arrow-repeat mechanic-spin' : 'bi-check2'"></i>
          </button>
        </article>
      </div>
    </section>

    <div class="mechanic-alert-tabs" role="tablist" aria-label="Secciones de alertas">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'observaciones'"
        :class="{ active: activeTab === 'observaciones' }"
        @click="activeTab = 'observaciones'"
      >
        <i class="bi bi-chat-left-text"></i>
        Observaciones de clientes
        <span>{{ observations.length }}</span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'citas'"
        :class="{ active: activeTab === 'citas' }"
        @click="activeTab = 'citas'"
      >
        <i class="bi bi-calendar2-week"></i>
        Citas
        <span>{{ appointments.length }}</span>
      </button>
    </div>

    <section v-if="activeTab === 'observaciones'" class="mechanic-panel mechanic-alert-content-panel">
      <div class="mechanic-panel-heading">
        <div>
          <h3>Observaciones de mis clientes</h3>
          <p>Solicitudes de cita y reportes registrados por los clientes relacionados con tus vehículos.</p>
        </div>
        <span class="mechanic-count-pill">{{ observations.length }} registros</span>
      </div>

      <div v-if="appointmentRequests.length" class="mechanic-client-requests">
        <article v-for="appointment in appointmentRequests" :key="appointment.id_cita" class="mechanic-client-request">
          <span class="mechanic-pending-icon"><i class="bi bi-calendar-plus"></i></span>
          <div>
            <strong>{{ getClientName(appointment.cliente) }} solicitó una nueva cita</strong>
            <p>
              {{ formatDate(appointment.fecha) }} · {{ formatTime(appointment.hora) }}
              · {{ getVehicleName(appointment.vehiculo) }}
              · {{ appointment.motivo || 'Sin motivo especificado' }}
            </p>
          </div>
          <span class="mechanic-alert-status is-proxima">Próxima</span>
        </article>
      </div>

      <div class="mechanic-observation-filters">
        <label class="mechanic-observation-search">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input
            v-model="observationSearch"
            type="search"
            aria-label="Buscar observaciones"
            placeholder="Buscar cliente, vehículo, placas, síntoma o descripción..."
          />
        </label>
        <select v-model="observationStatus" aria-label="Filtrar observaciones por estado">
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="REVISADO">Revisadas</option>
          <option value="ATENDIDO">Atendidas</option>
        </select>
        <input
          v-model="observationDate"
          type="date"
          aria-label="Filtrar observaciones por fecha"
        />
      </div>

      <div v-if="loading && !observations.length" class="mechanic-alert-empty">
        <i class="bi bi-arrow-repeat mechanic-spin"></i>
        <span>Cargando observaciones...</span>
      </div>
      <div v-else-if="filteredObservations.length" class="mechanic-alert-table-wrap">
        <table class="mechanic-alert-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Vehículo</th>
              <th>Fecha</th>
              <th>Síntomas y observaciones</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredObservations" :key="item.id_registro">
              <td>{{ getClientName(item.cliente) }}</td>
              <td>
                <strong>{{ getVehicleName(item.vehiculo) }}</strong>
                <small>{{ item.vehiculo?.placas || 'Sin placas' }}</small>
              </td>
              <td>{{ formatDate(item.fecha_observacion) }}</td>
              <td>
                <div class="mechanic-alert-symptoms">
                  <span v-for="symptom in item.sintomas || []" :key="`${item.id_registro}-${symptom}`">
                    {{ symptom }}
                  </span>
                </div>
                <p class="mechanic-alert-description">{{ item.descripcion || 'Sin descripción' }}</p>
                <p class="mechanic-alert-description">
                  Atención externa:
                  {{ item.atencion_externa ? item.detalle_atencion_externa : 'No reportada' }}
                </p>
              </td>
              <td><span class="mechanic-alert-status" :class="getObservationClass(item.estado)">{{ getObservationLabel(item.estado) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="mechanic-alert-empty">
        <i class="bi bi-chat-left-text"></i>
        <strong>{{ observations.length ? 'Sin resultados' : 'Sin observaciones' }}</strong>
        <span>
          {{
            observations.length
              ? 'No se encontraron observaciones con los filtros seleccionados.'
              : 'No hay observaciones registradas por tus clientes.'
          }}
        </span>
      </div>
    </section>

    <section v-else class="mechanic-panel mechanic-alert-content-panel">
      <div class="mechanic-panel-heading mechanic-appointments-heading">
        <div>
          <h3>Citas de mis clientes</h3>
          <p>Solicitudes y citas relacionadas con tus clientes y vehículos.</p>
        </div>
        <div class="mechanic-appointment-filters">
          <select v-model="appointmentStatus" aria-label="Filtrar citas por estado">
            <option value="">Todos los estados</option>
            <option value="PROXIMA">Próximas</option>
            <option value="EN_ATENCION">En atención</option>
            <option value="ATENDIDA">Atendidas</option>
            <option value="VENCIDA">Vencidas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
          <input v-model="appointmentDate" type="date" aria-label="Filtrar citas por fecha" />
        </div>
      </div>

      <div v-if="loading && !appointments.length" class="mechanic-alert-empty">
        <i class="bi bi-arrow-repeat mechanic-spin"></i>
        <span>Cargando citas...</span>
      </div>
      <div v-else-if="filteredAppointments.length" class="mechanic-alert-table-wrap">
        <table class="mechanic-alert-table">
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Cliente</th>
              <th>Vehículo</th>
              <th>Mecánico</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="appointment in filteredAppointments" :key="appointment.id_cita">
              <td>
                <strong>{{ formatDate(appointment.fecha) }}</strong>
                <small>{{ formatTime(appointment.hora) }}</small>
              </td>
              <td>
                <strong>{{ getClientName(appointment.cliente) }}</strong>
                <small>{{ appointment.cliente?.usuario?.telefono || appointment.cliente?.usuario?.correo || 'Sin contacto' }}</small>
              </td>
              <td>
                <strong>{{ getVehicleName(appointment.vehiculo) }}</strong>
                <small>{{ appointment.vehiculo?.placas || 'Sin placas' }}</small>
              </td>
              <td>{{ appointment.mecanico ? getMechanicName(appointment.mecanico) : 'Sin asignar' }}</td>
              <td>{{ appointment.motivo || 'Sin motivo' }}</td>
              <td><span class="mechanic-alert-status" :class="getAppointmentClass(appointment.estado)">{{ getAppointmentLabel(appointment.estado) }}</span></td>
              <td>
                <div v-if="canUpdateAppointment(appointment)" class="mechanic-appointment-actions">
                  <button
                    class="mechanic-appointment-action"
                    type="button"
                    :disabled="processingAppointmentId === appointment.id_cita"
                    @click="updateAppointment(appointment)"
                  >
                    <i class="bi" :class="processingAppointmentId === appointment.id_cita ? 'bi-arrow-repeat mechanic-spin' : appointment.estado === 'PROXIMA' ? 'bi-play-fill' : 'bi-check2'"></i>
                    {{ appointment.estado === 'PROXIMA' ? 'Iniciar' : 'Finalizar' }}
                  </button>
                  <template v-if="appointment.estado === 'PROXIMA'">
                    <button
                      class="mechanic-appointment-icon-action is-reschedule"
                      type="button"
                      :aria-label="`Proponer cambio de fecha para ${getClientName(appointment.cliente)}`"
                      title="Proponer otro día u hora"
                      :disabled="processingAppointmentId === appointment.id_cita"
                      @click="openRescheduleDialog(appointment)"
                    >
                      <i class="bi bi-calendar2-plus"></i>
                    </button>
                    <button
                      class="mechanic-appointment-icon-action is-reject"
                      type="button"
                      :aria-label="`Negar cita de ${getClientName(appointment.cliente)}`"
                      title="Negar y cancelar la cita"
                      :disabled="processingAppointmentId === appointment.id_cita"
                      @click="rejectAppointment(appointment)"
                    >
                      <i class="bi bi-calendar2-x"></i>
                    </button>
                  </template>
                </div>
                <span v-else-if="appointment.estado === 'PROXIMA' && !appointment.id_mecanico" class="mechanic-unassigned-hint">Pendiente de asignación</span>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="mechanic-alert-empty">
        <i class="bi bi-calendar2-x"></i>
        <strong>No hay citas</strong>
        <span>No se encontraron citas con los filtros seleccionados.</span>
      </div>
    </section>

    <div
      v-if="rescheduleAppointment"
      class="mechanic-reschedule-overlay"
      @click.self="closeRescheduleDialog"
    >
      <form class="mechanic-reschedule-dialog" @submit.prevent="submitReschedule">
        <div class="mechanic-reschedule-heading">
          <div>
            <span>PROPUESTA DE CAMBIO</span>
            <h3>Proponer otra fecha u hora</h3>
            <p>
              La cita no cambiará hasta que el cliente acepte la propuesta.
              Si la rechaza, la cita se cancelará.
            </p>
          </div>
          <button type="button" aria-label="Cerrar" :disabled="processingAppointmentId === rescheduleAppointment.id_cita" @click="closeRescheduleDialog">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="mechanic-reschedule-fields">
          <label>
            <span>Fecha propuesta</span>
            <input v-model="rescheduleForm.fecha" type="date" :min="minimumAppointmentDate" required />
          </label>
          <label>
            <span>Hora propuesta</span>
            <input v-model="rescheduleForm.hora" type="time" required />
          </label>
        </div>
        <div class="mechanic-reschedule-actions">
          <button type="button" :disabled="processingAppointmentId === rescheduleAppointment.id_cita" @click="closeRescheduleDialog">Volver</button>
          <button type="submit" :disabled="processingAppointmentId === rescheduleAppointment.id_cita">
            <i :class="processingAppointmentId === rescheduleAppointment.id_cita ? 'bi bi-arrow-repeat mechanic-spin' : 'bi bi-send'"></i>
            Enviar propuesta
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { supabase } from '../services/supabase.js'
import {
  cambiarEstadoCitaMecanico,
  marcarAlertaLeida,
  obtenerAlertasSistema,
  obtenerCitasMecanico,
  obtenerObservacionesTransmisionClientes,
  proponerReprogramacionCita,
  rechazarCitaMecanico
} from '../services/alertaService.js'

const props = defineProps({
  mechanic: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['alert-count'])

const appointments = ref([])
const alerts = ref([])
const observations = ref([])
const loading = ref(false)
const activeTab = ref('observaciones')
const showPendingAlerts = ref(true)
const observationSearch = ref('')
const observationStatus = ref('')
const observationDate = ref('')
const appointmentStatus = ref('')
const appointmentDate = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const processingAlertId = ref(null)
const processingAppointmentId = ref(null)
const rescheduleAppointment = ref(null)
const rescheduleForm = ref({ fecha: '', hora: '' })
const today = new Date()
const minimumAppointmentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
let requestId = 0
let refreshInterval = null
let alertChannel = null
let messageTimeout = null

const unreadAlerts = computed(() =>
  alerts.value.filter(alert =>
    String(alert.estado || '').trim().toUpperCase() !== 'LEIDA'
  )
)

const filteredAppointments = computed(() =>
  appointments.value.filter(appointment =>
    (!appointmentStatus.value || appointment.estado === appointmentStatus.value) &&
    (!appointmentDate.value || appointment.fecha === appointmentDate.value)
  )
)

const filteredObservations = computed(() => {
  const term = observationSearch.value.trim().toLowerCase()

  return observations.value.filter(item => {
    const user = item?.cliente?.usuario
    const client = [
      user?.nombre,
      user?.apellido_paterno,
      user?.apellido_materno
    ].filter(Boolean).join(' ')
    const vehicle = [
      item?.vehiculo?.marca,
      item?.vehiculo?.modelo,
      item?.vehiculo?.placas,
      item?.vehiculo?.no_economico
    ].filter(Boolean).join(' ')
    const symptoms = Array.isArray(item?.sintomas)
      ? item.sintomas.join(' ')
      : ''
    const searchableText = [
      client,
      vehicle,
      symptoms,
      item?.descripcion,
      item?.estado
    ].filter(Boolean).join(' ').toLowerCase()

    return (!term || searchableText.includes(term)) &&
      (!observationStatus.value ||
        String(item.estado || '').trim().toUpperCase() === observationStatus.value) &&
      (!observationDate.value ||
        String(item.fecha_observacion || '').slice(0, 10) === observationDate.value)
  })
})

const appointmentRequests = computed(() =>
  appointments.value.filter(appointment =>
    ['PROXIMA', 'EN_ATENCION'].includes(appointment.estado)
  )
)

const summaryStats = computed(() => [
  { label: 'Próximas', value: countAppointments('PROXIMA'), icon: 'bi bi-calendar-check-fill' },
  { label: 'En atención', value: countAppointments('EN_ATENCION'), icon: 'bi bi-tools' },
  { label: 'Vencidas', value: countAppointments('VENCIDA'), icon: 'bi bi-exclamation-triangle-fill' }
])

function countAppointments(status) {
  return appointments.value.filter(appointment => appointment.estado === status).length
}

function getClientName(client) {
  const user = client?.usuario
  return [user?.nombre, user?.apellido_paterno, user?.apellido_materno]
    .filter(Boolean)
    .join(' ') || 'Cliente'
}

function getVehicleName(vehicle) {
  if (!vehicle) return 'Sin vehículo'
  return [vehicle.marca, vehicle.modelo].filter(Boolean).join(' ') || 'Vehículo'
}

function getMechanicName(mechanic) {
  const user = mechanic?.usuario
  return [user?.nombre, user?.apellido_paterno, user?.apellido_materno]
    .filter(Boolean)
    .join(' ') || 'Mecánico'
}

function formatDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : 'Sin hora'
}

function getAlertTitle(alert) {
  if (alert.tipo_alerta === 'CITA_NUEVA') return 'Nueva cita solicitada'
  if (alert.tipo_alerta === 'TRANSMISION_CLIENTE') return 'Nueva observación de transmisión'
  if (alert.tipo_alerta === 'CITA_REPROGRAMACION_RESPUESTA') return 'Respuesta a propuesta de cita'
  return alert.tipo_alerta?.replaceAll('_', ' ') || 'Alerta'
}

function getAlertIcon(alert) {
  if (['CITA_NUEVA', 'CITA_REPROGRAMACION_RESPUESTA'].includes(alert.tipo_alerta)) return 'bi bi-calendar-plus'
  if (alert.tipo_alerta === 'TRANSMISION_CLIENTE') return 'bi bi-chat-left-text'
  return 'bi bi-bell'
}

function getObservationLabel(status) {
  const labels = { PENDIENTE: 'Pendiente', REVISADO: 'Revisado', ATENDIDO: 'Atendido' }
  return labels[String(status || '').toUpperCase()] || status || 'Sin estado'
}

function getObservationClass(status) {
  return `is-${String(status || '').toLowerCase()}`
}

function getAppointmentLabel(status) {
  const labels = {
    PROXIMA: 'Próxima',
    EN_ATENCION: 'En atención',
    ATENDIDA: 'Atendida',
    VENCIDA: 'Vencida',
    CANCELADA: 'Cancelada'
  }
  return labels[status] || status || 'Sin estado'
}

function getAppointmentClass(status) {
  return `is-${String(status || '').toLowerCase()}`
}

function canUpdateAppointment(appointment) {
  return Number(appointment.id_mecanico) === Number(props.mechanic?.id_mecanico) &&
    ['PROXIMA', 'EN_ATENCION'].includes(appointment.estado) &&
    appointment.estado_reprogramacion !== 'PENDIENTE'
}

async function loadData() {
  const mechanicId = props.mechanic?.id_mecanico
  const userId = props.mechanic?.id_usuario

  if (!mechanicId || !userId) return

  const request = ++requestId
  loading.value = true
  errorMessage.value = ''

  try {
    const [appointmentData, alertData, observationData] = await Promise.all([
      obtenerCitasMecanico(mechanicId),
      obtenerAlertasSistema(userId, mechanicId),
      obtenerObservacionesTransmisionClientes(mechanicId)
    ])

    if (request !== requestId) return

    appointments.value = appointmentData
    alerts.value = alertData
    observations.value = observationData
    emit(
      'alert-count',
      alertData.filter(alert =>
        String(alert.estado || '').trim().toUpperCase() !== 'LEIDA'
      ).length
    )
  } catch (error) {
    if (request !== requestId) return
    console.error('Error cargando alertas del mecánico:', error)
    errorMessage.value = 'No fue posible cargar las alertas, observaciones y citas. Intenta actualizar nuevamente.'
  } finally {
    if (request === requestId) loading.value = false
  }
}

async function markAlertRead(alert) {
  processingAlertId.value = alert.id_alerta
  errorMessage.value = ''

  try {
    await marcarAlertaLeida(alert.id_alerta, props.mechanic?.id_usuario)
    alerts.value = alerts.value.map(item =>
      item.id_alerta === alert.id_alerta
        ? { ...item, estado: 'LEIDA', fecha_lectura: new Date().toISOString() }
        : item
    )
    emit('alert-count', unreadAlerts.value.length)
  } catch (error) {
    console.error('Error marcando alerta como leída:', error)
    errorMessage.value = 'No fue posible marcar la alerta como leída.'
  } finally {
    processingAlertId.value = null
  }
}

async function updateAppointment(appointment) {
  const newStatus = appointment.estado === 'PROXIMA' ? 'EN_ATENCION' : 'ATENDIDA'
  const confirmation = newStatus === 'EN_ATENCION'
    ? '¿Deseas iniciar la atención de esta cita?'
    : '¿Deseas marcar esta cita como atendida?'

  if (!window.confirm(confirmation)) return

  processingAppointmentId.value = appointment.id_cita
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await cambiarEstadoCitaMecanico(appointment.id_cita, newStatus)

    successMessage.value = 'El estado de la cita fue actualizado correctamente.'
    await loadData()

    window.clearTimeout(messageTimeout)
    messageTimeout = window.setTimeout(() => {
      successMessage.value = ''
    }, 3500)
  } catch (error) {
    console.error('Error actualizando cita del mecánico:', error)
    errorMessage.value = error?.message || 'No fue posible actualizar el estado de la cita.'
  } finally {
    processingAppointmentId.value = null
  }
}

function openRescheduleDialog(appointment) {
  rescheduleAppointment.value = appointment
  rescheduleForm.value = {
    fecha: appointment.fecha || minimumAppointmentDate,
    hora: String(appointment.hora || '').slice(0, 5)
  }
  errorMessage.value = ''
}

function closeRescheduleDialog() {
  if (processingAppointmentId.value) return
  rescheduleAppointment.value = null
}

async function submitReschedule() {
  const appointment = rescheduleAppointment.value
  if (!appointment) return

  processingAppointmentId.value = appointment.id_cita
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await proponerReprogramacionCita(
      appointment.id_cita,
      rescheduleForm.value.fecha,
      rescheduleForm.value.hora
    )
    rescheduleAppointment.value = null
    successMessage.value = 'La propuesta de cambio se envió al cliente.'
    await loadData()
    window.clearTimeout(messageTimeout)
    messageTimeout = window.setTimeout(() => { successMessage.value = '' }, 3500)
  } catch (error) {
    console.error('Error proponiendo cambio de cita:', error)
    errorMessage.value = error?.message || 'No fue posible enviar la propuesta de cambio.'
  } finally {
    processingAppointmentId.value = null
  }
}

async function rejectAppointment(appointment) {
  if (!window.confirm('¿Deseas negar esta cita? Se cancelará y el cliente recibirá una notificación.')) return

  processingAppointmentId.value = appointment.id_cita
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await rechazarCitaMecanico(appointment.id_cita)
    successMessage.value = 'La cita fue negada y se notificó al cliente.'
    await loadData()
    window.clearTimeout(messageTimeout)
    messageTimeout = window.setTimeout(() => { successMessage.value = '' }, 3500)
  } catch (error) {
    console.error('Error negando cita del mecánico:', error)
    errorMessage.value = error?.message || 'No fue posible negar la cita.'
  } finally {
    processingAppointmentId.value = null
  }
}

function startRefresh() {
  stopRefresh()
  refreshInterval = window.setInterval(loadData, 60_000)
}

function stopRefresh() {
  if (refreshInterval) {
    window.clearInterval(refreshInterval)
    refreshInterval = null
  }
}

function startAlertSubscription() {
  if (alertChannel || !props.mechanic?.id_usuario) return

  alertChannel = supabase
    .channel(`mechanic-alerts-${props.mechanic.id_usuario}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'alerta',
      filter: `id_usuario=eq.${props.mechanic.id_usuario}`
    }, loadData)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'registro_transmision_cliente'
    }, loadData)
    .subscribe()
}

watch(
  () => [props.mechanic?.id_mecanico, props.mechanic?.id_usuario],
  () => {
    requestId += 1
    appointments.value = []
    alerts.value = []
    observations.value = []
    if (props.mechanic?.id_mecanico && props.mechanic?.id_usuario) {
      loadData()
      startRefresh()
      startAlertSubscription()
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  requestId += 1
  stopRefresh()
  window.clearTimeout(messageTimeout)
  if (alertChannel) supabase.removeChannel(alertChannel)
})
</script>
