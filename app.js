(function () {
  const {
    storageKey: STORAGE_KEY,
    heroBanners,
    categories,
    productGroups,
    products,
    filterOptions
  } = window.CATALOG_DATA;
  const ASSETS = window.CATALOG_ASSETS;
  const STORAGE = window.CATALOG_STORAGE;
  const SERVICE = window.CATALOG_SERVICE;
  const API = window.CATALOG_API;
  const MESSAGE_TEMPLATE = window.CATALOG_MESSAGE_TEMPLATE;
  const INITIAL_STATE = {
    currentScreen: "home",
    selectedCategory: "xay-to",
    selectedGroup: "bay-xay-dung",
    activeFilter: "all",
    draftFilter: "all",
    isFilterOpen: false,
    isPreviewOpen: false,
    isLoading: false,
    heroIndex: 0,
    note: "",
    quote: {}
  };
  const state = STORAGE.load(STORAGE_KEY, INITIAL_STATE, getScreenFromHash);
  const root = document.getElementById("screen-root");
  let heroTimer = null;

  function getScreenFromHash() {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash === "product-list" || hash === "quote-list") return hash;
    return "home";
  }

  function syncHash(screen) {
    const target = screen === "home" ? "#home" : `#${screen}`;
    if (window.location.hash !== target) {
      history.replaceState(null, "", target);
    }
  }

  function saveState() {
    STORAGE.save(STORAGE_KEY, state);
  }

  function normalizedHeroIndex(index) {
    if (!heroBanners.length) return 0;
    const safeIndex = Number.isInteger(index) ? index : 0;
    return ((safeIndex % heroBanners.length) + heroBanners.length) % heroBanners.length;
  }

  state.heroIndex = normalizedHeroIndex(state.heroIndex);

  function setHeroIndex(index) {
    state.heroIndex = normalizedHeroIndex(index);
    saveState();
    if (state.currentScreen === "home" && refreshHeroBanner()) return;
    render();
  }

  function advanceHero() {
    setHeroIndex(state.heroIndex + 1);
  }

  function stopHeroAutoplay() {
    if (!heroTimer) return;
    window.clearInterval(heroTimer);
    heroTimer = null;
  }

  function syncHeroAutoplay() {
    stopHeroAutoplay();
    if (state.currentScreen !== "home" || heroBanners.length < 2) return;
    heroTimer = window.setInterval(() => {
      advanceHero();
    }, 4200);
  }

  function quoteEntries() {
    return SERVICE.quoteEntries(products, state.quote);
  }

  function totalQuoteItems() {
    return SERVICE.totalQuoteItems(quoteEntries());
  }

  function totalQuotePrice() {
    return SERVICE.totalQuotePrice(quoteEntries());
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
    return SERVICE.filteredProducts(products, state.selectedCategory, state.selectedGroup, state.activeFilter);
  }

  function currentFilterLabel() {
    return SERVICE.currentFilterLabel(filterOptions, state.activeFilter);
  }

  function buildZaloMessage() {
    return SERVICE.buildZaloMessage(
      MESSAGE_TEMPLATE,
      quoteEntries(),
      totalQuoteItems(),
      totalQuotePrice(),
      state.note
    );
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

  function renderHeroBanner() {
    const activeHero = heroBanners[normalizedHeroIndex(state.heroIndex)] || heroBanners[0];
    return `
      <section class="hero-banner">
        <div class="hero-copy">
          <div class="metric">${activeHero.metric}<br /><span>${activeHero.metricAccent}</span></div>
          <ul>
            ${activeHero.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
          </ul>
        </div>
        <div class="hero-stage">
          <div class="hero-stage-inner">
            <img src="${getAsset("products", activeHero.assetId)}" alt="${activeHero.imageAlt}" />
          </div>
        </div>
        <div class="hero-dots">
          ${heroBanners
            .map(
              (banner, index) => `
                <button
                  class="hero-dot ${index === normalizedHeroIndex(state.heroIndex) ? "active" : ""}"
                  type="button"
                  data-hero-dot="${index}"
                  aria-label="Chuyển banner ${index + 1}"
                ></button>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function bindHeroDots() {
    root.querySelectorAll("[data-hero-dot]").forEach((button) => {
      button.addEventListener("click", () => setHeroIndex(Number(button.dataset.heroDot)));
    });
  }

  function refreshHeroBanner() {
    const banner = root.querySelector(".hero-banner");
    if (!banner) return false;
    banner.outerHTML = renderHeroBanner();
    bindHeroDots();
    return true;
  }

  async function setScreen(screen) {
    state.currentScreen = screen;
    saveState();
    syncHash(screen);
    await render();
  }

  async function openProductList(categoryId, groupId) {
    state.selectedCategory = categoryId;
    state.selectedGroup = groupId;
    state.currentScreen = "product-list";
    saveState();
    syncHash("product-list");
    await render();
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

  function clearAppliedFilter() {
    state.activeFilter = "all";
    state.draftFilter = "all";
    saveState();
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

  async function renderHome() {
    const homeData = await API.getHomeData(window.CATALOG_DATA);
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

        ${renderHeroBanner()}

        <section class="section">
          <div class="section-head">
            <h2>Danh mục sản phẩm</h2>
          </div>
          <div class="category-row">
            ${homeData.categories
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
            ${homeData.productGroups
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

  async function renderProductList() {
    const listData = await API.getProductListData(window.CATALOG_DATA, SERVICE, {
      selectedCategory: state.selectedCategory,
      selectedGroup: state.selectedGroup,
      activeFilter: state.activeFilter
    });
    const grid = listData.products;
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
              <div class="page-header-subtitle">${listData.totalCountLabel}</div>
            </div>
          </div>
          <div class="header-actions">
            <button class="filter-btn" type="button" data-action="open-filter" aria-label="Mở bộ lọc">
              <img src="${ASSETS.icons.filter}" alt="" />
            </button>
          </div>
        </div>

        ${state.activeFilter !== "all" ? `
          <div class="applied-filter-bar">
            <span class="applied-filter-label">Đang lọc:</span>
            <button class="applied-filter-chip" type="button" data-action="clear-filter">
              <span>${listData.activeFilterLabel}</span>
              <span>✕</span>
            </button>
          </div>
        ` : ""}

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
                    <div class="product-price">${SERVICE.formatPrice(product.price)}</div>
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

  async function renderQuoteList() {
    const quoteData = await API.getQuoteData(window.CATALOG_DATA, SERVICE, state);
    const entries = quoteData.entries;
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
              <div class="page-header-subtitle">${quoteData.totalItems} sản phẩm</div>
            </div>
          </div>
        </div>

        <div class="product-rows">
          ${entries.length ? renderQuoteRows(entries) : renderQuoteEmptyState()}
        </div>

        ${entries.length ? renderSummaryCard(quoteData.totalItems, quoteData.totalPrice) : ""}
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
              <button class="quote-delete" type="button" data-delete="${product.id}">×</button>
              <div class="quote-heading">
                <div class="quote-title">${product.name}</div>
                <div class="quote-code">${product.code}</div>
              </div>
              <div class="quote-total-col">
                <div class="quote-total-label">Thành tiền</div>
                <div class="quote-total-value">${SERVICE.formatPrice(product.price * qty)}</div>
              </div>
              <div class="quote-price">${SERVICE.formatPrice(product.price)}</div>
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

  function renderSummaryCard(totalItems, totalPrice) {
    return `
      <section class="summary-card">
          <div class="summary-top">
            <div>
              <div class="summary-title">Tổng cộng</div>
              <div class="summary-count">${totalItems} sản phẩm</div>
            </div>
            <div class="summary-right">
              <div class="summary-subtotal-label">Tạm tính (tham khảo)</div>
              <div class="summary-total">${SERVICE.formatPrice(totalPrice)}</div>
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

  async function render() {
    if (!root) return;
    syncHash(state.currentScreen);
    state.isLoading = true;
    root.innerHTML = `<div class="page loading-page"><div class="loading-shell"><div class="loading-dot"></div><p>Đang tải giao diện...</p></div></div>`;
    if (state.currentScreen === "home") {
      root.innerHTML = await renderHome();
    } else if (state.currentScreen === "product-list") {
      root.innerHTML = await renderProductList();
    } else {
      root.innerHTML = await renderQuoteList();
    }
    state.isLoading = false;
    bindEvents();
    syncHeroAutoplay();
  }

  function bindEvents() {
    bindHeroDots();

    root.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => void openProductList(button.dataset.category, "bay-xay-dung"));
    });

    root.querySelectorAll("[data-group]").forEach((button) => {
      button.addEventListener("click", () => void openProductList("xay-to", button.dataset.group));
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
        if (target === "home") void setScreen("home");
        if (target === "quotes") void setScreen("quote-list");
      });
    });

    root.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        if (action === "back-home") void setScreen("home");
        if (action === "back-products") void setScreen("product-list");
        if (action === "open-filter") openFilter();
        if (action === "close-filter") closeFilter();
        if (action === "apply-filter") applyFilter();
        if (action === "reset-filter") resetFilter();
        if (action === "clear-filter") clearAppliedFilter();
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

  window.addEventListener("hashchange", () => {
    const next = getScreenFromHash();
    if (next !== state.currentScreen) {
      state.currentScreen = next;
      saveState();
      void render();
    }
  });

  window.addEventListener("beforeunload", () => {
    stopHeroAutoplay();
  });

  void render();
})();
