# Spec: European Coach Positioning & Flat Pricing

Design specification for adjusting the triathlon application towards the European coach market pitch, with €99 flat-rate pricing and active competitor comparisons.

## 1. Goal

Highlight our natural advantage over TrainingPeaks:
- **Euro-first & Multilingual**: Supports Euro (€) pricing natively and tailored copy.
- **Flat-Rate Model**: €99/month flat fee for unlimited athletes compared to TrainingPeaks' expensive pay-per-athlete pricing ($270/month for 30 athletes).
- **Multisport Core**: Designed for Triatlón + Ciclismo + Running.

## 2. Proposed Changes

### Landing Client (`app/landing-client.tsx`)
- Refactor the Hero copy and marketing elements to state: "Plataforma europea para entrenadores de Triatlón, Ciclismo y Running".
- Update pricing cards:
  - Add **Plan Entrenador Pro** card at €99/month (flat rate, unlimited athletes).
  - List Coach Pro features (dashboard, chat, alerts, roster).
- Add an interactive **TrainingPeaks vs. Triatlon Pro savings calculator** with a slider for roster size (5 to 50 athletes).

### Settings Billing Card (`components/settings/billing-card.tsx`)
- Update the Coach tier pricing from `79,00€` to `99,00€` per month.
- Emphasize the €99 flat-rate policy and comparison in the plan description copy.

### Verification Plan
- Verify that changes compile cleanly.
- Run `npm run build` to ensure type-checking passes.
- Verify unit/integration tests to ensure no regressions in subscription switching.
