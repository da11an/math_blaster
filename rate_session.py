# mental_math_rater.py
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone
import math
import statistics as stats
import random
import re

# ------------- Configuration -------------
EXPECTED_TIME_BY_LEVEL = {
    1: 2.0, 2: 2.2, 3: 2.8, 4: 2.8, 5: 2.2, 6: 3.0, 7: 4.0, 8: 5.0, 9: 6.5, 10: 7.5,
}
RECENCY_HALF_LIFE_DAYS = 14
MIN_ITEMS_FOR_LEVEL = 4

# Input normalization: accept ASCII or Unicode
ASCII_TO_CANON = {
    '*': '×',
    '/': '÷',
}
CANON_TO_ASCII = {
    '×': '*',
    '÷': '/',
}

# ------------- Data structures -------------

@dataclass
class ItemEval:
    correct: bool
    level: int
    time_elapsed: float | None
    timestamp: datetime | None
    status: str
    problem_statement: str
    generator_type: str
    correct_answer: Any
    user_answer: Any

# ------------- Utilities -------------

ISO_TS_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T")
_MUL_RE = re.compile(r"^\s*(\d+)\s*×\s*(\d+)\s*$")
_DIV_RE = re.compile(r"^\s*(\d+)\s*÷\s*(\d+)\s*$")
_ADD_RE = re.compile(r"^\s*(\d+)\s*\+\s*(\d+)\s*$")
_SUB_RE = re.compile(r"^\s*(\d+)\s*-\s*(\d+)\s*$")

def _make_hint(expr: str, kind: str) -> str:
    if _looks_like_identity(expr):
        return "Zero wipes, one keeps."
    if kind == "parentheses":
        return "Group first, then multiply."
    if kind == "divide":
        m = _DIV_RE.match(expr)
        if m:
            a, b = map(int, m.groups())
            return f"Think inverse: {b}×?={a}."
        return "Think inverse product."
    if kind == "multiply":
        m = _MUL_RE.match(expr)
        if m:
            a, b = map(int, m.groups())
            if 11 <= a <= 15 or 11 <= b <= 15:
                return "Break into ×10 + ×(rest)."
            if b == 9 or a == 9:
                return "×9 = ×10 − the number."
        return "Use known facts or break apart."
    if kind == "subtract":
        return "Use complements to 10 or count up."
    if kind == "add":
        return "Make a 10, then add."
    return "Work step by step."

def _collect_mistakes(items: List[ItemEval]) -> List[Tuple[str, int, str]]:
    """Return list of (expr_canon, level, hint) for wrong answered items, newest first."""
    wrong = [it for it in items if it.status == "answered" and not it.correct]
    # Sort by timestamp desc (newest first); None timestamps last
    wrong.sort(key=lambda it: (it.timestamp is None, it.timestamp), reverse=True)
    out = []
    seen = set()
    for it in wrong:
        key = (it.problem_statement, it.level)
        if key in seen:
            continue
        seen.add(key)
        kind = _op_kind(it.problem_statement)
        out.append((it.problem_statement, it.level, _make_hint(it.problem_statement, kind)))
    return out

def _collect_slow(items: List[ItemEval]) -> List[Tuple[str, int, str]]:
    """Return list of (expr_canon, level, hint) for notably slow division items even if correct."""
    slow = []
    for it in items:
        if it.status != "answered" or it.time_elapsed is None:
            continue
        kind = _op_kind(it.problem_statement)
        if kind != "divide":
            continue
        target = _level_time_target(it.level)
        if it.time_elapsed > max(4.0, 1.5 * target):  # slow threshold
            slow.append((it.problem_statement, it.level, _make_hint(it.problem_statement, kind)))
    # Keep newest, dedup
    # (Items are often already chronological; if you want strict order, sort by timestamp desc.)
    seen = set()
    uniq = []
    for tup in slow:
        key = (tup[0], tup[1])
        if key not in seen:
            seen.add(key)
            uniq.append(tup)
    return uniq

def _normalize_expr(expr: str) -> str:
    """
    Normalize incoming problem statements:
      - map ASCII ops to canonical Unicode (×, ÷)
      - strip trailing '= ?' or '=' and spaces
      - collapse whitespace
    """
    if not isinstance(expr, str):
        return ""
    s = expr.strip()
    # Drop trailing "= ?" or "=?" or "=" variants
    s = re.sub(r"\s*=\s*\??\s*$", "", s)
    # Map ASCII ops to canonical
    s = ''.join(ASCII_TO_CANON.get(ch, ch) for ch in s)
    # Collapse spaces around ops and parentheses
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\s*([×÷+\-()])\s*", r" \1 ", s).strip()
    s = re.sub(r"\s{2,}", " ", s)
    return s

def _render_expr(expr: str, ops_style: str = "ascii") -> str:
    """
    Render an internal (canonical) expression into ASCII or Unicode for output.
    ops_style: "ascii" (default) or "unicode"
    """
    s = expr
    if ops_style == "ascii":
        s = ''.join(CANON_TO_ASCII.get(ch, ch) for ch in s)
    # If unicode, leave as-is (already canonical).
    return s

def _parse_ts(ts: str | None) -> datetime | None:
    if not ts or not isinstance(ts, str) or not ISO_TS_RE.match(ts):
        return None
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None

def _recency_weight(ts: datetime | None, now: datetime) -> float:
    if ts is None:
        return 1.0
    days = (now - ts).total_seconds() / 86400.0
    return 2 ** (-days / RECENCY_HALF_LIFE_DAYS)

def _level_time_target(level: int) -> float:
    if level in EXPECTED_TIME_BY_LEVEL:
        return EXPECTED_TIME_BY_LEVEL[level]
    close = min(EXPECTED_TIME_BY_LEVEL.keys(), key=lambda k: abs(k - level))
    return EXPECTED_TIME_BY_LEVEL[close]

def _speed_score(time_elapsed: float | None, level: int) -> float:
    target = _level_time_target(level)
    if time_elapsed is None or time_elapsed <= 0:
        return 0.25
    ratio = max(0.0, (time_elapsed / target) - 1.0)
    raw = 1.0 / (1.0 + ratio)
    if time_elapsed <= 0.6 * target:
        raw = min(1.05, 1.0 + (target - time_elapsed) / (4.0 * target))
    return max(0.0, min(1.0, raw))

def _correctness_score(correct: bool) -> float:
    return 1.0 if correct else 0.0

def _looks_like_identity(expr: str) -> bool:
    # Identity patterns on canonical ops (×, ÷) plus +0/-0
    return bool(re.search(r"(×\s*0)|(\+\s*0)|(-\s*0)|(÷\s*1)|(×\s*1)", expr))

def _op_kind(expr: str) -> str:
    if "(" in expr or ")" in expr:
        return "parentheses"
    if "×" in expr:
        return "multiply"
    if "÷" in expr:
        return "divide"
    if "+" in expr and "-" in expr:
        return "mixed"
    if "+" in expr:
        return "add"
    if "-" in expr:
        return "subtract"
    return "other"

def _safestats(values: List[float]) -> Tuple[float | None, float | None]:
    if not values:
        return (None, None)
    try:
        med = stats.median(values)
    except stats.StatisticsError:
        med = None
    try:
        p90 = stats.quantiles(values, n=10)[-1]
    except Exception:
        p90 = None
    return (med, p90)

def _item_score(item: ItemEval) -> float:
    if item.status.startswith("skipped"):
        return 0.15
    c = _correctness_score(item.correct)
    s = _speed_score(item.time_elapsed, item.level) if item.user_answer is not None else 0.25
    base = 0.7 * c + 0.3 * s
    if not item.correct and _looks_like_identity(item.problem_statement):
        base *= 0.75
    return max(0.0, min(1.0, base))

# ------------- Public API -------------

def rate_session(
    log_items: List[Dict[str, Any]],
    username: str,
    now: datetime | None = None,
    ops_style: str = "ascii",
    review_mode: str = "mixed",  # NEW: "themes" | "mistakes" | "mixed"
) -> Dict[str, Any]:
    """
    Ingests JSON-like dicts, filters by username, and returns a scoring bundle.
    - Accepts ASCII ('*','/') and Unicode ('×','÷') in input.
    - Outputs review problems using ops_style ('ascii' default for interoperability).

    Returns:
        {
          "username": ...,
          "summary": {overall_score, estimated_level, recommended_practice_level, progress_notes},
          "metrics": {"overall": {...}, "levels": {level: {...}}},
          "themes": {...},
          "review_problems": [{"problem_statement": "...", "level": L, "hint": "..."}]
        }
    """
    if now is None:
        now = datetime.now(timezone.utc)

    items: List[ItemEval] = []
    for d in log_items:
        if d.get("username") != username:
            continue
        raw_expr = str(d.get("problem_statement", ""))
        expr = _normalize_expr(raw_expr)
        items.append(
            ItemEval(
                correct=bool(d.get("is_correct")) if d.get("status") == "answered" else False,
                level=int(d.get("level", 1)),
                time_elapsed=float(d["time_elapsed"]) if d.get("time_elapsed") is not None else None,
                timestamp=_parse_ts(d.get("timestamp")),
                status=str(d.get("status", "")),
                problem_statement=expr,  # canonical ops
                generator_type=str(d.get("generator_type", "")),
                correct_answer=d.get("correct_answer"),
                user_answer=d.get("user_answer"),
            )
        )

    if not items:
        return {
            "username": username,
            "summary": {"message": "No items found for user."},
            "metrics": {},
            "review_problems": [],
        }

    per_item = []
    for it in items:
        raw = _item_score(it)
        w = _recency_weight(it.timestamp, now)
        per_item.append((it, raw, w))

    total_w = sum(w for _, _, w in per_item) or 1.0
    overall_0_1 = sum(raw * w for _, raw, w in per_item) / total_w
    overall_score = round(100.0 * overall_0_1, 1)

    levels = sorted(set(it.level for it, _, _ in per_item))
    level_stats: Dict[int, Dict[str, Any]] = {}
    for lv in levels:
        sub = [(it, raw, w) for (it, raw, w) in per_item if it.level == lv]
        answered = [it for (it, _, _) in sub if it.status == "answered"]
        correct = [it for it in answered if it.correct]
        times = [it.time_elapsed for it in answered if it.time_elapsed is not None]
        times_correct = [it.time_elapsed for it in correct if it.time_elapsed is not None]

        acc = (len(correct) / max(1, len(answered))) if answered else None
        med_t, p90_t = _safestats(times)
        med_tc, _ = _safestats(times_correct)

        W = sum(w for (_, _, w) in sub) or 1.0
        level_score = sum(raw * w for (_, raw, w) in sub) / W

        level_stats[lv] = {
            "attempted": len(answered),
            "correct": len(correct),
            "accuracy": round(acc, 3) if acc is not None else None,
            "median_time_all": med_t,
            "median_time_correct": med_tc,
            "p90_time_all": p90_t,
            "score_0_1": round(level_score, 3),
            "expected_time": _level_time_target(lv),
        }

    mastered_levels = [lv for lv, s in level_stats.items() if (s["score_0_1"] or 0) >= 0.70 and s["attempted"] >= max(2, MIN_ITEMS_FOR_LEVEL//2)]
    estimated_level = max(mastered_levels) if mastered_levels else min(levels)

    falloff_level = None
    if len(levels) >= 2:
        levels_sorted = sorted(levels)
        diffs = []
        for a, b in zip(levels_sorted, levels_sorted[1:]):
            sa = level_stats[a]["score_0_1"] or 0
            sb = level_stats[b]["score_0_1"] or 0
            diffs.append(((a, b), sa - sb))
        if diffs:
            (a, b), drop = max(diffs, key=lambda x: x[1])
            if drop > 0.1:
                falloff_level = b

    recommended_practice_level = falloff_level if falloff_level is not None else min(max(levels), max(estimated_level + 1, estimated_level))

    by_time = [it for (it, _, _) in sorted(per_item, key=lambda t: (t[0].timestamp or now))]
    if len(by_time) >= 6:
        mid = len(by_time) // 2
        first = by_time[:mid]
        second = by_time[mid:]
        def _avg_acc(arr): 
            ans = [1.0 if it.correct and it.status == "answered" else 0.0 for it in arr]
            return sum(ans) / max(1, len(ans))
        def _median_time(arr):
            ts = [it.time_elapsed for it in arr if it.time_elapsed is not None and it.status == "answered"]
            return stats.median(ts) if ts else None

        acc_first, acc_second = _avg_acc(first), _avg_acc(second)
        mt_first, mt_second = _median_time(first), _median_time(second)

        progress_notes = []
        if acc_second - acc_first > 0.05:
            progress_notes.append("Accuracy improved as you went.")
        elif acc_first - acc_second > 0.05:
            progress_notes.append("Accuracy dipped later in the session (fatigue or harder items).")
        if mt_first and mt_second:
            if mt_first - mt_second > 0.4:
                progress_notes.append("You sped up in the second half.")
            elif mt_second - mt_first > 0.4:
                progress_notes.append("You slowed down later (possible fatigue or tougher items).")
        if not progress_notes:
            progress_notes.append("Performance was steady across the session.")
    else:
        progress_notes = ["Not enough items to assess within-session trend."]

    themes = _infer_themes_for_review(items)
    review_problems = _make_review_problems(
        themes, recommended_practice_level, n=6, ops_style=ops_style,
        review_mode=review_mode, items=items  # pass items in
    )

    return {
        "username": username,
        "summary": {
            "overall_score": overall_score,
            "estimated_level": int(estimated_level),
            "recommended_practice_level": int(recommended_practice_level),
            "progress_notes": progress_notes,
        },
        "metrics": {
            "overall": {
                "weighted_score_0_1": round(overall_0_1, 3),
                "items": len(items),
            },
            "levels": level_stats,
        },
        "themes": themes,
        "review_problems": review_problems,
    }

# ------------- Theme inference & problem generation -------------

def _infer_themes_for_review(items: List[ItemEval]) -> Dict[str, Any]:
    themes = {
        "identity_errors": 0,
        "parentheses_errors": 0,
        "division_slow": 0,
        "division_errors": 0,
        "subtraction_slips": 0,
        "multiplication_hardfacts": 0,
    }
    div_times = []
    for it in items:
        kind = _op_kind(it.problem_statement)
        if it.status == "answered" and not it.correct:
            if _looks_like_identity(it.problem_statement):
                themes["identity_errors"] += 1
            if kind == "parentheses":
                themes["parentheses_errors"] += 1
            if kind == "divide":
                themes["division_errors"] += 1
            if kind == "subtract":
                themes["subtraction_slips"] += 1
            if kind == "multiply" and it.level >= 7:
                themes["multiplication_hardfacts"] += 1
        if kind == "divide" and it.time_elapsed is not None and it.level in (6, 8):
            div_times.append(it.time_elapsed)

    if div_times:
        med = stats.median(div_times)
        if med > 4.0:
            themes["division_slow"] = 1
    return themes

def _make_review_problems(
    themes: Dict[str, Any],
    practice_level: int,
    n: int = 6,
    ops_style: str = "ascii",
    review_mode: str = "mixed",
    items: List[ItemEval] | None = None,
) -> List[Dict[str, Any]]:
    problems: List[Dict[str, Any]] = []

    def add(expr_canon: str, lvl: int, hint: str):
        problems.append({"problem_statement": _render_expr(expr_canon, ops_style), "level": lvl, "hint": hint})

    # 1) Mistake-based set (exact replays)
    mistake_pool = _collect_mistakes(items or [])
    slow_pool = _collect_slow(items or [])

    if review_mode in ("mistakes", "mixed"):
        # Take mistakes first
        for expr, lvl, hint in mistake_pool:
            add(expr, lvl, hint)
            if len(problems) >= (n if review_mode == "mistakes" else math.ceil(n/2)):
                break
        # If few/no mistakes, consider slow division items
        if len(problems) < (n if review_mode == "mistakes" else math.ceil(n/2)):
            for expr, lvl, hint in slow_pool:
                # avoid duplicates
                if not any(p["problem_statement"] == _render_expr(expr, ops_style) for p in problems):
                    add(expr, lvl, hint)
                if len(problems) >= (n if review_mode == "mistakes" else math.ceil(n/2)):
                    break

    # 2) Theme-based (fills remaining slots in "mixed" or used entirely in "themes")
    if review_mode in ("themes", "mixed"):
        themed = []
        if themes.get("identity_errors"):
            themed += [
                ("7 × 0", 5, "Zero wipes, one keeps."),
                ("1 × 14", 7, "×1 keeps the number."),
                ("3 × 1", 5, "×1 keeps the number."),
                ("20 + 0", 1, "Adding 0 keeps the number."),
                ("18 ÷ 1", 6, "÷1 keeps the number."),
            ]
        if themes.get("parentheses_errors"):
            themed += [
                ("(6 + 20) × 9", 9, "Group first, then multiply."),
                ("(3 + 16) × 12", 9, "Group first or distribute."),
                ("12 × (5 + 7)", 9, "Group first."),
            ]
        if themes.get("division_errors") or themes.get("division_slow"):
            themed += [
                ("56 ÷ 4", 8, "Think inverse: 4×?=56."),
                ("78 ÷ 6", 8, "6×13=78."),
                ("225 ÷ 15", 8, "15×15=225."),
                ("36 ÷ 9", 6, "9×4=36."),
            ]
        if themes.get("subtraction_slips"):
            themed += [
                ("12 - 5", 2, "Use complements: (10−5)+2."),
                ("14 - 7", 2, "Doubles help: 7+7=14."),
                ("20 - 11", 4, "Count up from 11."),
            ]
        if themes.get("multiplication_hardfacts"):
            themed += [
                ("13 × 14", 7, "Break into ×10 + ×(rest)."),
                ("12 × 11", 7, "11 rule: 12×11=132."),
                ("9 × 15", 7, "×15 = ×10 + ×5."),
                ("14 × 9", 7, "×9 = ×10 − the number."),
            ]

        for expr, lvl, hint in themed:
            # avoid duplicates
            if not any(p["problem_statement"] == _render_expr(expr, ops_style) for p in problems):
                add(expr, lvl, hint)
            if len(problems) >= n:
                break

    # 3) Backfill generics from recommended practice level
    while len(problems) < n:
        for expr_canon, lvl, hint in _generic_by_level(practice_level, count=n):
            if not any(p["problem_statement"] == _render_expr(expr_canon, ops_style) for p in problems):
                add(expr_canon, lvl, hint)
            if len(problems) >= n:
                break

    # Deduplicate while preserving order; trim to n
    seen = set()
    uniq = []
    for p in problems:
        key = (p["problem_statement"], p["level"])
        if key not in seen:
            seen.add(key)
            uniq.append(p)
    return uniq[:n]

def _generic_by_level(level: int, count: int = 6) -> List[Tuple[str, int, str]]:
    rng = random.Random(1337 + level)
    out = []
    def pick(a, b): return rng.randint(a, b)
    for _ in range(count):
        if level <= 2:
            a, b = pick(0, 12), pick(0, 12)
            op = rng.choice(["+", "-"])
            expr = f"{a} {op} {b}"
            hint = "Count up/down." if op == "-" else "Make a 10 then add."
        elif level in (3, 4):
            a, b = pick(10, 35), pick(1, 25)
            op = "+" if level == 3 else "-"
            expr = f"{a} {op} {b}"
            hint = "Decompose to tens."
        elif level == 5:
            a, b = pick(0, 10), pick(0, 10)
            expr = f"{a} × {b}"
            hint = "Recall core facts; use doubles."
        elif level in (6, 8):
            a, b = pick(2, 12), pick(2, 12)
            expr = f"{a*b} ÷ {b}"
            hint = "Think inverse product."
        elif level == 7:
            a, b = rng.choice([(11, pick(6,15)), (12, pick(6,15)), (13, pick(6,15)), (14, pick(6,15)), (15, pick(6,15))])
            expr = f"{a} × {b}"
            hint = "Break into ×10 + ×(rest)."
        else:
            a, b, c = pick(1, 20), pick(1, 20), pick(2, 12)
            form = rng.choice(["paren", "two"])
            if form == "paren":
                expr = f"({a} + {b}) × {c}"
                hint = "Group first, then multiply."
            else:
                expr = f"{a} × {b} + {c}"
                hint = "Do × first, then +."
        out.append((expr, level, hint))
    return out

# ------------- Example -------------
# result = rate_session(log_items, username="symbol_test", ops_style="ascii", review_mode="themes")
# print(result)
