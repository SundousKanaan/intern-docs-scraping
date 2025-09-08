import { Listing, Platform } from "./base";
import puppeteer, { Page } from "puppeteer";

export class Mediamarkt implements Platform {
  name = "mediamarkt";

  async scrapeSearchPage(
    page: Page,
    keyword: string,
    limit: number
  ): Promise<string[]> {
    let pageNumber = 1;
    let targetPage;
    let urls: string[] = [];

    const url = `https://www.mediamarkt.nl/nl/search.html?query=${keyword}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const finalUrl = page.url();
    if (finalUrl.includes("specials/")) {
      const afterSpecials = finalUrl.split("specials/")[1].split("?")[0];

      const listingUrls = await page.$$eval("a[data-test='mms-router-link-product-list-item-link']", (links) => {
        return links.map((link) => {
          return link.href;
        });
      });

      targetPage = listingUrls.find((url) =>
        url.search(`${afterSpecials}-283`)
      );
    }

    while (urls.length < limit) {
      await page.goto(`${targetPage}?page=${pageNumber}`, {
        waitUntil: "domcontentloaded",
      });

      const items = await page.$$eval("a[href*='/product/']", (links) => {
        return links.map((link) => {
          return link.href;
        });
      });

      urls = Array.from(new Set([...urls, ...items]));

      if (urls.length >= limit) break;
      pageNumber++;
    }

    return urls.slice(0, limit);
  }

  async scrapeItemPage(page: Page): Promise<Listing> {
    try {
      const data = await page.evaluate(() => {
        const title =
          document.querySelector("h1")?.textContent?.trim() || "N/A";
        const priceText =
          document
            .querySelector("span[data-test^='branded-price-']")
            ?.textContent?.trim() || "N/A";
        const price =
          Number(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
        return { title, price, priceText };
      });

      return {
        title: data.title,
        price: data.price,
        price_text: data.priceText,
        url: page.url(),
      };
    } catch (e) {
      console.error(e);
      return { title: "N/A", price: 0, price_text: "N/A", url: page.url() };
    }
  }
}
