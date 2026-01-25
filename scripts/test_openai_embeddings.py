#!/usr/bin/env python3
"""
Test script to verify OpenAI embeddings functionality.
Run this to troubleshoot embedding generation issues.

Usage:
    python test_openai_embeddings.py
    python test_openai_embeddings.py --model "text-embedding-3-small"
    python test_openai_embeddings.py --dimensions 512
    python test_openai_embeddings.py --text "Custom text to embed"
"""

import argparse
import json
import os

import requests


def test_openai_embeddings(model_override: str = None, dimensions_override: int = None, custom_text: str = None):
    # Get settings from environment
    api_key = os.environ.get("OPENAI_API_KEY")

    # Model and dimensions configuration
    model = model_override or os.environ.get("OPENAI_EMBEDDING_MODEL") or "text-embedding-3-large"
    dimensions_str = os.environ.get("OPENAI_DIMENSIONS", "1024")
    dimensions = dimensions_override or int(dimensions_str)

    print("=" * 60)
    print("OpenAI Embeddings Test")
    print("=" * 60)
    print()

    # Check environment variables
    print("1. Environment Variables:")
    print(f"   OPENAI_API_KEY: {'[SET - ' + api_key[:8] + '...]' if api_key else '[NOT SET]'}")
    print(f"   OPENAI_EMBEDDING_MODEL: {os.environ.get('OPENAI_EMBEDDING_MODEL', '[NOT SET]')}")
    print(f"   OPENAI_DIMENSIONS: {os.environ.get('OPENAI_DIMENSIONS', '[NOT SET]')}")
    print(f"   -> Using model: {model}")
    print(f"   -> Using dimensions: {dimensions}")
    print()

    if not api_key:
        print("ERROR: OPENAI_API_KEY is not set!")
        print("Set it with: $env:OPENAI_API_KEY = 'your_api_key'")
        return False

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    embeddings_url = "https://api.openai.com/v1/embeddings"

    # Test 2: Basic embedding test
    print(f"2. Testing Embedding Generation with model '{model}' ({dimensions}D)...")
    print(f"   Full URL: {embeddings_url}")

    test_text = custom_text or "This is a test sentence for generating embeddings."

    test_payload = {
        "model": model,
        "input": [test_text],
        "dimensions": dimensions
    }

    print(f"   Test text: {test_text[:100]}{'...' if len(test_text) > 100 else ''}")
    print(f"   Request payload: {json.dumps(test_payload, indent=6)}")

    basic_test_passed = False
    actual_dimensions = None

    try:
        response = requests.post(
            embeddings_url,
            headers=headers,
            json=test_payload,
            timeout=30
        )

        print(f"   Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            data = result.get('data', [])
            usage = result.get('usage', {})

            if data and len(data) > 0:
                embedding = data[0].get('embedding', [])
                actual_dimensions = len(embedding)

                print(f"   [OK] Embedding generated successfully!")
                print(f"   Requested dimensions: {dimensions}")
                print(f"   Actual dimensions: {actual_dimensions}")
                print(f"   First 5 values: {embedding[:5]}")
                print(f"   Tokens used: {usage.get('total_tokens', 'N/A')}")

                if actual_dimensions == dimensions:
                    print(f"   [OK] Dimensions match!")
                    basic_test_passed = True
                else:
                    print(f"   [WARN] Dimensions mismatch! Expected {dimensions}, got {actual_dimensions}")
                    basic_test_passed = True  # Still works, just different dimensions
            else:
                print(f"   [FAIL] No embedding data in response")
                print(f"   Full response: {response.text[:500]}")
        else:
            print(f"   [FAIL] API returned error")
            print(f"   Response: {response.text[:500]}")

            if response.status_code == 401:
                print()
                print("   ERROR: Authentication failed!")
                print("   Check your OPENAI_API_KEY is correct.")
            elif response.status_code == 400:
                print()
                print("   ERROR: Bad request - check model name and dimensions.")

    except requests.exceptions.Timeout:
        print("   [FAIL] Request timed out")
    except Exception as e:
        print(f"   [FAIL] Error: {e}")
    print()

    # Test 3: Batch embedding test
    print("3. Testing Batch Embedding Generation...")

    batch_texts = [
        "First test sentence about programming.",
        "Second test sentence about media libraries.",
        "Third test sentence about machine learning."
    ]

    batch_payload = {
        "model": model,
        "input": batch_texts,
        "dimensions": dimensions
    }

    print(f"   Testing with {len(batch_texts)} texts...")

    try:
        response = requests.post(
            embeddings_url,
            headers=headers,
            json=batch_payload,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            data = result.get('data', [])
            usage = result.get('usage', {})

            if len(data) == len(batch_texts):
                print(f"   [OK] Batch embedding successful!")
                print(f"   Generated {len(data)} embeddings")
                print(f"   Total tokens used: {usage.get('total_tokens', 'N/A')}")
                for i, item in enumerate(data):
                    emb = item.get('embedding', [])
                    print(f"     Text {i+1}: {len(emb)} dimensions")
            else:
                print(f"   [PARTIAL] Expected {len(batch_texts)} embeddings, got {len(data)}")
        else:
            print(f"   [FAIL] Batch request failed: {response.status_code}")
            print(f"   Response: {response.text[:300]}")

    except Exception as e:
        print(f"   [FAIL] Batch test error: {e}")
    print()

    # Test 4: Test with media-like content
    print("4. Testing with Media Library Content...")
    print("=" * 60)

    media_samples = [
        {
            "type": "Podcast",
            "text": "The Tim Ferriss Show - Episode about productivity hacks and morning routines with insights from top performers across various industries."
        },
        {
            "type": "Book",
            "text": "Atomic Habits by James Clear - A comprehensive guide to building good habits and breaking bad ones through small, incremental changes."
        },
        {
            "type": "Movie",
            "text": "Inception (2010) - A mind-bending thriller about dreams within dreams, directed by Christopher Nolan starring Leonardo DiCaprio."
        },
        {
            "type": "YouTube",
            "text": "How to Build a Personal Knowledge Management System - Tutorial on setting up Obsidian for note-taking and linking ideas."
        }
    ]

    for sample in media_samples:
        try:
            response = requests.post(
                embeddings_url,
                headers=headers,
                json={
                    "model": model,
                    "input": [sample["text"]],
                    "dimensions": dimensions
                },
                timeout=15
            )

            if response.status_code == 200:
                result = response.json()
                data = result.get('data', [])
                if data:
                    dims = len(data[0].get('embedding', []))
                    print(f"   {sample['type']}: [OK] {dims} dimensions")
                else:
                    print(f"   {sample['type']}: [FAIL] No embedding returned")
            else:
                print(f"   {sample['type']}: [FAIL] Status {response.status_code}")
        except Exception as e:
            print(f"   {sample['type']}: [ERROR] {e}")
    print()

    # Test 5: Compare different dimension sizes
    print("5. Testing Different Dimension Sizes...")
    print("=" * 60)

    dimension_tests = [256, 512, 1024, 1536, 3072]

    for test_dim in dimension_tests:
        try:
            response = requests.post(
                embeddings_url,
                headers=headers,
                json={
                    "model": model,
                    "input": ["Test embedding dimensions"],
                    "dimensions": test_dim
                },
                timeout=15
            )

            if response.status_code == 200:
                result = response.json()
                data = result.get('data', [])
                if data:
                    actual = len(data[0].get('embedding', []))
                    status = "[OK]" if actual == test_dim else f"[WARN: got {actual}]"
                    print(f"   {test_dim}D: {status}")
                else:
                    print(f"   {test_dim}D: [FAIL] No data")
            else:
                error_msg = response.json().get('error', {}).get('message', response.text[:100])
                print(f"   {test_dim}D: [FAIL] {error_msg[:50]}")
        except Exception as e:
            print(f"   {test_dim}D: [ERROR] {e}")
    print()

    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)

    if basic_test_passed:
        print(f"[OK] OpenAI embedding generation works!")
        print(f"     Model: {model}")
        print(f"     Dimensions: {actual_dimensions}")
        print()
        print("Your .NET backend should work with these settings:")
        print(f"     OPENAI_API_KEY=<your key>")
        print(f"     OPENAI_EMBEDDING_MODEL={model}")
        print(f"     OPENAI_DIMENSIONS={dimensions}")
    else:
        print("[FAIL] Embedding generation failed!")
        print()
        print("Troubleshooting steps:")
        print("  1. Verify your OPENAI_API_KEY is correct")
        print("  2. Check you have billing set up on your OpenAI account")
        print("  3. Verify the model name is correct")
        print("  4. Try a different dimensions value")

    return basic_test_passed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test OpenAI embeddings")
    parser.add_argument('--model', type=str, help='Embedding model to test (e.g., text-embedding-3-large)')
    parser.add_argument('--dimensions', type=int, help='Embedding dimensions (e.g., 1024)')
    parser.add_argument('--text', type=str, help='Custom text to embed')
    args = parser.parse_args()

    test_openai_embeddings(args.model, args.dimensions, args.text)
