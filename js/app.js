'use strict';

// ═══════════════════════════════════════
//  HERO SLIDESHOW
// ═══════════════════════════════════════
let slideIndex = 0;
let slideTimer = null;
const SLIDE_INTERVAL = 4500;

function initSlideshow() {
  const slides = document.querySelectorAll('.hero-slide');
  const dotsWrap = document.getElementById('slideDots');
  if (!slides.length || !dotsWrap) return;

  // Build dots
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'slide-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Slide ' + (i + 1));
    d.onclick = () => goSlide(i);
    dotsWrap.appendChild(d);
  });

  startAutoSlide();
}

function goSlide(idx) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.slide-dot');
  slides[slideIndex].classList.remove('active');
  dots[slideIndex]  && dots[slideIndex].classList.remove('active');
  slideIndex = (idx + slides.length) % slides.length;
  slides[slideIndex].classList.add('active');
  dots[slideIndex]  && dots[slideIndex].classList.add('active');
}
function slideNext() { clearInterval(slideTimer); goSlide(slideIndex + 1); startAutoSlide(); }
function slidePrev() { clearInterval(slideTimer); goSlide(slideIndex - 1); startAutoSlide(); }
function startAutoSlide() {
  clearInterval(slideTimer);
  slideTimer = setInterval(() => goSlide(slideIndex + 1), SLIDE_INTERVAL);
}

// ═══════════════════════════════════════
//  DATA
const DB={
  users:[{id:1,name:'Admin User',email:'admin@hausdesfriedens.ch',password:'admin123',role:'admin'},{id:2,name:'Anëtar Demo',email:'demo@test.ch',password:'demo1234',role:'member'}],
  posts:[
    {id:1,title:'Iftar i përbashkët në Schwamendingen',category:'Aktivitete',date:'March 2, 2026',body:'Të shtunën, në mbrëmjen e 28 shkurt 2026, Xhamia e Schwamendingen organizoi iftar të përbashkët ndërfetar. Ky event ishte shembull i shkëlqyer i dialogut ndërfetar dhe respektit të ndërsjellë në Cyrih.',img:'https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4697-scaled.jpg'},
    {id:2,title:'Shenjë kundër racizmit antimusliman',category:'Bashkëpunimi',date:'May 25, 2025',body:'"Ne të gjithë i përkasim Zvicrës" - një shenjë e fuqishme kundër racizmit antimusliman dhe antisemitizmit. Xhamia jonë bashkë me organizata tjera mori pjesë në këtë iniciativë të rëndësishme.',img:''},
    {id:3,title:'Takimi me rininë - Jugendtreff',category:'Aktivitete',date:'May 23, 2025',body:'Falënderim i madh për Dr. Lumni Ademi për ligjëratën jashtëzakonisht interesante me temën "Kurani dhe shkenca moderne". Jugendtreff vazhdon të jetë hapësirë frytdhënëse.',img:''},
    {id:4,title:'Kuvendi i rregullt i Xhamisë 2026',category:'Lajme',date:'March 31, 2026',body:'Kuvendi vjetor i rregullt i xhamisë u mbajt me sukses. Anëtarët diskutuan planin e aktiviteteve, buxhetin dhe çështje të tjera të rëndësishme për komunitetin tonë.',img:''},
    {id:5,title:'Pranimi i Imamëve nga Qyteti i Cyrihut',category:'Lajme',date:'May 28, 2025',body:'Imamët e xhamive të Cyrihut u pritën zyrtarisht nga Qyteti i Cyrihut. Kjo takim u bë rast për dialog dhe forcim të marrëdhënieve ndërmjet institucioneve fetare dhe pushtetit lokal.',img:''},
    {id:6,title:'Bashkatdhetarët ndërtuan shtëpi për familjen e dëshmorit',category:'Lajme',date:'April 10, 2019',body:'Me ndihmën e xhematit të xhamisë Schwamendingen, familja e Fadil Sylejmanit mori shtëpi të re. Ky akt solidariteti tregoi fuqinë e komunitetit tonë.',img:''},
  ],
  nextPostId:7,nextUserId:3
};
let currentUser=null,currentFilter='ALL',editingPostId=null,currentLang='sq';

// ═══════════════════════════════════════
//  PERSISTENCE (localStorage)
//  Interim storage until the real backend lands - same shape the
//  future API will use, so swapping it out stays a one-file change.
const STORE_KEY='hdf_state_v1';

function saveState(){
  if(REMOTE)return; // remote mode: Supabase is the source of truth
  try{
    localStorage.setItem(STORE_KEY,JSON.stringify({
      db:DB,
      condolences,
      mediaItems,
      partners,
      settings,
      quizzes,
      surahs,
      pages,
      staff,
      events,
      sessionUserId:currentUser?currentUser.id:null,
      lang:currentLang
    }));
  }catch(e){console.warn('saveState failed:',e);}
}

function loadState(){
  let s=null;
  try{s=JSON.parse(localStorage.getItem(STORE_KEY));}catch(e){}
  if(!s)return;
  if(s.db)Object.assign(DB,s.db);
  if(Array.isArray(s.condolences))condolences=s.condolences;
  if(Array.isArray(s.mediaItems))mediaItems=s.mediaItems;
  if(Array.isArray(s.partners))partners=s.partners;
  if(s.settings)settings=s.settings;
  if(Array.isArray(s.quizzes))quizzes=s.quizzes;
  if(Array.isArray(s.surahs))surahs=s.surahs;
  if(Array.isArray(s.pages))pages=s.pages;
  if(Array.isArray(s.staff))staff=s.staff;
  if(Array.isArray(s.events))events=s.events;
  if(s.sessionUserId!=null)currentUser=DB.users.find(u=>u.id===s.sessionUserId)||null;
  if(s.lang&&s.lang!==currentLang)setLang(s.lang);
}

// ═══════════════════════════════════════
//  REMOTE BACKEND (Supabase)
//  When js/config.js has project credentials and the Supabase client
//  loaded, all data lives in the shared database. Otherwise the site
//  falls back to the localStorage demo mode above.
const sb=(window.HDF_CONFIG&&window.HDF_CONFIG.SUPABASE_URL&&window.supabase)
  ?window.supabase.createClient(window.HDF_CONFIG.SUPABASE_URL,window.HDF_CONFIG.SUPABASE_ANON_KEY)
  :null;
let REMOTE=false; // true once the first fetch from Supabase succeeds

function fmtDateEn(iso){return new Date(iso).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});}
function fmtDateSq(iso){return new Date(iso).toLocaleDateString('sq-AL',{day:'numeric',month:'long',year:'numeric'});}

async function remoteLoadAll(){
  const [posts,conds,media]=await Promise.all([
    sb.from('posts').select('*').order('created_at',{ascending:false}),
    sb.from('condolences').select('*').order('created_at',{ascending:false}),
    sb.from('media').select('*').order('created_at',{ascending:true}),
  ]);
  if(posts.error)throw posts.error;
  DB.posts=(posts.data||[]).map(p=>({id:p.id,title:p.title,title_de:p.title_de||'',category:p.category,body:p.body,body_de:p.body_de||'',img:p.img||'',images:Array.isArray(p.images)?p.images:[],video:p.video||'',date:fmtDateEn(p.created_at)}));
  condolences=(conds.data||[]).map(c=>({id:c.id,name:c.name,born:c.born||'',date:c.died_on||'',city:c.city||'',msg:c.msg||'',funeral:c.funeral||'',photo:c.photo||'',postedAt:fmtDateSq(c.created_at)}));
  mediaItems=(media.data||[]).map(m=>({id:m.id,url:m.url,cap:m.caption,kind:m.kind||'image',featured:!!m.featured}));
  try{
    const {data:pr}=await sb.from('partners').select('*').order('created_at',{ascending:true});
    if(pr)partners=pr.map(p=>({id:p.id,name:p.name,url:p.url||'',logo:p.logo||''}));
  }catch(e){/* partners table may not exist yet (migration 003) */}
  try{
    const {data:st}=await sb.from('settings').select('*');
    if(st){settings={};st.forEach(r=>settings[r.key]=r.value);}
  }catch(e){/* settings table may not exist yet (migration 006) */}
  try{
    const {data:qz}=await sb.from('quizzes').select('*').order('created_at',{ascending:false});
    if(qz)quizzes=qz.map(q=>({id:q.id,title:q.title,description:q.description||'',type:q.type||'native',kahoot_url:q.kahoot_url||'',questions:q.questions||[]}));
  }catch(e){/* quizzes table may not exist yet (migration 010) */}
  try{
    const {data:sr}=await sb.from('surahs').select('*').order('number',{ascending:true});
    if(sr)surahs=sr.map(s=>({id:s.id,number:s.number||0,name_sq:s.name_sq||'',name_de:s.name_de||'',url:s.url||'',category:s.category||'quran'}));
  }catch(e){/* surahs table may not exist yet (migration 011) */}
  try{
    const {data:pg}=await sb.from('pages').select('*').order('nav_order',{ascending:true});
    if(pg)pages=pg.map(p=>({id:p.id,title_sq:p.title_sq||'',title_de:p.title_de||'',subtitle_sq:p.subtitle_sq||'',subtitle_de:p.subtitle_de||'',blocks:p.blocks||[]}));
  }catch(e){/* pages table may not exist yet (migration 012) */}
  try{
    const {data:sf}=await sb.from('staff').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:true});
    if(sf)staff=sf.map(s=>({id:s.id,name:s.name||'',position_sq:s.position_sq||'',position_de:s.position_de||'',photo:s.photo||''}));
  }catch(e){/* staff table may not exist yet (migration 013) */}
  try{
    const {data:ev}=await sb.from('events').select('*').order('event_date',{ascending:true});
    if(ev)events=ev.map(e=>({id:e.id,title_sq:e.title_sq||'',title_de:e.title_de||'',desc_sq:e.desc_sq||'',desc_de:e.desc_de||'',event_date:e.event_date,event_time:e.event_time||'',location:e.location||''}));
  }catch(e){/* events table may not exist yet (migration 014) */}
}

let settings={};
async function saveSetting(key,value){
  settings[key]=value;
  if(REMOTE){
    const {error}=await sb.from('settings').upsert({key,value,updated_at:new Date().toISOString()});
    if(error){showToast('Gabim: '+error.message,'error');return false;}
  }else saveState();
  return true;
}

// ── ANALYTICS (privacy-friendly: anonymous token, no IP/PII) ──
function visitorToken(){
  let t=null;
  try{t=localStorage.getItem('hdf_visitor');}catch(e){}
  if(!t){t='v'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);try{localStorage.setItem('hdf_visitor',t);}catch(e){}}
  return t;
}
async function logAnalytics(kind,path){
  if(!REMOTE||!sb)return;
  try{await sb.from('analytics').insert({kind,path:path||'',visitor:visitorToken()});}catch(e){}
}
function trackVisit(){
  // one visit per browser session (survives SPA navigation, not tab reloads)
  try{if(sessionStorage.getItem('hdf_visited'))return;sessionStorage.setItem('hdf_visited','1');}catch(e){}
  logAnalytics('visit',location.hash||'/');
}

async function setUserFromSession(u){
  let role='member',name=(u.user_metadata&&u.user_metadata.name)||u.email;
  const {data:prof}=await sb.from('profiles').select('name,role').eq('id',u.id).maybeSingle();
  if(prof){role=prof.role;if(prof.name)name=prof.name;}
  currentUser={id:u.id,name,email:u.email,role};
}

async function remoteRestoreSession(){
  const {data}=await sb.auth.getSession();
  if(data&&data.session)await setUserFromSession(data.session.user);
}

// ROUTING
function navigate(p){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  (document.getElementById('page-'+p)||document.getElementById('page-home')).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  document.querySelectorAll('#main-nav > a').forEach(a=>a.classList.remove('active'));
  const na=document.getElementById('nav-'+p);if(na)na.classList.add('active');
  document.querySelectorAll('.nav-dropdown.open').forEach(d=>d.classList.remove('open'));
  if(p==='news')renderNewsPage();
  if(p==='member')renderMemberArea();
  if(p==='home')renderHomeNews();
  if(p==='statute')renderStatuteDoc();
  if(p==='home')wirePrayerDocs();
  if(p==='quiz')renderQuizList();
  if(p==='quran')renderSurahList();
  if(p==='staff')renderStaff();
  if(p==='events')renderEvents();
  if(p==='imam')renderImam();
}

// ═══════════════════════════════════════
//  CUSTOM PAGES (admin-built, auto-nav)
// ═══════════════════════════════════════
let pages=[];
function pageTitle(p){return (currentLang==='de'&&p.title_de)?p.title_de:(p.title_sq||p.title_de||'Faqe');}
function pageSub(p){return (currentLang==='de'&&p.subtitle_de)?p.subtitle_de:(p.subtitle_sq||p.subtitle_de||'');}

// Inject custom-page links into the desktop nav and the mobile menu
function renderCustomNav(){
  document.querySelectorAll('.custom-nav-link').forEach(el=>el.remove());
  const nav=document.getElementById('main-nav');
  const mob=document.querySelector('#mobile-menu nav');
  pages.forEach(p=>{
    if(nav){
      const a=document.createElement('a');
      a.className='custom-nav-link';a.textContent=pageTitle(p);
      a.onclick=e=>navClick2(p.id,e);
      nav.appendChild(a);
    }
    if(mob){
      const a=document.createElement('a');
      a.className='custom-nav-link';a.textContent=pageTitle(p);
      a.onclick=()=>{openCustomPage(p.id);toggleMobile();};
      mob.appendChild(a);
    }
  });
}
function navClick2(id,e){if(e)addRipple(e.currentTarget,e);document.querySelectorAll('.nav-dropdown.open').forEach(d=>d.classList.remove('open'));openCustomPage(id);}

function openCustomPage(id,pushHash=true){
  const p=pages.find(x=>x.id===id);if(!p)return;
  document.getElementById('custom-crumb').textContent=pageTitle(p);
  document.getElementById('custom-title').textContent=pageTitle(p);
  const sub=document.getElementById('custom-subtitle');
  sub.textContent=pageSub(p);sub.style.display=pageSub(p)?'':'none';
  renderCustomBlocks(p);
  if(pushHash){try{history.pushState(null,'','#faqe-'+id);}catch(e){}}
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.getElementById('page-custom').classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  document.querySelectorAll('#main-nav > a').forEach(a=>a.classList.remove('active'));
}

function renderCustomBlocks(p){
  const wrap=document.getElementById('custom-blocks');if(!wrap)return;
  wrap.innerHTML=(p.blocks||[]).map(b=>{
    if(b.type==='text')return `<div class="cb-text"><p>${(b.text||'').replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')}</p></div>`;
    if(b.type==='image')return `<figure class="cb-image"><img src="${b.url}" alt="${b.caption||''}" loading="lazy">${b.caption?`<figcaption>${b.caption}</figcaption>`:''}</figure>`;
    if(b.type==='video')return `<div class="cb-video">${videoEmbedHtml(b.url)}</div>`;
    return '';
  }).join('');
}

// ── ADMIN: page management ──
let editingPageId=null;
function renderPagesAdmin(){
  const list=document.getElementById('pages-admin-list');if(!list)return;
  if(!pages.length){list.innerHTML='<p style="color:var(--ink-lt)">Ende asnjë faqe. Klikoni "Faqe e re".</p>';return;}
  list.innerHTML=pages.map(p=>`
    <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--white);border:1px solid var(--border);border-radius:12px">
      <span style="font-size:20px">🗂️</span>
      <div style="flex:1;min-width:0"><strong style="font-size:14px;display:block">${p.title_sq||p.title_de}</strong><small style="color:var(--ink-lt)">${(p.blocks||[]).length} blloqe · shfaqet në menu</small></div>
      <button class="btn-edit" style="padding:7px 12px;font-size:12px;font-weight:700;border-radius:8px;border:none" onclick="openCustomPage(${p.id})">👁️</button>
      <button class="btn-edit" style="padding:7px 12px;font-size:12px;font-weight:700;border-radius:8px;border:none" onclick="openPageEditor(${p.id})">✏️</button>
      <button class="btn-del" style="padding:7px 12px;font-size:12px;font-weight:700;border-radius:8px;border:none" onclick="deletePage(${p.id})">🗑️</button>
    </div>`).join('');
}

function pageBlockRowHtml(b){
  b=b||{type:'text'};
  const up=`<button type="button" class="btn btn-outline" style="white-space:nowrap;padding:8px 12px;font-size:12px" onclick="this.parentElement.querySelector('input[type=file]').click()">📤</button>`;
  let inner='';
  if(b.type==='text')inner=`<label style="font-size:12px;font-weight:700;color:var(--ink-lt)">📝 Tekst</label><textarea class="pb-input" rows="4" placeholder="Shkruani tekstin...">${(b.text||'').replace(/</g,'&lt;')}</textarea>`;
  else if(b.type==='image')inner=`<label style="font-size:12px;font-weight:700;color:var(--ink-lt)">🖼️ Foto</label><div style="display:flex;gap:8px"><input type="text" class="pb-input" placeholder="URL e fotos ose ngarko →" value="${b.url||''}">${up}<input type="file" accept="image/*" style="display:none" onchange="uploadPageBlockFile(event,this)"></div><input type="text" class="pb-cap" placeholder="Përshkrimi (opsional)" value="${b.caption||''}" style="margin-top:6px">`;
  else if(b.type==='video')inner=`<label style="font-size:12px;font-weight:700;color:var(--ink-lt)">🎬 Video</label><div style="display:flex;gap:8px"><input type="text" class="pb-input" placeholder="Link YouTube/Facebook/MP4 ose ngarko →" value="${b.url||''}">${up}<input type="file" accept="video/mp4,video/webm" style="display:none" onchange="uploadPageBlockFile(event,this)"></div>`;
  return `<div class="pb-row" data-type="${b.type}">${inner}<button type="button" class="qq-del" onclick="this.closest('.pb-row').remove()">🗑️ Hiq bllokun</button></div>`;
}
function addPageBlock(type,data){document.getElementById('pg-blocks').insertAdjacentHTML('beforeend',pageBlockRowHtml(data||{type}));}

async function uploadPageBlockFile(ev,input){
  const f=(ev.target.files||[])[0];ev.target.value='';if(!f)return;
  if(!REMOTE){showToast('Ngarkimi kërkon lidhje me serverin!','error');return;}
  if(f.size>50*1024*1024){showToast('Maksimumi 50MB!','error');return;}
  showToast('⏳ Duke ngarkuar...','');
  try{const url=await uploadToStorage(f);input.parentElement.querySelector('.pb-input').value=url;showToast('✅ U ngarkua!','success');}
  catch(e){showToast('Gabim: '+e.message,'error');}
}

function collectPageBlocks(){
  return [...document.querySelectorAll('#pg-blocks .pb-row')].map(row=>{
    const type=row.getAttribute('data-type');
    if(type==='text'){const t=row.querySelector('.pb-input').value.trim();return t?{type,text:t}:null;}
    const url=row.querySelector('.pb-input').value.trim();
    if(!url)return null;
    if(type==='image')return {type,url,caption:(row.querySelector('.pb-cap')||{}).value?.trim()||''};
    return {type,url};
  }).filter(Boolean);
}

function openPageEditor(id){
  editingPageId=id;
  document.getElementById('page-editor-title').textContent=id?'Edito Faqen':'Faqe e re';
  const p=id?pages.find(x=>x.id===id):null;
  document.getElementById('pg-title-sq').value=p?p.title_sq:'';
  document.getElementById('pg-title-de').value=p?p.title_de:'';
  document.getElementById('pg-sub-sq').value=p?p.subtitle_sq:'';
  document.getElementById('pg-sub-de').value=p?p.subtitle_de:'';
  const blocks=document.getElementById('pg-blocks');blocks.innerHTML='';
  if(p&&p.blocks.length)p.blocks.forEach(b=>addPageBlock(b.type,b));
  else addPageBlock('text');
  openModal('page-modal-editor');
}

async function savePage(){
  const title_sq=document.getElementById('pg-title-sq').value.trim();
  const title_de=document.getElementById('pg-title-de').value.trim();
  if(!title_sq&&!title_de){showToast('Shkruani të paktën një titull!','error');return;}
  const payload={
    title_sq,title_de:title_de||title_sq,
    subtitle_sq:document.getElementById('pg-sub-sq').value.trim(),
    subtitle_de:document.getElementById('pg-sub-de').value.trim(),
    blocks:collectPageBlocks(),
    nav_order:pages.length
  };
  if(REMOTE){
    const q=editingPageId?sb.from('pages').update(payload).eq('id',editingPageId):sb.from('pages').insert(payload);
    const {error}=await q;
    if(error){showToast('Gabim: '+error.message,'error');return;}
    await remoteLoadAll();
  }else{
    if(editingPageId){const i=pages.findIndex(x=>x.id===editingPageId);pages[i]={...pages[i],...payload};}
    else pages.push({id:Date.now(),...payload});
    saveState();
  }
  closeModal('page-modal-editor');
  renderPagesAdmin();renderCustomNav();
  showToast(editingPageId?'✅ Faqja u përditësua!':'🗂️ Faqja u krijua dhe u shtua në menu!','success');
}

async function deletePage(id){
  if(!confirm('Fshi këtë faqe? Do të hiqet edhe nga menuja.'))return;
  if(REMOTE){
    const {error}=await sb.from('pages').delete().eq('id',id);
    if(error){showToast('Gabim: '+error.message,'error');return;}
    pages=pages.filter(p=>p.id!==id);
  }else{pages=pages.filter(p=>p.id!==id);saveState();}
  renderPagesAdmin();renderCustomNav();
  if(document.getElementById('page-custom').classList.contains('active'))navigate('home');
  showToast('Faqja u fshi.','');
}

// ═══════════════════════════════════════
//  QURAN SURAHS (audio, hosted anywhere)
// ═══════════════════════════════════════
let surahs=[];
function surahLabel(s){return (s.number?s.number+'. ':'')+((currentLang==='de'&&s.name_de)?s.name_de:s.name_sq);}

// Audio categories shown on the Kurani page (Quran first, then the rest).
const AUDIO_CATS=[
  {key:'quran',    icon:'📖', sq:'Sûret e Kuranit',  de:'Die Suren des Korans', sub_sq:'Kurani i Shenjtë', sub_de:'Der Heilige Koran'},
  {key:'hadith',   icon:'📜', sq:'Hadithe',          de:'Hadithe',              sub_sq:'Hadith',          sub_de:'Hadith'},
  {key:'audiobook',icon:'🎧', sq:'Libra Audio',      de:'Hörbücher',            sub_sq:'Libër audio',     sub_de:'Hörbuch'},
  {key:'other',    icon:'🔊', sq:'Të tjera',         de:'Weitere',              sub_sq:'Audio',           sub_de:'Audio'}
];
function audioCatOf(s){return s.category||'quran';}
function audioCatMeta(key){return AUDIO_CATS.find(c=>c.key===key)||AUDIO_CATS[3];}

function renderSurahList(){
  const list=document.getElementById('surah-list');if(!list)return;
  const empty=document.getElementById('surah-empty');
  const searchWrap=document.getElementById('surah-search-wrap');
  if(searchWrap)searchWrap.style.display=surahs.length>6?'flex':'none';
  const q=((document.getElementById('surah-search')||{}).value||'').toLowerCase();
  if(empty)empty.style.display=surahs.length?'none':'block';
  const playing=!pAudio().paused;
  const usedCats=AUDIO_CATS.filter(c=>surahs.some(s=>audioCatOf(s)===c.key));
  const showHeaders=usedCats.length>1; // only label sections when there's more than one kind
  let html='';
  usedCats.forEach(cat=>{
    const items=surahs.filter(s=>audioCatOf(s)===cat.key && (!q||surahLabel(s).toLowerCase().includes(q)));
    if(!items.length)return;
    if(showHeaders)html+=`<h3 class="audio-cat-title">${cat.icon} ${currentLang==='de'?cat.de:cat.sq}</h3>`;
    html+=items.map(s=>{
      const i=surahs.indexOf(s);
      const active=audioQueueType==='surah'&&audioIndex===i;
      const sub=currentLang==='de'?cat.sub_de:cat.sub_sq;
      return `<div class="audio-row${active?' playing':''}" onclick="playSurah(${i})">
        <div class="audio-row-btn">${active&&playing?'⏸':'▶'}</div>
        <div class="audio-row-info"><strong>${surahLabel(s)}</strong><small>${sub}</small></div>
        ${active&&playing?'<div class="audio-eq"><span></span><span></span><span></span></div>':''}
      </div>`;
    }).join('');
  });
  list.innerHTML=html;
}

// Turn an archive.org page link into a playable direct audio URL.
// - direct file (…/file.mp3)                    -> used as-is
// - archive.org/details|download/<id>/<file.mp3> -> /download/<id>/<file.mp3>
// - archive.org/details/<id> (no file)           -> looks up the item's mp3
const archiveResolveCache={};
async function resolveAudioUrl(url){
  if(!url)return url;
  url=url.trim();
  // Archive.org links must be handled first: a /details/ URL can end in .mp3
  // yet still be a web page - the real file lives under /download/.
  const m=url.match(/archive\.org\/(?:details|download|stream|embed)\/([^\/?#]+)(?:\/([^?#]+))?/i);
  if(m){
    const id=m[1];
    const file=m[2]?decodeURIComponent(m[2]):'';
    if(file&&/\.(mp3|ogg|m4a|aac|wav)$/i.test(file))
      return 'https://archive.org/download/'+id+'/'+encodeURIComponent(file);
    if(archiveResolveCache[id])return archiveResolveCache[id];
    try{
      const r=await fetch('https://archive.org/metadata/'+id);
      if(r.ok){
        const d=await r.json();
        const files=(d.files||[]).filter(f=>/\.mp3$/i.test(f.name||''));
        if(files.length){
          const direct='https://archive.org/download/'+id+'/'+encodeURIComponent(files[0].name);
          archiveResolveCache[id]=direct;
          return direct;
        }
      }
    }catch(e){/* CORS/offline -> fall through, the <audio> error handler will guide */}
    return url;
  }
  return url; // non-archive links (direct .mp3, Supabase, R2, ...) used as-is
}

async function playSurah(i){
  audioQueue=surahs.map(s=>({url:s.url,cap:surahLabel(s)}));
  if(!audioQueue[i]||!audioQueue[i].url){showToast('Kjo sûre nuk ka audio.','error');return;}
  const a=pAudio();
  if(audioQueueType==='surah'&&audioIndex===i){a.paused?a.play():a.pause();return;}
  audioQueueType='surah';audioIndex=i;
  document.getElementById('player-bar').classList.add('open');document.body.classList.add('player-open');
  setMediaSession(audioQueue[i]);
  renderSurahList();
  const src=await resolveAudioUrl(audioQueue[i].url);
  if(audioQueueType!=='surah'||audioIndex!==i)return; // user changed track while resolving
  a.src=src;
  try{await a.play();}catch(e){}
}

// ── ADMIN: surah management ──
function renderSurahsAdmin(){
  const list=document.getElementById('surahs-admin-list');if(!list)return;
  if(!surahs.length){list.innerHTML='<p style="color:var(--ink-lt)">Ende asnjë sûre.</p>';return;}
  const order={quran:0,hadith:1,audiobook:2,other:3};
  const sorted=[...surahs].sort((a,b)=>(order[audioCatOf(a)]-order[audioCatOf(b)])||(a.number-b.number));
  list.innerHTML=sorted.map(s=>{
    const cat=audioCatMeta(audioCatOf(s));
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--white);border:1px solid var(--border);border-radius:10px">
      <span style="width:30px;height:30px;border-radius:8px;background:var(--green-lt);color:var(--green);font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0" title="${currentLang==='de'?cat.de:cat.sq}">${cat.icon}</span>
      <div style="flex:1;min-width:0"><strong style="font-size:13.5px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.number?s.number+'. ':''}${s.name_sq}${s.name_de?' / '+s.name_de:''}</strong><small style="color:var(--ink-lt)">${currentLang==='de'?cat.de:cat.sq}${s.url?' · 🔗':' · pa audio'}</small></div>
      <button class="btn-del" style="padding:7px 12px;font-size:12px;font-weight:700;border-radius:8px;border:none" onclick="deleteSurah(${s.id})">🗑️</button>
    </div>`;
  }).join('');
}

async function uploadSurahAudio(ev){
  const f=(ev.target.files||[])[0];ev.target.value='';
  if(!f)return;
  if(!REMOTE){showToast('Ngarkimi kërkon lidhje me serverin!','error');return;}
  if(f.size>50*1024*1024){showToast('Skedari deri në 50MB (për më shumë përdorni archive.org)!','error');return;}
  showToast('⏳ Duke ngarkuar...','');
  try{document.getElementById('surah-url').value=await uploadToStorage(f);showToast('✅ U ngarkua!','success');}
  catch(e){showToast('Gabim: '+e.message,'error');}
}

// Turn raw PostgREST "table not found" errors into a clear instruction.
// Happens when a migration has not been run yet in Supabase.
function friendlyDbError(error,migration){
  const m=(error&&error.message)||'';
  if(/schema cache|could not find the table|does not exist|relation .* does not exist/i.test(m)){
    return currentLang==='de'
      ? 'Datenbanktabelle fehlt. Bitte in Supabase den SQL-Migration "'+migration+'" ausführen.'
      : 'Tabela e bazës së të dhënave mungon. Ju lutemi ekzekutoni migrimin "'+migration+'" në Supabase (SQL Editor).';
  }
  return 'Gabim: '+m;
}

async function addSurah(){
  const number=parseInt(document.getElementById('surah-num').value)||0;
  const name_sq=document.getElementById('surah-name-sq').value.trim();
  const name_de=document.getElementById('surah-name-de').value.trim();
  const url=document.getElementById('surah-url').value.trim();
  const category=(document.getElementById('surah-category')||{}).value||'quran';
  if(!name_sq){showToast('Shkruani emrin!','error');return;}
  if(!url){showToast('Shtoni linkun e audios!','error');return;}
  const row={number,name_sq,name_de,url,category};
  if(REMOTE){
    const {error}=await sb.from('surahs').insert(row);
    if(error){showToast(friendlyDbError(error,'migration-016-audio-category.sql'),'error');return;}
    await remoteLoadAll();
  }else{surahs.push({id:Date.now(),...row});surahs.sort((a,b)=>a.number-b.number);saveState();}
  ['surah-num','surah-name-sq','surah-name-de','surah-url'].forEach(id=>document.getElementById(id).value='');
  renderSurahsAdmin();renderSurahList();
  showToast('🎧 Audio u shtua!','success');
}

async function deleteSurah(id){
  if(!confirm('Fshi këtë sûre?'))return;
  if(REMOTE){
    const {error}=await sb.from('surahs').delete().eq('id',id);
    if(error){showToast(friendlyDbError(error,'migration-011-surahs.sql'),'error');return;}
    surahs=surahs.filter(s=>s.id!==id);
  }else{surahs=surahs.filter(s=>s.id!==id);saveState();}
  renderSurahsAdmin();renderSurahList();
  showToast('Sûrja u fshi.','');
}

// ═══════════════════════════════════════
//  QUIZZES (native on-site + Kahoot links)
// ═══════════════════════════════════════
let quizzes=[];
let activeQuiz=null,quizIndex=0,quizScore=0,quizAnswered=false;

function renderQuizList(){
  // reset to the list view
  const player=document.getElementById('quiz-player'),result=document.getElementById('quiz-result');
  const list=document.getElementById('quiz-list'),empty=document.getElementById('quiz-empty');
  if(player)player.style.display='none';
  if(result)result.style.display='none';
  if(list)list.style.display='';
  if(!list)return;
  if(!quizzes.length){list.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  list.innerHTML=quizzes.map(q=>{
    const isK=q.type==='kahoot';
    const meta=isK?'📎 Kahoot':(q.questions.length+' '+(q.questions.length===1?'pyetje':'pyetje'));
    const action=isK
      ?`onclick="window.open('${(q.kahoot_url||'#').replace(/'/g,"\\'")}','_blank')"`
      :`onclick="startNativeQuiz(${q.id})"`;
    return `<div class="quiz-card" ${action}>
      <div class="quiz-card-badge">${isK?'📎':'🎯'}</div>
      <div class="quiz-card-body">
        <h3>${q.title}</h3>
        ${q.description?`<p>${q.description}</p>`:''}
        <div class="quiz-card-meta">${meta} <span class="quiz-card-go">${isK?'Luaj në Kahoot ↗':'Fillo →'}</span></div>
      </div>
    </div>`;
  }).join('');
}

function startNativeQuiz(id){
  const q=quizzes.find(x=>x.id===id);
  if(!q||!q.questions.length){showToast('Ky kuiz nuk ka pyetje.','error');return;}
  activeQuiz=q;quizIndex=0;quizScore=0;
  document.getElementById('quiz-list').style.display='none';
  document.getElementById('quiz-result').style.display='none';
  document.getElementById('quiz-player').style.display='block';
  document.getElementById('quiz-qtotal').textContent=q.questions.length;
  document.getElementById('quiz-retry').onclick=()=>startNativeQuiz(id);
  showQuizQuestion();
}

function showQuizQuestion(){
  quizAnswered=false;
  const q=activeQuiz.questions[quizIndex];
  document.getElementById('quiz-qnum').textContent=quizIndex+1;
  document.getElementById('quiz-question').textContent=q.q;
  document.getElementById('quiz-feedback').textContent='';
  document.getElementById('quiz-next').style.display='none';
  const shapes=['🔺','🔷','🟡','🟩'];
  const ans=document.getElementById('quiz-answers');
  ans.innerHTML=q.answers.map((a,i)=>a?`<button class="quiz-answer qa-${i}" onclick="answerQuiz(${i})"><span class="qa-shape">${shapes[i]}</span>${a}</button>`:'').join('');
}

function answerQuiz(i){
  if(quizAnswered)return;
  quizAnswered=true;
  const q=activeQuiz.questions[quizIndex];
  const btns=document.querySelectorAll('#quiz-answers .quiz-answer');
  btns.forEach((b,idx)=>{
    b.classList.add('locked');
    if(idx===q.correct)b.classList.add('correct');
    else if(idx===i)b.classList.add('wrong');
  });
  const fb=document.getElementById('quiz-feedback');
  if(i===q.correct){quizScore++;fb.textContent='✅ Saktë!';fb.className='quiz-feedback ok';}
  else{fb.textContent='❌ Gabim. Përgjigjja e saktë është e theksuar.';fb.className='quiz-feedback bad';}
  const next=document.getElementById('quiz-next');
  next.textContent=(quizIndex+1<activeQuiz.questions.length)?'Vazhdo →':'Shiko rezultatin →';
  next.style.display='';
}

function nextQuizQuestion(){
  quizIndex++;
  if(quizIndex<activeQuiz.questions.length)showQuizQuestion();
  else showQuizResult();
}

function showQuizResult(){
  document.getElementById('quiz-player').style.display='none';
  const total=activeQuiz.questions.length,pct=Math.round(quizScore/total*100);
  document.getElementById('quiz-score').textContent=quizScore;
  document.getElementById('quiz-score-total').textContent=total;
  const emoji=pct===100?'🏆':pct>=60?'🎉':'📚';
  const title=pct===100?'Përsosur!':pct>=60?'Shumë mirë!':'Vazhdo të mësosh!';
  const msg=pct===100?'Të gjitha përgjigjet të sakta - MashaAllah!':pct>=60?'Rezultat i mirë, vazhdo kështu!':'Provo përsëri për të mësuar më shumë.';
  document.getElementById('quiz-result-emoji').textContent=emoji;
  document.getElementById('quiz-result-title').textContent=title;
  document.getElementById('quiz-result-msg').textContent=msg;
  document.getElementById('quiz-result').style.display='block';
}

function quitQuiz(){activeQuiz=null;renderQuizList();}

// ── ADMIN: quiz management ──
let editingQuizId=null,quizEditorType='native';

function renderQuizzesAdmin(){
  const list=document.getElementById('quizzes-admin-list');if(!list)return;
  if(!quizzes.length){list.innerHTML='<p style="color:var(--ink-lt)">Ende asnjë kuiz.</p>';return;}
  list.innerHTML=quizzes.map(q=>`
    <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--white);border:1px solid var(--border);border-radius:12px">
      <span style="font-size:22px">${q.type==='kahoot'?'📎':'🎯'}</span>
      <div style="flex:1;min-width:0">
        <strong style="font-size:14px;display:block">${q.title}</strong>
        <small style="color:var(--ink-lt)">${q.type==='kahoot'?'Kahoot link':q.questions.length+' pyetje'}</small>
      </div>
      <button class="btn-edit" style="padding:7px 12px;font-size:12px;font-weight:700;border-radius:8px;border:none" onclick="openQuizEditor(${q.id})">✏️</button>
      <button class="btn-del" style="padding:7px 12px;font-size:12px;font-weight:700;border-radius:8px;border:none" onclick="deleteQuiz(${q.id})">🗑️</button>
    </div>`).join('');
}

function setQuizType(t){
  quizEditorType=t;
  document.getElementById('qtype-native').classList.toggle('active',t==='native');
  document.getElementById('qtype-kahoot').classList.toggle('active',t==='kahoot');
  document.getElementById('quiz-native-fields').style.display=t==='native'?'':'none';
  document.getElementById('quiz-kahoot-fields').style.display=t==='kahoot'?'':'none';
}

function questionRowHtml(q){
  q=q||{q:'',answers:['','','',''],correct:0};
  const a=q.answers.concat(['','','','']).slice(0,4);
  const shapes=['🔺','🔷','🟡','🟩'];
  return `<div class="quiz-q-row">
    <input type="text" class="qq-text" placeholder="Pyetja" value="${(q.q||'').replace(/"/g,'&quot;')}">
    ${a.map((ans,i)=>`<label class="qq-ans"><input type="radio" name="qq-correct-${quizRowSeq}" ${q.correct===i?'checked':''} value="${i}"><span>${shapes[i]}</span><input type="text" class="qq-a" placeholder="Përgjigje ${i+1}" value="${(ans||'').replace(/"/g,'&quot;')}"></label>`).join('')}
    <button type="button" class="qq-del" onclick="this.closest('.quiz-q-row').remove()">🗑️ Fshi pyetjen</button>
  </div>`;
}
let quizRowSeq=0;
function addQuizQuestion(q){
  quizRowSeq++;
  const wrap=document.getElementById('quiz-questions');
  wrap.insertAdjacentHTML('beforeend',questionRowHtml(q));
}

function openQuizEditor(id){
  editingQuizId=id;
  document.getElementById('quiz-editor-title').textContent=id?'Edito Kuizin':'Kuiz i ri';
  document.getElementById('quiz-questions').innerHTML='';
  const q=id?quizzes.find(x=>x.id===id):null;
  document.getElementById('quiz-title').value=q?q.title:'';
  document.getElementById('quiz-desc').value=q?q.description:'';
  document.getElementById('quiz-kahoot-url').value=q?q.kahoot_url:'';
  setQuizType(q?q.type:'native');
  if(q&&q.questions.length)q.questions.forEach(addQuizQuestion);
  else{addQuizQuestion();addQuizQuestion();}
  openModal('quiz-modal');
}

function collectQuizQuestions(){
  const rows=[...document.querySelectorAll('#quiz-questions .quiz-q-row')];
  const out=[];
  for(const row of rows){
    const qt=row.querySelector('.qq-text').value.trim();
    const answers=[...row.querySelectorAll('.qq-a')].map(i=>i.value.trim());
    const correctEl=row.querySelector('input[type=radio]:checked');
    const correct=correctEl?+correctEl.value:0;
    if(!qt||answers.filter(Boolean).length<2)continue; // need question + >=2 answers
    out.push({q:qt,answers,correct});
  }
  return out;
}

async function saveQuiz(){
  const title=document.getElementById('quiz-title').value.trim();
  if(!title){showToast('Shkruani titullin e kuizit!','error');return;}
  const description=document.getElementById('quiz-desc').value.trim();
  let payload={title,description,type:quizEditorType,kahoot_url:'',questions:[]};
  if(quizEditorType==='kahoot'){
    const url=document.getElementById('quiz-kahoot-url').value.trim();
    if(!url){showToast('Shtoni linkun e Kahoot!','error');return;}
    payload.kahoot_url=url;
  }else{
    const qs=collectQuizQuestions();
    if(!qs.length){showToast('Shtoni të paktën një pyetje me 2+ përgjigje!','error');return;}
    payload.questions=qs;
  }
  if(REMOTE){
    const q=editingQuizId
      ?sb.from('quizzes').update(payload).eq('id',editingQuizId)
      :sb.from('quizzes').insert(payload);
    const {error}=await q;
    if(error){showToast('Gabim: '+error.message,'error');return;}
    await remoteLoadAll();
  }else{
    if(editingQuizId){const i=quizzes.findIndex(x=>x.id===editingQuizId);quizzes[i]={...quizzes[i],...payload};}
    else{quizzes.unshift({id:Date.now(),...payload});}
    saveState();
  }
  closeModal('quiz-modal');
  renderQuizzesAdmin();renderQuizList();
  showToast(editingQuizId?'✅ Kuizi u përditësua!':'🎯 Kuizi u krijua!','success');
}

async function deleteQuiz(id){
  if(!confirm('Fshi këtë kuiz?'))return;
  if(REMOTE){
    const {error}=await sb.from('quizzes').delete().eq('id',id);
    if(error){showToast('Gabim: '+error.message,'error');return;}
    quizzes=quizzes.filter(q=>q.id!==id);
  }else{quizzes=quizzes.filter(q=>q.id!==id);saveState();}
  renderQuizzesAdmin();renderQuizList();
  showToast('Kuizi u fshi.','');
}

// Point the prayer/namaz PDF links at uploaded files (matched by name),
// hiding any that have no uploaded PDF. Replaces the old WordPress links.
function wirePrayerDocs(){
  const pdfs=mediaItems.filter(m=>m.kind==='pdf');
  const find=(...keys)=>pdfs.find(p=>{const c=(p.cap||'').toLowerCase();return keys.some(k=>k&&c.includes(k.toLowerCase()));});
  const wire=(el,pdf)=>{if(!el)return false;if(pdf){el.href=pdf.url;el.target='_blank';el.style.display='';return true;}el.style.display='none';return false;};

  // monthly calendars (match the Albanian or German month name in the caption)
  let monthMatches=0;
  document.querySelectorAll('#prayer-cal-grid .prayer-dl-btn').forEach(btn=>{
    const span=btn.querySelector('span');
    const sq=span&&span.getAttribute('data-sq'),de=span&&span.getAttribute('data-de');
    if(wire(btn,find(sq,de)))monthMatches++;
  });
  const grid=document.getElementById('prayer-cal-grid');
  if(grid)grid.style.display=monthMatches?'':'none';
  // hide the "download the monthly calendar" hint when there are none
  const sub=document.getElementById('prayer-sub');
  if(sub)sub.style.display=monthMatches?'':'none';

  // special days/nights
  const special=document.getElementById('prayer-special-wrap');
  const specialBtn=document.getElementById('prayer-special-btn');
  const sp=find('net','madh','festa','feste','ramazan');
  if(specialBtn)wire(specialBtn,sp);
  if(special)special.style.display=sp?'':'none';
  // same document, linked from the Festat Islame page
  const feastBtn=document.getElementById('feast-special-btn');
  const feastWrap=document.getElementById('feast-special-wrap');
  if(feastBtn)wire(feastBtn,sp);
  if(feastWrap)feastWrap.style.display=sp?'':'none';

  // how-to-pray guides (keep the SwissMosque live link ps6 always)
  [['ps1',['sabah','fadschr']],['ps2',['drek','dhuhr']],['ps3',['ikind','asr']],
   ['ps4',['aksham','maghrib']],['ps5',['jaci','ischa']]].forEach(([id,keys])=>{
    const a=document.getElementById(id);if(!a)return;
    const step=a.closest('.prayer-step'),pdf=find(...keys);
    if(pdf){a.href=pdf.url;a.target='_blank';if(step)step.style.display='';}
    else if(step)step.style.display='none';
  });
}

// Fill the statute page viewer from the uploaded PDF (caption contains "statut"/"rregull")
function renderStatuteDoc(){
  const frame=document.getElementById('statute-frame');if(!frame)return;
  const missing=document.getElementById('statute-missing');
  const dl=document.getElementById('statute-download');
  const fs=document.getElementById('statute-fs');
  const pdf=mediaItems.find(m=>m.kind==='pdf'&&/statut|rregull|satzung/i.test(m.cap||''))
          ||mediaItems.find(m=>m.kind==='pdf'); // fallback: any uploaded PDF
  if(pdf){
    frame.style.display='block';if(missing)missing.style.display='none';
    frame.src=pdf.url+'#view=FitH';
    if(dl){dl.href=pdf.url;}
    if(fs){fs.href=pdf.url;}
    const title=document.getElementById('statute-doc-title');
    if(title&&pdf.cap)title.textContent=pdf.cap+' - PDF';
  }else{
    frame.style.display='none';if(missing)missing.style.display='block';
    if(dl)dl.style.display='none';
  }
}

// MODALS
function openModal(id){document.getElementById(id).classList.add('active')}
function closeModal(id){document.getElementById(id).classList.remove('active')}
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)closeModal(o.id)}));
// Registration was removed (admin-only login); kept as a safe no-op
function switchAuthTab(){}

// NAVBAR RIPPLE + DROPDOWN
function addRipple(el,e){
  const r=el.getBoundingClientRect(),sp=document.createElement('span'),s=Math.max(r.width,r.height)*2;
  sp.className='ripple';
  sp.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px;position:absolute`;
  el.appendChild(sp);setTimeout(()=>sp.remove(),600);
}
function navClick(page,e){
  if(e)addRipple(e.currentTarget,e);
  document.querySelectorAll('.nav-dropdown.open').forEach(d=>d.classList.remove('open'));
  navigate(page);
}
function toggleDD(id,e){
  if(e){e.stopPropagation();if(e.currentTarget)addRipple(e.currentTarget,e);}
  const dd=document.getElementById(id),wasOpen=dd.classList.contains('open');
  document.querySelectorAll('.nav-dropdown.open').forEach(d=>d.classList.remove('open'));
  if(!wasOpen)dd.classList.add('open');
}
document.addEventListener('click',e=>{
  if(!e.target.closest('.nav-dropdown'))document.querySelectorAll('.nav-dropdown.open').forEach(d=>d.classList.remove('open'));
});
// Navbar: shadow when scrolled; hides scrolling down, reappears scrolling up
let lastScrollY=0;
window.addEventListener('scroll',()=>{
  const nav=document.getElementById('navbar');
  const y=window.scrollY;
  nav.classList.toggle('scrolled',y>40);
  const mobileOpen=document.getElementById('mobile-menu').classList.contains('open');
  if(!mobileOpen){
    if(y>lastScrollY&&y>320)nav.classList.add('nav-hidden');
    else nav.classList.remove('nav-hidden');
  }
  lastScrollY=y<=0?0:y;
},{passive:true});
function toggleMobile(){
  document.getElementById('mobile-menu').classList.toggle('open');
  document.getElementById('hamburger').classList.toggle('open');
}

// LANGUAGE
const T={
  sq:{
    'nav-subtitle':'Shtëpia e Paqës • Zürich','hero-badge':'🕌 Zürich Schwamendingen • Est. 2004',
    'hero-h1':'Kulturzentrum<br><em>Haus des Friedens</em><br>Shtëpia e Paqës',
    'hero-quote-text':'O ju njerëz, vërtet Ne ju krijuam prej një mashkulli dhe një femre, ju bëmë popuj e fise që të njiheni ndërmjet vete, e s\'ka dyshim se te All-llahu më i ndershmi ndër ju është ai që më tepër është ruajtur.',
    'hero-quote-cite':'- Kurani i Shenjtë, El-Huxhurat 49:13',
    'hero-btn1':'Lajmet e Fundit','hero-btn2':'Anëtarësohu',
    'stat1-lbl':'Themeluar','stat2-lbl':'Vjet Shërbim','stat3-lbl':'Shqiptar','stat4-lbl':'Organizata Partnere',
    'pn-sabah':'Sabahu','pn-dreka':'Dreka','pn-ikindia':'Ikindia','pn-akshami':'Akshami','pn-jacia':'Jacia',
    'about-badge':'🕌 Rreth Nesh','about-h2':'Qendra Kulturore<br>Islame Shqiptare',
    'about-p1':'Xhamia "Jugendkulturzentrum Haus des Friedens" është themeluar që nga viti 2004. Është vend ku çdo besimtar ka të drejtë t\'i kryejë ritet e tij fetare.',
    'about-p2':'Shumica e besimtarëve, mbi 90%, janë shqiptarë nga trojet tona etnike - Shqipëria, Kosova, Maqedonia, Lugina e Preshevës.',
    'about-btn':'Lexo Historikun →','about-card-lbl':'Adresa e re<br>Saatlenstr. 23',
    'news-badge':'📰 Lajmet','news-h2':'Lajmet e Fundit','news-sub':'Ndiqni aktivitetet dhe lajmet e xhamisë sonë','news-all-btn':'Shiko të gjitha lajmet →',
    'act-badge':'Aktivitetet','act-h2':'Çfarë Ofrojmë','act-sub':'Xhamia jonë është qendër e jetës fetare, kulturore dhe sociale',
    'act1-h':'Namazet e Përditshme','act1-p':'Pesë namazet e përditshme të organizuara me imam të kualifikuar.',
    'act2-h':'Arsimi Fetar','act2-p':'Mësime fetare për fëmijë dhe të rinj, kontribut në edukimin e tyre.',
    'act3-h':'Dialog Ndërfetar','act3-p':'Bashkëpunim me Kishën Reformierte dhe Zürcher Forum der Religionen.',
    'act4-h':'Festat Islame','act4-p':'Organizim i Ramazanit, Bajrameve dhe festave tjera islame.',
    'act5-h':'Ndihmë Humane','act5-p':'Ndihma për familjet në nevojë dhe projekte humanitare.',
    'act6-h':'Ligjëratat e Hoxhës','act6-p':'Ligjërata javore të imamit për komunitetin tonë.',
    'prayer-badge':'Namazi','prayer-h2':'Kohët e Namazit 2026','prayer-sub':'Shkarkoni kalendarin e kohëve të namazit për çdo muaj',
    'live-label':'Live - Orari i namazit','open-new-tab':'Hap në tab të re','iframe-credit':'Orari shfaqet drejtpërdrejt nga SwissMosque TV',
    'prayer-special-btn':'📥 Ditë dhe netë të mëdha fetare 2026',
    'ps1':'Namazi i Sabahut','ps1-s':'Mëngjes','ps2':'Namazi i Drekës','ps2-s':'Mesdite',
    'ps3':'Namazi i Ikindisë','ps3-s':'Pasdite','ps4':'Namazi i Akshamit','ps4-s':'Mbrëmje','ps5':'Namazi i Jacisë','ps5-s':'Natë','ps6':'Kohët e Namazit Live',
    'don-badge':'💚 Ndihmat Tuaja','don-h2':'Mbështesni Xhaminë Tonë',
    'don-p':'Mbështetja juaj financiare ndihmon xhaminë të vazhdojë shërbimin ndaj komunitetit. Ju jemi mirënjohës për çdo ndihmë!',
    'bank-name-lbl':'Emri','bank-addr-lbl':'Adresa','bank-konto-lbl':'Konto',
    'don-circle-p':'Bamirësi - Sadaka','don-circle-strong':'🤲 Jepni','don-circle-small':'Me zemër të hapur',
    'gallery-badge':'Galeria','gallery-h2':'Galeria e Fotografive',
    'contact-badge':'Kontakti','contact-h2':'Na Kontaktoni','contact-info-h3':'Informacione të Kontaktit',
    'ci-addr-lbl':'Adresa','ci-prayer-lbl':'Koha e Namazeve','ci-prayer-p':'Pesë herë në ditë · Sipas orarit të publikuar',
    'contact-form-h3':'Dërgoni Mesazh','cf-name-lbl':'Emri juaj','cf-msg-lbl':'Mesazhi','contact-send-btn':'Dërgo Mesazhin →',
    'footer-desc':'Kulturzentrum Haus des Friedens - Qendra Kulturore Islame Shqiptare në Zürich Schwamendingen. Themeluar 2004.',
    'footer-col1-h':'Rreth Nesh','footer-col2-h':'Shërbime','footer-col3-h':'Kontakti',
    'footer-history':'Historiku','footer-statute':'Rregullorja','footer-imam':'Imami','footer-activities':'Aktivitetet',
    'footer-islamic':'Festat Islame','footer-quran':'Kurani','footer-lectures':'Ligjëratat','footer-membership':'Anëtarësimi','footer-contact-link':'Dërgoni mesazh',
    'bc-home':'Ballina','bc-news':'Media/Blog','news-page-h1':'Media & Blog','news-page-sub':'Lajmet dhe artikujt e fundit nga xhamia jonë','search-btn':'Kërko',
    'memb-h1':'Anëtarësimi','memb-sub':'Bashkohuni me komunitetin tonë','memb-h2':'Pagesat Online & Anëtarësimi','memb-p1':'Duke u anëtarësuar, kontribuoni drejtpërdrejt në komunitetin tonë fetar dhe kulturor në Zürich.',
    'memb-h3':'Përfitimet e Anëtarësimit','memb-li1':'Akses në të gjitha aktivitetet e xhamisë','memb-li2':'E drejta e votës në kuvende','memb-li3':'Mbështetje fetare dhe spirituale','memb-li4':'Pjesëmarrje në ngjarje speciale','memb-li5':'Newsletter dhe informacione të drejtpërdrejta',
    'memb-form-h3':'Formulari i Anëtarësimit','memb-lbl-name':'Emri i plotë','memb-lbl-tel':'Telefoni','memb-lbl-msg':'Mesazh','memb-send-btn':'Dërgo Formularin →',
    'locked-h2':'Zona e Anëtarëve','locked-p':'Kyçuni ose regjistrohuni për të aksesuar profilin tuaj.','locked-btn':'Hyrja / Regjistrim',
    'logout-btn':'Dalje','member-welcome-sub':'Menaxhoni profilin dhe llogarinë tuaj',
    'prof-title':'Profili im','prof-save-btn':'Ruaj ndryshimet',
    'cms-title':'Menaxho Lajmet','new-post-btn':'Artikull i ri','users-title':'Anëtarët e Regjistruar','settings-title':'Cilësimet e Llogarisë',
    'lbl-newpass':'Fjalëkalimi i ri','lbl-newpass2':'Konfirmo fjalëkalimin','change-pass-btn':'Ndrysho fjalëkalimin','danger-zone':'Zona e rrezikut','delete-account-btn':'Fshi llogarinë',
    'sideitem-profile':'Profili im','sideitem-cms':'Menaxho Lajmet','sideitem-users':'Anëtarët','sideitem-settings':'Cilësimet',
  },
  de:{
    'nav-subtitle':'Haus des Friedens • Zürich','hero-badge':'🕌 Zürich Schwamendingen • Gegr. 2004',
    'hero-h1':'Kulturzentrum<br><em>Haus des Friedens</em><br>Moschee Schwamendingen',
    'hero-quote-text':'O ihr Menschen! Wir haben euch aus einem Mann und einer Frau erschaffen und euch zu Völkern und Stämmen gemacht, damit ihr einander kennenlernt. Der Edelste von euch bei Allah ist der Gottesfürchtigste.',
    'hero-quote-cite':'- Der Heilige Quran, Al-Hujurat 49:13',
    'hero-btn1':'Aktuelle Neuigkeiten','hero-btn2':'Mitglied werden',
    'stat1-lbl':'Gegründet','stat2-lbl':'Jahre Dienst','stat3-lbl':'Albanischsprachig','stat4-lbl':'Partnerorganisationen',
    'pn-sabah':'Fadschr','pn-dreka':'Dhuhr','pn-ikindia':'Asr','pn-akshami':'Maghrib','pn-jacia':'Ischa',
    'about-badge':'🕌 Über uns','about-h2':'Islamisches<br>Kulturzentrum',
    'about-p1':'Das „Jugendkulturzentrum Haus des Friedens" wurde 2004 gegründet. Es ist ein Ort, an dem jeder Gläubige das Recht hat, seine religiösen Pflichten zu erfüllen.',
    'about-p2':'Die Mehrheit der Gläubigen - über 90% - sind Albaner aus Albanien, Kosovo, Nordmazedonien und dem Presevo-Tal.',
    'about-btn':'Geschichte lesen →','about-card-lbl':'Neue Adresse<br>Saatlenstr. 23',
    'news-badge':'📰 Neuigkeiten','news-h2':'Aktuelle Nachrichten','news-sub':'Bleiben Sie über die Aktivitäten unserer Moschee informiert','news-all-btn':'Alle Nachrichten anzeigen →',
    'act-badge':'Aktivitäten','act-h2':'Was wir anbieten','act-sub':'Unsere Moschee ist ein Zentrum des religiösen, kulturellen und sozialen Lebens',
    'act1-h':'Tägliche Gebete','act1-p':'Fünf tägliche Gebete unter Leitung eines qualifizierten Imams.',
    'act2-h':'Religiöse Bildung','act2-p':'Islamischer Unterricht für Kinder und Jugendliche.',
    'act3-h':'Interreligiöser Dialog','act3-p':'Zusammenarbeit mit der reformierten Kirche und dem Zürcher Forum der Religionen.',
    'act4-h':'Islamische Feste','act4-p':'Organisation von Ramadan-Iftar, Eid-Gebeten und anderen islamischen Festen.',
    'act5-h':'Humanitäre Hilfe','act5-p':'Unterstützung für bedürftige Familien und humanitäre Projekte.',
    'act6-h':'Imam-Vorträge','act6-p':'Wöchentliche Vorträge des Imams für unsere Gemeinschaft.',
    'prayer-badge':'Gebet','prayer-h2':'Gebetszeiten 2026','prayer-sub':'Laden Sie den Gebetszeitenkalender für jeden Monat herunter',
    'live-label':'Live - Gebetszeiten','open-new-tab':'In neuem Tab öffnen','iframe-credit':'Die Zeiten werden direkt von SwissMosque TV angezeigt',
    'prayer-special-btn':'📥 Besondere islamische Tage und Nächte 2026',
    'ps1':'Morgengebet (Fadschr)','ps1-s':'Morgen','ps2':'Mittagsgebet (Dhuhr)','ps2-s':'Mittag',
    'ps3':'Nachmittagsgebet (Asr)','ps3-s':'Nachmittag','ps4':'Abendgebet (Maghrib)','ps4-s':'Abend','ps5':'Nachtgebet (Ischa)','ps5-s':'Nacht','ps6':'Gebetszeiten Live',
    'don-badge':'💚 Ihre Spende','don-h2':'Unterstützen Sie unsere Moschee',
    'don-p':'Ihre finanzielle Unterstützung hilft der Moschee, weiterhin der Gemeinschaft zu dienen. Wir sind für jede Hilfe dankbar!',
    'bank-name-lbl':'Name','bank-addr-lbl':'Adresse','bank-konto-lbl':'Konto',
    'don-circle-p':'Wohltätigkeit - Sadaqa','don-circle-strong':'🤲 Spenden','don-circle-small':'Von ganzem Herzen',
    'gallery-badge':'Galerie','gallery-h2':'Fotogalerie',
    'contact-badge':'Kontakt','contact-h2':'Kontaktieren Sie uns','contact-info-h3':'Kontaktinformationen',
    'ci-addr-lbl':'Adresse','ci-prayer-lbl':'Gebetszeiten','ci-prayer-p':'Fünfmal täglich · Gemäß veröffentlichtem Zeitplan',
    'contact-form-h3':'Nachricht senden','cf-name-lbl':'Ihr Name','cf-msg-lbl':'Ihre Nachricht','contact-send-btn':'Nachricht absenden →',
    'footer-desc':'Kulturzentrum Haus des Friedens - Islamisches Kulturzentrum in Zürich Schwamendingen. Gegründet 2004.',
    'footer-col1-h':'Über uns','footer-col2-h':'Dienstleistungen','footer-col3-h':'Kontakt',
    'footer-history':'Geschichte','footer-statute':'Satzung','footer-imam':'Imam','footer-activities':'Aktivitäten',
    'footer-islamic':'Islamische Feste','footer-quran':'Quran','footer-lectures':'Vorträge','footer-membership':'Mitgliedschaft','footer-contact-link':'Nachricht senden',
    'nav-login-btn':'Anmelden',
    'bc-home':'Startseite','bc-news':'Medien/Blog','news-page-h1':'Medien & Blog','news-page-sub':'Neueste Nachrichten und Artikel aus unserer Moschee','search-btn':'Suchen',
    'memb-h1':'Mitgliedschaft','memb-sub':'Treten Sie unserer Gemeinschaft bei','memb-h2':'Online-Zahlung & Mitgliedschaft','memb-p1':'Durch Ihre Mitgliedschaft tragen Sie direkt zur Erhaltung unserer Gemeinschaft in Zürich bei.',
    'memb-h3':'Vorteile der Mitgliedschaft','memb-li1':'Zugang zu allen Aktivitäten der Moschee','memb-li2':'Stimmrecht bei Versammlungen','memb-li3':'Religiöse und spirituelle Unterstützung','memb-li4':'Teilnahme an besonderen Veranstaltungen','memb-li5':'Newsletter und direkte Informationen',
    'memb-form-h3':'Mitgliedschaftsformular','memb-lbl-name':'Vollständiger Name','memb-lbl-tel':'Telefon','memb-lbl-msg':'Nachricht','memb-send-btn':'Formular absenden →',
    'locked-h2':'Mitgliederbereich','locked-p':'Bitte melden Sie sich an oder registrieren Sie sich.','locked-btn':'Anmelden / Registrieren',
    'logout-btn':'Abmelden','member-welcome-sub':'Verwalten Sie Ihr Profil und Ihr Konto',
    'prof-title':'Mein Profil','prof-save-btn':'Änderungen speichern',
    'cms-title':'Nachrichten verwalten','new-post-btn':'Neuer Artikel','users-title':'Registrierte Mitglieder','settings-title':'Kontoeinstellungen',
    'lbl-newpass':'Neues Passwort','lbl-newpass2':'Passwort bestätigen','change-pass-btn':'Passwort ändern','danger-zone':'Gefahrenzone','delete-account-btn':'Konto löschen',
    'sideitem-profile':'Mein Profil','sideitem-cms':'Nachrichten verwalten','sideitem-users':'Mitglieder','sideitem-settings':'Einstellungen',
  }
};

let langSwitching=false;
function setLang(lang){
  if(currentLang===lang||langSwitching)return;
  langSwitching=true;
  currentLang=lang;
  document.documentElement.lang=lang==='sq'?'sq':'de';
  // gentle whole-page cross-fade while the translation swaps over ~1s
  document.body.classList.add('lang-switching');
  ['btn-sq','btn-de','mob-btn-sq','mob-btn-de'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.classList.toggle('active',id.includes(lang));
  });
  const htmlIds=['hero-h1','about-h2','about-card-lbl'];
  Object.entries(T[lang]).forEach(([id,val])=>{
    const el=document.getElementById(id);if(!el)return;
    el.style.transition='opacity .4s';el.style.opacity='0';
    setTimeout(()=>{
      if(htmlIds.includes(id))el.innerHTML=val;else el.textContent=val;
      el.style.opacity='1';
    },400);
  });
  document.querySelectorAll('[data-sq]').forEach(el=>{
    const v=el.getAttribute('data-'+lang);
    if(v){el.style.transition='opacity .4s';el.style.opacity='0';setTimeout(()=>{el.textContent=v;el.style.opacity='1';},400);}
  });
  if(currentUser){
    const w=document.getElementById('member-welcome');
    if(w)w.textContent=(lang==='de'?'Willkommen, ':'Mirë se vini, ')+currentUser.name.split(' ')[0]+'!';
  }
  try{localStorage.setItem('hdf_lang',lang);}catch(e){}
  updateAuthUI();
  renderCustomNav();
  const cp=document.getElementById('page-custom');
  if(cp&&cp.classList.contains('active')){const id=+(location.hash.match(/^#faqe-(\d+)$/)||[])[1];if(id)openCustomPage(id,false);}
  const sp=document.getElementById('page-staff');
  if(sp&&sp.classList.contains('active'))setTimeout(renderStaff,400);
  const ep=document.getElementById('page-events');
  if(ep&&ep.classList.contains('active'))setTimeout(renderEvents,400);
  const ip=document.getElementById('page-imam');
  if(ip&&ip.classList.contains('active'))setTimeout(renderImam,400);
  // news cards + an open article follow the language too
  setTimeout(()=>{renderHomeNews();if(document.getElementById('page-news').classList.contains('active'))renderNewsPage();if(document.getElementById('page-article').classList.contains('active')&&currentArticleId!=null)openArticle(currentArticleId,false);},400);
  saveState();
  setTimeout(()=>{document.body.classList.remove('lang-switching');langSwitching=false;},1000);
}

// AUTH
function showLoginLoading(on){
  const el=document.getElementById('login-loading');
  if(el)el.classList.toggle('open',on);
}
// After a successful login: branded loading bar, then straight to the dashboard
async function finishLogin(startedAt){
  const wait=Math.max(0,1600-(Date.now()-startedAt));
  await new Promise(r=>setTimeout(r,wait));
  updateAuthUI();
  navigate('member');
  showLoginLoading(false);
  showToast((currentLang==='de'?'Willkommen, ':'Mirë se vini, ')+currentUser.name.split(' ')[0]+'!','success');
}

async function doLogin(){
  const email=document.getElementById('login-email').value.trim();
  const pass=document.getElementById('login-pass').value;
  if(REMOTE){
    const {data,error}=await sb.auth.signInWithPassword({email,password:pass});
    if(error){showToast(currentLang==='de'?'Falsche E-Mail oder Passwort!':'Email ose fjalëkalim i gabuar!','error');return;}
    closeModal('auth-modal');
    showLoginLoading(true);
    const t0=Date.now();
    await setUserFromSession(data.user);
    await finishLogin(t0);
    return;
  }
  const user=DB.users.find(u=>u.email===email&&u.password===pass);
  if(!user){showToast(currentLang==='de'?'Falsche E-Mail oder Passwort!':'Email ose fjalëkalim i gabuar!','error');return;}
  currentUser=user;closeModal('auth-modal');saveState();
  showLoginLoading(true);
  await finishLogin(Date.now());
}
async function doRegister(){
  const name=document.getElementById('reg-name').value.trim();
  const email=document.getElementById('reg-email').value.trim();
  const pass=document.getElementById('reg-pass').value;
  const pass2=document.getElementById('reg-pass2').value;
  if(!name||!email||!pass){showToast(currentLang==='de'?'Alle Felder ausfüllen!':'Plotësoni të gjitha fushat!','error');return;}
  if(pass!==pass2){showToast(currentLang==='de'?'Passwörter stimmen nicht überein!':'Fjalëkalimet nuk përputhen!','error');return;}
  if(pass.length<8){showToast('Min. 8 '+(currentLang==='de'?'Zeichen!':'karaktere!'),'error');return;}
  const terms=document.getElementById('reg-terms');
  if(terms&&!terms.checked){showToast(currentLang==='de'?'Bitte akzeptieren Sie die Bedingungen!':'Ju lutem pranoni Kushtet e Përdorimit!','error');return;}
  if(REMOTE){
    const {data,error}=await sb.auth.signUp({email,password:pass,options:{data:{name}}});
    if(error){showToast(error.message,'error');return;}
    if(!data.session){
      closeModal('auth-modal');
      showToast(currentLang==='de'?'Bestätigen Sie Ihre E-Mail-Adresse!':'Kontrolloni email-in tuaj për konfirmim!','success');
      return;
    }
    await setUserFromSession(data.user);
    closeModal('auth-modal');updateAuthUI();
    showToast((currentLang==='de'?'Konto erstellt! Willkommen, ':'Llogaria u krijua! Mirë se vini, ')+name+'!','success');
    return;
  }
  if(DB.users.find(u=>u.email===email)){showToast(currentLang==='de'?'E-Mail bereits registriert!':'Ky email është i regjistruar!','error');return;}
  const nu={id:DB.nextUserId++,name,email,password:pass,role:'member'};
  DB.users.push(nu);currentUser=nu;closeModal('auth-modal');updateAuthUI();saveState();
  showToast((currentLang==='de'?'Konto erstellt! Willkommen, ':'Llogaria u krijua! Mirë se vini, ')+name+'!','success');
}
async function doLogout(){
  const overlay=document.getElementById('login-loading');
  const label=overlay&&overlay.querySelector('p');
  if(label)label.textContent=currentLang==='de'?'Abmeldung...':'Duke u çkyçur...';
  showLoginLoading(true);
  if(REMOTE)await sb.auth.signOut();
  currentUser=null;updateAuthUI();saveState();
  await new Promise(r=>setTimeout(r,1400));
  navigate('home');
  showLoginLoading(false);
  if(label)label.textContent=currentLang==='de'?'Anmeldung läuft...':'Duke u kyçur...';
  showToast(currentLang==='de'?'Erfolgreich abgemeldet.':'U çkyçët nga llogaria.','');
}
function updateAuthUI(){
  const area=document.getElementById('auth-nav-area');
  if(currentUser){
    area.innerHTML=`<div style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="navigate('member')"><div class="user-avatar">${currentUser.name.charAt(0)}</div><span style="font-size:13px;font-weight:600;color:var(--ink)">${currentUser.name.split(' ')[0]}</span></div>`;
  }else{
    area.innerHTML=`<button class="btn btn-outline" onclick="openModal('auth-modal')" style="padding:8px 18px;font-size:13px">${currentLang==='de'?'Als Admin anmelden':'Kyqu si Admin'}</button>`;
  }
}

// NEWS
// Language-aware title/body for a news article (falls back to Albanian)
function postTitle(p){return (currentLang==='de'&&p.title_de)?p.title_de:p.title;}
function postBody(p){return (currentLang==='de'&&p.body_de)?p.body_de:p.body;}

function newsCard(p){
  const title=postTitle(p),body=postBody(p);
  return `<div class="news-card" onclick="openArticle(${p.id})">
    <div class="news-card-img">
      <div class="news-card-img-placeholder">📰</div>
      ${p.img?`<img src="${p.img}" alt="${title}" loading="lazy" onerror="this.style.display='none'">`:''}
      <span class="news-card-chip">${p.category}</span>
      ${p.video?'<span class="news-card-play">▶</span>':''}
    </div>
    <div class="news-card-body">
      <div class="news-card-meta"><span class="news-card-date">📅 ${p.date}</span></div>
      <h3>${title}</h3>
      <p>${body.substring(0,110)}${body.length>110?'...':''}</p>
      <div class="news-card-footer"><span class="read-more">${currentLang==='de'?'Weiterlesen →':'Lexo më shumë →'}</span></div>
    </div>
  </div>`;
}
function renderHomeNews(){const g=document.getElementById('home-news-grid');if(g)g.innerHTML=DB.posts.slice(0,3).map(newsCard).join('');}
function renderNewsPage(){
  const g=document.getElementById('news-grid');if(!g)return;
  const q=(document.getElementById('news-search')||{}).value||'';
  let posts=DB.posts;
  if(q){const ql=q.toLowerCase();posts=posts.filter(p=>(p.title+' '+p.body+' '+(p.title_de||'')+' '+(p.body_de||'')).toLowerCase().includes(ql));}
  if(currentFilter!=='ALL')posts=posts.filter(p=>p.category===currentFilter);
  g.innerHTML=posts.length?posts.map(newsCard).join(''):`<p style="color:var(--ink-lt);grid-column:1/-1;text-align:center;padding:40px 0">${currentLang==='de'?'Keine Artikel gefunden.':'Nuk u gjetën artikuj.'}</p>`;
}
function filterNews(){renderNewsPage();}
function setFilter(f,el){
  currentFilter=f;
  document.querySelectorAll('.filter-pill').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');renderNewsPage();
}
// Build a responsive video embed from an MP4/YouTube/Facebook URL
function videoEmbedHtml(url){
  if(!url)return'';
  const yt=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
  if(yt)return`<div class="article-video"><iframe src="https://www.youtube.com/embed/${yt[1]}" title="YouTube" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>`;
  if(/facebook\.com|fb\.watch/i.test(url)){
    if(!fbEmbeddable(url))return`<a class="btn btn-primary" href="${url}" target="_blank" rel="noopener" style="margin-bottom:20px">▶ Shiko videon në Facebook</a>`;
    return`<div class="article-video"><iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false" allowfullscreen title="Facebook video"></iframe></div>`;
  }
  return`<div class="article-video"><video src="${url}" controls playsinline preload="metadata"></video></div>`;
}

// ── SINGLE ARTICLE PAGE (own URL via #lajmi-<id>) ──
// Combined image list for an article: gallery images, or the cover as fallback.
function articleImages(p){
  const list=(Array.isArray(p.images)?p.images:[]).filter(Boolean);
  if(list.length)return list;
  return p.img?[p.img]:[];
}
// Render the article photos as a stacked deck (+ thumbnail strip) that opens
// the fullscreen slideshow. Closing the slideshow returns to the article.
let articleGalleryImages=[];
function renderArticleGallery(images,title){
  const wrap=document.getElementById('article-gallery');if(!wrap)return;
  articleGalleryImages=images;
  if(!images.length){wrap.innerHTML='';wrap.style.display='none';return;}
  wrap.style.display='block';
  const alt=(title||'').replace(/"/g,'&quot;');
  if(images.length===1){
    wrap.innerHTML=`<img class="article-img" src="${images[0]}" alt="${alt}" onerror="this.style.display='none'" onclick="openArticleLightbox(0)" style="cursor:zoom-in">`;
    return;
  }
  const peek=images.slice(0,3).map((src,i)=>
    `<div class="stack-card stack-card-${i}"><img src="${src}" alt="${alt}" loading="lazy" onerror="this.style.opacity=0"></div>`
  ).join('');
  const thumbs=images.map((src,i)=>
    `<button class="gallery-thumb" onclick="openArticleLightbox(${i})" aria-label="Foto ${i+1}"><img src="${src}" alt="${alt} ${i+1}" loading="lazy" onerror="this.parentNode.style.display='none'"></button>`
  ).join('');
  wrap.innerHTML=`
    <div class="photo-stack" onclick="openArticleLightbox(0)" title="Kliko për slideshow">
      ${peek}
      <span class="photo-stack-badge">📷 ${images.length} ${currentLang==='de'?'Fotos':'foto'}</span>
    </div>
    <div class="gallery-thumbs">${thumbs}</div>`;
}
function openArticleLightbox(i){openLightbox(articleGalleryImages,i);}

let currentArticleId=null;
function openArticle(id,pushHash=true){
  const p=DB.posts.find(x=>x.id===id);if(!p)return;
  currentArticleId=id;
  const title=postTitle(p),bodyText=postBody(p);
  document.getElementById('article-cat').textContent=p.category;
  document.getElementById('article-date').textContent=p.date;
  document.getElementById('article-title').textContent=title;
  renderArticleGallery(articleImages(p), title);
  const body='<p>'+bodyText.replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')+'</p>';
  document.getElementById('article-body').innerHTML=body+videoEmbedHtml(p.video);
  if(pushHash){try{history.pushState(null,'','#lajmi-'+id);}catch(e){}}
  navigate('article');
}
window.addEventListener('hashchange',()=>{
  const m=location.hash.match(/^#lajmi-(\d+)$/);
  if(m)openArticle(+m[1],false);
  const f=location.hash.match(/^#faqe-(\d+)$/);
  if(f)openCustomPage(+f[1],false);
});

function openNewsModal(id){
  const p=DB.posts.find(x=>x.id===id);if(!p)return;
  const title=postTitle(p),body=postBody(p);
  document.getElementById('news-modal-content').innerHTML=`
    ${p.img?`<img src="${p.img}" alt="${title}" style="width:100%;height:260px;object-fit:cover;border-radius:10px;margin-bottom:20px" onerror="this.style.display='none'">`:''}
    <div class="news-card-meta" style="margin-bottom:10px"><span class="news-card-cat">${p.category}</span><span class="news-card-date">${p.date}</span></div>
    <h2 style="font-size:22px;color:var(--green);margin-bottom:14px">${title}</h2>
    <div style="color:var(--ink-mid);font-size:15px;line-height:1.8">${body.replace(/\n/g,'<br>')}</div>`;
  openModal('news-modal');
}

// ── PARTNERS ──
let partners=[
  {name:'Parandalo.ch',url:'https://parandalo.ch',logo:''},
  {name:'VIOZ - Vereinigung der Islamischen Organisationen in Zürich',url:'',logo:''},
  {name:'DAIGS - Dachverband der Albanisch-Islamischen Gemeinschaften',url:'',logo:''},
  {name:'FIDS - Föderation Islamischer Dachorganisationen Schweiz',url:'',logo:''},
  {name:'Zürcher Forum der Religionen',url:'',logo:''},
];

function partnerTile(p){
  const visual=p.logo
    ?`<div class="partner-letter">${p.name.charAt(0)}</div><img src="${p.logo}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">`
    :`<div class="partner-letter">${p.name.charAt(0)}</div>`;
  const inner=`<div class="partner-visual">${visual}</div><div class="partner-name">${p.name}</div>`;
  return p.url
    ?`<a class="partner-card" href="${p.url}" target="_blank" rel="noopener">${inner}</a>`
    :`<div class="partner-card">${inner}</div>`;
}

function renderPartners(){
  const g=document.getElementById('partners-grid');if(!g)return;
  g.innerHTML=partners.map(partnerTile).join('');
}

function renderPartnersAdmin(){
  const list=document.getElementById('partners-admin-list');if(!list)return;
  if(!partners.length){list.innerHTML='<p style="color:var(--ink-lt)">Ende asnjë partner.</p>';return;}
  list.innerHTML=partners.map((p,i)=>`
    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--white);border:1px solid var(--border);border-radius:10px">
      <div style="width:40px;height:40px;border-radius:8px;background:var(--green-lt);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
        ${p.logo?`<img src="${p.logo}" style="width:100%;height:100%;object-fit:contain">`:`<strong style="color:var(--green)">${p.name.charAt(0)}</strong>`}
      </div>
      <div style="flex:1;min-width:0"><strong style="font-size:13.5px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</strong><small style="color:var(--ink-lt)">${p.url||'-'}</small></div>
      <button class="btn-del" style="padding:7px 12px;font-size:12px;font-weight:700;border-radius:8px;border:none" onclick="deletePartner(${i})">🗑️</button>
    </div>`).join('');
}

async function addPartner(){
  const name=document.getElementById('partner-name').value.trim();
  const url=document.getElementById('partner-url').value.trim();
  const logo=document.getElementById('partner-logo').value.trim();
  if(!name){showToast('Shkruani emrin e partnerit!','error');return;}
  if(REMOTE){
    const {error}=await sb.from('partners').insert({name,url,logo});
    if(error){showToast('Gabim: '+error.message,'error');return;}
    await remoteLoadAll();
  }else{
    partners.push({name,url,logo});saveState();
  }
  ['partner-name','partner-url','partner-logo'].forEach(id=>document.getElementById(id).value='');
  renderPartnersAdmin();renderPartners();
  showToast('🤝 Partneri u shtua!','success');
}

async function deletePartner(i){
  if(!confirm('Fshi këtë partner?'))return;
  if(REMOTE){
    const {error}=await sb.from('partners').delete().eq('id',partners[i].id);
    if(error){showToast('Gabim: '+error.message,'error');return;}
  }
  partners.splice(i,1);saveState();
  renderPartnersAdmin();renderPartners();
  showToast('Partneri u fshi.','');
}

async function uploadPartnerLogo(ev){
  const f=(ev.target.files||[])[0];ev.target.value='';
  if(!f)return;
  if(!REMOTE){showToast('Ngarkimi kërkon lidhje me serverin!','error');return;}
  showToast('⏳ Duke ngarkuar logon...','');
  try{
    document.getElementById('partner-logo').value=await uploadToStorage(f);
    showToast('✅ Logo u ngarkua!','success');
  }catch(e){showToast('Gabim: '+e.message,'error');}
}

// ── STAFF (Kryesia e Xhamisë) ──
let staff=[];

function staffCard(p){
  const pos=currentLang==='de'?(p.position_de||p.position_sq):(p.position_sq||p.position_de);
  const initial=(p.name||'?').trim().charAt(0).toUpperCase();
  const visual=p.photo
    ?`<img src="${p.photo}" alt="${p.name}" loading="lazy" onerror="this.parentNode.innerHTML='<span>${initial}</span>'">`
    :`<span>${initial}</span>`;
  return `<div class="staff-card">
    <div class="staff-photo">${visual}</div>
    <div class="staff-name">${p.name||''}</div>
    <div class="staff-position">${pos||''}</div>
  </div>`;
}

function renderStaff(){
  const g=document.getElementById('staff-grid');if(!g)return;
  const empty=document.getElementById('staff-empty');
  if(!staff.length){g.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  g.innerHTML=staff.map(staffCard).join('');
}

function renderStaffAdmin(){
  const list=document.getElementById('staff-admin-list');if(!list)return;
  if(!staff.length){list.innerHTML='<p style="color:var(--ink-lt)">Ende asnjë anëtar i kryesisë.</p>';return;}
  list.innerHTML=staff.map((p,i)=>`
    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--white);border:1px solid var(--border);border-radius:10px">
      <div style="width:44px;height:44px;border-radius:50%;background:var(--green-lt);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
        ${p.photo?`<img src="${p.photo}" style="width:100%;height:100%;object-fit:cover">`:`<strong style="color:var(--green)">${(p.name||'?').charAt(0)}</strong>`}
      </div>
      <div style="flex:1;min-width:0"><strong style="font-size:13.5px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</strong><small style="color:var(--ink-lt)">${p.position_sq||'-'}${p.position_de?' / '+p.position_de:''}</small></div>
      <button class="btn-del" style="padding:7px 12px;font-size:12px;font-weight:700;border-radius:8px;border:none" onclick="deleteStaff(${i})">🗑️</button>
    </div>`).join('');
}

async function addStaff(){
  const name=document.getElementById('staff-name').value.trim();
  const position_sq=document.getElementById('staff-position-sq').value.trim();
  const position_de=document.getElementById('staff-position-de').value.trim();
  const photo=document.getElementById('staff-photo').value.trim();
  if(!name){showToast('Shkruani emrin e anëtarit!','error');return;}
  if(!position_sq&&!position_de){showToast('Shkruani pozitën!','error');return;}
  const sort_order=staff.length;
  if(REMOTE){
    const {error}=await sb.from('staff').insert({name,position_sq,position_de,photo,sort_order});
    if(error){showToast(friendlyDbError(error,'migration-013-staff.sql'),'error');return;}
    await remoteLoadAll();
  }else{
    staff.push({name,position_sq,position_de,photo});saveState();
  }
  ['staff-name','staff-position-sq','staff-position-de','staff-photo'].forEach(id=>document.getElementById(id).value='');
  renderStaffAdmin();renderStaff();
  showToast('👥 Anëtari u shtua!','success');
}

async function deleteStaff(i){
  if(!confirm('Fshi këtë anëtar?'))return;
  if(REMOTE){
    const {error}=await sb.from('staff').delete().eq('id',staff[i].id);
    if(error){showToast('Gabim: '+error.message,'error');return;}
  }
  staff.splice(i,1);saveState();
  renderStaffAdmin();renderStaff();
  showToast('Anëtari u fshi.','');
}

async function uploadStaffPhoto(ev){
  const f=(ev.target.files||[])[0];ev.target.value='';
  if(!f)return;
  if(!REMOTE){showToast('Ngarkimi kërkon lidhje me serverin!','error');return;}
  showToast('⏳ Duke ngarkuar foton...','');
  try{
    document.getElementById('staff-photo').value=await uploadToStorage(f);
    showToast('✅ Fotografia u ngarkua!','success');
  }catch(e){showToast('Gabim: '+e.message,'error');}
}

// ── EVENTS / NGJARJET ──
let events=[];

function eventDateParts(iso){
  // iso = "YYYY-MM-DD"; returns {day, mon} localized
  const d=new Date(iso+'T00:00:00');
  const loc=currentLang==='de'?'de-DE':'sq-AL';
  return {day:d.getDate(), mon:d.toLocaleDateString(loc,{month:'short'}), full:d.toLocaleDateString(loc,{weekday:'long',day:'numeric',month:'long',year:'numeric'})};
}
function upcomingEvents(){
  const today=new Date();today.setHours(0,0,0,0);
  return events
    .filter(e=>{const d=new Date(e.event_date+'T00:00:00');return d>=today;})
    .sort((a,b)=>a.event_date.localeCompare(b.event_date));
}
function eventCard(e){
  const title=(currentLang==='de'&&e.title_de)?e.title_de:(e.title_sq||e.title_de);
  const desc=(currentLang==='de'&&e.desc_de)?e.desc_de:(e.desc_sq||e.desc_de||'');
  const p=eventDateParts(e.event_date);
  const meta=[];
  if(e.event_time)meta.push('🕐 '+e.event_time);
  if(e.location)meta.push('📍 '+e.location);
  return `<div class="event-card">
    <div class="event-date"><span class="event-day">${p.day}</span><span class="event-mon">${p.mon}</span></div>
    <div class="event-body">
      <h3>${title||''}</h3>
      <div class="event-meta">${p.full}${meta.length?' · '+meta.join(' · '):''}</div>
      ${desc?`<p>${desc}</p>`:''}
    </div>
  </div>`;
}
function renderEvents(){
  const list=document.getElementById('events-list');if(!list)return;
  const empty=document.getElementById('events-empty');
  const up=upcomingEvents();
  if(!up.length){list.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  list.innerHTML=up.map(eventCard).join('');
}
function renderEventsAdmin(){
  const list=document.getElementById('events-admin-list');if(!list)return;
  if(!events.length){list.innerHTML='<p style="color:var(--ink-lt)">Ende asnjë ngjarje.</p>';return;}
  const today=new Date();today.setHours(0,0,0,0);
  const sorted=[...events].sort((a,b)=>a.event_date.localeCompare(b.event_date));
  list.innerHTML=sorted.map(e=>{
    const past=new Date(e.event_date+'T00:00:00')<today;
    return `<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--white);border:1px solid var(--border);border-radius:10px;${past?'opacity:.55':''}">
      <div style="text-align:center;min-width:46px">
        <div style="font-weight:800;font-size:18px;color:var(--green);line-height:1">${eventDateParts(e.event_date).day}</div>
        <div style="font-size:11px;color:var(--ink-lt);text-transform:uppercase">${eventDateParts(e.event_date).mon}</div>
      </div>
      <div style="flex:1;min-width:0"><strong style="font-size:13.5px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.title_sq||e.title_de}</strong><small style="color:var(--ink-lt)">${e.event_date}${e.event_time?' · '+e.event_time:''}${past?' · (kaloi)':''}</small></div>
      <button class="btn-del" style="padding:7px 12px;font-size:12px;font-weight:700;border-radius:8px;border:none" onclick="deleteEvent(${e.id})">🗑️</button>
    </div>`;
  }).join('');
}
async function addEvent(){
  const title_sq=document.getElementById('event-title-sq').value.trim();
  const title_de=document.getElementById('event-title-de').value.trim();
  const event_date=document.getElementById('event-date').value;
  const event_time=document.getElementById('event-time').value.trim();
  const location=document.getElementById('event-location').value.trim();
  const desc_sq=document.getElementById('event-desc-sq').value.trim();
  const desc_de=document.getElementById('event-desc-de').value.trim();
  if(!title_sq&&!title_de){showToast('Shkruani titullin e ngjarjes!','error');return;}
  if(!event_date){showToast('Zgjidhni datën e ngjarjes!','error');return;}
  const row={title_sq,title_de,desc_sq,desc_de,event_date,event_time,location};
  if(REMOTE){
    const {error}=await sb.from('events').insert(row);
    if(error){showToast(friendlyDbError(error,'migration-014-events.sql'),'error');return;}
    await remoteLoadAll();
  }else{events.push({id:Date.now(),...row});saveState();}
  ['event-title-sq','event-title-de','event-date','event-time','event-location','event-desc-sq','event-desc-de'].forEach(id=>document.getElementById(id).value='');
  renderEventsAdmin();renderEvents();
  showToast('📅 Ngjarja u shtua!','success');
}
async function deleteEvent(id){
  if(!confirm('Fshi këtë ngjarje?'))return;
  if(REMOTE){
    const {error}=await sb.from('events').delete().eq('id',id);
    if(error){showToast(friendlyDbError(error,'migration-014-events.sql'),'error');return;}
  }
  events=events.filter(e=>e.id!==id);saveState();
  renderEventsAdmin();renderEvents();
  showToast('Ngjarja u fshi.','');
}

async function uploadCondPhoto(ev){
  const f=(ev.target.files||[])[0];ev.target.value='';
  if(!f)return;
  if(!REMOTE){showToast('Ngarkimi kërkon lidhje me serverin!','error');return;}
  showToast('⏳ Duke ngarkuar foton...','');
  try{
    document.getElementById('cond-photo').value=await uploadToStorage(f);
    showToast('✅ Fotoja u ngarkua!','success');
  }catch(e){showToast('Gabim: '+e.message,'error');}
}

// MEMBER AREA
let mediaItems = [
  {url:'https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4697-scaled.jpg',cap:'Iftar 2026'},
  {url:'https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4669-1-scaled.jpg',cap:'Xhamia'},
  {url:'https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4670-1-scaled.jpg',cap:'Aktivitet'},
  {url:'https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4674-1-scaled.jpg',cap:'Bashkësia'},
  {url:'https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4728-scaled.jpg',cap:'Namazi'},
  {url:'https://hausdesfriedens.ch/wp-content/uploads/2026/03/DSC_4745-1-scaled.jpg',cap:'Galeria'},
];

function renderMemberArea(){
  const out=document.getElementById('member-logged-out'),inp=document.getElementById('member-logged-in');
  if(!currentUser){out.classList.remove('hidden');inp.classList.add('hidden');return;}
  out.classList.add('hidden');inp.classList.remove('hidden');
  const name=currentUser.name.split(' ')[0];
  document.getElementById('member-welcome').textContent=(currentLang==='de'?'Willkommen, ':'Mirë se vini, ')+name+'!';
  document.getElementById('prof-role-badge').textContent=currentUser.role==='admin'?'Administrator':'Anëtar';
  const pa=document.getElementById('profile-avatar');if(pa)pa.textContent=currentUser.name.charAt(0).toUpperCase();
  const pab=document.getElementById('profile-avatar-big');if(pab)pab.textContent=currentUser.name.charAt(0).toUpperCase();
  document.getElementById('prof-name').value=currentUser.name;
  document.getElementById('prof-email').value=currentUser.email;
  document.getElementById('prof-role').value=currentUser.role==='admin'?'Administrator':(currentLang==='de'?'Mitglied':'Anëtar');
  const isAdmin=currentUser.role==='admin';
  document.querySelectorAll('.admin-only').forEach(el=>el.style.display=isAdmin?'':'none');
  document.querySelectorAll('.admin-only-el').forEach(el=>el.style.display=isAdmin?'flex':'none');
  showAdminTab('dashboard');
}

function renderDashboard(){
  const dc=document.getElementById('dc-posts');if(dc)dc.textContent=DB.posts.length;
  const dm=document.getElementById('dc-members');if(dm)dm.textContent=DB.users.length;
  const dt=document.getElementById('dc-today');if(dt)dt.textContent=new Date().toLocaleDateString('sq-AL',{day:'numeric',month:'short'});
  const rec=document.getElementById('dash-recent-posts');
  if(!rec)return;
  rec.innerHTML=DB.posts.slice(0,5).map(p=>`
    <div class="dash-post-row" onclick="showAdminTab('news');setTimeout(()=>openPostModal(${p.id}),100)">
      <div class="dash-post-thumb">${p.img?`<img src="${p.img}" style="width:48px;height:48px;object-fit:cover;border-radius:8px" onerror="this.outerHTML='📰'">`:'📰'}</div>
      <div class="dash-post-info">
        <h4>${p.title}</h4>
        <p>${p.category} · ${p.date}</p>
      </div>
      <span style="font-size:12px;color:var(--green);font-weight:600">Edito →</span>
    </div>`).join('');
}

function renderAdminNews(){
  const grid=document.getElementById('admin-news-cards');if(!grid)return;
  const q=(document.getElementById('admin-news-search')||{}).value||'';
  const cat=(document.getElementById('admin-news-cat-filter')||{}).value||'';
  let posts=DB.posts;
  if(q)posts=posts.filter(p=>p.title.toLowerCase().includes(q.toLowerCase())||p.body.toLowerCase().includes(q.toLowerCase()));
  if(cat)posts=posts.filter(p=>p.category===cat);
  if(!posts.length){grid.innerHTML=`<p style="color:var(--ink-lt);text-align:center;padding:40px;grid-column:1/-1">Nuk u gjetën artikuj.</p>`;return;}
  grid.innerHTML=posts.map(p=>`
    <div class="admin-post-card">
      <div class="admin-post-card-img">
        ${p.img?`<img src="${p.img}" onerror="this.style.display='none'">`:''}
        <div class="admin-post-card-img-placeholder">📰</div>
      </div>
      <div class="admin-post-card-body">
        <span style="font-size:10px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.6px">${p.category} · ${p.date}</span>
        <h4>${p.title}</h4>
        <p>${p.body.substring(0,80)}...</p>
        <div class="admin-post-card-actions">
          <button class="btn-edit" onclick="openPostModal(${p.id})">✏️ Edito</button>
          <button class="btn-del" onclick="deletePost(${p.id})">🗑️ Fshi</button>
        </div>
      </div>
    </div>`).join('');
}

function renderMembersTab(){
  const grid=document.getElementById('members-cards');if(!grid)return;
  const q=(document.getElementById('member-search')||{}).value||'';
  const role=(document.getElementById('member-role-filter')||{}).value||'';
  let users=DB.users;
  if(q)users=users.filter(u=>u.name.toLowerCase().includes(q.toLowerCase())||u.email.toLowerCase().includes(q.toLowerCase()));
  if(role)users=users.filter(u=>u.role===role);
  grid.innerHTML=users.map(u=>`
    <div class="member-card">
      <div class="member-card-avatar">${u.name.charAt(0).toUpperCase()}</div>
      <div class="member-card-info">
        <h4>${u.name}</h4>
        <p>${u.email}</p>
      </div>
      <span class="member-card-role ${u.role==='admin'?'role-admin':'role-member'}">${u.role==='admin'?'Admin':'Anëtar'}</span>
    </div>`).join('');
}

// ── MEDIA UPLOADS (Supabase Storage) ──
function detectMediaKind(url){
  if(/facebook\.com|fb\.watch/i.test(url))return'facebook';
  if(/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url))return'video';
  if(/\.(mp3|m4a|aac|ogg|wav)(\?|$)/i.test(url))return'audio';
  if(/\.pdf(\?|$)/i.test(url))return'pdf';
  return'image';
}
// Facebook Reels and share/watch short links refuse to embed - link out instead
function fbEmbeddable(url){return !/\/reel\/|fb\.watch|\/share\//i.test(url);}

async function resizeImage(file,maxW=1600,quality=.85){
  if(!/^image\//.test(file.type)||file.type==='image/gif')return file;
  try{
    const img=await createImageBitmap(file);
    const scale=Math.min(1,maxW/Math.max(img.width,img.height));
    if(scale>=1)return file;
    const c=document.createElement('canvas');
    c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',quality));
    return blob||file;
  }catch(e){return file;}
}

async function uploadToStorage(file){
  const isImage=/^image\//.test(file.type);
  const processed=isImage?await resizeImage(file):file;
  const ext=isImage?'.jpg':((file.name.match(/\.\w+$/)||['.bin'])[0]);
  const path=Date.now()+'-'+Math.random().toString(36).slice(2,8)+ext.toLowerCase();
  const {error}=await sb.storage.from('media').upload(path,processed,{
    contentType:isImage?'image/jpeg':(file.type||'application/octet-stream'),cacheControl:'31536000'});
  if(error)throw error;
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}

async function uploadMediaFiles(ev){
  const files=Array.from(ev.target.files||[]);ev.target.value='';
  if(!files.length)return;
  if(!REMOTE){showToast('Ngarkimi i skedarëve kërkon lidhje me serverin!','error');return;}
  showToast('⏳ Duke ngarkuar '+files.length+' skedar(ë)...','');
  let ok=0;
  for(const f of files){
    const isVideo=/^video\//.test(f.type),isAudio=/^audio\//.test(f.type)||/\.(mp3|m4a)$/i.test(f.name);
    const isPdf=f.type==='application/pdf'||/\.pdf$/i.test(f.name);
    if((isVideo||isAudio||isPdf)&&f.size>50*1024*1024){showToast(f.name+': maksimumi 50MB!','error');continue;}
    if(!isVideo&&!isAudio&&!isPdf&&!/^image\//.test(f.type)){showToast(f.name+': vetëm foto, video, MP3 ose PDF!','error');continue;}
    try{
      const url=await uploadToStorage(f);
      const kind=isVideo?'video':(isAudio?'audio':(isPdf?'pdf':'image'));
      const {error}=await sb.from('media').insert({url,caption:f.name.replace(/\.\w+$/,''),kind});
      if(error)throw error;
      ok++;
    }catch(e){showToast('Gabim te '+f.name+': '+e.message,'error');}
  }
  if(ok){
    await remoteLoadAll();renderMediaTab();renderPublicGallery();renderAudioList();updateHeroSlides();renderDocsList();wirePrayerDocs();renderStatuteDoc();
    showToast('✅ '+ok+' skedar(ë) u ngarkuan!','success');
  }
}

function mediaThumbHtml(m,i){
  let inner;
  if(m.kind==='video')inner=`<video src="${m.url}" preload="metadata" muted playsinline></video><div class="media-kind-badge">🎬</div>`;
  else if(m.kind==='facebook')inner=`<div class="media-fb-tile">📘<small>Facebook</small></div>`;
  else if(m.kind==='audio')inner=`<div class="media-audio-tile">🎧<small>${(m.cap||'Audio').slice(0,22)}</small></div>`;
  else if(m.kind==='pdf')inner=`<div class="media-pdf-tile">📄<small>${(m.cap||'PDF').slice(0,22)}</small></div>`;
  else inner=`<img src="${m.url}" alt="${m.cap}" loading="lazy" onerror="this.style.display='none'"><button class="media-star${m.featured?' on':''}" title="Foto e ballinës (max 6)" onclick="event.stopPropagation();toggleFeatured(${i})">★</button>`;
  return `<div class="media-thumb${m.featured?' featured':''}">${inner}
    <div class="media-thumb-overlay">
      <button class="media-thumb-del" onclick="deleteMediaItem(${i})">🗑️ Fshi</button>
      <span style="color:white;font-size:11px;font-weight:600;opacity:0;transition:opacity .2s" class="media-cap">${m.cap||''}</span>
    </div>
  </div>`;
}

let mediaFilter='all';
function setMediaFilter(kind,btn){
  mediaFilter=kind;
  document.querySelectorAll('.media-filter-tab').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderMediaTab();
}
function renderMediaTab(){
  const grid=document.getElementById('media-grid');if(!grid)return;
  // update counts on the filter tabs
  const counts={all:mediaItems.length,image:0,video:0,facebook:0,audio:0,pdf:0};
  mediaItems.forEach(m=>{counts[m.kind]=(counts[m.kind]||0)+1;});
  Object.entries(counts).forEach(([k,n])=>{const el=document.getElementById('mf-'+k);if(el)el.textContent=n;});
  // render only the selected kind, keeping each item's original index
  const rows=mediaItems.map((m,i)=>[m,i]).filter(([m])=>mediaFilter==='all'||m.kind===mediaFilter);
  grid.innerHTML=rows.map(([m,i])=>mediaThumbHtml(m,i)).join('');
  const empty=document.getElementById('media-empty');
  if(empty)empty.style.display=rows.length?'none':'block';
  grid.querySelectorAll('.media-thumb').forEach(el=>{
    el.addEventListener('mouseenter',()=>{const c=el.querySelector('.media-cap');if(c)c.style.opacity='1';});
    el.addEventListener('mouseleave',()=>{const c=el.querySelector('.media-cap');if(c)c.style.opacity='0';});
  });
}

// Public homepage gallery mirrors the media library once it has content
function renderPublicGallery(){
  const g=document.querySelector('#page-home .gallery-grid');if(!g)return;
  // Homepage gallery shows photos only - no video, no Facebook, no PDF/audio
  const items=mediaItems.filter(m=>m.kind==='image');
  if(!REMOTE||!items.length)return; // keep the static fallback gallery
  const zoomSvg='<div class="g-overlay"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></div>';
  g.innerHTML=items.map(m=>`<div class="g-item"><img src="${m.url}" alt="${m.cap||'Foto'}" loading="lazy">${zoomSvg}</div>`).join('');
}

// ── PDF DOCUMENTS LIST (public) ──
function renderDocsList(){
  const sec=document.getElementById('docs-section'),list=document.getElementById('docs-list');
  if(!sec||!list)return;
  const pdfs=mediaItems.filter(m=>m.kind==='pdf');
  sec.style.display=pdfs.length?'block':'none';
  list.innerHTML=pdfs.map(p=>`<a class="prayer-dl-btn" href="${p.url}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M12 16l-5-5 1.4-1.4 2.6 2.6V4h2v8.2l2.6-2.6L17 11l-5 5zm-6 4h12v-2H6v2z"/></svg><span>${p.cap||'PDF'}</span></a>`).join('');
}

// ── ACTIVITY SECTION PHOTOS (admin-assigned backgrounds) ──
function applyActivityPhotos(){
  document.querySelectorAll('#page-home .activities-grid .activity-card').forEach((card,i)=>{
    const url=settings['act_photo_'+i];
    if(url){
      card.classList.add('has-photo');
      card.style.backgroundImage=`linear-gradient(rgba(9,30,18,.72),rgba(9,30,18,.82)),url('${url}')`;
    }else{
      card.classList.remove('has-photo');
      card.style.backgroundImage='';
    }
  });
}

function renderActivityPhotosAdmin(){
  const list=document.getElementById('activity-photos-list');if(!list)return;
  list.innerHTML=ACTIVITY_DETAILS.map((d,i)=>{
    const url=settings['act_photo_'+i];
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--white);border:1px solid var(--border);border-radius:10px">
      <span style="font-size:20px">${d.icon}</span>
      <strong style="flex:1;font-size:13px">${d.sq.t}</strong>
      ${url?`<img src="${url}" style="width:44px;height:32px;object-fit:cover;border-radius:6px">`:'<span style="font-size:12px;color:var(--ink-lt)">-</span>'}
      <button class="btn-edit" style="padding:7px 12px;font-size:12px;font-weight:700;border-radius:8px;border:none" onclick="openPhotoPicker('act_photo_${i}')">🖼️ Zgjidh</button>
      ${url?`<button class="btn-del" style="padding:7px 12px;font-size:12px;font-weight:700;border-radius:8px;border:none" onclick="clearActivityPhoto(${i})">✕</button>`:''}
    </div>`;
  }).join('');
}

let pickerTargetKey=null;
function openPhotoPicker(key){
  pickerTargetKey=key;
  const grid=document.getElementById('photo-picker-grid');
  const imgs=mediaItems.filter(m=>m.kind==='image');
  grid.innerHTML=imgs.length
    ?imgs.map(m=>`<img src="${m.url}" alt="${m.cap||''}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;cursor:pointer" onclick="pickPhoto('${m.url.replace(/'/g,"\\'")}')">`).join('')
    :'<p style="grid-column:1/-1;color:var(--ink-lt)">Ngarkoni fillimisht foto në galeri.</p>';
  openModal('photo-picker-modal');
}
async function pickPhoto(url){
  if(!pickerTargetKey)return;
  if(await saveSetting(pickerTargetKey,url)){
    closeModal('photo-picker-modal');
    applyActivityPhotos();renderActivityPhotosAdmin();
    showToast('✅ Fotoja u caktua!','success');
  }
}
async function clearActivityPhoto(i){
  if(await saveSetting('act_photo_'+i,'')){
    applyActivityPhotos();renderActivityPhotosAdmin();
    showToast('Fotoja u hoq.','');
  }
}

// Toggle a photo as one of the (max 6) hand-picked homepage slides
async function toggleFeatured(i){
  const m=mediaItems[i];if(!m||m.kind!=='image')return;
  if(!m.featured&&mediaItems.filter(x=>x.featured).length>=6){
    showToast('Maksimumi 6 foto për ballinën! Hiqni një yll fillimisht.','error');return;
  }
  const next=!m.featured;
  if(REMOTE){
    const {error}=await sb.from('media').update({featured:next}).eq('id',m.id);
    if(error){showToast('Gabim: '+error.message,'error');return;}
  }
  m.featured=next;saveState();
  renderMediaTab();updateHeroSlides();
  showToast(next?'⭐ Fotoja u shtua në ballinë!':'Fotoja u hoq nga ballina.','success');
}

// Hero slideshow + about photo rebuilt from the uploaded media library
function updateHeroSlides(){
  const imgs=mediaItems.filter(m=>m.kind==='image');
  if(!REMOTE||!imgs.length)return; // keep the static fallback slides
  const feat=imgs.filter(m=>m.featured);
  const about=document.querySelector('.about-image-main');
  if(about)about.src=(feat[0]||imgs[0]).url;
  if(imgs.length<2)return;
  let chosen;
  if(feat.length){
    chosen=feat.slice(0,6);
  }else{
    const pick=imgs.slice();
    for(let i=pick.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pick[i],pick[j]]=[pick[j],pick[i]];}
    chosen=pick.slice(0,6);
  }
  document.getElementById('heroSlides').innerHTML=
    chosen.map((m,i)=>`<div class="hero-slide${i===0?' active':''}" style="background-image:url('${m.url}')"></div>`).join('');
  const dots=document.getElementById('slideDots');
  if(dots)dots.innerHTML='';
  slideIndex=0;
  initSlideshow();
}

// ── IMAGE LIGHTBOX ──
let lbImages=[],lbIndex=0;
function openLightbox(list,i){
  lbImages=list;lbIndex=i;updateLb();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeLightbox(){
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow='';
}
function lbNav(d){lbIndex=(lbIndex+d+lbImages.length)%lbImages.length;updateLb();}
function updateLb(){
  const img=document.getElementById('lb-img');
  img.style.animation='none';void img.offsetWidth;img.style.animation='';
  img.src=lbImages[lbIndex];
  document.getElementById('lb-counter').textContent=(lbIndex+1)+' / '+lbImages.length;
}
document.addEventListener('keydown',e=>{
  if(!document.getElementById('lightbox').classList.contains('open'))return;
  if(e.key==='Escape')closeLightbox();
  if(e.key==='ArrowRight')lbNav(1);
  if(e.key==='ArrowLeft')lbNav(-1);
});
document.addEventListener('click',e=>{
  const item=e.target.closest('.gallery-grid .g-item');
  if(!item||item.classList.contains('g-media'))return;
  const grid=item.closest('.gallery-grid');
  const imgs=Array.from(grid.querySelectorAll('.g-item:not(.g-media) img')).filter(im=>im.src&&im.style.display!=='none');
  const idx=imgs.indexOf(item.querySelector('img'));
  if(idx>=0)openLightbox(imgs.map(im=>im.src),idx);
});

// ── AUDIO PLAYER (Spotify-style, lockscreen-friendly) ──
let audioQueue=[],audioIndex=-1,audioQueueType='lecture';
const pAudio=()=>document.getElementById('player-audio');
function fmtTime(s){if(!isFinite(s)||s<0)return'0:00';s=Math.round(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}

function renderAudioList(){
  const list=document.getElementById('audio-list');if(!list)return;
  const tracks=mediaItems.filter(m=>m.kind==='audio');
  const empty=document.getElementById('audio-empty');
  if(empty)empty.style.display=tracks.length?'none':'block';
  const playing=!pAudio().paused;
  const active=i=>audioQueueType==='lecture'&&audioIndex===i;
  list.innerHTML=tracks.map((t,i)=>`
    <div class="audio-row${active(i)?' playing':''}" onclick="playTrack(${i})">
      <div class="audio-row-btn">${active(i)&&playing?'⏸':'▶'}</div>
      <div class="audio-row-info"><strong>${t.cap||'Audio'}</strong><small>Kulturzentrum Haus des Friedens</small></div>
      ${active(i)&&playing?'<div class="audio-eq"><span></span><span></span><span></span></div>':''}
    </div>`).join('');
}

function playTrack(i){
  audioQueue=mediaItems.filter(m=>m.kind==='audio');
  if(!audioQueue[i])return;
  const a=pAudio();
  if(audioQueueType==='lecture'&&audioIndex===i){a.paused?a.play():a.pause();return;}
  audioQueueType='lecture';audioIndex=i;
  a.src=audioQueue[i].url;
  a.play();
  document.getElementById('player-bar').classList.add('open');document.body.classList.add('player-open');
  setMediaSession(audioQueue[i]);
  renderAudioList();
}
function playerToggle(){const a=pAudio();if(!a.src)return;a.paused?a.play():a.pause();}
function playerNext(){if(audioQueue.length)playTrackByStep(1);}
function playerPrev(){if(audioQueue.length)playTrackByStep(-1);}
function playTrackByStep(d){
  const n=(audioIndex+d+audioQueue.length)%audioQueue.length;
  audioIndex=-1;
  if(audioQueueType==='surah')playSurah(n);else playTrack(n);
}
function playerSeek(v){const a=pAudio();if(isFinite(a.duration))a.currentTime=a.duration*v/100;}
function playerClose(){
  const a=pAudio();a.pause();a.removeAttribute('src');a.load();
  audioIndex=-1;
  document.getElementById('player-bar').classList.remove('open');document.body.classList.remove('player-open');
  renderAudioList();renderSurahList();
}
function updatePlayerBar(){
  const a=pAudio(),t=audioQueue[audioIndex];
  document.getElementById('pb-title').textContent=t?(t.cap||'Audio'):'-';
  document.getElementById('pb-toggle').textContent=a.paused?'▶':'⏸';
  document.getElementById('pb-cur').textContent=fmtTime(a.currentTime);
  document.getElementById('pb-dur').textContent=fmtTime(a.duration);
  if(isFinite(a.duration)&&a.duration>0)document.getElementById('pb-range').value=a.currentTime/a.duration*100;
}
function setMediaSession(t){
  if(!('mediaSession'in navigator))return;
  try{
    navigator.mediaSession.metadata=new MediaMetadata({title:t.cap||'Audio',artist:'Kulturzentrum Haus des Friedens',album:'Ligjëratat'});
    navigator.mediaSession.setActionHandler('play',()=>pAudio().play());
    navigator.mediaSession.setActionHandler('pause',()=>pAudio().pause());
    navigator.mediaSession.setActionHandler('previoustrack',playerPrev);
    navigator.mediaSession.setActionHandler('nexttrack',playerNext);
  }catch(e){}
}
['play','pause'].forEach(ev=>pAudio().addEventListener(ev,()=>{updatePlayerBar();renderAudioList();renderSurahList();}));
pAudio().addEventListener('timeupdate',updatePlayerBar);
pAudio().addEventListener('ended',playerNext);
pAudio().addEventListener('error',()=>{
  const a=pAudio();
  if(!a.src)return; // ignore the error fired when we clear the source on close
  showToast(currentLang==='de'
    ?'Audio kann nicht abgespielt werden. Bitte den direkten MP3-Link verwenden (z.B. archive.org/download/…/datei.mp3).'
    :'Audio nuk mund të luhet. Përdorni linkun direkt të MP3 (p.sh. archive.org/download/…/skedari.mp3).','error');
});

async function addMediaItem(){
  const url=document.getElementById('media-url-input').value.trim();
  const cap=document.getElementById('media-caption-input').value.trim()||'Foto';
  if(!url){showToast('Fut URL-në e fotos ose linkun e Facebook!','error');return;}
  const kind=detectMediaKind(url);
  if(REMOTE){
    const {error}=await sb.from('media').insert({url,caption:cap,kind});
    if(error){showToast('Gabim: '+error.message,'error');return;}
    await remoteLoadAll();
  }else{
    mediaItems.push({url,cap,kind});saveState();
  }
  document.getElementById('media-url-input').value='';
  document.getElementById('media-caption-input').value='';
  renderMediaTab();renderPublicGallery();
  showToast(kind==='facebook'?'Video e Facebook u shtua!':'Media u shtua në galeri!','success');
}

async function deleteMediaItem(i){
  if(!confirm('Fshi këtë media?'))return;
  if(REMOTE){
    const it=mediaItems[i];
    const {error}=await sb.from('media').delete().eq('id',it.id);
    if(error){showToast('Gabim: '+error.message,'error');return;}
    // If the file lives in our storage bucket, remove it there too
    const marker='/object/public/media/';
    const idx=it.url.indexOf(marker);
    if(idx>0)sb.storage.from('media').remove([decodeURIComponent(it.url.slice(idx+marker.length))]);
  }
  mediaItems.splice(i,1);saveState();renderMediaTab();renderPublicGallery();
  showToast('Media u fshi.','');
}

// Upload an image straight from the post editor
// ── Post gallery images (managed while editing a post) ──
let postImages=[];
function renderPostImagesPreview(){
  const box=document.getElementById('post-images-preview');if(!box)return;
  if(!postImages.length){box.innerHTML='<span style="color:var(--ink-lt);font-size:12.5px">Ende asnjë foto.</span>';return;}
  box.innerHTML=postImages.map((src,i)=>`
    <div class="post-img-thumb">
      <img src="${src}" alt="" onerror="this.style.opacity=.2">
      ${i===0?'<span class="cover-tag">Kopertina</span>':''}
      <button class="thumb-x" onclick="removePostImage(${i})" title="Hiqe">×</button>
    </div>`).join('');
}
function addPostImageUrl(){
  const inp=document.getElementById('post-img');const url=(inp.value||'').trim();
  if(!url)return;
  postImages.push(url);inp.value='';
  renderPostImagesPreview();
}
function removePostImage(i){postImages.splice(i,1);renderPostImagesPreview();}

// ── Reusable image picker from the already-uploaded Media library ──
// openMediaPicker(onPick, opts)
//   opts.single  -> click one image, calls onPick(url) and closes
//   (default)    -> multi-select, "Shto" calls onPick([urls])
//   opts.exclude -> array of urls shown as already-added (skipped)
let mediaPickSelected=new Set();
let mediaPickCfg={single:false,onPick:null,exclude:[]};
function openMediaPicker(onPick,opts){
  opts=opts||{};
  mediaPickCfg={single:!!opts.single,onPick:onPick||null,exclude:opts.exclude||[]};
  mediaPickSelected=new Set();
  const grid=document.getElementById('media-picker-grid');
  const empty=document.getElementById('media-picker-empty');
  const imgs=mediaItems.filter(m=>m.kind==='image'&&m.url);
  if(!imgs.length){grid.innerHTML='';empty.style.display='block';}
  else{
    empty.style.display='none';
    grid.innerHTML=imgs.map(m=>{
      const added=mediaPickCfg.exclude.includes(m.url);
      return `<button type="button" class="media-pick${added?' already':''}" data-url="${encodeURIComponent(m.url)}" onclick="toggleMediaPick(this)">
        <img src="${m.url}" alt="${(m.cap||'').replace(/"/g,'&quot;')}" loading="lazy" onerror="this.parentNode.style.display='none'">
        <span class="media-pick-check">✓</span>
        ${added?'<span class="media-pick-added" data-sq="Shtuar" data-de="Hinzugefügt">Shtuar</span>':''}
      </button>`;
    }).join('');
  }
  const cw=document.getElementById('media-picker-confirm-wrap');
  if(cw)cw.style.display=mediaPickCfg.single?'none':'flex';
  updateMediaPickCount();
  openModal('media-picker-modal');
}
function toggleMediaPick(el){
  if(el.classList.contains('already'))return;
  const url=decodeURIComponent(el.dataset.url);
  if(mediaPickCfg.single){if(mediaPickCfg.onPick)mediaPickCfg.onPick(url);closeModal('media-picker-modal');return;}
  if(mediaPickSelected.has(url)){mediaPickSelected.delete(url);el.classList.remove('picked');}
  else{mediaPickSelected.add(url);el.classList.add('picked');}
  updateMediaPickCount();
}
function updateMediaPickCount(){
  const el=document.getElementById('media-picker-count');if(!el)return;
  const n=mediaPickSelected.size;
  el.textContent=n?(currentLang==='de'?n+' ausgewählt':n+' të zgjedhura'):'';
}
function confirmMediaPick(){
  const urls=[...mediaPickSelected];
  if(mediaPickCfg.onPick)mediaPickCfg.onPick(urls);
  closeModal('media-picker-modal');
}
// Helper: pick multiple photos into the news post gallery
function pickPostImages(){
  openMediaPicker(urls=>{
    let added=0;urls.forEach(u=>{if(!postImages.includes(u)){postImages.push(u);added++;}});
    renderPostImagesPreview();
    if(added)showToast('🖼️ '+added+(currentLang==='de'?' Foto(s) hinzugefügt':' foto u shtuan'),'success');
  },{exclude:postImages});
}
// Helper: pick one photo into a single text input (staff, imam, partner, ...)
function pickImageInto(inputId){
  openMediaPicker(url=>{const el=document.getElementById(inputId);if(el){el.value=url;el.dispatchEvent(new Event('input',{bubbles:true}));}showToast('🖼️ Fotoja u zgjodh','success');},{single:true});
}

// ── IMAM PAGE (editable photo + name + text, stored in settings) ──
const IMAM_DEFAULTS={
  name:'Imam Fahredin Bunjaku',
  text_sq:'Imami i xhamisë sonë udhëheq namazet e përditshme dhe ofron udhëzim fetar për komunitetin. Çdo javë mban ligjërata mësimore dhe spirituale për xhematin.\n\nImami është i disponueshëm për këshillim fetar, ngushëllime dhe çdo shërbim tjetër fetar.',
  text_de:'Der Imam unserer Moschee leitet die täglichen Gebete und bietet der Gemeinschaft religiöse Führung. Jede Woche hält er lehrreiche und spirituelle Vorträge für die Gemeinde.\n\nDer Imam steht für religiöse Beratung, Kondolenzen und jeden anderen religiösen Dienst zur Verfügung.'
};
function imamData(){
  return {
    name:settings['imam_name']||IMAM_DEFAULTS.name,
    photo:settings['imam_photo']||'',
    text_sq:settings['imam_text_sq']||IMAM_DEFAULTS.text_sq,
    text_de:settings['imam_text_de']||IMAM_DEFAULTS.text_de
  };
}
function renderImam(){
  const d=imamData();
  const hero=document.getElementById('imam-hero-name');if(hero)hero.textContent=d.name;
  const nm=document.getElementById('imam-name');if(nm)nm.textContent=d.name;
  const box=document.getElementById('imam-photo-box');
  if(box){
    if(d.photo)box.innerHTML=`<img src="${d.photo}" alt="${d.name.replace(/"/g,'&quot;')}" onerror="this.parentNode.textContent='🧔'">`;
    else box.textContent='🧔';
  }
  const txt=document.getElementById('imam-text');
  if(txt){
    const t=(currentLang==='de'?d.text_de:d.text_sq)||'';
    txt.innerHTML=t.split(/\n\n+/).map(p=>'<p>'+p.replace(/\n/g,'<br>')+'</p>').join('');
  }
}
function updateImamPhotoPreview(){
  const pv=document.getElementById('imam-photo-preview');if(!pv)return;
  const url=(document.getElementById('imam-photo').value||'').trim();
  if(url){pv.src=url;pv.style.display='block';}else pv.style.display='none';
}
function renderImamAdmin(){
  document.getElementById('imam-name-input').value=settings['imam_name']||'';
  document.getElementById('imam-photo').value=settings['imam_photo']||'';
  document.getElementById('imam-text-sq').value=settings['imam_text_sq']||'';
  document.getElementById('imam-text-de').value=settings['imam_text_de']||'';
  updateImamPhotoPreview();
}
async function saveImam(){
  const name=document.getElementById('imam-name-input').value.trim();
  const photo=document.getElementById('imam-photo').value.trim();
  const text_sq=document.getElementById('imam-text-sq').value.trim();
  const text_de=document.getElementById('imam-text-de').value.trim();
  await Promise.all([
    saveSetting('imam_name',name),
    saveSetting('imam_photo',photo),
    saveSetting('imam_text_sq',text_sq),
    saveSetting('imam_text_de',text_de)
  ]);
  renderImam();
  showToast('✅ Faqja e Imamit u ruajt!','success');
}
async function uploadImamPhoto(ev){
  const f=(ev.target.files||[])[0];ev.target.value='';
  if(!f)return;
  if(!REMOTE){showToast('Ngarkimi kërkon lidhje me serverin!','error');return;}
  showToast('⏳ Duke ngarkuar foton...','');
  try{
    document.getElementById('imam-photo').value=await uploadToStorage(f);
    updateImamPhotoPreview();
    showToast('✅ Fotografia u ngarkua!','success');
  }catch(e){showToast('Gabim: '+e.message,'error');}
}

async function uploadPostImage(ev){
  const files=Array.from(ev.target.files||[]);ev.target.value='';
  if(!files.length)return;
  if(!REMOTE){showToast('Ngarkimi kërkon lidhje me serverin!','error');return;}
  const imgs=files.filter(f=>/^image\//.test(f.type));
  if(!imgs.length){showToast('Zgjidhni foto!','error');return;}
  showToast('⏳ Duke ngarkuar '+imgs.length+' foto...','');
  try{
    for(const f of imgs){const url=await uploadToStorage(f);postImages.push(url);renderPostImagesPreview();}
    showToast('✅ Fotot u ngarkuan! Tani klikoni Publiko.','success');
  }catch(e){showToast('Gabim: '+e.message,'error');}
}

// Upload a video straight from the post editor
async function uploadPostVideo(ev){
  const f=(ev.target.files||[])[0];ev.target.value='';
  if(!f)return;
  if(!REMOTE){showToast('Ngarkimi kërkon lidhje me serverin!','error');return;}
  if(!/^video\//.test(f.type)){showToast('Zgjidhni një video!','error');return;}
  if(f.size>50*1024*1024){showToast('Video deri në 50MB!','error');return;}
  showToast('⏳ Duke ngarkuar videon...','');
  try{
    const url=await uploadToStorage(f);
    document.getElementById('post-video').value=url;
    showToast('✅ Video u ngarkua! Tani klikoni Publiko.','success');
  }catch(e){showToast('Gabim: '+e.message,'error');}
}

// Show/hide member tab (old references compatibility)
function showMTab(name,el){showAdminTab(name);}

function renderAdminNewsLegacy(){renderAdminNews();}
function renderUsersTable(){renderMembersTab();}

// ADMIN CMS (post modal)
function openPostModal(postId){
  editingPostId=postId;
  const isEdit=postId!==null;
  document.getElementById('post-modal-title').textContent=isEdit?'✏️ Edito Artikullin':'✍️ Artikull i ri';
  if(isEdit){const p=DB.posts.find(x=>x.id===postId);document.getElementById('post-title').value=p.title;document.getElementById('post-cat').value=p.category;document.getElementById('post-body').value=p.body;document.getElementById('post-title-de').value=p.title_de||'';document.getElementById('post-body-de').value=p.body_de||'';document.getElementById('post-video').value=p.video||'';postImages=articleImages(p).slice();}
  else{['post-title','post-body','post-title-de','post-body-de','post-img','post-video'].forEach(id=>document.getElementById(id).value='');postImages=[];}
  renderPostImagesPreview();
  openModal('post-modal');
}

// ── Free machine translation (Albanian -> German) for news ──
async function translateText(text,sl,tl){
  if(!text||!text.trim())return '';
  const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl='+sl+'&tl='+tl+'&dt=t&q='+encodeURIComponent(text);
  const r=await fetch(url);
  if(!r.ok)throw new Error('HTTP '+r.status);
  const data=await r.json();
  return (data[0]||[]).map(x=>x[0]).join('');
}
async function autoTranslatePost(){
  const title=document.getElementById('post-title').value.trim();
  const body=document.getElementById('post-body').value.trim();
  if(!title&&!body){showToast('Shkruani fillimisht tekstin në shqip!','error');return;}
  const btn=document.getElementById('post-translate-btn');
  const label=btn.querySelector('span'),old=label?label.textContent:'';
  btn.disabled=true;if(label)label.textContent=(currentLang==='de'?'Übersetze...':'Duke përkthyer...');
  try{
    const paras=body.split(/\n\n+/);
    const results=await Promise.all([translateText(title,'sq','de'),...paras.map(p=>translateText(p,'sq','de'))]);
    document.getElementById('post-title-de').value=results[0];
    document.getElementById('post-body-de').value=results.slice(1).join('\n\n');
    showToast('✅ U përkthye! Kontrolloni tekstin gjerman.','success');
  }catch(e){
    showToast('Përkthimi automatik dështoi. Provoni sërish ose shkruani manualisht.','error');
  }finally{btn.disabled=false;if(label)label.textContent=old;}
}
async function savePost(){
  const title=document.getElementById('post-title').value.trim(),body=document.getElementById('post-body').value.trim();
  if(!title||!body){showToast('Plotësoni titullin dhe përmbajtjen!','error');return;}
  const category=document.getElementById('post-cat').value;
  const title_de=document.getElementById('post-title-de').value.trim();
  const body_de=document.getElementById('post-body-de').value.trim();
  const pending=document.getElementById('post-img').value.trim();
  if(pending){postImages.push(pending);document.getElementById('post-img').value='';}
  const images=postImages.slice();
  const img=images[0]||'';
  const video=document.getElementById('post-video').value.trim();
  if(REMOTE){
    const q=editingPostId!==null
      ?sb.from('posts').update({title,title_de,category,body,body_de,img,images,video}).eq('id',editingPostId)
      :sb.from('posts').insert({title,title_de,category,body,body_de,img,images,video});
    const {error}=await q;
    if(error){showToast(friendlyDbError(error,'migration-017-post-german.sql'),'error');return;}
    await remoteLoadAll();
    closeModal('post-modal');renderAdminNews();renderHomeNews();renderDashboard();
    showToast(editingPostId!==null?'✅ Artikulli u përditësua!':'🎉 Artikulli u publikua!','success');
    return;
  }
  const data={title,title_de,category,body,body_de,img,images,video,date:new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})};
  if(editingPostId!==null){const i=DB.posts.findIndex(p=>p.id===editingPostId);DB.posts[i]={...DB.posts[i],...data};showToast('✅ Artikulli u përditësua!','success');}
  else{DB.posts.unshift({id:DB.nextPostId++,...data});showToast('🎉 Artikulli u publikua!','success');}
  closeModal('post-modal');saveState();renderAdminNews();renderHomeNews();renderDashboard();
}
async function deletePost(id){
  if(!confirm('A jeni i sigurt që doni të fshini këtë artikull?'))return;
  if(REMOTE){
    const {error}=await sb.from('posts').delete().eq('id',id);
    if(error){showToast('Gabim: '+error.message,'error');return;}
    DB.posts=DB.posts.filter(p=>p.id!==id);
  }else{
    DB.posts=DB.posts.filter(p=>p.id!==id);saveState();
  }
  renderAdminNews();renderHomeNews();renderDashboard();
  showToast('Artikulli u fshi.','');
}
async function updateProfile(){
  const name=document.getElementById('prof-name').value.trim();
  if(!name){showToast('Emri nuk mund të jetë bosh!','error');return;}
  if(REMOTE){
    const [{error:e1},{error:e2}]=await Promise.all([
      sb.auth.updateUser({data:{name}}),
      sb.from('profiles').update({name}).eq('id',currentUser.id),
    ]);
    if(e1||e2){showToast('Gabim: '+(e1||e2).message,'error');return;}
    currentUser.name=name;
  }else{
    currentUser.name=name;DB.users.find(u=>u.id===currentUser.id).name=name;
  }
  const pa=document.getElementById('profile-avatar');if(pa)pa.textContent=name.charAt(0).toUpperCase();
  const pab=document.getElementById('profile-avatar-big');if(pab)pab.textContent=name.charAt(0).toUpperCase();
  document.getElementById('member-welcome').textContent=(currentLang==='de'?'Willkommen, ':'Mirë se vini, ')+name.split(' ')[0]+'!';
  updateAuthUI();saveState();showToast('✅ Profili u ruajt!','success');
}
async function changePassword(){
  const p1=document.getElementById('new-pass').value,p2=document.getElementById('new-pass2').value;
  if(!p1||!p2){showToast('Plotësoni të dy fushat!','error');return;}
  if(p1!==p2){showToast('Fjalëkalimet nuk përputhen!','error');return;}
  if(p1.length<8){showToast('Min. 8 karaktere!','error');return;}
  if(REMOTE){
    const {error}=await sb.auth.updateUser({password:p1});
    if(error){showToast('Gabim: '+error.message,'error');return;}
  }else{
    currentUser.password=p1;saveState();
  }
  showToast('🔐 Fjalëkalimi u ndryshua!','success');
  document.getElementById('new-pass').value='';document.getElementById('new-pass2').value='';
}
function deleteAccount(){
  if(REMOTE){showToast(currentLang==='de'?'Kontaktieren Sie den Administrator.':'Kontaktoni administratorin për fshirjen e llogarisë.','error');return;}
  if(!confirm('A jeni i sigurt? Kjo veprim nuk mund të zhbëhet!'))return;
  DB.users=DB.users.filter(u=>u.id!==currentUser.id);doLogout();saveState();showToast('Llogaria u fshi.','');
}

// CONTACT - delivers to the mosque inbox via FormSubmit
const CONTACT_EMAIL='xhamiaepaqes@hotmail.com';
async function deliverContact(btn,fields,clearIds){
  const de=currentLang==='de';
  if(!fields.name||!fields.email||!fields.phone||!fields.message){
    showToast(de?'Alle Felder ausfüllen!':'Plotësoni të gjitha fushat!','error');return;
  }
  // Email must be a real address (something@domain.tld)
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)){
    showToast(de?'Ungültige E-Mail-Adresse!':'Email jo valid! Përdorni formatin emri@domain.com','error');return;
  }
  // Phone must be a number (digits, may start with + and contain spaces/-/()); at least 7 digits
  const phoneDigits=(fields.phone.match(/\d/g)||[]).length;
  if(!/^\+?[\d\s()\/-]+$/.test(fields.phone)||phoneDigits<7){
    showToast(de?'Ungültige Telefonnummer!':'Numri i telefonit jo valid! Përdorni vetëm numra.','error');return;
  }
  const label=btn.textContent;
  btn.disabled=true;btn.textContent=currentLang==='de'?'Wird gesendet...':'Duke dërguar...';
  // Branded sending overlay (same bar as page/login), min 1.6s so it reads as "sending"
  const overlay=document.getElementById('login-loading');
  const p=overlay&&overlay.querySelector('p');
  const prevMsg=p?p.textContent:'';
  if(p)p.textContent=currentLang==='de'?'Nachricht wird gesendet...':'Duke dërguar mesazhin...';
  showLoginLoading(true);
  const t0=Date.now();
  let okSent=false;
  try{
    const res=await fetch('https://formsubmit.co/ajax/'+CONTACT_EMAIL,{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({
        name:fields.name,email:fields.email,phone:fields.phone,
        subject:fields.subject||'',message:fields.message,
        _subject:'Mesazh nga webfaqja: '+fields.name,
        _template:'table',_captcha:'false'
      })
    });
    if(!res.ok)throw new Error('HTTP '+res.status);
    okSent=true;
  }catch(e){okSent=false;}
  await new Promise(r=>setTimeout(r,Math.max(0,1600-(Date.now()-t0))));
  showLoginLoading(false);
  if(p)p.textContent=prevMsg;
  if(okSent){
    logAnalytics('contact',location.hash||'/');
    clearIds.forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    showToast(currentLang==='de'?'✅ Nachricht gesendet!':'✅ Mesazhi u dërgua në xhami!','success');
  }else{
    showToast(currentLang==='de'?'Senden fehlgeschlagen - versuchen Sie es später.':'Dërgimi dështoi - provoni më vonë.','error');
  }
  btn.disabled=false;btn.textContent=label;
}
function sendContact(){
  deliverContact(document.getElementById('contact-send-btn'),{
    name:document.getElementById('cf-name').value.trim(),
    email:document.getElementById('cf-email').value.trim(),
    phone:document.getElementById('cf-phone').value.trim(),
    message:document.getElementById('cf-msg').value.trim(),
  },['cf-name','cf-email','cf-phone','cf-msg']);
}
function sendContact2(){
  deliverContact(document.getElementById('contact-send-btn2'),{
    name:document.getElementById('cf2-name').value.trim(),
    email:document.getElementById('cf2-email').value.trim(),
    phone:document.getElementById('cf2-phone').value.trim(),
    subject:document.getElementById('cf2-sub').value.trim(),
    message:document.getElementById('cf2-msg').value.trim(),
  },['cf2-name','cf2-email','cf2-phone','cf2-sub','cf2-msg']);
}

// TOAST
function showToast(msg,type=''){
  const c=document.getElementById('toast-container'),t=document.createElement('div');
  t.className='toast'+(type?' '+type:'');t.textContent=msg;c.appendChild(t);
  setTimeout(()=>t.style.opacity='0',3000);setTimeout(()=>t.remove(),3400);
}

// ── CONDOLENCES ──
let condolences = [];
let editingCondId = null;

function openCondolenceModal(id) {
  editingCondId = id;
  document.getElementById('cond-modal-title').textContent = id !== null ? '✏️ Edito Njoftimin' : '🕊️ Njoftim i ri ngushëllimi';
  if (id !== null) {
    const c = condolences.find(x => x.id === id);
    document.getElementById('cond-name').value = c.name;
    document.getElementById('cond-born').value = c.born || '';
    document.getElementById('cond-date').value = c.date || '';
    document.getElementById('cond-city').value = c.city || '';
    document.getElementById('cond-msg').value = c.msg || '';
    document.getElementById('cond-funeral').value = c.funeral || '';
    document.getElementById('cond-photo').value = c.photo || '';
  } else {
    ['cond-name','cond-born','cond-city','cond-msg','cond-funeral','cond-photo'].forEach(i => document.getElementById(i).value = '');
    document.getElementById('cond-date').value = new Date().toISOString().split('T')[0];
  }
  openModal('condolence-modal');
}

async function saveCondolence() {
  const name = document.getElementById('cond-name').value.trim();
  if (!name) { showToast('Shkruani emrin e të ndjerit!', 'error'); return; }
  const data = {
    name,
    born: document.getElementById('cond-born').value,
    date: document.getElementById('cond-date').value,
    city: document.getElementById('cond-city').value,
    msg: document.getElementById('cond-msg').value,
    funeral: document.getElementById('cond-funeral').value,
    photo: document.getElementById('cond-photo').value.trim(),
    postedAt: new Date().toLocaleDateString('sq-AL', {day:'numeric',month:'long',year:'numeric'}),
  };
  if (REMOTE) {
    const row = { name: data.name, born: data.born, died_on: data.date || null, city: data.city, msg: data.msg, funeral: data.funeral, photo: data.photo };
    const q = editingCondId !== null
      ? sb.from('condolences').update(row).eq('id', editingCondId)
      : sb.from('condolences').insert(row);
    const { error } = await q;
    if (error) { showToast('Gabim: ' + error.message, 'error'); return; }
    await remoteLoadAll();
    closeModal('condolence-modal');
    renderCondolenceAdmin();
    renderCondolencesPublic();
    showToast(editingCondId !== null ? 'Njoftimi u përditësua!' : '🕊️ Njoftimi u publikua!', 'success');
    return;
  }
  if (editingCondId !== null) {
    const i = condolences.findIndex(c => c.id === editingCondId);
    condolences[i] = { ...condolences[i], ...data };
    showToast('Njoftimi u përditësua!', 'success');
  } else {
    condolences.unshift({ id: Date.now(), ...data });
    showToast('🕊️ Njoftimi u publikua!', 'success');
  }
  closeModal('condolence-modal');
  saveState();
  renderCondolenceAdmin();
  renderCondolencesPublic();
}

function deleteCondolence(id) {
  if (!confirm('Fshi këtë njoftim?')) return;
  condolences = condolences.filter(c => c.id !== id);
  saveState();
  renderCondolenceAdmin(); renderCondolencesPublic();
  showToast('Njoftimi u fshi.', '');
}

function renderCondolenceAdmin() {
  const list = document.getElementById('condolence-admin-list');
  const empty = document.getElementById('condolence-admin-empty');
  if (!list) return;
  if (!condolences.length) { list.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';
  list.innerHTML = condolences.map(c => `
    <div class="condolence-card">
      <div class="condolence-card-header">
        ${c.photo?`<img src="${c.photo}" alt="${c.name}" class="cond-photo" onerror="this.outerHTML='<div style=font-size:28px>🕊️</div>'">`:'<div style="font-size:28px">🕊️</div>'}
        <div><h3>${c.name}</h3><p>${c.born ? c.born + ' - ' : ''}${c.date ? new Date(c.date).toLocaleDateString('sq-AL',{day:'numeric',month:'long',year:'numeric'}) : ''} ${c.city ? '· ' + c.city : ''}</p></div>
      </div>
      <div class="condolence-card-body">
        ${c.msg ? `<p style="font-style:italic">"${c.msg}"</p>` : ''}
        ${c.funeral ? `<div style="background:#e8f5ee;border-radius:8px;padding:10px 14px;font-size:13px;color:var(--green);font-weight:600;margin-bottom:10px">⏰ ${c.funeral}</div>` : ''}
        <div class="condolence-meta"><span>📅 Publikuar: ${c.postedAt}</span></div>
        <div class="condolence-admin-actions">
          <button class="btn-edit" style="flex:1;padding:8px;font-size:12px;font-weight:700;border-radius:8px;cursor:pointer;font-family:inherit;background:var(--green-lt);color:var(--green);border:none" onclick="openCondolenceModal(${c.id})">✏️ Edito</button>
          <button class="btn-del" style="flex:1;padding:8px;font-size:12px;font-weight:700;border-radius:8px;cursor:pointer;font-family:inherit;background:#fee2e2;color:#c0392b;border:none" onclick="deleteCondolence(${c.id})">🗑️ Fshi</button>
        </div>
      </div>
    </div>`).join('');
}

function renderCondolencesPublic() {
  const list = document.getElementById('condolences-public-list');
  const empty = document.getElementById('condolences-empty');
  if (!list) return;
  if (!condolences.length) { list.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';
  list.innerHTML = condolences.map(c => `
    <div class="condolence-card" style="margin-bottom:20px;animation:fadeUpIn .4s ease">
      <div class="condolence-card-header">
        ${c.photo?`<img src="${c.photo}" alt="${c.name}" class="cond-photo" onerror="this.outerHTML='<div style=font-size:32px>🕊️</div>'">`:'<div style="font-size:32px">🕊️</div>'}
        <div><h3>${c.name}</h3><p>${c.born ? c.born + ' - ' : ''}${c.date ? new Date(c.date).toLocaleDateString('sq-AL',{day:'numeric',month:'long',year:'numeric'}) : ''} ${c.city ? '· ' + c.city : ''}</p></div>
      </div>
      <div class="condolence-card-body">
        <div class="arabic-small">إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ</div>
        <p style="font-style:italic;color:var(--ink-mid)"><em>Inna lillahi wa inna ilayhi raji'un.</em><br>Allahu i mëshiroftë dhe e vendosë në Xhenet!</p>
        ${c.msg ? `<p>"${c.msg}"</p>` : ''}
        ${c.funeral ? `<div style="background:#e8f5ee;border-radius:8px;padding:12px 16px;font-size:14px;color:var(--green);font-weight:600;margin-bottom:10px;display:flex;gap:8px"><span>⏰</span><div><strong>Namazi i Xhenazes:</strong><br>${c.funeral}</div></div>` : ''}
        <div class="condolence-meta"><span>📅 Njoftuar: ${c.postedAt}</span></div>
      </div>
    </div>`).join('');
}

// ── ACTIVITIES ACCORDION ──
function toggleAcc(idx) {
  const items = document.querySelectorAll('.acc-item');
  const item = items[idx];
  const isOpen = item.classList.contains('open');
  items.forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ── ADMIN TAB (override to add condolences) ──
function showAdminTab(name) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-tab-pill').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('apanel-' + name);
  const pill  = document.getElementById('apill-' + name);
  if (panel) panel.classList.add('active');
  if (pill) pill.classList.add('active');
  if (name === 'dashboard')    renderDashboard();
  if (name === 'news')         renderAdminNews();
  if (name === 'condolences')  renderCondolenceAdmin();
  if (name === 'members')      renderMembersTab();
  if (name === 'media')        {renderMediaTab();renderActivityPhotosAdmin();}
  if (name === 'partners')     renderPartnersAdmin();
  if (name === 'quizzes')      renderQuizzesAdmin();
  if (name === 'surahs')       renderSurahsAdmin();
  if (name === 'pages')        renderPagesAdmin();
  if (name === 'staff')        renderStaffAdmin();
  if (name === 'events')       renderEventsAdmin();
  if (name === 'imam')         renderImamAdmin();
  if (name === 'stats')        renderStats();
}

// ── ACTIVITY DETAIL MODAL ──
const ACTIVITY_DETAILS=[
  {icon:'🕌',
   sq:{t:'Namazet e Përditshme',b:'Xhamia jonë është e hapur për të pesë kohët e namazit, çdo ditë të vitit. Namazet udhëhiqen nga Imam Fahredin Bunjaku, imam i kualifikuar me arsim fetar. Çdo të premte mbahet namazi i Xhumasë me hutbe në gjuhën shqipe, duke filluar pas thirrjes së drekës. Kohët e sakta merren drejtpërdrejt nga SwissMosque dhe i gjeni gjithmonë në faqen tonë kryesore.'},
   de:{t:'Tägliche Gebete',b:'Unsere Moschee ist für alle fünf täglichen Gebete geöffnet, jeden Tag im Jahr. Die Gebete werden von Imam Fahredin Bunjaku geleitet, einem qualifizierten Imam mit religiöser Ausbildung. Jeden Freitag findet das Freitagsgebet mit Predigt in albanischer Sprache statt. Die genauen Gebetszeiten stammen direkt von SwissMosque und sind stets auf unserer Startseite zu finden.'}},
  {icon:'📚',
   sq:{t:'Arsimi Fetar',b:'Ofrojmë mësim-besim për fëmijë dhe të rinj: leximi i Kuranit, edukata islame dhe historia e Islamit, të përshtatura sipas moshës. Mësimet mbahen gjatë fundjavës në ambientet e xhamisë dhe udhëhiqen nga imami ynë. Qëllimi ynë është që brezat e rinj të rriten me identitet të shëndoshë fetar dhe integrim të suksesshëm në shoqërinë zvicerane.'},
   de:{t:'Religiöse Bildung',b:'Wir bieten Religionsunterricht für Kinder und Jugendliche an: Koranlesen, islamische Erziehung und Geschichte des Islams, altersgerecht aufbereitet. Der Unterricht findet am Wochenende in den Räumen der Moschee statt und wird von unserem Imam geleitet. Unser Ziel ist, dass junge Generationen mit einer gesunden religiösen Identität und erfolgreicher Integration in die Schweizer Gesellschaft aufwachsen.'}},
  {icon:'🤝',
   sq:{t:'Dialog Ndërfetar',b:'Jemi krenarë për bashkëpunimin tonë të gjatë me Kishën Reformierte të Schwamendingen dhe Zürcher Forum der Religionen. Organizojmë iftare të përbashkëta ndërfetare - në vitin 2025 me rreth 320 pjesëmarrës - dhe marrim pjesë aktive në nismat kundër racizmit dhe për mirëkuptim mes komuniteteve. Xhamia jonë është anëtare e VIOZ, DAIGS dhe FIDS.'},
   de:{t:'Interreligiöser Dialog',b:'Wir sind stolz auf unsere langjährige Zusammenarbeit mit der Reformierten Kirche Schwamendingen und dem Zürcher Forum der Religionen. Wir organisieren gemeinsame interreligiöse Iftar-Abende - 2025 mit rund 320 Teilnehmenden - und beteiligen uns aktiv an Initiativen gegen Rassismus und für Verständigung zwischen den Gemeinschaften. Unsere Moschee ist Mitglied von VIOZ, DAIGS und FIDS.'}},
  {icon:'🌙',
   sq:{t:'Festat Islame',b:'Gjatë muajit të Ramazanit organizojmë iftare të përbashkëta, teravi dhe programe të veçanta për netët e mëdha. Festat e Fitër Bajramit dhe Kurban Bajramit festohen së bashku me namaz, program festiv dhe shoqërim për të gjithë familjet. Kalendarin e ditëve dhe netëve të mëdha e gjeni në faqen tonë.'},
   de:{t:'Islamische Feste',b:'Während des Ramadans organisieren wir gemeinsame Iftar-Abende, Tarawih-Gebete und besondere Programme für die grossen Nächte. Die Feste Eid al-Fitr und Eid al-Adha feiern wir gemeinsam mit Gebet, festlichem Programm und Beisammensein für alle Familien. Den Kalender der besonderen Tage und Nächte finden Sie auf unserer Website.'}},
  {icon:'💙',
   sq:{t:'Ndihmë Humane',b:'Solidariteti është pjesë e misionit tonë. Kemi organizuar aksione bamirësie për familjet në nevojë në Zvicër dhe në trojet tona - përfshirë ndërtimin e një shtëpie për familjen e një dëshmori në Kosovë. Mbledhim sadaka dhe zeqat dhe i shpërndajmë me transparencë të plotë atje ku nevojiten më së shumti.'},
   de:{t:'Humanitäre Hilfe',b:'Solidarität ist Teil unserer Mission. Wir haben Wohltätigkeitsaktionen für bedürftige Familien in der Schweiz und in unserer Heimat organisiert - einschliesslich des Baus eines Hauses für die Familie eines Gefallenen im Kosovo. Wir sammeln Sadaqa und Zakat und verteilen sie mit voller Transparenz dort, wo sie am dringendsten gebraucht werden.'}},
  {icon:'🎓',
   sq:{t:'Ligjëratat e Hoxhës',b:'Çdo javë imami ynë mban ligjërata për tema fetare dhe shoqërore aktuale. Përmes takimit të të rinjve (Jugendtreff) trajtohen tema si "Kurani dhe shkenca moderne" me mysafirë të ftuar si Dr. Lumni Ademi. Ligjëratat janë të hapura për të gjithë - ejani dhe merrni pjesë!'},
   de:{t:'Vorträge des Imams',b:'Jede Woche hält unser Imam Vorträge zu aktuellen religiösen und gesellschaftlichen Themen. Im Jugendtreff werden Themen wie «Der Koran und die moderne Wissenschaft» mit eingeladenen Gästen wie Dr. Lumni Ademi behandelt. Die Vorträge sind offen für alle - kommen Sie vorbei!'}},
];

function openActivity(i){
  const d=ACTIVITY_DETAILS[i];if(!d)return;
  const L=d[currentLang]||d.sq;
  document.getElementById('am-icon').textContent=d.icon;
  document.getElementById('am-title').textContent=L.t;
  document.getElementById('am-body').textContent=L.b;
  openModal('activity-modal');
}

// ── STAT COUNT-UP ──
function animateStats(){
  document.querySelectorAll('.stat-num').forEach(el=>{
    const m=el.textContent.trim().match(/^(\d+)(.*)$/);if(!m)return;
    const target=+m[1],suffix=m[2]||'',dur=1400,t0=performance.now();
    function tick(t){
      const p=Math.min((t-t0)/dur,1),eased=1-Math.pow(1-p,3);
      el.textContent=Math.round(target*eased)+suffix;
      if(p<1)requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// ── SCROLL REVEAL ──
function initScrollReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.07 });
  document.querySelectorAll('.news-card,.activity-card,.acc-item,.g-item,.contact-item,.about-grid,.donations-inner,.partner-card').forEach(el => {
    el.classList.add('reveal'); obs.observe(el);
  });
}

// ── ADMIN STATISTICS REPORT ──
async function renderStats(){
  const empty=document.getElementById('stats-empty');
  const cards=document.getElementById('stats-cards');
  if(!REMOTE||!sb){
    if(empty){empty.style.display='block';empty.textContent='Statistikat kërkojnë lidhje me serverin (Supabase).';}
    return;
  }
  // pull the last 90 days of events (bounded so it stays fast)
  const since=new Date(Date.now()-90*864e5).toISOString();
  let rows=[];
  try{
    const {data,error}=await sb.from('analytics').select('kind,path,visitor,created_at').gte('created_at',since).order('created_at',{ascending:false});
    if(error)throw error;
    rows=data||[];
  }catch(e){
    if(empty){empty.style.display='block';empty.textContent='Nuk mund të lexohen statistikat: '+e.message;}
    return;
  }
  const visits=rows.filter(r=>r.kind==='visit');
  const contacts=rows.filter(r=>r.kind==='contact');
  if(empty)empty.style.display=(visits.length||contacts.length)?'none':'block';

  const now=new Date();
  const startOfDay=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
  const todayStart=startOfDay(now).getTime();
  const dayMs=864e5;
  const within=(list,days)=>list.filter(r=>new Date(r.created_at).getTime()>=now.getTime()-days*dayMs).length;

  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('st-total',visits.length);
  set('st-unique',new Set(visits.map(v=>v.visitor).filter(Boolean)).size);
  set('st-today',visits.filter(v=>new Date(v.created_at).getTime()>=todayStart).length);
  set('st-7',within(visits,7));
  set('st-contacts',contacts.length);
  set('st-contacts-30',within(contacts,30));

  // 14-day bar chart
  const chart=document.getElementById('stats-chart');
  if(chart){
    const days=[];
    for(let i=13;i>=0;i--){
      const d=startOfDay(new Date(now.getTime()-i*dayMs));
      days.push({label:d.toLocaleDateString('sq-AL',{day:'numeric',month:'short'}),ts:d.getTime(),count:0});
    }
    visits.forEach(v=>{
      const t=startOfDay(new Date(v.created_at)).getTime();
      const slot=days.find(d=>d.ts===t);if(slot)slot.count++;
    });
    const max=Math.max(1,...days.map(d=>d.count));
    chart.innerHTML=days.map(d=>`
      <div class="chart-col" title="${d.label}: ${d.count} vizita">
        <div class="chart-bar-wrap"><div class="chart-bar" style="height:${Math.round(d.count/max*100)}%"><span>${d.count||''}</span></div></div>
        <div class="chart-x">${d.label}</div>
      </div>`).join('');
  }

  // top pages
  const top=document.getElementById('stats-top-pages');
  if(top){
    const names={'/':'Ballina','':'Ballina'};
    const counts={};
    visits.forEach(v=>{let p=v.path||'/';if(/^#lajmi-/.test(p))p='Artikull lajmi';else p=names[p]||p;counts[p]=(counts[p]||0)+1;});
    const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);
    top.innerHTML=sorted.length?sorted.map(([p,n])=>`
      <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--white);border:1px solid var(--border);border-radius:10px">
        <span style="flex:1;font-size:13.5px;font-weight:600;color:var(--ink)">${p}</span>
        <span style="font-size:13px;color:var(--green);font-weight:700">${n} vizita</span>
      </div>`).join(''):'<p style="color:var(--ink-lt);font-size:13px">Ende asnjë faqe e regjistruar.</p>';
  }

  // archived backups
  const wrap=document.getElementById('stats-archive-wrap'),arch=document.getElementById('stats-archive');
  if(wrap&&arch){
    try{
      const {data:ar}=await sb.from('analytics_archive').select('*').order('created_at',{ascending:false});
      if(ar&&ar.length){
        wrap.style.display='block';
        arch.innerHTML=ar.map(a=>`
          <div style="display:flex;align-items:center;gap:14px;padding:12px 16px;background:var(--cream);border:1px solid var(--border);border-radius:10px;flex-wrap:wrap">
            <span style="font-size:20px">🗄️</span>
            <div style="flex:1;min-width:160px"><strong style="font-size:13px;color:var(--ink);display:block">${a.label||'Periudhë e mëparshme'}</strong><small style="color:var(--ink-lt)">Ruajtur: ${fmtDateSq(a.created_at)}</small></div>
            <span style="font-size:12.5px;color:var(--ink-mid)">👁️ <strong>${a.total_visits}</strong> vizita</span>
            <span style="font-size:12.5px;color:var(--ink-mid)">🧑 <strong>${a.unique_visitors}</strong> unikë</span>
            <span style="font-size:12.5px;color:var(--ink-mid)">✉️ <strong>${a.total_contacts}</strong> kontakte</span>
          </div>`).join('');
      }else{wrap.style.display='none';}
    }catch(e){wrap.style.display='none';}
  }
}

// Reset the live counters, saving a summary snapshot to the archive first
async function resetStats(){
  if(!REMOTE||!sb){showToast('Rivendosja kërkon lidhje me serverin!','error');return;}
  if(!confirm('⚠️ RIVENDOS STATISTIKAT?\n\nNumëruesit (vizita, vizitorë, kontakte) do të kthehen në ZERO.\n\nNjë kopje rezervë (backup) e totaleve aktuale ruhet automatikisht në "Arkivi" për referencë të mëvonshme vjetore.\n\nDoni të vazhdoni?'))return;
  try{
    const {data,error}=await sb.from('analytics').select('kind,visitor,created_at');
    if(error)throw error;
    const rows=data||[];
    if(rows.length){
      const visits=rows.filter(r=>r.kind==='visit');
      const contacts=rows.filter(r=>r.kind==='contact');
      const times=rows.map(r=>new Date(r.created_at).getTime());
      const from=new Date(Math.min(...times)).toISOString();
      const to=new Date(Math.max(...times)).toISOString();
      const label=fmtDateSq(from)+' - '+fmtDateSq(to);
      const {error:e1}=await sb.from('analytics_archive').insert({
        label,total_visits:visits.length,
        unique_visitors:new Set(visits.map(v=>v.visitor).filter(Boolean)).size,
        total_contacts:contacts.length,from_date:from,to_date:to
      });
      if(e1)throw e1;
      const {error:e2}=await sb.from('analytics').delete().neq('id',0);
      if(e2)throw e2;
    }
    await renderStats();
    showToast('✅ Statistikat u rivendosën. Backup u ruajt në Arkiv.','success');
  }catch(e){showToast('Gabim: '+e.message,'error');}
}

// ═══════════════════════════════════════
//  CHAT ASSISTANT (rule-based FAQ, no cost)
// ═══════════════════════════════════════
const CHAT_EMAIL='xhamiaepaqes@hotmail.com';
const CHAT_INTENTS=[
  {id:'prayer',k:['prayer','pray time','namaz','fajr','sabah','dhuhr','drek','asr','ikindi','maghrib','aksham','isha','jaci','sunrise','lindja','gebet','koh','namazit','lutje'],
   sq:'🕌 Kohët e sakta të namazit shfaqen LIVE nga SwissMosque në faqen tonë kryesore dhe përditësohen çdo ditë automatikisht.',
   de:'🕌 Die genauen Gebetszeiten werden LIVE von SwissMosque auf unserer Startseite angezeigt und täglich automatisch aktualisiert.',
   act:{page:'home',anchor:'prayer-section',sq:'Shiko kohët e namazit',de:'Gebetszeiten ansehen'}},
  {id:'friday',k:['friday','xhuma','xhuia','jumu','khutbah','hutbe','freitag'],
   sq:'🕌 Namazi i Xhumasë mbahet çdo të premte pas thirrjes së drekës, me hutbe në gjuhën shqipe. Ju lutemi ejani pak më herët.',
   de:'🕌 Das Freitagsgebet findet jeden Freitag nach dem Mittagsgebet statt, mit Predigt auf Albanisch. Bitte kommen Sie etwas früher.'},
  {id:'ramadan',k:['ramadan','ramazan','iftar','suhoor','syfyr','taraweeh','teravi','agjer'],
   sq:'🌙 Gjatë Ramazanit organizojmë iftare të përbashkëta dhe namaz teravi çdo mbrëmje. Kohët e iftarit ndjekin akshamin (shih kohët e namazit).',
   de:'🌙 Während des Ramadans organisieren wir gemeinsame Iftar-Abende und jeden Abend Tarawih-Gebete. Die Iftar-Zeit richtet sich nach Maghrib (siehe Gebetszeiten).',
   act:{page:'home',anchor:'prayer-section',sq:'Kohët e namazit',de:'Gebetszeiten'}},
  {id:'eid',k:['eid','bajram'],
   sq:'🎉 Namazi i Bajramit mbahet në mëngjesin e festës. Datat dhe oraret e sakta i shpallim para çdo Bajrami — ndiqni lajmet tona.',
   de:'🎉 Das Eid-Gebet findet am Festmorgen statt. Genaue Daten und Zeiten geben wir vor jedem Eid bekannt — folgen Sie unseren Nachrichten.',
   act:{page:'news',sq:'Lajmet',de:'Nachrichten'}},
  {id:'location',k:['address','adres','location','lokacion','where','ku jeni','ku ndodh','map','hart','parking','park','bus','tram','transport','standort',' wo','richtung'],
   sq:'📍 Ndodhemi në <strong>Saatlenstrasse 23, 8051 Zürich</strong> (Schwamendingen). Hartën dhe udhëzimet i gjeni në faqen kryesore.',
   de:'📍 Wir befinden uns an der <strong>Saatlenstrasse 23, 8051 Zürich</strong> (Schwamendingen). Karte und Wegbeschreibung finden Sie auf der Startseite.',
   act:{page:'home',anchor:'map-section',sq:'Shiko hartën',de:'Karte ansehen'}},
  {id:'contact',k:['contact','kontakt','phone','telefon','email','e-mail','imam','hoxh','message','mesazh','nachricht'],
   sq:'📞 Mund të na shkruani te <strong>'+CHAT_EMAIL+'</strong> ose përmes formularit të kontaktit. Imami dhe stafi ju përgjigjen sa më shpejt.',
   de:'📞 Sie können uns unter <strong>'+CHAT_EMAIL+'</strong> oder über das Kontaktformular schreiben. Imam und Team antworten so schnell wie möglich.',
   act:{page:'contact',sq:'Hap formularin',de:'Formular öffnen'}},
  {id:'donate',k:['donat','donacion','dhuro','zakat','zeqat','sadaka','sadaqah','twint','pagesa','pay','spend','fitr','kurban'],
   sq:'💚 Faleminderit! Mund të kontribuoni online (Sadaka, Zekat, Fitër, Kurban) përmes faqes "Pagesat".',
   de:'💚 Vielen Dank! Sie können online spenden (Sadaqa, Zakat, Fitr, Kurban) über die Seite "Zahlungen".',
   act:{page:'payments',sq:'Shko te Pagesat',de:'Zu den Zahlungen'}},
  {id:'membership',k:['member','anetar','antar','mitglied','membership','regjistrim anetar'],
   sq:'🤝 Për t\'u anëtarësuar, plotësoni formularin e regjistrimit në faqen "Pagesat / Anëtarësimi".',
   de:'🤝 Um Mitglied zu werden, füllen Sie das Anmeldeformular auf der Seite "Zahlungen / Mitgliedschaft" aus.',
   act:{page:'payments',sq:'Anëtarësimi',de:'Mitgliedschaft'}},
  {id:'events',k:['event','ngjarj','aktivitet','lecture','ligjerat','veranstalt','program','takim'],dyn:'events'},
  {id:'quran',k:['quran audio','sure','surah','recit','degjo kuran','koran hor','kurani'],
   sq:'📖 Në faqen "Kurani" mund të dëgjoni sûret e Kuranit me audio — vazhdon të luajë edhe kur telefoni është i kyçur.',
   de:'📖 Auf der Seite "Koran" können Sie die Suren des Korans als Audio anhören — läuft auch bei gesperrtem Telefon weiter.',
   act:{page:'quran',sq:'Dëgjo Kuranin',de:'Koran anhören'}},
  {id:'classes',k:['class','mesim','kurs','arabic','arabisht','mesim besim','femij','children','kinder','youth','rini','jugend','shkoll','weekend'],
   sq:'📚 Ofrojmë mësim-besim dhe mësime kuranore për fëmijë e të rinj. Për orarin dhe regjistrimin, na kontaktoni.',
   de:'📚 Wir bieten Religions- und Koranunterricht für Kinder und Jugendliche an. Für Zeitplan und Anmeldung kontaktieren Sie uns bitte.',
   act:{page:'contact',sq:'Na kontaktoni',de:'Kontakt'}},
  {id:'funeral',k:['funeral','xhenaz','janaz','varrim','vdekj','beerdig','todesfall','begrab'],
   sq:'🕊️ Për shërbime të xhenazes dhe ndihmë me organizimin, ju lutemi kontaktoni menjëherë imamin përmes email-it ose telefonit.',
   de:'🕊️ Für Beerdigungsdienste und Hilfe bei der Organisation kontaktieren Sie bitte umgehend den Imam per E-Mail oder Telefon.',
   act:{page:'contact',sq:'Kontakto imamin',de:'Imam kontaktieren'}},
  {id:'marriage',k:['marriage','martes','nikah','kuror','heirat','trau'],
   sq:'💍 Për kurorëzim (Nikah), ju lutemi kontaktoni imamin për t\'u marrë vesh për dokumentet dhe terminin.',
   de:'💍 Für die Eheschließung (Nikah) kontaktieren Sie bitte den Imam, um Unterlagen und Termin zu besprechen.',
   act:{page:'contact',sq:'Kontakto imamin',de:'Imam kontaktieren'}},
  {id:'convert',k:['convert','become muslim','shahad','deshmi','konvert','muslim werden','islam annehm','pranoj islam'],
   sq:'🌟 Mirë se vini! Imami ynë me kënaqësi ju udhëzon në rrugën tuaj drejt Islamit. Ju lutemi na kontaktoni për një takim.',
   de:'🌟 Herzlich willkommen! Unser Imam begleitet Sie gerne auf Ihrem Weg zum Islam. Bitte kontaktieren Sie uns für einen Termin.',
   act:{page:'contact',sq:'Na kontaktoni',de:'Kontakt'}},
  {id:'volunteer',k:['volunteer','vullnetar','freiwillig','help','ndihmoj','mithelf'],
   sq:'🙌 Faleminderit për gatishmërinë! Ka gjithmonë nevojë për vullnetarë. Na shkruani dhe ju gjejmë një mënyrë për të ndihmuar.',
   de:'🙌 Danke für Ihre Bereitschaft! Wir brauchen immer Freiwillige. Schreiben Sie uns und wir finden einen Weg für Ihre Mithilfe.',
   act:{page:'contact',sq:'Na kontaktoni',de:'Kontakt'}},
  {id:'visit',k:['visit','vizit','tour','non-muslim','tourist','photo','foto','film','besuch','shkoll vjen'],
   sq:'🕌 Vizitorët e të gjitha besimeve janë të mirëpritur! Për vizita në grup ose tura shkollore, na kontaktoni paraprakisht.',
   de:'🕌 Besucher aller Glaubensrichtungen sind willkommen! Für Gruppenbesuche oder Schulführungen kontaktieren Sie uns bitte im Voraus.',
   act:{page:'contact',sq:'Na kontaktoni',de:'Kontakt'}},
  {id:'facilities',k:['restroom','tualet','wc','wudu','abdes','wifi','wi-fi','water','uje','library','bibliotek','shower','dush'],
   sq:'🚰 Në xhami ka hapësira për abdes, tualete dhe ujë. Për detaje të tjera na pyesni ose na kontaktoni.',
   de:'🚰 In der Moschee gibt es Waschräume für die rituelle Waschung, Toiletten und Wasser. Für weitere Details fragen Sie uns gerne.'},
  {id:'dress',k:['dress','veshj','shoes','kepuc','schuh','women attend','gra','femra','frauen','kids attend','femije vij','modest'],
   sq:'👗 Ju lutemi vishuni me modesti. Këpucët hiqen para hyrjes në sallën e namazit. Gratë dhe fëmijët janë të mirëpritur — ka hapësirë të veçantë.',
   de:'👗 Bitte kleiden Sie sich bescheiden. Schuhe werden vor dem Gebetsraum ausgezogen. Frauen und Kinder sind willkommen — es gibt einen eigenen Bereich.'},
  {id:'hours',k:['open','hapur','hours','orari','offnung','offen','close','mbyll','when can i come'],
   sq:'🕐 Xhamia është e hapur rreth kohëve të pesë namazeve çdo ditë. Për vizita jashtë këtyre orareve, na kontaktoni.',
   de:'🕐 Die Moschee ist täglich um die fünf Gebetszeiten geöffnet. Für Besuche ausserhalb dieser Zeiten kontaktieren Sie uns bitte.'},
  {id:'languages',k:['language','gjuh','sprache','which language'],
   sq:'🗣️ Flitet shqip, gjermanisht dhe arabisht. Faqja jonë është në shqip dhe gjermanisht.',
   de:'🗣️ Gesprochen wird Albanisch, Deutsch und Arabisch. Unsere Website ist auf Albanisch und Deutsch verfügbar.'},
  {id:'lost',k:['lost','humb','found','gjeta','verloren','gefunden','harrova','shoe left'],
   sq:'🔎 Për sende të humbura ose të gjetura, ju lutemi kontaktoni stafin e xhamisë.',
   de:'🔎 Für verlorene oder gefundene Gegenstände wenden Sie sich bitte an das Moschee-Team.',
   act:{page:'contact',sq:'Na kontaktoni',de:'Kontakt'}},
  {id:'social',k:['social','instagram','facebook','tiktok','follow','ndiqni','livestream','live'],
   sq:'📱 Na ndiqni në Instagram, Facebook dhe TikTok (@xhamia_schwamendingen). Linqet i gjeni në fund të faqes.',
   de:'📱 Folgen Sie uns auf Instagram, Facebook und TikTok (@xhamia_schwamendingen). Die Links finden Sie im Footer.'},
  {id:'islam',k:['what is islam','five pillars','shtyllat','how to pray','si te fal','how do i pray','wie bete','was ist islam','pillars'],
   sq:'☪️ Islami mbështetet në pesë shtylla: Shehadeti, Namazi, Zekati, Agjërimi dhe Haxhi. Për të mësuar më shumë, ndiqni ligjëratat ose kontaktoni imamin.',
   de:'☪️ Der Islam ruht auf fünf Säulen: Schahada, Gebet, Zakat, Fasten und Hadsch. Um mehr zu erfahren, folgen Sie den Vorträgen oder kontaktieren Sie den Imam.',
   act:{page:'lectures',sq:'Ligjëratat',de:'Vorträge'}},
];

function chatNorm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');}
function chatMatch(text){
  const t=chatNorm(text);let best=null,bestScore=0;
  CHAT_INTENTS.forEach(intent=>{
    let score=0;intent.k.forEach(k=>{if(t.includes(chatNorm(k)))score+=k.length>4?2:1;});
    if(score>bestScore){bestScore=score;best=intent;}
  });
  return bestScore>0?best:null;
}

let chatStarted=false;
function toggleChat(){
  const p=document.getElementById('chat-panel'),f=document.getElementById('chat-fab');
  const open=p.classList.toggle('open');f.classList.toggle('active',open);
  if(open&&!chatStarted){chatStarted=true;chatGreeting();}
  if(open)setTimeout(()=>document.getElementById('chat-text').focus(),200);
}
function chatAddMsg(html,who){
  const body=document.getElementById('chat-body');
  const d=document.createElement('div');d.className='chat-msg '+who;d.innerHTML=html;
  body.appendChild(d);body.scrollTop=body.scrollHeight;return d;
}
function chatGreeting(){
  const de=currentLang==='de';
  chatAddMsg(de?'Selam! 👋 Ich bin der Assistent der Moschee. Wie kann ich helfen?':'Selam! 👋 Unë jam asistenti i xhamisë. Si mund t\'ju ndihmoj?','bot');
  const chips=[['prayer',de?'Gebetszeiten':'Kohët e namazit'],['location',de?'Standort':'Lokacioni'],['contact',de?'Kontakt':'Kontakti'],['donate',de?'Spenden':'Pagesat'],['events',de?'Veranstaltungen':'Ngjarjet'],['quran',de?'Koran':'Kurani']];
  const wrap=document.createElement('div');wrap.className='chat-chips';
  chips.forEach(([id,label])=>{const b=document.createElement('button');b.className='chat-chip';b.textContent=label;b.onclick=()=>chatQuick(id,label);wrap.appendChild(b);});
  document.getElementById('chat-body').appendChild(wrap);
}
// Typing indicator ("..." bubble) for a natural online-chat feel
function chatShowTyping(){
  const body=document.getElementById('chat-body');
  const d=document.createElement('div');d.className='chat-msg bot chat-typing';
  d.innerHTML='<span></span><span></span><span></span>';
  body.appendChild(d);body.scrollTop=body.scrollHeight;return d;
}
function chatReply(fn){
  const typing=chatShowTyping();
  setTimeout(()=>{typing.remove();fn();},650);
}
function chatQuick(id,label){chatAddMsg(label,'user');const intent=CHAT_INTENTS.find(x=>x.id===id);chatReply(()=>chatAnswer(intent));}
function chatSend(){
  const inp=document.getElementById('chat-text');const q=inp.value.trim();if(!q)return;
  chatAddMsg(q.replace(/</g,'&lt;'),'user');inp.value='';
  const intent=chatMatch(q);
  chatReply(()=>chatAnswer(intent));
}
function chatAnswer(intent){
  const de=currentLang==='de';
  if(!intent){
    chatAddMsg(de?'Dazu bin ich nicht sicher. 🤔 Bitte kontaktieren Sie uns direkt und wir helfen Ihnen gerne.':'Për këtë nuk jam i sigurt. 🤔 Ju lutemi na kontaktoni drejtpërdrejt dhe ju ndihmojmë me kënaqësi.','bot');
    chatActionBtn({page:'contact',sq:'Na kontaktoni',de:'Kontakt'});
    return;
  }
  if(intent.dyn==='events'){
    const posts=DB.posts.slice(0,3);
    if(posts.length){
      chatAddMsg((de?'📅 Aktuelle Beiträge:':'📅 Postimet e fundit:')+'<br>'+posts.map(p=>'• '+p.title).join('<br>'),'bot');
      chatActionBtn({page:'news',sq:'Të gjitha lajmet',de:'Alle Nachrichten'});
    }else{chatAddMsg(de?'Momentan sind keine Beiträge vorhanden.':'Për momentin nuk ka postime.','bot');}
    return;
  }
  chatAddMsg(de?intent.de:intent.sq,'bot');
  if(intent.act)chatActionBtn(intent.act);
}
function chatActionBtn(act){
  const body=document.getElementById('chat-body');
  const b=document.createElement('button');b.className='chat-action';
  b.textContent=(currentLang==='de'?act.de:act.sq)+' →';
  b.onclick=()=>{
    toggleChat();
    if(act.url){window.open(act.url,'_blank');return;}
    if(act.page)navigate(act.page);
    // optionally scroll to a specific section within the page
    if(act.anchor){
      setTimeout(()=>{
        const el=document.getElementById(act.anchor);
        if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
      },400);
    }
  };
  body.appendChild(b);body.scrollTop=body.scrollHeight;
}

// ── COOKIE / PRIVACY CONSENT ──
function acceptCookies(){
  try{localStorage.setItem('hdf_cookie_ok','1');}catch(e){}
  const b=document.getElementById('cookie-banner');if(b)b.classList.remove('show');
}
function initCookieBanner(){
  let ok=false;try{ok=localStorage.getItem('hdf_cookie_ok')==='1';}catch(e){}
  if(ok)return;
  const b=document.getElementById('cookie-banner');
  if(b)setTimeout(()=>b.classList.add('show'),1800); // after the splash fades
}

// ── ANIMATED CUSTOM CURSOR ──
function initCursor(){
  // Only on devices with a precise pointer (desktops); skip touch
  if(!window.matchMedia||!window.matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  const mark=document.getElementById('cursor-mark'),ring=document.getElementById('cursor-ring');
  if(!mark||!ring)return;
  document.body.classList.add('custom-cursor');
  let mx=innerWidth/2,my=innerHeight/2;   // mouse target
  let rx=mx,ry=my;                          // ring (eased, trails behind)
  window.addEventListener('mousemove',e=>{
    mx=e.clientX;my=e.clientY;
    mark.style.transform=`translate(${mx}px,${my}px)`;
    // hover / text-field detection
    const t=e.target;
    const interactive=t.closest&&t.closest('a,button,[onclick],.news-card,.activity-card,.g-item,.partner-card,.lang-btn,.filter-pill,.media-thumb,.audio-row,.acc-header,.slide-dot,.slide-arrow,.sidebar-item,.admin-tab-pill,.media-filter-tab,.payment-card,.dash-card,.quick-action-btn');
    const isText=t.matches&&t.matches('input,textarea,select,[contenteditable]');
    document.body.classList.toggle('cursor-hover',!!interactive&&!isText);
    document.body.classList.toggle('cursor-text',!!isText);
  },{passive:true});
  window.addEventListener('mousedown',()=>document.body.classList.add('cursor-down'));
  window.addEventListener('mouseup',()=>document.body.classList.remove('cursor-down'));
  window.addEventListener('mouseleave',()=>{mark.style.opacity='0';ring.style.opacity='0';});
  window.addEventListener('mouseenter',()=>{mark.style.opacity='';ring.style.opacity='';});
  // ring follows with easing for a smooth trailing effect
  (function loop(){
    rx+=(mx-rx)*0.18;ry+=(my-ry)*0.18;
    ring.style.transform=`translate(${rx}px,${ry}px)`;
    requestAnimationFrame(loop);
  })();
  // click ripple burst in mosque gold
  window.addEventListener('click',e=>{
    const r=document.createElement('div');
    r.className='cursor-burst';
    r.style.cssText=`left:${e.clientX}px;top:${e.clientY}px`;
    document.body.appendChild(r);
    setTimeout(()=>r.remove(),520);
  });
}

// ── INIT ──
async function initApp(){
  if(sb){
    try{
      await remoteLoadAll();
      REMOTE=true;
      await remoteRestoreSession();
    }catch(e){
      console.warn('Backend i paarritshëm - kalim në modalitetin lokal demo:',e);
      loadState();
    }
  }else{
    loadState();
  }
  try{
    const l=localStorage.getItem('hdf_lang');
    if(l&&l!==currentLang)setLang(l);
  }catch(e){}
  updateAuthUI();
  renderHomeNews();
  renderCondolencesPublic();
  renderPublicGallery();
  renderPartners();
  renderStaff();
  renderEvents();
  renderImam();
  renderAudioList();
  updateHeroSlides();
  renderDocsList();
  applyActivityPhotos();
  renderStatuteDoc();
  wirePrayerDocs();
  renderCustomNav();
  if(document.getElementById('page-member').classList.contains('active'))renderMemberArea();
  const hash=location.hash.match(/^#lajmi-(\d+)$/);
  if(hash)openArticle(+hash[1],false);
  const fhash=location.hash.match(/^#faqe-(\d+)$/);
  if(fhash)openCustomPage(+fhash[1],false);
  trackVisit();
}

// First-load splash: keep it up ~1.4s (or until data loads), then fade out
function hideSplash(){
  const s=document.getElementById('page-splash');
  if(s)s.classList.add('hide');
}
const splashStart=Date.now();
initApp().finally(()=>{
  const wait=Math.max(0,1400-(Date.now()-splashStart));
  setTimeout(hideSplash,wait);
});
// Safety net: never let the splash trap the page if init hangs
setTimeout(hideSplash,4000);
initSlideshow();
animateStats();
initCursor();
initCookieBanner();
setTimeout(initScrollReveal, 400);

// ── LIVE CLOCK ──
function updateClock(){
  const now=new Date();
  const timeEl=document.getElementById('live-time');
  const dateEl=document.getElementById('live-date');
  const lblEl=document.getElementById('live-date-label');
  if(timeEl) timeEl.textContent=now.toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  if(dateEl) dateEl.textContent=now.toLocaleDateString('de-CH',{weekday:'short',day:'numeric',month:'short'});
  if(lblEl)  lblEl.textContent=currentLang==='de'?'Heute':'Sot';
}
updateClock();
setInterval(updateClock,1000);

// ── DARK / LIGHT THEME ──
function currentTheme(){return document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';}
function applyTheme(t){
  if(t==='dark')document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
  const tt=document.getElementById('theme-toggle');
  if(tt)tt.title=(currentLang==='de'?(t==='dark'?'Heller Modus':'Dunkler Modus'):(t==='dark'?'Pamja e ndritshme':'Pamja e errët'));
}
function toggleTheme(){
  const next=currentTheme()==='dark'?'light':'dark';
  applyTheme(next);
  try{localStorage.setItem('hdf_theme',next);}catch(e){}
  showToast(next==='dark'?'🌙 Pamja e errët':'☀️ Pamja e ndritshme','');
}
// sync the toggle title with whatever the head-script already applied
applyTheme(currentTheme());

// ── PWA: service worker + install prompt ──
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});});
}
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',(e)=>{
  e.preventDefault();
  deferredInstallPrompt=e;
  const b=document.getElementById('pwa-install-btn');
  if(b)b.style.display='flex';
});
async function pwaInstall(){
  if(!deferredInstallPrompt)return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt=null;
  const b=document.getElementById('pwa-install-btn');
  if(b)b.style.display='none';
}
window.addEventListener('appinstalled',()=>{
  const b=document.getElementById('pwa-install-btn');
  if(b)b.style.display='none';
  showToast('✅ Aplikacioni u instalua!','success');
});

