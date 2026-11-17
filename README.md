# CampusConnect Pro

Smart Lost and Found System with Supabase and intelligent item matching.

## What changed in this upgrade

This version moves the app from a single-file prototype into a cleaner, more maintainable foundation that is easier to extend with real authentication, stronger moderation, and better match analysis.

### Included improvements

- Modern Vite-based frontend structure
- Dedicated modules for mock data and matching logic
- Better dashboard and layout for reports, matches, and admin review
- More advanced styling and mobile-friendly UX
- Database schema starter for Supabase with security-focused design
- Stronger project documentation and run instructions

## Tech stack

- HTML / CSS / JavaScript
- Vite
- Supabase JS client
- Advanced matching logic using token similarity

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal, typically:

```text
http://localhost:3000
```

## Production-ready roadmap

This repo is now structured for the next stage of development, which includes:

- Supabase auth and RLS policies
- real item claims and admin approval flows
- match confidence scoring
- analytics dashboard
- moderation and reporting tools
- deployment through CI/CD

## Supabase starter schema

The `supabase/schema.sql` file includes a foundation for:

- users and roles
- item reports
- claim verification
- admin moderation
- image storage references

## Advanced notes

The current match system is a meaningful upgrade over a naive prototype because it compares item names, descriptions, and locations using normalized token overlap and confidence weighting.

This provides a better base for future enhancements such as:

- category-based matching
- color and brand analysis
- semantic embeddings
- confidence thresholds
- AI-assisted recommendations
