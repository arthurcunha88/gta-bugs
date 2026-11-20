import cases from './cases.js';
const form = document.querySelector('.filters');
const cards = document.querySelector('#cards');
const count = document.querySelector('#count');
const dialog = document.querySelector('#case');
const detail = document.querySelector('#detail');
const normalize = value => value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const videoUrl = item => 'https://www.youtube.com/watch?v=' + item.video + '&t=' + item.seconds + 's';
const preview = item => item.video ? '<img src="https://i.ytimg.com/vi/' + item.video + '/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">' : '';
const external = (url, label) => '<a href="' + escape(url) + '" target="_blank" rel="noopener noreferrer">' + escape(label) + '</a>';
let current = '';
let opener;
function render() {
  const filter = new FormData(form);
  const terms = normalize(filter.get('q')).trim().split(/\s+/);
  const shown = cases.filter(item => (!filter.get('jogo') || item.game === filter.get('jogo')) &&
    (!filter.get('tipo') || item.type === filter.get('tipo')) &&
    terms.every(term => normalize([item.title, item.game, item.place, item.body].join(' ')).includes(term)));
  count.textContent = shown.length === 1 ? '1 ficha' : shown.length + ' fichas';
  cards.innerHTML = shown.map(item => `<article class="card"><a href="#ficha/${item.id}" class="card-link"><div class="thumb" data-game="${escape(item.game)}">${preview(item)}<span>${escape(item.game)}</span></div><div class="card-text"><p class="label" data-type="${escape(item.type)}">${escape(item.type)}</p><h3>${escape(item.title)}</h3><p>${escape(item.place)}</p><span class="read">Abrir ficha</span></div></a></article>`).join('') || '<p class="empty">Nenhuma ficha corresponde à busca. <button type="button" id="reset">Limpar filtros</button></p>';
}
function showCase() {
  const item = cases.find(record => location.hash === '#ficha/' + record.id);
  if (!item) {
    current = '';
    if (dialog.open) dialog.close();
    return;
  }
  if (current === item.id && dialog.open) return;
  current = item.id;
  detail.innerHTML = `<p class="label">${escape(item.game)} / ${escape(item.type)}</p><h2 id="case-title">${escape(item.title)}</h2><p class="location">${escape(item.place)}</p><h3>O que você encontra</h3><p>${escape(item.body)}</p><h3>Versões e evidências</h3><p>${escape(item.version)}</p><div class="sources">${item.video ? external(videoUrl(item), 'Ver trecho no YouTube · ' + item.channel) : ''}${external(item.source, item.type === 'Registro oficial' ? 'Abrir na Rockstar Games' : 'Consultar fonte da ficha')}</div>`;
  if (!dialog.open) dialog.showModal();
}
function closeCase() {
  const destination = opener?.isConnected ? opener : document.querySelector('input');
  history.replaceState(null, '', '#arquivo');
  showCase();
  destination.focus();
}
form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('input', render);
cards.addEventListener('click', event => {
  if (event.target.closest('#reset')) { form.reset(); render(); form.querySelector('input').focus(); }
  const link = event.target.closest('.card-link');
  if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) opener = link;
});
window.addEventListener('hashchange', showCase);
document.querySelector('#dismiss').addEventListener('click', closeCase);
dialog.addEventListener('cancel', event => { event.preventDefault(); closeCase(); });
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeCase();
  }
});
render();
showCase();

