#!/usr/bin/env python3
"""
Normalize Obsidian Vault Files

This script normalizes markdown files in an Obsidian vault by:
- Converting inline #tags to frontmatter tags
- Standardizing tag casing (lowercase)
- Ensuring title exists in frontmatter (from filename if missing)
- Adding descriptions (generated from content or via AI)

Usage:
    python normalize_obsidian_vault.py /path/to/vault --dry-run
    python normalize_obsidian_vault.py /path/to/vault --backup
    python normalize_obsidian_vault.py /path/to/vault --use-ai --gradient-base-url https://api.gradient.ai/v1

Requirements:
    pip install pyyaml requests
"""

import argparse
import json
import os
import re
import shutil
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

try:
    import yaml
except ImportError:
    print("Error: PyYAML is required. Install with: pip install pyyaml")
    sys.exit(1)

try:
    import requests
except ImportError:
    requests = None  # Optional, only needed for AI descriptions


# Regex patterns
FRONTMATTER_PATTERN = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)
INLINE_TAG_PATTERN = re.compile(r'(?<!\S)#([a-zA-Z][a-zA-Z0-9_-]*)\b')
WIKILINK_PATTERN = re.compile(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]')

# Files/folders to ignore
IGNORE_PATTERNS = [
    '.obsidian',
    '.git',
    '.trash',
    'node_modules',
    '.quartz-cache',
    'templates',
    'Templates',
]

# AI Configuration
AI_DESCRIPTION_PROMPT = """Write a 1-2 sentence summary of this note. Be concise and direct. Output only the summary, nothing else.

Title: {title}

Content:
{content}"""


class AIDescriptionGenerator:
    """Generates descriptions using an OpenAI-compatible API."""

    def __init__(self, base_url: str, api_key: str, model: str = "llama-3.1-8b-instruct"):
        if requests is None:
            raise ImportError("requests library is required for AI descriptions. Install with: pip install requests")

        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.model = model
        self.request_count = 0
        self.rate_limit_delay = 0.5  # Delay between requests in seconds

    def generate_description(self, title: str, content: str, max_length: int = 150) -> Optional[str]:
        """Generate a description using the AI model."""
        if not content or not content.strip():
            return None

        # Truncate content to avoid token limits (first ~2000 chars)
        truncated_content = content[:2000]

        prompt = AI_DESCRIPTION_PROMPT.format(title=title, content=truncated_content)

        try:
            # Rate limiting
            if self.request_count > 0:
                time.sleep(self.rate_limit_delay)

            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    # High token limit for reasoning models that do extensive chain-of-thought
                    "max_tokens": 3000,
                    "temperature": 0.3
                },
                timeout=90  # Longer timeout for reasoning models
            )

            self.request_count += 1

            if response.status_code == 200:
                result = response.json()
                message = result['choices'][0]['message']
                raw_content = message.get('content')

                # Some reasoning models put output in reasoning_content instead of content
                # Try to extract a description from reasoning_content if content is empty
                if not raw_content:
                    reasoning = message.get('reasoning_content', '')
                    if reasoning:
                        # Try to find a quoted description in the reasoning
                        import re
                        # Look for text in quotes that looks like a description
                        quoted = re.findall(r'"([^"]{20,150})"', reasoning)
                        if quoted:
                            # Use the longest quoted text as the description
                            raw_content = max(quoted, key=len)
                            print(f"  [AI Info] Extracted description from reasoning_content")

                if not raw_content:
                    print(f"  [AI Warning] API returned empty content")
                    return None
                description = raw_content.strip()

                # Clean up the description
                description = description.strip('"\'')

                # Truncate if too long
                if len(description) > max_length:
                    last_period = description[:max_length].rfind('.')
                    if last_period > max_length * 0.6:
                        description = description[:last_period + 1]
                    else:
                        description = description[:max_length - 3] + "..."

                return description
            else:
                print(f"  [AI Error] Status {response.status_code}: {response.text[:200]}")
                return None

        except requests.exceptions.Timeout:
            print(f"  [AI Error] Request timed out")
            return None
        except requests.exceptions.RequestException as e:
            print(f"  [AI Error] Request failed: {e}")
            return None
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            print(f"  [AI Error] Failed to parse response: {e}")
            return None


def should_ignore(path: Path) -> bool:
    """Check if path should be ignored."""
    for pattern in IGNORE_PATTERNS:
        if pattern in path.parts:
            return True
    return False


def parse_frontmatter(content: str) -> Tuple[dict, str]:
    """
    Parse frontmatter from markdown content.
    Returns (frontmatter_dict, body_content).
    """
    match = FRONTMATTER_PATTERN.match(content)
    if match:
        try:
            frontmatter = yaml.safe_load(match.group(1)) or {}
            body = content[match.end():]
            return frontmatter, body
        except yaml.YAMLError:
            # Malformed YAML, treat as no frontmatter
            return {}, content
    return {}, content


def serialize_frontmatter(frontmatter: dict) -> str:
    """Serialize frontmatter dict to YAML string."""
    if not frontmatter:
        return ""

    # Custom representer to handle lists nicely
    def represent_list(dumper, data):
        if len(data) == 0:
            return dumper.represent_sequence('tag:yaml.org,2002:seq', data, flow_style=True)
        return dumper.represent_sequence('tag:yaml.org,2002:seq', data, flow_style=False)

    yaml.add_representer(list, represent_list)

    yaml_str = yaml.dump(
        frontmatter,
        default_flow_style=False,
        allow_unicode=True,
        sort_keys=False,
        width=1000  # Prevent line wrapping
    )
    return f"---\n{yaml_str}---\n\n"


def extract_inline_tags(content: str) -> list:
    """Extract inline #tags from content."""
    # Find all inline tags
    tags = INLINE_TAG_PATTERN.findall(content)
    # Deduplicate and lowercase
    return list(set(tag.lower() for tag in tags))


def remove_inline_tags(content: str) -> str:
    """Remove inline #tags from content (optional - keeps them by default)."""
    # This function is available but not used by default
    # as some users may want to keep inline tags for Obsidian functionality
    return INLINE_TAG_PATTERN.sub('', content)


def title_from_filename(filepath: Path) -> str:
    """Generate title from filename."""
    # Remove .md extension and convert dashes/underscores to spaces
    name = filepath.stem
    # Replace common separators with spaces
    name = name.replace('-', ' ').replace('_', ' ')
    # Title case
    return name.title()


def generate_description(content: str, max_length: int = 150) -> str:
    """Generate description from content."""
    if not content or not content.strip():
        return ""

    # Remove markdown formatting for cleaner description
    text = content.strip()

    # Remove headers
    text = re.sub(r'^#{1,6}\s+.*$', '', text, flags=re.MULTILINE)

    # Remove wikilinks but keep the text
    text = WIKILINK_PATTERN.sub(r'\1', text)

    # Remove markdown links
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)

    # Remove images
    text = re.sub(r'!\[([^\]]*)\]\([^)]+\)', '', text)

    # Remove code blocks
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'`[^`]+`', '', text)

    # Remove bold/italic
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'_([^_]+)_', r'\1', text)

    # Remove blockquotes
    text = re.sub(r'^>\s*', '', text, flags=re.MULTILINE)

    # Remove horizontal rules
    text = re.sub(r'^---+$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\*\*\*+$', '', text, flags=re.MULTILINE)

    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    if not text:
        return ""

    # Truncate to max_length
    if len(text) <= max_length:
        return text

    # Try to end at a sentence boundary
    truncated = text[:max_length]
    last_period = truncated.rfind('.')
    last_space = truncated.rfind(' ')

    if last_period > max_length * 0.6:
        return truncated[:last_period + 1]
    elif last_space > max_length * 0.6:
        return truncated[:last_space] + "..."
    else:
        return truncated + "..."


def normalize_tags(existing_tags: list, inline_tags: list) -> list:
    """Merge and normalize tags."""
    all_tags = set()

    # Add existing frontmatter tags (lowercase)
    if existing_tags:
        for tag in existing_tags:
            if isinstance(tag, str):
                all_tags.add(tag.lower().strip())

    # Add inline tags (already lowercase)
    all_tags.update(inline_tags)

    # Remove empty strings and sort
    return sorted(tag for tag in all_tags if tag)


def normalize_file(
    filepath: Path,
    dry_run: bool = False,
    verbose: bool = False,
    ai_generator: Optional[AIDescriptionGenerator] = None
) -> dict:
    """
    Normalize a single markdown file.
    Returns dict with changes made.
    """
    changes = {
        'file': str(filepath),
        'modified': False,
        'changes': []
    }

    try:
        content = filepath.read_text(encoding='utf-8')
    except Exception as e:
        changes['error'] = f"Could not read file: {e}"
        return changes

    # Parse existing frontmatter
    frontmatter, body = parse_frontmatter(content)
    original_frontmatter = frontmatter.copy()

    # 1. Extract inline tags and merge with frontmatter tags
    inline_tags = extract_inline_tags(body)
    existing_tags = frontmatter.get('tags', [])
    if isinstance(existing_tags, str):
        existing_tags = [existing_tags]

    normalized_tags = normalize_tags(existing_tags, inline_tags)

    if normalized_tags != (existing_tags or []):
        frontmatter['tags'] = normalized_tags
        changes['changes'].append(f"tags: {existing_tags} -> {normalized_tags}")

    # 2. Ensure title exists
    title = frontmatter.get('title')
    if not title:
        title = title_from_filename(filepath)
        frontmatter['title'] = title
        changes['changes'].append(f"title: (none) -> '{title}'")

    # 3. Add or regenerate description
    # TEMPORARY: Always regenerate descriptions with AI (will revert after one-time run)
    old_description = frontmatter.get('description', '')
    new_description = None

    # Try AI generation first if available
    if ai_generator and body.strip():
        new_description = ai_generator.generate_description(title, body)
        if new_description:
            if old_description:
                changes['changes'].append(f"description (AI regenerated): '{new_description[:50]}...'")
            else:
                changes['changes'].append(f"description (AI): '{new_description[:50]}...'")

    # Fall back to simple extraction only if no existing description AND no AI
    if not new_description and not old_description:
        new_description = generate_description(body)
        if new_description:
            changes['changes'].append(f"description: (none) -> '{new_description[:50]}...'")

    if new_description:
        frontmatter['description'] = new_description

    # Check if anything changed
    if frontmatter != original_frontmatter:
        changes['modified'] = True

        if not dry_run:
            # Reconstruct file content
            new_content = serialize_frontmatter(frontmatter) + body.lstrip('\n')

            try:
                filepath.write_text(new_content, encoding='utf-8')
            except Exception as e:
                changes['error'] = f"Could not write file: {e}"
                changes['modified'] = False

    return changes


def create_backup(vault_path: Path, backup_dir: Optional[Path] = None) -> Path:
    """Create a backup of the vault."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    if backup_dir:
        backup_path = backup_dir / f"vault_backup_{timestamp}"
    else:
        backup_path = vault_path.parent / f"{vault_path.name}_backup_{timestamp}"

    print(f"Creating backup at: {backup_path}")
    shutil.copytree(vault_path, backup_path, ignore=shutil.ignore_patterns('.git', 'node_modules', '.quartz-cache'))
    print(f"Backup created successfully.")

    return backup_path


def main():
    parser = argparse.ArgumentParser(
        description="Normalize Obsidian vault markdown files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Preview changes without modifying files
    python normalize_obsidian_vault.py /path/to/vault --dry-run

    # Create backup and normalize
    python normalize_obsidian_vault.py /path/to/vault --backup

    # Normalize with verbose output
    python normalize_obsidian_vault.py /path/to/vault --verbose

    # Use AI for description generation (requires GRADIENT_API_KEY env var)
    python normalize_obsidian_vault.py /path/to/vault --use-ai --gradient-base-url https://api.gradient.ai/v1
        """
    )

    parser.add_argument(
        'vault_path',
        type=Path,
        help='Path to the Obsidian vault directory'
    )
    parser.add_argument(
        '--dry-run', '-n',
        action='store_true',
        help='Preview changes without modifying files'
    )
    parser.add_argument(
        '--backup', '-b',
        action='store_true',
        help='Create a backup before making changes'
    )
    parser.add_argument(
        '--backup-dir',
        type=Path,
        help='Directory to store backup (default: next to vault)'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Show detailed output for each file'
    )
    parser.add_argument(
        '--include-pattern',
        type=str,
        default='*.md',
        help='Glob pattern for files to include (default: *.md)'
    )

    # AI options
    parser.add_argument(
        '--use-ai',
        action='store_true',
        help='Use AI to generate descriptions (requires GRADIENT_API_KEY env var)'
    )
    parser.add_argument(
        '--gradient-base-url',
        type=str,
        default='https://api.gradient.ai/v1',
        help='Gradient AI API base URL (default: https://api.gradient.ai/v1)'
    )
    parser.add_argument(
        '--ai-model',
        type=str,
        default='llama-3.1-8b-instruct',
        help='AI model to use for descriptions (default: llama-3.1-8b-instruct)'
    )

    args = parser.parse_args()

    vault_path = args.vault_path.resolve()

    if not vault_path.exists():
        print(f"Error: Vault path does not exist: {vault_path}")
        sys.exit(1)

    if not vault_path.is_dir():
        print(f"Error: Vault path is not a directory: {vault_path}")
        sys.exit(1)

    print(f"Obsidian Vault Normalizer")
    print(f"=" * 50)
    print(f"Vault: {vault_path}")
    print(f"Dry run: {args.dry_run}")

    # Set up AI generator if requested
    ai_generator = None
    if args.use_ai:
        if requests is None:
            print("Error: requests library required for AI. Install with: pip install requests")
            sys.exit(1)

        api_key = os.environ.get('GRADIENT_API_KEY')
        if not api_key:
            print("Error: GRADIENT_API_KEY environment variable not set.")
            print("Set it with: export GRADIENT_API_KEY=your_api_key")
            sys.exit(1)

        print(f"AI enabled: {args.gradient_base_url} (model: {args.ai_model})")
        ai_generator = AIDescriptionGenerator(
            base_url=args.gradient_base_url,
            api_key=api_key,
            model=args.ai_model
        )

    print()

    # Create backup if requested
    if args.backup and not args.dry_run:
        create_backup(vault_path, args.backup_dir)
        print()

    # Find all markdown files
    md_files = list(vault_path.rglob(args.include_pattern))
    md_files = [f for f in md_files if not should_ignore(f)]

    print(f"Found {len(md_files)} markdown files to process.")
    if ai_generator:
        print(f"AI descriptions will be generated for notes missing descriptions.")
    print()

    # Statistics
    stats = {
        'total': len(md_files),
        'modified': 0,
        'unchanged': 0,
        'errors': 0,
        'tags_updated': 0,
        'titles_added': 0,
        'descriptions_added': 0,
        'ai_descriptions': 0
    }

    for filepath in md_files:
        relative_path = filepath.relative_to(vault_path)
        result = normalize_file(
            filepath,
            dry_run=args.dry_run,
            verbose=args.verbose,
            ai_generator=ai_generator
        )

        if 'error' in result:
            stats['errors'] += 1
            print(f"[ERROR] {relative_path}: {result['error']}")
            continue

        if result['modified']:
            stats['modified'] += 1

            # Count specific changes
            for change in result['changes']:
                if change.startswith('tags:'):
                    stats['tags_updated'] += 1
                elif change.startswith('title:'):
                    stats['titles_added'] += 1
                elif change.startswith('description (AI):'):
                    stats['ai_descriptions'] += 1
                    stats['descriptions_added'] += 1
                elif change.startswith('description:'):
                    stats['descriptions_added'] += 1

            if args.verbose:
                print(f"[MODIFIED] {relative_path}")
                for change in result['changes']:
                    print(f"  - {change}")
        else:
            stats['unchanged'] += 1
            if args.verbose:
                print(f"[UNCHANGED] {relative_path}")

    # Print summary
    print()
    print("=" * 50)
    print("SUMMARY")
    print("=" * 50)
    print(f"Total files processed: {stats['total']}")
    print(f"Files modified:        {stats['modified']}")
    print(f"Files unchanged:       {stats['unchanged']}")
    print(f"Errors:                {stats['errors']}")
    print()
    print("Changes by type:")
    print(f"  Tags updated:        {stats['tags_updated']}")
    print(f"  Titles added:        {stats['titles_added']}")
    print(f"  Descriptions added:  {stats['descriptions_added']}")
    if ai_generator:
        print(f"    (AI-generated):    {stats['ai_descriptions']}")

    if args.dry_run:
        print()
        print("DRY RUN - No files were modified.")
        print("Run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()
