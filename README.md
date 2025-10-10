# Classroomly MVP

Classroomly is a web-based platform that simplifies the tutoring process by enabling tutors to create shareable booking links for their classes and providing an integrated classroom environment once sessions are booked.

## 🚀 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase
- **Video Calling**: Daily.co
- **Email**: Resend
- **Deployment**: Vercel
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod

## 📦 Project Structure

```
tutorlink-mvp/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Auth group routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── classroom/        # Classroom components
│   └── ui/               # Reusable UI components
├── lib/                  # Utility libraries
│   ├── supabase/        # Supabase client
│   ├── video/           # video.co integration
│   └── utils/           # Helper functions
├── types/               # TypeScript types
├── hooks/               # Custom React hooks
└── public/              # Static assets
```

## 🚦 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account
- video.co account

### Installation

1. **Clone the repository**
```bash
cd classroomly_mvp
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**

Create a new project at [supabase.com](https://supabase.com)

Run the database migrations (see `/supabase/migrations/`)

4. **Set up video.co**

Sign up at [video.co](https://www.video.co)
Get your API keys from the dashboard

5. **Configure environment variables**

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

6. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Sprint Progress

### Sprint 1: Foundation & Authentication (Weeks 1-2) ✅
- [x] Project setup with Next.js 14
- [x] Supabase configuration
- [x] User authentication (sign up/sign in)
- [x] User profiles (tutor/student)
- [x] Protected routes
- [x] Role-based access control

### Sprint 2: Tutor Profiles & Class Creation (Weeks 3-4) 🚧
- [ ] Enhanced tutor profiles
- [ ] Class creation system
- [ ] Availability management
- [ ] Time zone handling

### Sprint 3: Shareable Links & Booking (Weeks 5-6)
- [ ] Shareable booking links
- [ ] Student booking interface
- [ ] Email notifications
- [ ] Booking conflict prevention

### Sprint 4: Virtual Classroom Foundation (Weeks 7-8) ✅
- [x] Daily.co integration
- [x] Classroom interface
- [x] Video calling with controls
- [x] Screen sharing
- [x] Session controls (mute, video, leave)

### Sprint 5: Chat & File Sharing (Weeks 9-10)
- [ ] Real-time chat with Supabase
- [ ] File sharing
- [ ] Material library
- [ ] Notifications

### Sprint 6: Rescheduling & MVP Polish (Weeks 11-12)
- [ ] Rescheduling system
- [ ] Session management
- [ ] UI/UX polish
- [ ] Launch preparation

## 🎯 Core Features

### For Tutors
- Create detailed profiles with expertise and experience
- Set up classes with subjects, duration, and pricing
- Manage availability and time zones
- Generate shareable booking links
- Conduct virtual sessions with video.co
- Share materials and resources
- Track session history

### For Students
- Book sessions through shareable links
- View tutor profiles and availability
- Join virtual classrooms
- Access shared materials
- Chat with tutors
- Manage bookings

## 🛠️ Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check

# Database
npm run db:migrate   # Run Supabase migrations
npm run db:reset     # Reset database
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `DAILY_API_KEY` | Daily.co API key | Yes (Sprint 4) |
| `NEXT_PUBLIC_DAILY_DOMAIN` | Daily.co domain | Yes (Sprint 4) |
| `RESEND_API_KEY` | Resend API key for emails | Optional (Sprint 3) |
| `FROM_EMAIL` | Sender email address | Optional (Sprint 3) |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |

## 📚 Key Dependencies

- **Next.js 14**: React framework with App Router
- **Supabase**: Backend-as-a-Service (database, auth, storage)
- **Daily.co**: Professional video calling infrastructure
- **Resend**: Email service for notifications
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **ICS**: Calendar file generation

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

## 📝 License

This project is proprietary and confidential.

## 🤝 Contributing

This is a solo development project using Cursor AI for development acceleration.

## 📧 Support

For questions or support, contact: support@classroomly.com

---

**Built with ❤️ using Next.js 14, Supabase, Daily.co, and Resend**

