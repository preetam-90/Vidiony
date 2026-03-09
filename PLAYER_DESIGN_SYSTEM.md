# Vidion Player UI - Design System Reference

## Color Palette

### Primary Colors
| Color | Value | Usage |
|-------|-------|-------|
| Background | `#0a0e27` | Main player background |
| Surface | `rgba(15, 19, 35, 0.68)` | Overlay surfaces |
| Surface Strong | `rgba(20, 25, 45, 0.92)` | Solid surfaces |
| **Accent (New)** | **`#6366f1`** | Primary interactive color |
| Accent Bright | `#818cf8` | Lighter accent variant |
| Accent Alternative | `#ec4899` | Secondary accent (pink) |

### Text Colors
| Color | Value | Usage |
|-------|-------|-------|
| Primary Text | `rgba(255, 255, 255, 0.95)` | Main text |
| Secondary Text | `rgba(255, 255, 255, 0.65)` | Supporting text |
| Muted Text | `rgba(255, 255, 255, 0.48)` | Disabled/tertiary text |

### Border & Backdrop
| Color | Value | Usage |
|-------|-------|-------|
| Border | `rgba(255, 255, 255, 0.08)` | Subtle borders |
| Border Hover | `rgba(255, 255, 255, 0.14)` | Interactive borders |
| Accent Glow | `rgba(99, 102, 241, 0.2)` | Glow effects |

### Shadows
| Shadow | Value | Usage |
|--------|-------|-------|
| Large Shadow | `0 20px 72px rgba(0, 0, 0, 0.48)` | Player container |
| Small Shadow | `0 4px 12px rgba(0, 0, 0, 0.16)` | Components |

## Typography

### Font Sizing
- **Title**: 0.95rem / 600-650 font-weight
- **Body**: 0.86rem / 560 font-weight
- **Small**: 0.8rem / 600 font-weight
- **Time Display**: 0.85rem / 600 font-weight
- **Menu Items**: 0.86rem / 560 font-weight

### Letter Spacing
- **Titles**: 0.01em
- **Buttons**: 0.02em
- **Labels**: 0.02em - 0.08em

## Component Sizing

### Buttons
| Type | Size | Padding |
|------|------|---------|
| Icon Button | 40×40px | - |
| Chip Button | Auto×40px | 0 14px |
| Mobile Icon | 38×38px | - |
| Mobile Chip | Auto×38px | 0 12px |

### Progress Bar
| Element | Size | Notes |
|---------|------|-------|
| Track Height | 5px → 7px on hover | Smooth transition |
| Scrubber | 14px diameter | White with accent glow |
| Marker | 2px wide, 12px tall | Grows on interaction |

### Controls
| Element | Dimension | Notes |
|---------|-----------|-------|
| Controls Row | 16px padding | 14px on mobile |
| Border Radius | 16px | 12px on mobile |
| Icon Gap | 6px | Consistent spacing |

## Glassmorphism Effects

### Standard Glassmorphism
```css
backdrop-filter: blur(24px) saturate(130%);
-webkit-backdrop-filter: blur(24px) saturate(130%);
border: 1px solid rgba(255, 255, 255, 0.08);
```

### Enhanced Glassmorphism (Menus)
```css
backdrop-filter: blur(28px) saturate(140%);
-webkit-backdrop-filter: blur(28px) saturate(140%);
```

### Light Glassmorphism (Watermark)
```css
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
```

## Gradients

### Accent Gradient (Button Primary)
```css
background: linear-gradient(135deg, #6366f1, #818cf8);
```

### Progress Bar Gradient
```css
background: linear-gradient(90deg, #6366f1, #818cf8);
```

### Background Accent
```css
background: radial-gradient(circle at -20% -20%, rgba(99, 102, 241, 0.12), transparent 40%);
```

## Spacing System

### Padding
- **Compact**: 8px (buttons)
- **Standard**: 12px-14px (controls, containers)
- **Generous**: 16px-20px (player margins)

### Gaps
- **Tight**: 6px (icon groups)
- **Standard**: 10px-12px (control sections)
- **Loose**: 14px+ (major sections)

### Margins
- **Controls Bottom**: 14px
- **Player Watermark**: 16px from edges (10px mobile)

## Animation Easing

### Standard Easing
```css
cubic-bezier(0.23, 1, 0.320, 1)  /* Modern, snappy */
```

### Durations
- **Fast**: 140ms-160ms (micro-interactions)
- **Standard**: 180ms-240ms (medium animations)
- **Slow**: 420ms (splash/pop effects)

### Keyframes

#### Feedback Pop
```css
0% { opacity: 0; transform: scale(0.72); }
35% { opacity: 1; transform: scale(1.04); }
100% { opacity: 0; transform: scale(0.94); }
```

#### Menu In
```css
from { opacity: 0; transform: translateY(10px) scale(0.96); }
to { opacity: 1; transform: translateY(0) scale(1); }
```

## State Indicators

### Button States

#### Default
```css
background: rgba(255, 255, 255, 0.04);
color: rgba(255, 255, 255, 0.65);
border: 1px solid rgba(255, 255, 255, 0.08);
```

#### Hover/Focus
```css
background: rgba(255, 255, 255, 0.1);
color: rgba(255, 255, 255, 0.95);
border: 1px solid rgba(255, 255, 255, 0.14);
transform: translateY(-2px);
```

#### Active
```css
background: rgba(99, 102, 241, 0.14);
color: white;
border: 1px solid rgba(99, 102, 241, 0.28);
box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.12);
```

#### Disabled
```css
opacity: 0.5;
pointer-events: none;
```

## Responsive Breakpoints

### Desktop (900px+)
- Three-column control layout
- 40px buttons
- 16px spacing

### Tablet (640px - 900px)
- Single-column control layout
- 40px buttons
- 14px spacing

### Mobile (< 640px)
- Single-column control layout
- 38px buttons
- 10px-12px spacing
- 18px border-radius on player

## Accessibility Considerations

### Focus Indicators
```css
box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5);
outline: none;
```

### Color Contrast Ratios
- Text on dark background: 4.5:1+ (WCAG AA)
- Button text: 7:1+ (WCAG AAA)
- Interactive elements: Clear visual distinction

### Motion
- All animations respect `prefers-reduced-motion`
- Critical interactions not animation-dependent
- Fallback to instant state changes when needed

## Best Practices

### When Updating Colors
1. Update CSS variable in `:root`
2. Test contrast ratios
3. Verify in both light and dark contexts
4. Check all interactive states

### When Adjusting Animations
1. Maintain easing consistency
2. Keep durations under 400ms
3. Verify performance on mobile
4. Test with reduced motion settings

### When Modifying Layout
1. Maintain 16:9 video aspect ratio
2. Preserve spacing ratios
3. Test responsive breakpoints
4. Verify touch target sizes (min 44×44px)

## CSS Variables Quick Reference

```css
:root {
  /* Background & Surface */
  --vidion-bg: #0a0e27;
  --vidion-surface: rgba(15, 19, 35, 0.68);
  --vidion-surface-strong: rgba(20, 25, 45, 0.92);
  
  /* Borders */
  --vidion-border: rgba(255, 255, 255, 0.08);
  --vidion-border-hover: rgba(255, 255, 255, 0.14);
  
  /* Text */
  --vidion-text: rgba(255, 255, 255, 0.95);
  --vidion-text-secondary: rgba(255, 255, 255, 0.65);
  --vidion-text-muted: rgba(255, 255, 255, 0.48);
  
  /* Accent Colors */
  --vidion-accent: #6366f1;
  --vidion-accent-alt: #ec4899;
  --vidion-accent-glow: rgba(99, 102, 241, 0.2);
  --vidion-accent-bright: #818cf8;
  
  /* Shadows */
  --vidion-shadow: 0 20px 72px rgba(0, 0, 0, 0.48);
  --vidion-shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.16);
}
```

---

**Last Updated**: March 8, 2026
**Design Version**: 2.0 (Modern Minimalism)
