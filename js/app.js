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
    {id:2,title:'Shenjë kundër racizmit antimusliman',category:'Bashkëpunimi',date:'May 25, 2025',body:'"Ne të gjithë i përkasim Zvicrës" – një shenjë e fuqishme kundër racizmit antimusliman dhe antisemitizmit. Xhamia jonë bashkë me organizata tjera mori pjesë në këtë iniciativë të rëndësishme.',img:''},
    {id:3,title:'Takimi me rininë – Jugendtreff',category:'Aktivitete',date:'May 23, 2025',body:'Falënderim i madh për Dr. Lumni Ademi për ligjëratën jashtëzakonisht interesante me temën "Kurani dhe shkenca moderne". Jugendtreff vazhdon të jetë hapësirë frytdhënëse.',img:''},
    {id:4,title:'Kuvendi i rregullt i Xhamisë 2026',category:'Lajme',date:'March 31, 2026',body:'Kuvendi vjetor i rregullt i xhamisë u mbajt me sukses. Anëtarët diskutuan planin e aktiviteteve, buxhetin dhe çështje të tjera të rëndësishme për komunitetin tonë.',img:''},
    {id:5,title:'Pranimi i Imamëve nga Qyteti i Cyrihut',category:'Lajme',date:'May 28, 2025',body:'Imamët e xhamive të Cyrihut u pritën zyrtarisht nga Qyteti i Cyrihut. Kjo takim u bë rast për dialog dhe forcim të marrëdhënieve ndërmjet institucioneve fetare dhe pushtetit lokal.',img:''},
    {id:6,title:'Bashkatdhetarët ndërtuan shtëpi për familjen e dëshmorit',category:'Lajme',date:'April 10, 2019',body:'Me ndihmën e xhematit të xhamisë Schwamendingen, familja e Fadil Sylejmanit mori shtëpi të re. Ky akt solidariteti tregoi fuqinë e komunitetit tonë.',img:''},
  ],
  nextPostId:7,nextUserId:3
};
let currentUser=null,currentFilter='ALL',editingPostId=null,currentLang='sq';
let prayerTimes={sabah:'05:10',dreka:'13:15',ikindia:'17:00',akshami:'20:35',jacia:'22:10'};

// ═══════════════════════════════════════
//  PERSISTENCE (localStorage)
//  Interim storage until the real backend lands — same shape the
//  future API will use, so swapping it out stays a one-file change.
const STORE_KEY='hdf_state_v1';

function saveState(){
  if(REMOTE)return; // remote mode: Supabase is the source of truth
  try{
    localStorage.setItem(STORE_KEY,JSON.stringify({
      db:DB,
      condolences,
      mediaItems,
      prayerTimes,
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
  if(s.prayerTimes)prayerTimes=s.prayerTimes;
  if(s.sessionUserId!=null)currentUser=DB.users.find(u=>u.id===s.sessionUserId)||null;
  if(s.lang&&s.lang!==currentLang)setLang(s.lang);
}

function applyPrayerTimes(){
  const strip=document.getElementById('prayer-strip');
  const order=['sabah','dreka','ikindia','akshami','jacia'];
  if(strip){
    const items=strip.querySelectorAll('.prayer-item');
    // items[0] is the live clock, prayers start at index 1
    order.forEach((k,i)=>{
      const el=items[i+1]&&items[i+1].querySelector('.prayer-time');
      if(el)el.textContent=prayerTimes[k];
    });
  }
  order.forEach(k=>{
    const inp=document.getElementById('pt-'+k);
    if(inp)inp.value=prayerTimes[k];
  });
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
  const [posts,conds,media,pt]=await Promise.all([
    sb.from('posts').select('*').order('created_at',{ascending:false}),
    sb.from('condolences').select('*').order('created_at',{ascending:false}),
    sb.from('media').select('*').order('created_at',{ascending:true}),
    sb.from('prayer_times').select('*').eq('id',1).maybeSingle(),
  ]);
  if(posts.error)throw posts.error;
  DB.posts=(posts.data||[]).map(p=>({id:p.id,title:p.title,category:p.category,body:p.body,img:p.img||'',date:fmtDateEn(p.created_at)}));
  condolences=(conds.data||[]).map(c=>({id:c.id,name:c.name,born:c.born||'',date:c.died_on||'',city:c.city||'',msg:c.msg||'',funeral:c.funeral||'',postedAt:fmtDateSq(c.created_at)}));
  mediaItems=(media.data||[]).map(m=>({id:m.id,url:m.url,cap:m.caption}));
  if(pt.data)['sabah','dreka','ikindia','akshami','jacia'].forEach(k=>{if(pt.data[k])prayerTimes[k]=pt.data[k];});
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
    'hero-quote-cite':'— Kurani i Shenjtë, El-Huxhurat 49:13',
    'hero-btn1':'Lajmet e Fundit','hero-btn2':'Anëtarësohu',
    'stat1-lbl':'Themeluar','stat2-lbl':'Vjet Shërbim','stat3-lbl':'Shqiptar','stat4-lbl':'Organizata Partnere',
    'pn-sabah':'Sabahu','pn-dreka':'Dreka','pn-ikindia':'Ikindia','pn-akshami':'Akshami','pn-jacia':'Jacia',
    'about-badge':'🕌 Rreth Nesh','about-h2':'Qendra Kulturore<br>Islame Shqiptare',
    'about-p1':'Xhamia "Jugendkulturzentrum Haus des Friedens" është themeluar që nga viti 2004. Është vend ku çdo besimtar ka të drejtë t\'i kryejë ritet e tij fetare.',
    'about-p2':'Shumica e besimtarëve, mbi 90%, janë shqiptarë nga trojet tona etnike – Shqipëria, Kosova, Maqedonia, Lugina e Preshevës.',
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
    'live-label':'Live — Orari i namazit','open-new-tab':'Hap në tab të re','iframe-credit':'Orari shfaqet drejtpërdrejt nga SwissMosque TV',
    'prayer-special-btn':'📥 Ditë dhe netë të mëdha fetare 2026',
    'ps1':'Namazi i Sabahut','ps1-s':'Mëngjes','ps2':'Namazi i Drekës','ps2-s':'Mesdite',
    'ps3':'Namazi i Ikindisë','ps3-s':'Pasdite','ps4':'Namazi i Akshamit','ps4-s':'Mbrëmje','ps5':'Namazi i Jacisë','ps5-s':'Natë','ps6':'Kohët e Namazit Live',
    'don-badge':'💚 Ndihmat Tuaja','don-h2':'Mbështesni Xhaminë Tonë',
    'don-p':'Mbështetja juaj financiare ndihmon xhaminë të vazhdojë shërbimin ndaj komunitetit. Ju jemi mirënjohës për çdo ndihmë!',
    'bank-name-lbl':'Emri','bank-addr-lbl':'Adresa','bank-konto-lbl':'Konto',
    'don-circle-p':'Bamirësi — Sadaka','don-circle-strong':'🤲 Jepni','don-circle-small':'Me zemër të hapur',
    'gallery-badge':'Galeria','gallery-h2':'Galeria e Fotografive',
    'contact-badge':'Kontakti','contact-h2':'Na Kontaktoni','contact-info-h3':'Informacione të Kontaktit',
    'ci-addr-lbl':'Adresa','ci-prayer-lbl':'Koha e Namazeve','ci-prayer-p':'Pesë herë në ditë · Sipas orarit të publikuar',
    'contact-form-h3':'Dërgoni Mesazh','cf-name-lbl':'Emri juaj','cf-msg-lbl':'Mesazhi','contact-send-btn':'Dërgo Mesazhin →',
    'footer-desc':'Kulturzentrum Haus des Friedens – Qendra Kulturore Islame Shqiptare në Zürich Schwamendingen. Themeluar 2004.',
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
    'hero-quote-cite':'— Der Heilige Quran, Al-Hujurat 49:13',
    'hero-btn1':'Aktuelle Neuigkeiten','hero-btn2':'Mitglied werden',
    'stat1-lbl':'Gegründet','stat2-lbl':'Jahre Dienst','stat3-lbl':'Albanischsprachig','stat4-lbl':'Partnerorganisationen',
    'pn-sabah':'Fadschr','pn-dreka':'Dhuhr','pn-ikindia':'Asr','pn-akshami':'Maghrib','pn-jacia':'Ischa',
    'about-badge':'🕌 Über uns','about-h2':'Islamisches<br>Kulturzentrum',
    'about-p1':'Das „Jugendkulturzentrum Haus des Friedens" wurde 2004 gegründet. Es ist ein Ort, an dem jeder Gläubige das Recht hat, seine religiösen Pflichten zu erfüllen.',
    'about-p2':'Die Mehrheit der Gläubigen – über 90% – sind Albaner aus Albanien, Kosovo, Nordmazedonien und dem Presevo-Tal.',
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
    'live-label':'Live — Gebetszeiten','open-new-tab':'In neuem Tab öffnen','iframe-credit':'Die Zeiten werden direkt von SwissMosque TV angezeigt',
    'prayer-special-btn':'📥 Besondere islamische Tage und Nächte 2026',
    'ps1':'Morgengebet (Fadschr)','ps1-s':'Morgen','ps2':'Mittagsgebet (Dhuhr)','ps2-s':'Mittag',
    'ps3':'Nachmittagsgebet (Asr)','ps3-s':'Nachmittag','ps4':'Abendgebet (Maghrib)','ps4-s':'Abend','ps5':'Nachtgebet (Ischa)','ps5-s':'Nacht','ps6':'Gebetszeiten Live',
    'don-badge':'💚 Ihre Spende','don-h2':'Unterstützen Sie unsere Moschee',
    'don-p':'Ihre finanzielle Unterstützung hilft der Moschee, weiterhin der Gemeinschaft zu dienen. Wir sind für jede Hilfe dankbar!',
    'bank-name-lbl':'Name','bank-addr-lbl':'Adresse','bank-konto-lbl':'Konto',
    'don-circle-p':'Wohltätigkeit — Sadaqa','don-circle-strong':'🤲 Spenden','don-circle-small':'Von ganzem Herzen',
    'gallery-badge':'Galerie','gallery-h2':'Fotogalerie',
    'contact-badge':'Kontakt','contact-h2':'Kontaktieren Sie uns','contact-info-h3':'Kontaktinformationen',
    'ci-addr-lbl':'Adresse','ci-prayer-lbl':'Gebetszeiten','ci-prayer-p':'Fünfmal täglich · Gemäß veröffentlichtem Zeitplan',
    'contact-form-h3':'Nachricht senden','cf-name-lbl':'Ihr Name','cf-msg-lbl':'Ihre Nachricht','contact-send-btn':'Nachricht absenden →',
    'footer-desc':'Kulturzentrum Haus des Friedens – Islamisches Kulturzentrum in Zürich Schwamendingen. Gegründet 2004.',
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

function setLang(lang){
  if(currentLang===lang)return;
  currentLang=lang;
  document.documentElement.lang=lang==='sq'?'sq':'de';
  ['btn-sq','btn-de','mob-btn-sq','mob-btn-de'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.classList.toggle('active',id.includes(lang));
  });
  const htmlIds=['hero-h1','about-h2','about-card-lbl'];
  Object.entries(T[lang]).forEach(([id,val])=>{
    const el=document.getElementById(id);if(!el)return;
    el.style.transition='opacity .16s';el.style.opacity='0';
    setTimeout(()=>{
      if(htmlIds.includes(id))el.innerHTML=val;else el.textContent=val;
      el.style.opacity='1';
    },160);
  });
  document.querySelectorAll('[data-sq]').forEach(el=>{
    const v=el.getAttribute('data-'+lang);
    if(v){el.style.transition='opacity .16s';el.style.opacity='0';setTimeout(()=>{el.textContent=v;el.style.opacity='1';},160);}
  });
  if(currentUser){
    const w=document.getElementById('member-welcome');
    if(w)w.textContent=(lang==='de'?'Willkommen, ':'Mirë se vini, ')+currentUser.name.split(' ')[0]+'!';
  }
  try{localStorage.setItem('hdf_lang',lang);}catch(e){}
  saveState();
}

// AUTH
async function doLogin(){
  const email=document.getElementById('login-email').value.trim();
  const pass=document.getElementById('login-pass').value;
  if(REMOTE){
    const {data,error}=await sb.auth.signInWithPassword({email,password:pass});
    if(error){showToast(currentLang==='de'?'Falsche E-Mail oder Passwort!':'Email ose fjalëkalim i gabuar!','error');return;}
    await setUserFromSession(data.user);
    closeModal('auth-modal');updateAuthUI();
    if(document.getElementById('page-member').classList.contains('active'))renderMemberArea();
    showToast((currentLang==='de'?'Willkommen, ':'Mirë se vini, ')+currentUser.name+'!','success');
    return;
  }
  const user=DB.users.find(u=>u.email===email&&u.password===pass);
  if(!user){showToast(currentLang==='de'?'Falsche E-Mail oder Passwort!':'Email ose fjalëkalim i gabuar!','error');return;}
  currentUser=user;closeModal('auth-modal');updateAuthUI();saveState();
  showToast((currentLang==='de'?'Willkommen, ':'Mirë se vini, ')+user.name+'!','success');
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
function doLogout(){
  if(REMOTE)sb.auth.signOut();
  currentUser=null;updateAuthUI();saveState();navigate('home');
  showToast(currentLang==='de'?'Erfolgreich abgemeldet.':'U dilët nga llogaria.','');
}
function updateAuthUI(){
  const area=document.getElementById('auth-nav-area');
  if(currentUser){
    area.innerHTML=`<div style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="navigate('member')"><div class="user-avatar">${currentUser.name.charAt(0)}</div><span style="font-size:13px;font-weight:600;color:var(--ink)">${currentUser.name.split(' ')[0]}</span></div>`;
  }else{
    area.innerHTML=`<button class="btn btn-outline" onclick="openModal('auth-modal')" style="padding:8px 18px;font-size:13px">${currentLang==='de'?'Anmelden':'Hyrja'}</button>`;
  }
}

// NEWS
function newsCard(p){
  return `<div class="news-card" onclick="openNewsModal(${p.id})">
    <div class="news-card-img">${p.img?`<img src="${p.img}" alt="${p.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=news-card-img-placeholder>📰</div>'">`:'<div class="news-card-img-placeholder">📰</div>'}</div>
    <div class="news-card-body">
      <div class="news-card-meta"><span class="news-card-cat">${p.category}</span><span class="news-card-date">${p.date}</span></div>
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
function openNewsModal(id){
  const p=DB.posts.find(x=>x.id===id);if(!p)return;
  document.getElementById('news-modal-content').innerHTML=`
    ${p.img?`<img src="${p.img}" alt="${p.title}" style="width:100%;height:260px;object-fit:cover;border-radius:10px;margin-bottom:20px" onerror="this.style.display='none'">`:''}
    <div class="news-card-meta" style="margin-bottom:10px"><span class="news-card-cat">${p.category}</span><span class="news-card-date">${p.date}</span></div>
    <h2 style="font-size:22px;color:var(--green);margin-bottom:14px">${p.title}</h2>
    <div style="color:var(--ink-mid);font-size:15px;line-height:1.8">${p.body.replace(/\n/g,'<br>')}</div>`;
  openModal('news-modal');
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

function renderMediaTab(){
  const grid=document.getElementById('media-grid');if(!grid)return;
  grid.innerHTML=mediaItems.map((m,i)=>`
    <div class="media-thumb">
      <img src="${m.url}" alt="${m.cap}" onerror="this.style.display='none'">
      <div class="media-thumb-overlay">
        <button class="media-thumb-del" onclick="deleteMediaItem(${i})">🗑️ Fshi</button>
        <span style="color:white;font-size:11px;font-weight:600;opacity:0;transition:opacity .2s" class="media-cap">${m.cap}</span>
      </div>
    </div>`).join('');
  grid.querySelectorAll('.media-thumb').forEach(el=>{
    el.addEventListener('mouseenter',()=>el.querySelector('.media-cap').style.opacity='1');
    el.addEventListener('mouseleave',()=>el.querySelector('.media-cap').style.opacity='0');
  });
}

async function addMediaItem(){
  const url=document.getElementById('media-url-input').value.trim();
  const cap=document.getElementById('media-caption-input').value.trim()||'Foto';
  if(!url){showToast('Fut URL-në e fotos!','error');return;}
  if(REMOTE){
    const {error}=await sb.from('media').insert({url,caption:cap});
    if(error){showToast('Gabim: '+error.message,'error');return;}
    await remoteLoadAll();
  }else{
    mediaItems.push({url,cap});saveState();
  }
  document.getElementById('media-url-input').value='';
  document.getElementById('media-caption-input').value='';
  renderMediaTab();
  showToast('Foto u shtua në galeri!','success');
}

async function deleteMediaItem(i){
  if(!confirm('Fshi këtë foto?'))return;
  if(REMOTE){
    const it=mediaItems[i];
    const {error}=await sb.from('media').delete().eq('id',it.id);
    if(error){showToast('Gabim: '+error.message,'error');return;}
  }
  mediaItems.splice(i,1);saveState();renderMediaTab();
  showToast('Foto u fshi.','');
}

async function savePrayerTimes(){
  ['sabah','dreka','ikindia','akshami','jacia'].forEach(k=>{
    const inp=document.getElementById('pt-'+k);
    if(inp&&inp.value)prayerTimes[k]=inp.value;
  });
  if(REMOTE){
    const {error}=await sb.from('prayer_times').upsert({id:1,...prayerTimes,updated_at:new Date().toISOString()});
    if(error){showToast('Gabim: '+error.message,'error');return;}
  }
  applyPrayerTimes();
  saveState();
  const msg=document.getElementById('pt-saved-msg');
  msg.style.display='block';setTimeout(()=>msg.style.display='none',3500);
  showToast('Kohët e namazit u përditësuan!','success');
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

// CONTACT
function sendContact(){
  const n=document.getElementById('cf-name').value,e=document.getElementById('cf-email').value,m=document.getElementById('cf-msg').value;
  if(!n||!e||!m){showToast(currentLang==='de'?'Alle Felder ausfüllen!':'Plotësoni të gjitha fushat!','error');return;}
  showToast(currentLang==='de'?'Nachricht gesendet!':'Mesazhi u dërgua!','success');
  ['cf-name','cf-email','cf-msg'].forEach(id=>document.getElementById(id).value='');
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
  } else {
    ['cond-name','cond-born','cond-city','cond-msg','cond-funeral'].forEach(i => document.getElementById(i).value = '');
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
    postedAt: new Date().toLocaleDateString('sq-AL', {day:'numeric',month:'long',year:'numeric'}),
  };
  if (REMOTE) {
    const row = { name: data.name, born: data.born, died_on: data.date || null, city: data.city, msg: data.msg, funeral: data.funeral };
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
        <div style="font-size:28px">🕊️</div>
        <div><h3>${c.name}</h3><p>${c.born ? c.born + ' – ' : ''}${c.date ? new Date(c.date).toLocaleDateString('sq-AL',{day:'numeric',month:'long',year:'numeric'}) : ''} ${c.city ? '· ' + c.city : ''}</p></div>
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
        <div style="font-size:32px">🕊️</div>
        <div><h3>${c.name}</h3><p>${c.born ? c.born + ' – ' : ''}${c.date ? new Date(c.date).toLocaleDateString('sq-AL',{day:'numeric',month:'long',year:'numeric'}) : ''} ${c.city ? '· ' + c.city : ''}</p></div>
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

// ── ACTIVITY IMAGE UPLOAD ──
function triggerImgUpload(accIdx) {
  const gallery = document.getElementById('acc-gallery-' + accIdx);
  if (!gallery) return;
  const input = gallery.querySelector('.hidden-file-input');
  if (input) input.click();
}
function handleActivityImgUpload(event, accIdx) {
  const files = event.target.files;
  if (!files || !files.length) return;
  const gallery = document.getElementById('acc-gallery-' + accIdx);
  const uploadBtn = gallery.querySelector('.acc-img-upload');
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt = 'Aktivitet';
      img.style.cssText = 'width:140px;height:100px;object-fit:cover;border-radius:10px;transition:transform .25s;cursor:pointer;animation:fadeInScale .3s ease';
      img.title = 'Kliko për ta fshirë';
      img.onclick = () => { if (confirm('Fshi këtë foto?')) img.remove(); };
      gallery.insertBefore(img, uploadBtn);
    };
    reader.readAsDataURL(file);
  });
  showToast('📸 ' + files.length + ' foto u shtua!', 'success');
  event.target.value = '';
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
  if (name === 'media')        renderMediaTab();
}

// ── SCROLL REVEAL ──
function initScrollReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.07 });
  document.querySelectorAll('.news-card,.activity-card,.acc-item,.g-item,.contact-item,.about-grid,.donations-inner').forEach(el => {
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
      console.warn('Backend i paarritshëm — kalim në modalitetin lokal demo:',e);
      loadState();
    }
  }else{
    loadState();
  }
  try{
    const l=localStorage.getItem('hdf_lang');
    if(l&&l!==currentLang)setLang(l);
  }catch(e){}
  applyPrayerTimes();
  updateAuthUI();
  renderHomeNews();
  renderCondolencesPublic();
  if(document.getElementById('page-member').classList.contains('active'))renderMemberArea();
}
initApp();
initSlideshow();
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

