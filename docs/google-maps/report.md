# Google Maps API Setup

## Purpose

This document helps the team verify that the Google Maps Platform API key is correctly configured before any application development begins.

This is Phase 0 for the Enterprise Carpooling Platform hackathon project. The goal is only API validation. Do not build frontend, backend, database, authentication, ride matching, or production architecture in this phase.

By the end of this setup, teammates should be able to confirm:

- [ ] The Google Cloud project exists.
- [ ] Billing is enabled.
- [ ] The required Google Maps Platform APIs are enabled.
- [ ] The API key works for basic requests.
- [ ] The API key is restricted safely.
- [ ] Secrets are stored locally and not committed.
- [ ] Common configuration errors can be diagnosed quickly.

## Supported APIs

Google Maps Platform contains many APIs. For this project, the initial validation focuses on the APIs most likely to support an enterprise carpooling workflow.

| API | Purpose | Required | Used By | Billing Required | Frontend | Backend |
| --- | --- | --- | --- | --- | --- | --- |
| Maps JavaScript API | Display interactive maps in a browser | Yes | Map UI, pickup/dropoff display, route visualization | Yes | Yes | No |
| Places API | Search places, autocomplete addresses, retrieve place details | Yes | Pickup/dropoff search, office locations, landmarks | Yes | Yes | Yes |
| Routes API | Calculate routes, distance, duration, traffic-aware travel estimates | Yes | Ride planning, ETA, route comparison, matching logic | Yes | Usually No | Yes |
| Geocoding API | Convert addresses to coordinates and coordinates to addresses | Yes | Address normalization, pickup/dropoff storage, reverse geocoding | Yes | Possible | Yes |
| Geolocation API | Estimate user location from network signals | Optional | Fallback location detection | Yes | Possible | Yes |
| Distance Matrix API | Calculate travel distance/time matrix | Optional/Future | Batch matching, commute comparisons | Yes | No | Yes |
| Roads API | Snap GPS points to roads | Future | Live tracking cleanup, driver route history | Yes | No | Yes |
| Navigation SDK | Turn-by-turn navigation | Future | Driver navigation | Yes | Mobile | Backend support only |

## Required APIs for an Enterprise Carpooling Platform

### Mandatory APIs

Enable these APIs for Phase 0 validation:

| API | Why It Is Mandatory |
| --- | --- |
| Maps JavaScript API | Required to render maps in the future web application. |
| Places API | Required for pickup/dropoff search, autocomplete, and place details. |
| Routes API | Required for route calculation, ETA, distance, and traffic-aware planning. |
| Geocoding API | Required to convert between human-readable addresses and latitude/longitude. |

### Optional APIs

These are useful but not required for the first validation pass:

| API | Possible Use |
| --- | --- |
| Geolocation API | Fallback location detection when browser location is unavailable or unreliable. |
| Distance Matrix API | Batch comparison of many drivers and riders. Routes API Compute Route Matrix may also cover this need. |
| Time Zone API | Convert trip times across regions if the platform expands geographically. |
| Address Validation API | Validate structured addresses for enterprise office locations. |

### Future APIs

These may become relevant after the core carpooling workflow is proven:

| API or SDK | Future Use |
| --- | --- |
| Roads API | Clean up GPS traces by snapping points to roads. |
| Navigation SDK | Driver turn-by-turn navigation in a mobile app. |
| Fleet Engine | Advanced fleet-style live operations, if the project evolves beyond hackathon scope. |
| Solar, Air Quality, or other environmental APIs | Sustainability dashboards or commute impact reporting. |

## Environment File Setup

Create a local `.env` file in the project root:

```env
GOOGLE_MAPS_API_KEY=YOUR_API_KEY
```

Replace `YOUR_API_KEY` with the API key from Google Cloud Console.

### Why `.env` Is Needed

The `.env` file stores local configuration values that should not be hardcoded into project files. The Google Maps API key is configuration, not source code.

Using `.env` keeps the key out of documentation and application code. Later, when the project adds frontend or backend code, the app can load the key from the environment instead of copying the secret into source files.

### Why Secrets Should Never Be Committed

Never commit real API keys to Git.

If a key is committed, it can be copied, leaked, indexed, or reused by someone outside the team. A leaked Google Maps key can create unexpected billing charges and quota usage.

If a real key is ever committed by mistake:

- [ ] Restrict the key immediately.
- [ ] Rotate or delete the exposed key.
- [ ] Create a new key.
- [ ] Check Google Cloud metrics for unauthorized usage.
- [ ] Remove the secret from Git history if the repository was pushed.

### How `.gitignore` Protects Secrets

The project `.gitignore` should include:

```gitignore
.env
.env.*
!.env.example
```

This means:

| File | Should Be Committed? | Reason |
| --- | --- | --- |
| `.env` | No | Contains real local secrets. |
| `.env.local` | No | May contain developer-specific secrets. |
| `.env.production` | No | May contain production secrets. |
| `.env.example` | Yes | Safe template showing required variable names only. |

## Google Maps API Validation Checklist

Use this checklist before writing application code.

- [ ] Google Cloud project created
- [ ] Billing account linked to the project
- [ ] Google Maps Platform enabled for the project
- [ ] API key created
- [ ] Maps JavaScript API enabled
- [ ] Places API enabled
- [ ] Routes API enabled
- [ ] Geocoding API enabled
- [ ] API key application restrictions configured
- [ ] API key API restrictions configured
- [ ] `.env` created locally
- [ ] `.env.example` committed as the safe template
- [ ] `.gitignore` configured to ignore real environment files
- [ ] Basic Maps JavaScript API test passes
- [ ] Basic Places API test passes
- [ ] Basic Routes API test passes
- [ ] Basic Geocoding API test passes
- [ ] Google Cloud metrics show only expected usage

## Testing Guide

Before testing, set your local shell variable from `.env` or manually export the key for the current terminal session.

PowerShell example:

```powershell
$env:GOOGLE_MAPS_API_KEY="YOUR_API_KEY"
```

Do not paste real keys into team chat, screenshots, Git commits, or issue descriptions.

### Maps JavaScript API

| Item | Details |
| --- | --- |
| Purpose | Confirms the key can load the browser-based Maps JavaScript library. |
| Required API | Maps JavaScript API |
| Recommended key type | Browser key restricted by HTTP referrer |
| Expected result | The script loads successfully in a browser and no Google Maps API error appears in the browser console. |

How to test:

1. Create a temporary local HTML file outside the repository or use an API loader test page.
2. Load the Maps JavaScript API script with the key.
3. Open browser developer tools.
4. Confirm there are no errors such as `InvalidKeyMapError`, `RefererNotAllowedMapError`, or `ApiNotActivatedMapError`.
5. Delete the temporary file when finished.

Expected response:

- The Maps JavaScript library loads.
- The browser console does not show Google Maps authentication or activation errors.
- Google Cloud metrics show Maps JavaScript API usage for the key.

Common errors:

| Error | Meaning |
| --- | --- |
| `ApiNotActivatedMapError` | Maps JavaScript API is not enabled for the project. |
| `RefererNotAllowedMapError` | The current website origin is not allowed by the key's HTTP referrer restrictions. |
| `InvalidKeyMapError` | The key is missing, malformed, deleted, or invalid. |
| `REQUEST_DENIED` | The request was rejected because of key, billing, restriction, or permission problems. |

Troubleshooting:

- Confirm Maps JavaScript API is enabled in Google Cloud Console.
- Confirm billing is enabled on the same project as the key.
- Confirm the browser origin matches the allowed referrer exactly.
- For local testing, allow the correct local origin, such as `http://localhost:3000/*`, when an app exists later.
- Wait a few minutes after enabling APIs or changing restrictions.

### Places API

| Item | Details |
| --- | --- |
| Purpose | Confirms the key can search places and retrieve place data for pickup/dropoff workflows. |
| Required API | Places API or Places API (New), depending on the selected implementation later |
| Recommended key type | Browser key for client autocomplete, server key for backend place lookups |
| Expected result | A valid place search returns place records with requested fields. |

How to test Places API (New) with Text Search:

```powershell
$headers = @{
  "Content-Type" = "application/json"
  "X-Goog-Api-Key" = $env:GOOGLE_MAPS_API_KEY
  "X-Goog-FieldMask" = "places.id,places.displayName,places.formattedAddress"
}

$body = @{
  textQuery = "Google India Bengaluru"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "https://places.googleapis.com/v1/places:searchText" `
  -Headers $headers `
  -Body $body
```

Expected response:

- A JSON response containing a `places` array.
- Each place should include fields such as `id`, `displayName`, and `formattedAddress`.

Common errors:

| Error | Meaning |
| --- | --- |
| `403` | Places API is disabled, billing is not enabled, or key restrictions block the request. |
| `401` | Authentication failed or the key was not sent correctly. |
| `REQUEST_DENIED` | The request is not allowed because of API, billing, key, or restriction configuration. |
| Missing field mask error | Places API (New) requests require selected response fields for many methods. |

Troubleshooting:

- Confirm Places API is enabled.
- Use `X-Goog-Api-Key` for Places API (New) web service requests.
- Include `X-Goog-FieldMask` and request only needed fields.
- Do not use the wildcard field mask `*` in production because it can increase cost and latency.
- Confirm the key's API restrictions allow Places API.

### Routes API

| Item | Details |
| --- | --- |
| Purpose | Confirms the key can calculate route distance and duration. |
| Required API | Routes API |
| Recommended key type | Server key restricted by backend IP address or secure server environment |
| Expected result | A valid route response containing duration and distance. |

How to test Compute Routes:

```powershell
$headers = @{
  "Content-Type" = "application/json"
  "X-Goog-Api-Key" = $env:GOOGLE_MAPS_API_KEY
  "X-Goog-FieldMask" = "routes.duration,routes.distanceMeters"
}

$body = @{
  origin = @{
    location = @{
      latLng = @{
        latitude = 12.9716
        longitude = 77.5946
      }
    }
  }
  destination = @{
    location = @{
      latLng = @{
        latitude = 12.9352
        longitude = 77.6245
      }
    }
  }
  travelMode = "DRIVE"
  routingPreference = "TRAFFIC_AWARE"
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Method Post `
  -Uri "https://routes.googleapis.com/directions/v2:computeRoutes" `
  -Headers $headers `
  -Body $body
```

Expected response:

- A JSON response containing `routes`.
- The route should include `duration` and `distanceMeters`.

Common errors:

| Error | Meaning |
| --- | --- |
| `403` | Routes API is disabled, billing is missing, or the key is restricted incorrectly. |
| `401` | API key authentication failed. |
| Missing field mask error | Routes API requires `X-Goog-FieldMask` or equivalent field selection. |
| `QuotaExceeded` | Quota or billing limits were exceeded. |

Troubleshooting:

- Confirm Routes API is enabled.
- Confirm billing is enabled.
- Include `X-Goog-FieldMask`.
- Use specific fields such as `routes.duration,routes.distanceMeters`.
- Confirm server-side key restrictions allow the machine or environment making the request.

### Geocoding API

| Item | Details |
| --- | --- |
| Purpose | Confirms the key can convert addresses to coordinates and coordinates to addresses. |
| Required API | Geocoding API |
| Recommended key type | Server key restricted by backend IP address or secure server environment |
| Expected result | A valid geocoding response with `status` equal to `OK`. |

How to test address geocoding:

```powershell
$address = [uri]::EscapeDataString("MG Road, Bengaluru, Karnataka")
$uri = "https://maps.googleapis.com/maps/api/geocode/json?address=$address&key=$env:GOOGLE_MAPS_API_KEY"
Invoke-RestMethod -Uri $uri
```

How to test reverse geocoding:

```powershell
$latlng = "12.9716,77.5946"
$uri = "https://maps.googleapis.com/maps/api/geocode/json?latlng=$latlng&key=$env:GOOGLE_MAPS_API_KEY"
Invoke-RestMethod -Uri $uri
```

Expected response:

- `status` should be `OK`.
- `results` should contain at least one result.
- Results should include formatted addresses and geometry.

Common errors:

| Error | Meaning |
| --- | --- |
| `REQUEST_DENIED` | Key, billing, API activation, or restriction issue. |
| `ZERO_RESULTS` | The request was valid but no matching address was found. |
| `OVER_QUERY_LIMIT` or `QuotaExceeded` | Quota or billing limit reached. |
| `INVALID_REQUEST` | Required parameters are missing or invalid. |

Troubleshooting:

- Confirm Geocoding API is enabled.
- Confirm the request includes either `address` or `latlng`.
- URL-encode address values.
- Confirm billing and quota settings.
- Confirm API restrictions allow Geocoding API.

## Troubleshooting Guide

### `REQUEST_DENIED`

| Field | Details |
| --- | --- |
| Cause | Google rejected the request because the API key, billing, API activation, permissions, or restrictions are not valid for the request. |
| Diagnosis | Check the response message, browser console, and Google Cloud API metrics. Confirm the request is using the expected key. |
| Resolution | Enable the required API, enable billing, fix key restrictions, use the correct key type, and retry after a few minutes. |

### `BillingNotEnabled`

| Field | Details |
| --- | --- |
| Cause | Billing is not enabled or not linked to the Google Cloud project that owns the API key. |
| Diagnosis | Open Google Cloud Console and check Billing for the project. Confirm the key belongs to that same project. |
| Resolution | Link an active billing account to the project. Confirm billing is active and retry. |

### `ApiNotActivatedMapError`

| Field | Details |
| --- | --- |
| Cause | The Maps JavaScript API is not enabled for the project. |
| Diagnosis | Browser console shows `ApiNotActivatedMapError` while loading the map script. |
| Resolution | Enable Maps JavaScript API in Google Cloud Console and wait a few minutes for activation. |

### `RefererNotAllowedMapError`

| Field | Details |
| --- | --- |
| Cause | The browser request came from a website origin not allowed by the API key's HTTP referrer restrictions. |
| Diagnosis | Browser console shows `RefererNotAllowedMapError`. Compare the current page origin with the allowed referrers in Google Cloud Console. |
| Resolution | Add the correct HTTP referrer, including protocol and port when needed. Example: `http://localhost:3000/*`. |

### `InvalidKeyMapError`

| Field | Details |
| --- | --- |
| Cause | The API key is invalid, missing, malformed, deleted, or not recognized. |
| Diagnosis | Browser console shows `InvalidKeyMapError`. Check whether the request URL contains the expected key. |
| Resolution | Copy the key again from Google Cloud Console, update `.env`, and confirm the key has not been deleted or rotated. |

### `QuotaExceeded`

| Field | Details |
| --- | --- |
| Cause | The project exceeded quota, request limits, or budget controls for the API. |
| Diagnosis | Check Google Cloud Console quotas, billing, and API metrics. Look for sudden unexpected traffic. |
| Resolution | Reduce request volume, add caching where appropriate later, adjust quotas if approved, or investigate leaked keys. |

### `403`

| Field | Details |
| --- | --- |
| Cause | Forbidden request. Common reasons include disabled API, missing billing, blocked key restriction, or wrong key for the API. |
| Diagnosis | Inspect the response body. Check API activation, billing, and key restrictions. |
| Resolution | Enable the API, fix billing, and update application or API restrictions. |

### `401`

| Field | Details |
| --- | --- |
| Cause | Authentication failed. The request may be missing the key or sending it in the wrong place. |
| Diagnosis | Confirm the request includes `key=...` for APIs that use query parameters or `X-Goog-Api-Key` for newer web service requests. |
| Resolution | Send the key using the correct method for the API being tested. Confirm the environment variable is populated locally. |

### Network Errors

| Field | Details |
| --- | --- |
| Cause | Local network, DNS, proxy, firewall, browser extension, corporate VPN, or temporary service connectivity issue. |
| Diagnosis | Retry from another network, test with `Invoke-RestMethod`, check browser dev tools, and confirm the endpoint URL is correct. |
| Resolution | Fix the URL, check internet connectivity, disable blocking extensions for testing, or try from a different network. |

## Security Guide

### API Key Restrictions

Every production key should have both:

- [ ] One application restriction
- [ ] One or more API restrictions

Application restrictions control where the key can be used. API restrictions control which Google APIs the key can call.

### HTTP Referrer Restrictions

Use HTTP referrer restrictions for browser keys.

Recommended examples for future frontend development:

| Environment | Example Referrer |
| --- | --- |
| Local dev | `http://localhost:3000/*` |
| Local alternate port | `http://localhost:5173/*` |
| Staging | `https://staging.example.com/*` |
| Production | `https://example.com/*` |

Best practices:

- Include the protocol: `http` or `https`.
- Include the port for localhost.
- Avoid overly broad wildcard rules.
- Do not use browser keys for backend server requests.

### Server Key Restrictions

Use server-side keys for backend API calls such as Routes API and Geocoding API.

Recommended restrictions:

| Environment | Restriction Type |
| --- | --- |
| Local backend testing | Temporary IP-based restriction if possible |
| Staging backend | Staging server outbound IP addresses |
| Production backend | Production server outbound IP addresses or secure workload identity pattern |

Best practices:

- Keep server keys out of browser code.
- Restrict server keys by IP address where practical.
- Use separate keys for frontend and backend once development begins.
- Use separate keys per environment: local, staging, production.

### Environment Variables

Environment variables keep secrets out of source code.

Rules:

- [ ] Store real keys in `.env`.
- [ ] Commit only `.env.example`.
- [ ] Never paste real keys into Markdown docs.
- [ ] Never hardcode keys into JavaScript, HTML, backend files, tests, screenshots, or README examples.

### Secret Management

For hackathon validation, a local `.env` file is acceptable.

For production, use a managed secret store such as:

- Google Secret Manager
- CI/CD secret variables
- Cloud runtime environment variables
- Organization-approved enterprise secret management tools

### Git Best Practices

- [ ] Keep `.env` ignored.
- [ ] Commit `.env.example`.
- [ ] Review staged files before committing.
- [ ] Never commit screenshots showing API keys.
- [ ] Rotate any key that was accidentally committed.
- [ ] Use separate API keys for development, staging, and production.
- [ ] Review Google Cloud metrics for unexpected key usage.

## Future Roadmap

| Phase | Name | Goal | Google Maps Platform Focus |
| --- | --- | --- | --- |
| Phase 0 | API Validation | Confirm key, billing, enabled APIs, restrictions, and basic responses | Maps JavaScript API, Places API, Routes API, Geocoding API |
| Phase 1 | Display Map | Show an interactive map in the application | Maps JavaScript API |
| Phase 2 | Current Location | Detect or request user location | Browser Geolocation, Maps JavaScript API, optional Geolocation API |
| Phase 3 | Autocomplete | Let users search pickup and dropoff locations | Places API |
| Phase 4 | Route Calculation | Calculate distance, duration, and route path | Routes API |
| Phase 5 | Ride Matching | Match riders and drivers based on route overlap, timing, and distance | Routes API, Compute Route Matrix or Distance Matrix |
| Phase 6 | Live Tracking | Track active rides and update locations | Maps JavaScript API, Roads API later if needed |
| Phase 7 | Driver Navigation | Provide driver navigation flow | Navigation SDK or external Google Maps deep links |

## Quick Reference Table

| API | Purpose | Required | Used By | Billing Required | Frontend | Backend |
| --- | --- | --- | --- | --- | --- | --- |
| Maps JavaScript API | Render interactive browser maps | Yes | Map screen, markers, route display | Yes | Yes | No |
| Places API | Search places and power autocomplete | Yes | Pickup/dropoff search | Yes | Yes | Yes |
| Routes API | Calculate route distance, duration, ETA, and traffic-aware routes | Yes | Route planning and matching | Yes | No | Yes |
| Geocoding API | Convert address to coordinates and coordinates to address | Yes | Address normalization | Yes | Possible | Yes |
| Geolocation API | Estimate location from network information | Optional | Fallback location detection | Yes | Possible | Yes |
| Compute Route Matrix | Compare many origins and destinations | Optional/Future | Ride matching at scale | Yes | No | Yes |
| Distance Matrix API | Legacy or alternate distance/time matrix workflows | Optional/Future | Batch commute comparison | Yes | No | Yes |
| Roads API | Snap GPS points to roads | Future | Live tracking cleanup | Yes | No | Yes |
| Navigation SDK | Turn-by-turn driver guidance | Future | Driver mobile experience | Yes | Mobile | Support only |

## Phase 0 Completion Criteria

Phase 0 is complete when:

- [ ] `.env.example` documents the required key variable.
- [ ] `.gitignore` protects real environment files.
- [ ] The team can validate Maps JavaScript API.
- [ ] The team can validate Places API.
- [ ] The team can validate Routes API.
- [ ] The team can validate Geocoding API.
- [ ] All required APIs are enabled in the same Google Cloud project as the key.
- [ ] Billing is enabled.
- [ ] Key restrictions are configured.
- [ ] No real API key is committed to the repository.

After these checks pass, the team can begin Phase 1: Display Map.

## Official References

- [Maps JavaScript API setup](https://developers.google.com/maps/documentation/javascript/get-api-key)
- [Maps JavaScript API error messages](https://developers.google.com/maps/documentation/javascript/error-messages)
- [Google Maps Platform API security best practices](https://developers.google.com/maps/api-security-best-practices)
- [Places API overview](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Places API field masks](https://developers.google.com/maps/documentation/places/web-service/choose-fields)
- [Routes API usage and billing](https://developers.google.com/maps/documentation/routes/usage-and-billing)
- [Routes API computeRoutes](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes)
- [Geocoding API overview](https://developers.google.com/maps/documentation/geocoding/guides-v3/overview)
