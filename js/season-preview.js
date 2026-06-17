// ── Season Preview ─────────────────────────────────────────────────────────
(function(){
  var BASE=15;

  function calcWins(team){
    if(typeof builders==='undefined'||!builders[team])return null;
    var wi=builders[team].getActiveWI();
    var proj=Math.min(72,Math.round(BASE+wi));
    var floor=Math.max(15,Math.round(BASE+wi*0.82));
    var ceil=Math.min(72,Math.round(BASE+wi*1.18));
    return{floor:floor,proj:proj,ceil:ceil};
  }

  function updateCard(team,prefix){
    var w=calcWins(team);
    if(!w)return;
    var MAX=82;
    var badge=document.getElementById('sp-'+prefix+'-proj');
    var floorEl=document.getElementById('sp-'+prefix+'-floor');
    var proj2=document.getElementById('sp-'+prefix+'-proj2');
    var ceilEl=document.getElementById('sp-'+prefix+'-ceil');
    var barEl=document.getElementById('sp-'+prefix+'-bar');
    var rangeEl=document.getElementById('sp-'+prefix+'-range');
    if(badge)badge.textContent=w.proj;
    if(floorEl)floorEl.textContent=w.floor;
    if(proj2)proj2.textContent=w.proj;
    if(ceilEl)ceilEl.textContent=w.ceil;
    if(barEl)barEl.style.width=(w.proj/MAX*100).toFixed(1)+'%';
    if(rangeEl){
      rangeEl.style.left=(w.floor/MAX*100).toFixed(1)+'%';
      rangeEl.style.width=((w.ceil-w.floor)/MAX*100).toFixed(1)+'%';
    }
  }

  window.spRefresh=function(){
    updateCard('thunder','okc');
    updateCard('mavs','dal');
    updateCard('bulls','chi');
    var el=document.getElementById('sp-updated');
    if(el){
      var now=new Date();
      el.textContent='Synced '+now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    }
  };

  window._spInit=function(){
    window.spRefresh();
  };
})();
