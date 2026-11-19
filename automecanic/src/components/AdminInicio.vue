<template>
  <div class="admin-home">
    <!-- ======================================================
         BIENVENIDA
    ======================================================= -->
    <section class="welcome-card admin-home-welcome">
      <div>
        <span class="welcome-label">
          PANEL ADMINISTRATIVO
        </span>

        <h2>
          Hola, {{ firstName }}
        </h2>

        <p>
          Supervisa el personal, clientes,
          vehículos, servicios y mantenimiento
          desde un solo lugar.
        </p>
      </div>

      <div class="welcome-icon">
      <img
      src="../assets/logo-claro.jpg"
      alt="Logo Automecanic"
      class="welcome-company-logo"
      />
</div>
    </section>

    <!-- ======================================================
         ESTADÍSTICAS
    ======================================================= -->
    <section class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon blue">
          <i class="bi bi-people"></i>
        </div>

        <div>
          <span>Personal</span>

          <strong>
            {{ resumen.personal.length }}
          </strong>

          <small>
            Mecánicos registrados
          </small>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon green">
          <i class="bi bi-person-vcard"></i>
        </div>

        <div>
          <span>Clientes</span>

          <strong>
            {{ resumen.clientes.length }}
          </strong>

          <small>
            Clientes registrados
          </small>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon orange">
          <i class="bi bi-car-front"></i>
        </div>

        <div>
          <span>Vehículos</span>

          <strong>
            {{ resumen.vehiculos.length }}
          </strong>

          <small>
            Unidades registradas
          </small>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon purple">
          <i class="bi bi-wrench-adjustable"></i>
        </div>

        <div>
          <span>Servicios</span>

          <strong>
            {{ resumen.servicios.length }}
          </strong>

          <small>
            Servicios registrados
          </small>
        </div>
      </article>
    </section>

    <!-- ======================================================
         ACCIONES RÁPIDAS
    ======================================================= -->
    <section class="section-card admin-home-actions">
      <div class="section-card-header">
        <div>
          <h3>Acciones rápidas</h3>

          <p>
            Accede a las operaciones
            principales del sistema.
          </p>
        </div>
      </div>

      <div class="quick-actions-grid">
        <button
          type="button"
          class="quick-action-card"
          @click="navigateTo('personal', 'new')"
        >
          <div class="quick-action-icon blue">
            <i class="bi bi-person-plus"></i>
          </div>

          <div>
            <strong>
              Registrar personal
            </strong>

            <span>
              Agregar un nuevo mecánico
            </span>
          </div>

          <i class="bi bi-chevron-right"></i>
        </button>

        <button
          type="button"
          class="quick-action-card"
          @click="navigateTo('clientes', 'new')"
        >
          <div class="quick-action-icon green">
            <i class="bi bi-person-vcard"></i>
          </div>

          <div>
            <strong>
              Registrar cliente
            </strong>

            <span>
              Agregar un nuevo cliente
            </span>
          </div>

          <i class="bi bi-chevron-right"></i>
        </button>

        <button
          type="button"
          class="quick-action-card"
          @click="navigateTo('vehiculos', 'new')"
        >
          <div class="quick-action-icon orange">
            <i class="bi bi-car-front"></i>
          </div>

          <div>
            <strong>
              Registrar vehículo
            </strong>

            <span>
              Agregar unidad y asignar mecánico
            </span>
          </div>

          <i class="bi bi-chevron-right"></i>
        </button>

        <button
          type="button"
          class="quick-action-card"
          @click="navigateTo('servicios', 'new')"
        >
          <div class="quick-action-icon purple">
            <i class="bi bi-wrench-adjustable-circle"></i>
          </div>

          <div>
            <strong>
              Nuevo servicio
            </strong>

            <span>
              Servicio y mantenimiento
            </span>
          </div>

          <i class="bi bi-chevron-right"></i>
        </button>

        <button
          type="button"
          class="quick-action-card"
          @click="navigateTo('alertas')"
        >
          <div class="quick-action-icon red">
            <i class="bi bi-bell"></i>
          </div>

          <div>
            <strong>
              Revisar alertas
            </strong>

            <span>
              Actividad y citas
            </span>
          </div>

          <i class="bi bi-chevron-right"></i>
        </button>

        <button
          type="button"
          class="quick-action-card"
          @click="navigateTo('reportes')"
        >
          <div class="quick-action-icon cyan">
            <i class="bi bi-file-earmark-bar-graph"></i>
          </div>

          <div>
            <strong>
              Generar reporte
            </strong>

            <span>
              PDF o Word
            </span>
          </div>

          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </section>

    <!-- ======================================================
         VEHÍCULOS RECIENTES
    ======================================================= -->
    <section class="section-card admin-home-vehicles">
      <div class="section-card-header admin-home-vehicles-header">
        <div>
          <h3>
            Vehículos recientes
          </h3>

          <p>
            Últimas unidades registradas.
          </p>
        </div>

        <button
          class="outline-button"
          type="button"
          @click="navigateTo('vehiculos')"
        >
          Ver todos

          <i class="bi bi-arrow-right"></i>
        </button>
      </div>

      <div
        v-if="loading"
        class="component-loading"
      >
        <div class="app-spinner"></div>

        <span>
          Cargando información...
        </span>
      </div>

      <div
        v-else-if="recentVehicles.length"
        class="admin-home-vehicles-content"
      >
        <div class="table-wrapper admin-home-vehicles-table">
          <table class="data-table">
            <thead>
              <tr>
                  <th>No. económico</th>
                  <th>Placas</th>
                  <th>Vehículo</th>
                  <th>Tipo</th>
                  <th>Kilometraje</th>
                  <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              <tr
                  v-for="vehicle in recentVehicles"
                  :key="vehicle.id_vehiculo"
              >
                  <td>
                    <strong>
                      {{
                        vehicle.no_economico ||
                        '—'
                      }}
                    </strong>
                  </td>

                  <td>
                    <span class="plate-badge">
                      {{ vehicle.placas }}
                    </span>
                  </td>

                  <td>
                    <div class="vehicle-table-cell">
                      <div class="table-vehicle-icon">
                        <i
                          :class="
                            getVehicleIcon(
                              vehicle.tipo_unidad
                            )
                          "
                        ></i>
                      </div>

                      <div>
                        <strong>
                          {{ vehicle.marca }}
                        </strong>

                        <small>
                          {{ vehicle.modelo }}
                          {{
                            vehicle.anio_modelo
                              ? `· ${vehicle.anio_modelo}`
                              : ''
                          }}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td>
                    {{
                      vehicle.tipo_unidad ||
                      'No especificado'
                    }}
                  </td>

                  <td>
                    {{
                      formatKilometers(
                        vehicle.kilometraje_actual
                      )
                    }}
                  </td>

                  <td>
                    <span
                      class="status-badge"
                      :class="
                        getStatusClass(
                          vehicle.estatus
                        )
                      "
                    >
                      {{
                        vehicle.estatus ||
                        'Activo'
                      }}
                    </span>
                  </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="admin-home-vehicles-mobile-list">
          <article
            v-for="vehicle in recentVehicles"
            :key="`mobile-${vehicle.id_vehiculo}`"
            class="admin-home-vehicle-card"
          >
            <div class="admin-home-vehicle-card-heading">
              <span class="table-vehicle-icon">
                  <i :class="getVehicleIcon(vehicle.tipo_unidad)"></i>
              </span>
              <div>
                  <strong>
                    {{ vehicle.marca || 'Vehículo' }}
                    {{ vehicle.modelo || '' }}
                    {{
                      vehicle.anio_modelo
                        ? `· ${vehicle.anio_modelo}`
                        : ''
                    }}
                  </strong>
                  <span class="plate-badge">
                    {{ vehicle.placas || 'Sin placas' }}
                  </span>
              </div>
              <span
                  class="status-badge"
                  :class="getStatusClass(vehicle.estatus)"
              >
                  {{ vehicle.estatus || 'Activo' }}
              </span>
            </div>

            <div class="admin-home-vehicle-card-details">
              <div>
                  <span>No. económico</span>
                  {{
                    vehicle.no_economico ||
                    '—'
                  }}
              </div>
              <div>
                  <span>Tipo</span>
                  {{ vehicle.tipo_unidad || 'No especificado' }}
              </div>
              <div>
                  <span>Kilometraje</span>
                  {{ formatKilometers(vehicle.kilometraje_actual) }}
              </div>
            </div>
          </article>
        </div>
      </div>

      <div
        v-else
        class="empty-state"
      >
        <i class="bi bi-car-front"></i>

        <h4>
          No hay vehículos registrados
        </h4>

        <p>
          Cuando registres una unidad
          aparecerá aquí.
        </p>

        <button
          class="primary-button"
          type="button"
          @click="navigateTo('vehiculos', 'new')"
        >
          <i class="bi bi-plus-lg"></i>
          Registrar vehículo
        </button>
      </div>
    </section>

    <!-- ======================================================
         ERROR
    ======================================================= -->
    <div
      v-if="errorMessage"
      class="app-alert danger"
    >
      <i class="bi bi-exclamation-triangle"></i>

      <span>
        {{ errorMessage }}
      </span>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  onMounted,
  ref
} from 'vue'

import {
  obtenerResumenDashboard
} from '../services/dashboardService.js'

const props = defineProps({
  admin: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'navigate'
])

const loading = ref(false)

const errorMessage = ref('')

const resumen = ref({
  personal: [],
  clientes: [],
  vehiculos: [],
  servicios: [],
  alertas: []
})

const firstName = computed(() => {
  return (
    props.admin?.nombre ||
    'Administrador'
  )
})

const recentVehicles = computed(() => {
  return resumen.value.vehiculos
    .slice(0, 5)
})

const loadDashboard = async () => {
  loading.value = true

  errorMessage.value = ''

  try {
    resumen.value =
      await obtenerResumenDashboard()
  } catch (error) {
    console.error(
      'Error cargando dashboard:',
      error
    )

    errorMessage.value =
      error?.message ||
      'No fue posible cargar la información.'
  } finally {
    loading.value = false
  }
}

const navigateTo = (
  section,
  action = null
) => {
  if (action) {
    emit(
      'navigate',
      {
        section,
        action
      }
    )

    return
  }

  emit(
    'navigate',
    section
  )
}

const formatKilometers = value => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—'
  }

  return (
    new Intl.NumberFormat(
      'es-MX'
    ).format(
      Number(value)
    ) + ' km'
  )
}

const getStatusClass = status => {
  const normalized =
    String(
      status || ''
    )
      .trim()
      .toLowerCase()

  if (
    normalized === 'activo' ||
    normalized === 'activa'
  ) {
    return 'active'
  }

  return 'inactive'
}

const getVehicleIcon = type => {
  const normalized =
    String(type || '')
      .toLowerCase()

  if (
    normalized.includes('moto')
  ) {
    return 'bi bi-bicycle'
  }

  if (
    normalized.includes('camión') ||
    normalized.includes('camion')
  ) {
    return 'bi bi-truck'
  }

  return 'bi bi-car-front'
}

onMounted(() => {
  loadDashboard()
})
</script>