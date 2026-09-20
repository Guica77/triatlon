# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `gh issue edit <number> --remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repository from `git remote -v`; `gh` does this automatically when run inside the clone.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run:

```bash
gh issue view <number> --comments
```

## Wayfinding operations

The `/wayfinder` map is a single issue labelled `wayfinder:map`, holding the Notes, Decisions-so-far, and Fog sections. Child work is represented by linked GitHub sub-issues when available.

Where GitHub issue dependencies are available, represent blockers with native issue dependencies. Otherwise, add a `Blocked by: #<n>` line to the child issue body.

The first action when claiming a wayfinding ticket is:

```bash
gh issue edit <number> --add-assignee @me
```

When resolving a ticket, comment with the answer, close the issue, and append a context pointer to the map's Decisions-so-far section.
