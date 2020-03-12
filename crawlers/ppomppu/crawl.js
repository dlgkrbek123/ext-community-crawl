const lib = require("../lib")

const CRAWL_LIST_URL = "http://www.ppomppu.co.kr/hot.php"

const getListItem = async (crawl_list_length, crawl_item_count) => {
  const table_body = document.querySelector(".board_table tbody")
  let best_dom_list = table_body.querySelectorAll("tr.line")
  best_dom_list = [...best_dom_list]

  best_dom_list = best_dom_list.filter((dom_item) => {
    const category = dom_item.querySelector("td a").href.split("?id=")[1]

    return !category.includes("news") && !category.includes("phone2")
  })

  const slice_num =
    best_dom_list.length + crawl_list_length <= crawl_item_count ? best_dom_list.length : crawl_item_count - crawl_list_length

  best_dom_list = best_dom_list.slice(0, slice_num)

  const result_list = best_dom_list.map((dom_item) => {
    try {
      const list_title_wrapper = dom_item.querySelectorAll("td")[3]
      const src = list_title_wrapper.querySelector("a").href

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
  const page_btn_list = document.querySelectorAll("#page_list a")
  let next_page_btn = null

  for (let idx = 0; idx < page_btn_list.length; idx++) {
    if (parseInt(page_btn_list[idx].innerText) === page_num) {
      next_page_btn = page_btn_list[idx]
      break
    }
  }

  if (next_page_btn === null) {
    next_page_btn = page_btn_list[page_btn_list.length - 1]
  }

  next_page_btn.click()
}

const getList = lib.makeGetList(CRAWL_LIST_URL, getListItem, navToNextPage)

const crawlItem = (src) => {
  const container = document.querySelector(".container")
  const header_container = container.querySelectorAll("td.han")[1]
  const body_container = container.querySelector("td.board-contents")
  const title_text = header_container.querySelector(".view_title2").innerText
  const list_comment_dom = container.querySelector(".list_comment")

  const comment_num_text = list_comment_dom ? list_comment_dom.innerText : "0"

  let header_text_children = [...header_container.childNodes]
  let post_time_text = null
  let view_num_text = null

  for (var idx in header_text_children) {
    const cur_node = header_text_children[idx]
    const is_text_node = cur_node.nodeType === Node.TEXT_NODE

    if (is_text_node && !/^\s*$/.test(cur_node.nodeValue)) {
      const {nodeValue} = cur_node

      if (nodeValue.includes("등록일")) {
        post_time_text = nodeValue.split(":").slice(1).join(":").trim()
      } else if (nodeValue.includes("조회수")) {
        view_num_text = nodeValue.split("/")[0].split(":")[1].trim()
      }
    }
  }

  if (view_num_text === null) {
    view_num_text = "0"
  }

  let thumbnail = null
  const thumb_dom = body_container.querySelector("img")
  console.log(6)
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

const crawlItems = lib.makeCrawlItems(crawlItem, "td.board-contents", 1000)

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
      post_time: `${post_time_text}:00`,
      thumbnail
    }
  })
}

module.exports = lib.makeCrawler("ppomppu", getList, crawlItems, refineItems)