# Workout Page Extraction

This folder contains the extracted **Workout page** and its direct dependencies from the main app.

## Extracted paths

- `src/pages/Workouts.jsx`
- `src/components/workout/AnatomyBody.jsx`
- `src/components/workout/BodySelector.jsx`
- `src/components/workout/ExerciseCard.jsx`
- `src/components/layout/Navbar.jsx`
- `src/components/ui/button.jsx`
- `src/contexts/LanguageContext.jsx`
- `src/data/exercises.js`
- `src/data/exerciseVideoResolver.js`
- `src/lib/utils.js`
- `src/assets/anatomy/**`
- `public/videos/back-muscles/**`
- `public/placeholder.svg`

## Notes

- Imports use the `@/` alias (mapped to `src`).
- This is an extraction of page-related files/assets, not a standalone app scaffold.
- Runtime dependencies still expected by these files include packages such as:
  - `react`
  - `react-router-dom`
  - `framer-motion`
  - `lucide-react`
  - `@radix-ui/react-slot`
  - `class-variance-authority`
  - `clsx`
  - `tailwind-merge`
