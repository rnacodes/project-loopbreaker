"""Job management service for tracking script execution."""

import asyncio
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from ..models import JobProgress, JobResponse, JobStatus, ScriptType


def _serialize_datetime(obj):
    """JSON serializer for datetime objects."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def _deserialize_job(data: dict) -> JobResponse:
    """Deserialize a job from JSON data."""
    # Convert string dates back to datetime
    started_at = None
    if data.get('started_at'):
        started_at = datetime.fromisoformat(data['started_at'])

    completed_at = None
    if data.get('completed_at'):
        completed_at = datetime.fromisoformat(data['completed_at'])

    # Convert status string to enum
    status = JobStatus(data['status'])

    # Convert script_type string to enum
    script_type = ScriptType(data['script_type'])

    # Build progress object
    progress_data = data.get('progress', {})
    progress = JobProgress(
        total=progress_data.get('total', 0),
        processed=progress_data.get('processed', 0),
        succeeded=progress_data.get('succeeded', 0),
        failed=progress_data.get('failed', 0),
        current_item=progress_data.get('current_item')
    )

    return JobResponse(
        job_id=data['job_id'],
        script_type=script_type,
        status=status,
        progress=progress,
        started_at=started_at,
        completed_at=completed_at,
        logs=data.get('logs', []),
        result=data.get('result'),
        error_message=data.get('error_message')
    )


class JobManager:
    """
    Manages script execution jobs with file-based persistence.

    Tracks job state, progress, and results for concurrent script executions.
    Jobs are persisted to JSON files in the logs directory.
    """

    def __init__(self, max_jobs_history: int = 100, logs_dir: Optional[Path] = None):
        self._jobs: Dict[str, JobResponse] = {}
        self._lock = asyncio.Lock()
        self._max_jobs_history = max_jobs_history
        self._cancellation_flags: Dict[str, bool] = {}

        # Set up logs directory
        if logs_dir:
            self._logs_dir = Path(logs_dir)
        else:
            # Default to scripts/logs directory
            self._logs_dir = Path(__file__).parent.parent.parent / "logs"

        self._logs_dir.mkdir(parents=True, exist_ok=True)

        # Load existing jobs from log files
        self._load_jobs_from_files()

    def _get_job_file_path(self, job_id: str, started_at: Optional[datetime] = None) -> Path:
        """Get the file path for a job's log file."""
        # Use date prefix for better organization
        if started_at:
            date_prefix = started_at.strftime("%Y-%m-%d")
        else:
            date_prefix = datetime.utcnow().strftime("%Y-%m-%d")
        return self._logs_dir / f"{date_prefix}_{job_id}.json"

    def _save_job_to_file(self, job: JobResponse) -> None:
        """Save a job to its log file."""
        try:
            file_path = self._get_job_file_path(job.job_id, job.started_at)
            job_data = {
                'job_id': job.job_id,
                'script_type': job.script_type.value,
                'status': job.status.value,
                'progress': {
                    'total': job.progress.total,
                    'processed': job.progress.processed,
                    'succeeded': job.progress.succeeded,
                    'failed': job.progress.failed,
                    'current_item': job.progress.current_item
                },
                'started_at': job.started_at,
                'completed_at': job.completed_at,
                'logs': job.logs,
                'result': job.result,
                'error_message': job.error_message
            }
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(job_data, f, indent=2, default=_serialize_datetime)
        except Exception as e:
            print(f"Warning: Failed to save job {job.job_id} to file: {e}")

    def _load_jobs_from_files(self) -> None:
        """Load existing jobs from log files on startup."""
        try:
            log_files = list(self._logs_dir.glob("*.json"))
            # Sort by modification time, most recent first
            log_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)

            # Only load the most recent jobs up to max_jobs_history
            for log_file in log_files[:self._max_jobs_history]:
                try:
                    with open(log_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        job = _deserialize_job(data)
                        self._jobs[job.job_id] = job
                except Exception as e:
                    print(f"Warning: Failed to load job from {log_file}: {e}")

            print(f"Loaded {len(self._jobs)} jobs from log files")
        except Exception as e:
            print(f"Warning: Failed to load jobs from files: {e}")

    async def create_job(self, script_type: ScriptType, **kwargs) -> str:
        """
        Create a new job and return its ID.

        Args:
            script_type: Type of script to run
            **kwargs: Additional job parameters

        Returns:
            The job ID
        """
        job_id = str(uuid.uuid4())

        async with self._lock:
            # Clean up old jobs if we have too many
            await self._cleanup_old_jobs()

            self._jobs[job_id] = JobResponse(
                job_id=job_id,
                script_type=script_type,
                status=JobStatus.PENDING,
                progress=JobProgress(),
                started_at=None,
                completed_at=None,
                logs=[]
            )
            self._cancellation_flags[job_id] = False
            self._save_job_to_file(self._jobs[job_id])

        return job_id

    async def get_job(self, job_id: str) -> Optional[JobResponse]:
        """Get a job by ID."""
        return self._jobs.get(job_id)

    async def get_all_jobs(self, limit: int = 50) -> List[JobResponse]:
        """
        Get all jobs, sorted by start time (most recent first).

        Args:
            limit: Maximum number of jobs to return
        """
        jobs = list(self._jobs.values())
        # Sort by started_at descending (None values go to end)
        jobs.sort(
            key=lambda j: j.started_at or datetime.min,
            reverse=True
        )
        return jobs[:limit]

    async def get_running_jobs(self, script_type: Optional[ScriptType] = None) -> List[JobResponse]:
        """Get all currently running jobs, optionally filtered by script type."""
        running = [
            job for job in self._jobs.values()
            if job.status == JobStatus.RUNNING
        ]
        if script_type:
            running = [job for job in running if job.script_type == script_type]
        return running

    async def start_job(self, job_id: str) -> None:
        """Mark a job as started."""
        async with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].status = JobStatus.RUNNING
                self._jobs[job_id].started_at = datetime.utcnow()
                self._save_job_to_file(self._jobs[job_id])

    async def update_progress(
        self,
        job_id: str,
        total: Optional[int] = None,
        processed: Optional[int] = None,
        succeeded: Optional[int] = None,
        failed: Optional[int] = None,
        current_item: Optional[str] = None
    ) -> None:
        """Update job progress."""
        async with self._lock:
            if job_id in self._jobs:
                progress = self._jobs[job_id].progress
                if total is not None:
                    progress.total = total
                if processed is not None:
                    progress.processed = processed
                if succeeded is not None:
                    progress.succeeded = succeeded
                if failed is not None:
                    progress.failed = failed
                if current_item is not None:
                    progress.current_item = current_item

                # Save to file periodically (every 10 items) to reduce I/O
                if processed is not None and (processed % 10 == 0 or processed == progress.total):
                    self._save_job_to_file(self._jobs[job_id])

    async def add_log(self, job_id: str, message: str) -> None:
        """Add a log message to a job."""
        async with self._lock:
            if job_id in self._jobs:
                # Keep only last 100 log entries in memory
                if len(self._jobs[job_id].logs) >= 100:
                    self._jobs[job_id].logs = self._jobs[job_id].logs[-99:]
                self._jobs[job_id].logs.append(message)

                # Save to file periodically (every 5 logs)
                if len(self._jobs[job_id].logs) % 5 == 0:
                    self._save_job_to_file(self._jobs[job_id])

    async def complete_job(
        self,
        job_id: str,
        result: Optional[Dict] = None,
        error: Optional[str] = None
    ) -> None:
        """
        Mark a job as completed (success or failure).

        Args:
            job_id: Job ID
            result: Result data if successful
            error: Error message if failed
        """
        async with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].completed_at = datetime.utcnow()

                if error:
                    self._jobs[job_id].status = JobStatus.FAILED
                    self._jobs[job_id].error_message = error
                else:
                    self._jobs[job_id].status = JobStatus.COMPLETED
                    self._jobs[job_id].result = result

                # Clear cancellation flag
                self._cancellation_flags.pop(job_id, None)

                # Save final state to file
                self._save_job_to_file(self._jobs[job_id])

    async def cancel_job(self, job_id: str) -> bool:
        """
        Request cancellation of a running job.

        Returns True if cancellation was requested, False if job not found or not running.
        """
        async with self._lock:
            if job_id not in self._jobs:
                return False

            job = self._jobs[job_id]
            if job.status != JobStatus.RUNNING:
                return False

            self._cancellation_flags[job_id] = True
            job.status = JobStatus.CANCELLED
            job.completed_at = datetime.utcnow()
            self._save_job_to_file(job)
            return True

    def is_cancelled(self, job_id: str) -> bool:
        """Check if a job has been cancelled."""
        return self._cancellation_flags.get(job_id, False)

    async def _cleanup_old_jobs(self) -> None:
        """Remove oldest completed jobs if we exceed the max history."""
        if len(self._jobs) < self._max_jobs_history:
            return

        # Get completed jobs sorted by completion time
        completed = [
            (job_id, job) for job_id, job in self._jobs.items()
            if job.status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED)
        ]
        completed.sort(key=lambda x: x[1].completed_at or datetime.min)

        # Remove oldest completed jobs
        jobs_to_remove = len(self._jobs) - self._max_jobs_history + 10
        for job_id, _ in completed[:jobs_to_remove]:
            del self._jobs[job_id]
            self._cancellation_flags.pop(job_id, None)

    async def shutdown(self) -> None:
        """Cleanup on shutdown."""
        # Mark all running jobs as failed and save to files
        async with self._lock:
            for job_id, job in self._jobs.items():
                if job.status == JobStatus.RUNNING:
                    job.status = JobStatus.FAILED
                    job.error_message = "Service shutdown"
                    job.completed_at = datetime.utcnow()
                    self._save_job_to_file(job)
