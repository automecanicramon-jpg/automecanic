<template>
  <div
    :class="[
      'card login-card shadow-custom border-0 rounded-4 w-100 max-w-login position-relative overflow-hidden d-flex flex-column',
      isDarkMode
        ? 'card-dark-glass text-light'
        : 'card-light-glass text-dark'
    ]"
  >
    <div class="accent-bar-client w-100"></div>

    <div
      class="card-body p-4 p-sm-5 d-flex flex-column justify-content-between flex-grow-1"
    >
      <div v-if="!showForgotPassword && !isRecoveryMode">
        <!-- ==================================================
             CABECERA
        =================================================== -->

        <div class="text-center mb-4">
          <div
            :class="[
              'badge border rounded-pill px-3 py-1.5 mb-3 fw-semibold small shadow-sm',
              isDarkMode
                ? 'bg-dark text-info border-info'
                : 'badge-info-subtle text-info border-info-subtle'
            ]"
          >
            <i class="bi bi-car-front-fill me-1"></i>

            Acceso / Seguimiento de Cliente
          </div>

          <div
            :class="[
              'brand-logo-container mb-3 mx-auto shadow-sm',
              isDarkMode
                ? 'border-info bg-dark'
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
                ? 'text-light opacity-75'
                : 'text-muted'
            ]"
          >
            Consulta el estatus y servicios de tu vehículo
          </p>
        </div>


        <!-- ==================================================
             MENSAJE DE ERROR
        =================================================== -->

        <div
          v-if="loginSuccess"
          class="alert alert-success py-2 small text-center mb-3 rounded-3 shadow-sm"
          role="status"
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


        <!-- ==================================================
             FORMULARIO
        =================================================== -->

        <form
          @submit.prevent="handleClientLogin"
          novalidate
        >
          <!-- CORREO -->

          <div class="mb-3">
            <label
              for="correoCliente"
              :class="[
                'form-label fw-semibold small',
                isDarkMode
                  ? 'text-white'
                  : 'text-secondary'
              ]"
            >
              Correo Electrónico
            </label>

            <div class="input-group input-group-custom">
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
                id="correoCliente"
                v-model="loginForm.correo"
                name="correoCliente"
                type="email"
                autocomplete="email"
                :class="[
                  'form-control border-start-0 ps-2 shadow-none py-2',
                  isDarkMode
                    ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700'
                    : 'bg-light'
                ]"
                placeholder="cliente@correo.com"
                :disabled="loading"
                required
              />
            </div>
          </div>


          <!-- CONTRASEÑA -->

          <div class="mb-3">
            <label
              for="contrasenaCliente"
              :class="[
                'form-label fw-semibold small',
                isDarkMode
                  ? 'text-white'
                  : 'text-secondary'
              ]"
            >
              Contraseña Asignada
            </label>

            <div class="input-group input-group-custom">
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
                id="contrasenaCliente"
                v-model="loginForm.contrasena"
                name="contrasenaCliente"
                :type="
                  showPassword
                    ? 'text'
                    : 'password'
                "
                autocomplete="current-password"
                :class="[
                  'form-control border-start-0 border-end-0 ps-2 shadow-none py-2',
                  isDarkMode
                    ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700'
                    : 'bg-light'
                ]"
                placeholder="••••••••"
                :disabled="loading"
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
                :disabled="loading"
                :title="
                  showPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                "
                @click="
                  showPassword =
                    !showPassword
                "
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

            <div
              :class="[
                'form-text mt-1 fw-medium',
                isDarkMode
                  ? 'text-info'
                  : 'text-muted'
              ]"
              style="font-size: 0.78rem;"
            >
              * Credenciales proporcionadas por el taller al registrar tu cuenta.
            </div>
          </div>

          <div class="d-flex justify-content-center mt-2">
            <button
              type="button"
              class="btn btn-link p-0 client-forgot-link fw-semibold small text-decoration-none"
              :disabled="loading"
              @click="openForgotPassword"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>


          <!-- BOTÓN -->

          <div class="d-grid mt-4">
            <button
              type="submit"
              class="btn btn-info btn-custom-client py-2 fw-bold shadow rounded-3 text-white"
              :disabled="loading"
            >
              <template v-if="loading">
                <i class="bi bi-arrow-repeat spin me-1"></i>

                Iniciando sesión...
              </template>

              <template v-else>
                Iniciar Sesión (Cliente)

                <i class="bi bi-box-arrow-in-right ms-1"></i>
              </template>
            </button>
          </div>
        </form>
      </div>

      <div v-else-if="showForgotPassword && !isRecoveryMode">
        <div class="text-center mb-4">
          <div
            :class="[
              'badge border rounded-pill px-3 py-1.5 mb-3 fw-semibold small shadow-sm',
              isDarkMode
                ? 'bg-dark text-info border-info'
                : 'badge-info-subtle text-info border-info-subtle'
            ]"
          >
            <i class="bi bi-key-fill me-1"></i>
            Recuperación de contraseña
          </div>

          <div
            :class="[
              'brand-logo-container mb-3 mx-auto shadow-sm',
              isDarkMode ? 'border-info bg-dark' : ''
            ]"
          >
            <img
              :src="currentLogo"
              alt="Automecanic Logo"
              class="img-fluid object-fit-cover"
            />
          </div>

          <h2 :class="['fw-bold fs-3 mb-1', isDarkMode ? 'text-white' : 'text-dark']">
            {{ resetSuccess ? 'Revisa tu correo' : '¿Olvidaste tu contraseña?' }}
          </h2>
          <p :class="['small mb-0', isDarkMode ? 'text-light opacity-75' : 'text-muted']">
            {{
              resetSuccess
                ? 'Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.'
                : 'Ingresa el correo asociado a tu cuenta de cliente y te enviaremos un enlace.'
            }}
          </p>
        </div>

        <div
          v-if="resetError"
          class="alert alert-danger py-2 small text-center mb-3 rounded-3 shadow-sm"
          role="alert"
        >
          {{ resetError }}
        </div>

        <div
          v-if="resetSuccess"
          class="alert alert-success py-3 text-center mb-3 rounded-3 shadow-sm"
          role="status"
        >
          <i class="bi bi-envelope-check-fill fs-4"></i>
          <div class="fw-bold mt-2">Solicitud procesada</div>
          <div class="small mt-1">{{ resetEmail }}</div>
          <div class="small mt-2">Revisa también tu carpeta de spam.</div>
        </div>

        <form
          v-if="!resetSuccess"
          @submit.prevent="handlePasswordReset"
          novalidate
        >
          <div class="mb-3">
            <label
              for="resetCorreoCliente"
              :class="['form-label fw-semibold small', isDarkMode ? 'text-white' : 'text-secondary']"
            >
              Correo Electrónico
            </label>
            <div class="input-group input-group-custom">
              <span
                :class="[
                  'input-group-text border-end-0 ps-3',
                  isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-light text-muted'
                ]"
              >
                <i class="bi bi-envelope"></i>
              </span>
              <input
                id="resetCorreoCliente"
                v-model.trim="resetEmail"
                name="resetCorreoCliente"
                type="email"
                autocomplete="email"
                autocapitalize="none"
                spellcheck="false"
                :class="[
                  'form-control border-start-0 ps-2 shadow-none py-2',
                  isDarkMode
                    ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700'
                    : 'bg-light'
                ]"
                placeholder="cliente@correo.com"
                :disabled="resetLoading"
                required
              />
            </div>
          </div>

          <div class="d-grid mt-3">
            <button
              type="submit"
              class="btn btn-info btn-custom-client py-2 fw-bold shadow rounded-3 text-white"
              :disabled="resetLoading"
            >
              <template v-if="resetLoading">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Enviando correo...
              </template>
              <template v-else>
                Enviar correo de recuperación
                <i class="bi bi-send-fill ms-1"></i>
              </template>
            </button>
          </div>
        </form>

        <div v-if="resetSuccess" class="d-grid mt-3">
          <button
            type="button"
            class="btn btn-outline-info py-2 fw-semibold rounded-3"
            @click="sendAnotherRecoveryEmail"
          >
            <i class="bi bi-envelope me-1"></i>
            Enviar a otro correo
          </button>
        </div>

        <div class="d-grid mt-3">
          <button
            type="button"
            class="btn btn-info btn-custom-client py-2 fw-bold shadow rounded-3 text-white"
            :disabled="resetLoading"
            @click="returnToLogin"
          >
            <i class="bi bi-arrow-left me-2"></i>
            Regresar al inicio de sesión
          </button>
        </div>
      </div>

      <div v-else-if="isRecoveryMode">
        <div class="text-center mb-4">
          <div
            :class="[
              'badge border rounded-pill px-3 py-1.5 mb-3 fw-semibold small shadow-sm',
              isDarkMode
                ? 'bg-dark text-info border-info'
                : 'badge-info-subtle text-info border-info-subtle'
            ]"
          >
            <i class="bi bi-shield-check me-1"></i>
            Nueva contraseña
          </div>

          <div
            :class="[
              'brand-logo-container mb-3 mx-auto shadow-sm',
              isDarkMode ? 'border-info bg-dark' : ''
            ]"
          >
            <img
              :src="currentLogo"
              alt="Automecanic Logo"
              class="img-fluid object-fit-cover"
            />
          </div>

          <h2 :class="['fw-bold fs-3 mb-1', isDarkMode ? 'text-white' : 'text-dark']">
            Crear nueva contraseña
          </h2>
          <p :class="['small mb-0', isDarkMode ? 'text-light opacity-75' : 'text-muted']">
            Ingresa y confirma la nueva contraseña de tu cuenta.
          </p>
        </div>

        <div v-if="newPasswordError" class="alert alert-danger py-2 small text-center mb-3 rounded-3 shadow-sm" role="alert">
          {{ newPasswordError }}
        </div>
        <div v-if="newPasswordSuccess" class="alert alert-success py-2 small text-center mb-3 rounded-3 shadow-sm" role="status">
          {{ newPasswordSuccess }}
        </div>

        <form @submit.prevent="handleNewPassword" novalidate>
          <div class="mb-3">
            <label for="newClientPassword" :class="['form-label fw-semibold small', isDarkMode ? 'text-white' : 'text-secondary']">
              Nueva contraseña
            </label>
            <div class="input-group input-group-custom">
              <span :class="['input-group-text border-end-0 ps-3', isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-light text-muted']">
                <i class="bi bi-lock"></i>
              </span>
              <input
                id="newClientPassword"
                v-model="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                autocomplete="new-password"
                :class="['form-control border-start-0 border-end-0 ps-2 shadow-none py-2', isDarkMode ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700' : 'bg-light']"
                placeholder="Mínimo 8 caracteres"
                required
              />
              <button
                type="button"
                :class="['input-group-text border-start-0 pe-3 cursor-pointer', isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-light text-muted']"
                :aria-label="showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="showNewPassword = !showNewPassword"
              >
                <i :class="showNewPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>

          <div class="mb-3">
            <label for="confirmClientPassword" :class="['form-label fw-semibold small', isDarkMode ? 'text-white' : 'text-secondary']">
              Confirmar contraseña
            </label>
            <div class="input-group input-group-custom">
              <span :class="['input-group-text border-end-0 ps-3', isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-light text-muted']">
                <i class="bi bi-lock-fill"></i>
              </span>
              <input
                id="confirmClientPassword"
                v-model="confirmNewPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                :class="['form-control border-start-0 border-end-0 ps-2 shadow-none py-2', isDarkMode ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700' : 'bg-light']"
                placeholder="Repite la nueva contraseña"
                required
              />
              <button
                type="button"
                :class="['input-group-text border-start-0 pe-3 cursor-pointer', isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-light text-muted']"
                :aria-label="showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
            </div>
          </div>

          <p :class="['small mb-3', isDarkMode ? 'text-light opacity-75' : 'text-muted']">
            <i class="bi bi-info-circle me-1"></i>
            La contraseña debe contener al menos 8 caracteres.
          </p>

          <div class="d-grid">
            <button
              type="submit"
              class="btn btn-info btn-custom-client py-2 fw-bold shadow rounded-3 text-white"
              :disabled="newPasswordLoading"
            >
              <template v-if="newPasswordLoading">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Actualizando...
              </template>
              <template v-else>
                Guardar nueva contraseña
                <i class="bi bi-check-lg ms-1"></i>
              </template>
            </button>
          </div>

          <div class="d-grid mt-3">
            <button
              type="button"
              class="btn btn-info btn-custom-client py-2 fw-bold shadow rounded-3 text-white"
              :disabled="newPasswordLoading"
              @click="returnToLogin"
            >
              <i class="bi bi-arrow-left me-2"></i>
              Regresar al inicio de sesión
            </button>
          </div>
        </form>
      </div>

      <!-- ====================================================
           FOOTER
      ===================================================== -->

      <div
        :class="[
          'text-center mt-3 pt-3 border-top',
          isDarkMode
            ? 'border-secondary'
            : 'border-light-subtle'
        ]"
      >
        <p
          :class="[
            'small mb-0',
            isDarkMode
              ? 'text-light opacity-75'
              : 'text-muted'
          ]"
        >
          Portal de Transparencia y Seguimiento
        </p>
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

import logoClaro from '../assets/logo-claro.jpg'
import logoOscuro from '../assets/logo-oscuro.jpg'

import {
  iniciarSesionCliente
} from '../services/clienteService.js'

import {
  supabase
} from '../services/supabase.js'


/* ============================================================
   PROPS / EMITS
============================================================ */

const props = defineProps({
  isDarkMode: Boolean
})


const emit = defineEmits([
  'login-success'
])


/* ============================================================
   ESTADO
============================================================ */

const showPassword = ref(false)

const loginError = ref('')
const loginSuccess = ref('')

const loading = ref(false)

const showForgotPassword = ref(false)
const resetEmail = ref('')
const resetError = ref('')
const resetSuccess = ref(false)
const resetLoading = ref(false)

const isRecoveryMode = ref(false)
const newPassword = ref('')
const confirmNewPassword = ref('')
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const newPasswordError = ref('')
const newPasswordSuccess = ref('')
const newPasswordLoading = ref(false)


/* ============================================================
   LOGO
============================================================ */

const currentLogo =
  computed(() => {
    return props.isDarkMode
      ? logoOscuro
      : logoClaro
  })


/* ============================================================
   FORMULARIO
============================================================ */

const loginForm = ref({
  correo: '',
  contrasena: ''
})

const openForgotPassword = () => {
  loginError.value = ''
  loginSuccess.value = ''
  resetEmail.value = loginForm.value.correo.trim()
  resetError.value = ''
  resetSuccess.value = false
  showForgotPassword.value = true
}

const returnToLogin = async () => {
  try {
    if (isRecoveryMode.value) {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Error cerrando la sesión temporal de recuperación:', error)
        newPasswordError.value =
          'No fue posible cerrar la sesión de recuperación. Inténtalo nuevamente.'
        return
      }
    }
  } catch (error) {
    console.error('Error cerrando la sesión temporal de recuperación:', error)
    newPasswordError.value =
      'Ocurrió un error al cerrar la sesión de recuperación. Inténtalo nuevamente.'
    return
  }

  window.history.replaceState(
    {},
    document.title,
    `${window.location.origin}${window.location.pathname}`
  )

  showForgotPassword.value = false
  isRecoveryMode.value = false
  resetEmail.value = ''
  resetError.value = ''
  resetSuccess.value = false
  newPassword.value = ''
  confirmNewPassword.value = ''
  showNewPassword.value = false
  showConfirmPassword.value = false
  newPasswordError.value = ''
  newPasswordSuccess.value = ''
  loginError.value = ''
}

const handlePasswordReset = async () => {
  resetError.value = ''

  const email = resetEmail.value.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email) {
    resetError.value = 'Ingresa tu correo electrónico para continuar.'
    return
  }

  if (!emailRegex.test(email)) {
    resetError.value = 'Ingresa un correo electrónico válido.'
    return
  }

  resetLoading.value = true

  try {
    const redirectTo =
      `${window.location.origin}${window.location.pathname}?role=client`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    })

    if (error) {
      console.error('Error enviando recuperación de contraseña de cliente:', error)
      resetError.value =
        'No fue posible enviar el correo de recuperación. Inténtalo nuevamente.'
      return
    }

    resetSuccess.value = true
  } catch (error) {
    console.error('Error en recuperación de contraseña de cliente:', error)
    resetError.value =
      'Ocurrió un error al enviar el correo de recuperación. Inténtalo nuevamente.'
  } finally {
    resetLoading.value = false
  }
}

const sendAnotherRecoveryEmail = () => {
  resetEmail.value = ''
  resetSuccess.value = false
  resetError.value = ''
}

const handleNewPassword = async () => {
  newPasswordError.value = ''
  newPasswordSuccess.value = ''

  if (!newPassword.value || !confirmNewPassword.value) {
    newPasswordError.value = 'Completa ambos campos de contraseña.'
    return
  }

  if (newPassword.value.length < 8) {
    newPasswordError.value =
      'La nueva contraseña debe contener al menos 8 caracteres.'
    return
  }

  if (newPassword.value !== confirmNewPassword.value) {
    newPasswordError.value = 'Las contraseñas no coinciden.'
    return
  }

  newPasswordLoading.value = true

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword.value
    })

    if (error) {
      console.error('Error actualizando contraseña del cliente:', error)
      newPasswordError.value =
        'No fue posible actualizar la contraseña. El enlace puede haber expirado.'
      return
    }

    if (!data.user) {
      newPasswordError.value =
        'No fue posible identificar la cuenta que está recuperando la contraseña.'
      return
    }

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.error('Error cerrando la sesión temporal de recuperación:', signOutError)
      newPasswordError.value =
        'La contraseña se actualizó, pero no fue posible cerrar la sesión temporal. Regresa al inicio de sesión e inténtalo nuevamente.'
      return
    }

    window.history.replaceState(
      {},
      document.title,
      `${window.location.origin}${window.location.pathname}`
    )

    showForgotPassword.value = false
    isRecoveryMode.value = false
    newPassword.value = ''
    confirmNewPassword.value = ''
    showNewPassword.value = false
    showConfirmPassword.value = false
    newPasswordSuccess.value = ''
    loginForm.value.contrasena = ''
    loginSuccess.value =
      'Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.'
  } catch (error) {
    console.error('Error cambiando contraseña del cliente:', error)
    newPasswordError.value =
      'Ocurrió un error al actualizar la contraseña.'
  } finally {
    newPasswordLoading.value = false
  }
}

const detectRecoveryFromUrl = () => {
  const callbackUrl = new URL(window.location.href)
  const hashParams = new URLSearchParams(callbackUrl.hash.slice(1))
  const searchParams = callbackUrl.searchParams
  const errorCode =
    hashParams.get('error_code') ||
    searchParams.get('error_code')
  const errorDescription =
    hashParams.get('error_description') ||
    searchParams.get('error_description') ||
    ''
  const authError =
    hashParams.get('error') ||
    searchParams.get('error')

  if (errorCode || authError) {
    const expiredOrInvalid =
      errorCode === 'otp_expired' ||
      /expired|invalid/i.test(errorDescription)

    loginError.value = expiredOrInvalid
      ? 'El enlace de recuperación venció o ya fue utilizado. Solicita uno nuevo para cambiar tu contraseña.'
      : 'No fue posible validar el enlace de recuperación. Solicita uno nuevo e inténtalo otra vez.'

    for (const key of [
      'error',
      'error_code',
      'error_description',
      'error_uri'
    ]) {
      searchParams.delete(key)
    }

    callbackUrl.hash = ''
    window.history.replaceState(
      {},
      document.title,
      `${callbackUrl.pathname}${callbackUrl.search}`
    )
    return
  }

  const recoveryDetected =
    hashParams.get('type') === 'recovery' ||
    searchParams.get('type') === 'recovery'

  if (recoveryDetected) {
    isRecoveryMode.value = true
    showForgotPassword.value = false
  }
}

const {
  data: authListener
} = supabase.auth.onAuthStateChange(event => {
  if (event === 'PASSWORD_RECOVERY') {
    isRecoveryMode.value = true
    showForgotPassword.value = false
    newPasswordError.value = ''
    newPasswordSuccess.value = ''
  }
})

onMounted(detectRecoveryFromUrl)

onBeforeUnmount(() => {
  authListener?.subscription?.unsubscribe()
})


/* ============================================================
   INICIAR SESIÓN
============================================================ */

const handleClientLogin = async () => {
  if (loading.value) {
    return
  }


  loginError.value = ''
  loginSuccess.value = ''


  const correo =
    String(
      loginForm.value.correo || ''
    )
      .trim()
      .toLowerCase()


  const contrasena =
    String(
      loginForm.value.contrasena || ''
    )


  if (
    !correo ||
    !contrasena
  ) {
    loginError.value =
      'Por favor ingresa tu correo y contraseña.'

    return
  }


  loading.value = true


  try {
    const cliente =
      await iniciarSesionCliente(
        correo,
        contrasena
      )


    emit(
      'login-success',
      cliente
    )
  } catch (error) {
    console.error(
      'Error iniciando sesión como cliente:',
      error
    )


    const message =
      String(
        error?.message || ''
      )
        .trim()
        .toLowerCase()


    if (
      message.includes(
        'invalid login credentials'
      )
    ) {
      loginError.value =
        'Correo o contraseña incorrectos.'

      return
    }


    if (
      message.includes(
        'email not confirmed'
      )
    ) {
      loginError.value =
        'El correo electrónico todavía no ha sido confirmado.'

      return
    }


    if (
      message.includes(
        'cliente inactivo'
      )
    ) {
      loginError.value =
        'Tu cuenta se encuentra inactiva. Consulta con el taller.'

      return
    }


    if (
      message.includes(
        'no corresponde a un cliente'
      )
    ) {
      loginError.value =
        'Esta cuenta no corresponde a un cliente.'

      return
    }


    if (
      message.includes(
        'no se encontró el usuario'
      )
    ) {
      loginError.value =
        'La cuenta existe, pero no está vinculada correctamente con AutoMecanic.'

      return
    }


    if (
      message.includes(
        'no se encontró la información del cliente'
      )
    ) {
      loginError.value =
        'No se encontró la información del cliente asociada a esta cuenta.'

      return
    }


    loginError.value =
      error?.message ||
      'No fue posible iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>
.max-w-login {
  max-width: 440px;
  min-height: 590px;
  width: 100%;
}


.card-light-glass {
  background-color: rgba(255, 255, 255, 0.65) !important;
  backdrop-filter: blur(18px) !important;
  border: 1px solid rgba(255, 255, 255, 0.7) !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}


.card-dark-glass {
  background-color: rgba(15, 23, 42, 0.88) !important;
  backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9) !important;
}


.accent-bar-client {
  height: 6px;
  background: linear-gradient(
    90deg,
    #0dcaf0,
    #31d2f2,
    #0aa2c0
  );
}


.shadow-custom {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
}


.brand-logo-container {
  width: 75px;
  height: 75px;
  border: 2px solid #9eeaf9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #ffffff;
}


.brand-logo-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}


.input-group-custom {
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  overflow: hidden;
}


.btn-custom-client {
  background-color: #0dcaf0 !important;
  border-color: #0dcaf0 !important;
  color: #ffffff !important;
}


.btn-custom-client:hover:not(:disabled),
.btn-custom-client:focus-visible,
.btn-custom-client:active {
  background-color: #0aa2c0 !important;
  border-color: #0aa2c0 !important;
  color: #ffffff !important;
}


.btn-custom-client:disabled {
  cursor: not-allowed;
  background-color: #0dcaf0 !important;
  border-color: #0dcaf0 !important;
  color: #ffffff !important;
  opacity: 0.75;
}


.badge-info-subtle {
  background-color: rgba(207, 244, 252, 0.85);
  color: #055160;
}

.client-forgot-link {
  color: #087990;
}

.client-forgot-link:hover,
.client-forgot-link:focus-visible {
  color: #055160;
  text-decoration: underline !important;
}

.cursor-pointer {
  cursor: pointer;
}


.spin {
  display: inline-block;
  animation: client-spin 0.8s linear infinite;
}


@keyframes client-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>