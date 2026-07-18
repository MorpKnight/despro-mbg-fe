# MBGlance — Despro MBG Frontend

Frontend for **MBGlance**, a capstone project prototype that models monitoring and coordination workflows for a school meal program. It is designed for demonstration and academic evaluation, not as a production application operated directly by a government institution.

The application supports school administrators, catering administrators, health-area administrators, super administrators, and students. The backend API is maintained in the separate [despro-mbg-be](../despro-mbg-be) project.

## Main capabilities

| Role | Main capabilities |
| --- | --- |
| Super Admin | Central dashboard, global analytics, user/school/catering/region management, approvals, and system monitoring |
| School Admin | School dashboard, student management, QR/NFC/manual attendance, food history, feedback, and emergency reports |
| Catering Admin | Catering dashboard, daily menu input and quality control, food history, and school-catering relationships |
| Health Admin | Health-area dashboard, analytics, school-catering relationships, and emergency report monitoring/follow-up |
| Student | Menu schedule, food history, attendance history, and feedback submission |

Cross-platform capabilities include:

- Staff/admin and student login flows.
- Refresh tokens, session persistence, logout, and 2FA flows.
- Menu and feedback image uploads through a configured CDN.
- Mobile push notifications.
- QR and NFC attendance scanning.
- Responsive desktop drawer navigation and mobile tab navigation.

## Network and offline modes

The frontend supports two connection modes:

- **CLOUD** — requests are sent to the central backend.
- **LOCAL** — school and catering administrators can connect to a local school/catering backend.

Super Admin, Health Admin, and Student roles are restricted to cloud mode. The server URL and network mode can be configured through the application settings.

Selected mutations, including catering menu quality checks and emergency reports, can be queued while the device is offline. The queue stores data in SQLite and retries synchronization when connectivity is restored. Offline support is selective; not every application request is available offline.

## Technology stack

- Expo 54 and Expo Router.
- React Native 0.81, React 19, and TypeScript.
- NativeWind/Tailwind CSS.
- TanStack React Query, React Hook Form, and Zod.
- Expo SQLite for offline queues.
- Expo Secure Store/AsyncStorage for local session and configuration data.
- Electron Builder and Tauri for desktop distribution.

## Important structure

    app/                  Expo Router routes and application screens
    components/           UI components and domain features
    context/               Auth, offline, snackbar, and preferences contexts
    hooks/                 Reusable auth, network, offline, and responsive hooks
    services/              API client and domain integrations
    lib/                   Utilities, React Query, and NFC helpers
    schemas/               Zod payload validation
    types/                 TypeScript types
    constants/             Roles, colors, and application constants
    src-tauri/             Tauri desktop configuration
    main.js                Electron entry point

Application routes are located in `app/(app)`, while authentication routes are located in `app/(auth)`.

## Prerequisites

- Node.js 20 recommended.
- npm.
- Android Studio or Xcode for Android/iOS development.
- An NFC-capable device and native development build for NFC features.
- Rust/Tauri toolchain for Tauri desktop builds.

## Local development

    npm install
    npm start

Common commands:

    npm run web       # Expo Web
    npm run android   # Android development build
    npm run ios       # iOS development build
    npm run lint      # Frontend linting

## API configuration

The backend URL is resolved in the following order:

1. `EXPO_PUBLIC_API_URL`.
2. `expo.extra.apiUrl` in `app.json`.
3. The fallback configured in `services/storage.ts`.

Example local configuration:

    EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
    EXPO_PUBLIC_ALLOW_LOCALHOST=true

Optional CDN configuration:

    EXPO_PUBLIC_CDN_URL=https://cdn.example.com
    EXPO_PUBLIC_WEBPUSH_VAPID_KEY=replace-with-development-key

Values prefixed with `EXPO_PUBLIC_` are included in the frontend bundle. Do not place private secrets in these variables.

The backend must be running at the URL configured for the frontend. See the [backend README](../despro-mbg-be/README.md) for backend setup instructions.

## Web and desktop builds

Build the static web export:

    npx expo export -p web

Build Electron packages:

    npm run electron:build-linux
    npm run electron:build-windows
    npm run electron:build-mac

Build and run the web Docker image:

    docker build --build-arg EXPO_PUBLIC_API_URL=https://api.example.com/api/v1 -t despro-frontend .
    docker run --rm -p 8080:8080 despro-frontend

The web application is then available at http://localhost:8080. The repository also contains a Docker Compose configuration intended for a production-like demonstration environment; its external network must be created separately.

## Quality checks

    npm run lint

No automated frontend test script is currently defined in `package.json`. Changes to the API client, authentication, offline queue, and role-based routes should be tested on the affected target platforms.

## Development notes

- Frontend role-based route handling does not replace backend authorization. Sensitive endpoints must always validate the user on the backend.
- Demo accounts and passwords must be limited to development/testing environments.
- Do not commit CDN API keys, backend credentials, push tokens, or other private secrets.
- API payload changes must be synchronized with the backend schemas and related services in `services/`.
