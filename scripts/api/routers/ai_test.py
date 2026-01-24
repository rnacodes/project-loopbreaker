"""
Router for testing AI description generation on single files.

Provides endpoints for testing and debugging AI-generated descriptions
with configurable parameters.
"""

import re
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import settings

try:
    import requests
except ImportError:
    requests = None


router = APIRouter()


class SingleFileRequest(BaseModel):
    """Request to generate description for a single file."""
    file_path: str
    max_tokens: int = 3000
    temperature: float = 0.3
    show_reasoning: bool = True


class SingleFileResponse(BaseModel):
    """Response from single file description generation."""
    success: bool
    file_path: str
    title: str
    content_length: int
    description: Optional[str] = None
    reasoning: Optional[str] = None
    raw_response: Optional[dict] = None
    error: Optional[str] = None
    tokens_used: Optional[dict] = None


class DirectPromptRequest(BaseModel):
    """Request to test AI with a direct prompt."""
    prompt: str
    max_tokens: int = 3000
    temperature: float = 0.3


class DirectPromptResponse(BaseModel):
    """Response from direct prompt test."""
    success: bool
    content: Optional[str] = None
    reasoning: Optional[str] = None
    raw_response: Optional[dict] = None
    error: Optional[str] = None
    tokens_used: Optional[dict] = None


def parse_frontmatter(content: str) -> tuple:
    """Parse frontmatter from markdown content."""
    import re
    pattern = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)
    match = pattern.match(content)
    if match:
        try:
            import yaml
            frontmatter = yaml.safe_load(match.group(1)) or {}
            body = content[match.end():]
            return frontmatter, body
        except:
            return {}, content
    return {}, content


@router.post("/single-file", response_model=SingleFileResponse)
async def generate_single_file_description(request: SingleFileRequest):
    """
    Generate an AI description for a single markdown file.

    Useful for testing and debugging AI generation on specific files,
    especially long notes that might need more tokens.
    """
    if not settings.gradient_api_key:
        raise HTTPException(
            status_code=500,
            detail="GRADIENT_API_KEY not configured"
        )

    if requests is None:
        raise HTTPException(
            status_code=500,
            detail="requests library not installed"
        )

    # Read the file
    filepath = Path(request.file_path)
    if not filepath.exists():
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {request.file_path}"
        )

    if not filepath.suffix.lower() == '.md':
        raise HTTPException(
            status_code=400,
            detail="File must be a markdown file (.md)"
        )

    try:
        content = filepath.read_text(encoding='utf-8')
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read file: {e}"
        )

    # Parse frontmatter and extract title
    frontmatter, body = parse_frontmatter(content)
    title = frontmatter.get('title') or filepath.stem.replace('-', ' ').replace('_', ' ').title()

    if not body.strip():
        return SingleFileResponse(
            success=False,
            file_path=str(filepath),
            title=title,
            content_length=0,
            error="File has no content after frontmatter"
        )

    # Build prompt
    prompt = f"""Write a 1-2 sentence summary of this note. Be concise and direct. Output only the summary, nothing else.

Title: {title}

Content:
{body[:4000]}"""  # Allow more content for single-file testing

    # Call AI API
    base_url = settings.gradient_base_url.rstrip('/')

    try:
        response = requests.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.gradient_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": settings.ai_model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": request.max_tokens,
                "temperature": request.temperature
            },
            timeout=120  # Longer timeout for high token counts
        )

        if response.status_code != 200:
            return SingleFileResponse(
                success=False,
                file_path=str(filepath),
                title=title,
                content_length=len(body),
                error=f"API returned status {response.status_code}: {response.text[:500]}"
            )

        result = response.json()
        message = result.get('choices', [{}])[0].get('message', {})
        description = message.get('content')
        reasoning = message.get('reasoning_content')
        usage = result.get('usage', {})

        # If content is empty but we have reasoning, try to extract description
        if not description and reasoning:
            quoted = re.findall(r'"([^"]{20,200})"', reasoning)
            if quoted:
                description = max(quoted, key=len)

        return SingleFileResponse(
            success=bool(description),
            file_path=str(filepath),
            title=title,
            content_length=len(body),
            description=description,
            reasoning=reasoning if request.show_reasoning else None,
            raw_response=result if request.show_reasoning else None,
            tokens_used={
                "prompt": usage.get('prompt_tokens'),
                "completion": usage.get('completion_tokens'),
                "total": usage.get('total_tokens')
            }
        )

    except requests.exceptions.Timeout:
        return SingleFileResponse(
            success=False,
            file_path=str(filepath),
            title=title,
            content_length=len(body),
            error="Request timed out"
        )
    except Exception as e:
        return SingleFileResponse(
            success=False,
            file_path=str(filepath),
            title=title,
            content_length=len(body),
            error=str(e)
        )


@router.post("/direct-prompt", response_model=DirectPromptResponse)
async def execute_direct_prompt(request: DirectPromptRequest):
    """
    Test the AI API with a direct prompt.

    Useful for debugging API connectivity and testing different prompts.
    """
    if not settings.gradient_api_key:
        raise HTTPException(
            status_code=500,
            detail="GRADIENT_API_KEY not configured"
        )

    if requests is None:
        raise HTTPException(
            status_code=500,
            detail="requests library not installed"
        )

    base_url = settings.gradient_base_url.rstrip('/')

    try:
        response = requests.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.gradient_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": settings.ai_model,
                "messages": [
                    {"role": "user", "content": request.prompt}
                ],
                "max_tokens": request.max_tokens,
                "temperature": request.temperature
            },
            timeout=120
        )

        if response.status_code != 200:
            return DirectPromptResponse(
                success=False,
                error=f"API returned status {response.status_code}: {response.text[:500]}"
            )

        result = response.json()
        message = result.get('choices', [{}])[0].get('message', {})
        usage = result.get('usage', {})

        return DirectPromptResponse(
            success=bool(message.get('content')),
            content=message.get('content'),
            reasoning=message.get('reasoning_content'),
            raw_response=result,
            tokens_used={
                "prompt": usage.get('prompt_tokens'),
                "completion": usage.get('completion_tokens'),
                "total": usage.get('total_tokens')
            }
        )

    except requests.exceptions.Timeout:
        return DirectPromptResponse(
            success=False,
            error="Request timed out"
        )
    except Exception as e:
        return DirectPromptResponse(
            success=False,
            error=str(e)
        )


@router.get("/config")
async def get_ai_config():
    """Get current AI configuration (without exposing API key)."""
    return {
        "base_url": settings.gradient_base_url,
        "model": settings.ai_model,
        "api_key_configured": bool(settings.gradient_api_key)
    }
