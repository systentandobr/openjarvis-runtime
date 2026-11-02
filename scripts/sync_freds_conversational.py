"""Export the Friendly canonical skill to this runtime, without runtime coupling."""
import argparse
from pathlib import Path


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=(
        root.parent / "code-assistant-friendly/.context/skills/freds-conversational/SKILL.md"
    ))
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if not args.source.is_file():
        parser.error(f"Canonical skill missing: {args.source}; provide --source")
    target = root / "skills/freds-conversational/SKILL.md"
    content = args.source.read_bytes()
    if args.check:
        if not target.is_file() or target.read_bytes() != content:
            parser.exit(1, "Freds skill differs from Friendly; run the sync script.\n")
        print("Freds skill matches Friendly.")
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        print(f"Exported {target}")


if __name__ == "__main__":
    main()
