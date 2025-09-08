import { Listing, Platform } from "./base";
import puppeteer, { Page } from "puppeteer";

export class Asos implements Platform {
  name = "asos";

  async scrapeSearchPage(
    page: Page,
    keyword: string,
    limit: number
  ): Promise<string[]> {
    let pageNumber = 1;
    let urls: string[] = [];

    while (urls.length < limit) {
      console.log("Start scrapeSearchPage");
      await page.goto(
        `https://www.asos.com/search/?q=${keyword}&page=${pageNumber}`
      );

      const targetUrls = await page.$$eval(
        "a[class*='productLink_']",
        (links) => links.map((link) => (link as HTMLAnchorElement).href)
      );

      urls = Array.from(new Set([...urls, ...targetUrls]));

      console.log("Finish scrapeSearchPage");
      pageNumber++;
    }

    console.log("===", urls.length);

    return urls.flat().slice(0, limit);
  }

  async scrapeItemPage(page: Page): Promise<Listing> {
    try {
      const data = await page.evaluate(() => {
        const title =
          document.querySelector("h1")?.textContent?.trim() || "N/A";
        const priceText =
          document
            .querySelector("span[data-testid$='-price']")
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
