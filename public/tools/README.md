# Reference applications

Static builds of the three reference applications embedded on the case-study pages. They are
generated files: do not edit them by hand.

| Directory                | Source repository                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `factory-twin/`          | [Aberratio/factory-twin](https://github.com/Aberratio/factory-twin)                   |
| `production-docs-agent/` | [Aberratio/production-docs-agent](https://github.com/Aberratio/production-docs-agent) |
| `grant-assistant/`       | [Aberratio/grant-assistant](https://github.com/Aberratio/grant-assistant)             |

The exact commit of each build is pinned in `tools.lock.json` at the repository root.

## Refreshing a build

1. Put the new commit SHA (all 40 characters) in `tools.lock.json`.
2. Run `npm run tools:sync` (all tools) or `npm run tools:sync -- <slug>` (one tool). The
   script fetches that commit into a temporary directory, runs `npm ci` and `npm run build`,
   and replaces `public/tools/<slug>/` with the tool's `dist/`.
3. Commit the lock file and the rebuilt directory together.

The applications replay recorded runs on sample data and make no API calls. Each case-study
page embeds `/tools/<slug>/?embed=1&lang=<pl|en>` in a sandboxed iframe.
