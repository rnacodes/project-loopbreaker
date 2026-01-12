"""Job management service for tracking script execution."""

import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from ..models import JobProgress, JobResponse, JobStatus, ScriptType


class JobManager:
    """
    Manages script execution jobs with in-memory storage.

    Tracks job state, progress, and results for concurrent script executions.
    """

    def __init__(self, max_jobs_history: int = 100):
        self._jobs: Dict[str, JobResponse] = {}
        self._lock = asyncio.Lock()
        self._max_jobs_history = max_jobs_history
        self._cancellation_flags: Dict[str, bool] = {}

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

    async def add_log(self, job_id: str, message: str) -> None:
        """Add a log message to a job."""
        async with self._lock:
            if job_id in self._jobs:
                # Keep only last 100 log entries
                if len(self._jobs[job_id].logs) >= 100:
                    self._jobs[job_id].logs = self._jobs[job_id].logs[-99:]
                self._jobs[job_id].logs.append(message)

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
        # Mark all running jobs as failed
        async with self._lock:
            for job_id, job in self._jobs.items():
                if job.status == JobStatus.RUNNING:
                    job.status = JobStatus.FAILED
                    job.error_message = "Service shutdown"
                    job.completed_at = datetime.utcnow()
