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
         ENCABEZADO
    ======================================================= -->

    <div class="page-toolbar">
      <div>
        <h2>
          Servicios y mantenimiento
        </h2>

        <p>
          Registra servicios, mantenimiento preventivo
          e inspección de llantas desde un mismo flujo.
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
          @click="openNewService"
        >
          <i class="bi bi-wrench-adjustable-circle"></i>

          Registrar servicio
        </button>
      </div>
    </div>


    <!-- ======================================================
         RESUMEN
    ======================================================= -->

    <div class="mini-stats-grid">
      <article class="mini-stat-card">
        <div class="mini-stat-icon blue">
          <i class="bi bi-wrench-adjustable"></i>
        </div>

        <div>
          <span>Servicios registrados</span>

          <strong>
            {{ servicios.length }}
          </strong>
        </div>
      </article>


      <article class="mini-stat-card">
        <div class="mini-stat-icon green">
          <i class="bi bi-calendar-check"></i>
        </div>

        <div>
          <span>Este mes</span>

          <strong>
            {{ serviciosMesActual }}
          </strong>
        </div>
      </article>


      <article class="mini-stat-card">
        <div class="mini-stat-icon red">
          <i class="bi bi-speedometer2"></i>
        </div>

        <div>
          <span>Vehículos</span>

          <strong>
            {{ vehiculos.length }}
          </strong>
        </div>
      </article>
    </div>


    <!-- ======================================================
         HISTORIAL
    ======================================================= -->

    <section class="section-card">
      <div class="filters-row">
        <div class="search-box">
          <i class="bi bi-search"></i>

          <input
            v-model="search"
            type="text"
            placeholder="Buscar por placas, vehículo, mecánico o fecha..."
          />
        </div>


        <select
          v-model="vehicleFilter"
          class="filter-select"
        >
          <option value="">
            Todos los vehículos
          </option>

          <option
            v-for="vehiculo in vehiculos"
            :key="vehiculo.id_vehiculo"
            :value="String(vehiculo.id_vehiculo)"
          >
            {{ vehiculo.placas }} — {{ vehiculo.marca }} {{ vehiculo.modelo }}
          </option>
        </select>


        <input
          v-model="dateFilter"
          class="filter-date"
          type="date"
        />
      </div>


      <div
        v-if="loading"
        class="component-loading"
      >
        <div class="app-spinner"></div>

        <span>
          Cargando servicios...
        </span>
      </div>


      <div
        v-else-if="filteredServicios.length"
        class="table-wrapper"
      >
        <table class="data-table">
          <thead>
            <tr>
              <th>Servicio</th>

              <th>Fecha</th>

              <th>Vehículo</th>

              <th>Kilometraje</th>

              <th>Mecánico</th>

              <th>Observaciones</th>

              <th class="actions-column">
                Acciones
              </th>
            </tr>
          </thead>


          <tbody>
            <tr
              v-for="servicio in filteredServicios"
              :key="servicio.id_servicio"
            >
              <td>
                <strong>
                  #{{ servicio.id_servicio }}
                </strong>
              </td>


              <td>
                {{
                  formatDate(
                    servicio.fecha_servicio
                  )
                }}
              </td>


              <td>
                <div class="service-vehicle-cell">
                  <div class="table-vehicle-icon">
                    <i
                      :class="
                        getVehicleIcon(
                          getVehicle(
                            servicio.id_vehiculo
                          )?.tipo_unidad
                        )
                      "
                    ></i>
                  </div>

                  <div>
                    <strong>
                      {{
                        getVehicleName(
                          servicio.id_vehiculo
                        )
                      }}
                    </strong>

                    <small>
                      {{
                        getVehicle(
                          servicio.id_vehiculo
                        )?.placas ||
                        'Sin placas'
                      }}
                    </small>
                  </div>
                </div>
              </td>


              <td>
                {{
                  formatKilometers(
                    servicio.kilometraje
                  )
                }}
              </td>


              <td>
                {{
                  getMechanicName(
                    servicio.id_mecanico
                  )
                }}
              </td>


              <td>
                <span
                  class="service-observation"
                  :title="
                    servicio.observaciones_generales ||
                    'Sin observaciones'
                  "
                >
                  {{
                    servicio.observaciones_generales ||
                    'Sin observaciones'
                  }}
                </span>
              </td>


              <td>
                <div class="table-actions">
                  <button
                    class="table-action-button view"
                    type="button"
                    title="Ver servicio"
                    @click="
                      openDetail(
                        servicio
                      )
                    "
                  >
                    <i class="bi bi-eye"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>


      <div
        v-else
        class="empty-state"
      >
        <i class="bi bi-wrench-adjustable"></i>

        <h4>
          No hay servicios para mostrar
        </h4>

        <p>
          Registra el primer servicio del taller.
        </p>

        <button
          v-if="!servicios.length"
          class="primary-button"
          type="button"
          @click="openNewService"
        >
          Registrar servicio
        </button>
      </div>
    </section>


    <!-- ======================================================
         MODAL NUEVO SERVICIO
    ======================================================= -->

    <div
      v-if="showServiceModal"
      class="modal-overlay service-modal-overlay"
      @click.self="closeServiceModal"
    >
      <div class="app-modal service-modal">
        <!-- HEADER -->

        <div class="modal-header">
          <div>
            <h3>
              Registrar servicio y mantenimiento
            </h3>

            <p>
              Captura el kilometraje una sola vez y completa
              únicamente las áreas revisadas.
            </p>
          </div>


          <button
            class="modal-close-button"
            type="button"
            :disabled="saving"
            @click="closeServiceModal"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>


        <!-- STEPS -->

        <div class="service-stepper">
          <button
            v-for="step in steps"
            :key="step.id"
            class="service-step"
            :class="{
              active:
                activeStep === step.id,

              completed:
                isStepCompleted(step.id)
            }"
            type="button"
            @click="selectStep(step.id)"
          >
            <span class="service-step-icon">
              <i :class="step.icon"></i>
            </span>

            <span>
              {{ step.label }}
            </span>
          </button>
        </div>


        <div class="modal-body service-modal-body">
          <div
            v-if="stepValidationMessage"
            class="app-alert danger"
            role="alert"
          >
            <i class="bi bi-exclamation-triangle-fill"></i>
            {{ stepValidationMessage }}
          </div>

          <!-- =================================================
               PASO GENERAL
          ================================================== -->

          <section
            v-show="activeStep === 'general'"
            class="service-step-content"
          >
            <div class="form-section-title">
              <i class="bi bi-clipboard2-check"></i>

              <div>
                <strong>
                  Información general
                </strong>

                <span>
                  Vehículo, mecánico, fecha y kilometraje
                </span>
              </div>
            </div>


            <div class="form-grid">
              <!-- VEHÍCULO -->

              <div class="form-group">
                <label>
                  Vehículo

                  <span class="required">*</span>
                </label>

                <select
                  v-model="general.id_vehiculo"
                  required
                  @change="handleVehicleChange"
                >
                  <option value="">
                    Selecciona un vehículo
                  </option>

                  <option
                    v-for="vehiculo in vehiculosDisponiblesServicio"
                    :key="vehiculo.id_vehiculo"
                    :value="vehiculo.id_vehiculo"
                  >
                    {{ vehiculo.placas }}
                    —
                    {{ vehiculo.marca }}
                    {{ vehiculo.modelo }}
                  </option>
                </select>
              </div>


              <!-- MECÁNICO -->

              <div class="form-group">
                <label>
                  Mecánico responsable
                </label>

                <select
                  v-if="!mechanicMode"
                  v-model="general.id_mecanico"
                >
                  <option value="">
                    Sin asignar
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
                <input
                  v-else
                  :value="mechanicName"
                  type="text"
                  readonly
                />
              </div>


              <!-- FECHA -->

        <div class="form-group">
          <label>
               Fecha del servicio

        <span class="required">*</span>
      </label>

  <input
    v-model="general.fecha_servicio"
    class="service-date-input"
    type="date"
    required
  />
</div>


              <!-- KILOMETRAJE -->

              <div class="form-group">
                <label>
                  Kilometraje actual

                  <span class="required">*</span>
                </label>

                <div class="input-with-suffix">
                  <input
                    v-model="general.kilometraje"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    required
                  />

                  <span>km</span>
                </div>
              </div>


              <!-- OBSERVACIONES -->

              <div class="form-group form-group-full">
                <label>
                  Observaciones generales
                </label>

                <textarea
                  v-model="general.observaciones_generales"
                  rows="4"
                  maxlength="1000"
                  placeholder="Observaciones generales del servicio..."
                ></textarea>
              </div>
            </div>


            <!-- VEHÍCULO SELECCIONADO -->

            <div
              v-if="selectedVehicle"
              class="selected-service-vehicle"
            >
              <div
                class="selected-service-vehicle-icon"
                :class="
                  getPreviewClass(
                    selectedVehicle.tipo_unidad
                  )
                "
              >
                <i
                  :class="
                    getVehicleIcon(
                      selectedVehicle.tipo_unidad
                    )
                  "
                ></i>
              </div>


              <div>
                <span>
                  VEHÍCULO SELECCIONADO
                </span>

                <h4>
                  {{ selectedVehicle.marca }}
                  {{ selectedVehicle.modelo }}
                </h4>

                <p>
                  {{ selectedVehicle.placas }}

                  ·

                  {{
                    selectedVehicle.tipo_unidad ||
                    'Sin tipo'
                  }}

                  ·

                  {{
                    formatKilometers(
                      selectedVehicle.kilometraje_actual
                    )
                  }}
                </p>
              </div>
            </div>
          </section>


          <!-- =================================================
               MOTOR
          ================================================== -->

          <section
            v-show="activeStep === 'motor'"
            class="service-step-content"
          >
            <div class="service-section-toggle">
              <div>
                <div class="form-section-title no-margin">
                  <i class="bi bi-gear-wide-connected"></i>

                  <div>
                    <strong>
                      Servicio de motor
                    </strong>

                    <span>
                      Activa el módulo y captura al menos un dato
                    </span>
                  </div>
                </div>
              </div>


              <label class="switch-control">
                <input
                  v-model="incluirMotor"
                  type="checkbox"
                />

                <span></span>

                Registrar motor
              </label>
            </div>


            <div
              v-if="incluirMotor"
              class="form-grid service-form-spacing"
            >
              <div class="form-group">
                <label>
                  Tipo de aceite
                </label>

                <select
                  v-model="motor.id_tipo_aceite"
                >
                  <option value="">
                    Selecciona un tipo
                  </option>

                  <option
                    v-for="tipo in tiposAceite"
                    :key="tipo.id_tipo_aceite"
                    :value="tipo.id_tipo_aceite"
                  >
                    {{ tipo.nombre }}
                  </option>
                </select>
              </div>


              <div class="form-group">
                <label>
                  Marca / aceite utilizado
                </label>

                <input
                  v-model="motor.aceite_motor"
                  type="text"
                  list="marcas-aceite-list"
                  placeholder="Ej. Akron"
                />

                <datalist id="marcas-aceite-list">
                  <option
                    v-for="marca in marcasAceite"
                    :key="marca.id_marca_aceite"
                    :value="marca.nombre"
                  />
                </datalist>
              </div>


              <div class="form-group">
                <label>
                  Filtro de aceite
                </label>

                <select
                  v-model="motor.filtro_aceite"
                >
                  <option value="">
                    No especificado
                  </option>

                  <option value="Bueno">
                    Bueno
                  </option>

                  <option value="Reemplazado">
                    Reemplazado
                  </option>

                  <option value="Requiere cambio">
                    Requiere cambio
                  </option>
                </select>
              </div>


              <div class="form-group">
                <label>
                  Filtro de aire
                </label>

                <select
                  v-model="motor.filtro_aire"
                >
                  <option value="">
                    No especificado
                  </option>

                  <option value="Bueno">
                    Bueno
                  </option>

                  <option value="Limpio">
                    Limpio
                  </option>

                  <option value="Reemplazado">
                    Reemplazado
                  </option>

                  <option value="Requiere cambio">
                    Requiere cambio
                  </option>
                </select>
              </div>


              <div class="form-group">
                <label>
                  Filtro diésel primario
                </label>

                <input
                  v-model="motor.filtro_diesel_primario"
                  type="text"
                  placeholder="Estado / trabajo realizado"
                />
              </div>


              <div class="form-group">
                <label>
                  Filtro diésel auxiliar
                </label>

                <input
                  v-model="motor.filtro_diesel_auxiliar"
                  type="text"
                  placeholder="Estado / trabajo realizado"
                />
              </div>


              <div class="form-group">
                <label>
                  Filtro de cabina
                </label>

                <input
                  v-model="motor.filtro_cabina"
                  type="text"
                  placeholder="Estado / trabajo realizado"
                />
              </div>


              <div class="form-group">
                <label>
                  Bujías
                </label>

                <input
                  v-model="motor.bujias"
                  type="text"
                  placeholder="Estado / trabajo realizado"
                />
              </div>


              <div class="form-group">
                <label>
                  Filtro de gasolina
                </label>

                <input
                  v-model="motor.filtro_de_gasolina"
                  type="text"
                  placeholder="Estado / trabajo realizado"
                />
              </div>
            </div>


            <div
              v-else
              class="service-disabled-section"
            >
              <i class="bi bi-toggle-off"></i>

              <h4>
                Servicio de motor no incluido
              </h4>

              <p>
                Activa “Registrar motor” si se realizó
                alguna revisión o mantenimiento en esta área.
              </p>
            </div>
          </section>


          <!-- =================================================
               TRANSMISIÓN
          ================================================== -->

          <section
            v-show="activeStep === 'transmision'"
            class="service-step-content"
          >
            <div class="service-section-toggle">
              <div class="form-section-title no-margin">
                <i class="bi bi-diagram-3"></i>

                <div>
                  <strong>
                    Servicio de transmisión
                  </strong>

                  <span>
                    Activa el módulo y captura al menos un dato
                  </span>
                </div>
              </div>


              <label class="switch-control">
                <input
                  v-model="incluirTransmision"
                  type="checkbox"
                />

                <span></span>

                Registrar transmisión
              </label>
            </div>


            <div
              v-if="incluirTransmision"
              class="form-grid service-form-spacing"
            >
              <div class="form-group">
                <label>
                  Tipo de transmisión
                </label>

                <select
                  v-model="transmision.tipo_transmision"
                >
                  <option value="">
                    Selecciona
                  </option>

                  <option value="Automática">
                    Automática
                  </option>

                  <option value="Manual">
                    Manual
                  </option>

                  <option value="CVT">
                    CVT
                  </option>

                  <option value="DCT">
                    DCT
                  </option>
                </select>
              </div>


              <div class="form-group">
                <label>
                  Aceite de transmisión
                </label>

                <input
                  v-model="transmision.aceite_transmision"
                  type="text"
                  placeholder="Tipo / marca / condición"
                />
              </div>


              <div class="form-group">
                <label>
                  Filtro de aceite
                </label>

                <input
                  v-model="transmision.filtro_de_aceite"
                  type="text"
                  placeholder="Estado / reemplazo"
                />
              </div>


              <div class="form-group">
                <label>
                  Junta de cárter
                </label>

                <input
                  v-model="transmision.junta_de_carter"
                  type="text"
                  placeholder="Estado / reemplazo"
                />
              </div>


              <div class="form-group">
                <label>
                  Color del aceite
                </label>

                <select
                  v-model="transmision.color_del_aceite"
                >
                  <option value="">
                    No especificado
                  </option>

                  <option value="Rojo limpio">
                    Rojo limpio
                  </option>

                  <option value="Rojo oscuro">
                    Rojo oscuro
                  </option>

                  <option value="Café">
                    Café
                  </option>

                  <option value="Negro">
                    Negro
                  </option>

                  <option value="Contaminado">
                    Contaminado
                  </option>
                </select>
              </div>
            </div>


            <div
              v-else
              class="service-disabled-section"
            >
              <i class="bi bi-toggle-off"></i>

              <h4>
                Transmisión no incluida
              </h4>

              <p>
                Activa esta sección únicamente cuando se
                haya realizado trabajo en la transmisión.
              </p>
            </div>
          </section>


          <!-- =================================================
               MANTENIMIENTO
          ================================================== -->

          <section
            v-show="activeStep === 'mantenimiento'"
            class="service-step-content"
          >
            <div class="form-section-title">
              <i class="bi bi-speedometer2"></i>

              <div>
                <strong>
                  Mantenimiento preventivo
                </strong>

                <span>
                  Define el kilometraje del siguiente servicio
                </span>
              </div>
            </div>


            <div class="maintenance-grid">
              <div class="maintenance-km-card">
                <span>
                  Kilometraje capturado
                </span>

                <strong>
                  {{
                    general.kilometraje !== ''
                      ? formatKilometers(
                          general.kilometraje
                        )
                      : '—'
                  }}
                </strong>

                <small>
                  Este mismo kilometraje será guardado
                  en el servicio y en el vehículo.
                </small>
              </div>


              <div class="maintenance-config-card">
                <div class="form-group">
                  <label>
                    Intervalo del mantenimiento

                    <span class="required">*</span>
                  </label>

                  <div class="input-with-suffix">
                    <input
                      v-model="mantenimiento.intervalo"
                      type="number"
                      min="0"
                      step="500"
                      placeholder="5000"
                      required
                    />

                    <span>km</span>
                  </div>
                </div>


                <div class="next-maintenance-preview">
                  <span>
                    Próximo servicio estimado
                  </span>

                  <strong>
                    {{
                      proximoServicio !== null
                        ? formatKilometers(
                            proximoServicio
                          )
                        : '—'
                    }}
                  </strong>
                </div>
              </div>
            </div>


            <div class="maintenance-information">
              <i class="bi bi-info-circle-fill"></i>

              <div>
                <strong>
                  Una sola captura de kilometraje
                </strong>

                <p>
                  Al registrar el servicio, el sistema actualizará
                  automáticamente el kilometraje actual del vehículo
                  y calculará el próximo mantenimiento.
                </p>
              </div>
            </div>
          </section>


          <!-- =================================================
               LLANTAS
          ================================================== -->

          <section
            v-show="activeStep === 'llantas'"
            class="service-step-content"
          >
            <div class="form-section-title">
              <i class="bi bi-circle"></i>

              <div>
                <strong>
                  Inspección de llantas
                </strong>

                <span>
                  Selecciona una posición alrededor del vehículo
                </span>
              </div>
            </div>


            <!-- SIN VEHÍCULO -->

            <div
              v-if="!selectedVehicle"
              class="service-disabled-section"
            >
              <i class="bi bi-car-front"></i>

              <h4>
                Selecciona primero un vehículo
              </h4>

              <p>
                Las posiciones disponibles dependen
                del tipo de unidad seleccionado.
              </p>

              <button
                class="outline-button"
                type="button"
                @click="activeStep = 'general'"
              >
                Ir a información general
              </button>
            </div>


            <!-- SIN POSICIONES -->

            <div
              v-else-if="loadingTires"
              class="component-loading"
            >
              <div class="app-spinner"></div>

              <span>
                Cargando posiciones...
              </span>
            </div>


            <div
              v-else-if="!posicionesLlanta.length"
              class="service-disabled-section"
            >
              <i class="bi bi-exclamation-circle"></i>

              <h4>
                No hay posiciones configuradas
              </h4>

              <p>
                No existen posiciones de llanta para
                “{{ selectedVehicle.tipo_unidad }}”.
                Podrás agregarlas desde Catálogos → Posiciones de llanta.
              </p>
            </div>


            <!-- INSPECCIÓN -->

            <div
              v-else
              class="tire-inspection-layout"
            >
              <!-- VEHÍCULO -->

              <div class="tire-map-card">
                <div class="tire-map-heading">
                  <span>
                    {{ selectedVehicle.tipo_unidad }}
                  </span>

                  <strong>
                    {{ selectedVehicle.marca }}
                    {{ selectedVehicle.modelo }}
                  </strong>

                  <small>
                    {{ selectedVehicle.placas }}
                  </small>
                </div>


                <div class="tire-vehicle-map">
                  <span class="vehicle-front-label">
                    FRENTE
                  </span>


                  <div class="tire-buttons-grid">
                    <button
                      v-for="position in posicionesLlanta"
                      :key="position.id_tipo"
                      class="tire-position-button"
                      :class="{
                        selected:
                          selectedTireId === position.id_tipo,

                        completed:
                          isTireCompleted(
                            position.id_tipo
                          )
                      }"
                      type="button"
                      @click="
                        selectTire(
                          position
                        )
                      "
                    >
                      <span class="tire-button-number">
                        {{
                          position.numero_llanta ||
                          position.id_tipo
                        }}
                      </span>

                      <i class="bi bi-circle-fill"></i>

                      <span>
                        {{ position.posicion }}
                      </span>

                      <i
                        v-if="
                          isTireCompleted(
                            position.id_tipo
                          )
                        "
                        class="bi bi-check-circle-fill tire-completed-check"
                      ></i>
                    </button>
                  </div>


                  <div
                    class="tire-vehicle-body"
                    :class="
                      getPreviewClass(
                        selectedVehicle.tipo_unidad
                      )
                    "
                  >
                    <div>
                      <i
                        :class="
                          getVehicleIcon(
                            selectedVehicle.tipo_unidad
                          )
                        "
                      ></i>
                    </div>

                    <span>
                      {{
                        selectedVehicle.no_economico ||
                        selectedVehicle.placas
                      }}
                    </span>
                  </div>


                  <span class="vehicle-rear-label">
                    PARTE TRASERA
                  </span>
                </div>


                <div class="tire-progress">
                  <div>
                    <span>
                      Inspeccionadas
                    </span>

                    <strong>
                      {{ llantasCapturadas.length }}
                      /
                      {{ posicionesLlanta.length }}
                    </strong>
                  </div>

                  <div class="tire-progress-bar">
                    <span
                      :style="{
                        width:
                          `${tireProgress}%`
                      }"
                    ></span>
                  </div>
                </div>
              </div>


              <!-- FORM LLANTA -->

              <div class="tire-form-card">
                <template v-if="selectedTire">
                  <div class="tire-form-header">
                    <div>
                      <span>
                        LLANTA
                        {{
                          selectedTire.numero_llanta ||
                          selectedTire.id_tipo
                        }}
                      </span>

                      <h4>
                        {{ selectedTire.posicion }}
                      </h4>
                    </div>


                    <div
                      class="tire-status-indicator"
                      :class="{
                        completed:
                          isTireCompleted(
                            selectedTire.id_tipo
                          )
                      }"
                    >
                      <i
                        :class="
                          isTireCompleted(
                            selectedTire.id_tipo
                          )
                            ? 'bi bi-check-lg'
                            : 'bi bi-pencil'
                        "
                      ></i>
                    </div>
                  </div>


                  <div class="form-grid tire-form-grid">
                    <div class="form-group">
                      <label>
                        Medida
                      </label>

                      <input
                        v-model="tireForm.medida"
                        type="text"
                        placeholder="Ej. 205/55 R16"
                      />
                    </div>


                    <div class="form-group">
                      <label>
                        Marca
                      </label>

                      <input
                        v-model="tireForm.marca"
                        type="text"
                        placeholder="Ej. Michelin"
                      />
                    </div>


                    <div class="form-group">
                      <label>
                        Presión
                      </label>

                      <div class="input-with-suffix">
                        <input
                          v-model="tireForm.psi"
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="32"
                        />

                        <span>PSI</span>
                      </div>
                    </div>


                    <div class="form-group">
                      <label>
                        Desgaste
                      </label>

                      <div class="input-with-suffix">
                        <input
                          v-model="tireForm.desgaste_mm"
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="5.0"
                        />

                        <span>mm</span>
                      </div>
                    </div>


                    <div class="form-group">
                      <label>
                        Tipo de desgaste
                      </label>

                      <select
                        v-model="tireForm.tipo_desgaste"
                      >
                        <option value="">
                          Selecciona
                        </option>

                        <option value="Uniforme">
                          Uniforme
                        </option>

                        <option value="Centro">
                          Centro
                        </option>

                        <option value="Bordes">
                          Bordes
                        </option>

                        <option value="Interior">
                          Interior
                        </option>

                        <option value="Exterior">
                          Exterior
                        </option>

                        <option value="Irregular">
                          Irregular
                        </option>
                      </select>
                    </div>


                    <div class="form-group">
                      <label>
                        Condición

                        <span class="required">*</span>
                      </label>

                      <select
                        v-model="tireForm.condicion"
                      >
                        <option value="">
                          Selecciona
                        </option>

                        <option value="Buena">
                          Buena
                        </option>

                        <option value="Regular">
                          Regular
                        </option>

                        <option value="Requiere atención">
                          Requiere atención
                        </option>

                        <option value="Reemplazar">
                          Reemplazar
                        </option>
                      </select>
                    </div>
                  </div>


                  <div class="tire-form-actions">
                    <button
                      class="secondary-button"
                      type="button"
                      @click="clearTireForm"
                    >
                      <i class="bi bi-eraser"></i>

                      Limpiar
                    </button>


                    <button
                      class="primary-button"
                      type="button"
                      @click="saveCurrentTire"
                    >
                      <i class="bi bi-check2-circle"></i>

                      {{
                        isTireCompleted(
                          selectedTire.id_tipo
                        )
                          ? 'Actualizar inspección'
                          : 'Guardar inspección'
                      }}
                    </button>
                  </div>
                </template>


                <div
                  v-else
                  class="tire-form-empty"
                >
                  <i class="bi bi-cursor-fill"></i>

                  <h4>
                    Selecciona una llanta
                  </h4>

                  <p>
                    Presiona una posición alrededor
                    del vehículo para comenzar.
                  </p>
                </div>
              </div>
            </div>
          </section>


          <!-- =================================================
               RESUMEN
          ================================================== -->

          <section
            v-show="activeStep === 'resumen'"
            class="service-step-content"
          >
            <div class="form-section-title">
              <i class="bi bi-check2-square"></i>

              <div>
                <strong>
                  Resumen del servicio
                </strong>

                <span>
                  Revisa los datos antes de registrar
                </span>
              </div>
            </div>


            <div
              v-if="selectedVehicle"
              class="service-summary-header"
            >
              <div
                class="service-summary-vehicle-icon"
                :class="
                  getPreviewClass(
                    selectedVehicle.tipo_unidad
                  )
                "
              >
                <i
                  :class="
                    getVehicleIcon(
                      selectedVehicle.tipo_unidad
                    )
                  "
                ></i>
              </div>


              <div>
                <span>
                  {{ selectedVehicle.placas }}
                </span>

                <h3>
                  {{ selectedVehicle.marca }}
                  {{ selectedVehicle.modelo }}
                </h3>

                <p>
                  {{
                    formatKilometers(
                      general.kilometraje
                    )
                  }}
                </p>
              </div>
            </div>


            <div class="service-summary-grid">
              <article class="service-summary-card">
                <i class="bi bi-calendar3"></i>

                <div>
                  <span>
                    Fecha
                  </span>

                  <strong>
                    {{
                      general.fecha_servicio ||
                      'No seleccionada'
                    }}
                  </strong>
                </div>
              </article>


              <article class="service-summary-card">
                <i class="bi bi-person-gear"></i>

                <div>
                  <span>
                    Mecánico
                  </span>

                  <strong>
                    {{
                      getMechanicName(
                        general.id_mecanico
                      )
                    }}
                  </strong>
                </div>
              </article>


              <article class="service-summary-card">
                <i class="bi bi-gear-wide-connected"></i>

                <div>
                  <span>
                    Motor
                  </span>

                  <strong>
                    {{
                      incluirMotor
                        ? 'Incluido'
                        : 'No incluido'
                    }}
                  </strong>
                </div>
              </article>


              <article class="service-summary-card">
                <i class="bi bi-diagram-3"></i>

                <div>
                  <span>
                    Transmisión
                  </span>

                  <strong>
                    {{
                      incluirTransmision
                        ? 'Incluida'
                        : 'No incluida'
                    }}
                  </strong>
                </div>
              </article>


              <article class="service-summary-card">
                <i class="bi bi-circle"></i>

                <div>
                  <span>
                    Llantas
                  </span>

                  <strong>
                    {{ llantasCapturadas.length }}
                    inspeccionadas
                  </strong>
                </div>
              </article>


              <article class="service-summary-card">
                <i class="bi bi-speedometer2"></i>

                <div>
                  <span>
                    Próximo mantenimiento
                  </span>

                  <strong>
                    {{
                      proximoServicio !== null
                        ? formatKilometers(
                            proximoServicio
                          )
                        : 'No configurado'
                    }}
                  </strong>
                </div>
              </article>
            </div>


            <div
              v-if="validationMessage"
              class="service-summary-warning"
            >
              <i class="bi bi-exclamation-triangle-fill"></i>

              {{ validationMessage }}
            </div>
          </section>
        </div>


        <!-- ===================================================
             FOOTER
        ==================================================== -->

        <div class="service-modal-footer">
          <button
            class="secondary-button"
            type="button"
            :disabled="saving"
            @click="previousStep"
          >
            <i class="bi bi-arrow-left"></i>

            Anterior
          </button>


          <div class="service-modal-footer-right">
            <button
              class="secondary-button"
              type="button"
              :disabled="saving"
              @click="closeServiceModal"
            >
              Cancelar
            </button>


            <button
              v-if="activeStep !== 'resumen'"
              class="primary-button"
              type="button"
              @click="nextStep"
            >
              Siguiente

              <i class="bi bi-arrow-right"></i>
            </button>


            <button
              v-else
              class="primary-button"
              type="button"
              :disabled="
                saving ||
                !!validationMessage
              "
              @click="requestSave"
            >
              <i
                v-if="saving"
                class="bi bi-arrow-repeat spin"
              ></i>

              <i
                v-else
                class="bi bi-check-circle"
              ></i>

              {{
                saving
                  ? 'Registrando...'
                  : 'Registrar servicio'
              }}
            </button>
          </div>
        </div>
      </div>
    </div>


    <!-- ======================================================
         DETALLE
    ======================================================= -->

    <div
      v-if="
        showDetailModal &&
        detailData
      "
      class="modal-overlay"
      @click.self="closeDetail"
    >
      <div class="app-modal service-detail-modal">
        <div class="modal-header">
          <div>
            <h3>
              Servicio #{{ detailData.servicio.id_servicio }}
            </h3>

            <p>
              Detalle del mantenimiento realizado.
            </p>
          </div>


          <button
            class="modal-close-button"
            type="button"
            @click="closeDetail"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>


        <div class="modal-body">
          <!-- INFORMACIÓN GENERAL -->

          <div class="service-detail-grid">
            <div class="detail-card">
              <i class="bi bi-car-front"></i>

              <div>
                <small>Vehículo</small>

                <strong>
                  {{
                    getVehicleName(
                      detailData.servicio.id_vehiculo
                    )
                  }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-credit-card-2-front"></i>

              <div>
                <small>Placas</small>

                <strong>
                  {{
                    getVehicle(
                      detailData.servicio.id_vehiculo
                    )?.placas || 'Sin placas'
                  }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-calendar3"></i>

              <div>
                <small>Fecha</small>

                <strong>
                  {{
                    formatDate(
                      detailData.servicio.fecha_servicio
                    )
                  }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-speedometer2"></i>

              <div>
                <small>Kilometraje</small>

                <strong>
                  {{
                    formatKilometers(
                      detailData.servicio.kilometraje
                    )
                  }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-person-gear"></i>

              <div>
                <small>Mecánico responsable</small>

                <strong>
                  {{
                    getMechanicName(
                      detailData.servicio.id_mecanico
                    )
                  }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-hash"></i>

              <div>
                <small>No. económico</small>

                <strong>
                  {{
                    getVehicle(
                      detailData.servicio.id_vehiculo
                    )?.no_economico || 'No registrado'
                  }}
                </strong>
              </div>
            </div>
          </div>


          <!-- MOTOR -->

          <div class="service-detail-section">
            <h4>
              <i class="bi bi-gear-wide-connected"></i>

              Servicio de motor
            </h4>


            <template v-if="detailData.motor">
              <div class="service-detail-grid">
                <div class="detail-card">
                  <i class="bi bi-droplet-half"></i>
                  <div>
                    <small>Tipo de aceite</small>
                    <strong>{{ detailData.motor.tipo_aceite_nombre || 'No especificado' }}</strong>
                  </div>
                </div>

                <div class="detail-card">
                  <i class="bi bi-droplet"></i>
                  <div>
                    <small>Aceite / marca utilizada</small>
                    <strong>{{ detailData.motor.aceite_motor || 'No especificado' }}</strong>
                  </div>
                </div>

                <div class="detail-card">
                  <i class="bi bi-funnel"></i>
                  <div>
                    <small>Filtro de aceite</small>
                    <strong>{{ detailData.motor.filtro_aceite || 'No especificado' }}</strong>
                  </div>
                </div>

                <div class="detail-card">
                  <i class="bi bi-wind"></i>
                  <div>
                    <small>Filtro de aire</small>
                    <strong>{{ detailData.motor.filtro_aire || 'No especificado' }}</strong>
                  </div>
                </div>

                <div class="detail-card">
                  <i class="bi bi-fuel-pump"></i>
                  <div>
                    <small>Filtro diésel primario</small>
                    <strong>{{ detailData.motor.filtro_diesel_primario || 'No especificado' }}</strong>
                  </div>
                </div>

                <div class="detail-card">
                  <i class="bi bi-fuel-pump-fill"></i>
                  <div>
                    <small>Filtro diésel auxiliar</small>
                    <strong>{{ detailData.motor.filtro_diesel_auxiliar || 'No especificado' }}</strong>
                  </div>
                </div>

                <div class="detail-card">
                  <i class="bi bi-fan"></i>
                  <div>
                    <small>Filtro de cabina</small>
                    <strong>{{ detailData.motor.filtro_cabina || 'No especificado' }}</strong>
                  </div>
                </div>

                <div class="detail-card">
                  <i class="bi bi-lightning-charge"></i>
                  <div>
                    <small>Bujías</small>
                    <strong>{{ detailData.motor.bujias || 'No especificado' }}</strong>
                  </div>
                </div>

                <div class="detail-card">
                  <i class="bi bi-funnel-fill"></i>
                  <div>
                    <small>Filtro de gasolina</small>
                    <strong>{{ detailData.motor.filtro_de_gasolina || 'No especificado' }}</strong>
                  </div>
                </div>
              </div>
            </template>

            <p v-else>
              Este servicio no incluyó trabajo de motor.
            </p>
          </div>


          <!-- TRANSMISIÓN -->

          <div class="service-detail-section">
            <h4>
              <i class="bi bi-diagram-3"></i>

              Servicio de transmisión
            </h4>


            <template v-if="detailData.transmision">
              <div class="service-detail-grid">
                <div class="detail-card">
                  <i class="bi bi-gear"></i>
                  <div>
                    <small>Tipo de transmisión</small>
                    <strong>{{ detailData.transmision.tipo_transmision || 'No especificado' }}</strong>
                  </div>
                </div>

                <div class="detail-card">
                  <i class="bi bi-droplet-half"></i>
                  <div>
                    <small>Aceite de transmisión</small>
                    <strong>{{ detailData.transmision.aceite_transmision || 'No especificado' }}</strong>
                  </div>
                </div>

                <div class="detail-card">
                  <i class="bi bi-funnel"></i>
                  <div>
                    <small>Filtro de aceite</small>
                    <strong>{{ detailData.transmision.filtro_de_aceite || 'No especificado' }}</strong>
                  </div>
                </div>

                <div class="detail-card">
                  <i class="bi bi-tools"></i>
                  <div>
                    <small>Junta de cárter</small>
                    <strong>{{ detailData.transmision.junta_de_carter || 'No especificado' }}</strong>
                  </div>
                </div>

                <div class="detail-card">
                  <i class="bi bi-palette"></i>
                  <div>
                    <small>Color del aceite</small>
                    <strong>{{ detailData.transmision.color_del_aceite || 'No especificado' }}</strong>
                  </div>
                </div>
              </div>
            </template>

            <p v-else>
              Este servicio no incluyó trabajo de transmisión.
            </p>
          </div>


          <!-- LLANTAS -->

          <div class="service-detail-section">
            <h4>
              <i class="bi bi-circle"></i>

              Inspección de llantas
            </h4>


            <div
              v-if="detailData.llantas.length"
              class="service-detail-tires"
            >
              <article
                v-for="llanta in detailData.llantas"
                :key="llanta.id_detalle"
              >
                <strong>
                  {{ llanta.posicion || `Posición #${llanta.id_llanta}` }}
                </strong>

                <span>
                  Llanta {{ llanta.numero_llanta ?? llanta.id_llanta }}
                  ·
                  {{ llanta.marca || 'Sin marca' }}
                  ·
                  {{ llanta.medida || 'Sin medida' }}
                </span>

                <small>
                  Presión: {{ llanta.psi ?? '—' }} PSI
                  ·
                  Desgaste: {{ llanta.desgaste_mm ?? '—' }} mm
                </small>

                <small>
                  Tipo de desgaste: {{ llanta.tipo_desgaste || 'No especificado' }}
                  ·
                  Condición: {{ llanta.condicion || 'Sin condición' }}
                </small>
              </article>
            </div>


            <p v-else>
              No se registró inspección de llantas.
            </p>
          </div>


          <!-- OBSERVACIONES -->

          <div class="service-detail-observations">
            <strong>
              Observaciones generales
            </strong>

            <p>
              {{
                detailData.servicio.observaciones_generales ||
                'Sin observaciones generales registradas.'
              }}
            </p>
          </div>
        </div>


        <div class="modal-footer">
          <button
            class="secondary-button"
            type="button"
            @click="closeDetail"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>


    <!-- ======================================================
         CONFIRMACIÓN
    ======================================================= -->

    <div
      v-if="showConfirmation"
      class="modal-overlay"
    >
      <div class="confirmation-modal">
        <div class="confirmation-icon update">
          <i class="bi bi-wrench-adjustable-circle"></i>
        </div>

        <h3>
          ¿Registrar servicio?
        </h3>

        <p>
          Se guardará el servicio, se actualizará el
          kilometraje del vehículo y se calculará el
          próximo mantenimiento configurado.
        </p>


        <div
          v-if="selectedVehicle"
          class="vehicle-confirmation-card"
        >
          <div class="table-vehicle-icon">
            <i
              :class="
                getVehicleIcon(
                  selectedVehicle.tipo_unidad
                )
              "
            ></i>
          </div>

          <div>
            <strong>
              {{ selectedVehicle.marca }}
              {{ selectedVehicle.modelo }}
            </strong>

            <span>
              {{ selectedVehicle.placas }}
              ·
              {{
                formatKilometers(
                  general.kilometraje
                )
              }}
            </span>
          </div>
        </div>


        <div class="confirmation-actions">
          <button
            class="secondary-button"
            type="button"
            :disabled="saving"
            @click="
              showConfirmation = false
            "
          >
            Cancelar
          </button>


          <button
            class="primary-button"
            type="button"
            :disabled="saving"
            @click="saveService"
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
                ? 'Registrando...'
                : 'Sí, registrar'
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
  obtenerDetalleServicio,
  obtenerHistorialServicios,
  obtenerMarcasAceiteServicio,
  obtenerMecanicosServicio,
  obtenerPosicionesLlanta,
  obtenerTiposAceiteServicio,
  obtenerVehiculosServicio,
  registrarServicioCompleto
} from '../services/servicioService.js'


/* ============================================================
   PROPS / EMITS
============================================================ */

const props = defineProps({
  action: {
    type: Object,
    default: null
  },
  mechanicMode: {
    type: Boolean,
    default: false
  },
  mechanicId: {
    type: [Number, String],
    default: null
  },
  mechanic: {
    type: Object,
    default: () => ({})
  }
})


const emit = defineEmits([
  'action-consumed'
])


/* ============================================================
   ESTADO GENERAL
============================================================ */

const vehiculos = ref([])

const mecanicos = ref([])

const tiposAceite = ref([])

const marcasAceite = ref([])

const servicios = ref([])

const posicionesLlanta = ref([])

const loading = ref(false)

const loadingTires = ref(false)

const saving = ref(false)

const search = ref('')

const dateFilter = ref('')

const vehicleFilter = ref('')

const successMessage = ref('')

const errorMessage = ref('')

const showServiceModal = ref(false)

const showDetailModal = ref(false)

const showConfirmation = ref(false)

const detailData = ref(null)

const stepValidationAttempted = ref(false)


/* ============================================================
   STEPS
============================================================ */

const steps = [
  {
    id: 'general',
    label: 'General',
    icon: 'bi bi-clipboard2-check'
  },

  {
    id: 'motor',
    label: 'Motor',
    icon: 'bi bi-gear-wide-connected'
  },

  {
    id: 'transmision',
    label: 'Transmisión',
    icon: 'bi bi-diagram-3'
  },

  {
    id: 'mantenimiento',
    label: 'Mantenimiento',
    icon: 'bi bi-speedometer2'
  },

  {
    id: 'llantas',
    label: 'Llantas',
    icon: 'bi bi-circle'
  },

  {
    id: 'resumen',
    label: 'Resumen',
    icon: 'bi bi-check2-square'
  }
]


const activeStep =
  ref('general')


/* ============================================================
   GENERAL
============================================================ */

const getToday = () => {
  const now =
    new Date()

  const year =
    now.getFullYear()

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      '0'
    )

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      '0'
    )

  return `${year}-${month}-${day}`
}


const createGeneral = () => ({
  id_vehiculo: '',

  id_mecanico: '',

  fecha_servicio:
    getToday(),

  kilometraje: '',

  observaciones_generales: ''
})


const general =
  ref(
    createGeneral()
  )

const mechanicName = computed(() => {
  const name = [
    props.mechanic?.nombre,
    props.mechanic?.apellido_paterno,
    props.mechanic?.apellido_materno
  ].filter(Boolean).join(' ').trim()

  return name || 'Mecánico asignado'
})


/* ============================================================
   MOTOR
============================================================ */

const incluirMotor =
  ref(false)


const createMotor = () => ({
  id_tipo_aceite: '',

  aceite_motor: '',

  filtro_aceite: '',

  filtro_aire: '',

  filtro_diesel_primario: '',

  filtro_diesel_auxiliar: '',

  filtro_cabina: '',

  bujias: '',

  filtro_de_gasolina: ''
})


const motor =
  ref(
    createMotor()
  )


/* ============================================================
   TRANSMISIÓN
============================================================ */

const incluirTransmision =
  ref(false)


const createTransmission = () => ({
  tipo_transmision: '',

  aceite_transmision: '',

  filtro_de_aceite: '',

  junta_de_carter: '',

  color_del_aceite: ''
})


const transmision =
  ref(
    createTransmission()
  )


/* ============================================================
   MANTENIMIENTO
============================================================ */

const mantenimiento =
  ref({
    intervalo: ''
  })


/* ============================================================
   LLANTAS
============================================================ */

const selectedTireId =
  ref(null)

const llantasCapturadas =
  ref([])


const createTireForm = () => ({
  medida: '',

  marca: '',

  psi: '',

  desgaste_mm: '',

  tipo_desgaste: '',

  condicion: ''
})


const tireForm =
  ref(
    createTireForm()
  )


/* ============================================================
   COMPUTED
============================================================ */

const selectedVehicle =
  computed(() => {
    if (
      !general.value.id_vehiculo
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
            general.value.id_vehiculo
          )
      ) ||
      null
    )
  })


const selectedTire =
  computed(() => {
    if (
      !selectedTireId.value
    ) {
      return null
    }


    return (
      posicionesLlanta.value.find(
        position =>
          Number(
            position.id_tipo
          ) ===
          Number(
            selectedTireId.value
          )
      ) ||
      null
    )
  })


const vehiculosActivos =
  computed(() => {
    return vehiculos.value.filter(
      vehiculo =>
        String(
          vehiculo.estatus ||
          'Activo'
        )
          .trim()
          .toLowerCase() ===
        'activo'
    )
  })

const vehiculosDisponiblesServicio =
  computed(() => vehiculosActivos.value)


const mecanicosActivos =
  computed(() => {
    return mecanicos.value.filter(
      mecanico =>
        String(
          mecanico.usuario?.estatus ||
          'Activo'
        )
          .trim()
          .toLowerCase() ===
        'activo'
    )
  })


const proximoServicio =
  computed(() => {
    if (
      general.value.kilometraje === '' ||
      mantenimiento.value.intervalo === ''
    ) {
      return null
    }


    const km =
      Number(
        general.value.kilometraje
      )

    const interval =
      Number(
        mantenimiento.value.intervalo
      )


    if (
      !Number.isFinite(km) ||
      !Number.isFinite(interval) ||
      interval <= 0
    ) {
      return null
    }


    return (
      km +
      interval
    )
  })


const tireProgress =
  computed(() => {
    if (
      !posicionesLlanta.value.length
    ) {
      return 0
    }


    return Math.round(
      (
        llantasCapturadas.value.length /
        posicionesLlanta.value.length
      ) *
      100
    )
  })


const serviciosMesActual =
  computed(() => {
    const now =
      new Date()

    const month =
      now.getMonth()

    const year =
      now.getFullYear()


    return servicios.value.filter(
      servicio => {
        if (
          !servicio.fecha_servicio
        ) {
          return false
        }


        const date =
          new Date(
            `${servicio.fecha_servicio}T12:00:00`
          )


        return (
          date.getMonth() === month &&
          date.getFullYear() === year
        )
      }
    ).length
  })


const getStepValidationMessage = id => {
  switch (id) {
    case 'general': {
      if (!general.value.id_vehiculo) {
        return 'Selecciona un vehículo.'
      }

      if (
        selectedVehicle.value &&
        String(selectedVehicle.value.estatus || 'Activo')
          .trim()
          .toLowerCase() !== 'activo'
      ) {
        return 'No se puede registrar un servicio para un vehículo inactivo. Selecciona un vehículo activo.'
      }

      if (!general.value.fecha_servicio) {
        return 'Selecciona la fecha del servicio.'
      }

      if (general.value.kilometraje === '') {
        return 'Captura el kilometraje actual.'
      }

      const km = Number(general.value.kilometraje)
      if (!Number.isFinite(km) || km < 0) {
        return 'El kilometraje capturado no es válido.'
      }

      return ''
    }

    case 'motor':
      if (!incluirMotor.value) {
        return 'Completa el módulo Motor activando “Registrar motor”.'
      }

      return Object.values(motor.value).some(value =>
        String(value ?? '').trim()
      )
        ? ''
        : 'Captura al menos un dato en el módulo Motor.'

    case 'transmision':
      if (!incluirTransmision.value) {
        return 'Completa el módulo Transmisión activando “Registrar transmisión”.'
      }

      return Object.values(transmision.value).some(value =>
        String(value ?? '').trim()
      )
        ? ''
        : 'Captura al menos un dato en el módulo Transmisión.'

    case 'mantenimiento': {
      const interval = Number(mantenimiento.value.intervalo)
      return mantenimiento.value.intervalo !== '' &&
        Number.isFinite(interval) &&
        interval > 0
        ? ''
        : 'Indica un intervalo de mantenimiento mayor a 0 km.'
    }

    case 'llantas': {
      if (loadingTires.value) {
        return 'Espera a que terminen de cargar las posiciones de llanta.'
      }

      if (!posicionesLlanta.value.length) {
        return 'No hay posiciones de llanta configuradas para completar la inspección.'
      }

      const incompleteTire = posicionesLlanta.value.find(position => {
        const inspection = llantasCapturadas.value.find(item =>
          Number(item.id_llanta) === Number(position.id_tipo)
        )
        return !inspection?.condicion
      })

      return incompleteTire
        ? `Completa la inspección de la llanta ${incompleteTire.posicion || incompleteTire.numero_llanta || incompleteTire.id_tipo}, incluida su condición.`
        : ''
    }

    default:
      return ''
  }
}

const validationMessage = computed(() => {
  for (const step of steps) {
    if (step.id === 'resumen') continue

    const message = getStepValidationMessage(step.id)
    if (message) return message
  }

  return ''
})

const stepValidationMessage = computed(() =>
  stepValidationAttempted.value
    ? getStepValidationMessage(activeStep.value)
    : ''
)


const filteredServicios =
  computed(() => {
    const term =
      search.value
        .trim()
        .toLowerCase()


    return servicios.value.filter(
      servicio => {
        const vehicle =
          getVehicle(
            servicio.id_vehiculo
          )

        const mechanic =
          getMechanicName(
            servicio.id_mecanico
          )


        const text = `
          ${servicio.id_servicio}
          ${servicio.fecha_servicio || ''}
          ${vehicle?.placas || ''}
          ${vehicle?.marca || ''}
          ${vehicle?.modelo || ''}
          ${mechanic}
          ${servicio.observaciones_generales || ''}
        `
          .toLowerCase()
          .replace(
            /\s+/g,
            ' '
          )


        const matchesSearch =
          !term ||
          text.includes(
            term
          )


        const matchesDate =
          !dateFilter.value ||
          servicio.fecha_servicio ===
            dateFilter.value


        const matchesVehicle =
          !vehicleFilter.value ||
          Number(servicio.id_vehiculo) ===
            Number(vehicleFilter.value)


        return (
          matchesSearch &&
          matchesDate &&
          matchesVehicle
        )
      }
    )
  })


/* ============================================================
   CARGAR
============================================================ */

const loadAll = async () => {
  loading.value =
    true

  errorMessage.value =
    ''

  const mechanicId = Number(props.mechanicId)

  if (
    props.mechanicMode &&
    (!Number.isInteger(mechanicId) || mechanicId <= 0)
  ) {
    vehiculos.value = []
    mecanicos.value = []
    servicios.value = []
    errorMessage.value =
      'No fue posible identificar al mecánico actual.'
    loading.value = false
    return
  }

  try {
    const [
      vehiclesData,
      mechanicsData,
      oilTypesData,
      oilBrandsData,
      servicesData
    ] = await Promise.all([
      obtenerVehiculosServicio(),

      props.mechanicMode
        ? Promise.resolve([])
        : obtenerMecanicosServicio(),

      obtenerTiposAceiteServicio(),

      obtenerMarcasAceiteServicio(),

      obtenerHistorialServicios()
    ])

    const assignedVehicleIds = new Set(
      props.mechanicMode
        ? vehiclesData
            .filter(vehicle => Number(vehicle.id_mecanico) === mechanicId)
            .map(vehicle => Number(vehicle.id_vehiculo))
        : []
    )

    vehiculos.value =
      props.mechanicMode
        ? vehiclesData.filter(
            vehicle => Number(vehicle.id_mecanico) === mechanicId
          )
        : vehiclesData

    mecanicos.value =
      props.mechanicMode
        ? [{
            id_mecanico: mechanicId,
            usuario: props.mechanic
          }]
        : mechanicsData

    tiposAceite.value =
      oilTypesData

    marcasAceite.value =
      oilBrandsData

    servicios.value =
      props.mechanicMode
        ? servicesData.filter(
            service =>
              Number(service.id_mecanico) === mechanicId &&
              assignedVehicleIds.has(Number(service.id_vehiculo))
          )
        : servicesData
  } catch (error) {
    console.error(
      'Error cargando servicios:',
      error
    )


    errorMessage.value =
      getErrorMessage(
        error,
        'No fue posible cargar los servicios.'
      )
  } finally {
    loading.value =
      false
  }
}


/* ============================================================
   NUEVO SERVICIO
============================================================ */

const openNewService = () => {
  resetServiceForm()

  if (props.mechanicMode) {
    general.value.id_mecanico = props.mechanicId
  }

  showServiceModal.value =
    true
}


const closeServiceModal = () => {
  if (saving.value) {
    return
  }


  showServiceModal.value =
    false

  showConfirmation.value =
    false

  resetServiceForm()
}


const resetServiceForm = () => {
  activeStep.value =
    'general'

  general.value =
    createGeneral()

  if (props.mechanicMode) {
    general.value.id_mecanico = props.mechanicId
  }

  incluirMotor.value =
    false

  motor.value =
    createMotor()

  incluirTransmision.value =
    false

  transmision.value =
    createTransmission()

  mantenimiento.value = {
    intervalo: ''
  }

  stepValidationAttempted.value = false

  posicionesLlanta.value =
    []

  selectedTireId.value =
    null

  llantasCapturadas.value =
    []

  tireForm.value =
    createTireForm()
}


/* ============================================================
   CAMBIO DE VEHÍCULO
============================================================ */

const handleVehicleChange = async () => {
  posicionesLlanta.value =
    []

  selectedTireId.value =
    null

  llantasCapturadas.value =
    []

  tireForm.value =
    createTireForm()


  if (!selectedVehicle.value) {
    return
  }


  if (
    selectedVehicle.value.kilometraje_actual !== null &&
    selectedVehicle.value.kilometraje_actual !== undefined
  ) {
    general.value.kilometraje =
      selectedVehicle.value.kilometraje_actual
  }


  if (
    selectedVehicle.value.id_mecanico
  ) {
    general.value.id_mecanico =
      selectedVehicle.value.id_mecanico
  }


  await loadTirePositions()
}


/* ============================================================
   POSICIONES LLANTA
============================================================ */

const loadTirePositions = async () => {
  if (
    !selectedVehicle.value?.tipo_unidad
  ) {
    return
  }


  loadingTires.value =
    true


  try {
    posicionesLlanta.value =
      await obtenerPosicionesLlanta(
        selectedVehicle.value.tipo_unidad
      )
  } catch (error) {
    console.error(
      'Error cargando posiciones:',
      error
    )


    errorMessage.value =
      getErrorMessage(
        error,
        'No fue posible cargar las posiciones de llanta.'
      )
  } finally {
    loadingTires.value =
      false
  }
}


/* ============================================================
   SELECCIONAR LLANTA
============================================================ */

const selectTire = position => {
  selectedTireId.value =
    position.id_tipo


  const saved =
    llantasCapturadas.value.find(
      item =>
        Number(
          item.id_llanta
        ) ===
        Number(
          position.id_tipo
        )
    )


  if (saved) {
    tireForm.value = {
      medida:
        saved.medida || '',

      marca:
        saved.marca || '',

      psi:
        saved.psi ?? '',

      desgaste_mm:
        saved.desgaste_mm ?? '',

      tipo_desgaste:
        saved.tipo_desgaste || '',

      condicion:
        saved.condicion || ''
    }

    return
  }


  tireForm.value =
    createTireForm()
}


/* ============================================================
   GUARDAR LLANTA
============================================================ */

const saveCurrentTire = () => {
  if (!selectedTire.value) {
    return
  }

  if (!String(tireForm.value.condicion || '').trim()) {
    stepValidationAttempted.value = true
    return
  }

  errorMessage.value = ''

  const payload = {
    id_llanta:
      selectedTire.value.id_tipo,

    posicion:
      selectedTire.value.posicion,

    medida:
      tireForm.value.medida,

    marca:
      tireForm.value.marca,

    psi:
      tireForm.value.psi,

    desgaste_mm:
      tireForm.value.desgaste_mm,

    tipo_desgaste:
      tireForm.value.tipo_desgaste,

    condicion:
      tireForm.value.condicion
  }


  const index =
    llantasCapturadas.value.findIndex(
      item =>
        Number(
          item.id_llanta
        ) ===
        Number(
          payload.id_llanta
        )
    )


  if (index >= 0) {
    llantasCapturadas.value[
      index
    ] = payload
  } else {
    llantasCapturadas.value.push(
      payload
    )
  }


  selectNextTire()
}


const selectNextTire = () => {
  const currentIndex =
    posicionesLlanta.value.findIndex(
      item =>
        Number(
          item.id_tipo
        ) ===
        Number(
          selectedTireId.value
        )
    )


  const next =
    posicionesLlanta.value[
      currentIndex + 1
    ]


  if (next) {
    selectTire(
      next
    )
  }
}


const clearTireForm = () => {
  if (!selectedTire.value) {
    return
  }


  const index =
    llantasCapturadas.value.findIndex(
      item =>
        Number(
          item.id_llanta
        ) ===
        Number(
          selectedTire.value.id_tipo
        )
    )


  if (index >= 0) {
    llantasCapturadas.value.splice(
      index,
      1
    )
  }


  tireForm.value =
    createTireForm()
}


const isTireCompleted = idTipo => {
  return llantasCapturadas.value.some(
    item =>
      Number(
        item.id_llanta
      ) ===
      Number(
        idTipo
      )
  )
}


/* ============================================================
   STEPPER
============================================================ */

const currentStepIndex =
  computed(() => {
    return steps.findIndex(
      step =>
        step.id ===
        activeStep.value
    )
  })


const nextStep = () => {
  if (getStepValidationMessage(activeStep.value)) {
    stepValidationAttempted.value = true
    return
  }

  stepValidationAttempted.value = false

  const next =
    steps[
      currentStepIndex.value + 1
    ]


  if (next) {
    activeStep.value =
      next.id
  }
}

const selectStep = id => {
  stepValidationAttempted.value = false
  activeStep.value = id
}


const previousStep = () => {
  const previous =
    steps[
      currentStepIndex.value - 1
    ]


  if (previous) {
    stepValidationAttempted.value = false
    activeStep.value =
      previous.id
  }
}


const isStepCompleted = id => {
  return Boolean(
    id &&
    id !== 'resumen' &&
    !getStepValidationMessage(id)
  )
}

const focusFirstIncompleteStep = () => {
  const incompleteStep = steps.find(step =>
    step.id !== 'resumen' &&
    getStepValidationMessage(step.id)
  )

  if (!incompleteStep) return false

  showConfirmation.value = false
  activeStep.value = incompleteStep.id
  stepValidationAttempted.value = true
  return true
}


/* ============================================================
   CONFIRMACIÓN
============================================================ */

const requestSave = () => {
  if (
    validationMessage.value
  ) {
    focusFirstIncompleteStep()
    return
  }


  showConfirmation.value =
    true
}


/* ============================================================
   GUARDAR SERVICIO
============================================================ */

const saveService = async () => {
  if (validationMessage.value) {
    focusFirstIncompleteStep()
    return
  }

  saving.value =
    true

  errorMessage.value =
    ''

  successMessage.value =
    ''


  try {
    await registrarServicioCompleto({
      general:
        general.value,

      incluirMotor:
        incluirMotor.value,

      motor:
        motor.value,

      incluirTransmision:
        incluirTransmision.value,

      transmision:
        transmision.value,

      mantenimiento:
        mantenimiento.value,

      llantas:
        llantasCapturadas.value
    })


    showConfirmation.value =
      false

    showServiceModal.value =
      false


    successMessage.value =
      'El servicio y mantenimiento fueron registrados correctamente.'


    resetServiceForm()

    await loadAll()

    clearSuccessLater()
  } catch (error) {
    console.error(
      'Error registrando servicio:',
      error
    )


    showConfirmation.value =
      false


    errorMessage.value =
      getErrorMessage(
        error,
        'No fue posible registrar el servicio.'
      )
  } finally {
    saving.value =
      false
  }
}


/* ============================================================
   DETALLE
============================================================ */

const openDetail = async servicio => {
  errorMessage.value =
    ''


  try {
    detailData.value =
      await obtenerDetalleServicio(
        servicio.id_servicio
      )


    showDetailModal.value =
      true
  } catch (error) {
    console.error(
      'Error obteniendo detalle:',
      error
    )


    errorMessage.value =
      getErrorMessage(
        error,
        'No fue posible obtener el detalle del servicio.'
      )
  }
}


const closeDetail = () => {
  showDetailModal.value =
    false

  detailData.value =
    null
}


/* ============================================================
   VEHÍCULO
============================================================ */

const getVehicle = id => {
  return (
    vehiculos.value.find(
      vehicle =>
        Number(
          vehicle.id_vehiculo
        ) ===
        Number(
          id
        )
    ) ||
    null
  )
}


const getVehicleName = id => {
  const vehicle =
    getVehicle(id)


  if (!vehicle) {
    return `Vehículo #${id}`
  }


  return (
    `${vehicle.marca} ${vehicle.modelo}`.trim()
  )
}


/* ============================================================
   MECÁNICO
============================================================ */

const getFullUserName = usuario => {
  if (!usuario) {
    return 'Sin nombre'
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
    .trim()
}


const getMechanicName = id => {
  if (!id) {
    return 'Sin asignar'
  }


  const mechanic =
    mecanicos.value.find(
      item =>
        Number(
          item.id_mecanico
        ) ===
        Number(
          id
        )
    )


  if (!mechanic) {
    return `Mecánico #${id}`
  }


  return getFullUserName(
    mechanic.usuario
  )
}


/* ============================================================
   ICONOS
============================================================ */

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


const formatDate = value => {
  if (!value) {
    return '—'
  }


  const date =
    new Date(
      `${value}T12:00:00`
    )


  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  ).format(
    date
  )
}


/* ============================================================
   ERROR
============================================================ */

const getErrorMessage = (
  error,
  fallback
) => {
  const message =
    error?.message ||
    error?.details ||
    error?.hint ||
    ''


  if (
    error?.code === '23503'
  ) {
    return 'Existe una relación inválida entre los registros seleccionados.'
  }


  if (
    error?.code === '23505'
  ) {
    return 'Ya existe un registro con esos datos.'
  }


  return (
    message ||
    fallback
  )
}


/* ============================================================
   MENSAJE TEMPORAL
============================================================ */

const clearSuccessLater = () => {
  setTimeout(
    () => {
      successMessage.value =
        ''
    },
    4000
  )
}


/* ============================================================
   QUICK ACTION
============================================================ */

watch(
  () =>
    props.action?.token,

  () => {
    if (
      props.action?.type ===
      'new'
    ) {
      openNewService()

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