import { Page } from "puppeteer";

export interface Listing {
  title: string;
  price: number;
  price_text: string;
  url: string;
}

export interface Platform {
  name: string;

  scrapeSearchPage(
    page: Page,
    keyword: string,
    limit: number
  ): Promise<string[]>;

  scrapeItemPage(page: Page): Promise<Listing>;
}
