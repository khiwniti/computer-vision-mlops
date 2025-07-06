# Asphalt Logistics Management Platform

## Overview

This is a comprehensive fleet management system for truck logistics with real-time tracking, CCTV monitoring, and business intelligence capabilities. The application is built as a full-stack web application using React for the frontend and Express.js for the backend, with real-time communication via WebSockets.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Real-time**: WebSocket connection for live updates
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket server for live data streaming
- **Development**: tsx for TypeScript execution
- **Production**: esbuild for bundling

## Key Components

### Data Models
- **Trucks**: Vehicle tracking with GPS coordinates, status, and KPI metrics
- **Drivers**: Driver management with performance scoring and licensing
- **Vendors**: Third-party service provider integration with API management
- **Cameras**: CCTV system integration for video monitoring
- **Geofences**: Geographic boundary management for alerts
- **Alerts**: Real-time notification system for violations and incidents
- **Trips**: Route and journey tracking
- **Users**: Authentication and user management

### Core Features
1. **Real-time Dashboard**: Live KPI monitoring and fleet overview
2. **Live Tracking**: GPS-based vehicle monitoring with interactive maps
3. **CCTV Monitor**: Multi-camera video feed management
4. **Driver Management**: Performance tracking and licensing
5. **Vendor Management**: Third-party API integration
6. **Geofencing**: Virtual boundary alerts and monitoring
7. **Analytics**: Business intelligence and reporting
8. **Alert System**: Real-time notifications for critical events

### UI Components
- **Sidebar Navigation**: Persistent navigation with active state management
- **Interactive Maps**: Leaflet.js integration for geographic visualization
- **Real-time Updates**: WebSocket-driven live data refresh
- **Form Management**: React Hook Form with Zod validation
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Data Flow

### Real-time Updates
1. Backend services emit events via WebSocket server
2. Frontend establishes WebSocket connection on load
3. Real-time data updates trigger UI refreshes
4. Critical alerts display immediate notifications

### API Communication
1. Frontend uses TanStack Query for server state management
2. RESTful API endpoints for CRUD operations
3. Automatic query invalidation for real-time consistency
4. Error handling with toast notifications

### Database Operations
1. Drizzle ORM provides type-safe database access
2. PostgreSQL for persistent data storage
3. Connection pooling for performance optimization
4. Migration system for schema management

## External Dependencies

### Database
- **PostgreSQL**: Primary database with Neon serverless hosting
- **Drizzle ORM**: Type-safe query builder and migration system
- **Connection**: Environment-based DATABASE_URL configuration

### Maps & Visualization
- **Leaflet.js**: Interactive mapping capabilities
- **OpenStreetMap**: Tile provider for map visualization
- **Dynamic Loading**: Runtime script injection for maps

### UI Framework
- **shadcn/ui**: Comprehensive component library
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first styling system
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the stack
- **ESBuild**: Production bundling for backend
- **Replit Integration**: Development environment support

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx with automatic TypeScript compilation
- **Database**: Push schema changes with `db:push`
- **Real-time**: WebSocket server integrated with HTTP server

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Static Assets**: Served from Express in production
- **Environment**: NODE_ENV-based configuration

### Database Management
- **Schema**: Defined in `shared/schema.ts`
- **Migrations**: Generated to `./migrations`
- **Seeding**: Development data seeding capability
- **Connection**: Environment variable configuration

## Changelog

```
Changelog:
- July 05, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```