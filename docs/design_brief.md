# Habit Stacker Design Brief
## "Warm Minimalism" Design System

---

## 1. Design Philosophy

### Core Feeling
Habit Stacker should feel like working with a thoughtful design partner in a quiet, well-lit studio. Not clinical. Not playful. **Crafted and calm.**

### Key Principles
1. **Conversation is the hero** — Everything else supports the dialogue
2. **Warmth through restraint** — Minimal elements, maximum care
3. **Professional credibility** — Would not embarrass a PM showing colleagues
4. **Designed, not decorated** — Every element earns its place

### Metaphor
Think: Japanese stationery brand meets modern productivity tool. Hobonichi meets Linear.

---

## 2. Typography

### Font Stack
```css
:root {
  /* Primary: Warm serif for headings - conveys craft and thoughtfulness */
  --font-display: 'Fraunces', Georgia, serif;
  
  /* Secondary: Clean, friendly sans for body and UI */
  --font-body: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Mono: For data, metrics, technical elements */
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
}
```

### Type Scale
```css
:root {
  --text-xs: 0.75rem;      /* 12px - metadata, timestamps */
  --text-sm: 0.875rem;     /* 14px - secondary text, labels */
  --text-base: 1rem;       /* 16px - body, conversation */
  --text-lg: 1.125rem;     /* 18px - emphasized body */
  --text-xl: 1.25rem;      /* 20px - section headers */
  --text-2xl: 1.5rem;      /* 24px - card titles */
  --text-3xl: 2rem;        /* 32px - page titles */
  --text-4xl: 2.5rem;      /* 40px - hero moments */
}
```

### Typography Rules
- **Headings**: Fraunces, medium weight (500), generous letter-spacing (-0.02em)
- **Body/Chat**: Outfit, regular weight (400), line-height 1.6
- **Labels/Meta**: Outfit, medium weight (500), slightly smaller, muted color
- **Conversation text**: Minimum 16px on mobile, 18px on desktop for readability

---

## 3. Color System

### Light Mode (Default)
```css
:root {
  /* Backgrounds - warm, not stark */
  --bg-primary: #FDFBF7;       /* Warm cream - main background */
  --bg-secondary: #F7F4EE;     /* Slightly darker - cards, containers */
  --bg-tertiary: #EFEBE3;      /* Borders, dividers, subtle emphasis */
  --bg-inverse: #2C2825;       /* Dark surfaces when needed */
  
  /* Text - never pure black */
  --text-primary: #1A1816;     /* Main text - warm near-black */
  --text-secondary: #5C5550;   /* Secondary text - warm gray */
  --text-tertiary: #8C8580;    /* Muted text - timestamps, hints */
  --text-inverse: #FDFBF7;     /* Text on dark backgrounds */
  
  /* Accent - grounded, not flashy */
  --accent-primary: #2D6A5D;   /* Deep teal - primary actions */
  --accent-hover: #245549;     /* Darker teal - hover states */
  --accent-subtle: #E8F2EF;    /* Very light teal - backgrounds */
  
  /* Semantic */
  --success: #3D7A5A;          /* Muted green */
  --warning: #B5872A;          /* Warm amber */
  --error: #A65D5D;            /* Muted red */
  
  /* AI-specific */
  --ai-message-bg: #F7F4EE;    /* AI message background */
  --user-message-bg: #2D6A5D;  /* User message background */
  --user-message-text: #FFFFFF;
}
```

### Dark Mode
```css
[data-theme="dark"] {
  /* Backgrounds - warm dark, not cold gray */
  --bg-primary: #1A1816;
  --bg-secondary: #242220;
  --bg-tertiary: #2E2B28;
  --bg-inverse: #FDFBF7;
  
  /* Text */
  --text-primary: #F5F2ED;
  --text-secondary: #A8A29E;
  --text-tertiary: #6B6560;
  --text-inverse: #1A1816;
  
  /* Accent - slightly brighter for dark mode */
  --accent-primary: #4A9B8A;
  --accent-hover: #5DB3A0;
  --accent-subtle: #1E3530;
  
  /* Semantic */
  --success: #5B9B78;
  --warning: #D4A84B;
  --error: #C87878;
  
  /* AI-specific */
  --ai-message-bg: #242220;
  --user-message-bg: #2D6A5D;
  --user-message-text: #FFFFFF;
}
```

---

## 4. Spacing & Layout

### Spacing Scale
```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.5rem;    /* 24px */
  --space-6: 2rem;      /* 32px */
  --space-7: 3rem;      /* 48px */
  --space-8: 4rem;      /* 64px */
}
```

### Container Widths
```css
:root {
  --width-chat: 680px;         /* Optimal reading width for conversation */
  --width-content: 800px;      /* Content pages */
  --width-wide: 1200px;        /* Dashboard layouts */
}
```

### Layout Principles
- **Generous margins** — Conversation needs breathing room
- **Mobile-first** — Primary use case is mobile
- **Single column for chat** — Never side-by-side on conversation
- **Vertical rhythm** — Consistent spacing creates calm

---

## 5. Component Specifications

### Chat Messages

```css
/* AI Message */
.message-ai {
  background: var(--ai-message-bg);
  border-radius: 16px 16px 16px 4px;
  padding: var(--space-4) var(--space-5);
  max-width: 85%;
  margin-left: 0;
  border: 1px solid var(--bg-tertiary);
}

/* User Message */
.message-user {
  background: var(--user-message-bg);
  color: var(--user-message-text);
  border-radius: 16px 16px 4px 16px;
  padding: var(--space-4) var(--space-5);
  max-width: 85%;
  margin-left: auto;
}

/* Message spacing */
.message + .message {
  margin-top: var(--space-3);
}

/* Same-sender messages closer together */
.message-ai + .message-ai,
.message-user + .message-user {
  margin-top: var(--space-2);
}
```

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--accent-primary);
  color: white;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: var(--text-sm);
  padding: var(--space-3) var(--space-5);
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-primary:active {
  transform: scale(0.98);
}

/* Pill Button (for quick replies) */
.btn-pill {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-weight: 500;
  font-size: var(--text-sm);
  padding: var(--space-2) var(--space-4);
  border-radius: 100px;
  border: 1px solid var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-pill:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
}
```

### Cards (for habit recommendations)

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--bg-tertiary);
  border-radius: 12px;
  padding: var(--space-5);
  
  /* No heavy shadows - subtle only */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.card-description {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: 1.6;
}
```

### Input Fields

```css
.input {
  background: var(--bg-primary);
  border: 1px solid var(--bg-tertiary);
  border-radius: 8px;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  width: 100%;
  transition: border-color 0.15s ease;
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.input::placeholder {
  color: var(--text-tertiary);
}

/* Chat input - special treatment */
.chat-input {
  background: var(--bg-secondary);
  border: 1px solid var(--bg-tertiary);
  border-radius: 24px;
  padding: var(--space-3) var(--space-5);
  padding-right: 48px; /* Room for send button */
  font-size: var(--text-base);
  min-height: 48px;
  resize: none;
}
```

---

## 6. Motion & Animation

### Principles
- **Purposeful, not decorative** — Animation should aid understanding
- **Calm, not bouncy** — Slow ease-outs, no springs or bounces
- **Entrance only** — Elements fade in, don't animate out

### Timing
```css
:root {
  --duration-fast: 0.1s;
  --duration-normal: 0.2s;
  --duration-slow: 0.3s;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Message Animation
```css
@keyframes message-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message {
  animation: message-enter 0.3s var(--ease-out);
}
```

### Typing Indicator
```css
/* Subtle pulsing dots, not bouncing */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: var(--space-3);
}

.typing-dot {
  width: 6px;
  height: 6px;
  background: var(--text-tertiary);
  border-radius: 50%;
  animation: typing-pulse 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-pulse {
  0%, 60%, 100% { opacity: 0.4; }
  30% { opacity: 1; }
}
```

---

## 7. Texture & Atmosphere

### Paper Texture (Optional, for premium feel)
```css
.bg-textured {
  background-color: var(--bg-primary);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-blend-mode: overlay;
  background-size: 200px 200px;
  opacity: 0.03; /* Very subtle */
}
```

### Borders & Dividers
```css
/* Prefer borders over shadows */
.divider {
  height: 1px;
  background: var(--bg-tertiary);
  margin: var(--space-5) 0;
}

/* When shadows are needed, keep them minimal */
.shadow-sm {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.shadow-md {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
```

---

## 8. Mobile Considerations

### Touch Targets
- Minimum 44px height for all interactive elements
- Pill buttons should have adequate padding for thumb taps
- Input fields minimum 48px height

### Responsive Typography
```css
/* Scale up conversation text on desktop */
@media (min-width: 768px) {
  .message {
    font-size: var(--text-lg);
  }
}
```

### Safe Areas
```css
/* Account for iOS safe areas */
.chat-container {
  padding-bottom: env(safe-area-inset-bottom);
}

.chat-input-container {
  padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
}
```

---

## 9. Do's and Don'ts

### DO ✓
- Use generous whitespace around conversation
- Let the AI's words be the focus
- Use the accent color sparingly (buttons, links, key actions)
- Keep cards and containers simple (1px borders, minimal shadows)
- Make text highly readable (16px+ body, 1.6 line-height)

### DON'T ✗
- Use gradients anywhere
- Add decorative icons or illustrations
- Use more than one accent color
- Create busy or cluttered layouts
- Use pure white (#FFF) or pure black (#000)
- Add bouncy animations or excessive motion
- Use thin, hard-to-read fonts

---

## 10. Sample Component: Chat Interface

```html
<div class="chat-container">
  <div class="messages">
    <div class="message message-ai">
      <p>Hi! I'm here to help you design a habit system that actually fits your life. Before we dive in, I'm curious — what made you want to build better habits right now?</p>
    </div>
    
    <div class="message message-user">
      <p>I keep starting things and not following through. I want to be more consistent.</p>
    </div>
    
    <div class="message message-ai">
      <p>That's a really common experience — and honestly, it's usually not about willpower. It's about systems.</p>
      <p>Can you tell me about a habit you've tried to build before that didn't stick? I want to understand what got in the way.</p>
    </div>
    
    <div class="quick-replies">
      <button class="btn-pill">Exercise routine</button>
      <button class="btn-pill">Morning routine</button>
      <button class="btn-pill">Reading more</button>
      <button class="btn-pill">Something else</button>
    </div>
  </div>
  
  <div class="chat-input-container">
    <textarea class="chat-input" placeholder="Type your message..."></textarea>
    <button class="send-button" aria-label="Send message">
      <!-- Arrow icon -->
    </button>
  </div>
</div>
```

---

## Quick Reference: Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Outfit:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```