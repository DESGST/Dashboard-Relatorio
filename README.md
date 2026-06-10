# 📊 Plataforma de Inteligência de Tráfego: Automação de Sinistros — CET Sp

Uma solução full-stack corporativa desenvolvida para automatizar a ingestão, processamento e visualização de indicadores analíticos de sinistros de trânsito para a **Companhia de Engenharia de Tráfego (CET - São Paulo)**. 

O sistema substitui rotinas manuais de planilhas por um pipeline automatizado com banco de dados relacional e um painel web interativo de alta performance.

---

## 🚀 O Projeto & Arquitetura

A plataforma foi desenhada seguindo a separação estrita de responsabilidades (Decoupled Architecture), dividida em um motor de banco de dados, uma API de serviços e uma interface cliente de alta fidelidade visual.

### Principais Diferenciais:
* **Tratamento Ético de Dados:** Em conformidade com as diretrizes de transparência pública, o sistema possui proteção contra falhas de rede. Caso o servidor fique offline, a interface zera as métricas automaticamente, impedindo a exibição de dados simulados (falsos) que possam induzir a interpretações errôneas.
* **Seletor Dinâmico de Base Populacional:** Permite ao analista de tráfego recalcular o Índice de Mortalidade em tempo real na interface, alternando a base proporcional entre **10K, 100K, 500K e 1M de habitantes** via regra de três calculada no cliente.
* **Time-Lapse de Evolução Histórica (Pre-fetching):** Motor de animação que realiza o carregamento paralelo em massa de dados históricos da API (`Promise.all`), permitindo reproduzir a evolução mensal dos modais em alta velocidade (**150ms por ciclo**) sem gargalos de rede.

---

## 🛠️ Tecnologias e Design System

### Backend & Dados
* **Python / Django REST Framework:** Construção de endpoints analíticos robustos e serialização otimizada.
* **SQL Server:** Banco de dados relacional oficial utilizado para garantir a persistência, integridade e consistência histórica dos dados de tráfego.

### Frontend & Interface
* **Vanilla JavaScript (ES6+):** Manipulação de DOM e lógica assíncrona de alto desempenho.
* **Chart.js:** Renderização de gráficos dinâmicos e customizados (Barras Horizontais, Radar Perfil de Risco e Rosca de Mix de Modais).
* **Design System Adaptativo:** CSS moderno utilizando variáveis nativas (`var(--text)`, `var(--accent)`). Suporta **Modo Claro** (Foco no Azul Institucional) e **Modo Escuro** (Foco no Amarelo-Lima de alta visibilidade), com inversão automática da paleta de cores dos gráficos em tempo de execução.

---

## 📂 Estrutura do Repositório

```text
automacao-sinistros-relatorio/
├── automacao-back-end/
│   └── backend/                # Servidor Django, rotas da API e conexões SQL Server
│       ├── core/
│       ├── app_planilhas/
│       ├── requirements.txt    # Dependências do ecossistema Python
│       └── manage.py
├── frontend/                   # Interface do Usuário (Cliente Estático)
│   ├── css/
│   │   └── style.css           # Design System, variáveis de tema e layout responsivo
│   ├── js/
│   │   └── app.js              # Lógica de controle, Chart.js, animações e requisições
│   └── index.html              # Estrutura semântica e painel de KPIs
└── .gitignore                  # Proteção de segurança (arquivos .env e venv isolados)