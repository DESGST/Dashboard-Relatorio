
function gerarDadosMock(mes, ano) {
  const seed = mes * 17 + ano * 3;
  const rng = (min, max, s) => {
    const x = Math.sin(seed + s) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min) + min);
  };
  return {
    mes, ano,
    contexto: { populacao: 12325232, frota_total: 8430000 + rng(0, 200000, 1) },
    modais: {
      pedestres: rng(8, 35, 2), motociclistas: rng(20, 70, 3),
      automoveis: rng(5, 25, 4), ciclistas: rng(2, 12, 5), total_painel: 0
    },
    taxas: { mortalidade_100k: (rng(60, 120, 6) / 10).toFixed(1) },
    geografia: {
      get_1_cn: rng(4,20,7), get_2_no: rng(2,15,8), get_3_se: rng(5,22,9),
      get_4_su: rng(3,18,10), get_5_so: rng(4,20,11), get_6_mb: rng(2,12,12),
      get_7_le: rng(5,25,13), get_8_oe: rng(3,16,14), rodovias: rng(1,10,15)
    }
  };
}
function calcTotal(d) {
  d.modais.total_painel = d.modais.pedestres + d.modais.motociclistas + d.modais.automoveis + d.modais.ciclistas;
  return d;
}

/* ── ESTADO GLOBAL ──────────────────────────────────── */
let charts = {};
let dadosAtual = null;
let dadosAnual = [];
let tlData = { labels:[], obitos:[], taxas:[] };
let tlRunning = false, tlInterval = null, tlIndex = 0, tlList = [];

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const GET_LABELS = ['GET 1 — CN','GET 2 — NO','GET 3 — SE','GET 4 — SU','GET 5 — SO','GET 6 — MB','GET 7 — LE','GET 8 — OE','Rodovias'];
const MODAL_COLORS = ['#ff5757','#e5ff00','#57c3ff','#ffb347'];
const MODAL_LABELS = ['Pedestres','Motociclistas','Automóveis','Ciclistas'];

/* ── TEMA ──────────────────────────────────────────── */
let currentTheme = 'dark';
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  document.getElementById('btn-theme').textContent = currentTheme === 'dark' ? '🌙' : '☀️';
  // reatualiza gráficos com novas cores
  if (dadosAtual) atualizarInterface(dadosAtual);
  Object.values(charts).forEach(c => c && c.update());
}

/* ── HELPERS ──────────────────────────────────────── */
function getChartColors() {
  const dark = currentTheme === 'dark';
  return {
    text:  dark ? 'rgba(244,244,232,0.5)' : 'rgba(10,12,20,0.5)',
    grid:  dark ? 'rgba(229,255,0,0.05)'  : 'rgba(4,55,142,0.07)',
    accent: dark ? '#e5ff00' : '#04378e',
    accent2: dark ? '#04378e' : '#e5ff00',
    fill:  dark ? 'rgba(229,255,0,0.07)'  : 'rgba(4,55,142,0.07)',
    fill2: dark ? 'rgba(4,55,142,0.15)'   : 'rgba(229,255,0,0.2)',
    bar:   dark ? 'rgba(229,255,0,0.15)'  : 'rgba(4,55,142,0.15)',
    barBorder: dark ? '#e5ff00' : '#04378e',
    info:  '#57c3ff', danger: '#ff5757', warn: '#ffb347',
    tooltip: { bg: dark ? '#16161a' : '#ffffff', title: dark ? '#f4f4e8' : '#0a0c14', body: dark ? 'rgba(244,244,232,0.65)' : 'rgba(10,12,20,0.6)', border: dark ? 'rgba(229,255,0,0.15)' : 'rgba(4,55,142,0.12)' }
  };
}

function chartDefaults() {
  const c = getChartColors();
  return {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 650, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: c.tooltip.bg, titleColor: c.tooltip.title,
        bodyColor: c.tooltip.body, borderColor: c.tooltip.border, borderWidth: 1,
        padding: 10, titleFont: { family: 'Syne', weight: '700', size: 12 }
      }
    }
  };
}

function scalesDark(c) {
  return {
    x: { grid:{ color: c.grid }, ticks:{ color: c.text, font:{ size:11 } } },
    y: { grid:{ color: c.grid }, ticks:{ color: c.text, font:{ size:11 } } }
  };
}

/* ── INIT CHARTS ──────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => { initCharts(); buscarDadosMes(); });

function initCharts() {
  const c = getChartColors();
  const def = chartDefaults();
  const sc  = scalesDark(c);

  charts.gets = new Chart(document.getElementById('chartGets'), {
    type: 'bar',
    data: { labels: GET_LABELS, datasets: [{ label: 'Óbitos', data: new Array(9).fill(0), backgroundColor: c.bar, borderColor: c.barBorder, borderWidth: 1.5, borderRadius: 5 }] },
    options: { ...def, indexAxis: 'y', scales: { x: sc.x, y: { grid:{display:false}, ticks:{color:c.text,font:{size:11}} } } }
  });

  charts.modais = new Chart(document.getElementById('chartModais'), {
    type: 'doughnut',
    data: { labels: MODAL_LABELS, datasets: [{ data:[0,0,0,0], backgroundColor: MODAL_COLORS, borderWidth: 0, hoverOffset: 8 }] },
    options: { ...def, cutout: '70%' }
  });

charts.radar = new Chart(document.getElementById('chartRadar'), {
    type: 'radar',
    data: { 
      labels: ['Pedestres','Motoc.','Autos','Ciclistas','GET-Alta','GET-Média'],
      datasets: [{ 
        label: 'Risco', 
        data: [0,0,0,0,0,0], 
        backgroundColor: 'var(--accent-radar)',  /* Fundo sutil dinâmico */
        borderColor: 'var(--accent)',            /* Linha forte: Azul(Claro) ou Lima(Escuro) */
        borderWidth: 2, 
        pointBackgroundColor: 'var(--accent)',   /* Pontos acompanham a linha */
        pointRadius: 4 
      }]
    },
    options: { 
      ...chartDefaults(), 
      scales: { 
        r: { 
          grid: { color: 'var(--border)' },       /* A Teia de Aranha (Cinza no Claro, Branco no Escuro) */
          angleLines: { color: 'var(--border)' }, /* Linhas do centro pras pontas */
          pointLabels: { 
            color: 'var(--text)',                 /* O Texto: Preto no Claro, Branco no Escuro */
            font: { size: 11, weight: '700' } 
          }, 
          ticks: { display: false } 
        } 
      } 
    }
  });

  charts.timeline = new Chart(document.getElementById('chartTimeline'), {
    type: 'line',
    data: { labels:[], datasets:[{ label:'Acumulado', data:[], borderColor: c.accent, backgroundColor: c.fill, fill:true, tension:0.35, pointRadius:3, pointBackgroundColor: c.accent, borderWidth:2 }] },
    options: { ...def, scales: sc }
  });

  charts.tlMensal = new Chart(document.getElementById('chartTlMensal'), {
    type: 'bar',
    data: { labels:[], datasets:[{ label:'Óbitos/mês', data:[], backgroundColor: c.bar, borderColor: c.barBorder, borderWidth:1.5, borderRadius:4 }] },
    options: { ...def, scales: sc }
  });

  charts.taxaTrend = new Chart(document.getElementById('chartTaxaTrend'), {
    type: 'line',
    data: { labels:[], datasets:[{ label:'Taxa/100k', data:[], borderColor: c.info, backgroundColor: 'rgba(87,195,255,0.07)', fill:true, tension:0.35, pointRadius:2, borderWidth:2 }] },
    options: { ...def, scales: sc }
  });

  charts.anual = new Chart(document.getElementById('chartAnual'), {
    type: 'bar',
    data: { labels: MESES, datasets: [
      { label:'Óbitos', data: new Array(12).fill(0), backgroundColor: c.bar, borderColor: c.barBorder, borderWidth:1.5, borderRadius:4 },
      { label:'Tendência', data: new Array(12).fill(null), type:'line', borderColor: c.danger, borderWidth:2, tension:0.4, pointRadius:0 }
    ]},
    options: { ...def, scales: sc }
  });

  charts.cmpA = new Chart(document.getElementById('chartCmpA'), {
    type: 'bar',
    data: { labels: MODAL_LABELS, datasets:[{ label:'A', data:[0,0,0,0], backgroundColor: 'rgba(87,195,255,0.2)', borderColor: c.info, borderWidth:1.5, borderRadius:4 }] },
    options: { ...def, scales: { x:{grid:{display:false},ticks:{color:c.text}}, y:sc.y } }
  });

  charts.cmpB = new Chart(document.getElementById('chartCmpB'), {
    type: 'bar',
    data: { labels: MODAL_LABELS, datasets:[{ label:'B', data:[0,0,0,0], backgroundColor: c.bar, borderColor: c.barBorder, borderWidth:1.5, borderRadius:4 }] },
    options: { ...def, scales: { x:{grid:{display:false},ticks:{color:c.text}}, y:sc.y } }
  });

  charts.cmpDiff = new Chart(document.getElementById('chartCmpDiff'), {
    type: 'bar',
    data: { labels: MODAL_LABELS, datasets:[{ label:'Δ%', data:[0,0,0,0], backgroundColor: [0,0,0,0].map(()=>'rgba(255,87,87,0.3)'), borderColor: [0,0,0,0].map(()=>'#ff5757'), borderWidth:1.5, borderRadius:4 }] },
    options: { ...def, scales: { x:{grid:{display:false},ticks:{color:c.text}}, y:{...sc.y, ticks:{...sc.y.ticks, callback: v=>v+'%'}} } }
  });
}

/* ── BUSCAR DADOS ─────────────────────────────────── */
async function buscarDadosMes(silencioso = false) {
  const ano = parseInt(document.getElementById('input-ano').value);
  const mes = parseInt(document.getElementById('input-mes').value);
  if (!silencioso) document.getElementById('loading').classList.add('show');
  try {
    let data;
    try {
      const r = await fetch(`http://127.0.0.1:8000/api/relatorio/?ano=${ano}&mes=${mes}`);
      if (!r.ok) throw new Error();
      data = await r.json();
    } catch { data = calcTotal(gerarDadosMock(mes, ano)); }
    dadosAtual = data;
    atualizarInterface(data);
    return data;
  } finally {
    if (!silencioso) document.getElementById('loading').classList.remove('show');
  }
}

function atualizarInterface(data) {
  const fmt = n => n?.toLocaleString('pt-BR') ?? '—';
  const c = getChartColors();

  document.getElementById('kpi-obitos').textContent = data.modais.total_painel;
  document.getElementById('kpi-taxa').textContent   = data.taxas.mortalidade_100k;
  document.getElementById('kpi-frota').textContent  = fmt(data.contexto.frota_total);
  document.getElementById('kpi-pop').textContent    = fmt(data.contexto.populacao);

  const gets = [
    data.geografia.get_1_cn, data.geografia.get_2_no, data.geografia.get_3_se,
    data.geografia.get_4_su, data.geografia.get_5_so, data.geografia.get_6_mb,
    data.geografia.get_7_le, data.geografia.get_8_oe, data.geografia.rodovias
  ];
  charts.gets.data.datasets[0].data = gets;
  charts.gets.data.datasets[0].backgroundColor = c.bar;
  charts.gets.data.datasets[0].borderColor = c.barBorder;
  charts.gets.update();

  const modVals = [data.modais.pedestres, data.modais.motociclistas, data.modais.automoveis, data.modais.ciclistas];
  charts.modais.data.datasets[0].data = modVals;
  charts.modais.update();

  const maxM = Math.max(...modVals) || 1;
  const maxG = Math.max(...gets)    || 1;
  charts.radar.data.datasets[0].data = [
    Math.round(data.modais.pedestres/maxM*100),
    Math.round(data.modais.motociclistas/maxM*100),
    Math.round(data.modais.automoveis/maxM*100),
    Math.round(data.modais.ciclistas/maxM*100),
    Math.round(Math.max(data.geografia.get_1_cn,data.geografia.get_7_le,data.geografia.get_3_se)/maxG*100),
    Math.round((data.geografia.get_4_su+data.geografia.get_2_no)/2/maxG*100)
  ];
  charts.radar.data.datasets[0].borderColor = c.accent;
  charts.radar.data.datasets[0].pointBackgroundColor = c.accent;
  charts.radar.data.datasets[0].backgroundColor = c.fill;
  charts.radar.update();

  // Heatmap
  const maxH = Math.max(...gets)||1;
  const getNomes = ['CN','NO','SE','SU','SO','MB','LE','OE','Rod'];
  const dark = currentTheme === 'dark';
  document.getElementById('heatmap-container').innerHTML = gets.map((v,i) => {
    const pct = Math.round(v/maxH*100);
    const a = 0.12 + (pct/100)*0.7;
    const bg   = dark ? `rgba(229,255,0,${a.toFixed(2)})` : `rgba(4,55,142,${a.toFixed(2)})`;
    const bord = dark ? `rgba(229,255,0,${Math.min(a*1.6,1).toFixed(2)})` : `rgba(4,55,142,${Math.min(a*1.6,1).toFixed(2)})`;
    const txtColor = dark ? (a > 0.55 ? '#0a0a0c' : '#e5ff00') : (a > 0.45 ? '#ffffff' : '#04378e');
    const subColor = dark ? (a > 0.55 ? 'rgba(10,10,12,0.65)' : 'rgba(229,255,0,0.6)') : (a > 0.45 ? 'rgba(255,255,255,0.7)' : 'rgba(4,55,142,0.55)');
    return `<div style="background:${bg};border-radius:8px;padding:13px 4px;text-align:center;border:1px solid ${bord};transition:all 0.3s">
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:${subColor};margin-bottom:5px;font-weight:700">GET<br>${getNomes[i]}</div>
      <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:${txtColor};line-height:1">${v}</div>
      <div style="font-size:9px;color:${subColor};margin-top:4px;font-weight:600">${pct}%</div>
    </div>`;
  }).join('');

  // Legenda modal
  const total = modVals.reduce((a,b)=>a+b,0)||1;
  document.getElementById('legend-modais').innerHTML = MODAL_LABELS.map((l,i) =>
    `<span class="legend-item"><span class="legend-dot" style="background:${MODAL_COLORS[i]}"></span>${l} <strong style="color:var(--text);margin-left:2px">${Math.round(modVals[i]/total*100)}%</strong></span>`
  ).join('');

  const pico = MODAL_LABELS[modVals.indexOf(Math.max(...modVals))];
  document.getElementById('modal-pico-pill').textContent = pico;

  // Alert
  if (data.modais.total_painel > 0) {
    document.getElementById('alert-text').innerHTML = `Análise · Criticidade no modal <strong>${pico.toUpperCase()}</strong> — ${Math.max(...modVals)} ocorrências em ${MESES[data.mes-1]}/${data.ano}`;
    document.getElementById('alert-bar').style.display = 'flex';
  }
}

/* ── TABS ──────────────────────────────────────────── */
function switchTab(id) {
  ['mensal','comparar','anual','timeline'].forEach(t =>
    document.getElementById(`tab-${t}`).style.display = t===id ? 'block' : 'none'
  );
  document.querySelectorAll('.tab').forEach((el,i) =>
    el.classList.toggle('active', ['mensal','comparar','anual','timeline'][i]===id)
  );
}

/* ── TIME-LAPSE ────────────────────────────────────── */
async function toggleTimeLapse() {
  const btn   = document.getElementById('btn-tl-play');
  const icon  = document.getElementById('tl-btn-icon');
  const label = document.getElementById('tl-btn-label');
  const bar   = document.getElementById('player-bar');

  if (tlRunning) {
    clearInterval(tlInterval); tlRunning = false;
    btn.classList.add('paused');
    icon.textContent = '▶'; label.textContent = 'Continuar';
    bar.classList.remove('active');
    return;
  }

  // Monta lista do período definido pelo usuário
  const startMes = parseInt(document.getElementById('tl-start-mes').value)||1;
  const startAno = parseInt(document.getElementById('tl-start-ano').value)||2022;
  const endMes   = parseInt(document.getElementById('tl-end-mes').value)||12;
  const endAno   = parseInt(document.getElementById('tl-end-ano').value)||2026;

  if (tlIndex === 0) {
    // Rebuild list only on fresh start
    tlList = [];
    for (let y=startAno; y<=endAno; y++) {
      const mStart = y===startAno ? startMes : 1;
      const mEnd   = y===endAno   ? endMes   : 12;
      for (let m=mStart; m<=mEnd; m++) {
        const d = calcTotal(gerarDadosMock(m,y));
        tlList.push({ mes:m, ano:y, total:d.modais.total_painel, taxa:parseFloat(d.taxas.mortalidade_100k) });
      }
    }
    // reset charts
    tlData = { labels:[], obitos:[], taxas:[] };
    ['timeline','tlMensal','taxaTrend'].forEach(k => {
      charts[k].data.labels = []; charts[k].data.datasets[0].data = []; charts[k].update();
    });
    document.getElementById('tl-total-pill').textContent = '—';
  }

  tlRunning = true;
  btn.classList.remove('paused');
  icon.textContent = '⏸'; label.textContent = 'Pausar';
  bar.classList.add('active');

  tlInterval = setInterval(async () => {
    if (tlIndex >= tlList.length) {
      clearInterval(tlInterval); tlRunning = false;
      btn.classList.add('paused');
      icon.textContent = '▶'; label.textContent = 'Replay';
      bar.classList.remove('active');
      tlIndex = 0;
      return;
    }
    const p = tlList[tlIndex];
    document.getElementById('input-ano').value = p.ano;
    document.getElementById('input-mes').value = p.mes;
    const lbl = `${MESES[p.mes-1]}/${p.ano}`;
    document.getElementById('player-current').textContent = lbl;
    document.getElementById('player-counter').textContent = `${tlIndex+1} / ${tlList.length}`;
    document.getElementById('progress-fill').style.width = `${((tlIndex+1)/tlList.length*100).toFixed(1)}%`;

    await buscarDadosMes(true);

    tlData.labels.push(lbl);
    tlData.obitos.push(p.total);
    tlData.taxas.push(p.taxa);

    // Curva acumulada
    const acum = tlData.obitos.map((_,i)=> tlData.obitos.slice(0,i+1).reduce((a,b)=>a+b,0));
    charts.timeline.data.labels = [...tlData.labels];
    charts.timeline.data.datasets[0].data = acum;
    charts.timeline.update();

    // Barras mensais
    charts.tlMensal.data.labels = [...tlData.labels];
    charts.tlMensal.data.datasets[0].data = [...tlData.obitos];
    charts.tlMensal.update();

    // Taxa
    charts.taxaTrend.data.labels = [...tlData.labels];
    charts.taxaTrend.data.datasets[0].data = [...tlData.taxas];
    charts.taxaTrend.update();

    const totalAtual = acum[acum.length-1];
    document.getElementById('tl-total-pill').textContent = `${totalAtual} acumulados`;

    tlIndex++;
  }, 900);
}

function resetTimeLine() {
  if (tlRunning) { clearInterval(tlInterval); tlRunning = false; }
  tlIndex = 0; tlList = [];
  tlData = { labels:[], obitos:[], taxas:[] };
  ['timeline','tlMensal','taxaTrend'].forEach(k => {
    charts[k].data.labels = []; charts[k].data.datasets[0].data = []; charts[k].update();
  });
  const btn = document.getElementById('btn-tl-play');
  btn.classList.add('paused');
  document.getElementById('tl-btn-icon').textContent = '▶';
  document.getElementById('tl-btn-label').textContent = 'Iniciar Time-Lapse';
  document.getElementById('player-bar').classList.remove('active');
  document.getElementById('tl-total-pill').textContent = '—';
}

/* ── COMPARAR ─────────────────────────────────────── */
async function executarComparacao() {
  const mA = parseInt(document.getElementById('cmp-a-mes').value);
  const yA = parseInt(document.getElementById('cmp-a-ano').value);
  const mB = parseInt(document.getElementById('cmp-b-mes').value);
  const yB = parseInt(document.getElementById('cmp-b-ano').value);
  document.getElementById('loading').classList.add('show');
  try {
    let dA, dB;
    try {
      const [rA,rB] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/relatorio/?ano=${yA}&mes=${mA}`),
        fetch(`http://127.0.0.1:8000/api/relatorio/?ano=${yB}&mes=${mB}`)
      ]);
      dA = rA.ok ? await rA.json() : null;
      dB = rB.ok ? await rB.json() : null;
    } catch {}
    dA = dA || calcTotal(gerarDadosMock(mA,yA));
    dB = dB || calcTotal(gerarDadosMock(mB,yB));

    const vA = [dA.modais.pedestres,dA.modais.motociclistas,dA.modais.automoveis,dA.modais.ciclistas];
    const vB = [dB.modais.pedestres,dB.modais.motociclistas,dB.modais.automoveis,dB.modais.ciclistas];

    document.getElementById('cmp-a-title').textContent = `${MESES[mA-1]}/${yA}`;
    document.getElementById('cmp-b-title').textContent = `${MESES[mB-1]}/${yB}`;
    document.getElementById('cmp-a-pill').textContent = `${dA.modais.total_painel} óbitos`;
    document.getElementById('cmp-b-pill').textContent = `${dB.modais.total_painel} óbitos`;

    charts.cmpA.data.datasets[0].data = vA; charts.cmpA.update();
    charts.cmpB.data.datasets[0].data = vB; charts.cmpB.update();

    const diff = vA.map((a,i)=> a===0 ? 0 : Math.round((vB[i]-a)/a*100));
    charts.cmpDiff.data.datasets[0].data = diff;
    charts.cmpDiff.data.datasets[0].backgroundColor = diff.map(v=> v>=0 ? 'rgba(255,87,87,0.3)' : 'rgba(229,255,0,0.25)');
    charts.cmpDiff.data.datasets[0].borderColor      = diff.map(v=> v>=0 ? '#ff5757' : '#e5ff00');
    charts.cmpDiff.update();
  } finally { document.getElementById('loading').classList.remove('show'); }
}

/* ── PAINEL ANUAL ─────────────────────────────────── */
async function carregarAnual() {
  const ano = parseInt(document.getElementById('anual-ano').value);
  document.getElementById('loading').classList.add('show');
  try {
    dadosAnual = [];
    for (let m=1; m<=12; m++) {
      let d;
      try { const r=await fetch(`http://127.0.0.1:8000/api/relatorio/?ano=${ano}&mes=${m}`); d=r.ok?await r.json():null; } catch{}
      d = d || calcTotal(gerarDadosMock(m,ano));
      dadosAnual.push(d);
    }
    const vals = dadosAnual.map(d=>d.modais.total_painel);
    const total = vals.reduce((a,b)=>a+b,0);
    const maxV  = Math.max(...vals)||1;
    const dark  = currentTheme === 'dark';

    document.getElementById('year-grid').innerHTML = vals.map((v,i) => {
      const pct = v/maxV;
      const isPeak = v===Math.max(...vals);
      const barColor = dark ? 'rgba(229,255,0,0.85)' : 'rgba(4,55,142,0.8)';
      return `<div class="month-cell ${isPeak?'selected':''}" onclick="selectMonth(${i+1},${ano})">
        <div class="m-name">${MESES[i]}</div>
        <div class="m-val">${v}</div>
        ${isPeak ? '<div class="m-peak">▲ pico</div>' : ''}
        <div class="m-bar" style="transform:scaleX(${pct.toFixed(3)});background:${barColor}"></div>
      </div>`;
    }).join('');

    document.getElementById('anual-total-pill').textContent = `${total} óbitos / ${ano}`;

    const trend = vals.map((_,i) => {
      const sl = vals.slice(Math.max(0,i-1),i+2);
      return Math.round(sl.reduce((a,b)=>a+b,0)/sl.length);
    });
    charts.anual.data.datasets[0].data = vals;
    charts.anual.data.datasets[1].data = trend;
    const c = getChartColors();
    charts.anual.data.datasets[0].backgroundColor = c.bar;
    charts.anual.data.datasets[0].borderColor = c.barBorder;
    charts.anual.update();
  } finally { document.getElementById('loading').classList.remove('show'); }
}

function selectMonth(mes,ano) {
  document.getElementById('input-mes').value = mes;
  document.getElementById('input-ano').value = ano;
  buscarDadosMes(); switchTab('mensal');
}

/* ── EXPORTS ──────────────────────────────────────── */
function exportPNG(chartKey, nome) {
  const c = charts[chartKey];
  if (!c) return;
  const a = document.createElement('a');
  a.download = `${nome}.png`; a.href = c.toBase64Image(); a.click();
}

function exportExcel() {
  if (!dadosAtual) return;
  const d = dadosAtual;
  const wb = XLSX.utils.book_new();
  const header = ['Mês','Ano','População','Frota','Óbitos','Pedestres','Motociclistas','Automóveis','Ciclistas','Taxa/100k','GET-CN','GET-NO','GET-SE','GET-SU','GET-SO','GET-MB','GET-LE','GET-OE','Rodovias'];
  const row = v => [v.mes,v.ano,v.contexto.populacao,v.contexto.frota_total,v.modais.total_painel,v.modais.pedestres,v.modais.motociclistas,v.modais.automoveis,v.modais.ciclistas,v.taxas.mortalidade_100k,v.geografia.get_1_cn,v.geografia.get_2_no,v.geografia.get_3_se,v.geografia.get_4_su,v.geografia.get_5_so,v.geografia.get_6_mb,v.geografia.get_7_le,v.geografia.get_8_oe,v.geografia.rodovias];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([header,row(d)]), 'Mês Atual');
  if (dadosAnual.length>0)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([header,...dadosAnual.map(row)]), `Anual_${d.ano}`);
  XLSX.writeFile(wb, `CET_Sinistros_${d.mes}_${d.ano}.xlsx`);
}