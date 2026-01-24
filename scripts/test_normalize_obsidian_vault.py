#!/usr/bin/env python3
"""
Tests for normalize_obsidian_vault.py

Run with: python -m pytest test_normalize_obsidian_vault.py -v
"""

import tempfile
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from normalize_obsidian_vault import (
    normalize_file,
    parse_frontmatter,
    generate_description,
    normalize_tags,
)


class TestDescriptionPreservation:
    """Tests for description handling - ensuring existing descriptions are not overwritten."""

    def test_existing_description_is_preserved(self, tmp_path):
        """When a note has an existing description, it should not be overwritten."""
        note_path = tmp_path / "test_note.md"
        existing_description = "This is my custom description that should be kept."
        note_path.write_text(f"""---
title: Test Note
description: {existing_description}
tags:
  - test
---

Some content here that could be used to generate a description.
""", encoding='utf-8')

        result = normalize_file(note_path, dry_run=False)

        # Read the file back
        content = note_path.read_text(encoding='utf-8')
        frontmatter, _ = parse_frontmatter(content)

        assert frontmatter['description'] == existing_description
        # Should not have any description changes in the result
        description_changes = [c for c in result['changes'] if 'description' in c]
        assert len(description_changes) == 0

    def test_existing_description_preserved_with_ai_generator(self, tmp_path):
        """Even when AI generator is available, existing descriptions should be preserved."""
        note_path = tmp_path / "test_note.md"
        existing_description = "My carefully crafted description."
        note_path.write_text(f"""---
title: AI Test Note
description: {existing_description}
---

This note has lots of content that the AI could summarize,
but it should not because there's already a description.
""", encoding='utf-8')

        # Create a mock AI generator
        mock_ai = MagicMock()
        mock_ai.generate_description.return_value = "AI would generate this description."

        result = normalize_file(note_path, dry_run=False, ai_generator=mock_ai)

        # Read the file back
        content = note_path.read_text(encoding='utf-8')
        frontmatter, _ = parse_frontmatter(content)

        # Original description should be preserved
        assert frontmatter['description'] == existing_description
        # AI should NOT have been called
        mock_ai.generate_description.assert_not_called()

    def test_description_generated_when_missing(self, tmp_path):
        """When no description exists, one should be generated from content."""
        note_path = tmp_path / "test_note.md"
        note_path.write_text("""---
title: Note Without Description
tags:
  - test
---

This is the content of the note that should be used to generate a description.
It has multiple sentences to work with.
""", encoding='utf-8')

        result = normalize_file(note_path, dry_run=False)

        # Read the file back
        content = note_path.read_text(encoding='utf-8')
        frontmatter, _ = parse_frontmatter(content)

        # A description should have been generated
        assert 'description' in frontmatter
        assert len(frontmatter['description']) > 0
        # Should have a description change in the result
        description_changes = [c for c in result['changes'] if 'description' in c]
        assert len(description_changes) == 1

    def test_ai_description_used_when_no_existing(self, tmp_path):
        """When no description exists and AI is available, AI should generate it."""
        note_path = tmp_path / "test_note.md"
        note_path.write_text("""---
title: Note For AI
---

Content for the AI to summarize.
""", encoding='utf-8')

        ai_description = "AI-generated summary of the note."
        mock_ai = MagicMock()
        mock_ai.generate_description.return_value = ai_description

        result = normalize_file(note_path, dry_run=False, ai_generator=mock_ai)

        # Read the file back
        content = note_path.read_text(encoding='utf-8')
        frontmatter, _ = parse_frontmatter(content)

        # AI description should be used
        assert frontmatter['description'] == ai_description
        mock_ai.generate_description.assert_called_once()
        # Should indicate AI was used
        description_changes = [c for c in result['changes'] if 'description (AI)' in c]
        assert len(description_changes) == 1

    def test_fallback_to_extraction_when_ai_fails(self, tmp_path):
        """When AI returns None, should fall back to content extraction."""
        note_path = tmp_path / "test_note.md"
        note_path.write_text("""---
title: Fallback Test
---

This content should be extracted as the description when AI fails.
""", encoding='utf-8')

        mock_ai = MagicMock()
        mock_ai.generate_description.return_value = None  # AI fails

        result = normalize_file(note_path, dry_run=False, ai_generator=mock_ai)

        # Read the file back
        content = note_path.read_text(encoding='utf-8')
        frontmatter, _ = parse_frontmatter(content)

        # Should have fallen back to content extraction
        assert 'description' in frontmatter
        assert 'This content should be extracted' in frontmatter['description']

    def test_empty_description_is_treated_as_missing(self, tmp_path):
        """An empty string description should be treated as missing."""
        note_path = tmp_path / "test_note.md"
        note_path.write_text("""---
title: Empty Description Test
description: ""
---

Content that should become the new description.
""", encoding='utf-8')

        result = normalize_file(note_path, dry_run=False)

        # Read the file back
        content = note_path.read_text(encoding='utf-8')
        frontmatter, _ = parse_frontmatter(content)

        # A description should have been generated
        assert frontmatter['description'] != ""
        assert 'Content that should become' in frontmatter['description']


class TestParseFrontmatter:
    """Tests for frontmatter parsing."""

    def test_parse_valid_frontmatter(self):
        content = """---
title: Test
tags:
  - one
  - two
---

Body content here.
"""
        frontmatter, body = parse_frontmatter(content)
        assert frontmatter['title'] == 'Test'
        assert frontmatter['tags'] == ['one', 'two']
        assert 'Body content here.' in body

    def test_parse_no_frontmatter(self):
        content = "Just some content without frontmatter."
        frontmatter, body = parse_frontmatter(content)
        assert frontmatter == {}
        assert body == content


class TestGenerateDescription:
    """Tests for the generate_description function."""

    def test_generates_from_content(self):
        content = "This is a simple paragraph that should become a description."
        description = generate_description(content)
        assert description == content

    def test_removes_markdown_headers(self):
        content = """# Header One
## Header Two
Actual content here."""
        description = generate_description(content)
        assert 'Header One' not in description
        assert 'Actual content here' in description

    def test_removes_wikilinks(self):
        content = "Check out [[Some Link]] for more info."
        description = generate_description(content)
        assert '[[' not in description
        assert 'Some Link' in description

    def test_truncates_long_content(self):
        content = "A" * 3000
        description = generate_description(content, max_length=100)
        assert len(description) <= 103  # 100 + "..."


class TestNormalizeTags:
    """Tests for tag normalization."""

    def test_merges_and_lowercases_tags(self):
        existing = ['Tag1', 'TAG2']
        inline = ['tag3', 'tag4']
        result = normalize_tags(existing, inline)
        assert result == ['tag1', 'tag2', 'tag3', 'tag4']

    def test_deduplicates_tags(self):
        # Inline tags are already lowercased by extract_inline_tags
        existing = ['Test', 'OTHER']
        inline = ['test']  # Same as 'Test' after lowercasing
        result = normalize_tags(existing, inline)
        assert result == ['other', 'test']

    def test_handles_empty_inputs(self):
        assert normalize_tags([], []) == []
        assert normalize_tags(None, []) == []
        assert normalize_tags([], ['tag']) == ['tag']
