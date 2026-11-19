<template>
  <div class="push-notifications-control">
    <button
      type="button"
      class="push-notifications-control__button"
      :disabled="loading || !supported"
      @click="toggleNotifications"
    >
      <i
        class="bi"
        :class="enabled ? 'bi-bell-slash' : 'bi-bell'"
      ></i>
      {{ buttonLabel }}
    </button>

    <small
      v-if="message"
      class="push-notifications-control__message"
      role="status"
    >
      {{ message }}
    </small>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  activarNotificacionesPush,
  desactivarNotificacionesPush,
  obtenerSuscripcionPush,
  supportsPushNotifications
} from '../services/pushNotificationService.js'
import { supabase } from '../services/supabase.js'

const props = defineProps({
  userId: {
    type: [Number, String],
    required: true
  }
})

const supported = supportsPushNotifications()
const loading = ref(false)
const enabled = ref(false)
const message = ref(
  supported
    ? ''
    : 'Instala AutoMecanic en la pantalla de inicio y usa un navegador compatible para habilitar push.'
)
const subscription = ref(null)

const buttonLabel = computed(() => {
  if (!supported) {
    return 'Notificaciones no disponibles'
  }

  if (loading.value) {
    return 'Actualizando notificaciones...'
  }

  return enabled.value
    ? 'Desactivar notificaciones'
    : 'Activar notificaciones'
})

onMounted(async () => {
  if (!supported) {
    return
  }

  try {
    subscription.value =
      await obtenerSuscripcionPush()

    if (
      subscription.value &&
      Notification.permission === 'granted'
    ) {
      const { data, error } = await supabase
        .from('push_subscription')
        .select('id_push_subscription')
        .eq('id_usuario', props.userId)
        .eq('endpoint', subscription.value.endpoint)
        .maybeSingle()

      if (error) {
        throw error
      }

      enabled.value = Boolean(data)
    }
  } catch (error) {
    console.error(
      'No fue posible consultar la suscripción de notificaciones:',
      error
    )
    message.value =
      'No se pudo consultar el estado de las notificaciones.'
  }
})

const toggleNotifications = async () => {
  if (loading.value) {
    return
  }

  loading.value = true
  message.value = ''

  try {
    if (enabled.value && subscription.value) {
      await desactivarNotificacionesPush(
        props.userId,
        subscription.value
      )
      subscription.value = null
      enabled.value = false
      message.value = 'Notificaciones desactivadas en este dispositivo.'
      return
    }

    subscription.value =
      await activarNotificacionesPush(props.userId)
    enabled.value = true
    message.value = 'Notificaciones activadas en este dispositivo.'
  } catch (error) {
    console.error(
      'No fue posible actualizar las notificaciones push:',
      error
    )
    message.value =
      error?.message ||
      'No fue posible configurar las notificaciones.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.push-notifications-control {
  padding: 0.35rem 0;
}

.push-notifications-control__button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.65rem;
  border: 0;
  padding: 0.55rem 0.75rem;
  color: inherit;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.push-notifications-control__button:hover:not(:disabled) {
  background: rgba(100, 116, 139, 0.12);
}

.push-notifications-control__button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.push-notifications-control__message {
  display: block;
  padding: 0.15rem 0.75rem 0.35rem;
  color: #64748b;
  line-height: 1.4;
  white-space: normal;
}
</style>
