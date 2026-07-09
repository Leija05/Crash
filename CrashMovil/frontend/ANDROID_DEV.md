# C.R.A.S.H. Móvil — Solución a la pantalla gris "loading from 192.168.0.2:8081"

## Qué significa ese mensaje

La pantalla gris con el texto **"loading from 192.168.x.x:8081"** es del **Expo Dev Client**
(la pantalla nativa de arranque), y aparece **antes** de que se ejecute cualquier código de React.
Quiere decir que la app nativa (ya instalada en el dispositivo/emulador) **no puede conectarse al
Metro bundler** para descargar el JavaScript. No es un error de tu código: es un problema de red
entre el teléfono y la PC que corre Metro.

La IP que ves (`192.168.0.2`) la detecta Expo automáticamente desde la LAN de tu PC. Si esa IP
cambió, el firewall la bloquea, o el dispositivo está en otra red, se queda cargando para siempre.

## Solución recomendada: usa un túnel (funciona siempre)

El túnel evita la red LAN por completo y usa ngrok a través de Internet:

```bash
cd CrashMovil/frontend
npx expo start --tunnel
```

Luego, en el teléfono, sacude el dispositivo → menú de desarrollo → **"Development servers"**
→ cambia la URL por la que muestra la terminal (algo como `https://xxx.expo.dev:80`).
La app cargará el bundle por túnel y dejará de verse la pantalla gris.

## Si usas emulador de Android (no teléfono físico)

El emulador **no puede** alcanzar la IP de LAN de tu PC. Hacia el host usa `10.0.2.2`:

```bash
npx expo start --host localhost
```

En la app (sacudiendo el dispositivo) → menú → cambia el servidor a `http://10.0.2.2:8081`.

## Si usas teléfono físico en la misma WiFi

1. Verifica tu IP real de la PC (la de `192.168.0.2` puede haber cambiado):
   - Windows: `ipconfig` → IPv4 de la tarjeta Wi‑Fi.
2. Arranca Metro forzando esa IP:
   ```bash
   set EXPO_PACKAGER_HOSTNAME=192.168.0.X
   npx expo start
   ```
   (en PowerShell: `$env:EXPO_PACKAGER_HOSTNAME="192.168.0.X"; npx expo start`)
3. Asegúrate de que el puerto `8081` esté abierto en el firewall de Windows.

## Compilar un APK autocontenido (la mejor opción para demo)

Si quieres una app que **no dependa de Metro** (ideal para la presentación del certamen),
genera un build de preview con EAS:

```bash
eas build -p android --profile preview
```

Eso produce un APK instalable que ya trae el bundle embebido; no necesita `npx expo start`
ni red. La URL del backend ya queda fijada en `EXPO_PUBLIC_BACKEND_URL` (o el valor por
defecto en `src/services/api.ts`).

## Notas

- El `EXPO_PUBLIC_BACKEND_URL` debe existir **antes** de arrancar Metro para que se incruste en el bundle.
  Si no está, `src/services/api.ts` usa el respaldo `https://crashmovil-backend.onrender.com`.
- `expo-dev-client` está habilitado a propósito: permite conectar el build nativo al Metro para
  desarrollo. Para producción usa el build de preview/production arriba descrito.
