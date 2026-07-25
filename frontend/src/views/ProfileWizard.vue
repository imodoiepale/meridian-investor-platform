<template>
  <div class="wizard-page">
    <!-- Translucent header -->
    <header class="wizard-header">
      <div class="header-brand">
        <span class="brand-mark">◈</span> MERIDIAN
      </div>
      <span class="header-subtitle">Investor Profile Setup</span>
    </header>

    <div class="wizard-body">
      <!-- Progress bar -->
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
      </div>

      <!-- Step indicator chips -->
      <div class="step-chips">
        <div
          v-for="n in 5"
          :key="n"
          class="step-chip"
          :class="chipClass(n)"
          @click="n < currentStep && goToStep(n)"
          :title="stepTitles[n - 1]"
        >
          <span v-if="n < currentStep">✓</span>
          <span v-else>{{ n }}</span>
        </div>
      </div>

      <!-- Step title -->
      <div class="step-heading">
        <h2 class="step-title">{{ stepTitles[currentStep - 1] }}</h2>
        <p class="step-subtitle">{{ stepSubtitles[currentStep - 1] }}</p>
      </div>

      <!-- Research banner (step 2) -->
      <div v-if="researchBanner" class="research-banner" :class="{ done: researchDone }">
        <span v-if="!researchDone">
          <span class="banner-spinner"></span>
          Researching {{ form.sector }} opportunities in {{ form.county }}…
        </span>
        <span v-else>{{ researchSummary }}</span>
      </div>

      <!-- ── Step 1: Identity ── -->
      <form v-if="currentStep === 1" class="step-form" @submit.prevent="nextStep">
        <div class="field-grid">
          <div class="field-group full">
            <label class="field-label">Full Name *</label>
            <input v-model="form.full_name" class="field-input" type="text" placeholder="As shown on passport" required />
          </div>
          <div class="field-group">
            <label class="field-label">Nationality *</label>
            <input v-model="form.nationality" class="field-input" type="text" placeholder="e.g. American" required />
          </div>
          <div class="field-group">
            <label class="field-label">Email *</label>
            <input v-model="form.email" class="field-input" type="email" placeholder="your@email.com" required />
          </div>
          <div class="field-group">
            <label class="field-label">Phone</label>
            <input v-model="form.phone" class="field-input" type="tel" placeholder="+1 555 000 0000" />
          </div>
          <div class="field-group">
            <label class="field-label">Date of Birth</label>
            <input v-model="form.dob" class="field-input" type="date" />
          </div>
          <div class="field-group">
            <label class="field-label">Gender</label>
            <select v-model="form.gender" class="field-input field-select">
              <option value="">Select…</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other / Prefer not to say</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Country of Birth</label>
            <input v-model="form.countryOfBirth" class="field-input" type="text" placeholder="Country" />
          </div>
          <div class="field-group">
            <label class="field-label">Passport Number</label>
            <input v-model="form.passportNo" class="field-input" type="text" placeholder="A12345678" />
          </div>
          <div class="field-group">
            <label class="field-label">Passport Issue Date</label>
            <input v-model="form.passportIssueDate" class="field-input" type="date" />
          </div>
          <div class="field-group">
            <label class="field-label">Passport Expiry Date</label>
            <input v-model="form.passportExpiryDate" class="field-input" type="date" />
          </div>
          <div class="field-group full">
            <label class="field-label">Place of Issue</label>
            <input v-model="form.placeOfIssue" class="field-input" type="text" placeholder="City, Country" />
          </div>
        </div>
      </form>

      <!-- ── Step 2: Business Intent ── -->
      <form v-if="currentStep === 2" class="step-form" @submit.prevent="nextStep">
        <div class="field-grid">
          <div class="field-group">
            <label class="field-label">Sector *</label>
            <select v-model="form.sector" class="field-input field-select" required @change="onSectorCountyChange">
              <option value="">Select sector…</option>
              <option value="agritech">Agritech</option>
              <option value="fintech">Fintech</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="tourism">Tourism</option>
              <option value="healthcare">Healthcare</option>
              <option value="retail">Retail</option>
              <option value="construction">Construction</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Target County *</label>
            <select v-model="form.county" class="field-input field-select" required @change="onSectorCountyChange">
              <option value="">Select county…</option>
              <option value="Nairobi">Nairobi</option>
              <option value="Mombasa">Mombasa</option>
              <option value="Kiambu">Kiambu</option>
              <option value="Nakuru">Nakuru</option>
              <option value="Machakos">Machakos</option>
              <option value="Kisumu">Kisumu</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Investment Capital (USD) *</label>
            <input v-model.number="form.capital_usd" class="field-input" type="number" min="1000" step="1000" placeholder="e.g. 250000" required />
          </div>
          <div class="field-group">
            <label class="field-label">Company Name (optional)</label>
            <input v-model="form.company_name" class="field-input" type="text" placeholder="Leave blank if not yet decided" />
          </div>
          <div class="field-group full">
            <label class="field-label">Investment Timeline *</label>
            <select v-model="form.timeline" class="field-input field-select" required>
              <option value="">Select timeline…</option>
              <option value="0-3months">0 – 3 months</option>
              <option value="3-6months">3 – 6 months</option>
              <option value="6-12months">6 – 12 months</option>
              <option value="1year+">1 year +</option>
            </select>
          </div>
        </div>
      </form>

      <!-- ── Step 3: Kenya Address ── -->
      <form v-if="currentStep === 3" class="step-form" @submit.prevent="nextStep">
        <p class="step-note">These fields can be filled later — leave blank if unknown.</p>
        <div class="field-grid">
          <div class="field-group full">
            <label class="field-label">Postal Address</label>
            <input v-model="form.postalAddress" class="field-input" type="text" placeholder="P.O. Box …" />
          </div>
          <div class="field-group">
            <label class="field-label">Postal Code</label>
            <input v-model="form.postalCode" class="field-input" type="text" placeholder="00100" />
          </div>
          <div class="field-group">
            <label class="field-label">City *</label>
            <input v-model="form.city" class="field-input" type="text" placeholder="Nairobi" required />
          </div>
          <div class="field-group">
            <label class="field-label">Sub-county</label>
            <input v-model="form.subcounty" class="field-input" type="text" placeholder="Westlands" />
          </div>
          <div class="field-group">
            <label class="field-label">Location</label>
            <input v-model="form.location" class="field-input" type="text" placeholder="Industrial Area" />
          </div>
          <div class="field-group">
            <label class="field-label">Road</label>
            <input v-model="form.road" class="field-input" type="text" placeholder="Haile Selassie Ave" />
          </div>
          <div class="field-group">
            <label class="field-label">Plot No.</label>
            <input v-model="form.plotNo" class="field-input" type="text" placeholder="LR/123/456" />
          </div>
          <div class="field-group">
            <label class="field-label">Nearest Landmark</label>
            <input v-model="form.nearestLandmark" class="field-input" type="text" placeholder="Opposite Kenyatta Hospital" />
          </div>
        </div>
      </form>

      <!-- ── Step 4: Background ── -->
      <form v-if="currentStep === 4" class="step-form" @submit.prevent="nextStep">
        <div class="field-grid">
          <div class="field-group">
            <label class="field-label">Immigration Status</label>
            <select v-model="form.immigrationStatus" class="field-input field-select">
              <option value="">Select…</option>
              <option value="visitor">Visitor / Tourist</option>
              <option value="resident">Resident Permit holder</option>
              <option value="none">None / Not yet in Kenya</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Current Employer (optional)</label>
            <input v-model="form.employerName" class="field-input" type="text" placeholder="Current or last employer" />
          </div>
          <div class="field-group">
            <label class="field-label">Education Level</label>
            <select v-model="form.educationLevel" class="field-input field-select">
              <option value="">Select…</option>
              <option value="high_school">High School / A-Levels</option>
              <option value="diploma">Diploma / Associate</option>
              <option value="bachelors">Bachelor's Degree</option>
              <option value="masters">Master's Degree</option>
              <option value="phd">PhD / Doctorate</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Profession</label>
            <input v-model="form.profession" class="field-input" type="text" placeholder="e.g. Software Engineer, Trader" />
          </div>
          <div class="field-group">
            <label class="field-label">Spouse Name (optional)</label>
            <input v-model="form.spouseName" class="field-input" type="text" placeholder="If applicable" />
          </div>
          <div class="field-group full">
            <label class="field-label">Existing Company in Kenya?</label>
            <div class="toggle-row">
              <button
                type="button"
                class="toggle-btn"
                :class="{ active: form.hasCompanyInKenya }"
                @click="form.hasCompanyInKenya = !form.hasCompanyInKenya"
              >
                {{ form.hasCompanyInKenya ? 'Yes' : 'No' }}
              </button>
              <span class="toggle-desc">{{ form.hasCompanyInKenya ? 'I already have a registered company in Kenya' : 'I do not yet have a company in Kenya' }}</span>
            </div>
          </div>
        </div>
      </form>

      <!-- ── Step 5: Review ── -->
      <div v-if="currentStep === 5" class="step-form">
        <div class="review-grid">
          <div v-for="section in reviewSections" :key="section.title" class="review-section">
            <h3 class="review-section-title">{{ section.title }}</h3>
            <div v-for="field in section.fields" :key="field.key" class="review-row">
              <span class="review-key">{{ field.label }}</span>
              <span class="review-val">{{ displayVal(form[field.key]) }}</span>
            </div>
          </div>
        </div>

        <div v-if="saveError" class="error-banner">{{ saveError }}</div>
        <div v-if="saveSuccess" class="success-banner">{{ saveSuccess }}</div>

        <div class="review-actions">
          <button class="btn-save" @click="saveProfile" :disabled="saving">
            <span v-if="saving" class="btn-spinner"></span>
            {{ saving ? 'Saving…' : 'Save Profile' }}
          </button>
          <button class="btn-roadmap" @click="buildRoadmap" :disabled="buildingRoadmap">
            <span v-if="buildingRoadmap" class="btn-spinner"></span>
            {{ buildingRoadmap ? 'Building roadmap…' : 'Build My Roadmap →' }}
          </button>
        </div>
      </div>

      <!-- Navigation -->
      <div class="wizard-nav" v-if="currentStep < 5">
        <button class="btn-back" @click="prevStep" :disabled="currentStep === 1">
          ← Back
        </button>
        <button class="btn-next" @click="nextStep">
          Next →
        </button>
      </div>
      <div class="wizard-nav back-only" v-if="currentStep === 5">
        <button class="btn-back" @click="prevStep">
          ← Back
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
const sessionId = localStorage.getItem('meridian_session')

const currentStep = ref(1)
const saving = ref(false)
const buildingRoadmap = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const researchBanner = ref(false)
const researchDone = ref(false)
const researchSummary = ref('')

const form = reactive({
  // Step 1: Identity
  full_name: '',
  nationality: '',
  email: '',
  phone: '',
  dob: '',
  gender: '',
  countryOfBirth: '',
  passportNo: '',
  passportIssueDate: '',
  passportExpiryDate: '',
  placeOfIssue: '',
  // Step 2: Business intent
  sector: '',
  county: '',
  capital_usd: '',
  company_name: '',
  timeline: '',
  // Step 3: Kenya address
  postalAddress: '',
  postalCode: '',
  city: '',
  subcounty: '',
  location: '',
  road: '',
  plotNo: '',
  nearestLandmark: '',
  // Step 4: Background
  immigrationStatus: '',
  employerName: '',
  educationLevel: '',
  profession: '',
  spouseName: '',
  hasCompanyInKenya: false,
})

const stepTitles = [
  'Identity',
  'Business Intent',
  'Kenya Address',
  'Background',
  'Review & Submit',
]

const stepSubtitles = [
  'Your personal details as they appear on your passport',
  'Tell us about your investment plans in Kenya',
  'Kenya address details — you can fill these in later',
  'Professional & immigration background',
  'Review your profile before saving',
]

const progressPct = computed(() => ((currentStep.value - 1) / 4) * 100)

function chipClass(n) {
  if (n < currentStep.value) return 'chip-done'
  if (n === currentStep.value) return 'chip-active'
  return 'chip-pending'
}

function goToStep(n) {
  if (n >= 1 && n <= 5) currentStep.value = n
}

function nextStep() {
  if (currentStep.value < 5) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

let researchDebounce = null
function onSectorCountyChange() {
  if (!form.sector || !form.county) return
  clearTimeout(researchDebounce)
  researchDebounce = setTimeout(() => {
    fireBackgroundResearch()
  }, 800)
}

async function fireBackgroundResearch() {
  researchBanner.value = true
  researchDone.value = false
  researchSummary.value = ''
  try {
    const sid = sessionId || undefined
    const res = await fetch(`${API_BASE}/api/agent/trickle-research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        sector: form.sector,
        country: 'kenya',
        county: form.county,
      }),
    })
    const data = await res.json()
    researchSummary.value = data.summary || data.reply || `${form.sector} research in ${form.county} complete.`
    researchDone.value = true
  } catch {
    researchBanner.value = false
  }
}

async function saveProfile() {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/agent/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, ...form }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Save failed')
    if (data.session_id) localStorage.setItem('meridian_session', data.session_id)
    saveSuccess.value = 'Profile saved! Redirecting…'
    setTimeout(() => router.push('/dashboard'), 1200)
  } catch (e) {
    saveError.value = e.message || 'Could not save profile — is the backend running?'
  } finally {
    saving.value = false
  }
}

async function buildRoadmap() {
  buildingRoadmap.value = true
  saveError.value = ''
  try {
    await fetch(`${API_BASE}/api/agent/trickle-research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        sector: form.sector,
        country: 'kenya',
        county: form.county,
      }),
    })
    router.push('/invest/roadmap')
  } catch {
    router.push('/invest/roadmap')
  } finally {
    buildingRoadmap.value = false
  }
}

function displayVal(v) {
  if (v === undefined || v === null || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return v
}

const reviewSections = [
  {
    title: 'Identity',
    fields: [
      { key: 'full_name', label: 'Full Name' },
      { key: 'nationality', label: 'Nationality' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'passportNo', label: 'Passport No.' },
      { key: 'passportExpiryDate', label: 'Passport Expiry' },
    ],
  },
  {
    title: 'Business Intent',
    fields: [
      { key: 'sector', label: 'Sector' },
      { key: 'county', label: 'County' },
      { key: 'capital_usd', label: 'Capital (USD)' },
      { key: 'company_name', label: 'Company Name' },
      { key: 'timeline', label: 'Timeline' },
    ],
  },
  {
    title: 'Kenya Address',
    fields: [
      { key: 'postalAddress', label: 'Postal Address' },
      { key: 'city', label: 'City' },
      { key: 'subcounty', label: 'Sub-county' },
      { key: 'road', label: 'Road' },
      { key: 'plotNo', label: 'Plot No.' },
    ],
  },
  {
    title: 'Background',
    fields: [
      { key: 'immigrationStatus', label: 'Immigration Status' },
      { key: 'educationLevel', label: 'Education Level' },
      { key: 'profession', label: 'Profession' },
      { key: 'hasCompanyInKenya', label: 'Company in Kenya' },
    ],
  },
]
</script>

<style scoped>
.wizard-page {
  min-height: 100vh;
  background: #0b1120;
  color: #e5eaf3;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}

/* Header */
.wizard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 40px;
  background: rgba(11, 17, 32, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(30, 41, 59, 0.8);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-brand {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #34d399, #38bdf8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.brand-mark { color: #34d399; }

.header-subtitle {
  font-size: 13px;
  color: #64748b;
}

/* Body */
.wizard-body {
  max-width: 720px;
  margin: 0 auto;
  padding: 36px 24px 80px;
}

/* Progress bar */
.progress-track {
  height: 3px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 2px;
  margin-bottom: 28px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #059669, #38bdf8);
  border-radius: 2px;
  transition: width 300ms ease;
}

/* Step chips */
.step-chips {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 24px;
}

.step-chip {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  transition: background 200ms ease, color 200ms ease;
  cursor: default;
}

.chip-pending {
  background: #334155;
  color: #64748b;
}

.chip-active {
  background: #38bdf8;
  color: #0b1120;
}

.chip-done {
  background: #34d399;
  color: #0b1120;
  cursor: pointer;
}

/* Step heading */
.step-heading {
  text-align: center;
  margin-bottom: 28px;
}

.step-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}

.step-subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.step-note {
  font-size: 13px;
  color: #64748b;
  background: rgba(56, 189, 248, 0.06);
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 20px;
}

/* Research banner */
.research-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 10px;
  font-size: 13px;
  color: #7dd3fc;
  margin-bottom: 20px;
  transition: background 200ms;
}

.research-banner.done {
  background: rgba(52, 211, 153, 0.08);
  border-color: rgba(52, 211, 153, 0.25);
  color: #6ee7b7;
}

.banner-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(56, 189, 248, 0.3);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Form fields */
.step-form { }

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-group.full {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.field-input {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  color: #e5eaf3;
  font-size: 14px;
  padding: 11px 14px;
  outline: none;
  transition: border-color 150ms ease, box-shadow 150ms ease;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.field-input::placeholder { color: #475569; }

.field-input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
}

.field-input:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
}

.field-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
  cursor: pointer;
}

/* Toggle button */
.toggle-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.toggle-btn {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid #334155;
  background: #1e293b;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms, color 150ms, border-color 150ms;
  font-family: inherit;
}

.toggle-btn.active {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.4);
}

.toggle-btn:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.toggle-desc {
  font-size: 13px;
  color: #64748b;
}

/* Review */
.review-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.review-section {
  background: #1e293b;
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 14px;
  overflow: hidden;
}

.review-section-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #64748b;
  padding: 10px 16px 8px;
  border-bottom: 1px solid rgba(51, 65, 85, 0.4);
  margin: 0;
}

.review-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 13px;
  border-bottom: 1px solid rgba(30, 41, 59, 0.5);
}

.review-row:last-child { border-bottom: none; }

.review-key {
  color: #94a3b8;
}

.review-val {
  color: #e5eaf3;
  font-weight: 500;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

/* Error / Success banners */
.error-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #fca5a5;
  margin-bottom: 16px;
}

.success-banner {
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.3);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #6ee7b7;
  margin-bottom: 16px;
}

/* Review action buttons */
.review-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-save, .btn-roadmap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 28px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: filter 150ms, transform 100ms;
}

.btn-save {
  background: #1e293b;
  border: 1px solid #334155;
  color: #e5eaf3;
}

.btn-save:hover:not(:disabled) { filter: brightness(1.2); }
.btn-save:active:not(:disabled) { transform: scale(0.97); }
.btn-save:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.btn-roadmap {
  background: linear-gradient(90deg, #059669, #0284c7);
  color: white;
  flex: 1;
  justify-content: center;
}

.btn-roadmap:hover:not(:disabled) { filter: brightness(1.1); }
.btn-roadmap:active:not(:disabled) { transform: scale(0.97); }
.btn-roadmap:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
.btn-roadmap:disabled, .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Navigation */
.wizard-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 28px;
}

.wizard-nav.back-only {
  justify-content: flex-start;
}

.btn-back {
  background: transparent;
  border: 1px solid #334155;
  color: #94a3b8;
  padding: 11px 22px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 150ms, color 150ms, transform 100ms;
}

.btn-back:hover:not(:disabled) { border-color: #64748b; color: #e5eaf3; }
.btn-back:active:not(:disabled) { transform: scale(0.97); }
.btn-back:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
.btn-back:disabled { opacity: 0.3; cursor: default; }

.btn-next {
  background: linear-gradient(90deg, #059669, #0284c7);
  border: none;
  color: white;
  padding: 11px 28px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: filter 150ms, transform 100ms;
}

.btn-next:hover { filter: brightness(1.1); }
.btn-next:active { transform: scale(0.97); }
.btn-next:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

/* Mobile */
@media (max-width: 600px) {
  .wizard-header { padding: 12px 20px; }
  .wizard-body { padding: 24px 16px 60px; }
  .field-grid { grid-template-columns: 1fr; }
  .field-group.full { grid-column: 1; }
  .review-actions { flex-direction: column; }
  .btn-roadmap { flex: none; width: 100%; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .progress-fill { transition: none; }
  .banner-spinner, .btn-spinner { animation: none; }
  .btn-back, .btn-next, .btn-save, .btn-roadmap { transition: none; }
}

/* Reduced transparency */
@media (prefers-reduced-transparency: reduce) {
  .wizard-header { backdrop-filter: none; background: #0f172a; }
}

/* High contrast */
@media (prefers-contrast: more) {
  .field-input { border-color: #94a3b8; }
  .field-input:focus { border-color: #38bdf8; }
}
</style>
