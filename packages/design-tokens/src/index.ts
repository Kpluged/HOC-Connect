export const hocColors = {
  light: {
    canvas: "#FFFFFF",
    border: "hsla(225, 66.7%, 1.2%, 0.14)",
    surface: "hsl(240, 10%, 95%)",
    frosted: "hsla(240, 5%, 70%, 0.148)",
    primary: "hsl(225, 66.7%, 1.2%)",
  },
  dark: {
    canvas: "hsl(225, 66.7%, 1.2%)",
    border: "hsla(225, 100%, 99%, 0.14)",
    surface: "hsl(240, 2%, 10%)",
    frosted: "hsla(240, 2%, 43%, 0.228)",
    primary: "hsl(225, 100%, 99%)",
  },
  signal: "#D5001C",
  onSignal: "#FFFFFF",
  focus: "#1A44EA",
} as const;

export const hocRadii = {
  container: 0,
  field: 4,
  card: 8,
  control: 999,
} as const;

export const hocMotion = {
  enterMs: 500,
  overlayMs: 380,
  staggerMs: 40,
  hoverMs: 160,
  countMs: 900,
  totalMs: 240,
  easeOut: [0.16, 1, 0.3, 1],
} as const;
