<template>
  <div
    class="admin-layout admin-portal"
    :class="{ 'dark-mode': isDarkMode }"
  >
    <aside
      v-if="liveNotification"
      class="admin-live-notification"
      role="status"
      aria-live="polite"
    >
      <i class="bi bi-bell-fill"></i>
      <span>{{ liveNotification }}</span>
      <button
        type="button"
        @click="changeSection('alertas'); liveNotification = ''"
      >
        Ver alertas
      </button>
      <button
        type="button"
        aria-label="Cerrar notificación"
        @click="liveNotification = ''"
      >
        <i class="bi bi-x-lg"></i>
      </button>
    </aside>
    <!-- ======================================================
         SIDEBAR
    ======================================================= -->

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
          <span>Panel administrativo</span>
        </div>
      </div>


      <nav class="sidebar-nav">
        <!-- INICIO -->

        <button
          class="nav-item"
          :class="{ active: activeSection === 'inicio' }"
          @click="changeSection('inicio')"
        >
          <i class="bi bi-grid-fill"></i>
          <span>Inicio</span>
        </button>


        <!-- PERSONAL -->

        <button
          class="nav-item"
          :class="{ active: activeSection === 'personal' }"
          @click="changeSection('personal')"
        >
          <i class="bi bi-people-fill"></i>
          <span>Personal</span>
        </button>


        <!-- CLIENTES -->

        <button
          class="nav-item"
          :class="{ active: activeSection === 'clientes' }"
          @click="changeSection('clientes')"
        >
          <i class="bi bi-person-vcard-fill"></i>
          <span>Clientes</span>
        </button>


        <!-- VEHÍCULOS -->

        <button
          class="nav-item"
          :class="{ active: activeSection === 'vehiculos' }"
          @click="changeSection('vehiculos')"
        >
          <i class="bi bi-car-front-fill"></i>
          <span>Vehículos</span>
        </button>


        <!-- SERVICIOS Y MANTENIMIENTO -->

        <button
          class="nav-item"
          :class="{ active: activeSection === 'servicios' }"
          @click="changeSection('servicios')"
        >
          <i class="bi bi-wrench-adjustable-circle-fill"></i>
          <span>Servicios y mantenimiento</span>
        </button>


        <!-- MANTENIMIENTO PREVENTIVO -->

        <button
          class="nav-item"
          :class="{ active: activeSection === 'mantenimiento' }"
          @click="changeSection('mantenimiento')"
        >
          <i class="bi bi-speedometer2"></i>
          <span>Mantenimiento preventivo</span>
        </button>


        <!-- CATÁLOGOS -->

        <button
          class="nav-item"
          :class="{ active: activeSection === 'catalogos' }"
          @click="changeSection('catalogos')"
        >
          <i class="bi bi-collection-fill"></i>
          <span>Catálogos</span>
        </button>


        <!-- ALERTAS -->

        <button
          class="nav-item"
          :class="{ active: activeSection === 'alertas' }"
          @click="changeSection('alertas')"
        >
          <i class="bi bi-bell-fill"></i>

          <span>
            Alertas
          </span>

          <span
            v-if="alertCount > 0"
            class="notification-count"
          >
            {{ alertCount }}
          </span>
        </button>


        <!-- REPORTES -->

        <button
          class="nav-item"
          :class="{ active: activeSection === 'reportes' }"
          @click="changeSection('reportes')"
        >
          <i class="bi bi-file-earmark-bar-graph-fill"></i>
          <span>Reportes</span>
        </button>
      </nav>
    </aside>


    <!-- ======================================================
         OVERLAY MÓVIL
         BLOQUEA TODA INTERACCIÓN CON EL FONDO
    ======================================================= -->

    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
      @touchmove.prevent
      @wheel.prevent
    ></div>


    <!-- ======================================================
         CONTENIDO
    ======================================================= -->

    <main class="admin-main">
      <!-- HEADER -->

      <header class="admin-header">
        <!-- IZQUIERDA -->

        <div class="header-left">
          <button
            class="mobile-menu-button"
            type="button"
            @click="sidebarOpen = !sidebarOpen"
          >
            <i class="bi bi-list"></i>
          </button>


          <div>
            <h1>
              {{ sectionTitle }}
            </h1>

            <p>
              {{ sectionDescription }}
            </p>
          </div>
        </div>


        <!-- DERECHA -->

        <div class="header-right">
          <!-- FECHA -->

          <div class="header-date">
            <i class="bi bi-calendar3"></i>

            <div>
              <span>
                {{ currentDate }}
              </span>

              <strong>
                {{ currentTime }}
              </strong>
            </div>
          </div>


          <!-- ALERTAS (CON DROPDOWN) -->

          <div class="alerts-wrapper">
            <button
              class="header-icon-button"
              type="button"
              title="Alertas"
              @click.stop="toggleNotifications"
            >
              <i class="bi bi-bell"></i>

              <span
                v-if="alertCount > 0"
                class="header-notification"
              >
                {{ alertCount }}
              </span>
            </button>

            <!-- DROPDOWN DE NOTIFICACIONES -->

            <div
              v-if="showNotificationsDropdown"
              class="notifications-dropdown"
              @click.stop
            >
              <div class="notifications-header">
                <div>
                  <strong>Notificaciones</strong>

                  <span v-if="notificacionesRecientes.length">
                    {{ notificacionesRecientes.length }} sin leer
                  </span>
                </div>

                <button
                  v-if="notificacionesRecientes.length"
                  class="mark-all-read"
                  type="button"
                  title="Marcar todas como leídas"
                  @click="marcarTodasComoLeidas"
                >
                  <i class="bi bi-check2-all"></i>
                </button>
              </div>

              <div
                v-if="cargandoNotificaciones"
                class="notifications-loading"
              >
                <div class="app-spinner"></div>
                <span>Cargando...</span>
              </div>

              <div
                v-else-if="notificacionesRecientes.length"
                class="notifications-list"
              >
                <article
                  v-for="notif in notificacionesRecientes"
                  :key="notif.id_alerta"
                  class="notification-item"
                  :class="getNotificationClass(notif.nivel)"
                  @click="irAlertaDesdeDropdown"
                >
                  <div class="notification-icon">
                    <i :class="getNotificationIcon(notif.nivel)"></i>
                  </div>

                  <div class="notification-body">
                    <strong>
                      {{ notif.tipo_alerta || 'Alerta' }}
                    </strong>

                    <p>
                      {{ notif.mensaje || 'Sin descripción' }}
                    </p>

                    <small>
                      {{
                        formatNotificationDate(
                          notif.fecha_registro ||
                          notif.fecha_programada
                        )
                      }}
                    </small>
                  </div>
                </article>
              </div>

              <div
                v-else
                class="notifications-empty"
              >
                <i class="bi bi-bell-slash"></i>
                <span>No hay notificaciones nuevas</span>
              </div>

              <button
                class="notifications-footer"
                type="button"
                @click="verTodasLasAlertas"
              >
                Ver todas las alertas
                <i class="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>


          <!-- PERFIL -->

          <div class="profile-wrapper">
            <button
              class="profile-button"
              aria-label="Opciones de mi cuenta"
              :aria-expanded="showUserMenu"
              type="button"
              @click.stop="showUserMenu = !showUserMenu"
            >
              <div class="profile-avatar">
                {{ adminInitials }}
              </div>


              <div class="profile-info">
                <strong>
                  {{ adminName }}
                </strong>

                <span>
                  Administrador
                </span>
              </div>


              <i class="bi bi-chevron-down"></i>
            </button>


            <!-- MENÚ PERFIL -->

            <div
              v-if="showUserMenu"
              class="profile-dropdown"
              @click.stop
            >
              <div class="dropdown-profile">
                <div class="profile-avatar">
                  {{ adminInitials }}
                </div>


                <div>
                  <strong>
                    {{ adminName }}
                  </strong>

                  <span>
                    {{ adminEmail }}
                  </span>
                </div>
              </div>


              <div class="dropdown-divider"></div>


              <button
                type="button"
                @click="
                  showProfileModal = true;
                  showUserMenu = false
                "
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


      <!-- ====================================================
           COMPONENTES
      ===================================================== -->

      <section class="admin-content">
        <!-- INICIO -->

        <AdminInicio
          v-if="activeSection === 'inicio'"
          :admin="admin"
          @navigate="handleNavigation"
        />


        <!-- PERSONAL -->

        <AdminPersonal
          v-else-if="activeSection === 'personal'"
          :action="pendingAction"
          @action-consumed="clearPendingAction"
        />


        <!-- CLIENTES -->

        <AdminClientes
          v-else-if="activeSection === 'clientes'"
          :action="pendingAction"
          @action-consumed="clearPendingAction"
        />


        <!-- VEHÍCULOS -->

        <AdminVehiculos
          v-else-if="activeSection === 'vehiculos'"
          :action="pendingAction"
          @action-consumed="clearPendingAction"
        />


        <!-- SERVICIOS -->

        <AdminServicios
          v-else-if="activeSection === 'servicios'"
          :action="pendingAction"
          @action-consumed="clearPendingAction"
        />


        <!-- MANTENIMIENTO PREVENTIVO -->

        <AdminMantenimiento
          v-else-if="activeSection === 'mantenimiento'"
        />


        <!-- CATÁLOGOS -->

        <AdminCatalogos
          v-else-if="activeSection === 'catalogos'"
        />


        <!-- ALERTAS -->

        <AdminAlertas
          v-else-if="activeSection === 'alertas'"
          @alert-count="alertCount = $event"
        />


        <!-- REPORTES -->

        <AdminReportes
          v-else-if="activeSection === 'reportes'"
          :admin="admin"
        />
      </section>
    </main>


    <!-- ======================================================
         MODAL PERFIL
    ======================================================= -->

    <div
      v-if="showProfileModal"
      class="modal-overlay"
      @click.self="showProfileModal = false"
    >
      <div class="app-modal profile-modal">
        <!-- HEADER -->

        <div class="modal-header">
          <div>
            <h3>
              Información del administrador
            </h3>

            <p>
              Datos de la cuenta actual
            </p>
          </div>


          <button
            class="modal-close-button"
            type="button"
            @click="showProfileModal = false"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>


        <!-- BODY -->

        <div class="modal-body">
          <div class="profile-modal-top">
            <div class="profile-large-avatar">
              {{ adminInitials }}
            </div>

            <h3>
              {{ adminName }}
            </h3>

            <span>
              Administrador
            </span>
          </div>


          <!-- CORREO -->

          <div class="profile-detail">
            <i class="bi bi-envelope"></i>

            <div>
              <small>
                Correo electrónico
              </small>

              <strong>
                {{ adminEmail }}
              </strong>
            </div>
          </div>


          <!-- TELÉFONO -->

          <div class="profile-detail">
            <i class="bi bi-telephone"></i>

            <div>
              <small>
                Teléfono
              </small>

              <strong>
                {{
                  admin?.telefono ||
                  'No registrado'
                }}
              </strong>
            </div>
          </div>


          <!-- ESTADO -->

          <div class="profile-detail">
            <i class="bi bi-shield-check"></i>

            <div>
              <small>
                Estado
              </small>

              <strong>
                {{
                  admin?.estatus ||
                  'Activo'
                }}
              </strong>
            </div>
          </div>
        </div>


        <!-- FOOTER -->

        <div class="modal-footer">
          <button
            class="secondary-button"
            type="button"
            @click="showProfileModal = false"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'

import {
  obtenerContadorAlertas
} from '../services/alertaService.js'

import {
  supabase
} from '../services/supabase.js'


/* ============================================================
   COMPONENTES
============================================================ */

import AdminInicio from './AdminInicio.vue'

import AdminPersonal from './AdminPersonal.vue'

import AdminClientes from './AdminClientes.vue'

import AdminVehiculos from './AdminVehiculos.vue'

import AdminServicios from './AdminServicios.vue'

import AdminMantenimiento from './AdminMantenimiento.vue'

import AdminCatalogos from './AdminCatalogos.vue'

import AdminAlertas from './AdminAlertas.vue'

import AdminReportes from './AdminReportes.vue'


/* ============================================================
   ESTILOS
============================================================ */

import '../styles/admin.css'


/* ============================================================
   PROPS
============================================================ */

const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: false
  },

  admin: {
    type: Object,
    default: () => ({})
  }
})


/* ============================================================
   EMITS
============================================================ */

const emit = defineEmits([
  'logout'
])


/* ============================================================
   SIDEBAR
============================================================ */

const sidebarOpen =
  ref(false)


/* ============================================================
   COLOR SUPERIOR MÓVIL
============================================================ */

const setMobileThemeColor =
  color => {
    const meta =
      document.querySelector(
        '#app-theme-color'
      ) ||
      document.querySelector(
        'meta[name="theme-color"]'
      )

    if (meta) {
      meta.setAttribute(
        'content',
        color
      )
    }
  }


const restoreMobileThemeColor =
  () => {
    const currentTheme =
      document.documentElement
        .getAttribute(
          'data-theme'
        )

    setMobileThemeColor(
      currentTheme === 'dark'
        ? '#030508'
        : '#f1f5f9'
    )
  }


watch(
  () => props.isDarkMode,

  isDark => {
    setMobileThemeColor(
      isDark
        ? '#030508'
        : '#f1f5f9'
    )
  },

  {
    immediate: true
  }
)


/* ============================================================
   BLOQUEO REAL DEL FONDO AL ABRIR SIDEBAR
   iOS / Android / tablets
============================================================ */

let dashboardScrollY = 0

let dashboardScrollLocked =
  false


const lockDashboardScroll =
  () => {
    if (
      window.innerWidth > 991
    ) {
      return
    }

    if (
      dashboardScrollLocked
    ) {
      return
    }

    dashboardScrollY =
      window.scrollY ||
      document.documentElement
        .scrollTop ||
      0

    dashboardScrollLocked =
      true

    document.documentElement
      .style
      .overflow =
      'hidden'

    document.documentElement
      .style
      .overscrollBehavior =
      'none'

    document.body
      .style
      .position =
      'fixed'

    document.body
      .style
      .top =
      `-${dashboardScrollY}px`

    document.body
      .style
      .left =
      '0'

    document.body
      .style
      .right =
      '0'

    document.body
      .style
      .width =
      '100%'

    document.body
      .style
      .overflow =
      'hidden'

    document.body
      .style
      .overscrollBehavior =
      'none'
  }


const unlockDashboardScroll =
  () => {
    if (
      !dashboardScrollLocked
    ) {
      return
    }

    dashboardScrollLocked =
      false

    document.documentElement
      .style
      .overflow =
      ''

    document.documentElement
      .style
      .overscrollBehavior =
      ''

    document.body
      .style
      .position =
      ''

    document.body
      .style
      .top =
      ''

    document.body
      .style
      .left =
      ''

    document.body
      .style
      .right =
      ''

    document.body
      .style
      .width =
      ''

    document.body
      .style
      .overflow =
      ''

    document.body
      .style
      .overscrollBehavior =
      ''

    window.scrollTo(
      0,
      dashboardScrollY
    )
  }


/* ============================================================
   CONTROL DEL SIDEBAR
============================================================ */

watch(
  sidebarOpen,

  isOpen => {
    if (isOpen) {
      setMobileThemeColor(
        '#132238'
      )

      lockDashboardScroll()
    } else {
      restoreMobileThemeColor()

      unlockDashboardScroll()
    }
  }
)


/* ============================================================
   ESTADO GENERAL
============================================================ */

const showUserMenu =
  ref(false)

const showProfileModal =
  ref(false)

const activeSection =
  ref('inicio')

const alertCount =
  ref(0)

const pendingAction =
  ref(null)

const currentDate =
  ref('')

const currentTime =
  ref('')

let clockInterval =
  null

let adminAlertChannel =
  null


/* ============================================================
   NOTIFICACIONES - DROPDOWN
============================================================ */

const showNotificationsDropdown =
  ref(false)

const notificacionesRecientes =
  ref([])

const cargandoNotificaciones =
  ref(false)

const liveNotification =
  ref('')

let liveNotificationTimeout =
  null


const cargarNotificacionesRecientes =
  async () => {
    cargandoNotificaciones.value = true

    try {
      const {
        data,
        error,
      } = await supabase
        .from("alerta")
        .select(`
          id_alerta,
          id_vehiculo,
          id_usuario,
          tipo_alerta,
          nivel,
          mensaje,
          estado,
          fecha_programada,
          fecha_registro,
          fecha_lectura
        `)
        .neq("estado", "LEIDA")
        .neq("tipo_alerta", "ACCION_MECANICO_CLIENTE")
        .order(
          "fecha_registro",
          { ascending: false, nullsFirst: false },
        )
        .order(
          "id_alerta",
          { ascending: false },
        )
        .limit(5)

      if (error) {
        throw error
      }

      notificacionesRecientes.value =
        data || []
    } catch (error) {
      console.error(
        "Error cargando notificaciones:",
        error,
      )

      notificacionesRecientes.value = []
    } finally {
      cargandoNotificaciones.value = false
    }
  }


const toggleNotifications =
  async () => {
    showNotificationsDropdown.value =
      !showNotificationsDropdown.value

    showUserMenu.value = false

    if (
      showNotificationsDropdown.value
    ) {
      await cargarNotificacionesRecientes()
    }
  }


const irAlertaDesdeDropdown =
  () => {
    showNotificationsDropdown.value =
      false

    changeSection("alertas")
  }


const verTodasLasAlertas =
  () => {
    showNotificationsDropdown.value =
      false

    changeSection("alertas")
  }


const marcarTodasComoLeidas =
  async () => {
    try {
      const ids =
        notificacionesRecientes.value.map(
          n => n.id_alerta,
        )

      if (!ids.length) return

      const {
        error,
      } = await supabase
        .from("alerta")
        .update({
          estado: "LEIDA",
          fecha_lectura:
            new Date().toISOString(),
        })
        .in("id_alerta", ids)

      if (error) {
        throw error
      }

      notificacionesRecientes.value = []

      const total =
        await obtenerContadorAlertas()

      alertCount.value = total
    } catch (error) {
      console.error(
        "Error marcando todas como leídas:",
        error,
      )
    }
  }


/* ============================================================
   HELPERS DE NOTIFICACIONES
============================================================ */

const getNotificationClass =
  nivel => {
    const value =
      String(nivel || "")
        .trim()
        .toUpperCase()

    if (
      value === "URGENTE" ||
      value === "ALTO" ||
      value === "CRITICO" ||
      value === "CRÍTICO"
    ) {
      return "danger"
    }

    if (
      value === "ADVERTENCIA" ||
      value === "MEDIO"
    ) {
      return "warning"
    }

    return "info"
  }


const getNotificationIcon =
  nivel => {
    const level =
      getNotificationClass(nivel)

    if (level === "danger") {
      return "bi bi-exclamation-triangle-fill"
    }

    if (level === "warning") {
      return "bi bi-exclamation-circle-fill"
    }

    return "bi bi-info-circle-fill"
  }


const formatNotificationDate =
  value => {
    if (!value) return ""

    const isDateOnly =
      /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    const date = isDateOnly
      ? new Date(`${value}T12:00:00`)
      : new Date(value)

    if (Number.isNaN(date.getTime())) {
      return ""
    }

    return new Intl.DateTimeFormat("es-MX", {
      ...(isDateOnly
        ? { dateStyle: "short" }
        : {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: "America/Mexico_City",
          }),
    }).format(date)
  }


/* ============================================================
   ADMINISTRADOR
============================================================ */

const adminName =
  computed(() => {
    const nombre =
      props.admin?.nombre ||
      ''

    const paterno =
      props.admin
        ?.apellido_paterno ||
      ''

    const materno =
      props.admin
        ?.apellido_materno ||
      ''

    const fullName = `
      ${nombre}
      ${paterno}
      ${materno}
    `
      .replace(
        /\s+/g,
        ' '
      )
      .trim()

    return (
      fullName ||
      'Administrador'
    )
  })


const adminEmail =
  computed(() => {
    return (
      props.admin?.correo ||
      props.admin?.email ||
      'Sin correo'
    )
  })


const adminInitials =
  computed(() => {
    const words =
      adminName.value
        .split(' ')
        .filter(Boolean)

    if (!words.length) {
      return 'AD'
    }

    if (
      words.length === 1
    ) {
      return words[0]
        .substring(
          0,
          2
        )
        .toUpperCase()
    }

    return (
      words[0][0] +
      words[1][0]
    ).toUpperCase()
  })


/* ============================================================
   TÍTULO DE SECCIÓN
============================================================ */

const sectionTitle =
  computed(() => {
    const titles = {
      inicio:
        'Panel principal',

      personal:
        'Personal',

      clientes:
        'Clientes',

      vehiculos:
        'Vehículos',

      servicios:
        'Servicios y mantenimiento',

      mantenimiento:
        'Mantenimiento preventivo',

      catalogos:
        'Catálogos',

      alertas:
        'Alertas',

      reportes:
        'Reportes'
    }

    return (
      titles[
        activeSection.value
      ] ||
      'Panel principal'
    )
  })


/* ============================================================
   DESCRIPCIÓN DE SECCIÓN
============================================================ */

const sectionDescription =
  computed(() => {
    const descriptions = {
      inicio:
        'Resumen general del taller',

      personal:
        'Administración del personal',

      clientes:
        'Administración de clientes',

      vehiculos:
        'Administración de vehículos',

      servicios:
        'Servicios, mantenimiento e inspección de llantas',

      mantenimiento:
        'Programación y seguimiento preventivo por kilometraje',

      catalogos:
        'Configuración de catálogos del sistema',

      alertas:
        'Acciones del mecánico y seguimiento de citas',

      reportes:
        'Generación y exportación de reportes'
    }

    return (
      descriptions[
        activeSection.value
      ] ||
      'Sistema administrativo'
    )
  })


/* ============================================================
   CAMBIAR SECCIÓN
============================================================ */

const changeSection =
  section => {
    activeSection.value =
      section

    pendingAction.value =
      null

    sidebarOpen.value =
      false

    showUserMenu.value =
      false

    showNotificationsDropdown.value =
      false

  }


/* ============================================================
   NAVEGACIÓN DESDE INICIO
============================================================ */

const handleNavigation =
  payload => {
    if (
      typeof payload ===
      'string'
    ) {
      changeSection(
        payload
      )

      return
    }

    changeSection(
      payload.section
    )

    pendingAction.value = {
      type:
        payload.action,

      token:
        Date.now()
    }

    sidebarOpen.value =
      false
  }

/* ============================================================
   LIMPIAR ACCIÓN
============================================================ */

const clearPendingAction =
  () => {
    pendingAction.value =
      null
  }


/* ============================================================
   RELOJ
============================================================ */

const updateClock =
  () => {
    const now =
      new Date()

    currentDate.value =
      new Intl.DateTimeFormat(
        'es-MX',
        {
          day:
            '2-digit',

          month:
            'short',

          year:
            'numeric'
        }
      ).format(
        now
      )

    currentTime.value =
      new Intl.DateTimeFormat(
        'es-MX',
        {
          hour:
            '2-digit',

          minute:
            '2-digit',

          second:
            '2-digit'
        }
      ).format(
        now
      )
  }


/* ============================================================
   CERRAR SESIÓN
============================================================ */

const logout =
  async () => {
    showUserMenu.value =
      false

    try {
      const {
        error
      } =
        await supabase
          .auth
          .signOut()

      if (error) {
        console.error(
          'Error cerrando sesión:',
          error
        )
      }
    } catch (error) {
      console.error(
        'Error al cerrar sesión:',
        error
      )
    } finally {
      emit(
        'logout'
      )
    }
  }


/* ============================================================
   CLICK GLOBAL
============================================================ */

const handleGlobalClick =
  event => {
    const target = event?.target

    if (!(target instanceof Node)) {
      showUserMenu.value = false
      showNotificationsDropdown.value = false
      return
    }

    const path = typeof event.composedPath === 'function'
      ? event.composedPath()
      : []

    const clickedInsideUserMenu = path.some(
      node =>
        node instanceof Element &&
        node.closest('.profile-wrapper')
    ) || target.closest('.profile-wrapper')

    const clickedInsideAlerts = path.some(
      node =>
        node instanceof Element &&
        node.closest('.alerts-wrapper')
    ) || target.closest('.alerts-wrapper')

    if (!clickedInsideUserMenu) {
      showUserMenu.value = false
    }

    if (!clickedInsideAlerts) {
      showNotificationsDropdown.value = false
    }
  }


/* ============================================================
   MOUNT
============================================================ */

onMounted(
  () => {
    updateClock()

    clockInterval =
      setInterval(
        updateClock,
        1000
      )

    obtenerContadorAlertas()
      .then(
        total => {
          alertCount.value =
            total
        }
      )
      .catch(
        error => {
          console.error(
            'Error cargando contador de alertas:',
            error
          )
        }
      )

    adminAlertChannel = supabase
      .channel('admin-dashboard-mechanic-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerta',
          filter: 'tipo_alerta=eq.ACCION_MECANICO'
        },
        async payload => {
          try {
            alertCount.value =
              await obtenerContadorAlertas()

            if (showNotificationsDropdown.value) {
              await cargarNotificacionesRecientes()
            }

            if (
              activeSection.value !== 'alertas' &&
              payload.new?.tipo_alerta === 'ACCION_MECANICO'
            ) {
              liveNotification.value =
                payload.new.mensaje || 'Un mecánico registró una acción.'

              if (liveNotificationTimeout) {
                clearTimeout(liveNotificationTimeout)
              }

              liveNotificationTimeout = setTimeout(() => {
                liveNotification.value = ''
                liveNotificationTimeout = null
              }, 10000)
            }
          } catch (error) {
            console.error(
              'Error actualizando las notificaciones del mecánico:',
              error
            )
          }
        }
      )
      .subscribe()

    document.addEventListener(
      'pointerdown',
      handleGlobalClick
    )
  }
)


/* ============================================================
   UNMOUNT
============================================================ */

onBeforeUnmount(
  () => {
    unlockDashboardScroll()

    restoreMobileThemeColor()

    if (clockInterval) {
      clearInterval(
        clockInterval
      )
    }

    if (adminAlertChannel) {
      supabase.removeChannel(adminAlertChannel)
      adminAlertChannel = null
    }

    if (liveNotificationTimeout) {
      clearTimeout(liveNotificationTimeout)
      liveNotificationTimeout = null
    }

    document.removeEventListener(
      'pointerdown',
      handleGlobalClick
    )
  }
)
</script>


<style scoped>
/* ============================================================
   DROPDOWN DE NOTIFICACIONES
============================================================ */

.alerts-wrapper {
  position: relative;
}

.notifications-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 360px;
  max-width: calc(100vw - 24px);
  background: var(--admin-card, #ffffff);
  border: 1px solid var(--admin-border, #e2e8f0);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  z-index: 200;
  overflow: hidden;
}

.notifications-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--admin-border, #e2e8f0);
}

.notifications-header > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notifications-header strong {
  font-size: 14px;
}

.notifications-header span {
  font-size: 12px;
  opacity: 0.7;
}

.mark-all-read {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  color: var(--admin-primary, #2563eb);
  font-size: 16px;
}

.mark-all-read:hover {
  background: var(--admin-secondary, #f1f5f9);
}

.notifications-loading,
.notifications-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  text-align: center;
  color: var(--admin-text-secondary, #64748b);
  font-size: 13px;
}

.notifications-empty i {
  font-size: 28px;
  opacity: 0.5;
}

.notifications-list {
  max-height: 340px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--admin-border, #f1f5f9);
  cursor: pointer;
  transition: background 0.15s ease;
}

.notification-item:hover {
  background: var(--admin-secondary, #f8fafc);
}

.notification-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
}

.notification-item.danger .notification-icon {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.notification-item.warning .notification-icon {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.notification-item.info .notification-icon {
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}

.notification-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.notification-body strong {
  font-size: 13px;
  text-transform: capitalize;
}

.notification-body p {
  margin: 0;
  font-size: 12px;
  opacity: 0.8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-body small {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 4px;
}

.notifications-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  border-top: 1px solid var(--admin-border, #e2e8f0);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--admin-primary, #2563eb);
}

.notifications-footer:hover {
  background: var(--admin-secondary, #f1f5f9);
}

.admin-live-notification {
  position: fixed;
  z-index: 1200;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(520px, calc(100vw - 32px));
  padding: 14px 16px;
  border: 1px solid var(--admin-border, #e2e8f0);
  border-radius: 14px;
  background: var(--admin-card, #fff);
  color: var(--admin-text, #0f172a);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.2);
}

.admin-live-notification > i {
  flex: 0 0 auto;
  color: var(--admin-primary, #2563eb);
}

.admin-live-notification > span {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  line-height: 1.45;
}

.admin-live-notification button {
  flex: 0 0 auto;
  padding: 6px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--admin-primary, #2563eb);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.admin-live-notification button:last-child {
  color: var(--admin-text-secondary, #64748b);
}

@media (max-width: 768px) {
  .admin-live-notification {
    top: max(12px, env(safe-area-inset-top, 0px));
    right: max(12px, env(safe-area-inset-right, 0px));
    width: auto;
    left: max(12px, env(safe-area-inset-left, 0px));
  }

  .alerts-wrapper {
    position: static;
  }

  .notifications-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: max(12px, env(safe-area-inset-right, 0px));
    left: max(12px, env(safe-area-inset-left, 0px));
    width: auto;
    max-width: none;
  }
}
</style>