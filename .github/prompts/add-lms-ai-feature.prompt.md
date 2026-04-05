---
description: "Add one AI enhancement at a time to the existing LMS admin dashboard without changing layout or refactoring unrelated code."
name: "Add LMS AI Feature"
argument-hint: "Feature name, target page, data source, and whether backend OpenAI route already exists"
agent: "LMS AI Enhancements Agent"
---
Implement exactly one LMS AI feature as an additive enhancement.

Inputs:
- Feature: ${input:feature}
- Target page/component: ${input:target}
- Data sources: ${input:data}
- Backend OpenAI route exists: ${input:routeReady}

Requirements:
- Keep current layout and component structure unchanged.
- Add modular components/services/routes only.
- Use backend-side OpenAI integration only.
- Minimize styling and keep current visual language.

Output:
1. Added files
2. Modified files with exact integration points
3. Why this is non-breaking
4. Validation commands run and outcomes
5. Any env/config setup needed
