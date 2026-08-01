# SkillBridge styles

`src/styles.css` is the only stylesheet imported by the application. It loads the
modules below in cascade order.

## Where to edit

- `base/tokens.css`: colors and shared CSS variables.
- `base/shared.css`: reset, public layout, authentication, buttons, fields, cards,
  tables, messaging, and other shared building blocks.
- `portals/jobseeker.css`: individual-user portal.
- `portals/company.css`: company and training-provider portal.
- `portals/admin.css`: administrator portal.
- `features/account-security.css`: password and account-security screens.
- `features/portfolio-evidence.css`: shared/older portfolio evidence components.
- `features/evidence-portfolio.css`: current Evidence Portfolio experience.
- `features/work-hub.css`: detailed accepted-work hub.
- `features/work-overview.css`: active-work list and tabs.
- `features/freelance-and-training.css`: freelance proposals, CV upload, milestones,
  team records, and University Training.
- `features/evidence-workflow.css`: criteria and evidence evaluation workflow.
- `features/talent-directory.css`: company talent search and evidence profiles.
- `themes/unified.css`: unified light theme and compatibility dark mode.
- `themes/experience-marketplace.css`: current visual theme and final overrides.

## Rules

1. Put feature-specific styles in the matching feature file.
2. Put reusable controls in `base/shared.css`.
3. Put colors in `base/tokens.css` instead of repeating values when practical.
4. Keep the import order in `src/styles.css`; later files intentionally override
   earlier compatibility styles.
5. Keep responsive rules beside the feature they affect.
