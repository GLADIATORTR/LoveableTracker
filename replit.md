# Real Estate Financials - Version AA104

## Overview

Real Estate Financials is a comprehensive investment management platform providing intelligent property tracking, financial analysis, and portfolio optimization. It offers advanced TimeSeries projections with inflation adjustment, country-specific global settings, CSV import capabilities, detailed investment performance analysis, and real-time market trend mood indicators. The platform combines professional-grade financial modeling with market sentiment analysis to facilitate informed decisions and portfolio growth.

## Recent Changes (Version AA104)
- Fixed sidebar button label visibility and created automatic version management system

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is a modern React-based Single-Page Application (SPA) using TypeScript, Wouter for routing, and TanStack Query for server state management. It leverages Radix UI components with shadcn/ui for an accessible design system, and Tailwind CSS for styling. Vite is used for fast development and optimized builds, adhering to a component-based architecture with shared UI components, custom hooks, and context providers.

### Backend Architecture
The server implements a RESTful API using Express.js with TypeScript. It follows a layered architecture, abstracting routes and storage. API endpoints are organized by resource, and the system includes centralized error handling and JSON body parsing. An interface-based storage abstraction ensures flexible data layer implementations.

### Database Design
The application uses PostgreSQL with Drizzle ORM for type-safe database operations. The relational schema includes tables for users, categories, assets, dictionary entries, and activities, with proper indexing and foreign key relationships. Drizzle Kit is used for schema migrations.

### Authentication & Authorization
A basic user system is implemented with user profiles and session management via Express sessions, stored in PostgreSQL. The architecture is designed to be extensible for future authentication mechanisms.

### State Management Strategy
A hybrid approach combines TanStack Query for server state caching and synchronization, React Context for client-side UI state (e.g., user preferences, sidebar), and Local Storage for persistent UI preferences. IndexedDB provides offline data caching and pending action queuing, supporting an offline-first strategy.

### Progressive Web App (PWA) Features
The application includes comprehensive PWA capabilities: an advanced Service Worker for static asset and API response caching, full offline functionality, native-like installation, and background sync for offline actions. Intelligent cache invalidation and real-time network status monitoring are also implemented.

### Data Import/Export System
The platform offers robust data management with JSON and CSV export functionality. A file-based import system supports bulk asset creation, featuring Zod schema validation for data integrity and detailed error reporting.

## External Dependencies

### Core Framework Dependencies
- `@tanstack/react-query`: Server state management
- `wouter`: Client-side routing
- `react-hook-form`: Form management
- `@hookform/resolvers`: Form validation resolvers

### Database & Backend
- `@neondatabase/serverless`: PostgreSQL connection
- `drizzle-orm`: ORM for database operations
- `drizzle-kit`: Database migration tools
- `connect-pg-simple`: PostgreSQL session store

### UI Component Library
- `@radix-ui/react-*`: Accessible UI primitives
- `tailwindcss`: CSS framework
- `class-variance-authority`: Component variant management
- `cmdk`: Command palette
- `embla-carousel-react`: Carousel functionality

### Validation & Utilities
- `zod`: Runtime type validation
- `drizzle-zod`: Drizzle ORM and Zod integration
- `date-fns`: Date manipulation utilities
- `clsx`: Conditional className utility
- `lucide-react`: Icon library

### Development Tools
- `@vitejs/plugin-react`: Vite plugin for React
- `@replit/vite-plugin-runtime-error-modal`: Development error overlay
- `@replit/vite-plugin-cartographer`: Replit-specific development tooling
- `tsx`: TypeScript execution
- `esbuild`: Fast JavaScript bundler