import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "data" / "questions.json"
OUTPUT = ROOT / "data" / "practice_questions.json"

TARGETS = {"Physics": 232, "Chemistry": 262, "Mathematics": 199}

def main():
    questions = json.loads(SOURCE.read_text(encoding="utf-8"))
    ids = [str(q.get("question_id", "")) for q in questions]
    duplicates = [k for k, v in Counter(ids).items() if k and v > 1]
    subjects = Counter(q.get("subject") for q in questions)

    print("SOURCE_TOTAL:", len(questions))
    for subject, needed in TARGETS.items():
        print(f"{subject}: existing={subjects[subject]}, additional_target={needed}")
    print("DUPLICATE_SOURCE_IDS:", len(duplicates))
    print("PRACTICE_FILE_EXISTS:", OUTPUT.exists())
    print("VALIDATION_COMPLETE")

if __name__ == "__main__":
    main()
