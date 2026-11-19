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
      v-if="errorMessage && !confirmation.visible"
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

    <div
      v-if="mechanicMode && mechanicDataWarning"
      class="mechanic-client-warning"
      role="status"
    >
      <i class="bi bi-info-circle"></i>
      <span>{{ mechanicDataWarning }}</span>
    </div>

    <!-- ======================================================
         ENCABEZADO
    ======================================================= -->
    <div class="page-toolbar">
      <div>
        <h2>
          {{ mechanicMode ? 'Mis clientes' : 'Clientes' }}
        </h2>

        <p>
          {{
            mechanicMode
              ? 'Administra los clientes de tu cartera.'
              : 'Administra los clientes registrados en el sistema.'
          }}
        </p>
      </div>

      <div class="page-toolbar-actions">
        <button
          class="outline-button"
          type="button"
          :disabled="loading"
          @click="loadClientes"
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
          <i class="bi bi-person-plus"></i>
          Registrar cliente
        </button>
      </div>
    </div>

    <!-- ======================================================
         RESUMEN
    ======================================================= -->
    <div class="mini-stats-grid">
      <article class="mini-stat-card">
        <div class="mini-stat-icon blue">
          <i class="bi bi-person-vcard-fill"></i>
        </div>

        <div>
          <span>
            {{ mechanicId ? 'Asignados' : 'Total' }}
          </span>

          <strong>
            {{ clientes.length }}
          </strong>
        </div>
      </article>

      <article class="mini-stat-card">
        <div class="mini-stat-icon green">
          <i class="bi bi-person-check-fill"></i>
        </div>

        <div>
          <span>
            Activos
          </span>

          <strong>
            {{ totalActivos }}
          </strong>
        </div>
      </article>

      <article class="mini-stat-card">
        <div class="mini-stat-icon red">
          <i class="bi bi-person-dash-fill"></i>
        </div>

        <div>
          <span>
            Inactivos
          </span>

          <strong>
            {{ totalInactivos }}
          </strong>
        </div>
      </article>
    </div>

    <!-- ======================================================
         TABLA
    ======================================================= -->
    <section class="section-card">
      <div class="filters-row">
        <div class="search-box">
          <i class="bi bi-search"></i>

          <input
            v-model="search"
            type="text"
            placeholder="Buscar por nombre, correo, teléfono o dirección..."
          />
        </div>

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

      <div
        v-if="loading"
        class="component-loading"
      >
        <div class="app-spinner"></div>

        <span>
          Cargando clientes...
        </span>
      </div>

      <div
        v-else-if="filteredClientes.length"
        class="table-wrapper"
      >
        <table class="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th>Registro</th>

              <th class="actions-column">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in filteredClientes"
              :key="item.id_cliente"
            >
              <td>
                <div class="person-table-cell">
                  <div class="client-avatar">
                    {{ getInitials(item) }}
                  </div>

                  <div>
                    <strong>
                      {{ getFullName(item) }}
                    </strong>

                    <small>
                      Cliente n.º {{ item.id_cliente }}
                    </small>
                  </div>
                </div>
              </td>

              <td>
                <div class="contact-table-cell">
                  <span>
                    <i class="bi bi-envelope"></i>

                    {{
                      item.usuario?.correo ||
                      'Sin correo'
                    }}
                  </span>

                  <small>
                    <i class="bi bi-telephone"></i>

                    {{
                      item.usuario?.telefono ||
                      'Sin teléfono'
                    }}
                  </small>
                </div>
              </td>

              <td>
                <span
                  class="address-cell"
                  :title="
                    item.direccion ||
                    'Sin dirección'
                  "
                >
                  <i class="bi bi-geo-alt"></i>

                  {{
                    item.direccion ||
                    'Sin dirección'
                  }}
                </span>
              </td>

              <td>
                <button
                  class="status-button"
                  :class="
                    isActive(item)
                      ? 'active'
                      : 'inactive'
                  "
                  type="button"
                  :title="
                    isActive(item)
                      ? 'Cambiar a Inactivo'
                      : 'Cambiar a Activo'
                  "
                  @click="requestStatusChange(item)"
                >
                  <span class="status-dot"></span>

                  {{
                    item.usuario?.estatus ||
                    'Activo'
                  }}
                </button>
              </td>

              <td>
                {{
                  formatDate(
                    item.usuario?.fecha_registro
                  )
                }}
              </td>

              <td>
                <div class="table-actions">
                  <button
                    class="table-action-button view"
                    type="button"
                    title="Ver información"
                    @click="openViewModal(item)"
                  >
                    <i class="bi bi-eye"></i>
                  </button>

                  <button
                    class="table-action-button edit"
                    type="button"
                    title="Editar"
                    @click="openEditModal(item)"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>

                  <button
                    class="table-action-button delete"
                    type="button"
                    title="Eliminar"
                    @click="requestDelete(item)"
                  >
                    <i class="bi bi-trash3"></i>
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
        <i class="bi bi-person-vcard"></i>

        <h4>
          {{
            clientes.length
              ? 'No se encontraron resultados'
              : mechanicMode
              ? 'Tu cartera aún no tiene clientes'
                : 'No hay clientes registrados'
          }}
        </h4>

        <p>
          {{
            clientes.length
              ? 'Prueba modificando los filtros de búsqueda.'
              : mechanicMode
                ? 'Registra un cliente para agregarlo a tu cartera, o vincula uno de tus vehículos.'
                : 'Registra al primer cliente para comenzar.'
          }}
        </p>

        <button
          v-if="!clientes.length"
          class="primary-button"
          type="button"
          @click="openNewModal"
        >
          <i class="bi bi-plus-lg"></i>
          Registrar cliente
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
      <div class="app-modal">
        <div class="modal-header">
          <div>
            <h3>
              {{
                editing
                  ? 'Actualizar cliente'
                  : 'Registrar cliente'
              }}
            </h3>

            <p>
              {{
                editing
                  ? 'Modifica la información del cliente seleccionado.'
                  : 'Ingresa la información del nuevo cliente.'
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
          <div class="form-section-title">
            <i class="bi bi-person"></i>

            <div>
              <strong>
                Información personal
              </strong>

              <span>
                Datos generales del cliente
              </span>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="cliente-nombre">
                Nombre
                <span class="required">*</span>
              </label>

              <input
                id="cliente-nombre"
                v-model="form.nombre"
                type="text"
                maxlength="100"
                placeholder="Nombre"
                required
              />
            </div>

            <div class="form-group">
              <label for="cliente-paterno">
                Apellido paterno
                <span class="required">*</span>
              </label>

              <input
                id="cliente-paterno"
                v-model="form.apellido_paterno"
                type="text"
                maxlength="100"
                placeholder="Apellido paterno"
                required
              />
            </div>

            <div class="form-group">
              <label for="cliente-materno">
                Apellido materno
                <span class="required">*</span>
              </label>

              <input
                id="cliente-materno"
                v-model="form.apellido_materno"
                type="text"
                maxlength="100"
                placeholder="Apellido materno"
                :required="!editing"
              />
            </div>

            <div class="form-group">
              <label for="cliente-telefono">
                Teléfono
                <span class="required">*</span>
              </label>

              <input
                id="cliente-telefono"
                v-model="form.telefono"
                type="tel"
                maxlength="20"
                placeholder="962 000 0000"
                :required="!editing"
              />
            </div>

            <div class="form-group form-group-full">
              <label for="cliente-direccion">
                Dirección
                <span class="required">*</span>
              </label>

              <textarea
                id="cliente-direccion"
                v-model="form.direccion"
                maxlength="300"
                rows="3"
                placeholder="Calle, número, colonia, ciudad..."
                :required="!editing"
              ></textarea>
            </div>
          </div>

          <div class="form-section-title form-section-spacing">
            <i class="bi bi-shield-lock"></i>

            <div>
              <strong>
                Cuenta de acceso
              </strong>

              <span>
                Credenciales y estado
              </span>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="cliente-correo">
                Correo electrónico
                <span class="required">*</span>
              </label>

              <input
                id="cliente-correo"
                v-model="form.correo"
                type="email"
                maxlength="150"
                placeholder="cliente@correo.com"
                required
              />
            </div>

            <div
              v-if="!editing"
              class="form-group"
            >
              <label for="cliente-password">
                Contraseña
                <span class="required">*</span>
              </label>

              <div class="password-field">
                <input
                  id="cliente-password"
                  v-model="form.contrasenia"
                  :type="
                    showPassword
                      ? 'text'
                      : 'password'
                  "
                  minlength="6"
                  placeholder="Mínimo 6 caracteres"
                  required
                />

                <button
                  type="button"
                  @click="showPassword = !showPassword"
                >
                  <i
                    class="bi"
                    :class="
                      showPassword
                        ? 'bi-eye-slash'
                        : 'bi-eye'
                    "
                  ></i>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="cliente-estatus">
                Estado
                <span class="required">*</span>
              </label>

              <select
                id="cliente-estatus"
                v-model="form.estatus"
                required
              >
                <option value="" disabled>
                  Selecciona un estado
                </option>

                <option value="Activo">
                  Activo
                </option>

                <option value="Inactivo">
                  Inactivo
                </option>
              </select>
            </div>
          </div>

          <div
            v-if="editing"
            class="form-information"
          >
            <i class="bi bi-info-circle"></i>

            <span>
              La contraseña no se modifica desde este
              formulario. Los datos generales sí serán
              actualizados.
            </span>
          </div>

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
                    : 'bi bi-person-plus'
                "
              ></i>

              {{
                saving
                  ? 'Procesando...'
                  : editing
                    ? 'Actualizar'
                    : 'Registrar'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ======================================================
         VER CLIENTE / EXPEDIENTE
    ======================================================= -->
    <div
      v-if="
        showViewModal &&
        selectedCliente
      "
      class="modal-overlay"
      @click.self="closeViewModal"
    >
      <div class="app-modal client-detail-modal client-record-modal">
        <div class="modal-header">
          <div>
            <h3>
              Información del cliente
            </h3>

            <p>
              Expediente general del cliente y
              su información operativa.
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
          <!-- PERFIL -->
          <div class="personal-profile-header">
            <div class="client-large-avatar">
              {{ getInitials(selectedCliente) }}
            </div>

            <div class="client-profile-main">
              <div class="client-profile-title-row">
                <div>
                  <h3>
                    {{ getFullName(selectedCliente) }}
                  </h3>

                  <span class="client-profile-subtitle">
                    Cliente n.º {{ selectedCliente.id_cliente }}
                  </span>
                </div>

                <span
                  class="status-badge"
                  :class="
                    isActive(selectedCliente)
                      ? 'active'
                      : 'inactive'
                  "
                >
                  {{
                    selectedCliente.usuario?.estatus ||
                    'Activo'
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- RESUMEN -->
          <div class="client-record-summary">
            <article class="client-record-summary-card">
              <div class="client-record-summary-icon vehicle">
                <i class="bi bi-car-front-fill"></i>
              </div>

              <div>
                <span>Vehículos</span>
                <strong>{{ clienteVehiculos.length }}</strong>
              </div>
            </article>

            <article class="client-record-summary-card">
              <div class="client-record-summary-icon appointment">
                <i class="bi bi-calendar-check-fill"></i>
              </div>

              <div>
                <span>Citas</span>
                <strong>{{ clienteCitas.length }}</strong>
              </div>
            </article>

            <article class="client-record-summary-card">
              <div class="client-record-summary-icon alert">
                <i class="bi bi-bell-fill"></i>
              </div>

              <div>
                <span>Alertas</span>
                <strong>{{ clienteAlertas.length }}</strong>
              </div>
            </article>

            <article class="client-record-summary-card">
              <div class="client-record-summary-icon transmission">
                <i class="bi bi-gear-fill"></i>
              </div>

              <div>
                <span>Transmisión</span>
                <strong>{{ clienteTransmisiones.length }}</strong>
              </div>
            </article>
          </div>

          <!-- PESTAÑAS DEL CLIENTE -->
          <div class="client-record-tabs">
            <button
              type="button"
              class="client-record-tab"
              :class="{ active: activeClientTab === 'datos' }"
              @click="activeClientTab = 'datos'"
            >
              <i class="bi bi-person-lines-fill"></i>
              Datos
            </button>

            <button
              type="button"
              class="client-record-tab"
              :class="{ active: activeClientTab === 'vehiculos' }"
              @click="activeClientTab = 'vehiculos'"
            >
              <i class="bi bi-car-front"></i>
              Vehículos

              <span>
                {{ clienteVehiculos.length }}
              </span>
            </button>

            <button
              type="button"
              class="client-record-tab"
              :class="{ active: activeClientTab === 'citas' }"
              @click="activeClientTab = 'citas'"
            >
              <i class="bi bi-calendar3"></i>
              Citas

              <span>
                {{ clienteCitas.length }}
              </span>
            </button>

            <button
              type="button"
              class="client-record-tab"
              :class="{ active: activeClientTab === 'alertas' }"
              @click="activeClientTab = 'alertas'"
            >
              <i class="bi bi-bell"></i>
              Alertas

              <span>
                {{ clienteAlertas.length }}
              </span>
            </button>

            <button
              type="button"
              class="client-record-tab"
              :class="{ active: activeClientTab === 'transmision' }"
              @click="activeClientTab = 'transmision'"
            >
              <i class="bi bi-gear-wide-connected"></i>
              Transmisión

              <span>
                {{ clienteTransmisiones.length }}
              </span>
            </button>
          </div>

          <div
            v-if="loadingClientRecord"
            class="component-loading client-record-loading"
          >
            <div class="app-spinner"></div>

            <span>
              Cargando expediente del cliente...
            </span>
          </div>

          <!-- ==================================================
               DATOS
          =================================================== -->
          <div
            v-else-if="activeClientTab === 'datos'"
            class="client-tab-content"
          >
            <div class="client-section-heading">
              <div>
                <h4>
                  Datos generales
                </h4>

                <span>
                  Información personal y de contacto
                </span>
              </div>
            </div>

            <div class="client-data-grid">
              <div class="client-data-item">
                <span>
                  Nombre completo:
                </span>

                <strong>
                  {{ getFullName(selectedCliente) }}
                </strong>
              </div>

              <div class="client-data-item">
                <span>
                  Correo electrónico:
                </span>

                <strong>
                  {{
                    selectedCliente.usuario?.correo ||
                    'No registrado'
                  }}
                </strong>
              </div>

              <div class="client-data-item">
                <span>
                  Teléfono:
                </span>

                <strong>
                  {{
                    selectedCliente.usuario?.telefono ||
                    'No registrado'
                  }}
                </strong>
              </div>

              <div class="client-data-item">
                <span>
                  Estado:
                </span>

                <strong>
                  {{
                    selectedCliente.usuario?.estatus ||
                    'Activo'
                  }}
                </strong>
              </div>

              <div class="client-data-item client-data-item-full">
                <span>
                  Dirección:
                </span>

                <strong>
                  {{
                    selectedCliente.direccion ||
                    'No registrada'
                  }}
                </strong>
              </div>

              <div class="client-data-item">
                <span>
                  Fecha de registro:
                </span>

                <strong>
                  {{
                    formatDate(
                      selectedCliente.usuario?.fecha_registro
                    )
                  }}
                </strong>
              </div>

              <div class="client-data-item">
                <span>
                  Identificador:
                </span>

                <strong>
                  Cliente n.º {{ selectedCliente.id_cliente }}
                </strong>
              </div>
            </div>
          </div>

          <!-- ==================================================
               VEHÍCULOS
          =================================================== -->
          <div
            v-else-if="activeClientTab === 'vehiculos'"
            class="client-tab-content"
          >
            <!-- LISTADO -->
            <template v-if="!selectedVehicle">
              <div class="client-section-heading">
                <div>
                  <h4>
                    Vehículos registrados
                  </h4>

                  <span>
                    Unidades asociadas al cliente
                  </span>
                </div>

                <span class="vehicle-count-badge">
                  {{ clienteVehiculos.length }}
                </span>
              </div>

              <div
                v-if="clienteVehiculos.length"
                class="client-vehicles-list client-vehicles-expanded"
              >
                <article
                  v-for="vehiculo in clienteVehiculos"
                  :key="vehiculo.id_vehiculo"
                  class="client-vehicle-card client-vehicle-card-detailed"
                >
                  <div class="client-vehicle-icon">
                    <i
                      :class="
                        getVehicleIcon(
                          vehiculo.tipo_unidad
                        )
                      "
                    ></i>
                  </div>

                  <div class="client-vehicle-info">
                    <div class="client-vehicle-title">
                      <div>
                        <strong>
                          {{
                            vehiculo.marca ||
                            'Sin marca'
                          }}
                          {{
                            vehiculo.modelo ||
                            ''
                          }}
                        </strong>

                        <span>
                          {{
                            vehiculo.placas ||
                            'Sin placas'
                          }}
                          ·
                          {{
                            vehiculo.tipo_unidad ||
                            'Sin tipo'
                          }}
                        </span>
                      </div>

                      <span
                        class="status-badge"
                        :class="
                          getVehicleStatusClass(
                            vehiculo.estatus
                          )
                        "
                      >
                        {{
                          vehiculo.estatus ||
                          'Activo'
                        }}
                      </span>
                    </div>

                    <div class="client-vehicle-data-grid">
                      <div>
                        <small>N.º económico</small>

                        <strong>
                          {{
                            vehiculo.no_economico ||
                            'No registrado'
                          }}
                        </strong>
                      </div>

                      <div>
                        <small>Año</small>

                        <strong>
                          {{
                            vehiculo.anio_modelo ||
                            'No registrado'
                          }}
                        </strong>
                      </div>

                      <div>
                        <small>Kilometraje</small>

                        <strong>
                          {{
                            formatMileage(
                              vehiculo.kilometraje_actual
                            )
                          }}
                        </strong>
                      </div>

                      <div>
                        <small>Número de serie</small>

                        <strong>
                          {{
                            vehiculo.numero_serie ||
                            'No registrado'
                          }}
                        </strong>
                      </div>
                    </div>

                    <div class="client-vehicle-actions">
                      <button
                        type="button"
                        class="vehicle-record-button"
                        @click="openVehicleRecord(vehiculo)"
                      >
                        <i class="bi bi-folder2-open"></i>

                        Ver vehículo

                        <i class="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                </article>
              </div>

              <div
                v-else
                class="client-empty-record"
              >
                <i class="bi bi-car-front"></i>

                <strong>
                  Sin vehículos registrados
                </strong>

                <span>
                  Este cliente todavía no tiene
                  vehículos asociados.
                </span>
              </div>
            </template>

            <!-- ==============================================
                 EXPEDIENTE TÉCNICO DEL VEHÍCULO
            =============================================== -->
            <template v-else>
              <button
                type="button"
                class="vehicle-record-back"
                @click="closeVehicleRecord"
              >
                <i class="bi bi-arrow-left"></i>
                Volver a vehículos
              </button>

              <div class="vehicle-record-header">
                <div class="vehicle-record-header-icon">
                  <i
                    :class="
                      getVehicleIcon(
                        selectedVehicle.tipo_unidad
                      )
                    "
                  ></i>
                </div>

                <div class="vehicle-record-header-info">
                  <div class="vehicle-record-title-row">
                    <div>
                      <h3>
                        {{
                          selectedVehicle.marca ||
                          'Sin marca'
                        }}
                        {{
                          selectedVehicle.modelo ||
                          ''
                        }}
                      </h3>

                      <span>
                        {{
                          selectedVehicle.placas ||
                          'Sin placas'
                        }}
                        ·
                        {{
                          formatMileage(
                            selectedVehicle.kilometraje_actual
                          )
                        }}
                      </span>
                    </div>

                    <span
                      class="status-badge"
                      :class="
                        getVehicleStatusClass(
                          selectedVehicle.estatus
                        )
                      "
                    >
                      {{
                        selectedVehicle.estatus ||
                        'Activo'
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="vehicle-record-tabs">
                <button
                  type="button"
                  class="vehicle-record-tab"
                  :class="{
                    active:
                      activeVehicleTab ===
                      'informacion'
                  }"
                  @click="
                    activeVehicleTab =
                      'informacion'
                  "
                >
                  <i class="bi bi-car-front"></i>
                  Información
                </button>

                <button
                  type="button"
                  class="vehicle-record-tab"
                  :class="{
                    active:
                      activeVehicleTab ===
                      'mantenimiento'
                  }"
                  @click="
                    activeVehicleTab =
                      'mantenimiento'
                  "
                >
                  <i class="bi bi-speedometer2"></i>
                  Mantenimiento
                </button>

                <button
                  type="button"
                  class="vehicle-record-tab"
                  :class="{
                    active:
                      activeVehicleTab ===
                      'servicios'
                  }"
                  @click="
                    activeVehicleTab =
                      'servicios'
                  "
                >
                  <i class="bi bi-tools"></i>

                  Servicios

                  <span class="vehicle-tab-counter">
                    {{ vehicleServices.length }}
                  </span>
                </button>

                <button
                  type="button"
                  class="vehicle-record-tab"
                  :class="{
                    active:
                      activeVehicleTab ===
                      'llantas'
                  }"
                  @click="
                    activeVehicleTab =
                      'llantas'
                  "
                >
                  <i class="bi bi-circle"></i>

                  Llantas

                  <span class="vehicle-tab-counter">
                    {{ latestVehicleTires.length }}
                  </span>
                </button>
              </div>

              <div
                v-if="loadingVehicleRecord"
                class="vehicle-record-loading"
              >
                <div class="app-spinner"></div>

                <span>
                  Cargando expediente técnico...
                </span>
              </div>

              <!-- INFORMACIÓN -->
              <div
                v-else-if="
                  activeVehicleTab ===
                  'informacion'
                "
                class="vehicle-record-content"
              >
                <div class="vehicle-record-section-heading">
                  <div>
                    <h4>
                      Información del vehículo
                    </h4>

                    <span>
                      Datos generales de la unidad seleccionada
                    </span>
                  </div>
                </div>

                <div class="vehicle-information-grid">
                  <div class="vehicle-information-item">
                    <span>Marca</span>

                    <strong>
                      {{
                        selectedVehicle.marca ||
                        'No registrada'
                      }}
                    </strong>
                  </div>

                  <div class="vehicle-information-item">
                    <span>Modelo</span>

                    <strong>
                      {{
                        selectedVehicle.modelo ||
                        'No registrado'
                      }}
                    </strong>
                  </div>

                  <div class="vehicle-information-item">
                    <span>Año</span>

                    <strong>
                      {{
                        selectedVehicle.anio_modelo ||
                        'No registrado'
                      }}
                    </strong>
                  </div>

                  <div class="vehicle-information-item">
                    <span>Tipo de unidad</span>

                    <strong>
                      {{
                        selectedVehicle.tipo_unidad ||
                        'No registrado'
                      }}
                    </strong>
                  </div>

                  <div class="vehicle-information-item">
                    <span>Placas</span>

                    <strong>
                      {{
                        selectedVehicle.placas ||
                        'No registradas'
                      }}
                    </strong>
                  </div>

                  <div class="vehicle-information-item">
                    <span>N.º económico</span>

                    <strong>
                      {{
                        selectedVehicle.no_economico ||
                        'No registrado'
                      }}
                    </strong>
                  </div>

                  <div class="vehicle-information-item">
                    <span>Kilometraje actual</span>

                    <strong>
                      {{
                        formatMileage(
                          selectedVehicle.kilometraje_actual
                        )
                      }}
                    </strong>
                  </div>

                  <div class="vehicle-information-item">
                    <span>Estado</span>

                    <strong>
                      {{
                        selectedVehicle.estatus ||
                        'Activo'
                      }}
                    </strong>
                  </div>

                  <div
                    class="
                      vehicle-information-item
                      vehicle-information-item-full
                    "
                  >
                    <span>Número de serie</span>

                    <strong>
                      {{
                        selectedVehicle.numero_serie ||
                        'No registrado'
                      }}
                    </strong>
                  </div>
                </div>
              </div>

              <!-- MANTENIMIENTO -->
              <div
                v-else-if="
                  activeVehicleTab ===
                  'mantenimiento'
                "
                class="vehicle-record-content"
              >
                <div class="vehicle-record-section-heading">
                  <div>
                    <h4>
                      Mantenimiento preventivo
                    </h4>

                    <span>
                      Estado actual según kilometraje
                    </span>
                  </div>
                </div>

                <div
                  v-if="vehicleMaintenance"
                  class="maintenance-record"
                >
                  <div
                    class="maintenance-status-card"
                    :class="
                      getMaintenanceStatusClass(
                        vehicleMaintenanceStatus?.estado
                      )
                    "
                  >
                    <div class="maintenance-status-icon">
                      <i
                        :class="
                          getMaintenanceIcon(
                            vehicleMaintenanceStatus?.estado
                          )
                        "
                      ></i>
                    </div>

                    <div>
                      <span>
                        Estado del mantenimiento
                      </span>

                      <strong>
                        {{
                          formatMaintenanceStatus(
                            vehicleMaintenanceStatus?.estado
                          )
                        }}
                      </strong>

                      <p>
                        {{
                          getMaintenanceMessage(
                            vehicleMaintenanceStatus?.estado
                          )
                        }}
                      </p>
                    </div>
                  </div>

                  <div class="maintenance-km-grid">
                    <div>
                      <span>Kilometraje actual</span>

                      <strong>
                        {{
                          formatMileage(
                            selectedVehicle.kilometraje_actual
                          )
                        }}
                      </strong>
                    </div>

                    <div>
                      <span>Último mantenimiento</span>

                      <strong>
                        {{
                          formatMileage(
                            vehicleMaintenance.ultimo_km_registrado
                          )
                        }}
                      </strong>
                    </div>

                    <div>
                      <span>Intervalo</span>

                      <strong>
                        {{
                          formatMileage(
                            vehicleMaintenance.intervalo
                          )
                        }}
                      </strong>
                    </div>

                    <div>
                      <span>Próximo servicio</span>

                      <strong>
                        {{
                          formatMileage(
                            vehicleMaintenance.proximo_servicio
                          )
                        }}
                      </strong>
                    </div>
                  </div>
                </div>

                <div
                  v-else
                  class="client-empty-record"
                >
                  <i class="bi bi-speedometer2"></i>

                  <strong>
                    Sin mantenimiento configurado
                  </strong>

                  <span>
                    Este vehículo todavía no tiene
                    una configuración de mantenimiento
                    preventivo.
                  </span>
                </div>
              </div>

              <!-- SERVICIOS -->
              <div
                v-else-if="
                  activeVehicleTab ===
                  'servicios'
                "
                class="vehicle-record-content"
              >
                <div class="vehicle-record-section-heading">
                  <div>
                    <h4>
                      Historial de servicios
                    </h4>

                    <span>
                      Servicios realizados a esta unidad
                    </span>
                  </div>
                </div>

                <div
                  v-if="vehicleServiceDetails.length"
                  class="vehicle-services-list"
                >
                  <article
                    v-for="detalle in vehicleServiceDetails"
                    :key="detalle.servicio.id_servicio"
                    class="vehicle-service-card"
                  >
                    <div class="vehicle-service-header">
                      <div class="vehicle-service-icon">
                        <i class="bi bi-tools"></i>
                      </div>

                      <div>
                        <strong>
                          Servicio n.º {{ detalle.servicio.id_servicio }}
                        </strong>

                        <span>
                          {{
                            formatDateOnly(
                              detalle.servicio.fecha_servicio
                            )
                          }}
                        </span>
                      </div>

                      <span class="service-mileage-badge">
                        {{
                          formatMileage(
                            detalle.servicio.kilometraje
                          )
                        }}
                      </span>
                    </div>

                    <div class="service-detail-box">
                      <div>
                        <span>Motor</span>

                        <strong>
                          {{
                            detalle.motor
                              ? 'Registrado'
                              : 'Sin registro'
                          }}
                        </strong>
                      </div>

                      <div>
                        <span>Transmisión</span>

                        <strong>
                          {{
                            detalle.transmision
                              ? 'Registrada'
                              : 'Sin registro'
                          }}
                        </strong>
                      </div>

                      <div>
                        <span>Llantas inspeccionadas</span>

                        <strong>
                          {{
                            detalle.llantas?.length ||
                            0
                          }}
                        </strong>
                      </div>
                    </div>

                    <p
                      v-if="
                        detalle.servicio.observaciones_generales
                      "
                      class="vehicle-service-observations"
                    >
                      {{
                        detalle.servicio.observaciones_generales
                      }}
                    </p>
                  </article>
                </div>

                <div
                  v-else
                  class="client-empty-record"
                >
                  <i class="bi bi-tools"></i>

                  <strong>
                    Sin servicios registrados
                  </strong>

                  <span>
                    Todavía no existen servicios
                    registrados para este vehículo.
                  </span>
                </div>
              </div>

              <!-- LLANTAS -->
              <div
                v-else-if="
                  activeVehicleTab ===
                  'llantas'
                "
                class="vehicle-record-content"
              >
                <div class="vehicle-record-section-heading">
                  <div>
                    <h4>
                      Última inspección de llantas
                    </h4>

                    <span>
                      <template v-if="latestTireInspectionDate">
                        Inspección del
                        {{
                          formatDateOnly(
                            latestTireInspectionDate
                          )
                        }}
                      </template>

                      <template v-else>
                        Sin inspecciones registradas
                      </template>
                    </span>
                  </div>
                </div>

                <div
                  v-if="latestVehicleTires.length"
                  class="vehicle-tires-grid"
                >
                  <article
                    v-for="llanta in latestVehicleTires"
                    :key="llanta.id_detalle"
                    class="vehicle-tire-card"
                  >
                    <div class="vehicle-tire-header">
                      <div class="vehicle-tire-icon">
                        <i class="bi bi-circle"></i>
                      </div>

                      <div>
                        <strong>
                          {{
                            llanta.posicion ||
                            'Posición no registrada'
                          }}
                        </strong>

                        <span>
                          Llanta
                          {{
                            llanta.numero_llanta ||
                            '—'
                          }}
                        </span>
                      </div>

                      <span
                        class="tire-condition-badge"
                        :class="
                          getTireConditionClass(
                            llanta.condicion
                          )
                        "
                      >
                        {{
                          llanta.condicion ||
                          'Sin condición'
                        }}
                      </span>
                    </div>

                    <div class="tire-data-grid">
                      <div>
                        <span>Marca</span>

                        <strong>
                          {{
                            llanta.marca ||
                            'No registrada'
                          }}
                        </strong>
                      </div>

                      <div>
                        <span>Medida</span>

                        <strong>
                          {{
                            llanta.medida ||
                            'No registrada'
                          }}
                        </strong>
                      </div>

                      <div>
                        <span>PSI</span>

                        <strong>
                          {{
                            llanta.psi ??
                            'No registrado'
                          }}
                        </strong>
                      </div>

                      <div>
                        <span>Desgaste</span>

                        <strong>
                          {{
                            llanta.desgaste_mm ??
                            'No registrado'
                          }}

                          <template
                            v-if="
                              llanta.desgaste_mm !== null &&
                              llanta.desgaste_mm !== undefined
                            "
                          >
                            mm
                          </template>
                        </strong>
                      </div>
                    </div>

                    <div
                      v-if="llanta.tipo_desgaste"
                      class="tire-wear-type"
                    >
                      <span>
                        Tipo de desgaste
                      </span>

                      <strong>
                        {{ llanta.tipo_desgaste }}
                      </strong>
                    </div>
                  </article>
                </div>

                <div
                  v-else
                  class="client-empty-record"
                >
                  <i class="bi bi-circle"></i>

                  <strong>
                    Sin inspecciones de llantas
                  </strong>

                  <span>
                    Todavía no existen datos de llantas
                    registrados para este vehículo.
                  </span>
                </div>
              </div>
            </template>
          </div>
                    <!-- ==================================================
               CITAS
          =================================================== -->
          <div
            v-else-if="activeClientTab === 'citas'"
            class="client-tab-content"
          >
            <div class="client-section-heading">
              <div>
                <h4>
                  Historial de citas
                </h4>

                <span>
                  Citas registradas para este cliente
                </span>
              </div>

              <span class="vehicle-count-badge">
                {{ clienteCitas.length }}
              </span>
            </div>

            <div
              v-if="clienteCitas.length"
              class="client-record-list"
            >
              <article
                v-for="cita in clienteCitas"
                :key="cita.id_cita"
                class="client-record-item appointment-record-item"
              >
                <div class="client-record-item-icon appointment">
                  <i class="bi bi-calendar-check"></i>
                </div>

                <div class="client-record-item-content">
                  <div class="client-record-item-header">
                    <div>
                      <strong>
                        {{
                          formatDateOnly(
                            cita.fecha
                          )
                        }}
                      </strong>

                      <span>
                        · {{
                          formatTime(
                            cita.hora
                          )
                        }}
                      </span>
                    </div>

                    <span
                      class="record-status-badge"
                      :class="
                        getAppointmentStatusClass(
                          cita.estado
                        )
                      "
                    >
                      {{
                        formatAppointmentStatus(
                          cita.estado
                        )
                      }}
                    </span>
                  </div>

                  <div class="client-record-item-data">
                    <div>
                      <span>
                        Vehículo
                      </span>

                      <strong>
                        {{
                          getAppointmentVehicle(
                            cita
                          )
                        }}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Mecánico
                      </span>

                      <strong>
                        {{
                          getMechanicName(
                            cita.mecanico
                          )
                        }}
                      </strong>
                    </div>
                  </div>

                  <div
                    v-if="cita.motivo"
                    class="client-record-description"
                  >
                    <span>
                      Motivo
                    </span>

                    <p>
                      {{ cita.motivo }}
                    </p>
                  </div>

                  <div
                    v-if="cita.observaciones"
                    class="client-record-description"
                  >
                    <span>
                      Observaciones
                    </span>

                    <p>
                      {{ cita.observaciones }}
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <div
              v-else
              class="client-empty-record"
            >
              <i class="bi bi-calendar3"></i>

              <strong>
                Sin citas registradas
              </strong>

              <span>
                Este cliente todavía no tiene
                citas registradas.
              </span>
            </div>
          </div>

          <!-- ==================================================
               ALERTAS
          =================================================== -->
          <div
            v-else-if="activeClientTab === 'alertas'"
            class="client-tab-content"
          >
            <div class="client-section-heading">
              <div>
                <h4>
                  Alertas del cliente
                </h4>

                <span>
                  Avisos asociados a sus vehículos
                </span>
              </div>

              <span class="vehicle-count-badge">
                {{ clienteAlertas.length }}
              </span>
            </div>

            <div
              v-if="clienteAlertas.length"
              class="client-record-list"
            >
              <article
                v-for="alerta in clienteAlertas"
                :key="alerta.id_alerta"
                class="client-record-item alert-record-item"
              >
                <div
                  class="client-record-item-icon alert"
                  :class="
                    getAlertLevelClass(
                      alerta.nivel
                    )
                  "
                >
                  <i
                    :class="
                      getAlertIcon(
                        alerta.tipo_alerta
                      )
                    "
                  ></i>
                </div>

                <div class="client-record-item-content">
                  <div class="client-record-item-header">
                    <div>
                      <strong>
                        {{
                          formatAlertType(
                            alerta.tipo_alerta
                          )
                        }}
                      </strong>

                      <span>
                        · {{
                          getAlertVehicle(
                            alerta
                          )
                        }}
                      </span>
                    </div>

                    <span
                      class="record-status-badge"
                      :class="
                        getAlertStatusClass(
                          alerta.estado
                        )
                      "
                    >
                      {{
                        formatAlertStatus(
                          alerta.estado
                        )
                      }}
                    </span>
                  </div>

                  <div class="alert-level-row">
                    <span>
                      Nivel
                    </span>

                    <strong
                      class="record-level-badge"
                      :class="
                        getAlertLevelClass(
                          alerta.nivel
                        )
                      "
                    >
                      {{
                        formatAlertLevel(
                          alerta.nivel
                        )
                      }}
                    </strong>
                  </div>

                  <div
                    v-if="alerta.mensaje"
                    class="client-record-description"
                  >
                    <span>
                      Mensaje
                    </span>

                    <p>
                      {{ alerta.mensaje }}
                    </p>
                  </div>

                  <div class="client-record-item-data">
                    <div>
                      <span>
                        Fecha programada
                      </span>

                      <strong>
                        {{
                          formatDate(
                            alerta.fecha_programada
                          )
                        }}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Fecha de lectura
                      </span>

                      <strong>
                        {{
                          alerta.fecha_lectura
                            ? formatDate(
                                alerta.fecha_lectura
                              )
                            : 'No leída'
                        }}
                      </strong>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div
              v-else
              class="client-empty-record"
            >
              <i class="bi bi-bell"></i>

              <strong>
                Sin alertas registradas
              </strong>

              <span>
                Este cliente no tiene alertas
                asociadas actualmente.
              </span>
            </div>
          </div>

          <!-- ==================================================
               TRANSMISIÓN
          =================================================== -->
          <div
            v-else-if="activeClientTab === 'transmision'"
            class="client-tab-content"
          >
            <div class="client-section-heading">
              <div>
                <h4>
                  Reportes de transmisión
                </h4>

                <span>
                  Observaciones registradas por el cliente
                </span>
              </div>

              <span class="vehicle-count-badge">
                {{ clienteTransmisiones.length }}
              </span>
            </div>

            <div
              v-if="clienteTransmisiones.length"
              class="client-record-list"
            >
              <article
                v-for="registro in clienteTransmisiones"
                :key="registro.id_registro"
                class="client-record-item transmission-record-item"
              >
                <div class="client-record-item-icon transmission">
                  <i class="bi bi-gear-wide-connected"></i>
                </div>

                <div class="client-record-item-content">
                  <div class="client-record-item-header">
                    <div>
                      <strong>
                        {{
                          getTransmissionVehicle(
                            registro
                          )
                        }}
                      </strong>

                      <span>
                        · {{
                          formatDateOnly(
                            registro.fecha_observacion
                          )
                        }}
                      </span>
                    </div>

                    <span
                      class="record-status-badge"
                      :class="
                        getTransmissionStatusClass(
                          registro.estado
                        )
                      "
                    >
                      {{
                        formatTransmissionStatus(
                          registro.estado
                        )
                      }}
                    </span>
                  </div>

                  <div
                    v-if="
                      normalizeSymptoms(
                        registro.sintomas
                      ).length
                    "
                    class="transmission-symptoms"
                  >
                    <span class="transmission-symptoms-title">
                      Síntomas reportados
                    </span>

                    <div class="transmission-symptom-list">
                      <span
                        v-for="
                          sintoma in normalizeSymptoms(
                            registro.sintomas
                          )
                        "
                        :key="sintoma"
                        class="transmission-symptom-chip"
                      >
                        {{ sintoma }}
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="registro.descripcion"
                    class="client-record-description"
                  >
                    <span>
                      Descripción
                    </span>

                    <p>
                      {{ registro.descripcion }}
                    </p>
                  </div>

                  <div class="client-record-item-data">
                    <div>
                      <span>
                        Atención externa
                      </span>

                      <strong>
                        {{
                          registro.atencion_externa
                            ? 'Sí'
                            : 'No'
                        }}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Fecha de registro
                      </span>

                      <strong>
                        {{
                          formatDate(
                            registro.fecha_registro
                          )
                        }}
                      </strong>
                    </div>

                    <div
                      v-if="registro.fecha_revision"
                    >
                      <span>
                        Fecha de revisión
                      </span>

                      <strong>
                        {{
                          formatDate(
                            registro.fecha_revision
                          )
                        }}
                      </strong>
                    </div>
                  </div>

                  <div
                    v-if="
                      registro.atencion_externa &&
                      registro.detalle_atencion_externa
                    "
                    class="client-record-description"
                  >
                    <span>
                      Detalle de atención externa
                    </span>

                    <p>
                      {{
                        registro.detalle_atencion_externa
                      }}
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <div
              v-else
              class="client-empty-record"
            >
              <i class="bi bi-gear-wide-connected"></i>

              <strong>
                Sin reportes de transmisión
              </strong>

              <span>
                El cliente todavía no ha registrado
                observaciones de transmisión.
              </span>
            </div>
          </div>
        </div>

        <!-- FOOTER EXPEDIENTE -->
        <div class="modal-footer">
          <button
            type="button"
            class="secondary-button"
            @click="closeViewModal"
          >
            Cerrar
          </button>

          <button
            type="button"
            class="primary-button"
            @click="editFromView"
          >
            <i class="bi bi-pencil-square"></i>
            Editar
          </button>
        </div>
      </div>
    </div>

    <!-- ======================================================
         MODAL DE CONFIRMACIÓN
    ======================================================= -->
    <div
      v-if="confirmation.visible"
      class="modal-overlay confirmation-overlay"
      @click.self="closeConfirmation"
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
          v-if="errorMessage"
          class="app-alert danger"
          role="alert"
        >
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

        <div class="confirmation-actions">
          <button
            type="button"
            class="secondary-button"
            :disabled="processingConfirmation"
            @click="closeConfirmation"
          >
            Cancelar
          </button>

          <button
            type="button"
            :class="
              confirmation.type === 'delete'
                ? 'danger-button'
                : 'primary-button'
            "
            :disabled="processingConfirmation"
            @click="executeConfirmation"
          >
            <i
              v-if="processingConfirmation"
              class="bi bi-arrow-repeat spin"
            ></i>

            <span>
              {{
                processingConfirmation
                  ? 'Procesando...'
                  : confirmation.confirmText
              }}
            </span>
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
  actualizarCliente,
  cambiarEstadoCliente,
  eliminarCliente,
  obtenerClientes,
  obtenerClientesMecanico,
  obtenerVehiculosCliente,
  obtenerRegistrosTransmisionCliente,
  registrarCliente,
  registrarClienteMecanico
} from '../services/clienteService.js'

import {
  obtenerAlertasCliente,
  obtenerCitas
} from '../services/alertaService.js'

import {
  obtenerConfiguracionPorVehiculo,
  calcularEstadoMantenimiento
} from '../services/mantenimientoService.js'

import {
  obtenerHistorialServicios,
  obtenerDetalleServicio
} from '../services/servicioService.js'

/* ============================================================
   ESTADO GENERAL
============================================================ */

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

const clientes = ref([])
const mechanicDataWarning = ref('')

const clienteVehiculos = ref([])
const clienteCitas = ref([])
const clienteAlertas = ref([])
const clienteTransmisiones = ref([])

const loading = ref(false)
const loadingVehicles = ref(false)
const loadingClientRecord = ref(false)

const saving = ref(false)

const processingConfirmation =
  ref(false)

const successMessage = ref('')
const errorMessage = ref('')

const search = ref('')
const statusFilter = ref('')

const showFormModal = ref(false)
const showViewModal = ref(false)

const editing = ref(false)
const showPassword = ref(false)

const selectedCliente = ref(null)

const activeClientTab =
  ref('datos')

/* ============================================================
   EXPEDIENTE TÉCNICO DEL VEHÍCULO
============================================================ */

const selectedVehicle =
  ref(null)

const activeVehicleTab =
  ref('informacion')

const loadingVehicleRecord =
  ref(false)

const vehicleMaintenance =
  ref(null)

const vehicleMaintenanceStatus =
  ref(null)

const vehicleServices =
  ref([])

const vehicleServiceDetails =
  ref([])

/* ============================================================
   ÚLTIMA INSPECCIÓN DE LLANTAS
============================================================ */

const latestTireInspection =
  computed(() => {
    return (
      vehicleServiceDetails.value.find(
        detalle =>
          Array.isArray(
            detalle.llantas
          ) &&
          detalle.llantas.length > 0
      ) ||
      null
    )
  })

const latestVehicleTires =
  computed(() => {
    return (
      latestTireInspection.value
        ?.llantas ||
      []
    )
  })

const latestTireInspectionDate =
  computed(() => {
    return (
      latestTireInspection.value
        ?.servicio
        ?.fecha_servicio ||
      null
    )
  })

/* ============================================================
   FORMULARIO
============================================================ */

const getEmptyForm = () => ({
  id_cliente: null,
  id_usuario: null,

  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',

  correo: '',
  telefono: '',
  direccion: '',

  contrasenia: '',

  estatus: ''
})

const form = ref(
  getEmptyForm()
)

/* ============================================================
   CONFIRMACIÓN
============================================================ */

const confirmation = ref({
  visible: false,

  type: 'save',

  title: '',

  message: '',

  confirmText:
    'Confirmar',

  item: null,

  action: null
})

/* ============================================================
   COMPUTADOS
============================================================ */

const totalActivos =
  computed(() => {
    return clientes.value.filter(
      item =>
        String(
          item.usuario?.estatus ||
          ''
        )
          .trim()
          .toLowerCase() ===
        'activo'
    ).length
  })

const totalInactivos =
  computed(() => {
    return clientes.value.filter(
      item =>
        String(
          item.usuario?.estatus ||
          ''
        )
          .trim()
          .toLowerCase() ===
        'inactivo'
    ).length
  })

const filteredClientes =
  computed(() => {
    const text =
      normalizeText(
        search.value
      )

    const estado =
      String(
        statusFilter.value ||
        ''
      )
        .trim()
        .toLowerCase()

    return clientes.value.filter(
      item => {
        const searchable =
          normalizeText(
            [
              getFullName(item),

              item.usuario?.correo,

              item.usuario?.telefono,

              item.direccion
            ]
              .filter(Boolean)
              .join(' ')
          )

        const itemStatus =
          String(
            item.usuario?.estatus ||
            'Activo'
          )
            .trim()
            .toLowerCase()

        const matchesSearch =
          !text ||
          searchable.includes(
            text
          )

        const matchesStatus =
          !estado ||
          itemStatus === estado

        return (
          matchesSearch &&
          matchesStatus
        )
      }
    )
  })

/* ============================================================
   WATCHERS
============================================================ */

watch(
  successMessage,

  value => {
    if (!value) {
      return
    }

    window.setTimeout(
      () => {
        if (
          successMessage.value ===
          value
        ) {
          successMessage.value =
            ''
        }
      },

      4500
    )
  }
)

watch(
  errorMessage,

  value => {
    if (!value) {
      return
    }

    window.setTimeout(
      () => {
        if (
          errorMessage.value ===
          value
        ) {
          errorMessage.value =
            ''
        }
      },

      6500
    )
  }
)

/* ============================================================
   CARGAR CLIENTES
============================================================ */

const loadClientes =
  async () => {
    loading.value = true

    errorMessage.value = ''
    mechanicDataWarning.value = ''

    try {
      if (
        props.mechanicMode &&
        (
          props.mechanicId === null ||
          props.mechanicId === undefined ||
          props.mechanicId === ''
        )
      ) {
        throw new Error(
          'No se recibió el identificador del mecánico con sesión iniciada.'
        )
      }

      const result = props.mechanicMode
        ? await obtenerClientesMecanico(props.mechanicId)
        : await obtenerClientes()

      if (props.mechanicMode) {
        clientes.value = result.clientes

        if (result.vehiculosAsignados === 0) {
          mechanicDataWarning.value =
            'No hay vehículos asignados a tu cuenta. El administrador debe asignarte un vehículo para que sus clientes aparezcan aquí.'
        } else if (
          result.clientes.length === 0 &&
          result.vehiculosSinCliente === result.vehiculosAsignados
        ) {
          mechanicDataWarning.value =
            'Tienes vehículos asignados, pero no tienen un cliente seleccionado. Asigna el cliente dueño a cada vehículo para que aparezca en el directorio.'
        } else if (result.perfilesIncompletos > 0) {
          mechanicDataWarning.value =
            `${result.perfilesIncompletos} cliente(s) relacionado(s) con tus vehículos no tienen un perfil de usuario completo y se omitieron del directorio.`
        }
      } else {
        clientes.value = Array.isArray(result) ? result : []
      }
    } catch (error) {
      console.error(
        'Error cargando clientes:',
        error
      )

      errorMessage.value =
        getErrorMessage(
          error,

          'No fue posible cargar los clientes.'
        )
    } finally {
      loading.value = false
    }
  }

watch(
  () => [props.mechanicMode, props.mechanicId],
  ([isMechanicMode, mechanicId], [wasMechanicMode, previousMechanicId]) => {
    if (
      isMechanicMode &&
      (
        !wasMechanicMode ||
        mechanicId !== previousMechanicId
      )
    ) {
      loadClientes()
    }
  }
)

/* ============================================================
   ABRIR NUEVO CLIENTE
============================================================ */

const openNewModal = () => {
  editing.value = false

  selectedCliente.value =
    null

  form.value =
    getEmptyForm()

  showPassword.value =
    false

  errorMessage.value =
    ''

  showFormModal.value =
    true
}

/* ============================================================
   EDITAR CLIENTE
============================================================ */

const openEditModal =
  item => {
    if (!item) {
      return
    }

    editing.value = true

    selectedCliente.value =
      item

    form.value = {
      id_cliente:
        item.id_cliente ??
        null,

      id_usuario:
        item.id_usuario ??
        item.usuario?.id_usuario ??
        null,

      nombre:
        item.usuario?.nombre ||
        '',

      apellido_paterno:
        item.usuario?.apellido_paterno ||
        '',

      apellido_materno:
        item.usuario?.apellido_materno ||
        '',

      correo:
        item.usuario?.correo ||
        '',

      telefono:
        item.usuario?.telefono ||
        '',

      direccion:
        item.direccion ||
        '',

      contrasenia: '',

      estatus:
        item.usuario?.estatus ||
        'Activo'
    }

    showPassword.value =
      false

    errorMessage.value =
      ''

    showFormModal.value =
      true
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

  showPassword.value =
    false

  form.value =
    getEmptyForm()
}

/* ============================================================
   VALIDAR FORMULARIO
============================================================ */

const validateForm = () => {
  const nombre =
    String(
      form.value.nombre ||
      ''
    ).trim()

  const paterno =
    String(
      form.value.apellido_paterno ||
      ''
    ).trim()

  const correo =
    String(
      form.value.correo ||
      ''
    )
      .trim()
      .toLowerCase()

  const password =
    String(
      form.value.contrasenia ||
      ''
    )

  const apellidoMaterno =
    String(
      form.value.apellido_materno ||
      ''
    ).trim()

  const telefono =
    String(
      form.value.telefono ||
      ''
    ).trim()

  const direccion =
    String(
      form.value.direccion ||
      ''
    ).trim()

  if (!nombre) {
    throw new Error(
      'El nombre es obligatorio.'
    )
  }

  if (!paterno) {
    throw new Error(
      'El apellido paterno es obligatorio.'
    )
  }

  if (!editing.value && !apellidoMaterno) {
    throw new Error(
      'El apellido materno es obligatorio.'
    )
  }

  if (!editing.value && !telefono) {
    throw new Error(
      'El teléfono es obligatorio.'
    )
  }

  if (!editing.value && !direccion) {
    throw new Error(
      'La dirección es obligatoria.'
    )
  }

  if (!correo) {
    throw new Error(
      'El correo electrónico es obligatorio.'
    )
  }

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (
    !emailRegex.test(correo)
  ) {
    throw new Error(
      'Ingresa un correo electrónico válido.'
    )
  }

  if (
    !editing.value &&
    password.length < 6
  ) {
    throw new Error(
      'La contraseña debe tener al menos 6 caracteres.'
    )
  }

  if (
    form.value.estatus !== 'Activo' &&
    form.value.estatus !== 'Inactivo'
  ) {
    throw new Error(
      'Selecciona el estado del cliente.'
    )
  }

  return true
}

/* ============================================================
   SOLICITAR GUARDADO
============================================================ */

const requestSave = () => {
  errorMessage.value = ''

  try {
    validateForm()

    confirmation.value = {
      visible: true,

      type: 'save',

      title:
        editing.value
          ? 'Actualizar cliente'
          : 'Registrar cliente',

      message:
        editing.value
          ? '¿Deseas guardar los cambios realizados en este cliente?'
          : '¿Deseas registrar este nuevo cliente?',

      confirmText:
        editing.value
          ? 'Actualizar'
          : 'Registrar',

      item:
        editing.value
          ? selectedCliente.value
          : null,

      action:
        saveCliente
    }
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,

        'Verifica los datos del formulario.'
      )
  }
}

/* ============================================================
   GUARDAR CLIENTE
============================================================ */

const saveCliente =
  async () => {
    saving.value = true

    errorMessage.value = ''

    try {
      const payload = {
        nombre:
          String(
            form.value.nombre ||
            ''
          ).trim(),

        apellido_paterno:
          String(
            form.value.apellido_paterno ||
            ''
          ).trim(),

        apellido_materno:
          String(
            form.value.apellido_materno ||
            ''
          ).trim(),

        correo:
          String(
            form.value.correo ||
            ''
          )
            .trim()
            .toLowerCase(),

        telefono:
          String(
            form.value.telefono ||
            ''
          ).trim(),

        direccion:
          String(
            form.value.direccion ||
            ''
          ).trim(),

        estatus:
          form.value.estatus ||
          'Activo'
      }

      if (editing.value) {
        await actualizarCliente(
          form.value.id_cliente,
          payload,
          { mechanicMode: props.mechanicMode }
        )

        successMessage.value =
          'Cliente actualizado correctamente.'
      } else {
        payload.contrasenia =
          form.value.contrasenia

        if (props.mechanicMode) {
          await registrarClienteMecanico(
            payload,
            props.mechanicId
          )

          successMessage.value =
            'Cliente registrado y asignado correctamente. Se generó la alerta para los administradores; el correo se procesa en segundo plano cuando está configurado.'
        } else {
          await registrarCliente(payload)

          successMessage.value =
            'Cliente registrado correctamente.'
        }
      }

      showFormModal.value =
        false

      form.value =
        getEmptyForm()

      await loadClientes()
    } catch (error) {
      console.error(
        'Error guardando cliente:',
        error
      )

      errorMessage.value =
        getErrorMessage(
          error,

          editing.value
            ? 'No fue posible actualizar el cliente.'
            : 'No fue posible registrar el cliente.'
        )

      throw error
    } finally {
      saving.value = false
    }
  }

/* ============================================================
   SOLICITAR CAMBIO DE ESTADO
============================================================ */

const requestStatusChange =
  item => {
    if (!item) {
      return
    }

    const activo =
      isActive(item)

    const nuevoEstado =
      activo
        ? 'Inactivo'
        : 'Activo'

    confirmation.value = {
      visible: true,

      type: 'status',

      title:
        activo
          ? 'Desactivar cliente'
          : 'Activar cliente',

      message:
        activo
          ? 'El cliente dejará de aparecer como activo. ¿Deseas continuar?'
          : 'El cliente volverá a quedar activo. ¿Deseas continuar?',

      confirmText:
        activo
          ? 'Desactivar'
          : 'Activar',

      item,

      action:
        async () => {
          await cambiarEstadoCliente(
            item.id_cliente,
            nuevoEstado,
            { mechanicMode: props.mechanicMode }
          )

          successMessage.value =
            `Cliente ${nuevoEstado.toLowerCase()} correctamente.`

          await loadClientes()
        }
    }
  }

/* ============================================================
   SOLICITAR ELIMINACIÓN
============================================================ */

const requestDelete =
  item => {
    if (!item) {
      return
    }

    confirmation.value = {
      visible: true,

      type: 'delete',

      title:
        'Eliminar cliente',

      message:
        'Esta acción eliminará el registro del cliente. ¿Deseas continuar?',

      confirmText:
        'Eliminar',

      item,

      action:
        async () => {
          await eliminarCliente(
            item.id_cliente,
            { mechanicMode: props.mechanicMode }
          )

          successMessage.value =
            'Cliente eliminado correctamente.'

          await loadClientes()
        }
    }
  }

/* ============================================================
   EJECUTAR CONFIRMACIÓN
============================================================ */

const executeConfirmation =
  async () => {
    if (
      processingConfirmation.value
    ) {
      return
    }

    const action =
      confirmation.value.action

    if (
      typeof action !==
      'function'
    ) {
      closeConfirmation()

      return
    }

    processingConfirmation.value =
      true

    try {
      await action()

      processingConfirmation.value =
        false

      closeConfirmation()
    } catch (error) {
      console.error(
        'Error ejecutando confirmación:',
        error
      )

      if (
        !errorMessage.value
      ) {
        errorMessage.value =
          getErrorMessage(
            error,

            'No fue posible completar la operación.'
          )
      }
    } finally {
      processingConfirmation.value =
        false
    }
  }

/* ============================================================
   CERRAR CONFIRMACIÓN
============================================================ */

const closeConfirmation = () => {
  if (
    processingConfirmation.value
  ) {
    return
  }

  confirmation.value = {
    visible: false,

    type: 'save',

    title: '',

    message: '',

    confirmText:
      'Confirmar',

    item: null,

    action: null
  }
}

/* ============================================================
   RESETEAR EXPEDIENTE DEL VEHÍCULO
============================================================ */

const resetVehicleRecord = () => {
  selectedVehicle.value =
    null

  activeVehicleTab.value =
    'informacion'

  loadingVehicleRecord.value =
    false

  vehicleMaintenance.value =
    null

  vehicleMaintenanceStatus.value =
    null

  vehicleServices.value =
    []

  vehicleServiceDetails.value =
    []
}

/* ============================================================
   RESETEAR EXPEDIENTE DEL CLIENTE
============================================================ */

const resetClientRecord = () => {
  activeClientTab.value =
    'datos'

  clienteVehiculos.value =
    []

  clienteCitas.value =
    []

  clienteAlertas.value =
    []

  clienteTransmisiones.value =
    []

  resetVehicleRecord()
}

/* ============================================================
   ABRIR EXPEDIENTE DEL CLIENTE
============================================================ */

const openViewModal =
  async item => {
    if (!item) {
      return
    }

    selectedCliente.value =
      item

    resetClientRecord()

    showViewModal.value =
      true

    loadingClientRecord.value =
      true

    errorMessage.value =
      ''

    try {
      const idCliente =
        item.id_cliente

      const idUsuario =
        item.id_usuario ??
        item.usuario?.id_usuario ??
        null

      const [
        vehiculosResult,
        citasResult,
        alertasResult,
        transmisionesResult
      ] =
        await Promise.allSettled([
          obtenerVehiculosCliente(
            idCliente
          ),

          obtenerCitas(),

          idUsuario
            ? obtenerAlertasCliente(
                idUsuario
              )
            : Promise.resolve([]),

          obtenerRegistrosTransmisionCliente(
            idCliente
          )
        ])

      /* ======================================================
         VEHÍCULOS
      ====================================================== */

      if (
        vehiculosResult.status ===
        'fulfilled'
      ) {
        clienteVehiculos.value =
          Array.isArray(
            vehiculosResult.value
          )
            ? vehiculosResult.value
            : []
      } else {
        console.error(
          'Error cargando vehículos:',
          vehiculosResult.reason
        )

        clienteVehiculos.value =
          []
      }

      /* ======================================================
         CITAS
      ====================================================== */

      if (
        citasResult.status ===
        'fulfilled'
      ) {
        const citas =
          Array.isArray(
            citasResult.value
          )
            ? citasResult.value
            : []

        clienteCitas.value =
          citas.filter(
            cita =>
              Number(
                cita.id_cliente ??
                cita.cliente?.id_cliente
              ) ===
              Number(
                idCliente
              )
          )
      } else {
        console.error(
          'Error cargando citas:',
          citasResult.reason
        )

        clienteCitas.value =
          []
      }

      /* ======================================================
         ALERTAS
      ====================================================== */

      if (
        alertasResult.status ===
        'fulfilled'
      ) {
        clienteAlertas.value =
          Array.isArray(
            alertasResult.value
          )
            ? alertasResult.value
            : []
      } else {
        console.error(
          'Error cargando alertas:',
          alertasResult.reason
        )

        clienteAlertas.value =
          []
      }

      /* ======================================================
         TRANSMISIÓN
      ====================================================== */

      if (
        transmisionesResult.status ===
        'fulfilled'
      ) {
        clienteTransmisiones.value =
          Array.isArray(
            transmisionesResult.value
          )
            ? transmisionesResult.value
            : []
      } else {
        console.error(
          'Error cargando transmisión:',
          transmisionesResult.reason
        )

        clienteTransmisiones.value =
          []
      }
    } catch (error) {
      console.error(
        'Error cargando expediente:',
        error
      )

      errorMessage.value =
        getErrorMessage(
          error,

          'No fue posible cargar toda la información del cliente.'
        )
    } finally {
      loadingClientRecord.value =
        false
    }
  }

/* ============================================================
   CERRAR EXPEDIENTE DEL CLIENTE
============================================================ */

const closeViewModal = () => {
  showViewModal.value =
    false

  selectedCliente.value =
    null

  resetClientRecord()
}

/* ============================================================
   EDITAR DESDE EXPEDIENTE
============================================================ */

const editFromView = () => {
  if (
    !selectedCliente.value
  ) {
    return
  }

  const item =
    selectedCliente.value

  closeViewModal()

  openEditModal(item)
}

/* ============================================================
   ABRIR EXPEDIENTE TÉCNICO DEL VEHÍCULO
============================================================ */

const openVehicleRecord =
  async vehiculo => {
    if (!vehiculo) {
      return
    }

    selectedVehicle.value =
      vehiculo

    activeVehicleTab.value =
      'informacion'

    loadingVehicleRecord.value =
      true

    vehicleMaintenance.value =
      null

    vehicleMaintenanceStatus.value =
      null

    vehicleServices.value =
      []

    vehicleServiceDetails.value =
      []

    errorMessage.value =
      ''

    try {
      const [
        mantenimientoResult,
        serviciosResult
      ] =
        await Promise.allSettled([
          obtenerConfiguracionPorVehiculo(
            vehiculo.id_vehiculo
          ),

          obtenerHistorialServicios()
        ])

      /* ======================================================
         MANTENIMIENTO
      ====================================================== */

      if (
        mantenimientoResult.status ===
        'fulfilled'
      ) {
        vehicleMaintenance.value =
          mantenimientoResult.value ||
          null

        if (
          vehicleMaintenance.value
        ) {
          vehicleMaintenanceStatus.value =
            calcularEstadoMantenimiento({
              kilometrajeActual:
                Number(
                  vehiculo.kilometraje_actual ||
                  0
                ),

              proximoServicio:
                Number(
                  vehicleMaintenance.value
                    .proximo_servicio ||
                  0
                )
            })
        }
      } else {
        console.error(
          'Error cargando mantenimiento del vehículo:',
          mantenimientoResult.reason
        )
      }

      /* ======================================================
         SERVICIOS
      ====================================================== */

      if (
        serviciosResult.status ===
        'fulfilled'
      ) {
        const servicios =
          Array.isArray(
            serviciosResult.value
          )
            ? serviciosResult.value
            : []

        vehicleServices.value =
          servicios.filter(
            servicio =>
              Number(
                servicio.id_vehiculo
              ) ===
              Number(
                vehiculo.id_vehiculo
              )
          )

        const resultadosDetalle =
          await Promise.allSettled(
            vehicleServices.value.map(
              servicio =>
                obtenerDetalleServicio(
                  servicio.id_servicio
                )
            )
          )

        vehicleServiceDetails.value =
          resultadosDetalle
            .filter(
              resultado =>
                resultado.status ===
                  'fulfilled' &&
                resultado.value
                  ?.servicio
            )
            .map(
              resultado =>
                resultado.value
            )
      } else {
        console.error(
          'Error cargando servicios del vehículo:',
          serviciosResult.reason
        )

        vehicleServices.value =
          []

        vehicleServiceDetails.value =
          []
      }
    } catch (error) {
      console.error(
        'Error cargando expediente técnico del vehículo:',
        error
      )

      errorMessage.value =
        getErrorMessage(
          error,

          'No fue posible cargar el expediente técnico del vehículo.'
        )
    } finally {
      loadingVehicleRecord.value =
        false
    }
  }

/* ============================================================
   VOLVER AL LISTADO DE VEHÍCULOS
============================================================ */

const closeVehicleRecord = () => {
  resetVehicleRecord()

  activeClientTab.value =
    'vehiculos'
}
/* ============================================================
   NORMALIZAR TEXTO
============================================================ */

const normalizeText = value => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

/* ============================================================
   NOMBRE COMPLETO DEL CLIENTE
============================================================ */

const getFullName = item => {
  if (!item) {
    return 'Sin nombre'
  }

  const usuario =
    item.usuario || item

  const nombre =
    usuario.nombre || ''

  const paterno =
    usuario.apellido_paterno || ''

  const materno =
    usuario.apellido_materno || ''

  const nombreCompleto =
    [
      nombre,
      paterno,
      materno
    ]
      .filter(Boolean)
      .join(' ')
      .trim()

  return (
    nombreCompleto ||
    'Sin nombre'
  )
}

/* ============================================================
   INICIALES DEL CLIENTE
============================================================ */

const getInitials = item => {
  if (!item) {
    return 'CL'
  }

  const usuario =
    item.usuario || item

  const nombre =
    String(
      usuario.nombre || ''
    ).trim()

  const apellido =
    String(
      usuario.apellido_paterno || ''
    ).trim()

  const inicialNombre =
    nombre
      ? nombre.charAt(0)
      : ''

  const inicialApellido =
    apellido
      ? apellido.charAt(0)
      : ''

  const initials =
    `${inicialNombre}${inicialApellido}`
      .toUpperCase()

  return initials || 'CL'
}

/* ============================================================
   ESTADO DEL CLIENTE
============================================================ */

const isActive = item => {
  const estado =
    String(
      item?.usuario?.estatus ||
      item?.estatus ||
      ''
    )
      .trim()
      .toLowerCase()

  return estado === 'activo'
}

/* ============================================================
   FORMATO DE FECHA
============================================================ */

const formatDate = value => {
  if (!value) {
    return 'No registrada'
  }

  try {
    const date =
      new Date(value)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value)
    }

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(date)
  } catch {
    return String(value)
  }
}

/* ============================================================
   FORMATO DE FECHA SIN HORA
============================================================ */

const formatDateOnly = value => {
  if (!value) {
    return 'No registrada'
  }

  try {
    /*
      Cuando Supabase devuelve una fecha YYYY-MM-DD,
      se procesa manualmente para evitar que UTC cambie
      el día mostrado en México.
    */
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(
        value
      )
    ) {
      const [
        year,
        month,
        day
      ] =
        value
          .split('-')
          .map(Number)

      const date =
        new Date(
          year,
          month - 1,
          day
        )

      return new Intl.DateTimeFormat(
        'es-MX',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      ).format(date)
    }

    const date =
      new Date(value)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value)
    }

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    ).format(date)
  } catch {
    return String(value)
  }
}

/* ============================================================
   FORMATO DE HORA
============================================================ */

const formatTime = value => {
  if (!value) {
    return 'Sin hora'
  }

  const hora =
    String(value)
      .trim()

  const match =
    hora.match(
      /^(\d{1,2}):(\d{2})/
    )

  if (!match) {
    return hora
  }

  const hours =
    Number(match[1])

  const minutes =
    match[2]

  if (
    Number.isNaN(hours)
  ) {
    return hora
  }

  const period =
    hours >= 12
      ? 'p. m.'
      : 'a. m.'

  const formattedHour =
    hours % 12 || 12

  return `${formattedHour}:${minutes} ${period}`
}

/* ============================================================
   FORMATO DE KILOMETRAJE
============================================================ */

const formatMileage = value => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'No registrado'
  }

  const number =
    Number(value)

  if (
    Number.isNaN(number)
  ) {
    return `${value} km`
  }

  return `${new Intl.NumberFormat(
    'es-MX'
  ).format(number)} km`
}

/* ============================================================
   ICONO DEL VEHÍCULO
============================================================ */

const getVehicleIcon = tipo => {
  const value =
    normalizeText(tipo)

  if (
    value.includes('moto')
  ) {
    return 'bi bi-bicycle'
  }

  if (
    value.includes('camion') ||
    value.includes('trailer') ||
    value.includes('tracto')
  ) {
    return 'bi bi-truck'
  }

  if (
    value.includes('pickup') ||
    value.includes('camioneta')
  ) {
    return 'bi bi-truck-front'
  }

  if (
    value.includes('autobus') ||
    value.includes('bus')
  ) {
    return 'bi bi-bus-front'
  }

  return 'bi bi-car-front-fill'
}

/* ============================================================
   CLASE DEL ESTADO DEL VEHÍCULO
============================================================ */

const getVehicleStatusClass =
  estado => {
    const value =
      normalizeText(estado)

    if (
      value === 'activo' ||
      value === 'activa'
    ) {
      return 'active'
    }

    if (
      value === 'inactivo' ||
      value === 'inactiva'
    ) {
      return 'inactive'
    }

    if (
      value.includes(
        'mantenimiento'
      )
    ) {
      return 'warning'
    }

    return 'inactive'
  }

/* ============================================================
   VEHÍCULO DE UNA CITA
============================================================ */

const getAppointmentVehicle =
  cita => {
    if (!cita) {
      return 'Vehículo no registrado'
    }

    const vehiculo =
      cita.vehiculo ||
      clienteVehiculos.value.find(
        item =>
          Number(
            item.id_vehiculo
          ) ===
          Number(
            cita.id_vehiculo
          )
      )

    if (!vehiculo) {
      return cita.id_vehiculo
        ? `Vehículo n.º ${cita.id_vehiculo}`
        : 'Vehículo no registrado'
    }

    const marca =
      vehiculo.marca || ''

    const modelo =
      vehiculo.modelo || ''

    const placas =
      vehiculo.placas || ''

    const descripcion =
      [
        marca,
        modelo
      ]
        .filter(Boolean)
        .join(' ')
        .trim()

    if (
      descripcion &&
      placas
    ) {
      return `${descripcion} · ${placas}`
    }

    return (
      descripcion ||
      placas ||
      `Vehículo n.º ${vehiculo.id_vehiculo}`
    )
  }

/* ============================================================
   NOMBRE DEL MECÁNICO
============================================================ */

const getMechanicName =
  mecanico => {
    if (!mecanico) {
      return 'No asignado'
    }

    const usuario =
      mecanico.usuario ||
      mecanico

    const nombre =
      [
        usuario.nombre,
        usuario.apellido_paterno,
        usuario.apellido_materno
      ]
        .filter(Boolean)
        .join(' ')
        .trim()

    return (
      nombre ||
      'No asignado'
    )
  }

/* ============================================================
   ESTADO DE CITA
============================================================ */

const formatAppointmentStatus =
  estado => {
    const value =
      String(
        estado || ''
      )
        .trim()
        .toUpperCase()

    const statuses = {
      PROXIMA:
        'Próxima',

      EN_ATENCION:
        'En atención',

      ATENDIDA:
        'Atendida',

      VENCIDA:
        'Vencida',

      CANCELADA:
        'Cancelada'
    }

    return (
      statuses[value] ||
      estado ||
      'Sin estado'
    )
  }

const getAppointmentStatusClass =
  estado => {
    const value =
      String(
        estado || ''
      )
        .trim()
        .toUpperCase()

    if (
      value === 'PROXIMA'
    ) {
      return 'upcoming'
    }

    if (
      value === 'EN_ATENCION'
    ) {
      return 'attention'
    }

    if (
      value === 'ATENDIDA'
    ) {
      return 'completed'
    }

    if (
      value === 'VENCIDA'
    ) {
      return 'expired'
    }

    if (
      value === 'CANCELADA'
    ) {
      return 'cancelled'
    }

    return 'neutral'
  }

/* ============================================================
   ALERTAS
============================================================ */

const formatAlertType =
  tipo => {
    if (!tipo) {
      return 'Alerta'
    }

    const value =
      String(tipo)
        .replace(/_/g, ' ')
        .trim()
        .toLowerCase()

    return (
      value.charAt(0).toUpperCase() +
      value.slice(1)
    )
  }

const formatAlertLevel =
  nivel => {
    if (!nivel) {
      return 'Sin nivel'
    }

    const value =
      normalizeText(nivel)

    const levels = {
      bajo: 'Bajo',
      baja: 'Bajo',
      medio: 'Medio',
      media: 'Medio',
      advertencia: 'Advertencia',
      alto: 'Alto',
      alta: 'Alto',
      urgente: 'Urgente',
      critico: 'Crítico',
      critica: 'Crítico'
    }

    return (
      levels[value] ||
      String(nivel)
    )
  }

const getAlertLevelClass =
  nivel => {
    const value =
      normalizeText(nivel)

    if (
      value === 'bajo' ||
      value === 'baja'
    ) {
      return 'low'
    }

    if (
      value === 'medio' ||
      value === 'media' ||
      value === 'advertencia'
    ) {
      return 'medium'
    }

    if (
      value === 'alto' ||
      value === 'alta'
    ) {
      return 'high'
    }

    if (
      value === 'urgente' ||
      value === 'critico' ||
      value === 'critica'
    ) {
      return 'critical'
    }

    return 'neutral'
  }

const getAlertIcon =
  tipo => {
    const value =
      normalizeText(tipo)

    if (
      value.includes(
        'mantenimiento'
      ) ||
      value.includes(
        'servicio'
      )
    ) {
      return 'bi bi-tools'
    }

    if (
      value.includes(
        'llanta'
      ) ||
      value.includes(
        'neumatic'
      )
    ) {
      return 'bi bi-circle'
    }

    if (
      value.includes(
        'aceite'
      )
    ) {
      return 'bi bi-droplet-fill'
    }

    if (
      value.includes(
        'transmision'
      )
    ) {
      return 'bi bi-gear-wide-connected'
    }

    return 'bi bi-bell-fill'
  }

const formatAlertStatus =
  estado => {
    if (!estado) {
      return 'Sin estado'
    }

    const value =
      normalizeText(estado)

    const statuses = {
      pendiente:
        'Pendiente',

      leida:
        'Leída',

      leido:
        'Leída',

      atendida:
        'Atendida',

      atendido:
        'Atendida',

      activa:
        'Activa',

      activo:
        'Activa'
    }

    return (
      statuses[value] ||
      String(estado)
    )
  }

const getAlertStatusClass =
  estado => {
    const value =
      normalizeText(estado)

    if (
      value === 'pendiente'
    ) {
      return 'pending'
    }

    if (
      value === 'leida' ||
      value === 'leido'
    ) {
      return 'read'
    }

    if (
      value === 'atendida' ||
      value === 'atendido'
    ) {
      return 'completed'
    }

    if (
      value === 'activa' ||
      value === 'activo'
    ) {
      return 'active'
    }

    return 'neutral'
  }

/* ============================================================
   VEHÍCULO DE UNA ALERTA
============================================================ */

const getAlertVehicle =
  alerta => {
    if (!alerta) {
      return 'Vehículo no identificado'
    }

    const vehiculo =
      alerta.vehiculo ||
      clienteVehiculos.value.find(
        item =>
          Number(
            item.id_vehiculo
          ) ===
          Number(
            alerta.id_vehiculo
          )
      )

    if (!vehiculo) {
      return alerta.id_vehiculo
        ? `Vehículo n.º ${alerta.id_vehiculo}`
        : 'Vehículo no identificado'
    }

    const descripcion =
      [
        vehiculo.marca,
        vehiculo.modelo
      ]
        .filter(Boolean)
        .join(' ')
        .trim()

    if (
      descripcion &&
      vehiculo.placas
    ) {
      return `${descripcion} · ${vehiculo.placas}`
    }

    return (
      descripcion ||
      vehiculo.placas ||
      `Vehículo n.º ${vehiculo.id_vehiculo}`
    )
  }

/* ============================================================
   SÍNTOMAS DE TRANSMISIÓN
============================================================ */

const normalizeSymptoms =
  sintomas => {
    if (
      Array.isArray(sintomas)
    ) {
      return sintomas
        .map(
          item =>
            String(item || '')
              .trim()
        )
        .filter(Boolean)
    }

    if (!sintomas) {
      return []
    }

    if (
      typeof sintomas ===
      'string'
    ) {
      const value =
        sintomas.trim()

      if (!value) {
        return []
      }

      /*
        Por si el arreglo llega serializado
        como texto desde alguna consulta.
      */
      if (
        value.startsWith('[') &&
        value.endsWith(']')
      ) {
        try {
          const parsed =
            JSON.parse(value)

          if (
            Array.isArray(parsed)
          ) {
            return parsed
              .map(
                item =>
                  String(
                    item || ''
                  ).trim()
              )
              .filter(Boolean)
          }
        } catch {
          // Continúa con separación normal.
        }
      }

      return value
        .split(',')
        .map(
          item =>
            item.trim()
        )
        .filter(Boolean)
    }

    return []
  }

/* ============================================================
   VEHÍCULO DEL REPORTE DE TRANSMISIÓN
============================================================ */

const getTransmissionVehicle =
  registro => {
    if (!registro) {
      return 'Vehículo no identificado'
    }

    const vehiculo =
      registro.vehiculo ||
      clienteVehiculos.value.find(
        item =>
          Number(
            item.id_vehiculo
          ) ===
          Number(
            registro.id_vehiculo
          )
      )

    if (!vehiculo) {
      return registro.id_vehiculo
        ? `Vehículo n.º ${registro.id_vehiculo}`
        : 'Vehículo no identificado'
    }

    const descripcion =
      [
        vehiculo.marca,
        vehiculo.modelo
      ]
        .filter(Boolean)
        .join(' ')
        .trim()

    if (
      descripcion &&
      vehiculo.placas
    ) {
      return `${descripcion} · ${vehiculo.placas}`
    }

    return (
      descripcion ||
      vehiculo.placas ||
      `Vehículo n.º ${vehiculo.id_vehiculo}`
    )
  }

/* ============================================================
   ESTADO DEL REPORTE DE TRANSMISIÓN
============================================================ */

const formatTransmissionStatus =
  estado => {
    const value =
      String(
        estado || ''
      )
        .trim()
        .toUpperCase()

    const statuses = {
      PENDIENTE:
        'Pendiente',

      REVISADO:
        'Revisado',

      ATENDIDO:
        'Atendido'
    }

    return (
      statuses[value] ||
      estado ||
      'Sin estado'
    )
  }

const getTransmissionStatusClass =
  estado => {
    const value =
      String(
        estado || ''
      )
        .trim()
        .toUpperCase()

    if (
      value === 'PENDIENTE'
    ) {
      return 'pending'
    }

    if (
      value === 'REVISADO'
    ) {
      return 'reviewed'
    }

    if (
      value === 'ATENDIDO'
    ) {
      return 'completed'
    }

    return 'neutral'
  }

/* ============================================================
   ESTADO DEL MANTENIMIENTO
============================================================ */

const getMaintenanceStatusClass =
  estado => {
    const value =
      normalizeText(estado)

    if (
      value.includes('venc') ||
      value.includes('crit') ||
      value.includes('atras')
    ) {
      return 'danger'
    }

    if (
      value.includes('proximo') ||
      value.includes('prevent') ||
      value.includes('advert') ||
      value.includes('cerca')
    ) {
      return 'warning'
    }

    if (
      value.includes('vigente') ||
      value.includes('correct') ||
      value.includes('normal') ||
      value.includes('bien')
    ) {
      return 'success'
    }

    return 'neutral'
  }

const getMaintenanceIcon =
  estado => {
    const cssClass =
      getMaintenanceStatusClass(
        estado
      )

    if (
      cssClass === 'danger'
    ) {
      return 'bi bi-exclamation-triangle-fill'
    }

    if (
      cssClass === 'warning'
    ) {
      return 'bi bi-exclamation-circle-fill'
    }

    if (
      cssClass === 'success'
    ) {
      return 'bi bi-check-circle-fill'
    }

    return 'bi bi-speedometer2'
  }

const formatMaintenanceStatus =
  estado => {
    if (!estado) {
      return 'Sin información'
    }

    const value =
      String(estado)
        .replace(/_/g, ' ')
        .trim()
        .toLowerCase()

    return (
      value.charAt(0).toUpperCase() +
      value.slice(1)
    )
  }

const getMaintenanceMessage =
  estado => {
    const cssClass =
      getMaintenanceStatusClass(
        estado
      )

    if (
      cssClass === 'danger'
    ) {
      return 'El kilometraje indica que el mantenimiento requiere atención.'
    }

    if (
      cssClass === 'warning'
    ) {
      return 'El vehículo se encuentra próximo a su mantenimiento preventivo.'
    }

    if (
      cssClass === 'success'
    ) {
      return 'El mantenimiento preventivo se encuentra dentro del intervalo establecido.'
    }

    return 'Consulta el kilometraje y la configuración de mantenimiento de esta unidad.'
  }

/* ============================================================
   CONDICIÓN DE LLANTAS
============================================================ */

const getTireConditionClass =
  condicion => {
    const value =
      normalizeText(
        condicion
      )

    if (
      value.includes('buena') ||
      value.includes('bueno') ||
      value.includes('normal') ||
      value.includes('optima') ||
      value.includes('excelente')
    ) {
      return 'good'
    }

    if (
      value.includes('regular') ||
      value.includes('media') ||
      value.includes('revision') ||
      value.includes('prevent')
    ) {
      return 'warning'
    }

    if (
      value.includes('mala') ||
      value.includes('malo') ||
      value.includes('critica') ||
      value.includes('cambio') ||
      value.includes('reemplazo')
    ) {
      return 'danger'
    }

    return 'neutral'
  }

/* ============================================================
   ICONO DEL MODAL DE CONFIRMACIÓN
============================================================ */

const getConfirmationIcon =
  () => {
    if (
      confirmation.value.type ===
      'delete'
    ) {
      return 'bi bi-trash3-fill'
    }

    if (
      confirmation.value.type ===
      'status'
    ) {
      return 'bi bi-arrow-repeat'
    }

    return 'bi bi-check-circle-fill'
  }

/* ============================================================
   MENSAJES DE ERROR
============================================================ */

const getErrorMessage = (
  error,
  fallback =
    'Ocurrió un error inesperado.'
) => {
  if (!error) {
    return fallback
  }

  if (
    typeof error === 'string'
  ) {
    return error
  }

  if (
    error.message
  ) {
    return error.message
  }

  if (
    error.error_description
  ) {
    return error.error_description
  }

  if (
    error.details
  ) {
    return error.details
  }

  return fallback
}

/* ============================================================
   CAMBIO DE PESTAÑA DEL CLIENTE
============================================================ */

watch(
  activeClientTab,

  newTab => {
    /*
      Si el administrador sale de la pestaña
      Vehículos, cerramos el expediente técnico
      interno para que al regresar vuelva a
      mostrarse el listado de unidades.
    */
    if (
      newTab !== 'vehiculos' &&
      selectedVehicle.value
    ) {
      resetVehicleRecord()
    }
  }
)

/* ============================================================
   MONTAJE
============================================================ */

onMounted(
  async () => {
    await loadClientes()
  }
)
</script>