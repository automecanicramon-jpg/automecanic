self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload = {}

    try {
      payload = event.data ? event.data.json() : {}
    } catch (error) {
      console.error('No se pudo interpretar la notificación push:', error)
    }

    const badgeCount = Number(payload.badgeCount || 0)

    try {
      if (badgeCount > 0 && self.registration.setAppBadge) {
        await self.registration.setAppBadge(badgeCount)
      } else if (self.registration.clearAppBadge) {
        await self.registration.clearAppBadge()
      }
    } catch (error) {
      console.warn('El dispositivo no permitió actualizar el contador de la app:', error)
    }

    await self.registration.showNotification(
      payload.title || 'AutoMecanic',
      {
        body: payload.body || 'Tienes una nueva notificación.',
        icon: payload.icon || '/automecanic-icon-192.png',
        badge: payload.badge || '/automecanic-icon-192.png',
        tag: payload.tag || 'automecanic-alert',
        data: {
          url: payload.url || '/'
        }
      }
    )
  })())
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const targetUrl = new URL(
    event.notification.data?.url || '/',
    self.location.origin
  ).href

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.focus()
        if ('navigate' in client && client.url !== targetUrl) {
          await client.navigate(targetUrl)
        }
        return
      }
    }

    await self.clients.openWindow(targetUrl)
  })())
})
