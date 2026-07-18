# Google Maps Phase 1

## Objective

Phase 1 creates the minimum production-quality Google Maps foundation for the Enterprise Carpooling Platform.

Phase 0 is already complete:

- [x] Google Maps API key validated
- [x] Billing configured
- [x] Maps JavaScript API working

Phase 1 only adds the React map foundation. It does not add routing, Places search, trip booking, ride matching, tracking, backend services, authentication, or payments.

## Implemented Features

| Feature | Status | Notes |
| --- | --- | --- |
| React application setup | Complete | Vite + React + TypeScript |
| Google Maps integration | Complete | Uses `@react-google-maps/api` |
| Environment-based API key | Complete | Reads `GOOGLE_MAPS_API_KEY` from `.env` through Vite config |
| Full-screen responsive map | Complete | Map fills the browser viewport |
| Default center | Complete | Ahmedabad, India |
| Current Location button | Complete | Uses browser geolocation |
| Loading state | Complete | Shown while Google Maps script loads |
| Error state | Complete | Shown for missing key or failed map load |
| Reusable map component | Complete | `src/components/google-maps/GoogleMap.tsx` |
| Reusable service layer | Complete | Google Maps config and browser geolocation services |

## Environment Setup

The local `.env` file must contain:

```env
GOOGLE_MAPS_API_KEY=YOUR_API_KEY
```

The real key must never be committed. The repository includes `.env.example` as the safe template for teammates.

For this browser-based phase, the Google Maps key should be restricted in Google Cloud Console with HTTP referrer restrictions before public deployment.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Folder Structure

```text
src/
├── components/
│   └── google-maps/
│       ├── GoogleMap.css
│       └── GoogleMap.tsx
├── services/
│   ├── geolocation/
│   │   └── browserGeolocation.ts
│   └── googleMaps/
│       └── config.ts
├── types/
│   └── location.ts
├── App.tsx
├── index.css
├── main.tsx
└── vite-env.d.ts
```

## Validation Checklist

- [ ] `npm install` completes successfully.
- [ ] `npm run build` completes successfully.
- [ ] The app loads a full-screen Google Map.
- [ ] The map defaults to Ahmedabad, India.
- [ ] The loading state appears before the map is ready.
- [ ] A clear error appears if the API key is missing or invalid.
- [ ] The Current Location button requests browser location permission.
- [ ] If location permission is allowed, the map centers on the current location.
- [ ] If location permission is denied, the app shows a friendly message.
- [ ] No Google Maps API key is hardcoded in source files.

## Deferred to Future Phases

| Future Phase | Deferred Work |
| --- | --- |
| Phase 2 | Current location enhancements and user location flows |
| Phase 3 | Places autocomplete for pickup and dropoff |
| Phase 4 | Route calculation and route rendering |
| Phase 5 | Ride matching |
| Phase 6 | Live tracking |
| Phase 7 | Driver navigation |

## Security Notes

- Keep `.env` local.
- Commit `.env.example`, not `.env`.
- Use separate frontend and backend API keys in later phases.
- Restrict browser keys with HTTP referrers.
- Restrict backend keys with server-side restrictions.
- Restrict each key to only the Google Maps APIs required by that key.
