<template>
<div
    class="amc-admin-layout amc-client-portal"
    :class="{ 'dark-mode': isDarkMode }"
  >
    <!-- ======================================================
         SIDEBAR
    ======================================================= -->
    <aside
      class="amc-admin-sidebar"
      :class="{ 'sidebar-open': sidebarOpen }"
    >
      <div class="amc-sidebar-brand">
        <div class="amc-brand-icon">
          <img
            src="../assets/logo-claro.jpg"
            alt="Logo AutoMecanic"
            class="amc-sidebar-brand-logo"
          />
        </div>

        <div>
          <h4>Automecanic</h4>
          <span>Portal del cliente</span>
        </div>
      </div>

      <nav class="amc-sidebar-nav" aria-label="Secciones del portal">
  <button
    v-for="item in navigation"
    :key="item.key"
    type="button"
    class="amc-nav-item"
    :class="{ active: activeSection === item.key }"
    :aria-current="activeSection === item.key ? 'page' : undefined"
    @click="changeSection(item.key)"
  >
    <i :class="item.icon"></i>

    <span class="amc-nav-label">
      {{ item.label }}
    </span>

    <span
      v-if="item.key === 'notificaciones' && alertCount > 0"
      class="amc-nav-notification-badge"
      :aria-label="`${alertCount} notificaciones sin leer`"
    >
      {{ alertCount > 99 ? '99+' : alertCount }}
    </span>
  </button>
</nav>
    </aside>

<!-- ======================================================
     OVERLAY MÓVIL
     BLOQUEA TODA INTERACCIÓN CON EL FONDO
======================================================= -->
  <div
  v-if="sidebarOpen"
  class="amc-sidebar-overlay"
  @click="sidebarOpen = false"
  @touchmove.prevent
  @wheel.prevent
  ></div>

    <!-- ======================================================
         CONTENIDO
    ======================================================= -->
    <main class="amc-admin-main">
      <!-- HEADER -->
      <header class="amc-admin-header">
        <div class="amc-header-left">
          <button
            class="amc-mobile-menu-button"
            aria-label="Abrir o cerrar menú"
            :aria-expanded="sidebarOpen"
            type="button"
            @click="sidebarOpen = !sidebarOpen"
          >
            <i class="bi bi-list"></i>
          </button>

          <div>
            <h1>{{ sectionTitle }}</h1>
            <p>{{ sectionDescription }}</p>
          </div>
        </div>

        <div class="amc-header-right">
          <!-- FECHA -->
          <div class="amc-header-date">
            <i class="bi bi-calendar3"></i>

            <div>
              <span>{{ currentDate }}</span>
              <strong>{{ currentTime }}</strong>
            </div>
          </div>

          <!-- ALERTAS (CON DROPDOWN) -->
          <div class="amc-alerts-wrapper">
            <button
              class="amc-header-icon-button"
              type="button"
              title="Ver notificaciones"
              aria-label="Ver notificaciones"
              @click.stop="toggleNotifications"
            >
              <i class="bi bi-bell"></i>

              <span
                v-if="alertCount > 0"
                class="amc-header-notification"
              >
                {{ alertCount > 99 ? '99+' : alertCount }}
              </span>
            </button>

            <!-- DROPDOWN DE NOTIFICACIONES -->
            <div
              v-if="showNotificationsDropdown"
              class="amc-notifications-dropdown"
              @click.stop
            >
              <div class="amc-notifications-header">
                <div>
                  <strong>Notificaciones</strong>

                  <span v-if="alertCount > 0">
                    {{ alertCount }} sin leer
                  </span>
                </div>

                <button
                  v-if="alertCount > 0"
                  class="amc-mark-all-read"
                  type="button"
                  title="Marcar todas como leídas"
                  @click="marcarTodasComoLeidas"
                >
                  <i class="bi bi-check2-all"></i>
                </button>
              </div>

              <div
                v-if="notificationsLoading"
                class="amc-notifications-loading"
              >
                <div class="amc-app-spinner"></div>
                <span>Cargando...</span>
              </div>

              <div
                v-else-if="notificacionesRecientes.length"
                class="amc-notifications-list"
              >
                <article
                  v-for="notif in notificacionesRecientes"
                  :key="notif.id_alerta"
                  class="amc-notification-item"
                  :class="notif.type"
                  @click="irNotificacionDesdeDropdown(notif)"
                >
                  <div class="amc-notification-icon">
                    <i :class="notif.icon"></i>
                  </div>

                  <div class="amc-notification-body">
                    <strong>
                      {{ notif.title || 'Notificación' }}
                    </strong>

                    <p>
                      {{ notif.message || 'Sin descripción' }}
                    </p>

                    <small>
                      {{ notif.date }}
                    </small>
                  </div>
                </article>
              </div>

              <div
                v-else
                class="amc-notifications-empty"
              >
                <i class="bi bi-bell-slash"></i>
                <span>No hay notificaciones nuevas</span>
              </div>

              <button
                class="amc-notifications-footer"
                type="button"
                @click="verTodasLasNotificaciones"
              >
                Ver todas mis notificaciones
                <i class="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>

          <!-- PERFIL -->
          <div class="amc-profile-wrapper">
            <button
              class="amc-profile-button"
              aria-label="Opciones de mi cuenta"
              :aria-expanded="showUserMenu"
              type="button"
              @click.stop="showUserMenu = !showUserMenu"
            >
              <div class="amc-profile-avatar">
                {{ clientInitials }}
              </div>

              <div class="amc-profile-info">
                <strong>{{ clientName }}</strong>
                <span>Cliente</span>
              </div>

              <i class="bi bi-chevron-down"></i>
            </button>

            <div
              v-if="showUserMenu"
              class="amc-profile-dropdown"
              @click.stop
            >
              <div class="amc-dropdown-profile">
                <div class="amc-profile-avatar">
                  {{ clientInitials }}
                </div>

                <div>
                  <strong>{{ clientName }}</strong>
                  <span>{{ clientEmail }}</span>
                </div>
              </div>

              <div class="amc-dropdown-divider"></div>

              <PushNotificationsControl
                :user-id="cliente?.id_usuario"
              />

              <button
                type="button"
                @click="showProfileModal = true; showUserMenu = false"
              >
                <i class="bi bi-person"></i>
                Mi perfil
              </button>

              <button
                class="amc-logout-button"
                type="button"
                @click="logout"
              >
                <i class="bi bi-box-arrow-right"></i>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- ====================================================
           COMPONENTES
      ===================================================== -->
      <section class="amc-admin-content">
  <div v-if="activeSection === 'inicio'" class="amc-client-home">
    <!-- ======================================================
         BIENVENIDA
    ======================================================= -->
    <section class="amc-welcome-card">
      <div class="amc-welcome-person">
        <div class="amc-welcome-avatar" aria-hidden="true">{{ clientInitials }}</div>
        <div>
          <span class="amc-welcome-label">TU ESPACIO EN AUTOMECANIC</span>
          <h2>Hola, {{ clientFirstName }}</h2>
          <p>Consulta tus vehículos y mantente al día con sus avisos.</p>
        </div>
      </div>
      <div v-if="vehicles.length" class="amc-welcome-vehicle">
        <div class="amc-welcome-car" aria-hidden="true">
          <svg viewBox="0 0 100 52" fill="none">
            <path d="M15 29 23 12c1-3 4-5 8-5h38c4 0 7 2 8 5l8 17" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
            <path d="M19 25h62l9 7v13H10V32l9-7Z" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
            <path d="M28 13h44l5 12H23l5-12Z" fill="currentColor" fill-opacity=".12"/>
            <path d="M20 34h12m36 0h12M38 39h24M17 46v3m66-3v3" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="amc-welcome-vehicle-info">
          <small>Vehículo seleccionado</small>
          <strong>{{ vehicleName }}</strong>
          <span>{{ vehiclePlate }} · {{ vehicleMileage }}</span>
        </div>
        <button type="button" class="amc-outline-button" @click="changeSection('vehiculo')">
          Ver vehículo <i class="bi bi-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
      <div v-else class="amc-welcome-vehicle">
        <i class="bi bi-car-front" aria-hidden="true"></i>
        <p>Cuando el taller registre tu vehículo, podrás consultarlo aquí.</p>
      </div>
    </section>

    <!-- ======================================================
         ESTADÍSTICAS
    ======================================================= -->
    <section class="amc-stats-grid">
      <article class="amc-stat-card">
        <div class="amc-stat-icon blue">
          <i class="bi bi-car-front"></i>
        </div>

        <div>
          <span>Mis vehículos</span>

          <strong>
            {{ vehicles.length }}
          </strong>

          <small>
            Unidades registradas
          </small>
        </div>
      </article>

      <article class="amc-stat-card">
        <div class="amc-stat-icon green">
          <i class="bi bi-speedometer2"></i>
        </div>

        <div>
          <span>Kilometraje</span>

          <strong>
            {{ vehicleMileage }}
          </strong>

          <small>
            Del vehículo seleccionado
          </small>
        </div>
      </article>

      <article class="amc-stat-card">
        <div class="amc-stat-icon orange">
          <i class="bi bi-car-front"></i>
        </div>

        <div>
          <span>Notificaciones</span>

          <strong>
            {{ alertCount }}
          </strong>

          <small>
            Avisos disponibles
          </small>
        </div>
      </article>

      <article class="amc-stat-card">
        <div class="amc-stat-icon purple">
          <i class="bi bi-shield-check"></i>
        </div>

        <div>
          <span>Estado</span>

          <strong>
            {{ cliente?.estatus || 'Activo' }}
          </strong>

          <small>
            Estado de tu cuenta
          </small>
        </div>
      </article>
    </section>

    <!-- ======================================================
         ACCIONES RÁPIDAS
    ======================================================= -->
    <section class="amc-section-card amc-home-actions">
      <div class="amc-section-card-header">
        <div>
          <h3>Acciones rápidas</h3>

          <p>
            Elige qué quieres consultar o registrar.
          </p>
        </div>
      </div>

      <div class="amc-quick-actions-grid">
        <button
          type="button"
          class="amc-quick-action-card"
          @click="changeSection('vehiculo')"
        >
          <div class="amc-quick-action-icon blue">
            <i class="bi bi-car-front"></i>
          </div>

          <div>
            <strong>
              Ver mis vehículos
            </strong>

            <span>
              Consultar los datos de mis unidades
            </span>
          </div>

          <i class="bi bi-chevron-right"></i>
        </button>

        <button
          type="button"
          class="amc-quick-action-card"
          @click="showProfileModal = true"
        >
          <div class="amc-quick-action-icon green">
            <i class="bi bi-person-vcard"></i>
          </div>

          <div>
            <strong>
              Mi perfil
            </strong>

            <span>
              Consultar mis datos personales
            </span>
          </div>

          <i class="bi bi-chevron-right"></i>
        </button>

        

        <button
          type="button"
          class="amc-quick-action-card"
          @click="changeSection('citas')"
        >
          <div class="amc-quick-action-icon cyan">
            <i class="bi bi-calendar-check"></i>
          </div>
          <div>
            <strong>Citas</strong>
            <span>Programar y consultar mis citas</span>
          </div>
          <i class="bi bi-chevron-right"></i>
        </button>

        <button
          type="button"
          class="amc-quick-action-card"
          @click="changeSection('transmision')"
        >
          <div class="amc-quick-action-icon purple">
            <i class="bi bi-wrench-adjustable-circle"></i>
          </div>

          <div>
            <strong>
              Transmisión
            </strong>

            <span>
              Registrar observaciones y consultar su estado
            </span>
          </div>

          <i class="bi bi-chevron-right"></i>
        </button>

        <button
          type="button"
          class="amc-quick-action-card"
          @click="changeSection('notificaciones')"
        >
          <div class="amc-quick-action-icon red">
            <i class="bi bi-bell"></i>
          </div>

          <div>
            <strong>
              Ver notificaciones
            </strong>

            <span>
              Avisos de mantenimiento
            </span>
          </div>

          <i class="bi bi-chevron-right"></i>
        </button>

        
      </div>
    </section>

    <!-- ======================================================
         VEHÍCULOS RECIENTES
    ======================================================= -->
    <section class="amc-section-card amc-home-vehicles">
      <div class="amc-section-card-header">
        <div>
          <h3>
            Mis vehículos
          </h3>

          <p>
            Información de las unidades registradas a tu nombre.
          </p>
        </div>

        <button
          class="amc-outline-button"
          type="button"
          @click="changeSection('vehiculo')"
        >
          Ver detalles

          <i class="bi bi-arrow-right"></i>
        </button>
      </div>

      <div
        v-if="loading"
        class="amc-component-loading"
      >
        <div class="amc-app-spinner"></div>

        <span>
          Cargando información...
        </span>
      </div>

      <div
        v-else-if="recentVehicles.length"
        class="amc-table-wrapper"
      >
        <table class="amc-data-table">
          <thead>
            <tr>
              <th>No. económico</th>
              <th>Placas</th>
              <th>Vehículo</th>
              <th>Tipo</th>
              <th>Kilometraje</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="vehicle in recentVehicles"
              :key="vehicle.id_vehiculo"
            >
              <td>
                <strong>
                  {{
                    vehicle.no_economico ||
                    '—'
                  }}
                </strong>
              </td>

              <td>
                <span class="amc-plate-badge">
                  {{ vehicle.placas }}
                </span>
              </td>

              <td>
                <div class="amc-vehicle-table-cell">
                  <div class="amc-table-vehicle-icon">
                    <i
                      :class="
                        getVehicleIcon(
                          vehicle.tipo_unidad
                        )
                      "
                    ></i>
                  </div>

                  <div>
                    <strong>
                      {{ vehicle.marca }}
                    </strong>

                    <small>
                      {{ vehicle.modelo }}
                      {{
                        vehicle.anio_modelo
                          ? `· ${vehicle.anio_modelo}`
                          : ''
                      }}
                    </small>
                  </div>
                </div>
              </td>

              <td>
                {{
                  vehicle.tipo_unidad ||
                  'No especificado'
                }}
              </td>

              <td>
                {{
                  formatKilometers(
                    vehicle.kilometraje_actual
                  )
                }}
              </td>

              <td>
                <span
                  class="amc-status-badge"
                  :class="
                    getStatusClass(
                      vehicle.estatus
                    )
                  "
                >
                  {{
                    vehicle.estatus ||
                    'Activo'
                  }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-else
        class="amc-empty-state"
      >
        <i class="bi bi-car-front"></i>

        <h4>
          No hay vehículos registrados
        </h4>

        <p>
          Cuando se registre una unidad a tu nombre
          aparecerá aquí.
        </p>

        
      </div>
    </section>

    <!-- ======================================================
         ERROR
    ======================================================= -->
    <div
      v-if="errorMessage"
      class="amc-app-alert danger"
    >
      <i class="bi bi-exclamation-triangle"></i>

      <span>
        {{ errorMessage }}
      </span>
    </div>
  </div>

<div
  v-if="activeSection !== 'inicio'"
  class="amc-client-layout amc-client-detail-surface"
  :class="{'dark-mode':isDarkMode}"
>
        <template v-if="activeSection === 'vehiculo'">
          <section class="amc-client-page-card amc-client-vehicles-page">
            <div class="amc-client-page-heading">
              <div class="amc-client-page-heading-icon">
                <i class="bi bi-car-front-fill"></i>
              </div>

              <div>
                <span>MIS VEHÍCULOS</span>
                <h2>Mis vehículos</h2>

                <p>
                  Consulta los datos registrados de tus vehículos.
                </p>
              </div>
            </div>

            <div
              v-if="vehicles.length > 0"
              class="amc-client-vehicle-selector"
            >
              <div class="amc-client-vehicle-selector-header">
                <div>
                  <span>Vehículos registrados</span>
                  <strong>{{ vehicles.length }}</strong>
                </div>

                <p>
                  Selecciona una unidad para consultar sus datos.
                </p>
              </div>

              <div class="amc-client-vehicle-selector-list">
                <button
                  v-for="vehicle in vehicles"
                  :key="vehicle.id_vehiculo ?? vehicle.id"
                  type="button"
                  class="amc-client-vehicle-option"
                  :class="{
                    active:
                      String(selectedVehicleId) ===
                      String(vehicle.id_vehiculo ?? vehicle.id)
                  }"
                  @click="selectVehicle(vehicle)"
                >
                  <div class="amc-client-vehicle-option-icon">
                    <i :class="getVehicleIcon(vehicle.tipo_unidad || vehicle.tipo_vehiculo || vehicle.tipo)"></i>
                  </div>

                  <div class="amc-client-vehicle-option-info">
                    <strong>
                      {{ getVehicleDisplayName(vehicle) }}
                    </strong>

                    <span>
                      {{ vehicle.placas || 'Sin placas registradas' }}
                    </span>
                  </div>

                  <i class="bi bi-check-circle-fill amc-client-vehicle-option-check"></i>
                </button>
              </div>
            </div>

            <div class="amc-client-vehicle-detail-card">
              <div class="amc-client-vehicle-hero">
                <div class="amc-client-vehicle-large-icon">
                  <i class="bi bi-car-front-fill"></i>
                </div>

                <div>
                  <span class="amc-client-vehicle-label">
                    Vehículo registrado
                  </span>

                  <h3>{{ vehicleName }}</h3>

                  <p>
                    Placas:
                    <strong>{{ vehiclePlate }}</strong>
                  </p>
                </div>
              </div>

              <div class="amc-client-details-grid">
                <div class="amc-client-detail-item">
                  <span>Marca</span>
                  <strong>{{ vehicleBrand }}</strong>
                </div>

                <div class="amc-client-detail-item">
                  <span>Modelo</span>
                  <strong>{{ vehicleModel }}</strong>
                </div>

                <div class="amc-client-detail-item">
                  <span>Año</span>
                  <strong>{{ vehicleYear }}</strong>
                </div>

                <div class="amc-client-detail-item">
                  <span>Placas</span>
                  <strong>{{ vehiclePlate }}</strong>
                </div>

                <div class="amc-client-detail-item">
                  <span>Número de serie</span>
                  <strong>{{ vehicleSerial }}</strong>
                </div>

                <div class="amc-client-detail-item">
                  <span>Tipo de vehículo</span>
                  <strong>{{ vehicleType }}</strong>
                </div>

                <div class="amc-client-detail-item">
                  <span>Kilometraje</span>
                  <strong>{{ vehicleMileage }}</strong>
                </div>

                <div class="amc-client-detail-item">
                  <span>Estado</span>

                  <strong class="amc-client-status-badge">
                    <i class="bi bi-check-circle-fill"></i>
                    {{ vehicleStatus }}
                  </strong>
                </div>
              </div>

              <!-- ==================================================
                   MANTENIMIENTO PREVENTIVO — SOLO LECTURA
              =================================================== -->
              <section class="amc-client-maintenance-card">
                <div class="amc-client-maintenance-header">
                  <div class="amc-client-maintenance-title">
                    <div class="amc-client-maintenance-icon">
                      <i class="bi bi-speedometer2"></i>
                    </div>

                    <div>
                      <span>MANTENIMIENTO PREVENTIVO</span>
                      <h3>Seguimiento por kilometraje</h3>

                      <p>
                        Consulta cuándo corresponde el próximo
                        mantenimiento de esta unidad.
                      </p>
                    </div>
                  </div>

                  <span
                    class="amc-client-maintenance-status"
                    :class="maintenanceStatusClass"
                  >
                    <i :class="maintenanceStatusIcon"></i>
                    {{ maintenanceStatusLabel }}
                  </span>
                </div>

                <div
                  v-if="maintenanceConfigured"
                  class="amc-client-maintenance-grid"
                >
                  <article class="amc-client-maintenance-item">
                    <span>Kilometraje actual</span>
                    <strong>{{ maintenanceCurrentMileage }}</strong>
                    <small>Registrado en el vehículo</small>
                  </article>

                  <article class="amc-client-maintenance-item">
                    <span>Último servicio</span>
                    <strong>{{ maintenanceLastMileage }}</strong>
                    <small>Base del seguimiento preventivo</small>
                  </article>

                  <article class="amc-client-maintenance-item">
                    <span>Intervalo</span>
                    <strong>{{ maintenanceInterval }}</strong>
                    <small>Frecuencia configurada</small>
                  </article>

                  <article class="amc-client-maintenance-item">
                    <span>Próximo servicio</span>
                    <strong>{{ maintenanceNextMileage }}</strong>
                    <small>Kilometraje programado</small>
                  </article>

                  <article
                    class="amc-client-maintenance-item amc-client-maintenance-remaining"
                    :class="maintenanceStatusClass"
                  >
                    <span>{{ maintenanceRemainingTitle }}</span>
                    <strong>{{ maintenanceRemainingText }}</strong>
                    <small>{{ maintenanceRemainingCaption }}</small>
                  </article>
                </div>

                <div
                  v-else
                  class="amc-client-maintenance-empty"
                >
                  <i class="bi bi-info-circle"></i>

                  <div>
                    <strong>
                      Mantenimiento aún no configurado
                    </strong>

                    <p>
                      El taller todavía no ha definido el
                      seguimiento preventivo por kilometraje
                      para este vehículo.
                    </p>
                  </div>
                </div>
              </section>

              <!-- ==================================================
                   ESTADO DE LLANTAS — SOLO LECTURA
              =================================================== -->
              <section class="amc-client-tires-card">
                <div class="amc-client-tires-header">
                  <div class="amc-client-tires-title">
                    <div class="amc-client-tires-icon">
                      <i class="bi bi-circle"></i>
                    </div>

                    <div>
                      <span>ESTADO DE LLANTAS</span>
                      <h3>Última inspección registrada</h3>

                      <p>
                        Consulta la condición registrada por el taller
                        para las llantas de esta unidad.
                      </p>
                    </div>
                  </div>

                  <span
                    class="amc-client-tires-status"
                    :class="tireGeneralStatusClass"
                  >
                    <i :class="tireGeneralStatusIcon"></i>
                    {{ tireGeneralStatusLabel }}
                  </span>
                </div>

                <div
                  v-if="tireInspectionAvailable"
                  class="amc-client-tires-content"
                >
                  <div class="amc-client-tires-summary">
                    <div>
                      <span>Fecha de inspección</span>
                      <strong>{{ tireInspectionDate }}</strong>
                    </div>

                    <div>
                      <span>Kilometraje</span>
                      <strong>{{ tireInspectionMileage }}</strong>
                    </div>

                    <div>
                      <span>Llantas registradas</span>
                      <strong>{{ tireInspectionItems.length }}</strong>
                    </div>
                  </div>

                  <div class="amc-client-tires-grid">
                    <article
                      v-for="tire in tireInspectionItems"
                      :key="tire.id_detalle"
                      class="amc-client-tire-item"
                    >
                      <div class="amc-client-tire-item-header">
                        <div class="amc-client-tire-position">
                          <i class="bi bi-circle-fill"></i>

                          <div>
                            <span>Posición</span>
                            <strong>{{ getTirePositionLabel(tire) }}</strong>
                          </div>
                        </div>

                        <span
                          class="amc-client-tire-condition"
                          :class="getTireConditionClass(tire.condicion)"
                        >
                          {{ tire.condicion || 'Sin condición' }}
                        </span>
                      </div>

                      <div class="amc-client-tire-details">
                        <div>
                          <span>Marca</span>
                          <strong>{{ tire.marca || 'No registrada' }}</strong>
                        </div>

                        <div>
                          <span>Medida</span>
                          <strong>{{ tire.medida || 'No registrada' }}</strong>
                        </div>

                        <div>
                          <span>Presión</span>
                          <strong>{{ formatTirePsi(tire.psi) }}</strong>
                        </div>

                        <div>
                          <span>Desgaste</span>
                          <strong>{{ formatTireWear(tire.desgaste_mm) }}</strong>
                        </div>
                      </div>

                      <div class="amc-client-tire-wear">
                        <span>Tipo de desgaste</span>
                        <strong>{{ tire.tipo_desgaste || 'No registrado' }}</strong>
                      </div>
                    </article>
                  </div>
                </div>

                <div
                  v-else
                  class="amc-client-tires-empty"
                >
                  <i class="bi bi-info-circle"></i>

                  <div>
                    <strong>
                      Sin inspección de llantas registrada
                    </strong>

                    <p>
                      Cuando el taller registre una revisión de llantas
                      para este vehículo, podrás consultar aquí su estado.
                    </p>
                  </div>
                </div>
              </section>

              <section class="amc-client-service-history">
                <div class="amc-client-service-history-heading">
                  <div>
                    <span>HISTORIAL DEL TALLER</span>
                    <h3>Servicios y mantenimientos</h3>
                    <p>Registros realizados para esta unidad.</p>
                  </div>
                  <i class="bi bi-clipboard2-check"></i>
                </div>

                <div
                  v-if="clientServicesLoading"
                  class="amc-client-service-history-state"
                >
                  <div class="amc-app-spinner"></div>
                  <span>Cargando historial...</span>
                </div>

                <div
                  v-else-if="clientServicesError"
                  class="amc-client-service-history-error"
                  role="alert"
                >
                  <i class="bi bi-exclamation-triangle"></i>
                  <span>{{ clientServicesError }}</span>
                </div>

                <div
                  v-else-if="clientServices.length"
                  class="amc-client-service-history-list"
                >
                  <article
                    v-for="service in clientServices"
                    :key="service.id_servicio"
                    class="amc-client-service-history-item"
                  >
                    <div class="amc-client-service-history-summary">
                      <div>
                        <strong>Servicio #{{ service.id_servicio }}</strong>
                        <span>
                          {{ formatClientDate(service.fecha_servicio) }}
                          · {{ formatKilometers(service.kilometraje) }}
                        </span>
                        <p>
                          {{ service.observaciones_generales || 'Sin observaciones generales.' }}
                        </p>
                      </div>
                      <button
                        type="button"
                        class="amc-client-service-detail-button"
                        :disabled="serviceDetailLoading"
                        @click="toggleClientServiceDetail(service.id_servicio)"
                      >
                        {{
                          activeClientServiceId === service.id_servicio
                            ? 'Ocultar detalle'
                            : 'Ver detalle'
                        }}
                      </button>
                    </div>

                    <div
                      v-if="activeClientServiceId === service.id_servicio"
                      class="amc-client-service-detail"
                    >
                      <div
                        v-if="serviceDetailLoading"
                        class="amc-client-service-history-state"
                      >
                        <div class="amc-app-spinner"></div>
                        <span>Cargando detalle...</span>
                      </div>

                      <template v-else-if="activeClientServiceDetail">
                        <div
                          v-if="activeClientServiceDetail.motor"
                          class="amc-client-service-detail-group"
                        >
                          <strong>Motor</strong>
                          <span>Aceite: {{ activeClientServiceDetail.motor.aceite_motor || activeClientServiceDetail.motor.tipo_aceite_nombre || 'No registrado' }}</span>
                          <span>Filtro de aceite: {{ activeClientServiceDetail.motor.filtro_aceite || 'No registrado' }}</span>
                          <span>Filtro de aire: {{ activeClientServiceDetail.motor.filtro_aire || 'No registrado' }}</span>
                        </div>

                        <div
                          v-if="activeClientServiceDetail.transmision"
                          class="amc-client-service-detail-group"
                        >
                          <strong>Transmisión</strong>
                          <span>Tipo: {{ activeClientServiceDetail.transmision.tipo_transmision || 'No registrado' }}</span>
                          <span>Aceite: {{ activeClientServiceDetail.transmision.aceite_transmision || 'No registrado' }}</span>
                          <span>Color del aceite: {{ activeClientServiceDetail.transmision.color_del_aceite || 'No registrado' }}</span>
                        </div>

                        <div
                          v-if="activeClientServiceDetail.llantas.length"
                          class="amc-client-service-detail-group"
                        >
                          <strong>Inspección de llantas</strong>
                          <span
                            v-for="tire in activeClientServiceDetail.llantas"
                            :key="tire.id_detalle"
                          >
                            {{ getTirePositionLabel(tire) }}:
                            {{ tire.condicion || 'Sin condición registrada' }}
                            <template v-if="tire.psi !== null">
                              · {{ tire.psi }} PSI
                            </template>
                            <template v-if="tire.desgaste_mm !== null">
                              · {{ tire.desgaste_mm }} mm de desgaste
                            </template>
                          </span>
                        </div>

                        <p
                          v-if="
                            !activeClientServiceDetail.motor &&
                            !activeClientServiceDetail.transmision &&
                            !activeClientServiceDetail.llantas.length
                          "
                          class="amc-client-service-detail-empty"
                        >
                          Este registro no contiene detalles adicionales.
                        </p>
                      </template>
                    </div>
                  </article>
                </div>

                <div
                  v-else
                  class="amc-client-service-history-state"
                >
                  <i class="bi bi-info-circle"></i>
                  <span>Aún no hay servicios registrados para esta unidad.</span>
                </div>
              </section>

              <div class="amc-client-readonly-notice">
                <i class="bi bi-info-circle-fill"></i>

                <p>
                  Esta información es de consulta. Las
                  modificaciones de la unidad son realizadas
                  por el personal autorizado de Automecanic.
                </p>
              </div>
            </div>
          </section>
        </template>

        <!-- ==================================================
             NOTIFICACIONES
        =================================================== -->
        <template v-else-if="activeSection === 'notificaciones'">
          <section class="amc-client-page-card">
            <div class="amc-client-page-heading">
              <div class="amc-client-page-heading-icon">
                <i class="bi bi-bell-fill"></i>
              </div>

              <div>
                <span>NOTIFICACIONES</span>
                <h2>Avisos de mantenimiento</h2>

                <p>
                  Consulta las notificaciones relacionadas con
                  el mantenimiento de tu vehículo.
                </p>
              </div>
            </div>

            <div
              v-if="notificationsLoading"
              class="amc-component-loading"
            >
              <div class="amc-app-spinner"></div>

              <span>
                Cargando notificaciones...
              </span>
            </div>

            <div
              v-else-if="notifications.length === 0"
              class="amc-client-empty-state"
            >
              <div class="amc-client-empty-icon">
                <i class="bi bi-bell-slash"></i>
              </div>

              <h3>No tienes notificaciones</h3>

              <p>
                Cuando exista un próximo servicio,
                mantenimiento vencido o una revisión importante,
                aparecerá en este apartado.
              </p>
            </div>

            <div
              v-else
              class="amc-client-notifications-list"
            >
              <article
                v-for="notification in notifications"
                :key="notification.id"
                class="amc-client-notification-card"
                :class="{ 'is-unread': !notification.read }"
                :title="
                  notification.read
                    ? 'Notificación leída'
                    : 'Notificación sin leer'
                "
              >
                <div
                  class="amc-client-notification-icon"
                  :class="notification.type"
                >
                  <i :class="notification.icon"></i>
                </div>

                <div class="amc-client-notification-body">
                  <div class="amc-client-notification-heading">
                    <strong>{{ notification.title }}</strong>
                    <span>{{ notification.date }}</span>
                  </div>

                  <p>{{ notification.message }}</p>
                  <div class="amc-client-notification-actions">
                    <span v-if="notification.read" class="amc-client-notification-read">
                      <i class="bi bi-check2-all" aria-hidden="true"></i> Leída
                    </span>
                    <button v-else type="button" class="amc-client-notification-read-button"
                      @click.stop="markNotificationAsRead(notification)">
                      <i class="bi bi-check2" aria-hidden="true"></i> Marcar como leída
                    </button>
                    <button
                      v-if="notification.tipo_alerta === 'CITA_REPROGRAMACION_PROPUESTA'"
                      type="button"
                      class="amc-client-notification-read-button"
                      @click.stop="changeSection('citas')"
                    >
                      <i class="bi bi-calendar-check" aria-hidden="true"></i> Revisar propuesta
                    </button>
                  </div>
                </div>
              </article>
            </div>

            <div
              v-if="notificationError"
              class="amc-app-alert danger"
            >
              <i class="bi bi-exclamation-triangle"></i>

              <span>
                {{ notificationError }}
              </span>
            </div>
          </section>
        </template>

        <!-- ==================================================
             CITAS
        =================================================== -->
        <template v-else-if="activeSection === 'citas'">
          <section class="amc-client-page-card">
            <div class="amc-client-page-heading">
              <div class="amc-client-page-heading-icon">
                <i class="bi bi-calendar-check-fill"></i>
              </div>
              <div>
                <span>CITAS</span>
                <h2>Mis citas</h2>
                <p>Programa una visita al taller y consulta el seguimiento de tus citas.</p>
              </div>
            </div>

            <div class="amc-client-transmission-grid">
              <article class="amc-client-transmission-form-card">
                <div class="amc-client-transmission-card-header">
                  <div class="amc-client-transmission-card-icon"><i class="bi bi-calendar-plus"></i></div>
                  <div><span>NUEVA CITA</span><h3>Solicitar cita</h3><p>Selecciona uno de tus vehículos y una fecha futura.</p></div>
                </div>

                <form class="amc-client-transmission-form" @submit.prevent="submitAppointment">
                  <div class="amc-client-transmission-fields">
                    <label class="amc-client-transmission-field">
                      <span>Vehículo</span>
                      <select v-model="appointmentForm.id_vehiculo" required :disabled="appointmentsSaving">
                        <option value="" disabled>Selecciona un vehículo</option>
                        <option v-for="vehicle in vehicles" :key="vehicle.id_vehiculo ?? vehicle.id" :value="String(vehicle.id_vehiculo ?? vehicle.id)">
                          {{ getVehicleDisplayName(vehicle) }} · {{ vehicle.placas || 'Sin placas' }}
                        </option>
                      </select>
                    </label>

                    <label class="amc-client-transmission-field">
                      <span>Fecha</span>
                      <input
                        v-model="appointmentForm.fecha"
                        type="date"
                        :min="appointmentMinDate"
                        required
                        :disabled="appointmentsSaving"
                        @click="openNativeDatePicker"
                        @focus="openNativeDatePicker"
                      />
                    </label>

                    <label class="amc-client-transmission-field">
                      <span>Hora</span>
                      <input
                        v-model="appointmentForm.hora"
                        type="time"
                        required
                        :disabled="appointmentsSaving"
                        @click="openNativeDatePicker"
                        @focus="openNativeDatePicker"
                      />
                    </label>

                    <label class="amc-client-transmission-field">
                      <span>Motivo</span>
                      <input v-model.trim="appointmentForm.motivo" type="text" maxlength="180" placeholder="Ej. Revisión preventiva" required :disabled="appointmentsSaving" />
                    </label>

                    <label class="amc-client-transmission-field amc-client-transmission-field-full">
                      <span>Observaciones</span>
                      <textarea v-model.trim="appointmentForm.observaciones" rows="4" maxlength="500" placeholder="Información adicional para el taller (opcional)" :disabled="appointmentsSaving"></textarea>
                    </label>
                  </div>

                  <div v-if="appointmentMessage" class="amc-app-alert" :class="appointmentMessageType">
                    <i :class="appointmentMessageType === 'danger' ? 'bi bi-exclamation-triangle' : 'bi bi-check-circle'"></i>
                    <span>{{ appointmentMessage }}</span>
                  </div>

                  <div class="amc-client-transmission-actions">
                    <button class="amc-client-transmission-submit" type="submit" :disabled="appointmentsSaving || !vehicles.length">
                      <i :class="appointmentsSaving ? 'bi bi-hourglass-split' : 'bi bi-calendar-plus'"></i>
                      {{ appointmentsSaving ? 'Programando...' : 'Programar cita' }}
                    </button>
                  </div>
                </form>
              </article>

              <article class="amc-client-transmission-history-card">
                <div class="amc-client-transmission-card-header">
                  <div class="amc-client-transmission-card-icon"><i class="bi bi-calendar2-week"></i></div>
                  <div><span>SEGUIMIENTO</span><h3>Mis citas</h3><p>Consulta el estado de las visitas que has solicitado.</p></div>
                  <strong class="amc-client-transmission-history-count">{{ appointments.length }}</strong>
                </div>

                <div v-if="appointmentsLoading" class="amc-component-loading">
                  <div class="amc-app-spinner"></div><span>Cargando citas...</span>
                </div>
                <div v-else-if="appointments.length === 0" class="amc-client-transmission-empty">
                  <i class="bi bi-calendar-x"></i>
                  <div><strong>Aún no tienes citas</strong><p>Las citas que programes aparecerán en este apartado.</p></div>
                </div>
                <div v-else class="amc-client-transmission-history-list">
                  <article v-for="appointment in appointments" :key="appointment.id_cita" class="amc-client-transmission-history-item">
                    <div class="amc-client-transmission-history-top">
                      <div>
                        <strong>{{ appointment.vehiculo?.marca || 'Vehículo' }} {{ appointment.vehiculo?.modelo || '' }}</strong>
                        <span>{{ appointment.vehiculo?.placas || 'Sin placas' }}</span>
                      </div>
                      <span
                        class="amc-client-transmission-status"
                        :class="appointment.estado_reprogramacion === 'PENDIENTE' ? 'pending' : appointmentStatusClass(appointment.estado)"
                      >
                        {{ appointment.estado_reprogramacion === 'PENDIENTE' ? 'Cambio propuesto' : appointmentStatusLabel(appointment.estado) }}
                      </span>
                    </div>
                    <div class="amc-client-appointment-details">
                      <div class="amc-client-appointment-detail">
                        <span>Fecha</span>
                        <strong>{{ formatAppointmentDate(appointment.fecha) }}</strong>
                      </div>
                      <div class="amc-client-appointment-detail">
                        <span>Hora</span>
                        <strong>{{ formatAppointmentTime(appointment.hora) }}</strong>
                      </div>
                      <div class="amc-client-appointment-detail">
                        <span>Motivo</span>
                        <strong>{{ appointment.motivo || 'Sin motivo' }}</strong>
                      </div>
                      <div class="amc-client-appointment-detail">
                        <span>Mecánico</span>
                        <strong>{{ appointment.mecanico_nombre || appointment.mecanico?.nombre_completo || 'Por asignar' }}</strong>
                      </div>
                    </div>
                    <p v-if="appointment.observaciones">{{ appointment.observaciones }}</p>
                    <div v-if="appointment.estado_reprogramacion === 'PENDIENTE'" class="amc-client-reschedule-proposal">
                      <div>
                        <i class="bi bi-calendar2-exclamation"></i>
                        <span>El mecánico propone esta nueva fecha y hora:</span>
                        <strong>{{ formatAppointmentDate(appointment.fecha_propuesta) }} · {{ formatAppointmentTime(appointment.hora_propuesta) }}</strong>
                      </div>
                      <div class="amc-client-transmission-actions">
                        <button
                          type="button"
                          class="amc-client-transmission-submit"
                          :disabled="appointmentResponseId === appointment.id_cita"
                          @click="respondToReschedule(appointment, true)"
                        >
                          <i :class="appointmentResponseId === appointment.id_cita ? 'bi bi-hourglass-split' : 'bi bi-check2-circle'"></i>
                          Aceptar propuesta
                        </button>
                        <button
                          type="button"
                          class="amc-secondary-button"
                          :disabled="appointmentResponseId === appointment.id_cita"
                          @click="respondToReschedule(appointment, false)"
                        >
                          <i class="bi bi-x-circle"></i>
                          Rechazar y cancelar
                        </button>
                      </div>
                    </div>
                    <div v-else-if="String(appointment.estado || '').toUpperCase() === 'PROXIMA'" class="amc-client-transmission-actions">
                      <button type="button" class="amc-secondary-button" :disabled="appointmentCancellingId === appointment.id_cita" @click="cancelAppointment(appointment)">
                        <i class="bi bi-x-circle"></i>{{ appointmentCancellingId === appointment.id_cita ? 'Cancelando...' : 'Cancelar cita' }}
                      </button>
                    </div>
                  </article>
                </div>
              </article>
            </div>
          </section>
        </template>

        <!-- ==================================================
             TRANSMISIÓN
        =================================================== -->
        <template v-else-if="activeSection === 'transmision'">
          <section class="amc-client-page-card">
            <div class="amc-client-page-heading">
              <div class="amc-client-page-heading-icon">
                <i class="bi bi-gear-wide-connected"></i>
              </div>

              <div>
                <span>TRANSMISIÓN</span>
                <h2>Observaciones de transmisión</h2>
                <p>
                  Selecciona un vehículo, describe lo que notas y consulta el estado de tus registros.
                </p>
              </div>
            </div>

            <div class="amc-client-transmission-security">
              <i class="bi bi-shield-check"></i>
              <div>
                <strong>Cuéntanos lo que has notado</strong>
                <p>
                  Describe los síntomas; el personal de Automecanic se encargará del diagnóstico y los datos técnicos.
                </p>
              </div>
            </div>

            <div
              v-if="transmissionSuccess"
              class="amc-app-alert success amc-client-transmission-alert"
              role="status"
            >
              <i class="bi bi-check-circle-fill"></i>
              <span>{{ transmissionSuccess }}</span>
            </div>

            <div
              v-if="transmissionError"
              class="amc-app-alert danger amc-client-transmission-alert"
              role="alert"
            >
              <i class="bi bi-exclamation-triangle-fill"></i>
              <span>{{ transmissionError }}</span>
            </div>

            <div class="amc-client-transmission-grid">
              <article class="amc-client-transmission-form-card">
                <div class="amc-client-transmission-card-header">
                  <div class="amc-client-transmission-card-icon">
                    <i class="bi bi-pencil-square"></i>
                  </div>
                  <div>
                    <span>NUEVO REGISTRO</span>
                    <h3>Nueva observación</h3>
                    <p>Completa los datos del vehículo y lo que has notado.</p>
                  </div>
                </div>

                <form
                  class="amc-client-transmission-form"
                  @submit.prevent="saveTransmissionRecord"
                >
                  <div class="amc-client-transmission-fields">
                    <label class="amc-client-transmission-field">
                      <span>Vehículo</span>
                      <select
                        v-model="transmissionForm.id_vehiculo"
                        :disabled="transmissionSaving || vehicles.length === 0"
                      >
                        <option value="" disabled>
                          Selecciona un vehículo
                        </option>
                        <option
                          v-for="vehicle in vehicles"
                          :key="`transmission-${vehicle.id_vehiculo ?? vehicle.id}`"
                          :value="String(vehicle.id_vehiculo ?? vehicle.id)"
                        >
                          {{ getVehicleDisplayName(vehicle) }} ·
                          {{ vehicle.placas || 'Sin placas' }}
                        </option>
                      </select>
                    </label>

                    <label class="amc-client-transmission-field">
                      <span>Fecha de observación</span>
                      <input
                        v-model="transmissionForm.fecha_observacion"
                        type="date"
                        :max="todayISO()"
                        :disabled="transmissionSaving"
                        @click="openNativeDatePicker"
                        @focus="openNativeDatePicker"
                      />
                    </label>
                  </div>

                  <div class="amc-client-transmission-field">
                    <span>¿Qué comportamiento has observado?</span>
                    <small>Selecciona al menos una opción.</small>

                    <div class="amc-client-transmission-symptoms">
                      <label
                        v-for="symptom in transmissionSymptoms"
                        :key="symptom"
                        class="amc-client-transmission-symptom"
                        :class="{
                          active: transmissionForm.sintomas.includes(symptom)
                        }"
                      >
                        <input
                          v-model="transmissionForm.sintomas"
                          type="checkbox"
                          :value="symptom"
                          :disabled="transmissionSaving"
                        />
                        <span class="amc-client-transmission-check">
                          <i class="bi bi-check"></i>
                        </span>
                        <span>{{ symptom }}</span>
                      </label>
                    </div>
                  </div>

                  <label class="amc-client-transmission-field amc-client-transmission-description-field">
                    <span>Describe lo que sucede</span>
                    <textarea
                      v-model="transmissionForm.descripcion"
                      rows="5"
                      maxlength="1500"
                      placeholder="Ejemplo: al cambiar de segunda a tercera velocidad se siente un tirón y se escucha un ruido..."
                      :disabled="transmissionSaving"
                    ></textarea>
                    <small class="amc-client-transmission-counter">
                      {{ transmissionForm.descripcion.length }} / 1500
                    </small>
                  </label>

                  <div class="amc-client-transmission-external">
                    <div>
                      <strong>¿Fue atendido en otro taller?</strong>
                      <p>
                        Indica si el vehículo recibió atención relacionada con
                        esta observación fuera de Automecanic.
                      </p>
                    </div>

                    <div class="amc-client-transmission-radio-group">
                      <label>
                        <input
                          v-model="transmissionForm.atencion_externa"
                          type="radio"
                          :value="false"
                          :disabled="transmissionSaving"
                        />
                        <span>No</span>
                      </label>

                      <label>
                        <input
                          v-model="transmissionForm.atencion_externa"
                          type="radio"
                          :value="true"
                          :disabled="transmissionSaving"
                        />
                        <span>Sí</span>
                      </label>
                    </div>
                  </div>

                  <label
                    v-if="transmissionForm.atencion_externa"
                    class="amc-client-transmission-field amc-client-transmission-external-field"
                  >
                    <span>¿Qué atención recibió?</span>
                    <textarea
                      v-model="transmissionForm.detalle_atencion_externa"
                      rows="4"
                      maxlength="1500"
                      placeholder="Describe brevemente la atención realizada fuera de Automecanic..."
                      :disabled="transmissionSaving"
                    ></textarea>
                  </label>

                  <div class="amc-client-transmission-actions">
                    <button
                      type="submit"
                      class="amc-client-transmission-submit"
                      :disabled="transmissionSaving || vehicles.length === 0"
                    >
                      <span
                        v-if="transmissionSaving"
                        class="amc-client-transmission-button-spinner"
                      ></span>
                      <i
                        v-else
                        class="bi bi-floppy"
                      ></i>

                      {{
                        transmissionSaving
                          ? 'Registrando...'
                          : 'Registrar información'
                      }}
                    </button>
                  </div>
                </form>
              </article>

              <article class="amc-client-transmission-history-card">
                <div class="amc-client-transmission-card-header">
                  <div class="amc-client-transmission-card-icon history">
                    <i class="bi bi-clock-history"></i>
                  </div>

                  <div>
                    <span>MIS REGISTROS</span>
                    <h3>Mis observaciones</h3>
                    <p>Revisa tus registros y su estado.</p>
                  </div>

                  <strong class="amc-client-transmission-history-count">
                    {{ transmissionRecords.length }}
                  </strong>
                </div>

                <div
                  v-if="transmissionLoading"
                  class="amc-component-loading amc-client-transmission-loading"
                >
                  <div class="amc-app-spinner"></div>
                  <span>Cargando registros...</span>
                </div>

                <div
                  v-else-if="transmissionRecords.length === 0"
                  class="amc-client-transmission-empty"
                >
                  <div>
                    <i class="bi bi-gear-wide-connected"></i>
                  </div>
                  <h4>Aún no tienes registros</h4>
                  <p>
                    Cuando registres una observación de transmisión aparecerá
                    aquí para que puedas consultar su estado.
                  </p>
                </div>

                <div
                  v-else
                  class="amc-client-transmission-history-list"
                >
                  <article
                    v-for="record in transmissionRecords"
                    :key="record.id_registro"
                    class="amc-client-transmission-history-item"
                  >
                    <div class="amc-client-transmission-history-top">
                      <div>
                        <strong>
                          {{ getTransmissionVehicleName(record.id_vehiculo) }}
                        </strong>
                        <span>
                          {{ formatTransmissionDate(record.fecha_observacion) }}
                        </span>
                      </div>

                      <span
                        class="amc-client-transmission-status"
                        :class="getTransmissionStatusClass(record.estado)"
                      >
                        {{ record.estado || 'PENDIENTE' }}
                      </span>
                    </div>

                    <div class="amc-client-transmission-tags">
                      <span
                        v-for="symptom in record.sintomas || []"
                        :key="`${record.id_registro}-${symptom}`"
                      >
                        {{ symptom }}
                      </span>
                    </div>

                    <p class="amc-client-transmission-description">
                      {{ record.descripcion }}
                    </p>

                    <div
                      v-if="record.atencion_externa"
                      class="amc-client-transmission-external-detail"
                    >
                      <i class="bi bi-building"></i>
                      <div>
                        <strong>Atención externa registrada</strong>
                        <p>
                          {{
                            record.detalle_atencion_externa ||
                            'Sin detalle adicional.'
                          }}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>
              </article>
            </div>
          </section>
        </template>
      </div>
      </section>
    </main>

    <!-- ======================================================
         MODAL PERFIL
    ======================================================= -->
    <div
      v-if="showProfileModal"
      class="amc-modal-overlay"
      @click.self="showProfileModal = false"
    >
      <div class="amc-app-modal amc-profile-modal" role="dialog" aria-modal="true" aria-labelledby="client-profile-title">
        <div class="amc-modal-header">
          <div>
            <h3 id="client-profile-title">Mi perfil</h3>
            <p>Datos de la cuenta actual</p>
          </div>

          <button
            class="amc-modal-close-button" aria-label="Cerrar perfil"
            type="button"
            @click="showProfileModal = false"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="amc-modal-body">
          <div class="amc-profile-modal-top">
            <div class="amc-profile-large-avatar">
              {{ clientInitials }}
            </div>

            <h3>{{ clientName }}</h3>
            <span>Cliente</span>
          </div>

          <div class="amc-profile-detail">
            <i class="bi bi-envelope"></i>

            <div>
              <small>Correo electrónico</small>
              <strong>{{ clientEmail }}</strong>
            </div>
          </div>

          <div class="amc-profile-detail">
            <i class="bi bi-telephone"></i>

            <div>
              <small>Teléfono</small>

              <strong>
                {{ cliente?.telefono || 'No registrado' }}
              </strong>
            </div>
          </div>

          <div class="amc-profile-detail">
            <i class="bi bi-shield-check"></i>

            <div>
              <small>Estado</small>

              <strong>
                {{ cliente?.estatus || 'Activo' }}
              </strong>
            </div>
          </div>
        </div>

        <div class="amc-modal-footer">
          <button
            class="amc-secondary-button"
            type="button"
            @click="showProfileModal = false"
          >
            Cerrar
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
  ref,
  watch
} from 'vue'

import { supabase } from '../services/supabase.js'
import {
  actualizarInsigniaAplicacion,
  desactivarNotificacionesPush,
  limpiarInsigniaAplicacion,
  obtenerSuscripcionPush
} from '../services/pushNotificationService.js'
import PushNotificationsControl from './PushNotificationsControl.vue'

import {
  obtenerVehiculosCliente,
  obtenerRegistrosTransmisionCliente,
  registrarTransmisionCliente
} from '../services/clienteService.js'

import {
  obtenerAlertasCliente,
  marcarAlertaClienteLeida,
  obtenerCitasCliente,
  crearCitaCliente,
  cancelarCitaCliente,
  resolverReprogramacionCitaCliente
} from '../services/alertaService.js'

import {
  obtenerDetalleServicio,
  obtenerHistorialServicios
} from '../services/servicioService.js'


/* ============================================================
   PROPS / EMITS
============================================================ */

const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: false
  },

  cliente: {
    type: Object,
    default: () => ({})
  }
})


const emit = defineEmits([
  'logout'
])


/* ============================================================
   ESTADOS GENERALES
============================================================ */

const sidebarOpen = ref(false)

const showUserMenu = ref(false)

const showProfileModal = ref(false)

const activeSection = ref('inicio')

const currentDate = ref('')

const currentTime = ref('')

const loading = ref(false)

const errorMessage = ref('')

let clockInterval = null
let clientAlertChannel = null


/* ============================================================
   NOTIFICACIONES - DROPDOWN
============================================================ */

const showNotificationsDropdown =
  ref(false)

const notificacionesRecientes =
  ref([])


/* ============================================================
   VEHÍCULOS DEL CLIENTE
============================================================ */

const vehicles = ref([])

const selectedVehicleId = ref(null)

const clientServices = ref([])
const clientServicesLoading = ref(false)
const clientServicesError = ref('')
const activeClientServiceId = ref(null)
const activeClientServiceDetail = ref(null)
const serviceDetailLoading = ref(false)
let serviceDetailRequestId = 0


/* ============================================================
   CITAS DEL CLIENTE
============================================================ */
const appointments = ref([])
const appointmentsLoading = ref(false)
const appointmentsSaving = ref(false)
const appointmentCancellingId = ref(null)
const appointmentResponseId = ref(null)
const appointmentMessage = ref('')
const appointmentMessageType = ref('success')
const appointmentForm = ref({ id_vehiculo: '', fecha: '', hora: '', motivo: '', observaciones: '' })
const appointmentMinDate = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
})

const loadAppointments = async () => {
  appointmentsLoading.value = true
  try { appointments.value = await obtenerCitasCliente() || [] }
  catch (error) { console.error('Error al cargar citas:', error); appointments.value = [] }
  finally { appointmentsLoading.value = false }
}

const resetAppointmentForm = () => {
  appointmentForm.value = {
    id_vehiculo: selectedVehicleId.value ? String(selectedVehicleId.value) : '',
    fecha: '', hora: '', motivo: '', observaciones: ''
  }
}

const submitAppointment = async () => {
  appointmentMessage.value = ''
  appointmentsSaving.value = true
  try {
    await crearCitaCliente({ ...appointmentForm.value })
    appointmentMessageType.value = 'success'
    appointmentMessage.value = 'Cita programada correctamente.'
    await loadAppointments()
    resetAppointmentForm()
  } catch (error) {
    appointmentMessageType.value = 'danger'
    appointmentMessage.value = error?.message || 'No fue posible programar la cita.'
  } finally { appointmentsSaving.value = false }
}

const cancelAppointment = async appointment => {
  if (!appointment?.id_cita) return
  if (!window.confirm('¿Deseas cancelar esta cita?')) return
  appointmentCancellingId.value = appointment.id_cita
  appointmentMessage.value = ''
  try {
    await cancelarCitaCliente(appointment.id_cita)
    appointmentMessageType.value = 'success'
    appointmentMessage.value = 'Cita cancelada correctamente.'
    await loadAppointments()
  } catch (error) {
    appointmentMessageType.value = 'danger'
    appointmentMessage.value = error?.message || 'No fue posible cancelar la cita.'
  } finally { appointmentCancellingId.value = null }
}

const respondToReschedule = async (appointment, accept) => {
  if (!appointment?.id_cita) return
  if (!accept && !window.confirm('Si rechazas la propuesta, la cita se cancelará. ¿Deseas continuar?')) return

  appointmentResponseId.value = appointment.id_cita
  appointmentMessage.value = ''
  try {
    await resolverReprogramacionCitaCliente(appointment.id_cita, accept)
    appointmentMessageType.value = 'success'
    appointmentMessage.value = accept
      ? 'Aceptaste la nueva fecha y hora de tu cita.'
      : 'Rechazaste la propuesta y la cita fue cancelada.'
    await loadAppointments()
  } catch (error) {
    console.error('Error respondiendo a la propuesta de cita:', error)
    appointmentMessageType.value = 'danger'
    appointmentMessage.value = error?.message || 'No fue posible registrar tu respuesta.'
  } finally {
    appointmentResponseId.value = null
  }
}

const appointmentStatusLabel = status => ({ PROXIMA:'Próxima', EN_ATENCION:'En atención', ATENDIDA:'Atendida', VENCIDA:'Vencida', CANCELADA:'Cancelada' }[String(status || '').toUpperCase()] || status || 'Sin estado')
const appointmentStatusClass = status => ({ PROXIMA:'pending', EN_ATENCION:'reviewed', ATENDIDA:'attended', VENCIDA:'pending', CANCELADA:'pending' }[String(status || '').toUpperCase()] || 'pending')
const formatAppointmentDate = value => { if (!value) return '—'; const [y,m,d]=String(value).split('-').map(Number); return new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(y,m-1,d)) }
const formatAppointmentTime = value => value ? String(value).slice(0,5) : '—'


/* ============================================================
   RECORDAR ÚLTIMO VEHÍCULO SELECCIONADO POR CLIENTE
============================================================ */

const getSelectedVehicleStorageKey = () => {
  const idCliente =
    props.cliente?.id_cliente


  if (!idCliente) {
    return null
  }


  return `automecanic_selected_vehicle_${idCliente}`
}


/* ============================================================
   NOTIFICACIONES DEL CLIENTE
============================================================ */

const notifications = ref([])

const notificationsLoading = ref(false)

const notificationError = ref('')


/* ============================================================
   CONTADOR DE ALERTAS NO LEÍDAS
============================================================ */

const alertCount = computed(() => {
  return notifications.value.filter(
    notification =>
      String(
        notification.estado || ''
      )
        .trim()
        .toUpperCase() !== 'LEIDA'
  ).length
})


/* ============================================================
   FORMATEAR FECHA DE ALERTA
============================================================ */

const formatNotificationDate = value => {
  if (!value) {
    return 'Sin fecha'
  }

  const isDateOnly =
    /^\d{4}-\d{2}-\d{2}$/.test(String(value))
  const date = isDateOnly
    ? new Date(`${value}T12:00:00`)
    : new Date(value)


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value
  }


  return new Intl.DateTimeFormat(
    'es-MX',
    isDateOnly
      ? {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      : {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'America/Mexico_City'
        }
  ).format(
    date
  )
}


/* ============================================================
   TÍTULO DE LA ALERTA
============================================================ */

const getNotificationTitle = alerta => {
  if (alerta?.tipo_alerta === 'ACCION_MECANICO_CLIENTE') {
    return 'Actividad del mecánico en tu vehículo'
  }

  if (alerta?.tipo_alerta === 'OBSERVACION_TRANSMISION_MECANICO') {
    return 'El mecánico actualizó tu observación de transmisión'
  }

  if (alerta?.tipo_alerta === 'CITA_CONFIRMADA_MECANICO') {
    return 'Tu solicitud de cita fue revisada'
  }

  if (alerta?.tipo_alerta === 'CITA_REPROGRAMACION_PROPUESTA') {
    return 'El mecánico propuso cambiar tu cita'
  }

  if (alerta?.tipo_alerta === 'CITA_RECHAZADA_MECANICO') {
    return 'El mecánico no puede atender tu cita'
  }

  if (alerta?.tipo_alerta === 'CITA_VISTA_MECANICO') {
    return 'El mecánico vio tu solicitud de cita'
  }

  if (alerta?.tipo_alerta === 'TRANSMISION_VISTA_MECANICO') {
    return 'El mecánico vio tu reporte de transmisión'
  }

  const tipo =
    String(
      alerta?.tipo_alerta || ''
    )
      .trim()
      .replace(/_/g, ' ')
      .toLowerCase()


  if (!tipo) {
    return 'Aviso de mantenimiento'
  }


  return (
    tipo.charAt(0).toUpperCase() +
    tipo.slice(1)
  )
}


/* ============================================================
   TIPO VISUAL DE LA ALERTA
============================================================ */

const getNotificationType = nivel => {
  const normalized =
    String(
      nivel || ''
    )
      .trim()
      .toUpperCase()


  if (
    normalized === 'CRITICO' ||
    normalized === 'CRÍTICO' ||
    normalized === 'ALTO'
  ) {
    return 'danger'
  }


  if (
    normalized === 'ADVERTENCIA' ||
    normalized === 'MEDIO'
  ) {
    return 'warning'
  }


  if (
    normalized === 'INFORMATIVO' ||
    normalized === 'INFO' ||
    normalized === 'BAJO'
  ) {
    return 'info'
  }


  return 'info'
}


/* ============================================================
   ICONO DE LA ALERTA
============================================================ */

const getNotificationIcon = nivel => {
  const normalized =
    String(
      nivel || ''
    )
      .trim()
      .toUpperCase()


  if (
    normalized === 'CRITICO' ||
    normalized === 'CRÍTICO' ||
    normalized === 'ALTO'
  ) {
    return 'bi bi-exclamation-triangle-fill'
  }


  if (
    normalized === 'ADVERTENCIA' ||
    normalized === 'MEDIO'
  ) {
    return 'bi bi-exclamation-circle-fill'
  }


  return 'bi bi-info-circle-fill'
}


/* ============================================================
   CARGAR ALERTAS REALES DEL CLIENTE
============================================================ */

const loadClientNotifications = async () => {
  const idUsuario =
    props.cliente?.id_usuario


  notificationError.value = ''


  if (!idUsuario) {
    notifications.value = []

    console.warn(
      'ClientDashboard: no se recibió id_usuario para cargar alertas.',
      props.cliente
    )

    return
  }


  notificationsLoading.value = true


  try {
    const data =
      await obtenerAlertasCliente(
        idUsuario
      )


    notifications.value =
      (Array.isArray(data)
        ? data
        : []
      ).map(
        alerta => ({
          ...alerta,

          id:
            alerta.id_alerta,

          title:
            getNotificationTitle(
              alerta
            ),

          message:
            alerta.mensaje ||
            'Tienes un nuevo aviso de mantenimiento.',

          date:
            formatNotificationDate(
              alerta.fecha_registro ||
              alerta.fecha_programada
            ),

          type:
            getNotificationType(
              alerta.nivel
            ),

          icon:
            getNotificationIcon(
              alerta.nivel
            ),

          read:
            String(
              alerta.estado || ''
            )
              .trim()
              .toUpperCase() === 'LEIDA'
        })
      )

    actualizarInsigniaAplicacion(idUsuario)
      .catch(error => {
        console.error(
          'Error actualizando el contador de notificaciones de la app:',
          error
        )
      })

    if (showNotificationsDropdown.value) {
      notificacionesRecientes.value = notifications.value
        .filter(notification => !notification.read)
        .slice(0, 5)
    }
  } catch (error) {
    console.error(
      'Error cargando alertas del cliente:',
      error
    )


    notifications.value = []


    notificationError.value =
      error?.message ||
      'No fue posible cargar tus notificaciones.'
  } finally {
    notificationsLoading.value = false
  }
}


/* ============================================================
   MARCAR NOTIFICACIÓN COMO LEÍDA
============================================================ */

const markNotificationAsRead = async notification => {
  if (
    !notification ||
    notification.read
  ) {
    return
  }


  try {
    await marcarAlertaClienteLeida(
      notification.id_alerta
    )


    notification.estado =
      'LEIDA'

    notification.read =
      true

    notification.fecha_lectura =
      new Date().toISOString()

    actualizarInsigniaAplicacion(props.cliente?.id_usuario)
      .catch(error => {
        console.error(
          'Error actualizando el contador de notificaciones de la app:',
          error
        )
      })
  } catch (error) {
    console.error(
      'Error marcando la alerta como leída:',
      error
    )


    notificationError.value =
      error?.message ||
      'No fue posible marcar la notificación como leída.'
  }
}


/* ============================================================
   DROPDOWN DE NOTIFICACIONES
============================================================ */

const toggleNotifications =
  () => {
    showNotificationsDropdown.value =
      !showNotificationsDropdown.value

    showUserMenu.value = false

    if (
      showNotificationsDropdown.value
    ) {
      /*
       * Tomamos las primeras 5 notificaciones
       * NO leídas del listado completo que ya
       * se carga con loadClientNotifications().
       */
      notificacionesRecientes.value =
        notifications.value
          .filter(
            n => !n.read
          )
          .slice(0, 5)
    }
  }


const irNotificacionDesdeDropdown =
  notification => {
    showNotificationsDropdown.value =
      false

    changeSection(
      notification?.tipo_alerta === 'CITA_REPROGRAMACION_PROPUESTA'
        ? 'citas'
        : 'notificaciones'
    )
  }


const verTodasLasNotificaciones =
  () => {
    showNotificationsDropdown.value =
      false

    changeSection(
      'notificaciones'
    )
  }


const marcarTodasComoLeidas =
  async () => {
    try {
      const pendientes =
        notifications.value.filter(
          n => !n.read
        )

      if (!pendientes.length) return

      await Promise.all(
        pendientes.map(
          n =>
            marcarAlertaClienteLeida(
              n.id_alerta
            )
        )
      )

      notifications.value =
        notifications.value.map(
          n => ({
            ...n,
            read: true,
            estado: 'LEIDA'
          })
        )

      notificacionesRecientes.value =
        []

      actualizarInsigniaAplicacion(props.cliente?.id_usuario)
        .catch(error => {
          console.error(
            'Error actualizando el contador de notificaciones de la app:',
            error
          )
        })
    } catch (error) {
      console.error(
        'Error marcando todas como leídas:',
        error
      )

      notificationError.value =
        error?.message ||
        'No fue posible marcar las notificaciones como leídas.'
    }
  }


/* ============================================================
   CLIENTE
============================================================ */

const clientName = computed(() => {
  const nombre =
    props.cliente?.nombre || ''

  const paterno =
    props.cliente?.apellido_paterno || ''

  const materno =
    props.cliente?.apellido_materno || ''


  const fullName = `
    ${nombre}
    ${paterno}
    ${materno}
  `
    .replace(/\s+/g, ' ')
    .trim()


  return fullName || 'Cliente'
})


const clientFirstName = computed(() => {
  return (
    props.cliente?.nombre ||
    'Cliente'
  )
})


const clientShortName = computed(() => {
  const nombre =
    props.cliente?.nombre || ''

  const paterno =
    props.cliente?.apellido_paterno || ''


  const shortName =
    `${nombre} ${paterno}`
      .replace(/\s+/g, ' ')
      .trim()


  return shortName || 'Cliente'
})


const clientEmail = computed(() => {
  return (
    props.cliente?.correo ||
    props.cliente?.email ||
    'Sin correo'
  )
})


const clientInitials = computed(() => {
  const words =
    clientName.value
      .split(' ')
      .filter(Boolean)


  if (!words.length) {
    return 'CL'
  }


  if (words.length === 1) {
    return words[0]
      .substring(0, 2)
      .toUpperCase()
  }


  return (
    words[0][0] +
    words[1][0]
  ).toUpperCase()
})


/* ============================================================
   CARGAR VEHÍCULOS DEL CLIENTE
============================================================ */

const loadClientVehicles = async () => {
  const idCliente =
    props.cliente?.id_cliente


  errorMessage.value = ''


  if (!idCliente) {
    vehicles.value = []

    errorMessage.value =
      'No fue posible identificar al cliente actual.'

    console.warn(
      'ClientDashboard: no se recibió id_cliente.',
      props.cliente
    )

    return
  }


  loading.value = true


  try {
    const data =
      await obtenerVehiculosCliente(
        idCliente
      )


    vehicles.value =
      Array.isArray(data)
        ? data
        : []


    const storageKey =
      getSelectedVehicleStorageKey()


    const savedVehicleId =
      storageKey
        ? localStorage.getItem(storageKey)
        : null


    const savedVehicleExists =
      savedVehicleId !== null &&
      vehicles.value.some(
        vehicle =>
          String(
            vehicle.id_vehiculo ??
            vehicle.id
          ) ===
          String(savedVehicleId)
      )


    if (savedVehicleExists) {
      selectedVehicleId.value =
        savedVehicleId
    } else {
      selectedVehicleId.value =
        vehicles.value[0]?.id_vehiculo ??
        vehicles.value[0]?.id ??
        null


      if (
        storageKey &&
        selectedVehicleId.value !== null
      ) {
        localStorage.setItem(
          storageKey,
          String(selectedVehicleId.value)
        )
      }
    }


    console.log(
      'Vehículos del cliente:',
      vehicles.value
    )
  } catch (error) {
    console.error(
      'Error cargando vehículos del cliente:',
      error
    )


    vehicles.value = []


    errorMessage.value =
      error?.message ||
      'No fue posible cargar la información de tus vehículos.'
  } finally {
    loading.value = false
  }
}

const loadClientServiceHistory = async () => {
  const vehicleId = Number(selectedVehicleId.value)
  const requestId = ++serviceDetailRequestId

  clientServices.value = []
  activeClientServiceId.value = null
  activeClientServiceDetail.value = null
  clientServicesError.value = ''

  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    clientServicesLoading.value = false
    return
  }

  clientServicesLoading.value = true

  try {
    const services = await obtenerHistorialServicios(vehicleId)

    if (
      requestId === serviceDetailRequestId &&
      Number(selectedVehicleId.value) === vehicleId
    ) {
      clientServices.value = services
    }
  } catch (error) {
    console.error('Error cargando el historial de servicios del cliente:', error)

    if (requestId === serviceDetailRequestId) {
      clientServicesError.value =
        error?.message ||
        'No fue posible cargar el historial de servicios.'
    }
  } finally {
    if (requestId === serviceDetailRequestId) {
      clientServicesLoading.value = false
    }
  }
}

const toggleClientServiceDetail = async idServicio => {
  if (activeClientServiceId.value === idServicio) {
    activeClientServiceId.value = null
    activeClientServiceDetail.value = null
    return
  }

  const requestId = ++serviceDetailRequestId
  activeClientServiceId.value = idServicio
  activeClientServiceDetail.value = null
  clientServicesError.value = ''
  serviceDetailLoading.value = true

  try {
    const detail = await obtenerDetalleServicio(idServicio)

    if (
      requestId === serviceDetailRequestId &&
      clientServices.value.some(
        service => service.id_servicio === idServicio
      )
    ) {
      activeClientServiceDetail.value = detail
    }
  } catch (error) {
    console.error('Error cargando el detalle de servicio del cliente:', error)
    clientServicesError.value =
      error?.message ||
      'No fue posible cargar el detalle de este servicio.'
    activeClientServiceId.value = null
  } finally {
    if (requestId === serviceDetailRequestId) {
      serviceDetailLoading.value = false
    }
  }
}


/* ============================================================
   VEHÍCULO SELECCIONADO

   La vista "Mi vehículo" conserva el mismo diseño, pero ahora
   permite consultar cualquiera de las unidades del cliente.
============================================================ */

const selectVehicle = vehicle => {
  const vehicleId =
    vehicle?.id_vehiculo ??
    vehicle?.id ??
    null


  selectedVehicleId.value =
    vehicleId


  const storageKey =
    getSelectedVehicleStorageKey()


  if (
    storageKey &&
    vehicleId !== null
  ) {
    localStorage.setItem(
      storageKey,
      String(vehicleId)
    )
  }
}


const getVehicleDisplayName = vehicle => {
  const name =
    `${vehicle?.marca || ''} ${vehicle?.modelo || ''}`
      .replace(/\s+/g, ' ')
      .trim()

  return name || 'Vehículo registrado'
}


const vehicleData = computed(() => {
  if (
    Array.isArray(vehicles.value) &&
    vehicles.value.length
  ) {
    const selectedVehicle =
      vehicles.value.find(
        vehicle =>
          String(
            vehicle.id_vehiculo ??
            vehicle.id
          ) ===
          String(selectedVehicleId.value)
      )

    return selectedVehicle || vehicles.value[0]
  }


  if (
    props.cliente?.vehiculo &&
    typeof props.cliente.vehiculo === 'object'
  ) {
    return props.cliente.vehiculo
  }


  if (
    Array.isArray(
      props.cliente?.vehiculos
    ) &&
    props.cliente.vehiculos.length
  ) {
    return props.cliente.vehiculos[0]
  }


  return {}
})


const vehicleBrand = computed(() => {
  return (
    vehicleData.value?.marca ||
    'No registrado'
  )
})


const vehicleModel = computed(() => {
  return (
    vehicleData.value?.modelo ||
    (
      typeof props.cliente?.vehiculo ===
      'string'
        ? props.cliente.vehiculo
        : 'No registrado'
    )
  )
})


const vehicleName = computed(() => {
  const marca =
    vehicleData.value?.marca || ''


  const modelo =
    vehicleData.value?.modelo ||
    (
      typeof props.cliente?.vehiculo ===
      'string'
        ? props.cliente.vehiculo
        : ''
    )


  const name =
    `${marca} ${modelo}`
      .replace(/\s+/g, ' ')
      .trim()


  return (
    name ||
    'Sin vehículo registrado'
  )
})


const vehiclePlate = computed(() => {
  return (
    vehicleData.value?.placas ||
    props.cliente?.placas ||
    'No registrado'
  )
})


const vehicleYear = computed(() => {
  return (
    vehicleData.value?.anio ||
    vehicleData.value?.anio_modelo ||
    vehicleData.value?.año ||
    'No registrado'
  )
})


const vehicleSerial = computed(() => {
  return (
    vehicleData.value?.numero_serie ||
    'No registrado'
  )
})


const vehicleType = computed(() => {
  return (
    vehicleData.value?.tipo_vehiculo ||
    vehicleData.value?.tipo_unidad ||
    vehicleData.value?.tipo ||
    'No registrado'
  )
})


const vehicleStatus = computed(() => {
  const status =
    vehicleData.value?.estatus ||
    vehicleData.value?.estado

  return status || 'No registrado'
})


const vehicleMileage = computed(() => {
  const mileage =
    vehicleData.value?.kilometraje ??
    vehicleData.value?.kilometraje_actual ??
    props.cliente?.kilometraje


  if (
    mileage === null ||
    mileage === undefined ||
    mileage === ''
  ) {
    return 'No registrado'
  }


  const numericMileage =
    Number(mileage)


  if (
    Number.isNaN(
      numericMileage
    )
  ) {
    return `${mileage} km`
  }


  return (
    new Intl.NumberFormat(
      'es-MX'
    )
      .format(
        numericMileage
      ) +
    ' km'
  )
})


/* ============================================================
   ESTADO DE LLANTAS DEL VEHÍCULO SELECCIONADO
   Punto 4 — vista exclusiva de consulta para el cliente.
============================================================ */

const tireInspection = computed(() => {
  return (
    vehicleData.value
      ?.inspeccion_llantas ||
    null
  )
})


const tireInspectionItems = computed(() => {
  return Array.isArray(
    tireInspection.value?.llantas
  )
    ? tireInspection.value.llantas
    : []
})


const tireInspectionAvailable = computed(() => {
  return (
    Boolean(
      tireInspection.value
        ?.id_servicio
    ) &&
    tireInspectionItems.value.length > 0
  )
})


const formatClientDate = value => {
  if (!value) {
    return 'No registrada'
  }

  const parts =
    String(value)
      .split('-')

  if (parts.length === 3) {
    const date =
      new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
      )

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return new Intl.DateTimeFormat(
        'es-MX',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      ).format(date)
    }
  }

  return String(value)
}


const tireInspectionDate = computed(() => {
  return formatClientDate(
    tireInspection.value
      ?.fecha_servicio
  )
})


const tireInspectionMileage = computed(() => {
  const value =
    tireInspection.value
      ?.kilometraje

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'No registrado'
  }

  const numeric =
    Number(value)

  if (
    Number.isNaN(
      numeric
    )
  ) {
    return `${value} km`
  }

  return (
    new Intl.NumberFormat(
      'es-MX'
    ).format(numeric) +
    ' km'
  )
})


const normalizeTireCondition = value => {
  return String(
    value || ''
  )
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
}


const getTireConditionSeverity = value => {
  const condition =
    normalizeTireCondition(
      value
    )

  if (
    condition.includes('REEMPLAZ') ||
    condition.includes('CAMBIO') ||
    condition.includes('MALA') ||
    condition.includes('CRITIC')
  ) {
    return 3
  }

  if (
    condition.includes('ATENCION') ||
    condition.includes('REGULAR') ||
    condition.includes('DESGAST')
  ) {
    return 2
  }

  if (
    condition.includes('BUEN') ||
    condition.includes('OK') ||
    condition.includes('EXCELENTE')
  ) {
    return 1
  }

  return 0
}


const tireGeneralSeverity = computed(() => {
  if (
    !tireInspectionAvailable.value
  ) {
    return 0
  }

  return tireInspectionItems.value
    .reduce(
      (
        maxSeverity,
        tire
      ) =>
        Math.max(
          maxSeverity,
          getTireConditionSeverity(
            tire.condicion
          )
        ),
      0
    )
})


const tireGeneralStatusLabel = computed(() => {
  if (
    !tireInspectionAvailable.value
  ) {
    return 'Sin inspección'
  }

  if (
    tireGeneralSeverity.value >= 3
  ) {
    return 'Reemplazar'
  }

  if (
    tireGeneralSeverity.value === 2
  ) {
    return 'Requiere atención'
  }

  if (
    tireGeneralSeverity.value === 1
  ) {
    return 'Buen estado'
  }

  return 'Revisar'
})


const tireGeneralStatusClass = computed(() => {
  if (
    !tireInspectionAvailable.value
  ) {
    return 'empty'
  }

  if (
    tireGeneralSeverity.value >= 3
  ) {
    return 'danger'
  }

  if (
    tireGeneralSeverity.value === 2
  ) {
    return 'warning'
  }

  if (
    tireGeneralSeverity.value === 1
  ) {
    return 'success'
  }

  return 'neutral'
})


const tireGeneralStatusIcon = computed(() => {
  if (
    !tireInspectionAvailable.value
  ) {
    return 'bi bi-dash-circle'
  }

  if (
    tireGeneralSeverity.value >= 3
  ) {
    return 'bi bi-exclamation-octagon-fill'
  }

  if (
    tireGeneralSeverity.value === 2
  ) {
    return 'bi bi-exclamation-triangle-fill'
  }

  if (
    tireGeneralSeverity.value === 1
  ) {
    return 'bi bi-check-circle-fill'
  }

  return 'bi bi-info-circle-fill'
})


const getTireConditionClass = value => {
  const severity =
    getTireConditionSeverity(
      value
    )

  if (severity >= 3) {
    return 'danger'
  }

  if (severity === 2) {
    return 'warning'
  }

  if (severity === 1) {
    return 'success'
  }

  return 'neutral'
}


const getTirePositionLabel = tire => {
  const position =
    tire?.posicion ||
    'Posición no especificada'

  const number =
    tire?.numero_llanta

  if (
    number === null ||
    number === undefined ||
    number === ''
  ) {
    return position
  }

  return `${position} · Llanta ${number}`
}


const formatTirePsi = value => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'No registrado'
  }

  return `${value} PSI`
}


const formatTireWear = value => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'No registrado'
  }

  return `${value} mm`
}


/* ============================================================
   VEHÍCULOS PARA TABLA
============================================================ */

/* ============================================================
   MANTENIMIENTO PREVENTIVO DEL VEHÍCULO SELECCIONADO
   Vista exclusiva de consulta para el cliente.
============================================================ */

const maintenanceConfig = computed(() => {
  return (
    vehicleData.value
      ?.configuracion_mantenimiento ||
    null
  )
})


const maintenanceConfigured = computed(() => {
  const config =
    maintenanceConfig.value

  return Boolean(
    config &&
    config.ultimo_km_registrado !== null &&
    config.ultimo_km_registrado !== undefined &&
    config.intervalo !== null &&
    config.intervalo !== undefined &&
    config.proximo_servicio !== null &&
    config.proximo_servicio !== undefined
  )
})


const maintenanceCurrentKmNumber = computed(() => {
  const value =
    Number(
      vehicleData.value
        ?.kilometraje_actual ??
      vehicleData.value
        ?.kilometraje
    )

  return Number.isFinite(value)
    ? value
    : null
})


const maintenanceNextKmNumber = computed(() => {
  if (!maintenanceConfigured.value) {
    return null
  }

  const value =
    Number(
      maintenanceConfig.value
        ?.proximo_servicio
    )

  return Number.isFinite(value)
    ? value
    : null
})


const maintenanceRemainingKm = computed(() => {
  const current =
    maintenanceCurrentKmNumber.value

  const next =
    maintenanceNextKmNumber.value

  if (
    current === null ||
    next === null
  ) {
    return null
  }

  return next - current
})


const maintenanceStatus = computed(() => {
  if (!maintenanceConfigured.value) {
    return 'SIN_CONFIGURAR'
  }

  const remaining =
    maintenanceRemainingKm.value

  if (remaining === null) {
    return 'SIN_CONFIGURAR'
  }

  if (remaining <= 0) {
    return 'VENCIDO'
  }

  if (remaining <= 1000) {
    return 'PROXIMO'
  }

  return 'AL_DIA'
})


const maintenanceStatusLabel = computed(() => {
  const labels = {
    AL_DIA: 'Al día',
    PROXIMO: 'Próximo',
    VENCIDO: 'Vencido',
    SIN_CONFIGURAR: 'Sin configurar'
  }

  return (
    labels[
      maintenanceStatus.value
    ] ||
    'Sin configurar'
  )
})


const maintenanceStatusClass = computed(() => {
  const classes = {
    AL_DIA: 'is-ok',
    PROXIMO: 'is-warning',
    VENCIDO: 'is-danger',
    SIN_CONFIGURAR: 'is-neutral'
  }

  return (
    classes[
      maintenanceStatus.value
    ] ||
    'is-neutral'
  )
})


const maintenanceStatusIcon = computed(() => {
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
    icons[
      maintenanceStatus.value
    ] ||
    'bi bi-dash-circle'
  )
})


const formatMaintenanceKilometers = value => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'No registrado'
  }

  const numeric =
    Number(value)

  if (!Number.isFinite(numeric)) {
    return 'No registrado'
  }

  return (
    new Intl.NumberFormat(
      'es-MX'
    ).format(
      Math.round(numeric)
    ) +
    ' km'
  )
}


const maintenanceCurrentMileage = computed(() => {
  return formatMaintenanceKilometers(
    maintenanceCurrentKmNumber.value
  )
})


const maintenanceLastMileage = computed(() => {
  return formatMaintenanceKilometers(
    maintenanceConfig.value
      ?.ultimo_km_registrado
  )
})


const maintenanceInterval = computed(() => {
  return formatMaintenanceKilometers(
    maintenanceConfig.value
      ?.intervalo
  )
})


const maintenanceNextMileage = computed(() => {
  return formatMaintenanceKilometers(
    maintenanceNextKmNumber.value
  )
})


const maintenanceRemainingTitle = computed(() => {
  if (
    maintenanceStatus.value ===
    'VENCIDO'
  ) {
    return 'Mantenimiento vencido'
  }

  return 'Kilómetros restantes'
})


const maintenanceRemainingText = computed(() => {
  const remaining =
    maintenanceRemainingKm.value

  if (remaining === null) {
    return 'No disponible'
  }

  if (remaining < 0) {
    return formatMaintenanceKilometers(
      Math.abs(remaining)
    )
  }

  return formatMaintenanceKilometers(
    remaining
  )
})


const maintenanceRemainingCaption = computed(() => {
  const remaining =
    maintenanceRemainingKm.value

  if (remaining === null) {
    return 'Seguimiento no disponible'
  }

  if (remaining < 0) {
    return 'Kilómetros excedidos desde el servicio programado'
  }

  if (remaining === 0) {
    return 'El mantenimiento corresponde ahora'
  }

  if (remaining <= 1000) {
    return 'El próximo mantenimiento está cerca'
  }

  return 'Antes del próximo mantenimiento'
})


const recentVehicles = computed(() => {
  return vehicles.value.map(
    vehicle => ({
      ...vehicle,

      id_vehiculo:
        vehicle.id_vehiculo ??
        vehicle.id,

      no_economico:
        vehicle.no_economico || '',

      placas:
        vehicle.placas ||
        'No registrado',

      marca:
        vehicle.marca ||
        'No registrado',

      modelo:
        vehicle.modelo ||
        'No registrado',

      tipo_unidad:
        vehicle.tipo_unidad ||
        vehicle.tipo_vehiculo ||
        vehicle.tipo ||
        '',

      anio_modelo:
        vehicle.anio_modelo ||
        vehicle.anio ||
        vehicle.año ||
        '',

      kilometraje_actual:
        vehicle.kilometraje_actual ??
        vehicle.kilometraje ??
        null,

      estatus:
        vehicle.estatus ||
        'No registrado'
    })
  )
})


/* ============================================================
   TÍTULOS
============================================================ */

const sectionTitle = computed(() => {
  const titles = {
    inicio:
      'Panel principal',

    vehiculo:
      'Mi vehículo',

    notificaciones:
      'Notificaciones',

    citas:
      'Citas',

    transmision:
      'Transmisión'
  }


  return (
    titles[
      activeSection.value
    ] ||
    'Panel principal'
  )
})


const sectionDescription = computed(() => {
  const descriptions = {
    inicio:
      'Resumen de la información de tu vehículo',

    vehiculo:
      'Consulta de la información registrada de tus unidades',

    notificaciones:
      'Avisos relacionados con el mantenimiento de tu vehículo',

    citas:
      'Agenda y seguimiento de tus visitas al taller',

    transmision:
      'Registro autorizado de información de transmisión'
  }


  return (
    descriptions[
      activeSection.value
    ] ||
    'Portal del cliente'
  )
})


/* ============================================================
   NAVEGACIÓN
============================================================ */

const navigation = [
  {
    key: 'inicio',
    label: 'Inicio',
    icon: 'bi bi-grid-fill'
  },

  {
    key: 'vehiculo',
    label: 'Mi vehículo',
    icon: 'bi bi-car-front-fill'
  },

  {
    key: 'notificaciones',
    label: 'Notificaciones',
    icon: 'bi bi-bell-fill'
  },

  {
    key: 'citas',
    label: 'Citas',
    icon: 'bi bi-calendar-check-fill'
  },

  {
    key: 'transmision',
    label: 'Transmisión',
    icon: 'bi bi-gear-wide-connected'
  }
]


const changeSection = section => {
  activeSection.value =
    section

  sidebarOpen.value =
    false

  showUserMenu.value =
    false

  showNotificationsDropdown.value =
    false

}


/* ============================================================
   FECHA Y HORA
============================================================ */

const updateClock = () => {
  const now =
    new Date()


  currentDate.value =
    new Intl.DateTimeFormat(
      'es-MX',
      {
        day:
          '2-digit',

        month:
          'short',

        year:
          'numeric'
      }
    ).format(
      now
    )


  currentTime.value =
    new Intl.DateTimeFormat(
      'es-MX',
      {
        hour:
          '2-digit',

        minute:
          '2-digit',

        second:
          '2-digit'
      }
    ).format(
      now
    )
}


/* ============================================================
   COLOR DEL NAVEGADOR MÓVIL
============================================================ */

const setMobileThemeColor = color => {
  const meta =
    document.querySelector(
      '#app-theme-color'
    ) ||
    document.querySelector(
      'meta[name="theme-color"]'
    )


  if (meta) {
    meta.setAttribute(
      'content',
      color
    )
  }
}


const restoreMobileThemeColor = () => {
  const currentTheme =
    document.documentElement
      .getAttribute(
        'data-theme'
      )


  setMobileThemeColor(
    currentTheme === 'dark'
      ? '#030508'
      : '#f1f5f9'
  )
}


watch(
  () => props.isDarkMode,

  isDark => {
    setMobileThemeColor(
      isDark
        ? '#030508'
        : '#f1f5f9'
    )
  },

  {
    immediate: true
  }
)


/* ============================================================
   RECARGAR ALERTAS SI CAMBIA EL USUARIO DEL CLIENTE
============================================================ */

watch(
  () =>
    props.cliente?.id_usuario,

  (
    nuevoId,
    anteriorId
  ) => {
    if (
      nuevoId &&
      nuevoId !== anteriorId
    ) {
      loadClientNotifications()
    }
  }
)


/* ============================================================
   BLOQUEO DEL SCROLL EN MÓVIL
============================================================ */

let dashboardScrollY = 0

let dashboardScrollLocked =
  false


const lockDashboardScroll = () => {
  if (
    window.innerWidth > 991
  ) {
    return
  }


  if (
    dashboardScrollLocked
  ) {
    return
  }


  dashboardScrollY =
    window.scrollY ||
    document.documentElement.scrollTop ||
    0


  dashboardScrollLocked =
    true


  document.documentElement.style.overflow =
    'hidden'

  document.documentElement.style.overscrollBehavior =
    'none'

  document.body.style.position =
    'fixed'

  document.body.style.top =
    `-${dashboardScrollY}px`

  document.body.style.left =
    '0'

  document.body.style.right =
    '0'

  document.body.style.width =
    '100%'

  document.body.style.overflow =
    'hidden'

  document.body.style.overscrollBehavior =
    'none'
}


const unlockDashboardScroll = () => {
  if (
    !dashboardScrollLocked
  ) {
    return
  }


  dashboardScrollLocked =
    false


  document.documentElement.style.overflow =
    ''

  document.documentElement.style.overscrollBehavior =
    ''

  document.body.style.position =
    ''

  document.body.style.top =
    ''

  document.body.style.left =
    ''

  document.body.style.right =
    ''

  document.body.style.width =
    ''

  document.body.style.overflow =
    ''

  document.body.style.overscrollBehavior =
    ''


  window.scrollTo(
    0,
    dashboardScrollY
  )
}


watch(
  sidebarOpen,

  isOpen => {
    if (isOpen) {
      setMobileThemeColor(
        '#075985'
      )

      lockDashboardScroll()
    } else {
      restoreMobileThemeColor()

      unlockDashboardScroll()
    }
  }
)


/* ============================================================
   CERRAR SESIÓN
============================================================ */

const logout = async () => {
  showUserMenu.value =
    false

  try {
    const subscription = await obtenerSuscripcionPush()
    if (subscription) {
      await desactivarNotificacionesPush(
        props.cliente?.id_usuario,
        subscription
      )
    }

    await limpiarInsigniaAplicacion()
  } catch (error) {
    console.error(
      'Error desactivando notificaciones del cliente al cerrar sesión:',
      error
    )
  }

  try {
    const {
      error
    } =
      await supabase
        .auth
        .signOut()


    if (error) {
      console.error(
        'Error cerrando sesión:',
        error
      )
    }
  } catch (error) {
    console.error(
      'Error al cerrar sesión:',
      error
    )
  } finally {
    emit(
      'logout'
    )
  }
}


/* ============================================================
   CLICK GLOBAL
============================================================ */

const openNativeDatePicker = event => {
  const input = event?.target

  if (!(input instanceof HTMLInputElement)) {
    return
  }

  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker()
      return
    } catch (error) {
      console.warn('No se pudo abrir el selector nativo:', error)
    }
  }

  input.focus()
}

const handleGlobalClick = event => {
  const target = event?.target

  if (!(target instanceof Node)) {
    showUserMenu.value = false
    showNotificationsDropdown.value = false
    return
  }

  const path = typeof event.composedPath === 'function'
    ? event.composedPath()
    : []

  const clickedInsideUserMenu = path.some(
    node =>
      node instanceof Element &&
      node.closest('.amc-profile-wrapper')
  ) || target.closest('.amc-profile-wrapper')

  const clickedInsideAlerts = path.some(
    node =>
      node instanceof Element &&
      node.closest('.amc-alerts-wrapper')
  ) || target.closest('.amc-alerts-wrapper')

  if (!clickedInsideUserMenu) {
    showUserMenu.value = false
  }

  if (!clickedInsideAlerts) {
    showNotificationsDropdown.value = false
  }
}


/* ============================================================
   FORMATO DE KILOMETRAJE
============================================================ */

const formatKilometers = value => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'No registrado'
  }


  const numeric =
    Number(
      value
    )


  return Number.isFinite(
    numeric
  )
    ? (
        new Intl.NumberFormat(
          'es-MX'
        ).format(
          numeric
        ) +
        ' km'
      )
    : 'No registrado'
}


/* ============================================================
   ICONO DEL VEHÍCULO
============================================================ */

const getVehicleIcon = type => {
  const normalized =
    String(
      type || ''
    ).toLowerCase()


  if (
    normalized.includes(
      'moto'
    )
  ) {
    return 'bi bi-bicycle'
  }


  if (
    normalized.includes(
      'camión'
    ) ||
    normalized.includes(
      'camion'
    )
  ) {
    return 'bi bi-truck'
  }


  return 'bi bi-car-front'
}


/* ============================================================
   CLASE DEL ESTADO
============================================================ */

const getStatusClass = status => {
  const normalized =
    String(
      status || ''
    )
      .trim()
      .toLowerCase()


  return (
    normalized === 'activo' ||
    normalized === 'activa'
  )
    ? 'active'
    : 'inactive'
}



/* ============================================================
   TRANSMISIÓN DEL CLIENTE
============================================================ */

const transmissionRecords = ref([])
const transmissionLoading = ref(false)
const transmissionSaving = ref(false)
const transmissionError = ref('')
const transmissionSuccess = ref('')

const transmissionSymptoms = [
  'Tirones al avanzar',
  'Ruido extraño',
  'Vibración',
  'Dificultad al cambiar velocidad',
  'Fuga de líquido',
  'Pérdida de fuerza',
  'Testigo encendido',
  'Otro'
]

const todayISO = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const transmissionForm = ref({
  id_vehiculo: '',
  fecha_observacion: todayISO(),
  sintomas: [],
  descripcion: '',
  atencion_externa: false,
  detalle_atencion_externa: ''
})

const resetTransmissionForm = () => {
  transmissionForm.value = {
    id_vehiculo: selectedVehicleId.value
      ? String(selectedVehicleId.value)
      : '',
    fecha_observacion: todayISO(),
    sintomas: [],
    descripcion: '',
    atencion_externa: false,
    detalle_atencion_externa: ''
  }
}

const loadTransmissionRecords = async () => {
  const idCliente = Number(props.cliente?.id_cliente)

  transmissionError.value = ''

  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    transmissionRecords.value = []
    return
  }

  transmissionLoading.value = true

  try {
    const data = await obtenerRegistrosTransmisionCliente(idCliente)
    transmissionRecords.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error cargando registros de transmisión:', error)
    transmissionError.value =
      error?.message ||
      'No fue posible cargar los registros de transmisión.'
  } finally {
    transmissionLoading.value = false
  }
}

const saveTransmissionRecord = async () => {
  transmissionError.value = ''
  transmissionSuccess.value = ''

  const idCliente = Number(props.cliente?.id_cliente)

  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    transmissionError.value =
      'No fue posible identificar al cliente.'
    return
  }

  transmissionSaving.value = true

  try {
    await registrarTransmisionCliente({
      id_cliente: idCliente,
      id_vehiculo: Number(transmissionForm.value.id_vehiculo),
      fecha_observacion: transmissionForm.value.fecha_observacion,
      sintomas: transmissionForm.value.sintomas,
      descripcion: transmissionForm.value.descripcion,
      atencion_externa: transmissionForm.value.atencion_externa,
      detalle_atencion_externa:
        transmissionForm.value.detalle_atencion_externa
    })

    transmissionSuccess.value =
      'La información de transmisión se registró correctamente.'

    resetTransmissionForm()
  resetAppointmentForm()
    await loadTransmissionRecords()
  } catch (error) {
    console.error('Error registrando transmisión:', error)
    transmissionError.value =
      error?.message ||
      'No fue posible registrar la información de transmisión.'
  } finally {
    transmissionSaving.value = false
  }
}

const getTransmissionVehicleName = idVehiculo => {
  const vehicle = vehicles.value.find(
    item =>
      String(item.id_vehiculo ?? item.id) ===
      String(idVehiculo)
  )

  if (!vehicle) {
    return 'Vehículo registrado'
  }

  const name = getVehicleDisplayName(vehicle)
  const plate = vehicle.placas || 'Sin placas'
  return `${name} · ${plate}`
}

const formatTransmissionDate = value => {
  if (!value) return 'Fecha no disponible'

  const parts = String(value).split('-')

  if (parts.length === 3) {
    const date = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
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

  return String(value)
}

const getTransmissionStatusClass = status => {
  const normalized = String(status || '').toUpperCase()

  if (normalized === 'ATENDIDO') return 'attended'
  if (normalized === 'REVISADO') return 'reviewed'
  return 'pending'
}

watch(
  selectedVehicleId,
  value => {
    loadClientServiceHistory()

    if (value) {
      transmissionForm.value.id_vehiculo = String(value)
      appointmentForm.value.id_vehiculo = String(value)
    }
  }
)

watch(
  () => props.cliente?.id_cliente,
  async (newId, oldId) => {
    if (
      newId &&
      String(newId) !== String(oldId || '')
    ) {
      await loadClientVehicles()
      await loadClientServiceHistory()
      await loadTransmissionRecords()
      await loadAppointments()
    }
  }
)


/* ============================================================
   MOUNT
============================================================ */

onMounted(async () => {
  updateClock()


  clockInterval =
    setInterval(
      updateClock,
      1000
    )


  document.addEventListener(
    'pointerdown',
    handleGlobalClick
  )

  const clientUserId = props.cliente?.id_usuario
  if (clientUserId) {
    clientAlertChannel = supabase
      .channel(`client-alerts-${clientUserId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'alerta',
        filter: `id_usuario=eq.${clientUserId}`
      }, async () => {
        await Promise.all([
          loadClientNotifications(),
          loadAppointments()
        ])
      })
      .subscribe()
  }

  /*
   * Se cargan los datos reales correspondientes
   * al cliente autenticado.
   */
  await Promise.all([
    loadClientVehicles(),
    loadClientNotifications(),
    loadTransmissionRecords(),
    loadAppointments()
  ])

  await loadClientServiceHistory()
  resetTransmissionForm()
})


/* ============================================================
   UNMOUNT
============================================================ */

onBeforeUnmount(() => {
  unlockDashboardScroll()

  restoreMobileThemeColor()


  if (clockInterval) {
    clearInterval(
      clockInterval
    )
  }

  if (clientAlertChannel) {
    supabase.removeChannel(clientAlertChannel)
    clientAlertChannel = null
  }

  document.removeEventListener(
    'pointerdown',
    handleGlobalClick
  )
})
</script>

<style scoped src="../styles/clientDashboard.css"></style>

<style scoped>
/* ============================================================
   DROPDOWN DE NOTIFICACIONES — CLIENTE
   Adaptado a modo claro y oscuro
============================================================ */

.amc-alerts-wrapper {
  position: relative;
}

.amc-notifications-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 360px;
  max-width: calc(100vw - 24px);
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 18px;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.18), 0 8px 18px rgba(15, 23, 42, 0.08);
  z-index: 200;
  overflow: hidden;
}

.dark-mode .amc-notifications-dropdown {
  background: #101720;
  border-color: rgba(148, 163, 184, 0.24);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55), 0 6px 20px rgba(0, 0, 0, 0.3);
}

.amc-notifications-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);
  background: #f8fafc;
}

.dark-mode .amc-notifications-header {
  background: #111827;
  border-bottom-color: rgba(148, 163, 184, 0.2);
}

.amc-notifications-header > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.amc-notifications-header strong {
  font-size: 14px;
  color: var(--client-text, #172033);
}

.amc-notifications-header span {
  font-size: 12px;
  color: var(--client-text-soft, #64748b);
}

.amc-mark-all-read {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  color: var(--client-primary, #2563eb);
  font-size: 16px;
}

.dark-mode .amc-mark-all-read {
  color: #60a5fa;
}

.amc-mark-all-read:hover {
  background: rgba(37, 99, 235, 0.08);
}

.dark-mode .amc-mark-all-read:hover {
  background: rgba(148, 163, 184, 0.14);
}

.amc-notifications-loading,
.amc-notifications-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  text-align: center;
  color: var(--client-text-soft, #64748b);
  font-size: 13px;
}

.dark-mode .amc-notifications-loading,
.dark-mode .amc-notifications-empty {
  color: #cbd5e1;
}

.amc-notifications-empty i {
  font-size: 28px;
  opacity: 0.5;
}

.amc-notifications-list {
  max-height: 340px;
  overflow-y: auto;
  padding: 8px;
  background: #ffffff;
}

.dark-mode .amc-notifications-list {
  background: #101720;
}

.amc-notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 8px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 12px;
  background: #f8fafc;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.dark-mode .amc-notification-item {
  background: rgba(15, 23, 42, 0.75);
  border-color: rgba(148, 163, 184, 0.18);
}

.amc-notification-item:last-child {
  margin-bottom: 0;
}

.amc-notification-item:hover {
  background: #eef5ff;
  border-color: rgba(37, 99, 235, 0.26);
}

.dark-mode .amc-notification-item:hover {
  background: rgba(148, 163, 184, 0.08);
  border-color: rgba(148, 163, 184, 0.18);
}

.amc-notification-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
}

.amc-notification-item.danger .amc-notification-icon {
  background: rgba(239, 68, 68, 0.14);
  color: #ef4444;
}

.amc-notification-item.warning .amc-notification-icon {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.amc-notification-item.info .amc-notification-icon {
  background: rgba(59, 130, 246, 0.14);
  color: #3b82f6;
}

.amc-notification-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.amc-notification-body strong {
  font-size: 13px;
  text-transform: capitalize;
  color: var(--client-text, #172033);
}

.amc-notification-body p {
  margin: 0;
  font-size: 12px;
  color: var(--client-text-soft, #64748b);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.amc-notification-body small {
  font-size: 11px;
  color: var(--client-text-soft, #64748b);
  margin-top: 4px;
}

.amc-notifications-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 13px 12px 14px;
  background: #f8fafc;
  border: none;
  border-top: 1px solid rgba(148, 163, 184, 0.24);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--client-primary, #2563eb);
}

.dark-mode .amc-notifications-footer {
  background: #111827;
  border-top-color: rgba(148, 163, 184, 0.2);
  color: #60a5fa;
}

.amc-notifications-footer:hover {
  background: rgba(37, 99, 235, 0.06);
}

.dark-mode .amc-notifications-footer:hover {
  background: rgba(148, 163, 184, 0.1);
}

.amc-client-service-history {
  margin-top: 24px;
  padding: 22px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 18px;
  background: var(--client-card, #ffffff);
}

.dark-mode .amc-client-service-history {
  background: #101720;
  border-color: rgba(148, 163, 184, 0.2);
}

.amc-client-service-history-heading,
.amc-client-service-history-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.amc-client-service-history-heading > div {
  display: grid;
  gap: 4px;
}

.amc-client-service-history-heading > div > span {
  color: var(--client-primary, #2563eb);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.amc-client-service-history-heading h3 {
  margin: 0;
  color: var(--client-text, #172033);
  font-size: 19px;
}

.amc-client-service-history-heading p,
.amc-client-service-history-summary p {
  margin: 0;
  color: var(--client-text-soft, #64748b);
  font-size: 13px;
}

.amc-client-service-history-heading > i {
  color: var(--client-primary, #2563eb);
  font-size: 24px;
}

.amc-client-service-history-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.amc-client-service-history-item {
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 14px;
}

.amc-client-service-history-summary > div {
  display: grid;
  gap: 5px;
}

.amc-client-service-history-summary strong {
  color: var(--client-text, #172033);
  font-size: 14px;
}

.amc-client-service-history-summary span,
.amc-client-service-detail-group span {
  color: var(--client-text-soft, #64748b);
  font-size: 12px;
}

.amc-client-service-history-summary p {
  margin-top: 3px;
}

.amc-client-service-detail-button {
  flex: 0 0 auto;
  padding: 8px 12px;
  border: 1px solid rgba(37, 99, 235, 0.24);
  border-radius: 9px;
  background: rgba(37, 99, 235, 0.06);
  color: var(--client-primary, #2563eb);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.amc-client-service-detail-button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.amc-client-service-detail {
  display: grid;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.amc-client-service-detail-group {
  display: grid;
  gap: 5px;
}

.amc-client-service-detail-group strong {
  color: var(--client-text, #172033);
  font-size: 12px;
}

.amc-client-service-detail-empty {
  margin: 0;
  color: var(--client-text-soft, #64748b);
  font-size: 12px;
}

.amc-client-service-history-state,
.amc-client-service-history-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 24px 12px;
  color: var(--client-text-soft, #64748b);
  font-size: 13px;
}

.amc-client-service-history-error {
  justify-content: flex-start;
  color: #b91c1c;
}

.dark-mode .amc-client-service-history-item {
  border-color: rgba(148, 163, 184, 0.2);
}

.dark-mode .amc-client-service-detail-button {
  border-color: rgba(96, 165, 250, 0.28);
  background: rgba(96, 165, 250, 0.1);
  color: #93c5fd;
}

@media (max-width: 768px) {
  .amc-alerts-wrapper {
    position: static;
  }

  .amc-notifications-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: max(12px, env(safe-area-inset-right, 0px));
    left: max(12px, env(safe-area-inset-left, 0px));
    width: auto;
    max-width: none;
  }

  .amc-client-service-history {
    padding: 16px;
  }

  .amc-client-service-history-summary {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>