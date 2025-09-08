import { Marktplaats } from "./platforms/marktplaats";
import { Mediamarkt } from "./platforms/mediamarkt";
import { Asos } from "./platforms/asos";
import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { Platform } from "./platforms/base";

const platforms: { [key: string]: new () => Platform } = {
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

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const searchPage = await browser.newPage();
  const listingUrls = await currentPLatform.scrapeSearchPage(
    searchPage,
    searchTerm,
    limit
  );

  const data = [];
  console.log("Start scrapeItemPage");
  const page = await browser.newPage();
  for (const url of listingUrls) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const pageData = await currentPLatform.scrapeItemPage(page);
    data.push(pageData);
  }

  // console.log({ data });
  console.log("data count:", data.length);

  await browser.close();

  const jsonData = JSON.stringify(data, null, 2);

  await writeFile(`${platform}.json`, jsonData, "utf-8");
  console.log("json is done");
}

main().catch(console.error);
