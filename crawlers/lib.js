const puppeteer = require("puppeteer");
const fs = require("fs");

const sleep = timeout => {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
};

exports.sleep = sleep;

exports.makeGetList = (crawl_list_url, getListItem, navToNextPage) => {
  return async (page, crawl_item_count) => {
    const crawl_list = [];
    let page_num = 1;

    try {
      await page.goto(crawl_list_url, {
        waitUntil: "domcontentloaded"
      });

      while (crawl_list.length !== crawl_item_count) {
        const cur_crawl_list = await page.evaluate(
          getListItem,
          crawl_list.length,
          crawl_item_count
        );
        crawl_list.push(...cur_crawl_list);

        if (crawl_list.length !== crawl_item_count) {
          page_num++;
          await page.evaluate(navToNextPage, page_num);

          await sleep(5000);
        }
      }
    } catch (err) {
      throw new Error(`error occured when getting best post list \n${err}`);
    }

    return crawl_list;
  };
};

exports.makeCrawlItems = (crawlItem, wait_selector, page_time_out) => {
  return async (page, crawl_list) => {
    const crawl_items = [];

    for (let i = 0; i < crawl_list.length; i++) {
      const { src } = crawl_list[i];

      try {
        await page.goto(src, {
          waitUntil: "domcontentloaded"
        });

        await page.waitForSelector(wait_selector, {
          timeout: 3000
        });

        const item = await page.evaluate(crawlItem, src);
        crawl_items.push(item);

        if (page_time_out) {
          await sleep(page_time_out);
        }
      } catch (err) {
        // console.log(err)
      }
    }

    if (crawl_items.length === 0) {
      throw new Error(`there are no crawlable post`);
    }

    return crawl_items;
  };
};

const isEmpty = text => {
  return /^\s*$/.test(text);
};

const isNumberString = text => {
  return /^\d+$/.test(text);
};

const isISODateString = text => {
  return /^\d{4}-[01]\d-[0-3]\d\s[0-2]\d:[0-5]\d:[0-5]\d$/.test(text);
};

const testCrawlItem = items => {
  items.map(item => {
    const { src, title, view_num, comment_num, post_time } = item;

    const valid_src = /^(https?):\/\/[^\s$.?#].[^\s]*$/.test(src);
    const valid_title = !isEmpty(title);
    const valid_view_num = isNumberString(view_num);
    const valid_comment_num = isNumberString(comment_num);
    const valid_post_time = isISODateString(post_time);

    const valid_all =
      valid_src &&
      valid_title &&
      valid_view_num &&
      valid_comment_num &&
      valid_post_time;

    if (!valid_all) {
      throw new Error(
        `find error validating post page (${src})\n ${JSON.stringify(item)}`
      );
    }
  });
};

exports.makeCrawler = (
  name,
  getList,
  crawlItems,
  refineItems
) => async crawl_item_count => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  try {
    const crawl_list = await getList(page, crawl_item_count);
    const crawl_items = await crawlItems(page, crawl_list);
    const refined_items = refineItems(crawl_items);
    testCrawlItem(refined_items);

    const filter_item = refined_items.filter(({ title }) => {
      return (
        !title.includes("ㅇㅎ") &&
        !title.includes("후방") &&
        !title.includes("ㅎㅂ")
      );
    });

    fs.writeFile(`${name}.json`, JSON.stringify(filter_item), () => {});

    console.log(`${name} crawled well (${filter_item.length})`);
    // console.log(JSON.stringify(refined_items))
  } catch (err) {
    console.log(`below error occured when crawling ${name}\n`);
    console.error(err);
  } finally {
    browser.close();
  }
};
