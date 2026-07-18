# Google Maps Carpooling Platform

## Module purpose

This application owns the frontend Google Maps experience for the Raahi enterprise carpooling flow. It validates and evolves map loading, place selection, route calculation, ride draft creation, ride discovery, and trip visualization before final integration into the broader product.

## Owned responsibilities

- Loading the Google Maps JavaScript API with the configured browser key.
- Rendering the full-screen Ahmedabad map experience.
- Searching pickup and destination places with Google Places Autocomplete.
- Storing selected pickup and destination place contracts.
- Calculating and displaying a driving route with Google Routes API.
- Managing frontend-only ride drafts and discovery previews in session state.
- Displaying simulated trip visualization while live tracking is out of scope.
- Documenting Google Maps validation phases.

## Responsibilities not owned

- Backend APIs, persistence, authentication, payments, booking, matching, and live tracking remain outside this module.
- Existing administration portal and backend application behavior remain outside this module.
- Production server-side Google Maps key handling remains a future backend responsibility.

## Public operations

### `GoogleMap`

- Request contract: environment variable `GOOGLE_MAPS_API_KEY` exposed to Vite as `VITE_GOOGLE_MAPS_API_KEY`
- Success result: rendered map, selected markers, optional route line, and trip summary card
- Failure result or typed error: map configuration state, map load state, Places error state, invalid route input state, no-route state, route calculation error state
- Side effects: Google Maps JavaScript API load, Places API calls, Routes API calls, browser geolocation request
- Permission or security requirements: browser geolocation requires user permission; real API keys must remain outside source control

## Internal responsibility map

```text
source/components/google-maps/ - Google Maps user interface components
source/constants/google-maps/ - Map display and overlay configuration
source/google-maps/ - Public Google Maps module exports
source/hooks/google-maps/ - Google Maps state and workflow hooks
source/services/google-maps/ - Google Maps Platform and browser side-effect adapters
source/types/google-maps/ - Google Maps contracts used by components, hooks, and services
source/utilities/google-maps/ - Pure display and formatting helpers
docs/google-maps/ - Phase validation and implementation documentation
```

## Dependencies and side effects

- `@react-google-maps/api` loads and renders the Google Maps JavaScript API.
- Google Places Autocomplete provides pickup and destination suggestions.
- Google Routes API calculates driving route distance, duration, and polyline data.
- Browser geolocation provides optional current location centering.
- Ride draft, discovery, and trip visualization state is session-only React state.

## Allowed callers

- The application entry point `source/App.tsx` imports from `source/google-maps`.
- Other Raahi applications should not import internals from this application during the long-lived feature phase.

## Invariants

- The real Google Maps API key must never be committed.
- Google Maps logic must remain inside this application module.
- Generated folders such as `node_modules`, `dist`, logs, and TypeScript build info must not be committed.

## Tests

- Public behavior: manual browser validation documented in `docs/google-maps/phase-*.md`
- Contract tests: planned for route, ride draft, discovery, and trip visualization contracts
- Important rule tests: planned for route cache, ride validation, and formatting utilities
