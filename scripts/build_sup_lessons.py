#!/usr/bin/env python3
"""Parse supplementary modules from curriculum .md files and inject them
INTO each level's section of lesson arrays (after the last lesson of that level),
so the existing index-based lock logic works naturally."""

import re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def extract_section(md, heading):
    lines = md.split("\n")
    found = False
    out = []
    for line in lines:
        if heading in line and line.strip().startswith("##"):
            found = True
            continue
        if found:
            if line.strip().startswith("##"):
                break
            if line.strip() and not line.strip().startswith("---"):
                out.append(line.strip())
    return out

def items(heading, md):
    return [l for l in extract_section(md, heading) if re.match(r"^[-•*]\s|^\d+\.\s", l)]

def esc(t):
    return re.sub(r"^[-•*]\s*|^\d+\.\s*", "", t).strip().rstrip(".").replace("\\", "\\\\").replace("'", "\\'")

def grp(lst, n):
    return ["; ".join(esc(x) for x in lst[i:i+n]) for i in range(0, len(lst), n)]

with open(os.path.join(ROOT, "curriculum_french.md"), "r", encoding="utf-8") as f:
    fr_md = f.read()
with open(os.path.join(ROOT, "curriculum_english.md"), "r", encoding="utf-8") as f:
    en_md = f.read()

# Parse
fr_conf, fr_daily, fr_idioms, fr_homo = items("Confusion Pairs", fr_md), items("Daily Phrases", fr_md), items("Idioms", fr_md), items("Homophones", fr_md)
fr_vocab, fr_writing, fr_expr, fr_ways = items("Vocabulary Lists", fr_md), items("Writing Prompts", fr_md), items("10 Expressions", fr_md), items("___ Ways to Say", fr_md)
en_conf, en_daily, en_idioms, en_homo = items("Confusion Pairs", en_md), items("Daily Phrases", en_md), items("Idioms", en_md), items("Homophones", en_md)
en_vocab, en_writing, en_expr, en_ways = items("Vocabulary Lists", en_md), items("Writing Prompts", en_md), items("10 Expressions", en_md), items("___ Ways to Say", en_md)

def verb_groups(md, mark):
    cur = None; gs = []
    for line in extract_section(md, mark):
        m = re.match(r"^###\s+(.+)", line)
        if m:
            if cur: gs.append(cur)
            cur = {"title": esc(m.group(1)), "samples": []}
        elif cur and line.strip():
            cur["samples"].append(esc(line))
    if cur: gs.append(cur)
    return gs

fr_verbs = verb_groups(fr_md, "French Verb Reference")
en_phrasal = verb_groups(en_md, "Phrasal Verb")

# Generate sup lessons as {id, level, gf}
def gen_fr():
    L = {"A1":[], "A2":[], "B1":[], "B2":[]}
    def add(lv, pre, gf):
        L[lv].append({"id": f"fr-{pre}-{len(L[lv])+1:02d}", "level": lv, "gf": gf})

    for g in grp(fr_conf, 3): add("A2", "sup-conf", "Confusion: "+g)
    for it in fr_daily:
        c = esc(it)
        add("A1" if "Trab" not in c and "Emerg" not in c else "A2", "sup-daily", "Daily Phrases: "+c)
    for i,g in enumerate(grp(fr_homo,7)): add(["A1","A2","A2","B1","B1","B2","B2","B2"][i%8], "sup-homo", "Homophones: "+g)
    for i,g in enumerate(grp(fr_idioms,6)): add("B1" if i<4 else "B2", "sup-idiom", "Idioms: "+g)
    for it in fr_vocab: add("A1", "sup-vocab", "Vocabulary: "+esc(it))
    for i,g in enumerate(grp(fr_writing,3)): add("B1" if i<2 else "B2", "sup-writing", "Writing: "+g)
    for it in fr_expr:
        c = esc(it)
        if any(v in c for v in ["Etre","Avoir","Aller","Faire"]): add("A2","sup-expr","Expressions: "+c)
        elif any(v in c for v in ["Tomber","Mettre","Prendre","Y (","Y:","En (","En:"]): add("B1","sup-expr","Expressions: "+c)
        else: add("B2","sup-expr","Expressions: "+c)
    for it in fr_ways:
        c = esc(it)
        add("A1" if any(v in c for v in ["Bonjour","Comment ca","Ca va","Oui","Non"]) else "A2", "sup-ways", "Ways to Say: "+c)
    for g in fr_verbs:
        if "1st" in g["title"]: add("A1","sup-verb","Verb Ref: "+g["title"])
        elif "2nd" in g["title"]: add("A2","sup-verb","Verb Ref: "+g["title"])
        else: add("B1","sup-verb","Verb Ref: "+g["title"])
    return L

def gen_en():
    L = {"A1":[], "A2":[], "B1":[], "B2":[]}
    def add(lv, pre, gf):
        L[lv].append({"id": f"en-{pre}-{len(L[lv])+1:02d}", "level": lv, "gf": gf})

    for i,g in enumerate(grp(en_conf,3)): add("A1" if i<7 else "A2", "sup-conf", "Confusion: "+g)
    for it in en_daily:
        c = esc(it)
        add("A1" if "Trab" not in c and "Emerg" not in c else "A2", "sup-daily", "Daily Phrases: "+c)
    for i,g in enumerate(grp(en_homo,6)): add("A1" if i<3 else "A2", "sup-homo", "Homophones: "+g)
    for i,g in enumerate(grp(en_idioms,6)): add("B1" if i<3 else "B2", "sup-idiom", "Idioms: "+g)
    for it in en_vocab: add("A1", "sup-vocab", "Vocabulary: "+esc(it))
    for i,g in enumerate(grp(en_writing,3)): add("B1" if i<2 else "B2", "sup-writing", "Writing: "+g)
    for it in en_expr:
        c = esc(it)
        if any(v in c for v in ["Get","Make","Do"]): add("A2","sup-expr","Expressions: "+c)
        elif any(v in c for v in ["Take","Give","Have"]): add("B1","sup-expr","Expressions: "+c)
        else: add("B2","sup-expr","Expressions: "+c)
    for it in en_ways:
        c = esc(it)
        add("A1" if any(v in c for v in ["Hello","Goodbye","Thank","Yes","No","Sorry"]) else "A2", "sup-ways", "Ways to Say: "+c)
    for g in en_phrasal:
        add("B1", "sup-phrase", "Phrasal Verbs: "+g["title"])

    return L

fr_sup = gen_fr()
en_sup = gen_en()

for lv in ["A1","A2","B1","B2"]:
    print(f"  FR {lv}: {len(fr_sup[lv])} sup | EN {lv}: {len(en_sup[lv])} sup")

# ── Read curriculum.ts, split by language, inject SUP at level boundaries ──
path = os.path.join(ROOT, "lib", "curriculum.ts")
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")

# Find boundaries: where each level transitions to the next in each language
def find_boundaries(lines, lang):
    """Returns dict: level -> line_index where SUP for that level should be inserted
    (i.e. the index of the FIRST lesson of the NEXT level, or the '];' closing line)"""
    levels = ["A1","A2","B1","B2","C1","C2"]
    result = {}
    n = len(lines)
    idx = 0
    # Find section start
    while idx < n and f"export const {lang.upper()}_LESSONS" not in lines[idx]:
        idx += 1
    if idx >= n:
        return result
    # Scan lessons tracking level changes
    current = None
    insert_at = {}  # level -> line index to insert after
    for i in range(idx+1, n):
        stripped = lines[i].strip()
        if stripped in ("];", "];  // ── Supplementary Modules"):
            # end of array, insert C1/C2 here
            for lv in levels:
                if lv not in insert_at:
                    insert_at[lv] = i
            break
        m = re.search(r"id: '" + lang + r"-(\w+)-", stripped)
        if m:
            ll = m.group(1).upper()
            if ll in levels and ll != current:
                if current and current not in insert_at:
                    insert_at[current] = i  # insert SUP for `current` at this position (before new level)
                current = ll
        if "/// English Curriculum" in stripped and lang == "fr":
            for lv in levels:
                if lv not in insert_at:
                    insert_at[lv] = i
            break
        if "/// Lesson selection" in stripped and lang == "en":
            for lv in levels:
                if lv not in insert_at:
                    insert_at[lv] = i
            break
    for lv in levels:
        if lv not in insert_at:
            insert_at[lv] = i  # fallback
    return insert_at

fr_bounds = find_boundaries(lines, "fr")
en_bounds = find_boundaries(lines, "en")
print(f"FR bounds: {fr_bounds}")
print(f"EN bounds: {en_bounds}")

# Build the final file by walking through and inserting at boundaries
# Process French first, then English. Insert lines are the sup lessons joined by \n.
sup_lines_for = {
    f"fr-{lv}": ["    { id: '"+l["id"]+"', language: 'fr', level: '"+l["level"]+"', grammarFocus: '"+l["gf"]+"' }," for l in fr_sup[lv]]
    for lv in ["A1","A2","B1","B2"]
}
sup_lines_for.update({
    f"en-{lv}": ["    { id: '"+l["id"]+"', language: 'en', level: '"+l["level"]+"', grammarFocus: '"+l["gf"]+"' }," for l in en_sup[lv]]
    for lv in ["A1","A2","B1","B2"]
})

# We need to reconstruct the file:
# 1. Find French section boundaries and insert
# 2. Find English section boundaries and insert
# Do it in reverse order (English first, then French) so insert indices don't shift.

def insert_at_positions(lines, insertions):
    """Insert lists of lines at given positions. insertions = {position: [lines...]}.
    Process in reverse order to keep earlier positions valid."""
    result = list(lines)
    for pos in sorted(insertions.keys(), reverse=True):
        to_insert = insertions[pos]
        result[pos:pos] = to_insert
    return result

fr_insertions = {}
en_insertions = {}

for lv in ["A1","A2","B1","B2"]:
    if fr_bounds[lv] is not None and fr_sup[lv]:
        pos = fr_bounds[lv]
        fr_insertions[pos] = ["  // Supplementary for " + lv + ""] + sup_lines_for[f"fr-{lv}"] + [""]
    if en_bounds[lv] is not None and en_sup[lv]:
        pos = en_bounds[lv]
        en_insertions[pos] = ["  // Supplementary for " + lv + ""] + sup_lines_for[f"en-{lv}"] + [""]

# Insert English first (later in file)
# Actually, we need to handle both in a single pass to avoid index shifting.
# Let me collect ALL insertions and sort by position descending.

all_insertions = {}
for pos, lns in en_insertions.items():
    all_insertions[pos] = lns
for pos, lns in fr_insertions.items():
    # English comes after French, so French pos < English pos. No overlap.
    all_insertions[pos] = lns

new_lines = insert_at_positions(lines, all_insertions)

with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(new_lines))

total = sum(len(v) for v in fr_sup.values()) + sum(len(v) for v in en_sup.values())
print(f"\nInjected {total} supplementary lessons distributed across A1-B2 levels.")
print("Done!")
