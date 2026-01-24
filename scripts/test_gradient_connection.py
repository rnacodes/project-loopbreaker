#!/usr/bin/env python3
"""
Test script to verify Gradient AI / DigitalOcean AI connection.
Run this to troubleshoot AI description generation issues.

Usage:
    python test_gradient_connection.py
    python test_gradient_connection.py --file "path/to/note.md"
"""

import argparse
import json
import os
import re
from pathlib import Path

import requests


def test_gradient_connection(test_file: str = None):
    # Get settings from environment - check BOTH naming conventions
    api_key = os.environ.get("GRADIENT_API_KEY")
    base_url = os.environ.get("GRADIENT_BASE_URL", "https://api.gradient.ai/v1")

    # Check both AI_MODEL (Python script) and GRADIENT_GENERATION_MODEL (.NET backend)
    model = os.environ.get("AI_MODEL") or os.environ.get("GRADIENT_GENERATION_MODEL") or "llama-3.1-8b-instruct"

    print("=" * 60)
    print("DigitalOcean / Gradient AI Connection Test")
    print("=" * 60)
    print()

    # Check environment variables
    print("1. Environment Variables:")
    print(f"   GRADIENT_API_KEY: {'[SET - ' + api_key[:8] + '...]' if api_key else '[NOT SET]'}")
    print(f"   GRADIENT_BASE_URL: {base_url}")
    print(f"   AI_MODEL: {os.environ.get('AI_MODEL', '[NOT SET]')}")
    print(f"   GRADIENT_GENERATION_MODEL: {os.environ.get('GRADIENT_GENERATION_MODEL', '[NOT SET]')}")
    print(f"   -> Using model: {model}")
    print()

    if not api_key:
        print("ERROR: GRADIENT_API_KEY is not set!")
        print("Set it with: $env:GRADIENT_API_KEY = 'your_api_key'")
        return False

    # Test API connection
    print("2. Testing API Connection...")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Try to list available models first
    print("   Checking available models...")
    try:
        models_response = requests.get(
            f"{base_url}/models",
            headers=headers,
            timeout=10
        )
        if models_response.status_code == 200:
            models_data = models_response.json()
            print(f"   Available models: {json.dumps(models_data, indent=6)}")
        else:
            print(f"   Models endpoint returned: {models_response.status_code}")
            print(f"   Response: {models_response.text[:500]}")
    except Exception as e:
        print(f"   Could not list models: {e}")

    print()

    # Test chat completion with the configured model
    print(f"3. Testing Chat Completion with model '{model}'...")

    # Ensure base_url doesn't have trailing slash for proper URL join
    base_url_clean = base_url.rstrip('/')
    chat_url = f"{base_url_clean}/chat/completions"
    print(f"   Full URL: {chat_url}")

    test_payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": "Say 'hello' in one word."}
        ],
        # Higher token limit for reasoning models that need chain-of-thought
        "max_tokens": 500,
        "temperature": 0.1
    }

    print(f"   Request payload: {json.dumps(test_payload, indent=6)}")

    basic_test_passed = False
    try:
        response = requests.post(
            chat_url,
            headers=headers,
            json=test_payload,
            timeout=30
        )

        print(f"   Status Code: {response.status_code}")
        print(f"   Full Response: {response.text[:1000]}")

        if response.status_code == 200:
            result = response.json()
            message = result.get('choices', [{}])[0].get('message', {})
            content = message.get('content')
            reasoning = message.get('reasoning_content')

            print(f"   Extracted content: {repr(content)}")
            if reasoning:
                print(f"   Reasoning content: {reasoning[:200]}...")

            if content:
                print()
                print("   [OK] Basic test passed - API returned content")
                basic_test_passed = True
            elif reasoning:
                print()
                print("   [PARTIAL] API returned reasoning but no final content")
                print("   This is a reasoning model - may need to extract from reasoning_content")
                # Try to extract quoted text from reasoning
                quoted = re.findall(r'"([^"]{5,100})"', reasoning)
                if quoted:
                    print(f"   Found quoted text in reasoning: {quoted}")
            else:
                print()
                print("   [FAIL] API returned 200 but content is empty/null!")
                print("   This is the issue causing fallback to text extraction.")
        else:
            print(f"   Error Response: {response.text[:500]}")
            print()

            if response.status_code == 404:
                print("ERROR: Model not found!")
                print(f"The model '{model}' does not exist or is not available.")
            elif response.status_code == 401:
                print("ERROR: Authentication failed!")
            elif response.status_code == 403:
                print("ERROR: Access forbidden!")

    except requests.exceptions.Timeout:
        print("   ERROR: Request timed out")
    except requests.exceptions.RequestException as e:
        print(f"   ERROR: Request failed - {e}")

    # Test 4: Description generation prompt (the actual use case)
    print()
    print("=" * 60)
    print("4. Testing Description Generation (actual use case)...")
    print("=" * 60)

    # Get test content
    if test_file:
        filepath = Path(test_file)
        if filepath.exists():
            note_content = filepath.read_text(encoding='utf-8')
            note_title = filepath.stem.replace('-', ' ').replace('_', ' ').title()
            print(f"   Using file: {test_file}")
        else:
            print(f"   File not found: {test_file}")
            note_content = None
    else:
        note_title = "Why I'm Wrong About Everything"
        note_content = """- Tags: [[Principles]] [[Life Advice]] [[article]] [[Mark Manson]]
- [From Mark Manson](https://markmanson.net/wrong-about-everything)
- **Personal summary: stop worrying about getting everything right the first time. Instead, focus on iterating and optimizing.**
- Knowledge is an eternal iterative process. We don't go from "wrong" to "right" once we discover the capital-T Truth.
- Getting somewhere great in life has less to do with the ability to be right all the time and more to do with the ability to be wrong all the time."""
        print("   Using sample content (pass --file to test with your own)")

    if note_content:
        print(f"   Title: {note_title}")
        print(f"   Content length: {len(note_content)} chars")
        print(f"   Content preview: {note_content[:150]}...")
        print()

        # This is the exact prompt used by normalize_obsidian_vault.py
        prompt = f"""Write a 1-2 sentence summary of this note. Be concise and direct. Output only the summary, nothing else.

Title: {note_title}

Content:
{note_content[:2000]}"""

        desc_payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            # High token limit for reasoning models with verbose chain-of-thought
            "max_tokens": 3000,
            "temperature": 0.3
        }

        print(f"   Prompt length: {len(prompt)} chars")

        try:
            response = requests.post(
                chat_url,
                headers=headers,
                json=desc_payload,
                timeout=30
            )

            print(f"   Status Code: {response.status_code}")
            print(f"   Full Response: {response.text[:1500]}")

            if response.status_code == 200:
                result = response.json()
                message = result.get('choices', [{}])[0].get('message', {})
                content = message.get('content')
                reasoning = message.get('reasoning_content')

                print()
                print(f"   Generated description: {repr(content)}")
                if reasoning:
                    print(f"   Reasoning: {reasoning[:300]}...")

                if content:
                    print()
                    print("   [OK] Description generation works!")
                elif reasoning:
                    print()
                    # Try to extract from reasoning
                    quoted = re.findall(r'"([^"]{20,150})"', reasoning)
                    if quoted:
                        best = max(quoted, key=len)
                        print(f"   [PARTIAL] Extracted from reasoning: {best}")
                    else:
                        print("   [PARTIAL] Has reasoning but couldn't extract description")
                else:
                    print()
                    print("   [FAIL] API returned empty content for description!")

        except Exception as e:
            print(f"   ERROR: {e}")

    # Test 5: Try alternative models
    print()
    print("=" * 60)
    print("5. Testing Alternative Models...")
    print("=" * 60)

    alt_models = [
        "llama-3.1-8b-instruct",
        "llama-3-8b-instruct",
        "gpt-3.5-turbo",
        "mistral-7b-instruct",
    ]

    for alt_model in alt_models:
        if alt_model == model:
            continue  # Skip already tested model

        try:
            response = requests.post(
                chat_url,
                headers=headers,
                json={
                    "model": alt_model,
                    "messages": [{"role": "user", "content": "Say hello"}],
                    "max_tokens": 20
                },
                timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                content = result.get('choices', [{}])[0].get('message', {}).get('content')
                if content:
                    print(f"   {alt_model}: [OK] Works! Response: {content[:30]}")
                else:
                    print(f"   {alt_model}: [PARTIAL] Status 200 but empty content")
            else:
                print(f"   {alt_model}: [FAIL] Status {response.status_code}")
        except Exception as e:
            print(f"   {alt_model}: [ERROR] {e}")

    # Summary
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)

    if basic_test_passed:
        print("[OK] Basic API connection works")
    else:
        print("[FAIL] API is returning empty content")
        print()
        print("Possible causes:")
        print("  1. Model name might be incorrect for this API")
        print("  2. API might be rate limiting or overloaded")
        print("  3. API key might not have access to this model")
        print("  4. The model might require different parameters")
        print()
        print("Try:")
        print("  1. Check your DigitalOcean AI dashboard for correct model names")
        print("  2. Set AI_MODEL env var to a different model")
        print("  3. Contact DigitalOcean support if the issue persists")

    return basic_test_passed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test AI API connection")
    parser.add_argument('--file', type=str, help='Path to an Obsidian markdown file to test with')
    args = parser.parse_args()

    test_gradient_connection(args.file)
