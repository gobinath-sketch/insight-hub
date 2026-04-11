import { chromium } from "@playwright/test";

const baseUrl = process.env.APP_URL || "http://localhost:8080";
const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;
const resumePath = process.env.TEST_RESUME || "C:/Users/Gobinath M/Desktop/AgentScrapper/insight-hub/Docs/Resume.pdf";

if (!email || !password) {
  console.error("Missing TEST_EMAIL or TEST_PASSWORD");
  process.exit(1);
}

const timeout = 60000;

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("pageerror", (err) => console.log(`[ui][pageerror] ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`[ui][console] ${msg.text()}`);
  });

  const log = (msg) => console.log(`[ui] ${msg}`);

  log("Open login page");
  await page.goto(`${baseUrl}/login`, { timeout });

  log("Fill login form");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  log("Wait for dashboard");
  await page.waitForURL(/dashboard/, { timeout });

  log("Navigate to HandyScrapper");
  await page.goto(`${baseUrl}/dashboard/handy`, { timeout });
  log(`URL after handy nav: ${page.url()}`);
  await page.getByText("HandyScrapper").first().waitFor({ timeout });
  const keys = await page.evaluate(() => Object.keys(localStorage));
  log(`LocalStorage keys: ${keys.join(", ")}`);

  log("Upload resume + send message");
  const fileInput = page.locator("input[type='file']#handy-files");
  await fileInput.setInputFiles(resumePath);
  const textarea = page.locator("textarea").first();
  await textarea.fill("Find 10 jobs near my location based on my resume.");
  const textVal = await textarea.inputValue();
  log(`Textarea value length: ${textVal.length}`);
  const notLogged = await page.locator("text=Please log in again").count();
  log(`Not logged banner count: ${notLogged}`);
  const sendBtn = page.getByRole("button", { name: /send/i });
  let enabled = await sendBtn.isEnabled();
  if (!enabled) {
    try {
      await page.waitForFunction(() => {
        const btn = Array.from(document.querySelectorAll("button")).find((b) =>
          /send/i.test(b.textContent || "")
        );
        return btn && !btn.hasAttribute("disabled");
      }, { timeout: 60000 });
      enabled = true;
    } catch {}
  }
  log(`Send enabled: ${enabled}`);
  if (enabled) {
    await sendBtn.click();
  } else {
    log("Send button disabled - likely not authenticated or message not set.");
  }

  log("Check Jobs panel shows items");
  await page.getByText("Jobs").first().waitFor({ timeout });

  log("Navigate to Job Finder and submit");
  await page.goto(`${baseUrl}/dashboard/jobs`, { timeout });
  await page.getByText("Job Opportunity Finder").waitFor({ timeout });
  log(`URL after jobs nav: ${page.url()}`);
  const inputTypes = await page.evaluate(() =>
    Array.from(document.querySelectorAll("input")).map((i) => i.type)
  );
  log(`Input types on jobs page: ${inputTypes.join(", ")}`);
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200));
  log(`Body text sample: ${bodyText}`);
  const htmlLen = await page.evaluate(() => document.documentElement.outerHTML.length);
  log(`HTML length: ${htmlLen}`);
  const roleInput = page.getByText("Role").locator("..").locator("input");
  const locationInput = page.getByText("Location").locator("..").locator("input");
  const salaryInput = page.getByText("Min Salary").locator("..").locator("input");
  await roleInput.fill("Developer");
  await locationInput.fill("Bangalore");
  await salaryInput.fill("100000");
  await page.getByRole("button", { name: /find matching jobs/i }).click();

  log("Navigate to Competitive Intel and submit");
  await page.goto(`${baseUrl}/dashboard/competitive`, { timeout });
  await page.getByRole("button", { name: /add url/i }).click();
  const urlInputs = page.locator("main input");
  await urlInputs.nth(0).fill("https://notion.so");
  await urlInputs.nth(1).fill("https://airtable.com");
  await page.getByRole("button", { name: /analyze competitors/i }).click();

  log("Navigate to Travel Planner and submit");
  await page.goto(`${baseUrl}/dashboard/travel`, { timeout });
  await page.getByText("Destination").locator("..").locator("input").fill("Goa");
  await page.getByText("Dates").locator("..").locator("input").fill("May 1-5");
  await page.getByText("Budget").locator("..").locator("input").fill("800");
  await page.getByRole("button", { name: /generate itinerary/i }).click();

  log("Test logout button");
  await page.getByRole("button", { name: /logout/i }).click();
  await page.waitForTimeout(2000);
  log(`URL after logout click: ${page.url()}`);
  const keysAfter = await page.evaluate(() => Object.keys(localStorage));
  log(`LocalStorage after logout: ${keysAfter.join(", ")}`);

  await browser.close();
  log("UI smoke test complete");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
