---
description: "Use when adding or updating LMS admin AI features (summary panel, ask AI, report modal, floating assistant, smart filters) in React + Node.js while keeping layout unchanged and integrations non-breaking."
name: "LMS AI Integration Rules"
applyTo: "frontend/src/**/*.jsx, frontend/src/**/*.js, backend/**/*.js"
---
# LMS AI Integration Rules

## Guardrails
- Additive changes only: do not remove or rewrite existing components.
- Preserve current layout hierarchy and route structure.
- Keep integrations modular through new components, hooks, services, routes, or controllers.

## OpenAI Usage
- Never expose secrets in frontend code.
- Use backend endpoints for all model calls.
- Read key from environment variables (for example `OPENAI_API_KEY`).
- Return concise JSON payloads for deterministic UI rendering.

## API Response Contract
Use structured responses where possible:
```json
{
  "ok": true,
  "data": {"summary": "...", "filters": {}, "insights": []},
  "error": null
}
```
On failure:
```json
{
  "ok": false,
  "data": null,
  "error": {"code": "AI_TIMEOUT", "message": "Try again"}
}
```

## Feature Integration Pattern
- Place feature UI in new files under `frontend/src/components/ai/`.
- Keep data fetching in `frontend/src/services/` wrappers.
- Add backend logic in new controller/route modules first, then mount minimally in existing server/router files.
- For table actions, add one new column/action only when required.

## Reliability
- Add loading and empty states for AI cards/modals/chat.
- Handle timeout/rate-limit errors and show non-blocking fallbacks.
- Ensure existing charts/tables render unchanged when AI endpoints fail.

## Validation Before Finalizing
- Frontend build passes.
- Backend starts without route/controller import errors.
- Existing pages still render with no AI feature enabled.
