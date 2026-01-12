"""Pydantic models for request/response handling."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    """Status of a script execution job."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ScriptType(str, Enum):
    """Available script types."""
    NORMALIZE_NOTES = "normalize_notes"
    NORMALIZE_VAULT = "normalize_vault"


class JobProgress(BaseModel):
    """Progress tracking for a running job."""
    total: int = 0
    processed: int = 0
    succeeded: int = 0
    failed: int = 0
    current_item: Optional[str] = None


class JobRequest(BaseModel):
    """Request to start a new script job."""
    script_type: ScriptType
    dry_run: bool = Field(default=False, description="Preview changes without making them")
    verbose: bool = Field(default=False, description="Enable verbose output")

    # Vault normalization specific options
    vault_path: Optional[str] = Field(default=None, description="Path to Obsidian vault (for normalize_vault)")
    use_ai: bool = Field(default=False, description="Use AI to generate descriptions")
    backup: bool = Field(default=False, description="Create backup before changes")


class JobResponse(BaseModel):
    """Response containing job status and details."""
    job_id: str
    script_type: ScriptType
    status: JobStatus
    progress: JobProgress = Field(default_factory=JobProgress)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    logs: List[str] = Field(default_factory=list)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class JobListResponse(BaseModel):
    """Response containing list of jobs."""
    jobs: List[JobResponse]
    total: int


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str = "script_runner"
    version: str = "1.0.0"
    database_connected: bool = False
