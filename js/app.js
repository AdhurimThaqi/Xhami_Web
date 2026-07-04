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
  DB.posts=(posts.data||[]).map(p=>({id:p.id,title:p.title,category:p.category,body:p.body,img:p.img||'',date:fmtDateEn(p.created_at)}));
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
}

// MODALS
function openModal(id){document.getElementById(id).classList.add('active')}
function closeModal(id){document.getElementById(id).classList.remove('active')}
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)closeModal(o.id)}));
function switchAuthTab(t){
  document.getElementById('login-form').classList.toggle('hidden',t!=='login');
  document.getElementById('register-form').classList.toggle('hidden',t!=='register');
  document.getElementById('tab-login-btn').classList.toggle('active',t==='login');
  document.getElementById('tab-reg-btn').classList.toggle('active',t==='register');
}

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
window.addEventListener('scroll',()=>document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>40));
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
    'tab-login-btn':'Hyrja','tab-reg-btn':'Regjistrim','login-h2':'Mirë se vini','login-sub':'Hyni në llogarinë tuaj','login-submit-btn':'Hyr',
    'lbl-or':'ose','switch-to-reg':'Nuk keni llogari?','switch-reg-link':'Regjistrohu',
    'reg-h2':'Regjistrohu','reg-sub':'Krijoni llogarinë tuaj falas','lbl-fullname':'Emri i plotë','lbl-pass2':'Fjalëkalimi','lbl-pass3':'Konfirmo','reg-submit-btn':'Regjistrohu',
    'nav-login-btn':'Hyrja','mob-login-btn':'Hyrja / Regjistrim',
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
    'tab-login-btn':'Anmelden','tab-reg-btn':'Registrieren','login-h2':'Willkommen','login-sub':'Melden Sie sich in Ihrem Konto an','login-submit-btn':'Anmelden',
    'lbl-or':'oder','switch-to-reg':'Noch kein Konto?','switch-reg-link':'Registrieren',
    'reg-h2':'Registrieren','reg-sub':'Erstellen Sie Ihr kostenloses Konto','lbl-fullname':'Vollständiger Name','lbl-pass2':'Passwort','lbl-pass3':'Passwort bestätigen','reg-submit-btn':'Registrieren',
    'nav-login-btn':'Anmelden','mob-login-btn':'Anmelden / Registrieren',
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
function newsCard(p){
  return `<div class="news-card" onclick="openArticle(${p.id})">
    <div class="news-card-img">
      <div class="news-card-img-placeholder">📰</div>
      ${p.img?`<img src="${p.img}" alt="${p.title}" loading="lazy" onerror="this.style.display='none'">`:''}
      <span class="news-card-chip">${p.category}</span>
    </div>
    <div class="news-card-body">
      <div class="news-card-meta"><span class="news-card-date">📅 ${p.date}</span></div>
      <h3>${p.title}</h3>
      <p>${p.body.substring(0,110)}${p.body.length>110?'...':''}</p>
      <div class="news-card-footer"><span class="read-more">${currentLang==='de'?'Weiterlesen →':'Lexo më shumë →'}</span></div>
    </div>
  </div>`;
}
function renderHomeNews(){const g=document.getElementById('home-news-grid');if(g)g.innerHTML=DB.posts.slice(0,3).map(newsCard).join('');}
function renderNewsPage(){
  const g=document.getElementById('news-grid');if(!g)return;
  const q=(document.getElementById('news-search')||{}).value||'';
  let posts=DB.posts;
  if(q)posts=posts.filter(p=>p.title.toLowerCase().includes(q.toLowerCase())||p.body.toLowerCase().includes(q.toLowerCase()));
  if(currentFilter!=='ALL')posts=posts.filter(p=>p.category===currentFilter);
  g.innerHTML=posts.length?posts.map(newsCard).join(''):`<p style="color:var(--ink-lt);grid-column:1/-1;text-align:center;padding:40px 0">${currentLang==='de'?'Keine Artikel gefunden.':'Nuk u gjetën artikuj.'}</p>`;
}
function filterNews(){renderNewsPage();}
function setFilter(f,el){
  currentFilter=f;
  document.querySelectorAll('.filter-pill').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');renderNewsPage();
}
// ── SINGLE ARTICLE PAGE (own URL via #lajmi-<id>) ──
function openArticle(id,pushHash=true){
  const p=DB.posts.find(x=>x.id===id);if(!p)return;
  document.getElementById('article-cat').textContent=p.category;
  document.getElementById('article-date').textContent=p.date;
  document.getElementById('article-title').textContent=p.title;
  const img=document.getElementById('article-img');
  if(p.img){img.src=p.img;img.alt=p.title;img.style.display='block';img.onerror=()=>img.style.display='none';}
  else img.style.display='none';
  document.getElementById('article-body').innerHTML='<p>'+p.body.replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')+'</p>';
  if(pushHash){try{history.pushState(null,'','#lajmi-'+id);}catch(e){}}
  navigate('article');
}
window.addEventListener('hashchange',()=>{
  const m=location.hash.match(/^#lajmi-(\d+)$/);
  if(m)openArticle(+m[1],false);
});

function openNewsModal(id){
  const p=DB.posts.find(x=>x.id===id);if(!p)return;
  document.getElementById('news-modal-content').innerHTML=`
    ${p.img?`<img src="${p.img}" alt="${p.title}" style="width:100%;height:260px;object-fit:cover;border-radius:10px;margin-bottom:20px" onerror="this.style.display='none'">`:''}
    <div class="news-card-meta" style="margin-bottom:10px"><span class="news-card-cat">${p.category}</span><span class="news-card-date">${p.date}</span></div>
    <h2 style="font-size:22px;color:var(--green);margin-bottom:14px">${p.title}</h2>
    <div style="color:var(--ink-mid);font-size:15px;line-height:1.8">${p.body.replace(/\n/g,'<br>')}</div>`;
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
    await remoteLoadAll();renderMediaTab();renderPublicGallery();renderAudioList();updateHeroSlides();renderDocsList();
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

function renderMediaTab(){
  const grid=document.getElementById('media-grid');if(!grid)return;
  grid.innerHTML=mediaItems.map(mediaThumbHtml).join('');
  grid.querySelectorAll('.media-thumb').forEach(el=>{
    el.addEventListener('mouseenter',()=>{const c=el.querySelector('.media-cap');if(c)c.style.opacity='1';});
    el.addEventListener('mouseleave',()=>{const c=el.querySelector('.media-cap');if(c)c.style.opacity='0';});
  });
}

// Public homepage gallery mirrors the media library once it has content
function renderPublicGallery(){
  const g=document.querySelector('#page-home .gallery-grid');if(!g)return;
  const items=mediaItems.filter(m=>m.kind!=='audio'&&m.kind!=='pdf');
  if(!REMOTE||!items.length)return; // keep the static fallback gallery
  const zoomSvg='<div class="g-overlay"><svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></div>';
  g.innerHTML=items.map(m=>{
    if(m.kind==='video')return `<div class="g-item g-media"><video src="${m.url}" preload="metadata" controls playsinline></video></div>`;
    if(m.kind==='facebook'){
      if(!fbEmbeddable(m.url))return `<a class="g-item g-media g-fb-link" href="${m.url}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12"/></svg><span>Shiko në Facebook ↗</span><small>${m.cap||''}</small></a>`;
      return `<div class="g-item g-media"><iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(m.url)}&show_text=false" allowfullscreen loading="lazy" title="Facebook video"></iframe></div>`;
    }
    return `<div class="g-item"><img src="${m.url}" alt="${m.cap||'Foto'}" loading="lazy">${zoomSvg}</div>`;
  }).join('');
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
let audioQueue=[],audioIndex=-1;
const pAudio=()=>document.getElementById('player-audio');
function fmtTime(s){if(!isFinite(s)||s<0)return'0:00';s=Math.round(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}

function renderAudioList(){
  const list=document.getElementById('audio-list');if(!list)return;
  const tracks=mediaItems.filter(m=>m.kind==='audio');
  const empty=document.getElementById('audio-empty');
  if(empty)empty.style.display=tracks.length?'none':'block';
  const playing=!pAudio().paused;
  list.innerHTML=tracks.map((t,i)=>`
    <div class="audio-row${audioIndex===i?' playing':''}" onclick="playTrack(${i})">
      <div class="audio-row-btn">${audioIndex===i&&playing?'⏸':'▶'}</div>
      <div class="audio-row-info"><strong>${t.cap||'Audio'}</strong><small>Kulturzentrum Haus des Friedens</small></div>
      ${audioIndex===i&&playing?'<div class="audio-eq"><span></span><span></span><span></span></div>':''}
    </div>`).join('');
}

function playTrack(i){
  audioQueue=mediaItems.filter(m=>m.kind==='audio');
  if(!audioQueue[i])return;
  const a=pAudio();
  if(audioIndex===i){a.paused?a.play():a.pause();return;}
  audioIndex=i;
  a.src=audioQueue[i].url;
  a.play();
  document.getElementById('player-bar').classList.add('open');
  setMediaSession(audioQueue[i]);
}
function playerToggle(){const a=pAudio();if(!a.src)return;a.paused?a.play():a.pause();}
function playerNext(){if(audioQueue.length)playTrackByStep(1);}
function playerPrev(){if(audioQueue.length)playTrackByStep(-1);}
function playTrackByStep(d){
  const n=(audioIndex+d+audioQueue.length)%audioQueue.length;
  audioIndex=-1;playTrack(n);
}
function playerSeek(v){const a=pAudio();if(isFinite(a.duration))a.currentTime=a.duration*v/100;}
function playerClose(){
  const a=pAudio();a.pause();a.removeAttribute('src');a.load();
  audioIndex=-1;
  document.getElementById('player-bar').classList.remove('open');
  renderAudioList();
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
['play','pause'].forEach(ev=>pAudio().addEventListener(ev,()=>{updatePlayerBar();renderAudioList();}));
pAudio().addEventListener('timeupdate',updatePlayerBar);
pAudio().addEventListener('ended',playerNext);

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
async function uploadPostImage(ev){
  const f=(ev.target.files||[])[0];ev.target.value='';
  if(!f)return;
  if(!REMOTE){showToast('Ngarkimi kërkon lidhje me serverin!','error');return;}
  if(!/^image\//.test(f.type)){showToast('Zgjidhni një foto!','error');return;}
  showToast('⏳ Duke ngarkuar foton...','');
  try{
    const url=await uploadToStorage(f);
    document.getElementById('post-img').value=url;
    showToast('✅ Fotoja u ngarkua! Tani klikoni Publiko.','success');
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
  if(isEdit){const p=DB.posts.find(x=>x.id===postId);document.getElementById('post-title').value=p.title;document.getElementById('post-cat').value=p.category;document.getElementById('post-body').value=p.body;document.getElementById('post-img').value=p.img||'';}
  else{['post-title','post-body','post-img'].forEach(id=>document.getElementById(id).value='');}
  openModal('post-modal');
}
async function savePost(){
  const title=document.getElementById('post-title').value.trim(),body=document.getElementById('post-body').value.trim();
  if(!title||!body){showToast('Plotësoni titullin dhe përmbajtjen!','error');return;}
  const category=document.getElementById('post-cat').value,img=document.getElementById('post-img').value.trim();
  if(REMOTE){
    const q=editingPostId!==null
      ?sb.from('posts').update({title,category,body,img}).eq('id',editingPostId)
      :sb.from('posts').insert({title,category,body,img});
    const {error}=await q;
    if(error){showToast('Gabim: '+error.message,'error');return;}
    await remoteLoadAll();
    closeModal('post-modal');renderAdminNews();renderHomeNews();renderDashboard();
    showToast(editingPostId!==null?'✅ Artikulli u përditësua!':'🎉 Artikulli u publikua!','success');
    return;
  }
  const data={title,category,body,img,date:new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})};
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
  if(!fields.name||!fields.email||!fields.message){
    showToast(currentLang==='de'?'Alle Felder ausfüllen!':'Plotësoni të gjitha fushat!','error');return;
  }
  const label=btn.textContent;
  btn.disabled=true;btn.textContent=currentLang==='de'?'Wird gesendet...':'Duke dërguar...';
  try{
    const res=await fetch('https://formsubmit.co/ajax/'+CONTACT_EMAIL,{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({
        name:fields.name,email:fields.email,
        subject:fields.subject||'',message:fields.message,
        _subject:'Mesazh nga webfaqja: '+fields.name,
        _template:'table',_captcha:'false'
      })
    });
    if(!res.ok)throw new Error('HTTP '+res.status);
    clearIds.forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    showToast(currentLang==='de'?'✅ Nachricht gesendet!':'✅ Mesazhi u dërgua në xhami!','success');
  }catch(e){
    showToast(currentLang==='de'?'Senden fehlgeschlagen - versuchen Sie es später.':'Dërgimi dështoi - provoni më vonë.','error');
  }
  btn.disabled=false;btn.textContent=label;
}
function sendContact(){
  deliverContact(document.getElementById('contact-send-btn'),{
    name:document.getElementById('cf-name').value.trim(),
    email:document.getElementById('cf-email').value.trim(),
    message:document.getElementById('cf-msg').value.trim(),
  },['cf-name','cf-email','cf-msg']);
}
function sendContact2(){
  deliverContact(document.getElementById('contact-send-btn2'),{
    name:document.getElementById('cf2-name').value.trim(),
    email:document.getElementById('cf2-email').value.trim(),
    subject:document.getElementById('cf2-sub').value.trim(),
    message:document.getElementById('cf2-msg').value.trim(),
  },['cf2-name','cf2-email','cf2-sub','cf2-msg']);
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
  renderAudioList();
  updateHeroSlides();
  renderDocsList();
  applyActivityPhotos();
  if(document.getElementById('page-member').classList.contains('active'))renderMemberArea();
  const hash=location.hash.match(/^#lajmi-(\d+)$/);
  if(hash)openArticle(+hash[1],false);
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

