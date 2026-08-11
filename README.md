# Double Shot

![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.3.3-06B6D4?logo=tailwindcss)

A modern, high-performance web application built with cutting-edge web technologies. Double Shot combines the power of Next.js 16 with React 19, delivering a fast, responsive, and engaging user experience.

**Live Demo:** [https://v0-double-shot.vercel.app](https://v0-double-shot.vercel.app)

## Project Overview

Double Shot is a sophisticated web application showcasing modern frontend development practices using the latest versions of Next.js, React, and TypeScript. The project demonstrates best practices in component architecture, styling, and performance optimization.

## Features

-  **High Performance** - Next.js 16 with App Router for optimized performance
-  **Modern UI** - React 19 with shadcn/ui and Base UI components
-  **Type Safe** - Full TypeScript support with strict mode enabled
-  **Utility-First Styling** - Tailwind CSS 4 with PostCSS for powerful customization
-  **Component Libraries** - Multiple UI component solutions for flexibility
-  **Analytics** - Vercel Analytics integration for performance monitoring
-  **Production Ready** - Optimized build configuration for deployment

## Tech Stack

### Core Framework
- **Next.js 16.3.0** - React framework for production
- **React 19** - Modern JavaScript library for building user interfaces
- **TypeScript 5.7.3** - Strongly typed JavaScript for safer code

### Styling & UI Components
- **Tailwind CSS 4.3.3** - Utility-first CSS framework
- **Base UI 1.5.0** - Unstyled, accessible React components
- **shadcn 4.8.0** - High-quality, reusable React components
- **Lucide React 1.16.0** - Beautiful, consistent icon library

### Utilities & Helpers
- **Class Variance Authority 0.7.1** - Type-safe component variants
- **Tailwind Merge 3.3.1** - Intelligent Tailwind CSS class merging
- **clsx 2.1.1** - Conditional className utility
- **tw-animate-css 1.4.0** - Animation utility library

### Analytics & Monitoring
- **Vercel Analytics 1.6.1** - Performance monitoring and insights

### Development Tools
- **PostCSS 8.5** - CSS transformations and plugins
- **pnpm** - Fast, disk-space-efficient package manager

## Project Structure

```
double-shot/
├── app/                  # Next.js App Router pages and layouts
├── components/           # Reusable React components
├── lib/                  # Utility functions and helpers
├── public/               # Static assets
├── styles/               # Global styles and Tailwind configuration
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **pnpm** (recommended) or npm/yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/TahiraNawab123/double-shot.git
cd double-shot

# Install dependencies with pnpm
pnpm install

# Or use npm
npm install

# Or use yarn
yarn install
```

### Development

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The application supports **Hot Module Replacement (HMR)** — edit files and see changes instantly without page refresh.

### Linting

Run the linter to check code quality:

```bash
pnpm lint
```

## Production Build

Build the application for production:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

The build process creates an optimized production bundle with automatic CSS purging and code splitting.

## Environment Variables

This project does not require environment variables for local development. However, when deploying to production, ensure all necessary environment variables are configured in your deployment platform.

## Styling & Theming

This project uses **Tailwind CSS 4** with **PostCSS** for powerful, maintainable styling:

- **Utility-First Approach** - Rapid UI development using predefined utility classes
- **Dynamic Theming** - Easy customization and theme switching
- **Optimized Output** - Automatic purging of unused styles in production
- **Responsive Design** - Mobile-first responsive design built-in

Component styling leverages **Class Variance Authority** for type-safe variant management and **Tailwind Merge** for intelligent class merging, ensuring clean and maintainable component code.

## Configuration

- **TypeScript** - Strict mode enabled with path aliases (`@/*` maps to project root)
- **Next.js** - Configured with App Router for modern React patterns
- **PostCSS 8** - Advanced CSS transformations and optimizations
- **Tailwind CSS 4** - Latest features and performance optimizations

## Deployment

This project is optimized for deployment on **Vercel**, the platform built for Next.js applications:

1. Connect your GitHub repository to Vercel
2. Vercel automatically detects Next.js configuration
3. Deploy with a single click or push to your main branch
4. Built-in analytics and performance monitoring

**Live Application:** [https://v0-double-shot.vercel.app](https://v0-double-shot.vercel.app)

## Package Management

This project uses **pnpm** for faster, more efficient package management:

```bash
# Install all dependencies
pnpm install

# Add a new package
pnpm add package-name

# Update packages
pnpm update

# Remove a package
pnpm remove package-name
```

**Benefits of pnpm:**
- Faster installation times
- Disk space efficiency with hard linking
- Strict dependency resolution
- Support for monorepos (if needed in future)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Explore Next.js features, API routes, and best practices
- [React 19 Documentation](https://react.dev) - Learn about React's latest features and hooks
- [Tailwind CSS Docs](https://tailwindcss.com/docs) - Comprehensive styling guide
- [TypeScript Handbook](https://www.typescriptlang.org/docs) - Master TypeScript for type safety
- [shadcn/ui Components](https://ui.shadcn.com) - Pre-built, accessible components
- [Base UI Documentation](https://base-ui.com) - Unstyled component documentation
- [Vercel Documentation](https://vercel.com/docs) - Deployment and hosting guide
