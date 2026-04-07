# 🐧 Kali Linux Setup Guide — eAkhuwat Backend

## Prerequisites
- Kali Linux (ya koi bhi Linux distro)
- Internet connection

---

## Step 1: Node.js 20 Install Karo

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs
node -v   # v20.x dikhna chahiye
npm -v    # 10.x dikhna chahiye
```

---

## Step 2: PostgreSQL Install & Setup

```bash
# Install
sudo apt install -y postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Database create karo
sudo -u postgres psql -c "CREATE USER eakhuwat WITH PASSWORD 'eakhuwat123' SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE eakhuwat OWNER eakhuwat;"

# Test connection
psql -U eakhuwat -d eakhuwat -h localhost -c "SELECT 1;"
# Password: eakhuwat123
```

---

## Step 3: Git Clone & Setup

```bash
# Clone repo (apna GitHub URL daal)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

---

## Step 4: Frontend Setup

```bash
# Root folder me (jaha package.json hai)
npm install
```

---

## Step 5: Backend Setup

```bash
# Server folder me jao
cd server

# Dependencies install
npm install

# .env file banao
cp .env.example .env
```

Ab `.env` file edit karo:
```bash
nano .env
```

Ye values daalo:
```env
DATABASE_URL="postgresql://eakhuwat:eakhuwat123@localhost:5432/eakhuwat?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET=mera-super-secret-key-change-karo-production-me
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

Save karo: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## Step 6: Database Migrate & Seed

```bash
# Abhi bhi server/ folder me ho

# Prisma client generate
npx prisma generate

# Database tables create (migration)
npx prisma migrate dev --name init

# Seed data (6 plans insert honge)
npx ts-node prisma/seed.ts

# Database check karo (optional)
npx prisma studio
# Browser me http://localhost:5555 pe dikhega
```

---

## Step 7: Backend Start Karo

```bash
# server/ folder me
npm run dev
```

Output aayega:
```
🚀 eAkhuwat Backend running on port 5000
Environment: development
```

**Test karo:** Browser me `http://localhost:5000/health` kholo — `{"status":"ok"}` dikhna chahiye.

---

## Step 8: Frontend Start Karo

```bash
# Naya terminal kholo, root folder me jao
cd YOUR_REPO

# Frontend start
npm run dev
```

Browser me `http://localhost:5173` kholo — Dashboard dikhega with **green banner** "✅ Connected to backend"

---

## Step 9: Frontend ko Backend se Connect Karo

Root folder me `.env` file banao:
```bash
nano .env
```

Ye daalo:
```env
VITE_API_URL=http://localhost:5000/api
```

Frontend restart karo (`Ctrl+C` karke dobara `npm run dev`).

---

## 🔍 Quick Commands Cheat Sheet

| Kaam | Command |
|------|---------|
| Backend start | `cd server && npm run dev` |
| Frontend start | `cd .. && npm run dev` |
| Database GUI | `cd server && npx prisma studio` |
| New migration | `cd server && npx prisma migrate dev --name <name>` |
| Reset database | `cd server && npx prisma migrate reset` |
| Seed data | `cd server && npx ts-node prisma/seed.ts` |
| Check health | `curl http://localhost:5000/health` |
| Check plans API | `curl http://localhost:5000/api/plans` |

---

## ⚠️ Common Errors & Fixes

### Error: `ECONNREFUSED` PostgreSQL
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Error: `prisma migrate` fails
```bash
# Database URL check karo .env me
# PostgreSQL chal raha hai check karo
sudo systemctl restart postgresql
```

### Error: `MODULE_NOT_FOUND`
```bash
cd server && npm install
npx prisma generate
```

### Error: `CORS blocked`
`.env` me `CORS_ORIGIN=http://localhost:5173` hai check karo (frontend ka exact URL)

### Error: `JWT_SECRET` warning
Production me `.env` me strong random secret daalo:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📂 Folder Structure

```
YOUR_REPO/
├── src/                    # Frontend (React + Vite)
│   ├── lib/api.ts          # API calls to backend
│   ├── hooks/useApi.ts     # React Query hooks
│   ├── contexts/AuthContext.tsx  # Auth state
│   └── components/         # UI components
├── server/                 # Backend (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Plan seed data
│   ├── src/
│   │   ├── index.ts        # Server entry + routes
│   │   ├── config.ts       # Environment config
│   │   ├── middleware/auth.ts  # JWT + Admin auth
│   │   ├── controllers/
│   │   │   ├── authController.ts    # Login/signup
│   │   │   ├── planController.ts    # Plans + enrollment
│   │   │   ├── userController.ts    # Profile, transactions, tree
│   │   │   └── adminController.ts   # Admin panel APIs
│   │   └── utils/
│   │       ├── commissionLogic.ts   # 7-level commission
│   │       ├── flushoutLogic.ts     # Flushout processing
│   │       ├── incentiveLogic.ts    # Club/individual rewards
│   │       ├── eip712.ts            # Withdrawal signatures
│   │       └── cronJobs.ts          # Auto flushout/incentive
│   ├── .env.example
│   └── package.json
├── .env                    # Frontend env (VITE_API_URL)
└── package.json            # Frontend dependencies
```

---

## ✅ Final Check

1. `http://localhost:5000/health` → `{"status":"ok"}`
2. `http://localhost:5000/api/plans` → 6 plans ka JSON
3. `http://localhost:5173` → Dashboard with green "Connected" banner
4. Prisma Studio → `http://localhost:5555` → Tables dikhein

**Sab green hai? 🎉 Backend live hai!**
