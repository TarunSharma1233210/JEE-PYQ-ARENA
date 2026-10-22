import json
from pathlib import Path

src = Path("/tmp/jee-clean")
out = Path("data/questions.json")
subjects = {
    "physics": "Physics",
    "chemistry": "Chemistry",
    "mathematics": "Mathematics"
}
items = []

for folder, name in subjects.items():
    for split in ("train", "test"):
        path = src / folder / f"{split}.jsonl"
        with path.open(encoding="utf-8") as f:
            for line in f:
                q = json.loads(line)
                q["subject"] = name
                q["split"] = split
                q["answer_available"] = (
                    q.get("correct_option") is not None
                    or q.get("numerical_answer") not in (None, "")
                )
                for key in ("question_images", "solution_images"):
                    q[key] = [
                        f"data/pyq_images/{folder}/{p}"
                        for p in (q.get(key) or [])
                    ]
                items.append(q)

out.write_text(
    json.dumps(items, ensure_ascii=False),
    encoding="utf-8"
)
print("IMPORT_OK", len(items))
for name in subjects.values():
    print(name, sum(q["subject"] == name for q in items))
print("OUTPUT", out, out.stat().st_size, "bytes")
