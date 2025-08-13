# Real Estate Financials

## Overview

Real Estate Financials is a comprehensive investment management platform featuring intelligent property tracking, financial analysis, and portfolio optimization tools. The application provides advanced TimeSeries projections with inflation adjustment, country-specific global settings, CSV import capabilities, and detailed investment performance analysis. Built with a modern full-stack architecture using React, Express, and PostgreSQL, it offers professional-grade financial modeling and projection tools for real estate investors.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### App Rebranding (August 2025)
Updated application name from "Asset Tracker" to "Real Estate Financials":
- **Frontend Display**: Updated TopBar component to show "Real Estate Financials" as fallback title
- **HTML Title**: Changed browser title to "Real Estate Financials - Professional Portfolio Management"
- **PWA Manifest**: Updated PWA app name to "Real Estate Financials" and short name to "RE Financials"
- **Version Tracking**: Added v2.1 to TimeSeries table header for cache-busting and version identification

### Database Implementation & Dummy User Account (August 2025)
Complete transition from memory storage to PostgreSQL database with dummy user system:
- **Database Migration**: Replaced MemStorage with DatabaseStorage using PostgreSQL and Drizzle ORM
- **Dummy User Account**: Created arinkeskin@gmail.com account with Real Estate Investor profile
- **Preloaded Properties**: Automatically imports 13 properties from user's CSV on first startup:
  * 10 Turkish properties (condos) with 12% appreciation rate
  * 3 US properties (single family) with 3.75%-2.5% interest rates and proper mortgage calculations
  * Maintains exact user CSV format: Property Name, Address, Purchase Price, Current Value, etc.
- **Dictionary Integration**: Added Dictionary button to TopBar for easy access to asset definitions
- **Data Persistence**: All property data now persists between sessions in PostgreSQL database
- **Automatic Initialization**: System creates default categories and dummy user on first startup

### Gradient-Powered Stats Cards & Modern UI (August 2025)
Implemented advanced micro-interactions and gradient-powered design system:
- **Stats Cards Enhancement**: Added gradient-powered cards with 6 color schemes (primary, success, warning, info, purple, cyan)
- **Micro-Interactions**: Implemented hover effects, press animations, shimmer effects, and floating orb decorations
- **Advanced CSS Animations**: Added 8 new animation keyframes for smooth transitions and engaging user feedback
- **Interactive Elements**: Cards respond to hover/press states with scale, rotation, and glow effects
- **Gradient System**: Dynamic border gradients, background overlays, and icon backgrounds with physics-based animations
- **Performance Optimized**: Using transform-gpu and will-change-transform for smooth 60fps animations
- **Future Projections Removal**: Cleaned up navigation by removing unused Future Projections page per user request

### Application Debugging & Restoration (August 2025)
Fixed critical application startup issues and restored full functionality:
- **Component Architecture**: Fixed missing theme provider and restored proper layout with functional Sidebar and TopBar
- **Type System**: Resolved TypeScript errors in dashboard stats interface and database storage layer
- **Database Queries**: Fixed SQL query issues and type mismatches in storage implementation
- **Navigation**: Restored proper routing with all pages accessible through sidebar navigation
- **User Interface**: Full functionality confirmed working in production environment with all 13 properties displaying correctly

### TimeSeries Projections & Calculation Fixes (August 2025)
Major improvements to financial projection accuracy and data consistency:
- **Property-Specific Appreciation Rates**: Added appreciationRate field to schema for individual property rates
- **Calculation Accuracy**: Fixed basis points conversion error (now correctly divides by 10000)
- **12 Hillcrest Corrections**: Set to 2% appreciation rate, Y1 Market Value now shows $1,275,000 (matches user's calculations exactly)
- Fixed all calculation errors in TimeSeries Projections:
  * Market Value: Uses property-specific rates when available, falls back to country defaults
  * Interest Rate: Displays 3.75% correctly (not 375.00%)
  * Outstanding Balance: Uses proper mortgage amortization formula
  * Capital Gains Tax: Correctly calculates as (Market Value - Purchase Price) × Tax Rate
  * Current Term: Shows months since loan start (not remaining term)
- Present Value calculations now use country-specific inflation rates for proper discounting
- Outstanding balance properly reduces year-over-year using financial amortization
- CSV import fixed to match user's exact 16-column format without reordering
- Fixed caching issue: Preview window and "open in new tab" now show identical live data
- React Query cache optimized: 30-second stale time, refetch on window focus

### PWA Implementation (August 2025)  
Added Progressive Web App capabilities with comprehensive offline support:
- Service Worker for caching and offline functionality
- Web App Manifest for installable app experience
- Offline storage using IndexedDB for data persistence
- Install prompt with user-friendly interface
- Network status indicator with offline mode alerts
- Enhanced query client with offline-first strategy

### Global Settings & Financial Modeling (August 2025)
Advanced country-specific financial parameter system:
- Global Settings dialog accessible via gear icon in TimeSeries page
- Country-based inheritance of rates (Real Estate Appreciation, Inflation, Capital Gains Tax, etc.)
- Support for USA, Turkey, Canada, and UK with realistic default rates
- Persistent settings storage with localStorage integration
- Dynamic projection calculations using global country settings
- Present value calculations using country-specific discount rates

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