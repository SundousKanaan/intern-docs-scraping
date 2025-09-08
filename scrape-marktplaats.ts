import puppeteer from "puppeteer";

async function main() {
  const limit = 1; // temp limit
  try {
    console.log("start scrapeSearchPage");
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto("https://www.marktplaats.nl/", {
      waitUntil: "domcontentloaded",
    });
    // close cookies popup
    const iframeElement = await page.$("#sp_message_iframe_1278200");
    if (iframeElement) {
      const iframContent = await iframeElement.contentFrame();
      try {
        const btn = await iframContent?.$("button.sp_choice_type_SE");
        if (btn) await btn.click();
        console.log("Cookies popup closed");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(error);
      }
    }
    let listingUrls: string[] = [];
    let scrollTries = 0;
    while (listingUrls.length < limit && scrollTries < 30) {
      const newUrls = await page.$$eval("a[href^='/v/']", (links) =>
        links.map((link) => (link as HTMLAnchorElement).href)
      );
      listingUrls = Array.from(new Set([...listingUrls, ...newUrls]));
      if (listingUrls.length >= limit || newUrls.length === limit) {
        break;
      }
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      scrollTries++;
    }
    await browser.close();
    console.log("Finish scrapeSearchPage");
    return listingUrls.slice(0, limit);
  } catch (e) {
    console.error(e);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
