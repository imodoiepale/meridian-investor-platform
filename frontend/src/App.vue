<template>
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup>
import { useTheme } from './composables/useTheme.js'
useTheme()
</script>

<style>
/* ══════════════════════════════════════════════════════════════════════════
   Meridian design tokens
   Palette: navy · royal blue · white. Legacy views reference the same variable
   names (--bg, --surface, --orange…) so retargeting the values here reskins
   them without touching their markup. --orange is intentionally kept as the
   accent alias and now resolves to royal blue.
   ══════════════════════════════════════════════════════════════════════════ */

:root {
  /* Brand scale — fixed, theme-independent. Values mirror the approved
     static reference in public/meridian-global-landing/styles.css. */
  --navy-950:  #040C17;
  --navy-900:  #071321;
  --navy-800:  #0B1B2D;
  --navy-700:  #12273D;
  --navy-600:  #1B3552;

  --blue-700:  #0F35A6;
  --blue-600:  #123FC1;
  --blue-500:  #1D55F5;
  --blue-400:  #2B61FF;
  --blue-300:  #4D78FF;
  --blue-200:  #7E9FFF;
  --blue-50:   #EEF3FF;

  --grey-900:  #10141C;
  --grey-700:  #333B49;
  --grey-500:  #606978;
  --grey-400:  #98A1B0;
  --grey-200:  #E3E7ED;
  --grey-100:  #EDF0F5;
  --grey-50:   #F5F7FA;

  /* Typography — Manrope for display, DM Sans for body (matches reference) */
  --font:      'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  --font-display: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;

  /* Motion */
  --ease-out:  cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  /* Elevation */
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 4px 16px -4px rgba(15, 23, 42, 0.10);
  --shadow-lg: 0 20px 48px -12px rgba(10, 30, 61, 0.18);
  --shadow-xl: 0 32px 72px -16px rgba(10, 30, 61, 0.26);

  --radius:    8px;
  --radius-lg: 12px;
  --max:       1240px;
}

/* ── Light (default — matches the marketing design) ── */
:root, [data-theme="light"] {
  --bg:        #FFFFFF;
  --bg2:       var(--grey-50);
  --surface:   #FFFFFF;
  --surface2:  var(--grey-100);
  --text:      var(--grey-900);
  --text2:     var(--grey-500);
  --text3:     var(--grey-400);
  --border:    var(--grey-200);
  --border2:   var(--grey-100);

  /* Accent — legacy views call this --orange; it is now royal blue. */
  --orange:    var(--blue-500);
  --orange-h:  var(--blue-600);
  --accent:    var(--blue-500);
  --accent-h:  var(--blue-600);
  --accent-soft: var(--blue-50);

  --danger:    #DC2626;
  --success:   #20A565;
  --warning:   #D97706;
  color-scheme: light;
}

/* ── Dark ── */
[data-theme="dark"] {
  --bg:        var(--navy-950);
  --bg2:       var(--navy-900);
  --surface:   var(--navy-800);
  --surface2:  var(--navy-700);
  --text:      rgba(255,255,255,0.92);
  --text2:     rgba(255,255,255,0.58);
  --text3:     rgba(255,255,255,0.34);
  --border:    rgba(255,255,255,0.10);
  --border2:   rgba(255,255,255,0.06);

  --orange:    var(--blue-400);
  --orange-h:  var(--blue-300);
  --accent:    var(--blue-400);
  --accent-h:  var(--blue-300);
  --accent-soft: rgba(59, 130, 246, 0.14);

  --danger:    #F87171;
  --success:   #34D399;
  --warning:   #FBBF24;
  color-scheme: dark;
}

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }

#app {
  font-family: var(--font);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text);
  background-color: var(--bg);
  transition: background-color 0.25s ease, color 0.25s ease;
}

body { font-family: var(--font); }
body.menu-open { overflow: hidden; }

.m-sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
  line-height: 1.15;
  font-weight: 500;
}

/* ── Route transition ── */
.page-enter-active, .page-leave-active { transition: opacity 0.22s var(--ease-out); }
.page-enter-from, .page-leave-to { opacity: 0; }

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--grey-200); border-radius: 8px; border: 3px solid var(--bg); }
::-webkit-scrollbar-thumb:hover { background: var(--grey-400); }
[data-theme="dark"] ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); }

button, a, input, select, textarea { font-family: inherit; }

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

/* ── Shared primitives (available to every view) ── */
.m-container { width: min(var(--max), calc(100% - 64px)); margin: 0 auto; }

.m-eyebrow {
  font-family: var(--font-display);
  font-size: 11px; font-weight: 700; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--accent);
}

.m-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 48px; padding: 0 24px; border-radius: 5px; border: 1px solid transparent;
  font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none;
  white-space: nowrap;
  transition: background-color .16s ease, border-color .16s ease,
              color .16s ease, transform .16s ease, box-shadow .16s ease;
}
.m-btn:active { transform: scale(0.978); }
.m-btn-primary { background: var(--blue-500); border-color: var(--blue-500); color: #fff; }
.m-btn-primary:hover {
  background: var(--blue-600); border-color: var(--blue-600);
  transform: translateY(-2px); box-shadow: 0 12px 26px rgba(29,85,245,.25);
}
.m-btn-sm { min-height: 40px; padding: 0 17px; font-size: 13px; }
.m-btn-ghost { background: transparent; color: var(--text); border-color: var(--border); }
.m-btn-ghost:hover { border-color: var(--grey-400); background: var(--grey-50); }
.m-btn-onDark {
  background: rgba(7,19,33,.25); color: #fff;
  border-color: rgba(255,255,255,.8); backdrop-filter: blur(10px);
}
.m-btn-onDark:hover { background: rgba(255,255,255,.12); transform: translateY(-2px); }

.m-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
}

/* ── Scroll-reveal (driven by v-reveal directive) ── */
.reveal { opacity: 0; transform: translateY(22px); }
.reveal-in {
  opacity: 1; transform: none;
  transition: opacity .72s var(--ease-out), transform .72s var(--ease-out);
}

/* ── Global theme-toggle button ── */
.theme-toggle {
  width: 34px; height: 34px; border-radius: 50%;
  background: transparent; border: 1px solid var(--border);
  color: var(--text2); font-size: 0.9rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s var(--ease-out); flex-shrink: 0;
}
.theme-toggle:hover { border-color: var(--accent); color: var(--accent); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
  .reveal { opacity: 1; transform: none; }
}

@media (max-width: 680px) {
  .m-container { width: min(100% - 36px, var(--max)); }
}
</style>
