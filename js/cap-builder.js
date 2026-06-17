// ═══════════════════════════ CAP BUILDER FACTORY ══════════════════════
function createCapBuilder(cfg) {
  const T = cfg.teamId;
  const el = id => document.getElementById(T + '-' + id);

  const CAP=165000000, TAX=200000000, AP1=206000000, AP2=217000000;
  const CAP27=172000000, TAX27=209000000, AP127=215000000, AP227=226000000;
  const MAX_DISPLAY=250000000;

  let addFilter='all', activeYear=2026;
  const rOff=new Set(), aOn=new Set();

  function fmt(n){const a=Math.abs(n);return(n<0?'-':'')+'$'+(a>=1000000?(a/1e6).toFixed(1)+'M':a.toLocaleString());}
  function getL(){return activeYear===2027?{cap:CAP27,tax:TAX27,ap1:AP127,ap2:AP227}:{cap:CAP,tax:TAX,ap1:AP1,ap2:AP2};}

  function calcTotals(){
    const key=activeYear===2027?'sal27':'sal';
    let sal=0,count=0;
    cfg.roster.forEach(p=>{if(!rOff.has(p.id)){sal+=(p[key]||0);count++;}});
    cfg.additions.forEach(p=>{if(aOn.has(p.id)){sal+=(p[key]||0);count++;}});
    return{sal,count};
  }

  function getActivePlayers(){
    const players=[];
    cfg.roster.forEach(p=>{if(!rOff.has(p.id))players.push(p);});
    cfg.additions.forEach(p=>{if(aOn.has(p.id))players.push(p);});
    return players;
  }

  function calcScore(){
    const players=getActivePlayers();
    if(!players.length)return{total:0,length:0,youth:0,def:0,pipe:0,avgWing:'0.0',youngPct:0,defPct:0,pipePct:0};
    const n=players.length;
    const avgWing=players.reduce((s,p)=>s+(p.wingDiff||0),0)/n;
    const youngAge=cfg.youthAge||25;
    const youngPct=players.filter(p=>(p.age||30)<=youngAge).length/n;
    const defPct=players.filter(p=>p.def).length/n;
    const pipePct=cfg.pipelineFn(players)/n;
    const l=avgWing>=3.0?25:avgWing>=2.5?20:avgWing>=2.0?15:avgWing>=1.5?9:4;
    const y=youngPct>=.60?25:youngPct>=.40?19:youngPct>=.25?12:youngPct>=.10?6:0;
    const d=defPct>=.50?25:defPct>=.35?19:defPct>=.20?12:defPct>=.10?6:0;
    const pp=pipePct>=.50?25:pipePct>=.35?19:pipePct>=.20?12:pipePct>=.10?6:0;
    return{total:l+y+d+pp,length:l,youth:y,def:d,pipe:pp,avgWing:avgWing.toFixed(1),youngPct:Math.round(youngPct*100),defPct:Math.round(defPct*100),pipePct:Math.round(pipePct*100)};
  }

  function gradeInfo(score){
    const g=cfg.grades||[
      {min:85,letter:'A+',desc:"GM's Dream Roster",color:'var(--teal)'},
      {min:70,letter:'A', desc:'Built for the Future',color:'#7DBAEC'},
      {min:55,letter:'B', desc:'Solid Foundation',color:'var(--green)'},
      {min:40,letter:'C', desc:'Mixed Signals',color:'var(--yellow)'},
      {min:0, letter:'D', desc:'Old NBA Energy',color:'#E07070'},
    ];
    return g.find(x=>score>=x.min)||g[g.length-1];
  }

  function updateScore(){
    const s=calcScore(), g=gradeInfo(s.total);
    el('usScoreNum').textContent=s.total; el('usScoreNum').style.color=g.color;
    el('usGrade').textContent=g.letter+' — '+g.desc; el('usGrade').style.color=g.color;
    const setBar=(b,v,pts,lbl)=>{
      const be=el(b), ve=el(v);
      if(be)be.style.width=(pts/25*100)+'%';
      if(ve)ve.textContent=pts+'/25 · '+lbl;
    };
    setBar('us-length-bar','us-length-val',s.length,'avg +'+s.avgWing+'"');
    setBar('us-youth-bar', 'us-youth-val', s.youth, s.youngPct+'% ≤'+(cfg.youthAge||25));
    setBar('us-def-bar',   'us-def-val',   s.def,   s.defPct+'% defensive');
    setBar('us-pipe-bar',  'us-pipe-val',  s.pipe,  s.pipePct+'% '+cfg.pipelineLabel);
    drawRadar(s);
  }

  // ─── Visualization helpers ─────────────────────────────────────────
  function cssV(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()||'#888';}

  function drawRadar(s){
    const c=el('radarCanvas');
    if(!c||!c.getContext)return;
    const ctx=c.getContext('2d');
    const container=c.parentElement;
    const size=Math.min(container?container.clientWidth:200,200);
    const W=size,H=size;
    c.width=W;c.height=H;
    ctx.clearRect(0,0,W,H);
    const cx=W/2,cy=H/2+6,R=62;
    const axLabels=['LENGTH','YOUTH','DEFENSE',(cfg.pipelineLabel||'PIPELINE').toUpperCase()];
    const axVals=[s.length,s.youth,s.def,s.pipe];
    const axSub=['+'+s.avgWing+'"',s.youngPct+'%',s.defPct+'%',s.pipePct+'%'];
    const axCol=['#00B4AE','#7DBAEC','#2ECC71','#F5C342'];
    const N=4;
    const ang=i=>(Math.PI*2/N)*i-Math.PI/2;
    const isLt=document.documentElement.hasAttribute('data-light');
    const gridRing=isLt?'rgba(0,0,0,':'rgba(255,255,255,';
    const gridSpoke=isLt?'rgba(0,0,0,.1)':'rgba(255,255,255,.1)';
    const labelSub=isLt?'rgba(0,0,0,.45)':'rgba(255,255,255,.5)';
    // Grid rings
    [.25,.5,.75,1].forEach(f=>{
      ctx.beginPath();
      for(let i=0;i<N;i++){
        const a=ang(i),x=cx+Math.cos(a)*R*f,y=cy+Math.sin(a)*R*f;
        i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.strokeStyle=gridRing+(f===1?.15:.05)+')';
      ctx.lineWidth=f===1?1.5:1;
      ctx.stroke();
    });
    // Axis spokes
    for(let i=0;i<N;i++){
      const a=ang(i);
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);
      ctx.strokeStyle=gridSpoke;ctx.lineWidth=1;ctx.stroke();
    }
    // Filled polygon
    const tc=cssV('--team-primary');
    ctx.beginPath();
    for(let i=0;i<N;i++){
      const f=axVals[i]/25,a=ang(i),x=cx+Math.cos(a)*R*f,y=cy+Math.sin(a)*R*f;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fillStyle=tc+'33';ctx.fill();
    ctx.strokeStyle=tc;ctx.lineWidth=2;ctx.stroke();
    // Data dots
    for(let i=0;i<N;i++){
      const f=axVals[i]/25,a=ang(i),x=cx+Math.cos(a)*R*f,y=cy+Math.sin(a)*R*f;
      ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);
      ctx.fillStyle=axCol[i];ctx.fill();
    }
    // Axis labels + values
    ctx.textAlign='center';ctx.textBaseline='middle';
    for(let i=0;i<N;i++){
      const a=ang(i),lx=cx+Math.cos(a)*(R+22),ly=cy+Math.sin(a)*(R+22);
      ctx.font='bold 8px -apple-system,sans-serif';
      ctx.fillStyle=axCol[i];ctx.fillText(axLabels[i],lx,ly-6);
      ctx.font='9px -apple-system,sans-serif';
      ctx.fillStyle=labelSub;ctx.fillText(axVals[i]+'/25 · '+axSub[i],lx,ly+6);
    }
  }

  function drawScatter(players,year){
    const c=el('scatterCanvas');
    if(!c||!c.getContext)return;
    const container=c.parentElement;
    const W=container?Math.max(container.clientWidth-4,200):420;
    const H=Math.round(W*200/420);
    c.width=W;c.height=H;
    const ctx=c.getContext('2d');
    ctx.clearRect(0,0,W,H);
    if(!players.length)return;
    const key=year===2027?'sal27':'sal';
    const PAD={l:44,r:14,t:14,b:30};
    const pw=W-PAD.l-PAD.r,ph=H-PAD.t-PAD.b;
    const ages=players.map(p=>p.age||25);
    const sals=players.map(p=>p[key]||0);
    const minAge=Math.max(18,Math.min(...ages)-1.5);
    const maxAge=Math.min(42,Math.max(...ages)+1.5);
    const maxSal=Math.max(...sals)*1.18||5000000;
    const sx=age=>PAD.l+(age-minAge)/(maxAge-minAge)*pw;
    const sy=sal=>PAD.t+ph*(1-sal/maxSal);
    const tc=cssV('--team-primary');
    const isLt2=document.documentElement.hasAttribute('data-light');
    const sGridLine=isLt2?'rgba(0,0,0,.07)':'rgba(255,255,255,.05)';
    const sGridLabel=isLt2?'rgba(0,0,0,.45)':'rgba(255,255,255,.28)';
    const sNameLabel=isLt2?'rgba(0,0,0,.7)':'rgba(255,255,255,.75)';
    const sAxisLabel=isLt2?'rgba(0,0,0,.3)':'rgba(255,255,255,.22)';
    const sPrimeZone=isLt2?'rgba(0,0,0,.02)':'rgba(255,255,255,.02)';
    const sPrimeLabel=isLt2?'rgba(0,0,0,.1)':'rgba(255,255,255,.1)';
    // Prime zone highlight
    const px1=Math.max(PAD.l,sx(25)),px2=Math.min(PAD.l+pw,sx(30));
    if(px2>px1){ctx.fillStyle=sPrimeZone;ctx.fillRect(px1,PAD.t,px2-px1,ph);}
    // Grid
    [10,20,30,40].forEach(m=>{
      const y=sy(m*1e6);if(y<PAD.t-2||y>PAD.t+ph+2)return;
      ctx.beginPath();ctx.moveTo(PAD.l,y);ctx.lineTo(PAD.l+pw,y);
      ctx.strokeStyle=sGridLine;ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle=sGridLabel;ctx.font='8px -apple-system,sans-serif';
      ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText('$'+m+'M',PAD.l-3,y);
    });
    [20,25,30,35].forEach(age=>{
      if(age<minAge||age>maxAge)return;
      const x=sx(age);
      ctx.beginPath();ctx.moveTo(x,PAD.t);ctx.lineTo(x,PAD.t+ph);
      ctx.strokeStyle=sGridLine;ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle=sGridLabel;ctx.font='8px -apple-system,sans-serif';
      ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(age,x,PAD.t+ph+3);
    });
    // Prime label
    if(px2>px1+10){ctx.fillStyle=sPrimeLabel;ctx.font='bold 7px -apple-system,sans-serif';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText('PRIME',(px1+px2)/2,PAD.t+3);}
    // Bubbles
    players.forEach(p=>{
      const sal=p[key]||0;if(sal<=0&&!p.draft)return;
      const x=sx(p.age||25),y=sy(sal);
      const r=4+((p.wingDiff||0)/6)*11;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle=p.def?tc+'88':tc+'33';ctx.fill();
      ctx.strokeStyle=p.def?tc:tc+'66';ctx.lineWidth=p.def?1.5:1;ctx.stroke();
      const nm=p.name.split(' ').pop();
      ctx.fillStyle=sNameLabel;ctx.font='8px -apple-system,sans-serif';
      ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(nm,x,y-r-1);
    });
    // Axis labels
    ctx.fillStyle=sAxisLabel;ctx.font='bold 8px -apple-system,sans-serif';
    ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText('AGE →',PAD.l+pw/2,H-1);
    ctx.save();ctx.translate(8,PAD.t+ph/2);ctx.rotate(-Math.PI/2);
    ctx.textAlign='center';ctx.fillStyle=sAxisLabel;ctx.fillText('SALARY',0,7);ctx.restore();
  }

  function updateDNA(players){
    const bar=el('dnaBar'),leg=el('dnaLegend');
    if(!bar||!leg||!players.length)return;
    const tc=cssV('--team-primary');
    const ARCHS=[
      {key:'Core',    label:'Core',       col:tc},
      {key:'Prospect',label:'Prospect',   col:'#00B4AE'},
      {key:'Anchor',  label:'Anchor Def', col:'#2ECC71'},
      {key:'Defender',label:'Defender',   col:'#5090C0'},
      {key:'Intl',    label:"Int'l",      col:'#A77BCA'},
      {key:'Scorer',  label:'Scorer',     col:'#F5C342'},
    ];
    const gA=p=>{
      if(p.locked&&(p.sal||0)>=20000000)return'Core';
      if((p.age||30)<=22)return'Prospect';
      if(p.def&&(p.wingDiff||0)>=3.0)return'Anchor';
      if(p.def)return'Defender';
      if(p.intl)return'Intl';
      return'Scorer';
    };
    const cnt={};ARCHS.forEach(a=>{cnt[a.key]=0;});
    players.forEach(p=>{const k=gA(p);if(k in cnt)cnt[k]++;});
    const n=players.length;
    bar.innerHTML=ARCHS.filter(a=>cnt[a.key]>0).map(a=>`<div class="dna-segment" title="${a.label}: ${cnt[a.key]}" style="width:${(cnt[a.key]/n*100).toFixed(1)}%;background:${a.col};">${cnt[a.key]>1?cnt[a.key]:''}</div>`).join('');
    leg.innerHTML=ARCHS.filter(a=>cnt[a.key]>0).map(a=>`<div class="dna-leg-item"><div class="dna-leg-swatch" style="background:${a.col};"></div><span class="dna-leg-count">${cnt[a.key]}</span>&nbsp;${a.label}</div>`).join('');
  }

  function updateExceptions(sal){
    const{cap,tax,ap1,ap2}=getL();
    let items;
    if(sal<cap){items=[
      {e:'✅',n:'Full Cap Space',d:fmt(cap-sal)+' available — sign anyone'},
      {e:'✅',n:'Room MLE',d:'~$7.5M (if closing cap space)'},
      {e:'✅',n:'Sign-and-Trades',d:'Allowed — both directions'},
      {e:'✅',n:'Bird Rights',d:'Can re-sign own free agents over cap'},
    ];}else if(sal<tax){items=[
      {e:'✅',n:'Non-Taxpayer MLE',d:'~$12.4M · up to 3 years'},
      {e:'✅',n:'Bi-Annual Exception',d:'~$4.5M · 2 years · every other year'},
      {e:'✅',n:'Sign-and-Trades',d:'Allowed both directions'},
      {e:'✅',n:'Bird Rights',d:'Can re-sign own free agents'},
      {e:'⚠️',n:'No cap room',d:'Cannot use room exceptions'},
    ];}else if(sal<ap1){items=[
      {e:'✅',n:'Taxpayer MLE',d:'~$5.0M · up to 2 years'},
      {e:'❌',n:'Bi-Annual Exception',d:'NOT available in tax'},
      {e:'✅',n:'Bird Rights',d:'Still available for re-signs'},
      {e:'⚠️',n:'S&T restricted',d:'Outgoing sign-and-trades only'},
      {e:'💸',n:'Luxury Tax Penalties',d:'$1.50–$4.25+ per $ over tax line'},
    ];}else if(sal<ap2){items=[
      {e:'❌',n:'Taxpayer MLE',d:'NOT available above First Apron'},
      {e:'❌',n:'Bi-Annual Exception',d:'NOT available'},
      {e:'❌',n:'Sign-and-Trades',d:'Cannot execute S&T of any kind'},
      {e:'❌',n:'Salary Aggregation',d:'Cannot combine players in trades'},
      {e:'❌',n:'Cash in trades',d:'Prohibited'},
      {e:'✅',n:'Veteran Minimum',d:'Only remaining signing vehicle'},
    ];}else{items=[
      {e:'❌',n:'All MLE / BAE / S&T',d:'No exceptions available'},
      {e:'❌',n:'Aggregation &amp; Cash',d:'Prohibited'},
      {e:'🔒',n:'Draft Pick Freeze',d:'Picks frozen for 5 years'},
      {e:'🔒',n:'First-Round Restriction',d:'Cannot trade 1st-rounders 7 yrs out'},
      {e:'✅',n:'Veteran Minimum',d:'Only tool remaining'},
    ];}
    const exc=el('cbExceptions');
    if(exc)exc.innerHTML=items.map(i=>`<div class="cb-exc-item"><span class="cb-exc-icon">${i.e}</span><div><span class="cb-exc-name">${i.n}</span> — <span class="cb-exc-detail">${i.d}</span></div></div>`).join('');
  }

  function updateUI(){
    const{cap,tax,ap1,ap2}=getL();
    const{sal,count}=calcTotals();
    const space=cap-sal;
    const fill=el('capBarFill');
    if(fill){fill.style.width=Math.min((sal/MAX_DISPLAY)*100,100)+'%';fill.className='cb-bar-fill '+(sal<cap?'safe':sal<tax?'over-cap':sal<ap1?'over-tax':'over-ap1');}
    const markers=el('capMarkers');
    if(markers)markers.innerHTML=[
      {val:cap,label:'Cap '+fmt(cap),color:'#7DBAEC'},
      {val:tax,label:'Tax '+fmt(tax),color:'#F5C342'},
      {val:ap1,label:'Apron 1',color:'#E07070'},
      {val:ap2,label:'Apron 2',color:'#E74C3C'},
    ].map(t=>{const x=Math.min((t.val/MAX_DISPLAY)*100,99);return`<div class="cb-marker" style="left:${x}%;color:${t.color};"><div class="cb-marker-line"></div><div class="cb-marker-label">${t.label}</div></div>`;}).join('');
    const ca=el('committedAmt'); if(ca)ca.textContent=fmt(sal);
    const sc=el('sv-committed'); if(sc){sc.textContent=fmt(sal);sc.style.color=sal>ap1?'var(--red)':sal>tax?'#E07070':sal>cap?'var(--yellow)':'#7DBAEC';}
    const ss=el('sv-space'); if(ss){ss.textContent=fmt(Math.abs(space));ss.style.color=space>20000000?'var(--green)':space>0?'var(--yellow)':'var(--red)';}
    const sp=el('sv-spots'); if(sp)sp.textContent=count+' / 15';
    const ts=el('sv-taxstatus'); if(ts){
      if(sal<cap){ts.textContent='Under Cap';ts.style.color='var(--green)';}
      else if(sal<tax){ts.textContent='Over Cap';ts.style.color='var(--yellow)';}
      else if(sal<ap1){ts.textContent='Taxpayer';ts.style.color='#E07070';}
      else if(sal<ap2){ts.textContent='Apron 1';ts.style.color='var(--red)';}
      else{ts.textContent='Apron 2';ts.style.color='#FF6B6B';}
    }
    const msg=el('cbStatusMsg'), icon=el('cbStatusIcon');
    if(msg&&icon){
      msg.className='cb-status-msg';
      if(sal<cap){msg.classList.add('status-safe');icon.textContent='✅';msg.innerHTML=`<strong>Under the cap</strong> by ${fmt(space)}. Full flexibility — sign anyone, use room exceptions, make sign-and-trades freely.`;}
      else if(sal<tax){msg.classList.add('status-cap');icon.textContent='⚠️';msg.innerHTML=`<strong>Over the cap</strong> by ${fmt(-space)}. Non-Taxpayer MLE (~$12.4M) is the primary tool.`;}
      else if(sal<ap1){msg.classList.add('status-tax');icon.textContent='💸';msg.innerHTML=`<strong>In luxury tax</strong> — ${fmt(sal-tax)} over. Taxpayer MLE (~$5M) only. Dollar-for-dollar penalties above the tax line.`;}
      else if(sal<ap2){msg.classList.add('status-ap1');icon.textContent='🚨';msg.innerHTML=`<strong>Above First Apron (${fmt(ap1)})</strong> — No MLE, no S&T, can't aggregate salaries.`;}
      else{msg.classList.add('status-ap2');icon.textContent='🔴';msg.innerHTML=`<strong>Above Second Apron (${fmt(ap2)})</strong> — Most severe restrictions. Draft picks frozen 5 years.`;}
    }
    updateExceptions(sal);updateScore();
    const rc=el('rosterCount'); if(rc)rc.textContent=cfg.roster.filter(p=>!rOff.has(p.id)).length+' players';
    const ac=el('addCount'); if(ac)ac.textContent=aOn.size+' added';
    if(activeYear===2027)updateForwardLook();
    const vizP=getActivePlayers();
    drawScatter(vizP,activeYear);
    updateDNA(vizP);
  }

  function setYear(year){
    activeYear=year;
    const b26=el('btn2026'),b27=el('btn2027');
    if(b26)b26.classList.toggle('active',year===2026);
    if(b27)b27.classList.toggle('active',year===2027);
    const fp=el('flPanel'); if(fp)fp.classList.toggle('visible',year===2027);
    updateUI();
    if(year===2027)updateForwardLook();
  }

  function updateForwardLook(){
    if(!cfg.forwardLook)return;
    cfg.forwardLook({T,el,rOff,aOn,fmt,roster:cfg.roster,additions:cfg.additions});
  }

  function buildRosterRows(){
    const rr=el('rosterRows'); if(!rr)return;
    const key=activeYear===2027?'sal27':'sal';
    rr.innerHTML=cfg.roster.map(p=>{
      const off=rOff.has(p.id);
      return`<div class="cb-row" id="${T}-row-${p.id}" style="${off?'opacity:.4;':''}">
        <label class="cb-toggle"><input type="checkbox" ${off?'':'checked'} ${p.locked?'disabled':''} onchange="builders.${T}.toggleRoster('${p.id}',this.checked)"><span class="cb-slider"></span></label>
        <div class="cb-row-info">
          <div class="${p.locked?'cb-row-name locked-name':'cb-row-name'}">${p.name}${p.locked?' <span style="font-size:9px;color:var(--muted);">🔒</span>':''}</div>
          <div class="cb-row-sal">${fmt(p[key]||0)} · ${p.note}${(p.sal27===0&&activeYear===2026)?' <span class="exp-tag">EXP</span>':''}</div>
        </div></div>`;
    }).join('');
  }

  function buildAdditionRows(){
    const ar=el('additionRows'); if(!ar)return;
    const query=(el('addSearch')?.value||'').toLowerCase().trim();
    let pool=addFilter==='all'?cfg.additions:cfg.additions.filter(p=>p.type===addFilter);
    if(query)pool=pool.filter(p=>p.name.toLowerCase().includes(query)||p.note.toLowerCase().includes(query));
    let html='';
    if(addFilter==='all'&&!query){
      [['draft','Draft Picks'],['fa','Free Agents'],['trade','Trade Targets']].forEach(([key,label])=>{
        const ps=pool.filter(p=>p.type===key);
        if(ps.length){html+=`<div class="cb-section-divider">${label}</div>`;html+=ps.map(buildAddRow).join('');}
      });
    }else{
      html=pool.length?pool.map(buildAddRow).join(''):'<div style="color:var(--muted);font-size:12px;padding:12px 0;text-align:center;">No results</div>';
    }
    ar.innerHTML=html;
  }

  function buildAddRow(p){
    const on=aOn.has(p.id);
    return`<div class="cb-row" id="${T}-addrow-${p.id}">
      <button class="cb-add-btn${on?' added':''}" id="${T}-addbtn-${p.id}" onclick="builders.${T}.toggleAddition('${p.id}')">${on?'':`<span class="cb-plus">+</span>`}</button>
      <div class="cb-row-info">
        <div class="cb-row-name">${p.name} <span class="cb-row-tag ${p.type}">${p.type.toUpperCase()}</span></div>
        <div class="cb-row-sal">${fmt(p.sal)} · ${p.note}</div>
      </div></div>`;
  }

  function setAddFilter(type,btn){
    addFilter=type;
    const parent=btn.closest('.cb-filter-tabs');
    if(parent)parent.querySelectorAll('.cb-filter-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    buildAdditionRows();
  }

  function toggleRoster(id,checked){
    if(checked)rOff.delete(id);else rOff.add(id);
    const row=document.getElementById(T+'-row-'+id);
    if(row)row.style.opacity=checked?'':'.4';
    updateUI();if(window.spRefresh)window.spRefresh();
  }

  function toggleAddition(id){
    if(aOn.has(id))aOn.delete(id);else aOn.add(id);
    const btn=document.getElementById(T+'-addbtn-'+id);
    if(btn){btn.className='cb-add-btn'+(aOn.has(id)?' added':'');btn.innerHTML=aOn.has(id)?'':`<span class="cb-plus">+</span>`;}
    updateUI();if(window.spRefresh)window.spRefresh();
  }

  function applyPreset(name){
    rOff.clear();aOn.clear();
    const preset=cfg.presets[name];
    if(preset)preset(rOff,aOn);
    buildRosterRows();buildAdditionRows();updateUI();
    const labels=cfg.presetLabels||{};
    document.querySelectorAll(`#wrapper-${T} .cb-preset:not(.reset-btn)`).forEach(b=>{
      b.classList.toggle('active',b.textContent.trim()===(labels[name]||'Base Case'));
    });
  }

  function saveToHash(){
    const h=`#t=${T}&r=${encodeURIComponent([...rOff].join(','))}&a=${encodeURIComponent([...aOn].join(','))}`;
    history.replaceState(null,'',h);
  }

  function loadFromHash(){
    const h=window.location.hash.slice(1);
    if(!h||!h.includes('='))return false;
    const p=Object.fromEntries(h.split('&').map(s=>s.split('=')));
    if(p.t!==T)return false;
    if(p.r!==undefined){rOff.clear();decodeURIComponent(p.r).split(',').filter(Boolean).forEach(id=>rOff.add(id));}
    if(p.a!==undefined){aOn.clear();decodeURIComponent(p.a).split(',').filter(Boolean).forEach(id=>aOn.add(id));}
    return true;
  }

  function saveScenario(){
    saveToHash();
    const btn=el('saveScenarioBtn');
    navigator.clipboard.writeText(window.location.href).then(()=>{
      if(btn){btn.textContent='✅ Link Copied!';btn.classList.add('copied');setTimeout(()=>{btn.textContent='🔗 Copy Link';btn.classList.remove('copied');},2400);}
    }).catch(()=>prompt('Copy this link:',window.location.href));
  }

  function init(){
    if(!loadFromHash()){
      const defaultPreset=cfg.presets['base'];
      if(defaultPreset)defaultPreset(rOff,aOn);
    }
    buildRosterRows();buildAdditionRows();updateUI();
    // Navigation
    const wrapper=document.getElementById('wrapper-'+T);
    if(!wrapper)return;
    wrapper.querySelectorAll('.nav-item[href^="#"]').forEach(link=>{
      link.addEventListener('click',e=>{
        e.preventDefault();
        wrapper.querySelector(link.getAttribute('href'))?.scrollIntoView({behavior:'smooth'});
      });
    });
    const sections=wrapper.querySelectorAll('.section');
    const navItems=wrapper.querySelectorAll('.nav-item[href^="#"]');
    sections.forEach(s=>{
      new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            navItems.forEach(n=>n.classList.remove('active'));
            wrapper.querySelector(`.nav-item[href="#${entry.target.id}"]`)?.classList.add('active');
          }
        });
      },{rootMargin:'-20% 0px -70% 0px'}).observe(s);
    });
  }
  function redrawViz(){
    const p=getActivePlayers();
    drawScatter(p,activeYear);updateDNA(p);drawRadar(calcScore());
  }
  function getActiveWI(){let t=0;cfg.roster.forEach(p=>{if(!rOff.has(p.id))t+=(p.wi||0);});cfg.additions.forEach(p=>{if(aOn.has(p.id))t+=(p.wi||0);});return t;}
  return{init,applyPreset,setYear,saveScenario,toggleRoster,toggleAddition,setAddFilter,buildAdditionRows,updateForwardLook,redrawViz,getActiveWI};
}

// ═══════════════════════════ FORWARD LOOK FUNCTIONS ════════════════════
function mavsFL({T,el,rOff,aOn,fmt,roster,additions}){
  const kyrieIn=document.getElementById('mavs-kyrieOptIn')?.checked;
  const lbl=document.getElementById('mavs-kyrieOptLabel');
  if(lbl){lbl.textContent=kyrieIn?'Opts In':'Opts Out';lbl.style.color=kyrieIn?'var(--yellow)':'var(--green)';}
  let total27=0;const rows=[];
  roster.forEach(p=>{
    if(rOff.has(p.id))return;
    let sal27=p.sal27||0,status='Under contract',sColor='var(--muted)';
    if(p.id==='kyrie'){sal27=kyrieIn?42400000:0;status=kyrieIn?'Opts In $42.4M':'Opts Out — FA';sColor=kyrieIn?'var(--yellow)':'var(--green)';}
    else if(p.id==='klay'){status='Expired';sColor='#555';sal27=0;}
    else if(p.id==='middleton'){status='Gone';sColor='#555';sal27=0;}
    else if(p.id==='flagg'){status='Yr 3 · Max eligible';sColor='var(--teal)';}
    else if(p.id==='lively'&&sal27>p.sal){status='Extension est.';sColor='var(--yellow)';}
    if(sal27>0)total27+=sal27;
    rows.push({name:p.name,sal:sal27,status,sColor});
  });
  additions.forEach(p=>{
    if(!aOn.has(p.id))return;
    const sal27=p.sal27||0;
    if(sal27>0)total27+=sal27;
    rows.push({name:p.name,sal:sal27,status:sal27>0?'Yr 2 of deal':'Expired',sColor:sal27>0?'var(--muted)':'#555'});
  });
  const space27=172000000-total27;
  const fc=el('fl-committed'),fs=el('fl-space'),fk=el('fl-keychange'),fr=el('flRows');
  if(fc){fc.textContent=fmt(total27);fc.style.color=total27>172000000?'var(--yellow)':'#7DBAEC';}
  if(fs){fs.textContent=fmt(Math.abs(space27));fs.style.color=space27>=0?'var(--green)':'var(--red)';}
  if(fk)fk.textContent=kyrieIn?'Kyrie $42.4M in':'Kyrie gone · big space';
  if(fr)fr.innerHTML=rows.sort((a,b)=>b.sal-a.sal).map(r=>`<div class="fl-row"><span class="fl-row-name">${r.name}</span><span class="fl-row-status" style="color:${r.sColor};">${r.status}</span><span class="fl-row-sal">${r.sal>0?fmt(r.sal):'—'}</span></div>`).join('');
}

function bullsFL({T,el,rOff,aOn,fmt,roster,additions}){
  const pwExtended=document.getElementById('bulls-pwOptIn')?.checked;
  const lbl=document.getElementById('bulls-pwOptLabel');
  if(lbl){lbl.textContent=pwExtended?'Extended':'Hits RFA';lbl.style.color=pwExtended?'var(--yellow)':'var(--green)';}
  let total27=0;const rows=[];
  roster.forEach(p=>{
    if(rOff.has(p.id))return;
    let sal27=p.sal27||0,status='Under contract',sColor='var(--muted)';
    if(p.id==='pwilliams'){sal27=pwExtended?18000000:0;status=pwExtended?'Extended ~$18M':'RFA — decision point';sColor=pwExtended?'var(--yellow)':'var(--green)';}
    else if(p.id==='giddey'){status='RFA decision';sColor='var(--yellow)';}
    if(sal27>0)total27+=sal27;
    rows.push({name:p.name,sal:sal27,status,sColor});
  });
  additions.forEach(p=>{
    if(!aOn.has(p.id))return;
    const sal27=p.sal27||0;
    if(sal27>0)total27+=sal27;
    rows.push({name:p.name,sal:sal27,status:sal27>0?'Yr 2 of deal':'Expired',sColor:sal27>0?'var(--muted)':'#555'});
  });
  const space27=172000000-total27;
  const fc=el('fl-committed'),fs=el('fl-space'),fk=el('fl-keychange'),fr=el('flRows');
  if(fc){fc.textContent=fmt(total27);fc.style.color=total27>172000000?'var(--yellow)':'#7DBAEC';}
  if(fs){fs.textContent=fmt(Math.abs(space27));fs.style.color=space27>=0?'var(--green)':'var(--red)';}
  if(fk)fk.textContent=pwExtended?'Williams locked in':'Williams RFA — risk';
  if(fr)fr.innerHTML=rows.sort((a,b)=>b.sal-a.sal).map(r=>`<div class="fl-row"><span class="fl-row-name">${r.name}</span><span class="fl-row-status" style="color:${r.sColor};">${r.status}</span><span class="fl-row-sal">${r.sal>0?fmt(r.sal):'—'}</span></div>`).join('');
}

function thunderFL({T,el,rOff,aOn,fmt,roster,additions}){
  const keepHart=document.getElementById('thunder-hartOptIn')?.checked;
  const lbl=document.getElementById('thunder-hartOptLabel');
  if(lbl){lbl.textContent=keepHart?'Keep':'Cut';lbl.style.color=keepHart?'var(--yellow)':'var(--green)';}
  let total27=0;const rows=[];
  roster.forEach(p=>{
    if(rOff.has(p.id))return;
    let sal27=p.sal27||0,status='Under contract',sColor='var(--muted)';
    if(p.id==='sga'){status='Yr 2 max · $44M';sColor='var(--teal)';sal27=44000000;}
    else if(p.id==='chet'){status='Yr 2 max · $44.8M';sColor='var(--teal)';sal27=44800000;}
    else if(p.id==='jalen'){status='Yr 2 max · $44.8M';sColor='var(--teal)';sal27=44800000;}
    else if(p.id==='hart'){sal27=keepHart?16000000:0;status=keepHart?'Option exercised':'Let go';sColor=keepHart?'var(--yellow)':'#555';}
    else if(p.id==='dort'){status='To be decided';sColor='var(--yellow)';}
    if(sal27>0)total27+=sal27;
    rows.push({name:p.name,sal:sal27,status,sColor});
  });
  additions.forEach(p=>{
    if(!aOn.has(p.id))return;
    const sal27=p.sal27||0;
    if(sal27>0)total27+=sal27;
    rows.push({name:p.name,sal:sal27,status:sal27>0?'Yr 2 of deal':'Expired',sColor:sal27>0?'var(--muted)':'#555'});
  });
  const vsT27=total27-209000000;
  const fc=el('fl-committed'),fs=el('fl-space'),fk=el('fl-keychange'),fr=el('flRows');
  if(fc){fc.textContent=fmt(total27);fc.style.color=total27>226000000?'#FF6B6B':total27>209000000?'var(--red)':total27>172000000?'var(--yellow)':'#7DBAEC';}
  if(fs){fs.textContent=(vsT27>=0?'+':'')+fmt(vsT27)+' vs tax';fs.style.color=vsT27>=0?'var(--red)':'var(--green)';}
  if(fk)fk.textContent=keepHart?'Hart adds $16M':'Hart cut saves tax';
  if(fr)fr.innerHTML=rows.sort((a,b)=>b.sal-a.sal).map(r=>`<div class="fl-row"><span class="fl-row-name">${r.name}</span><span class="fl-row-status" style="color:${r.sColor};">${r.status}</span><span class="fl-row-sal">${r.sal>0?fmt(r.sal):'—'}</span></div>`).join('');
}

// ═══════════════════════════ INITIALIZE BUILDERS ══════════════════════
const builders = {};

builders.mavs = createCapBuilder({
  teamId:'mavs', roster:MAVS_ROSTER, additions:MAVS_ADDITIONS,
  youthAge:25,
  pipelineFn: players => players.filter(p=>p.intl||(p.age||30)<=22).length,
  pipelineLabel:'intl/young',
  grades:[
    {min:85,letter:'A+',desc:"Ujiri's Dream Roster",color:'var(--teal)'},
    {min:70,letter:'A', desc:'Built for the Future',color:'#7DBAEC'},
    {min:55,letter:'B', desc:'Solid Foundation',color:'var(--green)'},
    {min:40,letter:'C', desc:'Mixed Signals',color:'var(--yellow)'},
    {min:0, letter:'D', desc:'Old NBA Energy',color:'#E07070'},
  ],
  presetLabels:{base:'Base Case',middleton_out:'Middleton Out',klay_traded:'Klay Traded',rebuild:'Full Rebuild',ujiri_best:'Ujiri Best Case'},
  presets:{
    base:(r,a)=>{ a.add('pick9'); },
    middleton_out:(r,a)=>{ r.add('middleton'); a.add('pick9');a.add('pick30');a.add('pick48');a.add('ellis'); },
    klay_traded:(r,a)=>{ r.add('klay'); a.add('pick9');a.add('pick30');a.add('pick48');a.add('dosunmu'); },
    rebuild:(r,a)=>{ r.add('middleton');r.add('klay');r.add('pjw'); a.add('pick9');a.add('pick30');a.add('pick48');a.add('whitepick'); },
    ujiri_best:(r,a)=>{ r.add('middleton');r.add('klay');r.add('pjw'); a.add('pick9');a.add('whitepick');a.add('pick17');a.add('ellis');a.add('wallace');a.add('okogie'); },
    reset:(r,a)=>{ a.add('pick9'); },
  },
  forwardLook:mavsFL,
});

builders.bulls = createCapBuilder({
  teamId:'bulls', roster:BULLS_ROSTER, additions:BULLS_ADDITIONS,
  youthAge:24,
  pipelineFn: players => players.filter(p=>(p.age||30)<=22).length,
  pipelineLabel:'age ≤22 upside',
  grades:[
    {min:85,letter:'A+',desc:"Graham's Defensive Vision",color:'var(--teal)'},
    {min:70,letter:'A', desc:'Next-Gen Core',color:'#7DBAEC'},
    {min:55,letter:'B', desc:'Building Blocks in Place',color:'var(--green)'},
    {min:40,letter:'C', desc:'Pieces Still Missing',color:'var(--yellow)'},
    {min:0, letter:'D', desc:'Wrong Direction',color:'#E07070'},
  ],
  presetLabels:{base:'Base Case',big_swing:'Big FA Swing',defense_mode:'Defense Mode',trade_giddey:'Trade Giddey',graham_best:'Graham Best Case'},
  presets:{
    base:(r,a)=>{ a.add('bpick4');a.add('bpick15'); },
    big_swing:(r,a)=>{ a.add('bpick4');a.add('bpick15');a.add('bvassell');a.add('bcaruso'); },
    defense_mode:(r,a)=>{ a.add('bpick4');a.add('bpick15');a.add('bellis');a.add('bcaruso');a.add('bcmartin'); },
    trade_giddey:(r,a)=>{ r.add('giddey'); a.add('bpick4');a.add('bpick15');a.add('bdgarland'); },
    graham_best:(r,a)=>{ a.add('bpick4');a.add('bpick15');a.add('bellis');a.add('bvassell');a.add('bcaruso');a.add('bkessler'); },
    reset:(r,a)=>{ a.add('bpick4');a.add('bpick15'); },
  },
  forwardLook:bullsFL,
});

builders.thunder = createCapBuilder({
  teamId:'thunder', roster:THUNDER_ROSTER, additions:THUNDER_ADDITIONS,
  youthAge:24,
  pipelineFn: players => players.filter(p=>p.drafted).length,
  pipelineLabel:'homegrown/drafted',
  grades:[
    {min:85,letter:'A+',desc:"Presti's OKC DNA",color:'var(--teal)'},
    {min:70,letter:'A', desc:'Dynasty Caliber',color:'#7DBAEC'},
    {min:55,letter:'B', desc:'Championship Contender',color:'var(--green)'},
    {min:40,letter:'C', desc:'Solid but Incomplete',color:'var(--yellow)'},
    {min:0, letter:'D', desc:'Identity Crisis',color:'#E07070'},
  ],
  presetLabels:{base:'Base Case',all_options:'All Options In',trim_costs:'Trim Costs',pjw_trade:'PJW Trade',dynasty_mode:'Dynasty Mode'},
  presets:{
    base:(r,a)=>{ a.add('tpick12');a.add('tpick17'); },
    all_options:(r,a)=>{ a.add('tpick12');a.add('tpick17');a.add('tpick37');a.add('toneale'); },
    trim_costs:(r,a)=>{ r.add('dort');r.add('kwilliams'); a.add('tpick12');a.add('tpick17');a.add('toneale'); },
    pjw_trade:(r,a)=>{ r.add('cwallace'); a.add('tpick12');a.add('tpick17');a.add('tpjw'); },
    dynasty_mode:(r,a)=>{ a.add('tpick12');a.add('tpick17');a.add('tpick37');a.add('tcaruso');a.add('toneale');a.add('tkanderson'); },
    reset:(r,a)=>{ a.add('tpick12');a.add('tpick17'); },
  },
  forwardLook:thunderFL,
});

// Init all builders
builders.mavs.init();
builders.bulls.init();
builders.thunder.init();

// Apply initial theme (Mavs)
switchTeam('mavs');

// ── Dynamic on-load updates ─────────────────────────────

// 6a. Update calendar date text to today
(function(){
  var months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var now=new Date();
  var el=document.getElementById('os-cal-date-text');
  if(el)el.textContent=months[now.getMonth()]+' '+now.getDate()+', '+now.getFullYear();
})();

// 6b. Offseason phase indicator
(function(){
  var now=new Date(); now.setHours(0,0,0,0);
  var phases=[
    {from:'2026-01-01',to:'2026-06-22',label:'📋 Pre-Draft',cls:'phase-prep'},
    {from:'2026-06-23',to:'2026-06-25',label:'🏀 Draft Week',cls:'phase-draft'},
    {from:'2026-06-26',to:'2026-06-28',label:'📬 Post-Draft',cls:'phase-prep'},
    {from:'2026-06-29',to:'2026-06-30',label:'⚙️ Team Options',cls:'phase-prep'},
    {from:'2026-07-01',to:'2026-07-05',label:'🔇 FA Moratorium',cls:'phase-prep'},
    {from:'2026-07-06',to:'2026-09-30',label:'🔥 Free Agency Open',cls:'phase-fa'},
    {from:'2026-10-01',to:'2026-10-20',label:'🏋️ Training Camp',cls:'phase-camp'},
    {from:'2026-10-21',to:'2027-06-30',label:'🏀 In Season',cls:'phase-season'},
  ];
  var el=document.getElementById('os-phase-badge');
  if(!el)return;
  var phase=phases.find(function(p){return now>=new Date(p.from)&&now<=new Date(p.to);});
  if(phase){el.textContent=phase.label;el.className='os-phase-badge '+phase.cls;el.style.display='inline-flex';}
})();

// 6c. Milestone countdown badges
(function(){
  var now=new Date(); now.setHours(0,0,0,0);
  document.querySelectorAll('.os-tl-marker[data-date]').forEach(function(marker){
    var dateStr=marker.getAttribute('data-date');
    var mDate=new Date(dateStr); mDate.setHours(0,0,0,0);
    var cdEl=marker.querySelector('.os-tl-countdown');
    if(!cdEl)return;
    var diff=Math.round((mDate-now)/(1000*60*60*24));
    if(diff>0){cdEl.textContent='in '+diff+'d';cdEl.className='os-tl-countdown future';}
    else if(diff===0){cdEl.textContent='Today!';cdEl.className='os-tl-countdown today';}
    else{cdEl.textContent=Math.abs(diff)+'d ago';cdEl.className='os-tl-countdown past';}
  });
})();

// 6d. Dynamic player ages in roster tables (auto-increments each NBA season)
(function(){
  var now=new Date();
  // NBA season year: Oct+ = new year
  var nbaYear=now>=new Date('2026-10-01')?now.getFullYear():2026;
  var delta=nbaYear-2026;
  if(delta===0)return; // no change needed until next season
  document.querySelectorAll('.p-pos[data-age-base]').forEach(function(el){
    var base=parseInt(el.getAttribute('data-age-base'));
    el.textContent=el.textContent.replace(/Age \d+/,'Age '+(base+delta));
  });
})();

// 6e. Cap builder auto-select year — switch to 2027-28 view once season starts
(function(){
  if(new Date()>=new Date('2026-10-01')){
    ['mavs','bulls','thunder'].forEach(function(t){
      if(builders[t])builders[t].setYear(2027);
    });
  }
})();

