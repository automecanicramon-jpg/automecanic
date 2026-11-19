<template>
  <div class="maintenance-page">
    <!-- ======================================================
         MENSAJES
    ======================================================= -->

    <div
      v-if="successMessage"
      class="app-alert success"
    >
      <i class="bi bi-check-circle-fill"></i>

      <span>
        {{ successMessage }}
      </span>

      <button
        class="alert-close-button"
        type="button"
        @click="successMessage = ''"
      >
        <i class="bi bi-x"></i>
      </button>
    </div>


    <div
      v-if="errorMessage"
      class="app-alert danger"
    >
      <i class="bi bi-exclamation-triangle-fill"></i>

      <span>
        {{ errorMessage }}
      </span>

      <button
        class="alert-close-button"
        type="button"
        @click="errorMessage = ''"
      >
        <i class="bi bi-x"></i>
      </button>
    </div>


    <!-- ======================================================
         TOOLBAR
    ======================================================= -->

    <div class="page-toolbar">
      <div>
        <h2>
          Mantenimiento preventivo
        </h2>

        <p>
          Controla los próximos servicios de las unidades
          mediante su kilometraje.
        </p>
      </div>


      <div class="page-toolbar-actions">
        <button
          class="outline-button"
          type="button"
          :disabled="loading"
          @click="loadAll"
        >
          <i
            class="bi"
            :class="
              loading
                ? 'bi-arrow-repeat spin'
                : 'bi-arrow-clockwise'
            "
          ></i>

          Actualizar
        </button>


        <button
          class="primary-button"
          type="button"
          :disabled="loading || !vehiculosSinConfiguracion.length"
          @click="openNewModal"
        >
          <i class="bi bi-plus-lg"></i>

          Configurar mantenimiento
        </button>
      </div>
    </div>


    <!-- ======================================================
         ESTADÍSTICAS
    ======================================================= -->

    <div class="mini-stats-grid maintenance-stats-grid">
      <!-- CONFIGURADOS -->

      <article class="mini-stat-card">
        <div class="mini-stat-icon blue">
          <i class="bi bi-sliders"></i>
        </div>

        <div>
          <span>
            Configurados
          </span>

          <strong>
            {{ totalConfigurados }}
          </strong>

          <small class="maintenance-stat-caption">
            de {{ vehiculos.length }} vehículos
          </small>
        </div>
      </article>


      <!-- AL DÍA -->

      <article class="mini-stat-card">
        <div class="mini-stat-icon green">
          <i class="bi bi-check-circle-fill"></i>
        </div>

        <div>
          <span>
            Al día
          </span>

          <strong>
            {{ totalAlDia }}
          </strong>

          <small class="maintenance-stat-caption">
            mantenimiento normal
          </small>
        </div>
      </article>


      <!-- PRÓXIMOS -->

      <article class="mini-stat-card">
        <div class="mini-stat-icon orange maintenance-stat-warning">
          <i class="bi bi-clock-history"></i>
        </div>

        <div>
          <span>
            Próximos
          </span>

          <strong>
            {{ totalProximos }}
          </strong>

          <small class="maintenance-stat-caption">
            a 1,000 km o menos
          </small>
        </div>
      </article>


      <!-- VENCIDOS -->

      <article class="mini-stat-card">
        <div class="mini-stat-icon red">
          <i class="bi bi-exclamation-triangle-fill"></i>
        </div>

        <div>
          <span>
            Vencidos
          </span>

          <strong>
            {{ totalVencidos }}
          </strong>

          <small class="maintenance-stat-caption">
            requieren atención
          </small>
        </div>
      </article>
    </div>


    <!-- ======================================================
         AVISO SIN CONFIGURAR
    ======================================================= -->

    <div
      v-if="!loading && totalSinConfigurar > 0"
      class="maintenance-notice"
    >
      <div class="maintenance-notice-icon">
        <i class="bi bi-info-circle-fill"></i>
      </div>

      <div class="maintenance-notice-content">
        <strong>
          {{
            totalSinConfigurar === 1
              ? 'Hay 1 vehículo sin mantenimiento configurado'
              : `Hay ${totalSinConfigurar} vehículos sin mantenimiento configurado`
          }}
        </strong>

        <p>
          Configura el último kilometraje de servicio y el
          intervalo preventivo para comenzar su seguimiento.
        </p>
      </div>

      <button
        v-if="vehiculosSinConfiguracion.length"
        class="maintenance-notice-button"
        type="button"
        @click="openNewModal"
      >
        Configurar ahora
      </button>
    </div>


    <!-- ======================================================
         CONTENIDO
    ======================================================= -->

    <section class="section-card">
      <!-- FILTROS -->

      <div class="filters-row maintenance-filters">
        <div class="search-box">
          <i class="bi bi-search"></i>

          <input
            v-model="search"
            type="text"
            placeholder="Buscar por placas, número económico, marca o modelo..."
          />
        </div>


        <select
          v-model="statusFilter"
          class="filter-select"
        >
          <option value="">
            Todos los estados
          </option>

          <option value="AL_DIA">
            Al día
          </option>

          <option value="PROXIMO">
            Próximos
          </option>

          <option value="VENCIDO">
            Vencidos
          </option>

          <option value="SIN_CONFIGURAR">
            Sin configurar
          </option>
        </select>
      </div>


      <!-- LOADING -->

      <div
        v-if="loading"
        class="component-loading"
      >
        <div class="app-spinner"></div>

        <span>
          Cargando mantenimiento preventivo...
        </span>
      </div>


      <!-- TABLA -->

      <div
        v-else-if="filteredMantenimientos.length"
        class="table-wrapper"
      >
        <table class="data-table maintenance-table">
          <thead>
            <tr>
              <th>Vehículo</th>

              <th>Kilometraje actual</th>

              <th>Último servicio</th>

              <th>Intervalo</th>

              <th>Próximo servicio</th>

              <th>Restante</th>

              <th>Estado</th>

              <th class="actions-column">
                Acciones
              </th>
            </tr>
          </thead>


          <tbody>
            <tr
              v-for="item in filteredMantenimientos"
              :key="item.id_vehiculo"
            >
              <!-- VEHÍCULO -->

              <td>
                <div class="maintenance-vehicle-cell">
                  <div class="maintenance-vehicle-icon">
                    <i class="bi bi-car-front-fill"></i>
                  </div>

                  <div>
                    <strong>
                      {{ getVehicleName(item.vehiculo) }}
                    </strong>

                    <small>
                      {{
                        item.vehiculo?.placas ||
                        'Sin placas'
                      }}

                      <template
                        v-if="item.vehiculo?.no_economico"
                      >
                        · {{ item.vehiculo.no_economico }}
                      </template>
                    </small>
                  </div>
                </div>
              </td>


              <!-- KM ACTUAL -->

              <td>
                <div class="maintenance-km-cell">
                  <strong>
                    {{
                      formatKilometers(
                        item.vehiculo?.kilometraje_actual
                      )
                    }}
                  </strong>

                  <small>
                    Kilometraje registrado
                  </small>
                </div>
              </td>


              <!-- ÚLTIMO SERVICIO -->

              <td>
                <template
                  v-if="item.configuracion"
                >
                  {{
                    formatKilometers(
                      item.configuracion.ultimo_km_registrado
                    )
                  }}
                </template>

                <span
                  v-else
                  class="maintenance-empty-value"
                >
                  —
                </span>
              </td>


              <!-- INTERVALO -->

              <td>
                <template
                  v-if="item.configuracion"
                >
                  {{
                    formatKilometers(
                      item.configuracion.intervalo
                    )
                  }}
                </template>

                <span
                  v-else
                  class="maintenance-empty-value"
                >
                  —
                </span>
              </td>


              <!-- PRÓXIMO -->

              <td>
                <template
                  v-if="item.configuracion"
                >
                  <strong>
                    {{
                      formatKilometers(
                        item.configuracion.proximo_servicio
                      )
                    }}
                  </strong>
                </template>

                <span
                  v-else
                  class="maintenance-empty-value"
                >
                  —
                </span>
              </td>


              <!-- RESTANTE -->

              <td>
                <template
                  v-if="item.estado === 'VENCIDO'"
                >
                  <div class="maintenance-distance overdue">
                    <strong>
                      {{
                        formatNumber(
                          item.kilometros_excedidos
                        )
                      }}
                      km
                    </strong>

                    <small>
                      excedidos
                    </small>
                  </div>
                </template>


                <template
                  v-else-if="
                    item.estado === 'AL_DIA' ||
                    item.estado === 'PROXIMO'
                  "
                >
                  <div
                    class="maintenance-distance"
                    :class="{
                      upcoming:
                        item.estado === 'PROXIMO'
                    }"
                  >
                    <strong>
                      {{
                        formatNumber(
                          item.kilometros_restantes
                        )
                      }}
                      km
                    </strong>

                    <small>
                      restantes
                    </small>
                  </div>
                </template>


                <span
                  v-else
                  class="maintenance-empty-value"
                >
                  —
                </span>
              </td>


              <!-- ESTADO -->

              <td>
                <span
                  class="maintenance-status"
                  :class="
                    getStatusClass(
                      item.estado
                    )
                  "
                >
                  <i
                    :class="
                      getStatusIcon(
                        item.estado
                      )
                    "
                  ></i>

                  {{
                    getStatusLabel(
                      item.estado
                    )
                  }}
                </span>
              </td>


              <!-- ACCIONES -->

              <td>
                <div class="table-actions">
                  <button
                    v-if="item.configuracion"
                    class="table-action-button view"
                    type="button"
                    title="Ver mantenimiento"
                    @click="openViewModal(item)"
                  >
                    <i class="bi bi-eye"></i>
                  </button>


                  <button
                    class="table-action-button edit"
                    type="button"
                    :title="
                      item.configuracion
                        ? 'Editar mantenimiento'
                        : 'Configurar mantenimiento'
                    "
                    @click="
                      item.configuracion
                        ? openEditModal(item)
                        : openConfigureModal(item.vehiculo)
                    "
                  >
                    <i
                      :class="
                        item.configuracion
                          ? 'bi bi-pencil-square'
                          : 'bi bi-plus-circle'
                      "
                    ></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>


      <!-- VACÍO -->

      <div
        v-else
        class="empty-state"
      >
        <i class="bi bi-speedometer2"></i>

        <h4>
          {{
            vehiculos.length
              ? 'No se encontraron mantenimientos'
              : 'No hay vehículos registrados'
          }}
        </h4>

        <p>
          {{
            vehiculos.length
              ? 'Modifica los filtros para mostrar otros resultados.'
              : 'Primero registra un vehículo para configurar su mantenimiento preventivo.'
          }}
        </p>
      </div>
    </section>


    <!-- ======================================================
         MODAL CONFIGURAR / EDITAR
    ======================================================= -->

    <div
      v-if="showFormModal"
      class="modal-overlay"
      @click.self="closeFormModal"
    >
      <div class="app-modal maintenance-form-modal">
        <!-- HEADER -->

        <div class="modal-header">
          <div>
            <h3>
              {{
                editing
                  ? 'Actualizar mantenimiento'
                  : 'Configurar mantenimiento'
              }}
            </h3>

            <p>
              Define el kilometraje base y el intervalo
              preventivo de la unidad.
            </p>
          </div>


          <button
            class="modal-close-button"
            type="button"
            :disabled="saving"
            @click="closeFormModal"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>


        <form
          class="modal-body"
          @submit.prevent="saveMaintenance"
        >
          <!-- VEHÍCULO -->

          <div class="form-section-title">
            <i class="bi bi-car-front-fill"></i>

            <div>
              <strong>
                Vehículo
              </strong>

              <span>
                Unidad que tendrá el seguimiento preventivo
              </span>
            </div>
          </div>


          <div class="maintenance-form-grid">
            <div class="form-group maintenance-full-field">
              <label for="maintenance-vehicle">
                Vehículo

                <span class="required">*</span>
              </label>

              <select
                id="maintenance-vehicle"
                v-model="form.id_vehiculo"
                required
                :disabled="editing"
                @change="handleVehicleChange"
              >
                <option value="">
                  Selecciona un vehículo
                </option>

                <option
                  v-for="vehiculo in selectableVehicles"
                  :key="vehiculo.id_vehiculo"
                  :value="vehiculo.id_vehiculo"
                >
                  {{ getVehicleOptionLabel(vehiculo) }}
                </option>
              </select>
            </div>
          </div>


          <!-- RESUMEN DEL VEHÍCULO -->

          <div
            v-if="selectedVehicle"
            class="maintenance-selected-vehicle"
          >
            <div class="maintenance-selected-icon">
              <i class="bi bi-car-front-fill"></i>
            </div>

            <div class="maintenance-selected-info">
              <strong>
                {{ getVehicleName(selectedVehicle) }}
              </strong>

              <span>
                {{
                  selectedVehicle.placas ||
                  'Sin placas'
                }}

                <template
                  v-if="selectedVehicle.no_economico"
                >
                  · {{ selectedVehicle.no_economico }}
                </template>
              </span>
            </div>

            <div class="maintenance-selected-km">
              <small>
                Kilometraje actual
              </small>

              <strong>
                {{
                  formatKilometers(
                    selectedVehicle.kilometraje_actual
                  )
                }}
              </strong>
            </div>
          </div>


          <!-- CONFIGURACIÓN -->

          <div class="form-section-title form-section-spacing">
            <i class="bi bi-speedometer2"></i>

            <div>
              <strong>
                Configuración preventiva
              </strong>

              <span>
                Datos utilizados para calcular el próximo servicio
              </span>
            </div>
          </div>


          <div class="maintenance-form-grid">
            <!-- ÚLTIMO KM -->

            <div class="form-group">
              <label for="maintenance-last-km">
                Último kilometraje de servicio

                <span class="required">*</span>
              </label>

              <div class="input-with-suffix">
                <input
                  id="maintenance-last-km"
                  v-model="form.ultimo_km_registrado"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ej. 45000"
                  required
                />

                <span>
                  km
                </span>
              </div>

              <small class="maintenance-field-help">
                Kilometraje en el que se realizó
                el último mantenimiento preventivo.
              </small>
            </div>


            <!-- INTERVALO -->

            <div class="form-group">
              <label for="maintenance-interval">
                Intervalo de mantenimiento

                <span class="required">*</span>
              </label>

              <div class="input-with-suffix">
                <input
                  id="maintenance-interval"
                  v-model="form.intervalo"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ej. 5000"
                  required
                />

                <span>
                  km
                </span>
              </div>

              <small class="maintenance-field-help">
                Distancia entre un mantenimiento
                preventivo y el siguiente.
              </small>
            </div>
          </div>


          <!-- INTERVALOS RÁPIDOS -->

          <div class="maintenance-quick-section">
            <span>
              Intervalos frecuentes
            </span>

            <div class="maintenance-quick-options">
              <button
                v-for="intervalo in quickIntervals"
                :key="intervalo"
                type="button"
                class="maintenance-quick-button"
                :class="{
                  active:
                    Number(form.intervalo) ===
                    intervalo
                }"
                @click="
                  form.intervalo =
                    String(intervalo)
                "
              >
                {{ formatNumber(intervalo) }} km
              </button>
            </div>
          </div>


          <!-- RESULTADO CALCULADO -->

          <div
            v-if="calculatedPreview"
            class="maintenance-calculation-card"
          >
            <div class="maintenance-calculation-header">
              <div>
                <i class="bi bi-calculator"></i>

                <span>
                  Cálculo preventivo
                </span>
              </div>

              <span
                class="maintenance-status"
                :class="
                  getStatusClass(
                    calculatedPreview.estado
                  )
                "
              >
                <i
                  :class="
                    getStatusIcon(
                      calculatedPreview.estado
                    )
                  "
                ></i>

                {{
                  getStatusLabel(
                    calculatedPreview.estado
                  )
                }}
              </span>
            </div>


            <div class="maintenance-calculation-grid">
              <div>
                <small>
                  Último servicio
                </small>

                <strong>
                  {{
                    formatKilometers(
                      form.ultimo_km_registrado
                    )
                  }}
                </strong>
              </div>


              <div>
                <small>
                  Intervalo
                </small>

                <strong>
                  {{
                    formatKilometers(
                      form.intervalo
                    )
                  }}
                </strong>
              </div>


              <div>
                <small>
                  Próximo servicio
                </small>

                <strong>
                  {{
                    formatKilometers(
                      calculatedPreview.proximoServicio
                    )
                  }}
                </strong>
              </div>


              <div>
                <small>
                  {{
                    calculatedPreview.estado ===
                    'VENCIDO'
                      ? 'Kilómetros excedidos'
                      : 'Kilómetros restantes'
                  }}
                </small>

                <strong>
                  {{
                    formatNumber(
                      calculatedPreview.estado ===
                      'VENCIDO'
                        ? calculatedPreview.kilometrosExcedidos
                        : calculatedPreview.kilometrosRestantes
                    )
                  }}
                  km
                </strong>
              </div>
            </div>
          </div>


          <!-- AVISO -->

          <div class="maintenance-form-info">
            <i class="bi bi-info-circle-fill"></i>

            <p>
              El próximo servicio se calcula automáticamente
              sumando el último kilometraje registrado más
              el intervalo de mantenimiento.
            </p>
          </div>


          <!-- FOOTER -->

          <div class="modal-form-footer">
            <button
              class="secondary-button"
              type="button"
              :disabled="saving"
              @click="closeFormModal"
            >
              Cancelar
            </button>


            <button
              class="primary-button"
              type="submit"
              :disabled="saving"
            >
              <i
                v-if="saving"
                class="bi bi-arrow-repeat spin"
              ></i>

              <i
                v-else
                class="bi bi-check2-circle"
              ></i>

              {{
                saving
                  ? 'Guardando...'
                  : editing
                    ? 'Actualizar mantenimiento'
                    : 'Guardar configuración'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>


    <!-- ======================================================
         MODAL VER DETALLE
    ======================================================= -->

    <div
      v-if="
        showViewModal &&
        selectedMaintenance
      "
      class="modal-overlay"
      @click.self="closeViewModal"
    >
      <div class="app-modal maintenance-detail-modal">
        <div class="modal-header">
          <div>
            <h3>
              Mantenimiento preventivo
            </h3>

            <p>
              Estado actual y programación de la unidad.
            </p>
          </div>


          <button
            class="modal-close-button"
            type="button"
            @click="closeViewModal"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>


        <div class="modal-body">
          <!-- CABECERA VEHÍCULO -->

          <div class="maintenance-detail-vehicle">
            <div class="maintenance-detail-vehicle-icon">
              <i class="bi bi-car-front-fill"></i>
            </div>

            <div>
              <h4>
                {{
                  getVehicleName(
                    selectedMaintenance.vehiculo
                  )
                }}
              </h4>

              <p>
                {{
                  selectedMaintenance.vehiculo?.placas ||
                  'Sin placas'
                }}

                <template
                  v-if="
                    selectedMaintenance.vehiculo?.no_economico
                  "
                >
                  ·
                  {{
                    selectedMaintenance.vehiculo.no_economico
                  }}
                </template>
              </p>
            </div>

            <span
              class="maintenance-status"
              :class="
                getStatusClass(
                  selectedMaintenance.estado
                )
              "
            >
              <i
                :class="
                  getStatusIcon(
                    selectedMaintenance.estado
                  )
                "
              ></i>

              {{
                getStatusLabel(
                  selectedMaintenance.estado
                )
              }}
            </span>
          </div>


          <!-- DATOS -->

          <div class="maintenance-detail-grid">
            <article>
              <div class="maintenance-detail-icon">
                <i class="bi bi-speedometer"></i>
              </div>

              <div>
                <small>
                  Kilometraje actual
                </small>

                <strong>
                  {{
                    formatKilometers(
                      selectedMaintenance
                        .vehiculo
                        ?.kilometraje_actual
                    )
                  }}
                </strong>
              </div>
            </article>


            <article>
              <div class="maintenance-detail-icon">
                <i class="bi bi-wrench-adjustable"></i>
              </div>

              <div>
                <small>
                  Último servicio
                </small>

                <strong>
                  {{
                    formatKilometers(
                      selectedMaintenance
                        .configuracion
                        ?.ultimo_km_registrado
                    )
                  }}
                </strong>
              </div>
            </article>


            <article>
              <div class="maintenance-detail-icon">
                <i class="bi bi-arrow-repeat"></i>
              </div>

              <div>
                <small>
                  Intervalo
                </small>

                <strong>
                  {{
                    formatKilometers(
                      selectedMaintenance
                        .configuracion
                        ?.intervalo
                    )
                  }}
                </strong>
              </div>
            </article>


            <article>
              <div class="maintenance-detail-icon">
                <i class="bi bi-flag-fill"></i>
              </div>

              <div>
                <small>
                  Próximo servicio
                </small>

                <strong>
                  {{
                    formatKilometers(
                      selectedMaintenance
                        .configuracion
                        ?.proximo_servicio
                    )
                  }}
                </strong>
              </div>
            </article>
          </div>


          <!-- PROGRESO -->

          <div class="maintenance-progress-card">
            <div class="maintenance-progress-header">
              <div>
                <span>
                  Avance del intervalo
                </span>

                <strong>
                  {{ progressPercentage }}%
                </strong>
              </div>
            </div>


            <div class="maintenance-progress-track">
              <div
                class="maintenance-progress-fill"
                :class="
                  getStatusClass(
                    selectedMaintenance.estado
                  )
                "
                :style="{
                  width:
                    `${progressPercentage}%`
                }"
              ></div>
            </div>


            <div class="maintenance-progress-footer">
              <span>
                {{
                  formatKilometers(
                    selectedMaintenance
                      .configuracion
                      ?.ultimo_km_registrado
                  )
                }}
              </span>

              <span>
                {{
                  formatKilometers(
                    selectedMaintenance
                      .configuracion
                      ?.proximo_servicio
                  )
                }}
              </span>
            </div>
          </div>


          <!-- ESTADO DETALLADO -->

          <div
            class="maintenance-state-detail"
            :class="
              getStatusClass(
                selectedMaintenance.estado
              )
            "
          >
            <i
              :class="
                getStatusIcon(
                  selectedMaintenance.estado
                )
              "
            ></i>

            <div>
              <strong>
                {{
                  getStatusMessageTitle(
                    selectedMaintenance
                  )
                }}
              </strong>

              <p>
                {{
                  getStatusMessage(
                    selectedMaintenance
                  )
                }}
              </p>
            </div>
          </div>
        </div>


        <div class="modal-footer">
          <button
            class="secondary-button"
            type="button"
            @click="closeViewModal"
          >
            Cerrar
          </button>


          <button
            class="primary-button"
            type="button"
            @click="editFromView"
          >
            <i class="bi bi-pencil-square"></i>

            Editar configuración
          </button>
        </div>
      </div>
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
  calcularEstadoMantenimiento,
  calcularProximoServicio,
  guardarConfiguracionMantenimiento,
  obtenerConfiguracionesMantenimiento,
  obtenerVehiculosMantenimiento
} from '../services/mantenimientoService.js'

const props = defineProps({
  mechanicMode: {
    type: Boolean,
    default: false
  },
  mechanicId: {
    type: [Number, String],
    default: null
  }
})


/* ============================================================
   ESTADO
============================================================ */

const vehiculos = ref([])

const configuraciones = ref([])

const loading = ref(false)

const saving = ref(false)

const successMessage = ref('')

const errorMessage = ref('')

const search = ref('')

const statusFilter = ref('')

const showFormModal = ref(false)

const showViewModal = ref(false)

const editing = ref(false)

const selectedMaintenance =
  ref(null)


/* ============================================================
   INTERVALOS FRECUENTES
============================================================ */

const quickIntervals = [
  5000,
  7500,
  10000,
  15000
]


/* ============================================================
   FORMULARIO
============================================================ */

const emptyForm = () => ({
  id_configuracion:
    null,

  id_vehiculo:
    '',

  ultimo_km_registrado:
    '',

  intervalo:
    ''
})


const form = ref(
  emptyForm()
)


/* ============================================================
   VEHÍCULO SELECCIONADO
============================================================ */

const selectedVehicle =
  computed(() => {
    if (
      !form.value.id_vehiculo
    ) {
      return null
    }

    return (
      vehiculos.value.find(
        vehiculo =>
          Number(
            vehiculo.id_vehiculo
          ) ===
          Number(
            form.value.id_vehiculo
          )
      ) ||
      null
    )
  })

const isVehicleActive = vehiculo =>
  String(
    vehiculo?.estatus ||
    'Activo'
  )
    .trim()
    .toLowerCase() === 'activo'


/* ============================================================
   MAPA DE CONFIGURACIONES
============================================================ */

const configuracionesMap =
  computed(() => {
    return new Map(
      configuraciones.value.map(
        configuracion => [
          Number(
            configuracion.id_vehiculo
          ),
          configuracion
        ]
      )
    )
  })


/* ============================================================
   LISTADO COMPLETO
============================================================ */

const mantenimientos =
  computed(() => {
    return vehiculos.value.map(
      vehiculo => {
        const configuracion =
          configuracionesMap.value.get(
            Number(
              vehiculo.id_vehiculo
            )
          ) || null

        if (!configuracion) {
          return {
            id_vehiculo:
              vehiculo.id_vehiculo,

            vehiculo,

            configuracion:
              null,

            estado:
              'SIN_CONFIGURAR',

            kilometros_restantes:
              null,

            kilometros_excedidos:
              null
          }
        }

        const estadoInfo =
          calcularEstadoMantenimiento({
            kilometrajeActual:
              vehiculo.kilometraje_actual,

            proximoServicio:
              configuracion.proximo_servicio
          })

        return {
          id_vehiculo:
            vehiculo.id_vehiculo,

          vehiculo,

          configuracion,

          estado:
            estadoInfo.estado,

          kilometros_restantes:
            estadoInfo.kilometrosRestantes,

          kilometros_excedidos:
            estadoInfo.kilometrosExcedidos
        }
      }
    )
  })


/* ============================================================
   VEHÍCULOS SIN CONFIGURACIÓN
============================================================ */

const vehiculosSinConfiguracion =
  computed(() => {
    return vehiculos.value.filter(
      vehiculo =>
        isVehicleActive(vehiculo) &&
        !configuracionesMap.value.has(
          Number(
            vehiculo.id_vehiculo
          )
        )
    )
  })


/* ============================================================
   VEHÍCULOS DISPONIBLES EN FORMULARIO
============================================================ */

const selectableVehicles =
  computed(() => {
    if (!editing.value) {
      return vehiculosSinConfiguracion.value
    }

    const actual =
      selectedVehicle.value

    if (!actual) {
      return vehiculos.value.filter(isVehicleActive)
    }

    return [
      actual,
      ...vehiculosSinConfiguracion.value.filter(
        vehiculo =>
          Number(
            vehiculo.id_vehiculo
          ) !==
          Number(
            actual.id_vehiculo
          )
      )
    ]
  })


/* ============================================================
   FILTRADO
============================================================ */

const filteredMantenimientos =
  computed(() => {
    const term =
      search.value
        .trim()
        .toLowerCase()

    return mantenimientos.value.filter(
      item => {
        const vehiculo =
          item.vehiculo || {}

        const searchable = `
          ${vehiculo.no_economico || ''}
          ${vehiculo.placas || ''}
          ${vehiculo.numero_serie || ''}
          ${vehiculo.marca || ''}
          ${vehiculo.modelo || ''}
          ${vehiculo.anio_modelo || ''}
          ${vehiculo.tipo_unidad || ''}
        `
          .toLowerCase()
          .replace(
            /\s+/g,
            ' '
          )

        const matchesSearch =
          !term ||
          searchable.includes(
            term
          )

        const matchesStatus =
          !statusFilter.value ||
          item.estado ===
            statusFilter.value

        return (
          matchesSearch &&
          matchesStatus
        )
      }
    )
  })


/* ============================================================
   ESTADÍSTICAS
============================================================ */

const totalConfigurados =
  computed(() => {
    return configuraciones.value.length
  })


const totalAlDia =
  computed(() => {
    return mantenimientos.value.filter(
      item =>
        item.estado ===
        'AL_DIA'
    ).length
  })


const totalProximos =
  computed(() => {
    return mantenimientos.value.filter(
      item =>
        item.estado ===
        'PROXIMO'
    ).length
  })


const totalVencidos =
  computed(() => {
    return mantenimientos.value.filter(
      item =>
        item.estado ===
        'VENCIDO'
    ).length
  })


const totalSinConfigurar =
  computed(() => {
    return mantenimientos.value.filter(
      item =>
        item.estado ===
        'SIN_CONFIGURAR'
    ).length
  })


/* ============================================================
   PREVISUALIZACIÓN DEL CÁLCULO
============================================================ */

const calculatedPreview =
  computed(() => {
    if (
      !selectedVehicle.value ||
      form.value.ultimo_km_registrado ===
        '' ||
      form.value.intervalo ===
        ''
    ) {
      return null
    }

    const ultimoKm =
      Number(
        form.value.ultimo_km_registrado
      )

    const intervalo =
      Number(
        form.value.intervalo
      )

    if (
      !Number.isFinite(
        ultimoKm
      ) ||
      ultimoKm < 0 ||
      !Number.isFinite(
        intervalo
      ) ||
      intervalo <= 0
    ) {
      return null
    }

    try {
      const proximoServicio =
        calcularProximoServicio(
          ultimoKm,
          intervalo
        )

      const estadoInfo =
        calcularEstadoMantenimiento({
          kilometrajeActual:
            selectedVehicle.value
              .kilometraje_actual,

          proximoServicio
        })

      return {
        proximoServicio,

        estado:
          estadoInfo.estado,

        kilometrosRestantes:
          estadoInfo.kilometrosRestantes,

        kilometrosExcedidos:
          estadoInfo.kilometrosExcedidos
      }
    } catch {
      return null
    }
  })


/* ============================================================
   PROGRESO
============================================================ */

const progressPercentage =
  computed(() => {
    const item =
      selectedMaintenance.value

    if (
      !item?.configuracion
    ) {
      return 0
    }

    const ultimo =
      Number(
        item.configuracion
          .ultimo_km_registrado
      )

    const proximo =
      Number(
        item.configuracion
          .proximo_servicio
      )

    const actual =
      Number(
        item.vehiculo
          ?.kilometraje_actual
      )

    const intervalo =
      proximo -
      ultimo

    if (
      !Number.isFinite(
        intervalo
      ) ||
      intervalo <= 0 ||
      !Number.isFinite(
        actual
      )
    ) {
      return 0
    }

    const recorrido =
      actual -
      ultimo

    const porcentaje =
      Math.round(
        (
          recorrido /
          intervalo
        ) * 100
      )

    return Math.min(
      100,
      Math.max(
        0,
        porcentaje
      )
    )
  })


/* ============================================================
   CARGAR
============================================================ */

const loadAll = async () => {
  loading.value = true

  errorMessage.value = ''

  const mechanicId = Number(props.mechanicId)

  if (
    props.mechanicMode &&
    (!Number.isInteger(mechanicId) || mechanicId <= 0)
  ) {
    vehiculos.value = []
    configuraciones.value = []
    errorMessage.value =
      'No fue posible identificar al mecánico actual.'
    loading.value = false
    return
  }

  try {
    const [
      vehiculosData,
      configuracionesData
    ] =
      await Promise.all([
        obtenerVehiculosMantenimiento(),
        obtenerConfiguracionesMantenimiento()
      ])

    const assignedVehicles = (vehiculosData || []).filter(
      vehicle =>
        !props.mechanicMode ||
        Number(vehicle.id_mecanico) === mechanicId
    )
    const assignedVehicleIds = new Set(
      assignedVehicles.map(vehicle => Number(vehicle.id_vehiculo))
    )

    vehiculos.value =
      assignedVehicles

    configuraciones.value =
      (configuracionesData || []).filter(
        configuration =>
          assignedVehicleIds.has(Number(configuration.id_vehiculo))
      )

    /*
     * Si el modal de detalle estaba abierto,
     * actualizamos también su referencia.
     */
    if (
      selectedMaintenance.value
        ?.id_vehiculo
    ) {
      const actualizado =
        mantenimientos.value.find(
          item =>
            Number(
              item.id_vehiculo
            ) ===
            Number(
              selectedMaintenance.value
                .id_vehiculo
            )
        )

      if (actualizado) {
        selectedMaintenance.value =
          actualizado
      }
    }
  } catch (error) {
    console.error(
      'Error cargando mantenimiento:',
      error
    )

    errorMessage.value =
      getErrorMessage(
        error,
        'No fue posible cargar el mantenimiento preventivo.'
      )
  } finally {
    loading.value = false
  }
}


/* ============================================================
   NUEVA CONFIGURACIÓN
============================================================ */

const openNewModal = () => {
  if (
    !vehiculosSinConfiguracion.value
      .length
  ) {
    errorMessage.value =
      'Todos los vehículos ya tienen mantenimiento configurado.'

    clearErrorLater()

    return
  }

  editing.value = false

  form.value =
    emptyForm()

  showFormModal.value =
    true
}


/* ============================================================
   CONFIGURAR VEHÍCULO DIRECTAMENTE
============================================================ */

const openConfigureModal =
  vehiculo => {
    if (!vehiculo) {
      return
    }

    editing.value = false

    form.value = {
      ...emptyForm(),

      id_vehiculo:
        vehiculo.id_vehiculo
    }

    showFormModal.value =
      true
  }


/* ============================================================
   EDITAR
============================================================ */

const openEditModal = item => {
  if (
    !item?.configuracion
  ) {
    return
  }

  editing.value = true

  form.value = {
    id_configuracion:
      item.configuracion
        .id_configuracion,

    id_vehiculo:
      item.vehiculo
        .id_vehiculo,

    ultimo_km_registrado:
      item.configuracion
        .ultimo_km_registrado ??
      '',

    intervalo:
      item.configuracion
        .intervalo ??
      ''
  }

  showFormModal.value =
    true
}


/* ============================================================
   VER
============================================================ */

const openViewModal = item => {
  selectedMaintenance.value =
    item

  showViewModal.value =
    true
}


const closeViewModal = () => {
  showViewModal.value =
    false

  selectedMaintenance.value =
    null
}


const editFromView = () => {
  const item =
    selectedMaintenance.value

  showViewModal.value =
    false

  selectedMaintenance.value =
    null

  if (item) {
    openEditModal(
      item
    )
  }
}


/* ============================================================
   CAMBIO DE VEHÍCULO
============================================================ */

const handleVehicleChange = () => {
  errorMessage.value = ''
}


/* ============================================================
   CERRAR FORMULARIO
============================================================ */

const closeFormModal = () => {
  if (saving.value) {
    return
  }

  showFormModal.value =
    false

  editing.value = false

  form.value =
    emptyForm()
}


/* ============================================================
   VALIDACIÓN
============================================================ */

const validateForm = () => {
  if (
    !form.value.id_vehiculo
  ) {
    return 'Selecciona un vehículo.'
  }

  if (
    !editing.value &&
    selectedVehicle.value &&
    !isVehicleActive(selectedVehicle.value)
  ) {
    return 'No se puede configurar el mantenimiento de un vehículo inactivo. Selecciona un vehículo activo.'
  }

  if (
    form.value
      .ultimo_km_registrado ===
    ''
  ) {
    return 'Ingresa el último kilometraje de servicio.'
  }

  if (
    form.value.intervalo ===
    ''
  ) {
    return 'Ingresa el intervalo de mantenimiento.'
  }

  const ultimoKm =
    Number(
      form.value
        .ultimo_km_registrado
    )

  const intervalo =
    Number(
      form.value.intervalo
    )

  if (
    !Number.isFinite(
      ultimoKm
    ) ||
    ultimoKm < 0
  ) {
    return 'El último kilometraje de servicio no es válido.'
  }

  if (
    !Number.isFinite(
      intervalo
    ) ||
    intervalo <= 0
  ) {
    return 'El intervalo debe ser mayor a 0 km.'
  }

  const actual =
    Number(
      selectedVehicle.value
        ?.kilometraje_actual
    )

  if (
    selectedVehicle.value
      ?.kilometraje_actual !==
      null &&
    selectedVehicle.value
      ?.kilometraje_actual !==
      undefined &&
    Number.isFinite(
      actual
    ) &&
    ultimoKm > actual
  ) {
    return (
      `El último kilometraje de servicio ` +
      `no puede ser mayor al kilometraje actual ` +
      `del vehículo (${formatNumber(actual)} km).`
    )
  }

  return ''
}


/* ============================================================
   GUARDAR
============================================================ */

const saveMaintenance = async () => {
  if (saving.value) {
    return
  }

  errorMessage.value = ''

  successMessage.value = ''

  const validationError =
    validateForm()

  if (validationError) {
    errorMessage.value =
      validationError

    clearErrorLater()

    return
  }

  saving.value = true

  try {
    await guardarConfiguracionMantenimiento({
      id_vehiculo:
        Number(
          form.value.id_vehiculo
        ),

      ultimo_km_registrado:
        Number(
          form.value
            .ultimo_km_registrado
        ),

      intervalo:
        Number(
          form.value.intervalo
        )
    })

    const wasEditing =
      editing.value

    closeFormAfterSave()

    await loadAll()

    successMessage.value =
      wasEditing
        ? 'El mantenimiento preventivo fue actualizado correctamente.'
        : 'El mantenimiento preventivo fue configurado correctamente.'

    clearSuccessLater()
  } catch (error) {
    console.error(
      'Error guardando mantenimiento:',
      error
    )

    errorMessage.value =
      getErrorMessage(
        error,
        'No fue posible guardar la configuración de mantenimiento.'
      )

    clearErrorLater()
  } finally {
    saving.value = false
  }
}


const closeFormAfterSave = () => {
  showFormModal.value =
    false

  editing.value = false

  form.value =
    emptyForm()
}


/* ============================================================
   FORMATO
============================================================ */

const formatNumber = value => {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    Number.isNaN(
      Number(value)
    )
  ) {
    return '0'
  }

  return new Intl.NumberFormat(
    'es-MX',
    {
      maximumFractionDigits: 0
    }
  ).format(
    Number(value)
  )
}


const formatKilometers = value => {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    Number.isNaN(
      Number(value)
    )
  ) {
    return 'No registrado'
  }

  return (
    `${formatNumber(value)} km`
  )
}


/* ============================================================
   VEHÍCULOS
============================================================ */

const getVehicleName =
  vehiculo => {
    if (!vehiculo) {
      return 'Vehículo no disponible'
    }

    const parts = [
      vehiculo.marca,
      vehiculo.modelo,
      vehiculo.anio_modelo
    ]
      .filter(
        value =>
          value !== null &&
          value !== undefined &&
          String(value).trim() !==
            ''
      )

    return (
      parts.join(' ') ||
      'Vehículo sin identificar'
    )
  }


const getVehicleOptionLabel =
  vehiculo => {
    const nombre =
      getVehicleName(
        vehiculo
      )

    const placa =
      vehiculo.placas
        ? ` · ${vehiculo.placas}`
        : ''

    const economico =
      vehiculo.no_economico
        ? ` · ${vehiculo.no_economico}`
        : ''

    const estado =
      String(
        vehiculo.estatus ||
        'Activo'
      )
        .toLowerCase() !==
      'activo'
        ? ' · Inactivo'
        : ''

    return (
      nombre +
      placa +
      economico +
      estado
    )
  }


/* ============================================================
   ESTADOS
============================================================ */

const getStatusLabel = estado => {
  const labels = {
    AL_DIA:
      'Al día',

    PROXIMO:
      'Próximo',

    VENCIDO:
      'Vencido',

    SIN_CONFIGURAR:
      'Sin configurar'
  }

  return (
    labels[estado] ||
    'Sin configurar'
  )
}


const getStatusClass = estado => {
  const classes = {
    AL_DIA:
      'status-ok',

    PROXIMO:
      'status-upcoming',

    VENCIDO:
      'status-overdue',

    SIN_CONFIGURAR:
      'status-unconfigured'
  }

  return (
    classes[estado] ||
    'status-unconfigured'
  )
}


const getStatusIcon = estado => {
  const icons = {
    AL_DIA:
      'bi bi-check-circle-fill',

    PROXIMO:
      'bi bi-clock-history',

    VENCIDO:
      'bi bi-exclamation-triangle-fill',

    SIN_CONFIGURAR:
      'bi bi-dash-circle'
  }

  return (
    icons[estado] ||
    'bi bi-dash-circle'
  )
}


/* ============================================================
   MENSAJES DEL ESTADO
============================================================ */

const getStatusMessageTitle =
  item => {
    switch (
      item?.estado
    ) {
      case 'AL_DIA':
        return 'Mantenimiento al día'

      case 'PROXIMO':
        return 'Próximo mantenimiento'

      case 'VENCIDO':
        return 'Mantenimiento vencido'

      default:
        return 'Sin configuración'
    }
  }


const getStatusMessage =
  item => {
    if (!item) {
      return ''
    }

    switch (
      item.estado
    ) {
      case 'AL_DIA':
        return (
          `La unidad dispone de ` +
          `${formatNumber(item.kilometros_restantes)} km ` +
          `antes del próximo mantenimiento preventivo.`
        )

      case 'PROXIMO':
        return (
          `Faltan ${formatNumber(item.kilometros_restantes)} km ` +
          `para alcanzar el próximo servicio programado.`
        )

      case 'VENCIDO':
        if (
          Number(
            item.kilometros_excedidos
          ) === 0
        ) {
          return (
            'La unidad alcanzó exactamente el kilometraje ' +
            'programado para su mantenimiento.'
          )
        }

        return (
          `La unidad superó el mantenimiento programado por ` +
          `${formatNumber(item.kilometros_excedidos)} km.`
        )

      default:
        return (
          'Esta unidad todavía no tiene una configuración ' +
          'de mantenimiento preventivo.'
        )
    }
  }


/* ============================================================
   ERRORES
============================================================ */

const getErrorMessage = (
  error,
  fallback
) => {
  return (
    error?.message ||
    error?.error_description ||
    fallback
  )
}


/* ============================================================
   LIMPIEZA DE MENSAJES
============================================================ */

const clearSuccessLater = () => {
  window.setTimeout(
    () => {
      successMessage.value = ''
    },
    4500
  )
}


const clearErrorLater = () => {
  window.setTimeout(
    () => {
      errorMessage.value = ''
    },
    6000
  )
}


/* ============================================================
   INICIO
============================================================ */

onMounted(() => {
  loadAll()
})
</script>


<style scoped>
/* ============================================================
   CONTENEDOR
============================================================ */

.maintenance-page {
  width: 100%;
}


/* ============================================================
   ESTADÍSTICAS
============================================================ */

.maintenance-stats-grid {
  margin-bottom: 1.25rem;
}

.maintenance-stat-caption {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.72rem;
  line-height: 1.25;
  color: #7b8798;
  font-weight: 500;
}

.maintenance-stat-warning {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
}


/* ============================================================
   AVISO
============================================================ */

.maintenance-notice {
  display: flex;
  align-items: center;
  gap: 0.95rem;
  width: 100%;
  margin-bottom: 1.25rem;
  padding: 1rem 1.1rem;
  border: 1px solid rgba(37, 99, 235, 0.16);
  border-radius: 14px;
  background: rgba(37, 99, 235, 0.055);
}

.maintenance-notice-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
  font-size: 1rem;
}

.maintenance-notice-content {
  flex: 1;
  min-width: 0;
}

.maintenance-notice-content strong {
  display: block;
  margin-bottom: 0.18rem;
  color: #26364b;
  font-size: 0.9rem;
  font-weight: 700;
}

.maintenance-notice-content p {
  margin: 0;
  color: #69778a;
  font-size: 0.79rem;
  line-height: 1.45;
}

.maintenance-notice-button {
  flex: 0 0 auto;
  border: 0;
  border-radius: 9px;
  padding: 0.62rem 0.9rem;
  background: #2563eb;
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.maintenance-notice-button:hover {
  transform: translateY(-1px);
  box-shadow:
    0 5px 12px
    rgba(37, 99, 235, 0.18);
}


/* ============================================================
   FILTROS
============================================================ */

.maintenance-filters {
  align-items: center;
}

.maintenance-filters .search-box {
  position: relative;
  flex: 1 1 360px;

  height: 42px;
  min-height: 42px;
  max-height: 42px;
}

.maintenance-filters .search-box > i {
  position: absolute;

  top: 50%;
  left: 13px;

  z-index: 2;

  transform: translateY(-50%);

  margin: 0;

  pointer-events: none;
}

.maintenance-filters .search-box input {
  width: 100%;

  height: 42px;
  min-height: 42px;
  max-height: 42px;

  padding-left: 38px;
}

.maintenance-filters .filter-select {
  min-width: 180px;

  height: 42px;
  min-height: 42px;
  max-height: 42px;
}


/* ============================================================
   TABLA
============================================================ */

.maintenance-table {
  min-width: 1100px;
}

.maintenance-vehicle-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 175px;
}

.maintenance-vehicle-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(37, 99, 235, 0.095);
  color: #2563eb;
}

.maintenance-vehicle-cell strong,
.maintenance-km-cell strong {
  display: block;
  color: #25354a;
  font-size: 0.8rem;
  line-height: 1.25;
}

.maintenance-vehicle-cell small,
.maintenance-km-cell small {
  display: block;
  margin-top: 0.12rem;
  color: #7c8999;
  font-size: 0.7rem;
  line-height: 1.25;
}

.maintenance-km-cell {
  min-width: 130px;
}

.maintenance-empty-value {
  color: #a0a9b5;
}

.maintenance-distance {
  display: flex;
  flex-direction: column;
  min-width: 88px;
}

.maintenance-distance strong {
  color: #344256;
  font-size: 0.78rem;
}

.maintenance-distance small {
  margin-top: 0.08rem;
  color: #8490a0;
  font-size: 0.67rem;
}

.maintenance-distance.upcoming strong {
  color: #b96908;
}

.maintenance-distance.overdue strong {
  color: #c33c3c;
}


/* ============================================================
   ESTADOS
============================================================ */

.maintenance-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.34rem;
  width: max-content;
  min-width: 92px;
  padding: 0.37rem 0.58rem;
  border-radius: 999px;
  font-size: 0.69rem;
  line-height: 1;
  font-weight: 700;
  white-space: nowrap;
}

.maintenance-status.status-ok {
  background: rgba(22, 163, 74, 0.1);
  color: #15803d;
}

.maintenance-status.status-upcoming {
  background: rgba(245, 158, 11, 0.12);
  color: #b76506;
}

.maintenance-status.status-overdue {
  background: rgba(220, 38, 38, 0.1);
  color: #c02f2f;
}

.maintenance-status.status-unconfigured {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}


/* ============================================================
   MODAL FORMULARIO
============================================================ */

.maintenance-form-modal {
  width: min(720px, 94vw);
  max-height: 92vh;
}

.maintenance-form-grid {
  display: grid;
  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );
  gap: 1rem;
}

.maintenance-full-field {
  grid-column: 1 / -1;
}

.maintenance-field-help {
  display: block;
  margin-top: 0.35rem;
  color: #8793a2;
  font-size: 0.7rem;
  line-height: 1.4;
}


/* ============================================================
   VEHÍCULO SELECCIONADO
============================================================ */

.maintenance-selected-vehicle {
  display: grid;
  grid-template-columns:
    auto
    minmax(0, 1fr)
    auto;
  align-items: center;
  gap: 0.8rem;
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid #e3e9f1;
  border-radius: 12px;
  background: #f8fafc;
}

.maintenance-selected-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  font-size: 1.05rem;
}

.maintenance-selected-info {
  min-width: 0;
}

.maintenance-selected-info strong {
  display: block;
  color: #26364a;
  font-size: 0.86rem;
}

.maintenance-selected-info span {
  display: block;
  margin-top: 0.15rem;
  color: #7b8797;
  font-size: 0.72rem;
}

.maintenance-selected-km {
  text-align: right;
}

.maintenance-selected-km small {
  display: block;
  color: #7b8797;
  font-size: 0.68rem;
}

.maintenance-selected-km strong {
  display: block;
  margin-top: 0.1rem;
  color: #26364a;
  font-size: 0.88rem;
}


/* ============================================================
   INTERVALOS RÁPIDOS
============================================================ */

.maintenance-quick-section {
  margin-top: 0.9rem;
}

.maintenance-quick-section > span {
  display: block;
  margin-bottom: 0.45rem;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 600;
}

.maintenance-quick-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.maintenance-quick-button {
  border: 1px solid #dce3eb;
  border-radius: 8px;
  padding: 0.45rem 0.65rem;
  background: #ffffff;
  color: #5c6879;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;
}

.maintenance-quick-button:hover {
  border-color: #9ab4dd;
  color: #2563eb;
}

.maintenance-quick-button.active {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
}


/* ============================================================
   CÁLCULO
============================================================ */

.maintenance-calculation-card {
  margin-top: 1.1rem;
  border: 1px solid #dfe6ef;
  border-radius: 13px;
  overflow: hidden;
  background: #ffffff;
}

.maintenance-calculation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid #e6ebf1;
  background: #f8fafc;
}

.maintenance-calculation-header > div {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #344256;
  font-size: 0.76rem;
  font-weight: 700;
}

.maintenance-calculation-header > div i {
  color: #2563eb;
}

.maintenance-calculation-grid {
  display: grid;
  grid-template-columns:
    repeat(
      4,
      minmax(0, 1fr)
    );
}

.maintenance-calculation-grid > div {
  padding: 0.8rem;
  border-right: 1px solid #edf0f4;
}

.maintenance-calculation-grid > div:last-child {
  border-right: 0;
}

.maintenance-calculation-grid small {
  display: block;
  color: #8893a2;
  font-size: 0.66rem;
}

.maintenance-calculation-grid strong {
  display: block;
  margin-top: 0.2rem;
  color: #27374b;
  font-size: 0.78rem;
}


/* ============================================================
   INFORMACIÓN FORMULARIO
============================================================ */

.maintenance-form-info {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin-top: 1rem;
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  background: rgba(37, 99, 235, 0.055);
  color: #5d6a7d;
}

.maintenance-form-info i {
  flex: 0 0 auto;
  margin-top: 0.08rem;
  color: #2563eb;
}

.maintenance-form-info p {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.45;
}


/* ============================================================
   DETALLE
============================================================ */

.maintenance-detail-modal {
  width: min(700px, 94vw);
}

.maintenance-detail-vehicle {
  display: grid;
  grid-template-columns:
    auto
    minmax(0, 1fr)
    auto;
  align-items: center;
  gap: 0.8rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e7ebf1;
}

.maintenance-detail-vehicle-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: rgba(37, 99, 235, 0.09);
  color: #2563eb;
  font-size: 1.2rem;
}

.maintenance-detail-vehicle h4 {
  margin: 0;
  color: #26364a;
  font-size: 0.98rem;
}

.maintenance-detail-vehicle p {
  margin: 0.17rem 0 0;
  color: #7b8797;
  font-size: 0.74rem;
}

.maintenance-detail-grid {
  display: grid;
  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );
  gap: 0.75rem;
  margin-top: 1rem;
}

.maintenance-detail-grid article {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.8rem;
  border: 1px solid #e5eaf0;
  border-radius: 11px;
  background: #ffffff;
}

.maintenance-detail-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 35px;
  height: 35px;
  border-radius: 9px;
  background: #f3f6fa;
  color: #59708f;
}

.maintenance-detail-grid small {
  display: block;
  color: #8994a2;
  font-size: 0.68rem;
}

.maintenance-detail-grid strong {
  display: block;
  margin-top: 0.12rem;
  color: #2b3a4d;
  font-size: 0.8rem;
}


/* ============================================================
   PROGRESO
============================================================ */

.maintenance-progress-card {
  margin-top: 1rem;
  padding: 0.9rem;
  border: 1px solid #e5eaf0;
  border-radius: 11px;
}

.maintenance-progress-header > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.maintenance-progress-header span {
  color: #687589;
  font-size: 0.72rem;
  font-weight: 600;
}

.maintenance-progress-header strong {
  color: #2b3a4d;
  font-size: 0.75rem;
}

.maintenance-progress-track {
  width: 100%;
  height: 8px;
  margin-top: 0.6rem;
  border-radius: 999px;
  overflow: hidden;
  background: #edf1f5;
}

.maintenance-progress-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.3s ease;
}

.maintenance-progress-fill.status-ok {
  background: #22a35a;
}

.maintenance-progress-fill.status-upcoming {
  background: #e49a21;
}

.maintenance-progress-fill.status-overdue {
  background: #d94a4a;
}

.maintenance-progress-fill.status-unconfigured {
  background: #94a3b8;
}

.maintenance-progress-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 0.35rem;
  color: #929baa;
  font-size: 0.65rem;
}


/* ============================================================
   MENSAJE DETALLE ESTADO
============================================================ */

.maintenance-state-detail {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  margin-top: 1rem;
  padding: 0.85rem;
  border-radius: 11px;
}

.maintenance-state-detail > i {
  flex: 0 0 auto;
  margin-top: 0.08rem;
}

.maintenance-state-detail strong {
  display: block;
  font-size: 0.78rem;
}

.maintenance-state-detail p {
  margin: 0.18rem 0 0;
  font-size: 0.71rem;
  line-height: 1.45;
}

.maintenance-state-detail.status-ok {
  background: rgba(22, 163, 74, 0.07);
  color: #297544;
}

.maintenance-state-detail.status-upcoming {
  background: rgba(245, 158, 11, 0.09);
  color: #9a620d;
}

.maintenance-state-detail.status-overdue {
  background: rgba(220, 38, 38, 0.07);
  color: #a83b3b;
}

.maintenance-state-detail.status-unconfigured {
  background: rgba(100, 116, 139, 0.08);
  color: #64748b;
}


/* ============================================================
   MODO OSCURO
============================================================ */

:global(.dark-mode .maintenance-stat-caption),
:global(.dark-mode .maintenance-vehicle-cell small),
:global(.dark-mode .maintenance-km-cell small),
:global(.dark-mode .maintenance-selected-info span),
:global(.dark-mode .maintenance-selected-km small),
:global(.dark-mode .maintenance-field-help),
:global(.dark-mode .maintenance-quick-section > span),
:global(.dark-mode .maintenance-calculation-grid small),
:global(.dark-mode .maintenance-detail-grid small),
:global(.dark-mode .maintenance-progress-header span),
:global(.dark-mode .maintenance-progress-footer) {
  color: #8492a6;
}

:global(.dark-mode .maintenance-notice) {
  border-color: rgba(96, 165, 250, 0.16);
  background: rgba(37, 99, 235, 0.08);
}

:global(.dark-mode .maintenance-notice-content strong),
:global(.dark-mode .maintenance-vehicle-cell strong),
:global(.dark-mode .maintenance-km-cell strong),
:global(.dark-mode .maintenance-selected-info strong),
:global(.dark-mode .maintenance-selected-km strong),
:global(.dark-mode .maintenance-calculation-grid strong),
:global(.dark-mode .maintenance-detail-vehicle h4),
:global(.dark-mode .maintenance-detail-grid strong),
:global(.dark-mode .maintenance-progress-header strong) {
  color: #dce5f1;
}

:global(.dark-mode .maintenance-notice-content p),
:global(.dark-mode .maintenance-detail-vehicle p),
:global(.dark-mode .maintenance-form-info) {
  color: #9aa7b8;
}

:global(.dark-mode .maintenance-selected-vehicle),
:global(.dark-mode .maintenance-calculation-header) {
  border-color: #273345;
  background: #111a27;
}

:global(.dark-mode .maintenance-calculation-card),
:global(.dark-mode .maintenance-detail-grid article),
:global(.dark-mode .maintenance-progress-card) {
  border-color: #273345;
  background: #0e1724;
}

:global(.dark-mode .maintenance-calculation-header),
:global(.dark-mode .maintenance-detail-vehicle) {
  border-color: #273345;
}

:global(.dark-mode .maintenance-calculation-grid > div) {
  border-color: #273345;
}

:global(.dark-mode .maintenance-quick-button) {
  border-color: #2c394b;
  background: #111a27;
  color: #a6b2c1;
}

:global(.dark-mode .maintenance-quick-button:hover),
:global(.dark-mode .maintenance-quick-button.active) {
  border-color: #4f8fe8;
  color: #74a9ef;
  background: rgba(37, 99, 235, 0.12);
}

:global(.dark-mode .maintenance-form-info) {
  background: rgba(37, 99, 235, 0.08);
}

:global(.dark-mode .maintenance-detail-icon) {
  background: #162131;
  color: #92a8c4;
}

:global(.dark-mode .maintenance-progress-track) {
  background: #202c3c;
}

:global(.admin-layout.admin-portal.dark-mode .maintenance-selected-vehicle),
:global(.admin-layout.admin-portal.dark-mode .maintenance-calculation-card) {
  border-color: #273345 !important;
  background: #0e1724 !important;
}

:global(.admin-layout.admin-portal.dark-mode .maintenance-calculation-header) {
  border-color: #273345 !important;
  background: #111a27 !important;
}

:global(.admin-layout.admin-portal.dark-mode .maintenance-quick-button) {
  border-color: #2c394b !important;
  background: #111a27 !important;
  color: #a6b2c1 !important;
}

:global(.admin-layout.admin-portal.dark-mode .maintenance-quick-button:hover),
:global(.admin-layout.admin-portal.dark-mode .maintenance-quick-button.active) {
  border-color: #4f8fe8 !important;
  background: rgba(37, 99, 235, 0.12) !important;
  color: #74a9ef !important;
}


/* ============================================================
   RESPONSIVE
============================================================ */

@media (max-width: 991px) {
  .maintenance-calculation-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }

  .maintenance-calculation-grid > div:nth-child(2) {
    border-right: 0;
  }

  .maintenance-calculation-grid > div {
    border-bottom: 1px solid #edf0f4;
  }

  .maintenance-calculation-grid > div:nth-last-child(-n + 2) {
    border-bottom: 0;
  }

  :global(.dark-mode)
    .maintenance-calculation-grid
    > div {
    border-bottom-color: #273345;
  }
}


@media (max-width: 767px) {
  .maintenance-notice {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .maintenance-notice-button {
    width: 100%;
  }

  .maintenance-form-grid,
  .maintenance-detail-grid {
    grid-template-columns:
      minmax(0, 1fr);
  }

  .maintenance-selected-vehicle {
    grid-template-columns:
      auto
      minmax(0, 1fr);
  }

  .maintenance-selected-km {
    grid-column: 1 / -1;
    padding-top: 0.6rem;
    border-top: 1px solid #e4e9ef;
    text-align: left;
  }

  :global(.dark-mode)
    .maintenance-selected-km {
    border-color: #273345;
  }

  .maintenance-detail-vehicle {
    grid-template-columns:
      auto
      minmax(0, 1fr);
  }

  .maintenance-detail-vehicle
    .maintenance-status {
    grid-column: 1 / -1;
  }
}


@media (max-width: 520px) {
  .maintenance-calculation-grid {
    grid-template-columns:
      minmax(0, 1fr);
  }

  .maintenance-calculation-grid > div {
    border-right: 0;
    border-bottom: 1px solid #edf0f4;
  }

  .maintenance-calculation-grid > div:nth-last-child(-n + 2) {
    border-bottom: 1px solid #edf0f4;
  }

  .maintenance-calculation-grid > div:last-child {
    border-bottom: 0;
  }

  :global(.dark-mode)
    .maintenance-calculation-grid
    > div:nth-last-child(-n + 2) {
    border-bottom-color: #273345;
  }

  .maintenance-calculation-header {
    align-items: flex-start;
    flex-direction: column;
  }
}

.maintenance-page
  :is(
    p,
    small,
    span,
    label,
    button,
    .maintenance-status,
    .maintenance-stat-caption,
    .maintenance-field-help,
    .maintenance-progress-footer
  ) {
  font-size: max(12px, 0.875em) !important;
}
</style>