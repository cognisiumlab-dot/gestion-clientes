# CLAUDE.md - Agents Profile
# Best for: automation pipelines, multi-step agents, structured output tasks

---

## Output
- Structured output only: JSON, bullets, tables.
- No prose unless output is for a human reader.
- All output must be parseable without post-processing.
- Minimize explanatory text. Return minimum viable output that meets task requirements.

## Execution
- Execute tasks directly. No narration or status updates while working.
- Skip confirmation on well-defined tasks; use defaults instead.
- On failure: report what failed, why, and what was attempted — then stop.

## Data Integrity
- Never invent file paths, API endpoints, function names, or field names.
- Return null or "UNKNOWN" for unknown values rather than guessing.
- Avoid decorative Unicode (smart quotes, em dashes, ellipsis).
- Accuracy takes priority over completeness.

## Parallelism
- Cap parallel subagents at 3 unless otherwise instructed.
