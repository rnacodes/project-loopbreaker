"""Script execution service that wraps existing normalization scripts."""

import asyncio
import os
import sys
from pathlib import Path
from typing import Any, Callable, Dict, Optional

# Add parent directory to path so we can import the existing scripts
scripts_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(scripts_dir))

from ..config import settings
from ..models import JobRequest, ScriptType
from .job_manager import JobManager


async def run_script(
    job_manager: JobManager,
    job_id: str,
    request: JobRequest
) -> None:
    """
    Run a script based on the request parameters.

    This is the main entry point called by the jobs router.
    """
    await job_manager.start_job(job_id)
    await job_manager.add_log(job_id, f"Starting {request.script_type.value} script...")

    try:
        if request.script_type == ScriptType.NORMALIZE_NOTES:
            result = await run_normalize_notes(job_manager, job_id, request)
        elif request.script_type == ScriptType.NORMALIZE_VAULT:
            result = await run_normalize_vault(job_manager, job_id, request)
        else:
            raise ValueError(f"Unknown script type: {request.script_type}")

        await job_manager.complete_job(job_id, result=result)
        await job_manager.add_log(job_id, "Script completed successfully.")

    except Exception as e:
        error_msg = str(e)
        await job_manager.add_log(job_id, f"Error: {error_msg}")
        await job_manager.complete_job(job_id, error=error_msg)


async def run_normalize_notes(
    job_manager: JobManager,
    job_id: str,
    request: JobRequest
) -> Dict[str, Any]:
    """
    Run the normalize_notes.py script logic.

    This reimplements the script logic to enable progress tracking.
    """
    # Import the functions from the existing script
    from normalize_notes import (
        fetch_all_notes,
        get_connection,
        normalize_content,
        normalize_description,
        normalize_source_url,
        normalize_tags,
        update_note,
    )

    database_url = settings.database_url
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")

    await job_manager.add_log(job_id, "Connecting to database...")

    # Run database operations in thread pool to avoid blocking
    loop = asyncio.get_event_loop()

    def db_work():
        conn = get_connection(database_url)
        cursor = conn.cursor(cursor_factory=__import__('psycopg2.extras', fromlist=['RealDictCursor']).RealDictCursor)
        return conn, cursor

    conn, cursor = await loop.run_in_executor(None, db_work)

    try:
        # Fetch all notes
        await job_manager.add_log(job_id, "Fetching notes...")
        notes = await loop.run_in_executor(None, fetch_all_notes, cursor)

        total = len(notes)
        await job_manager.update_progress(job_id, total=total, processed=0)
        await job_manager.add_log(job_id, f"Found {total} notes to process.")

        # Statistics
        stats = {
            "total": total,
            "content_normalized": 0,
            "description_generated": 0,
            "tags_normalized": 0,
            "source_url_generated": 0,
            "unchanged": 0
        }

        for idx, note in enumerate(notes):
            # Check for cancellation
            if job_manager.is_cancelled(job_id):
                await job_manager.add_log(job_id, "Job cancelled by user.")
                raise Exception("Job cancelled")

            note_id = str(note["Id"])
            slug = note["Slug"]
            title = note["Title"]
            vault_name = note["VaultName"]

            await job_manager.update_progress(
                job_id,
                processed=idx,
                current_item=f"{slug} ({idx + 1}/{total})"
            )

            updates = {}

            # Normalize content
            original_content = note["Content"]
            normalized_content = normalize_content(original_content)
            if original_content != normalized_content:
                updates["Content"] = normalized_content
                stats["content_normalized"] += 1

            # Normalize description
            original_desc = note["Description"]
            normalized_desc = normalize_description(original_desc, normalized_content, title)
            if original_desc != normalized_desc:
                updates["Description"] = normalized_desc
                stats["description_generated"] += 1

            # Normalize tags
            original_tags = note["Tags"]
            normalized_tags = normalize_tags(original_tags)
            if set(original_tags or []) != set(normalized_tags):
                updates["Tags"] = normalized_tags
                stats["tags_normalized"] += 1

            # Normalize source_url
            original_url = note["SourceUrl"]
            normalized_url = normalize_source_url(original_url, vault_name, slug)
            if original_url != normalized_url:
                updates["SourceUrl"] = normalized_url
                stats["source_url_generated"] += 1

            # Apply updates
            if updates:
                if request.verbose:
                    await job_manager.add_log(job_id, f"[{slug}] Updating {len(updates)} fields")

                if not request.dry_run:
                    await loop.run_in_executor(
                        None,
                        update_note,
                        cursor,
                        note_id,
                        updates
                    )
            else:
                stats["unchanged"] += 1

        # Commit changes
        if not request.dry_run:
            await loop.run_in_executor(None, conn.commit)
            await job_manager.add_log(job_id, "Changes committed to database.")
        else:
            await job_manager.add_log(job_id, "DRY RUN - No changes made.")

        await job_manager.update_progress(
            job_id,
            processed=total,
            succeeded=total - stats["unchanged"],
            current_item=None
        )

        return stats

    finally:
        cursor.close()
        conn.close()


async def run_normalize_vault(
    job_manager: JobManager,
    job_id: str,
    request: JobRequest
) -> Dict[str, Any]:
    """
    Run the normalize_obsidian_vault.py script logic.

    This reimplements the script logic to enable progress tracking.
    """
    from normalize_obsidian_vault import (
        AIDescriptionGenerator,
        create_backup,
        normalize_file,
        should_ignore,
    )

    if not request.vault_path:
        raise ValueError("vault_path is required for normalize_vault script")

    vault_path = Path(request.vault_path).resolve()

    if not vault_path.exists():
        raise ValueError(f"Vault path does not exist: {vault_path}")

    if not vault_path.is_dir():
        raise ValueError(f"Vault path is not a directory: {vault_path}")

    await job_manager.add_log(job_id, f"Processing vault: {vault_path}")

    # Set up AI generator if requested
    ai_generator = None
    if request.use_ai:
        if not settings.gradient_api_key:
            raise ValueError("GRADIENT_API_KEY environment variable not set")

        await job_manager.add_log(
            job_id,
            f"AI enabled: {settings.gradient_base_url} (model: {settings.ai_model})"
        )
        ai_generator = AIDescriptionGenerator(
            base_url=settings.gradient_base_url,
            api_key=settings.gradient_api_key,
            model=settings.ai_model
        )

    # Create backup if requested
    if request.backup and not request.dry_run:
        await job_manager.add_log(job_id, "Creating backup...")
        loop = asyncio.get_event_loop()
        backup_path = await loop.run_in_executor(
            None,
            create_backup,
            vault_path,
            None
        )
        await job_manager.add_log(job_id, f"Backup created at: {backup_path}")

    # Find all markdown files
    md_files = list(vault_path.rglob("*.md"))
    md_files = [f for f in md_files if not should_ignore(f)]

    total = len(md_files)
    await job_manager.update_progress(job_id, total=total, processed=0)
    await job_manager.add_log(job_id, f"Found {total} markdown files to process.")

    # Statistics
    stats = {
        "total": total,
        "modified": 0,
        "unchanged": 0,
        "errors": 0,
        "tags_updated": 0,
        "titles_added": 0,
        "descriptions_added": 0,
        "ai_descriptions": 0
    }

    loop = asyncio.get_event_loop()

    for idx, filepath in enumerate(md_files):
        # Check for cancellation
        if job_manager.is_cancelled(job_id):
            await job_manager.add_log(job_id, "Job cancelled by user.")
            raise Exception("Job cancelled")

        relative_path = filepath.relative_to(vault_path)
        await job_manager.update_progress(
            job_id,
            processed=idx,
            current_item=f"{relative_path} ({idx + 1}/{total})"
        )

        # Run file normalization in thread pool
        result = await loop.run_in_executor(
            None,
            normalize_file,
            filepath,
            request.dry_run,
            request.verbose,
            ai_generator
        )

        if "error" in result:
            stats["errors"] += 1
            await job_manager.add_log(job_id, f"[ERROR] {relative_path}: {result['error']}")
            continue

        if result["modified"]:
            stats["modified"] += 1

            # Count specific changes
            for change in result["changes"]:
                if change.startswith("tags:"):
                    stats["tags_updated"] += 1
                elif change.startswith("title:"):
                    stats["titles_added"] += 1
                elif change.startswith("description (AI):"):
                    stats["ai_descriptions"] += 1
                    stats["descriptions_added"] += 1
                elif change.startswith("description:"):
                    stats["descriptions_added"] += 1

            if request.verbose:
                await job_manager.add_log(job_id, f"[MODIFIED] {relative_path}")
        else:
            stats["unchanged"] += 1

    await job_manager.update_progress(
        job_id,
        processed=total,
        succeeded=stats["modified"],
        failed=stats["errors"],
        current_item=None
    )

    if request.dry_run:
        await job_manager.add_log(job_id, "DRY RUN - No files were modified.")

    return stats
