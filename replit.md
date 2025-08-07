# Asset Tracker

## Overview

Asset Tracker is a modern data management platform designed for professional asset tracking and organizational management. The application provides comprehensive tools for managing assets, maintaining a data dictionary, generating reports, and tracking activities across an organization. Built with a full-stack architecture using React, Express, and PostgreSQL, it offers a clean, professional interface with advanced search, filtering, and data visualization capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

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