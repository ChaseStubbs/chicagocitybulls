// ── Draft Tracker ──────────────────────────────────────────────────
var dtSelectedPick = null;

// Consensus defaults (pick → {name, meta})
var dtConsensus = {
  1:{name:'AJ Dybantsa',meta:'SF · BYU · 6\'9"'},
  2:{name:'Darryn Peterson',meta:'SG · Kansas · 6\'6"'},
  3:{name:'Cameron Boozer',meta:'PF · Duke · 6\'9"'},
  4:{name:'Caleb Wilson',meta:'PF · UNC · 6\'9"'},
  5:{name:'Nate Ament',meta:'SF · Tennessee · 6\'9"'},
  6:{name:'Tre Johnson',meta:'SG · Texas · 6\'5"'},
  7:{name:'Ace Bailey',meta:'SF · Rutgers · 6\'9"'},
  8:{name:'Kon Knueppel',meta:'SF · Duke · 6\'7"'},
  9:{name:'Mikel Brown Jr.',meta:'SG · Louisville · 6\'5"'},
  10:{name:'Collin Murray-Boyle',meta:'SF · Illinois · 6\'8"'},
  11:{name:'Carter Bryant',meta:'SF · Arizona · 6\'8"'},
  12:{name:'Yaxel Lendeborg',meta:'PF/C · Michigan · 6\'9"'},
  13:{name:'Brayden Burries',meta:'SG · Arizona · 6\'5"'},
  14:{name:'Khaman Maluach',meta:'C · Duke · 7\'1"'},
  15:{name:'Cameron Carr',meta:'SG · Baylor · 6\'6"'},
  16:{name:'Jalil Bethea',meta:'PG · Indiana · 6\'3"'},
  17:{name:'Walter Clayton Jr.',meta:'PG · Florida · 6\'2"'},
  18:{name:'Kiyomi McMillon',meta:'SF · UConn · 6\'7"'},
  19:{name:'Liam McNeeley',meta:'SF · UConn · 6\'7"'},
  20:{name:'Egor Demin',meta:'PG · BYU · 6\'9"'},
  21:{name:'Johni Broome',meta:'C · Auburn · 6\'10"'},
  22:{name:'Tounde Yessoufou',meta:'SF · Gonzaga · 6\'6"'},
  23:{name:'Dylan Harper',meta:'PG · Rutgers · 6\'6"'},
  24:{name:'Isaiah Collier',meta:'PG · USC · 6\'3"'},
  25:{name:'Kasparas Jakucionis',meta:'PG · Illinois · 6\'5"'},
  26:{name:'Eric Dixon',meta:'PF · Villanova · 6\'7"'},
  27:{name:'Noah Penda',meta:'SF · France · 6\'8"'},
  28:{name:'Will Riley',meta:'SF · Illinois · 6\'8"'},
  29:{name:'Rasheer Fleming',meta:'SF · St. Bonaventure · 6\'8"'},
  30:{name:'TBD — 2nd Pick',meta:"Ujiri's depth target"},
  37:{name:'TBD',meta:'Via Dallas · Depth pick'},
  48:{name:'TBD',meta:'Via Phoenix · AD trade'}
};

// Our team picks for summary strip
var dtOurPicks = [4,9,12,15,17,30,37,48];

// ── Inline row editor ─────────────────────────────────────────
var _dtInlineOpen = null; // pick number of currently open inline editor

function dtClickRow(rowEl, pickNum) {
  // Toggle: clicking open row closes it
  if (_dtInlineOpen === pickNum) { dtCloseInlineEditor(); return; }
  dtCloseInlineEditor();

  var pname = document.getElementById('pname-' + pickNum);
  var pmeta = document.getElementById('pmeta-' + pickNum);
  if (!pname) return;

  var currentName = pname.textContent.replace(/[🏹🏀🌩️]\s*OUR PICK/, '').replace('✓ LOCKED IN · ', '').trim();
  var currentMeta = pmeta ? pmeta.textContent.replace('✓ LOCKED IN · ', '').trim() : '';
  var teamName = rowEl.querySelector('.dt-row-team') ? rowEl.querySelector('.dt-row-team').textContent : '';
  var ourTeam  = rowEl.getAttribute('data-our') || '';

  var teamOpts = function(side) {
    return '<option value="">'+side+'&hellip;</option>'
      +'<option value="mavs">🏹 Dallas</option>'
      +'<option value="bulls">🏀 Chicago</option>'
      +'<option value="thunder">⚡ OKC</option>'
      +'<option value="other">Other</option>';
  };

  var ed = document.createElement('div');
  ed.className = 'dt-row-editor';
  ed.id = 'dt-inline-editor';
  ed.innerHTML =
    '<div class="dt-re-header">Editing <b>Pick #'+pickNum+'</b> &mdash; '+teamName+'</div>'
    +'<div class="dt-re-fields">'
    +'<input class="dt-re-input dt-re-name" id="dt-re-name" type="text" placeholder="Player name…" value="'+currentName.replace(/"/g,'&quot;')+'" autocomplete="off" spellcheck="false">'
    +'<input class="dt-re-input dt-re-meta" id="dt-re-meta" type="text" placeholder="Pos · School · Height" value="'+currentMeta.replace(/"/g,'&quot;')+'" autocomplete="off">'
    +'<button class="dt-re-confirm" onclick="dtConfirmInlinePick('+pickNum+')">✅ Confirm</button>'
    +'<button class="dt-re-reset" onclick="dtResetInlinePick('+pickNum+')">↺ Reset</button>'
    +'<button class="dt-re-cancel" onclick="dtCloseInlineEditor()" title="Close">✕</button>'
    +'</div>'
    +'<div><button class="dt-re-trade-btn" onclick="dtToggleInlineTrade(this)">🔀 Log a Trade for This Pick</button></div>'
    +'<div class="dt-re-trade-section" id="dt-re-trade-section" style="display:none;">'
    +'<div class="dt-input-label" style="font-size:10px;margin-bottom:6px;">Picks Changing Hands</div>'
    +'<div id="dt-re-pick-rows">'
    +'<div class="dt-ptr-row">'
    +'<input class="dt-input dt-ptr-pick" type="number" min="1" max="60" placeholder="Pick #" value="'+pickNum+'">'
    +'<select class="dt-input dt-ptr-from"><'+teamOpts('From')+'</select>'
    +(ourTeam ? '<script>document.querySelector("#dt-re-pick-rows .dt-ptr-from").value="'+ourTeam+'";<\/script>' : '')
    +'<span class="dt-ptr-arrow">&rarr;</span>'
    +'<select class="dt-input dt-ptr-to"><'+teamOpts('To')+'</select>'
    +'<button class="dt-ptr-remove" onclick="this.closest(\'.dt-ptr-row\').remove()" title="Remove">&times;</button>'
    +'</div></div>'
    +'<button class="dt-re-reset" style="margin:5px 0 10px;font-size:11px;" onclick="dtAddInlinePickRow()">+ Add pick</button>'
    +'<div class="dt-input-group" style="margin-bottom:10px;">'
    +'<div class="dt-input-label" style="font-size:10px;">Players Involved <span style="font-weight:400;opacity:.55">(optional)</span></div>'
    +'<input class="dt-input" id="dt-re-trade-players" type="text" placeholder="e.g. Josh Green to OKC, Klay Thompson to DAL">'
    +'</div>'
    +'<button class="dt-re-trade-confirm" onclick="dtConfirmInlineTrade()">🔀 Confirm Trade</button>'
    +'</div>';

  rowEl.after(ed);
  _dtInlineOpen = pickNum;
  rowEl.classList.add('editing');

  setTimeout(function() {
    var ni = document.getElementById('dt-re-name');
    if (ni) { ni.focus(); ni.select(); }
  }, 60);

  // Keyboard: Tab from name→meta, Enter on meta→confirm
  setTimeout(function() {
    var ni = document.getElementById('dt-re-name');
    var mi = document.getElementById('dt-re-meta');
    if (ni) ni.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); dtConfirmInlinePick(pickNum); }
      else if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); if (mi) { mi.focus(); mi.select(); } }
    });
    if (mi) mi.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); dtConfirmInlinePick(pickNum); }
    });
  }, 80);
}

function dtCloseInlineEditor() {
  var ed = document.getElementById('dt-inline-editor');
  if (ed) ed.remove();
  if (_dtInlineOpen) {
    var row = document.getElementById('row-' + _dtInlineOpen);
    if (row) row.classList.remove('editing');
  }
  _dtInlineOpen = null;
}

function dtConfirmInlinePick(pickNum) {
  var name = (document.getElementById('dt-re-name').value || '').trim();
  var meta = (document.getElementById('dt-re-meta').value || '').trim();
  if (!name) { document.getElementById('dt-re-name').focus(); return; }
  dtDirectConfirmPick(pickNum, name, meta);
  dtCloseInlineEditor();
}

function dtResetInlinePick(pickNum) {
  var def = dtConsensus[pickNum];
  if (!def) return;
  dtDirectResetPick(pickNum);
  dtCloseInlineEditor();
}

function dtToggleInlineTrade(btn) {
  var sec = document.getElementById('dt-re-trade-section');
  if (!sec) return;
  var open = sec.style.display !== 'none';
  sec.style.display = open ? 'none' : 'block';
  btn.textContent = open ? '🔀 Log a Trade for This Pick' : '✕ Close Trade';
}

function dtAddInlinePickRow() {
  var container = document.getElementById('dt-re-pick-rows');
  if (!container) return;
  var row = document.createElement('div');
  row.className = 'dt-ptr-row';
  row.innerHTML = '<input class="dt-input dt-ptr-pick" type="number" min="1" max="60" placeholder="Pick #">'
    +'<select class="dt-input dt-ptr-from"><option value="">From&hellip;</option><option value="mavs">🏹 Dallas</option><option value="bulls">🏀 Chicago</option><option value="thunder">⚡ OKC</option><option value="other">Other</option></select>'
    +'<span class="dt-ptr-arrow">&rarr;</span>'
    +'<select class="dt-input dt-ptr-to"><option value="">To&hellip;</option><option value="mavs">🏹 Dallas</option><option value="bulls">🏀 Chicago</option><option value="thunder">⚡ OKC</option><option value="other">Other</option></select>'
    +'<button class="dt-ptr-remove" onclick="this.closest(\'.dt-ptr-row\').remove()" title="Remove">&times;</button>';
  container.appendChild(row);
}

function dtConfirmInlineTrade() {
  var pickRows = document.querySelectorAll('#dt-re-pick-rows .dt-ptr-row');
  var picks = [];
  pickRows.forEach(function(r) {
    var p = r.querySelector('.dt-ptr-pick').value;
    var f = r.querySelector('.dt-ptr-from').value;
    var t = r.querySelector('.dt-ptr-to').value;
    if (p) picks.push({pick: parseInt(p), from: f, to: t});
  });
  if (!picks.length) return;
  var players = (document.getElementById('dt-re-trade-players').value || '').trim();
  dtConfirmTrade(picks, players);
  dtCloseInlineEditor();
}

// ── Direct confirm / reset (used by inline editor and OTC admin) ──
function dtDirectConfirmPick(pickNum, name, meta) {
  var pname = document.getElementById('pname-'+pickNum);
  var pmeta = document.getElementById('pmeta-'+pickNum);
  var row   = document.getElementById('row-'+pickNum);
  var ourTeam = row ? row.getAttribute('data-our') : '';
  var ourBadge = '';
  if (ourTeam) {
    var icon = ourTeam==='mavs'?'🏹':ourTeam==='bulls'?'🏀':'🌩️';
    ourBadge = ' <span style="font-size:9px;background:rgba(255,107,53,.2);border:1px solid rgba(255,107,53,.4);border-radius:3px;padding:1px 5px;color:#FF6B35;font-weight:700;margin-left:4px;">'+icon+' OUR PICK</span>';
  }
  if (pname) pname.innerHTML = name + ourBadge;
  if (pmeta) pmeta.innerHTML = '<span style="color:#00c864;font-weight:600;">✓</span> ' + meta;
  if (row) { row.classList.add('selected'); row.classList.remove('editing'); }
  var summary = document.getElementById('summary-'+pickNum);
  if (summary) { summary.textContent = name; summary.className = 'dt-pick-name confirmed'; }
  dtUpdatePickCounter();
  dtSavePick(pickNum, name, meta);
  dtInitRowTeamNames();
  dtFeedAdd(pickNum, name, meta, (_dtRTN && _dtRTN[pickNum]) || '');
  if (row) { row.classList.remove('just-confirmed'); void row.offsetWidth; row.classList.add('just-confirmed'); }
}

function dtDirectResetPick(pickNum) {
  var def = dtConsensus[pickNum];
  if (!def) return;
  var pname = document.getElementById('pname-'+pickNum);
  var pmeta = document.getElementById('pmeta-'+pickNum);
  var row   = document.getElementById('row-'+pickNum);
  var ourTeam = row ? row.getAttribute('data-our') : '';
  var ourBadge = '';
  if (ourTeam) {
    var icon = ourTeam==='mavs'?'🏹':ourTeam==='bulls'?'🏀':'🌩️';
    ourBadge = ' <span style="font-size:9px;background:rgba(255,107,53,.2);border:1px solid rgba(255,107,53,.4);border-radius:3px;padding:1px 5px;color:#FF6B35;font-weight:700;margin-left:4px;">'+icon+' OUR PICK</span>';
  }
  if (pname) pname.innerHTML = def.name + ourBadge;
  if (pmeta) pmeta.innerHTML = def.meta;
  if (row) row.classList.remove('selected','editing');
  var summary = document.getElementById('summary-'+pickNum);
  if (summary) { summary.textContent = def.name; summary.className = 'dt-pick-name'; }
  dtUpdatePickCounter();
}

// Keep legacy stubs so OTC admin still compiles
function dtSelectPick(n) { dtClickRow(document.getElementById('row-'+n), n); }
function dtConfirmPick() { if (dtSelectedPick) dtConfirmInlinePick(dtSelectedPick); }
function dtResetPick()   { if (dtSelectedPick) dtResetInlinePick(dtSelectedPick); }

// ── Pick counter ─────────────────────────────────────────────
function dtUpdatePickCounter() {
  var confirmed = document.querySelectorAll('#wrapper-draft .dt-row.selected').length;
  var el = document.getElementById('dt-pick-counter');
  if(el) el.textContent = confirmed + ' / 60';
}

// ── Reset All Picks ──────────────────────────────────────────
function dtResetAll() {
  if(!confirm('Reset all confirmed picks back to consensus? This cannot be undone.')) return;
  dtCloseInlineEditor();
  for(var i = 1; i <= 60; i++) { dtDirectResetPick(i); }
  dtSelectedPick = null;
  dtUpdatePickCounter();
  dtClearStorage();
  dtFeedClear();
}

// ── Trade Feature ────────────────────────────────────────────
var dtActiveTab = 'pick';
// Legacy stubs (panel removed, kept for safety)
function dtSwitchTab(tab) { dtActiveTab = tab; }
function dtAddPickRow() {}
function dtRemovePickRow(btn) { if (btn) btn.closest('.dt-ptr-row').remove(); }

// dtConfirmTrade now accepts either inline picks array or reads from old panel
function dtConfirmTrade(inlinePicks, inlinePlayers) {
  var transfers = [];
  if (inlinePicks) {
    // Called from inline editor
    inlinePicks.forEach(function(p) { if (p.pick && p.to) transfers.push(p); });
  } else {
    // Legacy panel path (panel is hidden but kept as fallback)
    var rows = document.querySelectorAll('#dt-pick-rows .dt-ptr-row');
    rows.forEach(function(r) {
      var pick = parseInt(r.querySelector('.dt-ptr-pick').value);
      var from = r.querySelector('.dt-ptr-from').value;
      var to   = r.querySelector('.dt-ptr-to').value;
      if (pick && to) transfers.push({pick:pick, from:from||'', to:to});
    });
  }
  var playersNote = inlinePlayers !== undefined ? inlinePlayers
    : (document.getElementById('dt-trade-players') ? document.getElementById('dt-trade-players').value.trim() : '');
  if (!transfers.length && !playersNote) return;
  var now = new Date();
  var timeStr = now.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit', second:'2-digit'});
  transfers.forEach(function(t) { dtUpdatePickOwnership(t.pick, t.to, t.from); });
  var parts = transfers.map(function(t) {
    var fromLabel = t.from ? (_dtTeamNames[t.from] || 'Other') + ' &#8594; ' : '';
    return 'Pick <b>#' + t.pick + '</b> ' + fromLabel + '<b>' + (_dtTeamNames[t.to] || 'Other') + '</b>';
  });
  var msg = '&#128256; <b>Trade:</b> ' + (parts.length ? parts.join(' &middot; ') : '(players only)');
  if (playersNote) msg += '<br><span style="color:var(--muted);font-size:11px;">Players: ' + playersNote + '</span>';
  dtAddTradeEntry(msg, timeStr);
  dtSelectedPick = null;
}

var _dtTeamNames = {mavs:'Dallas',bulls:'Chicago',thunder:'OKC',other:'Other Team','':''};
var _dtTeamIcons  = {mavs:'&#127865;',bulls:'&#127936;',thunder:'&#9889;',other:'&#11036;'};

function dtUpdatePickOwnership(pickNum, newOwner, oldOwner) {
  var row = document.getElementById('row-' + pickNum);
  if (oldOwner === undefined && row) oldOwner = row.getAttribute('data-our') || '';
  var newName = _dtTeamNames[newOwner] || 'Other';

  if (row) {
    row.setAttribute('data-our', newOwner === 'other' ? '' : newOwner);
    row.classList.remove('our-pick', 'mavs-row', 'bulls-row', 'thunder-row');
    if (newOwner !== 'other') row.classList.add('our-pick', newOwner + '-row');
    var pickEl = row.querySelector('.dt-row-pick');
    if (pickEl) pickEl.classList.toggle('own', newOwner !== 'other');
    // Update OUR PICK badge; add TRADED badge if player was already confirmed
    var pname = document.getElementById('pname-' + pickNum);
    if (pname) {
      var isConfirmed = row.classList.contains('selected');
      var stripped = pname.innerHTML
        .replace(/<span[^>]*OUR PICK[\s\S]*?<\/span>/g, '')
        .replace(/<span[^>]*traded-badge[\s\S]*?<\/span>/g, '')
        .trim();
      var badges = '';
      if (newOwner !== 'other') {
        badges += ' <span style="font-size:9px;background:rgba(255,107,53,.2);border:1px solid rgba(255,107,53,.4);border-radius:3px;padding:1px 5px;color:#FF6B35;font-weight:700;margin-left:4px;">' + _dtTeamIcons[newOwner] + ' OUR PICK</span>';
      }
      if (isConfirmed && oldOwner && oldOwner !== newOwner) {
        badges += ' <span class="traded-badge">&#128256; &#8594; ' + newName + '</span>';
      }
      pname.innerHTML = stripped + badges;
    }
    row.classList.remove('editing');
  }

  // Update summary strip pill
  var summaryEl = document.getElementById('summary-' + pickNum);
  if (summaryEl) {
    var pill = summaryEl.closest('.dt-pick-pill');
    if (pill) {
      pill.className = 'dt-pick-pill' + (newOwner !== 'other' ? ' ' + newOwner + '-pill' : '');
      pill.style.opacity = newOwner === 'other' ? '0.45' : '';
      var existNote = pill.querySelector('.pill-trade-note');
      if (existNote) existNote.remove();
      if (oldOwner !== newOwner) {
        var note = document.createElement('span');
        note.className = 'pill-trade-note';
        note.style.cssText = 'font-size:9px;color:var(--muted);display:block;margin-top:1px;';
        note.textContent = newOwner === 'other' ? '\u2192 traded away' : '\u2192 ' + newName;
        pill.appendChild(note);
      }
    }
  } else if (newOwner !== 'other') {
    // Incoming pick not in summary strip — add new pill to the right team section
    var isR2 = pickNum > 30;
    var tcPicks = document.getElementById('tc-' + newOwner + (isR2 ? '-r2' : '-r1'));
    if (tcPicks) {
      var newPill = document.createElement('div');
      newPill.className = 'dt-pick-pill ' + newOwner + '-pill';
      var consensus = (typeof dtConsensus !== 'undefined' && dtConsensus[pickNum]) ? dtConsensus[pickNum].name : 'TBD';
      newPill.innerHTML = '<span class="dt-pick-num">#' + pickNum + '</span><span class="dt-pick-name" id="summary-' + pickNum + '">' + consensus + '</span>';
      tcPicks.appendChild(newPill);
    }
  }
}

function dtAddTradeEntry(msg, timeStr) {
  var log = document.getElementById('dt-trade-log');
  if (log) log.style.display = '';
  var container = document.getElementById('dt-tl-entries');
  var empty = container ? container.querySelector('.dt-tl-empty') : null;
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'dt-tl-entry';
  entry.innerHTML = '<span class="dt-tl-time">' + timeStr + '</span><span class="dt-tl-msg">' + msg + '</span>';
  if (container) container.insertBefore(entry, container.firstChild);
}

function dtClearTradeLog() {
  var log = document.getElementById('dt-trade-log');
  var container = document.getElementById('dt-tl-entries');
  if (container) container.innerHTML = '<div class="dt-tl-empty">No trades logged yet. Switch to the &#128256; Log a Trade tab, enter picks &amp; players on both sides, and confirm.</div>';
  if (log) log.style.display = 'none';
}

// ══════════════════════════════════════════════════════════════════
// ADMIN MODE · LIVE LOGGING · PERSISTENCE
// ══════════════════════════════════════════════════════════════════
var dtAdminActive = false;
var dtOtcPick = 1;
var _dtRTN = {};           // pick# → team name (lazy)
var _dtStorageKey = 'hh-draft-2026';

// Lazy-init team name lookup from DOM
function dtInitRowTeamNames() {
  if (Object.keys(_dtRTN).length) return;
  document.querySelectorAll('#wrapper-draft .dt-row[data-pick]').forEach(function(r) {
    var p = parseInt(r.getAttribute('data-pick'));
    var el = r.querySelector('.dt-row-team');
    if (p && el) _dtRTN[p] = el.textContent.trim();
  });
}

// ── Admin activate / deactivate ───────────────────────────────────
function dtAdminToggle() {
  if (dtAdminActive) { dtAdminDeactivate(); return; }
  var code = prompt('Enter draft admin code:');
  if (code === null || code.trim() !== '2026') return;
  dtAdminActivate();
}

function dtAdminActivate() {
  dtInitRowTeamNames();
  dtAdminActive = true;
  document.getElementById('dt-admin-bar').classList.add('active');
  dtOtcPick = dtFindNextUnconfirmed(1);
  dtAdminSetOtc(dtOtcPick);
}

function dtAdminDeactivate() {
  dtAdminActive = false;
  document.getElementById('dt-admin-bar').classList.remove('active');
  document.querySelectorAll('.dt-row.on-the-clock').forEach(function(r) {
    r.classList.remove('on-the-clock');
  });
}

// ── Set "On the Clock" pick ───────────────────────────────────────
function dtAdminSetOtc(n) {
  dtInitRowTeamNames();
  n = Math.max(1, Math.min(60, n));
  dtOtcPick = n;
  dtSelectedPick = n;
  document.querySelectorAll('.dt-row.on-the-clock').forEach(function(r) {
    r.classList.remove('on-the-clock');
  });
  var row = document.getElementById('row-' + n);
  if (row && !row.classList.contains('selected')) {
    row.classList.add('on-the-clock');
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  var lbl = document.getElementById('dt-otc-label');
  if (lbl) lbl.textContent = 'On the Clock: Pick #' + n + (_dtRTN[n] ? ' — ' + _dtRTN[n] : '');
  // Pre-fill consensus meta in admin bar
  var cons = dtConsensus[n];
  var metaEl = document.getElementById('dt-admin-meta');
  if (cons && metaEl && !metaEl.value) metaEl.value = cons.meta || '';
  var nameEl = document.getElementById('dt-admin-name');
  if (nameEl) { nameEl.value = ''; nameEl.focus(); }
  // Highlight row as editing in board
  document.querySelectorAll('.dt-row.editing').forEach(function(r) { r.classList.remove('editing'); });
  if (row) row.classList.add('editing');
}

// ── Admin confirm / skip / nav ────────────────────────────────────
function dtAdminConfirm() {
  var name = (document.getElementById('dt-admin-name').value || '').trim();
  if (!name) { document.getElementById('dt-admin-name').focus(); return; }
  var meta = (document.getElementById('dt-admin-meta').value || '').trim();
  // Confirm directly without needing the old panel
  dtDirectConfirmPick(dtOtcPick, name, meta);
  dtCloseInlineEditor();
  // Clear admin input fields
  document.getElementById('dt-admin-name').value = '';
  document.getElementById('dt-admin-meta').value = '';
  // Advance to next unconfirmed
  var next = dtFindNextUnconfirmed(dtOtcPick + 1);
  if (next <= 60) {
    dtAdminSetOtc(next);
  } else {
    var lbl = document.getElementById('dt-otc-label');
    if (lbl) lbl.innerHTML = '🎉 All 60 picks logged!';
    document.querySelectorAll('.dt-row.on-the-clock').forEach(function(r) { r.classList.remove('on-the-clock'); });
  }
}

function dtAdminSkip() {
  var next = dtFindNextUnconfirmed(dtOtcPick + 1);
  if (next <= 60) dtAdminSetOtc(next);
}

function dtAdminNav(dir) {
  var target = Math.max(1, Math.min(60, dtOtcPick + dir));
  dtAdminSetOtc(target);
}

function dtFindNextUnconfirmed(startFrom) {
  for (var i = startFrom; i <= 60; i++) {
    var r = document.getElementById('row-' + i);
    if (r && !r.classList.contains('selected')) return i;
  }
  return 61;
}

// ── localStorage persistence ──────────────────────────────────────
function dtSavePick(pickNum, name, meta) {
  try {
    var saved = JSON.parse(localStorage.getItem(_dtStorageKey) || '{}');
    saved[pickNum] = { name: name, meta: meta, ts: Date.now() };
    localStorage.setItem(_dtStorageKey, JSON.stringify(saved));
  } catch(e) {}
}

function dtClearStorage() {
  try { localStorage.removeItem(_dtStorageKey); } catch(e) {}
}

function dtApplyPickToBoard(pickNum, name, meta) {
  // Thin wrapper used by dtLoadSavedPicks — calls shared confirm logic
  dtDirectConfirmPick(pickNum, name, meta);
  // Also remove OTC pulsing for restored picks
  var row = document.getElementById('row-' + pickNum);
  if (row) row.classList.remove('on-the-clock');
}

function dtLoadSavedPicks() {
  dtInitRowTeamNames();
  try {
    var saved = JSON.parse(localStorage.getItem(_dtStorageKey) || '{}');
    var keys = Object.keys(saved).map(Number).sort(function(a,b){ return a - b; });
    if (!keys.length) return;
    keys.forEach(function(n) {
      var p = saved[n];
      dtApplyPickToBoard(n, p.name, p.meta);
      dtFeedAdd(n, p.name, p.meta, _dtRTN[n] || '', new Date(p.ts), true);
    });
    dtUpdatePickCounter();
  } catch(e) {}
}

// ── Activity Feed ─────────────────────────────────────────────────
function dtFeedAdd(pickNum, name, meta, team, dateObj, silent) {
  var container = document.getElementById('dt-feed-entries');
  if (!container) return;
  var emptyMsg = container.querySelector('.dt-feed-empty');
  if (emptyMsg) emptyMsg.remove();
  var d = dateObj || new Date();
  var timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  var row = document.getElementById('row-' + pickNum);
  var ourTeam = row ? (row.getAttribute('data-our') || '') : '';
  var pickColor = ourTeam === 'mavs' ? '#409fd8' : ourTeam === 'bulls' ? '#e85c80' : ourTeam === 'thunder' ? '#50aadf' : 'var(--muted)';
  var entry = document.createElement('div');
  entry.className = 'dt-feed-entry' + (silent ? '' : ' new');
  entry.innerHTML =
    '<div class="dt-feed-time">' + timeStr + '</div>' +
    '<div class="dt-feed-pick" style="color:' + pickColor + ';">#' + pickNum + '</div>' +
    '<div><div class="dt-feed-player">' + name + '</div>' +
    '<div class="dt-feed-detail">' + (meta || '') + (team ? ' &middot; ' + team : '') + '</div></div>';
  container.insertBefore(entry, container.firstChild);
}

function dtFeedClear() {
  var container = document.getElementById('dt-feed-entries');
  if (container) container.innerHTML = '<div class="dt-feed-empty">No picks confirmed yet. Click ✏️ Edit on any board row to log a pick — or press <b>Shift+Alt+D</b> on draft night to open Admin Mode for fast keyboard logging.</div>';
}

// ── Share state via URL ───────────────────────────────────────────
function dtShareState() {
  try {
    var saved = localStorage.getItem(_dtStorageKey) || '{}';
    var encoded = btoa(unescape(encodeURIComponent(saved)));
    var base = window.location.href.split('#')[0];
    var url = base + '#draft?state=' + encoded;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function() {
        alert('📤 Share link copied!\n\nSend to friends — they open it to see the current draft board state.');
      }).catch(function() { prompt('Copy this share link:', url); });
    } else {
      prompt('Copy this share link:', url);
    }
  } catch(e) { alert('Could not generate share link.'); }
}

// Import state from URL hash on page load
(function() {
  try {
    var hash = window.location.hash || '';
    var m = hash.match(/[?&]state=([A-Za-z0-9+/=]+)/);
    if (!m) return;
    var decoded = decodeURIComponent(escape(atob(m[1])));
    var imported = JSON.parse(decoded);
    var existing = JSON.parse(localStorage.getItem(_dtStorageKey) || '{}');
    Object.keys(imported).forEach(function(k) { existing[k] = imported[k]; });
    localStorage.setItem(_dtStorageKey, JSON.stringify(existing));
  } catch(e) {}
})();

// ── Keyboard shortcut: Shift+Alt+D → Admin Mode ───────────────────
document.addEventListener('keydown', function(e) {
  if (e.shiftKey && e.altKey && (e.key === 'd' || e.key === 'D')) {
    var dw = document.getElementById('wrapper-draft');
    if (dw && dw.style.display !== 'none') {
      e.preventDefault();
      dtAdminToggle();
    }
  }
});

// ── Admin form keyboard nav ───────────────────────────────────────
(function() {
  function wireAdminKeys() {
    var nameEl = document.getElementById('dt-admin-name');
    var metaEl = document.getElementById('dt-admin-meta');
    if (!nameEl || !metaEl) return;
    nameEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        if (!metaEl.value.trim()) { metaEl.focus(); }
        else { dtAdminConfirm(); }
      }
      if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); metaEl.focus(); }
    });
    metaEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') dtAdminConfirm();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAdminKeys);
  } else {
    wireAdminKeys();
  }
})();

// ── Load persisted picks on page ready ───────────────────────────
(function() {
  function loadOnReady() { setTimeout(dtLoadSavedPicks, 150); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadOnReady);
  } else {
    loadOnReady();
  }
})();

// ── Draft night countdown
function dtUpdateCountdown() {
  var el = document.getElementById('dt-countdown');
  if(!el) return;
  var draftTime = new Date('2026-06-23T20:00:00-04:00').getTime();
  var now = Date.now();
  var diff = draftTime - now;
  if(diff <= 0){ el.textContent = '🔴 LIVE NOW — Draft Night!'; el.style.color='#e63946'; return; }
  var days = Math.floor(diff/86400000);
  var hrs = Math.floor((diff%86400000)/3600000);
  var mins = Math.floor((diff%3600000)/60000);
  var secs = Math.floor((diff%60000)/1000);
  el.textContent = '⏱ ' + days + 'd ' + hrs + 'h ' + mins + 'm ' + secs + 's until Draft Night';
}
dtUpdateCountdown();
setInterval(dtUpdateCountdown, 1000);

