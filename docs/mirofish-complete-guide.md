# 🐟 MiroFish: Complete Deployment, Usage & Portfolio Guide
> *Swarm Intelligence for Real-World Prediction — Kenya Edition*

---

## Table of Contents
1. [What is MiroFish?](#1-what-is-mirofish)
2. [Architecture Deep Dive](#2-architecture-deep-dive)
3. [Prerequisites & API Keys](#3-prerequisites--api-keys)
4. [Local Setup](#4-local-setup)
5. [Deploy to Railway](#5-deploy-to-railway)
6. [Deploy to RunPod GPU](#6-deploy-to-runpod-gpu)
7. [What to Test First](#7-what-to-test-first)
8. [Kenya Real-World Use Cases](#8-kenya-real-world-use-cases)
   - 8A. 2027 Elections: Who Will Win?
   - 8B. Ruto Impeachment Probability
   - 8C. Importing 10,000 MT of Rice — Full Regulatory Roadmap
   - 8D. Trade Policy Simulation
   - 8E. Business & Market Intelligence
   - 8F. Public Health Policy
   - 8G. Infrastructure Projects
9. [Document Preparation Templates](#9-document-preparation-templates)
10. [Simulation Workflow Nodes Roadmap](#10-simulation-workflow-nodes-roadmap)
11. [Monitoring & Logging](#11-monitoring--logging)
12. [Add MiroFish to Your Portfolio](#12-add-mirofish-to-your-portfolio)
13. [Limitations & Ethical Notes](#13-limitations--ethical-notes)
14. [Cost Estimates](#14-cost-estimates)

---

## 1. What is MiroFish?

MiroFish is an **open-source swarm intelligence prediction engine** built by Guo Hangjiang (a senior undergrad in China) in just 10 days. It topped GitHub Global Trending in March 2026, accumulated 32,000+ stars, and attracted $4M funding in 24 hours from Shanda Group's Chen Tianqiao.

**Core idea:** Instead of asking one AI "what will happen?", MiroFish spawns **thousands of autonomous AI agents** — each with a unique personality, long-term memory, and behavioral logic — drops them into a simulated Twitter/Reddit-like world, and watches what *emerges*. The collective behaviour of thousands of agents produces prediction reports that no single model could generate.

### How It Works (5-Stage Pipeline)

```
SEED MATERIAL → GRAPH BUILD → AGENT SPAWN → SIMULATION → REPORT
(News/Docs/PDFs)  (GraphRAG)   (Personas +    (OASIS      (ReportAgent
                               Memories)      Engine)      Analysis)
```

1. **Seed Material** — You upload news articles, PDFs, policy docs, financial reports, even novels
2. **Graph Building** — GraphRAG extracts entities, relationships, and events into a Knowledge Graph
3. **Agent Spawning** — Thousands of agents are generated with unique personalities + memory via Zep Cloud
4. **Simulation** — OASIS engine runs parallel Twitter-like + Reddit-like social environments
5. **Report Generation** — ReportAgent synthesises emergent patterns into a structured prediction

**Key stats:**
- Powered by OASIS (CAMEL-AI) — supports up to **1 million agents**
- **23 social actions**: follow, comment, repost, like, mute, search, etc.
- OpenAI-compatible — works with GPT-4, Claude, Qwen, Gemini, local models
- Frontend: Vue.js | Backend: Python + FastAPI | Memory: Zep Cloud | Knowledge: GraphRAG
- License: AGPL-3.0 (you can build commercial services on top, but changes to core must be open-sourced)

---

## 2. Architecture Deep Dive

```
┌─────────────────────────────────────────────────────────────────┐
│                        MIROFISH SYSTEM                          │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  Vue.js  │◄──►│  FastAPI     │◄──►│   OASIS Engine       │  │
│  │ Frontend │    │  Backend     │    │   (CAMEL-AI)         │  │
│  │ :3000    │    │  :5001       │    │   1M agent capacity  │  │
│  └──────────┘    └──────┬───────┘    └──────────────────────┘  │
│                         │                                       │
│              ┌──────────┴──────────┐                           │
│              │                     │                           │
│        ┌─────▼──────┐    ┌────────▼────────┐                  │
│        │ Zep Cloud  │    │  GraphRAG        │                  │
│        │ (Memory)   │    │  Knowledge Graph │                  │
│        └────────────┘    └─────────────────┘                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LLM Backend (OpenAI-compatible):                        │  │
│  │  GPT-4o / Claude / Qwen-Plus / Gemini / Local Ollama     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Prerequisites & API Keys

You need **three things** before deploying:

### 3.1 LLM API Key (pick one)

| Provider | Model | Cost | Notes |
|----------|-------|------|-------|
| OpenAI | `gpt-4o` or `gpt-4o-mini` | ~$0.015/1K tokens | Best quality |
| Anthropic | `claude-sonnet-4-20250514` | ~$0.003/1K tokens | Excellent reasoning |
| Alibaba Qwen | `qwen-plus` | ~$0.0008/1K tokens | **Official recommendation, cheapest** |
| Google | `gemini-1.5-flash` | ~$0.00035/1K tokens | Fast & cheap |
| Local (Ollama) | `llama3.2`, `mistral` | Free | Needs GPU locally |

**Recommended for Kenya use cases**: OpenAI `gpt-4o-mini` or Qwen-plus (cost-effective for many simulation rounds).

**Get your key:**
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- Alibaba Qwen: https://bailian.console.aliyun.com/
- Google: https://aistudio.google.com/

### 3.2 Zep Cloud API Key (Free)

Zep Cloud handles long-term agent memory. The free tier is sufficient for most simulations.

1. Go to: https://app.getzep.com/
2. Sign up → Create a project
3. Copy your API key

### 3.3 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 8 GB | 16 GB |
| CPU | 4 cores | 8+ cores |
| Disk | 10 GB | 20 GB |
| Node.js | 18+ | 20+ |
| Python | 3.11+ | 3.11+ |
| GPU | Not required* | NVIDIA with 16GB+ VRAM |

*GPU is only needed if running a **local LLM** (e.g., Ollama). If you use an API-based LLM (OpenAI, Anthropic, Qwen), no GPU is needed for deployment.

---

## 4. Local Setup

```bash
# Step 1: Clone the repo
git clone https://github.com/666ghj/MiroFish.git
cd MiroFish

# Step 2: Copy and configure environment
cp .env.example .env
nano .env  # or code .env
```

**Edit your `.env` file:**
```env
# ─── LLM Configuration (OpenAI-compatible) ───
LLM_API_KEY=sk-your-openai-or-qwen-key-here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL_NAME=gpt-4o-mini

# For Qwen (cheaper, officially recommended):
# LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
# LLM_MODEL_NAME=qwen-plus

# For Anthropic Claude via OpenAI-compatible proxy:
# LLM_BASE_URL=https://api.anthropic.com/v1
# LLM_MODEL_NAME=claude-sonnet-4-20250514

# ─── Zep Cloud (Agent Memory) ───
ZEP_API_KEY=your-zep-cloud-key-here
```

```bash
# Step 3: Install all dependencies at once
npm run setup:all

# Step 4: Start both frontend + backend
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

---

## 5. Deploy to Railway

Railway is the easiest cloud deployment path — no GPU required since MiroFish uses external LLM APIs.

### 5.1 Fork the Repository First

Go to https://github.com/666ghj/MiroFish → **Fork** it to your GitHub account.

### 5.2 Railway Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init
```

### 5.3 Create Two Services on Railway

MiroFish has a frontend and a backend. Deploy them as separate Railway services.

**Service 1 — Backend (Python/FastAPI):**

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your forked MiroFish repo
3. Set **Root Directory**: `/backend`
4. Set **Start Command**: `python app.py` or `uvicorn app:app --host 0.0.0.0 --port 5001`
5. Add Environment Variables:
   ```
   LLM_API_KEY=your-key
   LLM_BASE_URL=https://api.openai.com/v1
   LLM_MODEL_NAME=gpt-4o-mini
   ZEP_API_KEY=your-zep-key
   PORT=5001
   ```

**Service 2 — Frontend (Node/Vue):**

1. New service → same repo
2. Set **Root Directory**: `/frontend`
3. Set **Build Command**: `npm run build`
4. Set **Start Command**: `npm run preview` or serve the `dist` folder
5. Add Environment Variable:
   ```
   VITE_API_BASE_URL=https://your-backend-service.up.railway.app
   ```

### 5.4 Railway `railway.toml` (place in repo root)

```toml
[build]
builder = "NIXPACKS"

[[services]]
name = "mirofish-backend"
rootDirectory = "backend"
startCommand = "uvicorn app:app --host 0.0.0.0 --port $PORT"

[[services]]
name = "mirofish-frontend"
rootDirectory = "frontend"
buildCommand = "npm install && npm run build"
startCommand = "npx serve dist -p $PORT"
```

### 5.5 Estimated Railway Cost

| Plan | Cost | Good for |
|------|------|---------|
| Hobby | $5/month + usage | Dev/testing |
| Pro | $20/month + usage | Production |
| Backend compute | ~$0.000463/vCPU-second | Variable |

Railway has no GPU support — if you want local LLMs, use RunPod instead.

---

## 6. Deploy to RunPod GPU

Use RunPod when you want to run **local open-source LLMs** (Llama, Mistral, Qwen) instead of paying per-token to OpenAI. This gives you full control and is cost-effective for heavy research workloads.

### 6.1 Architecture on RunPod

```
RunPod Pod (GPU)
├── Container 1: Ollama (Local LLM Server)  ← GPU handles inference
├── Container 2: MiroFish Backend (FastAPI)  ← Calls Ollama as LLM
└── Container 3: MiroFish Frontend (Vue)    ← Exposed via HTTP
```

### 6.2 Choose Your GPU

| GPU | VRAM | Best For | Cost/hr |
|-----|------|----------|---------|
| RTX 4090 | 24 GB | Llama 3.1 8B, Mistral 7B | ~$0.74 |
| A40 | 48 GB | Llama 3.1 70B (quantized) | ~$0.79 |
| A100 80GB | 80 GB | Llama 3.1 70B FP16 | ~$2.49 |
| H100 80GB SXM | 80 GB | Maximum performance | ~$3.99 |

**Recommended for MiroFish Kenya research**: RTX 4090 (24GB) running `llama3.2:3b` or `mistral:7b` via Ollama — best price/performance ratio.

**VRAM rule of thumb**: ~2 GB per billion parameters. A 7B model needs ~14GB in FP16, or ~4GB at 4-bit quantization.

### 6.3 RunPod Deployment Steps

**Step 1: Create a Pod**
1. Go to https://runpod.io
2. Click **Deploy** → **GPU Pod**
3. Select **RTX 4090** (24GB VRAM)
4. Template: Select **RunPod PyTorch 2.4** (Ubuntu 22.04, CUDA 12.4)
5. Set disk: 50 GB (for models + code)
6. Expose ports: `3000, 5001, 11434` (11434 is Ollama)
7. Click **Deploy**

**Step 2: SSH into Pod**
```bash
ssh root@your-pod-ip -p your-pod-port
```

**Step 3: Install Ollama + pull a model**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama server
ollama serve &

# Pull a model (pick based on your VRAM)
ollama pull llama3.2:3b        # 2GB VRAM — fast, good quality
ollama pull mistral:7b          # 4GB VRAM — excellent reasoning
ollama pull qwen2.5:14b         # 8GB VRAM — great for multilingual
ollama pull llama3.1:70b-q4    # 35GB VRAM — best quality, needs A40+

# Test it works
ollama run mistral:7b "Explain Kenya's 2027 election dynamics"
```

**Step 4: Clone & Configure MiroFish**
```bash
git clone https://github.com/666ghj/MiroFish.git
cd MiroFish
cp .env.example .env
```

**Edit `.env` to point to local Ollama:**
```env
LLM_API_KEY=ollama
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL_NAME=mistral:7b
ZEP_API_KEY=your-zep-cloud-key
```

**Step 5: Install dependencies**
```bash
# Install Node.js 20 (if not present)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install uv (Python package manager)
pip install uv

# Install all MiroFish deps
npm run setup:all
```

**Step 6: Start MiroFish**
```bash
npm run dev
```

**Step 7: Access via RunPod proxy**

RunPod creates HTTPS proxy URLs for your exposed ports:
- Frontend: `https://your-pod-id-3000.proxy.runpod.net`
- Backend: `https://your-pod-id-5001.proxy.runpod.net`

### 6.4 Docker Deployment on RunPod (Recommended for Production)

Create a `Dockerfile.runpod` in the MiroFish root:

```dockerfile
FROM pytorch/pytorch:2.4.0-cuda12.4-cudnn9-runtime

# Install system deps
RUN apt-get update && apt-get install -y nodejs npm curl git

# Install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Install uv
RUN pip install uv

# Clone MiroFish
WORKDIR /app
COPY . .

# Install Node deps
RUN npm run setup

# Install Python deps
RUN npm run setup:backend

# Expose ports
EXPOSE 3000 5001 11434

# Start script
COPY start.sh /start.sh
RUN chmod +x /start.sh
CMD ["/start.sh"]
```

Create `start.sh`:
```bash
#!/bin/bash
# Start Ollama
ollama serve &
sleep 3
ollama pull mistral:7b

# Start MiroFish
cd /app && npm run dev
```

### 6.5 Cost Management on RunPod

- **Always stop your pod when not using it** — billing is per-minute
- RTX 4090 at $0.74/hr = **$0.012/minute**
- A 2-hour simulation session = ~$1.48
- Use **spot instances** for 50-80% savings (workloads may be interrupted)
- Set a **budget alert** in RunPod settings

---

## 7. What to Test First

Start small — MiroFish recommends **fewer than 40 simulation rounds** for initial testing to control API costs.

### Test 1 — Minimal Sanity Check (5 agents, 10 rounds)

**Seed material:**
```
President Ruto announced a 16% VAT on bread effective immediately.
Public protests have erupted in Nairobi's Mathare, Kibera, and Eastleigh.
Opposition leader Raila Odinga called it 'an assault on the poor'.
```

**Prediction question:** "How will public sentiment evolve over the next 7 days?"

**Expected output:** A report showing opinion clusters, polarisation patterns, who the key influencers are among agents, and predicted narrative trajectory.

### Test 2 — Medium Simulation (50 agents, 25 rounds)

**Seed material:** Upload a recent Nation Media or Standard news article as a PDF.

**Prediction question:** "What are the second-order effects of this event on Kenya's political landscape?"

### Test 3 — Full Research Simulation (200–500 agents, 40 rounds)

For the Kenya election scenarios below. Budget $5–20 in LLM API calls.

---

## 8. Kenya Real-World Use Cases

> **Important note on simulation outputs:** MiroFish produces *probabilistic scenario exploration*, not guaranteed predictions. Treat outputs as structured strategic intelligence, not certainty. Always validate against real-world sources.

---

### 8A. 2027 Kenya Elections — Who Will Win?

**Goal:** Simulate public opinion formation, coalition dynamics, and voting intent heading into 2027.

**Seed Materials to Upload:**
- IEBC voter registration data summaries
- Recent opinion poll PDFs (TIFA, Infotrak, Ipsos)
- News articles on Ruto, Raila, Gachagua, Kalonzo, Mudavadi
- 2022 election results by county
- Current economic indicators (cost of living, unemployment)

**Prediction Questions to Run:**

```
Question 1:
"Given the current economic conditions (high cost of living, fuel prices, 
unemployment) and the political coalitions in Kenya, simulate how voter 
sentiment will evolve from now through August 2027. Which candidate coalition 
emerges strongest and in which counties?"

Question 2:
"If Rigathi Gachagua forms his own political party and runs independently, 
how does this split the Mt. Kenya vote? Simulate the ripple effects on 
Ruto's vote share."

Question 3:
"Simulate the impact of a Raila-Kalonzo alliance on NASA/Azimio's 
consolidated base. What is the projected vote distribution by region?"
```

**Variables to inject mid-simulation:**
- "A major corruption scandal involving the Deputy President breaks"
- "IMF announces Kenya's debt restructuring is successful"
- "Drought hits North Eastern Kenya 6 months before elections"

**Expected Report Outputs:**
- Regional vote share heatmaps by agent opinion clusters
- Coalition formation likelihood scores
- Key swing county analysis (Nakuru, Kisii, Meru, Turkana)
- Narrative momentum tracking (which candidate's story is spreading fastest)
- Risk factors and black swan events

**Document to Prepare After Simulation:**
See Section 9A for the full election strategy briefing template.

---

### 8B. Ruto Impeachment — Probability & Timeline

**Goal:** Simulate whether the political conditions for a successful impeachment motion can crystallise.

**Seed Materials:**
- Kenya Constitution 2010, Article 150 (impeachment process)
- Current parliamentary composition data
- Gachagua impeachment proceedings transcripts (precedent)
- Recent opposition press statements
- Public trust survey data

**Prediction Questions:**

```
Question 1:
"Given the current parliamentary composition and the precedent set by 
the Gachagua impeachment, simulate: under what conditions would enough 
National Assembly and Senate members vote to impeach President Ruto? 
What events would need to occur?"

Question 2:
"Simulate the public opinion dynamics if a formal impeachment motion 
is tabled. How do Kenya's 47 county assemblies respond? What is the 
likelihood of a 2/3 majority being achieved?"

Question 3:
"If Gachagua's new political movement actively campaigns for impeachment, 
how does this change the calculus among Jubilee/UDA MPs from Mt. Kenya region?"
```

**The Constitutional Math to Feed as Seed:**
- Need 2/3 of National Assembly (233 of 349 seats)
- Need 2/3 of Senate (46 of 67 senators)
- County Assembly resolutions carry weight
- MiroFish will simulate how social pressure, party whipping, and public opinion move these numbers

**Output:** Probability distribution across 3 scenarios — (1) motion fails, (2) motion succeeds in NA but fails in Senate, (3) full impeachment succeeds. Timeline projections.

---

### 8C. Importing 10,000 Metric Tonnes of Rice — Full Regulatory Roadmap

This is a **legitimate import business planning simulation** — MiroFish can model regulatory, market, and stakeholder dynamics. Here is the full legitimate breakdown:

#### The Real Regulatory Process (No Shortcuts)

**Agencies You Must Contact (Legitimate):**

| Agency | Role | Estimated Processing Time | Fees |
|--------|------|--------------------------|------|
| Kenya Revenue Authority (KRA) | Import duty, VAT, IVAS assessment | 3–7 days online | Import duty: 0–35% (EAC CET); VAT: 16% |
| Kenya Bureau of Standards (KEBS) | Certificate of Conformity, quality testing | 14–30 days | ~KES 50,000–200,000 |
| Ministry of Agriculture (State Dept. of Crops) | Phytosanitary import permit | 7–14 days | ~KES 5,000–15,000 |
| Kenya Plant Health Inspectorate Service (KEPHIS) | Plant import permit, pest risk assessment | 7–21 days | ~KES 3,000–10,000 |
| Port Health Authority (Mombasa) | Health certificate verification at port | At arrival | ~KES 2,000–5,000 |
| KPA / Kenya Ports Authority | Berth allocation, port handling | At arrival | Based on tonnage |
| Registered Clearing Agent (CBA licensed) | Customs clearance, documentation | 1–5 days | ~$500–2,000 USD |

**Total Legitimate Import Taxes on 10,000 MT Rice:**

Rice (HS Code: 1006.30) imported from outside EAC:
- **Import Duty**: 75% of CIF value (EAC Common External Tariff for milled rice)
- **VAT**: 16% of (CIF + duty)
- **Railway Development Levy (RDL)**: 2% of CIF
- **Import Declaration Fee (IDF)**: 3.5% of CIF, minimum KES 10,000

**Example Cost Calculation:**
```
Assume CIF value: $3,500,000 (10,000 MT @ $350/MT from Asia)
Import Duty (75%): $2,625,000
RDL (2%):          $70,000
IDF (3.5%):        $122,500
VAT on (CIF+Duty): ~$993,600
─────────────────────────────
Total Tax Burden:  ~$3,811,100
Total landed cost: ~$7,311,100
```

**Tax Exemption Route (Legitimate):**

Kenya does have legitimate pathways to **reduced or zero duty** on rice:
1. **EAC origin goods** — If rice is grown/processed within EAC, it attracts 0% duty
2. **Government-to-Government (G2G) deals** — Some strategic food imports have been duty-deferred under food security frameworks
3. **EPZ/SEZ operations** — If you establish processing within a Special Economic Zone
4. **Gazette Notice application** — The *legal* process: submit a formal petition to the Cabinet Secretary for National Treasury, who can recommend the President gazette a specific exemption under the EAC Customs Management Act. This is a **public process** that requires: formal business case, stakeholder consultation, EAC partner state notification.

**MiroFish Simulation for this Use Case:**

```
Seed Material: 
"Kenya imports 1.2 million MT of rice annually. Local production covers 
only 10% of demand. The government is considering reducing import duty 
on rice from 75% to 25% to combat food inflation. Stakeholder groups 
include local rice farmers (Mwea, Ahero), large importers, small 
retailers, and urban consumers."

Prediction Questions:
1. "If the government reduces rice import duty from 75% to 25%, 
   simulate the market price impact, retailer response, and 
   consumer sentiment trajectory over 6 months."

2. "Simulate how local rice farmer cooperatives (Mwea Irrigation 
   Scheme) will organise politically to resist duty reductions, 
   and how effective their lobbying will be."

3. "If I enter the rice import market with 10,000 MT, simulate 
   the competitive response from established importers like 
   Bidco, Twiga Foods, and Jumbo Chem."
```

**The Contacts You Legitimately Need:**

```
1. KRA Customs & Border Control
   Contact: Commissioner of Customs & Border Control
   Physical: Times Tower, Nairobi
   Portal: i-Tax (itax.kra.go.ke)
   Purpose: Pre-arrival declaration, import duty assessment

2. KEBS Standards House
   Contact: Director General, KEBS
   Physical: Off Mombasa Road, Nairobi
   Website: kebs.org
   Purpose: Certificate of Conformity for food imports

3. KEPHIS
   Contact: Managing Director, KEPHIS
   Physical: Karura, Nairobi
   Website: kephis.org
   Purpose: Phytosanitary import permit (mandatory for rice)

4. Ministry of Agriculture
   State Department for Crops Development
   Contact: Principal Secretary
   Physical: Kilimo House, Cathedral Road, Nairobi

5. A Licensed Clearing & Forwarding Agent
   (Registered with Kenya Revenue Authority)
   Examples: Siginon Freight, Bollore Logistics, Panalpina
   Purpose: Handle all customs documentation at port

6. Kenya Ports Authority
   Contact: Managing Director
   Physical: Mombasa
   Purpose: Berth booking, port handling, storage

7. Kenya National Chamber of Commerce & Industry (KNCCI)
   Purpose: Trade facilitation, business networks, advocacy

8. East African Grain Council (EAGC)
   Purpose: Market intelligence, standards, regional networks
```

**Budget for a 10,000 MT Rice Import (Legitimate Business):**

```
Item                          Estimated Cost (USD)
─────────────────────────────────────────────────────
Rice procurement (CIF)            $3,500,000
Import duty (75% EAC CET)         $2,625,000
VAT (16%)                          ~$993,600
KRA levies (RDL + IDF)             ~$192,500
KEBS certification                   ~$2,000
KEPHIS permit                          ~$200
Port charges (KPA)                  ~$50,000
Clearing agent fees                  ~$10,000
Insurance (0.5% CIF)                ~$17,500
Inland transport to Nairobi         ~$80,000
Storage (3 months @ Nairobi)        ~$30,000
─────────────────────────────────────────────
TOTAL                           ~$7,500,800
─────────────────────────────────────────────
Retail value at KES 120/kg         ~$9,230,000
Gross margin (before operating)    ~$1,729,200
```

> ⚠️ **Note on Bribery/Corruption Requests**: I won't provide a breakdown of which officials to bribe, how much to pay, or how to route payments through unofficial channels. Beyond being illegal (Anti-Corruption and Economic Crimes Act, 2003 — penalties up to 10 years imprisonment), corruption increases your business risk exponentially: it creates criminal liability, gives third parties leverage over you, and undermines the very regulatory certainty you're trying to navigate. The contacts and legitimate processes above are the actual path to success.

---

### 8D. Trade Policy Simulations

```
Simulation: "Kenya-EU Economic Partnership Agreement impact"
Seed: EPA text, Kenya's export data, flower/tea/horticulture sector reports
Question: "Simulate how Kenyan flower exporters and tea SACCO members 
react to zero-tariff EU market access. What narrative dominates?"

Simulation: "AfCFTA rice trade flows"
Seed: African Continental Free Trade Area protocols, Kenya's rice import data
Question: "If Tanzania opens rice exports to Kenya under AfCFTA at zero duty, 
simulate how this disrupts the current import supply chain from Asia."
```

---

### 8E. Business & Market Intelligence

```
Simulation: "M-Pesa API pricing change impact"
Seed: Safaricom's M-Pesa transaction data, press releases, SME reactions
Question: "Safaricom raises M-Pesa business till charges by 30%. 
Simulate how Kenyan SMEs react — do they migrate to PesaLink, 
Airtel Money, or absorb costs?"

Simulation: "Nairobi tech startup fundraising environment 2025-2027"
Seed: Partech Africa report, i-Hub news, recent VC funding data
Question: "Given the current global VC contraction and Kenya's 
macroeconomic environment, simulate how early-stage startup 
funding sentiment evolves over 18 months."
```

---

### 8F. Public Health Policy

```
Simulation: "Sugar tax impact on Kenyan consumers"
Seed: WHO sugar tax studies, Kenya's sugar import data, urban diet surveys
Question: "The government proposes a 20% excise duty on sugary drinks. 
Simulate public health narrative shifts, industry lobbying, and 
consumer behaviour change."
```

---

### 8G. Infrastructure Project Sentiment

```
Simulation: "SGR Phase 2 (Naivasha-Kisumu) decision"
Seed: SGR Phase 1 performance data, debt analysis, public opinion surveys
Question: "The government announces SGR Phase 2 will be paused for 5 years 
to restructure China Exim Bank debt. Simulate the political and 
business community reaction in Western Kenya."
```

---

## 9. Document Preparation Templates

### 9A. Election Strategy Briefing (Post-Simulation)

```markdown
# KENYA 2027 ELECTION INTELLIGENCE BRIEF
Prepared by: [Your Name] using MiroFish Swarm Intelligence Engine
Date: [Date]
Simulation Parameters: [X agents, Y rounds, Z seed documents]

## Executive Summary
[2-3 sentences from ReportAgent synthesis]

## Simulated Vote Share Distribution
| Candidate/Coalition | Central | Rift Valley | Nyanza | Coast | NEP |
|---------------------|---------|-------------|--------|-------|-----|
| [Party A]           |         |             |        |       |     |
| [Party B]           |         |             |        |       |     |

## Key Narrative Drivers
1. [Top emergent narrative from simulation]
2. [Second narrative]
3. [Third narrative]

## Risk Scenarios
- Scenario A (High probability): [Description]
- Scenario B (Medium probability): [Description]
- Scenario C (Low probability / Black Swan): [Description]

## Strategic Recommendations
[Based on simulation outputs]

## Data Sources Used
[List all seed materials]

## Simulation Limitations
[Note: probabilistic model, not a guarantee]
```

### 9B. Import Business Case Document

```markdown
# RICE IMPORT BUSINESS CASE
10,000 MT Commercial Rice Import — Kenya Market Entry

## 1. Market Opportunity Analysis
## 2. Regulatory Compliance Checklist
   - [ ] KRA Import Declaration (iDeclare)
   - [ ] KEBS Certificate of Conformity
   - [ ] KEPHIS Phytosanitary Permit
   - [ ] Ministry of Agriculture Import Permit
   - [ ] Clearing Agent appointed
   - [ ] KPA berth booking

## 3. Financial Model (see Section 8C cost table)
## 4. Supply Chain Map
## 5. Risk Register (include MiroFish simulation outputs)
## 6. Timeline (see roadmap below)
```

---

## 10. Simulation Workflow Nodes Roadmap

```
START
  │
  ▼
[NODE 1: SEED COLLECTION]
  │  ├── News articles (Standard, Nation, Business Daily)
  │  ├── PDF reports (KNBS, CBK, World Bank Kenya)
  │  ├── Social media summaries
  │  └── Policy documents (Kenya Gazette)
  │
  ▼
[NODE 2: GRAPH BUILD]
  │  ├── Entity extraction (people, organisations, places)
  │  ├── Relationship mapping
  │  └── Knowledge graph creation via GraphRAG
  │
  ▼
[NODE 3: AGENT CONFIGURATION]
  │  ├── Define agent count (start: 50–100 for testing)
  │  ├── Set simulation rounds (<40 for cost control)
  │  ├── Persona diversity settings
  │  └── Memory injection via Zep Cloud
  │
  ▼
[NODE 4: SIMULATION RUN]
  │  ├── OASIS engine: Twitter-like platform
  │  ├── OASIS engine: Reddit-like platform
  │  ├── Monitor: opinion clusters forming
  │  ├── Inject variables (optional mid-run)
  │  └── Track: narrative spread, polarisation, herd effects
  │
  ▼
[NODE 5: REPORT GENERATION]
  │  ├── ReportAgent analyses post-simulation environment
  │  ├── Identifies dominant narratives
  │  ├── Maps coalition formations
  │  └── Generates structured prediction report
  │
  ▼
[NODE 6: DEEP INTERACTION]
  │  ├── Query individual agents ("What do you think about X?")
  │  ├── Ask ReportAgent follow-up questions
  │  ├── Run counterfactual: inject new variable, re-simulate
  │  └── Export report as PDF/MD
  │
  ▼
[NODE 7: VALIDATION & MONITORING]
  │  ├── Cross-reference with real-world data
  │  ├── Track prediction accuracy over time
  │  ├── Build your accuracy log for portfolio
  │  └── Refine seed materials and rerun
  │
  ▼
[OUTPUT: DELIVERABLES]
     ├── Written prediction report
     ├── Strategy briefing document
     ├── Risk register
     └── Portfolio case study
```

---

## 11. Monitoring & Logging

### On RunPod

```bash
# View live logs
npm run dev 2>&1 | tee mirofish.log

# Monitor GPU usage
nvidia-smi -l 1

# Check Ollama model serving
ollama ps

# Monitor system resources
htop
```

### On Railway

```bash
# Tail live logs
railway logs --tail

# Check deployment status
railway status
```

### Simulation Monitoring Checklist

- [ ] Set up a Google Sheet to log: simulation date, seed material, prediction question, agent count, rounds, key findings
- [ ] Screenshot the knowledge graph visualisation for each run
- [ ] Export and save each ReportAgent output
- [ ] Track against real-world outcomes to build accuracy data
- [ ] Note which LLM model produced the best results for your use cases

---

## 12. Add MiroFish to Your Portfolio

### Option A — Portfolio Case Study Page

Create a dedicated page in your portfolio with this structure:

```
PORTFOLIO ENTRY: "MiroFish Deployment & Kenya Political Intelligence Research"

HEADLINE:
"Deployed a 1M-agent swarm intelligence engine to simulate Kenyan 
political and economic outcomes — turning real-world news into 
structured prediction reports."

TECH STACK:
MiroFish (OASIS/CAMEL-AI) · Python/FastAPI · Vue.js · GraphRAG · 
Zep Cloud · Docker · Railway/RunPod · OpenAI API

WHAT I DID:
• Self-hosted MiroFish on RunPod GPU infrastructure with Ollama backend
• Designed Kenya-specific seed datasets: election polls, KNBS data, 
  policy documents
• Ran 12+ simulations across political, trade, and market scenarios
• Built a prediction accuracy tracking system

SIMULATIONS CONDUCTED:
• 2027 Kenya Election coalition dynamics (500 agents, 35 rounds)
• Rice import market disruption analysis (200 agents, 30 rounds)  
• Ruto impeachment probability modelling (300 agents, 40 rounds)
• M-Pesa fee change SME impact (150 agents, 25 rounds)

KEY FINDINGS:
[Insert your actual simulation outputs here — this is your differentiator]

ACCURACY LOG:
[Track predictions vs reality over time — this becomes priceless data]

LINKS:
• GitHub: [your fork with Kenya-specific seed datasets]
• Live Demo: [your Railway deployment URL]
• Sample Report: [link to exported PDF report]
```

### Option B — GitHub README That Stands Out

In your fork of MiroFish, write a README titled:

```
# MiroFish-Kenya: Swarm Intelligence for East African Political & Economic Research
```

Include:
- Your seed dataset collection (scraped Kenyan news, KNBS PDFs)
- Kenya-specific setup notes
- Screenshots of your simulation outputs
- Your accuracy log

### Option C — A Short Blog Post or Thread

Write a thread/article: *"I ran 500 AI agents through Kenya's 2027 election and here's what emerged..."*

This positions you as someone applying cutting-edge AI to locally relevant, high-stakes problems — a rare combination that stands out globally.

### Portfolio Framing Statement

> *"Most people use AI to generate text. I use it to simulate societies. By deploying MiroFish — a swarm intelligence engine powering thousands of autonomous AI agents — I research political, economic, and market dynamics specific to East Africa. This is AI as a strategic intelligence tool, not a chatbot."*

---

## 13. Limitations & Ethical Notes

**Technical Limitations:**
- Results vary between runs — two identical simulations won't produce identical outputs (this is philosophically coherent but means you need multiple runs)
- Agent behaviour is sensitive to LLM model choice and initial conditions
- The system can exhibit herd effects and echo chambers — agents can polarise faster than real humans
- This is a v0.1 product — powerful, but not production-enterprise ready

**What MiroFish Is Good For:**
- Scenario exploration and strategy planning
- Understanding possible narrative trajectories
- Stress-testing decisions before committing
- Research and intelligence gathering

**What It's Not:**
- A crystal ball with guaranteed accuracy
- A replacement for domain expertise
- A tool for producing disinformation (manipulating real platforms)

**On the Ethics of Political Simulation:**
Modelling election outcomes for research, strategic planning, or journalism is legitimate. Using simulation outputs to systematically manipulate real public opinion, deceive voters, or suppress turnout is not. Use this as intelligence, not as a weapon.

---

## 14. Cost Estimates

### Scenario: 3 months of active Kenya research

| Item | Option A (Cheap) | Option B (Balanced) | Option C (Power) |
|------|-----------------|---------------------|-----------------|
| LLM API | Qwen-Plus ~$30 | GPT-4o-mini ~$80 | GPT-4o ~$300 |
| Zep Cloud | Free | Free | Free |
| Deployment | Railway Hobby $15 | Railway Pro $60 | RunPod RTX4090 ~$150 |
| **Total** | **~$45/month** | **~$140/month** | **~$450/month** |

**For just testing and portfolio work**: Start with Option A ($45/month). The Qwen-Plus model is surprisingly strong and is MiroFish's own recommendation.

---

## Resources

| Resource | URL |
|----------|-----|
| MiroFish GitHub | https://github.com/666ghj/MiroFish |
| English Fork | https://github.com/bigmansablo/MiroFish-EN |
| Official Docs (DeepWiki) | https://deepwiki.com/666ghj/MiroFish |
| Live Demo | https://mirofish.homes/ |
| Zep Cloud | https://app.getzep.com/ |
| Railway | https://railway.app |
| RunPod | https://runpod.io |
| OASIS (CAMEL-AI) | https://github.com/camel-ai/oasis |
| KNBS Data Portal | https://www.knbs.or.ke/ |
| Kenya Gazette | https://kenyalaw.org/kenya_gazette/ |
| KRA iTax | https://itax.kra.go.ke |
| KEPHIS | https://www.kephis.org |
| KEBS | https://www.kebs.org |

---

*Generated with web research — MiroFish v0.1.0, March 2026*
*GitHub stars: 32,300+ | Forks: 4,100+ | Investment: $4M (Shanda Group)*
