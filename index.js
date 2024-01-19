const { Plugin, Menu } = require("siyuan");

const styleId = "toolbar-plus";
const docStyleId = 'toolbar-plus-docstyle';

const indentProperty = "custom-tool-plus-indent";
const columnsProperty = "custom-tool-plus-columns";

let styleContent = `
.layout-tab-container > .protyle:has(.protyle-content .protyle-title__input[contenteditable="true"])  > .protyle-toolbar {
    display: flex !important;
    position: absolute !important;
    top: 33px !important;
    padding-left: 6px;
    border-top: 1px solid var(--b3-border-color);
    border-bottom: 1px solid var(--b3-border-color);
    left: 0 !important;
    width: 100%;
    border-radius: 0;
    box-shadow: none;
    transform: none;
}

.protyle-content:has(.protyle-title__input[contenteditable="true"]) {
    margin-top: 33px;
}

html[data-light-theme="Savor"] .layout-tab-container > .protyle:has(.protyle-content .protyle-title__input[contenteditable="true"])  > .protyle-toolbar,
html[data-light-theme="Savor"] .layout-tab-container > .protyle:has(.protyle-content .protyle-title__input[contenteditable="true"])  > .protyle-toolbar {
  top: 45px !important;
  border-radius: 0;
}

html[data-light-theme="Rem Craft"] .layout-tab-container > .protyle:has(.protyle-content .protyle-title__input[contenteditable="true"])  > .protyle-toolbar,
html[data-light-theme="Rem Craft"] .layout-tab-container > .protyle:has(.protyle-content .protyle-title__input[contenteditable="true"])  > .protyle-toolbar {
    top: 40px !important;
    border-radius: 0;
}
`;
let docStyleContent = '';
for (let i = 1; i < 10; i++) {
  docStyleContent += `
    *[${indentProperty}="${i + 1}"] {
        text-indent: ${i + 1}em;
    }
    `;
}
for (let i = 1; i < 10; i++) {
  docStyleContent += `
    *[${columnsProperty}="${i + 1}"] {
      columns: ${i + 1};
    }
  `;
}


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

  config = {
    showToolbarOnTop: true,
  }

  async loadStorage() {
    const data = await this.loadData('config.json');
    if (!data) {
      this.saveStorage();
    } else {
      Object.assign(this.config, data);
    }
  }

  async saveStorage() {
    await this.saveData('config.json', this.config);
  }

  onload() {
    // add icons
    this.addIcons(`
    <symbol id="iconColumnsUp" viewBox="0 0 1024 1024"><path d="M402.295467 0H73.1136A73.3184 73.3184 0 0 0 0 73.1136v877.7728c0.136533 40.3456 32.768 72.977067 73.1136 73.1136h329.181867a73.3184 73.3184 0 0 0 73.1136-73.1136V73.1136A73.3184 73.3184 0 0 0 402.295467 0z m0 914.295467a34.542933 34.542933 0 0 1-36.590934 36.590933h-256a34.542933 34.542933 0 0 1-36.590933-36.590933V109.704533a34.542933 34.542933 0 0 1 36.590933-36.590933h256a34.542933 34.542933 0 0 1 36.590934 36.590933v804.590934zM950.8864 0H621.704533a73.3184 73.3184 0 0 0-73.1136 73.1136v877.7728c0.136533 40.3456 32.768 72.977067 73.1136 73.1136h329.181867A73.3184 73.3184 0 0 0 1024 950.8864V73.1136A73.3184 73.3184 0 0 0 950.8864 0z m0 914.295467a34.542933 34.542933 0 0 1-36.590933 36.590933h-256a34.542933 34.542933 0 0 1-36.590934-36.590933V109.704533a34.542933 34.542933 0 0 1 36.590934-36.590933h256a34.542933 34.542933 0 0 1 36.590933 36.590933v804.590934z" p-id="7648"></path></symbol>
    <symbol id="iconColumnsDown" viewBox="0 0 1024 1024"><path d="M406.186667 964.266667H107.52c-25.6 0-47.786667-20.48-47.786667-47.786667V105.813333c0-25.6 20.48-46.08 47.786667-46.08h298.666667c25.6 0 47.786667 20.48 47.786666 46.08v192.853334c0 13.653333-11.946667 25.6-25.6 25.6s-25.6-11.946667-25.6-25.6v-187.733334h-290.133333v802.133334h290.133333v-187.733334c0-13.653333 11.946667-25.6 25.6-25.6s25.6 11.946667 25.6 25.6v192.853334c-1.706667 25.6-22.186667 46.08-47.786666 46.08zM918.186667 964.266667H619.52c-25.6 0-47.786667-20.48-47.786667-47.786667V725.333333c0-13.653333 11.946667-25.6 25.6-25.6s25.6 11.946667 25.6 25.6v187.733334h290.133334v-802.133334h-290.133334v187.733334c0 13.653333-11.946667 25.6-25.6 25.6s-25.6-11.946667-25.6-25.6V105.813333c0-25.6 20.48-46.08 47.786667-46.08h298.666667c25.6 0 47.786667 20.48 47.786666 46.08v810.666667c-1.706667 27.306667-22.186667 47.786667-47.786666 47.786667z" p-id="5195"></path><path d="M938.666667 537.6H597.333333c-13.653333 0-25.6-11.946667-25.6-25.6s11.946667-25.6 25.6-25.6h341.333334c13.653333 0 25.6 11.946667 25.6 25.6s-11.946667 25.6-25.6 25.6zM426.666667 537.6H107.52c-13.653333 0-25.6-11.946667-25.6-25.6s11.946667-25.6 25.6-25.6H426.666667c13.653333 0 25.6 11.946667 25.6 25.6s-11.946667 25.6-25.6 25.6z" p-id="5196"></path><path d="M698.026667 640c-6.826667 0-13.653333-1.706667-18.773334-6.826667l-102.4-102.4c-10.24-10.24-10.24-25.6 0-35.84l102.4-102.4c10.24-10.24 25.6-10.24 35.84 0s10.24 25.6 0 35.84L631.466667 512l85.333333 85.333333c10.24 10.24 10.24 25.6 0 35.84-5.12 5.12-11.946667 6.826667-18.773333 6.826667zM327.68 640c-6.826667 0-13.653333-1.706667-18.773333-6.826667-10.24-10.24-10.24-25.6 0-35.84l83.626666-83.626666-83.626666-83.626667c-10.24-10.24-10.24-25.6 0-35.84s25.6-10.24 35.84 0l102.4 102.4c10.24 10.24 10.24 25.6 0 35.84l-102.4 102.4c-3.413333 3.413333-10.24 5.12-17.066667 5.12z" p-id="5197"></path></symbol>
    `)
    this.createStyle(docStyleId, docStyleContent);
    this.loadStorage().then(() => {
      if (this.config.showToolbarOnTop) {
        this.createStyle(styleId, styleContent);
      }
    })
    watchCurrentPageChange(() => {
      this.injectButton();
    });

    const topBarElement = this.addTopBar({
      icon: "iconRefresh",
      title: this.i18n.title,
      position: "right",
      callback: () => {
        let rect = topBarElement.getBoundingClientRect();
        const menu = new Menu("toolarPlusMenu");
        menu.addItem({
          icon: "iconRefresh",
          label: this.i18n.toggleShowToolbarOnTop,
          click: () => {
            this.toggleShowToolbarOnTop();
          }
        });
        menu.open({
          x: rect.right,
          y: rect.bottom,
          isLeft: true,
        });
      }
    });


    this.eventBus.on('loaded-protyle-static', ({ detail }) => {
      if (detail.protyle) {
        this.protyles.set(detail.protyle.toolbar.element, detail.protyle);
        this.injectButton();
      }
    })
  }

  toggleShowToolbarOnTop() {
    if (this.config.showToolbarOnTop) {
      this.destroyStyle(styleId);
      this.config.showToolbarOnTop = false;
    } else {
      this.createStyle(styleId, styleContent);
      this.config.showToolbarOnTop = true;
    }
    this.saveStorage();
  }

  createStyle(id, style) {
    let styleEl = document.getElementById(id);
    if (styleEl) {
      return;
    }
    styleEl = document.createElement("style");
    styleEl.id = id;
    styleEl.innerHTML = style;
    document.head.appendChild(styleEl);
  }

  destroyStyle(id) {
    let styleEl = document.getElementById(id);
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
      this.createColumnsUpButton(toolbar);
      this.createColumnsDownButton(toolbar);
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
    button.setAttribute("aria-label", this.i18n.undo);
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
    button.setAttribute("aria-label", this.i18n.redo);
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
    button.setAttribute("aria-label", this.i18n.indent);
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
    button.setAttribute("aria-label", this.i18n.outdent);
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

  createColumnsUpButton(toolbar) {
    if (toolbar.querySelector("#columns-up")) {
      return;
    }
    const button = document.createElement("button");
    button.classList.add(
      "protyle-toolbar__item",
      "b3-tooltips",
      "b3-tooltips__se"
    );
    button.setAttribute("aria-label", this.i18n.columnsUp);
    button.innerHTML = '<svg><use xlink:href="#iconColumnsUp"></use></svg>';
    button.id = "columns-up";
    button.addEventListener("click", () => {
      const blocks = this.getSelectedBlocks();
      if (blocks) {
        blocks.forEach((b) => this.columnsUp(b));
      }
    });
    toolbar.appendChild(button);
  }

  createColumnsDownButton(toolbar) {
    if (toolbar.querySelector("#columns-down")) {
      return;
    }
    const button = document.createElement("button");
    button.classList.add(
      "protyle-toolbar__item",
      "b3-tooltips",
      "b3-tooltips__se"
    );
    button.setAttribute("aria-label", this.i18n.columnsDown);
    button.innerHTML = '<svg><use xlink:href="#iconColumnsDown"></use></svg>';
    button.id = "columns-down";
    button.addEventListener("click", () => {
      const blocks = this.getSelectedBlocks();
      if (blocks) {
        blocks.forEach((b) => this.columnsDown(b));
      }
    });
    toolbar.appendChild(button);
  }

  onunload() {
    this.destroyStyle(styleId);
    this.destroyStyle(docStyleId);
    unwatchPageChange();
  }

  getSelectedBlocks() {
    const current = getCurrentPage();
    if (!current) {
      return null;
    }
    const selected = current.querySelectorAll(".protyle-wysiwyg--select");
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

  async columnsUp(block) {
    const attrs = await this.readAttrs(block);
    const indent = attrs[columnsProperty];
    if (!indent) {
      attrs[columnsProperty] = "2";
    } else {
      attrs[columnsProperty] = `${parseInt(attrs[columnsProperty]) + 1}`;
    }
    await this.writeAttr(block, attrs);
  }

  async columnsDown(block) {
    const attrs = await this.readAttrs(block);
    const indent = attrs[columnsProperty];
    if (!indent) {
      return;
    }
    let i = parseInt(attrs[columnsProperty]) - 1;
    if (i < 1) {
      i = 1;
    }
    attrs[columnsProperty] = `${i}`;
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
