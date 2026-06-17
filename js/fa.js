// ══════════════════════════════════════════════════════════════════
// FREE AGENCY — ADMIN MODE + LEAGUE TRANSACTION FEED
// ══════════════════════════════════════════════════════════════════
var faAdminActive = false;
var _faStorageKey = 'hh-fa-2026';
var _faMoves = [];
var _faActiveTypeFilter = 'all';
var _faActiveTeamFilter = 'all';

var _faTeamNames = {
  fa:'Free Agent',
  mavs:'Dallas Mavericks',bulls:'Chicago Bulls',thunder:'OKC Thunder',
  hawks:'Atlanta Hawks',celtics:'Boston Celtics',nets:'Brooklyn Nets',
  hornets:'Charlotte Hornets',cavs:'Cleveland Cavaliers',nuggets:'Denver Nuggets',
  pistons:'Detroit Pistons',warriors:'Golden State Warriors',rockets:'Houston Rockets',
  pacers:'Indiana Pacers',clippers:'LA Clippers',lakers:'LA Lakers',
  grizzlies:'Memphis Grizzlies',heat:'Miami Heat',bucks:'Milwaukee Bucks',
  wolves:'Minnesota Timberwolves',pelicans:'New Orleans Pelicans',knicks:'New York Knicks',
  magic:'Orlando Magic',sixers:'Philadelphia 76ers',suns:'Phoenix Suns',
  blazers:'Portland Trail Blazers',kings:'Sacramento Kings',spurs:'San Antonio Spurs',
  raptors:'Toronto Raptors',jazz:'Utah Jazz',wizards:'Washington Wizards'
};
var _faTeamShort = {
  fa:'Free Agent',
  mavs:'Dallas',bulls:'Chicago',thunder:'OKC',
  hawks:'Atlanta',celtics:'Boston',nets:'Brooklyn',
  hornets:'Charlotte',cavs:'Cleveland',nuggets:'Denver',
  pistons:'Detroit',warriors:'Golden St.',rockets:'Houston',
  pacers:'Indiana',clippers:'Clippers',lakers:'Lakers',
  grizzlies:'Memphis',heat:'Miami',bucks:'Milwaukee',
  wolves:'Minnesota',pelicans:'New Orleans',knicks:'New York',
  magic:'Orlando',sixers:'Philly',suns:'Phoenix',
  blazers:'Portland',kings:'Sacramento',spurs:'San Antonio',
  raptors:'Toronto',jazz:'Utah',wizards:'Washington'
};
var _faOurTeams = {mavs:1,bulls:1,thunder:1};
var _faTeamIcons = {mavs:'🏹',bulls:'🏀',thunder:'🌩️'};
var _faTypeLabels = {
  signed:'Signed',traded:'Traded',waived:'Waived',
  extended:'Extended',optin:'Opt In',optout:'Opt Out'
};

// ── Migrate old records that used {team, deal} schema ─────────────
function _faMigrateRecord(r) {
  if (r.toTeam !== undefined) return r; // already new schema
  return {
    id:       r.id,
    player:   r.player,
    type:     r.deal === 'sat' ? 'traded' : (r.deal === 'extension' ? 'extended' : 'signed'),
    fromTeam: 'fa',
    toTeam:   r.team || '',
    contract: r.contract || '',
    ts:       r.ts
  };
}

// ── Admin activate / deactivate ───────────────────────────────────
function faAdminToggle() {
  if (faAdminActive) { faAdminDeactivate(); } else { faAdminActivate(); }
}

function faAdminActivate() {
  faAdminActive = true;
  document.getElementById('fa-admin-bar').classList.add('active');
  var btn = document.getElementById('fa-add-btn');
  if (btn) { btn.textContent = '✕ Close'; btn.style.background = 'rgba(230,57,70,.12)'; btn.style.borderColor = 'rgba(230,57,70,.4)'; btn.style.color = '#e63946'; }
  setTimeout(function() {
    var el = document.getElementById('fa-admin-player');
    if (el) el.focus();
  }, 80);
}

function faAdminDeactivate() {
  faAdminActive = false;
  document.getElementById('fa-admin-bar').classList.remove('active');
  var btn = document.getElementById('fa-add-btn');
  if (btn) { btn.textContent = '➕ Add Move'; btn.style.background = ''; btn.style.borderColor = ''; btn.style.color = ''; }
}

// ── Log a move ────────────────────────────────────────────────────
function faAdminConfirm() {
  var player = (document.getElementById('fa-admin-player').value || '').trim();
  if (!player) { document.getElementById('fa-admin-player').focus(); return; }
  var type     = document.getElementById('fa-admin-type').value || 'signed';
  var fromTeam = document.getElementById('fa-admin-from').value || 'fa';
  var toTeam   = document.getElementById('fa-admin-team').value || '';
  var contract = (document.getElementById('fa-admin-contract').value || '').trim();

  var move = { id: Date.now(), player: player, type: type, fromTeam: fromTeam, toTeam: toTeam, contract: contract, ts: Date.now() };
  _faMoves.push(move);
  faSaveMoves();
  faRebuildBoard(); // rebuild to respect active filters
  faUpdateTeamStrip();
  faUpdateMoveCount();

  // Clear player + contract; keep type + teams for fast repeat-entry
  document.getElementById('fa-admin-player').value = '';
  document.getElementById('fa-admin-contract').value = '';
  document.getElementById('fa-admin-player').focus();
}

function faAdminUndo() {
  if (!_faMoves.length) return;
  var last = _faMoves[_faMoves.length - 1];
  if (!confirm('Remove last move: ' + last.player + '?')) return;
  _faMoves.pop();
  faSaveMoves();
  faRebuildBoard();
  faUpdateTeamStrip();
  faUpdateMoveCount();
}

// ── Render one row ────────────────────────────────────────────────
function faRenderMove(move, prepend) {
  var container = document.getElementById('fa-board-entries');
  if (!container) return;
  var emptyMsg = container.querySelector('.fa-board-empty');
  if (emptyMsg) emptyMsg.remove();

  var d        = new Date(move.ts);
  var dateStr  = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  var timeStr  = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  var typeCls  = 'fa-type-' + (move.type || 'signed');
  var typeLbl  = _faTypeLabels[move.type] || move.type || 'Signed';

  var fromSlug = move.fromTeam || 'fa';
  var toSlug   = move.toTeam   || '';
  var fromName = _faTeamShort[fromSlug] || _faTeamNames[fromSlug] || fromSlug || '—';
  var toName   = toSlug ? (_faTeamShort[toSlug] || _faTeamNames[toSlug] || toSlug) : '—';

  // Determine if any of our teams are involved
  var ourCls = '';
  if (_faOurTeams[toSlug])   ourCls = ' our-' + toSlug;
  else if (_faOurTeams[fromSlug]) ourCls = ' our-' + fromSlug;

  var row = document.createElement('div');
  row.className = 'fa-row' + ourCls + (prepend ? ' new' : '');
  row.setAttribute('data-fa-id', move.id);
  row.setAttribute('data-fa-type', move.type || 'signed');
  row.setAttribute('data-fa-from', fromSlug);
  row.setAttribute('data-fa-to', toSlug);

  row.innerHTML =
    '<div><span class="fa-type-badge ' + typeCls + '">' + typeLbl + '</span></div>' +
    '<div><div class="fa-row-player">' + move.player + '</div>' +
    '<div class="fa-row-time">' + dateStr + ' · ' + timeStr + '</div></div>' +
    '<div class="fa-fromto">' +
      '<span class="fa-fromto-from">' + fromName + '</span>' +
      '<span class="fa-fromto-arrow">→</span>' +
      '<span class="fa-fromto-to">' + toName + '</span>' +
    '</div>' +
    '<div class="fa-row-contract fa-bh-contract">' + (move.contract || '—') + '</div>';

  if (prepend) {
    container.insertBefore(row, container.firstChild);
  } else {
    container.appendChild(row);
  }
}

// ── Filter helpers ────────────────────────────────────────────────
function faSetTypeFilter(type) {
  _faActiveTypeFilter = type;
  // Update button active states
  document.querySelectorAll('#fa-type-filters .fa-filter-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === (type === 'all' ? 'all' : _faTypeLabels[type] ? _faTypeLabels[type].toLowerCase() : type));
    if (type === 'all') btn.classList.toggle('active', btn.textContent.trim() === 'All');
  });
  faApplyFilters();
}

function faSetTeamFilter(team) {
  _faActiveTeamFilter = team;
  faApplyFilters();
}

function faApplyFilters() {
  var rows = document.querySelectorAll('#fa-board-entries .fa-row');
  var visibleCount = 0;
  rows.forEach(function(row) {
    var typeMatch = _faActiveTypeFilter === 'all' || row.getAttribute('data-fa-type') === _faActiveTypeFilter;
    var teamMatch = _faActiveTeamFilter === 'all' ||
      row.getAttribute('data-fa-from') === _faActiveTeamFilter ||
      row.getAttribute('data-fa-to') === _faActiveTeamFilter;
    var show = typeMatch && teamMatch;
    row.style.display = show ? '' : 'none';
    if (show) visibleCount++;
  });

  // Show empty state if nothing visible
  var container = document.getElementById('fa-board-entries');
  var noResults = container ? container.querySelector('.fa-filter-empty') : null;
  if (visibleCount === 0 && _faMoves.length > 0) {
    if (!noResults) {
      var el = document.createElement('div');
      el.className = 'fa-board-empty fa-filter-empty';
      el.innerHTML = 'No moves match the current filters.';
      container.appendChild(el);
    }
  } else if (noResults) {
    noResults.remove();
  }

  // Update board col header label
  var hdr = document.getElementById('fa-board-col-header');
  if (hdr) {
    var typeLabel = _faActiveTypeFilter === 'all' ? 'All Moves' : (_faTypeLabels[_faActiveTypeFilter] || _faActiveTypeFilter);
    var teamLabel = _faActiveTeamFilter === 'all' ? 'All Teams' : (_faTeamNames[_faActiveTeamFilter] || _faActiveTeamFilter);
    hdr.textContent = 'League Transaction Feed · ' + typeLabel + ' · ' + teamLabel;
  }
}

// ── Rebuild full board from _faMoves ─────────────────────────────
function faRebuildBoard() {
  var container = document.getElementById('fa-board-entries');
  if (!container) return;
  container.innerHTML = '';
  if (!_faMoves.length) {
    container.innerHTML = '<div class="fa-board-empty">No moves logged yet.<br>Press <b>Shift+Alt+F</b> on July 1 to open Admin Mode.</div>';
    return;
  }
  // Render newest-first (reverse order)
  var reversed = _faMoves.slice().reverse();
  reversed.forEach(function(m) { faRenderMove(m, false); });
  faApplyFilters();
}

// ── Our-teams summary strip ───────────────────────────────────────
function faUpdateTeamStrip() {
  ['mavs', 'bulls', 'thunder'].forEach(function(t) {
    // Include any move where this team is involved (from or to)
    var list = _faMoves.filter(function(m) {
      return m.fromTeam === t || m.toTeam === t;
    });
    var countEl = document.getElementById('fa-count-' + t);
    var listEl  = document.getElementById('fa-list-' + t);
    if (countEl) countEl.textContent = list.length;
    if (listEl) {
      if (!list.length) {
        listEl.innerHTML = '<div class="fa-tc-empty">No moves yet</div>';
      } else {
        listEl.innerHTML = list.slice(-5).reverse().map(function(m) {
          var typeLbl = _faTypeLabels[m.type] || m.type || '';
          return '<div class="fa-tc-signing-pill">' +
            '<span class="fa-tc-signing-name">' + m.player + '</span>' +
            '<span class="fa-tc-signing-deal">' + (m.contract || typeLbl) + '</span></div>';
        }).join('');
      }
    }
  });
}

function faUpdateMoveCount() {
  var el = document.getElementById('fa-sign-count');
  if (el) el.textContent = _faMoves.length;
}

// ── localStorage ──────────────────────────────────────────────────
function faSaveMoves() {
  try { localStorage.setItem(_faStorageKey, JSON.stringify(_faMoves)); } catch(e) {}
}

function faLoadMoves() {
  try {
    var saved = JSON.parse(localStorage.getItem(_faStorageKey) || '[]');
    if (!Array.isArray(saved) || !saved.length) return;
    // Migrate any old-schema records
    _faMoves = saved.map(_faMigrateRecord);
    faRebuildBoard();
    faUpdateTeamStrip();
    faUpdateMoveCount();
  } catch(e) {}
}

// ── Share board state via URL ─────────────────────────────────────
function faShareState() {
  try {
    var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(_faMoves))));
    var base = window.location.href.split('#')[0];
    var url  = base + '#fa?state=' + encoded;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function() {
        alert('📤 FA board link copied!\nSend to friends — they open it to see your transaction board.');
      }).catch(function() { prompt('Copy this FA share link:', url); });
    } else {
      prompt('Copy this FA share link:', url);
    }
  } catch(e) { alert('Could not generate share link.'); }
}

// Import FA state from URL hash on page load
(function() {
  try {
    var hash = window.location.hash || '';
    var m = hash.match(/^#fa[?&]state=([A-Za-z0-9+/=]+)/);
    if (!m) return;
    var decoded  = decodeURIComponent(escape(atob(m[1])));
    var imported = JSON.parse(decoded);
    if (!Array.isArray(imported)) return;
    var existing = JSON.parse(localStorage.getItem(_faStorageKey) || '[]');
    var ids = {};
    existing.forEach(function(s) { ids[s.id] = 1; });
    imported.forEach(function(s) { if (!ids[s.id]) existing.push(s); });
    existing.sort(function(a, b) { return a.ts - b.ts; });
    localStorage.setItem(_faStorageKey, JSON.stringify(existing));
  } catch(e) {}
})();

// ── FA countdown ──────────────────────────────────────────────────
function faUpdateCountdown() {
  var el = document.getElementById('fa-countdown');
  if (!el) return;
  var faTime = new Date('2026-07-01T18:00:00-04:00').getTime();
  var diff = faTime - Date.now();
  if (diff <= 0) { el.textContent = '🟢 FREE AGENCY IS OPEN'; el.style.color = '#00c864'; return; }
  var d = Math.floor(diff / 86400000);
  var h = Math.floor((diff % 86400000) / 3600000);
  var mn = Math.floor((diff % 3600000) / 60000);
  var s = Math.floor((diff % 60000) / 1000);
  el.textContent = '⏱ ' + d + 'd ' + h + 'h ' + mn + 'm ' + s + 's until Free Agency';
}
faUpdateCountdown();
setInterval(faUpdateCountdown, 1000);

// ── Keyboard shortcut: Shift+Alt+F → FA Admin Mode ───────────────
document.addEventListener('keydown', function(e) {
  if (e.shiftKey && e.altKey && (e.key === 'f' || e.key === 'F')) {
    var fw = document.getElementById('wrapper-fa');
    if (fw && fw.style.display !== 'none') {
      e.preventDefault();
      faAdminToggle();
    }
  }
});

// ── Admin form keyboard nav ───────────────────────────────────────
(function() {
  function wireFAKeys() {
    var playerEl   = document.getElementById('fa-admin-player');
    var typeEl     = document.getElementById('fa-admin-type');
    var fromEl     = document.getElementById('fa-admin-from');
    var teamEl     = document.getElementById('fa-admin-team');
    var contractEl = document.getElementById('fa-admin-contract');
    if (!playerEl) return;
    playerEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault(); if (typeEl) typeEl.focus();
      }
    });
    if (typeEl) typeEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { if (fromEl) fromEl.focus(); }
    });
    if (fromEl) fromEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { if (teamEl) teamEl.focus(); }
    });
    if (teamEl) teamEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { if (contractEl) contractEl.focus(); }
    });
    if (contractEl) contractEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') faAdminConfirm();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireFAKeys);
  } else {
    wireFAKeys();
  }
})();

// ── Load saved moves on page ready ───────────────────────────────
(function() {
  function go() { setTimeout(faLoadMoves, 200); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', go);
  } else {
    go();
  }
})();
