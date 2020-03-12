const lib = require("../lib")

const CRAWL_LIST_URL = "https://www.fmkorea.com/index.php?mid=best&listStyle=webzine"

const getListItem = async (crawl_list_length, crawl_item_count) => {
  let best_dom_list = document.querySelectorAll(".fm_best_widget ul li.li")
  const slice_num =
    best_dom_list.length + crawl_list_length <= crawl_item_count ? best_dom_list.length : crawl_item_count - crawl_list_length

  best_dom_list = [...best_dom_list].slice(0, slice_num)

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
  const page_btn_list = document.querySelectorAll(".bd_pg a")
  let next_page_btn = null

  for (let idx = 0; idx < page_btn_list.length; idx++) {
    if (parseInt(page_btn_list[idx].innerText) === page_num) {
      next_page_btn = page_btn_list[idx]
      break
    }
  }

  if (next_page_btn === null) {
    next_page_btn = document.querySelector(".bd_pg a.direction")
  }

  next_page_btn.click()
}

const getList = lib.makeGetList(CRAWL_LIST_URL, getListItem, navToNextPage)

const crawlItem = (src) => {
  const container = document.querySelector("#content #bd_capture")
  const header_container = container.querySelector(".rd_hd")
  const body_container = container.querySelector(".rd_body")

  const title_time_wrapper = header_container.querySelector(".top_area")
  const vn_cn_wrapper = header_container.querySelector(".btm_area .side.fr ")

  const title_text = title_time_wrapper.querySelector("h1").innerText
  const post_time_text = title_time_wrapper.querySelector(".date").innerText

  let view_num_text = ""
  let comment_num_text = ""

  let vn_cn_wrapper_children = [...vn_cn_wrapper.children]

  for (var idx in vn_cn_wrapper_children) {
    const {innerText} = vn_cn_wrapper_children[idx]

    if (innerText.includes("조회")) {
      view_num_text = innerText
    } else if (innerText.includes("댓글")) {
      comment_num_text = innerText
    }
  }

  let thumbnail = null
  const thumb_dom = body_container.querySelector("article img")

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

const crawlItems = lib.makeCrawlItems(crawlItem, "#content #bd_capture .rd_body article")

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

module.exports = lib.makeCrawler("fmkorea", getList, crawlItems, refineItems)