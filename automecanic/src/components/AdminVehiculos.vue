<template>
  <div>
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
          {{ mechanicMode ? 'Mis vehículos' : 'Vehículos' }}
        </h2>

        <p>
          {{
            mechanicMode
              ? 'Consulta y administra las unidades asignadas a tu cuenta.'
              : 'Administra las unidades registradas en el taller.'
          }}
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
          @click="openNewModal"
        >
          <i class="bi bi-plus-lg"></i>

          Registrar vehículo
        </button>
      </div>
    </div>


    <!-- ======================================================
         ESTADÍSTICAS
    ======================================================= -->

    <div class="mini-stats-grid">
      <article class="mini-stat-card">
        <div class="mini-stat-icon blue">
          <i class="bi bi-car-front-fill"></i>
        </div>

        <div>
          <span>Total</span>

          <strong>
            {{ vehiculos.length }}
          </strong>
        </div>
      </article>


      <article class="mini-stat-card">
        <div class="mini-stat-icon green">
          <i class="bi bi-check-circle-fill"></i>
        </div>

        <div>
          <span>Activos</span>

          <strong>
            {{ totalActivos }}
          </strong>
        </div>
      </article>


      <article class="mini-stat-card">
        <div class="mini-stat-icon red">
          <i class="bi bi-x-circle-fill"></i>
        </div>

        <div>
          <span>Inactivos</span>

          <strong>
            {{ totalInactivos }}
          </strong>
        </div>
      </article>
    </div>


    <!-- ======================================================
         CONTENIDO
    ======================================================= -->

    <section class="section-card">
      <!-- FILTROS -->

      <div class="filters-row">
        <div class="search-box">
          <i class="bi bi-search"></i>

          <input
            v-model="search"
            type="text"
            placeholder="Buscar por placas, número económico, número de serie, marca, modelo o cliente..."
          />
        </div>


        <select
          v-model="typeFilter"
          class="filter-select"
        >
          <option value="">
            Todos los tipos
          </option>

          <option
            v-for="tipo in tiposUnidad"
            :key="tipo.value"
            :value="tipo.value"
          >
            {{ tipo.label }}
          </option>
        </select>


        <select
          v-model="statusFilter"
          class="filter-select"
        >
          <option value="">
            Todos los estados
          </option>

          <option value="Activo">
            Activos
          </option>

          <option value="Inactivo">
            Inactivos
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
          Cargando vehículos...
        </span>
      </div>


      <!-- TABLA -->

      <div
        v-else-if="filteredVehiculos.length"
        class="table-wrapper"
      >
        <table class="data-table">
          <thead>
            <tr>
              <th>Unidad</th>

              <th>Placas</th>

              <th>Vehículo</th>

              <th>Tipo</th>

              <th>Kilometraje</th>

              <th>Cliente</th>

              <th v-if="!mechanicMode">Mecánico</th>

              <th>Estado</th>

              <th class="actions-column">
                Acciones
              </th>
            </tr>
          </thead>


          <tbody>
            <tr
              v-for="vehiculo in filteredVehiculos"
              :key="vehiculo.id_vehiculo"
            >
              <!-- UNIDAD -->

              <td>
                <strong>
                  {{
                    vehiculo.no_economico ||
                    '—'
                  }}
                </strong>
              </td>


              <!-- PLACAS -->

              <td>
                <span class="plate-badge">
                  {{ vehiculo.placas }}
                </span>
              </td>


              <!-- VEHÍCULO -->

              <td>
                <div class="vehicle-table-cell">
                  <div class="table-vehicle-icon">
                    <i
                      :class="
                        getVehicleIcon(
                          vehiculo.tipo_unidad
                        )
                      "
                    ></i>
                  </div>

                  <div>
                    <strong>
                      {{ vehiculo.marca }}
                    </strong>

                    <small>
                      {{ vehiculo.modelo }}

                      {{
                        vehiculo.anio_modelo
                          ? `· ${vehiculo.anio_modelo}`
                          : ''
                      }}
                    </small>
                  </div>
                </div>
              </td>


              <!-- TIPO -->

              <td>
                {{
                  vehiculo.tipo_unidad ||
                  'No especificado'
                }}
              </td>


              <!-- KM -->

              <td>
                {{
                  formatKilometers(
                    vehiculo.kilometraje_actual
                  )
                }}
              </td>


              <!-- CLIENTE -->

              <td>
                <div class="vehicle-owner-cell">
                  <i class="bi bi-person"></i>

                  <span>
                    {{
                      getClientName(
                        vehiculo.id_cliente
                      )
                    }}
                  </span>
                </div>
              </td>


              <!-- MECÁNICO -->

              <td v-if="!mechanicMode">
                <div
                  v-if="vehiculo.id_mecanico"
                  class="vehicle-mechanic-cell"
                >
                  <i class="bi bi-wrench-adjustable"></i>

                  <span>
                    {{
                      getMechanicName(
                        vehiculo.id_mecanico
                      )
                    }}
                  </span>
                </div>

                <span
                  v-else
                  class="not-assigned-badge"
                >
                  Sin asignar
                </span>
              </td>


              <!-- ESTADO -->

              <td>
                <button
                  class="status-button"
                  :class="
                    isActive(vehiculo)
                      ? 'active'
                      : 'inactive'
                  "
                  type="button"
                  @click="
                    requestStatusChange(
                      vehiculo
                    )
                  "
                >
                  <span class="status-dot"></span>

                  {{
                    vehiculo.estatus ||
                    'Activo'
                  }}
                </button>
              </td>


              <!-- ACCIONES -->

              <td>
                <div class="table-actions">
                  <button
                    class="table-action-button view"
                    type="button"
                    title="Ver vehículo"
                    @click="
                      openViewModal(
                        vehiculo
                      )
                    "
                  >
                    <i class="bi bi-eye"></i>
                  </button>


                  <button
                    class="table-action-button edit"
                    type="button"
                    title="Editar vehículo"
                    @click="
                      openEditModal(
                        vehiculo
                      )
                    "
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>


                  <button
                    class="table-action-button delete"
                    type="button"
                    title="Eliminar vehículo"
                    @click="
                      requestDelete(
                        vehiculo
                      )
                    "
                  >
                    <i class="bi bi-trash3"></i>
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
        <i class="bi bi-car-front"></i>

        <h4>
          {{
            vehiculos.length
              ? 'No se encontraron vehículos'
              : 'No hay vehículos registrados'
          }}
        </h4>

        <p>
          {{
            vehiculos.length
              ? 'Modifica los filtros para mostrar otros resultados.'
              : 'Registra la primera unidad para comenzar.'
          }}
        </p>


        <button
          v-if="!vehiculos.length"
          class="primary-button"
          type="button"
          @click="openNewModal"
        >
          <i class="bi bi-plus-lg"></i>

          Registrar vehículo
        </button>
      </div>
    </section>


    <!-- ======================================================
         MODAL REGISTRAR / EDITAR
    ======================================================= -->

    <div
      v-if="showFormModal"
      class="modal-overlay"
      @click.self="closeFormModal"
    >
      <div class="app-modal vehicle-form-modal">
        <!-- HEADER -->

        <div class="modal-header">
          <div>
            <h3>
              {{
                editing
                  ? 'Actualizar vehículo'
                  : 'Registrar vehículo'
              }}
            </h3>

            <p>
              {{
                editing
                  ? 'Modifica la información de la unidad seleccionada.'
                  : mechanicMode
                    ? 'Registra una nueva unidad y selecciona su cliente propietario.'
                    : 'Registra una nueva unidad y asigna el mecánico responsable.'
              }}
            </p>
          </div>


          <button
            class="modal-close-button"
            type="button"
            @click="closeFormModal"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>


        <form
          class="modal-body"
          @submit.prevent="requestSave"
        >
          <!-- ================================================
               DATOS DE ASIGNACIÓN
          ================================================= -->

          <div class="form-section-title">
            <i class="bi bi-person-check"></i>

            <div>
              <strong>
                Asignación
              </strong>

              <span>
                {{
                  mechanicMode
                    ? 'Selecciona el cliente dueño de esta unidad'
                    : 'Cliente propietario y mecánico responsable'
                }}
              </span>
            </div>
          </div>


          <div class="form-grid">
            <!-- CLIENTE -->

            <div class="form-group">
              <label for="vehiculo-cliente">
                Cliente

                <span class="required">*</span>
              </label>

              <select
                id="vehiculo-cliente"
                v-model="form.id_cliente"
                required
              >
                <option value="">
                  Selecciona un cliente
                </option>

                <option
                  v-for="cliente in clientesActivos"
                  :key="cliente.id_cliente"
                  :value="cliente.id_cliente"
                >
                  {{
                    getFullUserName(
                      cliente.usuario
                    )
                  }}
                </option>
              </select>
            </div>


            <!-- MECÁNICO -->

            <div
              v-if="!mechanicMode"
              class="form-group"
            >
              <label for="vehiculo-mecanico">
                Asignar mecánico
              </label>

              <select
                id="vehiculo-mecanico"
                v-model="form.id_mecanico"
              >
                <option value="">
                  Sin mecánico asignado
                </option>

                <option
                  v-for="mecanico in mecanicosActivos"
                  :key="mecanico.id_mecanico"
                  :value="mecanico.id_mecanico"
                >
                  {{
                    getFullUserName(
                      mecanico.usuario
                    )
                  }}

                  {{
                    mecanico.especialidad
                      ? `— ${mecanico.especialidad}`
                      : ''
                  }}
                </option>
              </select>
            </div>
          </div>


          <!-- ================================================
               INFORMACIÓN VEHÍCULO
          ================================================= -->

          <div class="form-section-title form-section-spacing">
            <i class="bi bi-car-front"></i>

            <div>
              <strong>
                Información del vehículo
              </strong>

              <span>
                Datos de identificación de la unidad
              </span>
            </div>
          </div>


          <div class="vehicle-form-layout">
            <!-- FORMULARIO -->

            <div class="vehicle-form-fields">
              <div class="form-grid">
                <!-- NO ECONÓMICO -->

                <div class="form-group">
                  <label for="vehiculo-economico">
                    No. económico
                  </label>

                  <input
                    id="vehiculo-economico"
                    v-model="form.no_economico"
                    type="text"
                    maxlength="50"
                    placeholder="Ej. U-001"
                  />
                </div>


                <!-- PLACAS -->

                <div class="form-group">
                  <label for="vehiculo-placas">
                    Placas

                    <span class="required">*</span>
                  </label>

                  <input
                    id="vehiculo-placas"
                    v-model="form.placas"
                    type="text"
                    maxlength="30"
                    placeholder="ABC-123"
                    class="uppercase-input"
                    required
                    @input="
                      form.placas =
                        form.placas.toUpperCase()
                    "
                  />
                </div>


                <!-- NÚMERO DE SERIE -->

                <div class="form-group">
                  <label for="vehiculo-numero-serie">
                    Número de serie
                  </label>

                  <input
                    id="vehiculo-numero-serie"
                    v-model="form.numero_serie"
                    type="text"
                    maxlength="100"
                    placeholder="Ej. 3N1AB7AP0KY123456"
                  />
                </div>


                <!-- MARCA -->

                <div class="form-group">
                  <label for="vehiculo-marca">
                    Marca

                    <span class="required">*</span>
                  </label>

                  <input
                    id="vehiculo-marca"
                    v-model="form.marca"
                    type="text"
                    maxlength="80"
                    placeholder="Toyota"
                    required
                  />
                </div>


                <!-- MODELO -->

                <div class="form-group">
                  <label for="vehiculo-modelo">
                    Modelo

                    <span class="required">*</span>
                  </label>

                  <input
                    id="vehiculo-modelo"
                    v-model="form.modelo"
                    type="text"
                    maxlength="80"
                    placeholder="Hilux"
                    required
                  />
                </div>


                <!-- AÑO -->

                <div class="form-group">
                  <label for="vehiculo-anio">
                    Año
                  </label>

                  <input
                    id="vehiculo-anio"
                    v-model="form.anio_modelo"
                    type="number"
                    min="1900"
                    :max="currentYear + 1"
                    placeholder="2026"
                  />
                </div>


                <!-- TIPO -->

                <div class="form-group">
                  <label for="vehiculo-tipo">
                    Tipo de unidad

                    <span class="required">*</span>
                  </label>

                  <select
                    id="vehiculo-tipo"
                    v-model="form.tipo_unidad"
                    required
                  >
                    <option value="">
                      Selecciona el tipo
                    </option>

                    <option
                      v-for="tipo in tiposUnidad"
                      :key="tipo.value"
                      :value="tipo.value"
                    >
                      {{ tipo.label }}
                    </option>
                  </select>
                </div>


                <!-- KM -->

                <div class="form-group">
                  <label for="vehiculo-km">
                    Kilometraje actual
                  </label>

                  <div class="input-with-suffix">
                    <input
                      id="vehiculo-km"
                      v-model="form.kilometraje_actual"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                    />

                    <span>
                      km
                    </span>
                  </div>
                </div>


                <!-- ESTADO -->

                <div class="form-group">
                  <label for="vehiculo-estatus">
                    Estado

                    <span class="required">*</span>
                  </label>

                  <select
                    id="vehiculo-estatus"
                    v-model="form.estatus"
                    required
                  >
                    <option value="Activo">
                      Activo
                    </option>

                    <option value="Inactivo">
                      Inactivo
                    </option>
                  </select>
                </div>
              </div>
            </div>


            <!-- PREVISUALIZACIÓN -->

            <aside class="vehicle-type-preview">
              <span class="vehicle-preview-label">
                VISTA DE REFERENCIA
              </span>


              <div
                class="vehicle-preview-icon"
                :class="
                  getPreviewClass(
                    form.tipo_unidad
                  )
                "
              >
                <i
                  :class="
                    getVehicleIcon(
                      form.tipo_unidad
                    )
                  "
                ></i>
              </div>


              <strong>
                {{
                  getVehicleTypeLabel(
                    form.tipo_unidad
                  )
                }}
              </strong>


              <p>
                {{
                  form.marca ||
                  'Marca'
                }}

                {{ form.modelo || 'Modelo' }}

                {{
                  form.anio_modelo
                    ? `· ${form.anio_modelo}`
                    : ''
                }}
              </p>


              <span
                v-if="form.placas"
                class="vehicle-preview-plate"
              >
                {{ form.placas }}
              </span>


              <div class="preview-info-row">
                <i class="bi bi-speedometer2"></i>

                <span>
                  {{
                    form.kilometraje_actual !== ''
                      ? formatKilometers(
                          form.kilometraje_actual
                        )
                      : 'Kilometraje no capturado'
                  }}
                </span>
              </div>


              <div class="preview-info-row">
                <i class="bi bi-person"></i>

                <span>
                  {{
                    selectedClientName ||
                    'Cliente no seleccionado'
                  }}
                </span>
              </div>


              <div class="preview-info-row">
                <i class="bi bi-wrench-adjustable"></i>

                <span>
                  {{
                    selectedMechanicName ||
                    'Mecánico sin asignar'
                  }}
                </span>
              </div>
            </aside>
          </div>


          <!-- ================================================
               MANTENIMIENTO PREVENTIVO INICIAL
          ================================================= -->

          <section
            v-if="!editing"
            class="initial-maintenance-section"
          >
            <div class="form-section-title form-section-spacing">
              <i class="bi bi-speedometer2"></i>

              <div>
                <strong>Mantenimiento preventivo</strong>
                <span>Configura desde ahora el seguimiento por kilometraje de la unidad</span>
              </div>
            </div>

            <label class="maintenance-toggle-card">
              <input
                v-model="maintenanceForm.enabled"
                type="checkbox"
              />

              <span class="maintenance-toggle-icon">
                <i class="bi bi-calendar2-check"></i>
              </span>

              <span class="maintenance-toggle-copy">
                <strong>Configurar mantenimiento preventivo</strong>
                <small>Recomendado. Puedes desactivarlo y configurarlo después desde Mantenimiento preventivo.</small>
              </span>
            </label>

            <div
              v-if="maintenanceForm.enabled"
              class="maintenance-config-card"
            >
              <div class="form-grid">
                <div class="form-group">
                  <label for="maintenance-last-km">
                    Último mantenimiento
                    <span class="required">*</span>
                  </label>

                  <div class="input-with-suffix">
                    <input
                      id="maintenance-last-km"
                      v-model="maintenanceForm.ultimo_km_registrado"
                      type="number"
                      min="0"
                      :max="form.kilometraje_actual === '' ? undefined : Number(form.kilometraje_actual)"
                      step="1"
                      placeholder="0"
                      required
                      @input="maintenanceLastKmTouched = true"
                    />
                    <span>km</span>
                  </div>

                  <small class="maintenance-field-help">Kilometraje en el que se realizó el último mantenimiento.</small>
                </div>

                <div class="form-group">
                  <label for="maintenance-interval">
                    Intervalo de mantenimiento
                    <span class="required">*</span>
                  </label>

                  <div class="input-with-suffix">
                    <input
                      id="maintenance-interval"
                      v-model="maintenanceForm.intervalo"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="5000"
                      required
                    />
                    <span>km</span>
                  </div>

                  <small class="maintenance-field-help">Cada cuántos kilómetros debe realizarse el servicio.</small>
                </div>
              </div>

              <div class="maintenance-next-preview">
                <div class="maintenance-next-icon">
                  <i class="bi bi-flag-fill"></i>
                </div>

                <div>
                  <span>Próximo servicio programado</span>
                  <strong>{{ formatKilometers(nextMaintenanceKm) }}</strong>
                  <small>Se calcula automáticamente con el último mantenimiento + intervalo.</small>
                </div>
              </div>
            </div>
          </section>


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
                :class="
                  editing
                    ? 'bi bi-check2-circle'
                    : 'bi bi-car-front-fill'
                "
              ></i>

              {{
                saving
                  ? 'Procesando...'
                  : editing
                    ? 'Actualizar vehículo'
                    : 'Registrar vehículo'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>


    <!-- ======================================================
         MODAL VER VEHÍCULO
    ======================================================= -->

    <div
      v-if="
        showViewModal &&
        selectedVehiculo
      "
      class="modal-overlay"
      @click.self="closeViewModal"
    >
      <div class="app-modal vehicle-detail-modal">
        <div class="modal-header">
          <div>
            <h3>
              Información del vehículo
            </h3>

            <p>
              Información general de la unidad.
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
          <!-- CABECERA -->

          <div class="vehicle-detail-header">
            <div
              class="vehicle-detail-icon"
              :class="
                getPreviewClass(
                  selectedVehiculo.tipo_unidad
                )
              "
            >
              <i
                :class="
                  getVehicleIcon(
                    selectedVehiculo.tipo_unidad
                  )
                "
              ></i>
            </div>


            <div class="vehicle-detail-heading">
              <span>
                {{
                  selectedVehiculo.tipo_unidad ||
                  'Vehículo'
                }}
              </span>

              <h3>
                {{ selectedVehiculo.marca }}
                {{ selectedVehiculo.modelo }}
              </h3>

              <div>
                <span class="plate-badge">
                  {{ selectedVehiculo.placas }}
                </span>

                <span
                  class="status-badge"
                  :class="
                    isActive(
                      selectedVehiculo
                    )
                      ? 'active'
                      : 'inactive'
                  "
                >
                  {{
                    selectedVehiculo.estatus ||
                    'Activo'
                  }}
                </span>
              </div>
            </div>
          </div>


          <!-- DETALLES -->

          <div class="vehicle-detail-grid">
            <div class="detail-card">
              <i class="bi bi-hash"></i>

              <div>
                <small>No. económico</small>

                <strong>
                  {{
                    selectedVehiculo.no_economico ||
                    'No registrado'
                  }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-upc-scan"></i>

              <div>
                <small>Número de serie</small>

                <strong>
                  {{
                    selectedVehiculo.numero_serie ||
                    'No registrado'
                  }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-calendar3"></i>

              <div>
                <small>Año modelo</small>

                <strong>
                  {{
                    selectedVehiculo.anio_modelo ||
                    'No registrado'
                  }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-speedometer2"></i>

              <div>
                <small>Kilometraje actual</small>

                <strong>
                  {{
                    formatKilometers(
                      selectedVehiculo.kilometraje_actual
                    )
                  }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-car-front"></i>

              <div>
                <small>Tipo de unidad</small>

                <strong>
                  {{
                    selectedVehiculo.tipo_unidad ||
                    'No registrado'
                  }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-person"></i>

              <div>
                <small>Cliente</small>

                <strong>
                  {{
                    getClientName(
                      selectedVehiculo.id_cliente
                    )
                  }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-wrench-adjustable"></i>

              <div>
                <small v-if="!mechanicMode">Mecánico asignado</small>

                <strong v-if="!mechanicMode">
                  {{
                    selectedVehiculo.id_mecanico
                      ? getMechanicName(
                          selectedVehiculo.id_mecanico
                        )
                      : 'Sin asignar'
                  }}
                </strong>
              </div>
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

            Editar
          </button>
        </div>
      </div>
    </div>


    <!-- ======================================================
         CONFIRMACIÓN
    ======================================================= -->

    <div
      v-if="confirmation.visible"
      class="modal-overlay"
      @click.self="
        !processingConfirmation &&
        closeConfirmation()
      "
    >
      <div class="confirmation-modal">
        <div
          class="confirmation-icon"
          :class="confirmation.type"
        >
          <i
            :class="
              getConfirmationIcon()
            "
          ></i>
        </div>


        <h3>
          {{ confirmation.title }}
        </h3>


        <p>
          {{ confirmation.message }}
        </p>


        <div
          v-if="confirmation.item"
          class="vehicle-confirmation-card"
        >
          <div class="table-vehicle-icon">
            <i
              :class="
                getVehicleIcon(
                  confirmation.item.tipo_unidad
                )
              "
            ></i>
          </div>

          <div>
            <strong>
              {{ confirmation.item.marca }}
              {{ confirmation.item.modelo }}
            </strong>

            <span>
              {{ confirmation.item.placas }}
            </span>
          </div>
        </div>


        <div class="confirmation-actions">
          <button
            class="secondary-button"
            type="button"
            :disabled="
              processingConfirmation
            "
            @click="closeConfirmation"
          >
            Cancelar
          </button>


          <button
            :class="
              confirmation.type === 'delete'
                ? 'danger-button'
                : 'primary-button'
            "
            type="button"
            :disabled="
              processingConfirmation
            "
            @click="executeConfirmation"
          >
            <i
              v-if="
                processingConfirmation
              "
              class="bi bi-arrow-repeat spin"
            ></i>

            <i
              v-else
              :class="
                confirmation.type === 'delete'
                  ? 'bi bi-trash3'
                  : confirmation.type === 'status'
                    ? 'bi bi-arrow-repeat'
                    : 'bi bi-check2-circle'
              "
            ></i>


            {{
              processingConfirmation
                ? 'Procesando...'
                : confirmation.confirmText
            }}
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
  ref,
  watch
} from 'vue'

import {
  actualizarVehiculo,
  cambiarEstadoVehiculo,
  eliminarVehiculo,
  obtenerClientesVehiculo,
  obtenerMecanicosVehiculo,
  obtenerVehiculos,
  obtenerVehiculosMecanico,
  registrarVehiculo,
  registrarVehiculoConMantenimiento
} from '../services/vehiculoService.js'

import {
  obtenerClientesMecanico
} from '../services/clienteService.js'

/* ============================================================
   PROPS / EMITS
============================================================ */

const props = defineProps({
  mechanicMode: {
    type: Boolean,
    default: false
  },
  mechanicId: {
    type: [Number, String],
    default: null
  },
  action: {
    type: Object,
    default: null
  }
})


const emit = defineEmits([
  'action-consumed'
])


/* ============================================================
   ESTADO
============================================================ */

const vehiculos = ref([])

const clientes = ref([])

const mecanicos = ref([])

const loading = ref(false)

const saving = ref(false)

const processingConfirmation =
  ref(false)

const successMessage = ref('')

const errorMessage = ref('')

const search = ref('')

const statusFilter = ref('')

const typeFilter = ref('')

const showFormModal = ref(false)

const showViewModal = ref(false)

const editing = ref(false)

const selectedVehiculo = ref(null)


/* ============================================================
   TIPOS DE VEHÍCULO
============================================================ */

const tiposUnidad = [
  {
    value: 'Automóvil',
    label: 'Automóvil'
  },
  {
    value: 'SUV',
    label: 'SUV'
  },
  {
    value: 'Pickup',
    label: 'Pickup'
  },
  {
    value: 'Camioneta',
    label: 'Camioneta'
  },
  {
    value: 'Camión',
    label: 'Camión'
  },
  {
    value: 'Motocicleta',
    label: 'Motocicleta'
  }
]


/* ============================================================
   FORMULARIO
============================================================ */

const emptyForm = () => ({
  id_vehiculo: null,

  id_cliente: '',

  id_mecanico: '',

  no_economico: '',

  placas: '',

  numero_serie: '',

  marca: '',

  modelo: '',

  anio_modelo: '',

  tipo_unidad: '',

  kilometraje_actual: '',

  estatus: 'Activo'
})


const form = ref(
  emptyForm()
)


const emptyMaintenanceForm = () => ({
  enabled: true,
  ultimo_km_registrado: 0,
  intervalo: 5000
})


const maintenanceForm = ref(
  emptyMaintenanceForm()
)


const maintenanceLastKmTouched = ref(false)


const nextMaintenanceKm = computed(() => {
  if (!maintenanceForm.value.enabled) {
    return null
  }

  const ultimo = Number(
    maintenanceForm.value.ultimo_km_registrado || 0
  )

  const intervalo = Number(
    maintenanceForm.value.intervalo || 0
  )

  return ultimo + intervalo
})


watch(
  () => form.value.kilometraje_actual,
  value => {
    if (
      !editing.value &&
      maintenanceForm.value.enabled &&
      !maintenanceLastKmTouched.value
    ) {
      maintenanceForm.value.ultimo_km_registrado =
        value === '' || value === null || value === undefined
          ? 0
          : Number(value)
    }
  }
)


/* ============================================================
   CONFIRMACIÓN
============================================================ */

const confirmation = ref({
  visible: false,

  type: '',

  title: '',

  message: '',

  confirmText: '',

  item: null,

  action: null,

  newStatus: null
})


/* ============================================================
   AÑO
============================================================ */

const currentYear =
  new Date().getFullYear()


/* ============================================================
   CLIENTES ACTIVOS
============================================================ */

const clientesActivos =
  computed(() => {
    return clientes.value.filter(
      cliente => {
        /*
         * Si estamos editando, permitimos mostrar también
         * al cliente actual aunque haya sido marcado Inactivo.
         */

        const esActual =
          editing.value &&
          Number(
            cliente.id_cliente
          ) ===
          Number(
            form.value.id_cliente
          )


        return (
          esActual ||
          String(
            cliente.usuario?.estatus ||
            'Activo'
          )
            .trim()
            .toLowerCase() ===
            'activo'
        )
      }
    )
  })


/* ============================================================
   MECÁNICOS ACTIVOS
============================================================ */

const mecanicosActivos =
  computed(() => {
    return mecanicos.value.filter(
      mecanico => {
        const esActual =
          editing.value &&
          Number(
            mecanico.id_mecanico
          ) ===
          Number(
            form.value.id_mecanico
          )


        return (
          esActual ||
          String(
            mecanico.usuario?.estatus ||
            'Activo'
          )
            .trim()
            .toLowerCase() ===
            'activo'
        )
      }
    )
  })


/* ============================================================
   FILTRO
============================================================ */

const filteredVehiculos =
  computed(() => {
    const term =
      search.value
        .trim()
        .toLowerCase()


    return vehiculos.value.filter(
      vehiculo => {
        const cliente =
          getClientName(
            vehiculo.id_cliente
          )

        const mecanico =
          getMechanicName(
            vehiculo.id_mecanico
          )


        const searchable = `
          ${vehiculo.no_economico || ''}
          ${vehiculo.placas || ''}
          ${vehiculo.numero_serie || ''}
          ${vehiculo.marca || ''}
          ${vehiculo.modelo || ''}
          ${vehiculo.anio_modelo || ''}
          ${vehiculo.tipo_unidad || ''}
          ${cliente}
          ${mecanico}
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


        const estado =
          String(
            vehiculo.estatus ||
            'Activo'
          )
            .trim()
            .toLowerCase()


        const matchesStatus =
          !statusFilter.value ||
          estado ===
            statusFilter.value
              .toLowerCase()


        const tipo =
          String(
            vehiculo.tipo_unidad ||
            ''
          )
            .trim()
            .toLowerCase()


        const matchesType =
          !typeFilter.value ||
          tipo ===
            typeFilter.value
              .toLowerCase()


        return (
          matchesSearch &&
          matchesStatus &&
          matchesType
        )
      }
    )
  })


/* ============================================================
   ESTADÍSTICAS
============================================================ */

const totalActivos =
  computed(() => {
    return vehiculos.value.filter(
      vehiculo =>
        isActive(
          vehiculo
        )
    ).length
  })


const totalInactivos =
  computed(() => {
    return (
      vehiculos.value.length -
      totalActivos.value
    )
  })


/* ============================================================
   DATOS SELECCIONADOS EN PREVIEW
============================================================ */

const selectedClientName =
  computed(() => {
    if (!form.value.id_cliente) {
      return ''
    }

    return getClientName(
      form.value.id_cliente
    )
  })


const selectedMechanicName =
  computed(() => {
    if (!form.value.id_mecanico) {
      return ''
    }

    return getMechanicName(
      form.value.id_mecanico
    )
  })


/* ============================================================
   CARGAR
============================================================ */

const loadAll = async () => {
  loading.value = true

  errorMessage.value = ''


  try {
    let vehiculosData
    let clientesData
    let mecanicosData

    if (props.mechanicMode) {
      if (!props.mechanicId) {
        throw new Error(
          'No se recibió el identificador del mecánico con sesión iniciada.'
        )
      }

      const [vehicles, customerResult] = await Promise.all([
        obtenerVehiculosMecanico(props.mechanicId),
        obtenerClientesMecanico(props.mechanicId)
      ])

      vehiculosData = vehicles
      clientesData = customerResult.clientes
      mecanicosData = []
    } else {
      [
        vehiculosData,
        clientesData,
        mecanicosData
      ] = await Promise.all([
        obtenerVehiculos(),
        obtenerClientesVehiculo(),
        obtenerMecanicosVehiculo()
      ])
    }


    vehiculos.value =
      vehiculosData

    clientes.value =
      clientesData

    mecanicos.value =
      mecanicosData
  } catch (error) {
    console.error(
      'Error cargando vehículos:',
      error
    )

    errorMessage.value =
      getErrorMessage(
        error,
        'No fue posible cargar los vehículos.'
      )
  } finally {
    loading.value = false
  }
}


/* ============================================================
   NUEVO
============================================================ */

const openNewModal = () => {
  editing.value = false

  selectedVehiculo.value =
    null

  form.value =
    emptyForm()

  if (props.mechanicMode) {
    form.value.id_mecanico = props.mechanicId || ''
  }

  maintenanceForm.value =
    emptyMaintenanceForm()

  maintenanceLastKmTouched.value =
    false

  showFormModal.value =
    true
}


/* ============================================================
   EDITAR
============================================================ */

const openEditModal = vehiculo => {
  editing.value = true

  selectedVehiculo.value =
    vehiculo


  form.value = {
    id_vehiculo:
      vehiculo.id_vehiculo,

    id_cliente:
      vehiculo.id_cliente ||
      '',

    id_mecanico:
      vehiculo.id_mecanico ||
      '',

    no_economico:
      vehiculo.no_economico ||
      '',

    placas:
      vehiculo.placas ||
      '',

    numero_serie:
      vehiculo.numero_serie ||
      '',

    marca:
      vehiculo.marca ||
      '',

    modelo:
      vehiculo.modelo ||
      '',

    anio_modelo:
      vehiculo.anio_modelo ??
      '',

    tipo_unidad:
      vehiculo.tipo_unidad ||
      '',

    kilometraje_actual:
      vehiculo.kilometraje_actual ??
      '',

    estatus:
      vehiculo.estatus ||
      'Activo'
  }


  showFormModal.value =
    true
}


/* ============================================================
   VER
============================================================ */

const openViewModal = vehiculo => {
  selectedVehiculo.value =
    vehiculo

  showViewModal.value =
    true
}


const closeViewModal = () => {
  showViewModal.value =
    false

  selectedVehiculo.value =
    null
}


const editFromView = () => {
  const vehiculo =
    selectedVehiculo.value

  showViewModal.value =
    false


  if (vehiculo) {
    openEditModal(
      vehiculo
    )
  }
}


/* ============================================================
   CERRAR
============================================================ */

const closeFormModal = () => {
  if (saving.value) {
    return
  }


  showFormModal.value =
    false

  editing.value =
    false

  selectedVehiculo.value =
    null

  form.value =
    emptyForm()

  maintenanceForm.value =
    emptyMaintenanceForm()

  maintenanceLastKmTouched.value =
    false
}


/* ============================================================
   GUARDADO
============================================================ */

const requestSave = () => {
  errorMessage.value = ''


  const validation =
    validateForm()


  if (validation) {
    errorMessage.value =
      validation

    return
  }


  if (!editing.value) {
    createVehiculo()

    return
  }


  confirmation.value = {
    visible: true,

    type: 'update',

    title:
      '¿Actualizar vehículo?',

    message:
      `¿Está seguro(a) de actualizar la información del vehículo ${form.value.placas}?`,

    confirmText:
      'Sí, actualizar',

    item:
      selectedVehiculo.value,

    action:
      'update',

    newStatus:
      null
  }
}


/* ============================================================
   CREAR
============================================================ */

const createVehiculo = async () => {
  saving.value = true

  errorMessage.value = ''

  successMessage.value = ''


  try {
    if (props.mechanicMode) {
      if (!props.mechanicId) {
        throw new Error(
          'No se pudo identificar al mecánico que registra el vehículo.'
        )
      }

      form.value.id_mecanico = props.mechanicId
    }

    if (maintenanceForm.value.enabled) {
      await registrarVehiculoConMantenimiento(
        form.value,
        {
          ultimo_km_registrado:
            Number(maintenanceForm.value.ultimo_km_registrado),
          intervalo:
            Number(maintenanceForm.value.intervalo)
        }
      )
    } else {
      await registrarVehiculo(
        form.value
      )
    }


    showFormModal.value =
      false

    form.value =
      emptyForm()


    successMessage.value =
      maintenanceForm.value.enabled
        ? 'El vehículo y su mantenimiento preventivo fueron registrados correctamente.'
        : 'El vehículo fue registrado correctamente.'


    await loadAll()

    clearSuccessLater()
  } catch (error) {
    console.error(
      'Error registrando vehículo:',
      error
    )

    errorMessage.value =
      getErrorMessage(
        error,
        'No fue posible registrar el vehículo.'
      )
  } finally {
    saving.value = false
  }
}


/* ============================================================
   ACTUALIZAR
============================================================ */

const updateVehiculo = async () => {
  if (!form.value.id_vehiculo) {
    throw new Error(
      'No se encontró el vehículo.'
    )
  }


  saving.value = true


  try {
    if (props.mechanicMode) {
      if (!props.mechanicId) {
        throw new Error(
          'No se pudo identificar al mecánico que actualiza el vehículo.'
        )
      }

      form.value.id_mecanico = props.mechanicId
    }

    await actualizarVehiculo(
      form.value.id_vehiculo,
      form.value
    )


    showFormModal.value =
      false

    editing.value =
      false

    selectedVehiculo.value =
      null

    form.value =
      emptyForm()


    successMessage.value =
      'El vehículo fue actualizado correctamente.'


    await loadAll()

    clearSuccessLater()
  } finally {
    saving.value = false
  }
}


/* ============================================================
   ESTADO
============================================================ */

const requestStatusChange = vehiculo => {
  const currentStatus =
    isActive(vehiculo)
      ? 'Activo'
      : 'Inactivo'


  const newStatus =
    currentStatus === 'Activo'
      ? 'Inactivo'
      : 'Activo'


  confirmation.value = {
    visible: true,

    type: 'status',

    title:
      `¿Cambiar a ${newStatus}?`,

    message:
      `¿Está seguro(a) de cambiar el vehículo ${vehiculo.placas} de ${currentStatus} a ${newStatus}?`,

    confirmText:
      `Cambiar a ${newStatus}`,

    item:
      vehiculo,

    action:
      'status',

    newStatus
  }
}


const updateStatus = async () => {
  const vehiculo =
    confirmation.value.item


  if (!vehiculo?.id_vehiculo) {
    throw new Error(
      'No se encontró el vehículo.'
    )
  }


  await cambiarEstadoVehiculo(
    vehiculo.id_vehiculo,
    confirmation.value.newStatus
  )


  successMessage.value =
    `El vehículo ahora está ${confirmation.value.newStatus}.`


  await loadAll()

  clearSuccessLater()
}


/* ============================================================
   ELIMINAR
============================================================ */

const requestDelete = vehiculo => {
  confirmation.value = {
    visible: true,

    type: 'delete',

    title:
      '¿Eliminar vehículo?',

    message:
      'Si esta unidad ya contiene servicios, configuraciones de mantenimiento, alertas o citas, la eliminación será bloqueada para proteger su historial.',

    confirmText:
      'Sí, eliminar',

    item:
      vehiculo,

    action:
      'delete',

    newStatus:
      null
  }
}


const deleteVehiculo = async () => {
  const vehiculo =
    confirmation.value.item


  if (!vehiculo?.id_vehiculo) {
    throw new Error(
      'No se encontró el vehículo.'
    )
  }


  await eliminarVehiculo(
    vehiculo.id_vehiculo
  )


  successMessage.value =
    'El vehículo fue eliminado correctamente.'


  await loadAll()

  clearSuccessLater()
}


const executeConfirmation = async () => {
  if (processingConfirmation.value) {
    return
  }

  processingConfirmation.value = true
  errorMessage.value = ''

  try {
    switch (confirmation.value.action) {
      case 'update':
        await updateVehiculo()
        break

      case 'status':
        await updateStatus()
        break

      case 'delete':
        await deleteVehiculo()
        break

      default:
        return
    }
  } catch (error) {
    console.error(
      'Error ejecutando acción:',
      error
    )

    errorMessage.value =
      getErrorMessage(
        error,
        'No fue posible realizar la acción.'
      )
  } finally {
    processingConfirmation.value = false
    closeConfirmation()
  }
}


const closeConfirmation = () => {
  if (processingConfirmation.value) {
    return
  }

  confirmation.value = {
    visible: false,

    type: '',

    title: '',

    message: '',

    confirmText: '',

    item: null,

    action: null,

    newStatus: null
  }
}


/* ============================================================
   VALIDACIÓN
============================================================ */

const validateForm = () => {
  if (!form.value.id_cliente) {
    return 'Selecciona el cliente propietario.'
  }


  if (!form.value.placas.trim()) {
    return 'Ingresa las placas.'
  }


  if (!form.value.marca.trim()) {
    return 'Ingresa la marca.'
  }


  if (!form.value.modelo.trim()) {
    return 'Ingresa el modelo.'
  }


  if (!form.value.tipo_unidad) {
    return 'Selecciona el tipo de unidad.'
  }


  if (
    form.value.anio_modelo !== ''
  ) {
    const year =
      Number(
        form.value.anio_modelo
      )


    if (
      year < 1900 ||
      year > currentYear + 1
    ) {
      return `El año debe estar entre 1900 y ${currentYear + 1}.`
    }
  }


  if (
    form.value.kilometraje_actual !== '' &&
    Number(
      form.value.kilometraje_actual
    ) < 0
  ) {
    return 'El kilometraje no puede ser negativo.'
  }


  if (
    !editing.value &&
    maintenanceForm.value.enabled
  ) {
    const kilometrajeActual = Number(
      form.value.kilometraje_actual || 0
    )

    const ultimoKm = Number(
      maintenanceForm.value.ultimo_km_registrado
    )

    const intervalo = Number(
      maintenanceForm.value.intervalo
    )

    if (
      !Number.isFinite(ultimoKm) ||
      ultimoKm < 0
    ) {
      return 'Ingresa un kilometraje válido para el último mantenimiento.'
    }

    if (ultimoKm > kilometrajeActual) {
      return 'El último mantenimiento no puede ser mayor que el kilometraje actual del vehículo.'
    }

    if (
      !Number.isFinite(intervalo) ||
      intervalo <= 0
    ) {
      return 'El intervalo de mantenimiento debe ser mayor a 0 km.'
    }
  }


  return ''
}


/* ============================================================
   NOMBRES
============================================================ */

const getFullUserName = usuario => {
  if (!usuario) {
    return 'Sin información'
  }


  return `
    ${usuario.nombre || ''}
    ${usuario.apellido_paterno || ''}
    ${usuario.apellido_materno || ''}
  `
    .replace(
      /\s+/g,
      ' '
    )
    .trim() ||
    'Sin nombre'
}


const getClientName = idCliente => {
  if (!idCliente) {
    return 'Sin cliente'
  }


  const cliente =
    clientes.value.find(
      item =>
        Number(
          item.id_cliente
        ) ===
        Number(
          idCliente
        )
    )


  if (!cliente) {
    return `Cliente #${idCliente}`
  }


  return getFullUserName(
    cliente.usuario
  )
}


const getMechanicName = idMecanico => {
  if (!idMecanico) {
    return 'Sin asignar'
  }


  const mecanico =
    mecanicos.value.find(
      item =>
        Number(
          item.id_mecanico
        ) ===
        Number(
          idMecanico
        )
    )


  if (!mecanico) {
    return `Mecánico #${idMecanico}`
  }


  return getFullUserName(
    mecanico.usuario
  )
}


/* ============================================================
   TIPO VEHÍCULO
============================================================ */

const getVehicleTypeLabel = type => {
  if (!type) {
    return 'Selecciona un tipo'
  }


  const item =
    tiposUnidad.find(
      tipo =>
        tipo.value === type
    )


  return (
    item?.label ||
    type
  )
}


const getVehicleIcon = type => {
  const value =
    String(
      type || ''
    )
      .trim()
      .toLowerCase()


  if (
    value.includes('moto')
  ) {
    return 'bi bi-bicycle'
  }


  if (
    value.includes('camión') ||
    value.includes('camion')
  ) {
    return 'bi bi-truck-front-fill'
  }


  if (
    value.includes('pickup')
  ) {
    return 'bi bi-truck'
  }


  if (
    value.includes('suv') ||
    value.includes('camioneta')
  ) {
    return 'bi bi-car-front-fill'
  }


  return 'bi bi-car-front-fill'
}


const getPreviewClass = type => {
  const value =
    String(
      type || ''
    )
      .trim()
      .toLowerCase()


  if (
    value.includes('moto')
  ) {
    return 'motorcycle'
  }


  if (
    value.includes('camión') ||
    value.includes('camion')
  ) {
    return 'truck'
  }


  if (
    value.includes('pickup')
  ) {
    return 'pickup'
  }


  if (
    value.includes('suv') ||
    value.includes('camioneta')
  ) {
    return 'suv'
  }


  return 'car'
}


/* ============================================================
   FORMATO
============================================================ */

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
    ) +
    ' km'
  )
}


/* ============================================================
   ESTADO
============================================================ */

const isActive = vehiculo => {
  return (
    String(
      vehiculo?.estatus ||
      'Activo'
    )
      .trim()
      .toLowerCase() ===
    'activo'
  )
}


/* ============================================================
   CONFIRMACIÓN ICONO
============================================================ */

const getConfirmationIcon = () => {
  switch (
    confirmation.value.type
  ) {
    case 'delete':

      return 'bi bi-trash3-fill'


    case 'status':

      return 'bi bi-arrow-repeat'


    default:

      return 'bi bi-question-lg'
  }
}


/* ============================================================
   ERRORES
============================================================ */

const getErrorMessage = (
  error,
  fallback
) => {
  const message =
    error?.message ||
    error?.error_description ||
    ''


  if (
    error?.code === '23505'
  ) {
    return 'Las placas ingresadas ya están registradas.'
  }


  if (
    error?.code === '23503'
  ) {
    return 'No se puede eliminar este vehículo porque tiene información relacionada.'
  }


  if (
    message
      .toLowerCase()
      .includes('duplicate')
  ) {
    return 'Las placas ingresadas ya están registradas.'
  }


  return (
    message ||
    fallback
  )
}


/* ============================================================
   ÉXITO TEMPORAL
============================================================ */

const clearSuccessLater = () => {
  setTimeout(
    () => {
      successMessage.value = ''
    },
    3500
  )
}


/* ============================================================
   ACCIÓN DESDE INICIO
============================================================ */

watch(
  () =>
    props.action?.token,

  () => {
    if (
      props.action?.type ===
      'new'
    ) {
      openNewModal()

      emit(
        'action-consumed'
      )
    }
  },

  {
    immediate: true
  }
)


/* ============================================================
   MOUNT
============================================================ */

onMounted(() => {
  loadAll()
})
</script>

<style scoped>
.initial-maintenance-section {
  margin-top: 22px;
}

.maintenance-toggle-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--border-color, rgba(148, 163, 184, 0.24));
  border-radius: 14px;
  cursor: pointer;
  box-sizing: border-box;
}

.maintenance-toggle-card input {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  accent-color: #06b6d4;
}

.maintenance-toggle-icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 38px;
  border-radius: 11px;
  background: rgba(6, 182, 212, 0.12);
  color: #22d3ee;
  font-size: 17px;
}

.maintenance-toggle-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.maintenance-toggle-copy strong {
  font-size: 13px;
}

.maintenance-toggle-copy small,
.maintenance-field-help {
  opacity: 0.72;
  line-height: 1.45;
}

.maintenance-config-card {
  margin-top: 12px;
  padding: 16px;
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 14px;
  background: rgba(6, 182, 212, 0.035);
}

.maintenance-field-help {
  display: block;
  margin-top: 6px;
  font-size: 11px;
}

.maintenance-next-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 13px 14px;
  border: 1px solid rgba(34, 197, 94, 0.22);
  border-radius: 12px;
  background: rgba(34, 197, 94, 0.07);
}

.maintenance-next-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 38px;
  border-radius: 10px;
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
}

.maintenance-next-preview > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.maintenance-next-preview span,
.maintenance-next-preview small {
  opacity: 0.76;
}

.maintenance-next-preview strong {
  font-size: 18px;
}

@media (max-width: 700px) {
  .maintenance-toggle-card,
  .maintenance-next-preview {
    align-items: flex-start;
  }

  .maintenance-config-card {
    padding: 13px;
  }
}
</style>
