# Immigration Permit Automation - Unified API Server

This is the unified API server that handles all three permit classes (D, G, R) from a single deployment.

## Directory Structure

```
api-server/
├── server.mjs              # Main Express server
├── automation/
│   ├── class-d.mjs         # Class D automation logic
│   ├── class-g.mjs         # Class G automation logic
│   └── class-r.mjs         # Class R automation logic
├── package.json
└── README.md
```

## Installation

```bash
cd api-server
npm install
```

## Running the Server

```bash
npm start
```

The server will start on port 5000 (or the PORT environment variable).

## Environment Variables

Create a `.env` file (optional):

```env
PORT=5000
HEADLESS=false
AUTO_CLOSE=false
SLOW_MO=300
```

### Class G (Trade/Business/Consultancy)
```bash
POST http://localhost:5000/api/permit/class-g
```

### Class R (Class R – EAC Nationals)
```bash
POST http://localhost:5000/api/permit/class-r
```

### Class N (Class N – EAC Nationals)
```bash
POST http://localhost:5000/api/permit/class-n
```

### Student Pass
```bash
POST http://localhost:5000/api/permit/student-pass
```

### Special Pass
```bash
POST http://localhost:5000/api/permit/special-pass
```

### Download Permit
```bash
POST http://localhost:5000/api/permit/download
```

### Autopopulate Permit
```bash
POST http://localhost:5000/api/permit/autopopulate
```

### Autodownload Permit
```bash
POST http://localhost:5000/api/permit/autodownload
```

### Autopopulate Permit
```bash
POST http://localhost:5000/api/permit/autopopulate
```

### Autodownload Permit
```bash
POST http://localhost:5000/api/permit/autodownload
```

### Autopopulate Permit
```bash
POST http://localhost:5000/api/permit/autopopulate
```

### Autodownload Permit
```bash
POST http://localhost:5000/api/permit/autodownload
```


## API Endpoints

### Health Check
```bash
GET http://localhost:5000/health
```

### Documentation
```bash
GET http://localhost:5000/api/docs
```

### Submit Permit Applications

#### Class D (Dependant Pass)
```bash
POST http://localhost:5000/api/permit/class-d
Content-Type: application/json

{
  "url": "https://fns.immigration.go.ke/account/login.html",
  "photoPath": "/path/to/passport_photo.jpg",
  "login": {
    "email": "your-email@example.com",
    "idNumber": "YOUR_ID_NUMBER",
    "password": "YOUR_PASSWORD"
  },
  "formData": { ... },
  "step2Data": { ... },
  "step3Data": { ... }
}
```

#### Class G (Trade/Business/Consultancy)
```bash
POST http://localhost:5000/api/permit/class-g
```

#### Class R (Class R – EAC Nationals)
```bash
POST http://localhost:5000/api/permit/class-r
```

## Testing

```bash
# Test with curl
curl -X POST http://localhost:5000/api/permit/class-d \
  -H "Content-Type: application/json" \
  -d @../class-D/test-data.json
```

## Frontend Connection

The server is configured with CORS to accept requests from the frontend at `http://localhost:3001`.

Update your frontend's `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Features

- ✅ Unified server for all three permit classes
- ✅ CORS enabled for frontend integration
- ✅ Async automation execution (non-blocking)
- ✅ Request validation
- ✅ Health check endpoint
- ✅ Comprehensive error handling
- ✅ Ready for production deployment

## Deployment

This server can be deployed to:
- Render.com
- Railway
- Heroku
- DigitalOcean
- AWS
- Any Node.js hosting platform

See the main `DEPLOYMENT.md` for detailed instructions.
