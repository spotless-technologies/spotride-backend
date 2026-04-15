export const PRICING_CONFIG = {
  NG: {  // Nigeria
    currency: "NGN",
    REGULAR: 800,
    STANDARD: 1200,
    PREMIUM: 2000,
    ratePerKm: 250,
    ratePerMin: 40,
    bookingFee: 150,
  },
  KE: {  // Kenya (example)
    currency: "KES",
    REGULAR: 450,
    STANDARD: 680,
    PREMIUM: 1200,
    ratePerKm: 35,
    ratePerMin: 8,
    bookingFee: 80,
  },
} as const;