'use strict';
(() => {
if (window.top !== window.self) { document.documentElement.classList.add('framed'); return; }

const $ = s => document.querySelector(s);
const main = $('#main'), ov = $('#overlay');
const APP_VERSION = 2, PIN_LEN = 6, ITER = 600000, LOCK_HIDDEN_MS = 30000, LOCK_IDLE_MS = 180000;
const ACC_TYPES = {cash:'Efectivo', debit:'Tarjeta de débito', invest:'Inversión'};
const COLORS = ['#3D7BD9','#2FA37A','#D9893D','#9A5CD6','#D9534F','#3DB2C2','#C9A227','#7A8696'];
const CATS = {
  exp:[['comida','Comida y restaurantes','#E8894A'],['super','Supermercado','#5DBB63'],['transporte','Transporte','#4A9BE8'],['casa','Casa','#B58A5A'],['servicios','Servicios','#4AC1C9'],['salud','Salud','#E86A7E'],['cuidado','Cuidado personal','#D98CD9'],['ropa','Ropa','#9C7BE8'],['ocio','Entretenimiento','#E8C24A'],['educacion','Educación','#6A8CE8'],['suscripciones','Suscripciones','#C96AE8'],['regalos','Regalos','#E85A5A'],['otros','Otros gastos','#8E8E96']],
  inc:[['salario','Salario','#5FD3A0'],['extra','Ingreso extra','#5FC3D3'],['regalo','Regalo','#E8C24A'],['reembolso','Reembolso','#8EB4E8'],['otros_i','Otros ingresos','#8E8E96']]};
const CAT = Object.fromEntries([...CATS.exp, ...CATS.inc].map(([k,n,c]) => [k, {n, c}]));
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const I = {plus:'<path d="M12 5v14M5 12h14"/>',back:'<path d="m15 6-6 6 6 6"/>',chev:'<path d="m9 6 6 6-6 6"/>',chevl:'<path d="m15 6-6 6 6 6"/>',eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',eyeoff:'<path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.6 7.6C3.8 9.4 2 12 2 12s3.5 6 10 6a10 10 0 0 0 4.4-1"/>',finger:'<path d="M12 11v3a8 8 0 0 1-1.5 4.5"/><path d="M8 8.5a4.5 4.5 0 0 1 8.5 2V13a12 12 0 0 1-.8 4.3"/><path d="M5 12a7 7 0 0 1 12-5"/><path d="M8.5 13v1a5 5 0 0 1-1.3 3.3"/><path d="M19.5 10.5V13a15 15 0 0 1-.4 3"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',down:'<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',up:'<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',cash:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>',debit:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',invest:'<path d="M4 19V5M4 19h16"/><path d="m7 15 4-4 3 3 5-6"/>',swap:'<path d="M7 7h12l-3-3M17 17H5l3 3"/>',repeat:'<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',zap:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'};
const ic = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36) + Array.from(crypto.getRandomValues(new Uint8Array(6)), b => (b % 36).toString(36)).join('');
const LS = {get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,String(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const NO_SPELL = 'autocomplete="off" autocorrect="off" spellcheck="false"';
const round2 = n => Math.round(n * 100) / 100;
const num = v => { const n = parseFloat(String(v ?? '').replace(/[$\s]/g, '').replace(/,(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isFinite(n) ? round2(n) : null; };
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const monthKey = (d = todayKey()) => d.slice(0, 7);
const monthName = k => { const [y, m] = k.split('-').map(Number); return MONTHS[m-1].charAt(0).toUpperCase() + MONTHS[m-1].slice(1) + ' ' + y; };
const shiftMonth = (k, n) => { const [y, m] = k.split('-').map(Number), d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
const dayLabel = s => { if (s === todayKey()) return 'Hoy'; const y = new Date(); y.setDate(y.getDate() - 1); const yk = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`; if (s === yk) return 'Ayer';
  const [a,b,c] = s.split('-').map(Number); return new Date(a, b-1, c).toLocaleDateString('es-SV', {weekday:'long', day:'numeric', month:'long'}); };
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;

/* ---------- Estado general ---------- */
let meta = null, dek = null, data = null, unlocked = false, pendingKey = null, bioOK = false, bioBusy = false, hiddenAt = 0, lastAct = Date.now();
let view = {name:'home'}, hist = [], tab = 'home', month = monthKey(), hideAmounts = LS.get('mf_hide') === '1', draft = null, installEvt = null;
let promptRes = null, confirmRes = null, sheetRes = null;
const pad = {buf:'', busy:false, onDone:null};

/* ---------- Superposiciones y botón atrás ---------- */
let ovState = false, pendingBack = false, wantPush = false, pendingCb = null;
function toast(m){ const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); }
function openOverlay(html, cls){ ov.className = cls; ov.innerHTML = html; ov.hidden = false; document.body.style.overflow = 'hidden';
  if (!ovState){ ovState = true; if (pendingBack) wantPush = true; else history.pushState({ov:1}, ''); } }
function hideOverlay(){ ov.hidden = true; ov.innerHTML = ''; ov.className = ''; document.body.style.overflow = ''; }
function closeOverlay(cb){ hideOverlay(); if (ovState){ ovState = false; if (wantPush){ wantPush = false; if (cb) cb(); } else { pendingBack = true; pendingCb = cb || null; history.back(); } } else if (cb) cb(); }
function dismissAll(v){ const p = promptRes, c = confirmRes, s = sheetRes; promptRes = confirmRes = sheetRes = null; if (p) p(null); if (c) c(false); if (s) s(v === undefined ? null : v); }
function resolveSheet(v){ closeOverlay(() => dismissAll(v)); }
function confirmBox(title, text, ok, danger = true){ return new Promise(res => { confirmRes = res; openOverlay(`<div class="sheet" role="dialog" aria-modal="true"><h2>${esc(title)}</h2><p>${esc(text)}</p><button class="btn ${danger?'btn-danger':'btn-primary'}" data-act="confirmOk">${esc(ok)}</button><button class="btn btn-ghost" data-act="confirmNo">Cancelar</button></div>`, 'dim'); }); }
function go(v){ hist.push(Object.assign({}, view, {y:window.scrollY})); view = v; history.pushState({d:hist.length}, ''); render(); window.scrollTo(0,0); }
function back(){ if (ovState) return resolveSheet(null); if (hist.length) history.back(); }
function doBack(){ if (!hist.length) return; const v = hist.pop(), y = v.y || 0; delete v.y; view = v; draft = null; render(); window.scrollTo(0, y); }
window.addEventListener('popstate', () => {
  if (pendingBack){ pendingBack = false; if (wantPush){ wantPush = false; history.pushState({ov:1}, ''); } const cb = pendingCb; pendingCb = null; if (cb) cb(); return; }
  if (ovState){ ovState = false; hideOverlay(); dismissAll(); if (!unlocked && meta) renderLock(); return; }
  doBack(); });
function resetNav(){ const n = hist.length + (ovState ? 1 : 0); hist = []; if (ovState){ ovState = false; hideOverlay(); } if (n){ pendingBack = true; history.go(-n); } }
/* ---------- Almacenamiento (IndexedDB, solo datos cifrados) ---------- */
const DB = { db:null,
  open(){ return new Promise(res => { try { const r = indexedDB.open('mis-finanzas-seguro', 1);
    r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('docs',{keyPath:'id'}); d.createObjectStore('meta',{keyPath:'k'}); };
    r.onsuccess = () => { this.db = r.result; res(true); }; r.onerror = () => res(false); r.onblocked = () => res(false);
  } catch(e){ res(false); } }); },
  req(s, m, fn){ return new Promise((res, rej) => { try { const t = this.db.transaction(s, m), q = fn(t.objectStore(s)); let out;
    if (q) q.onsuccess = () => { out = q.result; }; t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  } catch(e){ rej(e); } }); },
  get(s,k){ return this.req(s,'readonly',o=>o.get(k)); },
  all(s){ return this.req(s,'readonly',o=>o.getAll()).then(r=>r||[]); },
  put(s,v){ return this.req(s,'readwrite',o=>o.put(v)); },
  del(s,k){ return this.req(s,'readwrite',o=>o.delete(k)); },
  clear(s){ return this.req(s,'readwrite',o=>o.clear()); } };

/* ---------- Criptografía ---------- */
const te = new TextEncoder(), td = new TextDecoder(), S = crypto.subtle;
const b64 = buf => { const a = new Uint8Array(buf); let s = ''; for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const rnd = n => crypto.getRandomValues(new Uint8Array(n));
async function pinKey(pin, salt, iter){ const base = await S.importKey('raw', te.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return S.deriveKey({name:'PBKDF2', salt:unb64(salt), iterations:iter, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['wrapKey','unwrapKey']); }
async function prfKey(out){ const base = await S.importKey('raw', out, 'HKDF', false, ['deriveKey']);
  return S.deriveKey({name:'HKDF', hash:'SHA-256', salt:new Uint8Array(32), info:te.encode('mis-finanzas/huella/v1')}, base, {name:'AES-GCM', length:256}, false, ['wrapKey','unwrapKey']); }
async function wrap(k, kek){ const iv = rnd(12); return {iv:b64(iv), ct:b64(await S.wrapKey('raw', k, kek, {name:'AES-GCM', iv}))}; }
const unwrap = (w, kek, ext) => S.unwrapKey('raw', unb64(w.ct), kek, {name:'AES-GCM', iv:unb64(w.iv)}, {name:'AES-GCM'}, !!ext, ['encrypt','decrypt']);
async function enc(obj, id, key){ const iv = rnd(12); return {id, iv:b64(iv), ct:b64(await S.encrypt({name:'AES-GCM', iv, additionalData:te.encode(id)}, key, te.encode(JSON.stringify(obj))))}; }
async function dec(r, key){ return JSON.parse(td.decode(await S.decrypt({name:'AES-GCM', iv:unb64(r.iv), additionalData:te.encode(r.id)}, key, unb64(r.ct)))); }

/* ---------- Huella (WebAuthn + PRF) ---------- */
async function bioSupported(){ try { return !!window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch(e){ return false; } }
async function bioCreate(){ const c = await navigator.credentials.create({publicKey:{challenge:rnd(32), rp:{name:'Mis finanzas'}, user:{id:rnd(16), name:'Mis finanzas', displayName:'Mis finanzas'}, pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}], authenticatorSelection:{authenticatorAttachment:'platform', userVerification:'required', residentKey:'preferred'}, timeout:60000, attestation:'none', extensions:{prf:{}}}});
  if (!c) throw new Error('sin credencial'); return b64(c.rawId); }
async function bioKek(id, prfSalt){ const a = await navigator.credentials.get({publicKey:{challenge:rnd(32), allowCredentials:[{type:'public-key', id:unb64(id)}], userVerification:'required', timeout:60000, extensions:{prf:{eval:{first:unb64(prfSalt)}}}}});
  const r = a && a.getClientExtensionResults ? a.getClientExtensionResults() : {}; const out = r.prf && r.prf.results && r.prf.results.first;
  if (!out) { const e = new Error('noprf'); e.noprf = true; throw e; } return prfKey(out); }

/* ---------- Teclado de PIN ---------- */
const cancelBtn = `<button class="btn btn-ghost narrow center" data-act="cancelPrompt">Cancelar</button>`;
function padHTML(title, sub, bioBtn, extra){ return `<div class="lock"><div class="lock-mark">${ic('lock',28)}</div><h1 class="lock-title">${esc(title)}</h1><p class="lock-sub" id="padSub">${esc(sub)}</p>${bioBtn?`<button class="bio-btn" data-act="bio">${ic('finger',20)} Usar huella</button>`:''}<div class="dots" id="dots" aria-hidden="true">${'<i></i>'.repeat(PIN_LEN)}</div><div class="pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="key" data-key="${n}">${n}</button>`).join('')}<span></span><button class="key" data-key="0">0</button><button class="key key-ghost" data-key="del" aria-label="Borrar">${ic('back',24)}</button></div>${extra||''}</div>`; }
function newPad(fn){ pad.buf = ''; pad.busy = false; pad.onDone = fn; }
function drawDots(){ const d = $('#dots'); if (d) [...d.children].forEach((i,n) => i.classList.toggle('f', n < pad.buf.length)); }
function setSub(t){ const s = $('#padSub'); if (s) s.textContent = t; }
async function padKey(k){
  if (pad.busy) return;
  if (k === 'del'){ pad.buf = pad.buf.slice(0,-1); return drawDots(); }
  if (pad.buf.length >= PIN_LEN) return;
  pad.buf += k; drawDots();
  if (pad.buf.length === PIN_LEN){ pad.busy = true; let ok = false; try { ok = await pad.onDone(pad.buf); } catch(e){ ok = false; } pad.busy = false;
    if (!ok){ const d = $('#dots'); if (d){ d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); } setTimeout(() => { pad.buf = ''; drawDots(); }, 380); } } }
const weakPin = p => /^(\d)\1+$/.test(p) || '0123456789'.includes(p) || '9876543210'.includes(p);

/* ---------- Intentos fallidos ---------- */
function waitLeft(){ return Math.max(0, +(LS.get('mf_until')||0) - Date.now()); }
function failed(){ const f = +(LS.get('mf_fails')||0) + 1; LS.set('mf_fails', f); if (f >= 3){ const s = Math.min(300, 5 * 2 ** (f-3)); LS.set('mf_until', Date.now() + s*1000); return s; } return 0; }
function succeeded(){ LS.del('mf_fails'); LS.del('mf_until'); }
async function verifyPin(p, ext){
  const w = waitLeft(); if (w){ const e = new Error(); e.msg = `Espera ${Math.ceil(w/1000)} segundos para intentarlo de nuevo.`; throw e; }
  setSub('Verificando…');
  try { const k = await unwrap(meta.pin, await pinKey(p, meta.salt, meta.iter), ext); succeeded(); return k; }
  catch(err){ const s = failed(); const e = new Error(); e.msg = s ? `PIN incorrecto. Espera ${s} segundos.` : 'PIN incorrecto. Inténtalo otra vez.'; throw e; } }
function pinPrompt(title, sub, fn){ return new Promise(res => { promptRes = res; openOverlay(padHTML(title, sub, false, cancelBtn), 'full');
  newPad(async p => { try { const v = await fn(p); closeOverlay(); promptRes = null; res(v); return true; } catch(e){ setSub(e.msg || 'PIN incorrecto.'); return false; } }); }); }

/* ---------- Flujo de PIN nuevo ---------- */
function newPinFlow(el, done, cancelable){
  const extra = cancelable ? cancelBtn : '';
  const step1 = (msg) => { el.innerHTML = padHTML('Crea tu PIN', msg || 'Seis dígitos. Si lo olvidas, no hay forma de recuperar tus datos.', false, extra);
    newPad(async p => { if (weakPin(p)){ setSub('Ese PIN es muy fácil de adivinar. Elige otro.'); return false; } step2(p); return true; }); };
  const step2 = first => { el.innerHTML = padHTML('Confirma tu PIN', 'Escríbelo otra vez.', false, extra);
    newPad(async p => { if (p !== first){ step1('Los PIN no coinciden. Inténtalo de nuevo.'); return true; } setSub('Cifrando…'); await done(p); return true; }); };
  step1(); }
async function setupKeys(pin){
  const salt = b64(rnd(16)), k = await S.generateKey({name:'AES-GCM', length:256}, true, ['encrypt','decrypt']);
  meta = {k:'keys', v:1, salt, iter:ITER, pin:await wrap(k, await pinKey(pin, salt, ITER)), bio:null};
  await DB.put('meta', meta); dek = k; pendingKey = k; renderBioOffer(); }
async function enableBio(extKey){
  const id = await bioCreate(), prfSalt = b64(rnd(32));
  const kek = await bioKek(id, prfSalt);
  meta.bio = {id, prfSalt, w:await wrap(extKey, kek)}; await DB.put('meta', meta); }

/* ---------- Datos (todo en un solo registro cifrado) ---------- */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/, ID_RE = /^[a-z0-9]{6,40}$/, TX_TYPES = ['exp','inc','tr','adj','val'];
const str = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
function cleanData(d){ d = d && typeof d === 'object' ? d : {};
  const accounts = (Array.isArray(d.accounts) ? d.accounts : []).filter(a => a && ID_RE.test(a.id) && str(a.name, 60).trim()).map((a, i) => ({id:a.id, name:str(a.name, 60).trim(), type:ACC_TYPES[a.type] ? a.type : 'debit', color:COLORS.includes(a.color) ? a.color : COLORS[i % COLORS.length], initial:num(a.initial) || 0, archived:!!a.archived, order:isFinite(+a.order) ? +a.order : i})).slice(0, 50);
  const ids = new Set(accounts.map(a => a.id));
  const txs = (Array.isArray(d.txs) ? d.txs : []).filter(t => t && ID_RE.test(t.id) && TX_TYPES.includes(t.type) && DATE_RE.test(t.date) && ids.has(t.acc) && num(t.amount) !== null).map(t => ({id:t.id, type:t.type, amount:t.type === 'adj' ? num(t.amount) : Math.abs(num(t.amount)), acc:t.acc, to:t.type === 'tr' && ids.has(t.to) ? t.to : null, cat:CAT[t.cat] ? t.cat : (t.type === 'inc' ? 'otros_i' : t.type === 'exp' ? 'otros' : null), note:str(t.note, 200), date:t.date, at:+t.at || Date.now()})).filter(t => t.type !== 'tr' || t.to);
  const b = d.budget && typeof d.budget === 'object' ? d.budget : {}, cats = {};
  if (b.cats && typeof b.cats === 'object') Object.entries(b.cats).forEach(([k, v]) => { if (CAT[k] && num(v) > 0) cats[k] = num(v); });
  const fixed = (Array.isArray(d.fixed) ? d.fixed : []).filter(f => f && ID_RE.test(f.id) && str(f.name, 60).trim() && num(f.amount) > 0).map(f => ({id:f.id, name:str(f.name, 60).trim(), amount:num(f.amount), day:Math.min(31, Math.max(1, parseInt(f.day, 10) || 1)), cat:CATS.exp.some(c => c[0] === f.cat) ? f.cat : 'servicios', acc:ids.has(f.acc) ? f.acc : null, paid:/^\d{4}-\d{2}$/.test(f.paid || '') ? f.paid : '', active:f.active !== false})).slice(0, 60);
  const goals = (Array.isArray(d.goals) ? d.goals : []).filter(g => g && ID_RE.test(g.id) && str(g.name, 60).trim() && num(g.target) > 0).map(g => ({id:g.id, name:str(g.name, 60).trim(), target:num(g.target), deadline:/^\d{4}-\d{2}$/.test(g.deadline || '') ? g.deadline : '', moves:(Array.isArray(g.moves) ? g.moves : []).filter(m => m && DATE_RE.test(m.d) && num(m.a) !== null).map(m => ({d:m.d, a:num(m.a)})).slice(-500), done:!!g.done})).slice(0, 30);
  const quick = (Array.isArray(d.quick) ? d.quick : []).filter(q => q && ID_RE.test(q.id) && str(q.label, 40).trim() && num(q.amount) > 0).map(q => ({id:q.id, label:str(q.label, 40).trim(), amount:num(q.amount), cat:CATS.exp.some(c => c[0] === q.cat) ? q.cat : 'otros', acc:ids.has(q.acc) ? q.acc : null})).slice(0, 20);
  return {v:2, accounts, txs, budget:{total:num(b.total) > 0 ? num(b.total) : null, cats}, fixed, goals, quick}; }
const goalSaved = g => round2(g.moves.reduce((s, m) => s + m.a, 0));
const fixedPending = () => data.fixed.filter(f => f.active && f.paid !== monthKey());
const daysInMonth = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate(); };
const fixedDay = f => Math.min(f.day, daysInMonth());
function fixedStatus(f){ if (f.paid === monthKey()) return {k:'paid', t:'Pagado este mes'}; const d = new Date().getDate(), fd = fixedDay(f);
  if (d > fd) return {k:'late', t:'Ya pasó su fecha'}; if (d === fd) return {k:'today', t:'Se cobra hoy'}; const n = fd - d; return {k:'soon', t:n === 1 ? 'Se cobra mañana' : `Se cobra el ${fd}`}; }
const monthsUntil = ym => { if (!ym) return null; const [y, m] = ym.split('-').map(Number), n = new Date(); return (y - n.getFullYear()) * 12 + (m - (n.getMonth() + 1)) + 1; };
async function saveData(){ await DB.put('docs', await enc(data, 'state', dek)); }
const accById = id => data.accounts.find(a => a.id === id);
const activeAccs = () => data.accounts.filter(a => !a.archived).sort((a,b) => a.order - b.order);
const money = (n, sign) => { if (n == null || !isFinite(n)) return ''; if (hideAmounts) return '$•••'; const s = Math.abs(n).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}); return (n < 0 ? '−' : sign && n > 0 ? '+' : '') + '$' + s; };
function balance(a, upTo){ let b = a.initial;
  for (const t of data.txs){ if (upTo && t.date > upTo) continue;
    if (t.type === 'val') continue;
    if (t.acc === a.id){ if (t.type === 'exp' || t.type === 'tr') b -= t.amount; else if (t.type === 'inc') b += t.amount; else if (t.type === 'adj') b += t.amount; }
    if (t.type === 'tr' && t.to === a.id) b += t.amount; }
  return round2(b); }
function investInfo(a){ const flows = data.txs.filter(t => t.type !== 'val' && (t.acc === a.id || t.to === a.id)).sort((x,y) => x.date.localeCompare(y.date) || x.at - y.at);
  const vals = data.txs.filter(t => t.type === 'val' && t.acc === a.id).sort((x,y) => x.date.localeCompare(y.date) || x.at - y.at), last = vals[vals.length - 1];
  const net = t => t.to === a.id ? t.amount : t.type === 'inc' || t.type === 'adj' ? t.amount : -t.amount;
  const invested = round2(a.initial + flows.filter(t => t.type === 'tr').reduce((s,t) => s + net(t), 0));
  let value = last ? last.amount : a.initial; flows.forEach(t => { if (!last || t.date > last.date || (t.date === last.date && t.at > last.at)) value += net(t); });
  value = round2(value); const gain = round2(value - invested); return {invested, value, gain, pct:invested > 0 ? gain / invested * 100 : 0, last, vals}; }
const accValue = a => a.type === 'invest' ? investInfo(a).value : balance(a);
const available = () => round2(activeAccs().filter(a => a.type !== 'invest').reduce((s,a) => s + balance(a), 0));
const monthTx = (m, type) => data.txs.filter(t => t.date.startsWith(m) && (!type || t.type === type));
const spentBy = m => { const o = {}; monthTx(m, 'exp').forEach(t => { o[t.cat] = round2((o[t.cat] || 0) + t.amount); }); return o; };
const sum = l => round2(l.reduce((s,t) => s + t.amount, 0));

/* ---------- Huella automática ---------- */
function autoBio(){ if (!unlocked && meta && meta.bio && bioOK && !bioBusy && document.visibilityState === 'visible' && $('[data-act="bio"]')) A.bio(); }

/* ---------- Bloqueo ---------- */
function renderBioOffer(){ main.innerHTML = `<div class="lock"><div class="lock-mark">${ic('finger',30)}</div><h1 class="lock-title">Abre con tu huella</h1><p class="lock-sub">${bioOK?'Tu huella también podrá descifrar tus datos. Te la pedirá dos veces para configurarla.':'Este navegador no permite usar la huella, así que la app se abrirá con tu PIN.'}</p>${bioOK?`<button class="btn btn-primary narrow" data-act="bioOn">Activar huella</button><button class="btn btn-ghost narrow" data-act="bioSkip">Ahora no</button>`:`<button class="btn btn-primary narrow" data-act="bioSkip">Continuar</button>`}</div>`; }
function renderLock(){ unlocked = false;
  if (!meta) return newPinFlow(main, setupKeys, false);
  const bio = !!meta.bio && bioOK;
  main.innerHTML = padHTML('Mis finanzas', bio ? 'Desbloquea con tu huella o tu PIN.' : 'Ingresa tu PIN.', bio, `<button class="btn-link" data-act="forgot">Olvidé mi PIN</button>`);
  newPad(async p => { try { dek = await verifyPin(p, false); await afterUnlock(); return true; } catch(e){ setSub(e.msg || 'PIN incorrecto.'); return false; } }); }
async function afterUnlock(){ pendingKey = null; let rec = null;
  try { rec = await DB.get('docs', 'state'); } catch(e){}
  try { data = cleanData(rec ? await dec(rec, dek) : null); } catch(e){ data = cleanData(null); toast('No se pudieron leer tus datos.'); }
  unlocked = true; lastAct = Date.now(); hist = []; month = monthKey();
  view = {name: data.accounts.length ? 'home' : 'welcome'}; tab = 'home'; render(); window.scrollTo(0,0); }
function lock(){ dek = null; data = null; pendingKey = null; draft = null; dismissAll(); resetNav(); renderLock(); window.scrollTo(0,0); }

/* ---------- Vistas ---------- */
const accIcon = t => ic(t === 'cash' ? 'cash' : t === 'invest' ? 'invest' : 'debit', 20);
function topBar(){ return `<header class="bar"><h1 class="title">Mis finanzas</h1><div class="bar-actions">${installEvt?'<button class="pill-btn" data-act="install">Instalar</button>':''}<button class="icon-btn" data-act="toggleHide" aria-label="${hideAmounts?'Mostrar montos':'Ocultar montos'}">${ic(hideAmounts?'eyeoff':'eye')}</button><button class="icon-btn" data-act="settings" aria-label="Ajustes">${ic('gear')}</button></div></header>
  <div class="seg" role="tablist">${[['home','Inicio'],['moves','Movimientos'],['summary','Resumen']].map(([k,n]) => `<button role="tab" class="${tab===k?'on':''}" data-tab="${k}">${n}</button>`).join('')}</div>`; }
const fab = () => `<button class="fab" data-act="newTx" aria-label="Agregar movimiento">${ic('plus',28)}</button>`;
function txRow(t){ const a = accById(t.acc), to = t.to && accById(t.to);
  let title, sub, amt, cls = '';
  if (t.type === 'exp'){ title = t.note || CAT[t.cat].n; sub = (t.note ? CAT[t.cat].n + ', ' : '') + a.name; amt = money(-t.amount); }
  else if (t.type === 'inc'){ title = t.note || CAT[t.cat].n; sub = (t.note ? CAT[t.cat].n + ', ' : '') + a.name; amt = money(t.amount, true); cls = 'pos'; }
  else if (t.type === 'tr'){ title = t.note || (to.type === 'invest' ? `Depósito a ${to.name}` : a.type === 'invest' ? `Retiro de ${a.name}` : to.type === 'cash' ? 'Retiro de efectivo' : 'Transferencia'); sub = `${a.name} → ${to.name}`; amt = money(t.amount); cls = 'muted'; }
  else if (t.type === 'adj'){ title = t.note || 'Ajuste de saldo'; sub = a.name; amt = money(t.amount, true); cls = 'muted'; }
  else { title = 'Valor actualizado'; sub = a.name; amt = money(t.amount); cls = 'muted'; }
  const dot = t.cat ? CAT[t.cat].c : t.type === 'tr' ? '#8E8E96' : '#5C5C63';
  return `<button class="tx" data-tx="${t.id}"><span class="tx-dot" data-c="${dot}"></span><span class="tx-main"><b>${esc(title)}</b><small>${esc(sub)}</small></span><span class="tx-amt ${cls}">${amt}</span></button>`; }
function budgetCard(m){ const b = data.budget; if (!b.total) return `<button class="card-btn" data-act="budget"><span>Presupuesto mensual</span><small>Define cuánto quieres gastar al mes y la app te dirá cuánto te queda.</small></button>`;
  const spent = sum(monthTx(m, 'exp')), left = round2(b.total - spent), pct = Math.min(100, spent / b.total * 100), now = new Date(), dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), daysLeft = dim - now.getDate() + 1;
  return `<button class="budget" data-act="goSummary"><div class="budget-top"><span>Presupuesto de ${MONTHS[+m.slice(5)-1]}</span><b>${money(spent)} <small>de ${money(b.total)}</small></b></div><div class="bar-track"><i class="${pct >= 100 ? 'over' : pct >= 85 ? 'warn' : ''}" data-w="${pct.toFixed(1)}"></i></div><p>${left >= 0 ? `Te quedan ${money(left)}${m === monthKey() && left > 0 ? `, unos ${money(left / daysLeft)} por día` : ''}.` : `Te pasaste por ${money(-left)}.`}</p></button>`; }
function viewHome(){ let h = topBar(); const accs = activeAccs(), inv = accs.filter(a => a.type === 'invest');
  const avail = available(), invTotal = round2(inv.reduce((s,a) => s + investInfo(a).value, 0));
  const pend = round2(fixedPending().reduce((s,f) => s + f.amount, 0)), apart = round2(data.goals.filter(g => !g.done).reduce((s,g) => s + Math.max(0, goalSaved(g)), 0));
  h += `<div class="hero"><span>Disponible</span><b>${money(avail)}</b>${pend || apart ? `<small class="free">Libre ${money(round2(avail - pend - apart))}, después de ${[pend ? 'pagos fijos' : '', apart ? 'lo apartado para metas' : ''].filter(Boolean).join(' y ')}</small>` : ''}${inv.length ? `<small>Con inversiones: ${money(round2(avail + invTotal))}</small>` : ''}</div>`;
  h += `<div class="accs">${accs.map(a => { const v = accValue(a), ii = a.type === 'invest' ? investInfo(a) : null; return `<button class="acc" data-acc="${a.id}"><span class="acc-ic" data-c="${a.color}">${accIcon(a.type)}</span><span class="acc-name">${esc(a.name)}</span><b>${money(v)}</b>${ii && ii.invested ? `<small class="${ii.gain >= 0 ? 'pos' : 'neg'}">${money(ii.gain, true)} (${hideAmounts ? '••' : (ii.pct >= 0 ? '+' : '') + ii.pct.toFixed(1)} %)</small>` : `<small>${ACC_TYPES[a.type]}</small>`}</button>`; }).join('')}<button class="acc add" data-act="newAcc">${ic('plus',22)}<span>Agregar cuenta</span></button></div>`;
  if (data.quick.length) h += `<h2 class="section">Gastos frecuentes</h2><div class="quick">${data.quick.map(q => `<button class="quick-btn" data-quick="${q.id}"><i data-c="${CAT[q.cat].c}"></i>${esc(q.label)} <b>${money(q.amount)}</b></button>`).join('')}</div>`;
  h += budgetCard(monthKey());
  h += fixedCard();
  h += goalsBlock();
  const recent = [...data.txs].filter(t => t.type !== 'val').sort((a,b) => b.date.localeCompare(a.date) || b.at - a.at).slice(0, 6);
  h += `<div class="sec-head"><h2 class="section">Últimos movimientos</h2>${recent.length ? '<button class="link-btn" data-tab="moves">Ver todos</button>' : ''}</div>`;
  h += recent.length ? `<div class="box">${recent.map(txRow).join('')}</div>` : `<p class="hint">Toca «+» para registrar tu primer gasto o ingreso.</p>`;
  return h + fab(); }
function monthNav(){ const cur = monthKey(); return `<div class="month-nav"><button class="icon-btn" data-month="-1" aria-label="Mes anterior">${ic('chevl')}</button><b>${monthName(month)}</b><button class="icon-btn" data-month="1" aria-label="Mes siguiente" ${month >= cur ? 'disabled' : ''}>${ic('chev')}</button></div>`; }
function fixedCard(){ const act = data.fixed.filter(f => f.active);
  if (!act.length) return `<button class="card-btn" data-act="fixedList"><span>Pagos fijos y suscripciones</span><small>Agrega Netflix, internet, teléfono… para saber cuánto de tu dinero ya está comprometido.</small></button>`;
  const pend = fixedPending().sort((a,b) => fixedDay(a) - fixedDay(b)), due = pend.filter(f => ['today','late'].includes(fixedStatus(f).k));
  return `<div class="fixed-card"><button class="fixed-head" data-act="fixedList"><span>Pagos fijos</span><b>${pend.length ? `${money(pend.reduce((s,f) => s + f.amount, 0))} <small>pendientes</small>` : '<small class="pos">Todo pagado este mes</small>'}</b></button>
  ${due.map(f => `<div class="fixed-due"><span><i data-c="${CAT[f.cat].c}"></i>${esc(f.name)}<small class="${fixedStatus(f).k === 'late' ? 'neg' : 'warn-t'}">${fixedStatus(f).t}</small></span><button class="pill-btn sm" data-payfixed="${f.id}">Registrar ${money(f.amount)}</button></div>`).join('')}
  ${!due.length && pend.length ? `<p class="fixed-next">Próximo: ${esc(pend[0].name)}, ${fixedStatus(pend[0]).t.toLowerCase()}.</p>` : ''}</div>`; }
function goalsBlock(){ const gs = data.goals.filter(g => !g.done);
  if (!gs.length) return `<button class="card-btn" data-act="newGoal"><span>Metas de ahorro</span><small>Crea una meta, como un viaje o un fondo de emergencia, y ve cuánto llevas.</small></button>`;
  return `<div class="sec-head"><h2 class="section">Metas de ahorro</h2><button class="link-btn" data-act="newGoal">Nueva</button></div><div class="box">${gs.map(g => { const sv = goalSaved(g), pct = Math.min(100, sv / g.target * 100);
    return `<button class="goal-row" data-goal="${g.id}"><div class="cat-top"><span>${esc(g.name)}</span><b>${money(sv)} <small>de ${money(g.target)}</small></b></div><div class="bar-track thin"><i data-w="${pct.toFixed(1)}" class="${pct >= 100 ? 'done' : ''}"></i></div><small>${pct >= 100 ? '¡Meta cumplida!' : goalHint(g)}</small></button>`; }).join('')}</div>`; }
function goalHint(g){ const left = round2(g.target - goalSaved(g)), m = monthsUntil(g.deadline);
  if (left <= 0) return '¡Meta cumplida!'; if (!m) return `Te faltan ${money(left)}.`; if (m <= 0) return `La fecha ya pasó; te faltan ${money(left)}.`;
  return `Aparta unos ${money(round2(left / m))} al mes para lograrlo ${m === 1 ? 'este mes' : `en ${m} meses`}.`; }
function viewFixed(){ let h = `<header class="bar"><button class="icon-btn" data-act="back" aria-label="Volver">${ic('back')}</button><h1 class="title title-sm">Pagos fijos</h1><button class="icon-btn" data-act="newFixed" aria-label="Agregar pago fijo">${ic('plus')}</button></header>`;
  const l = [...data.fixed].sort((a,b) => (b.active - a.active) || fixedDay(a) - fixedDay(b));
  if (!l.length) return h + `<div class="hint">Agrega tus pagos que se repiten cada mes: suscripciones, internet, teléfono, alquiler, cuotas…<button class="btn btn-primary mt" data-act="newFixed">Agregar pago fijo</button></div>`;
  const tot = round2(l.filter(f => f.active).reduce((s,f) => s + f.amount, 0));
  h += `<div class="hero"><span>Total al mes</span><b>${money(tot)}</b><small>${plural(l.filter(f => f.active).length, 'pago activo', 'pagos activos')}</small></div><div class="box">${l.map(f => { const st = fixedStatus(f);
    return `<div class="fixed-row${f.active ? '' : ' off'}"><button class="fixed-main" data-fixed="${f.id}"><i data-c="${CAT[f.cat].c}"></i><span><b>${esc(f.name)}</b><small>${!f.active ? 'Pausado' : st.k === 'soon' ? `Día ${f.day}` : `Día ${f.day}, ${st.t.toLowerCase()}`}</small></span><em>${money(f.amount)}</em></button>${f.active && st.k !== 'paid' ? `<button class="pill-btn sm ghost" data-payfixed="${f.id}">Registrar</button>` : f.active ? `<span class="ok">${ic('check',16)}</span>` : ''}</div>`; }).join('')}</div>
  <p class="fine">Al tocar «Registrar», se crea el gasto con el monto y la categoría del pago. Puedes cambiar el monto si ese mes fue distinto.</p>`;
  return h; }
function viewFixedForm(){ const d = draft, edit = data.fixed.some(f => f.id === d.id);
  return `<header class="bar"><button class="icon-btn" data-act="back" aria-label="Cancelar">${ic('x')}</button><h1 class="title title-sm">${edit ? 'Editar pago fijo' : 'Nuevo pago fijo'}</h1><button class="btn-save" data-act="saveFixed">Guardar</button></header>
  <label class="field"><span>Nombre</span><input id="x_name" value="${esc(d.name)}" maxlength="60" placeholder="Netflix" ${NO_SPELL}><em class="err" id="e_xname"></em></label>
  <div class="two"><label class="field"><span>Monto</span><div class="money"><input id="x_amount" type="text" inputmode="decimal" value="${d.amount || ''}" placeholder="0.00" ${NO_SPELL}></div></label><label class="field"><span>Día del mes</span><input id="x_day" type="text" inputmode="numeric" value="${d.day || ''}" placeholder="15" ${NO_SPELL}></label></div>
  <div class="field"><span>Categoría</span>${chips('xcat', CATS.exp, d.cat)}</div>
  <div class="field"><span>Se paga con</span>${chips('xacc', accChoices(null, false), d.acc)}</div>
  ${edit ? `<button class="btn btn-secondary" data-act="toggleFixed">${d.active ? 'Pausar este pago' : 'Reactivar este pago'}</button><button class="btn btn-danger-text" data-act="delFixed">Eliminar pago fijo</button>` : ''}`; }
function viewGoal(){ const g = data.goals.find(x => x.id === view.id); if (!g){ view = {name:'home'}; return viewHome(); }
  const sv = goalSaved(g), pct = Math.min(100, sv / g.target * 100);
  return `<header class="bar"><button class="icon-btn" data-act="back" aria-label="Volver">${ic('back')}</button><h1 class="title title-sm">${esc(g.name)}</h1><button class="icon-btn" data-act="editGoal" aria-label="Editar meta">${ic('edit')}</button></header>
  <div class="hero"><span>Llevas</span><b>${money(sv)}</b><small>de ${money(g.target)}${g.deadline ? `, para ${monthName(g.deadline).toLowerCase()}` : ''}</small></div>
  <div class="bar-track goal-bar"><i data-w="${pct.toFixed(1)}" class="${pct >= 100 ? 'done' : ''}"></i></div><p class="fine">${goalHint(g)}</p>
  <div class="two-btn"><button class="btn btn-primary" data-act="goalAdd">Apartar dinero</button><button class="btn btn-secondary" data-act="goalSub">Sacar dinero</button></div>
  <p class="fine">El dinero apartado no sale de tus cuentas: solo se reserva, y en Inicio verás cuánto te queda libre.</p>
  ${pct >= 100 ? `<button class="btn btn-secondary" data-act="goalDone">Marcar como cumplida y liberar el dinero</button>` : ''}
  ${g.moves.length ? `<h2 class="section">Historial</h2><div class="box">${[...g.moves].reverse().slice(0, 30).map(m => `<div class="row"><span>${esc(dayLabel(m.d))}</span><b class="${m.a >= 0 ? 'pos' : ''}">${money(m.a, true)}</b></div>`).join('')}</div>` : ''}`; }
function viewGoalForm(){ const d = draft, edit = data.goals.some(g => g.id === d.id);
  return `<header class="bar"><button class="icon-btn" data-act="back" aria-label="Cancelar">${ic('x')}</button><h1 class="title title-sm">${edit ? 'Editar meta' : 'Nueva meta'}</h1><button class="btn-save" data-act="saveGoal">Guardar</button></header>
  <label class="field"><span>Nombre</span><input id="g_name" value="${esc(d.name)}" maxlength="60" placeholder="Viaje, teléfono nuevo, fondo de emergencia…" ${NO_SPELL}><em class="err" id="e_gname"></em></label>
  <label class="field"><span>¿Cuánto quieres juntar?</span><div class="money"><input id="g_target" type="text" inputmode="decimal" value="${d.target || ''}" placeholder="0.00" ${NO_SPELL}></div><em class="err" id="e_gtarget"></em></label>
  <label class="field"><span>¿Para cuándo? (opcional)</span><input id="g_deadline" type="month" value="${d.deadline || ''}" min="${monthKey()}"></label>
  ${edit ? '' : `<label class="field"><span>¿Ya tienes algo ahorrado para esto? (opcional)</span><div class="money"><input id="g_start" type="text" inputmode="decimal" placeholder="0.00" ${NO_SPELL}></div></label>`}
  ${edit ? `<button class="btn btn-danger-text mt" data-act="delGoal">Eliminar meta</button>` : ''}`; }
function amountSheet(title, text, ok){ return new Promise(res => { sheetRes = res; openOverlay(`<div class="sheet" role="dialog" aria-modal="true"><h2>${esc(title)}</h2><p>${esc(text)}</p><label class="amount"><span>$</span><input id="s_amount" type="text" inputmode="decimal" placeholder="0.00" ${NO_SPELL}></label><em class="err center-t" id="e_s"></em><button class="btn btn-primary" data-act="sheetAmount">${esc(ok)}</button><button class="btn btn-ghost" data-act="confirmNo">Cancelar</button></div>`, 'dim'); setTimeout(() => { const i = $('#s_amount'); if (i) i.focus(); }, 80); }); }
function viewMoves(){ let h = topBar() + monthNav(); const l = monthTx(month).filter(t => t.type !== 'val').sort((a,b) => b.date.localeCompare(a.date) || b.at - a.at);
  const inc = sum(l.filter(t => t.type === 'inc')), exp = sum(l.filter(t => t.type === 'exp'));
  h += `<div class="mini-stats"><div><span>Ingresos</span><b class="pos">${money(inc)}</b></div><div><span>Gastos</span><b>${money(exp)}</b></div></div>`;
  if (!l.length) return h + `<p class="hint">No hay movimientos en ${monthName(month).toLowerCase()}.</p>` + fab();
  const days = [...new Set(l.map(t => t.date))];
  h += days.map(d => { const dl = l.filter(t => t.date === d), dayExp = sum(dl.filter(t => t.type === 'exp')); return `<div class="day-head"><span>${esc(dayLabel(d))}</span>${dayExp ? `<span>${money(-dayExp)}</span>` : ''}</div><div class="box">${dl.map(txRow).join('')}</div>`; }).join('');
  return h + fab(); }
function viewSummary(){ let h = topBar() + monthNav(); const l = monthTx(month), inc = sum(l.filter(t => t.type === 'inc')), exp = sum(l.filter(t => t.type === 'exp')), bal = round2(inc - exp);
  const prevExp = sum(monthTx(shiftMonth(month, -1), 'exp'));
  h += `<div class="sum-grid"><div class="metric"><span>Ingresos</span><b class="pos">${money(inc)}</b></div><div class="metric"><span>Gastos</span><b>${money(exp)}</b>${prevExp ? `<small>${exp > prevExp ? 'Más' : 'Menos'} que el mes anterior: ${money(Math.abs(round2(exp - prevExp)))}</small>` : ''}</div><div class="metric wide"><span>Balance del mes</span><b class="${bal >= 0 ? 'pos' : 'neg'}">${money(bal, true)}</b><small>${inc ? (bal >= 0 ? `Ahorraste el ${hideAmounts ? '••' : Math.round(bal / inc * 100)} % de lo que entró.` : 'Gastaste más de lo que entró.') : ''}</small></div></div>`;
  if (data.budget.total){ h += budgetCard(month); }
  const by = spentBy(month), cats = Object.entries(by).sort((a,b) => b[1] - a[1]);
  if (cats.length){ const top = cats[0][1];
    h += `<h2 class="section">En qué gastaste</h2><div class="box">${cats.map(([k, v]) => { const lim = data.budget.cats[k], pct = lim ? v / lim * 100 : v / top * 100;
      return `<div class="cat-row"><div class="cat-top"><span><i data-c="${CAT[k].c}"></i>${esc(CAT[k].n)}</span><b>${money(v)}${lim ? ` <small>de ${money(lim)}</small>` : ''}</b></div><div class="bar-track thin"><i class="${lim && pct >= 100 ? 'over' : lim && pct >= 85 ? 'warn' : ''}" data-w="${Math.min(100, pct).toFixed(1)}" data-c="${CAT[k].c}"></i></div><small>${hideAmounts ? '••' : Math.round(v / exp * 100)} % de tus gastos${lim ? (v > lim ? `, te pasaste por ${money(round2(v - lim))}` : `, te quedan ${money(round2(lim - v))}`) : ''}</small></div>`; }).join('')}</div>`; }
  else h += '<p class="hint">Todavía no hay gastos este mes.</p>';
  const inv = activeAccs().filter(a => a.type === 'invest');
  if (inv.length) h += `<h2 class="section">Inversiones</h2><div class="box">${inv.map(a => { const ii = investInfo(a); return `<button class="row-btn" data-acc="${a.id}"><span>${esc(a.name)}<small>Invertido ${money(ii.invested)}</small></span><b>${money(ii.value)}<small class="${ii.gain >= 0 ? 'pos' : 'neg'}">${money(ii.gain, true)}</small></b></button>`; }).join('')}</div>`;
  return h + fab(); }
function viewAccount(){ const a = accById(view.id); if (!a){ view = {name:tab}; return viewHome(); }
  let h = `<header class="bar"><button class="icon-btn" data-act="back" aria-label="Volver">${ic('back')}</button><h1 class="title title-sm">${esc(a.name)}</h1><button class="icon-btn" data-act="editAcc" aria-label="Editar cuenta">${ic('edit')}</button></header>`;
  if (a.type === 'invest'){ const ii = investInfo(a);
    h += `<div class="hero"><span>Valor actual</span><b>${money(ii.value)}</b><small class="${ii.gain >= 0 ? 'pos' : 'neg'}">${money(ii.gain, true)} (${hideAmounts ? '••' : (ii.pct >= 0 ? '+' : '') + ii.pct.toFixed(2)} %) desde que empezaste</small></div>
    <div class="box"><div class="row"><span>Dinero que has puesto</span><b>${money(ii.invested)}</b></div><div class="row"><span>Ganancia o pérdida</span><b class="${ii.gain >= 0 ? 'pos' : 'neg'}">${money(ii.gain, true)}</b></div><div class="row"><span>Último valor anotado</span><b>${ii.last ? esc(dayLabel(ii.last.date)) : 'Todavía no'}</b></div></div>
    <button class="btn btn-primary" data-act="valueInv">Anotar el valor actual</button><div class="two-btn"><button class="btn btn-secondary" data-act="depositInv">Depositar</button><button class="btn btn-secondary" data-act="withdrawInv">Retirar</button></div>
    <p class="fine">Abre Hapi, mira el valor total de tu cuenta y anótalo aquí de vez en cuando. Con eso la app calcula tu ganancia. Los depósitos y retiros se registran como transferencias desde o hacia tus otras cuentas.</p>`;
    if (ii.vals.length > 1) h += `<h2 class="section">Historial de valor</h2><div class="box">${[...ii.vals].reverse().slice(0, 12).map(v => `<button class="tx" data-tx="${v.id}"><span class="tx-main"><b>${esc(dayLabel(v.date))}</b></span><span class="tx-amt">${money(v.amount)}</span></button>`).join('')}</div>`;
  } else {
    h += `<div class="hero"><span>${ACC_TYPES[a.type]}</span><b>${money(balance(a))}</b></div><div class="two-btn"><button class="btn btn-secondary" data-act="adjAcc">Ajustar saldo</button><button class="btn btn-secondary" data-act="trFrom">Transferir</button></div>`; }
  const l = data.txs.filter(t => t.type !== 'val' && (t.acc === a.id || t.to === a.id)).sort((x,y) => y.date.localeCompare(x.date) || y.at - x.at).slice(0, 60);
  h += `<h2 class="section">Movimientos</h2>` + (l.length ? `<div class="box">${l.map(txRow).join('')}</div>` : '<p class="hint">Sin movimientos todavía.</p>');
  return h; }
function chips(name, list, sel){ return `<div class="pick">${list.map(([k, n, c]) => `<button type="button" class="pick-chip${sel === k ? ' on' : ''}" data-${name}="${k}">${c ? `<i data-c="${c}"></i>` : ''}${esc(n)}</button>`).join('')}</div>`; }
const accChoices = (excl, invest = true) => activeAccs().filter(a => a.id !== excl && (invest || a.type !== 'invest')).map(a => [a.id, a.name, a.color]);
function viewTx(){ const d = draft, edit = !!d.id && data.txs.some(t => t.id === d.id);
  const types = [['exp','Gasto'],['inc','Ingreso'],['tr','Transferencia']];
  let h = `<header class="bar"><button class="icon-btn" data-act="back" aria-label="Cancelar">${ic('x')}</button><h1 class="title title-sm">${edit ? 'Editar' : 'Nuevo'} ${d.type === 'adj' ? 'ajuste' : d.type === 'val' ? 'valor' : 'movimiento'}</h1><button class="btn-save" data-act="saveTx">Guardar</button></header>`;
  if (['exp','inc','tr'].includes(d.type)) h += `<div class="seg">${types.map(([k,n]) => `<button type="button" class="${d.type===k?'on':''}" data-ttype="${k}">${n}</button>`).join('')}</div>`;
  h += `<label class="amount"><span>$</span><input id="t_amount" type="text" inputmode="decimal" placeholder="0.00" value="${d.amount != null ? d.amount : ''}" ${NO_SPELL}></label><em class="err center-t" id="e_amount"></em>`;
  if (d.type === 'adj') h += `<p class="fine center-t">Escribe el saldo real que tienes ahora en ${esc(accById(d.acc).name)}. La app registrará la diferencia.</p>`;
  if (d.type === 'exp' || d.type === 'inc') h += `<div class="field"><span>Categoría</span>${chips('tcat', CATS[d.type], d.cat)}</div>`;
  if (d.type === 'tr') h += `<div class="field"><span>Desde</span>${chips('tacc', accChoices(null), d.acc)}</div><div class="field"><span>Hacia</span>${chips('tto', accChoices(d.acc), d.to)}</div>`;
  else if (d.type === 'exp' || d.type === 'inc') h += `<div class="field"><span>${d.type === 'exp' ? 'Pagaste con' : 'Entró a'}</span>${chips('tacc', accChoices(null, false), d.acc)}</div>`;
  h += `<div class="two"><label class="field"><span>Fecha</span><input id="t_date" type="date" value="${d.date}" max="${todayKey()}"></label>${d.type !== 'val' && d.type !== 'adj' ? `<label class="field"><span>Nota</span><input id="t_note" value="${esc(d.note)}" maxlength="200" placeholder="Opcional" ${NO_SPELL}></label>` : ''}</div>`;
  if (!edit && d.type === 'exp' && !d.fixedId) h += `<label class="check"><input type="checkbox" id="t_quick"> Guardar como gasto frecuente</label>`;
  if (d.fixedId) h += `<p class="fine">Pago de ${esc((data.fixed.find(f => f.id === d.fixedId) || {}).name || '')}. Quedará marcado como pagado este mes.</p>`;
  if (edit) h += `<button class="btn btn-danger-text mt" data-act="delTx">Eliminar movimiento</button>`;
  return h; }
function viewAccForm(){ const d = draft, edit = !!accById(d.id);
  let h = `<header class="bar"><button class="icon-btn" data-act="back" aria-label="Cancelar">${ic('x')}</button><h1 class="title title-sm">${edit ? 'Editar cuenta' : 'Nueva cuenta'}</h1><button class="btn-save" data-act="saveAcc">Guardar</button></header>`;
  h += `<div class="field"><span>Tipo</span>${chips('atype', Object.entries(ACC_TYPES).map(([k,n]) => [k, n]), d.type)}</div>
  <label class="field"><span>Nombre</span><input id="a_name" value="${esc(d.name)}" maxlength="60" placeholder="${d.type === 'cash' ? 'Efectivo' : d.type === 'invest' ? 'Hapi' : 'Tarjeta de débito'}" ${NO_SPELL}><em class="err" id="e_name"></em></label>
  ${edit ? '' : `<label class="field"><span>${d.type === 'invest' ? 'Valor actual' : 'Saldo actual'}</span><div class="money"><input id="a_initial" type="text" inputmode="decimal" value="${d.initial || ''}" placeholder="0.00" ${NO_SPELL}></div><small>${d.type === 'invest' ? 'Lo que vale hoy tu cuenta de inversión. Se toma como lo que ya habías invertido.' : 'Lo que tienes hoy en esta cuenta.'}</small></label>`}
  <div class="field"><span>Color</span><div class="colors">${COLORS.map(c => `<button type="button" class="color${d.color === c ? ' on' : ''}" data-acolor="${c}" data-c="${c}" aria-label="Color"></button>`).join('')}</div></div>`;
  if (edit) h += `<button class="btn btn-secondary" data-act="archiveAcc">${d.archived ? 'Volver a mostrar la cuenta' : 'Ocultar la cuenta'}</button><button class="btn btn-danger-text" data-act="delAcc">Eliminar cuenta y sus movimientos</button>`;
  return h; }
function viewWelcome(){ return `<div class="welcome"><div class="lock-mark">${ic('cash',30)}</div><h1 class="lock-title">Empecemos con tus cuentas</h1><p class="lock-sub">Escribe cuánto tienes hoy en cada una. Podrás agregar más después.</p>
  <label class="field"><span>Efectivo</span><div class="money"><input id="w_cash" type="text" inputmode="decimal" placeholder="0.00" ${NO_SPELL}></div></label>
  <label class="field"><span>Tarjeta de débito</span><div class="money"><input id="w_debit" type="text" inputmode="decimal" placeholder="0.00" ${NO_SPELL}></div></label>
  <label class="field"><span>Nombre de la tarjeta</span><input id="w_debitName" placeholder="Tarjeta de débito" maxlength="60" ${NO_SPELL}></label>
  <label class="check"><input type="checkbox" id="w_hapi"> También tengo una cuenta en Hapi</label>
  <label class="field" id="w_hapiField" hidden><span>Valor actual de Hapi</span><div class="money"><input id="w_hapiVal" type="text" inputmode="decimal" placeholder="0.00" ${NO_SPELL}></div></label>
  <button class="btn btn-primary" data-act="welcomeDone">Listo</button></div>`; }
function viewBudget(){ const b = data.budget, spent = spentBy(monthKey());
  return `<header class="bar"><button class="icon-btn" data-act="back" aria-label="Cancelar">${ic('x')}</button><h1 class="title title-sm">Presupuesto mensual</h1><button class="btn-save" data-act="saveBudget">Guardar</button></header>
  <label class="field"><span>Cuánto quieres gastar al mes en total</span><div class="money"><input id="b_total" type="text" inputmode="decimal" value="${b.total || ''}" placeholder="0.00" ${NO_SPELL}></div><small>Déjalo vacío para no usar presupuesto.</small></label>
  <h2 class="section">Límite por categoría (opcional)</h2><div class="box">${CATS.exp.map(([k, n, c]) => `<label class="bud-row"><span><i data-c="${c}"></i>${esc(n)}${spent[k] ? `<small>Este mes: ${money(spent[k])}</small>` : ''}</span><div class="money sm"><input data-bcat="${k}" type="text" inputmode="decimal" value="${b.cats[k] || ''}" placeholder="—" ${NO_SPELL}></div></label>`).join('')}</div>`; }
function viewSettings(){ const bio = !!meta.bio, standalone = window.matchMedia('(display-mode: standalone)').matches, hidden = data.accounts.filter(a => a.archived);
  return `<header class="bar"><button class="icon-btn" data-act="back" aria-label="Volver">${ic('back')}</button><h1 class="title title-sm">Ajustes</h1><span class="spacer"></span></header>
  <h2 class="section">Seguridad</h2><div class="box">
  ${bioOK?`<button class="set-row" data-act="toggleBio" role="switch" aria-checked="${bio}"><span>Abrir con huella<small>Tu huella también descifra tus datos</small></span><span class="sw ${bio?'on':''}"></span></button>`:`<p class="fine">Este navegador no permite usar la huella. La app usa tu PIN.</p>`}
  <button class="set-row" data-act="changePin"><span>Cambiar PIN</span><span class="chev">${ic('chev',18)}</span></button>
  <button class="set-row" data-act="lockNow"><span>Bloquear ahora</span><span class="chev">${ic('lock',18)}</span></button></div>
  <h2 class="section">Presupuesto y pagos</h2><div class="box"><button class="set-row" data-act="budget"><span>Presupuesto mensual<small>${data.budget.total ? money(data.budget.total) + ' al mes' : 'Sin definir'}</small></span><span class="chev">${ic('chev',18)}</span></button><button class="set-row" data-act="fixedList"><span>Pagos fijos y suscripciones<small>${plural(data.fixed.filter(f => f.active).length, 'pago activo', 'pagos activos')}</small></span><span class="chev">${ic('chev',18)}</span></button></div>
  ${data.quick.length ? `<h2 class="section">Gastos frecuentes</h2><div class="box">${data.quick.map(q => `<div class="set-row"><span>${esc(q.label)}<small>${money(q.amount)}, ${esc(CAT[q.cat].n)}</small></span><button class="icon-btn" data-delquick="${q.id}" aria-label="Quitar">${ic('trash',18)}</button></div>`).join('')}</div>` : ''}
  ${hidden.length ? `<h2 class="section">Cuentas ocultas</h2><div class="box">${hidden.map(a => `<button class="set-row" data-acc="${a.id}"><span>${esc(a.name)}<small>${ACC_TYPES[a.type]}</small></span><span class="chev">${ic('chev',18)}</span></button>`).join('')}</div>` : ''}
  <h2 class="section">Copia de seguridad</h2><div class="box">
  <button class="set-row" data-act="exportBk"><span>Descargar copia cifrada<small>Solo se puede abrir con tu PIN actual</small></span><span class="chev">${ic('down',18)}</span></button>
  <label class="set-row"><span>Restaurar una copia<small>Reemplaza todo lo que hay ahora</small></span><span class="chev">${ic('up',18)}</span><input type="file" accept="application/json,.json" id="f_import" hidden></label></div>
  <h2 class="section">Instalación</h2><div class="box">${standalone?'<p class="fine">Ya estás usando la app instalada.</p>':installEvt?`<button class="set-row" data-act="install"><span>Instalar Mis finanzas en el celular</span><span class="chev">${ic('down',18)}</span></button>`:'<p class="fine">Chrome todavía no ofrece instalarla. Abre la app en Chrome con internet, espera unos segundos y vuelve a entrar aquí.</p>'}</div>
  <h2 class="section">Privacidad</h2><div class="box"><p class="fine">Tus datos se guardan cifrados solo en este celular. La app no se conecta a internet: no envía ni recibe datos, y nada de esto llega a GitHub.</p></div>
  <button class="btn btn-danger-text mt" data-act="wipe">Borrar todos mis datos</button><p class="ver">Versión ${APP_VERSION}</p>`; }
function paint(){ document.querySelectorAll('[data-c]').forEach(e => { const c = e.dataset.c; if (e.classList.contains('color') || e.classList.contains('acc-ic') || e.tagName === 'I' || e.classList.contains('tx-dot')) e.style.setProperty('--c', c); });
  document.querySelectorAll('[data-w]').forEach(e => { e.style.width = e.dataset.w + '%'; }); }
function render(){ if (!unlocked) return;
  const f = {fixed:viewFixed, fixedForm:viewFixedForm, goal:viewGoal, goalForm:viewGoalForm, home:viewHome, moves:viewMoves, summary:viewSummary, account:viewAccount, tx:viewTx, accForm:viewAccForm, welcome:viewWelcome, budget:viewBudget, settings:viewSettings}[view.name] || viewHome;
  main.innerHTML = f(); paint(); }

/* ---------- Acciones ---------- */
function newTxDraft(type, extra){ const accs = activeAccs(), nonInv = accs.filter(a => a.type !== 'invest');
  return Object.assign({id:null, type, amount:null, acc:(nonInv[0] || accs[0] || {}).id, to:null, cat:type === 'inc' ? 'salario' : type === 'exp' ? 'comida' : null, note:'', date:todayKey()}, extra || {}); }
function readAmount(){ const v = num($('#t_amount').value); return v; }
const A = {
  settings(){ go({name:'settings'}); },
  back(){ back(); },
  toggleHide(){ hideAmounts = !hideAmounts; LS.set('mf_hide', hideAmounts ? '1' : '0'); render(); },
  goSummary(){ tab = 'summary'; view = {name:'summary'}; month = monthKey(); render(); },
  newTx(){ if (!activeAccs().length) return toast('Primero agrega una cuenta.'); draft = newTxDraft('exp'); go({name:'tx'}); },
  newAcc(){ draft = {id:null, type:'debit', name:'', initial:null, color:COLORS[data.accounts.length % COLORS.length], archived:false}; go({name:'accForm'}); },
  editAcc(){ const a = accById(view.id); if (!a) return; draft = Object.assign({}, a); go({name:'accForm'}); },
  async saveAcc(){ const name = $('#a_name').value.trim() || ($('#a_name').placeholder || '').trim(); if (!name){ $('#e_name').textContent = 'Escribe un nombre.'; return; }
    const ex = accById(draft.id);
    if (ex){ ex.name = name; ex.type = draft.type; ex.color = draft.color; }
    else data.accounts.push({id:uid(), name, type:draft.type, color:draft.color, initial:num(($('#a_initial') || {}).value) || 0, archived:false, order:data.accounts.length});
    data = cleanData(data); await saveData(); draft = null; toast('Cuenta guardada'); back(); },
  async archiveAcc(){ const a = accById(draft.id); if (!a) return; a.archived = !a.archived; await saveData(); draft = null; toast(a.archived ? 'Cuenta oculta. La encuentras en Ajustes.' : 'Cuenta visible otra vez'); back(); },
  async delAcc(){ const a = accById(draft.id); if (!a) return; const n = data.txs.filter(t => t.acc === a.id || t.to === a.id).length;
    if (!await confirmBox(`¿Eliminar ${a.name}?`, n ? `También se borrarán sus ${plural(n, 'movimiento', 'movimientos')}. Si solo quieres dejar de verla, mejor ocúltala.` : 'Esta cuenta no tiene movimientos.', 'Eliminar')) return;
    data.txs = data.txs.filter(t => t.acc !== a.id && t.to !== a.id); data.accounts = data.accounts.filter(x => x.id !== a.id); await saveData(); draft = null;
    const n2 = hist.length; resetNav(); view = {name:'home'}; tab = 'home'; render(); toast('Cuenta eliminada'); },
  adjAcc(){ const a = accById(view.id); draft = newTxDraft('adj', {acc:a.id, amount:balance(a)}); go({name:'tx'}); },
  trFrom(){ const a = accById(view.id), other = activeAccs().find(x => x.id !== a.id); if (!other) return toast('Necesitas otra cuenta para transferir.'); draft = newTxDraft('tr', {acc:a.id, to:other.id}); go({name:'tx'}); },
  valueInv(){ const a = accById(view.id); draft = newTxDraft('val', {acc:a.id, amount:investInfo(a).value}); go({name:'tx'}); },
  depositInv(){ const a = accById(view.id), from = activeAccs().find(x => x.type === 'debit') || activeAccs().find(x => x.id !== a.id); if (!from) return toast('Necesitas otra cuenta.'); draft = newTxDraft('tr', {acc:from.id, to:a.id}); go({name:'tx'}); },
  withdrawInv(){ const a = accById(view.id), to = activeAccs().find(x => x.type === 'debit') || activeAccs().find(x => x.id !== a.id); if (!to) return toast('Necesitas otra cuenta.'); draft = newTxDraft('tr', {acc:a.id, to:to.id}); go({name:'tx'}); },
  async saveTx(){ const amt = readAmount(), e = $('#e_amount');
    if (amt === null || (draft.type !== 'adj' && amt <= 0) || (draft.type === 'adj' && amt < 0 && false)){ e.textContent = 'Escribe un monto válido.'; $('#t_amount').focus(); return; }
    if (draft.type === 'tr' && (!draft.to || draft.to === draft.acc)){ e.textContent = 'Elige la cuenta de destino.'; return; }
    if (!accById(draft.acc)){ e.textContent = 'Elige una cuenta.'; return; }
    const date = DATE_RE.test($('#t_date').value) ? $('#t_date').value : todayKey(), note = ($('#t_note') || {value:''}).value.trim();
    let t = data.txs.find(x => x.id === draft.id);
    let amount = amt;
    if (draft.type === 'adj'){ const a = accById(draft.acc), cur = round2(balance(a) - (t ? t.amount : 0)); amount = round2(amt - cur); if (!amount){ toast('El saldo ya coincide.'); draft = null; return back(); } }
    const rec = {id:t ? t.id : uid(), type:draft.type, amount, acc:draft.acc, to:draft.type === 'tr' ? draft.to : null, cat:['exp','inc'].includes(draft.type) ? draft.cat : null, note, date, at:t ? t.at : Date.now()};
    if (t) Object.assign(t, rec); else data.txs.push(rec);
    if (!t && draft.fixedId){ const f = data.fixed.find(x => x.id === draft.fixedId); if (f && date.startsWith(monthKey())) f.paid = monthKey(); }
    const qb = $('#t_quick'); if (!t && qb && qb.checked && data.quick.length < 20) data.quick.push({id:uid(), label:(note || CAT[rec.cat].n).slice(0, 40), amount:rec.amount, cat:rec.cat, acc:rec.acc});
    data = cleanData(data); await saveData(); const wasNew = !t; draft = null; back();
    toast(wasNew ? (rec.type === 'exp' ? 'Gasto guardado' : rec.type === 'inc' ? 'Ingreso guardado' : rec.type === 'val' ? 'Valor anotado' : 'Guardado') : 'Cambios guardados');
    if (wasNew && rec.type === 'exp') setTimeout(budgetAlert, 400, rec); },
  async delTx(){ if (!await confirmBox('¿Eliminar este movimiento?', 'Los saldos se recalculan solos.', 'Eliminar')) return; data.txs = data.txs.filter(t => t.id !== draft.id); await saveData(); draft = null; toast('Movimiento eliminado'); back(); },
  budget(){ go({name:'budget'}); },
  fixedList(){ go({name:'fixed'}); },
  newFixed(){ const a = activeAccs().find(x => x.type === 'debit') || activeAccs()[0]; draft = {id:null, name:'', amount:null, day:null, cat:'suscripciones', acc:a ? a.id : null, active:true, paid:''}; go({name:'fixedForm'}); },
  async saveFixed(){ const name = $('#x_name').value.trim(), amount = num($('#x_amount').value), day = parseInt($('#x_day').value, 10);
    if (!name) return void ($('#e_xname').textContent = 'Escribe un nombre.'); if (!(amount > 0)) return toast('Escribe el monto.'); if (!(day >= 1 && day <= 31)) return toast('Escribe un día entre 1 y 31.');
    const ex = data.fixed.find(f => f.id === draft.id), rec = {id:ex ? ex.id : uid(), name, amount, day, cat:draft.cat, acc:draft.acc, active:draft.active, paid:ex ? ex.paid : ''};
    if (ex) Object.assign(ex, rec); else data.fixed.push(rec); data = cleanData(data); await saveData(); draft = null; toast('Pago fijo guardado'); back(); },
  async toggleFixed(){ const f = data.fixed.find(x => x.id === draft.id); if (!f) return; f.active = !f.active; await saveData(); draft = null; toast(f.active ? 'Pago reactivado' : 'Pago pausado'); back(); },
  async delFixed(){ if (!await confirmBox('¿Eliminar este pago fijo?', 'Los gastos que ya registraste se quedan.', 'Eliminar')) return; data.fixed = data.fixed.filter(f => f.id !== draft.id); await saveData(); draft = null; toast('Pago eliminado'); back(); },
  newGoal(){ draft = {id:null, name:'', target:null, deadline:''}; go({name:'goalForm'}); },
  editGoal(){ const g = data.goals.find(x => x.id === view.id); if (!g) return; draft = Object.assign({}, g); go({name:'goalForm'}); },
  async saveGoal(){ const name = $('#g_name').value.trim(), target = num($('#g_target').value), dl = $('#g_deadline').value;
    if (!name) return void ($('#e_gname').textContent = 'Escribe un nombre.'); if (!(target > 0)) return void ($('#e_gtarget').textContent = 'Escribe cuánto quieres juntar.');
    const ex = data.goals.find(g => g.id === draft.id);
    if (ex) Object.assign(ex, {name, target, deadline:/^\d{4}-\d{2}$/.test(dl) ? dl : ''});
    else { const st = num(($('#g_start') || {}).value); data.goals.push({id:uid(), name, target, deadline:/^\d{4}-\d{2}$/.test(dl) ? dl : '', moves:st > 0 ? [{d:todayKey(), a:st}] : [], done:false}); }
    data = cleanData(data); await saveData(); draft = null; toast('Meta guardada'); back(); },
  async delGoal(){ if (!await confirmBox('¿Eliminar esta meta?', 'El dinero apartado vuelve a contar como libre. Tus cuentas no cambian.', 'Eliminar')) return; data.goals = data.goals.filter(g => g.id !== draft.id); await saveData(); draft = null; resetNav(); view = {name:'home'}; tab = 'home'; render(); toast('Meta eliminada'); },
  async goalAdd(){ const g = data.goals.find(x => x.id === view.id); if (!g) return; const v = await amountSheet('Apartar dinero', `Para «${g.name}».`, 'Apartar'); if (!(v > 0)) return; g.moves.push({d:todayKey(), a:v}); await saveData(); render(); toast(goalSaved(g) >= g.target ? '¡Cumpliste tu meta!' : 'Dinero apartado'); },
  async goalSub(){ const g = data.goals.find(x => x.id === view.id); if (!g) return; const v = await amountSheet('Sacar dinero', `De «${g.name}». Vuelve a contar como libre.`, 'Sacar'); if (!(v > 0)) return; g.moves.push({d:todayKey(), a:-Math.min(v, goalSaved(g))}); await saveData(); render(); toast('Listo'); },
  async goalDone(){ const g = data.goals.find(x => x.id === view.id); if (!g) return; g.done = true; await saveData(); toast('¡Felicidades por cumplir tu meta!'); back(); },
  sheetAmount(){ const v = num($('#s_amount').value); if (!(v > 0)) return void ($('#e_s').textContent = 'Escribe un monto válido.'); resolveSheet(v); },
  async saveBudget(){ data.budget.total = num($('#b_total').value) > 0 ? num($('#b_total').value) : null; const cats = {};
    document.querySelectorAll('[data-bcat]').forEach(i => { const v = num(i.value); if (v > 0) cats[i.dataset.bcat] = v; }); data.budget.cats = cats; await saveData(); toast('Presupuesto guardado'); back(); },
  async welcomeDone(){ const accs = [], add = (name, type, v, i) => accs.push({id:uid(), name, type, color:COLORS[i], initial:num(v) || 0, archived:false, order:i});
    add('Efectivo', 'cash', $('#w_cash').value, 0); add($('#w_debitName').value.trim() || 'Tarjeta de débito', 'debit', $('#w_debit').value, 1);
    if ($('#w_hapi').checked) add('Hapi', 'invest', $('#w_hapiVal').value, 2);
    data.accounts = accs; data = cleanData(data); await saveData(); view = {name:'home'}; tab = 'home'; render(); toast('¡Listo! Toca «+» para registrar un gasto.'); },
  confirmOk(){ const c = confirmRes; confirmRes = null; closeOverlay(() => { if (c) c(true); }); },
  confirmNo(){ resolveSheet(null); },
  cancelPrompt(){ resolveSheet(null); },
  async bio(){ if (bioBusy) return; bioBusy = true; try { dek = await unwrap(meta.bio.w, await bioKek(meta.bio.id, meta.bio.prfSalt), false); succeeded(); await afterUnlock(); }
    catch(e){ setSub(e.noprf ? 'Tu huella no pudo descifrar los datos. Usa tu PIN.' : 'Toca «Usar huella» para intentarlo otra vez o usa tu PIN.'); } finally { bioBusy = false; } },
  async bioOn(){ try { await enableBio(pendingKey); toast('Huella activada'); } catch(e){ meta.bio = null; toast(e.noprf ? 'Tu celular no permite usar la huella para cifrar. Usarás tu PIN.' : 'No se pudo activar la huella. Puedes intentarlo después en Ajustes.'); } await afterUnlock(); },
  async bioSkip(){ await afterUnlock(); },
  async toggleBio(){ if (meta.bio){ meta.bio = null; await DB.put('meta', meta); toast('Huella desactivada'); return render(); }
    const k = await pinPrompt('Confirma tu PIN', 'Para activar la huella.', p => verifyPin(p, true)); if (!k) return;
    try { await enableBio(k); toast('Huella activada'); } catch(e){ meta.bio = null; toast(e.noprf ? 'Tu celular no permite usar la huella para cifrar.' : 'No se pudo activar la huella.'); } render(); },
  async changePin(){ const k = await pinPrompt('PIN actual', 'Escribe tu PIN actual.', p => verifyPin(p, true)); if (!k) return;
    openOverlay('', 'full'); newPinFlow(ov, async pin => { const salt = b64(rnd(16)); meta.pin = await wrap(k, await pinKey(pin, salt, ITER)); meta.salt = salt; meta.iter = ITER; await DB.put('meta', meta); closeOverlay(); toast('PIN actualizado'); }, true); },
  lockNow(){ lock(); },
  async exportBk(){ const rec = await DB.get('docs', 'state'); const out = {app:'mis-finanzas', v:1, created:new Date().toISOString(), salt:meta.salt, iter:meta.iter, pin:meta.pin, state:rec};
    const url = URL.createObjectURL(new Blob([JSON.stringify(out)], {type:'application/json'})), a = document.createElement('a'); a.href = url; a.download = `mis-finanzas-copia-${todayKey()}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000); toast('Copia cifrada descargada'); },
  async wipe(){ if (!await confirmBox('¿Borrar todos tus datos?', 'Se eliminan tus cuentas, movimientos y presupuesto de este celular. No se puede deshacer.', 'Borrar todo')) return;
    data = cleanData(null); await saveData(); resetNav(); view = {name:'welcome'}; tab = 'home'; render(); toast('Datos borrados'); },
  async forgot(){ if (!await confirmBox('¿Empezar de cero?', 'Sin tu PIN no hay forma de descifrar tus datos. Se borrarán todos y crearás un PIN nuevo.', 'Borrar y empezar')) return;
    await DB.clear('docs'); await DB.clear('meta'); meta = null; succeeded(); renderLock(); },
  async install(){ if (!installEvt) return; const e = installEvt; installEvt = null; try { await e.prompt(); await e.userChoice; } catch(err){} render(); }
};
let undoFn = null;
function toastUndo(msg, fn){ const t = $('#toast'); t.textContent = msg + '. Toca para deshacer'; t.classList.add('show', 'undo'); undoFn = fn; clearTimeout(toast.t); toast.t = setTimeout(() => { t.classList.remove('show', 'undo'); undoFn = null; }, 4500); }
async function quickAdd(id){ const q = data.quick.find(x => x.id === id); if (!q) return; const acc = accById(q.acc) && !accById(q.acc).archived ? q.acc : (activeAccs().find(a => a.type !== 'invest') || {}).id; if (!acc) return toast('Primero agrega una cuenta.');
  const rec = {id:uid(), type:'exp', amount:q.amount, acc, to:null, cat:q.cat, note:q.label, date:todayKey(), at:Date.now()}; data.txs.push(rec); await saveData(); render();
  try { if (navigator.vibrate) navigator.vibrate(8); } catch(e){}
  toastUndo(`${q.label}: ${money(q.amount)}`, async () => { data.txs = data.txs.filter(t => t.id !== rec.id); await saveData(); render(); toast('Se quitó el gasto'); });
  setTimeout(budgetAlert, 4700, rec); }
function budgetAlert(t){ if (!data) return; const m = t.date.slice(0, 7), b = data.budget; if (m !== monthKey()) return;
  const lim = b.cats[t.cat], spentCat = spentBy(m)[t.cat] || 0, total = sum(monthTx(m, 'exp'));
  if (lim && spentCat > lim && spentCat - t.amount <= lim) return toast(`Te pasaste del límite de ${CAT[t.cat].n.toLowerCase()}.`);
  if (b.total && total > b.total && total - t.amount <= b.total) return toast('Te pasaste de tu presupuesto del mes.');
  if (b.total && total >= b.total * .85 && total - t.amount < b.total * .85) toast('Ya usaste el 85 % de tu presupuesto del mes.'); }
async function importBk(file){
  let d; try { if (file.size > 100e6) throw 0; d = JSON.parse(await file.text()); } catch(e){ return toast('Ese archivo no es una copia válida.'); }
  if (!d || d.app !== 'mis-finanzas' || !d.state || typeof d.salt !== 'string' || !d.pin || !(d.iter >= 100000 && d.iter <= 5000000)) return toast('Ese archivo no es una copia válida.');
  const k = await pinPrompt('PIN de la copia', 'El que tenías cuando hiciste la copia.', async p => { setSub('Verificando…'); try { return await unwrap(d.pin, await pinKey(p, d.salt, d.iter), false); } catch(e){ const er = new Error(); er.msg = 'Ese no es el PIN de la copia.'; throw er; } });
  if (!k || !unlocked) return;
  let st; try { st = cleanData(await dec(d.state, k)); } catch(e){ return toast('No se pudo leer la copia.'); }
  if (!await confirmBox('¿Reemplazar tus datos?', `La copia tiene ${plural(st.accounts.length, 'cuenta', 'cuentas')} y ${plural(st.txs.length, 'movimiento', 'movimientos')}. Lo que tienes ahora se reemplazará.`, 'Reemplazar')) return;
  data = st; await saveData(); resetNav(); view = {name:'home'}; tab = 'home'; render(); toast('Copia restaurada'); }

/* ---------- Eventos ---------- */
document.addEventListener('click', e => {
  if (e.target.closest('#toast.undo')){ const f = undoFn; undoFn = null; $('#toast').classList.remove('show','undo'); if (f) f(); return; }
  const t = e.target.closest('[data-key],[data-act],[data-tab],[data-acc],[data-tx],[data-month],[data-ttype],[data-tcat],[data-tacc],[data-tto],[data-atype],[data-acolor],[data-quick],[data-delquick],[data-fixed],[data-payfixed],[data-xcat],[data-xacc],[data-goal]'); if (!t) return;
  const ds = t.dataset;
  if (ds.quick && unlocked){ quickAdd(ds.quick); return; }
  if (ds.delquick && unlocked){ data.quick = data.quick.filter(q => q.id !== ds.delquick); saveData(); render(); toast('Gasto frecuente quitado'); return; }
  if (ds.fixed && unlocked){ const f = data.fixed.find(x => x.id === ds.fixed); if (f){ draft = Object.assign({}, f); go({name:'fixedForm'}); } return; }
  if (ds.payfixed && unlocked){ const f = data.fixed.find(x => x.id === ds.payfixed); if (!f) return; const acc = accById(f.acc) && !accById(f.acc).archived ? f.acc : (activeAccs().find(a => a.type !== 'invest') || {}).id; draft = newTxDraft('exp', {amount:f.amount, cat:f.cat, acc, note:f.name, fixedId:f.id}); go({name:'tx'}); return; }
  if (ds.xcat){ draft.cat = ds.xcat; document.querySelectorAll('[data-xcat]').forEach(b => b.classList.toggle('on', b === t)); return; }
  if (ds.xacc){ draft.acc = ds.xacc; document.querySelectorAll('[data-xacc]').forEach(b => b.classList.toggle('on', b === t)); return; }
  if (ds.goal && unlocked) return go({name:'goal', id:ds.goal});
  if (ds.key !== undefined) return padKey(ds.key);
  if (!unlocked && !['bio','bioOn','bioSkip','forgot','confirmOk','confirmNo','cancelPrompt'].includes(ds.act)) return;
  if (ds.tab){ if (hist.length) resetNav(); tab = ds.tab; view = {name:tab}; if (tab !== 'home') month = month || monthKey(); render(); window.scrollTo(0,0); return; }
  if (ds.month){ month = shiftMonth(month, +ds.month); if (month > monthKey()) month = monthKey(); render(); return; }
  if (ds.acc){ return go({name:'account', id:ds.acc}); }
  if (ds.tx){ const x = data.txs.find(y => y.id === ds.tx); if (!x) return; draft = Object.assign({}, x, {amount:x.type === 'adj' ? balance(accById(x.acc)) : x.amount}); return go({name:'tx'}); }
  if (ds.ttype){ const amt = $('#t_amount').value, note = ($('#t_note') || {value:''}).value, date = $('#t_date').value; const nd = newTxDraft(ds.ttype, {id:draft.id, note, date}); if (ds.ttype === 'tr'){ const o = activeAccs().find(a => a.id !== nd.acc); nd.to = o ? o.id : null; } draft = Object.assign(nd, {amount:num(amt)}); render(); return; }
  if (ds.tcat){ draft.cat = ds.tcat; document.querySelectorAll('[data-tcat]').forEach(b => b.classList.toggle('on', b === t)); return; }
  if (ds.tacc){ draft.acc = ds.tacc; if (draft.type === 'tr'){ if (draft.to === draft.acc){ const o = activeAccs().find(a => a.id !== draft.acc); draft.to = o ? o.id : null; } draft.amount = num($('#t_amount').value); draft.date = $('#t_date').value; draft.note = ($('#t_note') || {value:''}).value; render(); return; } document.querySelectorAll('[data-tacc]').forEach(b => b.classList.toggle('on', b === t)); return; }
  if (ds.tto){ draft.to = ds.tto; document.querySelectorAll('[data-tto]').forEach(b => b.classList.toggle('on', b === t)); return; }
  if (ds.atype){ draft.type = ds.atype; draft.name = $('#a_name').value; const i = $('#a_initial'); if (i) draft.initial = num(i.value); render(); return; }
  if (ds.acolor){ draft.color = ds.acolor; document.querySelectorAll('[data-acolor]').forEach(b => b.classList.toggle('on', b === t)); return; }
  if (ds.act && A[ds.act]) A[ds.act](t);
});
document.addEventListener('change', e => { const t = e.target; lastAct = Date.now();
  if (t.id === 'f_import'){ const f = t.files && t.files[0]; t.value = ''; if (f) importBk(f); }
  if (t.id === 'w_hapi') $('#w_hapiField').hidden = !t.checked; });
document.addEventListener('input', e => { if (e.target.id === 't_amount') $('#e_amount').textContent = ''; if (e.target.id === 'a_name') $('#e_name').textContent = ''; });
document.addEventListener('keydown', e => { lastAct = Date.now();
  if ($('#dots') && (!unlocked || ovState)){ if (/^[0-9]$/.test(e.key)) padKey(e.key); else if (e.key === 'Backspace') padKey('del'); }
  if (e.key === 'Enter' && e.target.id === 't_amount'){ e.preventDefault(); A.saveTx(); } });
document.addEventListener('pointerdown', () => { lastAct = Date.now(); }, {passive:true});
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ hiddenAt = Date.now(); document.body.classList.add('veil'); return; }
  if (unlocked && Date.now() - hiddenAt > LOCK_HIDDEN_MS) lock();
  document.body.classList.remove('veil'); setTimeout(autoBio, 250); });
window.addEventListener('pageshow', e => { if (e.persisted) setTimeout(autoBio, 250); });
window.addEventListener('pagehide', () => { if (unlocked) lock(); });
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (unlocked && ['home','settings'].includes(view.name)) render(); });
window.addEventListener('appinstalled', () => { installEvt = null; toast('Mis finanzas instalada'); if (unlocked) render(); });
setInterval(() => { if (unlocked && Date.now() - lastAct > LOCK_IDLE_MS) lock(); }, 10000);

/* ---------- Inicio ---------- */
(async () => {
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('sw.js', {scope:'./'}).catch(() => {});
  if (!window.isSecureContext || !crypto.subtle || !window.indexedDB){ main.innerHTML = `<div class="fatal"><h1>No se puede abrir</h1><p>Abre la app desde su dirección https en Chrome.</p></div>`; return; }
  bioOK = await bioSupported();
  if (!await DB.open()){ main.innerHTML = `<div class="fatal"><h1>No se puede guardar</h1><p>Este navegador no permite guardar datos. Si estás en modo incógnito, ábrela en una pestaña normal.</p></div>`; return; }
  try { meta = await DB.get('meta', 'keys') || null; } catch(e){ meta = null; }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  history.replaceState({root:1}, ''); renderLock(); setTimeout(autoBio, 300);
})();
})();
