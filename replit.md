# Asset Tracker

## Overview

Real Estate Investment Tracker is a comprehensive investment management platform featuring intelligent property tracking, financial analysis, and portfolio optimization tools. The application provides advanced TimeSeries projections with inflation adjustment, country-specific global settings, CSV import capabilities, and detailed investment performance analysis. Built with a modern full-stack architecture using React, Express, and PostgreSQL, it offers professional-grade financial modeling and projection tools for real estate investors.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### TimeSeries Projections & Global Settings (August 2025)
Completed advanced financial projection features matching user's reference screenshot:
- Renamed "Reports" to "TimeSeries Projections" for clearer functionality description
- Added property dropdown selector for individual property analysis
- Detailed financial metrics table with 12 projection rows:
  * Market Value projections over time
  * Remaining mortgage term calculations
  * Interest rate tracking
  * Outstanding balance projections
  * Capital Gains Tax calculations (using global country settings)
  * Selling Costs calculations (using global country settings)
  * Net Equity projections (both nominal and present value)
  * Cumulative Net Yield calculations
  * Cumulative Mortgage Payment tracking
  * Net Gain projections
- Time series columns: Y0, Y1, Y2, Y3, Y4, Y5, Y10, Y15, Y25, Y30
- Inflation adjustment toggle to convert values to today's dollars
- Global Settings dialog for country-specific financial parameters
- Properties inherit rates like Real Estate Appreciation, Inflation, Capital Gains Tax from country settings
- Support for multiple countries (USA, Turkey, Canada, UK) with realistic default rates

### PWA Implementation (August 2025)  
Added Progressive Web App capabilities with comprehensive offline support:
- Service Worker for caching and offline functionality
- Web App Manifest for installable app experience
- Offline storage using IndexedDB for data persistence
- Install prompt with user-friendly interface
- Network status indicator with offline mode alerts
- Enhanced query client with offline-first strategy

### TimeSeries Projections & Global Settings (August 2025)
Enhanced reporting capabilities with advanced financial modeling:
- Renamed "Reports" to "TimeSeries Projections" for clarity
- Inflation adjustment toggle to convert values to today's dollars
- Global Settings dialog for country-specific financial parameters
- Country-based inheritance of rates (Real Estate Appreciation, Inflation, etc.)
- Support for USA, Turkey, Canada, and UK with customizable parameters
- Persistent settings storage with localStorage integration
- Dynamic projection calculations using global country settings

## System Architecture

### Frontend Architecture
The client uses a modern React-based single-page application (SPA) architecture:

- **Framework**: React with TypeScript for type safety and better developer experience
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Radix UI components with shadcn/ui for consistent, accessible design system
- **Styling**: Tailwind CSS with custom CSS variables for theming and design tokens
- **Build Tool**: Vite for fast development and optimized production builds

The application follows a component-based architecture with shared UI components, custom hooks for data fetching, and context providers for global state management.

### Backend Architecture
The server implements a RESTful API using Express.js:

- **Framework**: Express.js with TypeScript for robust server-side development
- **Architecture Pattern**: Layered architecture with separate route handlers and storage abstraction
- **API Design**: RESTful endpoints organized by resource (assets, categories, dictionary, dashboard)
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Request Processing**: JSON body parsing with URL-encoded form data support

The backend uses an interface-based storage abstraction pattern, allowing for flexible data layer implementations while maintaining consistent business logic.

### Database Design
The application uses PostgreSQL with Drizzle ORM for type-safe database operations:

- **ORM**: Drizzle ORM for schema definition and query building
- **Schema Design**: Relational model with categories, assets, dictionary entries, users, and activities
- **Data Types**: Support for JSON fields for flexible metadata storage (specifications, preferences)
- **Relationships**: Foreign key relationships between assets/dictionary entries and categories
- **Migrations**: Drizzle Kit for database schema migrations and version control

Key tables include users, categories, assets, dictionary entries, and activities with proper indexing and constraints.

### Authentication & Authorization
Currently implements a basic user system:

- **User Management**: User profiles with preferences and role information
- **Session Handling**: Express session management with PostgreSQL session store
- **Future-Ready**: Architecture supports extensible authentication mechanisms

### State Management Strategy
The application uses a hybrid approach to state management:

- **Server State**: TanStack Query for API data caching, synchronization, and background updates
- **Client State**: React Context for user preferences, sidebar state, and global UI state
- **Local Storage**: Persistent storage for user preferences and UI state
- **Real-time Updates**: Query invalidation patterns for data consistency
- **Offline Storage**: IndexedDB for offline data caching and pending action queuing

### Progressive Web App (PWA) Features
Comprehensive PWA implementation with offline-first approach:

- **Service Worker**: Advanced caching strategy with static asset caching and API response caching
- **Offline Support**: Full application functionality when disconnected from internet
- **Installation**: Native app-like installation on desktop and mobile devices
- **Background Sync**: Queues offline actions for synchronization when connection returns
- **Cache Management**: Intelligent cache invalidation and cleanup for optimal performance
- **Network Detection**: Real-time network status monitoring with user notifications

### Data Import/Export System
Comprehensive data management capabilities:

- **Export Formats**: JSON and CSV export functionality for all data types
- **Import Support**: File-based import system for bulk asset creation
- **Data Validation**: Zod schema validation for imported data integrity
- **Error Handling**: Detailed error reporting for import/export operations

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing
- **react-hook-form**: Form state management and validation
- **@hookform/resolvers**: Form validation resolvers

### Database & Backend
- **@neondatabase/serverless**: PostgreSQL connection with Neon serverless support
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migration and schema management tools
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### UI Component Library
- **@radix-ui/react-***: Comprehensive set of accessible, unstyled UI primitives
- **tailwindcss**: Utility-first CSS framework for styling
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette implementation
- **embla-carousel-react**: Carousel component functionality

### Validation & Utilities
- **zod**: Runtime type validation for API schemas and form validation
- **drizzle-zod**: Integration between Drizzle ORM and Zod for schema validation
- **date-fns**: Date manipulation and formatting utilities
- **clsx**: Conditional className utility
- **lucide-react**: Icon library for consistent iconography

### Development Tools
- **@vitejs/plugin-react**: Vite plugin for React support
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling
- **tsx**: TypeScript execution environment for development
- **esbuild**: Fast JavaScript bundler for production builds

The application is designed to be easily deployable on Replit with development-specific plugins and configurations that enhance the coding experience while maintaining production readiness.