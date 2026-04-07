# Architecture & Security Rules

**Version:** 1.0  
**Last updated:** April 2026

## Project Paradigm
- Frontend-only project (all logic resides in the frontend)
- Strong module isolation, DRY principle, maximum 500 lines per file

## Modularity Rules
- Features must be isolated in dedicated modules
- No circular or improper cross-imports
- Communication via shared state, service layer, or public interfaces only

## DRY Principle
Always check shared directories before creating new:
- Components
- Hooks
- Utilities

## Strict Typing
- `any` is **strictly forbidden** in TypeScript
- Use named interfaces/types for all public contracts

## No Hardcoding
- Never add magic strings, numbers or configurations directly in code
- Use named constants, environment variables or proper config files

## Credential Security (Mandatory)
- Hardcoded secrets (API keys, tokens, passwords, etc.) are **strictly forbidden**
- Store secrets only in `.env` files (never committed), platform environment variables or secret managers
- Always demonstrate correct use of environment variables

---

**End of Architecture Rules**