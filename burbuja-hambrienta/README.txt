BURBUJA HAMBRIENTA — LISTO PARA GITHUB PAGES

Esta versión conserva el diseño de HAMBRIENTO y añade modo DÚO.

MODOS
- JUGAR SOLO: funciona sin Firebase y conserva la jugabilidad original.
- JUGAR DÚO: usa el mismo Firebase de Burbuja. Un miembro aparece morado y el otro rosa.

EN DÚO SE COMPARTE
- El mismo laberinto y nivel.
- Las mismas runas y Ojos Antiguos.
- Puntuación.
- Cordura del equipo (5 vidas).
- MODO DEVORAR: si cualquiera toma un Ojo, ambos pueden devorar entidades.
- Las cuatro entidades y su posición.
- Progreso al siguiente nivel.

REQUISITO DEL DÚO
Los dos jugadores deben tener una cuenta válida de Burbuja e iniciar sesión en el mismo dominio de GitHub Pages. Las reglas Firestore actuales de Burbuja ya permiten los documentos /games usados por este juego.

ARCHIVOS
index.html
styles.css
game.js
online.js
firebase-config.js
manifest.json
sw.js
icons/

PARA SUBIR
Descomprime el ZIP y sube TODO su contenido a la raíz del repositorio. Luego activa GitHub Pages en Settings > Pages > main / root.

IPHONE
Abre el enlace en Safari > Compartir > Agregar a pantalla de inicio.

NOTA
El modo dúo sincroniza movimiento de jugadores con actualizaciones ligeras y usa un jugador como host de las entidades. Si ese jugador deja la página por suficiente tiempo, el otro puede asumir el host automáticamente.
