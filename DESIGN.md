---
name: Curio
description: Premium Egypt-focused marketplace for handcrafted luxury items
colors:
  gold-primary: "#D4A843"
  gold-light: "#E0BC5E"
  gold-dark: "#B8912A"
  black-deep: "#0A0A0E"
  black-mid: "#101015"
  black-soft: "#16161E"
  surface-primary: "#FFFFFF"
  surface-secondary: "#FCFAF7"
  surface-border: "#EAE6DF"
  text-primary: "#141416"
  text-secondary: "#6B6B76"
  text-tertiary: "#9CA3AF"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  xl: "32px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
  "3xl": "64px"
  "4xl": "96px"
components:
  button-primary:
    backgroundColor: "{colors.gold-primary}"
    textColor: "{colors.black-deep}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "{colors.black-deep}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
---

# Design System: Curio

## 1. Overview

**Creative North Star: "The Craft Luxury Vault"**

Curio represents the digital home of authentic Egyptian artisanry. Its aesthetic architecture is built on the intersection of ancient heritage (conveyed through warm golds, serif display types, and organic paper tones) and modern, high-end digital tooling.

The interface prioritizes breathing room, clean structural grids, and purposeful transitions. It explicitly rejects generic, flat dashboard surfaces, harsh card grid borders, and over-choreographed layout transitions. Every interaction feels heavy, tactile, and deliberate.

**Key Characteristics:**
- Tactile and heavy surfaces.
- High typographic contrast.
- Snappy, spring-like click physics.
- Dual-language structural harmony.

## 2. Colors

A premium, high-contrast palette celebrating warm golds and deep obsidian tones.

### Primary
- **Artisan Gold** (#D4A843): The core brand expression. Used selectively for primary buttons, selection highlights, active indicators, and luxury branding elements.

### Secondary
- **Obsidian Deep** (#0A0A0E): The primary background shade in dark mode, and structural canvas for dashboards.

### Neutral
- **Warm Cream** (#FCFAF7): The base page background in light mode, designed to reflect natural paper textures.
- **Ivory Surface** (#FFFFFF): Container surfaces in light mode.
- **Slate Accent** (#16161E): Hover highlights and active card wrappers in dark mode.
- **Muted Stone** (#6B6B76): Secondary text colors.

### Named Rules
**The Gold Rarity Rule.** Gold is used on less than 10% of any given screen area. Its premium feel depends entirely on its scarcity.

## 3. Typography

**Display Font:** Playfair Display (with Georgia, serif)
**Body Font:** Inter (with Cairo for Arabic, sans-serif)

**Character:** High-contrast display pairing. Large serif headings reflect human tradition and editorial curation, while clean, modern sans-serif body text ensures maximum reading ease.

### Hierarchy
- **Display** (700, 48px, 1.2): Hero page headings and category titles.
- **Headline** (700, 36px, 1.2): Primary section titles.
- **Title** (600, 24px, 1.3): Cards headers and popup headings.
- **Body** (400, 16px, 1.6): Paragraph descriptions, reviews, and general content.
- **Label** (500, 13px, 0.05em letter-spacing): Form input labels, small badges, and buttons.

### Named Rules
**The Dual-Language Height Rule.** When Arabic typography (Cairo) is active, line-height increments by 15% to prevent diacritics clipping.

## 4. Elevation

The system uses subtle depth layers and light overlays to separate content.

### Shadow Vocabulary
- **Ambient Low** (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04)`): Container resting states.
- **Tactile Lift** (`box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)`): Hover state feedback for interactive cards.

### Named Rules
**The Active Spring Rule.** Interactive elements scale down by 3% (`scale(0.97)`) on press, providing a physical, springy click sensation.

## 5. Components

### Buttons
- **Shape:** Rounded edges with a 12px radius (`var(--radius-md)`).
- **Primary:** Gold background with dark text, with an active scaling state.
- **Secondary:** Dark obsidian background with ivory text.

### Cards / Containers
- **Corner Style:** Rounded (16px radius, `var(--radius-lg)`).
- **Shadow Strategy:** Rest at Ambient Low; rise to Tactile Lift on hover.
- **Borders:** Thin, semi-transparent border lines (`1px solid var(--surface-border)`).

## 6. Do's and Don'ts

### Do:
- **Do** maintain generous white space between grid items (minimum 24px spacing).
- **Do** use native scale transforms on hover to raise cards rather than introducing hard borders.
- **Do** pair Playfair Display headings with Inter body text.

### Don't:
- **Don't** use solid 1px black lines to wrap inner details.
- **Don't** use neon colors or bright saturated gradients for actions.
- **Don't** apply un-gated image scaling (scale the image container border instead).
