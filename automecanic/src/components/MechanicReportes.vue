<template>
  <div class="mechanic-report-module">
    <section class="mechanic-stats">
      <article v-for="stat in reportStats" :key="stat.label" class="mechanic-stat-card">
        <div class="mechanic-stat-icon"><i :class="stat.icon"></i></div>
        <div>
          <span>{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
          <small>{{ stat.note }}</small>
        </div>
      </article>
    </section>

    <div v-if="loading" class="mechanic-report-state" role="status">
      <i class="bi bi-arrow-repeat mechanic-spin"></i>
      Cargando resumen de actividad...
    </div>
    <div v-else-if="errorMessage" class="mechanic-report-state is-error" role="alert">
      {{ errorMessage }}
    </div>

    <AdminReportes
      :mechanic-id="mechanic?.id_mecanico"
      :mechanic="mechanic"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AdminReportes from './AdminReportes.vue'
import {
  obtenerReporte,
  obtenerVehiculosReporte
} from '../services/reporteService.js'

const props = defineProps({
  mechanic: {
    type: Object,
    default: () => ({})
  }
})

const loading = ref(false)
const errorMessage = ref('')
const servicesThisYear = ref([])
let requestId = 0

const reportStats = computed(() => {
  const serviceIds = new Set(
    servicesThisYear.value.map(service => String(service.id_servicio))
  )
  const vehicleIds = new Set(
    servicesThisYear.value.map(service => String(service.id_vehiculo))
  )
  const maintenanceCount = servicesThisYear.value.filter(service =>
    Boolean(service.motor || service.transmision || service.llantas?.length)
  ).length
  const year = new Date().getFullYear()

  return [
    {
      label: 'Servicios realizados',
      value: serviceIds.size,
      note: `Durante ${year}`,
      icon: 'bi bi-wrench-adjustable-circle'
    },
    {
      label: 'Unidades atendidas',
      value: vehicleIds.size,
      note: `Durante ${year}`,
      icon: 'bi bi-truck'
    },
    {
      label: 'Mantenimientos',
      value: maintenanceCount,
      note: `Durante ${year}`,
      icon: 'bi bi-clipboard2-pulse'
    }
  ]
})

async function loadReportStats() {
  const mechanicId = props.mechanic?.id_mecanico
  const currentRequest = ++requestId

  if (!mechanicId) {
    servicesThisYear.value = []
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const vehicles = await obtenerVehiculosReporte(mechanicId)
    if (currentRequest !== requestId) return

    const vehicleIds = vehicles.map(vehicle => vehicle.id_vehiculo)
    if (!vehicleIds.length) {
      servicesThisYear.value = []
      return
    }

    const yearReport = await obtenerReporte({
      anio: String(new Date().getFullYear()),
      idVehiculos: vehicleIds,
      idMecanico: mechanicId
    })

    if (currentRequest !== requestId) return

    servicesThisYear.value = yearReport.servicios || []
  } catch (error) {
    if (currentRequest !== requestId) return
    console.error('Error cargando los reportes del mecánico:', error)
    errorMessage.value = 'No fue posible consultar tus reportes. Intenta actualizar la página.'
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

watch(
  () => props.mechanic?.id_mecanico,
  loadReportStats,
  { immediate: true }
)
</script>
