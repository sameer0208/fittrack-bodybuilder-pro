import API from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator)) throw new Error('Service Workers not supported by this browser');
  if (!('PushManager' in window)) throw new Error('Push notifications not supported by this browser');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission denied');

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const { data } = await API.get('/push/vapid-key');
  if (!data.key) throw new Error('VAPID key not configured on the server. Add VAPID_PUBLIC_KEY env var on Render.');

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(data.key),
  });

  await API.post('/push/subscribe', subscription.toJSON());
  return true;
}

export async function unsubscribeFromPush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager?.getSubscription();
    if (sub) {
      await API.delete('/push/unsubscribe', { data: { endpoint: sub.endpoint } });
      await sub.unsubscribe();
    }
    return true;
  } catch {
    return false;
  }
}
