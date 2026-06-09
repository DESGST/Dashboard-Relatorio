// =========================================================
// DADOS DEMO — substitua pelas chamadas reais à API Django
// =========================================================
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
      pedestres: rng(8, 35, 2),
      motociclistas: rng(20, 70, 3),
      automoveis: rng(5, 25, 4),
      ciclistas: rng(2, 12, 5),
      total_painel: 0
    },
    taxas: { mortalidade_100k: (rng(60, 120, 6) / 10).toFixed(1) },
    geografia: {
      get_1_cn: rng(4, 20, 7), get_2_no: rng(2, 15, 8), get_3_se: rng(5, 22, 9),
      get_4_su: rng(3, 18, 10), get_5_so: rng(4, 20, 11), get_6_mb: rng(2, 12, 12),
      get_7_le: rng(5, 25, 13), get_8_oe: rng(3, 16, 14), rodovias: rng(1, 10, 15)
    }
  };
}

function calcTotal(d) {
  d.modais.total_painel = d.modais.pedestres + d.modais.motociclistas + d.modais.automoveis + d.modais.ciclistas;
  return d;
}

// =========================================================
// STATE
// =========================================================
let charts = {};
let dadosAtual = null;
let tlData = { labels: [], obitos: [], taxas: [] };
let tlRunning = false, tlInterval = null, tlIndex = 0, tlList = [];
let dadosAnual = [];
let dadosCmpA = null, dadosCmpB = null;

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const GET_LABELS = ['GET 1 — CN','GET 2 — NO','GET 3 — SE','GET 4 — SU','GET 5 — SO','GET 6 — MB','GET 7 — LE','GET 8 — OE','Rodovias'];
const MODAL_COLORS = ['#ff6b6b','#c8ff57','#57c8ff','#ffc857'];
const MODAL_LABELS = ['Pedestres','Motociclistas','Automóveis','Ciclistas'];

// =========================================================
// INIT CHARTS
// =========================================================
window.addEventListener('DOMContentLoaded', () => {
  initCharts();
  buscarDadosMes();
});

// Configuração padrão responsiva ao Tema Claro/Escuro
function chartDefaults() {
  return {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 700, easing: 'easeOutQuart' },
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: 'var(--surface2)', titleColor: 'var(--text)', bodyColor: 'var(--text)',
      borderColor: 'var(--border)', borderWidth: 1, padding: 10,
      titleFont: { family: 'Syne', weight: '600' }
    }}
  };
}

function initCharts() {
  // GET Bars (Totalmente Dinâmico)
  charts.gets = new Chart(document.getElementById('chartGets'), {
    type: 'bar',
    data: {
      labels: GET_LABELS,
      datasets: [{
        label: 'Óbitos',
        data: new Array(9).fill(0),
        backgroundColor: 'var(--accent-green)', // Usa a cor vibrante do CSS
        borderColor: 'var(--accent-green)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      ...chartDefaults(),
      indexAxis: 'y',
      scales: {
        x: {
          grid: { color: 'var(--grid-color)' }, // Grade dinâmica
          ticks: { color: 'var(--text-color)', font: { size: 11 } }, // Texto dinâmico
          title: {
            display: true,
            text: 'Número de Óbitos',
            color: 'var(--text-color)' // Título dinâmico
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: 'var(--text-color)', font: { size: 11 } } // Texto dinâmico
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  // Modal Doughnut
  charts.modais = new Chart(document.getElementById('chartModais'), {
    type: 'doughnut',
    data: { labels: MODAL_LABELS, datasets: [{ data: [0,0,0,0], backgroundColor: MODAL_COLORS, borderWidth: 0, hoverOffset: 6 }] },
    options: { ...chartDefaults(), cutout: '68%' }
  });

  // Radar Corrigido (Dinâmico)
  charts.radar = new Chart(document.getElementById('chartRadar'), {
    type: 'radar',
    data: { 
      labels: ['Pedestres','Motoc.','Autos','Ciclistas','GET-Alta','GET-Media'],
      datasets: [{ 
        label: 'Risco', 
        data: [0,0,0,0,0,0], 
        backgroundColor: 'var(--grid-color)', /* Fundo neutro dinâmico */
        borderColor: 'var(--accent-green)',   
        borderWidth: 2, 
        pointBackgroundColor: 'var(--accent-green)', 
        pointRadius: 3 
      }]
    },
    options: { 
      ...chartDefaults(), 
      scales: { r: {
        grid: { color: 'var(--border-color)' },          /* Grade dinâmica */
        angleLines: { color: 'var(--border-color)' },    /* Linhas centrais dinâmicas */
        pointLabels: { 
          color: 'var(--text-color)',                    /* Texto dinâmico */
          font: { size: 11, weight: '600' } 
        },
        ticks: { display: false }
      }}
    }
  });

  // Timeline
  charts.timeline = new Chart(document.getElementById('chartTimeline'), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Óbitos Acum.', data: [], borderColor: 'var(--accent-green)', backgroundColor: 'var(--grid-color)', fill: true, tension: 0.35, pointRadius: 3, pointBackgroundColor: 'var(--accent-green)', borderWidth: 2 }] },
    options: { ...chartDefaults(), scales: {
      x: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-color)', font: { size: 11 }, maxRotation: 45 } },
      y: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-color)', font: { size: 11 } } }
    }}
  });

  // Taxa trend
  charts.taxaTrend = new Chart(document.getElementById('chartTaxaTrend'), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Taxa/100k', data: [], borderColor: 'var(--accent-blue)', backgroundColor: 'var(--grid-color)', fill: true, tension: 0.35, pointRadius: 2, borderWidth: 2, borderDash: [] }] },
    options: { ...chartDefaults(), scales: {
      x: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-color)', font: { size: 11 } } },
      y: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-color)', font: { size: 11 } } }
    }}
  });

  // Anual line
  charts.anual = new Chart(document.getElementById('chartAnual'), {
    type: 'bar',
    data: { labels: MESES, datasets: [
      { label: 'Óbitos', data: new Array(12).fill(0), backgroundColor: 'rgba(4, 55, 142, 0.2)', borderColor: '#04378e', borderWidth: 1.5, borderRadius: 4 },
      { label: 'Tendência', data: new Array(12).fill(null), type: 'line', borderColor: 'var(--accent-red)', borderWidth: 2, tension: 0.4, pointRadius: 0 }
    ]},
    options: { ...chartDefaults(), scales: {
      x: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-color)' } },
      y: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-color)' } }
    }}
  });

  // Compare A
  charts.cmpA = new Chart(document.getElementById('chartCmpA'), {
    type: 'bar',
    data: { labels: MODAL_LABELS, datasets: [{ label: 'A', data: [0,0,0,0], backgroundColor: 'rgba(87,200,255,0.2)', borderColor: 'var(--accent-blue)', borderWidth: 1, borderRadius: 4 }] },
    options: { ...chartDefaults(), scales: {
      x: { grid: { display: false }, ticks: { color: 'var(--text-color)', font: { size: 11 } } },
      y: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-color)', font: { size: 11 } } }
    }}
  });

  // Compare B
  charts.cmpB = new Chart(document.getElementById('chartCmpB'), {
    type: 'bar',
    data: { labels: MODAL_LABELS, datasets: [{ label: 'B', data: [0,0,0,0], backgroundColor: 'rgba(200,255,87,0.2)', borderColor: 'var(--accent-green)', borderWidth: 1, borderRadius: 4 }] },
    options: { ...chartDefaults(), scales: {
      x: { grid: { display: false }, ticks: { color: 'var(--text-color)', font: { size: 11 } } },
      y: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-color)', font: { size: 11 } } }
    }}
  });

  // Compare Diff
  charts.cmpDiff = new Chart(document.getElementById('chartCmpDiff'), {
    type: 'bar',
    data: { labels: MODAL_LABELS, datasets: [{ label: 'Variação %', data: [0,0,0,0], backgroundColor: (ctx) => ctx.raw >= 0 ? 'rgba(255,107,107,0.3)' : 'rgba(200,255,87,0.3)', borderColor: (ctx) => ctx.raw >= 0 ? 'var(--accent-red)' : 'var(--accent-green)', borderWidth: 1, borderRadius: 4 }] },
    options: { ...chartDefaults(), scales: {
      x: { grid: { display: false }, ticks: { color: 'var(--text-color)' } },
      y: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-color)', callback: v => v + '%' } }
    }}
  });
}

// =========================================================
// BUSCAR DADOS
// =========================================================
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
    } catch {
      data = calcTotal(gerarDadosMock(mes, ano));
    }
    dadosAtual = data;
    atualizarInterface(data);
    return data;
  } finally {
    if (!silencioso) document.getElementById('loading').classList.remove('show');
  }
}

function atualizarInterface(data) {
  const fmt = n => n?.toLocaleString('pt-BR') ?? '—';
  document.getElementById('kpi-obitos').textContent = data.modais.total_painel;
  document.getElementById('kpi-taxa').textContent = data.taxas.mortalidade_100k;
  document.getElementById('kpi-frota').textContent = fmt(data.contexto.frota_total);
  document.getElementById('kpi-pop').textContent = fmt(data.contexto.populacao);

  const gets = [
    data.geografia.get_1_cn, data.geografia.get_2_no, data.geografia.get_3_se,
    data.geografia.get_4_su, data.geografia.get_5_so, data.geografia.get_6_mb,
    data.geografia.get_7_le, data.geografia.get_8_oe, data.geografia.rodovias
  ];

  charts.gets.data.datasets[0].data = gets;
  charts.gets.update();

  const modVals = [data.modais.pedestres, data.modais.motociclistas, data.modais.automoveis, data.modais.ciclistas];
  charts.modais.data.datasets[0].data = modVals;
  charts.modais.update();

  const maxM = Math.max(...modVals) || 1;
  const maxG = Math.max(...gets) || 1;
  const getAlta = Math.max(data.geografia.get_1_cn, data.geografia.get_7_le, data.geografia.get_3_se);
  charts.radar.data.datasets[0].data = [
    Math.round(data.modais.pedestres / maxM * 100),
    Math.round(data.modais.motociclistas / maxM * 100),
    Math.round(data.modais.automoveis / maxM * 100),
    Math.round(data.modais.ciclistas / maxM * 100),
    Math.round(getAlta / maxG * 100),
    Math.round((data.geografia.get_4_su + data.geografia.get_2_no) / 2 / maxG * 100)
  ];
  charts.radar.update();

  // Heatmap Corrigido (Texto Preto Absoluto para Contraste)
  const maxH = Math.max(...gets) || 1;
  const hc = document.getElementById('heatmap-container');
  const getNomes = ['CN','NO','SE','SU','SO','MB','LE','OE','Rod'];
  hc.innerHTML = gets.map((v, i) => {
    const pct = Math.round(v / maxH * 100);
    const alpha = 0.15 + (pct / 100) * 0.7; // Aumentado um pouco o brilho base
    return `<div style="background:rgba(200,255,87,${alpha.toFixed(2)}); border-radius:8px; padding:14px 6px; text-align:center; border:1px solid rgba(200,255,87,${(alpha * 1.5).toFixed(2)})">
      <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.07em; color:#000000; font-weight:bold; margin-bottom:6px">GET ${getNomes[i]}</div>
      <div style="font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#000000;">${v}</div>
      <div style="font-size:10px; color:#000000; font-weight:600; margin-top:3px">${pct}%</div>
    </div>`;
  }).join('');

  const legendEl = document.getElementById('legend-modais');
  const total = modVals.reduce((a, b) => a + b, 0) || 1;
  legendEl.innerHTML = MODAL_LABELS.map((l, i) => `
    <span class="legend-item">
      <span class="legend-dot" style="background:${MODAL_COLORS[i]}"></span>
      ${l} <strong style="color:var(--text);margin-left:2px">${Math.round(modVals[i]/total*100)}%</strong>
    </span>`).join('');

  const pico = MODAL_LABELS[modVals.indexOf(Math.max(...modVals))];
  document.getElementById('modal-pico-pill').textContent = pico;

  if (data.modais.total_painel > 0) {
    document.getElementById('alert-text').innerHTML = `Análise de fatores: criticidade no modal <strong>${pico.toUpperCase()}</strong> — ${Math.max(...modVals)} ocorrências em ${MESES[data.mes - 1]}/${data.ano}.`;
    document.getElementById('alert-bar').style.display = 'flex';
  }
}

// =========================================================
// TABS
// =========================================================
function switchTab(id) {
  ['mensal','comparar','anual','timeline'].forEach(t => {
    document.getElementById(`tab-${t}`).style.display = t === id ? 'block' : 'none';
  });
  document.querySelectorAll('.tab').forEach((el, i) => {
    el.classList.toggle('active', ['mensal','comparar','anual','timeline'][i] === id);
  });
}

// =========================================================
// TIME-LAPSE
// =========================================================
async function toggleTimeLapse() {
    const btn = document.getElementById('btn-animar');
    const bar = document.getElementById('player-bar');

    if (tlRunning) {
        clearInterval(tlInterval);
        tlRunning = false;
        btn.textContent = '▶ Iniciar Evolução';
        btn.classList.remove('running');
        bar.classList.remove('active');
        return;
    }

    const startMes = parseInt(document.getElementById('tl-start-mes').value);
    const startAno = parseInt(document.getElementById('tl-start-ano').value);
    const endMes = parseInt(document.getElementById('tl-end-mes').value);
    const endAno = parseInt(document.getElementById('tl-end-ano').value);

    tlList = [];

    for (let y = startAno; y <= endAno; y++) {
        let mesInicial = (y === startAno) ? startMes : 1;
        let mesFinal = (y === endAno) ? endMes : 12;

        for (let m = mesInicial; m <= mesFinal; m++) {
            const d = calcTotal(gerarDadosMock(m, y)); 
            tlList.push({ mes: m, ano: y, total: d.modais.total_painel, taxa: parseFloat(d.taxas.mortalidade_100k) });
        }
    }

    tlRunning = true;
    tlIndex = 0;
    btn.textContent = '⏸ Pausar';
    btn.classList.add('running');
    bar.classList.add('active');

    tlData = { labels: [], obitos: [], taxas: [] };
    charts.timeline.data.labels = [];
    charts.timeline.data.datasets[0].data = [];
    charts.timeline.update();
    charts.taxaTrend.data.labels = [];
    charts.taxaTrend.data.datasets[0].data = [];
    charts.taxaTrend.update();

    switchTab('timeline');

    tlInterval = setInterval(async () => {
        if (tlIndex >= tlList.length) {
            clearInterval(tlInterval);
            tlRunning = false;
            btn.textContent = '▶ Iniciar Evolução';
            btn.classList.remove('running');
            bar.classList.remove('active');
            return;
        }
        const p = tlList[tlIndex];
        
        document.getElementById('input-ano').value = p.ano;
        document.getElementById('input-mes').value = p.mes;

        const label = `${MESES[p.mes-1]}/${p.ano}`;
        document.getElementById('player-current').textContent = label;
        document.getElementById('player-counter').textContent = `${tlIndex + 1} / ${tlList.length}`;
        document.getElementById('progress-fill').style.width = `${((tlIndex + 1) / tlList.length * 100).toFixed(1)}%`;

        await buscarDadosMes(true);

        tlData.labels.push(label);
        tlData.obitos.push(p.total);
        tlData.taxas.push(p.taxa);

        charts.timeline.data.labels = [...tlData.labels];
        charts.timeline.data.datasets[0].data = [...tlData.obitos];
        charts.timeline.update();

        charts.taxaTrend.data.labels = [...tlData.labels];
        charts.taxaTrend.data.datasets[0].data = [...tlData.taxas];
        charts.taxaTrend.update();

        tlIndex++;
    }, 900);
}

// =========================================================
// COMPARAR
// =========================================================
async function executarComparacao() {
  const mA = parseInt(document.getElementById('cmp-a-mes').value);
  const yA = parseInt(document.getElementById('cmp-a-ano').value);
  const mB = parseInt(document.getElementById('cmp-b-mes').value);
  const yB = parseInt(document.getElementById('cmp-b-ano').value);

  document.getElementById('loading').classList.add('show');
  try {
    let dA, dB;
    try {
      const [rA, rB] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/relatorio/?ano=${yA}&mes=${mA}`),
        fetch(`http://127.0.0.1:8000/api/relatorio/?ano=${yB}&mes=${mB}`)
      ]);
      dA = rA.ok ? await rA.json() : null;
      dB = rB.ok ? await rB.json() : null;
    } catch {}
    dA = dA || calcTotal(gerarDadosMock(mA, yA));
    dB = dB || calcTotal(gerarDadosMock(mB, yB));

    dadosCmpA = dA; dadosCmpB = dB;
    const vA = [dA.modais.pedestres, dA.modais.motociclistas, dA.modais.automoveis, dA.modais.ciclistas];
    const vB = [dB.modais.pedestres, dB.modais.motociclistas, dB.modais.automoveis, dB.modais.ciclistas];

    document.getElementById('cmp-a-title').textContent = `${MESES[mA-1]}/${yA}`;
    document.getElementById('cmp-b-title').textContent = `${MESES[mB-1]}/${yB}`;
    document.getElementById('cmp-a-pill').textContent = `${dA.modais.total_painel} óbitos`;
    document.getElementById('cmp-b-pill').textContent = `${dB.modais.total_painel} óbitos`;

    charts.cmpA.data.datasets[0].data = vA;
    charts.cmpA.update();
    charts.cmpB.data.datasets[0].data = vB;
    charts.cmpB.update();

    const diff = vA.map((a, i) => vA[i] === 0 ? 0 : Math.round((vB[i] - a) / a * 100));
    charts.cmpDiff.data.datasets[0].data = diff;
    charts.cmpDiff.data.datasets[0].backgroundColor = diff.map(v => v >= 0 ? 'rgba(255,107,107,0.3)' : 'rgba(200,255,87,0.3)');
    charts.cmpDiff.data.datasets[0].borderColor = diff.map(v => v >= 0 ? '#ff6b6b' : '#c8ff57');
    charts.cmpDiff.update();
  } finally {
    document.getElementById('loading').classList.remove('show');
  }
}

// =========================================================
// PAINEL ANUAL
// =========================================================
async function carregarAnual() {
  const ano = parseInt(document.getElementById('anual-ano').value);
  document.getElementById('loading').classList.add('show');
  try {
    dadosAnual = [];
    for (let m = 1; m <= 12; m++) {
      let d;
      try {
        const r = await fetch(`http://127.0.0.1:8000/api/relatorio/?ano=${ano}&mes=${m}`);
        d = r.ok ? await r.json() : null;
      } catch {}
      d = d || calcTotal(gerarDadosMock(m, ano));
      dadosAnual.push(d);
    }

    const vals = dadosAnual.map(d => d.modais.total_painel);
    const total = vals.reduce((a, b) => a + b, 0);
    const maxV = Math.max(...vals) || 1;

    const grid = document.getElementById('year-grid');
    grid.innerHTML = vals.map((v, i) => {
      const pct = v / maxV;
      const alpha = 0.06 + pct * 0.55;
      return `<div class="month-cell ${v === Math.max(...vals) ? 'selected' : ''}" onclick="selectMonth(${i+1},${ano})">
        <div class="m-name">${MESES[i]}</div>
        <div class="m-val">${v}</div>
        <div class="m-bar" style="transform:scaleX(${pct.toFixed(2)});background:rgba(200,255,87,0.8)"></div>
      </div>`;
    }).join('');

    document.getElementById('anual-total-pill').textContent = `${total} óbitos / ${ano}`;

    const trend = vals.map((_, i) => {
      const slice = vals.slice(Math.max(0, i - 1), i + 2);
      return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
    });

    charts.anual.data.datasets[0].data = vals;
    charts.anual.data.datasets[1].data = trend;
    charts.anual.update();
  } finally {
    document.getElementById('loading').classList.remove('show');
  }
}

function selectMonth(mes, ano) {
  document.getElementById('input-mes').value = mes;
  document.getElementById('input-ano').value = ano;
  buscarDadosMes();
  switchTab('mensal');
}

// =========================================================
// EXPORTS
// =========================================================
function exportPNG(chartId, nome) {
  const c = charts[chartId] || Chart.getChart(chartId);
  if (!c) return;
  const a = document.createElement('a');
  a.download = `${nome}.png`;
  a.href = c.toBase64Image();
  a.click();
}

function exportExcel() {
  if (!dadosAtual) return;
  const d = dadosAtual;
  const wb = XLSX.utils.book_new();
  const rows = [
    ['Mês','Ano','População','Frota Total','Óbitos Totais','Pedestres','Motociclistas','Automóveis','Ciclistas','Taxa /100k','GET-1 CN','GET-2 NO','GET-3 SE','GET-4 SU','GET-5 SO','GET-6 MB','GET-7 LE','GET-8 OE','Rodovias'],
    [d.mes, d.ano, d.contexto.populacao, d.contexto.frota_total, d.modais.total_painel, d.modais.pedestres, d.modais.motociclistas, d.modais.automoveis, d.modais.ciclistas, d.taxas.mortalidade_100k, d.geografia.get_1_cn, d.geografia.get_2_no, d.geografia.get_3_se, d.geografia.get_4_su, d.geografia.get_5_so, d.geografia.get_6_mb, d.geografia.get_7_le, d.geografia.get_8_oe, d.geografia.rodovias]
  ];
  if (dadosAnual.length > 0) {
    const anualRows = [rows[0], ...dadosAnual.map(dd => rows[1].map((_, i) => rows[1][i]))];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dadosAnual.map(dd =>
      [dd.mes, dd.ano, dd.contexto.populacao, dd.contexto.frota_total, dd.modais.total_painel, dd.modais.pedestres, dd.modais.motociclistas, dd.modais.automoveis, dd.modais.ciclistas, dd.taxas.mortalidade_100k, dd.geografia.get_1_cn, dd.geografia.get_2_no, dd.geografia.get_3_se, dd.geografia.get_4_su, dd.geografia.get_5_so, dd.geografia.get_6_mb, dd.geografia.get_7_le, dd.geografia.get_8_oe, dd.geografia.rodovias]
    )), `Anual_${document.getElementById('anual-ano').value}`);
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Mês Atual');
  XLSX.writeFile(wb, `CET_Sinistros_${d.mes}_${d.ano}.xlsx`);
}
// =========================================================
// TEMA CLARO E ESCURO
// =========================================================
function toggleTheme() {
    // Liga e desliga a classe dark-theme no body (exatamente como está no seu CSS)
    document.body.classList.toggle('dark-theme');

    // Manda os gráficos lerem as cores novas e se atualizarem
    for (let chartId in charts) {
        if (charts[chartId]) {
            charts[chartId].update();
        }
    }
}