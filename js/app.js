const PRIZE_ORDER={"Grand Prix":0,"Ouro":1,"Prata":2,"Bronze":3,"Titanium Lion":4};
const FLAG={"EUA":"🇺🇸","Reino Unido":"🇬🇧","Brasil":"🇧🇷","França":"🇫🇷","Canadá":"🇨🇦","Itália":"🇮🇹","Singapura":"🇸🇬","México":"🇲🇽","Alemanha":"🇩🇪","Peru":"🇵🇪","Suécia":"🇸🇪","Emirados Árabes":"🇦🇪","Argentina":"🇦🇷","Japão":"🇯🇵","Espanha":"🇪🇸","Colômbia":"🇨🇴","Porto Rico":"🇵🇷","Tailândia":"🇹🇭","Austrália":"🇦🇺","Polônia":"🇵🇱","África do Sul":"🇿🇦","Nova Zelândia":"🇳🇿","Índia":"🇮🇳","China":"🇨🇳","Noruega":"🇳🇴","Países Baixos":"🇳🇱","Paraguai":"🇵🇾","Arábia Saudita":"🇸🇦","Coreia do Sul":"🇰🇷","Suíça":"🇨🇭","Bélgica":"🇧🇪","Finlândia":"🇫🇮","Dinamarca":"🇩🇰","Islândia":"🇮🇸","Grécia":"🇬🇷","Quênia":"🇰🇪","Hong Kong":"🇭🇰","Romênia":"🇷🇴","Croácia":"🇭🇷","República Checa":"🇨🇿","Chinese Taipei":"🇹🇼","Indonésia":"🇮🇩","Equador":"🇪🇨","Malta":"🇲🇹","Ucrânia":"🇺🇦","Bósnia e Herzegovina":"🇧🇦","Portugal":"🇵🇹"};

function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function isSafeUrl(url){try{const u=new URL(url);return u.protocol==="https:"||u.protocol==="http:";}catch{return false;}}
function hostname(url){try{return new URL(url).hostname.replace(/^www\./,"");}catch{return"";}}

DATA.forEach(d=>{d._search=(d.peca+" "+d.marca+" "+d.agencia+" "+d.pais+" "+d.categoria).toLowerCase();});

let state={grupo:null,categoria:null,prize:"",q:"",topPeca:null};

// --- Theme ---
function getTheme(){
  return localStorage.getItem("theme")||"light";
}
function applyTheme(theme){
  document.documentElement.setAttribute("data-theme",theme);
  localStorage.setItem("theme",theme);
  const icon=document.getElementById("themeIcon");
  icon.innerHTML=theme==="dark"
    ?'<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'
    :'<path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>';
}
applyTheme(getTheme());
document.getElementById("themeToggle").addEventListener("click",()=>{
  applyTheme(getTheme()==="dark"?"light":"dark");
});

// --- i18n: detect by IP then apply ---
function initLang(){
  const saved=localStorage.getItem("lang");
  if(saved&&I18N[saved]){applyLang(saved);buildUI();return;}
  buildUI();
  fetch("https://ipapi.co/json/",{signal:AbortSignal.timeout(3000)})
    .then(r=>r.json())
    .then(d=>{
      const cc=(d.country_code||"").toUpperCase();
      const ptCountries=["BR","PT","AO","MZ","CV","GW","TL","ST"];
      const lang=ptCountries.includes(cc)?"pt":"en";
      if(lang!==currentLang){applyLang(lang);buildUI();}
    })
    .catch(()=>{
      const lang=detectLang();
      if(lang!==currentLang){applyLang(lang);buildUI();}
    });
}

function updateLangBtn(){
  const btn=document.getElementById("langToggle");
  if(currentLang==="pt"){btn.innerHTML='<span class="flag">🇧🇷</span> PT';}
  else{btn.innerHTML='<span class="flag">🇺🇸</span> EN';}
}

document.getElementById("langToggle").addEventListener("click",()=>{
  const next=currentLang==="pt"?"en":"pt";
  applyLang(next);
  buildUI();
});

// --- Static text updates ---
function updateStaticTexts(){
  document.querySelector(".brand .kick").textContent=t("kick");
  document.getElementById("homeLink").innerHTML=t("heading");
  document.getElementById("homeLink").title=t("headingTitle");
  document.getElementById("search").placeholder=t("searchPlaceholder");
  document.querySelector('.chip[data-prize=""]').textContent=t("filterAll");
  document.querySelector(".site-foot .disc").textContent=t("disclaimer");
  document.getElementById("privacyLink").textContent=t("privacyLink");
  document.querySelector(".site-foot .foot-links span:last-child").textContent=t("footLabel");
  document.querySelector(".psheet h3").textContent=t("privacyTitle");
  const ps=document.querySelectorAll(".psheet p");
  ps[0].textContent=t("privacyP1");
  ps[1].innerHTML=t("privacyP2");
  ps[2].innerHTML=t("privacyP3");
  ps[3].innerHTML=t("privacyP4");
  ps[4].textContent=t("privacyMeta");
  document.getElementById("pcloseBottom").textContent=t("closeBtn");
  const emptyEl=document.getElementById("empty");
  emptyEl.innerHTML="<b>"+esc(t("emptyTitle"))+"</b>"+esc(t("emptyDesc"))+'<button class="clear-btn" id="clearFilters">'+esc(t("clearFilters"))+"</button>";
  document.getElementById("clearFilters").addEventListener("click",goHome);
  document.querySelector(".sr-only").textContent=t("title");
  document.querySelector(".skip-link").textContent=t("skipLink");
  const bioP=document.querySelector("#sidebarBio p");
  if(bioP) bioP.innerHTML=t("bioText");
}

// --- Build nav ---
function rebuildNav(){
  const nav=document.getElementById("nav");
  nav.innerHTML="";
  const groups={};
  DATA.forEach(d=>{(groups[d.grupo]=groups[d.grupo]||{})[d.categoria]=(groups[d.grupo][d.categoria]||0)+1;});

  const homeItem=document.createElement("button");
  homeItem.className="nav-home";
  homeItem.id="navHome";
  homeItem.innerHTML=`<span>${esc(t("homeNav"))}</span><span class="hc">${DATA.length}</span>`;
  nav.appendChild(homeItem);
  homeItem.addEventListener("click",goHome);

  let gi=0;
  for(const g in groups){
    gi++;
    const tot=Object.values(groups[g]).reduce((a,b)=>a+b,0);
    const wrap=document.createElement("div");wrap.className="nav-group";
    const cats=Object.entries(groups[g]).map(([c,n])=>
      `<a data-g="${esc(g)}" data-c="${esc(c)}"><span>${esc(c)}</span><span class="c">${n}</span></a>`).join("");
    wrap.innerHTML=`<button data-g="${esc(g)}" aria-expanded="false"><span class="gnum">${String(gi).padStart(2,"0")}</span>
      <span class="gname">${esc(g)}</span><span class="gcount">${tot}</span></button>
      <div class="nav-cats">
        <a class="all" data-g="${esc(g)}" data-c=""><span>${esc(t("allOf"))} ${esc(g)}</span><span class="c">${tot}</span></a>
        ${cats}</div>`;
    nav.appendChild(wrap);
  }

  // Top 10 Most Awarded
  const counts={};
  DATA.forEach(d=>{
    const key=d.peca+"|||"+d.marca;
    if(!counts[key]) counts[key]={peca:d.peca,marca:d.marca,total:0};
    counts[key].total++;
  });
  const top10=Object.values(counts).sort((a,b)=>b.total-a.total).slice(0,10);
  const topWrap=document.createElement("div");topWrap.className="nav-top10";
  topWrap.innerHTML=`<div class="top10-title">${esc(t("topAwarded"))}</div>`
    +top10.map((p,i)=>`<a class="top10-item" data-peca="${esc(p.peca)}" data-marca="${esc(p.marca)}"><span class="top10-rank">${i+1}</span><span class="top10-name">${esc(p.peca)}</span><span class="top10-count">${p.total}</span></a>`).join("");
  nav.appendChild(topWrap);

  document.querySelector(".brand .count").innerHTML=`<b>${DATA.length}</b>${t("countSuffix")}`;
  updateNavActiveIndicators();
}

function updateNavActiveIndicators(){
  document.querySelectorAll(".nav-group").forEach(g=>{
    const hasActive=g.querySelector(".nav-cats a.active");
    g.classList.toggle("has-active",!!hasActive);
  });
}

// Nav interactions (delegated)
document.getElementById("nav").addEventListener("click",e=>{
  const gb=e.target.closest(".nav-group>button");
  const ca=e.target.closest(".nav-cats a");
  const tp=e.target.closest(".top10-item");
  if(gb){
    const isOpen=gb.parentElement.classList.toggle("open");
    gb.setAttribute("aria-expanded",isOpen);
  }
  if(ca){
    document.querySelectorAll(".nav-cats a").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".top10-item").forEach(x=>x.classList.remove("active"));
    ca.classList.add("active");
    state.grupo=ca.dataset.g;
    state.categoria=ca.dataset.c||null;
    state.topPeca=null;
    updateNavActiveIndicators();
    render();closeMob();
    scrollToContent();
  }
  if(tp){
    document.querySelectorAll(".nav-cats a").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".top10-item").forEach(x=>x.classList.remove("active"));
    tp.classList.add("active");
    state.grupo=null;state.categoria=null;state.q="";state.prize="";
    state.topPeca={peca:tp.dataset.peca,marca:tp.dataset.marca};
    document.getElementById("search").value="";
    document.querySelectorAll(".chip").forEach(x=>{x.classList.remove("on");x.setAttribute("aria-pressed","false");});
    document.querySelector('.chip[data-prize=""]').classList.add("on");
    document.querySelector('.chip[data-prize=""]').setAttribute("aria-pressed","true");
    updateNavActiveIndicators();
    render();closeMob();
    scrollToContent();
  }
});

// Filters
document.getElementById("filters").addEventListener("click",e=>{
  const c=e.target.closest(".chip");if(!c)return;
  document.querySelectorAll(".chip").forEach(x=>{x.classList.remove("on");x.setAttribute("aria-pressed","false");});
  c.classList.add("on");c.setAttribute("aria-pressed","true");
  state.prize=c.dataset.prize;
  render();
  scrollToContent();
});

function scrollToContent(){
  const el=document.getElementById("crumb");
  if(el) el.scrollIntoView({behavior:"smooth",block:"start"});
}

// Home / Clear filters
function goHome(){
  state={grupo:null,categoria:null,prize:"",q:"",topPeca:null};
  document.getElementById("search").value="";
  document.querySelectorAll(".chip").forEach(x=>{x.classList.remove("on");x.setAttribute("aria-pressed","false");});
  document.querySelectorAll(".top10-item").forEach(x=>x.classList.remove("active"));
  document.querySelector('.chip[data-prize=""]').classList.add("on");
  document.querySelector('.chip[data-prize=""]').setAttribute("aria-pressed","true");
  document.querySelectorAll(".nav-cats a").forEach(x=>x.classList.remove("active"));
  updateNavActiveIndicators();
  render();window.scrollTo({top:0,behavior:"smooth"});closeMob();
}
document.getElementById("homeLink").addEventListener("click",goHome);

// Search
let searchTimer;
document.getElementById("search").addEventListener("input",e=>{
  const val=e.target.value;
  clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.q=val.trim().toLowerCase();render();},120);
});

// Cached elements
const dataIndex=new Map(DATA.map((d,i)=>[d,i]));
const elCrumb=document.getElementById("crumb");
const elTitle=document.getElementById("title");
const elLede=document.getElementById("lede");
const elResultN=document.getElementById("resultN");
const elList=document.getElementById("list");
const elEmpty=document.getElementById("empty");

function render(){
  const elNavHome=document.getElementById("navHome");
  let list=DATA.filter(d=>{
    if(state.topPeca){return d.peca===state.topPeca.peca&&d.marca===state.topPeca.marca;}
    if(state.grupo&&d.grupo!==state.grupo)return false;
    if(state.categoria&&d.categoria!==state.categoria)return false;
    if(state.prize&&d.premio!==state.prize)return false;
    if(state.q&&!d._search.includes(state.q))return false;
    return true;
  });
  list.sort((a,b)=>(PRIZE_ORDER[a.premio]-PRIZE_ORDER[b.premio])||a.peca.localeCompare(b.peca));

  if(state.topPeca){elCrumb.innerHTML=`${esc(t("topAwarded"))} / <b>${esc(state.topPeca.marca)}</b>`;elTitle.textContent=state.topPeca.peca;}
  else if(state.categoria){elCrumb.innerHTML=`${esc(state.grupo)} / <b>${esc(state.categoria)}</b>`;elTitle.textContent=state.categoria;}
  else if(state.grupo){elCrumb.innerHTML=`<b>${esc(state.grupo)}</b>`;elTitle.textContent=state.grupo;}
  else if(state.q){elCrumb.textContent=t("search");elTitle.textContent=`${t("searchFor")} "${state.q}"`;}
  else if(state.prize){elCrumb.innerHTML=`${esc(t("byTrophy"))} / <b>${esc(state.prize)}</b>`;elTitle.textContent=`${t("allOfPrize")} ${state.prize}`;}
  else{elCrumb.textContent=t("allGroups");elTitle.textContent=t("allPieces");}

  let gp=0;
  for(let i=0;i<list.length;i++)if(list[i].premio==="Grand Prix")gp++;
  const pWord=list.length>1?t("pieces"):t("pieceSingular");
  elLede.textContent=list.length?`${list.length} ${pWord}`+(gp?` · ${gp} Grand Prix`:"")+`.`:t("lede");
  elResultN.textContent=list.length?`${list.length}`:"";

  const onHome=!state.grupo&&!state.categoria;
  if(elNavHome) elNavHome.classList.toggle("active",onHome);

  elEmpty.style.display=list.length?"none":"block";
  if(!list.length){elList.innerHTML="";return;}

  const extSvg=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M9 7h8v8"/></svg>`;
  const agLabel=t("agency");
  const head=`<div class="row-head" role="row">
    <span role="columnheader">${esc(t("piece"))}</span><span role="columnheader">${esc(t("brand"))}</span><span role="columnheader">${esc(agLabel)}</span><span role="columnheader">${esc(t("country"))}</span><span role="columnheader">${esc(t("category"))}</span><span role="columnheader">${esc(t("prize"))}</span><span role="columnheader"></span></div>`;

  elList.style.animation="none";
  elList.offsetHeight;
  elList.style.animation="";

  elList.innerHTML=head+list.map(d=>{
    const idx=dataIndex.get(d);
    const isExt=d.embed==="external";
    const label=isExt?t("viewCase"):t("watch");
    const cls=isExt?"watch ext-btn":"watch";
    const host=d.link?hostname(d.link):"";
    const tip=host?` title="${esc(host)}"`:"";
    const flagEmoji=FLAG[d.pais]||"";
    const flagHtml=flagEmoji?`<span class="flag-emoji">${flagEmoji}</span>`:"";
    return `<div class="lrow" role="row">
      <div class="c-peca" role="cell">${esc(d.peca)}</div>
      <div class="c-marca" role="cell">${esc(d.marca)}</div>
      <div class="c-ag" role="cell" data-label="${esc(agLabel)}">${esc(d.agencia)}</div>
      <div class="c-pais" role="cell">${flagHtml} <span>${esc(d.pais)}</span></div>
      <div class="c-cat" role="cell">${esc(d.categoria)}</div>
      <div class="c-prize" role="cell"><span class="pz" data-p="${esc(d.premio)}">${esc(d.premio)}</span></div>
      <button class="${cls}" data-i="${idx}"${tip}>${esc(label)} ${extSvg}</button></div>`;
  }).join("");
}

// Watch button -> open link
document.getElementById("list").addEventListener("click",e=>{
  const btn=e.target.closest(".watch");if(!btn)return;
  const d=DATA[+btn.dataset.i];
  if(d.link&&isSafeUrl(d.link)) window.open(d.link,"_blank","noopener");
});

// Mobile nav
const sidebar=document.getElementById("sidebar"),scrim=document.getElementById("scrim");
const mobToggleBtn=document.getElementById("mobtoggle");
mobToggleBtn.addEventListener("click",()=>{
  sidebar.classList.add("show");scrim.classList.add("show");
  mobToggleBtn.setAttribute("aria-expanded","true");
});
function closeMob(){
  sidebar.classList.remove("show");scrim.classList.remove("show");
  mobToggleBtn.setAttribute("aria-expanded","false");
  mobToggleBtn.focus();
}
scrim.onclick=closeMob;

// Privacy modal with focus trap
const pmodal=document.getElementById("pmodal");
let lastFocusedElement;
function openPrivacy(){
  lastFocusedElement=document.activeElement;
  pmodal.classList.add("open");
  document.body.style.overflow="hidden";
  const firstFocusable=pmodal.querySelector("button");
  if(firstFocusable) firstFocusable.focus();
}
function closePrivacy(){
  pmodal.classList.remove("open");
  document.body.style.overflow="";
  if(lastFocusedElement) lastFocusedElement.focus();
}
pmodal.addEventListener("keydown",e=>{
  if(e.key!=="Tab") return;
  const focusable=pmodal.querySelectorAll('button,a[href],[tabindex]:not([tabindex="-1"])');
  if(!focusable.length) return;
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey){
    if(document.activeElement===first){e.preventDefault();last.focus();}
  }else{
    if(document.activeElement===last){e.preventDefault();first.focus();}
  }
});
document.getElementById("privacyLink").addEventListener("click",e=>{e.preventDefault();openPrivacy();});
document.getElementById("pclose").addEventListener("click",closePrivacy);
document.getElementById("pcloseBottom").addEventListener("click",closePrivacy);
pmodal.addEventListener("click",e=>{if(e.target===pmodal)closePrivacy();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&pmodal.classList.contains("open"))closePrivacy();});

// --- Init ---
function buildUI(){
  updateLangBtn();
  rebuildNav();
  updateStaticTexts();
  render();
}
initLang();
