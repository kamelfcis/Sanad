# Phase 0 — Project Setup

## Goal
Initialize the Next.js project with all tooling, linting, Supabase client, and TailwindCSS configured. Empty repo → bootable dev environment.

---

## Tasks

### 0.1 Initialize Next.js
- Create Next.js 14+ app with TypeScript, App Router, Turbopack
- `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir`

### 0.2 Install Dependencies
| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Supabase client |
| `@supabase/ssr` | Supabase server-side rendering helpers |
| `@supabase/auth-ui-react` | Prebuilt auth UI |
| `@supabase/auth-ui-shared` | Auth UI themeing |
| `@radix-ui/*` | ShadCN UI primitives |
| `tailwindcss-animate` | Tailwind animation utilities |
| `class-variance-authority` | CVA for component variants |
| `clsx` | Conditional classes |
| `tailwind-merge` | Merge tailwind classes |
| `lucide-react` | Icons |
| `zustand` | State management |
| `@tanstack/react-query` | Server state |
| `framer-motion` | Animations (install now, use in Phase 10) |
| `date-fns` | Date formatting |
| `zod` | Validation |
| `react-hook-form` | Forms |
| `@hookform/resolvers` | Zod resolver for RHF |
| `prettier` | Code formatting |
| `prettier-plugin-tailwindcss` | Sort tailwind classes |

### 0.3 Configure TailwindCSS
- Set up custom design tokens (colors matching Sanad brand)
- Configure `tailwind.config.ts` with ShadCN preset
- Add `globals.css` with CSS variables

### 0.4 Configure ESLint + Prettier
- Extend Next.js ESLint config
- Add Prettier config with tailwind plugin
- Format on save settings

### 0.5 Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_R2_PUBLIC_URL=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
NEXT_PUBLIC_APP_URL=
```

### 0.6 Supabase Client Setup
- `src/lib/supabase/client.ts` — Browser client
- `src/lib/supabase/server.ts` — Server client (cookies)
- `src/lib/supabase/middleware.ts` — Middleware client

### 0.7 Project Structure
Create all directories:

```
src/
  app/
    (auth)/
    (customer)/
    (technician)/
    (admin)/
    api/
  components/
    ui/          # ShadCN
    shared/
  lib/
    supabase/
    r2/
    utils/
  hooks/
  store/
  types/
```

### 0.8 ShadCN UI Init
- Run `npx shadcn@latest init`
- Add base components: Button, Input, Card, Avatar, Badge, Dialog, Sheet, DropdownMenu, Select, Skeleton, Toast, Form, Label, Separator

### 0.9 Base Layout
- Root layout with metadata
- Inter font
- Providers wrapper (React Query, Zustand)

---

## Checklist

- [ ] `npm run dev` starts without error
- [ ] Tailwind classes work
- [ ] ShadCN components render
- [ ] Supabase client connects
- [ ] ESLint passes
- [ ] Prettier formats correctly
- [ ] All directories exist
- [ ] Environment variables template created

## Done Definition
- [ ] `npm run dev` → blank page with "Sanad" header
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Project boots in < 10 seconds
