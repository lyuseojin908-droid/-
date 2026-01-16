# Virtual Radical Sensor - Plasma Digital Twin

## Overview

This is an AI-based Virtual Radical Sensor system for semiconductor EUV etching process optimization. The application predicts plasma radical distribution in etching chambers using physics-informed AI, enabling quality prediction without direct measurement equipment.

The system takes process parameters (RF power, pressure, gas flows, pulse settings) as input and outputs:
- 2D radical density distribution heatmaps
- Quality metrics (etch uniformity, CD shift, defect risk)
- Process status classification (safe/warning/danger)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with React plugin

Key pages:
- Dashboard: Main prediction interface with parameter form, heatmap visualization, and metrics
- History: View and compare past predictions
- Docs: System documentation
- Help: FAQ and usage tips

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **Prediction Engine**: Physics-based plasma simulation generating radical distributions
- **Build Process**: esbuild for server bundling, Vite for client

API Endpoints:
- `GET /api/predictions` - Fetch all predictions
- `GET /api/predictions/:id` - Fetch single prediction
- `POST /api/predict` - Run new prediction with process parameters
- `DELETE /api/predictions` - Clear prediction history

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Validation**: Zod schemas with drizzle-zod integration
- **Current Storage**: In-memory storage implementation (database-ready schema exists)

### Physics Simulation
The prediction engine uses physics-based calculations including:
- Radial decay profiles (wall losses and diffusion)
- Vertical gradients (showerhead gas injection effects)
- Pulse mode modulation
- Gas flow ratio effects on radical distribution

## External Dependencies

### Database
- PostgreSQL (configured via `DATABASE_URL` environment variable)
- Drizzle Kit for schema migrations (`npm run db:push`)

### UI Component Dependencies
- Radix UI primitives (dialog, popover, tabs, etc.)
- Lucide React icons
- date-fns for date formatting
- class-variance-authority for component variants
- embla-carousel-react for carousel components

### Development Tools
- Replit-specific plugins for development (cartographer, dev-banner, error overlay)
- TypeScript with strict mode
- Path aliases: `@/` for client source, `@shared/` for shared code