import { Listing, Platform } from "./base";
import puppeteer, { Page } from "puppeteer";

export class Asos implements Platform {
  name = "asos";

  async scrapeSearchPage(
    _page: Page,
    keyword: string,
    limit: number
  ): Promise<string[]> {
    try {
      console.log("Start scrapeSearchPage");

      const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.goto("https://www.asos.com/");

      const sectionsUrls = await page.$$eval("a[class*='hero__cta']", (links) =>
        links.map((link) => (link as HTMLAnchorElement).href)
      );

      const listingUrls = [];

      for (const sectionUrl of sectionsUrls) {
        await page.goto(sectionUrl);
        const urls = await page.$$eval("a[class^='cta']", (links) =>
          links.map((link) => (link as HTMLAnchorElement).href)
        );

        for (const url of urls) {
          await page.goto(url);
          const targetUrls = await page.$$eval(
            "a[class*='productLink_']",
            (links) => links.map((link) => (link as HTMLAnchorElement).href)
          );

          listingUrls.push(targetUrls);
        }
      }
      console.log("Finish scrapeSearchPage");
      await browser.close();

      return listingUrls.flat().slice(0, limit);
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
