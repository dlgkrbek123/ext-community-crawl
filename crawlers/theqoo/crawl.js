const lib = require("../lib")

const CRAWL_LIST_URL = "https://theqoo.net/hot"

const getListItem = async (crawl_list_length, crawl_item_count) => {
  let best_dom_list = document.querySelectorAll(".bd_lst_wrp table tbody tr")

  best_dom_list = [...best_dom_list].filter((dom_item) => {
    const classList = [...dom_item.classList]
    let is_notice = false

    classList.forEach((item) => {
      if (item.includes("notice")) {
        is_notice = true
      }
    })

    return !is_notice
  })

  const slice_num =
    best_dom_list.length + crawl_list_length <= crawl_item_count ? best_dom_list.length : crawl_item_count - crawl_list_length

  best_dom_list = best_dom_list.slice(0, slice_num)

  const result_list = best_dom_list.map((dom_item) => {
    try {
      const src = dom_item.querySelector(".title a").href

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
  const page_btn_list = document.querySelectorAll(".bd_lst_wrp .theqoo_pagination a")
  let next_page_btn = null

  for (let idx = 0; idx < page_btn_list.length; idx++) {
    if (parseInt(page_btn_list[idx].innerText) === page_num) {
      next_page_btn = page_btn_list[idx]
      break
    }
  }

  next_page_btn.click()
}

const getList = lib.makeGetList(CRAWL_LIST_URL, getListItem, navToNextPage)

const crawlItem = (src) => {
  const container = document.querySelector(".rd")
  const header_container = container.querySelector(".rd_hd")
  const body_container = container.querySelector(".rd_body article")

  const title_number_wrapper = header_container.querySelector(".theqoo_document_header")
  const post_time_wrapper = header_container.querySelector(".board .side.fr")

  const title_text = title_number_wrapper.querySelector(".title").innerText
  let view_num_text = ""
  let comment_num_text = ""
  let num_icon = ""

  const vn_cn_wrapper_children = [...title_number_wrapper.querySelector(".count_container").childNodes]

  for (var idx in vn_cn_wrapper_children) {
    const cur_node = vn_cn_wrapper_children[idx]
    const is_text_node = cur_node.nodeType === Node.TEXT_NODE
    const {nodeValue} = cur_node

    if (is_text_node) {
      if (!/^\s*$/.test(nodeValue)) {
        if (num_icon === "view") {
          view_num_text = nodeValue
        } else if (num_icon === "comment") {
          comment_num_text = nodeValue
        }
      }
    } else {
      if (cur_node.classList.contains("fa-eye")) {
        num_icon = "view"
      } else if (cur_node.classList.contains("fa-comment-dots")) {
        num_icon = "comment"
      }
    }
  }

  const post_time_text = post_time_wrapper.innerText

  let thumbnail = null
  const thumb_dom = body_container.querySelector("img")

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

const crawlItems = lib.makeCrawlItems(crawlItem, ".rd .rd_body article")

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
      post_time: `${post_time_text}:00`.replace(/\./g, "-"),
      thumbnail
    }
  })
}

module.exports = lib.makeCrawler("theqoo", getList, crawlItems, refineItems)