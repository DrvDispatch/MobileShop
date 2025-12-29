# Mobile Device Shop

A full-stack e-commerce + repair service website for a physical mobile device shop.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Next.js 15    │────▶│    NestJS 10    │────▶│  PostgreSQL 16  │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│   Port: 3000    │     │   Port: 3001    │     │   Port: 5432    │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │     MinIO       │
                        │  (S3 Storage)   │
                        │  Port: 9000     │
                        │                 │
                        └─────────────────┘
```

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js + React | 15.x / 19.x |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui | Latest |
| Backend | NestJS | 10.x |
| Database | PostgreSQL | 16.x |
| ORM | Prisma | 6.x |
| Storage | MinIO | Latest |
| Payments | Stripe | Latest |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm (recommended) or npm

### 1. Start Infrastructure

```bash
# Start PostgreSQL and MinIO
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env

# Run database migrations
pnpm prisma migrate dev

# Seed database
pnpm prisma db seed

# Start development server
pnpm dev
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local

# Start development server
pnpm dev
```

### 4. Access Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| MinIO Console | http://localhost:9003 |
| API Docs (Swagger) | http://localhost:3001/api/docs |
| Prisma Studio | Run `pnpm prisma:studio` |

## Seed Data

The database is seeded with:

| Type | Data |
|------|------|
| **Admin User** | admin@mobileshop.com / admin123 |
| **Staff User** | staff@mobileshop.com / staff123 |
| **Categories** | Phones, Parts, Accessories |
| **Products** | Pixel 8 Pro, iPhone 15 Pro, Samsung S24 Ultra, etc. |
| **Repair Services** | Screen replacement, battery replacement, diagnostics, etc. |

## Project Structure

```
mobile-shop/
├── frontend/                 # Next.js 15 application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities & API client
│   │   └── stores/          # Zustand state stores
│   └── package.json
│
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── orders/
│   │   │   ├── repairs/
│   │   │   └── storage/
│   │   ├── common/          # Shared utilities
│   │   └── prisma/          # Database schema
│   └── package.json
│
├── docker-compose.yml        # PostgreSQL + MinIO
└── README.md
```

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://mobileshop:mobileshop_secret@localhost:5432/mobileshop"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin123"
MINIO_BUCKET_PRODUCTS="products"
MINIO_BUCKET_REPAIRS="repairs"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_MINIO_URL="http://localhost:9000"
```

## License

Private - All rights reserved
