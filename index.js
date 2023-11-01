const { Plugin } = require("siyuan");

let styleContent = `
.layout-tab-container > .protyle > .protyle-toolbar {
    display: flex !important;
    position: absolute !important;
    top: 30px !important;
    padding-left: 6px;
    border-top: 1px solid var(--b3-border-color);
    border-bottom: 1px solid var(--b3-border-color);
    left: 0 !important;
    width: 100%;
    border-radius: 0;
    box-shadow: none;
    transform: none;
}

.protyle-content {
    margin-top: 32px;
}

html[data-theme-mode="light"][data-light-theme="Savor"] .protyle-toolbar,
html[data-theme-mode="dark"][data-dark-theme="Savor"] .protyle-toolbar {
    top: 42px !important;
    border-radius: 0;
}

html[data-theme-mode="light"][data-light-theme="Rem Craft"] .protyle-toolbar,
html[data-theme-mode="dark"][data-dark-theme="Rem Craft"] .protyle-toolbar {
    top: 40px !important;
    border-radius: 0;
}

`;
for (let i = 0; i < 10; i++) {
  styleContent += `
    div[custom-tool-plus-indent="${i + 1}"] {
        text-indent: ${i + 1}em;
    }
    `;
}
const styleId = "toolbar-plus";

const indentProperty = "custom-tool-plus-indent";

const defaultConf = {
  fixToolbar: true,
};

function getBlockAttrs(block) {
  return fetch("/api/attr/getBlockAttrs", {
    method: "POST",
    body: JSON.stringify({
      id: block,
    }),
  })
    .then((res) => res.json())
    .then((data) => data.data);
}

function setBlockAttrs(block, attrs) {
  return fetch("/api/attr/setBlockAttrs", {
    method: "POST",
    body: JSON.stringify({
      id: block,
      attrs,
    }),
  })
    .then((res) => res.json())
    .then((data) => data.data);
}

module.exports = class ToolbarPlusPlugin extends Plugin {
  currentConf = Object.assign({}, defaultConf);

  protyles = new Map();

  toolbars = new Set();

  async onload() {
    this.createStyle();
    watchCurrentPageChange(() => {
      this.injectButton();
    });

    this.eventBus.on('loaded-protyle-static', ({ detail }) => {
      if (detail.protyle) {
        this.protyles.set(detail.protyle.toolbar.element, detail.protyle);
        this.injectButton();
      }
    })
  }

  createStyle() {
    let styleEl = document.getElementById(styleId);
    if (styleEl) {
      return;
    }
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.innerHTML = styleContent;
    document.head.appendChild(styleEl);
  }

  destroyStyle() {
    let styleEl = document.getElementById(styleId);
    if (styleEl) {
      styleEl.remove();
    }
  }

  async waitForToolbar() {
    const wait = (fn) => {
      if (document.getElementsByClassName("protyle-toolbar").length) {
        fn();
        return true;
      }
      setTimeout(() => {
        wait(fn);
      }, 120);
    };
    return new Promise((resolve) => {
      wait(resolve);
    });
  }

  async injectButton() {
    await this.waitForToolbar();
    const current = getCurrentPage();
    if (!current) {
      return;
    }
    const els = current.getElementsByClassName("protyle-toolbar");
    for (let i = 0; i < els.length; i++) {
      const toolbar = els[i];
      const children = toolbar.children;
      for (const button of children) {
        button.classList.remove("b3-tooltips__n");
        button.classList.remove("b3-tooltips__ne");
        button.classList.add("b3-tooltips__se");
      }
      this.createDivide(toolbar);
      this.createIndentButton(toolbar);
      this.createOutdentButton(toolbar);
      this.createUndoButton(toolbar);
      this.createRedoButton(toolbar);
    }
  }

  createDivide(toolbar) {
    if (toolbar.querySelector('div#divide-1')) {
      return;
    }
    toolbar.querySelector('button[data-type="block-ref"]').insertAdjacentHTML('beforeBegin', '<div id="divide-1" class="protyle-toolbar__divider b3-tooltips__se"></div>')
  }

  createUndoButton(toolbar) {
    if (toolbar.querySelector("#undo")) {
      return;
    }
    const button = document.createElement("button");
    button.classList.add(
      "protyle-toolbar__item",
      "b3-tooltips",
      "b3-tooltips__se"
    );
    button.setAttribute("aria-label", "撤销");
    button.innerHTML = '<svg><use xlink:href="#iconUndo"></use></svg>';
    button.id = "undo";
    const protyle = this.protyles.get(toolbar);
    if (!protyle) {
      return;
    }
    button.addEventListener("click", () => {
      protyle.undo.undo(protyle);
    });
    toolbar.querySelector('#divide-1').insertAdjacentElement('beforeBegin', button);
  }

  createRedoButton(toolbar) {
    if (toolbar.querySelector("#redo")) {
      return;
    }
    const button = document.createElement("button");
    button.classList.add(
      "protyle-toolbar__item",
      "b3-tooltips",
      "b3-tooltips__se"
    );
    button.setAttribute("aria-label", "重做");
    button.innerHTML = '<svg><use xlink:href="#iconRedo"></use></svg>';
    button.id = "redo";
    const protyle = this.protyles.get(toolbar);
    if (!protyle) {
      return;
    }
    button.addEventListener("click", () => {
      protyle.undo.redo(protyle);
    });
    toolbar.appendChild(button);
    toolbar.querySelector('#divide-1').insertAdjacentElement('beforeBegin', button);
  }

  createIndentButton(toolbar) {
    if (toolbar.querySelector("#indent")) {
      return;
    }
    const button = document.createElement("button");
    button.classList.add(
      "protyle-toolbar__item",
      "b3-tooltips",
      "b3-tooltips__se"
    );
    button.setAttribute("aria-label", "缩进");
    button.innerHTML = '<svg><use xlink:href="#iconIndent"></use></svg>';
    button.id = "indent";
    button.addEventListener("click", () => {
      const blocks = this.getSelectedBlocks();
      if (blocks) {
        blocks.forEach((b) => this.indent(b));
      }
    });
    toolbar.appendChild(button);
  }

  createOutdentButton(toolbar) {
    if (toolbar.querySelector("#outdent")) {
      return;
    }
    const button = document.createElement("button");
    button.classList.add(
      "protyle-toolbar__item",
      "b3-tooltips",
      "b3-tooltips__se"
    );
    button.setAttribute("aria-label", "取消缩进");
    button.innerHTML = '<svg><use xlink:href="#iconOutdent"></use></svg>';
    button.id = "outdent";
    button.addEventListener("click", () => {
      const blocks = this.getSelectedBlocks();
      if (blocks) {
        blocks.forEach((b) => this.outdent(b));
      }
    });
    toolbar.appendChild(button);
  }

  onunload() {
    this.destroyStyle();
    unwatchPageChange();
  }

  getSelectedBlocks() {
    const current = getCurrentPage();
    if (!current) {
      return null;
    }
    const selected = current.querySelectorAll(".p.protyle-wysiwyg--select");
    if (selected && selected.length) {
      const result = [];
      for (const s of selected) {
        result.push(s.getAttribute("data-node-id"));
      }
      return result;
    }
    // get by cursor
    const block = this.getCursorBlock();
    if (!block) {
      return null;
    }
    return [block];
  }

  getCursorBlock() {
    const selection = window.getSelection().getRangeAt(0);
    let el = selection.commonAncestorContainer;
    while (el && el.parentElement) {
      const p = el.parentElement;
      if (p.tagName.toUpperCase() === "DIV" && p.hasAttribute("data-node-id")) {
        return p.getAttribute("data-node-id");
      }
      el = p;
    }
    return null;
  }

  async indent(block) {
    const attrs = await this.readAttrs(block);
    const indent = attrs[indentProperty];
    if (!indent) {
      attrs[indentProperty] = "1";
    } else {
      attrs[indentProperty] = `${parseInt(attrs[indentProperty]) + 1}`;
    }
    await this.writeAttr(block, attrs);
  }

  async outdent(block) {
    const attrs = await this.readAttrs(block);
    const indent = attrs[indentProperty];
    if (!indent) {
      return;
    }
    let i = parseInt(attrs[indentProperty]) - 1;
    if (i < 0) {
      i = 0;
    }
    attrs[indentProperty] = `${i}`;
    await this.writeAttr(block, attrs);
  }

  async readAttrs(block) {
    const attrs = await getBlockAttrs(block);
    return attrs;
  }

  async writeAttr(block, attrs) {
    return await setBlockAttrs(block, attrs);
  }
};

let oldId = null;
let timer = null;

function watchCurrentPageChange(fn) {
  timer = setTimeout(() => {
    watchCurrentPageChange(fn);
    let id = getCurrentPage();
    if (!id) {
      return;
    }
    if (oldId === id) {
      return;
    }
    oldId = id;
    fn();
  }, 100);
}

function unwatchPageChange() {
  if (timer) {
    clearTimeout(timer);
  }
}

function getCurrentPage() {
  let currentScreen;
  let currentPage;
  try {
    //获取当前屏幕
    currentScreen = document.querySelector(".layout__wnd--active");
    //获取当前页面
    currentPage = currentScreen.querySelector(
      ".fn__flex-1.protyle:not(.fn__none)"
    );
    return currentPage;
  } catch (e) {
    return null;
  }
}
