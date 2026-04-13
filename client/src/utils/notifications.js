const ICON_PATH = '/logo-icon.svg';

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'unsupported';
  }
}

export function sendBrowserNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const notif = new Notification(title, {
      body,
      icon: ICON_PATH,
      badge: ICON_PATH,
      silent: false,
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch {
    // WebView / Appflix may not support Notification constructor — graceful no-op
  }
}

export function canNotify() {
  return 'Notification' in window && Notification.permission === 'granted';
}
