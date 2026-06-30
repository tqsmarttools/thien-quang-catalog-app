(function () {
  const {
    storageKey: STORAGE_KEY,
    categories,
    productGroups,
    products,
    filterOptions
  } = window.CATALOG_DATA;
  const ASSETS = window.CATALOG_ASSETS;
  const MESSAGE_TEMPLATE = window.CATALOG_MESSAGE_TEMPLATE;

  const state = loadState();
  const root = document.getElementById("screen-root");

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return {
          currentScreen: "home",
          selectedCategory: "xay-to",
          selectedGroup: "bay-xay-dung",
          activeFilter: "all",
          draftFilter: "all",
          isFilterOpen: false,
          isPreviewOpen: false,
          note: "",
          quote: {},
          ...JSON.parse(raw)
        };
      }
    } catch (error) {
      console.warn("Failed to load catalog state", error);
    }
    return {
      currentScreen: "home",
      selectedCategory: "xay-to",
      selectedGroup: "bay-xay-dung",
      activeFilter: "all",
      draftFilter: "all",
      isFilterOpen: false,
      isPreviewOpen: false,
      note: "",
      quote: {}
    };
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentScreen: state.currentScreen,
        selectedCategory: state.selectedCategory,
        selectedGroup: state.selectedGroup,
        activeFilter: state.activeFilter,
        draftFilter: state.draftFilter,
        isFilterOpen: state.isFilterOpen,
        isPreviewOpen: false,
        note: state.note,
        quote: state.quote
      })
    );
  }

  function formatPrice(value) {
    return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
  }

  function quoteEntries() {
    return Object.entries(state.quote)
      .map(([id, qty]) => {
        const product = products.find((item) => item.id === id);
        return product && qty > 0 ? { product, qty } : null;
      })
      .filter(Boolean);
  }

  function totalQuoteItems() {
    return quoteEntries().reduce((sum, entry) => sum + entry.qty, 0);
  }

  function totalQuotePrice() {
    return quoteEntries().reduce((sum, entry) => sum + entry.product.price * entry.qty, 0);
  }

  function isAdded(productId) {
    return Boolean(state.quote[productId]);
  }

  function toggleProduct(productId) {
    if (state.quote[productId]) {
      delete state.quote[productId];
    } else {
      state.quote[productId] = 1;
    }
    saveState();
    render();
  }

  function changeQty(productId, delta) {
    const current = state.quote[productId] || 1;
    const next = current + delta;
    if (next < 1) return;
    state.quote[productId] = next;
    saveState();
    render();
  }

  function removeQuoteItem(productId) {
    delete state.quote[productId];
    saveState();
    render();
  }

  function filteredProducts() {
    return products
      .filter((product) => {
        const categoryMatch = product.category === state.selectedCategory;
        const groupMatch = product.group === state.selectedGroup;
        const filterMatch = state.activeFilter === "all" ? true : product.subtype === state.activeFilter;
        return categoryMatch && groupMatch && filterMatch;
      })
      .slice(0, 6);
  }

  function buildZaloMessage() {
    return MESSAGE_TEMPLATE.build({
      entries: quoteEntries(),
      totalItems: totalQuoteItems(),
      totalPrice: totalQuotePrice(),
      note: state.note,
      formatPrice
    });
  }

  function openZaloQuote() {
    const message = encodeURIComponent(buildZaloMessage());
    window.open(`https://zalo.me/share?text=${message}`, "_blank", "noopener");
  }

  function openQuotePreview() {
    state.isPreviewOpen = true;
    render();
  }

  function closeQuotePreview() {
    state.isPreviewOpen = false;
    render();
  }

  function setScreen(screen) {
    state.currentScreen = screen;
    saveState();
    render();
  }

  function openProductList(categoryId, groupId) {
    state.selectedCategory = categoryId;
    state.selectedGroup = groupId;
    state.currentScreen = "product-list";
    saveState();
    render();
  }

  function openFilter() {
    state.draftFilter = state.activeFilter;
    state.isFilterOpen = true;
    saveState();
    render();
  }

  function closeFilter() {
    state.isFilterOpen = false;
    saveState();
    render();
  }

  function applyFilter() {
    state.activeFilter = state.draftFilter;
    state.isFilterOpen = false;
    saveState();
    render();
  }

  function resetFilter() {
    state.draftFilter = "all";
    render();
  }

  function setDraftFilter(filterId) {
    state.draftFilter = filterId;
    render();
  }

  function setNote(value) {
    state.note = value;
    saveState();
  }

  function getAsset(scope, key) {
    return ASSETS[scope][key];
  }

  function renderHeaderStatus() {
    return `
      <div class="status-bar">
        <div>9:41</div>
        <div class="signal-dots"><img src="${ASSETS.icons.dots}" alt="more" /></div>
      </div>
    `;
  }

  function renderHome() {
    return `
      <div class="page home-page">
        ${renderHeaderStatus()}
        <div class="home-header">
          <div class="brand-block">
            <div class="brand-logo">TQ</div>
            <div class="brand-copy">
              <strong>THIÊN QUANG</strong>
              <span>SMARTTOOLS</span>
            </div>
          </div>
          <button class="icon-circle-btn" type="button" data-action="call" aria-label="Gọi / Zalo">
            <img src="${ASSETS.icons.phone}" alt="" />
          </button>
        </div>

        <section class="hero-banner">
          <div class="hero-copy">
            <div class="metric">2.000+<br /><span>sản phẩm</span></div>
            <ul>
              <li>50+ nhóm dụng cụ</li>
              <li>Xuất khẩu nhiều quốc gia</li>
            </ul>
          </div>
          <div class="hero-stage">
            <div class="hero-stage-inner">
              <img src="${ASSETS.heroBay}" alt="Bay xây dựng" />
            </div>
          </div>
          <div class="hero-dots">
            <span></span><span class="active"></span><span></span>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>Danh mục sản phẩm</h2>
          </div>
          <div class="category-row">
            ${categories
              .map(
                (category, index) => `
                  <button class="category-card ${index === 0 ? "active" : ""}" type="button" data-category="${category.id}">
                    <div class="category-icon-shell">
                      <img class="category-icon" src="${getAsset("categories", category.assetId)}" alt="${category.name}" />
                    </div>
                    <div class="category-name">${category.name}</div>
                    <div class="category-count">${category.count}</div>
                    ${index === 0 ? '<div class="category-accent"></div>' : ""}
                  </button>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>Nhóm sản phẩm chính</h2>
            <button class="section-action" type="button">Xem tất cả ›</button>
          </div>
          <div class="home-group-grid">
            ${productGroups
              .map(
                (group) => `
                  <button class="home-group-card" type="button" data-group="${group.id}">
                    <div class="home-group-stage">
                      <div class="home-group-stage-inner">
                        <img src="${getAsset("products", group.assetId)}" alt="${group.name}" />
                      </div>
                    </div>
                    <div class="home-group-title">${group.name}</div>
                    <div class="home-group-meta">
                      <span>${group.count}</span>
                      <span>›</span>
                    </div>
                  </button>
                `
              )
              .join("")}
          </div>
        </section>

        ${renderBottomNav("home")}
      </div>
    `;
  }

  function renderProductList() {
    const grid = filteredProducts();
    return `
      <div class="page product-list-page">
        ${renderHeaderStatus()}
        <div class="page-header">
          <div class="page-header-left">
            <button class="back-btn" type="button" data-action="back-home" aria-label="Quay lại">
              <img src="${ASSETS.icons.back}" alt="" />
            </button>
            <div>
              <div class="page-header-title">Bay xây dựng</div>
              <div class="page-header-subtitle">42 sản phẩm</div>
            </div>
          </div>
          <div class="header-actions">
            <button class="filter-btn" type="button" data-action="open-filter" aria-label="Mở bộ lọc">
              <img src="${ASSETS.icons.filter}" alt="" />
            </button>
          </div>
        </div>

        <div class="product-grid">
          ${grid
            .map(
              (product) => `
                <article class="product-card">
                  <div class="product-stage">
                    <div class="product-stage-inner">
                      <img src="${getAsset("products", product.assetId)}" alt="${product.name}" />
                    </div>
                  </div>
                  <div class="product-name">${product.name}</div>
                  <div class="product-code">${product.code}</div>
                  <div class="product-meta">
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <button class="add-btn ${isAdded(product.id) ? "added" : ""}" type="button" data-toggle-product="${product.id}">
                      <span class="icon-inline"><img src="${isAdded(product.id) ? ASSETS.icons.check : ASSETS.icons.plus}" alt="" /></span>
                      <span>Thêm</span>
                    </button>
                  </div>
                </article>
              `
            )
            .join("")}
        </div>

        <div class="toast ${totalQuoteItems() ? "" : "hidden"}">
          <span>✓ Đã thêm</span>
          <strong>${totalQuoteItems()} sản phẩm</strong>
        </div>

        ${renderBottomNav("quotes")}
        ${renderFilterSheet()}
      </div>
    `;
  }

  function renderFilterSheet() {
    return `
      <div class="sheet-overlay ${state.isFilterOpen ? "" : "hidden"}" data-overlay>
        <div class="filter-sheet" role="dialog" aria-label="Bộ lọc sản phẩm">
          <div class="sheet-handle"></div>
          <div class="sheet-head">
            <div class="sheet-title">Bộ lọc sản phẩm</div>
            <button class="sheet-close" type="button" data-action="close-filter" aria-label="Đóng bộ lọc">
              <img src="${ASSETS.icons.close}" alt="" />
            </button>
          </div>
          <div class="sheet-section-label">Loại bay</div>
          <div class="filter-options">
            ${filterOptions
              .map(
                (option) => `
                  <button class="filter-option ${state.draftFilter === option.id ? "active" : ""}" type="button" data-filter="${option.id}">
                    <span class="radio"></span>
                    <span>${option.label}</span>
                  </button>
                `
              )
              .join("")}
          </div>
          <div class="sheet-actions">
            <button class="sheet-btn secondary" type="button" data-action="reset-filter">Đặt lại</button>
            <button class="sheet-btn primary" type="button" data-action="apply-filter">Áp dụng</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderQuoteList() {
    const entries = quoteEntries();
    return `
      <div class="page quote-page">
        ${renderHeaderStatus()}
        <div class="page-header">
          <div class="page-header-left">
            <button class="back-btn" type="button" data-action="back-products" aria-label="Quay lại danh sách sản phẩm">
              <img src="${ASSETS.icons.back}" alt="" />
            </button>
            <div>
              <div class="page-header-title">Danh sách báo giá</div>
              <div class="page-header-subtitle">${totalQuoteItems()} sản phẩm</div>
            </div>
          </div>
        </div>

        <div class="product-rows">
          ${entries.length ? renderQuoteRows(entries) : renderQuoteEmptyState()}
        </div>

        ${entries.length ? renderSummaryCard() : ""}
        ${renderBottomNav("quotes")}
        ${renderQuotePreviewSheet()}
      </div>
    `;
  }

  function renderQuoteRows(entries) {
    return entries
      .map(
        ({ product, qty }) => `
          <article class="quote-row">
            <div class="quote-image-shell">
              <div class="quote-image-inner">
                <img src="${getAsset("products", product.assetId)}" alt="${product.name}" />
              </div>
            </div>
            <div class="quote-main">
              <div class="quote-title">${product.name}</div>
              <div class="quote-code">${product.code}</div>
              <div class="quote-price-row">
                <div class="quote-price">${formatPrice(product.price)}</div>
                <div class="quote-total-col">
                  <div class="quote-total-label">Thành tiền</div>
                  <div class="quote-total-value">${formatPrice(product.price * qty)}</div>
                </div>
              </div>
              <div class="quote-stepper-row">
                <div class="qty-stepper">
                  <button type="button" data-qty-minus="${product.id}" aria-label="Giảm số lượng"><img src="${ASSETS.icons.minus}" alt="" /></button>
                  <span class="qty-divider"></span>
                  <span class="qty-value">${qty}</span>
                  <span class="qty-divider"></span>
                  <button type="button" data-qty-plus="${product.id}" aria-label="Tăng số lượng"><img src="${ASSETS.icons.plus}" alt="" /></button>
                </div>
              </div>
            </div>
            <button class="quote-delete" type="button" data-delete="${product.id}">×</button>
          </article>
        `
      )
      .join("");
  }

  function renderQuoteEmptyState() {
    return `
      <section class="quote-empty">
        <div class="quote-empty-visual">
          <img src="${ASSETS.icons.list}" alt="" />
        </div>
        <div class="quote-empty-title">Chưa có sản phẩm nào</div>
        <div class="quote-empty-copy">
          Hãy thêm sản phẩm từ màn Danh sách sản phẩm để tạo yêu cầu báo giá đầu tiên.
        </div>
        <div class="quote-empty-actions">
          <button class="cta-primary" type="button" data-action="back-products">← Tới danh sách sản phẩm</button>
          <button class="cta-secondary" type="button" data-nav="home">⌂ Về trang chủ</button>
        </div>
      </section>
    `;
  }

  function renderSummaryCard() {
    return `
      <section class="summary-card">
          <div class="summary-top">
            <div>
              <div class="summary-title">Tổng cộng</div>
              <div class="summary-count">${totalQuoteItems()} sản phẩm</div>
            </div>
            <div class="summary-right">
              <div class="summary-subtotal-label">Tạm tính (tham khảo)</div>
              <div class="summary-total">${formatPrice(totalQuotePrice())}</div>
            </div>
          </div>
          <div class="cta-stack">
            <button class="cta-primary" type="button" data-action="preview-zalo"><img class="icon-inline" src="${ASSETS.icons.message}" alt="" /> Gửi yêu cầu báo giá qua Zalo</button>
            <button class="cta-secondary" type="button" data-action="back-products"><img class="icon-inline" src="${ASSETS.icons.back}" alt="" /> Tiếp tục xem sản phẩm</button>
          </div>
          <div style="margin-top: 12px;">
            <label for="customer-note" style="display:block;font-size:12px;color:#6e756f;margin-bottom:6px;">Ghi chú của khách</label>
            <textarea id="customer-note" data-note rows="3" style="width:100%;border:1px solid #e7ece8;border-radius:12px;padding:10px 12px;font:400 13px Inter, sans-serif;resize:none;color:#202220;">${state.note || ""}</textarea>
          </div>
        </section>
    `;
  }

  function renderQuotePreviewSheet() {
    if (!state.isPreviewOpen) return "";
    return `
      <div class="sheet-overlay" data-preview-overlay>
        <div class="modal-shell preview-sheet">
          <div class="sheet-handle"></div>
          <div class="sheet-head">
            <div class="sheet-title">Xem trước tin nhắn Zalo</div>
            <button class="sheet-close" type="button" data-action="close-preview" aria-label="Đóng xem trước">
              <img src="${ASSETS.icons.close}" alt="" />
            </button>
          </div>
          <div class="preview-copy">
            Đây là nội dung mẫu cố định sẽ được mở qua Zalo. Khách có thể chỉnh phần ghi chú trước khi gửi.
          </div>
          <div class="preview-box">${buildZaloMessage()}</div>
          <div class="sheet-actions">
            <button class="sheet-btn secondary" type="button" data-action="close-preview">Quay lại</button>
            <button class="sheet-btn primary" type="button" data-action="send-zalo-confirm">Mở Zalo</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderBottomNav(active) {
    return `
      <nav class="bottom-nav">
        <button class="nav-item ${active === "home" ? "active" : ""}" type="button" data-nav="home">
          <div class="nav-icon"><img src="${ASSETS.icons.home}" alt="" /></div>
          <div>Trang chủ</div>
        </button>
        <button class="nav-item ${active === "quotes" ? "active" : ""}" type="button" data-nav="quotes">
          <div class="nav-icon"><img src="${ASSETS.icons.list}" alt="" /></div>
          <div>Danh sách báo giá</div>
          ${totalQuoteItems() ? `<span class="nav-badge">${totalQuoteItems()}</span>` : ""}
        </button>
        <button class="nav-item zalo" type="button" data-action="send-zalo">
          <div class="nav-icon"><img src="${ASSETS.icons.chat}" alt="" /></div>
          <div>Gọi / Zalo</div>
        </button>
      </nav>
    `;
  }

  function render() {
    if (!root) return;
    if (state.currentScreen === "home") {
      root.innerHTML = renderHome();
    } else if (state.currentScreen === "product-list") {
      root.innerHTML = renderProductList();
    } else {
      root.innerHTML = renderQuoteList();
    }
    bindEvents();
  }

  function bindEvents() {
    root.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => openProductList(button.dataset.category, "bay-xay-dung"));
    });

    root.querySelectorAll("[data-group]").forEach((button) => {
      button.addEventListener("click", () => openProductList("xay-to", button.dataset.group));
    });

    root.querySelectorAll("[data-toggle-product]").forEach((button) => {
      button.addEventListener("click", () => toggleProduct(button.dataset.toggleProduct));
    });

    root.querySelectorAll("[data-qty-plus]").forEach((button) => {
      button.addEventListener("click", () => changeQty(button.dataset.qtyPlus, 1));
    });

    root.querySelectorAll("[data-qty-minus]").forEach((button) => {
      button.addEventListener("click", () => changeQty(button.dataset.qtyMinus, -1));
    });

    root.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", () => removeQuoteItem(button.dataset.delete));
    });

    root.querySelectorAll("[data-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.nav;
        if (target === "home") setScreen("home");
        if (target === "quotes") setScreen("quote-list");
      });
    });

    root.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        if (action === "back-home") setScreen("home");
        if (action === "back-products") setScreen("product-list");
        if (action === "open-filter") openFilter();
        if (action === "close-filter") closeFilter();
        if (action === "apply-filter") applyFilter();
        if (action === "reset-filter") resetFilter();
        if (action === "preview-zalo") openQuotePreview();
        if (action === "close-preview") closeQuotePreview();
        if (action === "send-zalo-confirm") {
          closeQuotePreview();
          openZaloQuote();
        }
        if (action === "send-zalo") openZaloQuote();
        if (action === "call") window.open("https://zalo.me", "_blank", "noopener");
      });
    });

    root.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => setDraftFilter(button.dataset.filter));
    });

    root.querySelectorAll("[data-overlay]").forEach((overlay) => {
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeFilter();
      });
    });

    root.querySelectorAll("[data-preview-overlay]").forEach((overlay) => {
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeQuotePreview();
      });
    });

    const note = root.querySelector("[data-note]");
    if (note) {
      note.addEventListener("input", (event) => {
        setNote(event.target.value);
      });
    }
  }

  render();
})();
