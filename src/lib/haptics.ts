export function vibrateLight() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
}
export function vibrateSuccess() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([10, 50, 20]);
}
export function vibrateError() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([20, 30, 20, 30, 60]);
}
