# KRA (Kenya Revenue Authority) — Meridian integration

Two live Playwright automations against the iTax portal (`https://itax.kra.go.ke/KRA-Portal/`), fronted by the Node/Playwright automations microservice (:5000) and orchestratable by the Claude agent (:5001).

## Capabilities

| Capability | Endpoint | Playwright script |
|-----------|----------|-------------------|
| Register a new KRA PIN | `POST /api/kra/register-pin` | `automations/scripts/kra.mjs::registerKraPin` |
| File a nil return       | `POST /api/kra/file-nil-return` | `automations/scripts/kra.mjs::fileNilReturn` |

## Agent tool

The Claude agent invokes both via `run_registration_automation`:

```
run_registration_automation(registration="kra_pin",
                            payload={firstName, lastName, taxpayerType, dateOfBirth,
                                     nationality, idType, idNumber, email, phone, city, county})
```

or

```
run_registration_automation(registration="kra_nil_return",
                            payload={pin, password, returnPeriodYear?})
```

For `kra_pin` the executor auto-hydrates the payload from the investor profile in `MemoryStore` (splits `full_name` into firstName/lastName, uses `passport_no` as idNumber, defaults `taxpayerType=Non-Resident Individual`). The `payload` you pass overrides those defaults.

## Request shape

### `POST /api/kra/register-pin`

```json
{
  "profile": {
    "taxpayerType": "Non-Resident Individual",
    "firstName": "Alex",
    "lastName": "Ngugi",
    "dateOfBirth": "01/01/1990",
    "gender": "Male",
    "nationality": "United States",
    "idType": "Passport",
    "idNumber": "N12345678",
    "email": "alex@example.com",
    "phone": "+254712345678",
    "postalAddress": "Nairobi,Kenya",
    "postalCode": "00100",
    "city": "Nairobi",
    "county": "Nairobi"
  }
}
```

Response is fire-and-report — you get a `jobId` immediately, the browser runs headed by default (`HEADLESS=false`). PIN and screenshots land in `~/Downloads/kra-evidence/`.

### `POST /api/kra/file-nil-return`

```json
{
  "pin": "A012345678X",
  "password": "your-itax-password",
  "returnPeriodYear": "2025"
}
```

Response includes acknowledgement number (extracted from the confirmation page) and the evidence screenshot.

## Environment flags

| Var | Default | Purpose |
|-----|---------|---------|
| `HEADLESS` | `true` | Set `false` to watch the browser drive iTax |
| `AUTO_CLOSE` | `true` | Set `false` to leave the browser open at the end |
| `SLOW_MO` | `0` | ms between actions — useful for demos |

## Evidence

Every run drops a full-page screenshot into `~/Downloads/kra-evidence/kra-pin-{lastName}-{stamp}.png` (or `kra-nil-return-{pin}-{stamp}.png`). Failed runs write `kra-pin-ERROR-{stamp}.png`.

## Country-adapter entries

`backend/countries/kenya.json` → `business_setup.kra_pin` and `business_setup.kra_nil_return` — both carry the portal URL, automation endpoint, and requirements list so the concierge and roadmap builder can surface them.
