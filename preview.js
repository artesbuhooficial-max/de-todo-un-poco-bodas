(() => {
  if(new URLSearchParams(location.search).get('editor')!=='1'||parent===window)return;
  const style=document.createElement('style');style.textContent='[data-edit-field],[data-edit-link]{cursor:pointer!important}[data-edit-field]:hover,[data-edit-link]:hover{outline:2px dashed #f26d3d;outline-offset:4px}html{scroll-behavior:auto}';document.head.append(style);
  document.addEventListener('click',event=>{const target=event.target.closest('[data-edit-field],[data-edit-link]');if(target){event.preventDefault();event.stopPropagation();parent.postMessage({source:'dtup-preview',field:target.dataset.editField||target.dataset.editLink},location.origin);}else if(event.target.closest('a,button[type=submit]'))event.preventDefault();},true);
  document.addEventListener('submit',event=>event.preventDefault());
  window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.source!=='dtup-editor')return;const values=event.data.values;if(!values||typeof values!=='object')return;document.querySelectorAll('[data-edit-field]').forEach(el=>{const value=values[el.dataset.editField];if(typeof value!=='string')return;if(el.tagName==='IMG')el.src=value;else el.textContent=value;});document.querySelectorAll('[data-edit-link]').forEach(el=>{const value=values[el.dataset.editLink];if(typeof value==='string'&&/^(https:\/\/|mailto:)/.test(value))el.href=value;});});
  parent.postMessage({source:'dtup-ready'},location.origin);
})();
