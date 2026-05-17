# ⚡ TaskFlow - Team Task Manager (MERN Stack)

A full-stack web app for managing projects and tasks with role-based access (Admin/Member).

---

## 🚀 Features

- ✅ Authentication (Signup / Login with JWT)
- ✅ Project creation & management
- ✅ Role-based access (Admin / Member)
- ✅ Task creation, assignment & status tracking (Kanban: Todo → In Progress → Done)
- ✅ Dashboard with stats, overdue tasks, progress bars
- ✅ Member management (add/remove members)
- ✅ Overdue task detection
- ✅ Priority levels (Low / Medium / High)
- ✅ RESTful APIs with proper validation

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas) |
| Auth | JWT + bcryptjs |
| Styling | Custom CSS (no UI library) |
| Deployment | Railway |

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── models/         # User, Project, Task schemas
│   ├── routes/         # auth, projects, tasks, users
│   ├── middleware/     # JWT auth middleware
│   ├── server.js       # Entry point
│   └── .env.example    # Environment variables template
├── frontend/
│   ├── public/
│   └── src/
│       ├── context/    # AuthContext (global state)
│       ├── pages/      # Login, Register, Dashboard, ProjectList, ProjectDetail
│       ├── components/ # Layout (Sidebar)
│       ├── utils/      # Axios API instance
│       └── index.css   # Global styles
└── README.md
```

---

## ⚙️ LOCAL SETUP (Step by Step)

### Prerequisites
Make sure these are installed on your PC:
1. **Node.js** (v18 or higher) → https://nodejs.org
2. **Git** → https://git-scm.com
3. **VS Code** → https://code.visualstudio.com

---

### Step 1: Clone / Download the Project

Open VS Code Terminal (`` Ctrl + ` ``) and run:
```bash
# If you have the zip, extract it and open the folder in VS Code
# Or if you pushed to GitHub:
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
```

---

### Step 2: Setup MongoDB Atlas (Free Database)

1. Go to **https://cloud.mongodb.com**
2. Sign up / Log in → Create a **free M0 cluster**
3. Click **"Connect"** → **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
   ```
5. Add your database name at the end:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taskmanager?retryWrites=true&w=majority
   ```
6. In **Network Access** → Add IP **0.0.0.0/0** (Allow all IPs)

---

### Step 3: Setup Backend

In VS Code terminal:
```bash
cd backend
npm install
```

Create your `.env` file:
```bash
# In the backend folder, create a file named .env (not .env.example)
```

Open `.env` and paste this (fill in YOUR values):
```env
PORT=5000
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/taskmanager?retryWrites=true&w=majority
JWT_SECRET=mysupersecretkey123456789abcdef
NODE_ENV=development
```

Start the backend:
```bash
npm run dev
```
✅ You should see: `MongoDB connected` and `Server running on port 5000`

---

### Step 4: Setup Frontend

Open a **new terminal** (`` Ctrl + Shift + ` ``):
```bash
cd frontend
npm install
npm start
```
✅ Browser opens at **http://localhost:3000**

---

### Step 5: Test the App

1. Go to `http://localhost:3000/register`
2. Create an account
3. Create a project
4. Add tasks
5. Register another account in incognito → get added as member

---

## 🌐 DEPLOYMENT ON RAILWAY

### Step 1: Push to GitHub

```bash
# In the root taskflow folder:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

### Step 2: Deploy Backend on Railway

1. Go to **https://railway.app** → Sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repo → Set **Root Directory** to `backend`
4. Add Environment Variables:
   - `MONGO_URI` = your Atlas URI
   - `JWT_SECRET` = your secret key
   - `NODE_ENV` = production
   - `FRONTEND_URL` = (your frontend URL, add after deploying frontend)
5. Railway auto-detects Node.js and deploys. Copy the backend URL.

### Step 3: Deploy Frontend on Railway

1. Click **"New Service"** in same project → **"GitHub Repo"** → same repo
2. Set **Root Directory** to `frontend`
3. Add Environment Variable:
   - `REACT_APP_API_URL` = your backend Railway URL (e.g. `https://taskflow-backend.up.railway.app`)
4. Build command: `npm run build`
5. Start command: `npx serve -s build -l $PORT`

### Step 4: Update Backend FRONTEND_URL

Go back to backend service → Variables → Set:
- `FRONTEND_URL` = your frontend Railway URL

---

## 📋 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/projects` | ✅ | Any |
| POST | `/api/projects` | ✅ | Any |
| GET | `/api/projects/:id` | ✅ | Member+ |
| PUT | `/api/projects/:id` | ✅ | Admin |
| DELETE | `/api/projects/:id` | ✅ | Admin |
| POST | `/api/projects/:id/members` | ✅ | Admin |
| DELETE | `/api/projects/:id/members/:userId` | ✅ | Admin |

### Tasks
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/tasks?project=:id` | ✅ | Member+ |
| GET | `/api/tasks/dashboard` | ✅ | Any |
| POST | `/api/tasks` | ✅ | Admin |
| PUT | `/api/tasks/:id` | ✅ | Admin or Assignee |
| DELETE | `/api/tasks/:id` | ✅ | Admin |

---

## 🔑 Role-Based Access Summary

| Action | Admin | Member |
|--------|-------|--------|
| View project | ✅ | ✅ |
| Create task | ✅ | ❌ |
| Edit any task | ✅ | ❌ |
| Update own task status | ✅ | ✅ |
| Delete task | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Delete project | ✅ | ❌ |

---

## 👨‍💻 Author

Built for the Team Task Manager Full-Stack Assignment.
