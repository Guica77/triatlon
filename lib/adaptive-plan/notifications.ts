import { sendPushNotification } from '@/lib/notifications'

export async function notifyCoachOfPlanRequest(coachId: string) {
  try {
    await sendPushNotification(coachId, {
      title: 'Nueva solicitud de plan',
      body: 'Un atleta ha pedido revisar una modificación de su calendario.',
      url: '/coach/dashboard',
    })
  } catch {
    // The request remains pending in the Plan even if the device cannot receive push.
  }
}

export async function notifyAthleteOfPlanDecision(athleteId: string, accepted: boolean) {
  try {
    await sendPushNotification(athleteId, {
      title: accepted ? 'Cambio de plan aprobado' : 'Solicitud de plan revisada',
      body: accepted
        ? 'Tu entrenador ha aprobado el cambio propuesto en tu calendario.'
        : 'Tu entrenador ha rechazado la solicitud; revisa el Plan para ver el estado.',
      url: '/plan',
    })
  } catch {
    // The proposal remains visible inside Plan if push is unavailable.
  }
}
