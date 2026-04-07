# Quality Standards

**Version:** 1.0  
**Last updated:** April 2026

## 1. File Size Rule (Mandatory)
- No file may exceed **500 lines of code**
- If exceeded → immediate refactor and split into single-responsibility files (SRP)

## 2. Responsiveness (Mandatory)
- All components and pages must be **100% responsive**
- Support Mobile, Tablet and Desktop
- Prefer mobile-first approach
- Use consistent breakpoints

## 3. Accessibility (A11y) (Mandatory)
- Meet **WCAG 2.2 AA** minimum level
- Ensure proper contrast, keyboard navigation, alt texts, ARIA attributes and logical tab order
- Use `audit-website` skill on major deliveries

## 4. Testing Strategy (Mandatory)
- Write tests for all new or changed code
- Unit tests for components, hooks and utilities
- Integration tests for critical flows
- Prefer TDD (tests before or together with implementation)
- Target ≥ 80% coverage on new functionality

## 5. Code Style & Linting (Mandatory)
- Enforce ESLint + Prettier + TypeScript strict mode
- No commits allowed with linting errors

---

**End of Quality Standards**