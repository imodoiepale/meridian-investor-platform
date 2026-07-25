from flask import Blueprint, request, jsonify
import uuid
import threading
import os
from datetime import datetime
from backend.research_agent.claude_researcher import research_agent
from backend.vector_db.qdrant_client import vector_db

ki_bp = Blueprint('kenya_invest', __name__, url_prefix='/api/invest')

# In-memory simulation store (use Redis in production)
simulations = {}

@ki_bp.route('/research', methods=['POST'])
def run_research():
    """
    Trigger Research Agent. Returns complete seed pack.
    Cache-first: checks vector DB before calling Perplexity.
    """
    data = request.json
    
    required = ['sector', 'nationality', 'capital_usd', 'county']
    if not all(k in data for k in required):
        return jsonify({"error": f"Required: {required}"}), 400
    
    seed_pack_id = str(uuid.uuid4())
    
    try:
        seed_pack = research_agent.research(
            sector=data['sector'],
            nationality=data['nationality'],
            capital_usd=float(data['capital_usd']),
            county=data['county']
        )
        
        return jsonify({
            "seed_pack_id": seed_pack_id,
            "status": "ready",
            "seed": seed_pack,
            "generated_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e), "seed_pack_id": seed_pack_id}), 500


@ki_bp.route('/read-passport', methods=['POST'])
def read_passport():
    """Read passport image using MiMo-V2-Omni (Healer Alpha)."""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    f = request.files['file']
    tmp_path = f"/tmp/{uuid.uuid4()}.jpg"
    f.save(tmp_path)
    
    try:
        result = research_agent.read_passport(tmp_path)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        import os
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@ki_bp.route('/simulate', methods=['POST'])
def start_simulation():
    """
    Start a MiroFish simulation using a seed pack.
    Runs async — poll /simulate/:id/status for progress.
    """
    data = request.json
    
    if 'seed' not in data and 'seed_pack_id' not in data:
        return jsonify({"error": "Provide seed or seed_pack_id"}), 400
    
    sim_id = str(uuid.uuid4())
    simulations[sim_id] = {
        "status": "queued",
        "created_at": datetime.now().isoformat(),
        "config": data
    }
    
    # Run simulation in background thread
    thread = threading.Thread(
        target=_run_simulation_async,
        args=(sim_id, data),
        daemon=True
    )
    thread.start()
    
    return jsonify({
        "simulation_id": sim_id,
        "status": "running",
        "estimated_minutes": 12,
        "poll_url": f"/api/invest/simulate/{sim_id}/status"
    })


@ki_bp.route('/simulate/<sim_id>/status', methods=['GET'])
def simulation_status(sim_id):
    sim = simulations.get(sim_id)
    if not sim:
        return jsonify({"error": "Not found"}), 404
    return jsonify(sim)


@ki_bp.route('/simulate/<sim_id>/report', methods=['GET'])
def simulation_report(sim_id):
    sim = simulations.get(sim_id)
    if not sim:
        return jsonify({"error": "Not found"}), 404
    if sim['status'] != 'complete':
        return jsonify({"error": "Simulation not complete", "status": sim['status']}), 202
    return jsonify(sim.get('report', {}))


@ki_bp.route('/cache/stats', methods=['GET'])
def cache_stats():
    """Show vector DB cache coverage and freshness."""
    return jsonify(vector_db.get_cache_stats())


@ki_bp.route('/cache/invalidate', methods=['POST'])
def invalidate_cache():
    """Force-expire cache for a sector/county combination."""
    data = request.json
    for collection in ['fee_schedules', 'sla_benchmarks', 'regulations', 'risk_scores']:
        vector_db.invalidate(
            sector=data.get('sector', ''),
            county=data.get('county', ''),
            nationality=data.get('nationality', ''),
            collection=collection
        )
    return jsonify({"status": "invalidated"})


@ki_bp.route('/realtime-token', methods=['POST'])
def get_realtime_token():
    """
    Create an ephemeral OpenAI Realtime session token.
    Frontend uses this for WebRTC voice connection — key never exposed to browser.
    """
    import openai
    try:
        client = openai.OpenAI(api_key=os.getenv('EMBEDDING_API_KEY'))
        session = client.beta.realtime.sessions.create(
            model='gpt-4o-realtime-preview-2024-12-17',
            voice='alloy',
            instructions=(
                'You are a friendly Kenya investment advisor named Kesi. '
                'Your job is to collect 4 pieces of information from this investor in a natural conversation. '
                'You already have their passport data. Ask in this order: '
                '1) What sector/industry do they want to invest in (manufacturing, fintech, agriculture, healthcare, ict, real_estate, tourism, energy, logistics, retail) '
                '2) How much capital in USD are they planning to invest '
                '3) Which county in Kenya (default Nairobi if unsure) '
                '4) Will they relocate to Kenya or manage remotely '
                'Keep it conversational and brief. After collecting all 4 answers, '
                'say exactly: "Perfect, let me now start the research" then output a JSON block like: '
                '{"sector":"fintech","capital_usd":500000,"county":"Nairobi","will_reside":true}'
            ),
            input_audio_transcription={'model': 'whisper-1'},
            turn_detection={'type': 'server_vad'}
        )
        return jsonify({'client_secret': session.client_secret.value})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ki_bp.route('/session/save', methods=['POST'])
def save_session():
    """
    Save investor session data to Zep Cloud memory.
    Call this after passport read + voice/form completion + research.
    """
    data = request.json
    zep_key = os.getenv('ZEP_API_KEY')
    if not zep_key or zep_key.startswith('PASTE'):
        return jsonify({'status': 'skipped', 'reason': 'ZEP_API_KEY not configured'}), 200

    try:
        from zep_cloud.client import Zep

        zep = Zep(api_key=zep_key)
        session_id = data.get('session_id', str(uuid.uuid4()))
        user_id = data.get('user_id', session_id)

        # Ensure user exists in Zep (v3 API)
        try:
            zep.user.get(user_id)
        except Exception:
            zep.user.add(user_id=user_id)

        # Build a text summary and add to the user's knowledge graph
        parts = []
        passport = data.get('passport', {})
        if passport:
            parts.append(
                f"Investor: {passport.get('full_name', 'Unknown')} | "
                f"Nationality: {passport.get('nationality', 'Unknown')} | "
                f"Document: {passport.get('document_type', 'passport')} | "
                f"Expires: {passport.get('expiry_date', '')}"
            )

        form = data.get('form', {})
        if form:
            parts.append(
                f"Investment intent: sector={form.get('sector')}, "
                f"capital=USD {form.get('capital_usd')}, "
                f"county={form.get('county')}, relocate={form.get('will_reside')}"
            )

        seed = data.get('seed_pack', {})
        if seed:
            meta = seed.get('seed_meta', {})
            rmap = seed.get('regulatory_map', {})
            confidence = meta.get('confidence_score', 0)
            parts.append(
                f"Research result: estimated {rmap.get('estimated_total_days', '?')} days, "
                f"{len(rmap.get('required_agencies', []))} agencies required, "
                f"confidence {confidence:.0%}. Session: {session_id}."
            )

        if parts:
            zep.graph.add(user_id=user_id, data='\n'.join(parts), type='text')

        return jsonify({'status': 'saved', 'session_id': session_id, 'user_id': user_id})

    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@ki_bp.route('/roadmap', methods=['POST'])
def build_roadmap():
    """
    Build a structured 5-phase Kenya regulatory roadmap.
    Merges static base phases with dynamic sector agencies from seed_pack
    and risk flags from sim_report (if provided).
    """
    data = request.json or {}
    seed_pack = data.get('seed_pack', {})
    sim_report = data.get('sim_report', {})

    # Extract dynamic data from seed_pack
    rmap = seed_pack.get('regulatory_map', {})
    fee_schedule = seed_pack.get('fee_schedule', {})
    bottleneck = seed_pack.get('bottleneck_forecast', {})

    # Build risk flag set from simulation bottlenecks
    risk_agencies = set()
    for b in (sim_report.get('bottlenecks') or []):
        risk_agencies.add(b.get('agency', '').lower())

    # ── Static base phases ──────────────────────────────────────────────────
    base_phases = [
        {
            "phase": 1,
            "name": "Pre-Registration",
            "icon": "📋",
            "estimated_days": 5,
            "nodes": [
                {
                    "id": "BRS_NAME_SEARCH",
                    "name": "Business Name Search",
                    "agency": "Business Registration Service",
                    "agency_short": "BRS",
                    "cost_kes": 150,
                    "timeline_days": 1,
                    "critical_path": True,
                    "documents": ["Proposed company names (3 options)", "ID copy of director"],
                    "tip": "Search 3 alternative names in case your first choice is taken.",
                    "prerequisites": []
                },
                {
                    "id": "BRS_NAME_RESERVE",
                    "name": "Name Reservation",
                    "agency": "Business Registration Service",
                    "agency_short": "BRS",
                    "cost_kes": 2050,
                    "timeline_days": 2,
                    "critical_path": True,
                    "documents": ["Approved name search result", "CR1 form"],
                    "tip": "Name reservation is valid for 30 days — proceed quickly.",
                    "prerequisites": ["BRS_NAME_SEARCH"]
                }
            ]
        },
        {
            "phase": 2,
            "name": "Company Registration",
            "icon": "🏢",
            "estimated_days": 5,
            "nodes": [
                {
                    "id": "BRS_CR1",
                    "name": "Certificate of Incorporation (CR1)",
                    "agency": "Business Registration Service",
                    "agency_short": "BRS",
                    "cost_kes": 10950,
                    "timeline_days": 3,
                    "critical_path": True,
                    "documents": [
                        "CR1 form (Memorandum & Articles)",
                        "CR2 form (Statement of Nominal Capital)",
                        "CR8 form (Particulars of Directors)",
                        "Passport copies of all directors",
                        "Name reservation certificate"
                    ],
                    "tip": "Foreign directors need notarised passport copies. Use eCitizen for faster processing.",
                    "prerequisites": ["BRS_NAME_RESERVE"]
                },
                {
                    "id": "BRS_SEAL",
                    "name": "Company Seal & Statutory Books",
                    "agency": "Private Vendor",
                    "agency_short": "Vendor",
                    "cost_kes": 4000,
                    "timeline_days": 2,
                    "critical_path": False,
                    "documents": ["Certificate of Incorporation"],
                    "tip": "Order online — delivered in 1–2 days.",
                    "prerequisites": ["BRS_CR1"]
                }
            ]
        },
        {
            "phase": 3,
            "name": "Tax & Statutory Compliance",
            "icon": "🧾",
            "estimated_days": 7,
            "nodes": [
                {
                    "id": "KRA_PIN",
                    "name": "Company KRA PIN",
                    "agency": "Kenya Revenue Authority",
                    "agency_short": "KRA",
                    "cost_kes": 0,
                    "timeline_days": 1,
                    "critical_path": True,
                    "documents": ["Certificate of Incorporation", "Director KRA PIN", "CR12 form"],
                    "tip": "Apply via iTax — instant if documents are in order.",
                    "prerequisites": ["BRS_CR1"]
                },
                {
                    "id": "KRA_VAT",
                    "name": "VAT Registration",
                    "agency": "Kenya Revenue Authority",
                    "agency_short": "KRA",
                    "cost_kes": 0,
                    "timeline_days": 3,
                    "critical_path": False,
                    "documents": ["Company KRA PIN", "Bank account details", "Business premises lease"],
                    "tip": "Required if turnover exceeds KES 5M/year. Register early for input VAT claims.",
                    "prerequisites": ["KRA_PIN"]
                },
                {
                    "id": "NSSF",
                    "name": "NSSF Registration (Employer)",
                    "agency": "National Social Security Fund",
                    "agency_short": "NSSF",
                    "cost_kes": 0,
                    "timeline_days": 1,
                    "critical_path": False,
                    "documents": ["KRA PIN certificate", "Certificate of Incorporation"],
                    "tip": "Mandatory for all employers. Register online via NSSF self-service portal.",
                    "prerequisites": ["KRA_PIN"]
                },
                {
                    "id": "NHIF",
                    "name": "NHIF Registration (Employer)",
                    "agency": "National Hospital Insurance Fund",
                    "agency_short": "NHIF",
                    "cost_kes": 0,
                    "timeline_days": 1,
                    "critical_path": False,
                    "documents": ["KRA PIN certificate", "NSSF registration"],
                    "tip": "Do NSSF and NHIF on the same day — same documents required.",
                    "prerequisites": ["NSSF"]
                }
            ]
        },
        {
            "phase": 4,
            "name": "Sector-Specific Licenses",
            "icon": "📜",
            "estimated_days": rmap.get('estimated_total_days', 60),
            "nodes": [],
            "dynamic": True
        },
        {
            "phase": 5,
            "name": "County & Operational Permits",
            "icon": "🏙️",
            "estimated_days": 14,
            "nodes": [
                {
                    "id": "COUNTY_BPERMIT",
                    "name": "Single Business Permit",
                    "agency": "County Government",
                    "agency_short": "County",
                    "cost_kes": 15000,
                    "timeline_days": 7,
                    "critical_path": True,
                    "documents": [
                        "Certificate of Incorporation",
                        "KRA PIN certificate",
                        "Lease agreement for premises",
                        "Fire safety certificate"
                    ],
                    "tip": "Cost varies by county (KES 5K–50K). Nairobi is highest. Apply before commencing operations.",
                    "prerequisites": ["KRA_PIN"]
                },
                {
                    "id": "COUNTY_FIRE",
                    "name": "Fire Safety Certificate",
                    "agency": "County Fire Department",
                    "agency_short": "Fire Dept",
                    "cost_kes": 5000,
                    "timeline_days": 7,
                    "critical_path": False,
                    "documents": ["Premises lease", "Building plans", "Fire extinguisher receipts"],
                    "tip": "Schedule inspection early — backlog can add 2–3 weeks.",
                    "prerequisites": ["BRS_CR1"]
                }
            ]
        }
    ]

    # ── Inject dynamic sector agencies into Phase 4 ────────────────────────
    agency_risk_map = {}
    for b in (sim_report.get('bottlenecks') or []):
        agency_risk_map[b.get('agency', '').lower()] = b

    required_agencies = rmap.get('required_agencies', [])
    for i, agency_name in enumerate(required_agencies):
        agency_key = agency_name.lower().replace(' ', '_')
        fee_data = fee_schedule.get(agency_key, fee_schedule.get(agency_name, {}))
        risk_b = agency_risk_map.get(agency_name.lower(), None)

        node = {
            "id": f"SECTOR_{i+1:02d}",
            "name": agency_name + " License/Permit",
            "agency": agency_name,
            "agency_short": agency_name.split()[0],
            "cost_kes": fee_data.get('official_fee_kes', 0),
            "timeline_days": fee_data.get('timeline_days', 30),
            "critical_path": i == 0,
            "documents": fee_data.get('required_documents', ["Application form", "Certificate of Incorporation", "KRA PIN"]),
            "tip": fee_data.get('tip', f"Contact {agency_name} directly for current requirements."),
            "prerequisites": ["KRA_PIN"] if i == 0 else [f"SECTOR_{i:02d}"],
            "risk": risk_b is not None,
            "risk_detail": risk_b.get('recommendation', '') if risk_b else ''
        }
        base_phases[3]["nodes"].append(node)

    # ── Compute totals ──────────────────────────────────────────────────────
    total_days = sum(p["estimated_days"] for p in base_phases)
    total_cost = sum(
        n.get("cost_kes", 0)
        for p in base_phases
        for n in p.get("nodes", [])
    )

    return jsonify({
        "phases": base_phases,
        "summary": {
            "total_days": total_days,
            "total_cost_kes": total_cost,
            "dropout_risk_pct": bottleneck.get('abandonment_risk_pct', 0),
            "confidence": seed_pack.get('seed_meta', {}).get('confidence_score', 0.85),
            "agencies_count": len(required_agencies),
            "critical_path_nodes": [
                n["id"]
                for p in base_phases
                for n in p.get("nodes", [])
                if n.get("critical_path")
            ]
        }
    })


def _run_simulation_async(sim_id: str, config: dict):
    """Background simulation runner (hooks into MiroFish OASIS engine)."""
    import time
    
    simulations[sim_id]['status'] = 'running'
    simulations[sim_id]['started_at'] = datetime.now().isoformat()
    
    try:
        # TODO: Hook into OASIS engine with typed Kenya agents
        # For now: return a structured mock report
        time.sleep(5)  # Simulate processing time
        
        seed = config.get('seed', {})
        bottleneck_forecast = seed.get('bottleneck_forecast', {})
        
        simulations[sim_id].update({
            "status": "complete",
            "completed_at": datetime.now().isoformat(),
            "report": {
                "journey_summary": {
                    "simulated_days_median": 105,
                    "simulated_days_p90": 148,
                    "vs_sla_benchmark_days": 90,
                    "overage_days": 15,
                    "total_cost_kes_estimated": 680000
                },
                "bottlenecks": [
                    {
                        "agency": "Immigration",
                        "avg_delay_weeks": 10.2,
                        "sla_weeks": 4,
                        "root_cause": "work_permit_queue_overflow",
                        "recommendation": "Deploy dedicated Immigration facilitator, pre-verify all documents"
                    },
                    {
                        "agency": "NEMA",
                        "avg_delay_days": 145,
                        "sla_days": 90,
                        "root_cause": "eia_review_understaffing",
                        "recommendation": "Engage NEMA consultant 60 days before submission"
                    }
                ],
                "abandonment_risk": {
                    "probability": bottleneck_forecast.get('abandonment_risk_pct', 28) / 100,
                    "trigger_stage": bottleneck_forecast.get('abandonment_trigger_stage', 'NEMA_EIA_delay'),
                    "trigger_day": bottleneck_forecast.get('abandonment_trigger_day', 75)
                },
                "corruption_flags": [
                    {
                        "agency": "Immigration",
                        "pattern": "extra_documents_beyond_requirements",
                        "frequency_pct": 34,
                        "audit_recommendation": "Track all document requests vs official list"
                    },
                    {
                        "agency": "Nairobi_County",
                        "pattern": "fee_amount_mismatch",
                        "frequency_pct": 18,
                        "audit_recommendation": "Cross-check all fee amounts against official schedule"
                    }
                ],
                "platform_recommendations": [
                    "Add NEMA fast-track documentation pack to reduce prep time by 30 days",
                    "Deploy Mandarin-speaking Immigration facilitator for Chinese manufacturing investors",
                    "Pre-fill work permit Form 17 template with employer justification letter"
                ],
                "simulation_metadata": {
                    "simulation_id": sim_id,
                    "agents_used": config.get('agent_count', 200),
                    "rounds_run": config.get('rounds', 40),
                    "model": "mirofish-kenya-invest-v1"
                }
            }
        })
        
    except Exception as e:
        simulations[sim_id].update({
            "status": "error",
            "error": str(e),
            "failed_at": datetime.now().isoformat()
        })
