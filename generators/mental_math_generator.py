"""
mental_math_generator.py

A single-class generator for mental-math problems with a clear progression
from Level 1 (very easy) to Level 10 (quite difficult). All answers are
either integers or decimals with exactly one decimal place.

Usage:
    from mental_math_generator import MentalMathGenerator

    gen = MentalMathGenerator(seed=42)
    print(gen.describe_level(7))
    for p in gen.generate_problems(level=7, n=5):
        print(p["q"], "=", p["a"])
"""

import random
from dataclasses import dataclass
from typing import Callable, Dict, List, Tuple, Optional, Union

Number = Union[int, float]

@dataclass
class ProblemTemplate:
    name: str
    fn: Callable[[], Tuple[str, Number]]
    weight: int = 1

def _fmt_one_decimal(x: Number) -> Number:
    """Return int if it's effectively an integer; else round to one decimal."""
    if abs(round(x) - x) < 1e-9:
        return int(round(x))
    return round(float(x), 1)

class MentalMathGenerator:
    def __init__(self, seed: Optional[int] = None):
        if seed is not None:
            random.seed(seed)
        self.level_templates = self._build_templates()

    # ---------------------- Public API ----------------------
    def describe_level(self, level: int) -> str:
        desc = {
            1: "Add/sub within 10; make-10 facts.",
            2: "Add/sub within 20; doubles, near-doubles, missing addend.",
            3: "Add/sub within 100; bridge tens; short 2-step chains.",
            4: "×/÷ facts with 0–5 and 10; repeated addition.",
            5: "Full ×/÷ 0–12; fact families and basic division.",
            6: "Two-digit mental +/- and tidy multiples (10/25/50/100).",
            7: "Two-step mixed operations; 9×/11× mental patterns.",
            8: "Tenths/hundredths add/sub; easy % of tidy bases.",
            9: "Friendly fractions of numbers; per-one rates.",
            10:"Multi-step mental chains with %/fractions and tidy combos.",
        }
        return desc.get(level, "Unknown level. Use 1–10.")

    def generate_problem(self, level: int) -> Dict[str, Union[str, Number]]:
        if level not in self.level_templates:
            raise ValueError("Level must be between 1 and 10.")
        tpl = self._weighted_choice(self.level_templates[level])
        q, a = tpl.fn()
        a = _fmt_one_decimal(a)
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
        # Level 1
        def l1_add(): a,b = random.randint(0,10), random.randint(0,10); return f"{a} + {b}", a+b
        def l1_sub(): b = random.randint(0,10); a = random.randint(b,10); return f"{a} - {b}", a-b
        def l1_make10(): a = random.randint(0,10); return f"{a} + ? = 10", 10-a

        # Level 2
        def l2_add(): a,b = random.randint(0,20), random.randint(0,20); return f"{a} + {b}", a+b
        def l2_sub(): b = random.randint(0,20); a = random.randint(b,20); return f"{a} - {b}", a-b
        def l2_dbl(): d = random.randint(0,10); return f"{d} + {d}", 2*d
        def l2_near(): d = random.randint(0,10); return f"{d} + {d+1}", d+d+1
        def l2_missing(): target=random.randint(6,20); left=random.randint(0,target); return f"{left} + ? = {target}", target-left

        # Level 3
        def l3_tens(): t=random.randrange(10,100,10); o=random.randint(1,9); return (f"{t} + {o}", t+o) if random.choice([1,0]) else (f"{t} - {o}", t-o)
        def l3_bridge(): a=random.randint(11,98); b=random.randint(2,9); return (f"{a} + {b}", a+b) if random.choice([1,0]) else (f"{a} - {b}", a-b)
        def l3_two(): a=random.randint(20,80); b,c=random.randint(5,15),random.randint(5,15); return (f"{a}+{b}-{c}", a+b-c) if random.choice([1,0]) else (f"{a}-{b}+{c}", a-b+c)

        # Level 4
        def l4_mult(): a,b=random.choice([0,1,2,3,4,5,10]),random.choice([0,1,2,3,4,5,10]); return f"{a} × {b}", a*b
        def l4_div(): b=random.choice([1,2,3,4,5,10]); c=random.randint(0,5); a=b*c; return f"{a} ÷ {b}", c
        def l4_rep(): term=random.randint(2,5); times=random.randint(2,5); return " + ".join([str(term)]*times), term*times

        # Level 5
        def l5_mult(): a,b=random.randint(0,12),random.randint(0,12); return f"{a} × {b}", a*b
        def l5_div(): b=random.randint(1,12); c=random.randint(0,12); return f"{b*c} ÷ {b}", c
        def l5_fact(): a,b=random.randint(2,12),random.randint(2,12); c=a*b; form=random.choice([f"{a} × {b}",f"{b} × {a}",f"{c} ÷ {a}",f"{c} ÷ {b}"]); return form,c if "×" in form else (form,b if form.endswith(str(a)) else a)

        # Level 6
        def l6_two(): a,b=random.randint(30,99),random.randint(12,68); return (f"{a} + {b}", a+b) if random.choice([1,0]) else (f"{max(a,b)} - {min(a,b)}", abs(a-b))
        def l6_tidy(): base=random.choice([10,20,25,50,100]); k=random.randint(2,12); return f"{k} × {base}", k*base
        def l6_round(): a=random.randint(40,90); b=random.randint(8,19); return f"{a} + {b}", a+b

        # Level 7
        def l7_two(): a=random.randint(40,150); b,c=random.choice([6,8,9,10,12,15,20]),random.choice([6,8,9,10,12,15,20]); form=random.choice([f"{a} + {b} × {c}",f"{a} - {b} × {c}"]); return form, eval(form.replace("×","*").replace(" ",""))
        def l7_special(): n=random.randint(11,19); m=random.choice([9,11]); return f"{m} × {n}", m*n

        # Level 8
        def l8_dec(): a=random.choice([x/10 for x in range(10,200,5)]); b=random.choice([x/10 for x in range(5,80,5)]); return (f"{a:.1f} + {b:.1f}", a+b) if random.choice([1,0]) else (f"{max(a,b):.1f} - {min(a,b):.1f}", abs(a-b))
        def l8_pct(): pct=random.choice([10,20,25,50,5,15]); base=random.choice([20,30,40,60,80,100,120,150,200,250,300]); return f"{pct}% of {base}", base*pct/100

        # Level 9
        def l9_frac(): denom=random.choice([2,4,5,10]); num=random.randint(1,denom-1); base=random.choice([20,40,50,100,200,250]); return f"{num}/{denom} of {base}", base*num/denom
        def l9_rate(): items=random.randint(2,9); price=items*random.choice([2,3,5,10]); return f"If {items} items cost {price}, cost of 1?", price/items

        # Level 10
        def l10_chain(): pct=random.choice([10,15,20,25]); base=random.choice([40,80,120,200]); adj=random.randint(5,20); return f"{pct}% of {base} then + {adj}", base*pct/100+adj
        def l10_mix(): a=random.choice([60,75,80,100,120,150,200]); b=random.choice([5,10,20,25]); c=random.randint(6,20); expr=f"({a} ÷ {b}) + {c}"; return expr, a/b+c

        return {
            1:[ProblemTemplate("add10",l1_add,3),ProblemTemplate("sub10",l1_sub,3),ProblemTemplate("make10",l1_make10,2)],
            2:[ProblemTemplate("add20",l2_add,3),ProblemTemplate("sub20",l2_sub,3),ProblemTemplate("doubles",l2_dbl,2),ProblemTemplate("near",l2_near,2),ProblemTemplate("missing",l2_missing,2)],
            3:[ProblemTemplate("tens",l3_tens,3),ProblemTemplate("bridge",l3_bridge,3),ProblemTemplate("two",l3_two,2)],
            4:[ProblemTemplate("multsmall",l4_mult,3),ProblemTemplate("divsmall",l4_div,3),ProblemTemplate("repeated",l4_rep,2)],
            5:[ProblemTemplate("multfull",l5_mult,3),ProblemTemplate("divfull",l5_div,3),ProblemTemplate("factfam",l5_fact,2)],
            6:[ProblemTemplate("twodig",l6_two,3),ProblemTemplate("tidy",l6_tidy,2),ProblemTemplate("round",l6_round,2)],
            7:[ProblemTemplate("two-step",l7_two,3),ProblemTemplate("special",l7_special,2)],
            8:[ProblemTemplate("dec",l8_dec,3),ProblemTemplate("percent",l8_pct,2)],
            9:[ProblemTemplate("fraction",l9_frac,3),ProblemTemplate("rate",l9_rate,2)],
            10:[ProblemTemplate("chain",l10_chain,2),ProblemTemplate("mix",l10_mix,2)],
        }
