
(function(){
'use strict';
const DATA = window.REPORT_DATA;
const COLORS = {
  happiness:'#e85d3f', cpi:'#7a4fb3', house:'#168aa5', suicide:'#5d5571', hours:'#109e96', japan:'#6aa4c8', korea:'#2aa8a0', taiwan:'#e85d3f', grid:'#e5edf5', text:'#334155'
};
const SERIES = {
  happiness:{label:'幸福分數', unit:'分', color:COLORS.happiness, rawLabel:'幸福分數'},
  cpi:{label:'CPI', unit:'指數', color:COLORS.cpi, rawLabel:'CPI 總指數'},
  house:{label:'房價所得比', unit:'倍', color:COLORS.house, rawLabel:'房價所得比'},
  suicide:{label:'自殺率', unit:'每十萬人', color:COLORS.suicide, rawLabel:'自殺標準化死亡率'}
};
let state = { view:'overview', baseYear:2017, mode:'index', selectedYear:null, activeSeries:['happiness','cpi','house','suicide'] };
const el = (id)=>document.getElementById(id);
const fmt = (n,d=1)=> Number(n).toLocaleString('zh-TW',{minimumFractionDigits:d, maximumFractionDigits:d});
function by(sel, root=document){ return [...root.querySelectorAll(sel)]; }
function clear(node){ while(node.firstChild) node.removeChild(node.firstChild); }
function svgEl(name, attrs={}){ const n=document.createElementNS('http://www.w3.org/2000/svg', name); Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v)); return n; }
function safeRows(rows){ return rows.filter(r=>Object.values(r).some(v=>v!==null && v!==undefined && v!=='')); }
function normalizeRows(rows, keys, baseKey='year', baseValue=2017){
  const base = rows.find(r=>String(r[baseKey])===String(baseValue)) || rows[0];
  return rows.map(r=>{
    const out={...r};
    keys.forEach(k=>{ out[k+'IndexDynamic'] = (r[k]==null || base[k]==null || base[k]===0) ? null : r[k] / base[k] * 100; });
    return out;
  });
}
function showTip(evt, html){ const t=el('tooltip'); t.innerHTML=html; t.style.left=evt.clientX+'px'; t.style.top=evt.clientY+'px'; t.style.opacity=1; }
function hideTip(){ el('tooltip').style.opacity=0; }
function setActiveView(view){
  state.view=view;
  state.selectedYear=null;
  if(view==='overview'){ state.activeSeries=['happiness','cpi','house','suicide']; state.mode='index'; if(state.baseYear<2017) state.baseYear=2017; }
  if(view==='work'){ state.activeSeries=['happiness']; state.mode='raw'; if(state.baseYear<2017) state.baseYear=2017; }
  if(view==='cost'){ state.activeSeries=['happiness','cpi','house']; state.mode='index'; if(state.baseYear<2017) state.baseYear=2017; }
  if(view==='mental'){ state.activeSeries=['happiness','suicide']; state.mode='index'; state.baseYear=2015; }
  if(view==='summary'){ state.activeSeries=['happiness','cpi','house','suicide']; state.mode='index'; if(state.baseYear<2017) state.baseYear=2017; }
  refreshControls(); render();
}
function refreshControls(){
  by('.tab').forEach(btn=>btn.classList.toggle('active', btn.dataset.view===state.view));
  const baseOptions = state.view==='mental' ? [2015,2017,2020,2022] : [2017,2020,2022];
  if(!baseOptions.includes(state.baseYear)) state.baseYear = baseOptions[0];
  el('baseYear').innerHTML = baseOptions.map(y=>`<option value="${y}">${y}</option>`).join('');
  el('baseYear').value=state.baseYear;
  el('modeGroup').style.display = state.view==='mental' ? 'flex' : 'none';
  by('.mode-btn').forEach(btn=>btn.classList.toggle('active', btn.dataset.mode===state.mode));
  const seriesBar=el('seriesBar'); clear(seriesBar);
  const available = state.view==='work' ? [] : (state.view==='cost' ? ['happiness','cpi','house'] : state.view==='mental' ? ['happiness','suicide'] : ['happiness','cpi','house','suicide']);
  if(!available.length){ seriesBar.innerHTML='<span class="badge">此視角使用固定比較圖</span>'; return; }
  available.forEach(k=>{
    const b=document.createElement('button');
    b.className='chip '+(state.activeSeries.includes(k)?'active':'');
    b.dataset.series=k; b.textContent=SERIES[k].label;
    b.addEventListener('click',()=>{
      if(state.activeSeries.includes(k) && state.activeSeries.length>1) state.activeSeries=state.activeSeries.filter(x=>x!==k);
      else if(!state.activeSeries.includes(k)) state.activeSeries.push(k);
      refreshControls(); render();
    });
    seriesBar.appendChild(b);
  });
}
function render(){
  renderHero(); renderKPIs(); renderMain(); renderMini(); renderSide(); renderTable();
}
function renderHero(){
  const map={
    overview:['互動式資料判讀報表','從幸福分數出發，讓使用者自行切換指標、基準年與圖表解讀，觀察「高幸福」是否能代表「低壓力」。'],
    work:['Q1｜高幸福一定低工時嗎？','比較 2024 年台日韓的幸福分數與全年工時，檢查台灣是否呈現高幸福與高工時並存。'],
    cost:['Q2｜生活成本壓力是否同步上升？','以指數化方式比較幸福分數、CPI 與房價所得比，觀察生活成本相關指標的相對變化。'],
    mental:['Q3｜幸福分數能完整反映心理健康嗎？','比較幸福分數與自殺標準化死亡率，提醒主觀生活評價不等於所有心理健康面向。'],
    summary:['最後整合｜高幸福是否等於低壓力？','用 2017 到 2024 的變化幅度整理反證：幸福分數上升，但多個壓力訊號也上升。']
  };
  el('heroEyebrow').textContent=map[state.view][0];
  el('heroText').textContent=map[state.view][1];
  by('.qcard').forEach(c=>c.classList.toggle('active', c.dataset.view===state.view));
}
function renderKPIs(){
  const k=DATA.kpis;
  const cards = state.view==='work' ? [
    ['台灣幸福分數 2024', fmt(k['Taiwan happiness score 2024']||6.669,2),'高於日本與南韓'],
    ['台灣年總工時 2024', fmt(k['Taiwan working hours 2024']||2030,0)+' 小時','三國中偏高'],
    ['日本年總工時 2024', fmt(k['Japan working hours 2024']||1617,0)+' 小時','低於台灣'],
    ['南韓年總工時 2024', fmt(k['South Korea working hours 2024']||1865,0)+' 小時','高於日本']
  ] : state.view==='cost' ? [
    ['幸福分數變化', '+'+fmt(k['Happiness 2017 to 2024 change percent'],1)+'%','2017 → 2024'],
    ['CPI 變化', '+'+fmt(k['CPI 2017 to 2024 change percent'],1)+'%','2017 → 2024'],
    ['房價所得比變化', '+'+fmt(k['House 2017 to 2024 change percent'],1)+'%','2017 → 2024'],
    ['判讀重點', '不推論因果','只看相對趨勢']
  ] : state.view==='mental' ? [
    ['幸福分數 2024', fmt(k['Taiwan happiness score 2024']||6.669,2),'仍維持高位'],
    ['自殺率變化', '+'+fmt(k['Suicide 2017 to 2024 change percent'],1)+'%','2017 → 2024'],
    ['自殺率 2024', fmt(DATA.mentalAnnual.find(r=>r.year===2024).suicideRate,1),'標準化死亡率'],
    ['判讀重點', '代理指標','不能代表全部心理健康']
  ] : [
    ['台灣幸福分數 2025', fmt(k['Taiwan happiness score 2025']||6.71,2),'東亞比較中較高'],
    ['2024 台灣工時', fmt(k['Taiwan working hours 2024']||2030,0)+' 小時','高幸福與高工時並存'],
    ['房價所得比變化', '+'+fmt(k['House 2017 to 2024 change percent'],1)+'%','2017 → 2024'],
    ['自殺率變化', '+'+fmt(k['Suicide 2017 to 2024 change percent'],1)+'%','2017 → 2024']
  ];
  const row=el('kpiRow'); clear(row);
  cards.forEach(([name,value,note])=>{
    const d=document.createElement('div'); d.className='panel kpi';
    d.innerHTML=`<div class="name">${name}</div><div class="value">${value}</div><div class="note">${note}</div>`;
    row.appendChild(d);
  });
}
function renderMain(){
  const titleMap={overview:'多指標趨勢互動檢視',work:'2024 年幸福分數 × 全年工時',cost:'幸福、CPI 與房價所得比相對趨勢',mental:'幸福分數與極端心理風險指標',summary:'2017 → 2024 壓力訊號總覽'};
  const subMap={overview:'切換指標與基準年，觀察不同壓力訊號是否和幸福分數同步。',work:'散點圖可看出：台灣幸福分數較高，但工時也偏高。',cost:'指數化後只比較變化方向，不比較絕對數值大小。',mental:'本圖只呈現趨勢，不推論幸福造成自殺率變化。',summary:'以 2017=100 整理各指標到 2024 的相對變化幅度。'};
  el('mainTitle').textContent=titleMap[state.view]; el('mainSubtitle').textContent=subMap[state.view];
  const box=el('mainChart'); clear(box);
  if(state.view==='work') renderScatter(box);
  else if(state.view==='summary') renderSlope(box);
  else renderLine(box);
}
function renderMini(){
  const box=el('miniChart'); clear(box);
  const title=el('miniTitle'); const sub=el('miniSubtitle');
  if(state.view==='work'){
    title.textContent='2024–2025 幸福分數比較'; sub.textContent='確認台灣幸福分數連續高於日韓。'; renderGroupedBars(box);
  } else if(state.view==='cost'){
    title.textContent='CPI 細項變化'; sub.textContent='2014 到 2024 各類別 CPI 變化，輔助理解生活成本感受。'; renderCpiBars(box);
  } else if(state.view==='mental'){
    title.textContent='原始值補充'; sub.textContent='切換回原始值時，注意兩者單位不同。'; renderMentalRawBars(box);
  } else if(state.view==='summary'){
    title.textContent='證據卡片'; sub.textContent='一頁整理「可以說」與「不能說」的結論。'; renderEvidenceCards(box);
  } else {
    title.textContent='2017 → 2024 變化幅度'; sub.textContent='壓力指標的上升幅度高於幸福分數。'; renderSummaryBars(box);
  }
}
function getLineData(){
  if(state.view==='cost'){
    const rows=DATA.costQuarterly.map(r=>({label:r.label, year:r.year, happiness:r.happiness, cpi:r.cpi, house:r.house}));
    const n=normalizeRows(rows, ['happiness','cpi','house'], 'year', state.baseYear);
    return {rows:n, xKey:'label', keys:state.activeSeries.filter(k=>['happiness','cpi','house'].includes(k)), yMode:'index'};
  }
  if(state.view==='mental'){
    const rows=DATA.mentalAnnual.map(r=>({label:String(r.year), year:r.year, happiness:r.happiness, suicide:r.suicideRate}));
    const n=normalizeRows(rows, ['happiness','suicide'], 'year', state.baseYear);
    return {rows:n, xKey:'label', keys:state.activeSeries.filter(k=>['happiness','suicide'].includes(k)), yMode:state.mode};
  }
  const rows=DATA.overviewAnnual.map(r=>({label:String(r.year), year:r.year, happiness:r.happiness, cpi:r.cpi, house:r.house, suicide:r.suicide}));
  const n=normalizeRows(rows, ['happiness','cpi','house','suicide'], 'year', state.baseYear);
  return {rows:n, xKey:'label', keys:state.activeSeries, yMode:'index'};
}
function renderLine(container){
  const cfg=getLineData();
  const rows=cfg.rows; const keys=cfg.keys.length?cfg.keys:['happiness'];
  const w=820,h=360,m={l:52,r:26,t:26,b:52}; const iw=w-m.l-m.r, ih=h-m.t-m.b;
  const svg=svgEl('svg',{viewBox:`0 0 ${w} ${h}`, class:'svg-chart', preserveAspectRatio:'none'}); container.appendChild(svg);
  const series = keys.map(k=>({key:k, valKey:(cfg.yMode==='index'?k+'IndexDynamic':k), ...SERIES[k]}));
  const vals=[]; rows.forEach(r=>series.forEach(s=>{ if(r[s.valKey]!=null) vals.push(r[s.valKey]); }));
  let min=Math.min(...vals), max=Math.max(...vals); if(!isFinite(min)){min=0; max=1;} const pad=(max-min)*.12||8; min-=pad; max+=pad;
  if(cfg.yMode==='index'){ min=Math.min(min,95); max=Math.max(max,115); }
  const x=(i)=>m.l + (rows.length===1? iw/2 : i/(rows.length-1)*iw);
  const y=(v)=>m.t + (max-v)/(max-min)*ih;
  // grid
  for(let i=0;i<=4;i++){
    const yy=m.t+i/4*ih; svg.appendChild(svgEl('line',{x1:m.l,y1:yy,x2:w-m.r,y2:yy,class:'grid-line'}));
    const t=svgEl('text',{x:m.l-10,y:yy+4,'text-anchor':'end',fill:'#64748b','font-size':'11'}); t.textContent=fmt(max-i/4*(max-min), cfg.yMode==='index'?0:1); svg.appendChild(t);
  }
  rows.forEach((r,i)=>{
    if(i%Math.ceil(rows.length/8)===0 || i===rows.length-1){
      const xx=x(i); svg.appendChild(svgEl('line',{x1:xx,y1:m.t,x2:xx,y2:h-m.b,class:'grid-line'}));
      const t=svgEl('text',{x:xx,y:h-26,'text-anchor':'middle',fill:'#64748b','font-size':'11'}); t.textContent=r.label.replace(' Q','Q'); svg.appendChild(t);
    }
  });
  svg.appendChild(svgEl('line',{x1:m.l,y1:h-m.b,x2:w-m.r,y2:h-m.b,class:'axis-path'}));
  svg.appendChild(svgEl('line',{x1:m.l,y1:m.t,x2:m.l,y2:h-m.b,class:'axis-path'}));
  const yLabel=svgEl('text',{x:16,y:m.t+ih/2,transform:`rotate(-90 16 ${m.t+ih/2})`,fill:'#64748b','font-size':'12','text-anchor':'middle'});
  yLabel.textContent=cfg.yMode==='index'?`指數（${state.baseYear}=100）`:'原始值（單位不同，請分開判讀）'; svg.appendChild(yLabel);
  // lines
  series.forEach(s=>{
    const pts=rows.map((r,i)=>r[s.valKey]==null?null:[x(i), y(r[s.valKey]), r]).filter(Boolean);
    const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
    svg.appendChild(svgEl('path',{d,fill:'none',stroke:s.color,'stroke-width':'3','stroke-linecap':'round','stroke-linejoin':'round'}));
    pts.forEach(p=>{
      const c=svgEl('circle',{cx:p[0],cy:p[1],r:'4.5',fill:s.color,stroke:'#fff','stroke-width':'2',class:'point'});
      c.addEventListener('mousemove',e=>showTip(e,`<b>${p[2].label}</b><br>${s.label}：${fmt(p[2][s.valKey], cfg.yMode==='index'?1:2)}${cfg.yMode==='index'?'':' '+s.unit}`));
      c.addEventListener('mouseleave',hideTip);
      c.addEventListener('click',()=>{state.selectedYear=p[2].year; renderSide();});
      svg.appendChild(c);
    });
    const last=pts[pts.length-1]; if(last){ const t=svgEl('text',{x:last[0]+8,y:last[1]+4,fill:s.color,'font-size':'12','font-weight':'800'}); t.textContent=s.label; svg.appendChild(t); }
  });
}
function renderScatter(container){
  const rows=DATA.countryHappiness;
  const w=820,h=360,m={l:64,r:36,t:28,b:56}; const iw=w-m.l-m.r, ih=h-m.t-m.b;
  const xs=rows.map(r=>r.workingHours2024), ys=rows.map(r=>r.happiness2024);
  let xmin=Math.min(...xs)-50, xmax=Math.max(...xs)+80, ymin=Math.min(...ys)-.12, ymax=Math.max(...ys)+.18;
  const x=v=>m.l+(v-xmin)/(xmax-xmin)*iw; const y=v=>m.t+(ymax-v)/(ymax-ymin)*ih;
  const svg=svgEl('svg',{viewBox:`0 0 ${w} ${h}`, class:'svg-chart', preserveAspectRatio:'none'}); container.appendChild(svg);
  for(let i=0;i<=4;i++){ const xx=m.l+i/4*iw; svg.appendChild(svgEl('line',{x1:xx,y1:m.t,x2:xx,y2:h-m.b,class:'grid-line'})); const t=svgEl('text',{x:xx,y:h-28,'text-anchor':'middle',fill:'#64748b','font-size':'11'}); t.textContent=fmt(xmin+i/4*(xmax-xmin),0); svg.appendChild(t); const yy=m.t+i/4*ih; svg.appendChild(svgEl('line',{x1:m.l,y1:yy,x2:w-m.r,y2:yy,class:'grid-line'})); const ty=svgEl('text',{x:m.l-10,y:yy+4,'text-anchor':'end',fill:'#64748b','font-size':'11'}); ty.textContent=fmt(ymax-i/4*(ymax-ymin),1); svg.appendChild(ty); }
  svg.appendChild(svgEl('line',{x1:m.l,y1:h-m.b,x2:w-m.r,y2:h-m.b,class:'axis-path'})); svg.appendChild(svgEl('line',{x1:m.l,y1:m.t,x2:m.l,y2:h-m.b,class:'axis-path'}));
  const xl=svgEl('text',{x:m.l+iw/2,y:h-8,'text-anchor':'middle',fill:'#64748b','font-size':'12'}); xl.textContent='全年平均工時（小時／年）'; svg.appendChild(xl);
  const yl=svgEl('text',{x:17,y:m.t+ih/2,transform:`rotate(-90 17 ${m.t+ih/2})`,'text-anchor':'middle',fill:'#64748b','font-size':'12'}); yl.textContent='幸福分數（0–10）'; svg.appendChild(yl);
  rows.forEach(r=>{
    const color=r.country==='台灣'?COLORS.taiwan:(r.country==='南韓'?COLORS.korea:COLORS.japan);
    const c=svgEl('circle',{cx:x(r.workingHours2024),cy:y(r.happiness2024),r:r.country==='台灣'?9:7,fill:color,stroke:'#fff','stroke-width':'3',class:'point'});
    c.addEventListener('mousemove',e=>showTip(e,`<b>${r.country}</b><br>幸福分數：${fmt(r.happiness2024,2)}<br>年工時：${fmt(r.workingHours2024,0)} 小時`));
    c.addEventListener('mouseleave',hideTip); svg.appendChild(c);
    const t=svgEl('text',{x:x(r.workingHours2024)+10,y:y(r.happiness2024)-8,fill:color,'font-weight':'900','font-size':'13'}); t.textContent=r.country; svg.appendChild(t);
  });
  const note=svgEl('text',{x:x(DATA.countryHappiness.find(r=>r.country==='台灣').workingHours2024)-100,y:y(DATA.countryHappiness.find(r=>r.country==='台灣').happiness2024)-35,fill:COLORS.taiwan,'font-size':'12','font-weight':'900'}); note.textContent='高幸福，也高工時'; svg.appendChild(note);
}
function renderGroupedBars(container){
  const rows=DATA.countryHappiness; const w=520,h=292,m={l:52,r:24,t:26,b:42}; const iw=w-m.l-m.r, ih=h-m.t-m.b;
  const svg=svgEl('svg',{viewBox:`0 0 ${w} ${h}`, class:'svg-chart', preserveAspectRatio:'none'}); container.appendChild(svg);
  const max=7.2, barW=32, groupW=iw/rows.length;
  for(let i=0;i<=4;i++){ const yy=m.t+i/4*ih; svg.appendChild(svgEl('line',{x1:m.l,y1:yy,x2:w-m.r,y2:yy,class:'grid-line'})); const t=svgEl('text',{x:m.l-8,y:yy+4,'text-anchor':'end',fill:'#64748b','font-size':'11'}); t.textContent=fmt(max-i/4*max,0); svg.appendChild(t); }
  rows.forEach((r,i)=>{
    const gx=m.l+i*groupW+groupW/2; [[r.happiness2024,'2024',COLORS.orange], [r.happiness2025,'2025',COLORS.teal]].forEach((b,j)=>{
      const bh=b[0]/max*ih, x=gx+(j-.5)*barW-4, y=h-m.b-bh; const rect=svgEl('rect',{x,y,width:barW-4,height:bh,rx:'6',fill:b[2]});
      rect.addEventListener('mousemove',e=>showTip(e,`<b>${r.country} ${b[1]}</b><br>幸福分數：${fmt(b[0],2)}`)); rect.addEventListener('mouseleave',hideTip); svg.appendChild(rect);
      const val=svgEl('text',{x:x+(barW-4)/2,y:y-5,'text-anchor':'middle',fill:'#334155','font-size':'10','font-weight':'800'}); val.textContent=fmt(b[0],2); svg.appendChild(val);
    });
    const lab=svgEl('text',{x:gx,y:h-16,'text-anchor':'middle',fill:'#64748b','font-size':'12'}); lab.textContent=r.country; svg.appendChild(lab);
  });
}
function renderCpiBars(container){
  const rows=[...DATA.cpiCategories].sort((a,b)=>b.change-a.change); const w=520,h=292,m={l:96,r:30,t:22,b:30}; const iw=w-m.l-m.r, ih=h-m.t-m.b; const max=Math.max(...rows.map(r=>r.change))*1.12;
  const svg=svgEl('svg',{viewBox:`0 0 ${w} ${h}`, class:'svg-chart', preserveAspectRatio:'none'}); container.appendChild(svg);
  rows.forEach((r,i)=>{ const y=m.t+i*(ih/rows.length)+5; const bh=ih/rows.length-10; const bw=r.change/max*iw; svg.appendChild(svgEl('rect',{x:m.l,y,width:bw,height:bh,rx:'7',fill:COLORS.orange,opacity:.86})); const t=svgEl('text',{x:m.l-8,y:y+bh/2+4,'text-anchor':'end',fill:'#64748b','font-size':'11'}); t.textContent=r.category; svg.appendChild(t); const v=svgEl('text',{x:m.l+bw+7,y:y+bh/2+4,fill:'#334155','font-size':'11','font-weight':'900'}); v.textContent='+'+fmt(r.change,1)+'%'; svg.appendChild(v); });
}
function renderMentalRawBars(container){
  const r2024=DATA.mentalAnnual.find(r=>r.year===2024); const r2015=DATA.mentalAnnual.find(r=>r.year===2015);
  const rows=[{name:'幸福分數',v0:r2015.happiness,v1:r2024.happiness,unit:'分',color:COLORS.happiness},{name:'自殺標準化死亡率',v0:r2015.suicideRate,v1:r2024.suicideRate,unit:'',color:COLORS.suicide}];
  renderTwoPoint(container, rows, '2015','2024');
}
function renderEvidenceCards(container){
  container.innerHTML=`<div style="display:grid;gap:10px;padding:4px 0;">
    <div class="side-section"><strong>起點</strong><p>台灣幸福分數高於日韓，報導問題成立。</p></div>
    <div class="side-section"><strong>反證 1</strong><p>台灣工時沒有較低，2024 年仍高於日韓。</p></div>
    <div class="side-section"><strong>反證 2</strong><p>CPI、房價所得比與自殺率等壓力訊號上升。</p></div>
    <div class="insight-box"><div class="headline">比較穩的說法</div><p>台灣呈現「高幸福感與壓力訊號可能同時存在」，而不是「幸福高所以壓力低」。</p></div>
  </div>`;
}
function renderTwoPoint(container, rows, leftLabel, rightLabel){
  const w=520,h=292,m={l:120,r:70,t:28,b:35}; const iw=w-m.l-m.r, ih=h-m.t-m.b;
  const svg=svgEl('svg',{viewBox:`0 0 ${w} ${h}`, class:'svg-chart', preserveAspectRatio:'none'}); container.appendChild(svg);
  const x0=m.l, x1=m.l+iw;
  const xlab1=svgEl('text',{x:x0,y:h-12,'text-anchor':'middle',fill:'#64748b','font-size':'12','font-weight':'800'}); xlab1.textContent=leftLabel; svg.appendChild(xlab1);
  const xlab2=svgEl('text',{x:x1,y:h-12,'text-anchor':'middle',fill:'#64748b','font-size':'12','font-weight':'800'}); xlab2.textContent=rightLabel; svg.appendChild(xlab2);
  rows.forEach((r,i)=>{ const y=m.t+40+i*82; svg.appendChild(svgEl('line',{x1:x0,y1:y,x2:x1,y2:y,stroke:'#d1d5db','stroke-width':'5','stroke-linecap':'round'})); svg.appendChild(svgEl('circle',{cx:x0,cy:y,r:'8',fill:'#94a3b8'})); svg.appendChild(svgEl('circle',{cx:x1,cy:y,r:'10',fill:r.color})); const lab=svgEl('text',{x:m.l-12,y:y+4,'text-anchor':'end',fill:'#334155','font-size':'12','font-weight':'900'}); lab.textContent=r.name; svg.appendChild(lab); const v0=svgEl('text',{x:x0,y:y-14,'text-anchor':'middle',fill:'#64748b','font-size':'11'}); v0.textContent=fmt(r.v0,1); svg.appendChild(v0); const v1=svgEl('text',{x:x1,y:y-16,'text-anchor':'middle',fill:r.color,'font-size':'12','font-weight':'900'}); v1.textContent=fmt(r.v1,1); svg.appendChild(v1); });
}
function renderSummaryBars(container){
  const rows=DATA.summaryChange.map(r=>({name:r.indicator, change:r.index2024-100, label:r.changeLabel})).sort((a,b)=>b.change-a.change);
  const w=520,h=292,m={l:94,r:42,t:24,b:40}; const iw=w-m.l-m.r, ih=h-m.t-m.b; const max=Math.max(...rows.map(r=>r.change))*1.15;
  const svg=svgEl('svg',{viewBox:`0 0 ${w} ${h}`, class:'svg-chart', preserveAspectRatio:'none'}); container.appendChild(svg);
  rows.forEach((r,i)=>{ const y=m.t+i*(ih/rows.length)+12; const bh=ih/rows.length-20; const bw=r.change/max*iw; const color=r.name==='幸福分數'?COLORS.happiness:(r.name==='CPI'?COLORS.cpi:(r.name==='房價所得比'?COLORS.house:COLORS.suicide)); svg.appendChild(svgEl('rect',{x:m.l,y,width:bw,height:bh,rx:'8',fill:color,opacity:.9})); const l=svgEl('text',{x:m.l-8,y:y+bh/2+4,'text-anchor':'end',fill:'#64748b','font-size':'12','font-weight':'800'}); l.textContent=r.name; svg.appendChild(l); const val=svgEl('text',{x:m.l+bw+8,y:y+bh/2+4,fill:color,'font-size':'12','font-weight':'950'}); val.textContent=r.label; svg.appendChild(val); });
}
function renderSlope(container){
  const rows=DATA.summaryChange; const w=820,h=360,m={l:108,r:130,t:28,b:44}; const iw=w-m.l-m.r, ih=h-m.t-m.b; const min=98, max=Math.max(...rows.map(r=>r.index2024))*1.04;
  const svg=svgEl('svg',{viewBox:`0 0 ${w} ${h}`, class:'svg-chart', preserveAspectRatio:'none'}); container.appendChild(svg);
  const x0=m.l, x1=m.l+iw; const y=v=>m.t+(max-v)/(max-min)*ih;
  svg.appendChild(svgEl('line',{x1:x0,y1:m.t,x2:x0,y2:h-m.b,stroke:'#ccd7e4'})); svg.appendChild(svgEl('line',{x1:x1,y1:m.t,x2:x1,y2:h-m.b,stroke:'#ccd7e4'}));
  ['2017','2024'].forEach((lab,i)=>{ const t=svgEl('text',{x:i?x1:x0,y:h-15,'text-anchor':'middle',fill:'#334155','font-size':'13','font-weight':'900'}); t.textContent=lab; svg.appendChild(t); });
  rows.forEach(r=>{ const color=r.indicator==='幸福分數'?COLORS.happiness:(r.indicator==='CPI'?COLORS.cpi:(r.indicator==='房價所得比'?COLORS.house:COLORS.suicide)); const y0=y(100), y1=y(r.index2024); svg.appendChild(svgEl('line',{x1:x0,y1:y0,x2:x1,y2:y1,stroke:color,'stroke-width':'4','stroke-linecap':'round'})); svg.appendChild(svgEl('circle',{cx:x0,cy:y0,r:'7',fill:'#fff',stroke:color,'stroke-width':'3'})); svg.appendChild(svgEl('circle',{cx:x1,cy:y1,r:'8',fill:'#fff',stroke:color,'stroke-width':'3'})); const lab=svgEl('text',{x:x1+12,y:y1+4,fill:color,'font-size':'13','font-weight':'950'}); lab.textContent=`${r.indicator} ${r.changeLabel}`; svg.appendChild(lab); });
}
function renderSide(){
  const text={
    overview:{title:'總覽解讀', what:'這份報表把原本靜態圖表改成可操作的判讀介面。使用者可以切換問題、指標與基準年，觀察不同壓力訊號與幸福分數是否一致。', can:['可以說：幸福分數高，不代表其他壓力指標一定低。','可以比較：不同指標在同一基準下的相對變化方向。'], cannot:['不能說：CPI、房價或自殺率直接造成幸福分數變化。','不能把自殺率當成完整心理健康狀態。']},
    work:{title:'Q1 解讀', what:'2024 年台灣幸福分數高於日本與南韓，但全年工時也高於兩國。這支持「高幸福與高工時可能並存」的判讀。', can:['可以說：高幸福不必然伴隨低工時。','可以說：台灣在三國比較中呈現特殊位置。'], cannot:['不能說：工時高造成幸福高。','不能只用三國資料推論所有國家。']},
    cost:{title:'Q2 解讀', what:'以共同基準年指數化後，台灣 CPI 與房價所得比整體上升，但幸福分數沒有明顯下滑，顯示幸福感與生活成本壓力不是簡單反向關係。', can:['可以說：生活成本相關指標呈現上升趨勢。','可以說：高幸福感與高生活成本壓力可能並存。'], cannot:['不能說：CPI 或房價直接造成幸福變化。','不能比較不同單位指標的絕對大小。']},
    mental:{title:'Q3 解讀', what:'幸福分數是主觀生活評價；自殺標準化死亡率則是極端心理風險代理指標。兩者同時上升時，代表幸福分數未必涵蓋所有心理健康面向。', can:['可以說：幸福分數不能完整代表心理健康。','可以補充觀察：極端心理風險仍值得注意。'], cannot:['不能說：幸福分數上升造成自殺率上升。','不能說：自殺率代表所有人的日常壓力。']},
    summary:{title:'最後結論', what:'比較穩的報告結論是：台灣呈現高幸福感與壓力訊號可能同時存在，而不是幸福高所以生活壓力低。', can:['可以形成報導主軸：幸福正在被重新定義。','可以強調資料素養：多指標判讀比單一排名更完整。'], cannot:['不要把相關或同步變化講成因果。','不要把排名高直接等同生活品質全面較好。']}
  }[state.view];
  el('sideTitle').textContent=text.title;
  el('sideWhat').textContent=text.what;
  el('canList').innerHTML=text.can.map(x=>`<li>${x}</li>`).join('');
  el('cannotList').innerHTML=text.cannot.map(x=>`<li>${x}</li>`).join('');
  el('selectedYearBox').innerHTML = state.selectedYear ? `<span class="badge hot">目前點選：${state.selectedYear}</span>` : `<span class="badge">尚未點選年份</span>`;
  const chosen=state.activeSeries.map(k=>SERIES[k]?.label).filter(Boolean).join('、') || '固定比較圖';
  el('selectedSeriesBox').innerHTML=`<span class="badge safe">目前指標：${chosen}</span><span class="badge">基準年：${state.baseYear}</span>`;
}
function renderTable(){
  const box=el('dataTable'); clear(box);
  let rows, headers;
  if(state.view==='work'){
    headers=['國家','2024幸福分數','2025幸福分數','2024年工時'];
    rows=DATA.countryHappiness.map(r=>[r.country, fmt(r.happiness2024,2), fmt(r.happiness2025,2), fmt(r.workingHours2024,0)]);
  } else if(state.view==='cost'){
    headers=['季度','幸福分數','CPI','房價所得比']; rows=DATA.costQuarterly.filter((_,i)=>i%4===0 || i===DATA.costQuarterly.length-1).map(r=>[r.label, fmt(r.happiness,2), fmt(r.cpi,1), fmt(r.house,2)]);
  } else if(state.view==='mental'){
    headers=['年份','幸福分數','自殺標準化死亡率','自殺死亡人數']; rows=DATA.mentalAnnual.map(r=>[r.year, fmt(r.happiness,2), fmt(r.suicideRate,1), fmt(r.suicideDeaths,0)]);
  } else {
    headers=['年份','幸福分數','CPI','房價所得比','自殺率']; rows=DATA.overviewAnnual.map(r=>[r.year, fmt(r.happiness,2), fmt(r.cpi,1), fmt(r.house,2), fmt(r.suicide,1)]);
  }
  const table=document.createElement('table'); table.innerHTML='<thead><tr>'+headers.map(h=>`<th>${h}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>`<td>${c}</td>`).join('')+'</tr>').join('')+'</tbody>';
  box.appendChild(table);
}
function init(){
  by('.tab').forEach(b=>b.addEventListener('click',()=>setActiveView(b.dataset.view)));
  by('.qcard').forEach(c=>c.addEventListener('click',()=>setActiveView(c.dataset.view)));
  el('baseYear').addEventListener('change',e=>{state.baseYear=Number(e.target.value); render();});
  by('.mode-btn').forEach(b=>b.addEventListener('click',()=>{ state.mode=b.dataset.mode; refreshControls(); render(); }));
  el('resetBtn').addEventListener('click',()=>{ state.selectedYear=null; renderSide(); });
  el('printBtn').addEventListener('click',()=>window.print());
  refreshControls(); render();
}
document.addEventListener('DOMContentLoaded',init);
})();
