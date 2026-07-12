/**
 * Script para registrar una nueva versión en el backend después de un build exitoso.
 * 
 * Uso:
 *   node scripts/register-version.js <version> [--apk <path-to-apk>] [--notes "Notas del release"]
 * 
 * Ejemplo:
 *   node scripts/register-version.js 1.2.0 --apk ./build/app-release.apk --notes "Corrección de errores y mejoras"
 * 
 * También puede ejecutarse automáticamente después de un build de EAS:
 *   npx eas build --platform android --profile preview && node scripts/register-version.js $(node -p "require('./app.json').expo.version")
 */

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://crashmovil-backend.onrender.com';

async function registerVersion() {
  const args = process.argv.slice(2);
  const version = args[0];
  
  if (!version) {
    console.error('❌ Error: Debes proporcionar la versión como primer argumento');
    console.error('   node scripts/register-version.js <version>');
    process.exit(1);
  }

  const apkIndex = args.indexOf('--apk');
  const notesIndex = args.indexOf('--notes');
  const mandatoryIndex = args.indexOf('--mandatory');
  
  const apkPath = apkIndex !== -1 ? args[apkIndex + 1] : null;
  const notes = notesIndex !== -1 ? args[notesIndex + 1] : `Build ${version} - ${new Date().toISOString().split('T')[0]}`;
  const mandatory = mandatoryIndex !== -1;

  console.log(`📦 Registrando versión ${version} en la API...`);
  console.log(`   URL: ${API_BASE}/api/versions`);
  
  try {
    const payload = {
      version,
      platform: 'android',
      notes,
      mandatory,
      published: true,
    };

    if (apkPath) {
      // Si se proporciona ruta al APK, primero subimos el archivo
      const fs = await import('fs');
      const FormData = (await import('form-data')).default;
      
      if (!fs.existsSync(apkPath)) {
        console.error(`❌ Error: El archivo APK no existe: ${apkPath}`);
        process.exit(1);
      }

      console.log(`   📎 Subiendo APK: ${apkPath}`);
      const form = new FormData();
      form.append('file', fs.createReadStream(apkPath));
      
      const uploadRes = await fetch(`${API_BASE}/api/versions/upload`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`Error al subir APK: ${err}`);
      }

      const uploadData = await uploadRes.json();
      payload.download_url = uploadData.download_url || uploadData.url;
      payload.size_mb = uploadData.size_mb;
      
      console.log(`   ✅ APK subido correctamente`);
    }

    // Crear el registro de versión
    const res = await fetch(`${API_BASE}/api/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    console.log(`   ✅ Versión ${version} registrada exitosamente`);
    console.log(`   🆔 ID: ${data.id || 'N/A'}`);
    console.log(`   📝 Notas: ${notes}`);
    
    if (mandatory) {
      console.log(`   ⚠️  Esta versión es OBLIGATORIA`);
    }

  } catch (error) {
    console.error(`❌ Error al registrar la versión:`, error.message);
    process.exit(1);
  }
}

registerVersion();
