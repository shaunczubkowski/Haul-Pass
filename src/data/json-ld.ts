// Canonical source for homepage JSON-LD structured data.
// Imported by layout.tsx (for component exports / tests) and page.tsx (for rendering).
// Keeping the data here prevents duplication and divergence.

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.getfillright.com";

export const jsonLdFaqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much gas do I need to return a U-Haul?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It depends on your truck size, the fuel level at pickup, your current level, and how far you still need to drive. Use FillRight to get the exact gallon count for your specific U-Haul truck — it accounts for tank capacity, fuel efficiency, and a small safety buffer so you return at or above the level on your contract.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if I return a U-Haul without enough fuel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "U-Haul charges a $30 fuel service fee plus above-market per-gallon rates to top up the difference. You end up paying significantly more than you would at a regular gas station. FillRight helps you avoid this by showing you exactly how many gallons to add before returning.",
      },
    },
    {
      "@type": "Question",
      name: "Does U-Haul use regular gas or diesel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All U-Haul trucks use regular unleaded gasoline — never diesel. Penske trucks use diesel fuel. Budget and Enterprise trucks use regular unleaded. FillRight displays the correct fuel type for every supported truck so you fill up at the right pump.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate is the fuel gauge on a moving truck?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Moving truck fuel gauges can lag or read slightly low, especially after refueling. FillRight adds a small safety buffer to your calculation to account for this, so you're protected even if the gauge isn't perfectly accurate when you return.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use FillRight for Penske, Budget, and Enterprise trucks?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. FillRight supports all four major rental companies: U-Haul, Penske, Budget, and Enterprise. Each company's trucks have accurate tank capacity and fuel efficiency data built in, so your calculation is specific to your exact truck model.",
      },
    },
    {
      "@type": "Question",
      name: "How do I avoid the U-Haul fuel surcharge?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Return the truck at or above the fuel level shown on your rental contract. FillRight calculates the exact number of gallons you need to add — accounting for your current fuel level and any remaining miles to the drop-off location — so you can fill up at a regular gas station and avoid the surcharge entirely.",
      },
    },
    {
      "@type": "Question",
      name: "What is U-Haul's fuel policy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "U-Haul requires you to return the truck at the same fuel level documented on your rental agreement at the time of pickup. If you return it below that level, U-Haul charges a service fee plus per-gallon refueling costs at their rates, which are typically higher than local gas station prices.",
      },
    },
  ],
};

export const jsonLdHowToData = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Calculate Fuel Needed to Return a Rental Truck",
  description:
    "Use FillRight to find the exact gallons to add before returning your U-Haul, Penske, Budget, or Enterprise truck and avoid the fuel surcharge.",
  url: siteUrl,
  step: [
    {
      "@type": "HowToStep",
      name: "Select your truck",
      text: "Choose your rental company (U-Haul, Penske, Budget, or Enterprise) and truck size. FillRight has accurate tank capacity and fuel efficiency data for every model.",
    },
    {
      "@type": "HowToStep",
      name: "Enter your fuel levels",
      text: "Set the gauge level shown on your rental contract at the time of pickup, then set your current fuel level using the gauge selector.",
    },
    {
      "@type": "HowToStep",
      name: "Add your remaining distance",
      text: "If you have miles left to drive before the drop-off, enter that distance. FillRight subtracts the fuel you'll burn so your return level stays above the required amount.",
    },
    {
      "@type": "HowToStep",
      name: "Get your answer",
      text: "FillRight instantly shows the exact gallons to add, plus an optional cost estimate if you enter the current gas price. Fill up at any regular gas station and return the truck with confidence.",
    },
  ],
};
