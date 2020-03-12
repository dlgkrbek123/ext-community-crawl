const lib = require("../lib")

const CRAWL_LIST_URL = "https://www.clien.net/service/recommend"

const getList = async (page, crawl_item_count) => {
  const crawl_list = []

  try {
    await page.goto(CRAWL_LIST_URL, {
      waitUntil: "domcontentloaded"
    })

    const result_list = await page.evaluate(async () => {
      let best_dom_list = document.querySelectorAll(".recommend_underList .list_item")

      best_dom_list = [...best_dom_list]

      const result_list = best_dom_list.map((dom_item) => {
        try {
          const src = dom_item.querySelector(".list_title a").href

          return {
            src
          }
        } catch (err) {
          return null
        }
      }).filter(item => item !== null)

      return result_list
    });

    crawl_list.push(...result_list)
  } catch (err) {
    throw new Error(`error occured when getting best post list\n ${err}`)
  }

  return crawl_list
}

const crawlItem = (src) => {
  const content_view = document.querySelector(".content_view")
  const post_subject = content_view.querySelector(".post_subject")
  const post_info = content_view.querySelector(".post_info")
  const post_view = content_view.querySelector(".post_view")
  const post_content = post_view.querySelector(".post_content")

  const title_text = post_subject.querySelector("span").innerText
  let comment_num_text = post_subject.querySelector(".post_reply")
  const view_num_text = post_info.querySelector(".view_count strong").innerText

  comment_num_text = comment_num_text ? comment_num_text.innerText : "0"
  const post_time_wrapper = post_view.querySelector(".post_author").children[0]

  let post_time = null
  const post_time_node_list = [...post_time_wrapper.childNodes]

  for (var i in post_time_node_list) {
    const cur_node = post_time_node_list[i]
    const is_text_node = cur_node.nodeType === Node.TEXT_NODE

    if (is_text_node && !/^\s*$/.test(cur_node.nodeValue)) {
      post_time = cur_node.nodeValue.trim()
      break
    }
  }

  let thumbnail = null
  const thumb_dom = post_content.querySelector("img")

  if (thumb_dom) {
    thumbnail = {
      src: thumb_dom.src,
      size: {
        width: thumb_dom.naturalWidth,
        height: thumb_dom.naturalHeight
      }
    }
  }

  return {
    src,
    title_text,
    view_num_text,
    comment_num_text,
    post_time,
    thumbnail
  }
}

const crawlItems = lib.makeCrawlItems(crawlItem, ".post_view .post_content", 1000)

const refineItems = (crawl_items) => {
  return crawl_items.map((item) => {
    const {
      src,
      title_text,
      view_num_text,
      comment_num_text,
      post_time,
      thumbnail
    } = item

    return {
      src,
      title: title_text,
      view_num: parseInt(view_num_text.replace(/\D/g, "")),
      comment_num: parseInt(comment_num_text.replace(/\D/g, "")),
      post_time,
      thumbnail
    }
  })
}

module.exports = lib.makeCrawler("clien", getList, crawlItems, refineItems)