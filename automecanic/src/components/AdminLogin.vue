<template>
  <div
    :class="[
      'card shadow-custom border-0 rounded-4 w-100 max-w-login position-relative overflow-hidden d-flex flex-column',
      'login-card',
      isDarkMode
        ? 'card-dark-glass text-light'
        : 'card-light-glass text-dark'
    ]"
  >
    <div class="accent-bar w-100"></div>

    <div
      class="card-body p-4 p-sm-5 d-flex flex-column justify-content-between flex-grow-1"
    >

      <!-- =====================================================
           LOGIN NORMAL
      ====================================================== -->

      <div
        v-if="!showForgotPassword && !isRecoveryMode"
      >
        <div class="text-center mb-4">

          <div
            :class="[
              'badge border rounded-pill px-3 py-1.5 mb-3 fw-semibold small shadow-sm',
              isDarkMode
                ? 'badge-dark-subtle text-info border-info-subtle'
                : 'badge-primary-subtle text-primary border-primary-subtle'
            ]"
          >
            <i class="bi bi-shield-lock-fill me-1"></i>
            Acceso Administrador
          </div>

          <div
            :class="[
              'brand-logo-container mb-3 mx-auto shadow-sm',
              isDarkMode
                ? 'border-info-subtle bg-dark'
                : ''
            ]"
          >
            <img
              :src="currentLogo"
              alt="Automecanic Logo"
              class="img-fluid object-fit-cover"
            />
          </div>

          <h2
            :class="[
              'fw-bold fs-3 mb-1',
              isDarkMode
                ? 'text-white'
                : 'text-dark'
            ]"
          >
            Automecanic
          </h2>

          <p
            :class="[
              'small mb-0',
              isDarkMode
                ? 'text-slate-300'
                : 'text-muted'
            ]"
          >
            Inicia sesión para dar de alta a tu personal
          </p>

        </div>

        <div
          v-if="loginSuccess"
          class="alert alert-success py-2 small text-center mb-3 rounded-3 shadow-sm"
          role="alert"
        >
          <i class="bi bi-check-circle-fill me-1"></i>
          {{ loginSuccess }}
        </div>

        <div
          v-if="loginError"
          class="alert alert-danger py-2 small text-center mb-3 rounded-3 shadow-sm"
          role="alert"
        >
          <i class="bi bi-exclamation-triangle-fill me-1"></i>
          {{ loginError }}
        </div>

        <form
          @submit.prevent="handleLogin"
          novalidate
        >

          <!-- CORREO -->

          <div class="mb-3">

            <label
              for="correo"
              :class="[
                'form-label fw-semibold small',
                isDarkMode
                  ? 'text-slate-300'
                  : 'text-secondary'
              ]"
            >
              Correo Electrónico
            </label>

            <div
              :class="[
                'input-group input-group-custom',
                isDarkMode
                  ? 'input-group-dark border-slate-700'
                  : ''
              ]"
            >

              <span
                :class="[
                  'input-group-text border-end-0 ps-3',
                  isDarkMode
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-light text-muted'
                ]"
              >
                <i class="bi bi-envelope"></i>
              </span>

              <input
                type="email"
                id="correo"
                v-model="loginForm.correo"
                :class="[
                  'form-control border-start-0 ps-2 shadow-none py-2',
                  isDarkMode
                    ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700'
                    : 'bg-light'
                ]"
                placeholder="admin@automecanic.com"
                autocomplete="email"
                autocapitalize="none"
                spellcheck="false"
                required
              />

            </div>
          </div>


          <!-- CONTRASEÑA -->

          <div class="mb-3">

            <label
              for="contrasena"
              :class="[
                'form-label fw-semibold small',
                isDarkMode
                  ? 'text-slate-300'
                  : 'text-secondary'
              ]"
            >
              Contraseña
            </label>

            <div
              :class="[
                'input-group input-group-custom',
                isDarkMode
                  ? 'input-group-dark border-slate-700'
                  : ''
              ]"
            >

              <span
                :class="[
                  'input-group-text border-end-0 ps-3',
                  isDarkMode
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-light text-muted'
                ]"
              >
                <i class="bi bi-key"></i>
              </span>

              <input
                :type="showPassword ? 'text' : 'password'"
                id="contrasena"
                v-model="loginForm.contrasenia"
                :class="[
                  'form-control border-start-0 border-end-0 ps-2 shadow-none py-2',
                  isDarkMode
                    ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700'
                    : 'bg-light'
                ]"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />

              <button
                type="button"
                :class="[
                  'input-group-text border-start-0 pe-3 cursor-pointer',
                  isDarkMode
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-light text-muted'
                ]"
                @click="showPassword = !showPassword"
              >
                <i
                  :class="
                    showPassword
                      ? 'bi bi-eye-slash'
                      : 'bi bi-eye'
                  "
                ></i>
              </button>

            </div>
          </div>


          <!-- BOTÓN LOGIN -->

          <div class="d-grid mt-3">

            <button
              type="submit"
              class="btn btn-primary btn-custom py-2 fw-bold shadow rounded-3"
              :disabled="loginLoading"
            >

              <template v-if="!loginLoading">
                Iniciar Sesión
                <i class="bi bi-box-arrow-in-right ms-1"></i>
              </template>

              <template v-else>
                <span
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Iniciando...
              </template>

            </button>

          </div>


          <!-- RECUPERAR -->

          <div class="text-center mt-3">

            <a
              href="#"
              @click.prevent="openForgotPassword"
              class="small text-decoration-none fw-semibold forgot-password-link"
            >
              ¿Olvidaste tu contraseña?
            </a>

          </div>

        </form>
      </div>


      <!-- =====================================================
           RECUPERAR CONTRASEÑA
      ====================================================== -->

      <div
        v-else-if="showForgotPassword && !isRecoveryMode"
      >

        <div class="text-center mb-4">

          <div
            :class="[
              'badge border rounded-pill px-3 py-1.5 mb-3 fw-semibold small shadow-sm',
              isDarkMode
                ? 'badge-dark-subtle text-info border-info-subtle'
                : 'badge-primary-subtle text-primary border-primary-subtle'
            ]"
          >
            <i class="bi bi-key-fill me-1"></i>
            Recuperación
          </div>

          <div
            :class="[
              'brand-logo-container mb-3 mx-auto shadow-sm',
              isDarkMode
                ? 'border-info-subtle bg-dark'
                : ''
            ]"
          >
            <img
              :src="currentLogo"
              alt="Automecanic Logo"
              class="img-fluid object-fit-cover"
            />
          </div>

          <template v-if="!resetSuccess">

            <h2
              :class="[
                'fw-bold fs-3 mb-1',
                isDarkMode
                  ? 'text-white'
                  : 'text-dark'
              ]"
            >
              ¿Olvidaste tu contraseña?
            </h2>

            <p
              :class="[
                'small mb-0',
                isDarkMode
                  ? 'text-slate-300'
                  : 'text-muted'
              ]"
            >
              Ingresa tu correo electrónico y te enviaremos
              un enlace para crear una nueva contraseña.
            </p>

          </template>

          <template v-else>

            <h2
              :class="[
                'fw-bold fs-3 mb-1',
                isDarkMode
                  ? 'text-white'
                  : 'text-dark'
              ]"
            >
              Revisa tu correo
            </h2>

            <p
              :class="[
                'small mb-0',
                isDarkMode
                  ? 'text-slate-300'
                  : 'text-muted'
              ]"
            >
              Si el correo está registrado, recibirás
              un enlace para recuperar tu contraseña.
            </p>

          </template>

        </div>


        <!-- ERROR -->

        <div
          v-if="resetError"
          class="alert alert-danger py-2 small text-center mb-3 rounded-3 shadow-sm"
          role="alert"
        >
          <i class="bi bi-exclamation-triangle-fill me-1"></i>
          {{ resetError }}
        </div>


        <!-- ÉXITO -->

        <div
          v-if="resetSuccess"
          class="alert alert-success py-2 small text-center mb-3 rounded-3 shadow-sm"
          role="alert"
        >
          <i class="bi bi-check-circle-fill me-1"></i>
          {{ resetSuccess }}
        </div>


        <!-- FORMULARIO -->

        <form
          v-if="!resetSuccess"
          @submit.prevent="handlePasswordReset"
          novalidate
        >

          <div class="mb-3">

            <label
              for="reset-email"
              :class="[
                'form-label fw-semibold small',
                isDarkMode
                  ? 'text-slate-300'
                  : 'text-secondary'
              ]"
            >
              Correo Electrónico
            </label>

            <div
              :class="[
                'input-group input-group-custom',
                isDarkMode
                  ? 'input-group-dark border-slate-700'
                  : ''
              ]"
            >

              <span
                :class="[
                  'input-group-text border-end-0 ps-3',
                  isDarkMode
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-light text-muted'
                ]"
              >
                <i class="bi bi-envelope"></i>
              </span>

              <input
                type="email"
                id="reset-email"
                v-model="resetEmail"
                :class="[
                  'form-control border-start-0 ps-2 shadow-none py-2',
                  isDarkMode
                    ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700'
                    : 'bg-light'
                ]"
                placeholder="admin@automecanic.com"
                autocomplete="email"
                required
              />

            </div>

          </div>


          <div class="d-grid">

            <button
              type="submit"
              class="btn btn-primary btn-custom py-2 fw-bold shadow rounded-3"
              :disabled="resetLoading"
            >

              <template v-if="!resetLoading">
                Enviar enlace
                <i class="bi bi-envelope-arrow-up ms-1"></i>
              </template>

              <template v-else>
                <span
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Enviando...
              </template>

            </button>

          </div>

        </form>


        <div
          v-if="resetSuccess"
          class="d-grid mt-3"
        >

          <button
            type="button"
            class="btn btn-outline-primary py-2 fw-semibold rounded-3"
            @click="sendAnotherRecoveryEmail"
          >
            <i class="bi bi-envelope me-1"></i>
            Enviar a otro correo
          </button>

        </div>


        <div class="d-grid mt-3">

          <button
            type="button"
            class="btn btn-primary btn-custom py-2 fw-bold shadow rounded-3 back-login-button"
            @click="returnToLogin"
          >
            <i class="bi bi-arrow-left me-2"></i>
            Regresar al inicio de sesión
          </button>

        </div>

      </div>


      <!-- =====================================================
           NUEVA CONTRASEÑA
      ====================================================== -->

      <div
        v-else-if="isRecoveryMode"
      >

        <div class="text-center mb-4">

          <div
            :class="[
              'badge border rounded-pill px-3 py-1.5 mb-3 fw-semibold small shadow-sm',
              isDarkMode
                ? 'badge-dark-subtle text-info border-info-subtle'
                : 'badge-primary-subtle text-primary border-primary-subtle'
            ]"
          >
            <i class="bi bi-shield-check me-1"></i>
            Nueva Contraseña
          </div>

          <div
            :class="[
              'brand-logo-container mb-3 mx-auto shadow-sm',
              isDarkMode
                ? 'border-info-subtle bg-dark'
                : ''
            ]"
          >
            <img
              :src="currentLogo"
              alt="Automecanic Logo"
              class="img-fluid object-fit-cover"
            />
          </div>

          <h2
            :class="[
              'fw-bold fs-3 mb-1',
              isDarkMode
                ? 'text-white'
                : 'text-dark'
            ]"
          >
            Crear nueva contraseña
          </h2>

          <p
            :class="[
              'small mb-0',
              isDarkMode
                ? 'text-slate-300'
                : 'text-muted'
            ]"
          >
            Ingresa y confirma la nueva contraseña de tu cuenta.
          </p>

        </div>


        <div
          v-if="newPasswordError"
          class="alert alert-danger py-2 small text-center mb-3 rounded-3 shadow-sm"
        >
          <i class="bi bi-exclamation-triangle-fill me-1"></i>
          {{ newPasswordError }}
        </div>


        <div
          v-if="newPasswordSuccess"
          class="alert alert-success py-2 small text-center mb-3 rounded-3 shadow-sm"
        >
          <i class="bi bi-check-circle-fill me-1"></i>
          {{ newPasswordSuccess }}
        </div>


        <form
          @submit.prevent="handleNewPassword"
          novalidate
        >

          <!-- NUEVA CONTRASEÑA -->

          <div class="mb-3">

            <label
              for="new-password"
              :class="[
                'form-label fw-semibold small',
                isDarkMode
                  ? 'text-slate-300'
                  : 'text-secondary'
              ]"
            >
              Nueva Contraseña
            </label>

            <div
              :class="[
                'input-group input-group-custom',
                isDarkMode
                  ? 'input-group-dark border-slate-700'
                  : ''
              ]"
            >

              <span
                :class="[
                  'input-group-text border-end-0 ps-3',
                  isDarkMode
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-light text-muted'
                ]"
              >
                <i class="bi bi-lock"></i>
              </span>

              <input
                :type="showNewPassword ? 'text' : 'password'"
                id="new-password"
                v-model="newPassword"
                :class="[
                  'form-control border-start-0 border-end-0 ps-2 shadow-none py-2',
                  isDarkMode
                    ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700'
                    : 'bg-light'
                ]"
                placeholder="••••••••"
                autocomplete="new-password"
                required
              />

              <button
                type="button"
                :class="[
                  'input-group-text border-start-0 pe-3 cursor-pointer',
                  isDarkMode
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-light text-muted'
                ]"
                @click="showNewPassword = !showNewPassword"
              >
                <i
                  :class="
                    showNewPassword
                      ? 'bi bi-eye-slash'
                      : 'bi bi-eye'
                  "
                ></i>
              </button>

            </div>
          </div>


          <!-- CONFIRMAR -->

          <div class="mb-3">

            <label
              for="confirm-new-password"
              :class="[
                'form-label fw-semibold small',
                isDarkMode
                  ? 'text-slate-300'
                  : 'text-secondary'
              ]"
            >
              Confirmar Contraseña
            </label>

            <div
              :class="[
                'input-group input-group-custom',
                isDarkMode
                  ? 'input-group-dark border-slate-700'
                  : ''
              ]"
            >

              <span
                :class="[
                  'input-group-text border-end-0 ps-3',
                  isDarkMode
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-light text-muted'
                ]"
              >
                <i class="bi bi-lock-fill"></i>
              </span>

              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                id="confirm-new-password"
                v-model="confirmNewPassword"
                :class="[
                  'form-control border-start-0 border-end-0 ps-2 shadow-none py-2',
                  isDarkMode
                    ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700'
                    : 'bg-light'
                ]"
                placeholder="••••••••"
                autocomplete="new-password"
                required
              />

              <button
                type="button"
                :class="[
                  'input-group-text border-start-0 pe-3 cursor-pointer',
                  isDarkMode
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-light text-muted'
                ]"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <i
                  :class="
                    showConfirmPassword
                      ? 'bi bi-eye-slash'
                      : 'bi bi-eye'
                  "
                ></i>
              </button>

            </div>
          </div>


          <div
            :class="[
              'small mb-3',
              isDarkMode
                ? 'text-slate-400'
                : 'text-muted'
            ]"
          >
            <i class="bi bi-info-circle me-1"></i>
            La contraseña debe contener al menos 8 caracteres.
          </div>


          <div class="d-grid">

            <button
              type="submit"
              class="btn btn-primary btn-custom py-2 fw-bold shadow rounded-3"
              :disabled="newPasswordLoading"
            >

              <template v-if="!newPasswordLoading">
                Guardar Nueva Contraseña
                <i class="bi bi-check-lg ms-1"></i>
              </template>

              <template v-else>
                <span
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Actualizando...
              </template>

            </button>

          </div>


          <div class="d-grid mt-3">

            <button
              type="button"
              class="btn btn-primary btn-custom py-2 fw-bold shadow rounded-3 back-login-button"
              :disabled="newPasswordLoading"
              @click="cancelRecoveryAndReturnToLogin"
            >
              <i class="bi bi-arrow-left me-2"></i>
              Regresar al inicio de sesión
            </button>

          </div>

        </form>

      </div>


      <!-- PIE -->

      <div
        :class="[
          'text-center mt-3 pt-3 border-top',
          isDarkMode
            ? 'border-slate-700/60'
            : 'border-light-subtle'
        ]"
      >
        <p
          :class="[
            'small mb-0',
            isDarkMode
              ? 'text-slate-400'
              : 'text-muted'
          ]"
        >
          Gestión de Personal Autorizado
        </p>
      </div>

    </div>
  </div>
</template>


<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount
} from 'vue'

import { supabase } from '../services/supabase.js'

import logoClaro from '../assets/logo-claro.jpg'
import logoOscuro from '../assets/logo-oscuro.jpg'


/* ==========================================================
   PROPS
========================================================== */

const props = defineProps({
  isDarkMode: Boolean
})


/* ==========================================================
   EMITS
========================================================== */

const emit = defineEmits([
  'login-success'
])


/* ==========================================================
   LOGIN
========================================================== */

const showPassword = ref(false)

const loginError = ref('')
const loginSuccess = ref('')
const loginLoading = ref(false)

const loginForm = ref({
  correo: '',
  contrasenia: ''
})


/* ==========================================================
   RECUPERACIÓN
========================================================== */

const showForgotPassword = ref(false)

const resetEmail = ref('')
const resetError = ref('')
const resetSuccess = ref('')
const resetLoading = ref(false)


/* ==========================================================
   NUEVA CONTRASEÑA
========================================================== */

const isRecoveryMode = ref(false)

const newPassword = ref('')
const confirmNewPassword = ref('')

const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const newPasswordError = ref('')
const newPasswordSuccess = ref('')
const newPasswordLoading = ref(false)


/* ==========================================================
   LOGO
========================================================== */

const currentLogo = computed(() => {
  return props.isDarkMode
    ? logoOscuro
    : logoClaro
})


/* ==========================================================
   ABRIR RECUPERACIÓN
========================================================== */

const openForgotPassword = () => {

  loginError.value = ''
  loginSuccess.value = ''

  resetError.value = ''
  resetSuccess.value = ''

  resetEmail.value =
    loginForm.value.correo.trim()

  showForgotPassword.value = true
}


/* ==========================================================
   REGRESAR AL LOGIN
========================================================== */

const returnToLogin = () => {

  showForgotPassword.value = false

  resetEmail.value = ''
  resetError.value = ''
  resetSuccess.value = ''
  resetLoading.value = false

  loginError.value = ''
}


/* ==========================================================
   OTRO CORREO
========================================================== */

const sendAnotherRecoveryEmail = () => {

  resetEmail.value = ''

  resetError.value = ''
  resetSuccess.value = ''

  resetLoading.value = false
}


/* ==========================================================
   LOGIN ADMINISTRADOR
========================================================== */

const handleLogin = async () => {

  loginError.value = ''
  loginSuccess.value = ''

  const emailLimpio =
    loginForm.value.correo
      .trim()
      .toLowerCase()

  const password =
    loginForm.value.contrasenia


  if (
    !emailLimpio ||
    !password
  ) {

    loginError.value =
      'Completa los campos de acceso.'

    return
  }


  loginLoading.value = true


  try {

    /*
      AUTENTICAR CONTRA SUPABASE
    */

    const {
      data: authData,
      error: authError
    } =
      await supabase.auth.signInWithPassword({
        email: emailLimpio,
        password
      })


    if (authError) {

      loginError.value =
        'Correo o contraseña incorrectos en el sistema.'

      return
    }


    if (!authData?.user) {

      loginError.value =
        'No se encontró el usuario en el sistema.'

      return
    }


    /*
      OBTENER PERFIL DEL USUARIO
    */

    const {
      data: userData,
      error: userError
    } =
      await supabase
        .from('usuario')
        .select('*, rol(*)')
        .eq(
          'auth_id',
          authData.user.id
        )
        .single()


    if (
      userError ||
      !userData
    ) {

      console.error(
        'Error buscando perfil:',
        userError
      )

      loginError.value =
        'El usuario autenticado no tiene un perfil configurado o vinculado en la base de datos.'

      await supabase.auth.signOut()

      return
    }


    /*
      ========================================================
      VALIDACIÓN REAL DEL ROL
      ========================================================

      1 = Administrador
      2 = Mecánico
      3 = Cliente

      ESTE LOGIN SOLAMENTE ADMITE:
      1 = Administrador
    */

    const idRol =
      Number(userData.id_rol)


    if (
      idRol !== 1
    ) {

      console.warn(
        'Acceso administrativo rechazado. Rol:',
        idRol
      )

      loginError.value =
        'Esta cuenta no tiene permisos de administrador. Utiliza el acceso correspondiente a tu tipo de usuario.'

      /*
        MUY IMPORTANTE:
        Se cierra la sesión de Supabase para
        que el usuario no quede autenticado.
      */

      await supabase.auth.signOut()

      return
    }


    /*
      EL USUARIO ES ADMINISTRADOR.

      Solamente aquí se permite continuar
      hacia AdminDashboard.
    */

    emit(
      'login-success',
      userData
    )

  } catch (err) {

    console.error(
      'Error al iniciar sesión:',
      err
    )

    loginError.value =
      'Error al conectar con el servidor.'

    try {
      await supabase.auth.signOut()
    } catch (signOutError) {
      console.error(
        'Error cerrando sesión:',
        signOutError
      )
    }

  } finally {

    loginLoading.value = false

  }
}


/* ==========================================================
   RECUPERAR CONTRASEÑA
========================================================== */

const handlePasswordReset = async () => {

  resetError.value = ''
  resetSuccess.value = ''

  const emailVal =
    resetEmail.value
      .trim()
      .toLowerCase()


  if (!emailVal) {

    resetError.value =
      'Ingresa tu correo electrónico para continuar.'

    return
  }


  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/


  if (
    !emailRegex.test(emailVal)
  ) {

    resetError.value =
      'Ingresa un correo electrónico válido.'

    return
  }


  resetLoading.value = true


  try {

    const redirectUrl =
      `${window.location.origin}${window.location.pathname}`


    const {
      error
    } =
      await supabase.auth.resetPasswordForEmail(
        emailVal,
        {
          redirectTo: redirectUrl
        }
      )


    if (error) {

      console.error(
        'Error enviando recuperación:',
        error
      )

      resetError.value =
        'No fue posible enviar el correo de recuperación. Verifica la dirección e inténtalo nuevamente.'

      return
    }


    resetSuccess.value =
      'Si esta dirección está registrada en AutoMecanic, recibirás un enlace para crear una nueva contraseña.'

  } catch (err) {

    console.error(
      'Error en recuperación:',
      err
    )

    resetError.value =
      'Ocurrió un error al enviar el correo de recuperación. Inténtalo nuevamente.'

  } finally {

    resetLoading.value = false

  }
}


/* ==========================================================
   NUEVA CONTRASEÑA
========================================================== */

const handleNewPassword = async () => {

  newPasswordError.value = ''
  newPasswordSuccess.value = ''

  const password =
    newPassword.value

  const confirmation =
    confirmNewPassword.value


  if (
    !password ||
    !confirmation
  ) {

    newPasswordError.value =
      'Completa ambos campos de contraseña.'

    return
  }


  if (
    password.length < 8
  ) {

    newPasswordError.value =
      'La nueva contraseña debe contener al menos 8 caracteres.'

    return
  }


  if (
    password !== confirmation
  ) {

    newPasswordError.value =
      'Las contraseñas no coinciden.'

    return
  }


  newPasswordLoading.value = true


  try {

    const {
      data,
      error
    } =
      await supabase.auth.updateUser({
        password
      })


    if (error) {

      console.error(
        'Error actualizando contraseña:',
        error
      )

      newPasswordError.value =
        'No fue posible actualizar la contraseña. El enlace de recuperación puede haber expirado.'

      return
    }


    if (!data?.user) {

      newPasswordError.value =
        'No fue posible identificar la cuenta que está recuperando la contraseña.'

      return
    }


    newPasswordSuccess.value =
      'Contraseña actualizada correctamente.'


    await new Promise(
      resolve => {
        setTimeout(
          resolve,
          1200
        )
      }
    )


    await supabase.auth.signOut()


    window.history.replaceState(
      {},
      document.title,
      `${window.location.origin}${window.location.pathname}`
    )


    isRecoveryMode.value = false
    showForgotPassword.value = false

    newPassword.value = ''
    confirmNewPassword.value = ''

    showNewPassword.value = false
    showConfirmPassword.value = false

    newPasswordError.value = ''
    newPasswordSuccess.value = ''

    loginForm.value.contrasenia = ''

    loginSuccess.value =
      'Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.'

  } catch (err) {

    console.error(
      'Error cambiando contraseña:',
      err
    )

    newPasswordError.value =
      'Ocurrió un error al actualizar la contraseña.'

  } finally {

    newPasswordLoading.value = false

  }
}


/* ==========================================================
   CANCELAR RECUPERACIÓN
========================================================== */

const cancelRecoveryAndReturnToLogin = async () => {

  try {

    await supabase.auth.signOut()

  } catch (err) {

    console.error(
      'Error cerrando sesión temporal:',
      err
    )

  }


  window.history.replaceState(
    {},
    document.title,
    `${window.location.origin}${window.location.pathname}`
  )


  isRecoveryMode.value = false
  showForgotPassword.value = false

  newPassword.value = ''
  confirmNewPassword.value = ''

  showNewPassword.value = false
  showConfirmPassword.value = false

  newPasswordError.value = ''
  newPasswordSuccess.value = ''

  resetError.value = ''
  resetSuccess.value = ''

  loginError.value = ''
}


/* ==========================================================
   DETECTAR RECUPERACIÓN
========================================================== */

const detectRecoveryFromUrl = () => {

  const hash =
    window.location.hash || ''

  const search =
    window.location.search || ''


  const recoveryDetected =
    hash.includes('type=recovery') ||
    search.includes('type=recovery')


  if (
    recoveryDetected
  ) {

    isRecoveryMode.value = true
    showForgotPassword.value = false

    resetError.value = ''
    resetSuccess.value = ''

    newPasswordError.value = ''
    newPasswordSuccess.value = ''
  }
}


/* ==========================================================
   EVENTOS DE SUPABASE
========================================================== */

const {
  data: authListener
} =
  supabase.auth.onAuthStateChange(
    event => {

      if (
        event === 'PASSWORD_RECOVERY'
      ) {

        isRecoveryMode.value = true
        showForgotPassword.value = false

        resetError.value = ''
        resetSuccess.value = ''

        newPasswordError.value = ''
        newPasswordSuccess.value = ''
      }

    }
  )


/* ==========================================================
   MONTAR
========================================================== */

onMounted(() => {
  detectRecoveryFromUrl()
})


/* ==========================================================
   DESMONTAR
========================================================== */

onBeforeUnmount(() => {

  authListener
    ?.subscription
    ?.unsubscribe()

})
</script>


<style scoped>

.max-w-login {
  max-width: 440px;
  min-height: 520px;
}


.card-light-glass {
  background-color:
    rgba(255, 255, 255, 0.55) !important;

  backdrop-filter:
    blur(18px) !important;

  border:
    1px solid
    rgba(255, 255, 255, 0.7) !important;

  box-shadow:
    0 25px 50px -12px
    rgba(0, 0, 0, 0.25) !important;
}


.card-dark-glass {
  background-color:
    rgba(11, 15, 25, 0.78) !important;

  backdrop-filter:
    blur(16px) !important;

  border:
    1px solid
    rgba(255, 255, 255, 0.12) !important;

  box-shadow:
    0 25px 50px -12px
    rgba(0, 0, 0, 0.85) !important;
}


.accent-bar {
  height: 6px;

  background:
    linear-gradient(
      90deg,
      #0284c7,
      #38bdf8,
      #0ea5e9
    );
}


.shadow-custom {
  box-shadow:
    0 25px 50px -12px
    rgba(0, 0, 0, 0.5) !important;
}


.brand-logo-container {
  width: 75px;
  height: 75px;

  border:
    2px solid #bae6fd;

  border-radius:
    50%;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  overflow:
    hidden;

  background-color:
    #ffffff;
}


.brand-logo-container img {
  width: 100%;
  height: 100%;

  object-fit:
    cover;
}


.input-group-custom {
  border:
    1px solid #cbd5e1;

  border-radius:
    0.5rem;

  overflow:
    hidden;
}


.input-group-dark {
  border-color:
    rgba(255, 255, 255, 0.15) !important;
}


.btn-custom {
  background-color:
    #0284c7;

  border:
    none;
}


.btn-custom:hover {
  background-color:
    #0369a1;
}


.btn-custom:disabled {
  opacity:
    0.7;

  cursor:
    not-allowed;
}


.forgot-password-link {
  color:
    #0284c7 !important;

  transition:
    color 0.2s ease;
}


.forgot-password-link:hover,
.forgot-password-link:focus-visible {
  color:
    #0369a1 !important;
}


.badge-primary-subtle {
  background-color:
    rgba(224, 242, 254, 0.85);

  color:
    #0284c7;
}


.badge-dark-subtle {
  background-color:
    rgba(56, 189, 248, 0.2);

  color:
    #38bdf8;

  border-color:
    rgba(56, 189, 248, 0.35) !important;
}


.text-slate-300 {
  color:
    #cbd5e1 !important;
}


.text-slate-400 {
  color:
    #94a3b8 !important;
}


.bg-slate-800 {
  background-color:
    #111827 !important;
}


.border-slate-700 {
  border-color:
    #334155 !important;
}


.placeholder-slate-500::placeholder {
  color:
    #64748b !important;

  opacity:
    1 !important;
}


.cursor-pointer {
  cursor:
    pointer;
}


.back-login-button {
  opacity:
    1 !important;

  cursor:
    pointer !important;

  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}


.back-login-button:hover {
  transform:
    translateY(-1px);
}


.back-login-button:disabled {
  opacity:
    0.6 !important;

  cursor:
    not-allowed !important;
}


/* ============================================================
   MODO OSCURO
============================================================ */

.card-dark-glass
.input-group-custom {
  background-color:
    #111827 !important;

  border-color:
    #334155 !important;
}


.card-dark-glass
.input-group-text {
  background-color:
    #111827 !important;

  color:
    #94a3b8 !important;

  border-color:
    #334155 !important;
}


.card-dark-glass
.form-control {
  background-color:
    #111827 !important;

  color:
    #f8fafc !important;

  -webkit-text-fill-color:
    #f8fafc !important;

  caret-color:
    #f8fafc !important;

  border-color:
    #334155 !important;

  color-scheme:
    dark;
}


.card-dark-glass
.form-control::placeholder {
  color:
    #94a3b8 !important;

  -webkit-text-fill-color:
    #94a3b8 !important;

  opacity:
    1 !important;
}


.card-dark-glass
.form-control:-webkit-autofill,

.card-dark-glass
.form-control:-webkit-autofill:hover,

.card-dark-glass
.form-control:-webkit-autofill:focus,

.card-dark-glass
.form-control:-webkit-autofill:active {
  -webkit-text-fill-color:
    #f8fafc !important;

  caret-color:
    #f8fafc !important;

  -webkit-box-shadow:
    0 0 0 1000px
    #111827 inset !important;

  box-shadow:
    0 0 0 1000px
    #111827 inset !important;

  border-color:
    #334155 !important;

  transition:
    background-color
    9999s ease-out
    0s;
}


.card-dark-glass
.form-control:autofill {
  background:
    #111827 !important;

  color:
    #f8fafc !important;
}


/* ============================================================
   RESPONSIVE
============================================================ */

@media (max-width: 575.98px) {

  .max-w-login {
    max-width:
      100%;

    min-height:
      auto;
  }

  .brand-logo-container {
    width:
      68px;

    height:
      68px;
  }

}

</style>