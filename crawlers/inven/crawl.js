const lib = require("../lib")

const CRAWL_LIST_URL = "http://www.inven.co.kr/board/webzine/2097?iskin=webzine"

const getListItem = async (crawl_list_length, crawl_item_count) => {
  const post_container = document.querySelector(".articleList form[name=board_list1] tbody")
  let best_dom_list = post_container.querySelectorAll(".tr1, .tr2")

  const slice_num =
    best_dom_list.length + crawl_list_length <= crawl_item_count ? best_dom_list.length : crawl_item_count - crawl_list_length
  best_dom_list = [...best_dom_list].slice(0, slice_num)

  const result_list = best_dom_list.map((dom_item) => {
    try {
      const src = dom_item.querySelector(".bbsSubject a").href

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
  const anchors = document.querySelectorAll(".articleList #jump a")
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
  const content_view = document.querySelector("#tbArticle")
  const view_num_wrapper = content_view.querySelector(".articleHit")
  const comment_num_wrapper = content_view.querySelector(".articleTopMenu")
  const post_content_wrapper = content_view.querySelector(".articleContent")

  const title_text = content_view.querySelector(".articleTitle").innerText
  const post_time_text = content_view.querySelector(".articleDate").innerText
  const comment_num_text = comment_num_wrapper.querySelectorAll("a")[1].innerText


  const view_num_wrapper_children = [...view_num_wrapper.childNodes]
  let view_num_text = null
  let view_label_searched = false

  for (var idx = 0; idx < view_num_wrapper_children.length; idx++) {
    const cur_node = view_num_wrapper_children[idx]
    const {nodeType} = cur_node
    const is_text_node = nodeType === Node.TEXT_NODE

    if (!is_text_node) {
      if (cur_node.innerText.includes("조회")) {
        view_label_searched = true
      }
    } else if (view_label_searched && !/^\s*$/.test(cur_node.nodeValue)) {
      view_num_text = cur_node.nodeValue
    }
  }

  let thumbnail = null
  const thumb_dom = post_content_wrapper.querySelector("img")

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

const crawlItems = lib.makeCrawlItems(crawlItem, "#tbArticle .articleContent")

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

module.exports = lib.makeCrawler("inven", getList, crawlItems, refineItems)