(() => {
  if (new URLSearchParams(location.search).get('editor') !== '1' || parent === window) return;

  const style = document.createElement('style');
  style.textContent = `
    html { scroll-behavior: auto }
    [data-edit-field], [data-edit-link], [data-edit-placeholder] { cursor: pointer }
    [data-edit-field]:hover, [data-edit-link]:hover, [data-edit-placeholder]:hover {
      outline: 2px dashed #f26d3d; outline-offset: 4px;
    }
    [data-edit-background] { position: relative; cursor: pointer }
    .photo-break-copy { pointer-events: none }
    .photo-break-copy [data-edit-field] { pointer-events: auto }
    .edit-photo-button {
      position: absolute; z-index: 10; top: 12px; left: 12px;
      padding: 8px 12px; border: 1px solid currentColor; border-radius: 4px;
      background: #fff; color: #191914; font: 700 13px system-ui, sans-serif;
    }
  `;
  document.head.append(style);

  for (const photo of document.querySelectorAll('[data-edit-background]')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'edit-photo-button';
    button.textContent = photo.classList.contains('photo-break') ? 'Cambiar foto de fondo' : 'Cambiar foto';
    button.dataset.editField = photo.dataset.editBackground;
    photo.append(button);
  }

  document.addEventListener('click', event => {
    const field = event.target.closest('[data-edit-field], [data-edit-link], [data-edit-placeholder]');
    const background = event.target.closest('[data-edit-background]');
    const key = field?.dataset.editField || field?.dataset.editLink ||
      field?.dataset.editPlaceholder || background?.dataset.editBackground;
    if (key) {
      event.preventDefault();
      event.stopPropagation();
      parent.postMessage({source:'dtup-preview', field:key}, location.origin);
    } else if (event.target.closest('a, button[type=submit]')) {
      event.preventDefault();
    }
  }, true);
  document.addEventListener('submit', event => event.preventDefault(), true);

  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.source !== 'dtup-editor') return;
    const values = event.data.values;
    if (!values || typeof values !== 'object') return;

    for (const element of document.querySelectorAll('[data-edit-field]:not(.edit-photo-button)')) {
      const value = values[element.dataset.editField];
      if (typeof value !== 'string') continue;
      if (element.tagName === 'IMG') {
        if (/^(assets\/[\w./-]+$|https:\/\/|data:image\/(png|jpeg|webp);base64,)/.test(value)) element.src = value;
      } else {
        element.textContent = value;
      }
    }
    for (const element of document.querySelectorAll('[data-edit-alt]')) {
      if (typeof values[element.dataset.editAlt] === 'string') element.alt = values[element.dataset.editAlt];
    }
    for (const element of document.querySelectorAll('[data-edit-placeholder]')) {
      if (typeof values[element.dataset.editPlaceholder] === 'string') element.placeholder = values[element.dataset.editPlaceholder];
    }
    for (const element of document.querySelectorAll('[data-edit-option]')) {
      const value = values[element.dataset.editOption];
      if (typeof value === 'string') {
        element.value = value;
        element.textContent = value;
      }
    }
    for (const element of document.querySelectorAll('[data-edit-link]')) {
      const value = values[element.dataset.editLink];
      if (typeof value === 'string' && /^(https:\/\/|mailto:|#[a-z-]+$)/.test(value)) element.href = value;
    }
  });
  parent.postMessage({source:'dtup-ready'}, location.origin);
})();
