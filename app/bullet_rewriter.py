"""
FR-11 — Intelligent CV Bullet Rewriter.

Design goals
------------
1. Fully local and deterministic.
2. Never invent metrics, technologies, outcomes, or responsibilities.
3. Rewrite weak openings conservatively.
4. Detect separately:
      - action
      - tools / technologies
      - scope
      - outcome
      - measurable metrics
5. Produce an explainable quality score.
6. Return actionable information for the frontend.
7. Keep the implementation fast and predictable.

The engine does NOT use an external LLM/API.
"""

from __future__ import annotations

import re
from typing import Any

from app.skills_taxonomy import ALIAS_TO_CANONICAL, ALL_SURFACE_FORMS


# ============================================================
# ACTION VERBS
# ============================================================

_ACTION_VERBS: dict[str, str] = {
    # Technical / engineering
    "built": "Built",
    "developed": "Developed",
    "designed": "Designed",
    "created": "Created",
    "implemented": "Implemented",
    "engineered": "Engineered",
    "architected": "Architected",
    "automated": "Automated",
    "optimized": "Optimized",
    "launched": "Launched",
    "deployed": "Deployed",
    "integrated": "Integrated",
    "migrated": "Migrated",
    "refactored": "Refactored",
    "configured": "Configured",

    # Analysis / research
    "analyzed": "Analyzed",
    "researched": "Researched",
    "evaluated": "Evaluated",
    "investigated": "Investigated",

    # Improvement
    "improved": "Improved",
    "reduced": "Reduced",
    "increased": "Increased",
    "accelerated": "Accelerated",
    "enhanced": "Enhanced",
    "streamlined": "Streamlined",

    # Leadership / management
    "led": "Led",
    "managed": "Managed",
    "coordinated": "Coordinated",
    "organized": "Organized",
    "facilitated": "Facilitated",
    "owned": "Owned",
    "drove": "Drove",

    # People
    "mentored": "Mentored",
    "trained": "Trained",
    "supported": "Supported",

    # Delivery
    "delivered": "Delivered",
    "presented": "Presented",
    "documented": "Documented",
    "maintained": "Maintained",
    "tested": "Tested",
    "debugged": "Debugged",

    # Generic acceptable verbs
    "completed": "Completed",
    "performed": "Performed",
    "used": "Used",
}


# ============================================================
# ACTION GROUPS
# ============================================================

_TECHNICAL_ACTIONS: frozenset[str] = frozenset({
    "built",
    "developed",
    "designed",
    "created",
    "implemented",
    "engineered",
    "architected",
    "automated",
    "optimized",
    "launched",
    "deployed",
    "integrated",
    "migrated",
    "refactored",
    "configured",
})


_LEADERSHIP_ACTIONS: frozenset[str] = frozenset({
    "led",
    "managed",
    "coordinated",
    "organized",
    "facilitated",
    "mentored",
    "trained",
})


# ============================================================
# WEAK OPENINGS
# ============================================================

_WEAK_STARTERS: tuple[tuple[re.Pattern[str], str], ...] = (
    (
        re.compile(r"^\s*worked\s+on\b", re.IGNORECASE),
        "Developed",
    ),
    (
        re.compile(r"^\s*worked\s+with\b", re.IGNORECASE),
        "Used",
    ),
    (
        re.compile(r"^\s*helped\s+with\b", re.IGNORECASE),
        "Supported",
    ),
    (
        re.compile(r"^\s*helped\b", re.IGNORECASE),
        "Supported",
    ),
    (
        re.compile(r"^\s*was\s+responsible\s+for\b", re.IGNORECASE),
        "Managed",
    ),
    (
        re.compile(r"^\s*responsible\s+for\b", re.IGNORECASE),
        "Managed",
    ),
    (
        re.compile(r"^\s*did\b", re.IGNORECASE),
        "Completed",
    ),
    (
        re.compile(r"^\s*made\b", re.IGNORECASE),
        "Created",
    ),
)


# ============================================================
# OUTCOME DETECTION
# ============================================================

# Outcome language means the bullet explicitly describes an impact,
# improvement, achievement, adoption, completion, or causal result.
#
# IMPORTANT:
# We do not consider an action itself to be an outcome.
#
# Example:
#   "Developed a React application"
#       -> False
#
#   "Developed a React application that simplified registration"
#       -> True

_OUTCOME_PATTERN = re.compile(
    r"""
    \b(?:
        # Improvement / impact
        improv\w* |
        reduc\w* |
        increas\w* |
        decreas\w* |
        sav\w* |
        boost\w* |
        accelerat\w* |
        streamlin\w* |
        simplif\w* |
        enhanc\w* |
        strengthen\w* |
        optimiz\w* |

        # Performance
        faster |
        slower |
        efficient |
        efficiently |
        reliable |
        securely |
        secure |
        performance |
        accuracy |

        # Adoption / users
        used\s+by |
        adopted\s+by |
        served\s+\d+ |
        serving\s+\d+ |
        support(?:ed|ing)?\s+\d+ |

        # Delivery / completion
        before\s+the\s+deadline |
        ahead\s+of\s+schedule |
        on\s+time |
        deliver\w*\s+.*\bbefore\s+the\s+deadline\b |
        complet\w*\s+.*\bon\s+time\b |

        # Explicit achievements
        successfull\w* |
        achiev\w* |
        won |
        awarded |
        recognized |

        # Causal/result language
        resulting\s+in |
        resulted\s+in |
        leading\s+to |
        led\s+to |
        enabling |
        enabled |
        allowing |
        allowed |
        which\s+resulted\s+in |
        which\s+led\s+to
    )\b
    """,
    re.IGNORECASE | re.VERBOSE,
)


# ============================================================
# METRIC DETECTION
# ============================================================

# Explicit numerical evidence only.
#
# We NEVER turn vague words into metrics.
#
# Examples:
#   40%
#   3x
#   200 ms
#   6 hours
#   120 users
#   500 records
#   from 20 to 50

_METRIC_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(
        r"\b\d+(?:\.\d+)?\s*%",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b\d+(?:\.\d+)?\s*x\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b\d+(?:\.\d+)?\s*"
        r"(?:"
        r"ms|milliseconds?|"
        r"s|sec|seconds?|"
        r"minutes?|"
        r"hours?|"
        r"days?|"
        r"weeks?|"
        r"months?"
        r")\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b\d+(?:\.\d+)?\s*"
        r"(?:"
        r"GB|MB|KB|TB|"
        r"requests?|"
        r"records?|"
        r"files?|"
        r"pages?|"
        r"features?|"
        r"tasks?|"
        r"users?|"
        r"students?|"
        r"people|"
        r"members?|"
        r"clients?|"
        r"customers?|"
        r"projects?|"
        r"teams?|"
        r"developers?|"
        r"employees?"
        r")\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bfrom\s+\d+(?:\.\d+)?\s+to\s+\d+(?:\.\d+)?\b",
        re.IGNORECASE,
    ),
)


# ============================================================
# SCOPE DETECTION
# ============================================================

# Scope describes the size/reach of the responsibility.
#
# Examples:
#   "Led a team of 4 students"
#   "Managed 3 projects"
#   "Served 120 users"
#
# Scope is NOT automatically considered an outcome.

_SCOPE_PATTERN = re.compile(
    r"\b\d+(?:\.\d+)?\s+"
    r"(?:"
    r"students?|"
    r"people|"
    r"users?|"
    r"members?|"
    r"clients?|"
    r"customers?|"
    r"projects?|"
    r"teams?|"
    r"developers?|"
    r"employees?"
    r")\b",
    re.IGNORECASE,
)


# ============================================================
# GENERIC TAXONOMY TERMS
# ============================================================

# These are not technologies by themselves.
#
# This prevents:
#
#   "testing"
#
# from accidentally becoming:
#
#   "unit testing"
#
# simply because the skills taxonomy contains a related phrase.

_GENERIC_TERMS: frozenset[str] = frozenset({
    "testing",
    "test",
    "debugging",
    "debug",
    "development",
    "design",
    "analysis",
    "research",
    "management",
    "deployment",
    "documentation",
    "programming",
    "coding",
    "software",
    "technology",
    "web",
    "application",
    "applications",
})


# ============================================================
# TOOL DETECTION CACHE
# ============================================================

_TOOL_PATTERN_CACHE: dict[str, re.Pattern[str]] = {}


def _get_tool_pattern(surface_form: str) -> re.Pattern[str]:
    """
    Get a cached regex for a taxonomy surface form.
    """

    key = surface_form.strip().lower()

    pattern = _TOOL_PATTERN_CACHE.get(key)

    if pattern is None:
        pattern = re.compile(
            rf"(?<![a-zA-Z0-9])"
            rf"{re.escape(key)}"
            rf"(?![a-zA-Z0-9])",
            re.IGNORECASE,
        )

        _TOOL_PATTERN_CACHE[key] = pattern

    return pattern


def _find_tools(text: str) -> list[str]:
    """
    Detect technologies explicitly present in the text.

    Never infer a technology.

    Example:

        "Developed a Django application"

    -> ["django"]

    But:

        "Worked on testing"

    must NOT become:

        ["unit testing"]
    """

    if not text:
        return []

    found: list[str] = []
    seen: set[str] = set()

    normalized_text = text.lower()

    for surface_form in ALL_SURFACE_FORMS:
        normalized_surface = surface_form.strip().lower()

        if not normalized_surface:
            continue

        if normalized_surface in _GENERIC_TERMS:
            continue

        canonical = ALIAS_TO_CANONICAL.get(surface_form)

        if not canonical:
            continue

        canonical_key = canonical.lower()

        if canonical_key in seen:
            continue

        pattern = _get_tool_pattern(surface_form)

        if pattern.search(normalized_text):
            found.append(canonical)
            seen.add(canonical_key)

    return found


# ============================================================
# TEXT HELPERS
# ============================================================

def _normalize_text(text: str) -> str:
    """
    Normalize whitespace without changing meaning.
    """

    if not isinstance(text, str):
        return ""

    return re.sub(r"\s+", " ", text.strip())


def _strip_terminal_punctuation(text: str) -> str:
    return text.rstrip(" \t\n.!?;:,")


def _ensure_period(text: str) -> str:
    text = text.strip()

    if not text:
        return text

    if text.endswith((".", "!", "?")):
        return text

    return f"{text}."


# ============================================================
# ACTION DETECTION
# ============================================================

_FIRST_WORD_PATTERN = re.compile(
    r"^([A-Za-z]+)\b"
)


def _detect_action(
    text: str,
) -> tuple[str | None, str | None]:
    """
    Detect an action verb at the beginning of a bullet.

    Returns:
        action_key
        action_display
    """

    text = text.strip()

    if not text:
        return None, None

    match = _FIRST_WORD_PATTERN.match(text)

    if not match:
        return None, None

    first_word = match.group(1).lower()

    display = _ACTION_VERBS.get(first_word)

    if display is None:
        return None, None

    return first_word, display


# ============================================================
# WEAK STARTER DETECTION
# ============================================================

def _detect_weak_starter(
    text: str,
) -> tuple[str | None, str | None]:
    """
    Detect weak opening and suggested replacement.
    """

    for pattern, replacement in _WEAK_STARTERS:
        match = pattern.match(text)

        if match:
            return match.group(0).strip(), replacement

    return None, None


# ============================================================
# METRIC EXTRACTION
# ============================================================

def _extract_metrics(text: str) -> list[str]:
    """
    Extract explicit measurable evidence from a bullet.

    IMPORTANT:
    This function intentionally separates metrics from scope.

    Scope examples:
        4 students
        3 projects
        120 users
        5 team members

    Metric examples:
        40%
        3x
        200 ms
        6 hours
        500 records
        from 20 to 50
        2 GB

    The function never invents metrics.
    It only extracts values explicitly present in the text.
    """

    if not text or not text.strip():
        return []

    metrics: list[str] = []
    seen: set[str] = set()

    # Normalize whitespace without changing the original meaning.
    text = re.sub(r"\s+", " ", text).strip()

    # ========================================================
    # 1. PERCENTAGES
    #
    # Examples:
    #   40%
    #   40 %
    #   12.5%
    #   -20%
    # ========================================================

    percentage_pattern = re.compile(
        r"(?<![\w.])"
        r"-?\d+(?:\.\d+)?"
        r"\s*%"
        r"(?!\w)",
        re.IGNORECASE,
    )

    # ========================================================
    # 2. MULTIPLIERS
    #
    # Examples:
    #   3x
    #   2.5x
    #   10 x
    # ========================================================

    multiplier_pattern = re.compile(
        r"(?<![\w.])"
        r"\d+(?:\.\d+)?"
        r"\s*x"
        r"(?!\w)",
        re.IGNORECASE,
    )

    # ========================================================
    # 3. TIME / DURATION
    #
    # Examples:
    #   200 ms
    #   2 seconds
    #   15 minutes
    #   6 hours
    #   3 days
    #   2 weeks
    #
    # These are metrics because they quantify performance,
    # effort, duration, or efficiency.
    # ========================================================

    time_pattern = re.compile(
        r"(?<![\w.])"
        r"\d+(?:\.\d+)?"
        r"\s*"
        r"(?:"
        r"ms|"
        r"msec|"
        r"msecs|"
        r"milliseconds?|"
        r"s|"
        r"sec|"
        r"secs|"
        r"seconds?|"
        r"m|min|mins|minutes?|"
        r"h|hr|hrs|hours?|"
        r"d|day|days?|"
        r"w|wk|wks|weeks?|"
        r"mo|mos|months?"
        r")"
        r"(?!\w)",
        re.IGNORECASE,
    )

    # ========================================================
    # 4. DATA / TECHNICAL QUANTITIES
    #
    # Examples:
    #   500 records
    #   20 requests
    #   100 files
    #   12 pages
    #   8 features
    #   2 GB
    #
    # IMPORTANT:
    # users/students/projects/teams are deliberately excluded.
    # Those belong to scope.
    # ========================================================

    quantity_pattern = re.compile(
        r"(?<![\w.])"
        r"\d+(?:\.\d+)?"
        r"\s*"
        r"(?:"
        # Storage
        r"KB|MB|GB|TB|KiB|MiB|GiB|TiB|"

        # Technical quantities
        r"requests?|"
        r"records?|"
        r"files?|"
        r"pages?|"
        r"features?|"
        r"tasks?|"
        r"tickets?|"
        r"issues?|"
        r"bugs?|"
        r"transactions?|"
        r"queries?|"
        r"endpoints?|"
        r"modules?|"
        r"components?|"
        r"tests?|"
        r"cases?|"
        r"lines?"
        r")"
        r"(?!\w)",
        re.IGNORECASE,
    )

    # ========================================================
    # 5. NUMERIC RANGES
    #
    # Examples:
    #   from 20 to 50
    #   from 100 to 250
    #   increased from 2 to 5
    #
    # Keep the complete expression as one metric.
    # ========================================================

    range_pattern = re.compile(
        r"\b"
        r"(?:"
        r"from\s+"
        r"\d+(?:\.\d+)?"
        r"\s+to\s+"
        r"\d+(?:\.\d+)?"
        r"|"
        r"increased\s+from\s+"
        r"\d+(?:\.\d+)?"
        r"\s+to\s+"
        r"\d+(?:\.\d+)?"
        r"|"
        r"decreased\s+from\s+"
        r"\d+(?:\.\d+)?"
        r"\s+to\s+"
        r"\d+(?:\.\d+)?"
        r")"
        r"\b",
        re.IGNORECASE,
    )

    # ========================================================
    # 6. CURRENCY / FINANCIAL VALUES
    #
    # Examples:
    #   $500
    #   $1,200
    #   €500
    #   £1,000
    #   500 USD
    #   1,200 EGP
    #
    # Useful for business/project bullets.
    # ========================================================

    currency_pattern = re.compile(
        r"(?:"
        r"[$€£¥]"
        r"\s*"
        r"\d{1,3}(?:,\d{3})*(?:\.\d+)?"
        r"|"
        r"\b"
        r"\d{1,3}(?:,\d{3})*(?:\.\d+)?"
        r"\s*"
        r"(?:USD|EUR|GBP|EGP|SAR|AED)"
        r"\b"
        r")",
        re.IGNORECASE,
    )

    # ========================================================
    # 7. DECIMAL / LARGE NUMERIC PERFORMANCE VALUES
    #
    # Examples:
    #   95.5 accuracy
    #   99.9 uptime
    #
    # We only accept these when they are attached to a
    # meaningful measurable concept.
    # ========================================================

    performance_value_pattern = re.compile(
        r"(?<![\w.])"
        r"\d+(?:\.\d+)?"
        r"\s*"
        r"(?:"
        r"accuracy|"
        r"precision|"
        r"recall|"
        r"f1(?:-score)?|"
        r"uptime|"
        r"availability|"
        r"coverage|"
        r"conversion(?:\s+rate)?"
        r")"
        r"(?!\w)",
        re.IGNORECASE,
    )

    # ========================================================
    # MATCH ORDER
    #
    # More specific patterns should be processed first.
    # ========================================================

    patterns = (
        range_pattern,
        percentage_pattern,
        multiplier_pattern,
        currency_pattern,
        performance_value_pattern,
        time_pattern,
        quantity_pattern,
    )

    # ========================================================
    # EXTRACT + DEDUPLICATE
    # ========================================================

    for pattern in patterns:
        for match in pattern.finditer(text):
            value = match.group(0).strip()

            # Normalize spaces around the value.
            value = re.sub(r"\s+", " ", value)

            # Remove trailing punctuation if any.
            value = value.rstrip(".,;:")

            if not value:
                continue

            key = value.casefold()

            if key in seen:
                continue

            seen.add(key)
            metrics.append(value)

    return metrics


# ============================================================
# SCOPE EXTRACTION
# ============================================================

def _extract_scope(text: str) -> list[str]:
    """
    Extract explicit scope information.
    """

    if not text:
        return []

    scope: list[str] = []
    seen: set[str] = set()

    for match in _SCOPE_PATTERN.finditer(text):
        value = match.group(0).strip()
        key = value.lower()

        if key in seen:
            continue

        scope.append(value)
        seen.add(key)

    return scope


# ============================================================
# OUTCOME DETECTION
# ============================================================

def _detect_outcome(text: str) -> bool:
    """
    Detect explicit outcome-oriented language.

    Important:
        An action is NOT automatically an outcome.

    Examples:

        "Developed a React application"
            -> False

        "Developed a React application that simplified registration"
            -> True

        "Managed 3 projects and delivered them before the deadline"
            -> True

        "Led a team of 4 students"
            -> False
    """

    if not text:
        return False

    return bool(_OUTCOME_PATTERN.search(text))


# ============================================================
# REWRITE
# ============================================================

def _replace_weak_starter(
    text: str,
    weak_phrase: str,
    replacement: str,
) -> str:
    """
    Replace only the weak opening.

    Example:

        Worked on a web application using Django

    becomes:

        Developed a web application using Django
    """

    if not text or not weak_phrase or not replacement:
        return text

    pattern = re.compile(
        rf"^\s*{re.escape(weak_phrase)}\s*",
        re.IGNORECASE,
    )

    return pattern.sub(
        f"{replacement} ",
        text,
        count=1,
    ).strip()


def _rewrite_bullet(
    original: str,
    weak_phrase: str | None,
    suggested_action: str | None,
) -> str:
    """
    Conservatively rewrite only the weak opening.

    No additional facts are introduced.
    """

    if not weak_phrase or not suggested_action:
        return original

    return _replace_weak_starter(
        original,
        weak_phrase,
        suggested_action,
    )


# ============================================================
# QUALITY SCORE
# ============================================================

def _calculate_score(
    *,
    has_action: bool,
    has_tool: bool,
    has_outcome: bool,
    has_metric: bool,
    has_scope: bool,
    weak_starter: bool,
) -> int:
    """
    Explainable deterministic scoring.

    Maximum = 100

        Action       25
        Tool         10
        Scope        10
        Outcome      30
        Metric       25
        ----------------
        Total        100

    Outcome receives the strongest qualitative weight because
    a CV bullet should communicate impact, not merely activity.

    Metrics are strong evidence but are not required for a
    meaningful qualitative outcome.
    """

    score = 0

    if has_action:
        score += 25

    if has_tool:
        score += 10

    if has_scope:
        score += 10

    if has_outcome:
        score += 30

    if has_metric:
        score += 25

    # Weak language penalty.
    #
    # This penalty is intentionally applied to the original text,
    # because the rewrite is allowed to improve the opening.
    if weak_starter:
        score -= 15

    return max(0, min(100, score))


def _quality_label(score: int) -> str:
    """
    Convert score into a human-readable quality level.

        0-29    weak
        30-49   incomplete
        50-69   good
        70-89   strong
        90-100  excellent
    """

    if score < 30:
        return "weak"

    if score < 50:
        return "incomplete"

    if score < 70:
        return "good"

    if score < 90:
        return "strong"

    return "excellent"


# ============================================================
# MISSING INFORMATION
# ============================================================

def _get_missing_fields(
    *,
    action_key: str | None,
    tools: list[str],
    scope: list[str],
    outcome: bool,
    metrics: list[str],
) -> list[str]:
    """
    Determine what information is missing.

    This is deliberately deterministic and explainable.
    """

    missing: list[str] = []

    if not action_key:
        missing.append("action")

    # Technical work strongly benefits from a named technology.
    if (
        action_key in _TECHNICAL_ACTIONS
        and not tools
    ):
        missing.append("tool_or_technology")

    if not outcome:
        missing.append("outcome")

    if not metrics:
        missing.append("measurable_result")

    # Leadership / management does not require a technology.
    if action_key in _LEADERSHIP_ACTIONS:
        if "tool_or_technology" in missing:
            missing.remove("tool_or_technology")

    return missing


# ============================================================
# NOTES
# ============================================================

def _build_notes(
    *,
    weak_phrase: str | None,
    suggested_action: str | None,
    action_key: str | None,
    tools: list[str],
    outcome: bool,
    metrics: list[str],
    missing: list[str],
) -> list[str]:
    """
    Build actionable frontend messages.
    """

    notes: list[str] = []

    if weak_phrase and suggested_action:
        notes.append(
            f"Weak opening '{weak_phrase}' was replaced "
            f"with '{suggested_action}'."
        )

    if not outcome:
        notes.append(
            "Add the outcome or impact of the work if known."
        )

    if not metrics:
        notes.append(
            "Add a measurable result when one is available."
        )

    if (
        action_key in _TECHNICAL_ACTIONS
        and not tools
    ):
        notes.append(
            "Consider naming the technology or tool used."
        )

    if (
        "action" in missing
        and not weak_phrase
    ):
        notes.append(
            "Start with a clear action verb."
        )

    if not missing:
        notes.append(
            "Bullet contains a clear action, context, "
            "outcome, and measurable evidence."
        )

    return notes


# ============================================================
# MAIN ENGINE
# ============================================================

def rewrite_bullet(original: str) -> dict[str, Any]:
    """
    Analyze and conservatively rewrite one CV bullet.

    Guarantees:
        - No invented facts.
        - No invented metrics.
        - No invented technologies.
        - No invented outcomes.
        - No invented responsibilities.
    """

    # --------------------------------------------------------
    # Normalize
    # --------------------------------------------------------

    original = _normalize_text(original)

    if not original:
        return {
            "original": "",
            "rewritten": "",
            "analysis": {
                "action": None,
                "action_key": None,
                "tools": [],
                "scope": [],
                "outcome": False,
                "metrics": [],
            },
            "quality": {
                "score": 0,
                "label": "weak",
                "has_action": False,
                "has_tool": False,
                "has_scope": False,
                "has_outcome": False,
                "has_metric": False,
            },
            "missing": [
                "action",
                "outcome",
                "measurable_result",
            ],
            "notes": [
                "Provide a non-empty CV bullet."
            ],
            "placeholders_added": 0,
            "needs_review": True,
        }

    # --------------------------------------------------------
    # Weak starter
    # --------------------------------------------------------

    weak_phrase, suggested_action = _detect_weak_starter(
        original
    )

    # --------------------------------------------------------
    # Conservative rewrite
    # --------------------------------------------------------

    rewritten = _rewrite_bullet(
        original,
        weak_phrase,
        suggested_action,
    )

    rewritten = _strip_terminal_punctuation(
        rewritten
    )

    rewritten = _ensure_period(
        rewritten
    )

    # --------------------------------------------------------
    # Analyze ORIGINAL
    #
    # We analyze the original bullet for factual properties.
    # This prevents the rewrite from artificially improving
    # the underlying evidence.
    # --------------------------------------------------------

    original_action_key, _ = _detect_action(
        original
    )

    # --------------------------------------------------------
    # Analyze REWRITTEN
    #
    # The frontend gets the resulting action verb.
    # --------------------------------------------------------

    action_key, action_display = _detect_action(
        rewritten
    )

    # --------------------------------------------------------
    # Extract facts
    # --------------------------------------------------------

    tools = _find_tools(original)

    scope = _extract_scope(original)

    metrics = _extract_metrics(original)

    outcome = _detect_outcome(original)

    # --------------------------------------------------------
    # Missing information
    # --------------------------------------------------------

    missing = _get_missing_fields(
        action_key=action_key,
        tools=tools,
        scope=scope,
        outcome=outcome,
        metrics=metrics,
    )

    # --------------------------------------------------------
    # Quality score
    # --------------------------------------------------------

    score = _calculate_score(
        has_action=bool(action_key),
        has_tool=bool(tools),
        has_outcome=outcome,
        has_metric=bool(metrics),
        has_scope=bool(scope),
        weak_starter=bool(weak_phrase),
    )

    label = _quality_label(score)

    # --------------------------------------------------------
    # Notes
    # --------------------------------------------------------

    notes = _build_notes(
        weak_phrase=weak_phrase,
        suggested_action=suggested_action,
        action_key=action_key,
        tools=tools,
        outcome=outcome,
        metrics=metrics,
        missing=missing,
    )

    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    return {
        "original": original,

        "rewritten": rewritten,

        "analysis": {
            "action": action_display,
            "action_key": action_key,
            "tools": tools,
            "scope": scope,
            "outcome": outcome,
            "metrics": metrics,
        },

        "quality": {
            "score": score,
            "label": label,
            "has_action": bool(action_key),
            "has_tool": bool(tools),
            "has_scope": bool(scope),
            "has_outcome": outcome,
            "has_metric": bool(metrics),
        },

        "missing": missing,

        "notes": notes,

        # Backwards compatibility with the previous API.
        "placeholders_added": 0,

        "needs_review": bool(missing),
    }


# ============================================================
# BATCH API
# ============================================================

def rewrite_bullets(
    bullets: list[str],
) -> list[dict[str, Any]]:
    """
    Analyze multiple bullets.

    Invalid / empty values are ignored.
    """

    if not bullets:
        return []

    results: list[dict[str, Any]] = []

    for bullet in bullets:
        if not isinstance(bullet, str):
            continue

        if not bullet.strip():
            continue

        results.append(
            rewrite_bullet(bullet)
        )

    return results


# ============================================================
# ANALYSIS-ONLY API
# ============================================================

def analyze_bullet(
    original: str,
) -> dict[str, Any]:
    """
    Analyze a bullet without exposing rewrite-specific fields.
    """

    result = rewrite_bullet(original)

    return {
        "original": result["original"],
        "analysis": result["analysis"],
        "quality": result["quality"],
        "missing": result["missing"],
        "notes": result["notes"],
    }


# ============================================================
# SCORE-ONLY API
# ============================================================

def get_bullet_score(
    original: str,
) -> int:
    """
    Return only the deterministic quality score.
    """

    result = rewrite_bullet(original)

    return int(
        result["quality"]["score"]
    )