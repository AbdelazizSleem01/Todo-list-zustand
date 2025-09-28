# 📝 Todo List Application

A modern, full-featured todo list application built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **MongoDB**.  
Features real-time sync, user authentication, due dates, priorities, and browser notifications.

---

## 🚀 Features

### 🔐 Authentication & User Management
- Secure User Registration & Login  
- Email-based authentication  
- Password encryption with **bcrypt**  
- Protected routes and API endpoints  
- User session management  

### 📋 Todo Management
- Add, Edit, Delete Todos  
- Mark tasks as complete/incomplete  
- Set due dates with reminders  
- Priority levels (Low, Medium, High)  
- Search and filter functionality  
- Drag & drop reordering  

### 🔄 Real-time Sync
- Cross-device Synchronization  
- Automatic sync every 30 seconds  
- Manual sync option  
- Conflict resolution  
- Offline support with local storage  

### 🔔 Smart Notifications
- Browser Notifications  
- Due date reminders  
- Overdue task alerts  
- Custom notification settings  

### 🎨 User Experience
- Dark/Light Mode  
- Responsive design  
- Loading states and error handling  
- Intuitive drag & drop interface  
- Real-time statistics  

### 📊 Advanced Features
- Task Statistics  
- Filter by status (All, Active, Completed)  
- Search across todos  
- Priority-based organization  
- Due date tracking  

---

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework  
- **TypeScript** - Type safety  
- **Tailwind CSS** - Styling  
- **Lucide React** - Icons  
- **Zustand** - State management  

### Backend
- **Next.js API Routes** - Serverless functions  
- **NextAuth.js** - Authentication  
- **MongoDB** - Database  
- **bcryptjs** - Password encryption  

### Deployment
- **Vercel** - Hosting platform  
- **MongoDB Atlas** - Cloud database  

---

## 📦 Installation

### Prerequisites
- Node.js 18+  
- MongoDB database  
- Git  

### 1. Clone the Repository
```bash
git clone https://github.com/AbdelazizSleem01/todo-app.git
cd todo-app

### 🏗 Project Structure

todo-app/
├── app/
│   ├── auth/
│   │   └── signin/
│   │       └── page.tsx          # Login/Signup page
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      # NextAuth API
│   │   ├── auth/
│   │   │   └── register/
│   │   │       └── route.ts      # User registration
│   │   ├── todos/
│   │   │   ├── route.ts          # Todos CRUD
│   │   │   ├── [id]/
│   │   │   │   └── route.ts      # Single todo operations
│   │   │   └── sync/
│   │   │       └── route.ts      # Sync endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── providers.tsx             # Context providers
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   └── mongodb.ts                # Database connection
├── store/
│   └── useTodoStore.ts           # Zustand store
├── types/
│   └── next-auth.d.ts            # Type definitions
└── public/                       # Static assets

## 🎯 Usage Guide

### Creating an Account
1. Go to the **sign-in page**  
2. Click **Create account**  
3. Enter your **email** and **password** (minimum 6 characters)  
4. You’ll be **logged in automatically**

### Managing Todos
- **Add Todo**: Use the input field at the top  
- **Set Due Date**: Click the calendar icon  
- **Set Priority**: Choose from Low / Medium / High  
- **Complete Todo**: Click the circle icon  
- **Edit Todo**: Click the pencil icon  
- **Delete Todo**: Click the trash icon  

### Syncing
- **Automatic sync** occurs every 30 seconds  
- **Manual sync**: Click the sync icon  
- All changes are **persisted to the database**

### Filters & Search
- **Filter**: All / Active / Completed using the filter buttons  
- **Search**: Use the search bar to find specific todos  
- **Priority**: Todos are color-coded by priority  

---

## 🔒 Security Features
- **Password hashing** with bcrypt  
- **CSRF protection**  
- **XSS prevention**  
- **Secure session management**  
- **Environment variable protection**


