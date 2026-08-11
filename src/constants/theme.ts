export const colors = {
  bg: '#fffbf8',
  surface: '#ffffff',
  surfaceSoft: '#f8f2fb',
  border: '#e9e0eb',
  borderStrong: '#d8c9dd',
  text: '#251a2c',
  muted: '#695f70',
  subtle: '#8c8192',
  primary: '#51237b',
  primaryPressed: '#3f195f',
  primarySoft: '#f1e8f7',
  accent: '#247c73',
  accentSoft: '#e3f3f0',
  sky: '#e7f2f8',
  mint: '#e3f3f0',
  warning: '#a76108',
  warningSoft: '#fff1d8',
  danger: '#b42318',
  dark: '#1f1034',
  onPrimary: '#fff7f0',
  dangerSoft: '#fde8e6',
  dangerBorder: '#f4b8b2',
};

export const radius = {
  xl: 28,
  lg: 20,
  md: 14,
  sm: 10,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
};

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '900' as const, letterSpacing: -1 },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '900' as const, letterSpacing: -0.6 },
  h2: { fontSize: 21, lineHeight: 27, fontWeight: '800' as const, letterSpacing: -0.25 },
  h3: { fontSize: 17, lineHeight: 23, fontWeight: '800' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '700' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '700' as const },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' as const },
};

export const shadows = {
  card: {
    shadowColor: '#301342',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#301342',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
};
