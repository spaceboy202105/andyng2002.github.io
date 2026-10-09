# Andy's academic website

Astro and TypeScript generate the bilingual static website. The first public version contains the approved profile, portrait, contact links and two newly typeset CVs. Publications, projects and Blog remain empty until the site owner selects content. Google Scholar is intentionally omitted because the previous address identified another person.

The public origin is `https://spaceboy202105.github.io`; the deployment base is `/andyng2002.github.io/`. Keep these separate. The site address is <https://spaceboy202105.github.io/andyng2002.github.io/>. Workflow configuration alone does not prove deployment. See the [development specification](docs/superpowers/specs/2026-10-08-personal-site-development.md), [glossary](GLOSSARY.md) and [tracked tasks](docs/implementation-issues.json) for scope and delivery status.

## Run and check

Use Node 24, as CI does. `package.json` permits Node 24 or 25. Install the locked dependencies and Chromium before verification.

```sh
npm ci
npx playwright install chromium
npm run dev
```

CV tests also need XeLaTeX, latexmk, CTEX, Fandol, TeX Gyre, xurl and Poppler (`pdftotext`, `pdftoppm`). On macOS, install a TeX Live distribution with those packages and Poppler. On Ubuntu, the workflow installs `texlive-xetex latexmk texlive-lang-chinese texlive-latex-extra texlive-fonts-recommended fonts-texgyre poppler-utils` and verifies the tools and font files before testing.

```sh
npm run verify
SITE_URL=https://spaceboy202105.github.io SITE_BASE_PATH=/andyng2002.github.io/ npm run verify:release
```

`verify` checks types, content boundaries, CV recovery, artifact exclusion, root-path browsing, CV availability and full `/preview/` browsing. It then builds the configured site and checks its output. `verify:release` adds the explicit formal origin/base, formal input directories and both verified CV requirements. Empty work collections are valid. A failed check exits nonzero.

Individual commands are `test:content`, `test:artifacts`, `test:e2e`, `test:cv`, `test:cv-missing`, `test:subpath`, `build` and `check:artifacts`. Build-based test files run sequentially because Astro also writes shared generated files in `.astro/`. Browser suites build their own isolated output. Subpath checks use port 4353 and `.test-dist-subpath`; they do not use `dist` as a fixture. `dist.manifest.json` records output hashes and build settings outside the public directory. Generated HTML links, image sources, image candidates and anchors must resolve under the configured base.

## Maintain approved content

Content lives in `src/content`. A Markdown filename is its stable identifier. `approved: true` is an explicit publication decision, not a convenience for previewing a draft. `featured: true` separately marks an owner-selected homepage work. The build skips unapproved entries before reading their optional details. Never copy `raw/` or the synthetic `tests/fixtures` into public inputs.

| Collection | Required public fields | Optional fields |
| --- | --- | --- |
| `profile/main.md` | `approved`, `brand`, bilingual `name`, `bio`, `portraitAlt`, `portrait`, `contacts` with `label` and `href` | None |
| `publications/<id>.md` | `approved`, formal `title`, ordered `authors`, `year`, `status`, bilingual `summary` | `featured`, `venue`, `paperUrl`, `codeUrl`, `cover` with bilingual `coverAlt` |
| `projects/<id>.md` | `approved`, bilingual `name`, `summary`, `role`, `coverAlt`, `cover` | `featured`, `date`, `codeUrl`, `demoUrl` |
| `blog/<version-id>.md` | `approved`, `storyId`, `lang`, `originalLang`, `title`, `publishedAt`, `tags`, Markdown body | `updatedAt`, `summary`, `relatedPublications`, `relatedProjects` |

Bilingual fields use `en` and `zh` keys. Dates use `YYYY-MM-DD`. Publication status is one of `preprint`, `submitted`, `accepted`, `published`; it must match the verified public record. Related IDs must identify approved entries. Translations share `storyId`, `originalLang` and `publishedAt`, with distinct `lang` values. A single-language article appears in both interfaces with its actual body language identified.

Only Blog files have Markdown bodies. Use headings for the generated table of contents, fenced code, `$...$` or `$$...$$` for math, and an ordinary paragraph below an image for its caption. Raw HTML is rejected. Internal links use site-relative paths such as `/en/projects/#selected`; the build adds the deployment base and verifies the destination. A local image can use `../../assets/<filename>.png` (also JPG, WebP or AVIF). Image files belong in `src/assets`. External links use HTTP or HTTPS.

`public/` is copied verbatim, so every file must be listed explicitly in `scripts/public-files.json`. Keep the allowlist narrow. Approved CVs are `public/cv/zh.pdf` and `public/cv/en.pdf`. Missing optional URLs produce no link; missing or stale CV files never receive a download link.

## Rebuild and inspect CVs

Edit the approved public details in `cv/zh.tex` and `cv/en.tex`, with shared formatting in `cv/style.tex`. The sources are trusted, reviewed site inputs; this is not a service for arbitrary uploaded TeX. Never use an old CV or sanitized reference PDF as the public version.

```sh
npm run build:cv
mkdir -p .audit/cv
pdfinfo public/cv/zh.pdf
pdfinfo public/cv/en.pdf
pdftotext public/cv/zh.pdf .audit/cv/zh.txt
pdftotext public/cv/en.pdf .audit/cv/en.txt
pdftoppm -png -r 120 public/cv/zh.pdf .audit/cv/zh
pdftoppm -png -r 120 public/cv/en.pdf .audit/cv/en
```

Inspect every rendered page and extracted text for private fields, missing characters, clipping, line breaks and matching bilingual facts. A successful compiler does not replace that inspection. The build stages both PDFs, verifies them and updates `cv/manifest.json` with source and PDF hashes. A failed second compilation or replacement restores the previous pair and manifest. Commit reviewed sources, both PDFs and the manifest together. Website builds verify the committed pair without silently retypesetting it on another machine.

## Publish

Pull requests run `.github/workflows/verify.yml` with read-only repository permission and no deployment. `.github/workflows/deploy.yml` runs on pushes to `master` and can also be started manually on `master`. It runs the entire release check before uploading only `dist`; deployment depends on that successful job and uses the `github-pages` environment with Pages and identity-token write permissions.

Repository Pages settings must use GitHub Actions and the environment must allow `master`. Confirm those settings, run the manual workflow, then inspect the actual site and both downloadable PDFs. Each subsequent `master` update follows the same checked build and deployment sequence. A failing build cannot upload or deploy new output through this workflow.
