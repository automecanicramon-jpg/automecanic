<script setup>
import {
  ref,
  onMounted
} from 'vue'

import './styles/login-fields.css'

import AdminLogin from './components/AdminLogin.vue'
import MechanicLogin from './components/MechanicLogin.vue'
import ClientLogin from './components/ClientLogin.vue'

import AdminDashboard from './components/AdminDashboard.vue'
import MechanicDashboard from './components/MechanicDashboard.vue'
import ClientDashboard from './components/ClientDashboard.vue'

import { supabase } from './services/supabase.js'


/* ============================================================
   ROL INICIAL SOLAMENTE PARA SELECCIONAR EL LOGIN

   IMPORTANTE:

   El parámetro ?role= NO determina el rol autenticado.

   Solamente permite abrir inicialmente una pantalla
   de inicio de sesión concreta.

   El rol real siempre se obtiene desde Supabase.
============================================================ */

const initialRole =
  new URLSearchParams(
    window.location.search
  ).get('role')


const currentTab = ref(
  initialRole === 'client'
    ? 'client'
    : initialRole === 'mechanic'
      ? 'mechanic'
      : 'admin'
)


const isDarkMode =
  ref(false)


const loggedUser =
  ref(null)


/*
  Indica que App.vue todavía está preparando
  la pantalla inicial.

  Evita mostrar momentáneamente el login antes
  de restaurar las preferencias iniciales.
*/

const isSessionChecking =
  ref(true)


/* ================================
   TEMA GLOBAL
   iOS + Android + PC + PWA
================================ */

const updateRootBackground = () => {

  const backgroundColor =
    isDarkMode.value
      ? '#030508'
      : '#f1f5f9'


  const colorScheme =
    isDarkMode.value
      ? 'dark'
      : 'light'


  /* ==============================
     HTML / BODY
  ============================== */

  document.documentElement
    .style.backgroundColor =
      backgroundColor


  document.body
    .style.backgroundColor =
      backgroundColor


  /* ==============================
     COLOR SCHEME NATIVO

     Ayuda a Safari, Chrome, Edge
     y controles nativos.
  ============================== */

  document.documentElement
    .style.colorScheme =
      colorScheme


  /* ==============================
     THEME COLOR

     Sincroniza:
     - Safari
     - Chrome
     - Android
     - PWA
     - navegadores compatibles
  ============================== */

  const themeColorMetas =
    document.querySelectorAll(
      'meta[name="theme-color"]'
    )


  themeColorMetas.forEach(
    meta => {

      meta.setAttribute(
        'content',
        backgroundColor
      )

    }
  )


  /* ==============================
     MARCA GLOBAL DEL TEMA
  ============================== */

  document.documentElement
    .setAttribute(
      'data-theme',
      colorScheme
    )


  /* ==============================
     GUARDAR PREFERENCIA

     Cuando cierres y abras la PWA
     conservará el tema.
  ============================== */

  localStorage.setItem(
    'automecanic-theme',
    colorScheme
  )

}


/* ================================
   CAMBIO DE MODO OSCURO / CLARO
================================ */

const toggleDarkMode = () => {

  isDarkMode.value =
    !isDarkMode.value


  updateRootBackground()

}


/* ================================
   ROLES DE LA BASE DE DATOS

   1 = Administrador
   2 = Mecánico
   3 = Cliente
================================ */

const ROLE_ADMIN = 1
const ROLE_MECHANIC = 2
const ROLE_CLIENT = 3


/* ================================
   RELACIÓN PANEL / ROL
================================ */

const roleByPanel = {

  admin:
    ROLE_ADMIN,

  mechanic:
    ROLE_MECHANIC,

  client:
    ROLE_CLIENT

}


/* ============================================================
   OBTENER ROL DE UN USUARIO
============================================================ */

/*
  Esta función obtiene el perfil real asociado
  al usuario autenticado de Supabase.

  NO confiamos en:
    - ?role=...
    - currentTab
    - el panel seleccionado

  El rol válido viene de la tabla usuario.
*/

const obtenerPerfilAutenticado =
  async authUserId => {

    if (!authUserId) {
      return null
    }


    const {
      data: userData,
      error: userError
    } =
      await supabase
        .from('usuario')
        .select(`
          *,
          rol(*)
        `)
        .eq(
          'auth_id',
          authUserId
        )
        .single()


    if (
      userError ||
      !userData
    ) {

      console.error(
        'No fue posible obtener el perfil del usuario autenticado:',
        userError
      )

      return null
    }


    const role =
      Number(
        userData?.id_rol ??
        userData?.rol?.id_rol
      )


    if (
      ![
        ROLE_ADMIN,
        ROLE_MECHANIC,
        ROLE_CLIENT
      ].includes(role)
    ) {

      console.error(
        'El usuario autenticado tiene un rol inválido:',
        role
      )

      return null
    }


    /*
      El usuario administrador solamente necesita
      la información de usuario.
    */

    if (
      role === ROLE_ADMIN
    ) {

      return {

        ...userData,

        id_rol:
          role

      }

    }


    /* ========================================================
       MECÁNICO

       Al recargar la página necesitamos reconstruir
       también los datos que MechanicLogin agrega:
         - id_mecanico
         - especialidad
    ======================================================== */

    if (
      role === ROLE_MECHANIC
    ) {

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


      if (
        mecanicoError ||
        !mecanicoData
      ) {

        console.error(
          'El usuario tiene rol de mecánico, pero no existe un registro válido en mecanico:',
          mecanicoError
        )

        return null
      }


      return {

        ...userData,

        id_rol:
          role,

        id_mecanico:
          mecanicoData.id_mecanico,

        especialidad:
          mecanicoData.especialidad

      }

    }


    /* ========================================================
       CLIENTE

       Recuperamos el registro de cliente asociado
       al usuario.

       Se conserva toda la información de usuario y
       se agregan los datos propios del cliente.
    ======================================================== */

    if (
      role === ROLE_CLIENT
    ) {

      const {
        data: clienteData,
        error: clienteError
      } =
        await supabase
          .from('cliente')
          .select('*')
          .eq(
            'id_usuario',
            userData.id_usuario
          )
          .single()


      if (
        clienteError ||
        !clienteData
      ) {

        console.error(
          'El usuario tiene rol de cliente, pero no existe un registro válido en cliente:',
          clienteError
        )

        return null
      }


      return {

        ...userData,

        ...clienteData,

        id_rol:
          role

      }

    }


    return null

  }


/* ============================================================
   DETERMINAR PANEL SEGÚN ROL REAL
============================================================ */

const panelByRole = role => {

  switch (
    Number(role)
  ) {

    case ROLE_ADMIN:
      return 'admin'

    case ROLE_MECHANIC:
      return 'mechanic'

    case ROLE_CLIENT:
      return 'client'

    default:
      return null

  }

}


/* ============================================================
   COMPROBAR SI LA URL CORRESPONDE A RECUPERACIÓN
============================================================ */

/*
  ClientLogin utiliza Supabase Auth para recuperación
  de contraseña.

  Durante ese proceso existe una sesión temporal.

  NO debemos convertir esa sesión temporal en una
  sesión normal del dashboard.
*/

const isPasswordRecoveryUrl = () => {

  const currentUrl =
    new URL(
      window.location.href
    )


  const hashParams =
    new URLSearchParams(
      currentUrl.hash.slice(1)
    )


  const searchParams =
    currentUrl.searchParams


  const recoveryDetected =
    hashParams.get('type') === 'recovery' ||
    searchParams.get('type') === 'recovery'


  return recoveryDetected

}


/* ============================================================
   RESTAURAR SESIÓN DE SUPABASE
============================================================ */

/*
  Esta función se ejecuta cuando la aplicación inicia.

  Casos:

  1. No existe sesión:
       → mostrar login normal.

  2. Existe sesión:
       → consultar usuario.
       → obtener rol real.
       → abrir solamente su panel.

  3. Sesión inválida:
       → cerrar sesión.
       → permanecer en login.

  4. Recuperación de contraseña:
       → NO abrir dashboard.
       → permitir que ClientLogin maneje recuperación.
*/

const restoreAuthenticatedSession =
  async () => {

    try {

      /*
        No restaurar automáticamente una sesión
        durante el flujo de recuperación de contraseña.
      */

      if (
        isPasswordRecoveryUrl()
      ) {

        loggedUser.value =
          null

        return
      }


      /* -----------------------------------------------
         OBTENER SESIÓN ACTUAL
      ----------------------------------------------- */

      const {
        data: sessionData,
        error: sessionError
      } =
        await supabase.auth.getSession()


      if (
        sessionError
      ) {

        console.error(
          'Error obteniendo la sesión actual:',
          sessionError
        )

        loggedUser.value =
          null

        return
      }


      const session =
        sessionData?.session


      /*
        No existe sesión activa.
      */

      if (
        !session?.user
      ) {

        loggedUser.value =
          null

        return
      }


      /* -----------------------------------------------
         OBTENER PERFIL REAL
      ----------------------------------------------- */

      const authenticatedUser =
        await obtenerPerfilAutenticado(
          session.user.id
        )


      /*
        Si no existe perfil válido,
        la sesión no puede utilizar AutoMecanic.
      */

      if (
        !authenticatedUser
      ) {

        console.error(
          'La sesión de Supabase no tiene un perfil válido en AutoMecanic.'
        )


        try {

          await supabase.auth.signOut()

        } catch (signOutError) {

          console.error(
            'Error cerrando sesión inválida:',
            signOutError
          )

        }


        loggedUser.value =
          null

        return
      }


      /* -----------------------------------------------
         DETERMINAR PANEL REAL
      ----------------------------------------------- */

      const role =
        Number(
          authenticatedUser?.id_rol ??
          authenticatedUser?.rol?.id_rol
        )


      const authenticatedPanel =
        panelByRole(role)


      if (
        !authenticatedPanel
      ) {

        console.error(
          'No existe un panel asociado al rol:',
          role
        )


        try {

          await supabase.auth.signOut()

        } catch (signOutError) {

          console.error(
            'Error cerrando sesión con rol inválido:',
            signOutError
          )

        }


        loggedUser.value =
          null

        return
      }


      /*
        IMPORTANTE:

        El panel se determina mediante el rol real.

        El parámetro ?role= deja de tener autoridad
        cuando existe una sesión autenticada.
      */

      currentTab.value =
        authenticatedPanel


      /*
        Finalmente guardamos el usuario autorizado.
      */

      loggedUser.value =
        authenticatedUser

    } catch (error) {

      console.error(
        'Error restaurando la sesión de AutoMecanic:',
        error
      )

      loggedUser.value =
        null

    }

  }


/* ============================================================
   LOGIN / SEGURIDAD DE ROLES
============================================================ */

/*
  Esta función recibe la información que
  devuelve cada componente de Login.

  Antes de permitir que se muestre un dashboard,
  se comprueba que el id_rol corresponda
  exactamente al panel seleccionado.
*/

const handleLoginSuccess =
  async userData => {

    /*
      Obtener el rol.

      Se aceptan ambas posibilidades porque
      dependiendo del servicio de login puede
      venir directamente como:

        userData.id_rol

      o dentro de:

        userData.rol.id_rol
    */

    const role =
      Number(
        userData?.id_rol ??
        userData?.rol?.id_rol
      )


    /*
      Obtener el rol que requiere el panel actual.
    */

    const expectedRole =
      roleByPanel[
        currentTab.value
      ]


    /*
      SEGUNDA CAPA DE SEGURIDAD

      Aunque algún componente de login llegara
      a devolver una cuenta válida, App.vue
      NO permitirá mostrar un panel distinto
      al rol real del usuario.
    */

    if (
      !role ||
      role !== expectedRole
    ) {

      console.error(
        'Intento de acceso a panel no autorizado:',
        {
          panel:
            currentTab.value,

          rolDetectado:
            role,

          rolEsperado:
            expectedRole
        }
      )


      /*
        Si el rol no corresponde:

        1. Cerramos la sesión de Supabase.
        2. Eliminamos el usuario local.
        3. No mostramos ningún dashboard.
      */

      try {

        await supabase.auth.signOut()

      } catch (error) {

        console.error(
          'No fue posible cerrar la sesión no autorizada:',
          error
        )

      }


      loggedUser.value =
        null

      return
    }


    /*
      SOLAMENTE SI EL ROL ES CORRECTO
      se permite guardar el usuario autenticado.
    */

    loggedUser.value =
      userData

  }


/* ============================================================
   CERRAR SESIÓN
============================================================ */

const handleLogout = () => {

  /*
    El dashboard se encarga de cerrar
    la sesión de Supabase.

    Aquí únicamente limpiamos el usuario
    almacenado en App.vue.
  */

  loggedUser.value =
    null

}


/* ============================================================
   CAMBIO DE ROL
============================================================ */

const switchTab =
  async tab => {

    /*
      Si existe una sesión activa,
      NO permitimos cambiar de panel.

      Esto evita que un usuario autenticado
      intente pasar directamente de:

        Administrador → Cliente
        Administrador → Mecánico
        Mecánico → Administrador
        Mecánico → Cliente
        Cliente → Administrador
        Cliente → Mecánico
    */

    if (
      loggedUser.value
    ) {

      const role =
        Number(
          loggedUser.value?.id_rol ??
          loggedUser.value?.rol?.id_rol
        )


      const expectedRole =
        roleByPanel[tab]


      /*
        Si el panel solicitado no corresponde
        al rol autenticado, simplemente se ignora
        la solicitud.
      */

      if (
        !expectedRole ||
        role !== expectedRole
      ) {

        return

      }


      /*
        Si llegara a solicitarse el mismo panel,
        tampoco es necesario modificar nada.
      */

      return

    }


    /*
      Si todavía NO hay sesión iniciada,
      sí permitimos seleccionar el tipo de acceso.
    */

    currentTab.value =
      tab


    loggedUser.value =
      null

  }


/* ============================================================
   INICIALIZAR APLICACIÓN
============================================================ */

/*
  Se utiliza un único onMounted para:

   1. Restaurar el tema.
   2. Cerrar la sesión local anterior para que
      el login aparezca en cada nuevo arranque.
*/

onMounted(
  async () => {

    /* -----------------------------------------------
       RESTAURAR TEMA
    ----------------------------------------------- */

    const savedTheme =
      localStorage.getItem(
        'automecanic-theme'
      )


    if (
      savedTheme === 'dark'
    ) {

      isDarkMode.value =
        true

    }


    if (
      savedTheme === 'light'
    ) {

      isDarkMode.value =
        false

    }


    updateRootBackground()


    /* -----------------------------------------------
       MOSTRAR LOGIN AL INICIAR
    ----------------------------------------------- */

    /*
      Supabase conserva la sesión entre aperturas.
      La cerramos localmente para evitar entrar
      directamente al dashboard del último usuario.
      No se toca la sesión temporal de recuperación
      de contraseña.
    */

    if (!isPasswordRecoveryUrl()) {
      try {
        const { error } = await supabase.auth.signOut({
          scope: 'local'
        })

        if (error) {
          console.error(
            'No fue posible cerrar la sesión local al iniciar:',
            error
          )
        }
      } catch (error) {
        console.error(
          'Error preparando el inicio de sesión:',
          error
        )
      }
    }

    loggedUser.value = null


    /*
      La comprobación inicial terminó.
    */

    isSessionChecking.value =
      false

  }
)

</script>


<template>

<div
  :class="[
    'app-container d-flex flex-column position-relative',
    loggedUser ? 'dashboard-mode' : 'login-mode'
  ]"
>

    <!-- =========================================
         FONDO UNIVERSAL
    ========================================== -->

    <div
      :class="[
        'app-background position-fixed top-0 start-0 w-100 h-100',
        isDarkMode ? 'dark-bg-effect' : 'light-bg-effect'
      ]"
    ></div>


    <!-- =========================================
         BOTÓN DE MODO OSCURO / CLARO

         Se mantiene en App.vue para que todos
         los módulos utilicen el mismo estado.

         Ahora se ubica abajo a la derecha para
         no interferir con el dashboard.
    ========================================== -->

    <button
      @click="toggleDarkMode"
      :class="[
        'theme-toggle-btn',
        isDarkMode
          ? 'theme-dark'
          : 'theme-light'
      ]"
      :title="
        isDarkMode
          ? 'Cambiar a modo claro'
          : 'Cambiar a modo oscuro'
      "
      :aria-label="
        isDarkMode
          ? 'Cambiar a modo claro'
          : 'Cambiar a modo oscuro'
      "
    >

      <i
        :class="
          isDarkMode
            ? 'bi bi-sun-fill'
            : 'bi bi-moon-fill'
        "
      ></i>

    </button>


    <!-- =========================================
         NAVEGACIÓN SUPERIOR DE ROLES

         Solo aparece cuando no hay un usuario
         autenticado y terminó la comprobación
         inicial de sesión.
    ========================================== -->

    <div
      v-if="
        !loggedUser &&
        !isSessionChecking
      "
      class="nav-pills-container p-1 rounded-pill shadow-sm d-flex mb-3 border mt-4 mt-sm-0 z-2 nav-exact-width"
      :class="
        isDarkMode
          ? 'bg-dark border-secondary'
          : 'bg-white border-light-subtle'
      "
    >

      <!-- ADMIN -->

      <button
        @click="switchTab('admin')"
        :class="[
          'btn rounded-pill py-1.5 fw-semibold small transition-all text-center nav-role-btn',
          currentTab === 'admin'
            ? 'btn-primary shadow-sm text-white'
            : (
                isDarkMode
                  ? 'text-light border-0 bg-transparent'
                  : 'text-muted border-0 bg-transparent'
              )
        ]"
      >

        <i class="bi bi-shield-lock-fill me-1"></i>

        Admin

      </button>


      <!-- MECÁNICO -->

      <button
        @click="switchTab('mechanic')"
        :class="[
          'btn rounded-pill py-1.5 fw-semibold small transition-all text-center nav-role-btn',
          currentTab === 'mechanic'
            ? 'btn-success shadow-sm text-white'
            : (
                isDarkMode
                  ? 'text-light border-0 bg-transparent'
                  : 'text-muted border-0 bg-transparent'
              )
        ]"
      >

        <i class="bi bi-wrench me-1"></i>

        Mecánico

      </button>


      <!-- CLIENTE -->

      <button
        @click="switchTab('client')"
        :class="[
          'btn rounded-pill py-1.5 fw-semibold small transition-all text-center nav-role-btn',
          currentTab === 'client'
            ? 'btn-info shadow-sm text-white'
            : (
                isDarkMode
                  ? 'text-light border-0 bg-transparent'
                  : 'text-muted border-0 bg-transparent'
              )
        ]"
      >

        <i class="bi bi-car-front-fill me-1"></i>

        Cliente

      </button>

    </div>


    <!-- =========================================
         CONTENIDO DINÁMICO

         Se mantiene la inyección de isDarkMode
         hacia cada dashboard/login.
    ========================================== -->

    <div
      :class="[
        'w-100 d-flex flex-grow-1 z-2',
        loggedUser
          ? 'dashboard-host'
          : 'justify-content-center align-items-center'
      ]"
    >

      <!-- =====================================
           ADMINISTRADOR
      ====================================== -->

      <template v-if="currentTab === 'admin'">

        <AdminDashboard
          v-if="loggedUser"
          :isDarkMode="isDarkMode"
          :admin="loggedUser"
          @logout="handleLogout"
        />

        <AdminLogin
          v-else-if="!isSessionChecking"
          :isDarkMode="isDarkMode"
          @login-success="handleLoginSuccess"
        />

      </template>


      <!-- =====================================
           MECÁNICO
      ====================================== -->

      <template
        v-else-if="currentTab === 'mechanic'"
      >

        <MechanicDashboard
          v-if="loggedUser"
          :isDarkMode="isDarkMode"
          :mechanic="loggedUser"
          @logout="handleLogout"
        />

        <MechanicLogin
          v-else-if="!isSessionChecking"
          :isDarkMode="isDarkMode"
          @login-success="handleLoginSuccess"
        />

      </template>


      <!-- =====================================
           CLIENTE
      ====================================== -->

      <template
        v-else-if="currentTab === 'client'"
      >

        <ClientDashboard
          v-if="loggedUser"
          :isDarkMode="isDarkMode"
          :cliente="loggedUser"
          @logout="handleLogout"
        />

        <ClientLogin
          v-else-if="!isSessionChecking"
          :isDarkMode="isDarkMode"
          @login-success="handleLoginSuccess"
        />

      </template>

    </div>

  </div>

</template>


<style>

/* =========================================
   CONFIGURACIÓN GENERAL
========================================= */

html,
body,
#app {

  margin: 0;
  padding: 0;

  width: 100%;

  min-height: 100vh;
  min-height: 100dvh;

  overflow-x: hidden;

}


html[data-theme="light"],
html[data-theme="light"] body,
html[data-theme="light"] #app {

  background-color:
    #f1f5f9;

}


html[data-theme="dark"],
html[data-theme="dark"] body,
html[data-theme="dark"] #app {

  background-color:
    #030508;

}


.app-container {

  width: 100%;

  min-width: 0;

  min-height: 100vh;
  min-height: 100dvh;

  position: relative;

  box-sizing: border-box;

  z-index: 1;

  overflow-x: hidden;

}


/* =========================================
   LOGIN

   Mantiene separación segura alrededor
========================================= */

.app-container.login-mode {

  align-items: center;
  justify-content: center;

  padding-top:
    max(
      16px,
      env(safe-area-inset-top, 0px)
    );

  padding-right:
    max(
      16px,
      env(safe-area-inset-right, 0px)
    );

  padding-bottom:
    max(
      16px,
      env(safe-area-inset-bottom, 0px)
    );

  padding-left:
    max(
      16px,
      env(safe-area-inset-left, 0px)
    );

}


/* =========================================
   DASHBOARD

   Ocupa todo el viewport
========================================= */

.app-container.dashboard-mode {

  align-items: stretch;
  justify-content: flex-start;

  padding: 0;

}


/* =========================================
   CONTENEDOR DEL DASHBOARD
========================================= */

.dashboard-host {

  width: 100%;

  min-width: 0;

  min-height: 100vh;
  min-height: 100dvh;

  align-items: stretch;
  justify-content: flex-start;

}


.dashboard-host > * {

  width: 100%;

  min-width: 0;

}


/* =========================================
   FONDO GLOBAL

   iOS + ANDROID + TABLET + PC
========================================= */

.app-background {

  position: fixed !important;

  inset: 0 !important;

  width: 100vw !important;

  height: 100vh;
  height: 100dvh;

  background-image:
    url('./assets/fondo-taller.jpg');

  background-size:
    cover;

  background-position:
    center;

  background-repeat:
    no-repeat;

  z-index: -1;

  pointer-events: none;

  transition:
    background-color 0.4s ease,
    filter 0.4s ease;

}


.light-bg-effect {

  background-color:
    rgba(241, 245, 249, 0.78);

  filter:
    brightness(100%);

}


.dark-bg-effect {

  background-color:
    rgba(3, 5, 8, 0.98);

  filter:
    brightness(20%) contrast(120%);

}


/* =========================================
   NAVEGACIÓN DE ROLES
========================================= */

.nav-exact-width {

  width: 100%;

  max-width: 380px;

}


.nav-role-btn {

  flex: 1;

  white-space: nowrap;

}


.transition-all {

  transition:
    all 0.25s ease;

}


/* =========================================
   BOTÓN DE MODO OSCURO / CLARO
========================================= */

/*
  Se utiliza position: fixed para que el botón
  permanezca disponible aunque el dashboard
  tenga scroll.
*/

.theme-toggle-btn {

  position: fixed;

  right: 24px;
  bottom: 24px;

  width: 46px;
  height: 46px;

  border: none;
  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 9999;

  cursor: pointer;

  font-size: 18px;

  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background-color 0.3s ease,
    color 0.3s ease;

  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.18);

}


/* Modo claro */

.theme-light {

  background-color:
    #ffffff;

  color:
    #1f2937;

  border:
    1px solid rgba(15, 23, 42, 0.08);

}


/* Modo oscuro */

.theme-dark {

  background-color:
    #1e293b;

  color:
    #facc15;

  border:
    1px solid rgba(255, 255, 255, 0.08);

  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.45);

}


/* Animación al pasar el cursor */

.theme-toggle-btn:hover {

  transform:
    translateY(-3px) scale(1.05);

  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.25);

}


/* Efecto al presionar */

.theme-toggle-btn:active {

  transform:
    scale(0.94);

}


/* =========================================
   MÓVILES
========================================= */

@media (max-width: 575.98px) {

  .theme-toggle-btn {

    width: 42px;
    height: 42px;

    right: 16px;
    bottom: 16px;

    font-size: 16px;

  }


  .nav-exact-width {

    max-width: 100%;

  }

}


/* =========================================
   TABLETS
========================================= */

@media (min-width: 576px) and (max-width: 991.98px) {

  .theme-toggle-btn {

    right: 20px;
    bottom: 20px;

  }

}


/* =========================================
   PANTALLAS GRANDES
========================================= */

@media (min-width: 1200px) {

  .theme-toggle-btn {

    right: 30px;
    bottom: 30px;

  }

}


/* =========================================
   ACCESIBILIDAD
========================================= */

.theme-toggle-btn:focus-visible {

  outline:
    3px solid rgba(13, 110, 253, 0.35);

  outline-offset:
    3px;

}


/* =========================================
   CURSOR
========================================= */

.cursor-pointer {

  cursor: pointer;

}

</style>