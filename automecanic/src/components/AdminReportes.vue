Código completo corregido · Vue
Código completo copiado.
<template>
  <div>
    <!-- ======================================================
         MENSAJES
    ======================================================= -->

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

    <!-- ======================================================
         CABECERA
    ======================================================= -->

    <section class="admin-page-header">
      <div>
        <span class="admin-page-eyebrow">
          AUTOMECANIC
        </span>

        <h1>
          Reportes
        </h1>

        <p>
          Generación y exportación de reportes
        </p>
      </div>
    </section>

    <!-- ======================================================
         FILTROS
    ======================================================= -->

    <section class="admin-card report-filter-card">
      <div class="report-filter-heading">
        <div>
          <h2>
            Generar reporte
          </h2>

          <p>
            Selecciona el tipo de reporte y el periodo que deseas consultar.
          </p>
        </div>
      </div>

      <!-- TIPO DE REPORTE -->

      <div class="report-type-selector">
        <button
          type="button"
          class="report-type-option"
          :class="{ active: reportType === 'servicios' }"
          :disabled="loading || exporting"
          @click="changeReportType('servicios')"
        >
          <div class="report-type-option-icon">
            <i class="bi bi-tools"></i>
          </div>

          <div>
            <strong>
              Reporte mensual de servicios
            </strong>

            <span>
              Servicios realizados durante un mes.
            </span>
          </div>

          <i
            v-if="reportType === 'servicios'"
            class="bi bi-check-circle-fill report-type-check"
          ></i>
        </button>

        <button
          type="button"
          class="report-type-option"
          :class="{ active: reportType === 'llantas' }"
          :disabled="loading || exporting"
          @click="changeReportType('llantas')"
        >
          <div class="report-type-option-icon">
            <i class="bi bi-record-circle"></i>
          </div>

          <div>
            <strong>
              Reporte de inspección de llantas
            </strong>

            <span>
              Estado técnico y desgaste de las llantas.
            </span>
          </div>

          <i
            v-if="reportType === 'llantas'"
            class="bi bi-check-circle-fill report-type-check"
          ></i>
        </button>
      </div>

      <!-- ====================================================
           REPORTE DE SERVICIOS
      ===================================================== -->

      <div
        v-if="reportType === 'servicios'"
        class="report-filter-grid"
      >
        <div class="report-filter-field">
          <label for="report-month">
            Mes
          </label>

          <select
            id="report-month"
            v-model="filters.mes"
            :disabled="loading || exporting"
          >
            <option value="">
              Selecciona un mes
            </option>

            <option
              v-for="month in months"
              :key="month.value"
              :value="month.value"
            >
              {{ month.label }}
            </option>
          </select>
        </div>

        <div class="report-filter-field">
          <label for="report-year">
            Año
          </label>

          <input
            id="report-year"
            v-model="filters.anio"
            :disabled="loading || exporting"
            type="number"
            min="1900"
            step="1"
            inputmode="numeric"
            placeholder="Ej. 2026"
          >
        </div>
      </div>

      <!-- ====================================================
           REPORTE DE LLANTAS
      ===================================================== -->

      <div
        v-else
        class="report-filter-grid"
      >
        <div class="report-filter-field">
          <label for="report-tire-month">
            Mes
          </label>

          <select
            id="report-tire-month"
            v-model="filters.mes"
            :disabled="loading || exporting"
          >
            <option value="">
              Selecciona un mes
            </option>

            <option
              v-for="month in months"
              :key="month.value"
              :value="month.value"
            >
              {{ month.label }}
            </option>
          </select>
        </div>

        <div class="report-filter-field">
          <label for="report-tire-year">
            Año
          </label>

          <input
            id="report-tire-year"
            v-model="filters.anio"
            :disabled="loading || exporting"
            type="number"
            min="1900"
            step="1"
            inputmode="numeric"
            placeholder="Ej. 2026"
          >
        </div>
      </div>

      <div
        v-if="mechanicMode"
        class="report-filter-grid mechanic-report-unit-filters"
      >
        <div class="report-filter-field">
          <label for="mechanic-report-client">Cliente</label>
          <select
            id="mechanic-report-client"
            v-model="selectedClientId"
            :disabled="vehiclesLoading || loading || exporting"
            required
          >
            <option value="">Selecciona un cliente</option>
            <option
              v-for="client in availableClients"
              :key="client.id_cliente"
              :value="String(client.id_cliente)"
            >
              {{ getReportClientName(client) }}
            </option>
          </select>
        </div>

        <div class="report-filter-field">
          <label for="mechanic-report-vehicle">Unidad</label>
          <select
            id="mechanic-report-vehicle"
            v-model="selectedVehicleId"
            :disabled="!selectedClientId || loading || exporting"
            required
          >
            <option value="">Selecciona una unidad</option>
            <option
              v-for="vehicle in clientVehicles"
              :key="vehicle.id_vehiculo"
              :value="String(vehicle.id_vehiculo)"
            >
              {{ formatVehicleLabel(vehicle) }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="mechanicMode" class="mechanic-report-general-actions">
        <div class="mechanic-report-general-copy">
          <strong>Reportes generales del periodo</strong>
          <span>Incluyen todos los clientes y unidades asignados a tu cuenta.</span>
        </div>
        <div class="mechanic-report-general-buttons">
          <button
            type="button"
            :disabled="loading || exporting || vehiclesLoading"
            @click="generateMechanicGeneralReport('servicios')"
          >
            <i
              class="bi"
              :class="generatingGeneralReportType === 'servicios'
                ? 'bi-arrow-repeat mechanic-report-spin'
                : 'bi-tools'"
            ></i>
            {{ generatingGeneralReportType === 'servicios'
              ? 'Generando...'
              : 'Generar reporte mensual de servicios' }}
          </button>
          <button
            type="button"
            :disabled="loading || exporting || vehiclesLoading"
            @click="generateMechanicGeneralReport('llantas')"
          >
            <i
              class="bi"
              :class="generatingGeneralReportType === 'llantas'
                ? 'bi-arrow-repeat mechanic-report-spin'
                : 'bi-record-circle'"
            ></i>
            {{ generatingGeneralReportType === 'llantas'
              ? 'Generando...'
              : 'Generar reporte mensual de llantas' }}
          </button>
        </div>
      </div>

      <div v-if="!mechanicMode" class="report-vehicle-filter">
        <div class="report-filter-field">
          <label id="report-vehicle-label">
            Vehículos incluidos
          </label>

          <div
            ref="vehicleCombobox"
            class="report-vehicle-combobox"
          >
            <button
              type="button"
              class="report-vehicle-trigger"
              aria-haspopup="dialog"
              aria-controls="report-vehicle-popup"
              aria-labelledby="report-vehicle-label"
              :aria-expanded="vehicleDropdownOpen"
              :disabled="vehiclesLoading || loading || exporting"
              @click="vehicleDropdownOpen = !vehicleDropdownOpen"
              @keydown.esc.stop="vehicleDropdownOpen = false"
            >
              <span class="report-vehicle-trigger-copy">
                <strong>{{ vehicleSelectionLabel }}</strong>
                <small>
                  {{ filters.vehicleScope === 'todos'
                    ? 'Incluye todos los vehículos'
                    : `${filters.vehicleIds.length} seleccionado(s) · clic para editar` }}
                </small>
              </span>
              <i
                class="bi bi-chevron-down report-vehicle-chevron"
                :class="{ expanded: vehicleDropdownOpen }"
                aria-hidden="true"
              ></i>
            </button>

            <div
              v-if="vehicleDropdownOpen"
              id="report-vehicle-popup"
              class="report-vehicle-menu"
              role="dialog"
              aria-label="Seleccionar vehículos para el reporte"
              @keydown.esc.stop="vehicleDropdownOpen = false"
            >
              <button
                type="button"
                class="report-vehicle-all-option"
                :aria-pressed="filters.vehicleScope === 'todos'"
                :disabled="loading || exporting"
                @click="selectAllVehicles"
              >
                <i
                  :class="filters.vehicleScope === 'todos'
                    ? 'bi bi-check-circle-fill'
                    : 'bi bi-circle'"
                  aria-hidden="true"
                ></i>
                <span>
                  <strong>Todos los vehículos</strong>
                  <small>Generar el reporte general</small>
                </span>
              </button>

              <div class="report-vehicle-search">
                <i class="bi bi-search" aria-hidden="true"></i>
                <input
                  v-model="vehicleSearch"
                  type="search"
                  :disabled="loading || exporting"
                  placeholder="Buscar por número, placas o modelo"
                  aria-label="Buscar vehículos"
                  @keydown.esc.stop="vehicleDropdownOpen = false"
                >
              </div>

              <p class="report-vehicle-hint">
                {{ availableVehicles.length
                  ? 'Selecciona uno o varios vehículos'
                  : 'No hay vehículos disponibles para seleccionar.' }}
              </p>

              <div
                id="report-vehicle-listbox"
                class="report-vehicle-options"
                role="listbox"
                aria-multiselectable="true"
                aria-label="Vehículos disponibles"
              >
                <button
                  v-for="vehicle in filteredVehicles"
                  :key="vehicle.id_vehiculo"
                  type="button"
                  class="report-vehicle-option"
                  role="option"
                  :disabled="loading || exporting"
                  :aria-selected="isVehicleSelected(vehicle.id_vehiculo)"
                  @click="toggleVehicleSelection(vehicle.id_vehiculo)"
                >
                  <i
                    :class="isVehicleSelected(vehicle.id_vehiculo)
                      ? 'bi bi-check-square-fill'
                      : 'bi bi-square'"
                    aria-hidden="true"
                  ></i>
                  <span>{{ formatVehicleLabel(vehicle) }}</span>
                </button>
                <p
                  v-if="availableVehicles.length && !filteredVehicles.length"
                  class="report-vehicle-no-results"
                >
                  No se encontraron vehículos con esa búsqueda.
                </p>
              </div>

              <div class="report-vehicle-menu-footer">
                <span>
                  {{ filters.vehicleIds.length }} seleccionados
                </span>
                <button
                  type="button"
                  class="report-vehicle-done"
                  @click="vehicleDropdownOpen = false"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div class="report-direct-actions">
        <div class="report-direct-copy">
          <span class="report-direct-icon">
            <i class="bi bi-lightning-charge"></i>
          </span>
          <span class="report-direct-description">
            <strong>Exportación directa</strong>
            <small>Genera el archivo sin abrir la vista previa</small>
          </span>
        </div>

        <div class="report-direct-controls">
          <button
            type="button"
            class="report-direct-action"
            :disabled="loading || exporting"
            @click="generateReport({ preview: false, exportFormat: 'pdf' })"
          >
            <i class="bi bi-file-earmark-pdf"></i>
            Descargar PDF
          </button>
          <button
            type="button"
            class="report-direct-action"
            :disabled="loading || exporting"
            @click="generateReport({ preview: false, exportFormat: 'word' })"
          >
            <i class="bi bi-file-earmark-word"></i>
            Descargar Word
          </button>
          <button
            type="button"
            class="report-direct-action"
            :disabled="loading || exporting"
            @click="generateReport({ preview: false, exportFormat: 'print' })"
          >
            <i class="bi bi-printer"></i>
            Imprimir
          </button>
        </div>
      </div>
    </section>

    <!-- ======================================================
         HISTORIAL DE REPORTES
    ======================================================= -->
    <section class="admin-card report-history-card">
      <div class="report-history-heading">
        <div>
          <span class="report-history-eyebrow">REGISTRO</span>
          <h2>Historial de reportes</h2>
          <p>Busca reportes por el mes y año del periodo.</p>
        </div>
        <button type="button" class="report-history-refresh" :disabled="historyLoading" @click="loadReportHistory">
          <i class="bi bi-arrow-clockwise"></i>
          Actualizar
        </button>
      </div>

      <div v-if="historyLoading" class="report-history-state">
        <span class="spinner-border spinner-border-sm"></span> Cargando historial...
      </div>

      <div v-else-if="!reportHistory.length" class="report-history-state">
        <i class="bi bi-clock-history"></i>
        Todavía no hay reportes guardados.
      </div>

      <div v-else class="report-history-search">
        <div class="report-history-search-controls">
          <div class="report-history-field">
            <label for="report-history-type">Tipo de reporte</label>
            <select
              id="report-history-type"
              v-model="reportHistorySearchType"
              aria-label="Tipo de reporte"
            >
              <option value="servicios">Reporte mensual de servicios</option>
              <option value="llantas">Reporte de inspección de llantas</option>
            </select>
          </div>

          <div class="report-history-field">
            <label for="report-history-period">Periodo (mes y año)</label>
            <input
              id="report-history-period"
              v-model="reportHistorySearchPeriod"
              type="month"
              :disabled="historyLoading"
            />
          </div>

          <button
            type="button"
            class="report-history-view"
            :disabled="!selectedHistoryReport || historyLoading"
            @click="viewHistoryReport(selectedHistoryReport)"
          >
            <i class="bi bi-eye"></i>
            Ver reporte
          </button>
        </div>

        <p v-if="!reportHistorySearchPeriod" class="report-history-search-hint">
          Selecciona un mes y año para buscar entre los reportes guardados.
        </p>
        <p
          v-else-if="!selectedHistoryReport"
          class="report-history-search-hint"
          role="status"
        >
          No hay reportes guardados para ese periodo.
        </p>
        <p v-else class="report-history-search-hint">
          Se abrirá el reporte más reciente:
          {{ selectedHistoryReport.tipo_reporte === 'servicios' ? 'Servicios' : 'Inspección de llantas' }}
          · {{ selectedHistoryReport.periodo || `${selectedHistoryReport.mes}/${selectedHistoryReport.anio}` }}
          · {{ getReportHistoryScope(selectedHistoryReport) }}
        </p>
      </div>
    </section>


    <!-- ======================================================
         SIN REPORTE
    ======================================================= -->

    <section
      v-if="!report && !loading"
      class="admin-card report-empty-state"
    >
      <div class="report-empty-icon">
        <i class="bi bi-file-earmark-text"></i>
      </div>

      <h2>
        Aún no se ha generado un reporte
      </h2>

      <p>
        {{
          reportType === 'servicios'
            ? 'Selecciona el mes y año para consultar los servicios realizados.'
            : 'Selecciona el mes y año para consultar las inspecciones de llantas.'
        }}
      </p>
    </section>

    <!-- ======================================================
         CARGANDO
    ======================================================= -->

    <section
      v-if="loading"
      class="admin-card report-empty-state"
    >
      <div class="report-loading-spinner">
        <span class="spinner-border"></span>
      </div>

      <h2>
        Generando reporte
      </h2>

      <p>
        Consultando la información registrada en Automecanic.
      </p>
    </section>

    <!-- ======================================================
         REPORTE GENERADO
    ======================================================= -->

    <template     v-if="report && (!loading || directExportMode)">

      <!-- ====================================================
           DOCUMENTO
      ===================================================== -->

      <section
        id="report-preview-section"
        ref="reportPreviewShell"
        class="report-preview-shell report-print-source"
        :style="{
          '--report-preview-scale': reportPreviewScale,
          visibility: directExportMode ? 'hidden' : 'visible',
          position: directExportMode ? 'fixed' : '',
          left: directExportMode ? '-20000px' : '',
          top: directExportMode ? '0' : '',
          zIndex: directExportMode ? '-1' : '',
          pointerEvents: directExportMode ? 'none' : ''
        }"
      >
        <div
          id="report-print-area"
          ref="reportPrintArea"
          class="report-document report-reference-sheet"
          :class="{ 'report-document-landscape': pageOrientation === 'landscape' }"
        >
          <header class="reference-header">
            <div class="reference-brand">
              <img class="reference-logo" src="data:image/jpeg;base64,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" alt="Automecanic">
              <strong>TALLER AUTOMECANIC</strong>
              <span>Av. Escuintla Mz. 5 Lt. 1, Col. La Antorcha.</span>
              <span>Tapachula, Chiapas, México.</span>
              <span>CP. 30798 &nbsp;&nbsp; Tel: 9621929566</span>
              <span>Automecanic.tap@gmail.com</span>
              <span>RFC: MALR941014FI5</span>
            </div>

            <div class="reference-header-right">
              <table class="reference-date-grid">
                <thead>
                  <tr><th>DIA</th><th>MES</th><th>AÑO</th></tr>
                </thead>
                <tbody>
                  <tr><td>{{ reportDay }}</td><td>{{ reportMonthName }}</td><td>{{ reportYear }}</td></tr>
                </tbody>
              </table>

              <div class="reference-author-line">
                <strong>REALIZÓ:</strong>
                <span>{{ reportAuthor }}</span>
              </div>
            </div>
          </header>

          <!-- REPORTE MENSUAL DE SERVICIOS -->
          <template v-if="reportType === 'servicios'">
            <section class="reference-summary-grid service-summary-layout">
              <div class="reference-chart-box">
                <h3>SERVICIOS REALIZADOS TOTALES</h3>
                <div class="service-bars">
                  <div class="service-bar-row">
                    <span>MOTOR</span>
                    <div><i :style="{ width: `${getServicePercentage(serviceSummary.motor)}%` }"></i></div>
                    <b>{{ serviceSummary.motor }}</b>
                  </div>
                  <div class="service-bar-row">
                    <span>TRANSMISIÓN</span>
                    <div><i :style="{ width: `${getServicePercentage(serviceSummary.transmission)}%` }"></i></div>
                    <b>{{ serviceSummary.transmission }}</b>
                  </div>
                  <div class="service-bar-row">
                    <span>LLANTAS</span>
                    <div><i :style="{ width: `${getServicePercentage(serviceSummary.tires)}%` }"></i></div>
                    <b>{{ serviceSummary.tires }}</b>
                  </div>
                </div>
              </div>

              <div class="reference-summary-right">
                <div class="reference-service-circles">
                  <article><span class="circle motor">M</span><strong>MOTOR</strong><b>{{ serviceSummary.motor }}</b></article>
                  <article><span class="circle transmission">T</span><strong>TRANSMISIÓN</strong><b>{{ serviceSummary.transmission }}</b></article>
                  <article><span class="circle tires">L</span><strong>LLANTAS</strong><b>{{ serviceSummary.tires }}</b></article>
                </div>

                <table class="reference-total-table">
                  <thead><tr><th>TIPO DE SERVICIO</th><th>TOTAL</th></tr></thead>
                  <tbody>
                    <tr><td>MOTOR</td><td>{{ serviceSummary.motor }}</td></tr>
                    <tr><td>TRANSMISIÓN</td><td>{{ serviceSummary.transmission }}</td></tr>
                    <tr><td>INSPECCIÓN DE LLANTAS</td><td>{{ serviceSummary.tires }}</td></tr>
                    <tr class="total"><td>TOTAL DE REGISTROS</td><td>{{ serviceSummary.total }}</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <div class="reference-report-title">REPORTE MENSUAL DE SERVICIOS</div>

            <div v-if="serviceRows.length" class="reference-service-list">
              <article v-for="service in serviceRows" :key="`srv-${service.id_servicio}`" class="reference-service-block">
                <table class="reference-service-table">
                  <tbody>
                    <tr>
                      <th>NO. ECONÓMICO</th><td>{{ service.vehiculo?.no_economico || '—' }}</td>
                      <th>FECHA</th><td>{{ formatDate(service.fecha_servicio) }}</td>
                      <th>PLACAS</th><td>{{ service.vehiculo?.placas || '—' }}</td>
                    </tr>
                    <tr>
                      <th>VEHÍCULO</th><td colspan="3">{{ getVehicleText(service.vehiculo) }}</td>
                      <th>KILOMETRAJE</th><td>{{ formatMileage(service.kilometraje) }}</td>
                    </tr>
                    <tr>
                      <th>MECÁNICO</th><td colspan="2">{{ getMechanicName(service.mecanico) }}</td>
                      <th>TIPO DE SERVICIO</th><td colspan="2">{{ getServiceTypeText(service) }}</td>
                    </tr>
                    <tr>
                      <th>OBSERVACIONES</th><td colspan="5">{{ service.observaciones_generales || 'Sin observaciones.' }}</td>
                    </tr>
                  </tbody>
                </table>

                <div class="reference-service-details" v-if="service.motor || service.transmision">
                  <table v-if="service.motor" class="reference-detail-table">
                    <thead><tr><th colspan="2">SERVICIO DE MOTOR</th></tr></thead>
                    <tbody>
                      <tr><th>Aceite de motor</th><td>{{ formatBooleanService(service.motor.aceite_motor) }}</td></tr>
                      <tr><th>Filtro de aceite</th><td>{{ formatBooleanService(service.motor.filtro_aceite) }}</td></tr>
                      <tr><th>Filtro de aire</th><td>{{ formatBooleanService(service.motor.filtro_aire) }}</td></tr>
                      <tr><th>Filtro diésel primario</th><td>{{ formatBooleanService(service.motor.filtro_diesel_primario) }}</td></tr>
                      <tr><th>Filtro diésel auxiliar</th><td>{{ formatBooleanService(service.motor.filtro_diesel_auxiliar) }}</td></tr>
                      <tr><th>Filtro de cabina</th><td>{{ formatBooleanService(service.motor.filtro_cabina) }}</td></tr>
                      <tr><th>Bujías</th><td>{{ formatBooleanService(service.motor.bujias) }}</td></tr>
                      <tr><th>Filtro de gasolina</th><td>{{ formatBooleanService(service.motor.filtro_de_gasolina) }}</td></tr>
                    </tbody>
                  </table>

                  <table v-if="service.transmision" class="reference-detail-table">
                    <thead><tr><th colspan="2">SERVICIO DE TRANSMISIÓN</th></tr></thead>
                    <tbody>
                      <tr><th>Tipo de transmisión</th><td>{{ service.transmision.tipo_transmision || '—' }}</td></tr>
                      <tr><th>Aceite de transmisión</th><td>{{ formatBooleanService(service.transmision.aceite_transmision) }}</td></tr>
                      <tr><th>Filtro de aceite</th><td>{{ formatBooleanService(service.transmision.filtro_de_aceite) }}</td></tr>
                      <tr><th>Junta de cárter</th><td>{{ formatBooleanService(service.transmision.junta_de_carter) }}</td></tr>
                      <tr><th>Color del aceite</th><td>{{ service.transmision.color_del_aceite || '—' }}</td></tr>
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
            <div v-else class="reference-empty">No existen servicios registrados durante el periodo seleccionado.</div>
          </template>

          <!-- REPORTE DE INSPECCIÓN DE LLANTAS -->
          <template v-else>
            <section class="reference-summary-grid">
              <div class="reference-chart-box tire-chart-reference">
                <h3>CONDICIONES DE LLANTAS TOTALES</h3>
                <div class="reference-tire-chart">
                  <div class="chart-group">
                    <span>TRACCIÓN “LT”</span>
                    <div class="chart-lines">
                      <i class="bad" :style="{ width: `${getTireCategoryWidth('traction','bad')}%` }"></i>
                      <i class="regular" :style="{ width: `${getTireCategoryWidth('traction','regular')}%` }"></i>
                      <i class="good" :style="{ width: `${getTireCategoryWidth('traction','good')}%` }"></i>
                    </div>
                  </div>
                  <div class="chart-group">
                    <span>COMERCIAL “C”</span>
                    <div class="chart-lines">
                      <i class="bad" :style="{ width: `${getTireCategoryWidth('commercial','bad')}%` }"></i>
                      <i class="regular" :style="{ width: `${getTireCategoryWidth('commercial','regular')}%` }"></i>
                      <i class="good" :style="{ width: `${getTireCategoryWidth('commercial','good')}%` }"></i>
                    </div>
                  </div>
                </div>
                <div class="chart-legend"><span class="bad"></span>SEMÁFORO MAL <span class="regular"></span>SEMÁFORO REGULAR <span class="good"></span>SEMÁFORO BIEN</div>
              </div>

              <div class="reference-summary-right">
                <div class="reference-semaphore">
                  <article class="good"><span></span><small>&gt; 8mm</small><b>Buen Estado</b></article>
                  <article class="regular"><span></span><small>&gt; 3 a 8mm &lt;</small><b>Regular</b></article>
                  <article class="bad"><span></span><small>3mm &lt;</small><b>Cambio</b></article>
                </div>

                <table class="reference-total-table tire-total-reference">
                  <thead><tr><th colspan="5">INFORME DE LLANTAS TOTALES</th></tr><tr><th>SEMÁFORO</th><th>CONDICIÓN</th><th>COMERCIAL “C”</th><th>TRACCIÓN “LT”</th><th>TOTALES</th></tr></thead>
                  <tbody>
                    <tr><td class="state good"></td><td>BIEN</td><td>{{ tireCategorySummary.good.commercial }}</td><td>{{ tireCategorySummary.good.traction }}</td><td>{{ tireCategorySummary.good.total }}</td></tr>
                    <tr><td class="state regular"></td><td>REGULAR</td><td>{{ tireCategorySummary.regular.commercial }}</td><td>{{ tireCategorySummary.regular.traction }}</td><td>{{ tireCategorySummary.regular.total }}</td></tr>
                    <tr><td class="state bad"></td><td>MAL</td><td>{{ tireCategorySummary.bad.commercial }}</td><td>{{ tireCategorySummary.bad.traction }}</td><td>{{ tireCategorySummary.bad.total }}</td></tr>
                    <tr class="total"><td colspan="2">TOTAL</td><td>{{ tireCategorySummary.total.commercial }}</td><td>{{ tireCategorySummary.total.traction }}</td><td>{{ tireCategorySummary.total.all }}</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <div class="reference-tire-list" v-if="tireGroups.length">
              <article v-for="group in tireGroups" :key="group.key" class="reference-tire-block">
                <table class="reference-tire-table">
                  <thead>
                    <tr>
                      <th class="label-col">NO. ECONÓMICO</th>
                      <th :colspan="group.tires.length">POSICIÓN DE LLANTAS</th>
                      <th class="obs-col" rowspan="2">OBSERVACIONES</th>
                    </tr>
                    <tr>
                      <th>{{ group.economicNumber }}</th>
                      <th v-for="(tire,index) in group.tires" :key="`pos-${group.key}-${index}`">{{ tire.numero_llanta || tire.posicion || index + 1 }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><th>MARCA</th><td v-for="(tire,index) in group.tires" :key="`brand-${group.key}-${index}`">{{ tire.marca || '—' }}</td><td class="obs-cell" rowspan="5">{{ group.observations || '' }}</td></tr>
                    <tr><th>MEDIDA</th><td v-for="(tire,index) in group.tires" :key="`measure-${group.key}-${index}`">{{ tire.medida || '—' }}</td></tr>
                    <tr><th>PSI</th><td v-for="(tire,index) in group.tires" :key="`psi-${group.key}-${index}`">{{ tire.psi ?? '—' }}</td></tr>
                    <tr><th>DESGASTE MM</th><td v-for="(tire,index) in group.tires" :key="`wear-${group.key}-${index}`">{{ tire.desgaste_mm ?? '—' }}</td></tr>
                    <tr><th>CONDICIÓN</th><td v-for="(tire,index) in group.tires" :key="`condition-${group.key}-${index}`" class="condition-cell" :class="getTireConditionClass(tire.condicion)">{{ normalizeTireCondition(tire.condicion) }}</td></tr>
                  </tbody>
                </table>
              </article>
            </div>
            <div v-else class="reference-empty">No existen inspecciones de llantas para el periodo seleccionado.</div>
          </template>
        </div>
      </section>

    </template>


  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue'

import {
  obtenerReporte,
  obtenerVehiculosReporte,
  guardarReporteGenerado,
  obtenerHistorialReportes
} from '../services/reporteService.js'


import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

import {
  Document,
  ImageRun,
  PageOrientation,
  Packer,
  Paragraph
} from 'docx'


/* ============================================================
   ESTADO
============================================================ */

const props = defineProps({
  mechanicId: {
    type: [Number, String],
    default: null
  },
  mechanic: {
    type: Object,
    default: null
  }
})

const mechanicMode = computed(() =>
  props.mechanicId !== null &&
  props.mechanicId !== undefined &&
  props.mechanicId !== ''
)

const reportType =
  ref('servicios')


const filters =
  ref({
    fecha: '',
    mes: '',
    anio:
      String(
        new Date()
          .getFullYear()
      ),
    vehicleScope: 'todos',
    vehicleIds: []
  })


const report =
  ref(null)

const directExportMode =
  ref(false)


const availableVehicles =
  ref([])

const selectedClientId = ref('')
const selectedVehicleId = ref('')
const mechanicGeneralReportMode = ref(false)
const generatingGeneralReportType = ref('')

const availableClients = computed(() => {
  const clientsById = new Map()

  availableVehicles.value.forEach(vehicle => {
    if (vehicle.cliente?.id_cliente) {
      clientsById.set(String(vehicle.cliente.id_cliente), vehicle.cliente)
    }
  })

  return [...clientsById.values()].sort((first, second) =>
    getReportClientName(first).localeCompare(getReportClientName(second), 'es-MX')
  )
})

const clientVehicles = computed(() =>
  availableVehicles.value.filter(vehicle =>
    String(vehicle.id_cliente) === selectedClientId.value
  )
)

watch(selectedClientId, () => {
  selectedVehicleId.value = ''
})

const vehicleDropdownOpen =
  ref(false)

const vehicleSearch =
  ref('')

const vehicleCombobox =
  ref(null)

const vehiclesLoading =
  ref(false)

const filteredVehicles =
  computed(() => {
    const search = vehicleSearch.value.trim().toLocaleLowerCase('es-MX')

    if (!search) {
      return availableVehicles.value
    }

    return availableVehicles.value.filter(vehicle =>
      formatVehicleLabel(vehicle)
        .toLocaleLowerCase('es-MX')
        .includes(search)
    )
  })

const vehicleSelectionLabel =
  computed(() => {
    if (filters.value.vehicleScope === 'todos') {
      return 'Todos los vehículos'
    }

    const selectedCount = filters.value.vehicleIds.length

    if (selectedCount === 0) {
      return 'Selecciona vehículos'
    }

    if (selectedCount === 1) {
      const selectedVehicle = availableVehicles.value.find(
        vehicle =>
          String(vehicle.id_vehiculo) ===
          String(filters.value.vehicleIds[0])
      )

      return selectedVehicle
        ? formatVehicleLabel(selectedVehicle)
        : '1 vehículo seleccionado'
    }

    return `${selectedCount} vehículos seleccionados`
  })

const isVehicleSelected =
  id => filters.value.vehicleIds.some(
    selectedId => String(selectedId) === String(id)
  )

const selectAllVehicles =
  () => {
    filters.value.vehicleScope = 'todos'
    filters.value.vehicleIds = []
    vehicleDropdownOpen.value = false
    vehicleSearch.value = ''
  }

const toggleVehicleSelection =
  id => {
    const currentIds = filters.value.vehicleIds
    const alreadySelected = isVehicleSelected(id)

    filters.value.vehicleIds = alreadySelected
      ? currentIds.filter(selectedId => String(selectedId) !== String(id))
      : [...currentIds, id]
    filters.value.vehicleScope = 'seleccionados'
  }


const loading =
  ref(false)


const exporting =
  ref(false)


const errorMessage =
  ref('')


const successMessage =
  ref('')


const reportHistory =
  ref([])

const reportHistorySearchPeriod =
  ref('')

const reportHistorySearchType =
  ref('servicios')

const matchingHistoryReports =
  computed(() => {
    if (!reportHistorySearchPeriod.value) return []

    const [year, month] = reportHistorySearchPeriod.value.split('-')

    return reportHistory.value.filter(item =>
      item.tipo_reporte === reportHistorySearchType.value &&
      String(item.anio) === year &&
      String(item.mes).padStart(2, '0') === month
    )
  })

const selectedHistoryReport =
  computed(() => matchingHistoryReports.value[0] || null)

const historyLoading =
  ref(false)


const pageOrientation =
  ref('portrait')

const reportPreviewShell =
  ref(null)

const reportPreviewScale =
  ref(1)

let reportPreviewResizeObserver = null
let reportPreviewScaleFrame = 0

const updateReportPreviewScale = () => {
  const shell = reportPreviewShell.value

  if (!shell || !report.value) {
    reportPreviewScale.value = 1
    return
  }

  const shellStyle = window.getComputedStyle(shell)
  const horizontalPadding =
    parseFloat(shellStyle.paddingLeft) +
    parseFloat(shellStyle.paddingRight)
  const availableWidth = Math.max(
    0,
    shell.clientWidth - horizontalPadding
  )
  const pageWidth =
    pageOrientation.value === 'landscape'
      ? 1056
      : 816

  reportPreviewScale.value = Math.min(
    1,
    availableWidth / pageWidth
  )
}

const scheduleReportPreviewScaleUpdate = () => {
  if (reportPreviewScaleFrame) {
    window.cancelAnimationFrame(reportPreviewScaleFrame)
  }

  reportPreviewScaleFrame =
    window.requestAnimationFrame(() => {
      reportPreviewScaleFrame = 0
      updateReportPreviewScale()
    })
}

watch(
  [report, pageOrientation],
  async () => {
    await nextTick()
    await new Promise(resolve =>
      window.requestAnimationFrame(resolve)
    )
    updateReportPreviewScale()

    if (reportPreviewResizeObserver && reportPreviewShell.value) {
      reportPreviewResizeObserver.disconnect()
      reportPreviewResizeObserver.observe(reportPreviewShell.value)
    }
  },
  { flush: 'post' }
)

onMounted(() => {
  window.addEventListener('resize', scheduleReportPreviewScaleUpdate, { passive: true })
  window.visualViewport?.addEventListener(
    'resize',
    scheduleReportPreviewScaleUpdate,
    { passive: true }
  )
  document.addEventListener('click', closeVehicleDropdownOnOutsideClick)

  if ('ResizeObserver' in window) {
    reportPreviewResizeObserver =
      new ResizeObserver(scheduleReportPreviewScaleUpdate)

    if (reportPreviewShell.value) {
      reportPreviewResizeObserver.observe(reportPreviewShell.value)
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', scheduleReportPreviewScaleUpdate)
  window.visualViewport?.removeEventListener(
    'resize',
    scheduleReportPreviewScaleUpdate
  )
  if (reportPreviewScaleFrame) {
    window.cancelAnimationFrame(reportPreviewScaleFrame)
  }
  document.removeEventListener('click', closeVehicleDropdownOnOutsideClick)
  reportPreviewResizeObserver?.disconnect()
})

const closeVehicleDropdownOnOutsideClick =
  event => {
    if (
      vehicleDropdownOpen.value &&
      !vehicleCombobox.value?.contains(event.target)
    ) {
      vehicleDropdownOpen.value = false
    }
  }


/* ============================================================
   MESES / AÑOS
============================================================ */

const months = [
  {
    value: '1',
    label: 'Enero'
  },
  {
    value: '2',
    label: 'Febrero'
  },
  {
    value: '3',
    label: 'Marzo'
  },
  {
    value: '4',
    label: 'Abril'
  },
  {
    value: '5',
    label: 'Mayo'
  },
  {
    value: '6',
    label: 'Junio'
  },
  {
    value: '7',
    label: 'Julio'
  },
  {
    value: '8',
    label: 'Agosto'
  },
  {
    value: '9',
    label: 'Septiembre'
  },
  {
    value: '10',
    label: 'Octubre'
  },
  {
    value: '11',
    label: 'Noviembre'
  },
  {
    value: '12',
    label: 'Diciembre'
  }
]


/* ============================================================
   INICIALIZACIÓN
============================================================ */

onMounted(
  async () => {
    await Promise.all([
      loadVehicles(),
      loadReportHistory()
    ])
  }
)


const loadVehicles =
  async () => {
    vehiclesLoading.value = true

    try {
      availableVehicles.value =
        await obtenerVehiculosReporte(
          mechanicMode.value
            ? props.mechanicId
            : null
        )
    } catch (error) {
      console.error(
        'Error cargando vehículos para reportes:',
        error
      )
      errorMessage.value =
        'No fue posible cargar los vehículos para generar reportes.'
    } finally {
      vehiclesLoading.value = false
    }
  }

const getReportClientName = client => {
  const user = client?.usuario
  const name = [
    user?.nombre,
    user?.apellido_paterno,
    user?.apellido_materno
  ].filter(Boolean).join(' ').trim()

  return name || `Cliente #${client?.id_cliente || ''}`
}

const formatVehicleLabel =
  vehicle => {
    const identity = [
      vehicle.no_economico
        ? `No. ${vehicle.no_economico}`
        : '',
      vehicle.placas,
      [vehicle.marca, vehicle.modelo]
        .filter(Boolean)
        .join(' ')
    ].filter(Boolean)

    return identity.join(' · ') ||
      `Vehículo ${vehicle.id_vehiculo}`
  }

const getReportHistoryScope = item => {
  if (!item.id_mecanico && !item.id_vehiculo) {
    return 'General'
  }

  const service = item.datos?.servicios?.[0]
  const mechanicUser =
    item.datos?.mecanicos?.[0]?.usuario ||
    service?.mecanico?.usuario
  const mechanicName = [
    mechanicUser?.nombre,
    mechanicUser?.apellido_paterno,
    mechanicUser?.apellido_materno
  ].filter(Boolean).join(' ').trim()
  const vehicleName = service?.vehiculo
    ? formatVehicleLabel(service.vehiculo)
    : item.id_vehiculo
      ? `Unidad #${item.id_vehiculo}`
      : ''

  return [
    mechanicName || (item.id_mecanico ? `Mecánico #${item.id_mecanico}` : ''),
    vehicleName
  ].filter(Boolean).join(' · ')
}


/* ============================================================
   HISTORIAL DE REPORTES
============================================================ */

const loadReportHistory =
  async () => {
    historyLoading.value = true

    try {
      reportHistory.value =
        await obtenerHistorialReportes(
          mechanicMode.value
            ? props.mechanicId
            : null
        )
    } catch (error) {
      console.error('Error cargando historial de reportes:', error)
      reportHistory.value = []
    } finally {
      historyLoading.value = false
    }
  }


const saveReportToHistory =
  async result => {
    try {
      await guardarReporteGenerado({
        tipoReporte: reportType.value,
        mes: Number(filters.value.mes),
        anio: Number(filters.value.anio),
        periodo: reportPeriodLabel.value,
        orientacion: pageOrientation.value,
        idMecanico: mechanicMode.value ? Number(props.mechanicId) : null,
        idVehiculo: mechanicMode.value && !mechanicGeneralReportMode.value && selectedVehicleId.value
          ? Number(selectedVehicleId.value)
          : null,
        datos: result
      })

      await loadReportHistory()
      return true
    } catch (error) {
      console.error('Error guardando reporte en historial:', error)
      return false
    }
  }


const viewHistoryReport =
  async item => {
    reportType.value = item.tipo_reporte
    filters.value.mes = String(item.mes ?? '')
    filters.value.anio = String(item.anio ?? '')
    filters.value.fecha = ''
    filters.value.vehicleScope =
      item.datos?.filtros?.vehicleScope ||
      (item.datos?.filtros?.idVehiculos?.length
        ? 'seleccionados'
        : 'todos')
    filters.value.vehicleIds =
      item.datos?.filtros?.vehicleIds ||
      item.datos?.filtros?.idVehiculos ||
      []
    pageOrientation.value = item.orientacion || 'portrait'
    report.value = item.datos || null
    errorMessage.value = ''
    successMessage.value = 'Reporte cargado desde el historial.'

    await nextTick()

    document
      .getElementById('report-preview-section')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }


const formatHistoryDate =
  value => {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return '—'

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }


/* ============================================================
   CAMBIAR TIPO DE REPORTE
============================================================ */

const changeReportType =
  type => {
    if (
      reportType.value ===
      type
    ) {
      return
    }


    reportType.value =
      type


    report.value =
      null


    errorMessage.value =
      ''


    successMessage.value =
      ''


    filters.value.fecha =
      ''


    filters.value.mes =
      ''


    filters.value.vehicleScope =
      'todos'
    filters.value.vehicleIds =
      []


    filters.value.anio =
      String(
        new Date()
          .getFullYear()
      )
  }


const clearMonthWhenDateSelected =
  () => {
    if (
      filters.value.fecha
    ) {
      filters.value.mes =
        ''
    }
  }


const clearDateWhenPeriodSelected =
  () => {
    if (
      filters.value.mes ||
      filters.value.anio
    ) {
      filters.value.fecha =
        ''
    }
  }

const generateMechanicGeneralReport =
  async type => {
    if (!mechanicMode.value || !['servicios', 'llantas'].includes(type)) {
      return
    }

    reportType.value = type
    filters.value.fecha = ''
    mechanicGeneralReportMode.value = true
    generatingGeneralReportType.value = type

    try {
      await generateReport()
    } finally {
      mechanicGeneralReportMode.value = false
      generatingGeneralReportType.value = ''
    }
  }


/* ============================================================
   GENERAR REPORTE
============================================================ */

const generateReport =
  async ({
    preview = true,
    exportFormat = null
  } = {}) => {
    errorMessage.value =
      ''


    successMessage.value =
      ''


    if (
      reportType.value ===
      'servicios'
    ) {
      if (
        !filters.value.mes ||
        !filters.value.anio
      ) {
        errorMessage.value =
          'Selecciona el mes y año del reporte mensual de servicios.'

        return
      }


      filters.value.fecha =
        ''


    }


    if (
      reportType.value ===
      'llantas'
    ) {
      if (
        !filters.value.mes ||
        !filters.value.anio
      ) {
        errorMessage.value =
          'Selecciona el mes y año del reporte de inspección de llantas.'

        return
      }

      filters.value.fecha =
        ''

    }

    const selectedVehicleIds =
      mechanicMode.value
        ? mechanicGeneralReportMode.value
          ? availableVehicles.value.map(vehicle => Number(vehicle.id_vehiculo))
          : (selectedVehicleId.value ? [Number(selectedVehicleId.value)] : [])
        : filters.value.vehicleScope === 'seleccionados'
          ? filters.value.vehicleIds
          : []

    if (mechanicMode.value && mechanicGeneralReportMode.value && !selectedVehicleIds.length) {
      errorMessage.value = 'No hay unidades asignadas para generar el reporte general.'
      return
    }

    if (mechanicMode.value && !mechanicGeneralReportMode.value && (!selectedClientId.value || !selectedVehicleIds.length)) {
      errorMessage.value = 'Selecciona el cliente y la unidad para generar un reporte individual.'
      return
    }

    if (
      filters.value.vehicleScope === 'seleccionados' &&
      selectedVehicleIds.length === 0
    ) {
      errorMessage.value =
        'Selecciona al menos un vehículo o cambia la opción a todos los vehículos.'
      return
    }


    const previousReport =
      report.value

    directExportMode.value =
      !preview

    loading.value =
      true

    if (preview) {
      report.value =
        null
    }

    let generatedReport = null

    try {
      const result =
        await obtenerReporte({
          fecha:
            filters.value.fecha,

          mes:
            filters.value.mes,

          anio:
            filters.value.anio,

          idMecanico: mechanicMode.value
            ? Number(props.mechanicId)
            : null,

          idVehiculos: selectedVehicleIds,
          vehicleScope: filters.value.vehicleScope,
          vehicleIds: selectedVehicleIds
        })

      generatedReport =
        result

      report.value =
        result


      const historySaved =
        await saveReportToHistory(result)

      if (preview) {
        successMessage.value =
          reportType.value ===
          'servicios'
            ? historySaved
              ? 'Reporte mensual de servicios generado y guardado en el historial.'
              : 'Reporte mensual de servicios generado correctamente.'
            : historySaved
              ? 'Reporte de inspección de llantas generado y guardado en el historial.'
              : 'Reporte de inspección de llantas generado correctamente.'
      }

    } catch (error) {
      console.error(
        'Error generando reporte:',
        error
      )


      errorMessage.value =
        error?.message ||
        'No fue posible generar el reporte.'
    }

    if (
      generatedReport &&
      !preview
    ) {
      await nextTick()
      await new Promise(resolve =>
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(resolve)
        )
      )

      try {
        if (exportFormat === 'pdf') {
          await exportPDF()
        } else if (exportFormat === 'word') {
          await exportWord()
        } else if (exportFormat === 'print') {
          await printReport()
        }

        if (!errorMessage.value) {
          successMessage.value =
            exportFormat === 'pdf'
              ? 'El reporte se generó y se preparó como PDF.'
              : exportFormat === 'word'
                ? 'El reporte se generó y se descargó como documento Word.'
                : isMobileDevice()
                  ? successMessage.value
                  : 'El reporte se generó y se envió a las opciones de impresión.'
        }
      } catch (error) {
        console.error('Error en la exportación directa del reporte:', error)
        errorMessage.value =
          error?.message ||
          'No fue posible completar la exportación directa del reporte.'
      } finally {
        report.value = previousReport
        directExportMode.value = false
        loading.value = false
      }
    } else {
      loading.value = false
      directExportMode.value = false
    }

    if (preview && report.value) {
      await nextTick()

      await new Promise(resolve =>
        window.requestAnimationFrame(resolve)
      )

      const reportPreview =
        document.getElementById('report-preview-section') ||
        document.getElementById('report-print-area')

      reportPreview?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }

  }


/* ============================================================
   COMPUTADOS
============================================================ */

const reportPeriodLabel =
  computed(
    () => {
      if (
        !report.value?.rango
      ) {
        return '—'
      }


      if (
        report.value.rango.tipo ===
        'fecha'
      ) {
        return formatDate(
          report.value.rango.desde
        )
      }


      if (
        report.value.rango.tipo ===
        'mes'
      ) {
        const month =
          months.find(
            item =>
              String(
                item.value
              ) ===
              String(
                filters.value.mes
              )
          )


        return (
          `${month?.label || ''} ` +
          `${filters.value.anio}`
        ).trim()
      }


      return (
        String(
          filters.value.anio ||
          ''
        ) ||
        '—'
      )
    }
  )



const reportDateObject =
  computed(
    () => new Date()
  )

const reportDay =
  computed(
    () => String(reportDateObject.value.getDate()).padStart(2, '0')
  )

const reportMonthName =
  computed(
    () => new Intl.DateTimeFormat('es-MX', { month: 'long' })
      .format(reportDateObject.value)
      .toUpperCase()
  )

const reportYear =
  computed(
    () => String(reportDateObject.value.getFullYear())
  )

const reportAuthor =
  computed(
    () => {
      if (!mechanicMode.value) {
        return 'RAMÓN MATEO DE LEÓN'
      }

      const mechanicUser =
        props.mechanic?.usuario ||
        report.value?.mecanicos?.[0]?.usuario ||
        report.value?.servicios?.[0]?.mecanico?.usuario
      const name = [
        mechanicUser?.nombre,
        mechanicUser?.apellido_paterno,
        mechanicUser?.apellido_materno
      ].filter(Boolean).join(' ').trim()

      return name || `Mecánico #${props.mechanicId}`
    }
  )

const currentReportDate =
  computed(
    () =>
      new Intl.DateTimeFormat(
        'es-MX',
        {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }
      ).format(
        new Date()
      )
  )


const serviceRows =
  computed(
    () =>
      report.value?.servicios ||
      []
  )


const allTires =
  computed(
    () =>
      serviceRows.value.flatMap(
        service =>
          (
            service.llantas ||
            []
          ).map(
            tire => ({
              ...tire,
              service
            })
          )
      )
  )


const tireSummary =
  computed(
    () => {
      let good =
        0


      let regular =
        0


      let bad =
        0


      allTires.value.forEach(
        tire => {
          const condition =
            normalizeTireCondition(
              tire.condicion
            )


          if (
            condition ===
            'BIEN'
          ) {
            good +=
              1
          } else if (
            condition ===
            'REGULAR'
          ) {
            regular +=
              1
          } else if (
            condition ===
            'MAL'
          ) {
            bad +=
              1
          }
        }
      )


      return {
        good,
        regular,
        bad,
        total:
          allTires.value.length
      }
    }
  )



const normalizeUnitType = value =>
  String(value || '')
    .trim()
    .toUpperCase()

const tireUnitSummary =
  computed(() => {
    const summary = {
      goodCommercial: 0,
      goodTraction: 0,
      regularCommercial: 0,
      regularTraction: 0,
      badCommercial: 0,
      badTraction: 0,
      totalCommercial: 0,
      totalTraction: 0
    }

    allTires.value.forEach(tire => {
      const condition = normalizeTireCondition(tire.condicion)
      const unit = normalizeUnitType(tire.tipo_unidad || tire.tipo_llanta?.tipo_unidad)
      const isTraction = unit.includes('LT') || unit.includes('TRAC')
      const suffix = isTraction ? 'Traction' : 'Commercial'

      if (condition === 'BIEN') summary[`good${suffix}`] += 1
      if (condition === 'REGULAR') summary[`regular${suffix}`] += 1
      if (condition === 'MAL') summary[`bad${suffix}`] += 1
      summary[`total${suffix}`] += 1
    })

    return summary
  })

const serviceSummary =
  computed(() => {
    let motor = 0
    let transmission = 0
    let tires = 0

    serviceRows.value.forEach(service => {
      if (service.motor) motor += 1
      if (service.transmision) transmission += 1
      if (Array.isArray(service.llantas) && service.llantas.length) tires += 1
    })

    return { motor, transmission, tires, total: serviceRows.value.length }
  })

const getServicePercentage = amount => {
  const max = Math.max(serviceSummary.value.motor, serviceSummary.value.transmission, serviceSummary.value.tires, 1)
  return Math.round((Number(amount || 0) / max) * 100)
}

const getTireCategory = tire => {
  const raw = String(tire?.tipo_unidad || tire?.tipo_llanta?.tipo_unidad || '').toUpperCase()
  if (raw.includes('LT') || raw.includes('TRACC')) return 'traction'
  return 'commercial'
}

const tireCategorySummary = computed(() => {
  const base = {
    good: { commercial: 0, traction: 0, total: 0 },
    regular: { commercial: 0, traction: 0, total: 0 },
    bad: { commercial: 0, traction: 0, total: 0 },
    total: { commercial: 0, traction: 0, all: 0 }
  }

  allTires.value.forEach(tire => {
    const state = normalizeTireCondition(tire.condicion)
    const category = getTireCategory(tire)
    const key = state === 'BIEN' ? 'good' : state === 'REGULAR' ? 'regular' : state === 'MAL' ? 'bad' : null
    if (!key) return
    base[key][category] += 1
    base[key].total += 1
    base.total[category] += 1
    base.total.all += 1
  })

  return base
})

const getTireCategoryWidth = (category, state) => {
  const values = [
    tireCategorySummary.value.good[category],
    tireCategorySummary.value.regular[category],
    tireCategorySummary.value.bad[category]
  ]
  const max = Math.max(...values, 1)
  return Math.round((Number(tireCategorySummary.value[state][category] || 0) / max) * 100)
}

const tireGroups =
  computed(
    () =>
      serviceRows.value
        .filter(
          service =>
            Array.isArray(
              service.llantas
            ) &&
            service.llantas.length >
              0
        )
        .map(
          service => ({
            key:
              service.id_servicio,

            economicNumber:
              service.vehiculo
                ?.no_economico ||
              '—',

            inspectionDate:
              service.fecha_servicio,

            observations:
              service
                .observaciones_generales ||
              '',

            vehicle:
              service.vehiculo,

            mechanic:
              service.mecanico,

            tires:
              service.llantas
          })
        )
  )


const hasReportData =
  computed(
    () => {
      if (
        reportType.value ===
        'servicios'
      ) {
        return (
          serviceRows.value.length >
          0
        )
      }


      return (
        allTires.value.length >
        0
      )
    }
  )


const noDataMessage =
  computed(
    () =>
      reportType.value ===
      'servicios'
        ? 'No existen servicios registrados durante el periodo seleccionado.'
        : 'No existen inspecciones de llantas para el periodo seleccionado.'
  )


/* ============================================================
   FORMATOS
============================================================ */

const formatDate =
  value => {
    if (!value) {
      return '—'
    }


    const date =
      new Date(
        `${value}T00:00:00`
      )


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value
    }


    return new Intl.DateTimeFormat(
      'es-MX',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    ).format(
      date
    )
  }


const formatMileage =
  value => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—'
    }


    const numeric =
      Number(
        value
      )


    if (
      Number.isNaN(
        numeric
      )
    ) {
      return `${value} km`
    }


    return (
      `${new Intl.NumberFormat(
        'es-MX'
      ).format(
        numeric
      )} km`
    )
  }


const getVehicleText =
  vehicle => {
    if (!vehicle) {
      return 'Sin información'
    }


    return [
      vehicle.marca,
      vehicle.modelo,
      vehicle.anio_modelo
    ]
      .filter(Boolean)
      .join(' ') ||
      vehicle.no_economico ||
      vehicle.placas ||
      'Sin información'
  }


const getVehicleOptionText =
  vehicle => {
    if (!vehicle) {
      return 'Vehículo'
    }


    const description =
      [
        vehicle.marca,
        vehicle.modelo,
        vehicle.anio_modelo
      ]
        .filter(Boolean)
        .join(' ')


    const identifiers =
      [
        vehicle.no_economico
          ? `No. ${vehicle.no_economico}`
          : null,

        vehicle.placas
          ? `Placas ${vehicle.placas}`
          : null
      ]
        .filter(Boolean)
        .join(' · ')


    return (
      [
        description,
        identifiers
      ]
        .filter(Boolean)
        .join(' — ') ||
      `Vehículo ${vehicle.id_vehiculo}`
    )
  }


const getMechanicName =
  mechanic => {
    const user =
      mechanic?.usuario


    if (!user) {
      return 'Sin asignar'
    }


    return [
      user.nombre,
      user.apellido_paterno,
      user.apellido_materno
    ]
      .filter(Boolean)
      .join(' ') ||
      'Sin asignar'
  }


const getServiceTypeText =
  service => {
    const types =
      []


    if (
      service?.motor
    ) {
      types.push(
        'Motor'
      )
    }


    if (
      service?.transmision
    ) {
      types.push(
        'Transmisión'
      )
    }


    if (
      Array.isArray(
        service?.llantas
      ) &&
      service.llantas.length >
        0
    ) {
      types.push(
        'Inspección de llantas'
      )
    }


    return (
      types.join(', ') ||
      'Servicio general'
    )
  }


const formatBooleanService =
  value => {
    if (
      value === true
    ) {
      return 'Sí'
    }


    if (
      value === false
    ) {
      return 'No'
    }


    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—'
    }


    const normalized =
      String(
        value
      )
        .trim()
        .toLowerCase()


    if (
      [
        'true',
        'si',
        'sí',
        '1',
        'realizado',
        'cambiado'
      ].includes(
        normalized
      )
    ) {
      return 'Sí'
    }


    if (
      [
        'false',
        'no',
        '0'
      ].includes(
        normalized
      )
    ) {
      return 'No'
    }


    return String(
      value
    )
  }


const normalizeTireCondition =
  value => {
    const normalized =
      String(
        value ||
        ''
      )
        .trim()
        .toUpperCase()


    if (
      [
        'BIEN',
        'BUENO',
        'BUENA'
      ].includes(
        normalized
      )
    ) {
      return 'BIEN'
    }


    if (
      [
        'REGULAR',
        'MEDIA',
        'MEDIO'
      ].includes(
        normalized
      )
    ) {
      return 'REGULAR'
    }


    if (
      [
        'MAL',
        'MALO',
        'MALA'
      ].includes(
        normalized
      )
    ) {
      return 'MAL'
    }


    return (
      normalized ||
      'SIN DATO'
    )
  }


const getTireConditionClass =
  value => {
    const condition =
      normalizeTireCondition(
        value
      )


    if (
      condition ===
      'BIEN'
    ) {
      return 'good'
    }


    if (
      condition ===
      'REGULAR'
    ) {
      return 'regular'
    }


    if (
      condition ===
      'MAL'
    ) {
      return 'bad'
    }


    return 'neutral'
  }


const getTirePercentage =
  amount => {
    if (
      !tireSummary.value.total
    ) {
      return 0
    }


    return Math.round(
      (
        Number(
          amount
        ) /
        tireSummary.value.total
      ) *
      100
    )
  }


/* ============================================================
   ORIENTACIÓN
============================================================ */

const getReportPageOrientation =
  () =>
    pageOrientation.value ===
    'portrait'
      ? 'portrait'
      : 'landscape'


/* ============================================================
   PDF
============================================================ */

/* ============================================================
   CAPTURA VISUAL DEL REPORTE
============================================================ */

const getReportSourceElement =
  () =>
    document.getElementById(
      'report-print-area'
    )


/* ============================================================
   ESPERAR IMÁGENES DEL REPORTE
============================================================ */

const waitForReportImages =
  async source => {
    if (!source) {
      return
    }


    const images =
      Array.from(
        source.querySelectorAll(
          'img'
        )
      )


    if (!images.length) {
      return
    }


    await Promise.all(
      images.map(
        image =>
          new Promise(
            resolve => {
              if (
                image.complete &&
                image.naturalWidth >
                0
              ) {
                resolve()
                return
              }


              let finished =
                false


              const finish =
                () => {
                  if (finished) {
                    return
                  }

                  finished =
                    true

                  resolve()
                }


              image.addEventListener(
                'load',
                finish,
                {
                  once:
                    true
                }
              )


              image.addEventListener(
                'error',
                finish,
                {
                  once:
                    true
                }
              )


              setTimeout(
                finish,
                3000
              )
            }
          )
      )
    )
  }


/* ============================================================
   CAPTURAR EXACTAMENTE LA VISTA PREVIA
============================================================ */

const captureReportCanvas =
  async () => {
    const source =
      getReportSourceElement()

    if (!source) {
      throw new Error(
        'No se encontró la vista previa del reporte.'
      )
    }

    await nextTick()
    await waitForReportImages(source)

    /*
     * IMPORTANTE:
     * La vista previa NO se modifica.
     * Para PDF/Word se crea una copia temporal con exactamente
     * el ancho útil de una hoja Carta: 7.9in (8.5 - .30 - .30).
     * De esta manera los márgenes se agregan una sola vez al
     * documento exportado y no se duplican ni se deforman.
     */
    const exportSource =
      source.cloneNode(true)

    exportSource.id =
      'report-export-source'

    Object.assign(
      exportSource.style,
      {
        position: 'fixed',
        left: '-20000px',
        top: '0',
        width:
          pageOrientation.value === 'landscape'
            ? '10.4in'
            : '7.9in',
        maxWidth:
          pageOrientation.value === 'landscape'
            ? '10.4in'
            : '7.9in',
        minHeight: '0',
        height: 'auto',
        padding: '0',
        margin: '0',
        transform: 'none',
        boxShadow: 'none',
        overflow: 'visible',
        background: '#ffffff',
        boxSizing: 'border-box',
        zIndex: '-99999'
      }
    )

    /*
     * SOLO EN LA COPIA DE EXPORTACIÓN:
     * conservar la proporción natural del logotipo.
     * Esto evita que html2canvas lo rasterice estirado en PDF/Word.
     */
    const exportLogo =
      exportSource.querySelector(
        '.reference-logo'
      )

    if (exportLogo) {
      /*
       * El JPEG del logotipo contiene un lienzo prácticamente cuadrado.
       * En la vista previa ese lienzo se recorta dentro de un marco ancho
       * y bajo mediante object-fit: cover. Usar height:auto/contain aquí
       * hacía que PDF y Word recuperaran la altura cuadrada original y
       * generaran el enorme espacio blanco observado en las exportaciones.
       * Estas medidas reproducen exactamente el marco de la vista previa.
       */
      exportLogo.style.setProperty(
        'width',
        '250px',
        'important'
      )

      exportLogo.style.setProperty(
        'height',
        '88px',
        'important'
      )

      exportLogo.style.setProperty(
        'max-width',
        '100%',
        'important'
      )

      exportLogo.style.setProperty(
        'object-fit',
        'contain',
        'important'
      )

      exportLogo.style.setProperty(
        'object-position',
        'center center',
        'important'
      )
    }

    document.body.appendChild(
      exportSource
    )

    try {
      await waitForReportImages(
        exportSource
      )

      await new Promise(
        resolve =>
          requestAnimationFrame(
            () =>
              requestAnimationFrame(
                resolve
              )
          )
      )

      const sourceRect =
        exportSource.getBoundingClientRect()

      const width =
        Math.ceil(
          Math.max(
            exportSource.scrollWidth,
            exportSource.offsetWidth,
            sourceRect.width
          )
        )

      const height =
        Math.ceil(
          Math.max(
            exportSource.scrollHeight,
            exportSource.offsetHeight,
            sourceRect.height
          )
        )

      /*
       * Posiciones donde es seguro iniciar una página nueva.
       * Se toman los bloques completos de vehículo para impedir
       * que Motor/Transmisión o una inspección de llantas quede
       * cortada entre dos páginas.
       */
      const breakCandidatesCss =
        Array.from(
          exportSource.querySelectorAll(
            '.reference-service-block, .reference-tire-block'
          )
        )
          .map(
            element =>
              Math.max(
                0,
                element.getBoundingClientRect().top -
                sourceRect.top
              )
          )
          .filter(
            value =>
              Number.isFinite(value) &&
              value > 0
          )
          .sort(
            (a, b) => a - b
          )

      const blockRangesCss =
        Array.from(
          exportSource.querySelectorAll(
            '.reference-service-block, .reference-tire-block'
          )
        )
          .map(
            element => {
              const rect =
                element.getBoundingClientRect()

              return {
                top:
                  Math.max(
                    0,
                    rect.top -
                    sourceRect.top
                  ),

                bottom:
                  Math.max(
                    0,
                    rect.bottom -
                    sourceRect.top
                  )
              }
            }
          )
          .filter(
            range =>
              Number.isFinite(
                range.top
              ) &&
              Number.isFinite(
                range.bottom
              ) &&
              range.bottom >
              range.top
          )

      const canvas =
        await html2canvas(
          exportSource,
          {
            scale: 2.25,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 5000,
            width,
            height,
            scrollX: 0,
            scrollY: 0,
            windowWidth: Math.max(
              document.documentElement.clientWidth,
              width
            ),
            windowHeight: Math.max(
              document.documentElement.clientHeight,
              height
            )
          }
        )

      return {
        canvas,
        cssWidth: width,
        breakCandidatesCss,
        blockRangesCss
      }
    } finally {
      exportSource.remove()
    }
  }


/* ============================================================
   DIVIDIR CAPTURA EN HOJAS CARTA SIN CORTAR RECUADROS
============================================================ */

const splitCanvasIntoLetterPages =
  capture => {
    const canvas =
      capture?.canvas || capture

    const cssWidth =
      capture?.cssWidth ||
      canvas.width / 2.25

    const breakCandidatesCss =
      capture?.breakCandidatesCss ||
      []

    const blockRangesCss =
      capture?.blockRangesCss ||
      []

    const isLandscape =
      pageOrientation.value ===
      'landscape'

    const usableWidthIn =
      isLandscape
        ? 10.4
        : 7.9

    const usableHeightIn =
      isLandscape
        ? 7.9
        : 10.4

    const scale =
      canvas.width /
      cssWidth

    const naturalPageHeight =
      Math.max(
        1,
        Math.round(
          canvas.width *
          (
            usableHeightIn /
            usableWidthIn
          )
        )
      )

    const breakCandidates =
      breakCandidatesCss.map(
        value =>
          Math.round(
            value * scale
          )
      )

    const blockRanges =
      blockRangesCss.map(
        range => ({
          top:
            Math.round(
              range.top *
              scale
            ),

          bottom:
            Math.round(
              range.bottom *
              scale
            )
        })
      )

    const pages = []
    let currentY = 0

    while (
      currentY <
      canvas.height
    ) {
      const idealEnd =
        Math.min(
          currentY +
          naturalPageHeight,
          canvas.height
        )

      let endY =
        idealEnd

      if (
        idealEnd <
        canvas.height
      ) {
        /*
         * Regla principal:
         * si el final de la hoja cae DENTRO de un bloque,
         * el bloque completo pasa a la siguiente hoja.
         */
        const crossedBlock =
          blockRanges.find(
            range =>
              range.top >
              currentY &&
              range.top <
              idealEnd &&
              range.bottom >
              idealEnd
          )

        if (
          crossedBlock
        ) {
          endY =
            crossedBlock.top
        } else {
          /*
           * Si no atraviesa un bloque, se conserva el último
           * salto seguro disponible antes del final de la hoja.
           */
          const safeBreaks =
            breakCandidates.filter(
              value =>
                value >
                currentY &&
                value <
                idealEnd
            )

          if (
            safeBreaks.length
          ) {
            const candidate =
              safeBreaks[
                safeBreaks.length -
                1
              ]

            /*
             * No crear una hoja absurdamente corta cuando el
             * corte ideal ya está entre bloques.
             */
            if (
              candidate -
              currentY >=
              naturalPageHeight *
              0.72
            ) {
              endY =
                candidate
            }
          }
        }
      }

      /*
       * Protección para un bloque individual más alto que una hoja.
       * En ese único caso se usa el corte natural para no entrar
       * en un ciclo infinito.
       */
      if (
        endY <=
        currentY +
        2
      ) {
        endY =
          idealEnd
      }

      const sliceHeight =
        endY -
        currentY

      const pageCanvas =
        document.createElement(
          'canvas'
        )

      pageCanvas.width =
        canvas.width

      pageCanvas.height =
        naturalPageHeight

      const context =
        pageCanvas.getContext(
          '2d'
        )

      if (!context) {
        throw new Error(
          'No fue posible crear una página del reporte.'
        )
      }

      context.fillStyle =
        '#ffffff'

      context.fillRect(
        0,
        0,
        pageCanvas.width,
        pageCanvas.height
      )

      context.drawImage(
        canvas,
        0,
        currentY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      )

      pages.push(
        pageCanvas
      )

      currentY =
        endY
    }

    return pages
  }


/* ============================================================
   CANVAS A BLOB
============================================================ */

const canvasToBlob =
  (
    canvas,
    type = 'image/png',
    quality = 1
  ) =>
    new Promise(
      (
        resolve,
        reject
      ) => {
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(
                new Error(
                  'No fue posible convertir la página en imagen.'
                )
              )

              return
            }


            resolve(
              blob
            )
          },

          type,
          quality
        )
      }
    )


/* ============================================================
   BLOB A UINT8ARRAY
============================================================ */

const blobToUint8Array =
  async blob => {
    const arrayBuffer =
      await blob.arrayBuffer()


    return new Uint8Array(
      arrayBuffer
    )
  }


/* ============================================================
   PDF — MISMO DISEÑO QUE LA VISTA PREVIA
============================================================ */

const exportPDF =
  async ({ forPrint = false } = {}) => {
    if (
      !report.value
    ) {
      return
    }


    exporting.value =
      true


    errorMessage.value =
      ''


    try {
      const reportCanvas =
        await captureReportCanvas()


      const pages =
        splitCanvasIntoLetterPages(
          reportCanvas
        )


      if (
        !pages.length
      ) {
        throw new Error(
          'No existen páginas para exportar.'
        )
      }


      const orientation =
        getReportPageOrientation()


      const pdf =
        new jsPDF({
          orientation:
            orientation ===
            'landscape'
              ? 'landscape'
              : 'portrait',

          unit:
            'mm',

          format:
            'letter',

          compress:
            true
        })


      const pageWidth =
        pdf.internal
          .pageSize
          .getWidth()


      const pageHeight =
        pdf.internal
          .pageSize
          .getHeight()


      pages.forEach(
        (
          pageCanvas,
          index
        ) => {
          if (
            index >
            0
          ) {
            pdf.addPage(
              'letter',
              orientation
            )
          }


          const image =
            pageCanvas.toDataURL(
              'image/jpeg',
              0.86
            )


          const marginMm =
            7.62

          const availableWidth =
            pageWidth -
            (marginMm * 2)

          const availableHeight =
            pageHeight -
            (marginMm * 2)

          const canvasRatio =
            pageCanvas.width /
            pageCanvas.height

          let drawWidth =
            availableWidth

          let drawHeight =
            drawWidth /
            canvasRatio

          if (
            drawHeight >
            availableHeight
          ) {
            drawHeight =
              availableHeight

            drawWidth =
              drawHeight *
              canvasRatio
          }

          const drawX =
            (
              pageWidth -
              drawWidth
            ) / 2

          const drawY =
            marginMm

          pdf.addImage(
            image,
            'JPEG',
            drawX,
            drawY,
            drawWidth,
            drawHeight,
            undefined,
            'FAST'
          )
        }
      )


      const fileName =
        `${
          reportType.value ===
          'servicios'
            ? 'reporte-servicios'
            : 'reporte-llantas'
        }-automecanic-${createFileSuffix()}.pdf`


      const blob =
        pdf.output(
          'blob'
        )


      if (
        isMobileDevice() ||
        isStandaloneMode()
      ) {
        const shared =
          await shareReportPDF(
            blob,
            fileName
          )

        if (forPrint) {
          successMessage.value = shared
            ? 'PDF listo. En el menú de compartir, selecciona Imprimir para enviarlo a una impresora.'
            : 'Se abrió el PDF. Usa las opciones del visor para compartirlo o imprimirlo.'
        }
      } else {
        pdf.save(
          fileName
        )
      }
    } catch (error) {
      console.error(
        'Error PDF:',
        error
      )


      if (
        error?.name !==
        'AbortError'
      ) {
        errorMessage.value =
          forPrint
            ? 'No fue posible preparar el PDF para imprimir.'
            : 'No fue posible generar el archivo PDF.'
      }
    } finally {
      exporting.value =
        false
    }
  }


/* ============================================================
   WORD
============================================================ */

const exportWord =
  async () => {
    if (!report.value) return

    exporting.value = true
    errorMessage.value = ''

    try {
      // Usar exactamente la misma captura y paginación que el PDF.
      const reportCanvas = await captureReportCanvas()
      const pages = splitCanvasIntoLetterPages(reportCanvas)

      if (!pages.length) {
        throw new Error('No existen páginas para exportar.')
      }

      const isLandscape = pageOrientation.value === 'landscape'
      const pageWidthTwips = isLandscape ? 15840 : 12240
      const pageHeightTwips = isLandscape ? 12240 : 15840
      const marginTwips = 432 // 0.30 pulgadas, igual que el PDF.
      const marginEmu = marginTwips * 635
      const maxWidth = (pageWidthTwips - marginTwips * 2) / 15
      const maxHeight = (pageHeightTwips - marginTwips * 2) / 15
      const sections = []

      for (const pageCanvas of pages) {
        // PNG conserva los bordes finos sin compresión JPEG adicional.
        const pageBlob = await canvasToBlob(pageCanvas, 'image/png')
        const imageData = await blobToUint8Array(pageBlob)
        const ratio = pageCanvas.width / pageCanvas.height
        let imageWidth = maxWidth
        let imageHeight = imageWidth / ratio

        if (imageHeight > maxHeight) {
          imageHeight = maxHeight
          imageWidth = imageHeight * ratio
        }

        sections.push({
          properties: {
            type: 'nextPage',
            page: {
              size: {
                width: pageWidthTwips,
                height: pageHeightTwips,
                orientation: isLandscape
                  ? PageOrientation.LANDSCAPE
                  : PageOrientation.PORTRAIT
              },
              margin: {
                top: marginTwips,
                right: marginTwips,
                bottom: marginTwips,
                left: marginTwips,
                header: 0,
                footer: 0,
                gutter: 0
              }
            }
          },
          children: [
            new Paragraph({
              // El párrafo solo sirve de ancla; no determina la altura
              // ni recorta la imagen del reporte.
              run: { size: 2 },
              spacing: { before: 0, after: 0, line: 240 },
              children: [
                new ImageRun({
                  data: imageData,
                  type: 'png',
                  transformation: {
                    width: imageWidth,
                    height: imageHeight
                  },
                  floating: {
                    horizontalPosition: {
                      relative: 'page',
                      offset: marginEmu
                    },
                    verticalPosition: {
                      relative: 'page',
                      offset: marginEmu
                    },
                    allowOverlap: true,
                    lockAnchor: true,
                    layoutInCell: false,
                    behindDocument: false,
                    margins: { top: 0, right: 0, bottom: 0, left: 0 }
                  }
                })
              ]
            })
          ]
        })
      }

      const wordDocument = new Document({ sections })
      const blob = await Packer.toBlob(wordDocument)
      const url = URL.createObjectURL(blob)
      const anchor = documentCreateAnchor(
        url,
        `${reportType.value === 'servicios'
          ? 'reporte-servicios'
          : 'reporte-llantas'}-automecanic-${createFileSuffix()}.docx`
      )

      anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Error Word:', error)
      errorMessage.value = 'No fue posible generar el documento Word.'
    } finally {
      exporting.value = false
    }
  }


/* ============================================================
   WORD HELPERS
============================================================ */

const createWordRow =
  values => {
    return new TableRow({
      children:
        values.map(
          value =>
            new TableCell({
              children: [
                new Paragraph({
                  text:
                    String(
                      value ??
                      '—'
                    )
                })
              ]
            })
        )
    })
  }


const documentCreateAnchor =
  (
    url,
    filename
  ) => {
    const anchor =
      window.document
        .createElement(
          'a'
        )


    anchor.href =
      url


    anchor.download =
      filename


    window.document
      .body
      .appendChild(
        anchor
      )


    anchor.addEventListener(
      'click',
      () => {
        setTimeout(
          () =>
            anchor.remove(),
          100
        )
      }
    )


    return anchor
  }


/* ============================================================
   NOMBRE ARCHIVO
============================================================ */

const createFileSuffix =
  () => {
    if (
      report.value?.rango.tipo ===
      'fecha'
    ) {
      return (
        report.value.rango.desde
      )
    }


    if (
      report.value?.rango.tipo ===
      'mes'
    ) {
      return (
        `${filters.value.anio}-` +
        `${String(
          filters.value.mes
        ).padStart(
          2,
          '0'
        )}`
      )
    }


    return (
      filters.value.anio ||
      new Date()
        .getFullYear()
    )
  }


/* ============================================================
   DETECTAR TELÉFONO / TABLET
============================================================ */

const isMobileDevice =
  () => {
    const userAgent =
      navigator.userAgent ||
      ''


    const normalMobile =
      /Android|iPhone|iPad|iPod/i.test(
        userAgent
      )


    const modernIPad =
      navigator.platform ===
        'MacIntel' &&
      navigator.maxTouchPoints >
        1


    return (
      normalMobile ||
      modernIPad
    )
  }


/* ============================================================
   DETECTAR PWA
============================================================ */

const isStandaloneMode =
  () => {
    const displayModeStandalone =
      window.matchMedia(
        '(display-mode: standalone)'
      ).matches


    const iosStandalone =
      window.navigator
        .standalone ===
        true


    return (
      displayModeStandalone ||
      iosStandalone
    )
  }


/* ============================================================
   ABRIR PDF COMO RESPALDO
============================================================ */

const openPdfFallback =
  blob => {
    if (!blob) {
      return
    }


    const url =
      URL.createObjectURL(
        blob
      )


    const anchor =
      document.createElement(
        'a'
      )


    anchor.href =
      url


    anchor.target =
      '_blank'


    anchor.rel =
      'noopener noreferrer'


    document.body
      .appendChild(
        anchor
      )


    anchor.click()


    anchor.remove()


    window.setTimeout(
      () => {
        URL.revokeObjectURL(
          url
        )
      },
      60000
    )
  }


/* ============================================================
   COMPARTIR PDF EN TELÉFONO
============================================================ */

const shareReportPDF =
  async (
    blob,
    fileName
  ) => {
    if (!blob) {
      throw new Error(
        'No se generó el archivo PDF.'
      )
    }


    const file =
      new File(
        [
          blob
        ],
        fileName,
        {
          type:
            'application/pdf'
        }
      )


    const canShareFiles =
      typeof navigator.share ===
        'function' &&
      typeof navigator.canShare ===
        'function' &&
      navigator.canShare({
        files: [
          file
        ]
      })


    if (
      canShareFiles
    ) {
      await navigator.share({
        title:
          'Reporte Automecanic',

        text:
          `Reporte ${reportPeriodLabel.value}`,

        files: [
          file
        ]
      })


      return true
    }


    openPdfFallback(
      blob
    )


    return false
  }


/* ============================================================
   IMPRESIÓN
============================================================ */

const waitForPrintImages =
  async doc => {
    const images =
      Array.from(
        doc.images ||
        []
      )


    await Promise.all(
      images.map(
        image => {
          if (
            image.complete
          ) {
            return Promise.resolve()
          }


          return new Promise(
            resolve => {
              image.addEventListener(
                'load',
                resolve,
                {
                  once:
                    true
                }
              )


              image.addEventListener(
                'error',
                resolve,
                {
                  once:
                    true
                }
              )
            }
          )
        }
      )
    )
  }


const getStandalonePrintStyles =
  orientation => `
  @page {
    size: letter ${orientation};
    margin: 0.15in;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
  }

  #report-print-area.report-reference-sheet {
    width: ${orientation === 'landscape' ? '10.7in' : '8.2in'};
    min-height: ${orientation === 'landscape' ? '8.2in' : '10.7in'};
    margin: 0 auto;
    padding: 0;
    background: #fff;
    color: #000;
    font-size: 10px;
    line-height: 1.15;
  }

  #report-print-area * {
    box-sizing: border-box;
    color: #000;
  }

  .reference-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
    min-height: 220px;
  }

  .reference-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-top: 10px;
    font-size: 10px;
  }

  .reference-logo {
    width: 250px;
    height: 88px;
    object-fit: contain;
    display: block;
    margin-bottom: 8px;
  }

  .reference-brand strong { font-size: 12px; margin-bottom: 5px; }
  .reference-brand span { line-height: 1.35; }
  .reference-header-right { padding: 10px 0 0; display: flex; flex-direction: column; align-items: center; }

  .reference-date-grid {
    width: 250px;
    margin: 0 auto;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .reference-date-grid th,
  .reference-date-grid td {
    border: 2px solid #111;
    padding: 4px 6px;
    text-align: center;
    font-size: 10px;
    font-weight: 700;
  }

  .reference-author-line {
    display: grid;
    grid-template-columns: 80px 1fr;
    width: 250px;
    margin: 18px auto 0;
    border-bottom: 2px solid #111;
    padding-bottom: 5px;
    align-items: end;
  }

  .reference-author-line strong,
  .reference-author-line span { font-size: 10px; text-align: center; }

  .reference-summary-grid {
    display: grid;
    grid-template-columns: 46% 54%;
    gap: 12px;
    align-items: stretch;
    margin-top: 0;
    margin-bottom: 18px;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .reference-chart-box {
    border: 1px solid #cfcfcf;
    min-height: 176px;
    padding: 12px;
  }

  .reference-chart-box h3 {
    text-align: center;
    font-size: 10px;
    letter-spacing: 2px;
    margin: 0 0 14px;
  }

  .reference-summary-right { display: flex; flex-direction: column; gap: 10px; min-height: 176px; justify-content: space-between; }
  .reference-semaphore { border: 2px solid #666; border-radius: 16px; display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; padding: 10px; }
  .reference-semaphore article { border: 2px solid #ccc; border-radius: 10px; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .reference-semaphore article.good { border-color: #00b050; }
  .reference-semaphore article.regular { border-color: #fff200; }
  .reference-semaphore article.bad { border-color: #ff1f1f; }
  .reference-semaphore article > span { width: 64px; height: 64px; border-radius: 50%; box-shadow: inset 0 0 0 8px rgba(255,255,255,.45), 0 0 0 2px #aaa; }
  .reference-semaphore .good > span { background: #00b050; }
  .reference-semaphore .regular > span { background: #fff200; }
  .reference-semaphore .bad > span { background: #ff1f1f; }
  .reference-semaphore small { font-size: 9px; }
  .reference-semaphore b { font-size: 10px; }

  .reference-total-table,
  .reference-tire-table,
  .reference-service-table,
  .reference-detail-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .reference-total-table th,
  .reference-total-table td,
  .reference-tire-table th,
  .reference-tire-table td,
  .reference-service-table th,
  .reference-service-table td,
  .reference-detail-table th,
  .reference-detail-table td {
    border: 2px solid #111;
    padding: 3px 4px;
    text-align: center;
    font-size: 10px;
    line-height: 1.05;
  }

  .reference-total-table th,
  .reference-tire-table th,
  .reference-service-table th,
  .reference-detail-table th { font-weight: 800; }

  .reference-total-table .state.good,
  .reference-tire-table .condition-cell.good { background: #00b050; }
  .reference-total-table .state.regular,
  .reference-tire-table .condition-cell.regular { background: #fff200; }
  .reference-total-table .state.bad,
  .reference-tire-table .condition-cell.bad { background: #ff1f1f; }
  .reference-total-table .total { background: #ddd; }

  .reference-tire-chart { display: flex; flex-direction: column; gap: 18px; padding: 5px 0; }
  .chart-group { display: grid; grid-template-columns: 95px 1fr; gap: 6px; align-items: center; }
  .chart-group > span { font-size: 8px; font-weight: 700; }
  .chart-lines { display: flex; flex-direction: column; gap: 3px; }
  .chart-lines i { height: 7px; display: block; min-width: 2px; }
  .chart-lines .bad { background: #ff1f1f; }
  .chart-lines .regular { background: #f1b500; }
  .chart-lines .good { background: #54a8b6; }
  .chart-legend { font-size: 7px; margin-top: 12px; text-align: center; }
  .chart-legend span { display: inline-block; width: 7px; height: 7px; margin: 0 2px 0 8px; }
  .chart-legend .bad { background: #ff1f1f; }
  .chart-legend .regular { background: #f1b500; }
  .chart-legend .good { background: #54a8b6; }

  .reference-tire-list,
  .reference-service-list { display: flex; flex-direction: column; gap: 12px; }
  .reference-tire-block,
  .reference-service-block { break-inside: avoid; page-break-inside: avoid; }
  .reference-tire-table .label-col { width: 105px; }
  .reference-tire-table .obs-col { width: 155px; }
  .reference-tire-table .obs-cell { text-align: left; vertical-align: top; }
  .reference-tire-table .condition-cell { font-weight: 800; }

  .reference-report-title {
    border-top: 2px solid #111;
    border-bottom: 2px solid #111;
    text-align: center;
    font-size: 14px;
    font-weight: 800;
    padding: 6px;
    margin: 0 0 12px;
  }

  .reference-service-circles { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; border: 2px solid #666; border-radius: 16px; padding: 10px; }
  .reference-service-circles article { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .reference-service-circles .circle { width: 62px; height: 62px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; border: 7px solid rgba(255,255,255,.5); box-shadow: 0 0 0 2px #aaa; }
  .circle.motor { background: #4da3ff; }
  .circle.transmission { background: #ffd84d; }
  .circle.tires { background: #43c66d; }
  .reference-service-circles strong,
  .reference-service-circles b { font-size: 9px; }

  .service-bars { display: flex; flex-direction: column; gap: 14px; }
  .service-bar-row { display: grid; grid-template-columns: 90px 1fr 24px; align-items: center; gap: 6px; }
  .service-bar-row > div { height: 12px; border: 1px solid #bbb; }
  .service-bar-row i { display: block; height: 100%; background: #54a8b6; }
  .service-bar-row span { font-size: 8px; font-weight: 700; }
  .service-bar-row b { text-align: right; }

  .reference-service-details { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 5px; }
  .reference-detail-table thead th { background: #eee; }
  .reference-empty { border: 2px solid #111; padding: 24px; text-align: center; font-weight: 700; }
`


const printReport =
  async () => {
    if (
      !report.value
    ) {
      return
    }


    errorMessage.value =
      ''

    if (isMobileDevice()) {
      await exportPDF({ forPrint: true })
      return
    }


    const source =
      document.getElementById(
        'report-print-area'
      )


    if (!source) {
      errorMessage.value =
        'No fue posible preparar el reporte para impresión.'

      return
    }


    const orientation =
      getReportPageOrientation()


    const iframe =
      document.createElement(
        'iframe'
      )


    iframe.setAttribute('aria-hidden', 'true')


    iframe.style.position = 'fixed'
    iframe.style.inset = '0'
    iframe.style.width = '100vw'
    iframe.style.height = '100vh'


    iframe.style.border = '0'
    iframe.style.opacity = '0'
    iframe.style.pointerEvents = 'none'


    document.body.appendChild(
      iframe
    )


    const printWindow =
      iframe.contentWindow


    const printDocument =
      printWindow?.document


    if (
      !printWindow ||
      !printDocument
    ) {
      iframe.remove()


      errorMessage.value =
        'No fue posible abrir la vista de impresión.'

      return
    }


    printDocument.open()


    printDocument.write(`
      <!doctype html>

      <html lang="es">
        <head>
          <meta charset="utf-8">

          <base href="${document.baseURI}">

          <title></title>

          <style>
            ${getStandalonePrintStyles(
              orientation
            )}
          

/* ============================================================
   CORRECCIÓN DEFINITIVA DE GEOMETRÍA DEL REPORTE
   Una sola geometría para vista previa, PDF, Word e impresión.
============================================================ */
#report-print-area.report-reference-sheet {
  width: 8.5in !important;
  max-width: 8.5in !important;
  min-height: 11in !important;
  padding: .30in !important;
  margin: 0 auto !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

#report-print-area.report-reference-sheet.report-document-landscape {
  width: 11in !important;
  max-width: 11in !important;
  min-height: 8.5in !important;
}

#report-print-area.report-reference-sheet .reference-logo {
  width: 2.45in !important;
  max-width: 82% !important;
  height: .70in !important;
  object-fit: contain !important;
  object-position: center !important;
  margin: 0 auto .08in !important;
}

#report-print-area.report-reference-sheet .reference-summary-grid {
  display: grid !important;
  grid-template-columns: minmax(0, 45fr) minmax(0, 55fr) !important;
  column-gap: .08in !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

#report-print-area.report-reference-sheet .reference-summary-grid > * {
  min-width: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

#report-print-area.report-reference-sheet .reference-summary-right {
  min-width: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

#report-print-area.report-reference-sheet .reference-semaphore,
#report-print-area.report-reference-sheet .reference-service-circles,
#report-print-area.report-reference-sheet .reference-total-table {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
}

#report-print-area.report-reference-sheet .reference-semaphore,
#report-print-area.report-reference-sheet .reference-service-circles {
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 4px !important;
  padding: 6px !important;
}

#report-print-area.report-reference-sheet .reference-semaphore article,
#report-print-area.report-reference-sheet .reference-service-circles article {
  min-width: 0 !important;
  width: auto !important;
  max-width: 100% !important;
  padding: 5px 2px !important;
  box-sizing: border-box !important;
}

#report-print-area.report-reference-sheet .reference-semaphore article > span,
#report-print-area.report-reference-sheet .reference-service-circles .circle {
  width: 48px !important;
  height: 48px !important;
  flex-basis: 48px !important;
}

#report-print-area.report-reference-sheet table {
  max-width: 100% !important;
  box-sizing: border-box !important;
}

#report-print-area.report-reference-sheet .reference-tire-block,
#report-print-area.report-reference-sheet .reference-service-block {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

@media print {
  @page {
    size: letter portrait;
    margin: .30in;
  }

  #report-print-area.report-reference-sheet {
    width: 7.9in !important;
    max-width: 7.9in !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    box-shadow: none !important;
  }

  #report-print-area.report-reference-sheet .reference-logo {
    object-fit: contain !important;
  }

  #report-print-area.report-reference-sheet .reference-summary-grid {
    grid-template-columns: minmax(0, 45fr) minmax(0, 55fr) !important;
    column-gap: .08in !important;
  }
}

</style>
          <style>
            @page {
              size: letter ${orientation};
              margin: 0.15in;
            }

            @media print {
              #report-print-area.report-reference-sheet {
                width: ${orientation === 'landscape' ? '10.7in' : '8.2in'} !important;
                max-width: ${orientation === 'landscape' ? '10.7in' : '8.2in'} !important;
                min-height: ${orientation === 'landscape' ? '8.2in' : '10.7in'} !important;
                margin: 0 auto !important;
                padding: 0 !important;
                overflow: visible !important;
                box-shadow: none !important;
              }

              #report-print-area.report-reference-sheet.report-document-landscape {
                width: 10.7in !important;
                max-width: 10.7in !important;
                min-height: 8.2in !important;
              }
            }
          </style>
        </head>

        <body>
          ${source.outerHTML}
        </body>
      </html>
    `)


    printDocument.close()


    await waitForPrintImages(
      printDocument
    )


    const cleanup =
      () => {
        setTimeout(
          () =>
            iframe.remove(),
          250
        )
      }


    printWindow.addEventListener(
      'afterprint',
      cleanup,
      {
        once:
          true
      }
    )


    setTimeout(
      () => {
        printWindow.focus()

        printWindow.print()
      },
      250
    )
  }

</script>


<style scoped>
/* ============================================================
   REPORTES — INTEGRACIÓN VISUAL CON PANEL ADMINISTRATIVO
============================================================ */

.report-filter-card {
  width: 100%;
  padding: 24px;
  border: 1px solid var(--admin-border, #263548);
  border-radius: 18px;
  background: var(--admin-card, #101a2a);
  box-shadow: var(--admin-shadow, 0 10px 30px rgba(0, 0, 0, 0.14));
}

.report-filter-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.report-filter-heading h2 {
  margin: 0 0 5px;
  color: var(--admin-text, #f8fafc);
  font-size: clamp(20px, 2vw, 26px);
  font-weight: 800;
  line-height: 1.15;
}

.report-filter-heading p {
  margin: 0;
  color: var(--admin-text-secondary, #aab7ca);
  font-size: 14px;
  line-height: 1.5;
}

.report-type-selector {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.report-type-option {
  position: relative;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 22px;
  align-items: center;
  gap: 14px;
  min-width: 0;
  min-height: 92px;
  padding: 16px 18px;
  border: 1px solid var(--admin-border, #2a3a50);
  border-radius: 15px;
  background: var(--admin-bg-soft, rgba(255,255,255,.025));
  color: var(--admin-text, #f8fafc);
  text-align: left;
  cursor: pointer;
  transition:
    border-color .18s ease,
    background .18s ease,
    transform .18s ease,
    box-shadow .18s ease;
}

.report-type-option:hover {
  transform: translateY(-1px);
  border-color: var(--admin-primary, #13a8e4);
  background: color-mix(in srgb, var(--admin-primary, #13a8e4) 7%, var(--admin-card, #101a2a));
}

.report-type-option.active {
  border-color: var(--admin-primary, #13a8e4);
  background: color-mix(in srgb, var(--admin-primary, #13a8e4) 12%, var(--admin-card, #101a2a));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--admin-primary, #13a8e4) 34%, transparent);
}

.report-type-option-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 1px solid color-mix(in srgb, var(--admin-primary, #13a8e4) 35%, var(--admin-border, #2a3a50));
  border-radius: 13px;
  background: color-mix(in srgb, var(--admin-primary, #13a8e4) 10%, transparent);
  color: var(--admin-primary, #13a8e4);
  font-size: 21px;
}

.report-type-option > div:nth-child(2) {
  min-width: 0;
}

.report-type-option strong {
  display: block;
  margin-bottom: 5px;
  color: var(--admin-text, #f8fafc);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.3;
}

.report-type-option span {
  display: block;
  color: var(--admin-text-secondary, #aab7ca);
  font-size: 12px;
  line-height: 1.4;
}

.report-type-check {
  justify-self: end;
  color: var(--admin-primary, #13a8e4);
  font-size: 18px;
}

.report-filter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.report-filter-field {
  min-width: 0;
}

.report-filter-field-wide {
  grid-column: 1 / -1;
}

.report-filter-field label {
  display: block;
  margin: 0 0 7px;
  color: var(--admin-text, #f8fafc);
  font-size: 13px;
  font-weight: 700;
}

.report-filter-field input,
.report-filter-field select {
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 0 13px;
  border: 1px solid var(--admin-border, #2a3a50);
  border-radius: 11px;
  outline: none;
  background: var(--admin-input, #121f31);
  color: var(--admin-text, #f8fafc);
  font: inherit;
  font-size: 14px;
  transition:
    border-color .18s ease,
    box-shadow .18s ease,
    background .18s ease;
}

.report-filter-field input:focus,
.report-filter-field select:focus {
  border-color: var(--admin-primary, #13a8e4);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--admin-primary, #13a8e4) 16%, transparent);
}

.report-filter-field input::placeholder {
  color: var(--admin-text-muted, #74849a);
}

.report-filter-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding-top: 4px;
}

.report-filter-actions .btn-admin-secondary,
.report-filter-actions .btn-admin-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: auto;
  min-width: 132px;
  min-height: 42px;
  padding: 10px 16px;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  transition:
    transform .18s ease,
    border-color .18s ease,
    background .18s ease,
    opacity .18s ease;
}

.report-filter-actions .btn-admin-secondary {
  border: 1px solid var(--admin-border, #2a3a50);
  background: transparent;
  color: var(--admin-text-secondary, #c0cada);
}

.report-filter-actions .btn-admin-secondary:hover:not(:disabled) {
  border-color: var(--admin-text-muted, #718096);
  background: color-mix(in srgb, var(--admin-text, #fff) 5%, transparent);
  color: var(--admin-text, #fff);
}

.report-filter-actions .btn-admin-primary {
  min-width: 176px;
  border: 1px solid var(--admin-primary, #13a8e4);
  background: var(--admin-primary, #13a8e4);
  color: #fff;
  box-shadow: 0 7px 18px color-mix(in srgb, var(--admin-primary, #13a8e4) 22%, transparent);
}

.report-filter-actions .btn-admin-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

.report-filter-actions button:disabled {
  cursor: not-allowed;
  opacity: .58;
}

.report-empty-state {
  display: grid;
  place-items: center;
  min-height: 230px;
  margin-top: 18px;
  padding: 34px 24px;
  border: 1px dashed var(--admin-border, #2a3a50);
  border-radius: 18px;
  background: var(--admin-card, #101a2a);
  text-align: center;
}

.report-empty-icon,
.report-loading-spinner {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: 12px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--admin-primary, #13a8e4) 10%, transparent);
  color: var(--admin-primary, #13a8e4);
  font-size: 25px;
}

.report-empty-state h2 {
  margin: 0 0 7px;
  color: var(--admin-text, #f8fafc);
  font-size: 18px;
  font-weight: 800;
}

.report-empty-state p {
  max-width: 560px;
  margin: 0;
  color: var(--admin-text-secondary, #aab7ca);
  font-size: 13px;
  line-height: 1.5;
}

.report-export-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 18px;
  padding: 16px 18px;
  border: 1px solid var(--admin-border, #2a3a50);
  border-radius: 16px;
  background: var(--admin-card, #101a2a);
}

.report-export-toolbar-fixed {
  width: min(100%, 940px);
  margin: 18px auto 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
}

.report-export-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.report-export-info > span {
  color: var(--admin-primary, #13a8e4);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .09em;
}

.report-export-info strong {
  color: var(--admin-text, #f8fafc);
  font-size: 14px;
  line-height: 1.3;
}

.report-export-info small {
  color: var(--admin-text-secondary, #aab7ca);
  font-size: 12px;
}

.report-export-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
}

.report-orientation-selector {
  display: flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--admin-border, #2a3a50);
  border-radius: 10px;
  background: var(--admin-bg-soft, rgba(255,255,255,.025));
}

.report-orientation-selector button,
.report-export-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 35px;
  padding: 8px 11px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--admin-text-secondary, #aab7ca);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.report-orientation-selector button.active {
  background: color-mix(in srgb, var(--admin-primary, #13a8e4) 15%, transparent);
  color: var(--admin-primary, #13a8e4);
}

.report-export-button {
  border-color: var(--admin-border, #2a3a50);
  background: var(--admin-bg-soft, rgba(255,255,255,.025));
}

.report-export-button:hover:not(:disabled) {
  border-color: var(--admin-primary, #13a8e4);
  color: var(--admin-text, #fff);
}

@media (max-width: 900px) {
  .report-filter-card {
    padding: 20px;
  }

  .report-type-selector {
    grid-template-columns: 1fr;
  }

  .report-export-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .report-export-toolbar-fixed {
    grid-template-columns: 1fr;
  }

  .report-export-controls {
    width: 100%;
    justify-content: flex-start;
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .report-filter-card {
    padding: 16px;
    border-radius: 14px;
  }

  .report-type-option {
    grid-template-columns: 42px minmax(0, 1fr) 18px;
    min-height: 84px;
    padding: 14px;
  }

  .report-type-option-icon {
    width: 42px;
    height: 42px;
    border-radius: 11px;
    font-size: 18px;
  }

  .report-filter-grid {
    grid-template-columns: 1fr;
  }

  .report-filter-field-wide {
    grid-column: auto;
  }

  .report-filter-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .report-filter-actions .btn-admin-secondary,
  .report-filter-actions .btn-admin-primary {
    width: 100%;
    min-width: 0;
  }

  .report-export-controls {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .report-orientation-selector {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .report-export-button {
    width: 100%;
  }
}

/* ============================================================
   FUENTE DE IMPRESIÓN
   La vista previa oficial se abre con el diálogo de impresión.
   El panel administrativo NO se modifica.
============================================================ */
.report-print-source {
  position: relative !important;
  left: auto !important;
  top: auto !important;
  display: block !important;
  width: 100% !important;
  margin-top: 18px !important;
  padding: 18px !important;
  overflow-x: auto !important;
  overflow-y: visible !important;
  pointer-events: auto !important;
  opacity: 1 !important;
  border: 1px solid var(--admin-border, #2a3a50);
  border-radius: 16px;
  background: var(--admin-card, #101a2a);
}

.report-print-source .report-document {
  box-sizing: border-box !important;
  width: 216mm !important;
  min-width: 216mm !important;
  min-height: 279mm !important;
  margin: 0 auto !important;
  padding: 10mm !important;
  background: #ffffff !important;
  color: #000000 !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: 0 8px 30px rgba(0,0,0,.28) !important;
  font-family: Arial, Helvetica, sans-serif !important;
}

.report-print-source .report-document.report-document-landscape {
  width: 279mm !important;
  min-width: 279mm !important;
  min-height: 216mm !important;
}

.report-print-source .report-company-header {
  display: grid !important;
  grid-template-columns: 1fr 0.78fr !important;
  gap: 10mm !important;
  align-items: start !important;
  margin: 0 0 5mm !important;
  color: #000 !important;
}

.report-print-source .report-company-left {
  text-align: center !important;
}

.report-print-source .report-company-logo {
  display: block !important;
  width: 74mm !important;
  height: auto !important;
  max-height: 24mm !important;
  object-fit: contain !important;
  margin: 0 auto 3mm !important;
}

.report-print-source .report-company-data,
.report-print-source .report-company-data strong,
.report-print-source .report-company-data span {
  color: #000 !important;
}

.report-print-source .report-company-data {
  display: flex !important;
  flex-direction: column !important;
  gap: .6mm !important;
  font-size: 8pt !important;
  line-height: 1.15 !important;
}

.report-print-source .report-company-data strong {
  margin-bottom: 1mm !important;
  font-size: 9pt !important;
}

.report-print-source .reference-date-table {
  width: 100% !important;
  border-collapse: collapse !important;
  table-layout: fixed !important;
}

.report-print-source .reference-date-table th,
.report-print-source .reference-date-table td {
  border: 1.2px solid #000 !important;
  padding: 1.4mm 1mm !important;
  background: #fff !important;
  color: #000 !important;
  text-align: center !important;
  font-size: 7.5pt !important;
  font-weight: 700 !important;
}

.report-print-source .reference-performed-by {
  display: grid !important;
  grid-template-columns: 28mm 1fr !important;
  margin-top: 4mm !important;
  padding: 1.5mm 0 !important;
  border-bottom: 1.2px solid #000 !important;
  color: #000 !important;
  font-size: 7.5pt !important;
}

.report-print-source .report-reference-title {
  margin-top: 4mm !important;
  color: #000 !important;
  text-align: center !important;
  font-size: 9pt !important;
  font-weight: 800 !important;
}

.report-print-source .reference-document-title {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  margin: 3mm 0 4mm !important;
  padding: 1.5mm 2mm !important;
  border-top: 1.4px solid #000 !important;
  border-bottom: 1.4px solid #000 !important;
  background: #fff !important;
  color: #000 !important;
  font-size: 8pt !important;
}

.report-print-source .report-section,
.report-print-source .report-section-title,
.report-print-source .report-service-detail-card,
.report-print-source .report-technical-detail,
.report-print-source .report-tire-chart-card,
.report-print-source .report-tire-overview-right {
  background: #fff !important;
  color: #000 !important;
  box-shadow: none !important;
}

.report-print-source .report-section-title {
  margin: 0 0 2mm !important;
}

.report-print-source .report-section-title > div:first-child { display: none !important; }
.report-print-source .report-section-title h2 { margin: 0 !important; color:#000 !important; font-size: 10pt !important; }
.report-print-source .report-section-title p { margin: .5mm 0 0 !important; color:#000 !important; font-size: 7pt !important; }

.report-print-source .report-table-wrapper { overflow: visible !important; }
.report-print-source .report-table,
.report-print-source .report-tire-total-table,
.report-print-source .report-tire-vehicle-table {
  width: 100% !important;
  border-collapse: collapse !important;
  border-spacing: 0 !important;
  table-layout: fixed !important;
  color: #000 !important;
}

.report-print-source .report-table th,
.report-print-source .report-table td,
.report-print-source .report-tire-total-table th,
.report-print-source .report-tire-total-table td,
.report-print-source .report-tire-vehicle-table th,
.report-print-source .report-tire-vehicle-table td {
  border: 1px solid #000 !important;
  padding: 1mm 1.2mm !important;
  background: #fff !important;
  color: #000 !important;
  font-size: 6.6pt !important;
  line-height: 1.1 !important;
  text-align: center !important;
  vertical-align: middle !important;
}

.report-print-source .report-table th,
.report-print-source .report-tire-total-table th,
.report-print-source .report-tire-vehicle-table th {
  font-weight: 800 !important;
}

.report-print-source .report-tire-overview {
  display: grid !important;
  grid-template-columns: .9fr 1.1fr !important;
  gap: 3mm !important;
  align-items: start !important;
  margin-bottom: 4mm !important;
}

.report-print-source .report-tire-chart-card {
  border: 1px solid #cfcfcf !important;
  padding: 3mm !important;
}

.report-print-source .report-tire-chart-card h3 {
  margin: 0 0 2mm !important;
  color: #000 !important;
  text-align: center !important;
  font-size: 7pt !important;
  letter-spacing: .12em !important;
}

.report-print-source .report-condition-bar-row {
  display: grid !important;
  grid-template-columns: 19mm 1fr 8mm !important;
  gap: 1.5mm !important;
  align-items: center !important;
  color: #000 !important;
  font-size: 6.5pt !important;
}

.report-print-source .report-condition-bar-track {
  height: 3mm !important;
  border: .5px solid #aaa !important;
  background: #fff !important;
}
.report-print-source .report-condition-bar-track i { display:block !important; height:100% !important; }
.report-print-source .report-condition-bar-track i.good { background:#00b050 !important; }
.report-print-source .report-condition-bar-track i.regular { background:#fff200 !important; }
.report-print-source .report-condition-bar-track i.bad { background:#ff1f1f !important; }

.report-print-source .report-tire-semaphore {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 1.5mm !important;
  margin-bottom: 3mm !important;
  padding: 2mm !important;
  border: 1px solid #555 !important;
  border-radius: 4mm !important;
  background:#fff !important;
}
.report-print-source .report-tire-semaphore article {
  display:flex !important;
  flex-direction:column !important;
  align-items:center !important;
  padding:1.5mm !important;
  border:1px solid #888 !important;
  border-radius:2mm !important;
  background:#fff !important;
  color:#000 !important;
}
.report-print-source .report-tire-semaphore article > span {
  width:14mm !important; height:14mm !important; border-radius:50% !important; margin-bottom:1mm !important;
  box-shadow: inset 0 0 0 2mm rgba(255,255,255,.38), 0 0 0 .6mm #999 !important;
}
.report-print-source .report-tire-semaphore article.good > span { background:#00b050 !important; }
.report-print-source .report-tire-semaphore article.regular > span { background:#fff200 !important; }
.report-print-source .report-tire-semaphore article.bad > span { background:#ff1f1f !important; }
.report-print-source .report-tire-semaphore strong,
.report-print-source .report-tire-semaphore b { color:#000 !important; font-size:6.4pt !important; }

.report-print-source .semaphore-cell.good,
.report-print-source .report-tire-condition-cell.good { background:#00b050 !important; color:#000 !important; }
.report-print-source .semaphore-cell.regular,
.report-print-source .report-tire-condition-cell.regular { background:#fff200 !important; color:#000 !important; }
.report-print-source .semaphore-cell.bad,
.report-print-source .report-tire-condition-cell.bad { background:#ff1f1f !important; color:#000 !important; }
.report-print-source .report-tire-total-table .total-row td { background:#e5e5e5 !important; font-weight:800 !important; }

.report-print-source .report-tire-groups { display:flex !important; flex-direction:column !important; gap:3mm !important; }
.report-print-source .report-tire-vehicle-block { break-inside:avoid !important; page-break-inside:avoid !important; }
.report-print-source .report-tire-observations { text-align:left !important; vertical-align:top !important; }

.report-print-source .report-service-detail-list { display:flex !important; flex-direction:column !important; gap:3mm !important; margin-top:3mm !important; }
.report-print-source .report-service-detail-card { border:1px solid #000 !important; padding:2mm !important; break-inside:avoid !important; }
.report-print-source .report-service-detail-heading { display:flex !important; justify-content:space-between !important; gap:4mm !important; margin-bottom:2mm !important; color:#000 !important; font-size:7pt !important; }
.report-print-source .report-technical-detail h3 { margin:2mm 0 1mm !important; color:#000 !important; font-size:8pt !important; }
.report-print-source .report-technical-grid { display:grid !important; grid-template-columns:repeat(2, 1fr) !important; gap:0 !important; border-top:1px solid #000 !important; border-left:1px solid #000 !important; }
.report-print-source .report-technical-grid > div { display:grid !important; grid-template-columns:1fr 1fr !important; border-right:1px solid #000 !important; border-bottom:1px solid #000 !important; padding:1mm !important; color:#000 !important; font-size:6.5pt !important; }
.report-print-source .report-technical-grid span,
.report-print-source .report-technical-grid strong { color:#000 !important; }

@media (max-width: 900px) {
  .report-print-source { padding: 12px !important; }
  .report-print-source .report-document { transform-origin: top left; }
}


/* ============================================================
   CORRECCIÓN FINAL DE VISTA PREVIA EN PANTALLA
   - Mantiene visible el dashboard.
   - La vista previa se muestra como hoja Carta completa.
   - Evita heredar fondos/colores oscuros del panel.
============================================================ */
@media screen {
  .report-preview-shell.report-print-source {
    display: flex !important;
    justify-content: center !important;
    align-items: flex-start !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 20px !important;
    overflow-x: auto !important;
    overflow-y: visible !important;
    background: var(--admin-card, #101a2a) !important;
  }

  #report-print-area.report-document {
    display: block !important;
    position: relative !important;
    width: min(100%, 816px) !important;
    max-width: 816px !important;
    min-width: 0 !important;
    min-height: 1056px !important;
    margin: 0 auto !important;
    padding: clamp(18px, 3vw, 38px) !important;
    overflow: visible !important;
    background: #ffffff !important;
    color: #000000 !important;
    border: 1px solid #d7d7d7 !important;
    border-radius: 0 !important;
    box-shadow: 0 12px 34px rgba(0, 0, 0, .30) !important;
    box-sizing: border-box !important;
    font-family: Arial, Helvetica, sans-serif !important;
    isolation: isolate !important;
  }

  #report-print-area.report-document.report-document-landscape {
    width: min(100%, 1056px) !important;
    max-width: 1056px !important;
    min-height: 816px !important;
  }

  #report-print-area.report-document,
  #report-print-area.report-document section,
  #report-print-area.report-document article,
  #report-print-area.report-document header,
  #report-print-area.report-document div:not(.report-tire-condition-cell):not(.semaphore-cell),
  #report-print-area.report-document table,
  #report-print-area.report-document thead,
  #report-print-area.report-document tbody,
  #report-print-area.report-document tr,
  #report-print-area.report-document th,
  #report-print-area.report-document td {
    color: #000000 !important;
  }

  #report-print-area.report-document .report-section,
  #report-print-area.report-document .report-section-title,
  #report-print-area.report-document .report-table-wrapper,
  #report-print-area.report-document .report-service-detail-list,
  #report-print-area.report-document .report-service-detail-card,
  #report-print-area.report-document .report-technical-detail,
  #report-print-area.report-document .report-tire-overview,
  #report-print-area.report-document .report-tire-chart-card,
  #report-print-area.report-document .report-tire-overview-right,
  #report-print-area.report-document .report-tire-groups,
  #report-print-area.report-document .report-tire-vehicle-block {
    background: #ffffff !important;
    color: #000000 !important;
    box-shadow: none !important;
  }

  #report-print-area.report-document .report-table,
  #report-print-area.report-document .report-tire-total-table,
  #report-print-area.report-document .report-tire-vehicle-table {
    background: #ffffff !important;
    color: #000000 !important;
  }

  #report-print-area.report-document .report-table th,
  #report-print-area.report-document .report-table td,
  #report-print-area.report-document .report-tire-total-table th,
  #report-print-area.report-document .report-tire-total-table td,
  #report-print-area.report-document .report-tire-vehicle-table th,
  #report-print-area.report-document .report-tire-vehicle-table td {
    background: #ffffff !important;
    color: #000000 !important;
    border-color: #000000 !important;
  }

  #report-print-area.report-document .report-tire-condition-cell.good,
  #report-print-area.report-document .semaphore-cell.good {
    background: #00b050 !important;
    color: #000000 !important;
  }

  #report-print-area.report-document .report-tire-condition-cell.regular,
  #report-print-area.report-document .semaphore-cell.regular {
    background: #fff200 !important;
    color: #000000 !important;
  }

  #report-print-area.report-document .report-tire-condition-cell.bad,
  #report-print-area.report-document .semaphore-cell.bad {
    background: #ff1f1f !important;
    color: #000000 !important;
  }

  #report-print-area.report-document .report-company-header,
  #report-print-area.report-document .report-company-left,
  #report-print-area.report-document .report-company-right,
  #report-print-area.report-document .report-company-data,
  #report-print-area.report-document .reference-document-title,
  #report-print-area.report-document .report-reference-title {
    background: #ffffff !important;
    color: #000000 !important;
  }
}

@media screen and (max-width: 900px) {
  .report-preview-shell.report-print-source {
    padding: 12px !important;
  }

  #report-print-area.report-document {
    padding: 24px !important;
    min-height: auto !important;
  }
}

@media screen and (max-width: 600px) {
  #report-print-area.report-document {
    padding: 16px !important;
  }

  #report-print-area.report-reference-sheet,
  #report-print-area.report-document {
    width: 100% !important;
    max-width: 100% !important;
  }

  #report-print-area.report-reference-sheet .reference-header,
  #report-print-area.report-reference-sheet .reference-summary-grid,
  #report-print-area.report-reference-sheet .reference-service-details,
  #report-print-area.report-reference-sheet .reference-tire-overview {
    grid-template-columns: 1fr !important;
  }

  #report-print-area.report-reference-sheet .reference-semaphore,
  #report-print-area.report-reference-sheet .reference-service-circles {
    gap: 6px !important;
  }
}



/* ============================================================
   FORMATO DE REPORTE — REFERENCIA PDF ORIGINAL
   No modifica el dashboard; sólo la hoja de reporte.
============================================================ */
.report-preview-shell.report-print-source {
  overflow: auto !important;
  padding: 18px !important;
  background: var(--admin-card, #0f1b2e) !important;
}

#report-print-area.report-reference-sheet {
  width: min(100%, 8.5in) !important;
  min-width: 0 !important;
  min-height: 11in !important;
  max-width: 8.5in !important;
  margin: 0 auto !important;
  padding: clamp(12px, 2vw, 0.15in) !important;
  background: #fff !important;
  color: #000 !important;
  box-sizing: border-box !important;
  font-family: Arial, Helvetica, sans-serif !important;
  font-size: clamp(8px, 1.2vw, 10px) !important;
  line-height: 1.15 !important;
  box-shadow: 0 8px 26px rgba(0,0,0,.28) !important;
}

#report-print-area.report-document-landscape {
  width: min(100%, 11in) !important;
  min-width: 0 !important;
  max-width: 11in !important;
  min-height: 8.5in !important;
}

.report-reference-sheet * { box-sizing: border-box; color: #000; }
.reference-header { display:grid; grid-template-columns:1fr 1fr; gap:24px; align-items:start; min-height:220px; }
.reference-brand { display:flex; flex-direction:column; align-items:center; text-align:center; padding-top:10px; font-size:10px; }
.reference-logo { width: 270px; height: 92px; object-fit:contain; display:block; margin-bottom:8px; }
.reference-brand strong { font-size: 12px; margin-bottom: 5px; }
.reference-brand span { line-height:1.35; }
.reference-header-right { padding: 10px 0 0; display: flex; flex-direction: column; align-items: center; }
.reference-date-grid { width:250px;margin:0 auto;border-collapse:collapse;table-layout:fixed; }
.reference-date-grid th,.reference-date-grid td { border:2px solid #111; padding:4px 6px; text-align:center; font-size:10px; font-weight:700; }
.reference-author-line { display:grid;grid-template-columns:80px 1fr;width:250px;margin:18px auto 0;border-bottom:2px solid #111;padding-bottom:5px;align-items:end; }
.reference-author-line strong,.reference-author-line span { font-size:10px; text-align:center; }
.reference-summary-grid { display:grid;grid-template-columns:46% 54%;gap:12px;align-items:stretch;margin-top:0;margin-bottom:18px; }
.reference-chart-box { border:1px solid #cfcfcf; min-height:165px; padding:12px; }
.reference-chart-box h3 { text-align:center; font-size:10px; letter-spacing:2px; margin:0 0 14px; }
.reference-summary-right { display:flex; flex-direction:column; gap:10px; }
.reference-semaphore { border:2px solid #666; border-radius:16px; display:grid; grid-template-columns:repeat(3,1fr); gap:6px; padding:10px; }
.reference-semaphore article { border:2px solid #ccc; border-radius:10px; padding:8px 4px; display:flex; flex-direction:column; align-items:center; gap:4px; }
.reference-semaphore article.good { border-color:#00b050; }.reference-semaphore article.regular{border-color:#fff200}.reference-semaphore article.bad{border-color:#ff1f1f}
.reference-semaphore article>span { width:64px; height:64px; border-radius:50%; box-shadow:inset 0 0 0 8px rgba(255,255,255,.45),0 0 0 2px #aaa; }
.reference-semaphore .good>span{background:#00b050}.reference-semaphore .regular>span{background:#fff200}.reference-semaphore .bad>span{background:#ff1f1f}
.reference-semaphore small { font-size:9px; }.reference-semaphore b{font-size:10px}
.reference-total-table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:10px; }
.reference-total-table th,.reference-total-table td { border:2px solid #111; padding:3px 4px; text-align:center; font-weight:700; }
.reference-total-table .state.good{background:#00b050}.reference-total-table .state.regular{background:#fff200}.reference-total-table .state.bad{background:#ff1f1f}.reference-total-table .total{background:#ddd}
.reference-tire-chart { display:flex; flex-direction:column; gap:18px; padding:5px 0; }
.chart-group { display:grid; grid-template-columns:95px 1fr; gap:6px; align-items:center; }.chart-group>span{font-size:8px;font-weight:700}.chart-lines{display:flex;flex-direction:column;gap:3px}.chart-lines i{height:7px;display:block;min-width:2px}.chart-lines .bad{background:#ff1f1f}.chart-lines .regular{background:#f1b500}.chart-lines .good{background:#54a8b6}
.chart-legend{font-size:7px;margin-top:12px;text-align:center}.chart-legend span{display:inline-block;width:7px;height:7px;margin:0 2px 0 8px}.chart-legend .bad{background:#ff1f1f}.chart-legend .regular{background:#f1b500}.chart-legend .good{background:#54a8b6}
.reference-tire-list,.reference-service-list { display:flex; flex-direction:column; gap:12px; }
.reference-tire-block,.reference-service-block { break-inside:avoid; page-break-inside:avoid; }
.reference-tire-table,.reference-service-table,.reference-detail-table { width:100%; border-collapse:collapse; table-layout:fixed; }
.reference-tire-table th,.reference-tire-table td,.reference-service-table th,.reference-service-table td,.reference-detail-table th,.reference-detail-table td { border:2px solid #111; padding:3px 4px; text-align:center; font-size:10px; line-height:1.05; }
.reference-tire-table th,.reference-service-table th,.reference-detail-table th { font-weight:800; }
.reference-tire-table .label-col { width:105px; }.reference-tire-table .obs-col{width:155px}.reference-tire-table .obs-cell{text-align:left;vertical-align:top}
.reference-tire-table .condition-cell.good{background:#00b050;font-weight:800}.reference-tire-table .condition-cell.regular{background:#fff200;font-weight:800}.reference-tire-table .condition-cell.bad{background:#ff1f1f;font-weight:800}
.reference-report-title { border-top:2px solid #111; border-bottom:2px solid #111; text-align:center; font-size:14px; font-weight:800; padding:6px; margin:0 0 12px; }
.reference-service-circles { display:grid;grid-template-columns:repeat(3,1fr);gap:6px;border:2px solid #666;border-radius:16px;padding:10px}.reference-service-circles article{display:flex;flex-direction:column;align-items:center;gap:4px}.reference-service-circles .circle{width:62px;height:62px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;border:7px solid rgba(255,255,255,.5);box-shadow:0 0 0 2px #aaa}.circle.motor{background:#4da3ff}.circle.transmission{background:#ffd84d}.circle.tires{background:#43c66d}.reference-service-circles strong,.reference-service-circles b{font-size:9px}
.service-bars{display:flex;flex-direction:column;gap:14px}.service-bar-row{display:grid;grid-template-columns:90px 1fr 24px;align-items:center;gap:6px}.service-bar-row>div{height:12px;border:1px solid #bbb}.service-bar-row i{display:block;height:100%;background:#54a8b6}.service-bar-row span{font-size:8px;font-weight:700}.service-bar-row b{text-align:right}
.reference-service-details{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:5px}.reference-detail-table thead th{background:#eee}.reference-empty{border:2px solid #111;padding:24px;text-align:center;font-weight:700}

@media screen and (max-width: 900px) {
  #report-print-area.report-reference-sheet { transform-origin: top left; }
  .report-preview-shell.report-print-source { padding: 10px !important; }
}

@media print {
  @page { size: letter portrait; margin: 0.15in; }
  #report-print-area.report-reference-sheet { width:8.2in !important; min-height:10.7in !important; margin:0 !important; padding:0 !important; box-shadow:none !important; }
  #report-print-area.report-document-landscape { width:10.7in !important; min-height:8.2in !important; }
}

/* ============================================================
   AJUSTE FINAL DE SIMETRÍA DEL FORMATO DE REPORTE
   Conserva el diseño; únicamente ordena alineaciones y espacios.
============================================================ */
#report-print-area.report-reference-sheet .reference-header {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
  gap: 24px !important;
  min-height: 220px !important;
  align-items: start !important;
}
#report-print-area.report-reference-sheet .reference-brand,
#report-print-area.report-reference-sheet .reference-header-right {
  width: 100% !important;
  min-width: 0 !important;
}
#report-print-area.report-reference-sheet .reference-brand {
  padding-top: 10px !important;
}
#report-print-area.report-reference-sheet .reference-logo {
  width: 250px !important;
  height: 88px !important;
  margin: 0 auto 8px !important;
}
#report-print-area.report-reference-sheet .reference-header-right {
  padding-top: 10px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
}
#report-print-area.report-reference-sheet .reference-date-grid,
#report-print-area.report-reference-sheet .reference-author-line {
  width: 250px !important;
  margin-left: auto !important;
  margin-right: auto !important;
}
#report-print-area.report-reference-sheet .reference-summary-grid {
  grid-template-columns: minmax(0, 46fr) minmax(0, 54fr) !important;
  gap: 12px !important;
  align-items: stretch !important;
  margin-top: 0 !important;
  margin-bottom: 18px !important;
}
#report-print-area.report-reference-sheet .reference-chart-box,
#report-print-area.report-reference-sheet .reference-summary-right {
  min-height: 176px !important;
}
#report-print-area.report-reference-sheet .reference-summary-right {
  justify-content: space-between !important;
}
#report-print-area.report-reference-sheet .reference-semaphore,
#report-print-area.report-reference-sheet .reference-service-circles {
  width: 100% !important;
}
#report-print-area.report-reference-sheet .reference-total-table {
  margin-top: 0 !important;
}
#report-print-area.report-reference-sheet .reference-report-title {
  margin-top: 2px !important;
  margin-bottom: 14px !important;
}
#report-print-area.report-reference-sheet .reference-tire-list,
#report-print-area.report-reference-sheet .reference-service-list {
  gap: 14px !important;
}


/* ============================================================
   AJUSTE DE PROPORCIONES Y MÁRGENES — SIN CAMBIAR EL FORMATO
   ============================================================ */
#report-print-area.report-reference-sheet {
  overflow: hidden !important;
}

#report-print-area.report-reference-sheet > * {
  max-width: 100% !important;
}

#report-print-area.report-reference-sheet .reference-header,
#report-print-area.report-reference-sheet .reference-summary-grid,
#report-print-area.report-reference-sheet .reference-report-title,
#report-print-area.report-reference-sheet .reference-tire-list,
#report-print-area.report-reference-sheet .reference-service-list {
  width: 100% !important;
  max-width: 100% !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

#report-print-area.report-reference-sheet .reference-header {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
  column-gap: 18px !important;
}

#report-print-area.report-reference-sheet .reference-brand,
#report-print-area.report-reference-sheet .reference-header-right {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

#report-print-area.report-reference-sheet .reference-brand {
  overflow: hidden !important;
}

#report-print-area.report-reference-sheet .reference-logo {
  display: block !important;
  width: 270px !important;
  max-width: 86% !important;
  height: 72px !important;
  margin: 4px auto 10px !important;
  object-fit: cover !important;
  object-position: center center !important;
  border: 0 !important;
  outline: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

#report-print-area.report-reference-sheet .reference-date-grid {
  width: 252px !important;
  max-width: 100% !important;
  table-layout: fixed !important;
  margin: 0 auto !important;
}

#report-print-area.report-reference-sheet .reference-date-grid th,
#report-print-area.report-reference-sheet .reference-date-grid td {
  overflow: hidden !important;
  text-overflow: clip !important;
  white-space: nowrap !important;
  padding: 4px 3px !important;
  line-height: 1.05 !important;
  vertical-align: middle !important;
}

#report-print-area.report-reference-sheet .reference-date-grid th:nth-child(1),
#report-print-area.report-reference-sheet .reference-date-grid td:nth-child(1) {
  width: 25% !important;
}

#report-print-area.report-reference-sheet .reference-date-grid th:nth-child(2),
#report-print-area.report-reference-sheet .reference-date-grid td:nth-child(2) {
  width: 45% !important;
}

#report-print-area.report-reference-sheet .reference-date-grid th:nth-child(3),
#report-print-area.report-reference-sheet .reference-date-grid td:nth-child(3) {
  width: 30% !important;
}

#report-print-area.report-reference-sheet .reference-date-grid tbody td:nth-child(2) {
  font-size: 9px !important;
  letter-spacing: 0 !important;
}

#report-print-area.report-reference-sheet .reference-author-line {
  width: 252px !important;
  max-width: 100% !important;
  grid-template-columns: 74px minmax(0, 1fr) !important;
}

#report-print-area.report-reference-sheet .reference-author-line span {
  min-width: 0 !important;
  overflow-wrap: anywhere !important;
}

#report-print-area.report-reference-sheet .reference-chart-box,
#report-print-area.report-reference-sheet .reference-summary-right,
#report-print-area.report-reference-sheet .reference-semaphore,
#report-print-area.report-reference-sheet .reference-service-circles,
#report-print-area.report-reference-sheet .reference-total-table,
#report-print-area.report-reference-sheet .reference-tire-table,
#report-print-area.report-reference-sheet .reference-service-table,
#report-print-area.report-reference-sheet .reference-detail-table {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

#report-print-area.report-reference-sheet table {
  table-layout: fixed !important;
}

#report-print-area.report-reference-sheet th,
#report-print-area.report-reference-sheet td {
  overflow-wrap: anywhere !important;
  word-break: normal !important;
}

#report-print-area.report-reference-sheet .reference-tire-table .label-col {
  width: 15% !important;
}

#report-print-area.report-reference-sheet .reference-tire-table .obs-col {
  width: 22% !important;
}

#report-print-area.report-reference-sheet .reference-service-table th,
#report-print-area.report-reference-sheet .reference-service-table td {
  padding-left: 3px !important;
  padding-right: 3px !important;
}

@media print {
  #report-print-area.report-reference-sheet {
    overflow: hidden !important;
  }

  #report-print-area.report-reference-sheet .reference-logo {
    width: 2.7in !important;
    max-width: 86% !important;
    height: .72in !important;
    object-fit: cover !important;
    object-position: center center !important;
  }

  #report-print-area.report-reference-sheet .reference-date-grid,
  #report-print-area.report-reference-sheet .reference-author-line {
    width: 2.52in !important;
    max-width: 100% !important;
  }
}



/* ============================================================
   AJUSTES FINALES — REPORTES
   1) Respeta los cuatro márgenes de la hoja Carta.
   2) Mantiene todos los resúmenes dentro del área imprimible.
   3) Compacta y ordena el apartado Reportes del dashboard.
   4) La vista previa queda visible debajo al generarse.
============================================================ */

/* ---------- PANEL DE REPORTES: compacto, consistente y claro ---------- */
.report-filter-card {
  display: flex !important;
  flex-direction: column !important;
  gap: 18px !important;
  padding: 22px !important;
}

.report-filter-heading {
  margin: 0 !important;
  padding: 0 0 14px !important;
  border-bottom: 1px solid var(--admin-border, rgba(148, 163, 184, .22)) !important;
}

.report-filter-heading h2 {
  margin: 0 0 4px !important;
  font-size: 1.18rem !important;
  line-height: 1.2 !important;
}

.report-filter-heading p {
  margin: 0 !important;
  opacity: .78 !important;
}

.report-type-selector {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 12px !important;
  margin: 0 !important;
}

.report-type-option {
  min-width: 0 !important;
  min-height: 96px !important;
  padding: 16px !important;
  display: grid !important;
  grid-template-columns: 50px minmax(0, 1fr) 22px !important;
  align-items: center !important;
  gap: 14px !important;
  text-align: left !important;
}

.report-type-option > div:nth-child(2) {
  min-width: 0 !important;
}

.report-type-option strong,
.report-type-option span {
  display: block !important;
  overflow-wrap: anywhere !important;
}

.report-type-option strong {
  margin-bottom: 5px !important;
}

.report-filter-grid {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 14px !important;
  margin: 0 !important;
}

.report-filter-field {
  min-width: 0 !important;
}

.report-filter-field select,
.report-filter-field input {
  width: 100% !important;
  min-width: 0 !important;
  height: 48px !important;
}

.report-filter-actions {
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  gap: 10px !important;
  margin: 0 !important;
  padding-top: 4px !important;
}

.report-filter-actions .btn-admin-secondary,
.report-filter-actions .btn-admin-primary {
  min-height: 46px !important;
  width: auto !important;
  min-width: 158px !important;
  padding: 0 18px !important;
}

.report-empty-state {
  min-height: 210px !important;
  padding: 34px 22px !important;
}

.report-export-toolbar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 18px !important;
  flex-wrap: wrap !important;
  padding: 18px 20px !important;
}

.report-export-info {
  min-width: 220px !important;
  flex: 1 1 280px !important;
}

.report-export-controls {
  flex: 0 1 auto !important;
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 8px !important;
}

/* ---------- VISTA PREVIA: hoja Carta real dentro del dashboard ---------- */
#report-preview-section {
  scroll-margin-top: 88px !important;
}

.report-preview-shell.report-print-source {
  width: 100% !important;
  max-width: 100% !important;
  overflow: auto !important;
  padding: 18px !important;
}

#report-print-area.report-reference-sheet {
  width: 8.5in !important;
  max-width: 8.5in !important;
  min-height: 11in !important;
  margin: 0 auto !important;
  padding: .30in !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

#report-print-area.report-reference-sheet.report-document-landscape {
  width: 11in !important;
  max-width: 11in !important;
  min-height: 8.5in !important;
}

/* Todo bloque principal debe caber en el ancho útil de la hoja. */
#report-print-area.report-reference-sheet .reference-header,
#report-print-area.report-reference-sheet .reference-summary-grid,
#report-print-area.report-reference-sheet .reference-summary-right,
#report-print-area.report-reference-sheet .reference-chart-box,
#report-print-area.report-reference-sheet .reference-semaphore,
#report-print-area.report-reference-sheet .reference-total-table,
#report-print-area.report-reference-sheet .reference-report-title,
#report-print-area.report-reference-sheet .reference-tire-list,
#report-print-area.report-reference-sheet .reference-service-list,
#report-print-area.report-reference-sheet .reference-tire-block,
#report-print-area.report-reference-sheet .reference-service-block,
#report-print-area.report-reference-sheet .reference-tire-table,
#report-print-area.report-reference-sheet .reference-service-table,
#report-print-area.report-reference-sheet .reference-detail-table,
#report-print-area.report-reference-sheet .reference-service-details,
#report-print-area.report-reference-sheet .reference-service-circles,
#report-print-area.report-reference-sheet .service-bars {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
}

/* Evita el desborde causado por porcentajes + gap. */
#report-print-area.report-reference-sheet .reference-header {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
  gap: .22in !important;
  min-height: 1.72in !important;
  margin-bottom: .16in !important;
}

#report-print-area.report-reference-sheet .reference-summary-grid {
  grid-template-columns: minmax(0, 46fr) minmax(0, 54fr) !important;
  gap: .12in !important;
  margin: 0 0 .16in !important;
  align-items: stretch !important;
}

#report-print-area.report-reference-sheet .reference-summary-grid > *,
#report-print-area.report-reference-sheet .reference-header > *,
#report-print-area.report-reference-sheet .reference-service-details > * {
  min-width: 0 !important;
  max-width: 100% !important;
}

#report-print-area.report-reference-sheet .reference-summary-right {
  gap: .08in !important;
}

/* Los tres indicadores jamás pueden salir del margen derecho. */
#report-print-area.report-reference-sheet .reference-semaphore,
#report-print-area.report-reference-sheet .reference-service-circles {
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 5px !important;
  padding: 7px !important;
}

#report-print-area.report-reference-sheet .reference-semaphore article,
#report-print-area.report-reference-sheet .reference-service-circles article {
  min-width: 0 !important;
  max-width: 100% !important;
  padding: 6px 3px !important;
}

#report-print-area.report-reference-sheet .reference-semaphore article > span,
#report-print-area.report-reference-sheet .reference-service-circles .circle {
  width: 52px !important;
  height: 52px !important;
  flex: 0 0 52px !important;
}

#report-print-area.report-reference-sheet .reference-semaphore small,
#report-print-area.report-reference-sheet .reference-semaphore b,
#report-print-area.report-reference-sheet .reference-service-circles strong,
#report-print-area.report-reference-sheet .reference-service-circles b {
  max-width: 100% !important;
  text-align: center !important;
  white-space: normal !important;
  overflow-wrap: anywhere !important;
}

/* Tabla de totales: columnas equivalentes, texto contenido. */
#report-print-area.report-reference-sheet .reference-total-table {
  table-layout: fixed !important;
}

#report-print-area.report-reference-sheet .reference-total-table th,
#report-print-area.report-reference-sheet .reference-total-table td {
  padding: 3px 2px !important;
  font-size: 8px !important;
  line-height: 1.05 !important;
  white-space: normal !important;
  overflow-wrap: anywhere !important;
}

/* Resumen de servicios: círculo + tabla siempre dentro del ancho. */
#report-print-area.report-reference-sheet .reference-service-circles .circle {
  font-size: 20px !important;
}

#report-print-area.report-reference-sheet .service-bar-row {
  grid-template-columns: 68px minmax(0, 1fr) 20px !important;
  gap: 5px !important;
}

#report-print-area.report-reference-sheet .service-bar-row > div {
  min-width: 0 !important;
}

/* Tablas técnicas más legibles y compactas. */
#report-print-area.report-reference-sheet .reference-service-list,
#report-print-area.report-reference-sheet .reference-tire-list {
  gap: 8px !important;
}

#report-print-area.report-reference-sheet .reference-service-block,
#report-print-area.report-reference-sheet .reference-tire-block {
  margin: 0 !important;
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

#report-print-area.report-reference-sheet .reference-service-table th,
#report-print-area.report-reference-sheet .reference-service-table td,
#report-print-area.report-reference-sheet .reference-detail-table th,
#report-print-area.report-reference-sheet .reference-detail-table td,
#report-print-area.report-reference-sheet .reference-tire-table th,
#report-print-area.report-reference-sheet .reference-tire-table td {
  padding: 3px 3px !important;
  font-size: 8.5px !important;
  line-height: 1.08 !important;
  overflow-wrap: anywhere !important;
}

#report-print-area.report-reference-sheet .reference-service-details {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 6px !important;
}

/* Menos espacio vacío sin cambiar la estructura del formato. */
#report-print-area.report-reference-sheet .reference-chart-box {
  min-height: 1.42in !important;
  padding: 8px !important;
}

#report-print-area.report-reference-sheet .reference-chart-box h3 {
  margin: 0 0 8px !important;
}

#report-print-area.report-reference-sheet .reference-tire-chart {
  gap: 10px !important;
}

#report-print-area.report-reference-sheet .reference-report-title {
  margin: .08in 0 .10in !important;
  padding: 5px !important;
}

/* ---------- RESPONSIVE DEL PANEL, SIN ALTERAR LA HOJA ---------- */
@media screen and (max-width: 760px) {
  .report-type-selector,
  .report-filter-grid {
    grid-template-columns: 1fr !important;
  }

  .report-filter-actions {
    display: grid !important;
    grid-template-columns: 1fr !important;
  }

  .report-filter-actions .btn-admin-secondary,
  .report-filter-actions .btn-admin-primary {
    width: 100% !important;
    min-width: 0 !important;
  }

  .report-export-toolbar {
    align-items: stretch !important;
  }

  .report-export-controls {
    width: 100% !important;
    justify-content: flex-start !important;
  }
}

/* ---------- IMPRESIÓN: margen físico real en los cuatro lados ---------- */
@media print {
  @page {
    size: letter portrait;
    margin: .30in;
  }

  #report-print-area.report-reference-sheet {
    width: 100% !important;
    max-width: 100% !important;
    min-height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    box-shadow: none !important;
  }

  #report-print-area.report-reference-sheet.report-document-landscape {
    width: 100% !important;
    max-width: 100% !important;
    min-height: auto !important;
  }

  #report-print-area.report-reference-sheet .reference-summary-grid {
    grid-template-columns: minmax(0, 46fr) minmax(0, 54fr) !important;
    gap: .10in !important;
  }

  #report-print-area.report-reference-sheet .reference-header {
    gap: .18in !important;
  }
}



/* ============================================================
   REPORTES · CONSISTENCIA DEL MÓDULO E HISTORIAL
============================================================ */
.report-export-toolbar-fixed {
  margin-top: 18px !important;
}

.report-export-button:disabled {
  opacity: .45 !important;
  cursor: not-allowed !important;
}

.report-history-card {
  margin-top: 20px !important;
  padding: 22px !important;
  border-radius: 18px !important;
}

.report-history-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 16px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--admin-border);
}

.report-history-heading h2 {
  margin: 3px 0 4px;
  font-size: 1.15rem;
  color: var(--admin-text);
}

.report-history-heading p {
  margin: 0;
  color: var(--admin-muted);
  font-size: .9rem;
}

.report-history-eyebrow {
  color: var(--admin-primary);
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .1em;
}

.report-history-refresh,
.report-history-view {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 38px;
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  background: var(--admin-card-soft);
  color: var(--admin-text);
  font-weight: 700;
  padding: 8px 13px;
}

.report-history-view {
  border-color: color-mix(in srgb, var(--admin-primary) 50%, var(--admin-border));
  color: var(--admin-primary);
}

.report-history-state {
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: var(--admin-muted);
  text-align: center;
}

.report-history-field {
  display: grid;
  flex: 1 1 0;
  gap: 7px;
  min-width: 0;
}

.report-history-field label {
  display: block;
  color: var(--admin-text);
  font-size: .88rem;
  font-weight: 700;
}

.report-history-search-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  align-items: end;
  gap: 12px;
}

.report-history-search-controls input,
.report-history-search-controls select {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 44px;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  background: var(--admin-card-soft);
  color: var(--admin-text);
  font: inherit;
  line-height: normal;
}

.report-history-view {
  box-sizing: border-box;
  min-height: 44px;
  white-space: nowrap;
}

.report-history-match {
  flex: 1;
  color: var(--admin-text);
  font-size: .9rem;
}

.report-history-search-hint {
  margin: 8px 0 0;
  color: var(--admin-muted);
  font-size: .85rem;
}

.report-history-view:disabled {
  opacity: .5;
  cursor: not-allowed;
}

@media screen and (max-width: 760px) {
  .report-history-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .report-history-refresh {
    width: 100%;
  }

  .report-history-search-controls {
    grid-template-columns: minmax(0, 1fr);
  }

  .report-history-field,
  .report-history-view {
    width: 100%;
    flex: none;
  }

  .report-history-match {
    padding: 8px 0;
  }
}



/* ============================================================
   CORRECCIÓN DEFINITIVA DE GEOMETRÍA DEL REPORTE
   Una sola geometría para vista previa, PDF, Word e impresión.
============================================================ */
#report-print-area.report-reference-sheet {
  width: 8.5in !important;
  max-width: 8.5in !important;
  min-height: 11in !important;
  padding: .30in !important;
  margin: 0 auto !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

#report-print-area.report-reference-sheet.report-document-landscape {
  width: 11in !important;
  max-width: 11in !important;
  min-height: 8.5in !important;
}

#report-print-area.report-reference-sheet .reference-logo {
  width: 2.45in !important;
  max-width: 82% !important;
  height: .70in !important;
  object-fit: contain !important;
  object-position: center !important;
  margin: 0 auto .08in !important;
}

#report-print-area.report-reference-sheet .reference-summary-grid {
  display: grid !important;
  grid-template-columns: minmax(0, 45fr) minmax(0, 55fr) !important;
  column-gap: .08in !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

#report-print-area.report-reference-sheet .reference-summary-grid > * {
  min-width: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

#report-print-area.report-reference-sheet .reference-summary-right {
  min-width: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

#report-print-area.report-reference-sheet .reference-semaphore,
#report-print-area.report-reference-sheet .reference-service-circles,
#report-print-area.report-reference-sheet .reference-total-table {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
}

#report-print-area.report-reference-sheet .reference-semaphore,
#report-print-area.report-reference-sheet .reference-service-circles {
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 4px !important;
  padding: 6px !important;
}

#report-print-area.report-reference-sheet .reference-semaphore article,
#report-print-area.report-reference-sheet .reference-service-circles article {
  min-width: 0 !important;
  width: auto !important;
  max-width: 100% !important;
  padding: 5px 2px !important;
  box-sizing: border-box !important;
}

#report-print-area.report-reference-sheet .reference-semaphore article > span,
#report-print-area.report-reference-sheet .reference-service-circles .circle {
  width: 48px !important;
  height: 48px !important;
  flex-basis: 48px !important;
}

#report-print-area.report-reference-sheet table {
  max-width: 100% !important;
  box-sizing: border-box !important;
}

#report-print-area.report-reference-sheet .reference-tire-block,
#report-print-area.report-reference-sheet .reference-service-block {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

@media print {
  @page {
    size: letter portrait;
    margin: .30in;
  }

  #report-print-area.report-reference-sheet {
    width: 7.9in !important;
    max-width: 7.9in !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    box-shadow: none !important;
  }

  #report-print-area.report-reference-sheet .reference-logo {
    object-fit: contain !important;
  }

  #report-print-area.report-reference-sheet .reference-summary-grid {
    grid-template-columns: minmax(0, 45fr) minmax(0, 55fr) !important;
    column-gap: .08in !important;
  }
}


/* ============================================================
   GEOMETRÍA FINAL AUTORITATIVA — CARTA / LETTER
   Este bloque debe permanecer al final del <style> para anular
   reglas antiguas contradictorias sin alterar el diseño visual.
============================================================ */
#report-print-area.report-reference-sheet {
  width: 8.5in !important;
  max-width: 8.5in !important;
  min-height: 11in !important;
  padding: .30in !important;
  margin: 0 auto !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

#report-print-area.report-reference-sheet.report-document-landscape {
  width: 11in !important;
  max-width: 11in !important;
  min-height: 8.5in !important;
}

/*
 * El archivo JPEG del logo tiene un lienzo alto/cuadrado.
 * El marco 270x72 + cover es intencional: coincide con la vista previa
 * y evita que Word/PDF muestren todo el lienzo blanco del JPEG.
 */
#report-print-area.report-reference-sheet .reference-logo {
  display: block !important;
  width: 270px !important;
  height: 72px !important;
  max-width: 86% !important;
  margin: 4px auto 10px !important;
  object-fit: cover !important;
  object-position: center center !important;
}

#report-print-area.report-reference-sheet .reference-service-block,
#report-print-area.report-reference-sheet .reference-tire-block {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

@media print {
  @page {
    size: letter portrait;
    margin: .30in;
  }

  #report-print-area.report-reference-sheet {
    width: 7.9in !important;
    max-width: 7.9in !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
  }

  #report-print-area.report-reference-sheet.report-document-landscape {
    width: 10.4in !important;
    max-width: 10.4in !important;
    min-height: 0 !important;
  }

  #report-print-area.report-reference-sheet .reference-logo {
    width: 270px !important;
    height: 72px !important;
    max-width: 86% !important;
    object-fit: cover !important;
    object-position: center center !important;
  }
}



/* ============================================================
   AJUSTE FINAL DE EXPORTACIÓN — LOGO PROPORCIONAL Y CARTA REAL
   El logo embebido ya está recortado al contenido útil; por eso
   puede usarse contain sin deformación ni espacio blanco excesivo.
============================================================ */
#report-print-area.report-reference-sheet .reference-logo {
  width: 250px !important;
  height: 88px !important;
  max-width: 100% !important;
  object-fit: contain !important;
  object-position: center center !important;
  margin: 0 auto 8px !important;
}

#report-print-area.report-reference-sheet .reference-header,
#report-print-area.report-reference-sheet .reference-header-right,
#report-print-area.report-reference-sheet .reference-date-grid,
#report-print-area.report-reference-sheet .reference-author-line {
  box-sizing: border-box !important;
}

#report-print-area.report-reference-sheet .reference-header {
  width: 100% !important;
  max-width: 100% !important;
  overflow: visible !important;
}

#report-print-area.report-reference-sheet .reference-date-grid,
#report-print-area.report-reference-sheet .reference-author-line {
  width: 250px !important;
  max-width: 100% !important;
}

#report-print-area.report-reference-sheet .reference-service-block,
#report-print-area.report-reference-sheet .reference-tire-block {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

@media print {
  #report-print-area.report-reference-sheet .reference-logo {
    width: 250px !important;
    height: 88px !important;
    max-width: 100% !important;
    object-fit: contain !important;
    object-position: center center !important;
  }
}

@media screen {
  #report-preview-section.report-preview-shell.report-print-source {
    box-sizing: border-box !important;
    justify-content: center !important;
    overflow-x: hidden !important;
    padding: clamp(8px, 2.5vw, 18px) !important;
  }

  #report-preview-section #report-print-area.report-reference-sheet {
    zoom: var(--report-preview-scale, 1) !important;
    flex: 0 0 auto !important;
    margin-right: auto !important;
    margin-left: auto !important;
  }
}

.report-vehicle-filter {
  margin: 0 0 18px;
}

.report-vehicle-filter > .report-filter-field > label {
  margin-bottom: 7px;
}

.report-vehicle-combobox {
  position: relative;
}

.report-vehicle-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 58px;
  padding: 10px 15px;
  border: 1px solid var(--admin-border, #e5eaf1);
  border-radius: 11px;
  background: var(--admin-card, #ffffff);
  color: var(--admin-text, #172033);
  text-align: left;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, .04);
  transition:
    border-color .18s ease,
    box-shadow .18s ease,
    background .18s ease;
}

.report-vehicle-trigger:hover,
.report-vehicle-trigger[aria-expanded="true"] {
  border-color: var(--admin-primary, #2563eb);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--admin-primary, #2563eb) 10%, transparent);
}

.report-vehicle-trigger:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--admin-primary, #2563eb) 24%, transparent);
  outline-offset: 1px;
}

.report-vehicle-trigger:disabled {
  cursor: wait;
  opacity: .7;
}

.report-vehicle-trigger-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.report-vehicle-trigger-copy strong {
  overflow: hidden;
  color: var(--admin-text, #172033);
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-vehicle-trigger-copy small,
.report-vehicle-hint {
  display: block;
  color: var(--admin-text-secondary, #64748b);
  font-size: 12px;
}

.report-vehicle-chevron {
  flex: 0 0 auto;
  color: var(--admin-text-secondary, #64748b);
  transition: transform .18s ease;
}

.report-vehicle-chevron.expanded {
  transform: rotate(180deg);
}

.report-vehicle-menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  max-height: min(430px, calc(100vh - 150px));
  padding: 9px;
  border: 1px solid var(--admin-border, #e5eaf1);
  border-radius: 14px;
  background: var(--admin-card, #ffffff);
  box-shadow: 0 16px 38px rgba(15, 23, 42, .18);
}

.report-vehicle-all-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  flex: 0 0 auto;
  padding: 11px;
  border: 0;
  border-radius: 9px;
  background: var(--admin-secondary, #f8fafc);
  color: var(--admin-text, #172033);
  text-align: left;
  cursor: pointer;
}

.report-vehicle-all-option > i {
  color: var(--admin-primary, #2563eb);
  font-size: 18px;
}

.report-vehicle-all-option span {
  display: grid;
  gap: 2px;
}

.report-vehicle-all-option strong {
  font-size: 13px;
}

.report-vehicle-all-option small {
  color: var(--admin-text-secondary, #64748b);
  font-size: 11px;
}

.report-vehicle-all-option:hover,
.report-vehicle-option:hover {
  background: var(--admin-hover, #f1f5f9);
}

.report-vehicle-search {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  min-height: 44px;
  margin-top: 9px;
  padding: 0 12px;
  border: 1px solid var(--admin-border, #e5eaf1);
  border-radius: 10px;
  background: var(--admin-bg, #f4f7fb);
  color: var(--admin-text-secondary, #64748b);
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}

.report-vehicle-search:focus-within {
  border-color: var(--admin-primary, #2563eb);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--admin-primary, #2563eb) 14%, transparent);
  background: var(--admin-card, #ffffff);
}

.report-vehicle-search > i {
  flex: 0 0 auto;
  color: var(--admin-primary, #2563eb);
  font-size: 15px;
}

.report-filter-field .report-vehicle-search input {
  flex: 1 1 auto !important;
  width: 100% !important;
  min-width: 0;
  height: 44px !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  outline: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  color: var(--admin-text, #172033) !important;
  font: inherit;
  font-size: 13px;
}

.report-filter-field .report-vehicle-search input:focus {
  border: 0 !important;
  outline: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.report-filter-field .report-vehicle-search input::placeholder {
  color: var(--admin-text-secondary, #64748b) !important;
  opacity: .85;
}

.report-filter-field .report-vehicle-search input::-webkit-search-cancel-button {
  cursor: pointer;
}

.report-vehicle-hint {
  flex: 0 0 auto;
  margin: 10px 3px 7px;
}

.report-vehicle-options {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 3px;
  min-height: 0;
  max-height: 230px;
  overflow-y: auto;
  padding: 2px 4px 2px 2px;
  scrollbar-color: var(--admin-border, #e5eaf1) transparent;
  scrollbar-width: thin;
}

.report-vehicle-option {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  min-height: 42px;
  padding: 9px 10px;
  border: 1px solid var(--admin-border, #e5eaf1);
  border-radius: 9px;
  background: var(--admin-card, #ffffff);
  color: var(--admin-text, #172033);
  text-align: left;
  cursor: pointer;
  transition:
    border-color .15s ease,
    background .15s ease;
}

.report-vehicle-option[aria-selected="true"] {
  border-color: color-mix(in srgb, var(--admin-primary, #2563eb) 45%, var(--admin-border, #e5eaf1));
  background: var(--admin-primary-soft, #eff6ff);
}

.report-vehicle-option > i {
  flex: 0 0 auto;
  color: var(--admin-text-secondary, #64748b);
  font-size: 17px;
}

.report-vehicle-option[aria-selected="true"] > i {
  color: var(--admin-primary, #2563eb);
}

.report-vehicle-option span {
  min-width: 0;
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.report-vehicle-no-results {
  grid-column: 1 / -1;
  margin: 0;
  padding: 12px 8px;
  color: var(--admin-text-secondary, #64748b);
  font-size: 12px;
  text-align: center;
}

.report-vehicle-menu-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex: 0 0 auto;
  margin-top: 8px;
  padding: 9px 3px 1px;
  border-top: 1px solid var(--admin-border, #e5eaf1);
  color: var(--admin-text-secondary, #64748b);
  font-size: 12px;
}

.report-vehicle-done {
  min-width: 72px;
  min-height: 34px;
  padding: 6px 12px;
  border: 1px solid var(--admin-primary, #2563eb);
  border-radius: 8px;
  background: var(--admin-primary, #2563eb);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 640px) {
  .report-vehicle-menu {
    right: -4px;
    left: -4px;
    max-height: min(430px, calc(100vh - 120px));
  }
}

.mechanic-report-general-actions {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid var(--admin-border, #e5eaf1);
  border-radius: 12px;
  background: var(--admin-secondary, #f8fafc);
}

.mechanic-report-general-copy {
  display: grid;
  gap: 3px;
}

.mechanic-report-general-copy strong {
  color: var(--admin-text, #172033);
  font-size: 13px;
  font-weight: 750;
}

.mechanic-report-general-copy span {
  color: var(--admin-text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.4;
}

.mechanic-report-general-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mechanic-report-general-buttons button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 40px;
  padding: 8px 13px;
  border: 1px solid var(--admin-primary, #2563eb);
  border-radius: 9px;
  background: var(--admin-primary, #2563eb);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.mechanic-report-general-buttons button:hover:not(:disabled) {
  filter: brightness(.95);
}

.mechanic-report-general-buttons button:disabled {
  cursor: wait;
  opacity: .58;
}

.mechanic-report-spin {
  animation: mechanic-report-rotate .9s linear infinite;
}

@keyframes mechanic-report-rotate {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .mechanic-report-general-actions {
    padding: 13px;
  }

  .mechanic-report-general-buttons {
    display: grid;
    grid-template-columns: 1fr;
  }

  .mechanic-report-general-buttons button {
    width: 100%;
  }
}

.report-direct-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid var(--admin-border, #e5eaf1);
  border-radius: 12px;
  background: var(--admin-secondary, #f8fafc);
}

.report-direct-copy {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.report-direct-icon {
  display: grid;
  flex: 0 0 38px;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid color-mix(in srgb, var(--admin-primary, #2563eb) 24%, var(--admin-border, #e5eaf1));
  border-radius: 10px;
  background: var(--admin-primary-soft, #eff6ff);
  color: var(--admin-primary, #2563eb);
  font-size: 17px;
}

.report-direct-description {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.report-direct-description strong {
  color: var(--admin-text, #172033);
  font-size: 13px;
  font-weight: 750;
}

.report-direct-description small {
  color: var(--admin-text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.4;
}

.report-direct-controls {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.report-direct-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 40px;
  padding: 8px 13px;
  border: 1px solid var(--admin-border, #e5eaf1);
  border-radius: 9px;
  background: var(--admin-card, #ffffff);
  color: var(--admin-text, #172033);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color .18s ease,
    background .18s ease,
    color .18s ease,
    opacity .18s ease;
}

.report-direct-action > i {
  color: var(--admin-primary, #2563eb);
  font-size: 14px;
}

.report-direct-action:hover:not(:disabled) {
  border-color: var(--admin-primary, #2563eb);
  background: var(--admin-primary-soft, #eff6ff);
}

.report-direct-action:disabled {
  cursor: wait;
  opacity: .58;
}

@media (max-width: 640px) {
  .report-direct-actions {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
    padding: 13px;
  }

  .report-direct-controls {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
  }

  .report-direct-action {
    min-width: 0;
    min-height: 42px;
    padding: 8px 6px;
    gap: 5px;
    font-size: 11px;
  }

  .report-direct-action > i {
    font-size: 13px;
  }
}

@media (max-width: 420px) {
  .report-direct-controls {
    grid-template-columns: 1fr;
  }

  .report-direct-action {
    justify-content: flex-start;
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>
