#!/usr/bin/env python3
"""
Normalize Obsidian Notes in PostgreSQL Database

This script normalizes all notes in the database to ensure they have
valid values for all fields required by the Typesense schema.

Usage:
    python normalize_notes.py --database-url "postgresql://user:pass@host:port/db"

Or set the DATABASE_URL environment variable:
    export DATABASE_URL="postgresql://user:pass@host:port/db"
    python normalize_notes.py
"""

import argparse
import os
import sys
from datetime import datetime
from typing import Optional

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("Error: psycopg2 is required. Install with: pip install psycopg2-binary")
    sys.exit(1)

# Default vault URLs for generating source_url if missing
VAULT_URLS = {
    "general": "https://garden.mymediaverseuniverse.com",
    "programming": "https://hackerman.mymediaverseuniverse.com"
}


def normalize_content(content: Optional[str]) -> str:
    """Normalize content field - return empty string if null/whitespace only."""
    if content is None:
        return ""
    # Strip whitespace and return empty string if only whitespace
    stripped = content.strip()
    return stripped if stripped else ""


def normalize_description(description: Optional[str], content: str, title: str) -> str:
    """
    Normalize description field.
    If null/empty, generate from content (first 150 chars) or use title.
    """
    if description and description.strip():
        return description.strip()

    # Try to generate from content
    if content:
        # Take first 150 characters, try to end at a sentence or word boundary
        desc = content[:150]
        if len(content) > 150:
            # Try to end at last period or space
            last_period = desc.rfind('.')
            last_space = desc.rfind(' ')
            if last_period > 100:
                desc = desc[:last_period + 1]
            elif last_space > 100:
                desc = desc[:last_space] + "..."
            else:
                desc = desc + "..."
        return desc.strip()

    # Fall back to title
    return title


def normalize_tags(tags) -> list:
    """Normalize tags field - ensure it's a valid list."""
    if tags is None:
        return []
    if isinstance(tags, list):
        # Filter out empty strings and normalize
        return [t.strip().lower() for t in tags if t and t.strip()]
    return []


def normalize_source_url(source_url: Optional[str], vault_name: str, slug: str) -> str:
    """Normalize source_url - generate if missing."""
    if source_url and source_url.strip():
        return source_url.strip()

    vault_url = VAULT_URLS.get(vault_name.lower(), VAULT_URLS["general"])
    return f"{vault_url}/{slug}"


def get_connection(database_url: str):
    """Create database connection from URL."""
    return psycopg2.connect(database_url)


def fetch_all_notes(cursor) -> list:
    """Fetch all notes from the database."""
    cursor.execute("""
        SELECT
            "Id", "Slug", "Title", "Content", "Description",
            "VaultName", "SourceUrl", "Tags", "NoteDate",
            "DateImported", "LastSyncedAt", "ContentHash"
        FROM "Notes"
        ORDER BY "DateImported" DESC
    """)
    return cursor.fetchall()


def update_note(cursor, note_id: str, updates: dict):
    """Update a note with the given fields."""
    set_clauses = []
    values = []

    for field, value in updates.items():
        set_clauses.append(f'"{field}" = %s')
        values.append(value)

    values.append(note_id)

    query = f"""
        UPDATE "Notes"
        SET {", ".join(set_clauses)}
        WHERE "Id" = %s
    """
    cursor.execute(query, values)


def main():
    parser = argparse.ArgumentParser(description="Normalize Obsidian notes in PostgreSQL")
    parser.add_argument(
        "--database-url", "-d",
        help="PostgreSQL connection URL",
        default=os.environ.get("DATABASE_URL")
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Show what would be changed without making changes"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed output for each note"
    )

    args = parser.parse_args()

    if not args.database_url:
        print("Error: Database URL required. Use --database-url or set DATABASE_URL env var.")
        sys.exit(1)

    print(f"Connecting to database...")
    print(f"Dry run: {args.dry_run}")
    print()

    try:
        conn = get_connection(args.database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        print("Fetching all notes...")
        notes = fetch_all_notes(cursor)
        print(f"Found {len(notes)} notes to process.\n")

        # Statistics
        stats = {
            "total": len(notes),
            "content_normalized": 0,
            "description_generated": 0,
            "tags_normalized": 0,
            "source_url_generated": 0,
            "unchanged": 0
        }

        for note in notes:
            note_id = str(note["Id"])
            slug = note["Slug"]
            title = note["Title"]
            vault_name = note["VaultName"]

            updates = {}
            changes = []

            # Normalize content
            original_content = note["Content"]
            normalized_content = normalize_content(original_content)
            if original_content != normalized_content:
                updates["Content"] = normalized_content
                changes.append(f"content: {'(null)' if original_content is None else repr(original_content[:50])} -> {repr(normalized_content[:50]) if normalized_content else '(empty)'}")
                stats["content_normalized"] += 1

            # Normalize description
            original_desc = note["Description"]
            normalized_desc = normalize_description(original_desc, normalized_content, title)
            if original_desc != normalized_desc:
                updates["Description"] = normalized_desc
                changes.append(f"description: {'(null)' if original_desc is None else repr(original_desc[:30])} -> {repr(normalized_desc[:30])}")
                stats["description_generated"] += 1

            # Normalize tags
            original_tags = note["Tags"]
            normalized_tags = normalize_tags(original_tags)
            # Compare as sets to handle ordering differences
            if set(original_tags or []) != set(normalized_tags):
                updates["Tags"] = normalized_tags
                changes.append(f"tags: {original_tags} -> {normalized_tags}")
                stats["tags_normalized"] += 1

            # Normalize source_url
            original_url = note["SourceUrl"]
            normalized_url = normalize_source_url(original_url, vault_name, slug)
            if original_url != normalized_url:
                updates["SourceUrl"] = normalized_url
                changes.append(f"source_url: {original_url} -> {normalized_url}")
                stats["source_url_generated"] += 1

            # Apply updates
            if updates:
                if args.verbose:
                    print(f"[{slug}] {title}")
                    for change in changes:
                        print(f"  - {change}")
                    print()

                if not args.dry_run:
                    update_note(cursor, note_id, updates)
            else:
                stats["unchanged"] += 1
                if args.verbose:
                    print(f"[{slug}] No changes needed")

        if not args.dry_run:
            conn.commit()
            print("Changes committed to database.")
        else:
            print("DRY RUN - No changes made.")

        print("\n" + "=" * 50)
        print("SUMMARY")
        print("=" * 50)
        print(f"Total notes processed: {stats['total']}")
        print(f"Content normalized:    {stats['content_normalized']}")
        print(f"Descriptions generated:{stats['description_generated']}")
        print(f"Tags normalized:       {stats['tags_normalized']}")
        print(f"Source URLs generated: {stats['source_url_generated']}")
        print(f"Unchanged:             {stats['unchanged']}")

        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        print(f"Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
