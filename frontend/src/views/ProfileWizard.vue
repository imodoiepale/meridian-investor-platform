<template>
  <div class="wizard-page">
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
import { ref, computed, reactive, onMounted } from 'vue'
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

// The stored profile mixes spellings: the wizard binds camelCase while
// backend/agent/tools.py writes snake_case, so accept either.
const snake = (k) => k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())

onMounted(async () => {
  if (!sessionId) return
  try {
    const res = await fetch(`${API_BASE}/api/agent/session/${sessionId}`)
    if (!res.ok) return
    const saved = (await res.json()).profile || {}
    for (const key of Object.keys(form)) {
      const val = saved[key] ?? saved[snake(key)]
      if (val !== undefined && val !== null && val !== '') form[key] = val
    }
  } catch {
    // Backend offline — the wizard still works, just starts blank.
  }
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
  color: var(--text);
  font-family: var(--font);
}

/* Body */
.wizard-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 8px 24px 80px;
}

/* Progress bar */
.progress-track {
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  margin-bottom: 28px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 300ms var(--ease-out);
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
  transition: background 200ms var(--ease-out), color 200ms var(--ease-out);
  cursor: default;
}

.chip-pending {
  background: var(--surface2);
  color: var(--text3);
}

.chip-active {
  background: var(--accent);
  color: #fff;
}

.chip-done {
  background: var(--success);
  color: #fff;
  cursor: pointer;
}

/* Step heading */
.step-heading {
  text-align: center;
  margin-bottom: 28px;
}

.step-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 500;
  line-height: 1.15;
  margin: 0 0 6px;
  letter-spacing: -0.02em;
  color: var(--text);
}

.step-subtitle {
  font-size: 14px;
  color: var(--text2);
  margin: 0;
}

.step-note {
  font-size: 13px;
  color: var(--text2);
  background: var(--accent-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
  margin-bottom: 20px;
}

/* Research banner */
.research-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--accent-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: 13px;
  color: var(--accent);
  margin-bottom: 20px;
  transition: background 200ms var(--ease-out);
}

.research-banner.done {
  background: color-mix(in srgb, var(--success) 10%, transparent);
  border-color: color-mix(in srgb, var(--success) 30%, transparent);
  color: var(--success);
}

.banner-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Form fields */
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
  color: var(--text2);
  font-weight: 500;
  letter-spacing: 0.3px;
}

.field-input {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  color: var(--text);
  font-size: 14px;
  padding: 11px 14px;
  outline: none;
  transition: border-color 160ms var(--ease-out), box-shadow 160ms var(--ease-out);
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.field-input::placeholder { color: var(--text3); }

.field-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.field-input:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.field-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23606978' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
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
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text2);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 160ms var(--ease-out), color 160ms var(--ease-out), border-color 160ms var(--ease-out);
  font-family: inherit;
}

.toggle-btn.active {
  background: var(--accent-soft);
  color: var(--accent);
  border-color: var(--accent);
}

.toggle-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.toggle-desc {
  font-size: 13px;
  color: var(--text2);
}

/* Review */
.review-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.review-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.review-section-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text3);
  padding: 10px 16px 8px;
  border-bottom: 1px solid var(--border);
  margin: 0;
}

.review-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--border2);
}

.review-row:last-child { border-bottom: none; }

.review-key {
  color: var(--text2);
}

.review-val {
  color: var(--text);
  font-weight: 500;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

/* Error / Success banners */
.error-banner {
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
  font-size: 13px;
  color: var(--danger);
  margin-bottom: 16px;
}

.success-banner {
  background: color-mix(in srgb, var(--success) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
  font-size: 13px;
  color: var(--success);
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
  border-radius: var(--radius-lg);
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: filter 160ms var(--ease-out), transform 100ms var(--ease-out);
}

.btn-save {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
}

.btn-save:hover:not(:disabled) { background: var(--surface2); }
.btn-save:active:not(:disabled) { transform: scale(0.97); }
.btn-save:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.btn-roadmap {
  background: var(--accent);
  color: #fff;
  flex: 1;
  justify-content: center;
}

.btn-roadmap:hover:not(:disabled) { background: var(--accent-h); }
.btn-roadmap:active:not(:disabled) { transform: scale(0.97); }
.btn-roadmap:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.btn-roadmap:disabled, .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
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
  border: 1px solid var(--border);
  color: var(--text2);
  padding: 11px 22px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 160ms var(--ease-out), color 160ms var(--ease-out), transform 100ms var(--ease-out);
}

.btn-back:hover:not(:disabled) { border-color: var(--accent); color: var(--text); }
.btn-back:active:not(:disabled) { transform: scale(0.97); }
.btn-back:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.btn-back:disabled { opacity: 0.3; cursor: default; }

.btn-next {
  background: var(--accent);
  border: none;
  color: #fff;
  padding: 11px 28px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 160ms var(--ease-out), transform 100ms var(--ease-out);
}

.btn-next:hover { background: var(--accent-h); }
.btn-next:active { transform: scale(0.97); }
.btn-next:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* Mobile */
@media (max-width: 600px) {
  .wizard-body { padding: 8px 16px 60px; }
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

/* High contrast */
@media (prefers-contrast: more) {
  .field-input { border-color: var(--text2); }
  .field-input:focus { border-color: var(--accent); }
}
</style>
