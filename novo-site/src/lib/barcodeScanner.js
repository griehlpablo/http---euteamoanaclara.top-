let activeStream = null;
let activeReader = null;
let activeTimer = null;
let lastDetectedAt = 0;

export function isNativeBarcodeDetectorSupported() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

export async function startBarcodeScanner(videoElement, onDetected, onError) {
  stopBarcodeScanner();
  if (!videoElement) return;
  try {
    if (isNativeBarcodeDetectorSupported()) {
      await scanWithNativeBarcodeDetector(videoElement, onDetected, onError);
      return;
    }
    await scanWithZXingFallback(videoElement, onDetected, onError);
  } catch (error) {
    stopBarcodeScanner();
    onError?.(friendlyCameraError(error));
  }
}

export function stopBarcodeScanner() {
  if (activeTimer) window.clearInterval(activeTimer);
  activeTimer = null;
  if (activeReader?.reset) activeReader.reset();
  activeReader = null;
  if (activeStream) activeStream.getTracks().forEach((track) => track.stop());
  activeStream = null;
}

export async function scanWithNativeBarcodeDetector(videoElement, onDetected, onError) {
  const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'];
  const detector = new window.BarcodeDetector({ formats });
  activeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  videoElement.srcObject = activeStream;
  await videoElement.play();
  activeTimer = window.setInterval(async () => {
    try {
      const codes = await detector.detect(videoElement);
      if (codes?.[0]?.rawValue) handleDetected(codes[0].rawValue, onDetected);
    } catch (error) {
      onError?.(friendlyCameraError(error));
    }
  }, 450);
}

export async function scanWithZXingFallback(videoElement, onDetected, onError) {
  const { BrowserMultiFormatReader } = await import('@zxing/browser');
  activeReader = new BrowserMultiFormatReader();
  await activeReader.decodeFromVideoDevice(undefined, videoElement, (result, error) => {
    if (result?.getText) handleDetected(result.getText(), onDetected);
    if (error && String(error.name || '').includes('NotAllowed')) onError?.(friendlyCameraError(error));
  });
}

function handleDetected(value, onDetected) {
  if (Date.now() - lastDetectedAt < 2000) return;
  lastDetectedAt = Date.now();
  stopBarcodeScanner();
  navigator.vibrate?.(120);
  onDetected?.(String(value).trim());
}

function friendlyCameraError(error) {
  const text = String(error?.message || error || '');
  if (text.includes('Permission') || text.includes('NotAllowed')) return 'Permissao da camera negada. Voce ainda pode digitar o codigo manualmente.';
  if (text.includes('NotFound')) return 'Camera nao encontrada. Use o campo manual de codigo de barras.';
  return 'Nao consegui abrir a camera agora. Use o codigo manual.';
}
