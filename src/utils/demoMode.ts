// Demo conveniences (Demo login tab, Quick Demo accounts, Navbar role switcher)
// log people in with the seeded default passwords or skip the password
// entirely — they must never ship in a production build by accident.
// On by default under `npm run dev`; a production build only gets them when
// explicitly built with VITE_ENABLE_DEMO=true (e.g. a training/demo server).
export const DEMO_MODE_ENABLED: boolean =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === 'true';
