"""Job execution endpoints."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request

from ..middleware.auth import verify_api_key
from ..models import JobListResponse, JobRequest, JobResponse, JobStatus
from ..services.script_runner import run_script

router = APIRouter()


def get_job_manager(request: Request):
    """Get job manager from app state."""
    return request.app.state.job_manager


@router.post("", response_model=JobResponse, dependencies=[Depends(verify_api_key)])
@router.post("/", response_model=JobResponse, dependencies=[Depends(verify_api_key)])
async def create_job(
    job_request: JobRequest,
    background_tasks: BackgroundTasks,
    job_manager=Depends(get_job_manager)
) -> JobResponse:
    """
    Start a new script execution job.

    The script runs in the background. Use GET /jobs/{job_id} to check status.
    """
    # Check for already running jobs of the same type
    running_jobs = await job_manager.get_running_jobs(job_request.script_type)
    if running_jobs:
        raise HTTPException(
            status_code=409,
            detail=f"A {job_request.script_type.value} job is already running. "
                   f"Job ID: {running_jobs[0].job_id}"
        )

    # Create the job
    job_id = await job_manager.create_job(job_request.script_type)

    # Schedule background execution
    background_tasks.add_task(run_script, job_manager, job_id, job_request)

    # Return the job (will be in PENDING status)
    job = await job_manager.get_job(job_id)
    return job


@router.get("", response_model=JobListResponse)
@router.get("/", response_model=JobListResponse)
async def list_jobs(
    limit: int = 50,
    job_manager=Depends(get_job_manager)
) -> JobListResponse:
    """
    List all jobs.

    Jobs are sorted by start time (most recent first).
    """
    jobs = await job_manager.get_all_jobs(limit)
    return JobListResponse(jobs=jobs, total=len(jobs))


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    job_manager=Depends(get_job_manager)
) -> JobResponse:
    """Get status and details of a specific job."""
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/{job_id}/cancel", response_model=JobResponse, dependencies=[Depends(verify_api_key)])
async def cancel_job(
    job_id: str,
    job_manager=Depends(get_job_manager)
) -> JobResponse:
    """
    Cancel a running job.

    Only running jobs can be cancelled. The cancellation is cooperative -
    the script checks for cancellation at regular intervals.
    """
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != JobStatus.RUNNING:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel job with status '{job.status.value}'. "
                   "Only running jobs can be cancelled."
        )

    success = await job_manager.cancel_job(job_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to cancel job")

    # Return updated job
    return await job_manager.get_job(job_id)
