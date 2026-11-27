import cases from './cases.js';

const form = document.querySelector('.filters');
const cards = document.querySelector('#cards');
const count = document.querySelector('#count');
const reset = document.querySelector('#reset');
const dialog = document.querySelector('#case');
const detail = document.querySelector('#detail');
const normalize = value => value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const external = (url, label) => '<a href="' + escape(url) + '" target="_blank" rel="noopener noreferrer">' + escape(label) + '</a>';
let current = '';
let opener;
let lastDraw;
const surprise = document.querySelector('#surprise');
const shortcuts = document.querySelector('#game-shortcuts');
const motion = matchMedia('(prefers-reduced-motion: reduce)');

function caseImage(item) {
  return `<img src="./ilustracoes/${escape(item.id)}.svg" alt="" width="480" height="300" loading="lazy" decoding="async">`;
}

function row(item) {
  const cover = caseImage(item);
  return `<article><a href="#ficha/${item.id}" class="case-row case-link"><div class="thumb" aria-hidden="true">${cover}</div><div><p class="case-meta">${escape(item.game)} · ${escape(item.type)}</p><h3>${escape(item.title)}</h3><p class="case-place">${escape(item.place)}</p></div><span class="case-open" aria-hidden="true">↗</span></a></article>`;
}

function render() {
  const filter = new FormData(form);
  const query = normalize(filter.get('q')).trim();
  const terms = query.split(/\s+/);
  const game = filter.get('jogo');
  const type = filter.get('tipo');
  const shown = cases.filter(item => (!game || game === item.game) && (!type || type === item.type) &&
    terms.every(term => normalize([item.title,item.game,item.place,item.body].join(' ')).includes(term)));
  shortcuts.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.game === game)));
  reset.hidden = !query && !game && !type;
  count.textContent = shown.length === 1 ? '1 ficha' : shown.length + ' fichas';
  cards.innerHTML = shown.map(row).join('') || '<p class="empty">Nenhuma ficha corresponde à busca. Experimente outro termo ou limpe os filtros.</p>';
  if (!motion.matches) cards.animate?.([{opacity:.7,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:180,easing:'ease-out'});
}

function showCase() {
  const item = cases.find(record => location.hash === '#ficha/' + record.id);
  if (!item) {
    current = '';
    if (dialog.open) {
      dialog.close();
      if (opener?.isConnected) opener.focus({preventScroll:true});
    }
    return;
  }
  if (current === item.id && dialog.open) return;
  current = item.id;
  const video = 'https://www.youtube.com/watch?v=' + item.video + '&t=' + item.seconds + 's';
  const videoLink = item.video ? external(video, 'Ver vídeo · ' + item.channel) : '';
  const source = external(item.source, item.type === 'Registro oficial' ? 'Abrir na Rockstar Games' : 'Consultar fonte da ficha');
  detail.innerHTML = `<p class="label">${escape(item.game)} / ${escape(item.type)}</p><h2 id="case-title">${escape(item.title)}</h2><p class="location">${escape(item.place)}</p>${item.evidence ? `<p class="evidence">${escape(item.evidence)}</p>` : ""}<figure class="case-photo">${caseImage(item)}<figcaption>Ilustração editorial · GTA Bugs</figcaption></figure><h3>O que você encontra</h3><p>${escape(item.body)}</p><h3>Versões e evidências</h3><p>${escape(item.version)}</p><div class="sources">${videoLink}${source}</div>`;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
}

function closeCase() {
  if (history.state?.catalogCase) {
    history.back();
    return;
  }
  history.replaceState(null, '', '#arquivo');
  showCase();
  document.querySelector('input[name="q"]').focus();
}


for (const option of form.elements.jogo.options) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.game = option.value;
  button.textContent = option.value || 'Todos';
  button.addEventListener('click', () => {
    form.elements.jogo.value = option.value;
    render();
  });
  shortcuts.append(button);
}
shortcuts.hidden = false;
surprise.hidden = false;
surprise.addEventListener('click', () => {
  const eligible = cases.filter(item => item.type !== 'Registro oficial' && item.id !== lastDraw);
  const item = eligible[Math.floor(Math.random() * eligible.length)];
  lastDraw = item.id;
  openCase('#ficha/' + item.id, surprise);
});

function openCase(hash, trigger) {
  opener = trigger;
  history.pushState({catalogCase:true}, '', hash);
  showCase();
}

if ('IntersectionObserver' in window && !motion.matches) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveal.unobserve(entry.target);
      if (!motion.matches) entry.target.animate?.(
        [{opacity:.56,transform:'translateY(14px)'},{opacity:1,transform:'none'}],
        {duration:540,easing:'cubic-bezier(.2,.78,.25,1)'}
      );
    }
  },{threshold:.12});
  document.querySelectorAll('[data-reveal]').forEach(section => reveal.observe(section));
}

form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('input', render);
reset.addEventListener('click', () => {
  form.reset();
  render();
  form.elements.q.focus();
});
document.addEventListener('click', event => {
  const link = event.target.closest('.case-link');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  openCase(link.hash, link);
});
window.addEventListener('hashchange', showCase);
document.querySelector('#dismiss').addEventListener('click', closeCase);
dialog.addEventListener('cancel', event => {
  event.preventDefault();
  closeCase();
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeCase();
});
render();
showCase();

