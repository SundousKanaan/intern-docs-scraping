import { Listing, Platform } from "./base";
import puppeteer, { Page } from "puppeteer";

export class Mediamarkt implements Platform {
  name = "mediamarkt";

  async scrapeSearchPage(
    _page: Page,
    keyword: string,
    limit: number
  ): Promise<string[]> {
    try {
      console.log("start scrapeSearchPage");

      const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.goto("https://www.mediamarkt.nl/");

      const listingUrls = await page.$$eval("a[href*='/product/']", (links) =>
        links.map((link) => (link as HTMLAnchorElement).href)
      );

      await browser.close();
      console.log("Finish scrapeSearchPage");

      return listingUrls.slice(0, limit);
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async scrapeItemPage(page: Page): Promise<Listing> {
    try {
      const data = await page.evaluate(() => {
        console.log("Start scrapeItemPage");
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
      console.log("Finish scrapeItemPage");

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
