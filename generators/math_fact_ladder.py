"""
fact_ladder_generator.py

An organized, level-based generator for mastering math facts.

Levels
1: Addition facts up to 10 + 10
2: Subtraction facts within 0..10 (same range as L1)
3: Addition facts up to 20 + 20, EXCLUDING problems where both addends ≤ 10
4: Subtraction facts within 0..20, EXCLUDING problems where both terms ≤ 10
5: Multiplication facts up to 10 × 10
6: Division facts with divisors 1..10 and quotients 0..10 (same range as L5)
7: Multiplication facts up to 15 × 15, EXCLUDING pairs where both factors ≤ 10
8: Division facts with divisors 1..15 and quotients 0..15, EXCLUDING pairs where both ≤ 10
9: Two-step problems using only facts from earlier levels (kept integer)

Usage:
    from fact_ladder_generator import FactLadderGenerator

    gen = FactLadderGenerator(seed=123)
    print(gen.describe_level(3))
    for p in gen.generate_problems(level=9, n=5):
        print(p["q"], "=", p["a"])
"""

import random
from dataclasses import dataclass
from typing import Callable, Dict, List, Tuple, Optional, Union

Number = int

@dataclass
class ProblemTemplate:
    name: str
    fn: Callable[[], Tuple[str, Number]]
    weight: int = 1

class FactLadderGenerator:
    def __init__(self, seed: Optional[int] = None):
        if seed is not None:
            random.seed(seed)
        self.level_templates = self._build_templates()

    # ---------------------- Public API ----------------------
    def describe_level(self, level: int) -> str:
        desc = {
            1: "Addition up to 10 + 10.",
            2: "Subtraction within 0..10 (minuend/subtrahend ≤ 10).",
            3: "Addition up to 20 + 20, excluding pairs where both addends ≤ 10.",
            4: "Subtraction within 0..40, excluding pairs where both terms ≤ 10.",
            5: "Multiplication facts up to 10 × 10.",
            6: "Division with divisors 1..10 and quotients 0..10.",
            7: "Multiplication up to 15 × 15, excluding pairs where both factors ≤ 10.",
            8: "Division with divisors 1..15 and quotients 0..15, excluding pairs where both ≤ 10.",
            9: "Two-step problems (add/sub/mult/div) built only from earlier-level facts.",
        }
        return desc.get(level, "Unknown level. Use 1–9.")

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

        # ---------------- Level 1: Addition up to 10 + 10 ----------------
        def l1_addition_10():
            a, b = random.randint(0, 10), random.randint(0, 10)
            return f"{a} + {b}", a + b

        # ---------------- Level 2: Subtraction within 0..10 ---------------
        def l2_subtraction_10():
            b = random.randint(0, 10)
            a = random.randint(b, 10)
            return f"{a} - {b}", a - b

        # ---------------- Level 3: Addition up to 20 + 20 (exclude L1) ----
        def l3_addition_20_excl_l1():
            # Exclude cases where both addends ≤ 10
            while True:
                a, b = random.randint(0, 20), random.randint(0, 20)
                if not (a <= 10 and b <= 10):
                    return f"{a} + {b}", a + b

        # ---------------- Level 4: Subtraction within 0..40 (exclude L2) --
        def l4_subtraction_40_excl_l2():
            # Exclude cases where both terms ≤ 10
            while True:
                b = random.randint(0, 40)
                a = random.randint(b, 40)  # ensure a ≥ b
                if not (a <= 10 and b <= 10):
                    return f"{a} - {b}", a - b

        # ---------------- Level 5: Multiplication up to 10×10 -------------
        def l5_mult_10():
            a, b = random.randint(0, 10), random.randint(0, 10)
            return f"{a} × {b}", a * b

        # ---------------- Level 6: Division (divisors 1..10, q 0..10) -----
        def l6_div_10():
            b = random.randint(1, 10)          # divisor
            q = random.randint(0, 10)          # quotient
            a = b * q                           # dividend
            return f"{a} ÷ {b}", q

        # ---------------- Level 7: Multiplication up to 15×15 (excl L5) ---
        def l7_mult_15_excl_10():
            # Exclude pairs where both factors ≤ 10
            while True:
                a, b = random.randint(0, 15), random.randint(0, 15)
                if not (a <= 10 and b <= 10):
                    return f"{a} × {b}", a * b

        # ---------------- Level 8: Division up to 15 (excl L6) ------------
        def l8_div_15_excl_10():
            # Choose divisor 1..15 and quotient 0..15.
            # Exclude pairs where both divisor and quotient ≤ 10.
            while True:
                b = random.randint(1, 15)      # divisor
                q = random.randint(0, 15)      # quotient
                if not (b <= 10 and q <= 10):
                    a = b * q
                    return f"{a} ÷ {b}", q

        # ---------------- Level 9: Two-step problems ----------------------
        # Build only from facts in earlier levels:
        # - addition/subtraction within 0..20
        # - multiplication/division with factors/divisors up to 15
        # All answers integers.
        def _pick_add_0_20():
            a, b = random.randint(0, 20), random.randint(0, 20)
            return a + b, f"{a} + {b}"

        def _pick_sub_0_20():
            b = random.randint(0, 20)
            a = random.randint(b, 20)
            return a - b, f"{a} - {b}"

        def _pick_mul_0_15():
            a, b = random.randint(0, 15), random.randint(0, 15)
            return a * b, f"{a} × {b}"

        def _pick_div_0_15():
            b = random.randint(1, 15)
            q = random.randint(0, 15)
            a = b * q
            return q, f"{a} ÷ {b}"

        def l9_chain_add_after_mul():
            # (a×b) + c  with c in 0..20
            prod, prod_q = _pick_mul_0_15()
            c = random.randint(0, 20)
            return f"{prod_q} + {c}", prod + c

        def l9_chain_sub_after_mul():
            # (a×b) - c  with c in 0..20 and ≤ product
            prod, prod_q = _pick_mul_0_15()
            c = random.randint(0, min(20, prod))
            return f"{prod_q} - {c}", prod - c

        def l9_chain_mul_after_add():
            # (a + b) × c with c in 0..15, keep integers
            s, s_q = _pick_add_0_20()
            c = random.randint(0, 15)
            return f"({s_q}) × {c}", s * c

        def l9_chain_add_after_div():
            # (a ÷ b) + c  with c in 0..20
            q, div_q = _pick_div_0_15()
            c = random.randint(0, 20)
            return f"{div_q} + {c}", q + c

        def l9_chain_sub_after_div():
            # (a ÷ b) - c  ensure non-negative result
            q, div_q = _pick_div_0_15()
            c = random.randint(0, min(20, q))
            return f"{div_q} - {c}", q - c

        def l9_chain_mix_add_sub():
            # (a + b) - c   all in 0..20, non-negative
            s, s_q = _pick_add_0_20()
            c = random.randint(0, min(20, s))
            return f"({s_q}) - {c}", s - c

        # Registry
        return {
            1: [ProblemTemplate("add_≤10", l1_addition_10, 1)],
            2: [ProblemTemplate("sub_≤10", l2_subtraction_10, 1)],
            3: [ProblemTemplate("add_≤20_excl_L1", l3_addition_20_excl_l1, 1)],
            4: [ProblemTemplate("sub_≤40_excl_L2", l4_subtraction_40_excl_l2, 1)],
            5: [ProblemTemplate("mult_≤10", l5_mult_10, 1)],
            6: [ProblemTemplate("div_≤10", l6_div_10, 1)],
            7: [ProblemTemplate("mult_≤15_excl_≤10×≤10", l7_mult_15_excl_10, 1)],
            8: [ProblemTemplate("div_≤15_excl_≤10÷≤10", l8_div_15_excl_10, 1)],
            9: [
                ProblemTemplate("chain:(a×b)+c", l9_chain_add_after_mul, 2),
                ProblemTemplate("chain:(a×b)-c", l9_chain_sub_after_mul, 2),
                ProblemTemplate("chain:(a+b)×c", l9_chain_mul_after_add, 2),
                ProblemTemplate("chain:(a÷b)+c", l9_chain_add_after_div, 1),
                ProblemTemplate("chain:(a÷b)-c", l9_chain_sub_after_div, 1),
                ProblemTemplate("chain:(a+b)-c", l9_chain_mix_add_sub, 2),
            ],
        }
