# Public CV sources

`zh.tex` and `en.tex` contain the approved name, public contacts, education and research interests. Both use `style.tex`. Unselected publications, projects, awards and private resume material are excluded.

Install XeLaTeX, latexmk, CTEX, Fandol and TeX Gyre fonts through TeX Live. The style loads TeX-installed font filenames, so it does not depend on macOS font registration. Run `npm ci`, then `npm run build:cv`. Missing TeX tools or compilation failures stop the command.

The command stages both languages before replacing `public/cv/zh.pdf`, `public/cv/en.pdf` and `cv/manifest.json`. The manifest records SHA-256 hashes of all `.tex` sources and both PDFs. An update error restores the previous files. This is a single-writer build; do not run two CV builds against the same directories simultaneously. Process termination or a machine failure during replacement requires rebuilding before release.

`CV_SOURCE_DIR` and `SITE_PUBLIC_DIR` select isolated inputs and outputs. The manifest always lives in `CV_SOURCE_DIR`. Keep these paths separate. Only `.tex` compile inputs are copied into staging. Add external content as approved TeX source rather than reading local reference material.

Run `npm run test:artifacts`, `npm run test:cv` and `npm run test:cv-missing`. Browser tests generate clearly marked synthetic PDFs in ignored directories. Poppler (`pdftotext`, `pdftoppm`) is required for text and page inspection. After changing a real source, rebuild, extract the text, inspect every rendered page, and run `npm run verify`. A missing PDF hides only that locale; a changed source or corrupt PDF fails artifact checks. Both final PDFs are required for a complete release.
