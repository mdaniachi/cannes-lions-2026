const PRIZE_ORDER={"Grand Prix":0,"Ouro":1,"Prata":2,"Bronze":3,"Titanium Lion":4};
const FLAG={"EUA":"🇺🇸","Reino Unido":"🇬🇧","Brasil":"🇧🇷","França":"🇫🇷","Canadá":"🇨🇦","Itália":"🇮🇹","Singapura":"🇸🇬","México":"🇲🇽","Alemanha":"🇩🇪","Peru":"🇵🇪","Suécia":"🇸🇪","Emirados Árabes":"🇦🇪","Argentina":"🇦🇷","Japão":"🇯🇵","Espanha":"🇪🇸","Colômbia":"🇨🇴","Porto Rico":"🇵🇷","Tailândia":"🇹🇭","Austrália":"🇦🇺","Polônia":"🇵🇱","África do Sul":"🇿🇦","Nova Zelândia":"🇳🇿","Índia":"🇮🇳","China":"🇨🇳","Noruega":"🇳🇴","Países Baixos":"🇳🇱","Paraguai":"🇵🇾","Arábia Saudita":"🇸🇦","Coreia do Sul":"🇰🇷","Suíça":"🇨🇭","Bélgica":"🇧🇪","Finlândia":"🇫🇮","Dinamarca":"🇩🇰","Islândia":"🇮🇸","Grécia":"🇬🇷","Quênia":"🇰🇪","Hong Kong":"🇭🇰","Romênia":"🇷🇴","Croácia":"🇭🇷","República Checa":"🇨🇿","Chinese Taipei":"🇹🇼","Indonésia":"🇮🇩","Equador":"🇪🇨","Malta":"🇲🇹","Ucrânia":"🇺🇦","Bósnia e Herzegovina":"🇧🇦","Portugal":"🇵🇹"};

function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function isSafeUrl(url){try{const u=new URL(url);return u.protocol==="https:"||u.protocol==="http:";}catch{return false;}}
function hostname(url){try{return new URL(url).hostname.replace(/^www\./,"");}catch{return"";}}
const enc=encodeURIComponent, dec=s=>{try{return decodeURIComponent(s);}catch{return s;}};
function cssEsc(s){return String(s).replace(/(["\\])/g,"\\$1");}

DATA.forEach(d=>{d._search=(d.peca+" "+d.marca+" "+d.agencia+" "+d.pais+" "+d.categoria).toLowerCase();});

// Group→categories map (for route validation) + unique lists (for autocomplete)
const GROUPS={};
const UNIQUE={brands:[],countries:[],agencies:[]};
(function(){
  const b=new Set(),c=new Set(),a=new Set();
  DATA.forEach(d=>{
    (GROUPS[d.grupo]=GROUPS[d.grupo]||new Set()).add(d.categoria);
    b.add(d.marca);c.add(d.pais);a.add(d.agencia);
  });
  UNIQUE.brands=[...b];UNIQUE.countries=[...c];UNIQUE.agencies=[...a];
})();

// state.view: null | 'top' | 'favorites' | 'stats'; state.piece: index | null
let state={grupo:null,categoria:null,prize:"",q:"",topPeca:null,view:null,piece:null};

const extSvg=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M9 7h8v8"/></svg>`;
const starSvg=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3.2l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3 9.6l6-.9z"/></svg>`;
const shareSvg=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.5 10.7l7-4M8.5 13.3l7 4"/></svg>`;

// --- Favorites ---
function getFavs(){try{return JSON.parse(localStorage.getItem("favs")||"[]").filter(i=>Number.isInteger(i)&&DATA[i]);}catch{return[];}}
function setFavs(a){localStorage.setItem("favs",JSON.stringify(a));}
function isFav(i){return getFavs().includes(i);}
function toggleFav(i){const a=getFavs();const k=a.indexOf(i);if(k>=0)a.splice(k,1);else a.push(i);setFavs(a);}
function updateFavCount(){const el=document.getElementById("favCount");if(el)el.textContent=getFavs().length||"";}

// --- Theme ---
function getTheme(){return localStorage.getItem("theme")||"light";}
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
  document.querySelector("#pmodal .psheet h3").textContent=t("privacyTitle");
  const ps=document.querySelectorAll("#pmodal .psheet p");
  ps[0].textContent=t("privacyP1");
  ps[1].innerHTML=t("privacyP2");
  ps[2].innerHTML=t("privacyP3");
  ps[3].innerHTML=t("privacyP4");
  ps[4].textContent=t("privacyMeta");
  document.getElementById("welcomeTitle").textContent=t("welcomeTitle");
  document.getElementById("welcomeP1").innerHTML=t("welcomeP1");
  document.getElementById("welcomeP2").innerHTML=t("welcomeP2");
  document.getElementById("welcomeSign").innerHTML=t("welcomeSign");
  document.getElementById("welcomeCloseBottom").textContent=t("welcomeBtn");
  document.getElementById("pcloseBottom").textContent=t("closeBtn");
  const rl=document.querySelector(".rand-label");if(rl)rl.textContent=t("random");
  const rb=document.getElementById("randomBtn");if(rb){rb.setAttribute("aria-label",t("random"));rb.title=t("random");}
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

  const topBtn=document.createElement("button");
  topBtn.className="nav-top";topBtn.id="navTop";
  topBtn.innerHTML=`<span>${esc(t("topAwarded"))}</span><span class="hc">10</span>`;
  nav.appendChild(topBtn);

  const statsBtn=document.createElement("button");
  statsBtn.className="nav-top";statsBtn.id="navStats";
  statsBtn.innerHTML=`<span>${esc(t("stats"))}</span><span class="hc">↗</span>`;
  nav.appendChild(statsBtn);

  const favBtn=document.createElement("button");
  favBtn.className="nav-top";favBtn.id="navFav";
  favBtn.innerHTML=`<span>${esc(t("favorites"))}</span><span class="hc" id="favCount">${getFavs().length||""}</span>`;
  nav.appendChild(favBtn);

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
  const topNav=e.target.closest("#navTop");
  const statsNav=e.target.closest("#navStats");
  const favNav=e.target.closest("#navFav");
  if(gb){
    const isOpen=gb.parentElement.classList.toggle("open");
    gb.setAttribute("aria-expanded",isOpen);
  }
  if(ca){
    document.querySelectorAll(".nav-cats a").forEach(x=>x.classList.remove("active"));
    ca.classList.add("active");
    state={grupo:ca.dataset.g,categoria:ca.dataset.c||null,prize:"",q:"",topPeca:null,view:null,piece:null};
    document.getElementById("search").value="";
    clearChipsToAll();
    updateNavActiveIndicators();
    render();closeMob();updateHash(false);scrollToContent();
  }
  if(topNav) setView("top");
  if(statsNav) setView("stats");
  if(favNav) setView("favorites");
});

function setView(v){
  document.querySelectorAll(".nav-cats a").forEach(x=>x.classList.remove("active"));
  state={grupo:null,categoria:null,prize:"",q:"",topPeca:null,view:v,piece:null};
  document.getElementById("search").value="";
  clearChipsToAll();
  updateNavActiveIndicators();
  render();closeMob();updateHash(false);scrollToContent();
}

// Filters
document.getElementById("filters").addEventListener("click",e=>{
  const c=e.target.closest(".chip");if(!c)return;
  document.querySelectorAll(".chip").forEach(x=>{x.classList.remove("on");x.setAttribute("aria-pressed","false");});
  c.classList.add("on");c.setAttribute("aria-pressed","true");
  state.prize=c.dataset.prize;
  if(state.view||state.piece!=null){state.view=null;state.piece=null;state.topPeca=null;}
  render();updateHash(false);scrollToContent();
});

function scrollToContent(){
  const el=document.getElementById("crumb");
  if(el) el.scrollIntoView({behavior:"smooth",block:"start"});
}

function clearChipsToAll(){
  document.querySelectorAll(".chip").forEach(x=>{x.classList.remove("on");x.setAttribute("aria-pressed","false");});
  const all=document.querySelector('.chip[data-prize=""]');all.classList.add("on");all.setAttribute("aria-pressed","true");
}
function clearNavActive(){
  document.querySelectorAll(".nav-cats a").forEach(x=>x.classList.remove("active"));
  updateNavActiveIndicators();
}

// Home / Clear filters
function goHome(){
  state={grupo:null,categoria:null,prize:"",q:"",topPeca:null,view:null,piece:null};
  document.getElementById("search").value="";
  clearChipsToAll();clearNavActive();
  render();updateHash(false);window.scrollTo({top:0,behavior:"smooth"});closeMob();
}
document.getElementById("homeLink").addEventListener("click",goHome);

// Navigate helpers (used by stats + autocomplete)
function navigateGroupCat(g,c){
  if(!GROUPS[g])return;
  state={grupo:g,categoria:(c&&GROUPS[g].has(c))?c:null,prize:"",q:"",topPeca:null,view:null,piece:null};
  document.getElementById("search").value="";
  clearChipsToAll();
  syncControlsFromState();
  render();updateHash(false);scrollToContent();
}
function searchFor(val){
  state={grupo:null,categoria:null,prize:"",q:String(val).toLowerCase(),topPeca:null,view:null,piece:null};
  document.getElementById("search").value=val;
  clearChipsToAll();clearNavActive();
  hideAutocomplete();
  render();updateHash(false);scrollToContent();
}
function openPiece(i){
  if(!DATA[i])return;
  state={grupo:null,categoria:null,prize:"",q:"",topPeca:null,view:null,piece:i};
  document.getElementById("search").value="";
  clearChipsToAll();clearNavActive();
  hideAutocomplete();
  render();updateHash(false);scrollToContent();
}

// Breadcrumb navigation (delegated)
document.getElementById("crumb").addEventListener("click",e=>{
  const link=e.target.closest(".crumb-link");if(!link)return;
  const action=link.dataset.action;
  if(action==="home"){goHome();}
  if(action==="topView"){state.topPeca=null;state.view="top";state.piece=null;render();updateHash(false);scrollToContent();}
  if(action==="grupo"){state.categoria=null;render();updateHash(false);scrollToContent();}
});

// Search
let searchTimer;
document.getElementById("search").addEventListener("input",e=>{
  const val=e.target.value;
  updateAutocomplete(val);
  clearTimeout(searchTimer);searchTimer=setTimeout(()=>{
    state.view=null;state.piece=null;state.topPeca=null;
    state.q=val.trim().toLowerCase();
    render();updateHash(true);
  },120);
});

// Cached elements
const dataIndex=new Map(DATA.map((d,i)=>[d,i]));
const elCrumb=document.getElementById("crumb");
const elTitle=document.getElementById("title");
const elLede=document.getElementById("lede");
const elResultN=document.getElementById("resultN");
const elList=document.getElementById("list");
const elEmpty=document.getElementById("empty");

// --- Row templates (shared by list / favorites / piece) ---
function headHtml(){
  return `<div class="row-head" role="row">
    <span role="columnheader">${esc(t("piece"))}</span><span role="columnheader">${esc(t("brand"))}</span><span role="columnheader">${esc(t("agency"))}</span><span role="columnheader">${esc(t("country"))}</span><span role="columnheader">${esc(t("category"))}</span><span role="columnheader">${esc(t("prize"))}</span><span role="columnheader"></span></div>`;
}
function rowHtml(d,idx){
  const isExt=d.embed==="external";
  const label=isExt?t("viewCase"):t("watch");
  const cls=isExt?"watch ext-btn":"watch";
  const host=d.link?hostname(d.link):"";
  const tip=host?` title="${esc(host)}"`:"";
  const flagEmoji=FLAG[d.pais]||"";
  const flagHtml=flagEmoji?`<span class="flag-emoji">${flagEmoji}</span>`:"";
  const fav=isFav(idx);
  return `<div class="lrow" role="row">
    <div class="c-peca" role="cell">${esc(d.peca)}</div>
    <div class="c-marca" role="cell">${esc(d.marca)}</div>
    <div class="c-ag" role="cell" data-label="${esc(t("agency"))}">${esc(d.agencia)}</div>
    <div class="c-pais" role="cell">${flagHtml} <span>${esc(d.pais)}</span></div>
    <div class="c-cat" role="cell">${esc(d.categoria)}</div>
    <div class="c-prize" role="cell"><span class="pz" data-p="${esc(d.premio)}">${esc(d.premio)}</span></div>
    <div class="c-actions" role="cell">
      <button class="icon-btn fav-star${fav?" on":""}" data-fav="${idx}" aria-label="${esc(t("save"))}" aria-pressed="${fav}">${starSvg}</button>
      <button class="icon-btn share-btn" data-share="${idx}" aria-label="${esc(t("share"))}">${shareSvg}</button>
      <button class="${cls}" data-i="${idx}"${tip}>${esc(label)} ${extSvg}</button>
    </div></div>`;
}
function buildRows(list){return headHtml()+list.map(d=>rowHtml(d,dataIndex.get(d))).join("");}

function setDocTitle(){
  let seg="";
  if(state.view==="top")seg=t("topAwarded");
  else if(state.view==="favorites")seg=t("favorites");
  else if(state.view==="stats")seg=t("stats");
  else if(state.piece!=null){const d=DATA[state.piece];seg=d?d.peca:"";}
  else if(state.categoria)seg=state.categoria;
  else if(state.grupo)seg=state.grupo;
  else if(state.q)seg="“"+state.q+"”";
  else if(state.prize)seg=state.prize;
  document.title=seg?seg+" — "+t("title"):t("title");
}

function render(){
  setDocTitle();
  const elNavHome=document.getElementById("navHome");
  const elNavTop=document.getElementById("navTop");
  const elNavStats=document.getElementById("navStats");
  const elNavFav=document.getElementById("navFav");
  [elNavTop,elNavStats,elNavFav].forEach(n=>n&&n.classList.remove("active"));
  if(state.view==="top"&&elNavTop)elNavTop.classList.add("active");
  if(state.view==="stats"&&elNavStats)elNavStats.classList.add("active");
  if(state.view==="favorites"&&elNavFav)elNavFav.classList.add("active");
  const onHome=!state.view&&state.piece==null&&!state.grupo&&!state.categoria&&!state.q&&!state.prize&&!state.topPeca;
  if(elNavHome)elNavHome.classList.toggle("active",onHome);

  if(state.view==="top"){renderTop();return;}
  if(state.view==="stats"){renderStats();return;}
  if(state.view==="favorites"){renderFavorites();return;}

  let list;
  if(state.piece!=null){
    const d=DATA[state.piece];
    if(!d){goHome();return;}
    list=[d];
    elCrumb.innerHTML=`<span class="crumb-link" data-action="home">${esc(t("allPieces"))}</span> / <b>${esc(d.marca)}</b>`;
    elTitle.textContent=d.peca;
  }else if(state.topPeca){
    list=DATA.filter(d=>d.peca===state.topPeca.peca&&d.marca===state.topPeca.marca);
    list.sort((a,b)=>(PRIZE_ORDER[a.premio]-PRIZE_ORDER[b.premio])||a.peca.localeCompare(b.peca));
    elCrumb.innerHTML=`<span class="crumb-link" data-action="topView">${esc(t("topAwarded"))}</span> / <b>${esc(state.topPeca.marca)}</b>`;
    elTitle.textContent=state.topPeca.peca;
  }else{
    list=DATA.filter(d=>{
      if(state.grupo&&d.grupo!==state.grupo)return false;
      if(state.categoria&&d.categoria!==state.categoria)return false;
      if(state.prize&&d.premio!==state.prize)return false;
      if(state.q&&!d._search.includes(state.q))return false;
      return true;
    });
    list.sort((a,b)=>(PRIZE_ORDER[a.premio]-PRIZE_ORDER[b.premio])||a.peca.localeCompare(b.peca));

    if(state.categoria){elCrumb.innerHTML=`<span class="crumb-link" data-action="grupo">${esc(state.grupo)}</span> / <b>${esc(state.categoria)}</b>`;elTitle.textContent=state.categoria;}
    else if(state.grupo){elCrumb.innerHTML=`<b>${esc(state.grupo)}</b>`;elTitle.textContent=state.grupo;}
    else if(state.q){elCrumb.textContent=t("search");elTitle.textContent=`${t("searchFor")} "${state.q}"`;}
    else if(state.prize){elCrumb.innerHTML=`${esc(t("byTrophy"))} / <b>${esc(state.prize)}</b>`;elTitle.textContent=`${t("allOfPrize")} ${state.prize}`;}
    else{elCrumb.textContent=t("allGroups");elTitle.textContent=t("allPieces");}
  }

  let gp=0;
  for(let i=0;i<list.length;i++)if(list[i].premio==="Grand Prix")gp++;
  const pWord=list.length>1?t("pieces"):t("pieceSingular");
  elLede.textContent=list.length?`${list.length} ${pWord}`+(gp?` · ${gp} Grand Prix`:"")+`.`:t("lede");
  elResultN.textContent=list.length?`${list.length}`:"";

  elEmpty.style.display=list.length?"none":"block";
  if(!list.length){elList.innerHTML="";return;}

  elList.style.animation="none";elList.offsetHeight;elList.style.animation="";
  elList.innerHTML=buildRows(list);
}

// --- Top 10 view ---
function renderTop(){
  elCrumb.textContent=t("topAwarded");
  elTitle.textContent=t("topAwarded");
  elResultN.textContent="10";
  elLede.textContent="";
  elEmpty.style.display="none";
  const counts={};
  DATA.forEach(d=>{
    const key=d.peca+"|||"+d.marca;
    if(!counts[key]) counts[key]={peca:d.peca,marca:d.marca,agencia:d.agencia,total:0,gp:0,ouro:0,prata:0,bronze:0,titan:0};
    counts[key].total++;
    if(d.premio==="Grand Prix") counts[key].gp++;
    else if(d.premio==="Ouro") counts[key].ouro++;
    else if(d.premio==="Prata") counts[key].prata++;
    else if(d.premio==="Bronze") counts[key].bronze++;
    else if(d.premio==="Titanium Lion") counts[key].titan++;
  });
  const scored=Object.values(counts).map(p=>({...p,score:p.gp*4+p.titan*4+p.ouro*3+p.prata*2+p.bronze}));
  const top10=scored.sort((a,b)=>b.score-a.score||b.total-a.total).slice(0,10);
  elList.innerHTML=top10.map((p,i)=>{
    const prizes=[];
    if(p.gp) prizes.push(`${p.gp}× Grand Prix`);
    if(p.titan) prizes.push(`${p.titan}× Titanium`);
    if(p.ouro) prizes.push(`${p.ouro}× ${currentLang==="pt"?"Ouro":"Gold"}`);
    if(p.prata) prizes.push(`${p.prata}× ${currentLang==="pt"?"Prata":"Silver"}`);
    if(p.bronze) prizes.push(`${p.bronze}× Bronze`);
    return `<div class="top10-row" data-peca="${esc(p.peca)}" data-marca="${esc(p.marca)}">
      <span class="top10-pos">${i+1}</span>
      <div class="top10-info"><span class="top10-headline">${esc(p.peca)} / ${esc(p.marca)} / ${esc(p.agencia)}</span><span class="top10-prizes">${prizes.join(" · ")}</span></div>
      <span class="top10-total">${p.total}</span></div>`;
  }).join("");
  elList.style.animation="none";elList.offsetHeight;elList.style.animation="";
}

// --- Favorites view ---
function renderFavorites(){
  elCrumb.textContent=t("favorites");
  elTitle.textContent=t("favorites");
  elLede.textContent="";
  const favs=getFavs().map(i=>DATA[i]).filter(Boolean);
  elResultN.textContent=favs.length||"";
  elEmpty.style.display="none";
  if(!favs.length){
    elList.innerHTML=`<div class="empty" style="display:block"><b>${esc(t("favEmptyTitle"))}</b>${esc(t("favEmptyDesc"))}</div>`;
    return;
  }
  elList.style.animation="none";elList.offsetHeight;elList.style.animation="";
  elList.innerHTML=buildRows(favs);
}

// --- Stats / Rankings view ---
function renderStats(){
  elCrumb.textContent=t("stats");
  elTitle.textContent=t("stats");
  elResultN.textContent="";
  elLede.textContent="";
  elEmpty.style.display="none";

  const byCountry={},byAgency={},byCat={};
  let gp=0;
  DATA.forEach(d=>{
    byCountry[d.pais]=(byCountry[d.pais]||0)+1;
    byAgency[d.agencia]=(byAgency[d.agencia]||0)+1;
    const ck=d.grupo+"|||"+d.categoria;
    byCat[ck]=byCat[ck]||{grupo:d.grupo,categoria:d.categoria,n:0};byCat[ck].n++;
    if(d.premio==="Grand Prix")gp++;
  });
  const countries=Object.entries(byCountry).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v).slice(0,12);
  const agencies=Object.entries(byAgency).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v).slice(0,12);
  const cats=Object.values(byCat).sort((a,b)=>b.n-a.n).slice(0,12);
  const nCountries=Object.keys(byCountry).length,nAgencies=Object.keys(byAgency).length;

  const tiles=`<div class="stats-overview">
    <div class="stat-tile"><div class="st-num">${DATA.length}</div><div class="st-lbl">${esc(t("pieces"))}</div></div>
    <div class="stat-tile"><div class="st-num">${gp}</div><div class="st-lbl">Grand Prix</div></div>
    <div class="stat-tile"><div class="st-num">${nCountries}</div><div class="st-lbl">${currentLang==="pt"?"Países":"Countries"}</div></div>
    <div class="stat-tile"><div class="st-num">${nAgencies}</div><div class="st-lbl">${currentLang==="pt"?"Agências":"Agencies"}</div></div>
  </div>`;

  const block=(title,rows)=>{
    const max=rows.length?rows[0].v:1;
    const items=rows.map((r,i)=>{
      const w=Math.max(4,Math.round(r.v/max*120));
      return `<div class="stat-row" ${r.attrs}>
        <span class="stat-pos">${i+1}</span>
        <span class="stat-name">${r.flag?`<span class="flag-emoji">${r.flag}</span>`:""}<span class="sn-txt">${esc(r.k)}</span></span>
        <span class="stat-bar-wrap"><span class="stat-bar" style="width:${w}px"></span><span class="stat-count">${r.v}</span></span>
      </div>`;
    }).join("");
    return `<div class="stats-block"><h3>${esc(title)}</h3>${items}</div>`;
  };

  const countryRows=countries.map(c=>({k:c.k,v:c.v,flag:FLAG[c.k]||"",attrs:`data-act="q" data-val="${esc(c.k)}"`}));
  const agencyRows=agencies.map(a=>({k:a.k,v:a.v,flag:"",attrs:`data-act="q" data-val="${esc(a.k)}"`}));
  const catRows=cats.map(c=>({k:c.categoria,v:c.n,flag:"",attrs:`data-act="cat" data-g="${esc(c.grupo)}" data-c="${esc(c.categoria)}"`}));

  elList.style.animation="none";elList.offsetHeight;elList.style.animation="";
  elList.innerHTML=`<div class="stats">${tiles}
    ${block(t("statsCountries"),countryRows)}
    ${block(t("statsAgencies"),agencyRows)}
    ${block(t("statsCategoriesGP"),catRows)}
  </div>`;
}

// Watch / drill / favorite / share / stats-row (delegated on #list)
document.getElementById("list").addEventListener("click",e=>{
  const statRow=e.target.closest(".stat-row");
  if(statRow){
    if(statRow.dataset.act==="cat") navigateGroupCat(statRow.dataset.g,statRow.dataset.c);
    else searchFor(statRow.dataset.val);
    return;
  }
  const topRow=e.target.closest(".top10-row");
  if(topRow){
    state.view=null;state.piece=null;
    state.topPeca={peca:topRow.dataset.peca,marca:topRow.dataset.marca};
    render();scrollToContent();return;
  }
  const favBtn=e.target.closest(".fav-star");
  if(favBtn){
    const i=+favBtn.dataset.fav;
    toggleFav(i);
    const on=isFav(i);
    favBtn.classList.toggle("on",on);favBtn.setAttribute("aria-pressed",on);
    updateFavCount();
    if(state.view==="favorites") render();
    return;
  }
  const shareBtn=e.target.closest(".share-btn");
  if(shareBtn){sharePiece(+shareBtn.dataset.share);return;}
  const btn=e.target.closest(".watch");if(!btn)return;
  const d=DATA[+btn.dataset.i];
  if(d.link&&isSafeUrl(d.link)) window.open(d.link,"_blank","noopener");
});

// --- Random ---
document.getElementById("randomBtn").addEventListener("click",()=>{
  const i=Math.floor(Math.random()*DATA.length);
  openPiece(i);
});

// --- Share + toast ---
let toastTimer;
function showToast(msg){
  const el=document.getElementById("toast");
  el.textContent=msg;el.classList.add("show");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2200);
}
function copyText(text){
  if(navigator.clipboard&&navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  return new Promise(res=>{
    const ta=document.createElement("textarea");ta.value=text;ta.style.position="fixed";ta.style.opacity="0";
    document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand("copy");}catch(e){}
    document.body.removeChild(ta);res();
  });
}
function sharePiece(i){
  const d=DATA[i];if(!d)return;
  const url=location.origin+location.pathname+"#/p/"+i;
  const title=d.peca+" — "+d.marca;
  if(navigator.share){
    navigator.share({title,text:title,url}).catch(()=>{});
  }else{
    copyText(url).then(()=>showToast(t("linkCopied"))).catch(()=>showToast(t("linkCopied")));
  }
}

// --- Autocomplete ---
let acItems=[],acActive=-1;
function updateAutocomplete(raw){
  const q=(raw||"").trim().toLowerCase();
  const drop=document.getElementById("acDrop");
  if(q.length<2){hideAutocomplete();return;}
  const pieces=[],seenP=new Set();
  for(let i=0;i<DATA.length&&pieces.length<5;i++){
    if(DATA[i].peca.toLowerCase().includes(q)){
      const k=DATA[i].peca+"|||"+DATA[i].marca;
      if(seenP.has(k)) continue;
      seenP.add(k);
      pieces.push({type:"piece",i,main:DATA[i].peca,sub:DATA[i].marca});
    }
  }
  const brands=UNIQUE.brands.filter(b=>b.toLowerCase().includes(q)).slice(0,4).map(v=>({type:"filter",val:v,main:v,sub:t("brand")}));
  const countries=UNIQUE.countries.filter(c=>c.toLowerCase().includes(q)).slice(0,3).map(v=>({type:"filter",val:v,main:v,sub:t("country")}));
  const filters=[...brands,...countries];
  acItems=[...pieces,...filters];
  if(!acItems.length){hideAutocomplete();return;}
  acActive=-1;
  let html="";
  if(pieces.length){html+=`<div class="ac-group-label">${esc(t("suggestPieces"))}</div>`;pieces.forEach(it=>{html+=acItemHtml(it);});}
  if(filters.length){html+=`<div class="ac-group-label">${esc(t("suggestFilters"))}</div>`;filters.forEach(it=>{html+=acItemHtml(it);});}
  drop.innerHTML=html;drop.classList.add("show");
  document.getElementById("search").setAttribute("aria-expanded","true");
}
function acItemHtml(it){
  const idx=acItems.indexOf(it);
  return `<div class="ac-item" role="option" data-idx="${idx}"><span class="ac-main">${esc(it.main)}</span><span class="ac-sub">${esc(it.sub)}</span></div>`;
}
function hideAutocomplete(){
  const drop=document.getElementById("acDrop");
  if(drop){drop.classList.remove("show");drop.innerHTML="";}
  const inp=document.getElementById("search");if(inp)inp.setAttribute("aria-expanded","false");
  acItems=[];acActive=-1;
}
function selectAc(idx){
  const it=acItems[idx];if(!it)return;
  if(it.type==="piece") openPiece(it.i);
  else searchFor(it.val);
}
function highlightAc(){
  document.querySelectorAll("#acDrop .ac-item").forEach(el=>el.classList.toggle("active",+el.dataset.idx===acActive));
}
document.getElementById("acDrop").addEventListener("mousedown",e=>{
  const item=e.target.closest(".ac-item");if(!item)return;
  e.preventDefault();selectAc(+item.dataset.idx);
});
document.getElementById("search").addEventListener("keydown",e=>{
  const drop=document.getElementById("acDrop");
  if(!drop.classList.contains("show"))return;
  if(e.key==="ArrowDown"){e.preventDefault();acActive=Math.min(acActive+1,acItems.length-1);highlightAc();}
  else if(e.key==="ArrowUp"){e.preventDefault();acActive=Math.max(acActive-1,0);highlightAc();}
  else if(e.key==="Enter"){if(acActive>=0){e.preventDefault();selectAc(acActive);}}
  else if(e.key==="Escape"){hideAutocomplete();}
});
document.getElementById("search").addEventListener("focus",e=>{
  if(e.target.value.trim().length>=2) updateAutocomplete(e.target.value);
});
document.addEventListener("click",e=>{if(!e.target.closest(".search"))hideAutocomplete();});

// --- Hash routing (deep links) ---
let isApplyingHash=false;
function stateToHash(){
  if(state.view==="top") return "#/top";
  if(state.view==="favorites") return "#/favorites";
  if(state.view==="stats") return "#/stats";
  if(state.piece!=null) return "#/p/"+state.piece;
  let base;
  if(state.grupo){base="/g/"+enc(state.grupo)+(state.categoria?"/"+enc(state.categoria):"");}
  else if(state.q){base="/q/"+enc(state.q);}
  else if(state.prize){return "#/prize/"+enc(state.prize);}
  else base="/";
  if(state.prize&&base!=="/") return "#"+base+"?prize="+enc(state.prize);
  return "#"+base;
}
function hashToState(hash){
  const s={grupo:null,categoria:null,prize:"",q:"",topPeca:null,view:null,piece:null};
  let h=(hash||"").replace(/^#/,"");
  if(!h||h==="/") return s;
  let qpart="";
  const qi=h.indexOf("?");
  if(qi>=0){qpart=h.slice(qi+1);h=h.slice(0,qi);}
  const params=new URLSearchParams(qpart);
  if(params.get("prize")) s.prize=dec(params.get("prize"));
  const seg=h.split("/").filter(Boolean).map(dec);
  if(seg[0]==="top"){s.view="top";return s;}
  if(seg[0]==="favorites"){s.view="favorites";return s;}
  if(seg[0]==="stats"){s.view="stats";return s;}
  if(seg[0]==="p"){const i=parseInt(seg[1],10);if(!isNaN(i)&&DATA[i])s.piece=i;return s;}
  if(seg[0]==="prize"){s.prize=seg[1]||"";return s;}
  if(seg[0]==="q"){s.q=(seg[1]||"").toLowerCase();return s;}
  if(seg[0]==="g"){
    if(GROUPS[seg[1]]){s.grupo=seg[1];if(seg[2]&&GROUPS[seg[1]].has(seg[2]))s.categoria=seg[2];}
    return s;
  }
  return s;
}
function applyHash(){
  isApplyingHash=true;
  state=hashToState(location.hash);
  syncControlsFromState();
  render();
  isApplyingHash=false;
}
function updateHash(replace){
  if(isApplyingHash) return;
  const h=stateToHash();
  if(location.hash===h||(location.hash===""&&h==="#/")) return;
  if(replace) history.replaceState(null,"",h);
  else location.hash=h;
}
window.addEventListener("hashchange",()=>{
  if(isApplyingHash) return;
  if(location.hash===stateToHash()) return;
  applyHash();
});
function syncControlsFromState(){
  const sv=document.getElementById("search");
  sv.value=state.q||"";
  document.querySelectorAll(".chip").forEach(x=>{
    const on=x.dataset.prize===state.prize;
    x.classList.toggle("on",on);x.setAttribute("aria-pressed",on);
  });
  if(!state.prize){const all=document.querySelector('.chip[data-prize=""]');all.classList.add("on");all.setAttribute("aria-pressed","true");}
  document.querySelectorAll(".nav-cats a").forEach(x=>x.classList.remove("active"));
  if(state.grupo){
    const sel=state.categoria
      ? document.querySelector(`.nav-cats a[data-g="${cssEsc(state.grupo)}"][data-c="${cssEsc(state.categoria)}"]`)
      : document.querySelector(`.nav-cats a.all[data-g="${cssEsc(state.grupo)}"]`);
    if(sel){sel.classList.add("active");const grp=sel.closest(".nav-group");if(grp)grp.classList.add("open");}
  }
  updateNavActiveIndicators();
}

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

// --- Welcome modal (first session only) ---
const welcomeModal=document.getElementById("welcomeModal");
function openWelcome(){
  welcomeModal.classList.add("open");
  document.getElementById("welcomeClose").focus();
}
function closeWelcome(){
  welcomeModal.classList.remove("open");
  sessionStorage.setItem("welcomeSeen","1");
}
document.getElementById("welcomeClose").addEventListener("click",closeWelcome);
document.getElementById("welcomeCloseBottom").addEventListener("click",closeWelcome);
welcomeModal.addEventListener("click",e=>{if(e.target===welcomeModal)closeWelcome();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&welcomeModal.classList.contains("open"))closeWelcome();});

// --- Init ---
let hashApplied=false,welcomeChecked=false;
function buildUI(){
  updateLangBtn();
  rebuildNav();
  updateStaticTexts();
  if(!hashApplied){hashApplied=true;applyHash();}
  else{syncControlsFromState();render();}
  if(!welcomeChecked){
    welcomeChecked=true;
    if(!sessionStorage.getItem("welcomeSeen")) openWelcome();
  }
}
initLang();
