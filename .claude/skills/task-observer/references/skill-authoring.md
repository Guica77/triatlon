# Skill Authoring — taxonomy, licensing, confidentiality, editing rules

Load this before creating or making substantial changes to a skill.

## Taxonomy

Open-source skills are client-agnostic and methodology-driven. Internal skills contain project-specific or personal context. When uncertain, default to open-source and generalise.

## Pre-flight principle

Every skill with explicit rules needs a verification step where the agent re-reads the rules and checks its output against them before delivery. Embedded commands must be independently verified against real data before being saved.

## Licensing and attribution

Open-source skills must identify their provenance, author attribution, licence, and feedback/support route. CC BY 4.0 is the default licence for prose and methodology skills.

## Editing rules

Treat live skill files as authoritative. For substantial changes, stage the full skill directory under a dated workspace update path, diff against the live version, and present the staged result for review. Never apply skill changes automatically during ordinary product work.

## Confidentiality

Generalise project-specific details before publishing an open-source skill. Review source material before drafting, perform a post-draft leakage sweep, and remove identifiable details when in doubt.

## Relocations

For verbatim relocations, compare the old and new file sets, exact-match non-empty lines where possible, and perform a substance and word-count sanity check. Preserve enforcement mechanisms, not only explanatory prose.
