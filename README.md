# Haul Pass

**Moving Truck Fuel Return Calculator**

Calculate exactly how many gallons of fuel to add before returning your U-Haul or moving truck. No more guessing at the pump — avoid surprise fuel charges.

## The Problem

When you rent a U-Haul, your contract shows the fuel level at pickup. You must return it at that same level. But standing at a gas pump, trying to guess how much to add to hit a specific gauge mark on an analog gauge is a frustrating guessing game — and getting it wrong means a $30+ service fee on top of fuel costs.

**Haul Pass solves this.** Input your truck size, pickup level, current level, and distance to the drop-off. Get the exact gallons to add.

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Testing:** Vitest + React Testing Library (TDD)
- **Deployment:** Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development

This project uses **Test-Driven Development (TDD)**. Write tests before implementation.

```bash
npm test                # Run all tests once
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run lint            # ESLint
```

## Project Structure

```
src/
├── app/           # Next.js App Router pages and layouts
├── components/    # React components
│   └── ui/        # Base UI components (shadcn/ui)
├── data/          # Static data (truck fleet definitions)
│   └── __tests__/ # Data tests
├── lib/           # Business logic (calculator engine)
│   └── __tests__/ # Unit tests (TDD)
├── types/         # TypeScript type definitions
└── test/          # Test setup and utilities
```

## Roadmap

See [GitHub Issues](https://github.com/shaunczubkowski/Haul-Pass/issues) for the full backlog organized by milestone.

| Milestone | Focus |
|-----------|-------|
| **MVP** | Core fuel return calculator — truck selector, visual gauge, result card |
| **v1.0** | Trip calculator, route builder, fuel stop planner, risk tolerance |
| **v2.0** | AI gauge reading via camera, embeddable widget, white-label |

## Contributing

1. Pick an issue from the [backlog](https://github.com/shaunczubkowski/Haul-Pass/issues)
2. Create a branch: `git checkout -b feature/brief-description`
3. **Write tests first** (TDD is required)
4. Implement the feature to make tests pass
5. Open a PR against `main`
6. All agents/reviewers leave individual comments before merge
