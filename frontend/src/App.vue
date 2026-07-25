<template>
  <router-view />
</template>

<script setup>
import { useTheme } from './composables/useTheme.js'
useTheme()
</script>

<style>
/* ── Meridian design tokens — dark (default) ── */
:root, [data-theme="dark"] {
  --bg:        #000000;
  --bg2:       #0c0c0c;
  --surface:   #111111;
  --surface2:  #1a1a1a;
  --text:      rgba(255,255,255,0.90);
  --text2:     rgba(255,255,255,0.50);
  --text3:     rgba(255,255,255,0.25);
  --border:    rgba(255,255,255,0.09);
  --border2:   rgba(255,255,255,0.05);
  --orange:    #E8500A;
  --orange-h:  #c43e09;
  --danger:    #e74c3c;
  --success:   #6ee7b7;
  --font:      'JetBrains Mono','Space Grotesk',monospace;
  color-scheme: dark;
}

[data-theme="light"] {
  --bg:        #f5f5f5;
  --bg2:       #ebebeb;
  --surface:   #ffffff;
  --surface2:  #f0f0f0;
  --text:      #000000;
  --text2:     #555555;
  --text3:     #999999;
  --border:    #e0e0e0;
  --border2:   #eeeeee;
  --orange:    #E8500A;
  --orange-h:  #c43e09;
  --danger:    #c0392b;
  --success:   #27ae60;
  color-scheme: light;
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

.page-enter-active, .page-leave-active { transition: opacity 0.2s ease; }
.page-enter-from, .page-leave-to { opacity: 0; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg2); }
::-webkit-scrollbar-thumb { background: var(--border); }
::-webkit-scrollbar-thumb:hover { background: var(--orange); }

button { font-family: inherit; }
a { font-family: inherit; }

/* ── Global theme-toggle button ── */
.theme-toggle {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--surface); border: 1px solid var(--border);
  color: var(--text2); font-size: 0.95rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; margin: 0 16px; flex-shrink: 0;
}
.theme-toggle:hover { border-color: var(--orange); color: var(--orange); }
</style>
