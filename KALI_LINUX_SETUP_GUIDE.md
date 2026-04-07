# 🐧 Kali Linux Setup Guide — eAkhuwat (Backend + Socket.IO)

## Prerequisites
- Kali Linux (ya koi bhi Linux distro)
- Internet connection

---

## Step 1: Node.js 20 Install Karo

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs
node -v   # v20.x hona chahiye
npm -v    # 10.x hona chahiye
```

---

## Step 2: PostgreSQL Install & Setup

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Database & user create karo
sudo -u postgres psql -c "CREATE USER eakhuwat WITH PASSWORD 'eakhuwat123' SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE eakhuwat OWNER eakhuwat;"
```

---

## Step 3: Git Clone

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

---

## Step 4: Frontend Setup

```bash
npm install
```

Root folder me `.env` file banao:
```bash
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

---

## Step 5: Backend Setup

```bash
cd server
npm install
cp .env.example .env
nano .env
```

Ye values daalo `.env` me:
```env
DATABASE_URL="postgresql://eakhuwat:eakhuwat123@localhost:5432/eakhuwat?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET=mera-super-secret-key-change-karo-production-me
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

---

## Step 6: Database Migrate & Seed

```bash
# server/ folder me raho
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

---

## Step 7: Backend Start (with Socket.IO)

```bash
npm run dev
```

Output:
```
🚀 eAkhuwat Backend running on port 5000
🔌 Socket.IO ready for real-time connections
Environment: development
```

---

## Step 8: Frontend Start (naya terminal)

```bash
cd YOUR_REPO
npm run dev
```

Browser: `http://localhost:5173`

---

## 🔌 Socket.IO Features (Real-Time)

Backend start hote hi ye sab live ho jayega:

| Feature | Kaise Kaam Karta Hai |
|---------|---------------------|
| **Live Chat** | Messages instantly sab connected users ko dikhte hain |
| **Typing Indicator** | Jab koi type kar raha hai "Someone is typing..." dikhta hai |
| **Online Status** | Green dot jab user online, real-time update |
| **Reactions** | Emoji reactions real-time sync across all users |
| **Message Delete** | Delete hote hi sab users se hat jata hai |
| **Pin Messages** | Pin/unpin real-time broadcast |
| **DMs** | Direct messages instant delivery |
| **Room Join/Leave** | Room-level events broadcast |

### Socket.IO Architecture:
```
Frontend (React)                    Backend (Express)
     │                                    │
     │  socket.io-client ←→ socket.io     │
     │                                    │
  useSocket.ts                  socketHandler.ts
     │                                    │
  CommunityLounge.tsx              Prisma (PostgreSQL)
     │                                    │
  Real-time UI updates          Persistent message storage
```

### Connection Flow:
1. User login → JWT token milta hai
2. Socket.IO connect with JWT auth
3. Join rooms → receive real-time events
4. Messages DB me save + broadcast to room
5. Typing/presence events in-memory (no DB)

---

## 📂 New Files Added

### Backend:
```
server/
├── src/
│   ├── socket/
│   │   └── socketHandler.ts     # Socket.IO event handlers
│   ├── controllers/
│   │   └── chatController.ts    # REST API for rooms/messages
│   └── middleware/
│       └── auth.ts              # JWT + Admin middleware
└── prisma/
    └── schema.prisma            # +ChatRoom, ChatMessage, DirectMessage, MessageReaction models
```

### Frontend:
```
src/
├── hooks/
│   └── useSocket.ts             # Socket.IO React hook
├── lib/
│   └── api.ts                   # REST API service layer
├── contexts/
│   └── AuthContext.tsx           # Auth state management
└── components/
    └── CommunityLounge.tsx      # Updated with real-time integration
```

---

## 📊 Database Models (Chat)

| Model | Purpose |
|-------|---------|
| `ChatRoom` | Chat rooms (public/VIP) |
| `ChatRoomMember` | Room membership + roles |
| `ChatMessage` | Room messages with reply/pin/delete |
| `MessageReaction` | Emoji reactions on messages |
| `DirectMessage` | Private 1-to-1 messages |

---

## ⚡ Quick Commands

| Kaam | Command |
|------|---------|
| Backend start | `cd server && npm run dev` |
| Frontend start | `npm run dev` |
| Database GUI | `cd server && npx prisma studio` |
| New migration | `cd server && npx prisma migrate dev --name <name>` |
| Reset database | `cd server && npx prisma migrate reset` |
| Seed data | `cd server && npx ts-node prisma/seed.ts` |
| Check health | `curl http://localhost:5000/health` |
| Check plans | `curl http://localhost:5000/api/plans` |

---

## ⚠️ Troubleshooting

### PostgreSQL nahi chal raha
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Prisma migrate fail
```bash
# .env me DATABASE_URL check karo
sudo systemctl restart postgresql
npx prisma migrate reset   # WARNING: sab data delete hoga
```

### Socket.IO connect nahi ho raha
- `.env` me `CORS_ORIGIN=http://localhost:5173` check karo
- Backend chal raha hai check karo: `curl http://localhost:5000/health`
- Browser console me `🔌 Socket connected` dikhna chahiye
- Token chahiye login ke baad — pehle wallet connect karo

### MODULE_NOT_FOUND
```bash
cd server && npm install && npx prisma generate
```

---

## ✅ Final Check

1. `http://localhost:5000/health` → `{"status":"ok"}` ✅
2. `http://localhost:5000/api/plans` → 6 plans JSON ✅
3. `http://localhost:5173` → Dashboard green banner ✅
4. Community tab → "Live" badge chat header me ✅
5. 2 browsers kholo → ek me message bhejo → dusre me turant dikhe ✅

**Sab green? 🎉 Real-time community live hai!**
