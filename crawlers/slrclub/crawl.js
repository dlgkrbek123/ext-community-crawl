const lib = require("../lib")

// const CRAWL_LIST_URL = "http://www.slrclub.com/bbs/zboard.php?id=hot_article"
const CRAWL_LIST_URL = "http://www.slrclub.com/bbs/zboard.php?id=best_article&category=1&setsearch=category"

const getListItem = async (crawl_list_length, crawl_item_count) => {
  let best_dom_list = document.querySelectorAll("#bbs_list tbody > tr")
  const slice_num =
    best_dom_list.length + crawl_list_length <= crawl_item_count ? best_dom_list.length : crawl_item_count - crawl_list_length

  best_dom_list = [...best_dom_list].slice(0, slice_num)

  const result_list = best_dom_list.map((dom_item) => {
    try {
      const src = dom_item.querySelector(".sbj a").href

      return {
        src
      }
    } catch (err) {
      return null
    }
  }).filter(item => item !== null)

  return result_list
}

const navToNextPage = () => {
  const nav_btns = document.querySelectorAll("#bbs_foot .btn1 a")
  nav_btns[nav_btns.length - 1].click()
}

const getList = lib.makeGetList(CRAWL_LIST_URL, getListItem, navToNextPage)

const crawlItem = (src) => {
  const content_view = document.querySelector("#slrct")
  const view_head = content_view.querySelector("#bbs_view_head")
  const body_wrapper = content_view.querySelector("#userct")

  const title_text = view_head.querySelector(".sbj").innerText
  const post_time_text = view_head.querySelector(".date").innerText
  const view_num_text = view_head.querySelector(".click").innerText
  const comment_num_text = content_view.querySelector("#cmcnt").innerText

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

const crawlItems = lib.makeCrawlItems(crawlItem, "#userct")

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
      title: title_text,
      view_num: parseInt(view_num_text.replace(/\D/g, "")),
      comment_num: parseInt(comment_num_text.replace(/\D/g, "")),
      post_time: post_time_text.replace(/\//g, "-"),
      thumbnail
    }
  })
}

module.exports = lib.makeCrawler("slrclub", getList, crawlItems, refineItems)