import { Listing, Platform } from "./base";
import puppeteer, { Page } from "puppeteer";

export class Marktplaats implements Platform {
  name = "marktplaats";

  async scrapeSearchPage(
    _page: Page,
    keyword: string,
    limit: number
  ): Promise<string[]> {
    try {
      const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.goto("https://www.marktplaats.nl/");

      const listingUrls = await page.$$eval("a[href^='/v/']", (links) =>
        links.map((link) => (link as HTMLAnchorElement).href)
      );

      await browser.close();
      return listingUrls.slice(0, limit);
    } catch (e) {
      console.error(e);
      return [];
    }
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
