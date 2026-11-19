import { supabase } from './supabase.js'

const getApplicationKey = () =>
  import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

const urlBase64ToUint8Array = value => {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = `${value}${padding}`
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const rawData = window.atob(base64)

  return Uint8Array.from(
    [...rawData].map(character => character.charCodeAt(0))
  )
}

export const supportsPushNotifications = () =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

export const obtenerSuscripcionPush = async () => {
  if (!supportsPushNotifications()) {
    return null
  }

  const registration =
    await navigator.serviceWorker.getRegistration('/')

  if (!registration) {
    return null
  }

  return registration.pushManager.getSubscription()
}

export const activarNotificacionesPush = async idUsuario => {
  if (!supportsPushNotifications()) {
    throw new Error(
      'Este navegador no admite notificaciones push. En iPhone o iPad, instala primero AutoMecanic en la pantalla de inicio.'
    )
  }

  const applicationKey = getApplicationKey()

  if (!applicationKey) {
    throw new Error(
      'Falta configurar la clave pública VAPID para notificaciones.'
    )
  }

  const permission =
    await Notification.requestPermission()

  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Las notificaciones están bloqueadas en los ajustes del navegador.'
        : 'No se concedió permiso para enviar notificaciones.'
    )
  }

  const registration =
    await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

  await navigator.serviceWorker.ready

  const subscription =
    await registration.pushManager.getSubscription() ||
    await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey:
        urlBase64ToUint8Array(applicationKey)
    })

  const subscriptionData = subscription.toJSON()

  if (!subscriptionData.endpoint ||
      !subscriptionData.keys?.p256dh ||
      !subscriptionData.keys?.auth) {
    throw new Error(
      'El navegador no devolvió una suscripción push válida.'
    )
  }

  const { error } = await supabase
    .from('push_subscription')
    .upsert(
      {
        id_usuario: idUsuario,
        endpoint: subscriptionData.endpoint,
        p256dh: subscriptionData.keys.p256dh,
        auth: subscriptionData.keys.auth
      },
      {
        onConflict: 'endpoint'
      }
    )

  if (error) {
    throw error
  }

  return subscription
}

export const desactivarNotificacionesPush = async (
  idUsuario,
  subscription
) => {
  if (!subscription) {
    return true
  }

  const { error } = await supabase
    .from('push_subscription')
    .delete()
    .eq('id_usuario', idUsuario)
    .eq('endpoint', subscription.endpoint)

  if (error) {
    throw error
  }

  await subscription.unsubscribe()

  return true
}

export const actualizarInsigniaAplicacion = async idUsuario => {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.setAppBadge !== 'function' ||
    !idUsuario
  ) {
    return
  }

  const { count, error } = await supabase
    .from('alerta')
    .select(
      'id_alerta',
      {
        count: 'exact',
        head: true
      }
    )
    .eq('id_usuario', idUsuario)
    .neq('estado', 'LEIDA')

  if (error) {
    throw error
  }

  if (count > 0) {
    await navigator.setAppBadge(count)
  } else if (typeof navigator.clearAppBadge === 'function') {
    await navigator.clearAppBadge()
  }
}

export const limpiarInsigniaAplicacion = async () => {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.clearAppBadge === 'function'
  ) {
    await navigator.clearAppBadge()
  }
}
