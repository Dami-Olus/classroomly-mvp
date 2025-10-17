# 🎨 Excalidraw Integration - Product Requirements Document

## 📋 Overview

**Feature Name**: Excalidraw Whiteboard Integration  
**Priority**: High  
**Target Release**: Phase 2 (Essential Features)  
**Estimated Development Time**: 2-3 days  

---

## 🎯 Problem Statement

**Current State**: Video sessions lack interactive whiteboard capabilities for visual learning.

**Solution**: Integrate Excalidraw (open-source whiteboard) with Daily.co video sessions.

---

## 🚀 Implementation Options

### **Option 1: Iframe Embed (Recommended)**
```typescript
// Quick implementation
<iframe 
  src="https://excalidraw.com?room=session-123"
  width="100%" 
  height="600px"
  allow="camera; microphone"
/>
```

**Pros:**
- ✅ **Quick Setup**: 1-2 hours implementation
- ✅ **Full Features**: All Excalidraw tools available
- ✅ **Real-time Collaboration**: Built-in WebSocket support
- ✅ **No Maintenance**: Excalidraw handles updates
- ✅ **Mobile Support**: Responsive design

**Cons:**
- ❌ **External Dependency**: Relies on excalidraw.com
- ❌ **Limited Customization**: Can't modify UI
- ❌ **Data Control**: Whiteboard data on external servers

### **Option 2: Self-hosted Excalidraw**
```typescript
// Custom deployment
<iframe 
  src="https://whiteboard.classroomly.com?room=session-123"
  width="100%" 
  height="600px"
/>
```

**Pros:**
- ✅ **Full Control**: Custom branding and features
- ✅ **Data Ownership**: All data stays in ClassroomLY
- ✅ **Customization**: Modify UI and functionality
- ✅ **Security**: Control access and permissions

**Cons:**
- ❌ **Complex Setup**: Requires deployment and maintenance
- ❌ **Development Time**: 3-5 days implementation
- ❌ **Maintenance**: Updates and security patches

### **Option 3: React Component**
```typescript
import { Excalidraw } from "@excalidraw/excalidraw";

<Excalidraw 
  roomId="session-123"
  onSave={(data) => saveToDatabase(data)}
/>
```

**Pros:**
- ✅ **Full Integration**: Native React component
- ✅ **Custom Features**: Add tutoring-specific tools
- ✅ **Data Control**: Save to Supabase database
- ✅ **Branding**: Match ClassroomLY design

**Cons:**
- ❌ **Complex Setup**: Requires React expertise
- ❌ **Development Time**: 5-7 days implementation
- ❌ **Maintenance**: Handle updates and compatibility

---

## 🎯 Recommended Approach: Option 1 (Iframe Embed)

### **Why Iframe Embed?**
1. **Fast Implementation**: 1-2 days vs 5-7 days
2. **Proven Solution**: Excalidraw is battle-tested
3. **Full Features**: All whiteboard tools included
4. **Real-time Collaboration**: Built-in WebSocket support
5. **Mobile Support**: Works on all devices
6. **No Maintenance**: Excalidraw handles updates

### **Implementation Plan:**

#### **Day 1: Basic Integration**
1. **Create Whiteboard Component**: Iframe embed
2. **Room Management**: Generate unique room IDs
3. **Layout Integration**: Side-by-side with video
4. **Basic Testing**: Ensure it works

#### **Day 2: Enhanced Features**
1. **Session Persistence**: Save/load whiteboard data
2. **User Management**: Control access
3. **Mobile Optimization**: Responsive design
4. **Error Handling**: Fallback options

#### **Day 3: Polish & Testing**
1. **UI Polish**: Match ClassroomLY design
2. **Performance Testing**: Load testing
3. **User Testing**: Get feedback
4. **Documentation**: Update guides

---

## 🔧 Technical Implementation

### **Component Structure**
```typescript
interface WhiteboardProps {
  roomId: string;
  isTutor: boolean;
  onSave?: (data: any) => void;
}

function Whiteboard({ roomId, isTutor, onSave }: WhiteboardProps) {
  return (
    <div className="whiteboard-container">
      <iframe
        src={`https://excalidraw.com?room=${roomId}`}
        width="100%"
        height="600px"
        allow="camera; microphone"
        className="whiteboard-iframe"
      />
    </div>
  );
}
```

### **Layout Integration**
```typescript
// Video + Whiteboard Layout
<div className="session-container">
  <div className="video-panel">
    <DailyVideoCall roomUrl={roomUrl} />
  </div>
  <div className="whiteboard-panel">
    <Whiteboard roomId={sessionId} />
  </div>
</div>
```

### **Room Management**
```typescript
// Generate unique room IDs
const generateRoomId = () => {
  return `classroomly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Save whiteboard data
const saveWhiteboardData = async (roomId: string, data: any) => {
  await supabase
    .from('whiteboard_sessions')
    .upsert({
      room_id: roomId,
      data: data,
      updated_at: new Date()
    });
};
```

---

## 📊 Database Schema

### **Whiteboard Sessions Table**
```sql
CREATE TABLE whiteboard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT UNIQUE NOT NULL,
  session_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Access Control**
```sql
-- RLS Policy
CREATE POLICY "Users can access their whiteboard sessions" ON whiteboard_sessions
  FOR ALL USING (
    room_id IN (
      SELECT id FROM classrooms 
      WHERE tutor_id = auth.uid() OR student_id = auth.uid()
    )
  );
```

---

## 🎨 UI/UX Design

### **Layout Options**

#### **Option A: Side-by-Side (Desktop)**
```
┌─────────────────────────────────────────────────────────┐
│ Video Panel (50%)    │ Whiteboard Panel (50%)         │
│                       │                                │
│ [Daily.co Video]      │ [Excalidraw Iframe]           │
│ [Controls]            │ [Whiteboard Tools]             │
│                       │                                │
└─────────────────────────────────────────────────────────┘
```

#### **Option B: Toggle View (Mobile)**
```
┌─────────────────────────────────────────────────────────┐
│ [Video Tab] [Whiteboard Tab]                           │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Active Panel (Video OR Whiteboard)                 │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### **Option C: Picture-in-Picture**
```
┌─────────────────────────────────────────────────────────┐
│ Whiteboard (Full Screen)                               │
│                                                         │
│ ┌─────────────────┐                                     │
│ │ Video (PIP)     │                                     │
│ │ [Daily.co]     │                                     │
│ └─────────────────┘                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Steps

### **Step 1: Create Whiteboard Component**
```typescript
// components/Whiteboard.tsx
export function Whiteboard({ roomId, isTutor }: WhiteboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <div className="whiteboard-container">
      {isLoading && <div className="loading">Loading whiteboard...</div>}
      <iframe
        src={`https://excalidraw.com?room=${roomId}`}
        onLoad={() => setIsLoading(false)}
        className="whiteboard-iframe"
      />
    </div>
  );
}
```

### **Step 2: Integrate with Video Sessions**
```typescript
// app/classroom/[roomUrl]/page.tsx
export default function ClassroomPage() {
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  
  return (
    <div className="classroom-container">
      <DailyVideoCall roomUrl={roomUrl} />
      
      <button onClick={() => setShowWhiteboard(!showWhiteboard)}>
        {showWhiteboard ? 'Hide Whiteboard' : 'Show Whiteboard'}
      </button>
      
      {showWhiteboard && (
        <Whiteboard roomId={roomId} isTutor={isTutor} />
      )}
    </div>
  );
}
```

### **Step 3: Add Session Persistence**
```typescript
// Save whiteboard data
const saveWhiteboard = async (roomId: string) => {
  // Excalidraw provides API to get current data
  const data = await getExcalidrawData(roomId);
  
  await supabase
    .from('whiteboard_sessions')
    .upsert({
      room_id: roomId,
      session_data: data,
      updated_at: new Date()
    });
};
```

---

## ✅ Acceptance Criteria

### **Must Have**
- [ ] **Excalidraw Integration**: Iframe embed works
- [ ] **Room Management**: Unique room IDs per session
- [ ] **Real-time Collaboration**: Multiple users can draw
- [ ] **Mobile Support**: Works on mobile devices
- [ ] **Session Persistence**: Save/load whiteboard data

### **Should Have**
- [ ] **Layout Options**: Side-by-side or toggle view
- [ ] **Error Handling**: Fallback if Excalidraw fails
- [ ] **Performance**: Smooth experience
- [ ] **Access Control**: Only session participants can access
- [ ] **Data Export**: Save whiteboard as image/PDF

### **Could Have**
- [ ] **Custom Branding**: Match ClassroomLY colors
- [ ] **Advanced Features**: Custom tools for tutoring
- [ ] **Analytics**: Track whiteboard usage
- [ ] **Templates**: Pre-made whiteboard templates
- [ ] **AI Integration**: Smart shape recognition

---

## 🎯 Benefits of Excalidraw Integration

### **For Tutors**
- ✅ **Visual Teaching**: Draw diagrams, equations, flowcharts
- ✅ **Student Engagement**: Interactive learning experience
- ✅ **Session Recording**: Save whiteboard content
- ✅ **Professional Tools**: High-quality drawing tools

### **For Students**
- ✅ **Active Participation**: Draw and collaborate
- ✅ **Visual Learning**: Better understanding of concepts
- ✅ **Session Review**: Access whiteboard content later
- ✅ **Mobile Support**: Use on any device

### **For ClassroomLY**
- ✅ **Quick Implementation**: 2-3 days vs 5-7 days
- ✅ **Proven Solution**: Battle-tested whiteboard
- ✅ **No Maintenance**: Excalidraw handles updates
- ✅ **Cost Effective**: No additional development costs

---

## 🚀 Next Steps

1. **Approve this approach** - Excalidraw iframe integration
2. **Start implementation** - Create whiteboard component
3. **Test integration** - Ensure it works with Daily.co
4. **Add persistence** - Save/load whiteboard data
5. **Polish UI** - Match ClassroomLY design
6. **Deploy** - Release to production

**Ready to proceed with Excalidraw integration?** 🎨
