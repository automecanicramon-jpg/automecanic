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

        <h2>Personal</h2>

        <p>

          Administra el personal mecánico registrado

          en el sistema.

        </p>

      </div>

      <div class="page-toolbar-actions">

        <button

          class="outline-button"

          type="button"

          :disabled="loading"

          @click="loadPersonal"

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

          Registrar personal

        </button>

      </div>

    </div>



    <!-- ======================================================

         RESUMEN

    ======================================================= -->

    <div class="mini-stats-grid">

      <article class="mini-stat-card">

        <div class="mini-stat-icon blue">

          <i class="bi bi-people-fill"></i>

        </div>

        <div>

          <span>Total</span>

          <strong>

            {{ personal.length }}

          </strong>

        </div>

      </article>



      <article class="mini-stat-card">

        <div class="mini-stat-icon green">

          <i class="bi bi-person-check-fill"></i>

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

          <i class="bi bi-person-dash-fill"></i>

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

         TABLA

    ======================================================= -->

    <section class="section-card">

      <!-- FILTROS -->

      <div class="filters-row">

        <div class="search-box">

          <i class="bi bi-search"></i>

          <input

            v-model="search"

            type="text"

            placeholder="Buscar por nombre, correo, teléfono o especialidad..."

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



      <!-- LOADING -->

      <div

        v-if="loading"

        class="component-loading"

      >

        <div class="app-spinner"></div>

        <span>

          Cargando personal...

        </span>

      </div>



      <!-- TABLA -->

      <div

        v-else-if="filteredPersonal.length"

        class="table-wrapper"

      >

        <table class="data-table personal-table">

          <thead>

            <tr>

              <th>Personal</th>

              <th>Contacto</th>

              <th>Especialidad</th>

              <th>Estado</th>

              <th>Registro</th>

              <th class="actions-column">

                Acciones

              </th>

            </tr>

          </thead>

          <tbody>

            <tr

              v-for="item in filteredPersonal"

              :key="item.id_mecanico"

            >

              <!-- PERSONAL -->

              <td>

                <div class="person-table-cell">

                  <div class="person-avatar">

                    {{ getInitials(item) }}

                  </div>

                  <div>

                    <strong>

                      {{ getFullName(item) }}

                    </strong>

                    <small>

                      Mecánico #{{ item.id_mecanico }}

                    </small>

                  </div>

                </div>

              </td>



              <!-- CONTACTO -->

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



              <!-- ESPECIALIDAD -->

              <td>

                <span class="specialty-badge">

                  <i class="bi bi-wrench-adjustable"></i>

                  {{

                    item.especialidad ||

                    'No especificada'

                  }}

                </span>

              </td>



              <!-- ESTADO -->

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

                  @click="

                    requestStatusChange(item)

                  "

                >

                  <span class="status-dot"></span>

                  {{

                    item.usuario?.estatus ||

                    'Activo'

                  }}

                </button>

              </td>



              <!-- FECHA -->

              <td>

                {{

                  formatDate(

                    item.usuario?.fecha_registro

                  )

                }}

              </td>



              <!-- ACCIONES -->

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

                    :disabled="
                      checkingDeleteId ===
                      item.id_mecanico
                    "

                    @click="requestDelete(item)"

                  >

                    <i

                      class="bi"

                      :class="
                        checkingDeleteId ===
                        item.id_mecanico
                          ? 'bi-arrow-repeat spin'
                          : 'bi-trash3'
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

        <i class="bi bi-people"></i>

        <h4>

          {{

            personal.length

              ? 'No se encontraron resultados'

              : 'No hay personal registrado'

          }}

        </h4>

        <p>

          {{

            personal.length

              ? 'Prueba modificando los filtros de búsqueda.'

              : 'Registra al primer mecánico para comenzar.'

          }}

        </p>

        <button

          v-if="!personal.length"

          class="primary-button"

          type="button"

          @click="openNewModal"

        >

          <i class="bi bi-plus-lg"></i>

          Registrar personal

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

        <!-- HEADER -->

        <div class="modal-header">

          <div>

            <h3>

              {{

                editing

                  ? 'Actualizar personal'

                  : 'Registrar personal'

              }}

            </h3>

            <p>

              {{

                editing

                  ? 'Modifica la información del mecánico seleccionado.'

                  : 'Ingresa la información del nuevo mecánico.'

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



        <!-- BODY -->

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

                Datos generales del mecánico

              </span>

            </div>

          </div>



          <div class="form-grid">

            <!-- NOMBRE -->

            <div class="form-group">

              <label for="personal-nombre">

                Nombre

                <span class="required">*</span>

              </label>

              <input

                id="personal-nombre"

                v-model="form.nombre"

                type="text"

                maxlength="100"

                placeholder="Nombre"

                required

              />

            </div>



            <!-- PATERNO -->

            <div class="form-group">

              <label for="personal-paterno">

                Apellido paterno

                <span class="required">*</span>

              </label>

              <input

                id="personal-paterno"

                v-model="form.apellido_paterno"

                type="text"

                maxlength="100"

                placeholder="Apellido paterno"

                required

              />

            </div>



            <!-- MATERNO -->

            <div class="form-group">

              <label for="personal-materno">

                Apellido materno

              </label>

              <input

                id="personal-materno"

                v-model="form.apellido_materno"

                type="text"

                maxlength="100"

                placeholder="Apellido materno"

              />

            </div>



            <!-- TELÉFONO -->

            <div class="form-group">

              <label for="personal-telefono">

                Teléfono

              </label>

              <input

                id="personal-telefono"

                v-model="form.telefono"

                type="tel"

                maxlength="20"

                placeholder="962 000 0000"

              />

            </div>

          </div>



          <div class="form-section-title form-section-spacing">

            <i class="bi bi-shield-lock"></i>

            <div>

              <strong>

                Cuenta de acceso

              </strong>

              <span>

                Credenciales y estado del usuario

              </span>

            </div>

          </div>



          <div class="form-grid">

            <!-- CORREO -->

            <div class="form-group">

              <label for="personal-correo">

                Correo electrónico

                <span class="required">*</span>

              </label>

              <input

                id="personal-correo"

                v-model="form.correo"

                type="email"

                maxlength="150"

                placeholder="mecanico@correo.com"

                required

              />

            </div>



            <!-- CONTRASEÑA -->

            <div

              v-if="!editing"

              class="form-group"

            >

              <label for="personal-password">

                Contraseña

                <span class="required">*</span>

              </label>

              <div class="password-field">

                <input

                  id="personal-password"

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

                  @click="

                    showPassword =

                      !showPassword

                  "

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



            <!-- ESPECIALIDAD -->

            <div class="form-group">

              <label for="personal-especialidad">

                Especialidad

                <span class="required">*</span>

              </label>

              <input

                id="personal-especialidad"

                v-model="form.especialidad"

                type="text"

                maxlength="120"

                placeholder="Ej. Mecánica general"

                required

              />

            </div>



            <!-- ESTADO -->

            <div class="form-group">

              <label for="personal-estatus">

                Estado

                <span class="required">*</span>

              </label>

              <select

                id="personal-estatus"

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



          <div

            v-if="editing"

            class="form-information"

          >

            <i class="bi bi-info-circle"></i>

            <span>

              La contraseña no se modifica desde este formulario.

              Los demás datos sí serán actualizados.

            </span>

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

         MODAL VER

    ======================================================= -->

    <div

      v-if="showViewModal && selectedPersonal"

      class="modal-overlay"

      @click.self="showViewModal = false"

    >

      <div class="app-modal personal-detail-modal">

        <div class="modal-header">

          <div>

            <h3>

              Información del personal

            </h3>

            <p>

              Datos completos del mecánico.

            </p>

          </div>

          <button

            class="modal-close-button"

            type="button"

            @click="showViewModal = false"

          >

            <i class="bi bi-x-lg"></i>

          </button>

        </div>



        <div class="modal-body">

          <div class="personal-profile-header">

            <div class="personal-large-avatar">

              {{

                getInitials(

                  selectedPersonal

                )

              }}

            </div>

            <div>

              <h3>

                {{

                  getFullName(

                    selectedPersonal

                  )

                }}

              </h3>

              <span class="specialty-badge">

                <i class="bi bi-wrench-adjustable"></i>

                {{

                  selectedPersonal.especialidad ||

                  'No especificada'

                }}

              </span>

            </div>

          </div>



          <div class="detail-grid">

            <div class="detail-card">

              <i class="bi bi-envelope"></i>

              <div>

                <small>Correo electrónico</small>

                <strong>

                  {{

                    selectedPersonal.usuario?.correo ||

                    'Sin correo'

                  }}

                </strong>

              </div>

            </div>



            <div class="detail-card">

              <i class="bi bi-telephone"></i>

              <div>

                <small>Teléfono</small>

                <strong>

                  {{

                    selectedPersonal.usuario?.telefono ||

                    'Sin teléfono'

                  }}

                </strong>

              </div>

            </div>



            <div class="detail-card">

              <i class="bi bi-person-badge"></i>

              <div>

                <small>ID mecánico</small>

                <strong>

                  #{{ selectedPersonal.id_mecanico }}

                </strong>

              </div>

            </div>



            <div class="detail-card">

              <i class="bi bi-calendar3"></i>

              <div>

                <small>Fecha de registro</small>

                <strong>

                  {{

                    formatDate(

                      selectedPersonal.usuario?.fecha_registro

                    )

                  }}

                </strong>

              </div>

            </div>

          </div>



          <div class="detail-status-row">

            <span>Estado de la cuenta</span>

            <span

              class="status-badge"

              :class="

                isActive(selectedPersonal)

                  ? 'active'

                  : 'inactive'

              "

            >

              {{

                selectedPersonal.usuario?.estatus ||

                'Activo'

              }}

            </span>

          </div>

        </div>



        <div class="modal-footer">

          <button

            class="secondary-button"

            type="button"

            @click="showViewModal = false"

          >

            Cerrar

          </button>

          <button

            class="primary-button"

            type="button"

            @click="

              showViewModal = false;

              openEditModal(selectedPersonal)

            "

          >

            <i class="bi bi-pencil-square"></i>

            Editar

          </button>

        </div>

      </div>

    </div>



    <!-- ======================================================

         MODAL CONFIRMACIÓN

    ======================================================= -->

    <div

      v-if="confirmation.visible"

      class="modal-overlay confirmation-overlay"

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

          v-if="

            confirmation.type === 'delete' &&

            confirmation.item

          "

          class="confirmation-person"

        >

          <div class="person-avatar">

            {{

              getInitials(

                confirmation.item

              )

            }}

          </div>

          <div>

            <strong>

              {{

                getFullName(

                  confirmation.item

                )

              }}

            </strong>

            <span>

              {{

                confirmation.item.usuario?.correo

              }}

            </span>

          </div>

        </div>



        <div class="confirmation-actions">

          <button

            class="secondary-button"

            type="button"

            :disabled="processingConfirmation"

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

            :disabled="processingConfirmation"

            @click="executeConfirmation"

          >

            <i

              v-if="processingConfirmation"

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

  actualizarPersonal,

  cambiarEstadoPersonal,
  eliminarPersonal,
  obtenerDependenciasPersonal,
  obtenerPersonal,
  registrarPersonal
} from '../services/personalService.js'



/* ============================================================

   PROPS / EMITS

============================================================ */

const props = defineProps({

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

const personal = ref([])

const loading = ref(false)

const saving = ref(false)

const processingConfirmation =
  ref(false)

const checkingDeleteId = ref(null)

const successMessage = ref('')

const errorMessage = ref('')

const search = ref('')

const statusFilter = ref('')

const showFormModal = ref(false)

const showViewModal = ref(false)

const editing = ref(false)

const showPassword = ref(false)

const selectedPersonal = ref(null)



/* ============================================================

   FORMULARIO

============================================================ */

const emptyForm = () => ({

  id_mecanico: null,

  id_usuario: null,

  nombre: '',

  apellido_paterno: '',

  apellido_materno: '',

  correo: '',

  contrasenia: '',

  telefono: '',

  especialidad: '',

  estatus: 'Activo'

})

const form = ref(

  emptyForm()

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

  action: null

})



/* ============================================================

   COMPUTED

============================================================ */

const filteredPersonal = computed(() => {

  const term =

    search.value

      .trim()

      .toLowerCase()

  return personal.value.filter(item => {

    const usuario =

      item.usuario || {}

    const searchable = `

      ${usuario.nombre || ''}

      ${usuario.apellido_paterno || ''}

      ${usuario.apellido_materno || ''}

      ${usuario.correo || ''}

      ${usuario.telefono || ''}

      ${item.especialidad || ''}

    `

      .toLowerCase()

      .replace(/\s+/g, ' ')

    const matchesSearch =

      !term ||

      searchable.includes(term)

    const estado =

      String(

        usuario.estatus || 'Activo'

      )

        .trim()

        .toLowerCase()

    const matchesStatus =

      !statusFilter.value ||

      estado ===

        statusFilter.value

          .toLowerCase()

    return (

      matchesSearch &&

      matchesStatus

    )

  })

})



const totalActivos = computed(() => {

  return personal.value.filter(

    item => isActive(item)

  ).length

})



const totalInactivos = computed(() => {

  return (

    personal.value.length -

    totalActivos.value

  )

})



/* ============================================================

   CARGAR

============================================================ */

const loadPersonal = async () => {

  loading.value = true

  errorMessage.value = ''

  try {

    personal.value =

      await obtenerPersonal()

  } catch (error) {

    console.error(

      'Error cargando personal:',

      error

    )

    errorMessage.value =

      getErrorMessage(

        error,

        'No fue posible cargar el personal.'

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

  selectedPersonal.value = null

  form.value =

    emptyForm()

  showPassword.value = false

  showFormModal.value = true

}



/* ============================================================

   EDITAR

============================================================ */

const openEditModal = item => {

  const usuario =

    item.usuario || {}

  editing.value = true

  selectedPersonal.value =

    item

  form.value = {

    id_mecanico:

      item.id_mecanico,

    id_usuario:

      item.id_usuario,

    nombre:

      usuario.nombre || '',

    apellido_paterno:

      usuario.apellido_paterno || '',

    apellido_materno:

      usuario.apellido_materno || '',

    correo:

      usuario.correo || '',

    contrasenia: '',

    telefono:

      usuario.telefono || '',

    especialidad:

      item.especialidad || '',

    estatus:

      usuario.estatus ||

      'Activo'

  }

  showPassword.value = false

  showFormModal.value = true

}



/* ============================================================

   VER

============================================================ */

const openViewModal = item => {

  selectedPersonal.value =

    item

  showViewModal.value =

    true

}



/* ============================================================

   CERRAR FORM

============================================================ */

const closeFormModal = () => {

  if (saving.value) {

    return

  }

  showFormModal.value = false

  editing.value = false

  selectedPersonal.value = null

  showPassword.value = false

  form.value =

    emptyForm()

}



/* ============================================================

   SOLICITAR GUARDADO

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

    createPersonal()

    return

  }



  confirmation.value = {

    visible: true,

    type: 'update',

    title:

      '¿Actualizar información?',

    message:

      '¿Está seguro(a) de actualizar los datos de este mecánico?',

    confirmText:

      'Sí, actualizar',

    item:

      selectedPersonal.value,

    action:

      'update'

  }

}



/* ============================================================

   REGISTRAR

============================================================ */

const createPersonal = async () => {

  saving.value = true

  errorMessage.value = ''

  successMessage.value = ''

  try {

    await registrarPersonal(

      form.value

    )

    showFormModal.value = false

    form.value =

      emptyForm()

    successMessage.value =

      'El mecánico fue registrado correctamente.'

    await loadPersonal()

    clearSuccessLater()

  } catch (error) {

    console.error(

      'Error registrando personal:',

      error

    )

    errorMessage.value =

      getErrorMessage(

        error,

        'No fue posible registrar al mecánico.'

      )

  } finally {

    saving.value = false

  }

}



/* ============================================================

   ACTUALIZAR

============================================================ */

const updatePersonal = async () => {

  if (!form.value.id_mecanico) {

    throw new Error(

      'No se encontró el mecánico que se desea actualizar.'

    )

  }

  saving.value = true

  try {

    await actualizarPersonal(

      form.value.id_mecanico,

      form.value

    )

    showFormModal.value = false

    editing.value = false

    selectedPersonal.value = null

    form.value =

      emptyForm()

    successMessage.value =

      'La información del mecánico fue actualizada correctamente.'

    await loadPersonal()

    clearSuccessLater()

  } finally {

    saving.value = false

  }

}



/* ============================================================

   ESTADO

============================================================ */

const requestStatusChange = item => {

  const currentStatus =

    isActive(item)

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

      `¿Está seguro(a) de cambiar el estado de ${getFullName(item)} de ${currentStatus} a ${newStatus}?`,

    confirmText:

      `Cambiar a ${newStatus}`,

    item,

    action:

      'status',

    newStatus

  }

}



const updateStatus = async () => {

  const item =

    confirmation.value.item

  const newStatus =

    confirmation.value.newStatus

  if (!item?.id_mecanico) {

    throw new Error(

      'No se encontró el mecánico.'

    )

  }

  await cambiarEstadoPersonal(

    item.id_mecanico,

    newStatus

  )

  successMessage.value =

    `El mecánico ahora está ${newStatus}.`

  await loadPersonal()

  clearSuccessLater()

}



/* ============================================================

   ELIMINAR

============================================================ */

const requestDelete = async item => {
  if (!item?.id_mecanico || checkingDeleteId.value !== null) {
    return
  }

  checkingDeleteId.value = item.id_mecanico
  errorMessage.value = ''

  try {
    const dependencias =
      await obtenerDependenciasPersonal(item.id_mecanico)

    const tieneDependencias =
      dependencias.vehiculos > 0 ||
      dependencias.clientes > 0 ||
      dependencias.citasActivas > 0

    if (tieneDependencias) {
      errorMessage.value =
        `No se puede eliminar a ${getFullName(item)}. ` +
        `Vehículos asignados: ${dependencias.vehiculos}; ` +
        `clientes asignados: ${dependencias.clientes}; ` +
        `citas activas: ${dependencias.citasActivas}.`
      return
    }

    confirmation.value = {
      visible: true,
      type: 'delete',
      title: '¿Eliminar personal?',
      message:
        `Se eliminará la cuenta y la ficha activa de ${getFullName(item)}. ` +
        'Los trabajos anteriores permanecerán en el historial y conservarán su nombre.',
      confirmText: 'Sí, eliminar',
      item,
      action: 'delete'
    }
  } catch (error) {
    errorMessage.value =
      `No fue posible verificar las dependencias de ${getFullName(item)}. ` +
      `${error?.message || 'Inténtalo de nuevo.'}`
  } finally {
    checkingDeleteId.value = null
  }
}



const deletePersonal = async () => {

  const item =

    confirmation.value.item

  if (!item?.id_mecanico) {

    throw new Error(

      'No se encontró el mecánico.'

    )

  }

  await eliminarPersonal(
    item.id_mecanico
  )

  const personalActualizado =
    await obtenerPersonal()

  if (
    personalActualizado.some(
      mecanico =>
        String(mecanico.id_mecanico) ===
        String(item.id_mecanico)
    )
  ) {
    throw new Error(
      'La base de datos no confirmó que el mecánico haya sido eliminado. Actualiza la lista e inténtalo de nuevo.'
    )
  }

  personal.value =
    personalActualizado

  successMessage.value =
    'La cuenta y la ficha activa fueron eliminadas. El historial de trabajos se conserva.'
  clearSuccessLater()
}



/* ============================================================
   EJECUTAR CONFIRMACIÓN
============================================================ */
const executeConfirmation = async () => {
  if (processingConfirmation.value) {
    return
  }

  processingConfirmation.value = true
  errorMessage.value = ''

  try {
    switch (confirmation.value.action) {
      case 'update':
        await updatePersonal()
        break

      case 'delete':
        await deletePersonal()
        break

      case 'status':
        await updateStatus()
        break

      default:
        return
    }

    // Primero liberamos el estado de procesamiento
    processingConfirmation.value = false

    // Ahora sí puede cerrarse el modal
    closeConfirmation()
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

    // También permitir cerrar el modal cuando ocurre un error
    processingConfirmation.value = false
    closeConfirmation()
  } finally {
    processingConfirmation.value = false
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

    type: '',

    title: '',

    message: '',

    confirmText: '',

    item: null,

    action: null

  }

}



/* ============================================================

   VALIDACIÓN

============================================================ */

const validateForm = () => {

  if (!form.value.nombre.trim()) {

    return 'Ingresa el nombre.'

  }

  if (

    !form.value.apellido_paterno.trim()

  ) {

    return 'Ingresa el apellido paterno.'

  }

  if (!form.value.correo.trim()) {

    return 'Ingresa el correo electrónico.'

  }

  if (

    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(

      form.value.correo.trim()

    )

  ) {

    return 'Ingresa un correo electrónico válido.'

  }

  if (

    !editing.value &&

    form.value.contrasenia.length < 6

  ) {

    return 'La contraseña debe contener al menos 6 caracteres.'

  }

  if (

    !form.value.especialidad.trim()

  ) {

    return 'Ingresa la especialidad.'

  }

  return ''

}



/* ============================================================

   UTILIDADES

============================================================ */

const getFullName = item => {

  const usuario =

    item?.usuario || {}

  return `

    ${usuario.nombre || ''}

    ${usuario.apellido_paterno || ''}

    ${usuario.apellido_materno || ''}

  `

    .replace(/\s+/g, ' ')

    .trim() ||

    'Sin nombre'

}



const getInitials = item => {

  const usuario =

    item?.usuario || {}

  const parts = [

    usuario.nombre,

    usuario.apellido_paterno

  ].filter(Boolean)

  if (!parts.length) {

    return 'ME'

  }

  return parts

    .map(value =>

      value.charAt(0)

    )

    .join('')

    .substring(0, 2)

    .toUpperCase()

}



const isActive = item => {

  return (

    String(

      item?.usuario?.estatus ||

      'Activo'

    )

      .trim()

      .toLowerCase() ===

    'activo'

  )

}



const formatDate = value => {

  if (!value) {

    return '—'

  }

  const date =

    new Date(value)

  if (

    Number.isNaN(

      date.getTime()

    )

  ) {

    return '—'

  }

  return new Intl.DateTimeFormat(

    'es-MX',

    {

      day: '2-digit',

      month: 'short',

      year: 'numeric'

    }

  ).format(date)

}



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

    return 'Ya existe un registro con esa información.'

  }

  if (

    error?.code === '23503'

  ) {

    return 'No es posible eliminar este registro porque tiene información relacionada.'

  }

  if (

    message

      .toLowerCase()

      .includes('duplicate')

  ) {

    return 'El correo electrónico ya está registrado.'

  }

  return message || fallback

}



const clearSuccessLater = () => {

  setTimeout(() => {

    successMessage.value = ''

  }, 3500)

}



/* ============================================================

   ACCIÓN DESDE INICIO

============================================================ */

watch(

  () => props.action?.token,

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

   INICIO

============================================================ */

onMounted(() => {

  loadPersonal()

})

</script>