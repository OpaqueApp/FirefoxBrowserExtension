class Content {
  text_nodes_under(node) {
    var all = [];
    for (node = node.firstChild || (node.shadowRoot && node.shadowRoot.firstChild); node; node = node.nextSibling) {
      if (node.nodeType == 3) {
        all.push(node);
      } else if (node.nodeName === "NOSCRIPT" || node.nodeName === "SCRIPT" || node.nodeName === "STYLE" || node.nodeName === "NAV" || node.nodeName === "script" || node.nodeName === "noscript" || node.nodeName === "style" || node.nodeName === "nav") {
        // console.log("ignored", node);
        // ignore script tags
      } else {
        all = all.concat(this.text_nodes_under(node));
      }
    }
    return all;
  }
  process_text_node(node) {
    var _this = this;
    var _a;
    this.deps.log.do_not_log();
    if (this.state.text_node_set.has(node)) {
      return;
    }
    if (((_a = node.textContent) === null || _a === void 0 ? void 0 : _a.trim()) === "") {
      this.state.text_node_set.add(node);
      return;
    }
    if (node && node.parentElement && node.textContent && !node.parentElement.isContentEditable) {
      this.deps.log.write("node", node);
      // console.log("node", node, node.parentElement);
      var words = this.deps.parser.get_words_with_indexes(node.textContent, {
        tickers_1: this.state.tickers_1,
        tickers_2: this.state.tickers_2,
        tickers_3: this.state.tickers_3,
      });
      // console.log("words", words);
      // this.deps.log.write( "words", node, words );
      if (words.length > 0) {
        // this.deps.log.write( "tickers_found", words );
      }
      this.state.text_node_set.add(node);
      this.deps.log.write(1, node.textContent);
      this.deps.log.do_log();
      if (words.length > 0) {
        // debugger;
      }
      var offset_1 = 0;
      words.forEach(function (word) {
        var new_node = node.splitText(word.index - offset_1);
        var new_new_node = new_node.splitText(word.ticker_text.length);
        node = new_new_node;
        offset_1 = word.index + word.ticker_text.length;
        _this.deps.log.write(2, new_node.textContent);
        _this.deps.log.write(3, new_new_node.textContent);
        _this.state.text_node_set.add(new_node);
        // this.state.text_node_set.add( new_new_node );
        if (node.parentElement) {
          // var font_size = window.getComputedStyle(node.parentElement).fontSize;
          var span = document.createElement("span");
          span.style.whiteSpace = "nowrap";
          span.className = "trendspider-ticker";
          if (word.ticker_full.includes("NASDAQ:")) {
            span.dataset.ticker_name = word.ticker_full.replace("NASDAQ:", "");
          } else {
            span.dataset.ticker_name = word.ticker_full;
          }
          new_node.before(span);
          span.appendChild(new_node);
          _this.deps.handlers.handle_new_ticker(span);
        }
      });
    }
  }
  wait(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }
}
(async function () {
  if (location.hostname === "localhost") {
    return;
  }
  let content = new Content();
  function get_matching_text_nodes(all_text_nodes, storage) {
    let matching_nodes = [];
    loop_1: for (let i = all_text_nodes.length; i--; ) {
      let text = all_text_nodes[i].textContent.toLowerCase();
      loop_2: for (let j = storage.plain_text.length; j--; ) {
        if (storage.plain_text[j] && storage.plain_text[j].length > 2 && text.indexOf(storage.plain_text[j]) > -1) {
          matching_nodes.push(all_text_nodes[i]);
          continue loop_1;
        }
      }
    }
    return matching_nodes;
  }
  function get_matching_text_nodes_by_regex(all_text_nodes, storage) {
    try {
      const regexp_template = storage.regexp;
      if (!regexp_template) return [];
      if (all_text_nodes.length === 0) return [];
      let regexp_template_arr = regexp_template.split("\n");
      let regexp_data_arr = [];
      for (const template_item of regexp_template_arr) {
        const regexp_data = parse_regex_str(template_item);
        if (regexp_data) {
          regexp_data_arr.push(regexp_data);
        }
      }
      if (regexp_data_arr.length === 0) {
        return [];
      }
      let matching_nodes = [];
      loopr_1: for (let i = 0; all_text_nodes.length > i; i++) {
        const text = all_text_nodes[i].textContent;
        loop_2: for (let j = regexp_data_arr.length; j--; ) {
          let regexp = new RegExp(regexp_data_arr[j].pattern, regexp_data_arr[j].flags);
          let check = text.match(regexp);
          if (check) {
            matching_nodes.push(all_text_nodes[i]);
            continue loopr_1;
          }
        }
      }

      return matching_nodes;
    } catch (e) {
      return [];
    }
  }
  function get_matching_wildcard_text_nodes(all_text_nodes, storage) {
    try {
      const wildcard_exp = storage.wildcards;
      if (!wildcard_exp) return [];
      if (all_text_nodes.length === 0) return [];
      let wildcard_exp_arr = wildcard_exp.split("\n");
      if (wildcard_exp_arr.length === 0) return [];
      let matching_nodes = [];
      loopw_1: for (let i = 0; all_text_nodes.length > i; i++) {
        let text = all_text_nodes[i].textContent;
        loop_2: for (let j = 0; wildcard_exp_arr.length > j; j++) {
          let check = match_wildcard_str(text, wildcard_exp_arr[j]);
          if (check) {
            matching_nodes.push(all_text_nodes[i]);
            continue loopw_1;
          }
        }
      }
      return matching_nodes;
    } catch (e) {
      return [];
    }
  }

  function get_matching_text_nodes_by_def_regexp(all_text_nodes, regexp) {
    try {
      let matching_nodes = [];
      for (let i = 0; all_text_nodes.length > i; i++) {
        const text = all_text_nodes[i].textContent;
        let check = text.match(regexp);
        if (check) {
          matching_nodes.push(all_text_nodes[i]);
        }
      }
      return matching_nodes;
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  function unblur() {
    Array.from(document.querySelectorAll(".chromane-blur_text-blur")).forEach((element) => {
      element.classList.remove("chromane-blur_text-blur");
    });
  }
  function blur(storage) {
    let all_text_nodes = content.text_nodes_under(document.body);
    unblur();
    // !Case for Plain text
    if (storage.is_plain_text_active) {
      let matching_text_nodes = get_matching_text_nodes(all_text_nodes, storage);

      for (let i = 0; i < matching_text_nodes.length; i++) {
        add_blur_to_text_nodes(matching_text_nodes[i]);
      }
    }
    // !Case for CSS Selectorsss
    if (storage.is_selectors_active) {
      let selector = storage.css_selectors.join(", ");
      if (selector) {
        var matching_elements = Array.from(document.querySelectorAll(selector));
      } else {
        var matching_elements = [];
      }
      for (let i = 0; i < matching_elements.length; i++) {
        matching_elements[i].classList.add("chromane-blur_text-blur");
      }
    }
    // !Case for RegExp
    if (storage.is_regexp_active) {
      const matching_regexp_nodes = get_matching_text_nodes_by_regex(all_text_nodes, storage) || [];
      for (let i = 0; i < matching_regexp_nodes.length; i++) {
        add_blur_to_text_nodes(matching_regexp_nodes[i]);
      }
    }
    // !Case for WILDCARD
    if (storage.is_wildcards_active) {
      const matching_wildcard_nodes = get_matching_wildcard_text_nodes(all_text_nodes, storage);
      for (let i = 0; i < matching_wildcard_nodes.length; i++) {
        add_blur_to_text_nodes(matching_wildcard_nodes[i]);
      }
    }
    // !IF is Additional flag is false we stop
    if (storage.is_add_open) {
      // !Case for GUID
      if (storage.guid_flag) {
        const guid_regexp = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}?/g;
        const matching_guid_nodes = get_matching_text_nodes_by_def_regexp(all_text_nodes, guid_regexp);
        for (let i = 0; i < matching_guid_nodes.length; i++) {
          add_blur_to_text_nodes(matching_guid_nodes[i]);
        }
      }
      // !Case for DOMAIN NAME
      if (storage.domain_name_flag) {
        // const domain_regexp = /^((?!-))(xn--)?[a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}.(xn--)?([a-zA-Z0-9-]{1,61}|[a-zA-Z0-9-]{1,30}.[a-zA-Z]{2,})$/g;
        const domain_regexp = /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/g;

        const matching_domain_nodes = get_matching_text_nodes_by_def_regexp(all_text_nodes, domain_regexp);
        for (let i = 0; i < matching_domain_nodes.length; i++) {
          add_blur_to_text_nodes(matching_domain_nodes[i]);
        }
      }
      // !Case for Email
      if (storage.email_flag) {
        // const email_regexp = /^(([^<>()[]\.,;:\s@"]+(.[^<>()[]\.,;:\s@"]+)*)|(".+"))@(([[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}])|(([a-zA-Z-0-9]+.)+[a-zA-Z]{2,}))$/g;
        const email_regexp = /\S+@\S+\.\S+/g;
        const matching_email_nodes = get_matching_text_nodes_by_def_regexp(all_text_nodes, email_regexp);
        for (let i = 0; i < matching_email_nodes.length; i++) {
          add_blur_to_text_nodes(matching_email_nodes[i]);
        }
      }
    }
  }
  function apply_storage(storage) {
    try {
      storage.plain_text = storage.plain_text.toLowerCase().split("\n");
      storage.css_selectors = storage.css_selectors.split("\n");
      if (storage.enabled_flag) {
        blur(storage);
      } else {
        unblur();
      }
    } catch (e) {}
  }
  function parse_regex_str(template) {
    let flags = "";
    let pattern = "";
    try {
      if (template === "") {
        return null;
      } else if (template[0] !== "/") {
        return null;
      } else if (template.split("/").length <= 2) {
        return null;
      } else if (template[template.length - 1] === "/") {
        pattern = template.replace(/\//g, "");
      } else {
        let parsed_arr = template.split("/");
        flags = parsed_arr[parsed_arr.length - 1];
        pattern = parsed_arr.slice(0, parsed_arr.length - 1).join("");
      }
      let test_regexp = new RegExp(pattern, flags);
      test_regexp.test("teses");
      return { pattern, flags };
    } catch (e) {
      return null;
    }
  }
  function add_blur_to_text_nodes(text_node) {
    if (text_node.parentNode.childNodes.length === 1) {
      text_node.parentNode.classList.add("chromane-blur_text-blur");
    } else {
      let span = document.createElement("span");
      span.innerText = text_node.textContent;
      text_node.parentNode.insertBefore(span, text_node);
      text_node.parentNode.removeChild(text_node);
      span.classList.add("chromane-blur_text-blur");
    }
  }
  function match_wildcard_str(str, rule) {
    if (rule === "") return false;
    let escape_regex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    const flag = new RegExp("(?<=^|\\P{L})" + rule.split("*").map(escape_regex).join(".*") + "(?=\\P{L}|$)", "giu").test(str);
    // console.log(new RegExp("(?<=^|\\P{L})" + rule.split("*").map(escape_regex).join(".*") + "(?=\\P{L}|$)", "giu"), str, "for_testing
    return flag;
  }
  // blur();
  let style = document.createElement("style");
  style.innerHTML = `
    .chromane-blur_text-blur {
      filter: blur( 10px );
    }
  `;
  document.body.appendChild(style);
  chrome.storage.onChanged.addListener(async function () {
    let storage = await chrome.storage.local.get(null);
    apply_storage(storage);
  });
  let storage = await chrome.storage.local.get(null);
  apply_storage(storage);
  setInterval(async () => {
    let storage = await chrome.storage.local.get(null);
    apply_storage(storage);
  }, 1000);
})();
