/**
 * Toast notification system — global event-based notifications.
 */

let toastListeners = [];

export function onToast(listener) {
  toastListeners.push(listener);
  return () => {
    toastListeners = toastListeners.filter(l => l !== listener);
  };
}

function emit(toast) {
  toastListeners.forEach(l => l(toast));
}

export function showSuccess(message) {
  emit({ id: Date.now(), type: 'success', message, duration: 4000 });
}

export function showError(message) {
  emit({ id: Date.now(), type: 'error', message, duration: 6000 });
}

export function showInfo(message) {
  emit({ id: Date.now(), type: 'info', message, duration: 4000 });
}

export function showWarning(message) {
  emit({ id: Date.now(), type: 'warning', message, duration: 5000 });
}
