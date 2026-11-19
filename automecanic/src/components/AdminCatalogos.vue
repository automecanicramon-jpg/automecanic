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
         HEADER
    ======================================================= -->

    <div class="page-toolbar">
      <div>
        <h2>
          Catálogos
        </h2>

        <p>
          Administra los catálogos utilizados
          por el sistema de mantenimiento.
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
         TABS
    ======================================================= -->

    <div class="catalog-tabs">
      <button
        class="catalog-tab"
        :class="{
          active:
            activeCatalog === 'tipos'
        }"
        type="button"
        @click="
          activeCatalog = 'tipos'
        "
      >
        <i class="bi bi-droplet-half"></i>

        Tipos de aceite
      </button>


      <button
        class="catalog-tab"
        :class="{
          active:
            activeCatalog === 'marcas'
        }"
        type="button"
        @click="
          activeCatalog = 'marcas'
        "
      >
        <i class="bi bi-tag"></i>

        Marcas de aceite
      </button>


      <button
        class="catalog-tab"
        :class="{
          active:
            activeCatalog === 'llantas'
        }"
        type="button"
        @click="
          activeCatalog = 'llantas'
        "
      >
        <i class="bi bi-circle"></i>

        Posiciones de llantas
      </button>
    </div>


    <!-- ======================================================
         TIPOS DE ACEITE
    ======================================================= -->

    <section
      v-if="activeCatalog === 'tipos'"
      class="section-card"
    >
      <div class="catalog-section-header">
        <div>
          <h3>
            Tipos de aceite
          </h3>

          <p>
            Registra los tipos o viscosidades
            utilizadas durante el servicio.
          </p>
        </div>
      </div>


      <div class="catalog-layout">
        <!-- FORMULARIO -->

        <aside class="catalog-form-card">
          <div class="catalog-form-icon blue">
            <i class="bi bi-droplet-half"></i>
          </div>

          <h4>
            Nuevo tipo de aceite
          </h4>

          <p>
            Ejemplos: 5W-30, 10W-40,
            15W-40 sintético.
          </p>


          <div class="form-group">
            <label for="tipo-aceite-nombre">
              Nombre
            </label>

            <input
              id="tipo-aceite-nombre"
              v-model="tipoAceiteForm.nombre"
              type="text"
              maxlength="100"
              placeholder="Ej. 5W-30"
              @keyup.enter="
                requestInsertTipoAceite
              "
            />
          </div>


          <div class="catalog-form-actions">
            <button
              class="secondary-button"
              type="button"
              @click="
                tipoAceiteForm.nombre = ''
              "
            >
              Limpiar
            </button>


            <button
              class="primary-button"
              type="button"
              :disabled="processing"
              @click="
                requestInsertTipoAceite
              "
            >
              <i class="bi bi-plus-lg"></i>

              Insertar
            </button>
          </div>
        </aside>


        <!-- TABLA -->

        <div class="catalog-table-card">
          <div class="catalog-table-heading">
            <div>
              <strong>
                Tipos registrados
              </strong>

              <span>
                {{ tiposAceite.length }} registros
              </span>
            </div>
          </div>


          <div
            v-if="loading"
            class="component-loading"
          >
            <div class="app-spinner"></div>

            <span>
              Cargando catálogo...
            </span>
          </div>


          <div
            v-else-if="tiposAceite.length"
            class="table-wrapper"
          >
            <table class="data-table">
              <thead>
                <tr>
                  <th>
                    No.
                  </th>

                  <th>
                    Nombre
                  </th>

                  <th class="actions-column">
                    Acciones
                  </th>
                </tr>
              </thead>


              <tbody>
                <tr
                  v-for="(
                    item,
                    index
                  ) in tiposAceite"
                  :key="
                    item.id_tipo_aceite
                  "
                >
                  <td>
                    {{
                      index + 1
                    }}
                  </td>


                  <td>
                    <div class="catalog-name-cell">
                      <i class="bi bi-droplet"></i>

                      <strong>
                        {{ item.nombre }}
                      </strong>
                    </div>
                  </td>


                  <td>
                    <div class="table-actions">
                      <button
                        class="table-action-button delete"
                        type="button"
                        title="Eliminar"
                        @click="
                          requestDeleteTipoAceite(
                            item
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


          <div
            v-else
            class="catalog-empty"
          >
            <i class="bi bi-droplet"></i>

            <span>
              No hay tipos de aceite registrados.
            </span>
          </div>
        </div>
      </div>
    </section>


    <!-- ======================================================
         MARCAS DE ACEITE
    ======================================================= -->

    <section
      v-else-if="activeCatalog === 'marcas'"
      class="section-card"
    >
      <div class="catalog-section-header">
        <div>
          <h3>
            Marcas de aceite
          </h3>

          <p>
            Catálogo de fabricantes y marcas
            utilizadas por el taller.
          </p>
        </div>
      </div>


      <div class="catalog-layout">
        <aside class="catalog-form-card">
          <div class="catalog-form-icon orange">
            <i class="bi bi-tag-fill"></i>
          </div>

          <h4>
            Nueva marca
          </h4>

          <p>
            Ejemplos: Mobil, Castrol,
            Shell, Akron.
          </p>


          <div class="form-group">
            <label for="marca-aceite-nombre">
              Nombre
            </label>

            <input
              id="marca-aceite-nombre"
              v-model="marcaAceiteForm.nombre"
              type="text"
              maxlength="100"
              placeholder="Ej. Castrol"
              @keyup.enter="
                requestInsertMarcaAceite
              "
            />
          </div>


          <div class="catalog-form-actions">
            <button
              class="secondary-button"
              type="button"
              @click="
                marcaAceiteForm.nombre = ''
              "
            >
              Limpiar
            </button>


            <button
              class="primary-button"
              type="button"
              :disabled="processing"
              @click="
                requestInsertMarcaAceite
              "
            >
              <i class="bi bi-plus-lg"></i>

              Insertar
            </button>
          </div>
        </aside>


        <div class="catalog-table-card">
          <div class="catalog-table-heading">
            <div>
              <strong>
                Marcas registradas
              </strong>

              <span>
                {{ marcasAceite.length }} registros
              </span>
            </div>
          </div>


          <div
            v-if="loading"
            class="component-loading"
          >
            <div class="app-spinner"></div>

            <span>
              Cargando catálogo...
            </span>
          </div>


          <div
            v-else-if="marcasAceite.length"
            class="table-wrapper"
          >
            <table class="data-table">
              <thead>
                <tr>
                  <th>
                    No.
                  </th>

                  <th>
                    Nombre
                  </th>

                  <th class="actions-column">
                    Acciones
                  </th>
                </tr>
              </thead>


              <tbody>
                <tr
                  v-for="(
                    item,
                    index
                  ) in marcasAceite"
                  :key="
                    item.id_marca_aceite
                  "
                >
                  <td>
                    {{
                      index + 1
                    }}
                  </td>


                  <td>
                    <div class="catalog-name-cell">
                      <i class="bi bi-tag"></i>

                      <strong>
                        {{ item.nombre }}
                      </strong>
                    </div>
                  </td>


                  <td>
                    <div class="table-actions">
                      <button
                        class="table-action-button delete"
                        type="button"
                        title="Eliminar"
                        @click="
                          requestDeleteMarcaAceite(
                            item
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


          <div
            v-else
            class="catalog-empty"
          >
            <i class="bi bi-tag"></i>

            <span>
              No hay marcas registradas.
            </span>
          </div>
        </div>
      </div>
    </section>


    <!-- ======================================================
         POSICIONES DE LLANTA
    ======================================================= -->

    <section
      v-else
      class="section-card"
    >
      <div class="catalog-section-header">
        <div>
          <h3>
            Posiciones de llantas
          </h3>

          <p>
            Configura las posiciones disponibles
            según el tipo de vehículo.
          </p>
        </div>
      </div>


      <!-- TIPO VEHÍCULO -->

      <div class="tire-catalog-vehicle-selector">
        <div class="form-group">
          <label>
            Tipo de vehículo
          </label>

          <select
            v-model="
              llantaForm.tipo_unidad
            "
            @change="
              handleVehicleTypeChange
            "
          >
            <option value="">
              Selecciona un tipo
            </option>

            <option
              v-for="tipo in tiposVehiculo"
              :key="tipo.value"
              :value="tipo.value"
            >
              {{ tipo.label }}
            </option>
          </select>
        </div>
      </div>


      <div class="tire-catalog-layout">
        <!-- FORM -->

        <aside class="catalog-form-card tire-position-form">
          <div class="catalog-form-icon green">
            <i class="bi bi-circle-fill"></i>
          </div>


          <h4>
            Nueva posición
          </h4>

          <p>
            La posición estará disponible durante
            las inspecciones del tipo de unidad seleccionado.
          </p>


          <div class="form-group">
            <label>
              Número de llanta
            </label>

            <input
              v-model="
                llantaForm.numero_llanta
              "
              type="number"
              min="1"
              step="1"
              placeholder="1"
            />
          </div>


          <div class="form-group">
            <label>
              Posición
            </label>

            <input
              v-model="
                llantaForm.posicion
              "
              type="text"
              maxlength="100"
              placeholder="Ej. Delantera izquierda"
            />
          </div>


          <!-- SUGERENCIAS -->

          <div class="tire-position-suggestions">
            <span>
              Sugerencias
            </span>


            <div>
              <button
                v-for="sugerencia in posicionesSugeridas"
                :key="sugerencia"
                type="button"
                @click="
                  llantaForm.posicion =
                    sugerencia
                "
              >
                {{ sugerencia }}
              </button>
            </div>
          </div>


          <div class="catalog-form-actions">
            <button
              class="secondary-button"
              type="button"
              @click="
                clearTireForm
              "
            >
              Limpiar
            </button>


            <button
              class="primary-button"
              type="button"
              :disabled="
                processing ||
                !llantaForm.tipo_unidad
              "
              @click="
                requestInsertPosition
              "
            >
              <i class="bi bi-plus-lg"></i>

              Insertar
            </button>
          </div>
        </aside>


        <!-- VEHÍCULO -->

        <div class="tire-catalog-visual">
          <div class="tire-catalog-visual-heading">
            <span>
              VISTA DEL VEHÍCULO
            </span>

            <h4>
              {{
                llantaForm.tipo_unidad ||
                'Selecciona un tipo'
              }}
            </h4>

            <p>
              {{
                posicionesLlanta.length
              }}
              posiciones configuradas
            </p>
          </div>


          <div class="catalog-vehicle-map">
            <span class="catalog-front-label">
              FRENTE
            </span>


            <div class="catalog-tire-buttons">
              <div
                v-for="position in posicionesLlanta"
                :key="position.id_tipo"
                class="catalog-tire-position"
              >
                <span>
                  {{
                    position.numero_llanta
                  }}
                </span>

                <i class="bi bi-circle-fill"></i>

                <small>
                  {{ position.posicion }}
                </small>
              </div>
            </div>


            <div
              class="catalog-vehicle-body"
              :class="
                getPreviewClass(
                  llantaForm.tipo_unidad
                )
              "
            >
              <i
                :class="
                  getVehicleIcon(
                    llantaForm.tipo_unidad
                  )
                "
              ></i>

              <strong>
                {{
                  llantaForm.tipo_unidad ||
                  'Vehículo'
                }}
              </strong>
            </div>


            <span class="catalog-rear-label">
              PARTE TRASERA
            </span>
          </div>
        </div>


        <!-- TABLA -->

        <div class="catalog-table-card tire-position-table-card">
          <div class="catalog-table-heading">
            <div>
              <strong>
                Posiciones
              </strong>

              <span>
                {{
                  llantaForm.tipo_unidad ||
                  'Sin tipo seleccionado'
                }}
              </span>
            </div>
          </div>


          <div
            v-if="loadingPositions"
            class="component-loading"
          >
            <div class="app-spinner"></div>

            <span>
              Cargando posiciones...
            </span>
          </div>


          <div
            v-else-if="
              posicionesLlanta.length
            "
            class="table-wrapper"
          >
            <table class="data-table">
              <thead>
                <tr>
                  <th>
                    No.
                  </th>

                  <th>
                    Posición
                  </th>

                  <th class="actions-column">
                    Acciones
                  </th>
                </tr>
              </thead>


              <tbody>
                <tr
                  v-for="position in posicionesLlanta"
                  :key="position.id_tipo"
                >
                  <td>
                    <span class="tire-number-badge">
                      {{
                        position.numero_llanta ||
                        '—'
                      }}
                    </span>
                  </td>


                  <td>
                    <strong>
                      {{ position.posicion }}
                    </strong>
                  </td>


                  <td>
                    <div class="table-actions">
                      <button
                        class="table-action-button delete"
                        type="button"
                        title="Eliminar posición"
                        @click="
                          requestDeletePosition(
                            position
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


          <div
            v-else
            class="catalog-empty"
          >
            <i class="bi bi-circle"></i>

            <span>
              {{
                llantaForm.tipo_unidad
                  ? 'No hay posiciones configuradas.'
                  : 'Selecciona un tipo de vehículo.'
              }}
            </span>
          </div>
        </div>
      </div>
    </section>


    <!-- ======================================================
         CONFIRMACIÓN
    ======================================================= -->

    <div
      v-if="confirmation.visible"
      class="modal-overlay"
      @click.self="
        !processing &&
        closeConfirmation()
      "
    >
      <div class="confirmation-modal">
        <div
          class="confirmation-icon"
          :class="
            confirmation.type
          "
        >
          <i
            :class="
              confirmationIcon
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
          class="catalog-confirmation-item"
        >
          <i
            :class="
              confirmationItemIcon
            "
          ></i>

          <div>
            <strong>
              {{
                confirmationItemTitle
              }}
            </strong>

            <span>
              {{
                confirmationItemSubtitle
              }}
            </span>
          </div>
        </div>


        <div class="confirmation-actions">
          <button
            class="secondary-button"
            type="button"
            :disabled="processing"
            @click="
              closeConfirmation
            "
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
            :disabled="processing"
            @click="
              executeConfirmation
            "
          >
            <i
              v-if="processing"
              class="bi bi-arrow-repeat spin"
            ></i>

            <i
              v-else
              :class="
                confirmation.type === 'delete'
                  ? 'bi bi-trash3'
                  : 'bi bi-check2-circle'
              "
            ></i>


            {{
              processing
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
  ref
} from 'vue'

import {
  agregarMarcaAceite,
  agregarPosicionLlanta,
  agregarTipoAceite,
  eliminarMarcaAceite,
  eliminarPosicionLlanta,
  eliminarTipoAceite,
  obtenerMarcasAceite,
  obtenerPosicionesLlantaCatalogo,
  obtenerSiguienteNumeroLlanta,
  obtenerTiposAceite
} from '../services/catalogoService.js'


/* ============================================================
   ESTADO
============================================================ */

const activeCatalog =
  ref('tipos')

const tiposAceite =
  ref([])

const marcasAceite =
  ref([])

const posicionesLlanta =
  ref([])

const loading =
  ref(false)

const loadingPositions =
  ref(false)

const processing =
  ref(false)

const successMessage =
  ref('')

const errorMessage =
  ref('')


/* ============================================================
   FORMULARIOS
============================================================ */

const tipoAceiteForm =
  ref({
    nombre: ''
  })


const marcaAceiteForm =
  ref({
    nombre: ''
  })


const llantaForm =
  ref({
    tipo_unidad: '',
    numero_llanta: 1,
    posicion: ''
  })


/* ============================================================
   TIPOS VEHÍCULO
============================================================ */

const tiposVehiculo = [
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


const posicionesSugeridas = [
  'Delantera izquierda',
  'Delantera derecha',
  'Trasera izquierda',
  'Trasera derecha',
  'Intermedia izquierda',
  'Intermedia derecha',
  'Trasera interior izquierda',
  'Trasera interior derecha',
  'Refacción'
]


/* ============================================================
   CONFIRMACIÓN
============================================================ */

const confirmation =
  ref({
    visible: false,
    type: '',
    action: '',
    title: '',
    message: '',
    confirmText: '',
    item: null
  })


/* ============================================================
   CONFIRMATION COMPUTED
============================================================ */

const confirmationIcon =
  computed(() => {
    return (
      confirmation.value.type ===
      'delete'
        ? 'bi bi-trash3-fill'
        : 'bi bi-question-lg'
    )
  })


const confirmationItemIcon =
  computed(() => {
    switch (
      confirmation.value.action
    ) {
      case 'insertTipo':
      case 'deleteTipo':

        return 'bi bi-droplet-fill'


      case 'insertMarca':
      case 'deleteMarca':

        return 'bi bi-tag-fill'


      default:

        return 'bi bi-circle-fill'
    }
  })


const confirmationItemTitle =
  computed(() => {
    const item =
      confirmation.value.item


    if (!item) {
      return ''
    }


    return (
      item.nombre ||
      item.posicion ||
      ''
    )
  })


const confirmationItemSubtitle =
  computed(() => {
    const item =
      confirmation.value.item


    if (!item) {
      return ''
    }


    if (
      confirmation.value.action ===
        'insertPosition' ||
      confirmation.value.action ===
        'deletePosition'
    ) {
      return (
        `${item.tipo_unidad || ''}` +
        (
          item.numero_llanta
            ? ` · Llanta ${item.numero_llanta}`
            : ''
        )
      )
    }


    return 'Catálogo'
  })


/* ============================================================
   CARGAR
============================================================ */

const loadAll = async () => {
  loading.value =
    true

  errorMessage.value =
    ''


  try {
    const [
      tiposData,
      marcasData
    ] = await Promise.all([
      obtenerTiposAceite(),
      obtenerMarcasAceite()
    ])


    tiposAceite.value =
      tiposData

    marcasAceite.value =
      marcasData


    if (
      llantaForm.value.tipo_unidad
    ) {
      await loadPositions()
    }
  } catch (error) {
    console.error(
      'Error cargando catálogos:',
      error
    )


    errorMessage.value =
      getErrorMessage(
        error,
        'No fue posible cargar los catálogos.'
      )
  } finally {
    loading.value =
      false
  }
}


/* ============================================================
   TIPO ACEITE - INSERT
============================================================ */

const requestInsertTipoAceite = () => {
  const nombre =
    tipoAceiteForm.value.nombre.trim()


  if (!nombre) {
    errorMessage.value =
      'Ingresa el nombre del tipo de aceite.'

    return
  }


  confirmation.value = {
    visible: true,
    type: 'insert',
    action: 'insertTipo',
    title:
      '¿Insertar tipo de aceite?',
    message:
      'Se agregará este nuevo registro al catálogo de tipos de aceite.',
    confirmText:
      'Sí, insertar',
    item: {
      nombre
    }
  }
}


const insertTipoAceite = async () => {
  await agregarTipoAceite(
    confirmation.value.item.nombre
  )


  tipoAceiteForm.value.nombre =
    ''


  successMessage.value =
    'El tipo de aceite fue registrado correctamente.'


  tiposAceite.value =
    await obtenerTiposAceite()
}


/* ============================================================
   TIPO ACEITE - DELETE
============================================================ */

const requestDeleteTipoAceite = item => {
  confirmation.value = {
    visible: true,
    type: 'delete',
    action: 'deleteTipo',
    title:
      '¿Eliminar tipo de aceite?',
    message:
      'El registro se eliminará del catálogo. Si ya está relacionado con servicios, la operación será bloqueada.',
    confirmText:
      'Sí, eliminar',
    item
  }
}


const deleteTipoAceite = async () => {
  await eliminarTipoAceite(
    confirmation.value
      .item
      .id_tipo_aceite
  )


  successMessage.value =
    'El tipo de aceite fue eliminado correctamente.'


  tiposAceite.value =
    await obtenerTiposAceite()
}


/* ============================================================
   MARCAS - INSERT
============================================================ */

const requestInsertMarcaAceite = () => {
  const nombre =
    marcaAceiteForm.value.nombre.trim()


  if (!nombre) {
    errorMessage.value =
      'Ingresa el nombre de la marca.'

    return
  }


  confirmation.value = {
    visible: true,
    type: 'insert',
    action: 'insertMarca',
    title:
      '¿Insertar marca de aceite?',
    message:
      'Se agregará la marca al catálogo utilizado en los servicios.',
    confirmText:
      'Sí, insertar',
    item: {
      nombre
    }
  }
}


const insertMarcaAceite = async () => {
  await agregarMarcaAceite(
    confirmation.value.item.nombre
  )


  marcaAceiteForm.value.nombre =
    ''


  successMessage.value =
    'La marca de aceite fue registrada correctamente.'


  marcasAceite.value =
    await obtenerMarcasAceite()
}


/* ============================================================
   MARCAS - DELETE
============================================================ */

const requestDeleteMarcaAceite = item => {
  confirmation.value = {
    visible: true,
    type: 'delete',
    action: 'deleteMarca',
    title:
      '¿Eliminar marca de aceite?',
    message:
      'La marca será eliminada permanentemente del catálogo.',
    confirmText:
      'Sí, eliminar',
    item
  }
}


const deleteMarcaAceite = async () => {
  await eliminarMarcaAceite(
    confirmation.value
      .item
      .id_marca_aceite
  )


  successMessage.value =
    'La marca de aceite fue eliminada correctamente.'


  marcasAceite.value =
    await obtenerMarcasAceite()
}


/* ============================================================
   POSICIONES
============================================================ */

const handleVehicleTypeChange = async () => {
  posicionesLlanta.value =
    []

  llantaForm.value.posicion =
    ''


  if (
    !llantaForm.value.tipo_unidad
  ) {
    llantaForm.value.numero_llanta =
      1

    return
  }


  await loadPositions()


  llantaForm.value.numero_llanta =
    await obtenerSiguienteNumeroLlanta(
      llantaForm.value.tipo_unidad
    )
}


/* ============================================================
   LOAD POSITIONS
============================================================ */

const loadPositions = async () => {
  if (
    !llantaForm.value.tipo_unidad
  ) {
    posicionesLlanta.value =
      []

    return
  }


  loadingPositions.value =
    true


  try {
    posicionesLlanta.value =
      await obtenerPosicionesLlantaCatalogo(
        llantaForm.value.tipo_unidad
      )
  } catch (error) {
    console.error(
      'Error cargando posiciones:',
      error
    )


    errorMessage.value =
      getErrorMessage(
        error,
        'No fue posible cargar las posiciones.'
      )
  } finally {
    loadingPositions.value =
      false
  }
}


/* ============================================================
   INSERT POSITION
============================================================ */

const requestInsertPosition = () => {
  if (
    !llantaForm.value.tipo_unidad
  ) {
    errorMessage.value =
      'Selecciona un tipo de vehículo.'

    return
  }


  if (
    !llantaForm.value.posicion.trim()
  ) {
    errorMessage.value =
      'Ingresa la posición de la llanta.'

    return
  }


  if (
    !llantaForm.value.numero_llanta ||
    Number(
      llantaForm.value.numero_llanta
    ) <= 0
  ) {
    errorMessage.value =
      'Ingresa un número de llanta válido.'

    return
  }


  confirmation.value = {
    visible: true,
    type: 'insert',
    action: 'insertPosition',
    title:
      '¿Insertar posición?',
    message:
      'La nueva posición estará disponible durante la inspección de llantas.',
    confirmText:
      'Sí, insertar',
    item: {
      tipo_unidad:
        llantaForm.value.tipo_unidad,

      numero_llanta:
        Number(
          llantaForm.value.numero_llanta
        ),

      posicion:
        llantaForm.value.posicion.trim()
    }
  }
}


const insertPosition = async () => {
  await agregarPosicionLlanta(
    confirmation.value.item
  )


  successMessage.value =
    'La posición de llanta fue registrada correctamente.'


  llantaForm.value.posicion =
    ''


  await loadPositions()


  llantaForm.value.numero_llanta =
    await obtenerSiguienteNumeroLlanta(
      llantaForm.value.tipo_unidad
    )
}


/* ============================================================
   DELETE POSITION
============================================================ */

const requestDeletePosition = item => {
  confirmation.value = {
    visible: true,
    type: 'delete',
    action: 'deletePosition',
    title:
      '¿Eliminar posición de llanta?',
    message:
      'Esta posición dejará de estar disponible para nuevas inspecciones. Si ya tiene inspecciones asociadas, la eliminación será bloqueada.',
    confirmText:
      'Sí, eliminar',
    item
  }
}


const deletePosition = async () => {
  await eliminarPosicionLlanta(
    confirmation.value
      .item
      .id_tipo
  )


  successMessage.value =
    'La posición fue eliminada correctamente.'


  await loadPositions()


  llantaForm.value.numero_llanta =
    await obtenerSiguienteNumeroLlanta(
      llantaForm.value.tipo_unidad
    )
}


/* ============================================================
   LIMPIAR
============================================================ */

const clearTireForm = async () => {
  llantaForm.value.posicion =
    ''


  if (
    llantaForm.value.tipo_unidad
  ) {
    llantaForm.value.numero_llanta =
      await obtenerSiguienteNumeroLlanta(
        llantaForm.value.tipo_unidad
      )
  } else {
    llantaForm.value.numero_llanta =
      1
  }
}


/* ============================================================
   EJECUTAR CONFIRMACIÓN
============================================================ */

const executeConfirmation = async () => {
  if (processing.value) {
    return
  }

  processing.value = true

  errorMessage.value = ''
  successMessage.value = ''

  try {
    switch (
      confirmation.value.action
    ) {
      case 'insertTipo':
        await insertTipoAceite()
        break

      case 'deleteTipo':
        await deleteTipoAceite()
        break

      case 'insertMarca':
        await insertMarcaAceite()
        break

      case 'deleteMarca':
        await deleteMarcaAceite()
        break

      case 'insertPosition':
        await insertPosition()
        break

      case 'deletePosition':
        await deletePosition()
        break

      default:
        return
    }

    /*
     * Primero terminamos el estado de procesamiento
     * para permitir que closeConfirmation()
     * pueda cerrar correctamente el modal.
     */
    processing.value = false

    closeConfirmation()

    clearSuccessLater()
  } catch (error) {
    console.error(
      'Error en catálogo:',
      error
    )

    errorMessage.value =
      getErrorMessage(
        error,
        'No fue posible realizar la operación.'
      )

    /*
     * También liberamos processing antes de
     * intentar cerrar el modal cuando ocurre un error.
     */
    processing.value = false

    closeConfirmation()
  } finally {
    processing.value = false
  }
}

/* ============================================================
   CERRAR CONFIRMACIÓN
============================================================ */

const closeConfirmation = () => {
  if (processing.value) {
    return
  }


  confirmation.value = {
    visible: false,
    type: '',
    action: '',
    title: '',
    message: '',
    confirmText: '',
    item: null
  }
}


/* ============================================================
   ICONOS VEHÍCULO
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
    error?.code === '23505'
  ) {
    return 'Ya existe un registro con esa información.'
  }


  if (
    error?.code === '23503'
  ) {
    return 'No se puede eliminar el registro porque tiene información relacionada.'
  }


  return (
    message ||
    fallback
  )
}


/* ============================================================
   SUCCESS
============================================================ */

const clearSuccessLater = () => {
  setTimeout(
    () => {
      successMessage.value =
        ''
    },
    3500
  )
}


/* ============================================================
   MOUNT
============================================================ */

onMounted(() => {
  loadAll()
})
</script>