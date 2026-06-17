// ═══════════════════════════ TEAM SWITCHING ════════════════════════════
let currentTeam = 'mavs';
const THEMES = {
  mavs:    { bg:'#05101E', surface:'#091929', surface2:'#0D2038', surface3:'#122644', border:'#1A3252', border2:'#0F2033', 'team-primary':'#006BB6', 'team-light':'#7DBAEC', 'team-sidebar':'#00285E' },
  bulls:   { bg:'#08000D', surface:'#110010', surface2:'#1A0018', surface3:'#230022', border:'#3D0030', border2:'#2A0020', 'team-primary':'#CE1141', 'team-light':'#FF8CAE', 'team-sidebar':'#140009' },
  thunder: { bg:'#00070F', surface:'#000E1C', surface2:'#001428', surface3:'#001B36', border:'#002D50', border2:'#001F3A', 'team-primary':'#007AC1', 'team-light':'#5BBDFF', 'team-sidebar':'#001630' },
};
const THEMES_LIGHT = {
  mavs:    { bg:'#EFF4FC', surface:'#FFFFFF', surface2:'#E4EDF8', surface3:'#D4E4F4', border:'#A8C5E0', border2:'#C4D8EE', 'team-primary':'#006BB6', 'team-light':'#004A8C', 'team-sidebar':'#DFF0FF' },
  bulls:   { bg:'#FDF0F3', surface:'#FFFFFF', surface2:'#FAE5EB', surface3:'#F5D4DC', border:'#E0A0B0', border2:'#EEC0CC', 'team-primary':'#CE1141', 'team-light':'#A00030', 'team-sidebar':'#FAE8ED' },
  thunder: { bg:'#EEF5FC', surface:'#FFFFFF', surface2:'#E0EDF9', surface3:'#D0E4F6', border:'#A0C4E4', border2:'#B8D4EE', 'team-primary':'#007AC1', 'team-light':'#005598', 'team-sidebar':'#DDEEF8' },
};

// ── Landing page team selection ──────────────────────────────
// ── Bottom nav tap-active highlight ────────────────────────────
(function(){
  document.querySelectorAll('.mbn-item').forEach(function(item){
    item.addEventListener('click', function(){
      document.querySelectorAll('.mbn-item').forEach(function(i){ i.classList.remove('mbn-active'); });
      this.classList.add('mbn-active');
    });
  });
})();

function lpSelectTeam(team) {
  // Mark that the user has actively dismissed the landing page this session
  try{ sessionStorage.setItem('hq_dismissed','1'); }catch(e){}
  var lp = document.getElementById('landing-page');
  if (lp) {
    lp.classList.add('lp-fade');
    setTimeout(function(){
      lp.style.display = 'none';
      switchTeam(team);
      // Bottom nav guard checks landing visibility — now hidden, show it
      var mbn = document.getElementById('mobile-bottom-nav');
      if (mbn) mbn.classList.add('mbn-visible');
    }, 220);
  } else {
    switchTeam(team);
  }
}

function switchTeam(team) {
  // ── URL hash deep-linking (skip if landing page is still visible) ──
  const _hashSlug={mavs:'dallas',bulls:'chicago',thunder:'okc',h2h:'h2h',stats:'stats',draft:'draft','draft-history':'history',preview:'preview',fa:'fa',picks:'picks'};
  var _lp=document.getElementById('landing-page');
  if(!_lp || _lp.style.display==='none') {
    try{history.replaceState(null,'','#'+(_hashSlug[team]||team));}catch(e){}
  }
  // ── Mobile bottom nav: hide by default; team pages re-show it below ──
  const _mbn = document.getElementById('mobile-bottom-nav');
  if (_mbn) _mbn.classList.remove('mbn-visible');

  // Hide all wrappers (flex team wrappers + block h2h wrapper)
  document.querySelectorAll('.wrapper').forEach(w => w.style.display = 'none');
  const h2hWrap = document.getElementById('wrapper-h2h');
  if (h2hWrap) h2hWrap.style.display = 'none';
  const statsWrap = document.getElementById('wrapper-stats');
  if (statsWrap) statsWrap.style.display = 'none';
  const draftWrap = document.getElementById('wrapper-draft');
  if (draftWrap) draftWrap.style.display = 'none';
  const dhWrap = document.getElementById('wrapper-draft-history');
  if (dhWrap) dhWrap.style.display = 'none';
  const spWrap = document.getElementById('wrapper-preview');
  if (spWrap) spWrap.style.display = 'none';
  const faWrap = document.getElementById('wrapper-fa');
  if (faWrap) faWrap.style.display = 'none';
  const picksWrap = document.getElementById('wrapper-picks');
  if (picksWrap) picksWrap.style.display = 'none';

  document.querySelectorAll('.team-tab').forEach(t => t.classList.remove('active'));
  const activeTab = document.querySelector('.team-tab.tab-' + team);
  if (activeTab) {
    activeTab.classList.add('active');
    // Scroll active tab into view on small screens where the nav bar overflows
    activeTab.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
  }

  if (team === 'h2h') {
    if (h2hWrap) h2hWrap.style.display = 'block';
    currentTeam = team;
    return; // no theme swap, no sidebar, no canvas for h2h
  }

  if (team === 'stats') {
    if (statsWrap) statsWrap.style.display = 'block';
    currentTeam = team;
    return;
  }

  if (team === 'draft') {
    if (draftWrap) draftWrap.style.display = 'block';
    currentTeam = team;
    return;
  }

  if (team === 'draft-history') {
    if (dhWrap) dhWrap.style.display = 'block';
    currentTeam = team;
    if (window._dhInit) window._dhInit();
    return;
  }

  if (team === 'preview') {
    if (spWrap) spWrap.style.display = 'block';
    currentTeam = team;
    if (window._spInit) window._spInit();
    return;
  }

  if (team === 'fa') {
    if (faWrap) faWrap.style.display = 'block';
    currentTeam = team;
    return;
  }

  if (team === 'picks') {
    if (picksWrap) picksWrap.style.display = 'block';
    currentTeam = team;
    return;
  }

  document.getElementById('wrapper-' + team).style.display = 'flex';
  const isLight = document.documentElement.hasAttribute('data-light');
  const th = (isLight ? THEMES_LIGHT[team] : THEMES[team]) || THEMES.mavs;
  Object.entries(th).forEach(([k,v]) => document.documentElement.style.setProperty('--'+k, v));
  currentTeam = team;

  // ── Mobile bottom nav: show and update section links ──
  // Only show if the landing page has already been dismissed
  var _lpCheck = document.getElementById('landing-page');
  var _landingGone = !_lpCheck || _lpCheck.style.display === 'none';
  if (_mbn && _landingGone) {
    const _mbnAnchors = {
      mavs:    {fo:'#mavs-leadership',    roster:'#mavs-roster',    draft:'#mavs-draft',    fa:'#mavs-freeagency',    stats:'#mavs-stats'},
      bulls:   {fo:'#bulls-leadership',   roster:'#bulls-roster',   draft:'#bulls-draft',   fa:'#bulls-freeagency',   stats:'#bulls-stats'},
      thunder: {fo:'#thunder-leadership', roster:'#thunder-roster', draft:'#thunder-draft', fa:'#thunder-freeagency', stats:'#thunder-stats'},
    };
    const _an = _mbnAnchors[team];
    if (_an) {
      document.getElementById('mbn-fo').href    = _an.fo;
      document.getElementById('mbn-roster').href = _an.roster;
      document.getElementById('mbn-draft').href  = _an.draft;
      document.getElementById('mbn-fa').href     = _an.fa;
      document.getElementById('mbn-stats').href  = _an.stats;
      _mbn.classList.add('mbn-visible');
    }
  }
  // Move offseason calendar into the active team's main content area
  const _cal = document.getElementById('offseason-cal');
  if (_cal) {
    const _tgt = document.querySelector('#wrapper-' + team + ' main.main');
    if (_tgt && _tgt.firstChild !== _cal) _tgt.insertBefore(_cal, _tgt.firstChild);
  }
  // Redraw canvas visualizations now that wrapper is visible
  requestAnimationFrame(() => { if(builders[team]) builders[team].redrawViz(); });
}

// ── Responsive canvas resize ────────────────────────────────
let _resizeTimer;
window.addEventListener('resize',()=>{
  clearTimeout(_resizeTimer);
  _resizeTimer=setTimeout(()=>{
    if(typeof currentTeam!=='undefined'&&builders[currentTeam]){
      builders[currentTeam].redrawViz();
    }
  },150);
});

// ── Light / Dark mode toggle ─────────────────────────────────
function toggleTheme(){
  const html=document.documentElement;
  const goingLight=!html.hasAttribute('data-light');
  if(goingLight){html.setAttribute('data-light','');}
  else{html.removeAttribute('data-light');}
  // Re-apply team colour vars for the new mode
  if(typeof currentTeam!=='undefined'){
    const th=(goingLight?THEMES_LIGHT[currentTeam]:THEMES[currentTeam])||THEMES.mavs;
    Object.entries(th).forEach(([k,v])=>document.documentElement.style.setProperty('--'+k,v));
  }
  // Redraw canvases so colours update
  if(typeof currentTeam!=='undefined'&&builders[currentTeam]){
    builders[currentTeam].redrawViz();
  }
  // Persist preference
  try{localStorage.setItem('theme',goingLight?'light':'dark');}catch(e){}
}

// ── Restore saved theme preference ───────────────────────────
(function(){
  try{
    if(localStorage.getItem('theme')==='light'){
      document.documentElement.setAttribute('data-light','');
    }
  }catch(e){}
})();

// ── Restore team / section from URL hash on page load ─────────
(function(){
  const _slugTeam={dallas:'mavs',chicago:'bulls',okc:'thunder',h2h:'h2h',stats:'stats',draft:'draft',history:'draft-history',preview:'preview',fa:'fa'};
  const _raw=window.location.hash.slice(1);
  const _hash=_raw.toLowerCase();
  if(!_hash) return; // no hash → always show landing page

  // A hash exists. But on mobile, browsers restore the URL from a previous session
  // (including any #dallas etc that was set). We only skip the landing if the user
  // actually dismissed it during THIS session (tracked via sessionStorage).
  var _inSession=false;
  try{ _inSession=!!sessionStorage.getItem('hq_dismissed'); }catch(e){}
  if(!_inSession) return; // stale hash from a prior session → show landing page

  // Hash + active session → honor the hash (user reloaded mid-session)
  var _lp=document.getElementById('landing-page');
  if(_lp) _lp.style.display='none';
  // Direct slug match (team tabs + tool tabs)
  if(_slugTeam[_hash]){switchTeam(_slugTeam[_hash]);return;}
  // Section anchor: mavs-*, bulls-*, thunder-* → switch team, then scroll into view
  const _m=_hash.match(/^(mavs|bulls|thunder)-/);
  if(_m){
    switchTeam(_m[1]);
    requestAnimationFrame(()=>{
      const el=document.getElementById(_raw);
      if(el) el.scrollIntoView({behavior:'instant',block:'start'});
    });
  }
})();

