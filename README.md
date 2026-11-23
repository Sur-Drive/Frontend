# SurDrive — Passenger Frontend

SurDrive is a web-based passenger application designed to support ride-booking and transportation services through an accessible, responsive, and interactive user experience.

This repository contains the passenger-facing frontend, including ride-booking interfaces, map integration, authentication flows, ride tracking, and Progressive Web App (PWA) capabilities.

## Technology Stack

| Technology | Purpose |
|---|---|
| React 18 | User interface development |
| TypeScript | Static typing and maintainability |
| Vite 8 | Development server and production builds |
| Tailwind CSS 4 | Styling and responsive layouts |
| Firebase | Integrated Firebase services |
| Google Maps | Mapping and location-related functionality |
| Workbox | Service worker and PWA functionality |
| TensorFlow.js | Machine-learning-related frontend functionality |

## Prerequisites

Before running the application, ensure you have:

- Node.js 22.12 or later (Node.js 22 recommended)
- npm
- Git
- Required environment variables and access to the appropriate backend services

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Sur-Drive/Frontend.git
cd Frontend
```

Repository access may require authorization if the repository is private.

### 2. Install dependencies

```bash
npm ci
```

Use `npm ci` for reproducible installation based on the committed lockfile.

### 3. Configure environment variables

Create a local `.env` file using the project's approved environment-variable template.

```bash
cp .env.example .env
```

On Windows Command Prompt:

```cmd
copy .env.example .env
```

Update the values with the configuration supplied by the project team.

**Important security guidelines:**

- Never commit `.env`, `.env.backup`, or files containing secrets.
- Only expose browser-safe values using Vite's `VITE_` prefix.
- Do not place private API keys, service-account credentials, or authentication secrets in frontend environment variables.
- Remember that frontend environment variables included in the browser bundle are publicly inspectable.
- Coordinate credential rotation with the responsible service owners if credentials are exposed.

### 4. Start the development server

```bash
npm run dev
```

The development server is configured to use:

```text
http://localhost:3000
```

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Run TypeScript compilation and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |
| `npm audit` | Check installed dependencies for known vulnerabilities |

Note: The current lint configuration requires further cleanup before it can be used as a passing CI quality gate.

## Application Features

### Passenger Authentication

The frontend provides passenger-facing authentication interfaces and interacts with the backend authentication services.

Authentication and session handling must follow the approved backend security architecture.

### Ride Booking

Passenger-facing ride-booking interfaces support the application's transportation workflows.

### Maps and Location

Google Maps integration provides map-related functionality used by the passenger application, including ride and route visualization.

Map functionality depends on valid configuration, network availability, browser permissions where applicable, and the corresponding service integrations.

### Ride Tracking

The frontend includes ride-tracking functionality for updating and displaying ride-related information.

### Progressive Web App

SurDrive includes PWA capabilities using `vite-plugin-pwa` and a custom Workbox service worker.

The project uses the `injectManifest` strategy with a service worker maintained at:

```text
src/sw.ts
```

The production build generates the service worker at:

```text
dist/sw.js
```

PWA behavior should be tested in a production preview or HTTPS deployment rather than relying exclusively on the development server.

## Project Structure

Selected project directories and files:

```text
surdrive-frontend/
├── public/                  # Public static assets
├── src/
│   ├── components/          # Shared UI and map components
│   │   └── map/
│   ├── Rider/               # Passenger-related functionality
│   └── sw.ts                # Custom service worker
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

This is a simplified overview rather than an exhaustive directory tree.

## Production Build

Generate the production build:

```bash
npm run build
```

The build performs TypeScript compilation followed by Vite bundling.

Production output is written to:

```text
dist/
```

To preview it:

```bash
npm run preview
```

The default preview URL is:

```text
http://localhost:4173
```

## Deployment

The application can be deployed to a hosting provider that supports static frontend applications and SPA routing.

Deployment requirements include:

- Running `npm ci` to install locked dependencies.
- Running `npm run build`.
- Publishing the `dist` directory.
- Configuring SPA fallback routing where required.
- Supplying the approved production environment configuration.
- Ensuring API access, HTTPS, and service-worker functionality are correctly configured.

The final hosting platform and production deployment URL should be documented once confirmed by the project team.

## Security Practices

Contributors must follow these guidelines:

1. Do not commit credentials, secrets, or private environment files.
2. Avoid exposing authentication tokens in application logs or browser-accessible storage.
3. Validate authentication and authorization on the backend.
4. Do not assume client-side route protection replaces server-side access controls.
5. Avoid logging sensitive passenger information.
6. Review dependency advisories and update vulnerable packages.
7. Follow the backend team's approved session and cookie-handling requirements.
8. Review and test changes affecting authentication, location, or ride tracking before deployment.

### Dependency Security

The project has undergone dependency remediation, including updates to Vite, its React integration, PWA tooling, and transitive dependencies.

At the time of the latest dependency installation, npm reported zero known vulnerabilities. This result is time-dependent and should be rechecked regularly.

## Testing and Quality Assurance

Before merging changes, contributors should run:

```bash
npm run build
npm run lint
npm audit
```

Known lint issues are being addressed incrementally.

Changes to critical passenger flows should also be tested manually, including:

- Passenger login and session handling
- Ride-booking navigation
- Google Maps integration
- Ride-tracking updates
- PWA installation and service-worker registration
- Mobile responsiveness

Automated test and CI workflows should be documented here when implemented.

## Contribution Workflow

1. Create a feature or fix branch from the team's approved base branch.
2. Make focused changes.
3. Run the applicable validation commands.
4. Verify affected passenger flows.
5. Commit changes with a descriptive message.
6. Open a pull request for review.
7. Merge only after required reviews and checks are complete.

Security-sensitive changes should be coordinated with the relevant backend or infrastructure owners.

## Documentation Maintenance

Update this README when:

- Dependencies or build commands change.
- Environment configuration changes.
- New major features are introduced.
- Deployment procedures change.
- Authentication or security architecture is updated.
- CI and automated testing are implemented.

## License

License and distribution terms are subject to confirmation by the SurDrive project owners.
