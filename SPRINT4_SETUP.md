# Sprint 4: Virtual Classroom with Daily.co - Setup Guide

## 🎯 Sprint 4 Overview

**Goal**: Build a fully functional virtual classroom for live tutoring sessions

**Features**:
- ✅ Video calling with daily.co
- ✅ Screen sharing
- ✅ Audio/video controls
- ✅ Participant management
- ✅ Classroom join/leave flow
- 🔄 Chat (Sprint 5)
- 🔄 File sharing (Sprint 5)
- 🔄 Whiteboard (Sprint 5)

## 📦 New Dependencies

```json
{
  "@daily-co/daily-js": "^0.64.0",
  "@daily-co/daily-react": "^0.35.0"
}
```

Install with:
```bash
npm install --legacy-peer-deps
```

## 🔧 Daily.co Setup (10 minutes)

### Step 1: Create Daily.co Account

1. Go to https://www.daily.co
2. Click "Start building for free"
3. Sign up with your email
4. Verify your email

### Step 2: Get Your Credentials

1. Go to **Developers** in the dashboard: https://dashboard.daily.co/developers
2. You'll see:
   - **Domain**: e.g., `your-domain.daily.co`
   - **API Key**: Click "Create API key"

### Step 3: Configure Environment Variables

Add to `.env.local`:

```env
# Daily.co Configuration
DAILY_API_KEY=your-api-key-here
NEXT_PUBLIC_DAILY_DOMAIN=your-domain

# Example:
# DAILY_API_KEY=abc123xyz789
# NEXT_PUBLIC_DAILY_DOMAIN=classroomly
```

### Step 4: Restart Development Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

## 🎥 Daily.co Features

### What Daily.co Provides:

- ✅ **HD Video Calling** - Up to 1080p quality
- ✅ **Screen Sharing** - Built-in
- ✅ **Recording** - Cloud recording (paid feature)
- ✅ **Chat** - Native chat (or use our custom one)
- ✅ **Noise Cancellation** - AI-powered
- ✅ **Virtual Backgrounds** - Optional
- ✅ **Mobile Support** - Works on phones/tablets

### Free Tier Limits:

- **Max participants**: 10,000 users/month
- **Room duration**: Unlimited
- **Features**: All core features included
- **Recording**: Available on paid plans

## 🏗️ Architecture

### Room Creation Flow:

```
Booking Created
  ↓
Classroom record created with room_url
  ↓
When user joins classroom page
  ↓
API creates Daily.co room (if not exists)
  ↓
User joins Daily call
  ↓
Video session starts
```

### Daily.co Integration:

```typescript
// Server-side (API route)
POST /api/daily/create-room
  → Creates room on Daily.co
  → Returns room URL

POST /api/daily/get-token
  → Generates meeting token
  → Returns token for auth

// Client-side (Classroom page)
DailyIframe.createFrame()
  → Embeds Daily.co iframe
  → Joins meeting
  → Handles events
```

## 📁 Files Created

### API Routes:
- `app/api/daily/create-room/route.ts` - Create Daily rooms
- `app/api/daily/get-token/route.ts` - Generate meeting tokens

### Pages:
- `app/classroom/[roomUrl]/page.tsx` - Virtual classroom interface

### Utilities:
- `lib/daily.ts` - Daily.co helper functions

## 🎨 Classroom Interface

### Layout:
```
┌─────────────────────────────────────────┐
│ Top Bar: Class info, participants       │
├─────────────────────────────┬───────────┤
│                             │           │
│  Video Call Area            │ Sidebar   │
│  (Daily.co iframe)          │ (Chat/    │
│                             │ Materials)│
│                             │           │
├─────────────────────────────┴───────────┤
│ Controls: Mute, Video, Screen Share,    │
│          Chat, Materials, Leave         │
└─────────────────────────────────────────┘
```

### Controls:
- 🎤 **Mute/Unmute** - Toggle microphone
- 📹 **Video On/Off** - Toggle camera
- 🖥️ **Screen Share** - Share your screen
- 💬 **Chat** - Open chat sidebar
- 📁 **Materials** - Open materials sidebar
- 📞 **Leave** - End session

## 🧪 Testing the Classroom

### Prerequisites:
1. ✅ Daily.co account created
2. ✅ API key and domain in `.env.local`
3. ✅ Server restarted
4. ✅ Have a booking created

### Test Flow:

**Step 1: Get Classroom URL**
```sql
-- In Supabase SQL Editor, find a classroom
SELECT room_url FROM classrooms 
WHERE status = 'scheduled' 
LIMIT 1;
```

**Step 2: Join Classroom**
```
1. Go to: http://localhost:3001/classroom/[room-url]
2. See class details
3. Click "Join Classroom"
4. Allow camera/microphone permissions
5. See Daily.co video interface
```

**Step 3: Test Controls**
```
1. Click mute button (🎤)
2. Toggle video (📹)
3. Try screen share (🖥️)
4. Open chat sidebar (💬)
5. Click leave (📞)
```

**Step 4: Multi-Participant Test**
```
1. Join as tutor in one browser
2. Join as student in incognito window
3. Both should see each other
4. Test audio/video
5. Try screen sharing
```

## 🔐 Security Features

### Room Privacy:
- Rooms are private by default
- Only users with room_url can join
- Meeting tokens can be required (optional)

### Participant Control:
- Tutors are room owners (more controls)
- Students are participants
- Screen share permissions configurable

## 📊 Daily.co vs Other Solutions

| Feature | Daily.co | Zoom | Google Meet |
|---------|----------|------|-------------|
| Embedding | ✅ Easy | ❌ Complex | ❌ Limited |
| Free Tier | ✅ Generous | ⚠️ 40min limit | ✅ Good |
| Customization | ✅ Full | ❌ Limited | ❌ Limited |
| API | ✅ Excellent | ⚠️ Complex | ❌ Limited |
| Recording | ✅ Cloud | ✅ Cloud | ✅ Cloud |

## 🚀 Advanced Features (Future)

### Available in Daily.co:
- AI noise cancellation
- Virtual backgrounds
- Live transcription
- Recording & playback
- Network quality monitoring
- Analytics

### Can Be Added Later:
- Recording management
- Breakout rooms
- Polls and reactions
- Hand raising
- Waiting room

## ⚙️ Configuration Options

### Room Settings (in API route):
```javascript
properties: {
  enable_screenshare: true,    // Allow screen sharing
  enable_chat: true,           // Native chat
  enable_knocking: false,      // No waiting room
  start_video_off: false,      // Camera on by default
  start_audio_off: false,      // Mic on by default
  enable_recording: 'cloud',   // Cloud recording
  max_participants: 10,        // Limit participants
}
```

### Customize per Class Type:
- Large group classes → Disable participant video
- 1-on-1 tutoring → Full features
- Webinar style → Only tutor has video

## 🎯 Sprint 4 Success Metrics

- ✅ Video calls connect within 10 seconds
- ✅ 95% success rate for video sessions
- ✅ Screen sharing works on all browsers
- ✅ Audio/video quality is acceptable
- ✅ Controls are intuitive
- ✅ Mobile responsive (basic)

## 🔜 Coming in Sprint 5

### Chat System:
- Real-time messaging with Supabase
- Message history
- Typing indicators
- File sharing in chat

### Materials:
- Upload documents
- Share PDFs, images
- Download materials
- Material library per session

### Whiteboard:
- Drawing tools
- Shapes and text
- Save/export drawings
- Real-time collaboration

## 📚 Documentation

- Daily.co Docs: https://docs.daily.co
- React SDK: https://docs.daily.co/reference/daily-react
- Examples: https://github.com/daily-demos

## 🐛 Troubleshooting

### Camera/Mic Not Working:
- Check browser permissions
- Use HTTPS in production
- Try different browser

### Room Not Found:
- Verify DAILY_DOMAIN is correct
- Check API key is valid
- Room might have expired

### Connection Issues:
- Check network connection
- Try disabling VPN
- Check firewall settings

---

## 🎉 Sprint 4 Ready!

Once you set up Daily.co:
1. Create account
2. Get API key and domain
3. Add to `.env.local`
4. Restart server
5. Join a classroom
6. Start video calling!

---

*Sprint 4: Virtual Classroom Foundation*  
*Powered by Daily.co*

