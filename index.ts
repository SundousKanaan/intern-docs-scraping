import { Marktplaats } from "./platforms/marktplaats";
import { Mediamarkt } from "./platforms/mediamarkt";
import { Asos } from "./platforms/asos";
import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const platforms: { [key: string]: any } = {
  marktplaats: Marktplaats,
  mediamarkt: Mediamarkt,
  asos: Asos,
};

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Usage: yarn scrape <platform> <search-term> <limit>");
    console.log("Example: yarn scrape marktplaats tshirt 20");
    process.exit(1);
  }

  const platform = args[0];
  const searchTerm = args[1];
  const limit = parseInt(args[2]);

  if (isNaN(limit) || limit <= 0) {
    console.log("Limit must be a positive number");
    process.exit(1);
  }

  console.log(
    `Searching for "${searchTerm}" with limit ${limit} on ${platform}`
  );

  // TODO: Implement scraping logic here
  if (!(platform in platforms)) {
    console.error("Unknown platform.");
    process.exit(1);
  }

  const PlatformClass = platforms[platform];
  const currentPLatform = new PlatformClass();

  const listingUrls = await currentPLatform.scrapeSearchPage(
    null,
    searchTerm,
    limit
  );

  console.log({ listingUrls });

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const data = [];

  for (const url of listingUrls) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const pageData = await currentPLatform.scrapeItemPage(page);
    data.push(pageData);
  }
  await browser.close();

  console.log({ data });

  const jsonData = JSON.stringify(data, null, 2);
  console.log({ jsonData });

  await writeFile(`${platform}.json`, jsonData, "utf-8");
  console.log("json is done");
}

main().catch(console.error);
