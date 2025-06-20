# Lil Frankenstack

A monorepo containing a full-stack application with:
- **Backend**: NestJS authentication service (`nest-auth`)
- **Frontend**: Next.js application (`waypoint-app`)

## Tech Stack

- **Package Manager**: pnpm
- **Monorepo Tooling**: Turborepo
- **Backend**: NestJS, DrizzleORM
- **Frontend**: Next.js 15, React 19, TailwindCSS

## Project Structure

```
lil-frankenstack/
├── apps/                 # Application projects
│   ├── nest-auth/        # NestJS authentication backend
│   └── waypoint-app/     # Next.js frontend application
├── packages/             # Shared packages/libraries (to be added as needed)
├── package.json          # Root package.json
├── pnpm-workspace.yaml   # pnpm workspace configuration
└── turbo.json            # Turborepo configuration
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm (v9+)

### Installation

```bash
# Clone the repository
git clone https://gitlab.com/brian_lab_dev_group/lil-frankenstack.git
cd lil-frankenstack

# Install dependencies
pnpm install
```

### Development

To run both frontend and backend in development mode:

```bash
pnpm dev
```

To run a specific project:

```bash
# Run only the backend
pnpm --filter=nest-auth dev

# Run only the frontend
pnpm --filter=waypoint-app dev
```

### Building

To build all projects:

```bash
pnpm build
```

To build a specific project:

```bash
# Build only the backend
pnpm --filter=nest-auth build

# Build only the frontend
pnpm --filter=waypoint-app build
```

### Testing

```bash
# Run tests across all projects
pnpm test

# Run tests for a specific project
pnpm --filter=nest-auth test
pnpm --filter=waypoint-app test
```

## Adding Shared Packages

To create a shared package:

1. Create a new directory in the `packages` folder
2. Initialize a package.json in that directory
3. Add your shared code
4. Reference it from other projects using the package name
