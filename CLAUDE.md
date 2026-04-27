# ai-sdlc-patient-portal Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-28

## Active Technologies
- TypeScript 5 / Node.js 20 + Next.js 14.2, React 18, axios (existing), sonner (existing), Zustand 5, react-hook-form 7, Zod 3.22 (042-login-api-integration)
- httpOnly cookie (`auth_session`) for JWT; Zustand persist (localStorage) for user metadata (042-login-api-integration)
- TypeScript 5 / Node.js 20 + Next.js 14.2, React 18, axios (existing), sonner (existing), Zustand 5 (existing), @tanstack/react-query 5 (existing from 041) (043-user-detail-api-integration)
- N/A (no new storage; React Query in-memory cache; Zustand localStorage persist unchanged) (043-user-detail-api-integration)

- TypeScript 5 / Node.js 20 + Next.js 14.2, React 18, axios (new), sonner (new), Zustand 5, react-hook-form 7, Zod 3.22, @tanstack/react-query 5 (041-registration-api-integration)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5 / Node.js 20: Follow standard conventions

## Recent Changes
- 043-user-detail-api-integration: Added TypeScript 5 / Node.js 20 + Next.js 14.2, React 18, axios (existing), sonner (existing), Zustand 5 (existing), @tanstack/react-query 5 (existing from 041)
- 042-login-api-integration: Added TypeScript 5 / Node.js 20 + Next.js 14.2, React 18, axios (existing), sonner (existing), Zustand 5, react-hook-form 7, Zod 3.22

- 041-registration-api-integration: Added TypeScript 5 / Node.js 20 + Next.js 14.2, React 18, axios (new), sonner (new), Zustand 5, react-hook-form 7, Zod 3.22, @tanstack/react-query 5

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
