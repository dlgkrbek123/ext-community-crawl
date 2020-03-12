const lib = require("../lib")

const CRAWL_LIST_URL = "https://www.instiz.net/bbs/list.php?id=pt&srt=3"

const getList = async (page, crawl_item_count) => {
  const crawl_list = []
  let page_num = 1

  try {
    await page.goto(CRAWL_LIST_URL, {
      waitUntil: "domcontentloaded"
    })

    while (true) {
      const {max_page, cur_crawl_list} = await page.evaluate(async (page_num) => {
        const max_page = document.querySelector("#topboard .rank2").innerText
        const table = document.querySelector(`#topboard #ingreen table:nth-child(${page_num})`)
        let best_dom_list = table.querySelectorAll("tbody tr")

        best_dom_list = [...best_dom_list]

        const result_list = best_dom_list.map((dom_item) => {
          try {
            const src = dom_item.querySelector(".listsubject a").href

            return {
              src
            }
          } catch (err) {
            return null
          }
        }).filter(item => item !== null)

        return {
          max_page,
          cur_crawl_list: result_list
        }
      }, page_num);

      crawl_list.push(...cur_crawl_list)

      if (page_num !== parseInt(max_page.replace(/\D/g, ""))) {
        page_num++

        await page.evaluate(() => {
          document.querySelector("#topboard .greenr").click()
        });

        await lib.sleep(5000)
      } else {
        break
      }
    }
  } catch (err) {
    throw new Error(`error occured when getting best post list\n ${err}`)
  }

  return crawl_list
}

const crawlItem = (src) => {
  const content_view = document.querySelector(".responsive_main table > tbody > tr > td table")
  const title_cmt_wrapper = content_view.querySelector(".tb_top")
  const pst_time_vn_wrapper = content_view.querySelector(".tb_lr > .tb_left")
  const body_wrapper = content_view.querySelector("#memo_content_1")

  const title_text = title_cmt_wrapper.querySelector("#nowsubject").innerText
  const comment_num_text = title_cmt_wrapper.querySelector("#view_cmt").innerText

  const post_time_text = pst_time_vn_wrapper.querySelector("[itemprop=datePublished]").innerText
  let view_num_text = null

  const wrapper_node_list = [...pst_time_vn_wrapper.childNodes]

  for (let i in wrapper_node_list) {
    const cur_node = wrapper_node_list[i]
    const is_text_node = cur_node.nodeType === Node.TEXT_NODE
    const {nodeValue} = cur_node

    if (is_text_node && !/^\s*$/.test(nodeValue) && nodeValue.includes("조회")) {
      view_num_text = cur_node.nodeValue.trim()
      break
    }
  }


  let thumbnail = null
  const thumb_dom = body_wrapper.querySelector("p img")

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

const crawlItems = lib.makeCrawlItems(crawlItem, "#memo_content_1")

const makeDoubleDigitText = (text) => {
  const refinedDigit = parseInt(text)

  if (isNaN(refinedDigit)) {
    return null
  } else if (text < 10) {
    return `0${refinedDigit}`
  } else {
    return refinedDigit
  }
}

const processDoubleDigitByDelimeter = (text, delimeter, start_index) => {
  const splitted_elements = text.split(delimeter)
  let result = ""

  for (let idx = start_index; idx < splitted_elements.length; idx++) {
    splitted_elements[idx] = makeDoubleDigitText(splitted_elements[idx])
  }

  return splitted_elements.join(delimeter)
}

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

    const extracted_post_time_text = post_time_text.split("(")[1].replace(/[^\d\.\s:]/g, "")
    const split_post_time = extracted_post_time_text.split(" ")

    const date_text = processDoubleDigitByDelimeter(split_post_time[0], ".", 1).replace(/\./g, "-")
    const time_text = processDoubleDigitByDelimeter(split_post_time[1], ":", 0)

    return {
      src,
      title: title_text,
      view_num: parseInt(view_num_text.replace(/\D/g, "")),
      comment_num: parseInt(comment_num_text.replace(/\D/g, "")),
      post_time: `${date_text} ${time_text}:00`,
      thumbnail
    }
  })
}

module.exports = lib.makeCrawler("instiz", getList, crawlItems, refineItems)