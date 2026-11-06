import schema from './schema.mjs';

export const MAX_BYTES = 900_000;
const anchors = new Set(['#inicio', '#contenido', '#experiencia', '#nosotros', '#preguntas', '#contacto']);
export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
export function validate(content) {
  if (!content || content.siteId !== 'de-todo-un-poco' || content.schemaVersion !== 1 || !content.values || typeof content.values !== 'object' || Array.isArray(content.values)) throw new Error('El contenido no pertenece a esta web.');
  const keys = new Set(schema.map(field => field.key));
  if (Object.keys(content.values).some(key => !keys.has(key))) throw new Error('La estructura de campos no es válida.');
  const defaults = {};
  for (const field of schema) {
    if (!Object.hasOwn(content.values, field.key) && typeof field.default === 'string') {
      defaults[field.key] = field.default;
      continue;
    }
    const value = content.values[field.key];
    if (typeof value !== 'string') throw new Error('Hay un campo con formato incorrecto.');
    if (field.kind === 'text' && value.length > 10_000) throw new Error('Un texto supera los 10.000 caracteres.');
    if (field.kind === 'phone' && !/^\d{8,15}$/.test(value)) throw new Error('El teléfono debe incluir el prefijo, sin espacios ni signos.');
    if (field.kind === 'link' && !(field.default?.startsWith('#') && anchors.has(value))) {
      let url; try { url = new URL(value); } catch { throw new Error('Un enlace no es válido.'); }
      if (!['https:', 'mailto:'].includes(url.protocol)) throw new Error('Usa un enlace HTTPS, de correo o una sección de la web.');
    }
    if (field.kind === 'image' && !/^assets\/[a-zA-Z0-9._/-]+$/.test(value) && !/^https:\/\/[^\s<>"']+$/.test(value) && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) throw new Error('La imagen debe ser JPG, PNG, WebP o una dirección HTTPS.');
    if (field.kind === 'image' && value.includes('../')) throw new Error('La ruta de imagen no es válida.');
  }
  if (Object.keys(defaults).length) content = {...content, values: {...content.values, ...defaults}};
  if (new TextEncoder().encode(JSON.stringify(content)).length > MAX_BYTES) throw new Error('El contenido supera 900 KB. Reduce el tamaño de las imágenes.');
  return content;
}

export function render(template, content) {
  content = validate(content);
  return template.replace(/\{\{(campo_\d+)\}\}/g, (_, key) => {
    if (!(key in content.values)) throw new Error(`Falta el campo ${key}`);
    return escapeHtml(content.values[key]);
  });
}
