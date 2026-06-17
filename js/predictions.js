// ══════════════════════════════════════════════════════════════════
// PREDICTIONS / PICKS
// ══════════════════════════════════════════════════════════════════
var _picksAdminActive = false;
var _picksKey = 'hh-picks-2026';
var _picks = { riley:{}, chase:{}, matt:{}, result:{} };

var _pickAwards = [
  { id:'mvp',      emoji:'🏆', label:'MVP',      hint:'Regular Season Most Valuable Player' },
  { id:'dpoy',     emoji:'🛡️', label:'DPOY',     hint:'Defensive Player of the Year' },
  { id:'roty',     emoji:'🌱', label:'ROTY',     hint:'Rookie of the Year' },
  { id:'mip',      emoji:'📈', label:'MIP',      hint:'Most Improved Player' },
  { id:'smoy',     emoji:'💺', label:'SMOY',     hint:'Sixth Man of the Year' },
  { id:'champion', emoji:'🏆', label:'Champion', hint:'NBA Champion (enter team name)' },
];

var _pickWins = [
  { id:'mavs_w',    emoji:'🏹', label:'Dallas Mavericks' },
  { id:'bulls_w',   emoji:'🏀', label:'Chicago Bulls' },
  { id:'thunder_w', emoji:'🌩️', label:'OKC Thunder' },
];

var _pickPersons = ['riley','chase','matt'];

// ── Admin toggle ──────────────────────────────────────────────────
function picksAdminToggle() {
  _picksAdminActive = !_picksAdminActive;
  var badge = document.getElementById('picks-mode-badge');
  var btn   = document.getElementById('picks-admin-btn');
  var hint  = document.getElementById('picks-edit-hint');
  if (_picksAdminActive) {
    if (badge) badge.textContent = '✏️ Edit Mode';
    if (btn)   { btn.textContent = '✕ Done'; btn.style.background = 'rgba(230,57,70,.12)'; btn.style.borderColor = 'rgba(230,57,70,.4)'; btn.style.color = '#e63946'; }
    if (hint)  hint.style.display = '';
    document.querySelectorAll('.picks-cell').forEach(function(c) { c.classList.add('admin-mode'); });
  } else {
    if (badge) badge.textContent = '👁️ View Mode';
    if (btn)   { btn.textContent = '✏️ Edit Picks'; btn.style.background = ''; btn.style.borderColor = ''; btn.style.color = ''; }
    if (hint)  hint.style.display = 'none';
    document.querySelectorAll('.picks-cell').forEach(function(c) { c.classList.remove('admin-mode'); });
  }
}

// ── Click-to-edit cell ────────────────────────────────────────────
function picksEditCell(cell) {
  if (!_picksAdminActive) return;
  // Don't double-open if already editing
  if (cell.querySelector('input')) return;
  var person = cell.getAttribute('data-pp');
  var id     = cell.getAttribute('data-pid');
  var current = _picks[person] ? (_picks[person][id] || '') : '';
  var isWin   = id.indexOf('_w') > -1;

  var input = document.createElement('input');
  input.type = isWin ? 'number' : 'text';
  input.value = current;
  input.className = 'picks-cell-input';
  input.placeholder = person === 'result' ? (isWin ? 'Actual W' : 'Actual…') : (isWin ? 'Win total' : 'Player…');
  if (isWin) { input.min = 0; input.max = 82; }
  cell.innerHTML = '';
  cell.appendChild(input);
  input.focus();
  input.select();

  function save() {
    if (!_picks[person]) _picks[person] = {};
    _picks[person][id] = input.value.trim();
    picksAutosave();
    picksRenderAll();
    picksUpdateScores();
    // Re-apply admin-mode class after re-render
    if (_picksAdminActive) {
      document.querySelectorAll('.picks-cell').forEach(function(c) { c.classList.add('admin-mode'); });
    }
  }

  var saved = false;
  input.addEventListener('blur', function() {
    if (!saved) { saved = true; save(); }
  });
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); saved = true; input.blur(); }
    if (e.key === 'Escape') { saved = true; picksRenderAll(); if (_picksAdminActive) document.querySelectorAll('.picks-cell').forEach(function(c){c.classList.add('admin-mode');}); }
  });
}

// ── Score class helper ────────────────────────────────────────────
function _picksScoreCls(person, id) {
  var resultVal = (_picks.result && _picks.result[id]) ? _picks.result[id] : '';
  var myVal = (_picks[person] && _picks[person][id]) ? _picks[person][id] : '';
  if (!resultVal || !myVal) return '';
  var isWin = id.indexOf('_w') > -1;
  if (isWin) {
    var diff = Math.abs(parseInt(myVal,10) - parseInt(resultVal,10));
    if (isNaN(diff)) return '';
    if (diff === 0) return ' picks-correct';
    if (diff <= 3)  return ' picks-close';
    return ' picks-wrong';
  }
  return myVal.trim().toLowerCase() === resultVal.trim().toLowerCase() ? ' picks-correct' : ' picks-wrong';
}

function _picksCellHTML(person, id) {
  var val = (_picks[person] && _picks[person][id]) ? _picks[person][id] : '';
  var scoreClass = person === 'result' ? '' : _picksScoreCls(person, id);
  var display = val ? val : '<span class="picks-empty">—</span>';
  return '<td class="picks-cell' + scoreClass + '" data-pp="' + person + '" data-pid="' + id + '" onclick="picksEditCell(this)">' + display + '</td>';
}

function _picksResultCellHTML(id) {
  var val = (_picks.result && _picks.result[id]) ? _picks.result[id] : '';
  var display = val ? val : '<span class="picks-empty">—</span>';
  return '<td class="picks-cell picks-result-cell" data-pp="result" data-pid="' + id + '" onclick="picksEditCell(this)">' + display + '</td>';
}

// ── Render both tables ────────────────────────────────────────────
function picksRenderAll() {
  // Awards
  var aBody = document.getElementById('picks-awards-body');
  if (aBody) {
    aBody.innerHTML = '';
    _pickAwards.forEach(function(award) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="picks-td-label" title="' + award.hint + '">' + award.emoji + ' ' + award.label + '</td>' +
        _picksCellHTML('riley', award.id) +
        _picksCellHTML('chase', award.id) +
        _picksCellHTML('matt',  award.id) +
        _picksResultCellHTML(award.id);
      aBody.appendChild(tr);
    });
  }
  // Win totals
  var wBody = document.getElementById('picks-wins-body');
  if (wBody) {
    wBody.innerHTML = '';
    _pickWins.forEach(function(win) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="picks-td-label">' + win.emoji + ' ' + win.label + '</td>' +
        _picksCellHTML('riley', win.id) +
        _picksCellHTML('chase', win.id) +
        _picksCellHTML('matt',  win.id) +
        _picksResultCellHTML(win.id);
      wBody.appendChild(tr);
    });
  }
}

// ── Score bar ─────────────────────────────────────────────────────
function picksUpdateScores() {
  _pickPersons.forEach(function(person) {
    var score = 0, possible = 0;
    _pickAwards.forEach(function(a) {
      var r = (_picks.result && _picks.result[a.id]) ? _picks.result[a.id].trim().toLowerCase() : '';
      var v = (_picks[person] && _picks[person][a.id]) ? _picks[person][a.id].trim().toLowerCase() : '';
      if (r) { possible++; if (v && v === r) score++; }
    });
    _pickWins.forEach(function(w) {
      var r = (_picks.result && _picks.result[w.id]) ? _picks.result[w.id] : '';
      var v = (_picks[person] && _picks[person][w.id]) ? _picks[person][w.id] : '';
      if (r && v) {
        possible++;
        var diff = Math.abs(parseInt(v,10) - parseInt(r,10));
        if (!isNaN(diff) && diff <= 3) score++;
      }
    });
    var el = document.getElementById('picks-score-' + person);
    if (el) el.textContent = possible > 0 ? score + '/' + possible : '—';
  });
}

// ── localStorage ──────────────────────────────────────────────────
function picksAutosave() {
  try { localStorage.setItem(_picksKey, JSON.stringify(_picks)); } catch(e) {}
}

function picksLoad() {
  try {
    var saved = JSON.parse(localStorage.getItem(_picksKey) || 'null');
    if (saved && typeof saved === 'object') {
      ['riley','chase','matt','result'].forEach(function(k) {
        if (saved[k] && typeof saved[k] === 'object') _picks[k] = saved[k];
      });
    }
  } catch(e) {}
  picksRenderAll();
  picksUpdateScores();
}

// ── Keyboard shortcut: Shift+Alt+P → Picks Admin ─────────────────
document.addEventListener('keydown', function(e) {
  if (e.shiftKey && e.altKey && (e.key === 'p' || e.key === 'P')) {
    var pw = document.getElementById('wrapper-picks');
    if (pw && pw.style.display !== 'none') {
      e.preventDefault();
      picksAdminToggle();
    }
  }
});

// ── Init ──────────────────────────────────────────────────────────
(function() {
  function go() { setTimeout(picksLoad, 250); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', go);
  } else { go(); }
})();
