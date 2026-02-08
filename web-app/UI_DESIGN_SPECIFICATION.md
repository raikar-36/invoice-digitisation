# 🎨 SMART INVOICE SYSTEM - UI DESIGN SPECIFICATION

## 📚 ICON LIBRARY

**Library**: Lucide React  
**Installation**: `npm install lucide-react`  
**Import**: `import { IconName } from 'lucide-react'`

### Icon Sizes:
- Standard UI elements: `w-5 h-5` (20px)
- Headers/emphasis: `w-6 h-6` (24px)
- Loading spinners: `w-8 h-8` (32px)
- Empty states: `w-16 h-16` (64px)

### Common Icons Used:
- **CheckCircle2**: Success toasts, approval states
- **XCircle**: Error toasts, rejection states
- **AlertTriangle**: Warning toasts
- **Info**: Info toasts
- **User**: Customer information
- **DollarSign**: Amount/money
- **Trash2**: Delete actions
- **FileText**: Invoice/document references
- **Inbox**: Empty inbox states
- **FileCheck**: Completed review states
- **Loader2**: Loading spinners (with `animate-spin`)
- **Calendar**: Date fields
- **ArrowRight**: Next/forward actions
- **Eye**: View details
- **X**: Close buttons
- **CheckCircle2**: Approval success

---

## 🎨 COLOR PALETTE

### Light Theme Colors:

#### Backgrounds:
- **Body Background**: `bg-slate-50`
- **Card Background**: `bg-white`
- **Secondary Background**: `bg-slate-100`

#### Text Colors:
- **Primary Text**: `text-slate-900`
- **Secondary Text**: `text-slate-600`
- **Muted Text**: `text-slate-500`, `text-slate-400`

#### Borders:
- **Primary Border**: `border-slate-200`
- **Secondary Border**: `border-slate-300`

#### Accent Colors:
- **Primary Accent**: `bg-blue-600`, `hover:bg-blue-700`
- **Secondary Accent**: `bg-slate-200`, `hover:bg-slate-300`

---

### Dark Theme Colors:

#### Backgrounds:
- **Body Background**: `bg-slate-950`
- **Card Background**: `bg-slate-900`
- **Secondary Background**: `bg-slate-800`

#### Text Colors:
- **Primary Text**: `text-white`, `text-slate-100`
- **Secondary Text**: `text-slate-400`
- **Muted Text**: `text-slate-500`

#### Borders:
- **Primary Border**: `border-slate-700`
- **Secondary Border**: `border-slate-800`

#### Accent Colors:
- **Primary Accent**: `bg-blue-500`, `hover:bg-blue-600`
- **Secondary Accent**: `bg-slate-700`, `hover:bg-slate-600`

---

### Status Colors (Light / Dark):

#### Success (Emerald):
- **Background**: `bg-emerald-50` / `dark:bg-emerald-950/30`
- **Text**: `text-emerald-700` / `dark:text-emerald-400`
- **Border**: `border-emerald-200` / `dark:border-emerald-800`
- **Icon**: `text-emerald-600` / `dark:text-emerald-400`

#### Error (Rose):
- **Background**: `bg-rose-50` / `dark:bg-rose-950/30`
- **Text**: `text-rose-700` / `dark:text-rose-400`
- **Border**: `border-rose-200` / `dark:border-rose-800`
- **Icon**: `text-rose-600` / `dark:text-rose-400`

#### Warning (Amber):
- **Background**: `bg-amber-50` / `dark:bg-amber-950/30`
- **Text**: `text-amber-700` / `dark:text-amber-400`
- **Border**: `border-amber-200` / `dark:border-amber-800`
- **Icon**: `text-amber-600` / `dark:text-amber-400`

#### Info (Blue):
- **Background**: `bg-blue-50` / `dark:bg-blue-950/30`
- **Text**: `text-blue-700` / `dark:text-blue-400`
- **Border**: `border-blue-200` / `dark:border-blue-800`
- **Icon**: `text-blue-600` / `dark:text-blue-400`

---

### Invoice Status Badge Colors:

#### Pending Review (Amber):
```css
bg-amber-100 dark:bg-amber-950/30
text-amber-700 dark:text-amber-400
border border-amber-200 dark:border-amber-800
```

#### Pending Approval (Purple):
```css
bg-purple-100 dark:bg-purple-950/30
text-purple-700 dark:text-purple-400
border border-purple-200 dark:border-purple-800
```

#### Approved (Emerald):
```css
bg-emerald-100 dark:bg-emerald-950/30
text-emerald-700 dark:text-emerald-400
border border-emerald-200 dark:border-emerald-800
```

#### Rejected (Rose):
```css
bg-rose-100 dark:bg-rose-950/30
text-rose-700 dark:text-rose-400
border border-rose-200 dark:border-rose-800
```

---

## 🏗️ LAYOUT STRUCTURE

### Top Navigation Bar:

**Styling**:
```css
bg-white dark:bg-gray-800
h-16 (64px height)
sticky top-0
z-50
shadow-md
border-b border-gray-200 dark:border-gray-700
```

**Container**:
```css
max-w-7xl mx-auto
px-4 sm:px-6 lg:px-8
```

**Layout**:
```
|--------------------------------------------------|
| 📄 Smart Invoice  |  [Theme] [User Info] [Logout]|
|--------------------------------------------------|
```

**Left Side**:
- Logo icon: 📄 (emoji)
- Brand name: "Smart Invoice"
- Style: `text-2xl font-bold text-indigo-600 dark:text-indigo-400`

**Right Side**:
1. **Theme Toggle Button**:
   - Sun icon (light mode) or Moon icon (dark mode)
   - Size: `w-5 h-5`
   - Style: `p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`
   - Colors: `text-yellow-500` (sun), `text-indigo-600` (moon)

2. **User Info**:
   - Name: `text-sm font-medium text-gray-900 dark:text-gray-100`
   - Role: `text-xs text-gray-500 dark:text-gray-400`

3. **Logout Button**:
   - Style: `.btn-secondary`
   - Text: "Logout"

---

### Sidebar Navigation:

**Styling**:
```css
w-64 (256px width)
bg-white dark:bg-gray-800
min-h-screen
shadow-lg
border-r border-gray-200 dark:border-gray-700
p-4
```

**Navigation Links**:

**Active State**:
```css
bg-indigo-600
text-white
shadow-md
px-4 py-3
rounded-lg
```

**Inactive State**:
```css
text-gray-700 dark:text-gray-300
hover:bg-gray-100 dark:hover:bg-gray-700
px-4 py-3
rounded-lg
```

**Link Structure**:
```
[Icon] Link Label
```
- Icons: Emoji (📋, ✏️, ✅, 📤, 📊, 👥, 📜)
- Gap between icon and text: `gap-3`
- Hover animation: Slide right 4px

**Navigation Items by Role**:

*Owner*:
- All Invoices (📋)
- Review Queue (✏️)
- Approve Queue (✅)
- Upload Invoice (📤)
- Reports (📊)
- Users (👥)
- Audit Log (📜)

*Staff*:
- My Invoices (📋)
- Review Queue (✏️)
- Upload Invoice (📤)

*Accountant*:
- Approved Invoices (📋)
- Reports (📊)

---

### Main Content Area:

**Styling**:
```css
flex-1
p-8
bg-gray-50 dark:bg-gray-900 (inherited from body)
```

**Page Transition Animation**:
```javascript
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}
```

---

## 🔘 BUTTON STYLES

### Primary Button (`.btn-primary`):

```css
bg-blue-600 dark:bg-blue-500
text-white
px-6 py-2.5
rounded-lg
font-medium
hover:bg-blue-700 dark:hover:bg-blue-600
active:scale-95
transition-all duration-200
shadow-sm hover:shadow-md
focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
focus:ring-offset-2
```

**Usage**: Main actions (Save, Submit, Review Now)

---

### Secondary Button (`.btn-secondary`):

```css
bg-slate-200 dark:bg-slate-700
text-slate-900 dark:text-white
px-6 py-2.5
rounded-lg
font-medium
hover:bg-slate-300 dark:hover:bg-slate-600
active:scale-95
transition-all duration-200
focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400
focus:ring-offset-2
```

**Usage**: Cancel, Back, secondary actions

---

### Danger Button (`.btn-danger`):

```css
bg-rose-600 dark:bg-rose-500
text-white
px-6 py-2.5
rounded-lg
font-medium
hover:bg-rose-700 dark:hover:bg-rose-600
active:scale-95
transition-all duration-200
shadow-sm hover:shadow-md
focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400
focus:ring-offset-2
```

**Usage**: Delete, Reject, destructive actions

---

### Button with Icons:

**Icon on left**: `<Icon className="w-5 h-5 mr-2" />`  
**Icon on right**: `<Icon className="w-5 h-5 ml-2" />`

**Example**:
```jsx
<button className="btn-primary flex items-center gap-2">
  Review Now
  <ArrowRight className="w-4 h-4" />
</button>
```

---

## 📦 CARD COMPONENT (`.card`)

### Base Card Style:

```css
bg-white dark:bg-slate-900
rounded-xl (12px border radius)
shadow-sm hover:shadow-md
transition-all duration-300
p-6
border border-slate-200 dark:border-slate-700
hover:border-blue-500 dark:hover:border-blue-400
```

### Card Hover Effects:
- Shadow increases: `hover:shadow-md`
- Border color changes to accent blue
- Optional scale: `hover:scale-[1.02]` for interactive cards
- Cursor: `cursor-pointer` for clickable cards

---

## 📝 FORM INPUTS

### Text Input (`.input-field`):

```css
w-full
px-4 py-2.5
border border-slate-300 dark:border-slate-600
rounded-lg
bg-white dark:bg-slate-900
text-slate-900 dark:text-slate-100
focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
focus:border-blue-500
hover:border-slate-400 dark:hover:border-slate-500
transition-all duration-200
placeholder-slate-400 dark:placeholder-slate-500
```

**States**:
- Normal: Light border
- Hover: Slightly darker border
- Focus: Blue ring + blue border
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`

---

### Select Dropdown (`.select-field`):

Same as `.input-field` plus:

```css
cursor-pointer
pr-10 (extra padding for arrow)
appearance-none (remove default arrow)
```

**Custom Arrow**: SVG dropdown arrow positioned on the right
- Light mode: `stroke='%2364748B'` (slate-600)
- Dark mode: `stroke='%2394A3B8'` (slate-400)

---

### Labels:

```css
text-sm
font-medium
text-gray-700 dark:text-gray-300
mb-2
block
```

---

### Date Inputs:

Same as `.input-field` styling

---

## 🏷️ STATUS BADGES

### Base Badge Style (`.status-badge`):

```css
px-3 py-1
rounded-full
text-sm
font-medium
inline-flex items-center gap-1.5
```

### Specific Status Classes:

**Pending Review** (`.status-pending-review`):
```css
bg-amber-100 dark:bg-amber-950/30
text-amber-700 dark:text-amber-400
border border-amber-200 dark:border-amber-800
```

**Pending Approval** (`.status-pending-approval`):
```css
bg-purple-100 dark:bg-purple-950/30
text-purple-700 dark:text-purple-400
border border-purple-200 dark:border-purple-800
```

**Approved** (`.status-approved`):
```css
bg-emerald-100 dark:bg-emerald-950/30
text-emerald-700 dark:text-emerald-400
border border-emerald-200 dark:border-emerald-800
```

**Rejected** (`.status-rejected`):
```css
bg-rose-100 dark:bg-rose-950/30
text-rose-700 dark:text-rose-400
border border-rose-200 dark:border-rose-800
```

---

## 🔔 TOAST NOTIFICATIONS

### Position & Container:

```css
position: fixed
top: 1rem (16px)
right: 1rem (16px)
z-index: 50
```

**Stacking**: Multiple toasts stack vertically with `gap-3`

---

### Toast Structure:

```jsx
<div className="
  bg-{color}-50 dark:bg-{color}-950/30 
  border border-{color}-200 dark:border-{color}-800 
  rounded-xl 
  shadow-lg 
  p-4 
  max-w-md 
  pointer-events-auto 
  flex items-center gap-3
">
  <Icon className="w-5 h-5 text-{color}-600 dark:text-{color}-400 flex-shrink-0" />
  <p className="text-sm font-medium text-{color}-900 dark:text-{color}-100 flex-1">
    Message text
  </p>
  <button className="text-{color}-600 dark:text-{color}-400 hover:text-{color}-700">
    <X className="w-4 h-4" />
  </button>
</div>
```

---

### Toast Types:

#### Success Toast:
- **Icon**: `CheckCircle2`
- **Colors**: Emerald (see status colors above)
- **Duration**: 4 seconds, auto-dismiss
- **Animation**: Slide in from right

#### Error Toast:
- **Icon**: `XCircle`
- **Colors**: Rose
- **Duration**: Stays visible until dismissed
- **Close Button**: Required

#### Warning Toast:
- **Icon**: `AlertTriangle`
- **Colors**: Amber
- **Duration**: Stays visible until dismissed
- **Close Button**: Required

#### Info Toast:
- **Icon**: `Info`
- **Colors**: Blue
- **Duration**: 4 seconds, auto-dismiss
- **Animation**: Slide in from right

#### Loading Toast:
- **Icon**: Spinning circle (border animation)
- **Colors**: Slate/Blue
- **Duration**: Stays until operation completes

---

### Toast Animations:

**Enter Animation** (`.animate-enter`):
```javascript
@keyframes enter {
  0% { transform: translateX(100%), opacity: 0 }
  100% { transform: translateX(0), opacity: 1 }
}
duration: 200ms ease-out
```

**Exit Animation** (`.animate-leave`):
```javascript
@keyframes leave {
  0% { transform: translateX(0), opacity: 1 }
  100% { transform: translateX(100%), opacity: 0 }
}
duration: 150ms ease-in
```

---

## 📄 PAGE-SPECIFIC LAYOUTS

### Page Headers:

```jsx
<div className="mb-8">
  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
    Page Title
  </h1>
  <p className="text-slate-600 dark:text-slate-400 mt-2">
    Subtitle or description text
  </p>
</div>
```

---

### Invoice List Page:

#### Grid Layout:
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-6
```

**Responsive**:
- Mobile: 1 column
- Tablet (768px+): 2 columns
- Desktop (1024px+): 3 columns

#### Pagination:
- **Items per page**: 9 (3×3 grid)
- **Position**: Bottom center
- **Style**: Previous/Next buttons (`.btn-secondary`) with page count

#### Filters Section:
```css
.card (white card)
grid grid-cols-1 md:grid-cols-4
gap-4
mb-6
```

**Filter Inputs**:
- Search field
- Status dropdown
- Date from
- Date to

---

### Invoice Card (List Item):

**Structure**:
```
┌────────────────────────────────────┐
│ [FileText Icon] INV-001  [Badge]  │
│ Invoice Number           Status    │
│---------------------------------- │
│ [User] Customer Name              │
│ [DollarSign] ₹12,345.00          │
│---------------------------------- │
│ by Creator Name        [Trash2]   │
└────────────────────────────────────┘
```

**Top Row**:
- Left: `FileText` icon (blue) + Invoice number (bold)
- Right: Status badge

**Middle Section** (with spacing):
- Customer row: `User` icon + customer name
- Amount row: `DollarSign` icon (emerald) + formatted amount (large, bold)

**Bottom Row** (with top border):
- Left: "by {creator_name}" (small, muted)
- Right: Delete button (Trash2 icon, rose color) - Owner only

**Hover Effects**:
- Scale: `scale-[1.02]`
- Shadow increases
- Border becomes blue accent

**Entry Animation**:
```javascript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.05 }} // Stagger effect
```

---

### Review Queue Page:

#### Layout:
- **Full-width cards**, stacked vertically
- `gap-6` between cards

#### Card Structure:
```
┌─────────────────────────────────────────────────┐
│ [FileText Icon] Invoice #123  [Badge]          │
│                                                 │
│ [Calendar] Date  [Dollar] Amount  [Clock] Time │
│ [FileText] Document Count                      │
│                                                 │
│ [Delete Button]  [Review Now → Button]         │
└─────────────────────────────────────────────────┘
```

**Header**:
- `FileText` icon (amber) + invoice number + status badge

**Info Grid** (4 columns on desktop, 2 on tablet):
- Invoice Date (Calendar icon)
- Amount (DollarSign icon)
- Upload time
- Document count (FileText icon)

**Actions** (right side):
- Delete button: Rose with `Trash2` icon
- Review Now button: Primary with `ArrowRight` icon

---

### Approval Queue Page:

Similar to Review Queue but with:
- **Status**: PENDING APPROVAL (purple badge)
- **Actions**: Approve (emerald) + Reject (rose) buttons
- **Additional Info**: Customer details in a sub-card

---

### Empty States:

**Structure**:
```jsx
<div className="card text-center py-12">
  <Icon className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-600" />
  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
    No Items Found
  </h3>
  <p className="text-slate-600 dark:text-slate-400">
    Description text explaining the empty state
  </p>
</div>
```

**Icons by Context**:
- No invoices: `Inbox`
- Review complete: `FileCheck`
- All approved: `CheckCircle2`

---

### Loading States:

**Full Page Loader**:
```jsx
<div className="flex justify-center items-center h-64">
  <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-500 animate-spin" />
</div>
```

**Button Loading State**:
```jsx
<button disabled>
  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  Processing...
</button>
```

---

## 🎬 ANIMATIONS & TRANSITIONS

### Standard Transition Durations:
- **Fast interactions**: `duration-150` (buttons on click)
- **Standard**: `duration-200` (buttons, colors)
- **Smooth**: `duration-300` (cards, page elements)

### Transition Properties:
- Buttons: `transition-all duration-200`
- Cards: `transition-all duration-300`
- Colors only: `transition-colors duration-200`
- Shadows: `transition-shadow duration-300`

### Scale Animations:
- **Button active**: `active:scale-95`
- **Card hover**: `hover:scale-[1.02]`
- **Small button hover**: `hover:scale-105`

### Framer Motion Presets:

**Page Entry**:
```javascript
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}
```

**Card Stagger**:
```javascript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.05 }}
```

**Sidebar Link Hover**:
```javascript
whileHover={{ x: 4 }} // Slide 4px right
```

**Button Interactions**:
```javascript
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints (Tailwind Defaults):
- **sm**: 640px and up (small tablets)
- **md**: 768px and up (tablets)
- **lg**: 1024px and up (desktops)
- **xl**: 1280px and up (large desktops)

### Responsive Patterns:

**Grid Layouts**:
```css
grid-cols-1          /* Mobile: 1 column */
md:grid-cols-2       /* Tablet: 2 columns */
lg:grid-cols-3       /* Desktop: 3 columns */
```

**Spacing**:
```css
px-4              /* Mobile: 16px */
sm:px-6           /* Tablet: 24px */
lg:px-8           /* Desktop: 32px */
```

**Text Sizes**:
```css
text-2xl          /* Mobile */
md:text-3xl       /* Tablet */
lg:text-4xl       /* Desktop */
```

**Hide on Mobile**:
```css
hidden md:block   /* Show on tablet+ */
```

### Mobile Considerations:
- Touch targets minimum 44×44px
- Adequate spacing between interactive elements
- Single column layouts on small screens
- Hamburger menu if needed (not implemented yet)

---

## 🌗 DARK MODE IMPLEMENTATION

### Strategy:
- **Method**: Class-based dark mode
- **Configuration**: `darkMode: 'class'` in tailwind.config.js
- **Toggle**: JavaScript adds/removes `dark` class on `<html>` element

### Implementation Pattern:

Every component should have dual colors:
```css
bg-white dark:bg-slate-900
text-slate-900 dark:text-white
border-slate-200 dark:border-slate-700
```

### Theme Toggle Button:

**Location**: Top navigation bar (right side)  
**Size**: `w-5 h-5`  
**Icons**:
- Light mode: Moon icon (`text-indigo-600`)
- Dark mode: Sun icon (`text-yellow-500`)

**Toggle State Storage**: localStorage (`theme` key)

### SVG Icon Colors in Dark Mode:

Custom SVG elements (like select dropdown arrows) need separate dark mode variants:
```css
.dark .select-field {
  background-image: url("...dark-colored-svg...");
}
```

---

## ♿ ACCESSIBILITY

### Focus Indicators:

All interactive elements must have focus rings:
```css
focus:ring-2 
focus:ring-{color}-500 
focus:ring-offset-2
```

**Colors by button type**:
- Primary: `focus:ring-blue-500`
- Secondary: `focus:ring-slate-500`
- Danger: `focus:ring-rose-500`

### Color Contrast:

Minimum contrast ratios (WCAG AA):
- Normal text: 4.5:1
- Large text (18px+): 3:1
- Interactive elements: 3:1

**Testing**: All color combinations meet these ratios in both light and dark modes

### Semantic HTML:

- Proper `<button>` elements for actions
- Proper `<a>` elements for navigation
- Form inputs wrapped in `<label>` elements
- Headings in logical order (h1, h2, h3)

### Icon Accessibility:

**With visible text**: No additional attributes needed  
**Icon-only buttons**: Add `title` or `aria-label`:
```jsx
<button title="Delete Invoice" aria-label="Delete Invoice">
  <Trash2 className="w-5 h-5" />
</button>
```

### Disabled States:

```css
disabled:opacity-50
disabled:cursor-not-allowed
disabled:pointer-events-none
```

Visual and functional indication that element is not interactive.

### Keyboard Navigation:

- All interactive elements accessible via Tab
- Logical tab order (top to bottom, left to right)
- Enter/Space to activate buttons
- Escape to close modals/toasts

---

## 💡 KEY DESIGN PRINCIPLES

### 1. Consistency
- Use the same color for similar actions across all pages
- Maintain consistent spacing patterns
- Reuse component styles (buttons, cards, badges)

### 2. Spacing System
Use Tailwind's spacing scale (multiples of 0.25rem = 4px):
- **Tight**: 1, 2 (4px, 8px) - icon gaps, small padding
- **Standard**: 3, 4 (12px, 16px) - component padding
- **Comfortable**: 6, 8 (24px, 32px) - section spacing
- **Spacious**: 12, 16 (48px, 64px) - page sections

### 3. Border Radius
- **Buttons & Inputs**: `rounded-lg` (8px)
- **Cards**: `rounded-xl` (12px)
- **Badges**: `rounded-full` (9999px)
- **Modals**: `rounded-2xl` (16px)

### 4. Shadow Hierarchy
- **None**: Flat UI elements
- **sm**: `shadow-sm` - Subtle elevation
- **md**: `shadow-md` - Card elevation
- **lg**: `shadow-lg` - Modal/overlay elevation
- **xl**: `shadow-xl` - Maximum emphasis

### 5. Typography Scale
**Font Weights**:
- Regular (400): Body text
- Medium (500): Emphasized text, buttons
- Semibold (600): Subheadings, labels
- Bold (700): Main headings

**Font Sizes**:
- xs (12px): Metadata, timestamps
- sm (14px): Secondary text, descriptions
- base (16px): Body text
- lg (18px): Emphasized body, card titles
- xl (20px): Section subheadings
- 2xl (24px): Page subheadings
- 3xl (30px): Page titles

### 6. Icon Guidelines
- Always pair icons with text when possible
- Use consistent sizes within sections
- Color icons to match their context (error=rose, success=emerald)
- Never use emojis as functional icons (design system icons only)

### 7. Interactive Feedback
Every interactive element should have:
1. **Hover state**: Color change, shadow increase, slight scale
2. **Active/Click state**: Scale down slightly
3. **Focus state**: Visible ring
4. **Disabled state**: Reduced opacity, no pointer

### 8. Content Hierarchy
- Use size, weight, and color to establish hierarchy
- Primary content: Largest, darkest
- Secondary content: Medium, slightly muted
- Metadata: Smallest, most muted

---

## 🛠️ IMPLEMENTATION CHECKLIST

When building a new page or component, ensure:

- [ ] All colors have dark mode variants (`dark:` classes)
- [ ] Interactive elements have hover/focus/active states
- [ ] Icons are from Lucide React (no emojis in UI)
- [ ] Buttons use appropriate predefined classes
- [ ] Forms have proper labels and placeholders
- [ ] Loading states are handled with `Loader2` spinner
- [ ] Empty states have proper messaging and icons
- [ ] Responsive breakpoints are applied
- [ ] Toast notifications use the modern custom implementation
- [ ] Animations are smooth and purposeful (not distracting)
- [ ] Accessibility attributes are present (aria, title, focus rings)
- [ ] Color contrast meets WCAG AA standards
- [ ] Spacing follows the 4px grid system

---

## 📦 TAILWIND CONFIGURATION

### Required tailwind.config.js:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'enter': 'enter 200ms ease-out',
        'leave': 'leave 150ms ease-in forwards',
      },
      keyframes: {
        enter: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        leave: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
```

---

## 🎯 COMPONENT USAGE EXAMPLES

### Example: Primary Button with Icon
```jsx
import { ArrowRight } from 'lucide-react';

<button className="btn-primary flex items-center gap-2">
  Continue
  <ArrowRight className="w-5 h-5" />
</button>
```

### Example: Invoice Card
```jsx
import { FileText, User, DollarSign, Trash2 } from 'lucide-react';

<div className="card cursor-pointer hover:scale-[1.02]">
  {/* Header */}
  <div className="flex justify-between items-start mb-4">
    <div className="flex items-center gap-2">
      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-500" />
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          INV-001
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Jan 15, 2026
        </p>
      </div>
    </div>
    <span className="status-badge status-approved">APPROVED</span>
  </div>

  {/* Content */}
  <div className="space-y-3 mb-4">
    <div className="flex items-center gap-2">
      <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      <span className="text-sm text-slate-700 dark:text-slate-300">
        John Doe
      </span>
    </div>
    <div className="flex items-center gap-2">
      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
        ₹12,345.00
      </span>
    </div>
  </div>

  {/* Footer */}
  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 
                  flex justify-between items-center">
    <div className="text-xs text-slate-500 dark:text-slate-400">
      by Staff Member
    </div>
    <button className="text-rose-600 dark:text-rose-500 
                       hover:bg-rose-50 dark:hover:bg-rose-950/30 
                       p-2 rounded-lg transition-all">
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
</div>
```

### Example: Success Toast
```jsx
import { CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';

toast.custom((t) => (
  <div className={`${
    t.visible ? 'animate-enter' : 'animate-leave'
  } bg-emerald-50 dark:bg-emerald-950/30 
     border border-emerald-200 dark:border-emerald-800 
     rounded-xl shadow-lg p-4 max-w-md 
     pointer-events-auto flex items-center gap-3`}>
    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
      Invoice saved successfully!
    </p>
    <button onClick={() => toast.dismiss(t.id)}>
      <X className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    </button>
  </div>
), { duration: 4000, position: 'top-right' });
```

---

## 📝 NOTES

- This design system prioritizes consistency and accessibility
- All components are fully responsive and work in both light/dark modes
- Icons from Lucide React ensure a professional, cohesive look
- The slate color palette provides better contrast than plain gray
- Blue is used as the primary accent for actions and interactive elements
- Status colors (emerald, rose, amber, purple) are semantically meaningful
- All animations are subtle and enhance UX without being distracting
- The design follows modern 2026 web design trends while remaining timeless

---

**Last Updated**: February 8, 2026  
**Design System Version**: 1.0  
**Framework**: React + Tailwind CSS + Framer Motion + Lucide React
