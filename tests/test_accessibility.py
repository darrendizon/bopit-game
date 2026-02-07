from playwright.sync_api import sync_playwright, expect

def test_game():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Check Title
        expect(page).to_have_title("Type It Challenge")

        # Check ARIA Live Regions
        expect(page.locator("#command")).to_have_attribute("aria-live", "assertive")
        expect(page.locator("#status")).to_have_attribute("aria-live", "polite")
        expect(page.locator("#score-announcement")).to_have_attribute("aria-live", "polite")

        # Check Controls
        start_btn = page.get_by_role("button", name="Start Game")
        expect(start_btn).to_be_visible()
        start_btn.focus()
        expect(start_btn).to_be_focused()

        # Open Settings
        page.get_by_role("button", name="Settings").click()
        modal = page.locator("#settings-modal")
        expect(modal).to_be_visible()
        expect(page.locator("#settings-title")).to_be_visible()

        # Check Settings Controls
        expect(page.get_by_label("Color Scheme")).to_be_visible()
        expect(page.get_by_label("Lesson")).to_be_visible()
        expect(page.get_by_label("Master Volume")).to_be_visible()
        expect(page.get_by_label("Speech Rate")).to_be_visible()
        expect(page.get_by_label("Speech Pitch")).to_be_visible()

        expect(page.get_by_label("Repeat It")).to_be_visible()
        expect(page.get_by_label("Pause / Resume")).to_be_visible()
        expect(page.get_by_label("Start / Restart")).to_be_visible()

        browser.close()
        print("All tests passed.")

if __name__ == "__main__":
    test_game()
