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
          Alertas
        </h2>

        <p>
          Consulta observaciones de clientes, alertas del sistema, acciones de mecánicos
          y citas del taller.
        </p>
      </div>


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
    </div>


    <!-- ======================================================
         ESTADÍSTICAS
    ======================================================= -->

    <div class="alert-stats-grid">
      <article class="mini-stat-card">
        <div class="mini-stat-icon blue">
          <i class="bi bi-clock-history"></i>
        </div>

        <div>
          <span>
            Acciones registradas
          </span>

          <strong>
            {{ actividades.length }}
          </strong>
        </div>
      </article>


      <article class="mini-stat-card">
        <div class="mini-stat-icon green">
          <i class="bi bi-calendar-check-fill"></i>
        </div>

        <div>
          <span>
            Próximas
          </span>

          <strong>
            {{ totalProximas }}
          </strong>
        </div>
      </article>


      <article class="mini-stat-card">
        <div class="mini-stat-icon orange">
          <i class="bi bi-tools"></i>
        </div>

        <div>
          <span>
            En atención
          </span>

          <strong>
            {{ totalEnAtencion }}
          </strong>
        </div>
      </article>


      <article class="mini-stat-card">
        <div class="mini-stat-icon red">
          <i class="bi bi-exclamation-triangle-fill"></i>
        </div>

        <div>
          <span>
            Vencidas
          </span>

          <strong>
            {{ totalVencidas }}
          </strong>
        </div>
      </article>
    </div>


    <!-- ======================================================
         ALERTAS DEL SISTEMA
    ======================================================= -->

    <div
      v-if="alertasNoLeidas.length"
      class="system-alerts-strip"
    >
      <div class="system-alerts-title">
        <div>
          <i class="bi bi-bell-fill"></i>

          <div>
            <strong>
              Alertas pendientes
            </strong>

            <span>
              {{ alertasNoLeidas.length }}
              sin leer
            </span>
          </div>
        </div>


        <button
          type="button"
          @click="
            showSystemAlerts =
              !showSystemAlerts
          "
        >
          {{
            showSystemAlerts
              ? 'Ocultar'
              : 'Mostrar'
          }}

          <i
            class="bi"
            :class="
              showSystemAlerts
                ? 'bi-chevron-up'
                : 'bi-chevron-down'
            "
          ></i>
        </button>
      </div>


      <div
        v-if="showSystemAlerts"
        class="system-alerts-list"
      >
        <article
          v-for="alerta in alertasNoLeidas"
          :key="alerta.id_alerta"
          class="system-alert-card"
          :class="
            getAlertLevelClass(
              alerta.nivel
            )
          "
        >
          <div class="system-alert-icon">
            <i
              :class="
                getAlertIcon(
                  alerta.nivel
                )
              "
            ></i>
          </div>


          <div class="system-alert-content">
            <div>
              <strong>
                {{
                  (alerta.tipo_alerta === 'REPORTES_MENSUALES_DISPONIBLES'
                    ? 'Reportes mensuales disponibles'
                    : alerta.tipo_alerta) ||
                  'Alerta'
                }}
              </strong>

              <span>
                {{
                  formatAlertDateTime(
                    alerta.fecha_registro ||
                    alerta.fecha_programada
                  )
                }}
              </span>
            </div>


            <p>
              {{
                alerta.mensaje ||
                'Sin descripción'
              }}
            </p>
          </div>


          <button
            class="system-alert-read-button"
            type="button"
            title="Marcar como leída"
            @click="readAlert(alerta)"
          >
            <i class="bi bi-check2"></i>
          </button>
        </article>
      </div>
    </div>


    <!-- ======================================================
         TABS
    ======================================================= -->

    <div class="alert-tabs">
      <button
        class="alert-tab"
        :class="{
          active:
            activeTab === 'observaciones'
        }"
        type="button"
        @click="activeTab = 'observaciones'"
      >
        <i class="bi bi-chat-left-text"></i>

        Observaciones de clientes

        <span>
          {{ observacionesTransmision.length }}
        </span>
      </button>


      <button
        class="alert-tab"
        :class="{
          active:
            activeTab === 'actividad'
        }"
        type="button"
        @click="activeTab = 'actividad'"
      >
        <i class="bi bi-clock-history"></i>

        Acciones del mecánico

        <span>
          {{ actividades.length }}
        </span>
      </button>


      <button
        class="alert-tab"
        :class="{
          active:
            activeTab === 'citas'
        }"
        type="button"
        @click="activeTab = 'citas'"
      >
        <i class="bi bi-calendar2-week"></i>

        Citas

        <span>
          {{ citas.length }}
        </span>
      </button>
    </div>


    <!-- ======================================================
         OBSERVACIONES DE CLIENTES
    ======================================================= -->

    <section
      v-if="activeTab === 'observaciones'"
      class="section-card"
    >
      <div class="alert-stats-grid">
        <article class="mini-stat-card">
          <div class="mini-stat-icon orange">
            <i class="bi bi-hourglass-split"></i>
          </div>

          <div>
            <span>Pendientes</span>
            <strong>{{ totalObservacionesPendientes }}</strong>
          </div>
        </article>

        <article class="mini-stat-card">
          <div class="mini-stat-icon blue">
            <i class="bi bi-eye-fill"></i>
          </div>

          <div>
            <span>Revisadas</span>
            <strong>{{ totalObservacionesRevisadas }}</strong>
          </div>
        </article>

        <article class="mini-stat-card">
          <div class="mini-stat-icon green">
            <i class="bi bi-check-circle-fill"></i>
          </div>

          <div>
            <span>Atendidas</span>
            <strong>{{ totalObservacionesAtendidas }}</strong>
          </div>
        </article>

        <article class="mini-stat-card">
          <div class="mini-stat-icon blue">
            <i class="bi bi-collection-fill"></i>
          </div>

          <div>
            <span>Total</span>
            <strong>{{ totalObservaciones }}</strong>
          </div>
        </article>
      </div>

      <div class="filters-row activity-filters-row">
        <div class="search-box transmission-search-box">
          <i class="bi bi-search"></i>

          <input
            v-model="transmissionSearch"
            type="text"
            placeholder="Buscar cliente, vehículo, placas, síntoma o descripción..."
          />
        </div>

        <select
          v-model="transmissionStatusFilter"
          class="filter-select"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="REVISADO">Revisadas</option>
          <option value="ATENDIDO">Atendidas</option>
        </select>

        <input
          v-model="transmissionDateFilter"
          class="filter-date"
          type="date"
          @click="openNativeDatePicker"
          @focus="openNativeDatePicker"
        />
      </div>

      <div
        v-if="loading"
        class="component-loading"
      >
        <div class="app-spinner"></div>
        <span>Cargando observaciones...</span>
      </div>

      <div
        v-else-if="filteredTransmissionObservations.length"
        class="table-wrapper"
      >
        <table class="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Vehículo</th>
              <th>Fecha</th>
              <th>Síntomas</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th class="actions-column">Detalle</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="observacion in filteredTransmissionObservations"
              :key="observacion.id_registro"
            >
              <td>
                <div class="appointment-person">
                  <strong>
                    {{ getTransmissionClientName(observacion) }}
                  </strong>

                  <small>
                    {{
                      observacion.cliente?.usuario?.telefono ||
                      observacion.cliente?.usuario?.correo ||
                      'Sin contacto'
                    }}
                  </small>
                </div>
              </td>

              <td>
                <div class="appointment-vehicle">
                  <strong>
                    {{ getTransmissionVehicleName(observacion) }}
                  </strong>

                  <small>
                    {{ observacion.vehiculo?.placas || 'Sin placas' }}
                  </small>
                </div>
              </td>

              <td>
                {{ formatDate(observacion.fecha_observacion) }}
              </td>

              <td>
                <div class="transmission-symptom-list">
                  <span
                    v-for="sintoma in observacion.sintomas || []"
                    :key="`${observacion.id_registro}-${sintoma}`"
                    class="activity-module-badge"
                  >
                    {{ sintoma }}
                  </span>
                </div>
              </td>

              <td>
                <span
                  class="activity-description"
                  :title="observacion.descripcion"
                >
                  {{ observacion.descripcion || 'Sin descripción' }}
                </span>
              </td>

              <td>
                <span
                  class="appointment-status-badge"
                  :class="getTransmissionStatusClass(observacion.estado)"
                >
                  <span></span>
                  {{ getTransmissionStatusLabel(observacion.estado) }}
                </span>
              </td>

              <td>
                <div class="table-actions">
                  <button
                    class="table-action-button view"
                    type="button"
                    title="Ver detalle"
                    @click="openTransmissionDetail(observacion)"
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
        <i class="bi bi-chat-left-text"></i>
        <h4>No hay observaciones</h4>
        <p>
          No existen observaciones de transmisión con los filtros seleccionados.
        </p>
      </div>
    </section>


    <!-- ======================================================
         ACTIVIDAD
    ======================================================= -->

    <section
      v-if="activeTab === 'actividad'"
      class="section-card"
    >
      <div class="filters-row activity-filters-row">
        <div class="search-box">
          <i class="bi bi-search"></i>

          <input
            v-model="activitySearch"
            type="text"
            placeholder="Buscar por mecánico, acción, módulo o descripción..."
          />
        </div>


        <select
          v-model="activityModuleFilter"
          class="filter-select"
        >
          <option value="">
            Todos los módulos
          </option>

          <option
            v-for="modulo in activityModules"
            :key="modulo"
            :value="modulo"
          >
            {{ modulo }}
          </option>
        </select>


        <input
          v-model="activityDateFilter"
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
          Cargando actividad...
        </span>
      </div>


      <div
        v-else-if="filteredActivities.length"
        class="table-wrapper"
      >
        <table class="data-table">
          <thead>
            <tr>
              <th>Mecánico</th>
              <th>Acción</th>
              <th>Módulo</th>
              <th>Descripción</th>
              <th>Fecha y hora</th>
              <th class="actions-column">Detalle</th>
            </tr>
          </thead>


          <tbody>
            <tr
              v-for="actividad in filteredActivities"
              :key="actividad.id_actividad"
            >
              <td>
                <div class="activity-mechanic-cell">
                  <div class="activity-avatar">
                    {{ getMechanicInitials(actividad.mecanico) }}
                  </div>

                  <div>
                    <strong>
                      {{ getMechanicFullName(actividad.mecanico) }}
                    </strong>

                    <small>
                      {{
                        actividad.mecanico?.especialidad ||
                        'Mecánico'
                      }}
                    </small>
                  </div>
                </div>
              </td>


              <td>
                <span
                  class="activity-action-badge"
                  :class="getActivityActionClass(actividad.tipo_accion)"
                >
                  <i :class="getActivityIcon(actividad.tipo_accion)"></i>

                  {{ formatAction(actividad.tipo_accion) }}
                </span>
              </td>


              <td>
                <span class="activity-module-badge">
                  {{ actividad.modulo || 'General' }}
                </span>
              </td>


              <td>
                <span
                  class="activity-description"
                  :title="actividad.descripcion"
                >
                  {{ actividad.descripcion || 'Sin descripción' }}
                </span>
              </td>


              <td>
                <div class="activity-date-cell">
                  <strong>
                    {{ formatDateTime(actividad.fecha_registro).date }}
                  </strong>

                  <small>
                    {{ formatDateTime(actividad.fecha_registro).time }}
                  </small>
                </div>
              </td>


              <td>
                <div class="table-actions">
                  <button
                    class="table-action-button view"
                    type="button"
                    title="Ver detalle"
                    @click="openActivityDetail(actividad)"
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
        <i class="bi bi-clock-history"></i>

        <h4>
          No hay actividades
        </h4>

        <p>
          No se encontraron acciones de mecánicos
          con los filtros seleccionados.
        </p>
      </div>
    </section>


    <!-- ======================================================
         CITAS
    ======================================================= -->

    <section
      v-else-if="activeTab === 'citas'"
      class="section-card"
    >
      <!-- SUBTABS -->

      <div class="appointment-status-tabs">
        <button
          v-for="estado in estadosCita"
          :key="estado.value"
          type="button"
          :class="{
            active:
              appointmentStatusFilter ===
              estado.value
          }"
          @click="appointmentStatusFilter = estado.value"
        >
          {{ estado.label }}

          <span>
            {{ countAppointments(estado.value) }}
          </span>
        </button>
      </div>


      <!-- FILTROS -->

      <div class="filters-row appointment-filters">
        <div class="search-box">
          <i class="bi bi-search"></i>

          <input
            v-model="appointmentSearch"
            type="text"
            placeholder="Buscar cliente, vehículo, placas, mecánico o motivo..."
          />
        </div>


        <input
          v-model="appointmentDateFilter"
          class="filter-date"
          type="date"
        />
      </div>


      <!-- LOADING -->

      <div
        v-if="loading"
        class="component-loading"
      >
        <div class="app-spinner"></div>

        <span>
          Cargando citas...
        </span>
      </div>


      <!-- TABLA -->

      <div
        v-else-if="filteredAppointments.length"
        class="table-wrapper"
      >
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Vehículo</th>
              <th>Mecánico</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th class="actions-column">Acciones</th>
            </tr>
          </thead>


          <tbody>
            <tr
              v-for="cita in filteredAppointments"
              :key="cita.id_cita"
            >
              <td>
                <div class="appointment-date-cell">
                  <span>
                    {{ getAppointmentDay(cita.fecha) }}
                  </span>

                  <div>
                    <strong>
                      {{ getAppointmentDateMain(cita.fecha) }}
                    </strong>

                    <small>
                      {{ getAppointmentYear(cita.fecha) }}
                    </small>
                  </div>
                </div>
              </td>


              <td>
                <span class="appointment-time">
                  <i class="bi bi-clock"></i>

                  {{ formatTime(cita.hora) }}
                </span>
              </td>


              <td>
                <div class="appointment-person">
                  <strong>
                    {{ getClientName(cita) }}
                  </strong>

                  <small>
                    {{
                      cita.cliente?.usuario?.telefono ||
                      cita.cliente?.usuario?.correo ||
                      'Sin contacto'
                    }}
                  </small>
                </div>
              </td>


              <td>
                <div class="appointment-vehicle">
                  <strong>
                    {{
                      cita.vehiculo
                        ? `${cita.vehiculo.marca} ${cita.vehiculo.modelo}`
                        : 'Sin vehículo'
                    }}
                  </strong>

                  <small>
                    {{ cita.vehiculo?.placas || 'Sin placas' }}
                  </small>
                </div>
              </td>


              <td>
                <span
                  v-if="cita.mecanico"
                  class="appointment-mechanic"
                >
                  <i class="bi bi-person-gear"></i>

                  {{ getMechanicFullName(cita.mecanico) }}
                </span>

                <span
                  v-else
                  class="not-assigned-badge"
                >
                  Sin asignar
                </span>
              </td>


              <td>
                <span
                  class="appointment-reason"
                  :title="cita.motivo || 'Sin motivo'"
                >
                  {{ cita.motivo || 'Sin motivo' }}
                </span>
              </td>


              <td>
                <span
                  class="appointment-status-badge"
                  :class="getAppointmentStatusClass(cita.estado)"
                >
                  <span></span>

                  {{ getAppointmentStatusLabel(cita.estado) }}
                </span>
                <small v-if="cita.estado_reprogramacion === 'PENDIENTE'" class="appointment-proposal-pending">
                  Propuesta pendiente del cliente
                </small>
              </td>


              <td>
                <div class="table-actions">
                  <button
                    class="table-action-button view"
                    type="button"
                    title="Ver cita"
                    @click="openAppointmentDetail(cita)"
                  >
                    <i class="bi bi-eye"></i>
                  </button>


                  <!-- ASIGNAR MECÁNICO -->
                  <button
                    v-if="
                      cita.estado === 'PROXIMA' ||
                      cita.estado === 'EN_ATENCION'
                    "
                    class="table-action-button assign"
                    type="button"
                    :title="
                      cita.mecanico
                        ? 'Cambiar mecánico'
                        : 'Asignar mecánico'
                    "
                    @click="openAssignMechanicModal(cita)"
                  >
                    <i class="bi bi-person-gear"></i>
                  </button>


                  <button
                    v-if="cita.estado === 'PROXIMA'"
                    class="table-action-button edit"
                    type="button"
                    title="Iniciar atención"
                    @click="
                      requestAppointmentStatus(
                        cita,
                        'EN_ATENCION'
                      )
                    "
                  >
                    <i class="bi bi-play-fill"></i>
                  </button>


                  <button
                    v-if="cita.estado === 'EN_ATENCION'"
                    class="table-action-button complete"
                    type="button"
                    title="Marcar atendida"
                    @click="
                      requestAppointmentStatus(
                        cita,
                        'ATENDIDA'
                      )
                    "
                  >
                    <i class="bi bi-check-lg"></i>
                  </button>


                  <button
                    v-if="cita.estado === 'PROXIMA' && cita.estado_reprogramacion !== 'PENDIENTE'"
                    class="table-action-button edit"
                    type="button"
                    title="Proponer otro día u hora"
                    :aria-label="`Proponer cambio de fecha para ${getClientName(cita)}`"
                    :disabled="processingAppointmentActionId === cita.id_cita"
                    @click="openRescheduleDialog(cita)"
                  >
                    <i class="bi bi-calendar2-plus"></i>
                  </button>


                  <button
                    v-if="cita.estado === 'PROXIMA' && cita.estado_reprogramacion !== 'PENDIENTE'"
                    class="table-action-button delete"
                    type="button"
                    title="Negar cita y notificar al cliente"
                    :aria-label="`Negar cita de ${getClientName(cita)}`"
                    :disabled="processingAppointmentActionId === cita.id_cita"
                    @click="rejectAppointment(cita)"
                  >
                    <i :class="processingAppointmentActionId === cita.id_cita ? 'bi bi-arrow-repeat spin' : 'bi bi-calendar2-x'"></i>
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
        <i class="bi bi-calendar2-x"></i>

        <h4>
          No hay citas
        </h4>

        <p>
          No existen citas con los filtros
          seleccionados.
        </p>
      </div>
    </section>


    <!-- ======================================================
         MODAL ASIGNAR MECÁNICO
    ======================================================= -->

    <div
      v-if="showAssignMechanicModal && selectedAppointmentForMechanic"
      class="modal-overlay"
      @click.self="!processingAssign && closeAssignMechanicModal()"
    >
      <div class="app-modal assign-mechanic-modal">
        <div class="modal-header">
          <div>
            <h3>
              Asignar mecánico
            </h3>

            <p>
              Selecciona el mecánico responsable para esta cita.
            </p>
          </div>

          <button
            class="modal-close-button"
            type="button"
            :disabled="processingAssign"
            @click="closeAssignMechanicModal"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Resumen de la cita -->
          <div class="assign-mechanic-appointment">
            <div class="assign-mechanic-date">
              <strong>
                {{ getAppointmentDay(selectedAppointmentForMechanic.fecha) }}
              </strong>

              <span>
                {{ formatTime(selectedAppointmentForMechanic.hora) }}
              </span>
            </div>

            <div>
              <strong>
                {{ getClientName(selectedAppointmentForMechanic) }}
              </strong>

              <span>
                {{
                  selectedAppointmentForMechanic.vehiculo
                    ? `${selectedAppointmentForMechanic.vehiculo.marca} ${selectedAppointmentForMechanic.vehiculo.modelo} · ${selectedAppointmentForMechanic.vehiculo.placas || 'Sin placas'}`
                    : 'Sin vehículo'
                }}
              </span>
            </div>
          </div>

          <!-- Loading mecánicos -->
          <div
            v-if="loadingMechanics"
            class="component-loading"
          >
            <div class="app-spinner"></div>
            <span>Cargando mecánicos...</span>
          </div>

          <!-- Sin mecánicos -->
          <div
            v-else-if="!availableMechanics.length"
            class="empty-state"
          >
            <i class="bi bi-person-x"></i>
            <h4>No hay mecánicos disponibles</h4>
            <p>
              Registra al menos un mecánico activo antes de asignarlo a una cita.
            </p>
          </div>

          <!-- Lista de mecánicos -->
          <div
            v-else
            class="assign-mechanic-list"
          >
            <label
              v-for="mechanic in availableMechanics"
              :key="mechanic.id_mecanico"
              class="assign-mechanic-option"
              :class="{
                selected:
                  Number(selectedMechanicId) === Number(mechanic.id_mecanico)
              }"
            >
              <input
                v-model="selectedMechanicId"
                type="radio"
                :value="mechanic.id_mecanico"
                :disabled="processingAssign"
              />

              <div class="assign-mechanic-option-avatar">
                {{ getMechanicInitials(mechanic) }}
              </div>

              <div class="assign-mechanic-option-info">
                <strong>
                  {{ getMechanicFullName(mechanic) }}
                </strong>

                <span>
                  {{
                    mechanic.especialidad ||
                    'Sin especialidad registrada'
                  }}
                </span>
              </div>

              <i class="bi bi-check-circle-fill assign-mechanic-option-check"></i>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button
            class="secondary-button"
            type="button"
            :disabled="processingAssign"
            @click="closeAssignMechanicModal"
          >
            Cancelar
          </button>

          <button
            class="primary-button"
            type="button"
            :disabled="processingAssign || !selectedMechanicId"
            @click="saveMechanicAssignment"
          >
            <i
              v-if="processingAssign"
              class="bi bi-arrow-repeat spin"
            ></i>

            <i
              v-else
              class="bi bi-check2-circle"
            ></i>

            {{
              processingAssign
                ? 'Asignando...'
                : 'Asignar mecánico'
            }}
          </button>
        </div>
      </div>
    </div>


    <!-- ======================================================
         DETALLE OBSERVACIÓN DE TRANSMISIÓN
    ======================================================= -->

    <div
      v-if="showTransmissionModal && selectedTransmissionObservation"
      class="modal-overlay"
      @click.self="closeTransmissionDetail"
    >
      <div class="app-modal transmission-detail-modal">
        <div class="modal-header">
          <div>
            <h3>Observación de transmisión #{{ selectedTransmissionObservation.id_registro }}</h3>
            <p>Información registrada por el cliente.</p>
          </div>

          <button
            class="modal-close-button"
            type="button"
            :disabled="processing"
            @click="closeTransmissionDetail"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="transmission-detail-heading">
            <div class="transmission-detail-icon">
              <i class="bi bi-car-front-fill"></i>
            </div>

            <div>
              <span class="appointment-detail-label">VEHÍCULO</span>
              <h3>{{ getTransmissionVehicleName(selectedTransmissionObservation) }}</h3>
              <p>{{ selectedTransmissionObservation.vehiculo?.placas || 'Sin placas' }}</p>
            </div>

            <span
              class="appointment-status-badge"
              :class="getTransmissionStatusClass(selectedTransmissionObservation.estado)"
            >
              <span></span>
              {{ getTransmissionStatusLabel(selectedTransmissionObservation.estado) }}
            </span>
          </div>

          <div class="detail-grid">
            <div class="detail-card">
              <i class="bi bi-person"></i>
              <div>
                <small>Cliente</small>
                <strong>{{ getTransmissionClientName(selectedTransmissionObservation) }}</strong>
              </div>
            </div>

            <div class="detail-card">
              <i class="bi bi-calendar3"></i>
              <div>
                <small>Fecha de observación</small>
                <strong>{{ formatDate(selectedTransmissionObservation.fecha_observacion) }}</strong>
              </div>
            </div>

            <div class="detail-card">
              <i class="bi bi-clock-history"></i>
              <div>
                <small>Fecha de registro</small>
                <strong>{{ formatDateTime(selectedTransmissionObservation.fecha_registro).date }} · {{ formatDateTime(selectedTransmissionObservation.fecha_registro).time }}</strong>
              </div>
            </div>

            <div class="detail-card">
              <i class="bi bi-eye"></i>
              <div>
                <small>Fecha de revisión</small>
                <strong>
                  {{
                    selectedTransmissionObservation.fecha_revision
                      ? `${formatDateTime(selectedTransmissionObservation.fecha_revision).date} · ${formatDateTime(selectedTransmissionObservation.fecha_revision).time}`
                      : 'Pendiente de revisión'
                  }}
                </strong>
              </div>
            </div>
          </div>

          <div class="appointment-detail-text">
            <span>Síntomas</span>
            <div class="transmission-symptom-list transmission-detail-symptoms">
              <span
                v-for="sintoma in selectedTransmissionObservation.sintomas || []"
                :key="`${selectedTransmissionObservation.id_registro}-detail-${sintoma}`"
                class="activity-module-badge"
              >
                {{ sintoma }}
              </span>
            </div>
          </div>

          <div class="appointment-detail-text">
            <span>Descripción</span>
            <p>{{ selectedTransmissionObservation.descripcion || 'Sin descripción' }}</p>
          </div>

          <div class="detail-grid transmission-detail-extra-fields">
            <div class="detail-card">
              <i class="bi bi-building-check"></i>
              <div>
                <small>Atención externa</small>
                <strong>{{ selectedTransmissionObservation.atencion_externa ? 'Sí' : 'No' }}</strong>
              </div>
            </div>

            <div class="detail-card">
              <i class="bi bi-card-text"></i>
              <div>
                <small>Detalle atención externa</small>
                <strong>{{ selectedTransmissionObservation.detalle_atencion_externa || 'NO APLICA' }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer transmission-modal-footer">
          <button
            class="secondary-button"
            type="button"
            :disabled="processing"
            @click="closeTransmissionDetail"
          >
            Cerrar
          </button>

          <button
            v-if="String(selectedTransmissionObservation.estado || '').toUpperCase() === 'PENDIENTE'"
            class="primary-button"
            type="button"
            :disabled="processing"
            @click.stop.prevent="changeTransmissionStatus('REVISADO')"
          >
            <i
              class="bi"
              :class="processing ? 'bi-arrow-repeat spin' : 'bi-eye-fill'"
            ></i>
            {{ processing ? 'Procesando...' : 'Marcar como revisada' }}
          </button>

          <button
            v-else-if="String(selectedTransmissionObservation.estado || '').toUpperCase() === 'REVISADO'"
            class="primary-button"
            type="button"
            :disabled="processing"
            @click.stop.prevent="changeTransmissionStatus('ATENDIDO')"
          >
            <i
              class="bi"
              :class="processing ? 'bi-arrow-repeat spin' : 'bi-check-circle-fill'"
            ></i>
            {{ processing ? 'Procesando...' : 'Marcar como atendida' }}
          </button>
        </div>
      </div>
    </div>


    <!-- ======================================================
         DETALLE ACTIVIDAD
    ======================================================= -->

    <div
      v-if="showActivityModal && selectedActivity"
      class="modal-overlay"
      @click.self="closeActivityDetail"
    >
      <div class="app-modal activity-detail-modal">
        <div class="modal-header">
          <div>
            <h3>
              Detalle de actividad
            </h3>

            <p>
              Registro de la acción realizada
              por el mecánico.
            </p>
          </div>


          <button
            class="modal-close-button"
            type="button"
            @click="closeActivityDetail"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>


        <div class="modal-body">
          <div class="activity-detail-profile">
            <div class="activity-large-avatar">
              {{ getMechanicInitials(selectedActivity.mecanico) }}
            </div>

            <div>
              <span>
                MECÁNICO
              </span>

              <h3>
                {{ getMechanicFullName(selectedActivity.mecanico) }}
              </h3>

              <p>
                {{
                  selectedActivity.mecanico?.especialidad ||
                  'Sin especialidad registrada'
                }}
              </p>
            </div>
          </div>


          <div class="detail-grid">
            <div class="detail-card">
              <i :class="getActivityIcon(selectedActivity.tipo_accion)"></i>

              <div>
                <small>
                  Acción
                </small>

                <strong>
                  {{ formatAction(selectedActivity.tipo_accion) }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-grid"></i>

              <div>
                <small>
                  Módulo
                </small>

                <strong>
                  {{ selectedActivity.modulo || 'General' }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-calendar3"></i>

              <div>
                <small>
                  Fecha
                </small>

                <strong>
                  {{ formatDateTime(selectedActivity.fecha_registro).date }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-clock"></i>

              <div>
                <small>
                  Hora
                </small>

                <strong>
                  {{ formatDateTime(selectedActivity.fecha_registro).time }}
                </strong>
              </div>
            </div>
          </div>


          <div class="activity-description-card">
            <span>
              Descripción
            </span>

            <p>
              {{ selectedActivity.descripcion || 'Sin descripción' }}
            </p>
          </div>


          <div
            v-if="selectedActivity.referencia_id"
            class="activity-reference"
          >
            <i class="bi bi-link-45deg"></i>

            Referencia:
            #{{ selectedActivity.referencia_id }}
          </div>
        </div>


        <div class="modal-footer">
          <button
            class="secondary-button"
            type="button"
            @click="closeActivityDetail"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>


    <!-- ======================================================
         DETALLE CITA
    ======================================================= -->

    <div
      v-if="showAppointmentModal && selectedAppointment"
      class="modal-overlay"
      @click.self="closeAppointmentDetail"
    >
      <div class="app-modal appointment-detail-modal">
        <div class="modal-header">
          <div>
            <h3>
              Cita #{{ selectedAppointment.id_cita }}
            </h3>

            <p>
              Información general de la cita.
            </p>
          </div>


          <button
            class="modal-close-button"
            type="button"
            @click="closeAppointmentDetail"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>


        <div class="modal-body">
          <div class="appointment-detail-heading">
            <div class="appointment-calendar-icon">
              <span>
                {{ getAppointmentDay(selectedAppointment.fecha) }}
              </span>

              <strong>
                {{ getAppointmentDateMain(selectedAppointment.fecha) }}
              </strong>
            </div>


            <div>
              <span class="appointment-detail-label">
                FECHA Y HORA
              </span>

              <h3>
                {{ formatDate(selectedAppointment.fecha) }}
              </h3>

              <p>
                <i class="bi bi-clock"></i>

                {{ formatTime(selectedAppointment.hora) }}
              </p>
            </div>


            <span
              class="appointment-status-badge"
              :class="getAppointmentStatusClass(selectedAppointment.estado)"
            >
              {{ getAppointmentStatusLabel(selectedAppointment.estado) }}
            </span>
          </div>


          <div class="detail-grid">
            <div class="detail-card">
              <i class="bi bi-person"></i>

              <div>
                <small>
                  Cliente
                </small>

                <strong>
                  {{ getClientName(selectedAppointment) }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-car-front"></i>

              <div>
                <small>
                  Vehículo
                </small>

                <strong>
                  {{
                    selectedAppointment.vehiculo
                      ? `${selectedAppointment.vehiculo.marca} ${selectedAppointment.vehiculo.modelo}`
                      : 'Sin vehículo'
                  }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-upc-scan"></i>

              <div>
                <small>
                  Placas
                </small>

                <strong>
                  {{
                    selectedAppointment.vehiculo?.placas ||
                    'Sin placas'
                  }}
                </strong>
              </div>
            </div>


            <div class="detail-card">
              <i class="bi bi-person-gear"></i>

              <div>
                <small>
                  Mecánico
                </small>

                <strong>
                  {{
                    selectedAppointment.mecanico
                      ? getMechanicFullName(selectedAppointment.mecanico)
                      : 'Sin asignar'
                  }}
                </strong>
              </div>
            </div>
          </div>


          <div class="appointment-detail-text">
            <span>
              Motivo
            </span>

            <p>
              {{ selectedAppointment.motivo || 'No especificado' }}
            </p>
          </div>


          <div class="appointment-detail-text">
            <span>
              Observaciones
            </span>

            <p>
              {{ selectedAppointment.observaciones || 'Sin observaciones' }}
            </p>
          </div>
        </div>


        <div class="modal-footer">
          <button
            class="secondary-button"
            type="button"
            @click="closeAppointmentDetail"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>


    <div
      v-if="rescheduleAppointment"
      class="modal-overlay"
      @click.self="closeRescheduleDialog"
    >
      <form class="appointment-reschedule-modal" @submit.prevent="submitReschedule">
        <div class="appointment-reschedule-heading">
          <div class="appointment-reschedule-icon">
            <i class="bi bi-calendar2-plus"></i>
          </div>
          <div>
            <span>PROPUESTA DE CAMBIO</span>
            <h3>Proponer otra fecha u hora</h3>
            <p>
              La cita seguirá en su horario actual hasta que el cliente responda.
              Si rechaza la propuesta, se cancelará.
            </p>
          </div>
          <button type="button" aria-label="Cerrar" :disabled="processingAppointmentActionId === rescheduleAppointment.id_cita" @click="closeRescheduleDialog">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="appointment-reschedule-fields">
          <label>
            <span>Fecha propuesta</span>
            <input v-model="rescheduleForm.fecha" type="date" :min="minimumAppointmentDate" required />
          </label>
          <label>
            <span>Hora propuesta</span>
            <input v-model="rescheduleForm.hora" type="time" required />
          </label>
        </div>

        <div class="appointment-reschedule-actions">
          <button type="button" class="secondary-button" :disabled="processingAppointmentActionId === rescheduleAppointment.id_cita" @click="closeRescheduleDialog">
            Volver
          </button>
          <button type="submit" class="primary-button" :disabled="processingAppointmentActionId === rescheduleAppointment.id_cita">
            <i :class="processingAppointmentActionId === rescheduleAppointment.id_cita ? 'bi bi-arrow-repeat spin' : 'bi bi-send'"></i>
            {{ processingAppointmentActionId === rescheduleAppointment.id_cita ? 'Enviando...' : 'Enviar propuesta' }}
          </button>
        </div>
      </form>
    </div>


    <!-- ======================================================
         CONFIRMAR CAMBIO CITA
    ======================================================= -->

    <div
      v-if="appointmentConfirmation.visible"
      class="modal-overlay"
      @click.self="!processing && closeAppointmentConfirmation()"
    >
      <div class="confirmation-modal">
        <div
          class="confirmation-icon"
          :class="
            appointmentConfirmation.newStatus === 'CANCELADA'
              ? 'delete'
              : 'update'
          "
        >
          <i
            :class="
              appointmentConfirmation.newStatus === 'CANCELADA'
                ? 'bi bi-x-circle-fill'
                : appointmentConfirmation.newStatus === 'ATENDIDA'
                  ? 'bi bi-check-circle-fill'
                  : 'bi bi-play-circle-fill'
            "
          ></i>
        </div>


        <h3>
          {{ appointmentConfirmation.title }}
        </h3>


        <p>
          {{ appointmentConfirmation.message }}
        </p>


        <div
          v-if="appointmentConfirmation.item"
          class="appointment-confirmation-card"
        >
          <div class="appointment-confirmation-date">
            <strong>
              {{ getAppointmentDay(appointmentConfirmation.item.fecha) }}
            </strong>

            <span>
              {{ formatTime(appointmentConfirmation.item.hora) }}
            </span>
          </div>


          <div>
            <strong>
              {{ getClientName(appointmentConfirmation.item) }}
            </strong>

            <span>
              {{ appointmentConfirmation.item.vehiculo?.placas || 'Sin placas' }}
            </span>
          </div>
        </div>


        <div class="confirmation-actions">
          <button
            class="secondary-button"
            type="button"
            :disabled="processing"
            @click="closeAppointmentConfirmation"
          >
            Cancelar
          </button>


          <button
            :class="
              appointmentConfirmation.newStatus === 'CANCELADA'
                ? 'danger-button'
                : 'primary-button'
            "
            type="button"
            :disabled="processing"
            @click="executeAppointmentStatus"
          >
            <i
              v-if="processing"
              class="bi bi-arrow-repeat spin"
            ></i>

            <i
              v-else
              class="bi bi-check2-circle"
            ></i>

            {{
              processing
                ? 'Procesando...'
                : appointmentConfirmation.confirmText
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
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'

import { supabase } from '../services/supabase.js'

import {
  actualizarEstadoObservacionTransmision,
  asignarMecanicoCita,
  cambiarEstadoCita,
  marcarAlertaLeida,
  obtenerActividadesMecanicos,
  obtenerAlertasSistema,
  obtenerCitas,
  obtenerContadorAlertas,
  obtenerMecanicosCitas,
  obtenerObservacionesTransmisionClientes,
  proponerReprogramacionCita,
  rechazarCitaMecanico
} from '../services/alertaService.js'


/* ============================================================
   EMITS
============================================================ */

const emit = defineEmits([
  'alert-count'
])


/* ============================================================
   ESTADO
============================================================ */

const actividades = ref([])

const citas = ref([])

const alertas = ref([])

const observacionesTransmision = ref([])

const loading = ref(false)

const processing = ref(false)

const activeTab = ref('observaciones')

const successMessage = ref('')

const errorMessage = ref('')

const showSystemAlerts = ref(false)

let mechanicAlertChannel = null


/* ============================================================
   ACTIVIDAD
============================================================ */

const activitySearch = ref('')

const activityModuleFilter = ref('')

const activityDateFilter = ref('')

const selectedActivity = ref(null)

const showActivityModal = ref(false)


/* ============================================================
   OBSERVACIONES DE TRANSMISIÓN
============================================================ */

const transmissionSearch = ref('')

const transmissionStatusFilter = ref('')

const transmissionDateFilter = ref('')

const selectedTransmissionObservation = ref(null)

const showTransmissionModal = ref(false)


/* ============================================================
   CITAS
============================================================ */

const appointmentSearch = ref('')

const appointmentDateFilter = ref('')

const appointmentStatusFilter = ref('')

const selectedAppointment = ref(null)

const showAppointmentModal = ref(false)


const estadosCita = [
  { value: '', label: 'Todas' },
  { value: 'PROXIMA', label: 'Próximas' },
  { value: 'EN_ATENCION', label: 'En atención' },
  { value: 'ATENDIDA', label: 'Atendidas' },
  { value: 'VENCIDA', label: 'Vencidas' },
  { value: 'CANCELADA', label: 'Canceladas' }
]


/* ============================================================
   ASIGNAR MECÁNICO
============================================================ */

const showAssignMechanicModal = ref(false)

const selectedAppointmentForMechanic = ref(null)

const availableMechanics = ref([])

const loadingMechanics = ref(false)

const processingAssign = ref(false)

const selectedMechanicId = ref(null)


/* ============================================================
   CONFIRMACIÓN
============================================================ */

const appointmentConfirmation = ref({
  visible: false,
  item: null,
  newStatus: '',
  title: '',
  message: '',
  confirmText: ''
})

const rescheduleAppointment = ref(null)
const rescheduleForm = ref({ fecha: '', hora: '' })
const processingAppointmentActionId = ref(null)
const now = new Date()
const minimumAppointmentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`


/* ============================================================
   CONTADORES
============================================================ */

const totalObservacionesPendientes = computed(() => {
  return observacionesTransmision.value.filter(
    item =>
      String(item.estado || '').trim().toUpperCase() === 'PENDIENTE'
  ).length
})


const totalObservacionesRevisadas = computed(() => {
  return observacionesTransmision.value.filter(
    item =>
      String(item.estado || '').trim().toUpperCase() === 'REVISADO'
  ).length
})


const totalObservacionesAtendidas = computed(() => {
  return observacionesTransmision.value.filter(
    item =>
      String(item.estado || '').trim().toUpperCase() === 'ATENDIDO'
  ).length
})


const totalObservaciones = computed(() => {
  return observacionesTransmision.value.length
})


const totalProximas = computed(() => {
  return citas.value.filter(cita => cita.estado === 'PROXIMA').length
})


const totalEnAtencion = computed(() => {
  return citas.value.filter(cita => cita.estado === 'EN_ATENCION').length
})


const totalVencidas = computed(() => {
  return citas.value.filter(cita => cita.estado === 'VENCIDA').length
})


const alertasNoLeidas = computed(() => {
  return alertas.value.filter(
    alerta =>
      String(alerta.estado || '').trim().toUpperCase() !== 'LEIDA'
  )
})


/* ============================================================
   MÓDULOS
============================================================ */

const activityModules = computed(() => {
  return [
    ...new Set(
      actividades.value.map(item => item.modulo).filter(Boolean)
    )
  ].sort()
})


/* ============================================================
   FILTRO OBSERVACIONES DE TRANSMISIÓN
============================================================ */

const filteredTransmissionObservations = computed(() => {
  const term = transmissionSearch.value.trim().toLowerCase()

  return observacionesTransmision.value.filter(observacion => {
    const usuario = observacion?.cliente?.usuario

    const cliente = `
      ${usuario?.nombre || ''}
      ${usuario?.apellido_paterno || ''}
      ${usuario?.apellido_materno || ''}
    `.replace(/\s+/g, ' ').trim()

    const vehiculo = `
      ${observacion?.vehiculo?.marca || ''}
      ${observacion?.vehiculo?.modelo || ''}
      ${observacion?.vehiculo?.placas || ''}
      ${observacion?.vehiculo?.no_economico || ''}
    `.replace(/\s+/g, ' ').trim()

    const sintomas =
      Array.isArray(observacion.sintomas)
        ? observacion.sintomas.join(' ')
        : ''

    const text = `
      ${cliente}
      ${vehiculo}
      ${sintomas}
      ${observacion.descripcion || ''}
      ${observacion.estado || ''}
    `.toLowerCase().replace(/\s+/g, ' ')

    const matchesSearch = !term || text.includes(term)

    const matchesStatus =
      !transmissionStatusFilter.value ||
      String(observacion.estado || '').trim().toUpperCase() ===
        transmissionStatusFilter.value

    const matchesDate =
      !transmissionDateFilter.value ||
      observacion.fecha_observacion === transmissionDateFilter.value

    return matchesSearch && matchesStatus && matchesDate
  })
})


/* ============================================================
   FILTRO ACTIVIDAD
============================================================ */

const filteredActivities = computed(() => {
  const term = activitySearch.value.trim().toLowerCase()

  return actividades.value.filter(actividad => {
    const mechanic = getMechanicFullName(actividad.mecanico)

    const text = `
      ${mechanic}
      ${actividad.tipo_accion || ''}
      ${actividad.modulo || ''}
      ${actividad.descripcion || ''}
      ${actividad.referencia_id || ''}
    `.toLowerCase().replace(/\s+/g, ' ')

    const matchesSearch = !term || text.includes(term)

    const matchesModule =
      !activityModuleFilter.value ||
      actividad.modulo === activityModuleFilter.value

    const fecha = actividad.fecha_registro
      ? String(actividad.fecha_registro).substring(0, 10)
      : ''

    const matchesDate =
      !activityDateFilter.value || fecha === activityDateFilter.value

    return matchesSearch && matchesModule && matchesDate
  })
})


/* ============================================================
   FILTRO CITAS
============================================================ */

const filteredAppointments = computed(() => {
  const term = appointmentSearch.value.trim().toLowerCase()

  return citas.value
    .filter(cita => {
      const text = `
        ${getClientName(cita)}
        ${cita.vehiculo?.placas || ''}
        ${cita.vehiculo?.marca || ''}
        ${cita.vehiculo?.modelo || ''}
        ${getMechanicFullName(cita.mecanico)}
        ${cita.motivo || ''}
        ${cita.observaciones || ''}
      `.toLowerCase().replace(/\s+/g, ' ')

      const matchesSearch = !term || text.includes(term)

      const matchesStatus =
        !appointmentStatusFilter.value ||
        cita.estado === appointmentStatusFilter.value

      const matchesDate =
        !appointmentDateFilter.value ||
        cita.fecha === appointmentDateFilter.value

      return matchesSearch && matchesStatus && matchesDate
    })
    .sort((a, b) => {
      const estadoPrioritario = estado =>
        ['PROXIMA', 'EN_ATENCION'].includes(
          String(estado || '').trim().toUpperCase()
        )
          ? 0
          : 1

      return estadoPrioritario(a.estado) - estadoPrioritario(b.estado)
    })
})


/* ============================================================
   LOAD
============================================================ */

const loadAll = async () => {
  loading.value = true

  errorMessage.value = ''

  try {
    const [
      activityData,
      appointmentData,
      alertData,
      transmissionData,
      alertCount
    ] = await Promise.all([
      obtenerActividadesMecanicos(),
      obtenerCitas(),
      obtenerAlertasSistema(),
      obtenerObservacionesTransmisionClientes(),
      obtenerContadorAlertas()
    ])

    actividades.value = activityData

    citas.value = appointmentData

    alertas.value = alertData

    observacionesTransmision.value = Array.isArray(transmissionData)
      ? transmissionData
      : []

    emit('alert-count', alertCount)
  } catch (error) {
    console.error('Error cargando alertas:', error)

    errorMessage.value = getErrorMessage(
      error,
      'No fue posible cargar la información de alertas.'
    )
  } finally {
    loading.value = false
  }
}


/* ============================================================
   ALERTA LEÍDA
============================================================ */

const readAlert = async alerta => {
  try {
    await marcarAlertaLeida(alerta.id_alerta)

    await loadAll()

    successMessage.value = 'La alerta fue marcada como leída.'

    clearSuccessLater()
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      'No fue posible actualizar la alerta.'
    )
  }
}


/* ============================================================
   DETALLE ACTIVIDAD
============================================================ */

const openActivityDetail = actividad => {
  selectedActivity.value = actividad
  showActivityModal.value = true
}


const closeActivityDetail = () => {
  showActivityModal.value = false
  selectedActivity.value = null
}


/* ============================================================
   DETALLE CITA
============================================================ */

const openAppointmentDetail = cita => {
  selectedAppointment.value = cita
  showAppointmentModal.value = true
}


const closeAppointmentDetail = () => {
  showAppointmentModal.value = false
  selectedAppointment.value = null
}


/* ============================================================
   ASIGNAR MECÁNICO
============================================================ */

const openAssignMechanicModal = async cita => {
  if (!cita) {
    return
  }

  selectedAppointmentForMechanic.value = cita

  selectedMechanicId.value = cita.id_mecanico || null

  showAssignMechanicModal.value = true

  loadingMechanics.value = true

  errorMessage.value = ''

  try {
    const mechanics = await obtenerMecanicosCitas()

    availableMechanics.value = Array.isArray(mechanics)
      ? mechanics
      : []
  } catch (error) {
    console.error('Error cargando mecánicos:', error)

    availableMechanics.value = []

    errorMessage.value = getErrorMessage(
      error,
      'No fue posible cargar los mecánicos disponibles.'
    )
  } finally {
    loadingMechanics.value = false
  }
}


const closeAssignMechanicModal = () => {
  if (processingAssign.value) {
    return
  }

  showAssignMechanicModal.value = false
  selectedAppointmentForMechanic.value = null
  selectedMechanicId.value = null
  availableMechanics.value = []
}


const saveMechanicAssignment = async () => {
  if (processingAssign.value) {
    return
  }

  if (!selectedMechanicId.value) {
    errorMessage.value = 'Selecciona un mecánico.'
    return
  }

  if (!selectedAppointmentForMechanic.value?.id_cita) {
    errorMessage.value = 'No se encontró la cita seleccionada.'
    return
  }

  processingAssign.value = true
  errorMessage.value = ''

  try {
    await asignarMecanicoCita(
      selectedAppointmentForMechanic.value.id_cita,
      selectedMechanicId.value
    )

    successMessage.value =
      'El mecánico fue asignado correctamente a la cita.'

    showAssignMechanicModal.value = false
    selectedAppointmentForMechanic.value = null
    selectedMechanicId.value = null
    availableMechanics.value = []

    processingAssign.value = false

    await loadAll()

    clearSuccessLater()
  } catch (error) {
    console.error('Error asignando mecánico:', error)

    errorMessage.value = getErrorMessage(
      error,
      'No fue posible asignar el mecánico.'
    )

    processingAssign.value = false
  }
}


/* ============================================================
   CAMBIAR ESTADO CITA
============================================================ */

const requestAppointmentStatus = (cita, newStatus) => {
  let title = ''
  let message = ''
  let confirmText = ''

  switch (newStatus) {
    case 'EN_ATENCION':
      title = '¿Iniciar atención?'
      message = 'La cita cambiará a En atención.'
      confirmText = 'Sí, iniciar'
      break

    case 'ATENDIDA':
      title = '¿Finalizar cita?'
      message = 'La cita se marcará como atendida.'
      confirmText = 'Sí, finalizar'
      break

    case 'CANCELADA':
      title = '¿Cancelar cita?'
      message = 'La cita quedará registrada como cancelada.'
      confirmText = 'Sí, cancelar'
      break

    default:
      return
  }

  appointmentConfirmation.value = {
    visible: true,
    item: cita,
    newStatus,
    title,
    message,
    confirmText
  }
}


/* ============================================================
   EJECUTAR CAMBIO DE ESTADO
============================================================ */

const executeAppointmentStatus = async () => {
  if (processing.value) {
    return
  }

  processing.value = true
  errorMessage.value = ''

  try {
    await cambiarEstadoCita(
      appointmentConfirmation.value.item.id_cita,
      appointmentConfirmation.value.newStatus
    )

    successMessage.value =
      'El estado de la cita fue actualizado correctamente.'

    appointmentConfirmation.value = {
      visible: false,
      item: null,
      newStatus: '',
      title: '',
      message: '',
      confirmText: ''
    }

    processing.value = false

    await loadAll()

    clearSuccessLater()
  } catch (error) {
    console.error('Error actualizando cita:', error)

    errorMessage.value = getErrorMessage(
      error,
      'No fue posible actualizar la cita.'
    )

    appointmentConfirmation.value = {
      visible: false,
      item: null,
      newStatus: '',
      title: '',
      message: '',
      confirmText: ''
    }

    processing.value = false
  }
}


const closeAppointmentConfirmation = () => {
  if (processing.value) {
    return
  }

  appointmentConfirmation.value = {
    visible: false,
    item: null,
    newStatus: '',
    title: '',
    message: '',
    confirmText: ''
  }
}

const openRescheduleDialog = cita => {
  rescheduleAppointment.value = cita
  rescheduleForm.value = {
    fecha: cita.fecha || minimumAppointmentDate,
    hora: String(cita.hora || '').slice(0, 5)
  }
  errorMessage.value = ''
}

const closeRescheduleDialog = () => {
  if (processingAppointmentActionId.value) return
  rescheduleAppointment.value = null
}

const submitReschedule = async () => {
  const cita = rescheduleAppointment.value
  if (!cita) return

  processingAppointmentActionId.value = cita.id_cita
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await proponerReprogramacionCita(
      cita.id_cita,
      rescheduleForm.value.fecha,
      rescheduleForm.value.hora
    )
    rescheduleAppointment.value = null
    successMessage.value = 'La propuesta de cambio se envió al cliente.'
    await loadAll()
    clearSuccessLater()
  } catch (error) {
    console.error('Error proponiendo cambio de cita desde administración:', error)
    errorMessage.value = getErrorMessage(error, 'No fue posible enviar la propuesta de cambio.')
  } finally {
    processingAppointmentActionId.value = null
  }
}

const rejectAppointment = async cita => {
  if (!window.confirm(`¿Negar la cita de ${getClientName(cita)}? La cita se cancelará y el cliente recibirá una notificación.`)) return

  processingAppointmentActionId.value = cita.id_cita
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await rechazarCitaMecanico(cita.id_cita)
    successMessage.value = 'La cita fue negada, cancelada y el cliente fue notificado.'
    await loadAll()
    clearSuccessLater()
  } catch (error) {
    console.error('Error negando cita desde administración:', error)
    errorMessage.value = getErrorMessage(error, 'No fue posible negar la cita.')
  } finally {
    processingAppointmentActionId.value = null
  }
}


/* ============================================================
   CONTADOR POR ESTADO
============================================================ */

const countAppointments = estado => {
  if (!estado) {
    return citas.value.length
  }

  return citas.value.filter(cita => cita.estado === estado).length
}


/* ============================================================
   CLIENTE
============================================================ */

const getClientName = cita => {
  const usuario = cita?.cliente?.usuario

  if (!usuario) {
    return cita?.id_cliente
      ? `Cliente #${cita.id_cliente}`
      : 'Sin cliente'
  }

  return `
    ${usuario.nombre || ''}
    ${usuario.apellido_paterno || ''}
    ${usuario.apellido_materno || ''}
  `.replace(/\s+/g, ' ').trim()
}


/* ============================================================
   CLIENTE - OBSERVACIÓN DE TRANSMISIÓN
============================================================ */

const getTransmissionClientName = observacion => {
  const usuario = observacion?.cliente?.usuario

  if (!usuario) {
    return observacion?.id_cliente
      ? `Cliente #${observacion.id_cliente}`
      : 'Sin cliente'
  }

  return `
    ${usuario.nombre || ''}
    ${usuario.apellido_paterno || ''}
    ${usuario.apellido_materno || ''}
  `.replace(/\s+/g, ' ').trim()
}


const getTransmissionVehicleName = observacion => {
  const vehiculo = observacion?.vehiculo

  if (!vehiculo) {
    return observacion?.id_vehiculo
      ? `Vehículo #${observacion.id_vehiculo}`
      : 'Sin vehículo'
  }

  const nombre = `
    ${vehiculo.marca || ''}
    ${vehiculo.modelo || ''}
  `.replace(/\s+/g, ' ').trim()

  return (
    nombre ||
    vehiculo.placas ||
    `Vehículo #${observacion.id_vehiculo}`
  )
}


const getTransmissionStatusLabel = status => {
  switch (String(status || '').trim().toUpperCase()) {
    case 'PENDIENTE':
      return 'Pendiente'
    case 'REVISADO':
      return 'Revisado'
    case 'ATENDIDO':
      return 'Atendido'
    default:
      return status || 'Sin estado'
  }
}


const getTransmissionStatusClass = status => {
  switch (String(status || '').trim().toUpperCase()) {
    case 'PENDIENTE':
      return 'attention'
    case 'REVISADO':
      return 'upcoming'
    case 'ATENDIDO':
      return 'completed'
    default:
      return ''
  }
}


/* ============================================================
   DETALLE / ESTADO DE OBSERVACIÓN DE TRANSMISIÓN
============================================================ */

const openTransmissionDetail = observacion => {
  selectedTransmissionObservation.value = observacion
  showTransmissionModal.value = true
}


const closeTransmissionDetail = () => {
  if (processing.value) {
    return
  }

  showTransmissionModal.value = false
  selectedTransmissionObservation.value = null
}


const changeTransmissionStatus = async newStatus => {
  if (processing.value || !selectedTransmissionObservation.value) {
    return
  }

  processing.value = true
  errorMessage.value = ''

  try {
    const idRegistro = selectedTransmissionObservation.value.id_registro

    const updatedObservation =
      await actualizarEstadoObservacionTransmision(idRegistro, newStatus)

    observacionesTransmision.value = observacionesTransmision.value.map(
      observacion => {
        if (Number(observacion.id_registro) !== Number(idRegistro)) {
          return observacion
        }

        return {
          ...observacion,
          ...updatedObservation
        }
      }
    )

    selectedTransmissionObservation.value = {
      ...selectedTransmissionObservation.value,
      ...updatedObservation
    }

    successMessage.value =
      newStatus === 'REVISADO'
        ? 'La observación fue marcada como revisada.'
        : 'La observación fue marcada como atendida.'

    showTransmissionModal.value = false
    selectedTransmissionObservation.value = null

    await loadAll()

    clearSuccessLater()
  } catch (error) {
    console.error(
      'Error actualizando observación de transmisión:',
      error
    )

    errorMessage.value = getErrorMessage(
      error,
      'No fue posible actualizar la observación.'
    )
  } finally {
    processing.value = false
  }
}


/* ============================================================
   MECÁNICO
============================================================ */

const getMechanicFullName = mecanico => {
  const usuario = mecanico?.usuario

  if (!usuario) {
    return mecanico?.id_mecanico
      ? `Mecánico #${mecanico.id_mecanico}`
      : 'Sin asignar'
  }

  return `
    ${usuario.nombre || ''}
    ${usuario.apellido_paterno || ''}
    ${usuario.apellido_materno || ''}
  `.replace(/\s+/g, ' ').trim()
}


const getMechanicInitials = mecanico => {
  const usuario = mecanico?.usuario

  if (!usuario) {
    return 'MC'
  }

  const items = [
    usuario.nombre,
    usuario.apellido_paterno
  ].filter(Boolean)

  return items
    .map(value => value.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase()
}


/* ============================================================
   ACTIVIDAD
============================================================ */

const formatAction = value => {
  if (!value) {
    return 'Acción'
  }

  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, letter => letter.toUpperCase())
}


const getActivityIcon = action => {
  const value = String(action || '').toUpperCase()

  if (value.includes('CREAR') || value.includes('REGISTR')) {
    return 'bi bi-plus-circle-fill'
  }

  if (value.includes('ACTUALIZ') || value.includes('EDIT')) {
    return 'bi bi-pencil-square'
  }

  if (value.includes('ELIMIN')) {
    return 'bi bi-trash3-fill'
  }

  if (value.includes('FINAL') || value.includes('COMPLET')) {
    return 'bi bi-check-circle-fill'
  }

  if (value.includes('INICI')) {
    return 'bi bi-play-circle-fill'
  }

  return 'bi bi-activity'
}


const getActivityActionClass = action => {
  const value = String(action || '').toUpperCase()

  if (value.includes('ELIMIN')) {
    return 'danger'
  }

  if (value.includes('ACTUALIZ') || value.includes('EDIT')) {
    return 'warning'
  }

  if (value.includes('FINAL') || value.includes('COMPLET')) {
    return 'success'
  }

  return 'primary'
}


/* ============================================================
   CITAS ESTADO
============================================================ */

const getAppointmentStatusLabel = status => {
  switch (status) {
    case 'PROXIMA':
      return 'Próxima'
    case 'EN_ATENCION':
      return 'En atención'
    case 'ATENDIDA':
      return 'Atendida'
    case 'VENCIDA':
      return 'Vencida'
    case 'CANCELADA':
      return 'Cancelada'
    default:
      return status || 'Sin estado'
  }
}


const getAppointmentStatusClass = status => {
  switch (status) {
    case 'PROXIMA':
      return 'upcoming'
    case 'EN_ATENCION':
      return 'attention'
    case 'ATENDIDA':
      return 'completed'
    case 'VENCIDA':
      return 'expired'
    case 'CANCELADA':
      return 'cancelled'
    default:
      return ''
  }
}


/* ============================================================
   ALERTAS NIVEL
============================================================ */

const getAlertLevelClass = nivel => {
  const value = String(nivel || '').trim().toUpperCase()

  if (
    value === 'ALTO' ||
    value === 'CRITICO' ||
    value === 'CRÍTICO'
  ) {
    return 'danger'
  }

  if (value === 'MEDIO') {
    return 'warning'
  }

  return 'info'
}


const getAlertIcon = nivel => {
  const level = getAlertLevelClass(nivel)

  if (level === 'danger') {
    return 'bi bi-exclamation-triangle-fill'
  }

  if (level === 'warning') {
    return 'bi bi-exclamation-circle-fill'
  }

  return 'bi bi-info-circle-fill'
}


/* ============================================================
   FECHAS
============================================================ */

const formatDate = value => {
  if (!value) {
    return '—'
  }

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const formatAlertDateTime = value => {
  if (!value) {
    return '—'
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return formatDate(value)
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return formatDate(value)
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}


const formatDateTime = value => {
  if (!value) {
    return {
      date: '—',
      time: '—'
    }
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return {
      date: '—',
      time: '—'
    }
  }

  return {
    date: new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date),

    time: new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Mexico_City'
    }).format(date)
  }
}


const formatTime = value => {
  if (!value) {
    return '—'
  }

  const raw = String(value).substring(0, 5)

  const date = new Date(`2000-01-01T${raw}:00`)

  if (Number.isNaN(date.getTime())) {
    return raw
  }

  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}


const appointmentDateObject = value => {
  if (!value) {
    return null
  }

  const date = new Date(`${value}T12:00:00`)

  return Number.isNaN(date.getTime()) ? null : date
}


const getAppointmentDay = value => {
  const date = appointmentDateObject(value)

  return date
    ? String(date.getDate()).padStart(2, '0')
    : '--'
}


const getAppointmentDateMain = value => {
  const date = appointmentDateObject(value)

  if (!date) {
    return '—'
  }

  return new Intl.DateTimeFormat('es-MX', {
    month: 'short'
  }).format(date)
}


const getAppointmentYear = value => {
  const date = appointmentDateObject(value)

  return date ? date.getFullYear() : '—'
}


/* ============================================================
   ERROR
============================================================ */

const getErrorMessage = (error, fallback) => {
  return (
    error?.message ||
    error?.details ||
    error?.hint ||
    fallback
  )
}


/* ============================================================
   SUCCESS
============================================================ */

const clearSuccessLater = () => {
  setTimeout(() => {
    successMessage.value = ''
  }, 3500)
}


/* ============================================================
   MOUNT
============================================================ */

onMounted(() => {
  loadAll()

  mechanicAlertChannel = supabase
    .channel('admin-mechanic-alerts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'alerta'
      },
      async payload => {
        await loadAll()

        if ([
          'ACCION_MECANICO',
          'REPORTES_MENSUALES_DISPONIBLES'
        ].includes(payload.new?.tipo_alerta)) {
          successMessage.value = payload.new.mensaje
          clearSuccessLater()
        }
      }
    )
    .subscribe()
})

onBeforeUnmount(() => {
  if (mechanicAlertChannel) {
    supabase.removeChannel(mechanicAlertChannel)
    mechanicAlertChannel = null
  }
})
</script>

<style scoped>
.transmission-symptom-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* ============================================================
   BUSCADOR DE OBSERVACIONES
   Mantiene la lupa SIEMPRE dentro del campo.
============================================================ */

.filters-row.activity-filters-row
> .search-box.transmission-search-box {
  position: relative !important;

  display: flex !important;
  align-items: center !important;

  width: 100% !important;
  min-width: 0 !important;

  height: 44px !important;
  min-height: 44px !important;
  max-height: 44px !important;

  margin: 0 !important;
  padding: 0 !important;

  align-self: start !important;

  box-sizing: border-box !important;
}

.filters-row.activity-filters-row
> .search-box.transmission-search-box
> i.bi-search {
  position: absolute !important;

  left: 14px !important;
  top: 50% !important;
  right: auto !important;
  bottom: auto !important;

  width: 18px !important;
  height: 18px !important;

  margin: 0 !important;
  padding: 0 !important;

  display: flex !important;
  align-items: center !important;
  justify-content: center !important;

  transform: translateY(-50%) !important;

  line-height: 1 !important;

  z-index: 5 !important;
  pointer-events: none !important;
}

.filters-row.activity-filters-row
> .search-box.transmission-search-box
> input {
  display: block !important;

  width: 100% !important;
  min-width: 0 !important;

  height: 44px !important;
  min-height: 44px !important;
  max-height: 44px !important;

  margin: 0 !important;

  padding:
    0 14px 0 42px !important;

  box-sizing: border-box !important;
}

/*
 * Evita que reglas globales del buscador hagan que
 * el icono se desplace verticalmente cuando los filtros
 * se acomodan en varias filas.
 */
.section-card
.filters-row.activity-filters-row
.transmission-search-box {
  overflow: visible !important;
}


.transmission-detail-modal {
  width: min(760px, calc(100vw - 28px));
}

.transmission-detail-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0 18px;
}

.transmission-detail-heading > .appointment-status-badge {
  margin-left: auto;
}

.transmission-detail-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
  font-size: 22px;
  flex: 0 0 48px;
}

.transmission-detail-heading h3,
.transmission-detail-heading p {
  margin: 0;
}

.transmission-detail-symptoms {
  margin-top: 10px;
}

.transmission-detail-extra-fields {
  margin-top: 12px;
}

.transmission-modal-footer {
  gap: 10px;
}

/* ============================================================
   ASIGNAR MECÁNICO
============================================================ */

.table-action-button.assign {
  color: var(--admin-purple, #7c3aed);
}

.table-action-button.assign:hover {
  border-color: rgba(124, 58, 237, 0.3);
  background: rgba(124, 58, 237, 0.08);
  color: var(--admin-purple, #7c3aed);
}

.appointment-proposal-pending {
  display: block;
  margin-top: 5px;
  color: var(--admin-warning);
  font-size: 9px;
}

.appointment-reschedule-modal {
  width: min(520px, calc(100vw - 28px));
  padding: 22px;
  border: 1px solid var(--admin-border);
  border-radius: 15px;
  background: var(--admin-card);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.25);
}

.appointment-reschedule-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.appointment-reschedule-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
  font-size: 18px;
}

.appointment-reschedule-heading > div:nth-child(2) {
  min-width: 0;
  flex: 1;
}

.appointment-reschedule-heading span {
  color: var(--admin-primary);
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.appointment-reschedule-heading h3 {
  margin: 4px 0;
  color: var(--admin-text);
  font-size: 16px;
}

.appointment-reschedule-heading p {
  margin: 0;
  color: var(--admin-text-secondary);
  font-size: 10px;
  line-height: 1.5;
}

.appointment-reschedule-heading > button {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: var(--admin-card);
  color: var(--admin-text-secondary);
}

.appointment-reschedule-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0;
}

.appointment-reschedule-fields label {
  display: grid;
  gap: 6px;
  color: var(--admin-text-secondary);
  font-size: 10px;
}

.appointment-reschedule-fields input {
  width: 100%;
  min-width: 0;
  min-height: 38px;
  padding: 7px 9px;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: var(--admin-card);
  color: var(--admin-text);
  font: inherit;
}

.appointment-reschedule-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.appointment-reschedule-actions button:disabled,
.appointment-reschedule-heading button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.assign-mechanic-modal {
  width: min(560px, calc(100vw - 28px));
}

@media (max-width: 560px) {
  .appointment-reschedule-fields {
    grid-template-columns: 1fr;
  }

  .appointment-reschedule-actions {
    flex-wrap: wrap;
  }
}

.assign-mechanic-appointment {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  background: var(--admin-secondary);
}

.assign-mechanic-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
  text-align: center;
  min-width: 62px;
}

.assign-mechanic-date strong {
  font-size: 18px;
  line-height: 1;
}

.assign-mechanic-date span {
  font-size: 11px;
  opacity: 0.85;
}

.assign-mechanic-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assign-mechanic-option {
  display: grid;
  grid-template-columns: 22px 40px minmax(0, 1fr) 22px;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  background: var(--admin-card);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.assign-mechanic-option:hover {
  border-color: rgba(37, 99, 235, 0.3);
  background: var(--admin-secondary);
}

.assign-mechanic-option.selected {
  border-color: var(--admin-primary);
  background: var(--admin-primary-soft);
}

.assign-mechanic-option input {
  display: none;
}

.assign-mechanic-option-avatar {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
  font-weight: 700;
  font-size: 14px;
}

.assign-mechanic-option-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.assign-mechanic-option-info strong {
  color: var(--admin-text);
  font-size: 14px;
}

.assign-mechanic-option-info span {
  color: var(--admin-text-secondary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assign-mechanic-option-check {
  color: transparent;
  font-size: 18px;
  transition: color 0.15s ease;
}

.assign-mechanic-option.selected .assign-mechanic-option-check {
  color: var(--admin-primary);
}

@media (max-width: 768px) {
  .transmission-detail-heading {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .transmission-detail-heading > .appointment-status-badge {
    margin-left: 0;
  }

  .assign-mechanic-option {
    grid-template-columns: 18px 36px minmax(0, 1fr) 20px;
    gap: 10px;
    padding: 10px 12px;
  }

  .assign-mechanic-option-avatar {
    width: 36px;
    height: 36px;
    font-size: 12px;
  }
}
</style>