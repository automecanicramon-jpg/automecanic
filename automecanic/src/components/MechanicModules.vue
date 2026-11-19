<template>
  <div class="mechanic-module">
    <section class="mechanic-module-intro">
      <div>
        <span class="mechanic-eyebrow">{{ config.eyebrow }}</span>
        <h2>{{ config.title }}</h2>
        <p>{{ config.description }}</p>
      </div>
      <div class="mechanic-module-intro-icon">
        <i :class="config.icon"></i>
      </div>
    </section>

    <template v-if="section === 'servicios'">
      <section class="mechanic-stats">
        <article
          v-for="stat in serviceStats"
          :key="stat.label"
          class="mechanic-stat-card"
        >
          <div class="mechanic-stat-icon"><i :class="stat.icon"></i></div>
          <div><span>{{ stat.label }}</span><strong>{{ stat.value }}</strong><small>{{ stat.note }}</small></div>
        </article>
      </section>

      <section class="mechanic-panel">
        <div class="mechanic-panel-heading">
          <div><h3>Servicios recientes</h3><p>Seguimiento de los trabajos realizados en el taller.</p></div>
          <button class="mechanic-primary-button" type="button">
            <i class="bi bi-plus-lg"></i> Nuevo servicio
          </button>
        </div>
        <div class="mechanic-table-scroll">
          <table class="mechanic-history-table">
            <thead>
              <tr><th>Orden</th><th>Vehículo</th><th>Tipo de servicio</th><th>Fecha</th><th>Estado</th></tr>
            </thead>
            <tbody>
              <tr v-for="service in services" :key="service.id">
                <td><strong>{{ service.id }}</strong></td>
                <td><strong>{{ service.vehicle }}</strong><small>{{ service.plate }}</small></td>
                <td>{{ service.type }}</td>
                <td>{{ service.date }}</td>
                <td><span class="mechanic-status-pill" :class="service.statusClass">{{ service.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="mechanic-panel mechanic-service-flow">
        <div class="mechanic-panel-heading">
          <div><h3>Flujo de trabajo</h3><p>Etapas generales para dar seguimiento a cada servicio.</p></div>
        </div>
        <div class="mechanic-flow-steps">
          <div v-for="step in workflow" :key="step.label" class="mechanic-flow-step">
            <span class="mechanic-flow-icon"><i :class="step.icon"></i></span>
            <div><strong>{{ step.label }}</strong><small>{{ step.note }}</small></div>
          </div>
        </div>
      </section>
    </template>

    <template v-else-if="section === 'mantenimiento'">
      <section class="mechanic-stats">
        <article v-for="stat in maintenanceStats" :key="stat.label" class="mechanic-stat-card">
          <div class="mechanic-stat-icon"><i :class="stat.icon"></i></div>
          <div><span>{{ stat.label }}</span><strong>{{ stat.value }}</strong><small>{{ stat.note }}</small></div>
        </article>
      </section>

      <section class="mechanic-panel">
        <div class="mechanic-panel-heading">
          <div><h3>Próximos mantenimientos</h3><p>Unidades que requieren atención preventiva.</p></div>
          <span class="mechanic-count-pill">Agenda de ejemplo</span>
        </div>
        <div class="mechanic-maintenance-list">
          <article v-for="item in maintenance" :key="item.vehicle" class="mechanic-maintenance-row">
            <div class="mechanic-vehicle-icon"><i class="bi bi-truck-front"></i></div>
            <div class="mechanic-maintenance-main">
              <strong>{{ item.vehicle }}</strong>
              <span>{{ item.task }} · {{ item.plate }}</span>
              <div class="mechanic-progress-track"><span :style="{ width: `${item.progress}%` }"></span></div>
            </div>
            <div class="mechanic-maintenance-due">
              <span :class="item.dueClass"><i :class="item.dueIcon"></i> {{ item.due }}</span>
              <small>{{ item.kilometers }}</small>
            </div>
          </article>
        </div>
      </section>
    </template>

    <template v-else-if="section === 'alertas'">
      <MechanicAlertas
        :mechanic="mechanic"
        @alert-count="emit('alert-count', $event)"
      />
    </template>

    <MechanicReportes v-else :mechanic="mechanic" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MechanicAlertas from './MechanicAlertas.vue'
import MechanicReportes from './MechanicReportes.vue'

const props = defineProps({
  section: {
    type: String,
    required: true
  },
  mechanic: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['alert-count'])

const mechanic = computed(() => props.mechanic)

const configurations = {
  servicios: {
    eyebrow: 'OPERACIÓN DEL TALLER',
    title: 'Servicios y mantenimiento',
    description: 'Organiza los servicios y revisa el progreso de las unidades a tu cargo.',
    icon: 'bi bi-wrench-adjustable-circle'
  },
  mantenimiento: {
    eyebrow: 'CUIDADO DE UNIDADES',
    title: 'Mantenimiento preventivo',
    description: 'Da seguimiento a las próximas revisiones y necesidades preventivas.',
    icon: 'bi bi-speedometer2'
  },
  alertas: {
    eyebrow: 'CENTRO DE NOTIFICACIONES',
    title: 'Alertas',
    description: 'Mantente al tanto de los recordatorios y novedades del taller.',
    icon: 'bi bi-bell'
  },
  reportes: {
    eyebrow: 'RESUMEN DE ACTIVIDAD',
    title: 'Reportes',
    description: 'Consulta una vista general de los servicios y del trabajo realizado.',
    icon: 'bi bi-file-earmark-bar-graph'
  }
}

const config = computed(() => configurations[props.section] || configurations.servicios)

const serviceStats = [
  { label: 'Servicios asignados', value: '08', note: 'Periodo actual', icon: 'bi bi-clipboard2-check' },
  { label: 'En proceso', value: '03', note: 'Requieren seguimiento', icon: 'bi bi-arrow-repeat' },
  { label: 'Completados', value: '05', note: 'Este mes', icon: 'bi bi-check2-circle' }
]

const services = [
  { id: 'OS-1048', vehicle: 'Nissan NP300 2022', plate: 'ABC-123-A', type: 'Servicio preventivo', date: '06 oct 2026', status: 'En proceso', statusClass: 'is-progress' },
  { id: 'OS-1039', vehicle: 'Toyota Hilux 2021', plate: 'XYZ-789-B', type: 'Cambio de aceite y filtros', date: '02 oct 2026', status: 'Completado', statusClass: 'is-complete' },
  { id: 'OS-1027', vehicle: 'Ford Transit 2023', plate: 'DEF-456-C', type: 'Inspección general', date: '27 sep 2026', status: 'Programado', statusClass: 'is-scheduled' }
]

const workflow = [
  { label: 'Recepción', note: 'Registro de la unidad', icon: 'bi bi-car-front' },
  { label: 'Diagnóstico', note: 'Revisión inicial', icon: 'bi bi-search' },
  { label: 'Reparación', note: 'Trabajo en taller', icon: 'bi bi-tools' },
  { label: 'Entrega', note: 'Servicio concluido', icon: 'bi bi-check2-circle' }
]

const maintenanceStats = [
  { label: 'Próximos servicios', value: '04', note: 'En el periodo cercano', icon: 'bi bi-calendar2-week' },
  { label: 'Requieren atención', value: '02', note: 'Dentro de 1,000 km', icon: 'bi bi-exclamation-circle' },
  { label: 'Al corriente', value: '06', note: 'Sin pendientes próximos', icon: 'bi bi-check-circle' }
]

const maintenance = [
  { vehicle: 'Nissan NP300 2022', plate: 'ABC-123-A', task: 'Cambio de aceite y filtros', progress: 84, due: 'Próximo', dueClass: 'due-soon', dueIcon: 'bi bi-clock', kilometers: 'En 750 km' },
  { vehicle: 'Toyota Hilux 2021', plate: 'XYZ-789-B', task: 'Revisión de frenos', progress: 96, due: 'Atención', dueClass: 'due-now', dueIcon: 'bi bi-exclamation-circle', kilometers: 'En 180 km' },
  { vehicle: 'Ford Transit 2023', plate: 'DEF-456-C', task: 'Afinación preventiva', progress: 52, due: 'Programado', dueClass: 'due-later', dueIcon: 'bi bi-calendar3', kilometers: 'En 2,400 km' }
]

</script>
