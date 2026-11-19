<template>
  <div class="mechanic-vehicles">
    <div v-if="errorMessage" class="app-alert danger" role="alert">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>{{ errorMessage }}</span>
      <button
        class="alert-close-button"
        type="button"
        aria-label="Cerrar mensaje"
        @click="errorMessage = ''"
      >
        <i class="bi bi-x"></i>
      </button>
    </div>

    <div class="page-toolbar">
      <div>
        <h2>Vehículos</h2>
        <p>Consulta las unidades que el administrador te ha asignado y quiénes son sus dueños.</p>
      </div>

      <div class="page-toolbar-actions">
        <button
          class="outline-button"
          type="button"
          :disabled="loading"
          @click="loadVehicles"
        >
          <i
            class="bi"
            :class="loading ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'"
          ></i>
          Actualizar
        </button>
      </div>
    </div>

    <div class="mini-stats-grid">
      <article class="mini-stat-card">
        <div class="mini-stat-icon blue">
          <i class="bi bi-car-front-fill"></i>
        </div>
        <div>
          <span>Total asignados</span>
          <strong>{{ vehicles.length }}</strong>
        </div>
      </article>

      <article class="mini-stat-card">
        <div class="mini-stat-icon green">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <div>
          <span>Activos</span>
          <strong>{{ totalActive }}</strong>
        </div>
      </article>

      <article class="mini-stat-card">
        <div class="mini-stat-icon red">
          <i class="bi bi-x-circle-fill"></i>
        </div>
        <div>
          <span>Inactivos</span>
          <strong>{{ totalInactive }}</strong>
        </div>
      </article>
    </div>

    <section class="section-card">
      <div class="filters-row">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input
            v-model="search"
            type="search"
            placeholder="Buscar por placas, número económico, marca, modelo o cliente..."
            aria-label="Buscar vehículos"
          />
        </div>

        <select
          v-model="typeFilter"
          class="filter-select"
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos los tipos</option>
          <option
            v-for="type in vehicleTypes"
            :key="type"
            :value="type"
          >
            {{ type }}
          </option>
        </select>

        <select
          v-model="statusFilter"
          class="filter-select"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          <option value="Activo">Activos</option>
          <option value="Inactivo">Inactivos</option>
        </select>
      </div>

      <div v-if="loading" class="component-loading">
        <div class="app-spinner"></div>
        <span>Cargando vehículos asignados...</span>
      </div>

      <div v-else-if="filteredVehicles.length" class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Unidad</th>
              <th>Placas</th>
              <th>Vehículo</th>
              <th>Tipo</th>
              <th>Kilometraje</th>
              <th>Cliente dueño</th>
              <th>Estado</th>
              <th class="actions-column">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="vehicle in filteredVehicles"
              :key="vehicle.id_vehiculo"
            >
              <td>
                <strong>{{ vehicle.no_economico || '—' }}</strong>
              </td>
              <td>
                <span class="plate-badge">{{ vehicle.placas || 'Sin placas' }}</span>
              </td>
              <td>
                <div class="vehicle-table-cell">
                  <div class="table-vehicle-icon">
                    <i :class="vehicleIcon(vehicle.tipo_unidad)"></i>
                  </div>
                  <div>
                    <strong>{{ vehicle.marca || 'Marca no registrada' }}</strong>
                    <small>
                      {{ vehicle.modelo || 'Modelo no registrado' }}
                      {{ vehicle.anio_modelo ? `· ${vehicle.anio_modelo}` : '' }}
                    </small>
                  </div>
                </div>
              </td>
              <td>{{ vehicle.tipo_unidad || 'No especificado' }}</td>
              <td>{{ formatKilometers(vehicle.kilometraje_actual) }}</td>
              <td>
                <div class="vehicle-owner-cell">
                  <i class="bi bi-person"></i>
                  <span>{{ ownerName(vehicle) }}</span>
                </div>
              </td>
              <td>
                <span
                  class="status-button mechanic-vehicle-status"
                  :class="isActive(vehicle) ? 'active' : 'inactive'"
                >
                  <span class="status-dot"></span>
                  {{ vehicle.estatus || 'Activo' }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button
                    class="table-action-button view"
                    type="button"
                    title="Ver información del vehículo"
                    :aria-label="`Ver información de ${vehicle.marca || 'vehículo'} ${vehicle.modelo || ''}`"
                    @click="selectedVehicle = vehicle"
                  >
                    <i class="bi bi-eye"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <i class="bi bi-car-front"></i>
        <h4>
          {{
            vehicles.length
              ? 'No se encontraron vehículos'
              : 'Aún no tienes vehículos asignados'
          }}
        </h4>
        <p>
          {{
            vehicles.length
              ? 'Prueba modificando los filtros de búsqueda.'
              : `No se encontraron vehículos asociados al mecánico #${mechanicId}. Si ya están asignados desde administración, revisa que Supabase tenga aplicadas las políticas de lectura para mecánicos y que el ID asignado coincida con este número.`
          }}
        </p>
      </div>
    </section>

    <div
      v-if="selectedVehicle"
      class="modal-overlay"
      @click.self="selectedVehicle = null"
    >
      <section class="app-modal mechanic-vehicle-modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div>
            <h3>Información del vehículo</h3>
            <p>Unidad asignada a tu cuenta</p>
          </div>
          <button
            class="modal-close-button"
            type="button"
            aria-label="Cerrar"
            @click="selectedVehicle = null"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="mechanic-vehicle-modal-heading">
            <div class="table-vehicle-icon">
              <i :class="vehicleIcon(selectedVehicle.tipo_unidad)"></i>
            </div>
            <div>
              <strong>
                {{ selectedVehicle.marca || 'Vehículo' }}
                {{ selectedVehicle.modelo || '' }}
              </strong>
              <span>{{ selectedVehicle.placas || 'Sin placas registradas' }}</span>
            </div>
          </div>

          <div class="mechanic-vehicle-details-grid">
            <div><small>Número económico</small><strong>{{ selectedVehicle.no_economico || 'No registrado' }}</strong></div>
            <div><small>Cliente dueño</small><strong>{{ ownerName(selectedVehicle) }}</strong></div>
            <div><small>Tipo de unidad</small><strong>{{ selectedVehicle.tipo_unidad || 'No especificado' }}</strong></div>
            <div><small>Año</small><strong>{{ selectedVehicle.anio_modelo || 'No registrado' }}</strong></div>
            <div><small>Número de serie</small><strong>{{ selectedVehicle.numero_serie || 'No registrado' }}</strong></div>
            <div><small>Kilometraje</small><strong>{{ formatKilometers(selectedVehicle.kilometraje_actual) }}</strong></div>
            <div><small>Estado</small><strong>{{ selectedVehicle.estatus || 'Activo' }}</strong></div>
          </div>

          <div v-if="selectedVehicle.cliente?.usuario" class="mechanic-vehicle-owner-details">
            <h4>Contacto del cliente</h4>
            <span><i class="bi bi-envelope"></i>{{ selectedVehicle.cliente.usuario.correo || 'Sin correo' }}</span>
            <span><i class="bi bi-telephone"></i>{{ selectedVehicle.cliente.usuario.telefono || 'Sin teléfono' }}</span>
            <span><i class="bi bi-geo-alt"></i>{{ selectedVehicle.cliente.direccion || 'Sin dirección' }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { obtenerVehiculosMecanico } from '../services/vehiculoService.js'

const props = defineProps({
  mechanicId: {
    type: [Number, String],
    default: null
  }
})

const vehicles = ref([])
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const selectedVehicle = ref(null)

const vehicleTypes = computed(() => [
  ...new Set(
    vehicles.value
      .map(vehicle => vehicle.tipo_unidad)
      .filter(Boolean)
  )
].sort((a, b) => a.localeCompare(b, 'es')))

const totalActive = computed(() =>
  vehicles.value.filter(isActive).length
)

const totalInactive = computed(() =>
  vehicles.value.length - totalActive.value
)

const filteredVehicles = computed(() => {
  const term = normalize(search.value)
  const selectedType = normalize(typeFilter.value)
  const selectedStatus = normalize(statusFilter.value)

  return vehicles.value.filter(vehicle => {
    const searchable = normalize([
      vehicle.no_economico,
      vehicle.placas,
      vehicle.numero_serie,
      vehicle.marca,
      vehicle.modelo,
      vehicle.anio_modelo,
      vehicle.tipo_unidad,
      ownerName(vehicle)
    ].filter(Boolean).join(' '))

    const status = normalize(vehicle.estatus || 'Activo')

    return (
      (!term || searchable.includes(term)) &&
      (!selectedType || normalize(vehicle.tipo_unidad) === selectedType) &&
      (!selectedStatus || status === selectedStatus)
    )
  })
})

const normalize = value =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

const isActive = vehicle =>
  normalize(vehicle.estatus || 'Activo') === 'activo'

const ownerName = vehicle => {
  const customer = vehicle?.cliente
  const user = customer?.usuario
  const fullName = [
    user?.nombre,
    user?.apellido_paterno,
    user?.apellido_materno
  ].filter(Boolean).join(' ').trim()

  if (fullName) return fullName
  if (customer?.id_cliente) return `Cliente #${customer.id_cliente} (sin perfil)`
  return 'Sin cliente asignado'
}

const formatKilometers = value => {
  if (value === null || value === undefined || value === '') return '—'
  const kilometers = Number(value)

  return Number.isFinite(kilometers)
    ? `${new Intl.NumberFormat('es-MX').format(kilometers)} km`
    : '—'
}

const vehicleIcon = type => {
  const normalizedType = normalize(type)
  if (normalizedType.includes('moto')) return 'bi bi-bicycle'
  if (normalizedType.includes('camion') || normalizedType.includes('truck')) return 'bi bi-truck'
  if (normalizedType.includes('pickup') || normalizedType.includes('camioneta')) return 'bi bi-truck-front'
  return 'bi bi-car-front'
}

const loadVehicles = async () => {
  if (
    props.mechanicId === null ||
    props.mechanicId === undefined ||
    props.mechanicId === ''
  ) {
    vehicles.value = []
    errorMessage.value = 'No se recibió el identificador del mecánico con sesión iniciada.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    vehicles.value = await obtenerVehiculosMecanico(props.mechanicId)
  } catch (error) {
    console.error('Error cargando vehículos asignados al mecánico:', error)
    errorMessage.value = error?.message || 'No fue posible cargar los vehículos asignados.'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.mechanicId,
  (newId, previousId) => {
    if (newId !== previousId) loadVehicles()
  }
)

onMounted(loadVehicles)
</script>
