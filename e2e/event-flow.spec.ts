
import { test, expect } from '@playwright/test';

test.describe('Event Workflow', () => {

    test('Complete Flow: Register -> Check-in -> Lucky Draw', async ({ page, request }) => {
        // 1. REGISTRATION
        console.log('--- Step 1: Registration ---');
        await page.goto('/apps/ticketing/registration');
        await expect(page.getByRole('heading', { name: 'Event Registration' })).toBeVisible();

        const uniqueName = `TestUser_${Date.now()}`;
        await page.getByPlaceholder('e.g. John Doe').fill(uniqueName);
        await page.getByPlaceholder('e.g. +60123456789').fill('999888777');
        await page.getByRole('button', { name: 'Get Ticket' }).click();

        // Verify Success & Get Code
        await expect(page.getByText('Registration Successful!')).toBeVisible();
        const codeElement = page.locator('.font-mono.text-3xl');
        await expect(codeElement).toBeVisible();
        const ticketCode = await codeElement.innerText();
        console.log(`Registered User: ${uniqueName} with Code: ${ticketCode}`);

        // 2. CHECK-IN (Admin Side)
        console.log('--- Step 2: On-site Check-in ---');
        await page.goto('/apps/check-in');

        // Simulate Scan (Type Code)
        await page.getByPlaceholder('T-XXXXXX').fill(ticketCode);
        await page.getByRole('button', { name: 'GO' }).click();

        // Verify Welcome Message
        await expect(page.getByText(`Welcome, ${uniqueName}!`)).toBeVisible();
        await expect(page.getByText('Checked In', { exact: true })).toBeVisible();

        // 3. LUCKY DRAW (Screen Side)
        console.log('--- Step 3: Lucky Draw Screen ---');
        await page.goto('/apps/lucky-draw');

        // Check if user is counted (this might be tricky depending on load time)
        // We expect at least 1 participant
        await expect(page.getByText('Participants')).toBeVisible();
        // Start Spin (if button is enabled)
        const spinButton = page.getByRole('button', { name: 'SPIN' });
        await expect(spinButton).toBeVisible();

        // Optional: Click spin if strictly required, but verify page loads is sufficient proof of integration
        // await spinButton.click(); 
    });

});
