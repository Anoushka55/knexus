import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      // AI Operations Control Tower agent theme (scoped under .aiops-theme —
      // see src/app/agents/aiops-sentry/aiops-theme.css). Namespaced so it
      // never collides with the rest of the marketplace's styling.
      borderRadius: {
        "aiops-sm": "var(--radius-sm)",
        "aiops-md": "var(--radius-md)",
        "aiops-lg": "var(--radius-lg)",
        "aiops-xl": "var(--radius-xl)",
        // Enterprise Architecture Intelligence agent theme (scoped under
        // .ea-theme — see src/app/agents/enterprise-architecture-agent/console/ea-theme.css).
        "ea-sm": "var(--radius-sm)",
        "ea-md": "var(--radius-md)",
        "ea-lg": "var(--radius-lg)",
        "ea-xl": "var(--radius-xl)",
      },
      colors: {
        brand: {
          blue: "#1a3a8f",       // Knexus Blue — primary CTA, .AI accent, links, badges
          "blue-dark": "#152d72", // hover state for blue
          navy: "#0f172a",        // Knexus Navy — dark backgrounds, footer
          soft: "#eaf1ff",        // Knexus Blue Soft — hover surfaces, tinted backgrounds
          violet: "#8B5CF6",
          green: "#16a34a",       // Knexus Green — AI Stack accents, highlights
          "green-dark": "#15803d",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        navy: "var(--navy)",
        "navy-foreground": "var(--navy-foreground)",
        blue: "var(--blue)",
        teal: "var(--teal)",
        "teal-foreground": "var(--teal-foreground)",
        crimson: "var(--crimson)",
        amber: "var(--amber)",
        success: "var(--success)",
        surface: "var(--surface)",
        sidebar: "var(--sidebar)",
        "sidebar-foreground": "var(--sidebar-foreground)",
        "sidebar-accent": "var(--sidebar-accent)",
        "sidebar-accent-foreground": "var(--sidebar-accent-foreground)",
        "sidebar-border": "var(--sidebar-border)",
        // Engineering Observability Command Center agent theme (scoped under
        // .eng-obs-theme — see
        // src/app/agents/engineering-observability-command-center/console/eng-obs-theme.css).
        // Namespaced so it never collides with the rest of the marketplace's
        // styling or with the other agents' own color groups above.
        //
        // KPMG DICE agent theme (scoped under .kpmg-dice-theme — see
        // src/app/agents/kpmg-dice/console/kpmg-dice-theme.css) shares this
        // "kpmg" group — both themes define their own values for the shared
        // sub-keys (blue/purple/teal) via scoped CSS variables, and each adds
        // its own extra sub-keys, so this is a safe union, not a collision.
        kpmg: {
          "blue-dark": "var(--kpmg-blue-dark)",
          blue: "var(--kpmg-blue)",
          "blue-mid": "var(--kpmg-blue-mid)",
          "blue-hover": "var(--kpmg-blue-hover)",
          "blue-light": "var(--kpmg-blue-light)",
          cyan: "var(--kpmg-cyan)",
          purple: "var(--kpmg-purple)",
          teal: "var(--kpmg-teal)",
          navy: "var(--kpmg-navy)",
          lightblue: "var(--kpmg-lightblue)",
          violet: "var(--kpmg-violet)",
          magenta: "var(--kpmg-magenta)",
        },
        status: {
          critical: "var(--status-critical)",
          warning: "var(--status-warning)",
          healthy: "var(--status-healthy)",
          info: "var(--status-info)",
          neutral: "var(--status-neutral)",
        },
        "occ-surface": {
          main: "var(--occ-surface-main)",
          chrome: "var(--occ-surface-chrome)",
          border: "var(--occ-surface-border)",
        },
        rail: {
          DEFAULT: "var(--kpmg-rail)",
          900: "var(--kpmg-rail-900)",
          800: "var(--kpmg-rail-800)",
          700: "var(--kpmg-rail-700)",
          600: "var(--kpmg-rail-600)",
          500: "var(--kpmg-rail-500)",
        },
        // KPMG DICE's own status palette — kept distinct from the generic
        // "status" group above (used by Engineering Observability), since
        // the two apps use different sub-key names for the same concept.
        "dice-status": {
          success: "var(--kpmg-status-success)",
          warning: "var(--kpmg-status-warning)",
          danger: "var(--kpmg-status-danger)",
          info: "var(--kpmg-status-info)",
        },
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "float-mid": "float 4.5s ease-in-out infinite",
        "float-fast": "float 3.5s ease-in-out infinite",
        "fade-in": "fadeIn 0.35s ease-out both",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)",
        "card-hover": "0 10px 30px -5px rgba(26,58,143,0.12), 0 4px 6px -4px rgba(0,0,0,0.08)",
        rail: "inset -1px 0 0 rgb(255 255 255 / 0.06)",
      },
    },
  },
  // tailwindcss-animate powers the animate-in/animate-out utilities used by
  // the Radix UI primitives ported for the Engineering Observability
  // Command Center and KPMG DICE agents' dialog/dropdown-menu/select/tooltip
  // components.
  plugins: [animate],
};

export default config;
