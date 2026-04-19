# RetailChat Design System & Specifications

## 🎨 Brand Identity

### Colors
```css
Primary: #030213 (Dark Navy)
Secondary: #ececf0 (Light Gray)
Accent: #e9ebef (Lighter Gray)
Success: #00cc66 (Green)
Destructive: #d4183d (Red)
Background: #ffffff (White)
Foreground: #030213 (Dark Text)
```

### Typography
```css
Font Family: System Default
Base Size: 16px
Headings: 500 weight
Body Text: 400 weight
Buttons: 500 weight
```

### Spacing & Layout
```css
Border Radius: 10px (0.625rem)
Container Max Width: 1200px
Section Padding: 96px vertical, 16px horizontal
Component Gap: 24px
Grid Columns: 12 (responsive)
```

## 📱 Component Library

### Buttons
- **Primary**: Dark background (#030213), white text
- **Secondary**: Light background (#ececf0), dark text  
- **Ghost**: Transparent background, dark text
- **Outline**: Border only, transparent background

### Cards
- **Default**: White background, subtle border
- **Feature**: Hover effects, icon + text layout
- **Auth**: Centered, shadow, max-width 400px

### Forms
- **Inputs**: Light gray background (#f3f3f5), border on focus
- **Labels**: Medium weight, dark color
- **Validation**: Red text for errors, green for success
- **Checkboxes**: Custom styled, primary color when checked

### Navigation
- **Header**: Sticky, backdrop blur, border bottom
- **Links**: Muted color, hover to foreground
- **Logo**: Icon + text combination

## 📄 Page Layouts

### Landing Page Structure
```
Header (sticky)
├── Logo + Navigation
├── Sign In / Get Started buttons

Hero Section
├── Headline + Subheadline
├── Feature highlights
├── Primary CTA button
├── Hero image/illustration

Features Grid
├── 3-column responsive grid
├── Icon + title + description per feature
├── Hover animations

How It Works
├── 3-step process
├── Timeline layout
├── Step numbers + descriptions

Chat Demo
├── Interactive simulation
├── Message bubbles
├── Typing indicators

Call to Action
├── Centered content
├── Strong headline
├── Sign up button

Footer
├── Company info
├── Links grid
├── Social media
```

### Auth Page Structure
```
Header (with back button)

Two-Column Layout:
Left Column:
├── Benefits list
├── Trust indicators
├── Hero image

Right Column:
├── Toggle: Login / Signup
├── Form fields
├── Social login options
├── Switch mode button
```

## 🔧 Technical Specifications

### Responsive Breakpoints
```css
Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px
```

### Animation Guidelines
```css
Hover Transitions: 200ms ease
Page Transitions: 300ms ease
Loading States: Fade + scale
Button Press: Scale down 0.95
```

### Accessibility
- High contrast ratios (4.5:1 minimum)
- Focus indicators on all interactive elements
- ARIA labels for screen readers
- Keyboard navigation support
- Form validation with clear error messages

## 🚀 Implementation Notes

### Tech Stack
- React 18 + TypeScript
- Tailwind CSS v4
- Shadcn/ui components
- React Hook Form
- Lucide React icons
- Sonner notifications

### File Structure
```
/components
  ├── LandingPage.tsx (main marketing page)
  ├── AuthPage.tsx (login/signup)
  ├── Header.tsx (navigation)
  ├── Hero.tsx (main banner)
  ├── Features.tsx (feature grid)
  ├── HowItWorks.tsx (process steps)
  ├── ChatDemo.tsx (interactive demo)
  ├── CTA.tsx (call to action)
  ├── Footer.tsx (site footer)
  └── ui/ (reusable components)

/styles
  └── globals.css (design tokens & base styles)
```

### Design Tokens
All colors, spacing, and typography are defined in CSS custom properties for easy theme customization.

## 📋 Usage Guidelines

### Brand Voice
- Professional yet approachable
- Focus on business benefits
- Technical accuracy without jargon
- Confidence in AI capabilities

### Content Strategy
- Benefit-driven headlines
- Clear value propositions
- Social proof and testimonials
- Simple, actionable CTAs

### Visual Hierarchy
1. Primary actions (Sign up, Get Started)
2. Navigation and key content
3. Supporting information
4. Footer and secondary links