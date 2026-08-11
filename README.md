# double-shot

A modern, high-performance web application built with cutting-edge web technologies. double-shot combines the power of Next.js 16 with React 19, delivering a fast, responsive, and engaging user experience.

**Live Demo:** [https://v0-double-shot.vercel.app](https://v0-double-shot.vercel.app)

## 🚀 Technologies

- **Framework:** [Next.js 16](https://nextjs.org) - React framework for production
- **UI Library:** [React 19](https://react.dev) - Modern JavaScript library for building user interfaces
- **Language:** [TypeScript 5.7](https://www.typescriptlang.org) - Strongly typed JavaScript for safer code
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com) - Utility-first CSS framework
- **UI Components:** 
  - [shadcn](https://ui.shadcn.com) - High-quality React components
  - [Base UI](https://base-ui.com) - Unstyled, accessible components
  - [Lucide React](https://lucide.dev) - Beautiful icon library
- **Utilities:**
  - [Class Variance Authority](https://cva.style) - Type-safe component variants
  - [Tailwind Merge](https://github.com/dcastil/tailwind-merge) - Merge Tailwind CSS classes
  - [clsx](https://github.com/lukeed/clsx) - Conditional className builder
- **Analytics:** [Vercel Analytics](https://vercel.com/analytics) - Performance monitoring and insights
- **Package Manager:** pnpm

## 📋 Getting Started

### Prerequisites

- Node.js 18+ (or compatible)
- pnpm (recommended) or npm/yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/TahiraNawab123/double-shot.git
cd double-shot

# Install dependencies
pnpm install
# or
npm install
# or
yarn install
```

### Development Server

Start the development server:

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The application supports hot module replacement (HMR) — edit files and see changes instantly without page refresh.

### Build for Production

```bash
pnpm build
pnpm start
```

### Linting

```bash
pnpm lint
```

## 📁 Project Structure

- `app/` - Next.js 16 App Router pages and layouts
- `components/` - Reusable React components
- `lib/` - Utility functions and helpers
- `public/` - Static assets
- `styles/` - Global styles and Tailwind CSS configuration

## 🎨 Styling & Theming

This project uses **Tailwind CSS 4** with **PostCSS** for powerful, maintainable styling:

- Utility-first approach for rapid UI development
- Support for dynamic theming and customization
- Optimized output with automatic purging of unused styles
- Responsive design built-in

Component styling leverages **Class Variance Authority** for type-safe variant management and **Tailwind Merge** for intelligent class merging.

## 🔧 Configuration

- **TypeScript:** Strict mode enabled with path aliases (`@/*` maps to project root)
- **Next.js:** Configured with App Router for modern React patterns
- **PostCSS 8:** For advanced CSS transformations
- **Tailwind CSS 4:** With latest features and optimizations

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Explore Next.js features, API routes, and best practices
- [React 19 Documentation](https://react.dev) - Learn about React's latest features and hooks
- [Tailwind CSS Docs](https://tailwindcss.com/docs) - Comprehensive styling guide
- [TypeScript Handbook](https://www.typescriptlang.org/docs) - Master TypeScript for type safety
- [shadcn/ui](https://ui.shadcn.com) - Pre-built, accessible components for your app

## 🚀 Deployment

This project is deployed on [Vercel](https://vercel.com), the platform optimized for Next.js applications.

To deploy your own version:

1. Push your code to GitHub
2. Import the repository on [Vercel](https://vercel.com/new)
3. Vercel will automatically detect Next.js and configure your project
4. Your site will be live at a Vercel URL

For production optimizations, Vercel provides:
- Automatic image optimization
- Edge caching for static assets
- Serverless function auto-scaling
- Analytics and monitoring

## 📦 Package Management

This project uses **pnpm** for faster, more efficient package management:

```bash
# Install all dependencies
pnpm install

# Add a new package
pnpm add package-name

# Update packages
pnpm update
```

pnpm provides:
- Faster installation times
- Disk space efficiency with hard linking
- Strict dependency resolution
- Support for monorepos (if needed in future)

## 📄 License

This project is private. All rights reserved.

## 👤 Author

Created by [@TahiraNawab123](https://github.com/TahiraNawab123)

---

**Happy coding!** 🎉
