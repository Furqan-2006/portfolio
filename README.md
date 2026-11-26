# Portfolio

Content-driven portfolio site built with Astro and Tailwind. Projects are Markdown files; the site generates the home page, project index, filters and case-study pages from them.

## Add a project

1. Copy `src/content/projects/_template.md.example` to `src/content/projects/<slug>.md` (the slug becomes the URL).
2. Fill in the front matter. The build fails with a clear message if a field is missing or invalid (schema: `src/content.config.ts`).
3. Write the four required sections, with exactly these headings: `## Problem`, `## Design`, `## Evidence`, `## Limits and next steps`. The build fails if one is missing (`scripts/check-content.mjs`).
4. Run `npm run build`. Set `draft: true` to keep an unfinished project out of the site.

## Update a project

Edit its file and bump `updated`. Change `status` when the truth changes, for example from `design-complete` to `running`.

## Status labels

| Status | Meaning |
| --- | --- |
| `running` | Works end to end today |
| `measured` | Evaluated, with recorded results |
| `design-complete` | Specified and reviewed; implementation not finished |
| `in-progress` | Being built |

Put a number in `metrics` only if it comes from a recorded result or a count. Leave `repo` out for private repositories and set `repoVisibility: private`.

## Commands

```sh
npm install
npm run dev        # local server
npm run check      # content check + type check
npm run build      # check, then build to dist/
```

Site-wide facts (name, email, links) live in `src/site.ts`.

## Deployment

GitHub Actions builds and deploys to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`). The URL and base path come from the environment, and every internal link goes through `src/lib-url.ts`, so nothing is hard-coded to a path.

To move to a custom domain: set `SITE_URL` to the domain and `BASE_PATH` to `/` in the workflow, and set the domain in the repository's Pages settings.

## Planned

Demos are declared per project (`demo.kind`: `replay`, `recording`, `live`). React islands for replay visualizers will be added when the first demo is built; nothing needs to change in the content model for that.
