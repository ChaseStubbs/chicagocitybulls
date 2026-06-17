(function(){
  // Offseason window: June 1 → Oct 21, 2026 (Draft through Opening Night)
  var start=new Date('2026-06-01'),end=new Date('2026-10-21');
  var now=new Date();
  var pct=Math.min(100,Math.max(0,(now-start)/(end-start)*100));
  var fill=document.getElementById('os-tl-fill-bar');
  var marker=document.getElementById('os-tl-today-marker');
  if(fill)fill.style.width=pct.toFixed(1)+'%';
  if(marker)marker.style.left=pct.toFixed(1)+'%';
})();
