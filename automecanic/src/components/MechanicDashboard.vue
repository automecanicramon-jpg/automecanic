<template>
  <div
    class="admin-layout admin-portal mechanic-layout"
    :class="{ 'dark-mode': isDarkMode }"
  >
    <aside
      class="admin-sidebar"
      :class="{ 'sidebar-open': sidebarOpen }"
    >
      <div class="sidebar-brand">
        <div class="brand-icon">
          <img
            src="../assets/logo-claro.jpg"
            alt="Logo AutoMecanic"
            class="sidebar-brand-logo"
          />
        </div>

        <div>
          <h4>Automecanic</h4>
          <span>Panel del mecánico</span>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Navegación del mecánico">
        <button
          v-for="item in navigationItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: activeSection === item.id }"
          type="button"
          @click="changeSection(item.id)"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
          <span
            v-if="item.id === 'alertas' && alertCount > 0"
            class="notification-count"
          >
            {{ alertCount > 99 ? '99+' : alertCount }}
          </span>
        </button>
      </nav>

      <div class="mechanic-sidebar-footer">
        <i class="bi bi-shield-check"></i>
        <span>Espacio de trabajo personal</span>
      </div>
    </aside>

    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
      @touchmove.prevent
      @wheel.prevent
    ></div>

    <main class="admin-main">
      <header class="admin-header">
        <div class="header-left">
          <button
            class="mobile-menu-button"
            type="button"
            aria-label="Abrir menú"
            @click="sidebarOpen = !sidebarOpen"
          >
            <i class="bi bi-list"></i>
          </button>

          <div>
            <h1>{{ sectionTitle }}</h1>
            <p>{{ sectionDescription }}</p>
          </div>
        </div>

        <div class="header-right">
          <div class="header-date">
            <i class="bi bi-calendar3"></i>
            <div>
              <span>{{ currentDate }}</span>
              <strong>{{ currentTime }}</strong>
            </div>
          </div>

          <div class="mechanic-header-alerts">
            <button
              class="header-icon-button"
              type="button"
              title="Alertas"
              aria-label="Abrir notificaciones"
              :aria-expanded="showNotificationsDropdown"
              @click.stop="toggleNotifications"
            >
              <i class="bi bi-bell"></i>
              <span v-if="alertCount > 0" class="header-notification">
                {{ alertCount > 99 ? '99+' : alertCount }}
              </span>
            </button>
            <div v-if="showNotificationsDropdown" class="mechanic-notifications-dropdown" @click.stop>
              <div class="mechanic-notifications-heading">
                <strong>Notificaciones</strong>
                <span v-if="alertCount">{{ alertCount }} sin leer</span>
              </div>
              <div v-if="notificationsLoading" class="mechanic-notifications-state">
                <i class="bi bi-arrow-repeat mechanic-spin"></i>
                Cargando...
              </div>
              <div v-else-if="notificationsError" class="mechanic-notifications-state is-error" role="alert">
                {{ notificationsError }}
              </div>
              <template v-else>
                <div v-if="recentNotifications.length" class="mechanic-notifications-list">
                  <button
                    v-for="notification in recentNotifications"
                    :key="notification.id_alerta"
                    class="mechanic-header-notification"
                    :class="{ 'is-unread': String(notification.estado || '').toUpperCase() !== 'LEIDA' }"
                    type="button"
                    @click="goToAlerts"
                  >
                    <i class="bi" :class="['CITA_NUEVA', 'CITA_REPROGRAMACION_RESPUESTA'].includes(notification.tipo_alerta) ? 'bi-calendar-plus' : notification.tipo_alerta === 'TRANSMISION_CLIENTE' ? 'bi-chat-left-text' : 'bi-bell'"></i>
                    <span>
                      <strong>{{ getHeaderAlertTitle(notification) }}</strong>
                      <small>{{ notification.mensaje }}</small>
                      <small class="mechanic-notification-status">
                        {{ String(notification.estado || '').toUpperCase() === 'LEIDA' ? 'Leída' : 'Nueva · Sin leer' }}
                      </small>
                    </span>
                  </button>
                </div>
              </template>
              <div v-if="!notificationsLoading && !notificationsError && !recentNotifications.length" class="mechanic-notifications-state">
                <i class="bi bi-bell-slash"></i>
                No hay notificaciones
              </div>
              <button class="mechanic-notifications-footer" type="button" @click="goToAlerts">
                Ver todas las alertas
                <i class="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>

          <div class="profile-wrapper">
            <button
              class="profile-button"
              type="button"
              aria-label="Opciones de mi cuenta"
              :aria-expanded="showUserMenu"
              @click.stop="showNotificationsDropdown = false; showUserMenu = !showUserMenu"
            >
              <div class="profile-avatar">{{ mechanicInitials }}</div>
              <div class="profile-info">
                <strong>{{ mechanicName }}</strong>
                <span>{{ mechanic?.especialidad || 'Mecánico' }}</span>
              </div>
              <i class="bi bi-chevron-down"></i>
            </button>

            <div
              v-if="showUserMenu"
              class="profile-dropdown"
              @click.stop
            >
              <div class="dropdown-profile">
                <div class="profile-avatar">{{ mechanicInitials }}</div>
                <div>
                  <strong>{{ mechanicName }}</strong>
                  <span>{{ mechanicEmail }}</span>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <PushNotificationsControl
                :user-id="mechanic?.id_usuario"
              />

              <button
                type="button"
                @click="showProfileModal = true; showUserMenu = false"
              >
                <i class="bi bi-person"></i>
                Mi perfil
              </button>

              <button
                class="logout-button"
                type="button"
                @click="logout"
              >
                <i class="bi bi-box-arrow-right"></i>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <section class="admin-content">
        <MechanicInicio
          v-if="activeSection === 'inicio'"
          :mechanic="mechanic"
          :vehicles="assignedVehicles"
          :services="mechanicServices"
          :loading="dashboardLoading"
          :error="dashboardError"
          @retry="loadDashboard"
          @navigate="changeSection"
        />
        <AdminClientes
          v-else-if="activeSection === 'clientes'"
          mechanic-mode
          :mechanic-id="mechanic?.id_mecanico"
        />
        <AdminVehiculos
          v-else-if="activeSection === 'vehiculos'"
          mechanic-mode
          :mechanic-id="mechanic?.id_mecanico"
        />
        <AdminServicios
          v-else-if="activeSection === 'servicios'"
          mechanic-mode
          :mechanic-id="mechanic?.id_mecanico"
          :mechanic="mechanic"
        />
        <AdminMantenimiento
          v-else-if="activeSection === 'mantenimiento'"
          mechanic-mode
          :mechanic-id="mechanic?.id_mecanico"
        />
        <MechanicModules
          v-else
          :section="activeSection"
          :mechanic="mechanic"
          @alert-count="alertCount = $event"
        />
      </section>
    </main>

    <div
      v-if="showProfileModal"
      class="modal-overlay"
      @click.self="showProfileModal = false"
    >
      <div class="app-modal profile-modal">
        <div class="modal-header">
          <div>
            <h3>Información del mecánico</h3>
            <p>Datos de la cuenta actual</p>
          </div>
          <button
            class="modal-close-button"
            type="button"
            aria-label="Cerrar"
            @click="showProfileModal = false"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="profile-modal-top">
            <div class="profile-large-avatar">{{ mechanicInitials }}</div>
            <h3>{{ mechanicName }}</h3>
            <span>{{ mechanic?.especialidad || 'Mecánico general' }}</span>
          </div>

          <div class="profile-detail">
            <i class="bi bi-envelope"></i>
            <div>
              <small>Correo electrónico</small>
              <strong>{{ mechanicEmail }}</strong>
            </div>
          </div>

          <div class="profile-detail">
            <i class="bi bi-person-badge"></i>
            <div>
              <small>Identificador de mecánico</small>
              <strong>{{ mechanic?.id_mecanico || 'No disponible' }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AdminClientes from './AdminClientes.vue'
import AdminMantenimiento from './AdminMantenimiento.vue'
import AdminServicios from './AdminServicios.vue'
import MechanicInicio from './MechanicInicio.vue'
import MechanicModules from './MechanicModules.vue'
import AdminVehiculos from './AdminVehiculos.vue'
import { obtenerVehiculosMecanico } from '../services/vehiculoService.js'
import { obtenerHistorialServiciosMecanico } from '../services/servicioService.js'
import { obtenerAlertasSistema } from '../services/alertaService.js'
import { supabase } from '../services/supabase.js'
import {
  actualizarInsigniaAplicacion,
  desactivarNotificacionesPush,
  limpiarInsigniaAplicacion,
  obtenerSuscripcionPush
} from '../services/pushNotificationService.js'
import PushNotificationsControl from './PushNotificationsControl.vue'
import '../styles/admin.css'
import '../styles/mechanic.css'

const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: false
  },
  mechanic: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['logout'])

const navigationItems = [
  { id: 'inicio', label: 'Inicio', icon: 'bi bi-grid-fill' },
  { id: 'clientes', label: 'Mis clientes', icon: 'bi bi-person-vcard-fill' },
  { id: 'vehiculos', label: 'Vehículos', icon: 'bi bi-car-front-fill' },
  { id: 'servicios', label: 'Servicios y mantenimiento', icon: 'bi bi-wrench-adjustable-circle-fill' },
  { id: 'mantenimiento', label: 'Mantenimiento preventivo', icon: 'bi bi-speedometer2' },
  { id: 'alertas', label: 'Alertas', icon: 'bi bi-bell-fill' },
  { id: 'reportes', label: 'Reportes', icon: 'bi bi-file-earmark-bar-graph-fill' }
]

const sidebarOpen = ref(false)
const showUserMenu = ref(false)
const showProfileModal = ref(false)
const activeSection = ref('inicio')
const currentDate = ref('')
const currentTime = ref('')
const assignedVehicles = ref([])
const mechanicServices = ref([])
const dashboardLoading = ref(false)
const dashboardError = ref('')
const alertCount = ref(0)
const showNotificationsDropdown = ref(false)
const recentNotifications = ref([])
const notificationsLoading = ref(false)
const notificationsError = ref('')
let dashboardRequest = 0
let clockInterval
let mechanicAlertChannel = null

const loadDashboard = async () => {
  const request = ++dashboardRequest
  const mechanicId = props.mechanic?.id_mecanico

  dashboardLoading.value = true
  dashboardError.value = ''

  try {
    const [vehicles, services] = await Promise.all([
      obtenerVehiculosMecanico(mechanicId),
      obtenerHistorialServiciosMecanico(mechanicId)
    ])

    if (request !== dashboardRequest) return

    assignedVehicles.value = vehicles
    mechanicServices.value = services
  } catch (error) {
    if (request !== dashboardRequest) return

    console.error(
      'Error cargando el inicio del mecánico:',
      error
    )

    dashboardError.value =
      'No fue posible cargar tus vehículos y servicios. Intenta nuevamente.'
  } finally {
    if (request === dashboardRequest) {
      dashboardLoading.value = false
    }
  }
}

const mechanicName = computed(() => {
  const name = [
    props.mechanic?.nombre,
    props.mechanic?.apellido_paterno,
    props.mechanic?.apellido_materno
  ].filter(Boolean).join(' ').trim()

  return name || 'Mecánico'
})

const mechanicEmail = computed(() =>
  props.mechanic?.correo || props.mechanic?.email || 'Sin correo'
)

const mechanicInitials = computed(() => {
  const parts = mechanicName.value.split(/\s+/).filter(Boolean)
  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : (parts[0]?.slice(0, 2) || 'ME').toUpperCase()
})

const sectionTitle = computed(() => ({
  inicio: 'Panel principal',
  clientes: 'Mis clientes',
  vehiculos: 'Vehículos',
  servicios: 'Servicios y mantenimiento',
  mantenimiento: 'Mantenimiento preventivo',
  alertas: 'Alertas',
  reportes: 'Reportes'
}[activeSection.value] || 'Panel principal'))

const sectionDescription = computed(() => ({
  inicio: 'Resumen de tu actividad en el taller',
  clientes: 'Clientes relacionados con tus asignaciones',
  vehiculos: 'Vehículos asignados a tu espacio de trabajo',
  servicios: 'Consulta y registra servicios del taller',
  mantenimiento: 'Seguimiento visual de próximos mantenimientos',
  alertas: 'Avisos y novedades relacionados con tu trabajo',
  reportes: 'Resumen visual de tu actividad y servicios'
}[activeSection.value] || 'Espacio de trabajo del mecánico'))

const updateClock = () => {
  const now = new Date()
  currentDate.value = new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).format(now)
  currentTime.value = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(now)
}

const changeSection = section => {
  activeSection.value = section
  sidebarOpen.value = false
  showUserMenu.value = false
  showNotificationsDropdown.value = false
}

const loadMechanicNotifications = async () => {
  const mechanicId = props.mechanic?.id_mecanico
  const userId = props.mechanic?.id_usuario
  if (!mechanicId || !userId) {
    alertCount.value = 0
    recentNotifications.value = []
    notificationsError.value = ''
    return
  }

  notificationsLoading.value = true
  notificationsError.value = ''
  try {
    const alerts = await obtenerAlertasSistema(userId, mechanicId)
    const unread = alerts.filter(alert => String(alert.estado || '').toUpperCase() !== 'LEIDA')
    alertCount.value = unread.length
    recentNotifications.value = alerts
    actualizarInsigniaAplicacion(userId)
      .catch(error => {
        console.error(
          'Error actualizando el contador de notificaciones de la app:',
          error
        )
      })
  } catch (error) {
    console.error('Error cargando notificaciones del mecánico:', error)
    notificationsError.value = 'No fue posible cargar tus notificaciones.'
  } finally {
    notificationsLoading.value = false
  }
}

const startMechanicAlertSubscription = () => {
  if (mechanicAlertChannel) {
    supabase.removeChannel(mechanicAlertChannel)
    mechanicAlertChannel = null
  }

  const userId = props.mechanic?.id_usuario
  if (!userId) return

  mechanicAlertChannel = supabase
    .channel(`mechanic-header-alerts-${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'alerta',
      filter: `id_usuario=eq.${userId}`
    }, loadMechanicNotifications)
    .subscribe()
}

const toggleNotifications = async () => {
  showUserMenu.value = false
  showNotificationsDropdown.value = !showNotificationsDropdown.value
  if (showNotificationsDropdown.value) await loadMechanicNotifications()
}

const goToAlerts = () => changeSection('alertas')

const logout = async () => {
  showUserMenu.value = false

  try {
    const subscription = await obtenerSuscripcionPush()
    if (subscription) {
      await desactivarNotificacionesPush(
        props.mechanic?.id_usuario,
        subscription
      )
    }

    await limpiarInsigniaAplicacion()
  } catch (error) {
    console.error(
      'Error desactivando notificaciones del mecánico al cerrar sesión:',
      error
    )
  }

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error cerrando sesión del mecánico:', error)
    }
  } catch (error) {
    console.error('Error al cerrar sesión del mecánico:', error)
  } finally {
    emit('logout')
  }
}

const getHeaderAlertTitle = alert => ({
  CITA_NUEVA: 'Nueva cita solicitada',
  TRANSMISION_CLIENTE: 'Nueva observación de transmisión',
  CITA_REPROGRAMACION_RESPUESTA: 'Respuesta a propuesta de cita'
}[alert.tipo_alerta] || alert.tipo_alerta?.replaceAll('_', ' ') || 'Alerta')

const handleGlobalClick = event => {
  const target = event?.target

  if (!(target instanceof Node)) {
    showNotificationsDropdown.value = false
    showUserMenu.value = false
    return
  }

  const path = typeof event.composedPath === 'function'
    ? event.composedPath()
    : []

  const clickedInside = selector =>
    path.some(node =>
      node instanceof Element && node.closest(selector)
    ) || (
      target instanceof Element &&
      target.closest(selector)
    )

  if (!clickedInside('.mechanic-header-alerts')) {
    showNotificationsDropdown.value = false
  }

  if (!clickedInside('.profile-wrapper')) {
    showUserMenu.value = false
  }
}

updateClock()
clockInterval = window.setInterval(updateClock, 1_000)
document.addEventListener('pointerdown', handleGlobalClick)

watch(
  () => props.mechanic?.id_mecanico,
  mechanicId => {
    if (mechanicId) {
      loadDashboard()
      loadMechanicNotifications()
      startMechanicAlertSubscription()
      return
    }

    dashboardRequest += 1
    alertCount.value = 0
    recentNotifications.value = []
    showNotificationsDropdown.value = false
    if (mechanicAlertChannel) {
      supabase.removeChannel(mechanicAlertChannel)
      mechanicAlertChannel = null
    }
    assignedVehicles.value = []
    mechanicServices.value = []
    dashboardError.value = ''
    dashboardLoading.value = false
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  dashboardRequest += 1
  window.clearInterval(clockInterval)
  document.removeEventListener('pointerdown', handleGlobalClick)
  if (mechanicAlertChannel) supabase.removeChannel(mechanicAlertChannel)
})
</script>
