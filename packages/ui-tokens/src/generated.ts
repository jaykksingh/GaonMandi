// Generated from design/tokens.json. Do not edit by hand.
export const tokens = {
  color: {
    bg: {
      canvas: "#F7F5EF",
      surface: "#FFFFFF",
      subtle: "#EFEBE1",
    },
    text: {
      primary: "#1B1F1A",
      secondary: "#3F4A40",
      inverse: "#FFFFFF",
      disabled: "#6E756D",
    },
    border: {
      default: "#D9D3C4",
      strong: "#8A8577",
    },
    brand: {
      default: "#1E6B3A",
      strong: "#14502A",
      soft: "#DCEFE2",
      onBrand: "#FFFFFF",
    },
    fish: {
      default: "#1C5D8C",
      soft: "#DCEAF5",
    },
    crop: {
      default: "#8A5A12",
      soft: "#F6E8CF",
    },
    fresh: {
      ok: "#1E6B3A",
      okSoft: "#DCEFE2",
      soon: "#8A5300",
      soonSoft: "#FCEBC9",
      urgent: "#A3261B",
      urgentSoft: "#F9DEDA",
    },
    bid: {
      highest: "#5A2E8C",
      soft: "#ECE3F6",
    },
    danger: {
      default: "#A3261B",
      soft: "#F9DEDA",
    },
  },
  font: {
    family: {
      devanagari: ["Noto Sans Devanagari", "sans-serif"],
      latin: ["Noto Sans", "sans-serif"],
    },
    size: {
      display: 32,
      title: 22,
      heading: 18,
      body: 16,
      label: 14,
      caption: 13,
    },
    weight: {
      regular: "400",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      devanagari: 1.4,
      latin: 1.3,
    },
  },
  space: {
    "1": 4,
    "2": 8,
    "3": 12,
    "4": 16,
    "5": 20,
    "6": 24,
    "8": 32,
    "10": 40,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
  size: {
    touchMin: 48,
    buttonPrimary: 56,
    categoryIcon: 48,
    shutter: 72,
    avatar: 40,
  },
  shadow: {
    sheet: "0 -4px 16px rgba(27, 31, 26, 0.16)",
  },
  motion: {
    duration: 180,
    easing: [0, 0, 0.2, 1],
  },
} as const;
