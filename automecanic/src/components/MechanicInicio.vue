<template>
  <div class="mechanic-home">
    <section class="mechanic-welcome">
      <div>
        <span class="mechanic-eyebrow">ESPACIO DEL MECÁNICO</span>
        <h2>Hola, {{ firstName }}</h2>
        <p>
          Consulta tus vehículos asignados y el trabajo que has registrado
          desde un solo lugar.
        </p>
      </div>
      <div class="mechanic-welcome-mark" aria-hidden="true">
        <i class="bi bi-tools"></i>
      </div>
    </section>

    <section class="mechanic-stats" aria-label="Resumen de actividad">
      <article class="mechanic-stat-card">
        <div class="mechanic-stat-icon">
          <i class="bi bi-car-front-fill"></i>
        </div>
        <div>
          <span>Vehículos asignados</span>
          <strong>{{ loading || error ? '—' : vehicles.length }}</strong>
          <small>En tu espacio de trabajo</small>
        </div>
      </article>

      <article class="mechanic-stat-card">
        <div class="mechanic-stat-icon">
          <i class="bi bi-wrench-adjustable-circle"></i>
        </div>
        <div>
          <span>Servicios registrados</span>
          <strong>{{ loading || error ? '—' : services.length }}</strong>
          <small>En tu historial</small>
        </div>
      </article>

      <article class="mechanic-stat-card">
        <div class="mechanic-stat-icon">
          <i class="bi bi-calendar-check"></i>
        </div>
        <div>
          <span>Último servicio</span>
          <strong class="mechanic-stat-date">
            {{ loading || error ? '—' : formatDate(services[0]?.fecha_servicio) }}
          </strong>
          <small>Registro más reciente</small>
        </div>
      </article>
    </section>

    <section class="mechanic-overview-grid">
      <div
        v-if="error"
        class="alert alert-danger d-flex align-items-center justify-content-between gap-3 w-100"
        role="alert"
      >
        <span>{{ error }}</span>
        <button
          type="button"
          class="btn btn-sm btn-outline-danger flex-shrink-0"
          @click="$emit('retry')"
        >
          Reintentar
        </button>
      </div>

      <article class="mechanic-panel">
        <div class="mechanic-panel-heading">
          <div>
            <h3>Mis vehículos</h3>
            <p>Unidades asignadas a tu cuenta</p>
          </div>
          <button type="button" class="mechanic-link-button" @click="$emit('navigate', 'vehiculos')">
            Ver todos <i class="bi bi-arrow-right"></i>
          </button>
        </div>

        <div v-if="loading" class="mechanic-loading">
          <span class="mechanic-spinner"></span>
          <span>Cargando vehículos...</span>
        </div>
        <div v-else-if="!vehicles.length" class="mechanic-empty">
          <i class="bi bi-car-front"></i>
          <strong>Aún no tienes vehículos asignados</strong>
          <span>Cuando se te asigne una unidad aparecerá en esta sección.</span>
        </div>
        <div v-else class="mechanic-vehicle-list">
          <article
            v-for="vehicle in vehicles.slice(0, 4)"
            :key="vehicle.id_vehiculo"
            class="mechanic-vehicle-row"
          >
            <div class="mechanic-vehicle-icon">
              <i class="bi bi-truck-front"></i>
            </div>
            <div class="mechanic-vehicle-info">
              <strong>{{ vehicleName(vehicle) }}</strong>
              <span>{{ vehicle.placas || 'Sin placas' }}</span>
            </div>
            <span class="mechanic-vehicle-km">
              {{ formatKilometers(vehicle.kilometraje_actual) }}
            </span>
          </article>
        </div>
      </article>

      <article class="mechanic-panel">
        <div class="mechanic-panel-heading">
          <div>
            <h3>Actividad reciente</h3>
            <p>Tus últimos servicios registrados</p>
          </div>
          <button type="button" class="mechanic-link-button" @click="$emit('navigate', 'servicios')">
            Servicios <i class="bi bi-arrow-right"></i>
          </button>
        </div>

        <div v-if="loading" class="mechanic-loading">
          <span class="mechanic-spinner"></span>
          <span>Cargando actividad...</span>
        </div>
        <div v-else-if="!services.length" class="mechanic-empty">
          <i class="bi bi-clipboard2-check"></i>
          <strong>Sin servicios registrados</strong>
          <span>Los servicios asociados a tu cuenta aparecerán aquí.</span>
        </div>
        <div v-else class="mechanic-service-list">
          <article
            v-for="service in services.slice(0, 4)"
            :key="service.id_servicio"
            class="mechanic-service-row"
          >
            <div class="mechanic-service-indicator">
              <i class="bi bi-check2"></i>
            </div>
            <div class="mechanic-service-info">
              <strong>{{ vehicleForService(service.id_vehiculo) }}</strong>
              <span>{{ service.observaciones_generales || 'Servicio registrado' }}</span>
            </div>
            <time>{{ formatDate(service.fecha_servicio) }}</time>
          </article>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  mechanic: {
    type: Object,
    default: () => ({})
  },
  vehicles: {
    type: Array,
    default: () => []
  },
  services: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

defineEmits(['navigate', 'retry'])

const firstName = computed(() => props.mechanic?.nombre?.trim().split(/\s+/)[0] || 'mecánico')

const formatDate = value => {
  if (!value) return 'Sin registros'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible'

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const formatKilometers = value => {
  if (value === null || value === undefined || value === '') return 'Km no registrados'
  const kilometers = Number(value)
  return Number.isFinite(kilometers)
    ? `${new Intl.NumberFormat('es-MX').format(kilometers)} km`
    : 'Km no registrados'
}

const vehicleName = vehicle =>
  [vehicle.marca, vehicle.modelo, vehicle.anio_modelo].filter(Boolean).join(' ') ||
  `Vehículo #${vehicle.id_vehiculo}`

const vehicleForService = idVehicle => {
  const vehicle = props.vehicles.find(item => item.id_vehiculo === idVehicle)
  return vehicle ? vehicleName(vehicle) : `Vehículo #${idVehicle}`
}
</script>
