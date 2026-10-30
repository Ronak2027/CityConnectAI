import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Check if the app is currently executing inside native Capacitor container (Android / iOS)
 */
export const isNativeApp = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Initialize native device features like status bar style and splash screen auto-hide
 */
export const initNativeApp = async () => {
  if (!isNativeApp()) return;

  try {
    // Configure top status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#FAF7F2' });
  } catch (err) {
    console.debug('StatusBar configuration not supported:', err);
  }

  try {
    // Hide splash screen after initialization
    await SplashScreen.hide();
  } catch (err) {
    console.debug('SplashScreen not supported:', err);
  }
};

/**
 * Capture high-precision GPS Coordinates with native fallback
 * Essential for CityConnectAI's 9-meter on-site verification engine
 */
export const getNativeCoordinates = async () => {
  if (isNativeApp()) {
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          throw new Error('Location permission denied on mobile device');
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
    } catch (nativeErr) {
      console.warn('Native GPS fetch failed, attempting browser fallback:', nativeErr);
    }
  }

  // Web Browser Standard Geolocation Fallback
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser/device'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
};

/**
 * Native Camera Capture for civic complaint evidence photos
 */
export const captureNativePhoto = async () => {
  if (isNativeApp()) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      return {
        webPath: image.webPath,
        format: image.format
      };
    } catch (err) {
      console.warn('Native camera capture failed or cancelled:', err);
      throw err;
    }
  }

  throw new Error('Native camera only available on mobile device platform');
};
