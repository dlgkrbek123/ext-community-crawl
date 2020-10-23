const lib = require("../lib")

const CRAWL_LIST_URL = "https://bbs.ruliweb.com/best"

const getListItem = async (crawl_list_length, crawl_item_count) => {
  const post_container = document.querySelector(".board_list_table tbody")
  let best_dom_list = post_container.querySelectorAll("tr")

  const slice_num =
    best_dom_list.length + crawl_list_length <= crawl_item_count ? best_dom_list.length : crawl_item_count - crawl_list_length
  best_dom_list = [...best_dom_list].slice(0, slice_num)

  const result_list = best_dom_list.map((dom_item) => {
    try {
      const src = dom_item.querySelector(".subject a").href

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
  const anchors = document.querySelectorAll(".paging_wrapper a")
  let nav_anchor = null

  for (let idx = 0; idx < anchors.length; idx++) {
    if (parseInt(anchors[idx].innerText) === page_num) {
      nav_anchor = anchors[idx]
      break
    }
  }

  if (!nav_anchor) {
    nav_anchor = anchors[anchors.length - 1]
  }

  nav_anchor.click()
}

const getList = lib.makeGetList(CRAWL_LIST_URL, getListItem, navToNextPage)

const crawlItem = (src) => {
  const content_view = document.querySelector(".board_main")
  const subject_wrapper = content_view.querySelector(".subject")
  const body_wrapper = content_view.querySelector(".view_content")

  const view_time_wrapper = content_view.querySelector(".user_info")
  const view_time_children = [...view_time_wrapper.children].slice(-3)
  const view_num_wrapper = view_time_children[0]
  const post_time_wrapper = view_time_children[1]

  const title_text = subject_wrapper.querySelector(".subject_text").innerText
  const comment_num_dom = subject_wrapper.querySelector(".reply_count")

  let comment_num_text = "0"

  if (comment_num_dom) {
    comment_num_text = comment_num_dom.innerText
  }

  const view_num_wrapper_children = view_num_wrapper.childNodes
  let view_num_text = null

  for (var idx = 0; idx < view_num_wrapper_children.length; idx++) {
    const cur_node = view_num_wrapper_children[idx]
    const {nodeType} = cur_node
    const is_text_node = nodeType === Node.TEXT_NODE

    if (is_text_node && !/^\s*$/.test(cur_node.nodeValue)) {
      if (cur_node.nodeValue.includes("조회")) {
        view_num_text = cur_node.nodeValue
      }
    }
  }

  const post_time_text = post_time_wrapper.querySelector(".regdate").innerText
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

const crawlItems = lib.makeCrawlItems(crawlItem, ".board_main .view_content")

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

    const split_post_time_text = post_time_text.split(" ")
    let date_string = split_post_time_text[0]
    let time_string = split_post_time_text[1]

    date_string = date_string.replace(/\./g, "-")
    time_string = time_string.split(")")[0].replace(/[^\d:]/g, "")

    return {
      src,
      title: title_text.replace(/^\s*\[[^\]]+\]\s*/, ""),
      view_num: parseInt(view_num_text.replace(/\D/g, "")),
      comment_num: parseInt(comment_num_text.replace(/\D/g, "")),
      post_time: `${date_string} ${time_string}`,
      thumbnail
    }
  })
}

module.exports = lib.makeCrawler("ruliweb", getList, crawlItems, refineItems)