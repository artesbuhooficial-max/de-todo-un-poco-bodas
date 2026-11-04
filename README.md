# De Todo Un Poco · landing y editor

Web de bodas con el diseño aprobado y editor de contenidos adaptado del flujo de Dossier Digital Vivo.

## Desarrollo y publicación

Requiere Node 22. No hay dependencias de compilación.

```sh
npm run check
npm run build
```

Cloudflare Pages: proyecto `de-todo-un-poco-bodas`, cuenta de Artes Búho. Repositorio `artesbuhooficial-max/de-todo-un-poco-bodas`, rama `main`. Comando `npm run build`, directorio `dist`. GitHub Actions valida cada commit de main e inicia la publicación mediante un deploy hook exclusivo, guardado como secreto `CLOUDFLARE_PAGES_DEPLOY_HOOK` en GitHub.

La portada está en `/` y el editor en `/editor/`. Dominio confirmado por David: `detodounpocomusic.com`, con variante `www.detodounpocomusic.com`. La conexión DNS se activa después de confirmar la compra o el acceso al dominio.

## Contenidos

- `template.html`: diseño y campos de la landing aprobada.
- `schema.json`: campos permitidos, tipos y grupos del editor.
- `data/content.json`: contenido canónico versionado.
- `editor/`: edición por selección, vista móvil/escritorio, borrador local e importar/exportar JSON.
- `functions/api/publish.js`: valida la clave, el contenido y la versión; actualiza únicamente `data/content.json` en GitHub. Rechaza conflictos para evitar sobrescribir otra publicación.

La clave de publicación se mantiene en memoria durante la sesión del editor. El token de GitHub solo se utiliza en el servidor. La interfaz del editor y la plantilla no contienen datos confidenciales; la publicación requiere autenticación. Esto no es un sistema de cuentas individuales de cliente.

## Activar Guardar y publicar

Configurar como secretos cifrados de Cloudflare Pages, solo en Production:

- `GITHUB_TOKEN`: token fine-grained limitado al repositorio de esta landing, permiso Contents: Read and write.
- `PUBLISH_SECRET`: clave exclusiva de este cliente.

La falta de estos secretos bloquea la publicación con un mensaje claro, sin perder el borrador. No reutilizar la clave ni los permisos de Mario.

Los secretos se pueden preparar en `.dev.vars` (archivo local ignorado por Git) y aplicar con `node scripts/configure-publisher.mjs`. Nunca se incluyen en el ZIP público, dist ni el repositorio. Después hay que desplegar de nuevo para activar los secretos.

## Mario Cassado

Ya dispone de `dossier-studio` en la misma cuenta de Cloudflare, conectado a su repositorio privado. Subdominio previsto: `dossierdigital.mariocassado.com`; su estado DNS se verifica por separado. No se sustituye la web principal de WordPress.

## Límites del editor

Edita textos, enlaces, teléfono de WhatsApp, fotos y descripciones de imágenes. Mantiene los bloques y diseño aprobados. Las fotos locales se reducen antes de guardarlas; el contenido completo admite hasta 900 KB. El guardado en GitHub inicia la publicación, que no es instantánea. Los borradores locales pertenecen a cada navegador y dominio.
