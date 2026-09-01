# Burbuja 🫧

Mini app privada para dos personas, pensada primero para iPhone y compatible con Android/escritorio.

## Lo que ya incluye

- Inicio de sesión con **nombre de usuario + contraseña**.
- Máximo de **2 miembros con acceso a los datos** mediante dos cupos fijos de Firestore.
- Nombre de usuario visible y modificable.
- Perfil, biografía y foto de perfil.
- Chat en tiempo real.
- Fotos en el chat (se comprimen y guardan en Firestore para no necesitar Firebase Storage).
- Indicador de leído, en línea y “escribiendo…”.
- Estados rápidos y personalizados.
- Botón “Pensando en ti”.
- Mensaje fijado.
- Contador de relación.
- “Esto o aquello”, pregunta del día y minirreto.
- PWA instalable en pantalla de inicio.
- Diseño negro + rosa con safe areas para iPhone.

---

# PASO 1 · Crear Firebase

1. Entra a Firebase Console.
2. Pulsa **Crear un proyecto**.
3. Ponle, por ejemplo, `burbuja`.
4. Google Analytics es opcional; puedes desactivarlo para este proyecto.

## Crear la app web

1. Dentro del proyecto, entra a **Configuración del proyecto**.
2. Baja a **Tus apps**.
3. Pulsa el icono **Web `</>`**.
4. Nombre: `Burbuja Web`.
5. No necesitas activar Firebase Hosting porque usaremos GitHub Pages.
6. Firebase mostrará un objeto parecido a:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

7. Abre `firebase-config.js` de este proyecto y sustituye los valores `REEMPLAZAR`.

> La configuración web de Firebase se entrega al navegador por diseño. La protección de los chats depende de Authentication + las reglas de Firestore.

---

# PASO 2 · Activar usuario/contraseña

1. Firebase Console → **Authentication**.
2. Pulsa **Comenzar** si aparece.
3. **Método de acceso / Sign-in method**.
4. Activa **Correo electrónico/Contraseña**.
5. Guarda.

Burbuja genera por detrás un correo interno aleatorio. Ustedes nunca tienen que escribirlo: para entrar usan únicamente su `@usuario` y contraseña.

---

# PASO 3 · Crear Firestore

1. Firebase Console → **Firestore Database**.
2. **Crear base de datos**.
3. Elige **Modo de producción**.
4. Escoge una región adecuada para ustedes. Si estás en México, elige una región cercana disponible.
5. Termina la creación.

## Publicar las reglas de Burbuja

1. En Firestore entra a **Reglas / Rules**.
2. Borra las reglas que aparezcan.
3. Abre el archivo `firestore.rules` de este proyecto.
4. Copia TODO.
5. Pégalo en Firebase.
6. Pulsa **Publicar**.

**No uses reglas de prueba abiertas.**

---

# PASO 4 · Probar localmente

Por seguridad de los módulos del navegador, no conviene abrir `index.html` con doble clic (`file://`).

Una forma sencilla si tienes Python instalado:

```bash
python -m http.server 8080
```

Luego abre:

```text
http://localhost:8080
```

También puedes subir directamente el proyecto a GitHub Pages y probarlo ahí.

---

# PASO 5 · Subir a GitHub Pages

1. Crea un repositorio nuevo. Puedes poner un nombre discreto, por ejemplo `brb`.
2. Sube **el contenido de esta carpeta** a la raíz del repositorio:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `firebase-config.js`
   - `manifest.json`
   - `sw.js`
   - `firestore.rules`
   - `favicon.svg`
   - carpeta `icons`
3. GitHub → repositorio → **Settings** → **Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Branch: `main`.
6. Folder: `/ (root)`.
7. Guarda.

Cuando GitHub termine de publicar, te dará una dirección similar a:

```text
https://TU-USUARIO.github.io/brb/
```

---

# PASO 6 · Crear las dos cuentas

En el primer iPhone:

1. Abre Burbuja.
2. **Crear cuenta**.
3. Nombre.
4. Nombre de usuario.
5. Contraseña.
6. Crear.

En el segundo iPhone repitan lo mismo.

Después de que ambos cupos `slots/one` y `slots/two` estén ocupados, una cuenta nueva ya no puede entrar a los datos de Burbuja. Si la interfaz intenta registrar una tercera, elimina automáticamente esa cuenta de Firebase Auth y muestra que la Burbuja está completa.

### Nota técnica

Firebase Authentication en sí puede recibir intentos de creación de usuarios desde Internet porque es un servicio público de autenticación. La protección importante es que Firestore solo reconoce como miembros a los UID guardados en los dos cupos fijos. Una tercera cuenta no puede leer perfiles, mensajes, estados, juegos ni datos compartidos.

---

# PASO 7 · Añadirla al inicio del iPhone

En Safari:

1. Abre la URL de Burbuja.
2. Pulsa **Compartir**.
3. **Añadir a pantalla de inicio**.
4. Si aparece la opción, activa **Abrir como app web**.
5. Añadir.

El icono incluido ya está preparado para Burbuja.

---

# Sobre las fotos

Esta versión evita Firebase Storage para mantener el proyecto sencillo y sin exigir plan Blaze. Las fotos se reducen en el dispositivo y se guardan como imágenes JPEG pequeñas en Firestore.

Eso es perfecto para avatares y fotos ocasionales en un chat de dos personas, pero no está pensado para almacenar miles de fotografías como una galería.

---

# Seguridad práctica

- No pongas contraseñas dentro de `app.js`.
- No cambies `firestore.rules` por `allow read, write: if true`.
- Usa contraseñas distintas a las de tus cuentas importantes.
- No publiques capturas que muestren la URL si quieres mantenerla discreta.
- Si olvidas la contraseña, esta primera versión no usa correo real para recuperación. Mientras tengas una sesión abierta puedes cambiarla desde **Perfil → Cambiar contraseña**.

---

## Archivos principales

- `index.html` — interfaz.
- `styles.css` — estética iPhone negro/rosa.
- `app.js` — lógica, chat, perfiles, juegos.
- `firebase-config.js` — configuración de tu proyecto.
- `firestore.rules` — control de acceso.
- `manifest.json` + `sw.js` — instalación como PWA.
