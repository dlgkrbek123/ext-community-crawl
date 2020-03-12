const lib = require("../lib")

const CRAWL_LIST_URL = "https://gall.dcinside.com/board/lists/?id=superidea"

const getListItem = async (crawl_list_length, crawl_item_count) => {
  const post_container = document.querySelector(".gall_list tbody")
  let best_dom_list = post_container.querySelectorAll("tr.ub-content.us-post")

  const slice_num =
    best_dom_list.length + crawl_list_length <= crawl_item_count ? best_dom_list.length : crawl_item_count - crawl_list_length
  best_dom_list = [...best_dom_list].slice(0, slice_num)

  const result_list = best_dom_list.map((dom_item) => {
    try {
      const src = dom_item.querySelector(".gall_tit a").href

      return {
        src
      }
    } catch (err) {
      return null
    }
  }).filter(item => item !== null)

  return result_list
}

const navToNextPage = (page_num) => {
  const anchors = document.querySelectorAll(".bottom_paging_box a")
  let nav_anchor = null

  for (let idx = 0; idx < anchors.length; idx++) {
    if (parseInt(anchors[idx].innerText) === page_num) {
      nav_anchor = anchors[idx]
      break
    }
  }

  if (!nav_anchor) {
    nav_anchor = document.querySelector(".bottom_paging_box a.page_next")
  }

  nav_anchor.click()
}

const getList = lib.makeGetList(CRAWL_LIST_URL, getListItem, navToNextPage)

const crawlItem = (src) => {
  const content_view = document.querySelector(".view_content_wrap")
  const view_head = content_view.querySelector("header")
  const body_wrapper = content_view.querySelector(".gallview_contents .writing_view_box")

  const title_text = view_head.querySelector(".title_subject").innerText
  const post_time_text = view_head.querySelector(".gall_date").innerText

  const view_num_text = view_head.querySelector(".gall_count").innerText
  const comment_num_text = view_head.querySelector(".gall_comment").innerText

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

const crawlItems = lib.makeCrawlItems(crawlItem, ".view_content_wrap .gallview_contents .writing_view_box", 2000)

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
      post_time: post_time_text.replace(/\./g, "-"),
      thumbnail
    }
  })
}

module.exports = lib.makeCrawler("dcinside", getList, crawlItems, refineItems)



