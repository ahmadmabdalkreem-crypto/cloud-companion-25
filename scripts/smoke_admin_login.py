#!/usr/bin/env python3
"""Smoke test: admin login accepts the configured credentials and rejects wrong ones.

Usage:
    BASE_URL=https://<your-app>.lovable.app python3 scripts/smoke_admin_login.py

Environment:
    BASE_URL         target origin (default http://localhost:8080)
    ADMIN_USERNAME   the configured admin username (secret)
    ADMIN_PASSWORD   the configured admin password (secret)

Exits 0 when both cases pass, 1 otherwise. Credentials are never printed.
"""

import asyncio
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080").rstrip("/")
USERNAME = os.environ.get("ADMIN_USERNAME")
PASSWORD = os.environ.get("ADMIN_PASSWORD")
SHOTS = Path(os.environ.get("SMOKE_SHOTS_DIR", "/tmp/browser/smoke-admin"))


async def attempt(page, username: str, password: str):
    """Submit the dashboard login form; return (logged_in, toast_text)."""
    await page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded")
    await page.wait_for_selector("#u", timeout=20000)
    await page.fill("#u", username)
    await page.fill("#p", password)
    await page.get_by_role("button", name="دخول").click()
    try:
        await page.wait_for_selector("#u", state="detached", timeout=8000)
        return True, ""
    except Exception:
        message = ""
        try:
            message = (
                await page.locator("[data-testid=admin-login-error]").first.inner_text(timeout=8000)
            ).strip()
        except Exception:
            pass
        return False, message


async def main() -> int:
    if not USERNAME or not PASSWORD:
        print("FAIL: ADMIN_USERNAME / ADMIN_PASSWORD are not set in this environment")
        return 1

    SHOTS.mkdir(parents=True, exist_ok=True)
    failures = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # 1) wrong credentials must be rejected
        ok, toast = await attempt(page, "definitely-not-the-admin", "definitely-not-the-password")
        await page.screenshot(path=str(SHOTS / "1_wrong_credentials.png"))
        if ok:
            failures.append("wrong credentials were ACCEPTED")
        elif "بيانات الدخول غير صحيحة" not in toast:
            failures.append(f"wrong credentials rejected with unexpected message: {toast!r}")
        else:
            print("PASS: wrong credentials rejected")

        # 2) configured credentials must be accepted
        await context.clear_cookies()
        ok, toast = await attempt(page, USERNAME, PASSWORD)
        await page.screenshot(path=str(SHOTS / "2_valid_credentials.png"))
        if ok:
            print("PASS: configured credentials accepted")
        else:
            failures.append(f"configured credentials were REJECTED: {toast!r}")

        await browser.close()

    print(f"target: {BASE_URL}/dashboard")
    if failures:
        for f in failures:
            print("FAIL:", f)
        return 1
    print("SMOKE TEST PASSED")
    return 0


sys.exit(asyncio.run(main()))
