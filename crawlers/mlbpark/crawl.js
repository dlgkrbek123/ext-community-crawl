const lib = require("../lib")

const CRAWL_LIST_URL = "http://mlbpark.donga.com/mp/best.php?b=bullpen&m=like"

const getList = async (page, crawl_item_count) => {
  const crawl_list = []

  try {
    await page.goto(CRAWL_LIST_URL, {
      waitUntil: "domcontentloaded"
    })

    const result_list = await page.evaluate(async () => {
      let best_dom_list = document.querySelector("#container .contents .left_cont table tbody").children

      best_dom_list = [...best_dom_list]

      const result_list = best_dom_list.map((dom_item) => {
        try {
          const src = dom_item.querySelector("td:nth-child(2) a").href

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
  const content_view = document.querySelector(".contents")
  const view_head = document.querySelector(".view_head .text")
  const body_wrapper = content_view.querySelector(".view_context #contentDetail")

  const view_comment_wrapper = view_head.querySelector(".text_left .text2")
  const post_time_wrapper = view_head.querySelector(".text_right .text3 .val")

  let title_text = ""
  const post_time_text = post_time_wrapper.innerText

  const title_nodes = [...content_view.querySelector(".titles").childNodes]

  for (let i in title_nodes) {
    const cur_node = title_nodes[i]
    const is_text_node = cur_node.nodeType === Node.TEXT_NODE
    const {nodeValue} = cur_node

    if (is_text_node && !/^\s*$/.test(nodeValue)) {
      title_text = cur_node.nodeValue.trim()
      break
    }
  }

  const view_comment_values = view_comment_wrapper.querySelectorAll("span.val")

  const view_num_text = view_comment_values[1].innerText
  const comment_num_text = view_comment_values[2].innerText


  let thumbnail = null
  const thumb_dom = body_wrapper.querySelector("img")

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
    post_time_text,
    thumbnail
  }
}

const crawlItems = lib.makeCrawlItems(crawlItem, ".contents .view_context #contentDetail")

const refineItems = (crawl_items) => {
  return crawl_items.map((item) => {
    const {
      src,
      title_text,
      view_num_text,
      comment_num_text,
      post_time_text,
      thumbnail
    } = item


    return {
      src,
      title: title_text.replace(/^\s*\[.*\]\s*/, ""),
      view_num: parseInt(view_num_text.replace(/\D/g, "")),
      comment_num: parseInt(comment_num_text.replace(/\D/g, "")),
      post_time: `${post_time_text}:00`,
      thumbnail
    }
  })
}

module.exports = lib.makeCrawler("mlbpark", getList, crawlItems, refineItems)