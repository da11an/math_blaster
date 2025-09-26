"""
fact_ladder_generator.py  — grade-aware

An organized, level-based generator for mastering math facts.

Levels (unchanged)
1: Addition facts up to 10 + 10
2: Subtraction facts within 0..10 (same range as L1)
3: Addition facts up to 20 + 20, EXCLUDING problems where both addends ≤ 10
4: Subtraction facts within 0..40, EXCLUDING problems where both terms ≤ 10
5: Multiplication facts up to 10 × 10
6: Division facts with divisors 1..10 and quotients 0..10 (same range as L5)
7: Multiplication facts up to 15 × 15, EXCLUDING pairs where both factors ≤ 10
8: Division facts with divisors 1..15 and quotients 0..15, EXCLUDING pairs where both ≤ 10
9: Two-step problems using only facts from earlier levels (kept integer)

NEW:
- grade_band: constrains operand sizes per grade without exceeding level maxima.
  Bands: "G1", "G2", "G3", "G4", "G5_6"
- If an exclusion would make a level impossible under tight caps, we relax the
  exclusion after a few attempts (keeps generation robust for young grades).
"""

import random
from dataclasses import dataclass
from typing import Callable, Dict, List, Tuple, Optional, Union

Number = int

# ---------------------- Grade caps ----------------------
# These are *upper bounds* a grade should see for mental work.
# We never exceed your level’s native limits; we take min(level_max, grade_cap).
GRADE_CAPS = {
    "G1": {  # 1st grade
        "add_beg_addend_max": 10, "add_beg_sum_max": 20,
        "add_diff_addend_max": 20, "add_diff_sum_max": 40,
        "sub_beg_max": 10, "sub_diff_max": 20,
        "mul_beg_factor_set": [0,1,2,5,10],  # restrict to easiest facts
        "mul_beg_factor_max": 10,            # used if set above not present
        "div_beg_divisor_set": [1,2,5,10], "div_beg_quot_max": 10,
        "mul_adv_factor_max": 11,            # limited advanced (11×…)
        "div_adv_divisor_max": 5, "div_adv_quot_max": 12,
        "two_step_a_max": 10, "two_step_b_max": 10, "two_step_c_max": 5,
    },
    "G2": {  # 2nd grade
        "add_beg_addend_max": 20, "add_beg_sum_max": 40,
        "add_diff_addend_max": 100, "add_diff_sum_max": 200,
        "sub_beg_max": 20, "sub_diff_max": 100,
        "mul_beg_factor_max": 10,
        "div_beg_divisor_max": 10, "div_beg_quot_max": 10,
        "mul_adv_factor_max": 12,
        "div_adv_divisor_max": 12, "div_adv_quot_max": 12,
        "two_step_a_max": 30, "two_step_b_max": 30, "two_step_c_max": 10,
    },
    "G3": {  # 3rd grade
        "add_beg_addend_max": 20, "add_beg_sum_max": 40,
        "add_diff_addend_max": 200, "add_diff_sum_max": 400,
        "sub_beg_max": 20, "sub_diff_max": 200,
        "mul_beg_factor_max": 12,
        "div_beg_divisor_max": 12, "div_beg_quot_max": 12,
        "mul_adv_factor_max": 15,
        "div_adv_divisor_max": 15, "div_adv_quot_max": 15,
        "two_step_a_max": 40, "two_step_b_max": 40, "two_step_c_max": 12,
    },
    "G4": {  # 4th grade
        "add_beg_addend_max": 50, "add_beg_sum_max": 100,
        "add_diff_addend_max": 1000, "add_diff_sum_max": 2000,
        "sub_beg_max": 50, "sub_diff_max": 1000,
        "mul_beg_factor_max": 12,
        "div_beg_divisor_max": 12, "div_beg_quot_max": 12,
        "mul_adv_factor_max": 15,   # we still clamp to level max 15
        "div_adv_divisor_max": 15, "div_adv_quot_max": 15,
        "two_step_a_max": 60, "two_step_b_max": 60, "two_step_c_max": 12,
    },
    "G5_6": {  # 5th–6th grade+
        "add_beg_addend_max": 100, "add_beg_sum_max": 200,
        "add_diff_addend_max": 10000, "add_diff_sum_max": 20000,
        "sub_beg_max": 100, "sub_diff_max": 10000,
        "mul_beg_factor_max": 12,
        "div_beg_divisor_max": 12, "div_beg_quot_max": 12,
        "mul_adv_factor_max": 15,
        "div_adv_divisor_max": 15, "div_adv_quot_max": 15,
        "two_step_a_max": 100, "two_step_b_max": 100, "two_step_c_max": 20,
    },
}

# Level-native maxima (never exceeded)
LEVEL_MAX = {
    1: {"addend_max": 10, "sum_max": 20},
    2: {"sub_max": 10},
    3: {"addend_max": 20, "sum_max": 40, "exclude_both_le": 10},
    4: {"sub_max": 40, "exclude_both_le": 10},
    5: {"factor_max": 10},
    6: {"divisor_max": 10, "quot_max": 10},
    7: {"factor_max": 15, "exclude_both_le": 10},
    8: {"divisor_max": 15, "quot_max": 15, "exclude_both_le": 10},
    9: {"addend_max": 20, "factor_max": 15},  # two-step uses these as base caps
}

@dataclass
class ProblemTemplate:
    name: str
    fn: Callable[[], Tuple[str, Number]]
    weight: int = 1

class FactLadderGenerator:
    def __init__(self, seed: Optional[int] = None, grade_band: str = "G3"):
        if seed is not None:
            random.seed(seed)
        if grade_band not in GRADE_CAPS:
            raise ValueError(f"grade_band must be one of {list(GRADE_CAPS.keys())}")
        self.grade_band = grade_band
        self.caps = GRADE_CAPS[grade_band]
        self.level_templates = self._build_templates()

    # ---------------------- Public API ----------------------
    def describe_level(self, level: int) -> str:
        desc = {
            1: "Addition up to 10 + 10 (grade-capped).",
            2: "Subtraction within 0..10 (grade-capped).",
            3: "Addition up to 20 + 20, excluding pairs where both addends ≤ 10 (grade-capped).",
            4: "Subtraction within 0..40, excluding pairs where both terms ≤ 10 (grade-capped).",
            5: "Multiplication facts up to 10 × 10 (grade-capped).",
            6: "Division with divisors 1..10 and quotients 0..10 (grade-capped).",
            7: "Multiplication up to 15 × 15, excluding pairs where both factors ≤ 10 (grade-capped).",
            8: "Division with divisors 1..15 and quotients 0..15, excluding pairs where both ≤ 10 (grade-capped).",
            9: "Two-step problems built only from earlier-level facts (kept integer, grade-capped).",
        }
        extra = f" [grade_band={self.grade_band}]"
        return (desc.get(level, "Unknown level. Use 1–9.") + extra)

    def generate_problem(self, level: int) -> Dict[str, Union[str, Number]]:
        if level not in self.level_templates:
            raise ValueError("Level must be between 1 and 9.")
        tpl = self._weighted_choice(self.level_templates[level])
        q, a = tpl.fn()
        return {"level": level, "type": tpl.name, "q": q, "a": a}

    def generate_problems(self, level: int, n: int = 10, seed: Optional[int] = None) -> List[Dict[str, Union[str, Number]]]:
        if seed is not None:
            random.seed(seed)
        return [self.generate_problem(level) for _ in range(n)]

    # ---------------------- Internals ----------------------
    def _weighted_choice(self, templates: List[ProblemTemplate]) -> ProblemTemplate:
        weights = [t.weight for t in templates]
        return random.choices(templates, weights=weights, k=1)[0]

    def _build_templates(self) -> Dict[int, List[ProblemTemplate]]:
        caps = self.caps  # local alias

        # Helpers
        def _cap(value: int, level_key: str, lvl: int) -> int:
            """Min between grade cap and level-native max."""
            return min(value, LEVEL_MAX[lvl][level_key])

        def _try_with_exclusion(sampler, exclude_pred, tries=64):
            """Try sampler with exclusion; if space seems empty, relax exclusion."""
            for _ in range(tries):
                a, b = sampler()
                if not exclude_pred(a, b):
                    return a, b, True
            # Fallback: return last sample and mark relaxed
            return a, b, False

        # ---------------- Level 1: Addition up to 10 + 10 ----------------
        def l1_addition_10():
            addend_max = _cap(caps.get("add_beg_addend_max", 10), "addend_max", 1)
            sum_max    = _cap(caps.get("add_beg_sum_max", 20), "sum_max", 1)
            while True:
                a, b = random.randint(0, addend_max), random.randint(0, addend_max)
                s = a + b
                if s <= sum_max:
                    return f"{a} + {b}", s

        # ---------------- Level 2: Subtraction within 0..10 ---------------
        def l2_subtraction_10():
            sub_max = _cap(caps.get("sub_beg_max", 10), "sub_max", 2)
            b = random.randint(0, sub_max)
            a = random.randint(b, sub_max)
            return f"{a} - {b}", a - b

        # ---------------- Level 3: Addition up to 20 + 20 (exclude L1) ----
        def l3_addition_20_excl_l1():
            addend_max = _cap(caps.get("add_diff_addend_max", 20), "addend_max", 3)
            sum_max    = _cap(caps.get("add_diff_sum_max", 40), "sum_max", 3)
            l1_thresh  = min(LEVEL_MAX[1]["addend_max"], caps.get("add_beg_addend_max", 10))  # exclusion threshold
            def sampler():
                return random.randint(0, addend_max), random.randint(0, addend_max)
            def excluded(a, b):
                return (a <= l1_thresh and b <= l1_thresh) or (a + b > sum_max)
            a, b, kept = _try_with_exclusion(sampler, excluded)
            return f"{a} + {b}", a + b

        # ---------------- Level 4: Subtraction within 0..40 (exclude L2) --
        def l4_subtraction_40_excl_l2():
            sub_max   = _cap(caps.get("sub_diff_max", 40), "sub_max", 4)
            l2_thresh = min(LEVEL_MAX[2]["sub_max"], caps.get("sub_beg_max", 10))
            def sampler():
                b = random.randint(0, sub_max)
                a = random.randint(b, sub_max)
                return a, b
            def excluded(a, b):
                return (a <= l2_thresh and b <= l2_thresh)
            a, b, kept = _try_with_exclusion(sampler, excluded)
            return f"{a} - {b}", a - b

        # ---------------- Level 5: Multiplication up to 10×10 -------------
        def l5_mult_10():
            # Allow an easy factor_set for G1; otherwise use factor_max.
            if "mul_beg_factor_set" in caps:
                S = caps["mul_beg_factor_set"]
                a, b = random.choice(S), random.choice(S)
            else:
                fmax = min(caps.get("mul_beg_factor_max", 10), LEVEL_MAX[5]["factor_max"])
                a, b = random.randint(0, fmax), random.randint(0, fmax)
            return f"{a} × {b}", a * b

        # ---------------- Level 6: Division (divisors 1..10, q 0..10) -----
        def l6_div_10():
            if "div_beg_divisor_set" in caps:
                b = random.choice(caps["div_beg_divisor_set"])
            else:
                b = random.randint(1, min(caps.get("div_beg_divisor_max", 10), LEVEL_MAX[6]["divisor_max"]))
            q = random.randint(0, min(caps.get("div_beg_quot_max", 10), LEVEL_MAX[6]["quot_max"]))
            a = b * q
            return f"{a} ÷ {b}", q

        # ---------------- Level 7: Multiplication up to 15×15 (excl L5) ---
        def l7_mult_15_excl_10():
            fmax = min(caps.get("mul_adv_factor_max", 15), LEVEL_MAX[7]["factor_max"])
            l5_thresh = LEVEL_MAX[5]["factor_max"]  # 10
            def sampler():
                return random.randint(0, fmax), random.randint(0, fmax)
            def excluded(a, b):
                return (a <= l5_thresh and b <= l5_thresh)
            a, b, kept = _try_with_exclusion(sampler, excluded)
            return f"{a} × {b}", a * b

        # ---------------- Level 8: Division up to 15 (excl L6) ------------
        def l8_div_15_excl_10():
            divmax = min(caps.get("div_adv_divisor_max", 15), LEVEL_MAX[8]["divisor_max"])
            qmax   = min(caps.get("div_adv_quot_max", 15), LEVEL_MAX[8]["quot_max"])
            l6_thresh_div = LEVEL_MAX[6]["divisor_max"]  # 10
            l6_thresh_q   = LEVEL_MAX[6]["quot_max"]     # 10
            tries = 0
            while True:
                tries += 1
                b = random.randint(1, divmax)
                q = random.randint(0, qmax)
                # exclusion
                if not (b <= l6_thresh_div and q <= l6_thresh_q):
                    a = b * q
                    return f"{a} ÷ {b}", q
                if tries > 64:  # relax if too tight for young grades
                    a = b * q
                    return f"{a} ÷ {b}", q

        # ---------------- Level 9: Two-step problems ----------------------
        # Build only from earlier facts; obey grade caps and level maxima.
        def _pick_add_capped():
            # cap by grade then by level 9 base (20)
            amax = min(caps.get("two_step_a_max", 20), LEVEL_MAX[9]["addend_max"])
            bmax = min(caps.get("two_step_b_max", 20), LEVEL_MAX[9]["addend_max"])
            a, b = random.randint(0, amax), random.randint(0, bmax)
            return a + b, f"{a} + {b}"

        def _pick_sub_capped():
            smax = min(caps.get("two_step_a_max", 20), LEVEL_MAX[4]["sub_max"])
            b = random.randint(0, smax)
            a = random.randint(b, smax)
            return a - b, f"{a} - {b}"

        def _pick_mul_capped():
            fmax = min(caps.get("mul_adv_factor_max", 15), LEVEL_MAX[9]["factor_max"])
            # still allow easier if grade is very young
            if "mul_beg_factor_set" in caps:
                # mix: 70% advanced up to fmax, 30% easy set
                if random.random() < 0.30:
                    S = caps["mul_beg_factor_set"]
                    a, b = random.choice(S), random.choice(S)
                else:
                    a, b = random.randint(0, fmax), random.randint(0, fmax)
            else:
                a, b = random.randint(0, fmax), random.randint(0, fmax)
            return a * b, f"{a} × {b}"

        def _pick_div_capped():
            divmax = min(caps.get("div_adv_divisor_max", 15), LEVEL_MAX[8]["divisor_max"])
            qmax   = min(caps.get("div_adv_quot_max", 15), LEVEL_MAX[8]["quot_max"])
            # integer by construction
            b = random.randint(1, divmax)
            q = random.randint(0, qmax)
            a = b * q
            return q, f"{a} ÷ {b}"

        cmax = caps.get("two_step_c_max", 12)

        def l9_chain_add_after_mul():
            prod, prod_q = _pick_mul_capped()
            c = random.randint(0, cmax)
            return f"{prod_q} + {c}", prod + c

        def l9_chain_sub_after_mul():
            prod, prod_q = _pick_mul_capped()
            c = random.randint(0, min(cmax, prod))
            return f"{prod_q} - {c}", prod - c

        def l9_chain_mul_after_add():
            s, s_q = _pick_add_capped()
            fmax = min(caps.get("mul_adv_factor_max", 15), LEVEL_MAX[9]["factor_max"])
            c = random.randint(0, fmax)
            return f"({s_q}) × {c}", s * c

        def l9_chain_add_after_div():
            q, div_q = _pick_div_capped()
            c = random.randint(0, cmax)
            return f"{div_q} + {c}", q + c

        def l9_chain_sub_after_div():
            q, div_q = _pick_div_capped()
            c = random.randint(0, min(cmax, q))
            return f"{div_q} - {c}", q - c

        def l9_chain_mix_add_sub():
            s, s_q = _pick_add_capped()
            c = random.randint(0, min(cmax, s))
            return f"({s_q}) - {c}", s - c

        # Registry
        return {
            1: [ProblemTemplate("add_≤10 (grade-capped)", l1_addition_10, 1)],
            2: [ProblemTemplate("sub_≤10 (grade-capped)", l2_subtraction_10, 1)],
            3: [ProblemTemplate("add_≤20_excl_L1 (grade-capped)", l3_addition_20_excl_l1, 1)],
            4: [ProblemTemplate("sub_≤40_excl_L2 (grade-capped)", l4_subtraction_40_excl_l2, 1)],
            5: [ProblemTemplate("mult_≤10 (grade-capped)", l5_mult_10, 1)],
            6: [ProblemTemplate("div_≤10 (grade-capped)", l6_div_10, 1)],
            7: [ProblemTemplate("mult_≤15_excl_≤10×≤10 (grade-capped)", l7_mult_15_excl_10, 1)],
            8: [ProblemTemplate("div_≤15_excl_≤10÷≤10 (grade-capped)", l8_div_15_excl_10, 1)],
            9: [
                ProblemTemplate("chain:(a×b)+c", l9_chain_add_after_mul, 2),
                ProblemTemplate("chain:(a×b)-c", l9_chain_sub_after_mul, 2),
                ProblemTemplate("chain:(a+b)×c", l9_chain_mul_after_add, 2),
                ProblemTemplate("chain:(a÷b)+c", l9_chain_add_after_div, 1),
                ProblemTemplate("chain:(a÷b)-c", l9_chain_sub_after_div, 1),
                ProblemTemplate("chain:(a+b)-c", l9_chain_mix_add_sub, 2),
            ],
        }

# Usage:
# from fact_ladder_generator import FactLadderGenerator

# # Default grade_band="G3" (3rd grade). Options: "G1","G2","G3","G4","G5_6"
# gen = FactLadderGenerator(seed=123, grade_band="G2")
# print(gen.describe_level(3))
# for p in gen.generate_problems(level=9, n=5):
#     print(p["q"], "=", p["a"])
