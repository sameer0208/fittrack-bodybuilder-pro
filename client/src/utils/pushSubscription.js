import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const { data } = await API.get('/push/vapid-key');
    if (!data.key) return false;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.key),
    });

    await API.post('/push/subscribe', subscription.toJSON());
    return true;
  } catch (err) {
    console.warn('[Push] Subscribe failed:', err.message);
    return false;
  }
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
