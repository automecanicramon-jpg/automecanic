<template>
  <div
    :class="[
      'card login-card shadow-custom border-0 rounded-4 w-100 max-w-login position-relative overflow-hidden d-flex flex-column',
      isDarkMode
        ? 'card-dark-glass text-light'
        : 'card-light-glass text-dark'
    ]"
  >

    <div class="accent-bar-mechanic w-100"></div>

    <div
      class="card-body p-4 p-sm-5 d-flex flex-column justify-content-between flex-grow-1"
    >

      <div
        v-if="!showForgotPassword && !isRecoveryMode"
      >

        <div class="text-center mb-4">

          <div
            :class="[
              'badge border rounded-pill px-3 py-1.5 mb-3 fw-semibold small shadow-sm',
              isDarkMode
                ? 'badge-dark-subtle text-success border-success-subtle'
                : 'badge-success-subtle text-success border-success-subtle'
            ]"
          >
            <i class="bi bi-wrench-adjustable-circle-fill me-1"></i>
            Acceso Personal / Mecánico
          </div>


          <div
            :class="[
              'brand-logo-container mb-3 mx-auto shadow-sm',
              isDarkMode
                ? 'border-success-subtle bg-dark'
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
            Ingresa con tus credenciales dadas de alta
          </p>

        </div>


        <div
          v-if="loginSuccess"
          class="alert alert-success py-2 small text-center mb-3 rounded-3 shadow-sm"
          role="status"
        >
          <i class="bi bi-check-circle-fill me-1"></i>
          {{ loginSuccess }}
        </div>


        <!-- ERROR -->

        <div
          v-if="loginError"
          class="alert alert-danger py-2 small text-center mb-3 rounded-3 shadow-sm"
          role="alert"
        >
          <i class="bi bi-exclamation-triangle-fill me-1"></i>
          {{ loginError }}
        </div>


        <!-- FORMULARIO -->

        <form
          @submit.prevent="handleMechanicLogin"
          novalidate
        >

          <!-- CORREO -->

          <div class="mb-3">

            <label
              for="correoMec"
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
                id="correoMec"
                v-model="loginForm.correo"
                :class="[
                  'form-control border-start-0 ps-2 shadow-none py-2',
                  isDarkMode
                    ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700'
                    : 'bg-light'
                ]"
                placeholder="mecanico@automecanic.com"
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
              for="contrasenaMec"
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
                :type="
                  showPassword
                    ? 'text'
                    : 'password'
                "
                id="contrasenaMec"
                v-model="loginForm.contrasena"
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

          </div>


          <div class="d-flex justify-content-center mt-2">
            <button
              type="button"
              class="btn btn-link p-0 text-success fw-semibold small text-decoration-none"
              :disabled="loginLoading"
              @click="openForgotPassword"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>


          <!-- BOTÓN -->

          <div class="d-grid mt-4">

            <button
              type="submit"
              class="btn btn-success btn-custom-mechanic py-2 fw-bold shadow rounded-3 text-white"
              :disabled="loginLoading"
            >

              <template v-if="!loginLoading">

                Iniciar Sesión (Mecánico)

                <i
                  class="bi bi-box-arrow-in-right ms-1"
                ></i>

              </template>


              <template v-else>

                <span
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>

                Verificando...

              </template>

            </button>

          </div>

        </form>

      </div>


      <div
        v-else-if="showForgotPassword && !isRecoveryMode"
      >
        <div class="text-center mb-4">
          <div
            :class="[
              'badge border rounded-pill px-3 py-1.5 mb-3 fw-semibold small shadow-sm',
              isDarkMode
                ? 'badge-dark-subtle text-success border-success-subtle'
                : 'badge-success-subtle text-success border-success-subtle'
            ]"
          >
            <i class="bi bi-key-fill me-1"></i>
            Recuperación de contraseña
          </div>

          <div
            :class="[
              'brand-logo-container mb-3 mx-auto shadow-sm',
              isDarkMode ? 'border-success-subtle bg-dark' : ''
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
          <p :class="['small mb-0', isDarkMode ? 'text-slate-300' : 'text-muted']">
            {{
              resetSuccess
                ? 'Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.'
                : 'Ingresa el correo asociado a tu cuenta de mecánico y te enviaremos un enlace.'
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
              for="resetCorreoMecanico"
              :class="['form-label fw-semibold small', isDarkMode ? 'text-slate-300' : 'text-secondary']"
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
                id="resetCorreoMecanico"
                v-model.trim="resetEmail"
                type="email"
                autocomplete="email"
                autocapitalize="none"
                spellcheck="false"
                :class="[
                  'form-control border-start-0 ps-2 shadow-none py-2',
                  isDarkMode ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700' : 'bg-light'
                ]"
                placeholder="mecanico@automecanic.com"
                :disabled="resetLoading"
                required
              />
            </div>
          </div>

          <div class="d-grid mt-3">
            <button
              type="submit"
              class="btn btn-success btn-custom-mechanic py-2 fw-bold shadow rounded-3 text-white"
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
            class="btn btn-outline-success py-2 fw-semibold rounded-3"
            @click="sendAnotherRecoveryEmail"
          >
            <i class="bi bi-envelope me-1"></i>
            Enviar a otro correo
          </button>
        </div>

        <div class="d-grid mt-3">
          <button
            type="button"
            class="btn btn-success btn-custom-mechanic py-2 fw-bold shadow rounded-3 text-white"
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
                ? 'badge-dark-subtle text-success border-success-subtle'
                : 'badge-success-subtle text-success border-success-subtle'
            ]"
          >
            <i class="bi bi-shield-check me-1"></i>
            Nueva contraseña
          </div>

          <div
            :class="[
              'brand-logo-container mb-3 mx-auto shadow-sm',
              isDarkMode ? 'border-success-subtle bg-dark' : ''
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
          <p :class="['small mb-0', isDarkMode ? 'text-slate-300' : 'text-muted']">
            Ingresa y confirma la nueva contraseña de tu cuenta.
          </p>
        </div>

        <div v-if="newPasswordError" class="alert alert-danger py-2 small text-center mb-3 rounded-3 shadow-sm" role="alert">
          {{ newPasswordError }}
        </div>

        <form @submit.prevent="handleNewPassword" novalidate>
          <div class="mb-3">
            <label for="newMechanicPassword" :class="['form-label fw-semibold small', isDarkMode ? 'text-slate-300' : 'text-secondary']">
              Nueva contraseña
            </label>
            <div class="input-group input-group-custom">
              <span :class="['input-group-text border-end-0 ps-3', isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-light text-muted']">
                <i class="bi bi-lock"></i>
              </span>
              <input
                id="newMechanicPassword"
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
            <label for="confirmMechanicPassword" :class="['form-label fw-semibold small', isDarkMode ? 'text-slate-300' : 'text-secondary']">
              Confirmar contraseña
            </label>
            <div class="input-group input-group-custom">
              <span :class="['input-group-text border-end-0 ps-3', isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-light text-muted']">
                <i class="bi bi-lock-fill"></i>
              </span>
              <input
                id="confirmMechanicPassword"
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

          <p :class="['small mb-3', isDarkMode ? 'text-slate-300' : 'text-muted']">
            <i class="bi bi-info-circle me-1"></i>
            La contraseña debe contener al menos 8 caracteres.
          </p>

          <div class="d-grid">
            <button
              type="submit"
              class="btn btn-success btn-custom-mechanic py-2 fw-bold shadow rounded-3 text-white"
              :disabled="newPasswordLoading"
            >
              <template v-if="newPasswordLoading">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Actualizando...
              </template>
              <template v-else>
                Guardar nueva contraseña
                <i class="bi bi-check-circle ms-1"></i>
              </template>
            </button>
          </div>
        </form>

        <div class="d-grid mt-3">
          <button
            type="button"
            class="btn btn-outline-success py-2 fw-semibold rounded-3"
            :disabled="newPasswordLoading"
            @click="cancelRecoveryAndReturnToLogin"
          >
            <i class="bi bi-arrow-left me-2"></i>
            Cancelar y volver al inicio
          </button>
        </div>
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
          Portal Operativo de Taller
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

import {
  supabase
} from '../services/supabase.js'

import logoClaro from '../assets/logo-claro.jpg'
import logoOscuro from '../assets/logo-oscuro.jpg'


/* ============================================================
   PROPS
============================================================ */

const props = defineProps({
  isDarkMode: Boolean
})


/* ============================================================
   EMITS
============================================================ */

const emit = defineEmits([
  'login-success'
])


/* ============================================================
   ESTADOS
============================================================ */

const showPassword =
  ref(false)

const loginError =
  ref('')

const loginSuccess =
  ref('')

const loginLoading =
  ref(false)

const showForgotPassword =
  ref(false)

const resetEmail =
  ref('')

const resetError =
  ref('')

const resetSuccess =
  ref(false)

const resetLoading =
  ref(false)

const isRecoveryMode =
  ref(false)

const newPassword =
  ref('')

const confirmNewPassword =
  ref('')

const showNewPassword =
  ref(false)

const showConfirmPassword =
  ref(false)

const newPasswordError =
  ref('')

const newPasswordLoading =
  ref(false)


/* ============================================================
   FORMULARIO
============================================================ */

const loginForm = ref({
  correo: '',
  contrasena: ''
})


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
   RECUPERACIÓN DE CONTRASEÑA
============================================================ */

const openForgotPassword = () => {
  loginError.value = ''
  loginSuccess.value = ''
  resetError.value = ''
  resetSuccess.value = false
  resetEmail.value = loginForm.value.correo.trim()
  showForgotPassword.value = true
}

const returnToLogin = () => {
  showForgotPassword.value = false
  resetEmail.value = ''
  resetError.value = ''
  resetSuccess.value = false
  resetLoading.value = false
  loginError.value = ''
}

const sendAnotherRecoveryEmail = () => {
  resetEmail.value = ''
  resetError.value = ''
  resetSuccess.value = false
}

const handlePasswordReset = async () => {
  resetError.value = ''

  const email = resetEmail.value.trim().toLowerCase()
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
      `${window.location.origin}${window.location.pathname}?role=mechanic`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    })

    if (error) {
      console.error('Error enviando recuperación de contraseña del mecánico:', error)
      resetError.value =
        'No fue posible enviar el correo de recuperación. Inténtalo nuevamente.'
      return
    }

    resetSuccess.value = true
  } catch (error) {
    console.error('Error en recuperación de contraseña del mecánico:', error)
    resetError.value =
      'Ocurrió un error al enviar el correo de recuperación. Inténtalo nuevamente.'
  } finally {
    resetLoading.value = false
  }
}

const clearRecoveryUrl = () => {
  window.history.replaceState(
    {},
    document.title,
    `${window.location.origin}${window.location.pathname}?role=mechanic`
  )
}

const handleNewPassword = async () => {
  newPasswordError.value = ''

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
      console.error('Error actualizando contraseña del mecánico:', error)
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
        'La contraseña se actualizó, pero no fue posible cerrar la sesión temporal. Cancela y vuelve al inicio de sesión.'
      return
    }

    clearRecoveryUrl()
    isRecoveryMode.value = false
    showForgotPassword.value = false
    newPassword.value = ''
    confirmNewPassword.value = ''
    showNewPassword.value = false
    showConfirmPassword.value = false
    loginForm.value.contrasena = ''
    loginError.value = ''
    loginSuccess.value =
      'Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.'
  } catch (error) {
    console.error('Error cambiando contraseña del mecánico:', error)
    newPasswordError.value =
      'Ocurrió un error al actualizar la contraseña.'
  } finally {
    newPasswordLoading.value = false
  }
}

const cancelRecoveryAndReturnToLogin = async () => {
  try {
    const { error } = await supabase.auth.signOut({
      scope: 'local'
    })

    if (error) {
      console.error('Error cerrando la sesión temporal de recuperación:', error)
      newPasswordError.value =
        'No fue posible cerrar la sesión temporal. Inténtalo nuevamente.'
      return
    }

    clearRecoveryUrl()
    isRecoveryMode.value = false
    showForgotPassword.value = false
    newPassword.value = ''
    confirmNewPassword.value = ''
    showNewPassword.value = false
    showConfirmPassword.value = false
    newPasswordError.value = ''
  } catch (error) {
    console.error('Error cerrando la sesión temporal de recuperación:', error)
    newPasswordError.value =
      'Ocurrió un error al cerrar la sesión temporal. Inténtalo nuevamente.'
  }
}

const detectRecoveryFromUrl = () => {
  const callbackUrl = new URL(window.location.href)
  const hashParams = new URLSearchParams(callbackUrl.hash.slice(1))
  const searchParams = callbackUrl.searchParams
  const errorCode =
    hashParams.get('error_code') || searchParams.get('error_code')
  const errorDescription =
    hashParams.get('error_description') ||
    searchParams.get('error_description') ||
    ''
  const authError =
    hashParams.get('error') || searchParams.get('error')

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

const { data: authListener } = supabase.auth.onAuthStateChange(event => {
  if (event === 'PASSWORD_RECOVERY') {
    isRecoveryMode.value = true
    showForgotPassword.value = false
    newPasswordError.value = ''
  }
})

onMounted(detectRecoveryFromUrl)

onBeforeUnmount(() => {
  authListener?.subscription?.unsubscribe()
})


/* ============================================================
   LOGIN DEL MECÁNICO
============================================================ */

const handleMechanicLogin = async () => {

  loginError.value = ''
  loginSuccess.value = ''


  const correo =
    loginForm.value.correo
      .trim()
      .toLowerCase()

  const contrasena =
    loginForm.value.contrasena


  /* ----------------------------------------------------------
     VALIDAR CAMPOS
  ---------------------------------------------------------- */

  if (
    !correo ||
    !contrasena
  ) {

    loginError.value =
      'Completa tus credenciales de acceso.'

    return
  }


  loginLoading.value = true


  try {

    /* --------------------------------------------------------
       AUTENTICACIÓN REAL CON SUPABASE
    -------------------------------------------------------- */

    const {
      data: authData,
      error: authError
    } =
      await supabase.auth.signInWithPassword({

        email:
          correo,

        password:
          contrasena

      })


    /* --------------------------------------------------------
       ERROR DE AUTENTICACIÓN
    -------------------------------------------------------- */

    if (
      authError
    ) {

      console.error(
        'Error de autenticación del mecánico:',
        authError
      )

      loginError.value =
        'Correo o contraseña incorrectos.'

      return
    }


    /* --------------------------------------------------------
       COMPROBAR USUARIO AUTENTICADO
    -------------------------------------------------------- */

    if (
      !authData?.user
    ) {

      loginError.value =
        'No se encontró el usuario en el sistema.'

      return
    }


    /* --------------------------------------------------------
       OBTENER PERFIL
    -------------------------------------------------------- */

    const {
      data: userData,
      error: userError
    } =
      await supabase
        .from('usuario')
        .select('*')
        .eq(
          'auth_id',
          authData.user.id
        )
        .single()


    /* --------------------------------------------------------
       PERFIL NO ENCONTRADO
    -------------------------------------------------------- */

    if (
      userError ||
      !userData
    ) {

      console.error(
        'Error buscando perfil del mecánico:',
        userError
      )

      loginError.value =
        'La cuenta autenticada no tiene un perfil configurado en AutoMecanic.'

      await supabase.auth.signOut()

      return
    }


    /* --------------------------------------------------------
       VALIDAR ROL

       1 = Administrador
       2 = Mecánico
       3 = Cliente
    -------------------------------------------------------- */

    const idRol =
      Number(userData.id_rol)


    if (
      idRol !== 2
    ) {

      console.warn(
        'Acceso de mecánico rechazado. Rol:',
        idRol
      )

      loginError.value =
        'Esta cuenta no tiene permisos de mecánico. Utiliza el acceso correspondiente a tu tipo de usuario.'

      await supabase.auth.signOut()

      return
    }


    /* --------------------------------------------------------
       COMPROBAR QUE REALMENTE EXISTA EN MECANICO
    -------------------------------------------------------- */

    const {
      data: mecanicoData,
      error: mecanicoError
    } =
      await supabase
        .from('mecanico')
        .select(`
          id_mecanico,
          id_usuario,
          especialidad
        `)
        .eq(
          'id_usuario',
          userData.id_usuario
        )
        .single()


    /* --------------------------------------------------------
       NO EXISTE REGISTRO DE MECÁNICO
    -------------------------------------------------------- */

    if (
      mecanicoError ||
      !mecanicoData
    ) {

      console.error(
        'El usuario tiene rol de mecánico, pero no existe en la tabla mecanico:',
        mecanicoError
      )

      loginError.value =
        'La cuenta tiene rol de mecánico, pero no existe un registro de mecánico asociado.'

      await supabase.auth.signOut()

      return
    }


    /* --------------------------------------------------------
       CONSTRUIR OBJETO FINAL

       Se conserva la información de usuario y se
       agregan los datos propios del mecánico.

       Esto permite que MechanicDashboard pueda utilizar:

         mecanico.nombre
         mecanico.apellido_paterno
         mecanico.especialidad
         mecanico.id_mecanico
    -------------------------------------------------------- */

    const mecanicoAutenticado = {

      ...userData,

      id_rol:
        Number(userData.id_rol),

      id_mecanico:
        mecanicoData.id_mecanico,

      especialidad:
        mecanicoData.especialidad

    }


    /* --------------------------------------------------------
       LOGIN AUTORIZADO
    -------------------------------------------------------- */

    emit(
      'login-success',
      mecanicoAutenticado
    )


  } catch (error) {

    console.error(
      'Error al iniciar sesión como mecánico:',
      error
    )

    loginError.value =
      'Ocurrió un error al conectar con el servidor.'


    /*
      SEGURIDAD:
      Si ocurrió un error después de autenticarnos,
      intentamos cerrar la sesión para no dejar
      una sesión parcialmente autorizada.
    */

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

</script>


<style scoped>

.max-w-login {
  max-width: 440px;
  min-height: 590px;
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


.accent-bar-mechanic {
  height: 6px;

  background:
    linear-gradient(
      90deg,
      #10b981,
      #34d399,
      #059669
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
    2px solid #a7f3d0;

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


.btn-custom-mechanic {
  background-color:
    #10b981;

  border:
    none;
}


.btn-custom-mechanic:hover {
  background-color:
    #059669;
}


.btn-custom-mechanic:disabled {
  opacity:
    0.7;

  cursor:
    not-allowed;
}


.badge-success-subtle {
  background-color:
    rgba(209, 250, 229, 0.85);

  color:
    #047857;
}


.badge-dark-subtle {
  background-color:
    rgba(16, 185, 129, 0.2);

  color:
    #34d399;

  border-color:
    rgba(52, 211, 153, 0.35) !important;
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