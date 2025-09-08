import { Listing, Platform } from "./base";
import puppeteer, { Page } from "puppeteer";

export class Marktplaats implements Platform {
  name = "marktplaats";

  async scrapeSearchPage(
    page: Page,
    keyword: string,
    limit: number
  ): Promise<string[]> {
    let pageNumber = 1;
    const urls: string[] = [];

    while (urls.length < limit) {
      const url = `https://www.marktplaats.nl/q/${keyword}/p/${pageNumber}/`;

      await page.goto(url, { waitUntil: "domcontentloaded" });

      // "a.hz-Listing-coverLink" with this selector i get some empty results
      // a[href^='/v/']
      const items = await page.$$eval("a[href^='/v/']", (links) => {
        return links.map((link) => {
          // "https://www.marktplaats.nl" +
          return link.href;
        });
      });
      urls.push(...items);
      pageNumber++;
    }
    return urls.slice(0, limit);
  }

  async scrapeItemPage(page: Page): Promise<Listing> {
    try {
      const data = await page.evaluate(() => {
        const title =
          document.querySelector("h1[class$='-title']")?.textContent?.trim() ||
          "N/A";
        const priceText =
          document
            .querySelector("div.ListingHeader-price")
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
