import puppeteer from "puppeteer";

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("https://www.marktplaats.nl/");

  const listingUrls = await page.$$eval("a[href^='/v/']", (links) =>
    links.map((link) => (link as HTMLAnchorElement).href)
  );

  console.log("listingUrls", listingUrls);

  for (const url of listingUrls) {
    const listingPage = await browser.newPage();
    await listingPage.goto(url, { waitUntil: "domcontentloaded" });

    const data = await listingPage.evaluate(() => {
      const name = document.querySelector("h1")?.textContent?.trim() || "N/A";
      const price =
        document
          .querySelector("div.ListingHeader-price")
          ?.textContent?.trim() || "N/A";
      console.log("oo", price);

      return { name, price };
    });
    console.log("---", data);
    await listingPage.close();
  }

  await browser.close();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
