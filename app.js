(function () {
  const {
    storageKey: STORAGE_KEY,
    heroBanners,
    categories,
    productGroups,
    products,
    filterOptions,
    groupFilters
  } = window.CATALOG_DATA;
  const ASSETS = window.CATALOG_ASSETS;
  const STORAGE = window.CATALOG_STORAGE;
  const SERVICE = window.CATALOG_SERVICE;
  const API = window.CATALOG_API;
  const ANALYTICS = window.CATALOG_ANALYTICS;
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
  let addToastTimer = null;
  let isAddToastVisible = false;
  let lastTrackedScreenKey = "";
  let hasTrackedAppOpen = false;

  function getScreenFromHash() {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash === "group-list" || hash === "product-list" || hash === "quote-list") return hash;
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

  function trackEvent(eventName, params = {}) {
    if (!ANALYTICS) return false;
    return ANALYTICS.track(eventName, params);
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

  function hideAddToast() {
    if (addToastTimer) {
      window.clearTimeout(addToastTimer);
      addToastTimer = null;
    }
    if (!isAddToastVisible) return;
    isAddToastVisible = false;
    if (state.currentScreen === "product-list") {
      render();
    }
  }

  function showAddToast() {
    if (addToastTimer) {
      window.clearTimeout(addToastTimer);
    }
    isAddToastVisible = true;
    addToastTimer = window.setTimeout(() => {
      addToastTimer = null;
      hideAddToast();
    }, 2200);
  }

  function toggleProduct(productId) {
    const product = getProductById(productId);
    if (state.quote[productId]) {
      delete state.quote[productId];
      trackEvent("remove_from_quote", {
        product_id: product?.id,
        product_name: product?.name,
        category_id: product?.category,
        group_id: product?.group,
        price: product?.price,
        quote_items: totalQuoteItems()
      });
      hideAddToast();
    } else {
      state.quote[productId] = 1;
      trackEvent("add_to_quote", {
        product_id: product?.id,
        product_name: product?.name,
        category_id: product?.category,
        group_id: product?.group,
        price: product?.price,
        quote_items: totalQuoteItems()
      });
      showAddToast();
    }
    saveState();
    render();
  }

  function changeQty(productId, delta) {
    const product = getProductById(productId);
    const current = state.quote[productId] || 1;
    const next = current + delta;
    if (next < 1) return;
    state.quote[productId] = next;
    trackEvent("change_quote_quantity", {
      product_id: product?.id,
      product_name: product?.name,
      category_id: product?.category,
      group_id: product?.group,
      quantity: next
    });
    saveState();
    render();
  }

  function removeQuoteItem(productId) {
    const product = getProductById(productId);
    delete state.quote[productId];
    trackEvent("remove_from_quote", {
      product_id: product?.id,
      product_name: product?.name,
      category_id: product?.category,
      group_id: product?.group,
      price: product?.price,
      source: "quote_list",
      quote_items: totalQuoteItems()
    });
    saveState();
    render();
  }

  function filteredProducts() {
    return SERVICE.filteredProducts(products, state.selectedCategory, state.selectedGroup, state.activeFilter);
  }

  function currentFilterLabel() {
    return SERVICE.currentFilterLabel(availableFilterOptions(), state.activeFilter);
  }

  function availableFilterOptions() {
    const groupFilter = groupFilters[state.selectedGroup];
    if (groupFilter) return groupFilter.options;

    if (state.selectedGroup === "bay-xay-dung") {
      return filterOptions;
    }

    const availableTags = new Set(
      products
        .filter((product) => product.category === state.selectedCategory && product.group === state.selectedGroup)
        .flatMap((product) => product.filterTags || [product.subtype])
        .filter(Boolean)
    );

    return filterOptions.filter((option) => option.id === "all" || availableTags.has(option.id));
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
    trackEvent("send_quote_to_zalo", {
      quote_items: totalQuoteItems(),
      quote_value: totalQuotePrice()
    });
    const message = encodeURIComponent(buildZaloMessage());
    window.open(`https://zalo.me/share?text=${message}`, "_blank", "noopener");
  }

  function openQuotePreview() {
    trackEvent("preview_quote_message", {
      quote_items: totalQuoteItems(),
      quote_value: totalQuotePrice()
    });
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
    const category = getCategoryById(categoryId);
    const group = getGroupById(groupId);
    const sourceScreen = state.currentScreen;
    state.selectedCategory = categoryId;
    state.selectedGroup = groupId;
    state.activeFilter = "all";
    state.draftFilter = "all";
    state.isFilterOpen = false;
    state.currentScreen = "product-list";
    trackEvent("open_product_group", {
      category_id: category?.id,
      category_name: category?.name,
      group_id: group?.id,
      group_name: group?.name,
      source: sourceScreen === "group-list" ? "group_list" : "home"
    });
    saveState();
    syncHash("product-list");
    await render();
  }

  async function selectHomeCategory(categoryId) {
    const category = getCategoryById(categoryId);
    state.selectedCategory = categoryId;
    state.selectedGroup = getDefaultGroupId(categoryId);
    trackEvent("select_category", {
      category_id: category?.id,
      category_name: category?.name,
      source: "home"
    });
    saveState();
    await render();
  }

  async function openGroupList(categoryId) {
    const category = getCategoryById(categoryId);
    state.selectedCategory = categoryId;
    state.selectedGroup = getDefaultGroupId(categoryId);
    state.currentScreen = "group-list";
    trackEvent("view_all_groups", {
      category_id: category?.id,
      category_name: category?.name,
      group_count: productGroups.filter((group) => group.category === categoryId).length
    });
    saveState();
    syncHash("group-list");
    await render();
  }

  function getGroupById(groupId) {
    return productGroups.find((group) => group.id === groupId) || null;
  }

  function getCategoryById(categoryId) {
    return categories.find((category) => category.id === categoryId) || null;
  }

  function getProductById(productId) {
    return products.find((product) => product.id === productId) || null;
  }

  function getDefaultGroupId(categoryId) {
    const match = productGroups.find((group) => group.category === categoryId);
    return match ? match.id : productGroups[0]?.id || "bay-xay-dung";
  }

  function buildScreenMeta() {
    const category = getCategoryById(state.selectedCategory);
    const group = getGroupById(state.selectedGroup);

    if (state.currentScreen === "home") {
      return {
        screenName: "home",
        screenKey: `home:${state.selectedCategory}`,
        params: {
          category_id: category?.id,
          category_name: category?.name
        }
      };
    }

    if (state.currentScreen === "group-list") {
      return {
        screenName: "group_list",
        screenKey: `group-list:${state.selectedCategory}`,
        params: {
          category_id: category?.id,
          category_name: category?.name,
          group_count: productGroups.filter((item) => item.category === state.selectedCategory).length
        }
      };
    }

    if (state.currentScreen === "product-list") {
      return {
        screenName: "product_list",
        screenKey: `product-list:${state.selectedCategory}:${state.selectedGroup}`,
        params: {
          category_id: category?.id,
          category_name: category?.name,
          group_id: group?.id,
          group_name: group?.name
        }
      };
    }

    return {
      screenName: "quote_list",
      screenKey: `quote-list:${totalQuoteItems()}`,
      params: {
        quote_items: totalQuoteItems(),
        quote_value: totalQuotePrice()
      }
    };
  }

  function trackCurrentScreen() {
    if (!ANALYTICS?.isEnabled()) return;
    if (!hasTrackedAppOpen) {
      hasTrackedAppOpen = true;
      trackEvent("app_open", {
        entry_screen: state.currentScreen
      });
    }
    const meta = buildScreenMeta();
    if (meta.screenKey === lastTrackedScreenKey) return;
    lastTrackedScreenKey = meta.screenKey;
    ANALYTICS.trackScreen(meta.screenName, meta.params);
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
    trackEvent("apply_product_filter", {
      category_id: state.selectedCategory,
      group_id: state.selectedGroup,
      filter_id: state.activeFilter
    });
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
    trackEvent("clear_product_filter", {
      category_id: state.selectedCategory,
      group_id: state.selectedGroup
    });
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
    return "";
  }

  async function renderHome() {
    const homeData = await API.getHomeData(window.CATALOG_DATA);
    const visibleGroups = homeData.productGroups.filter((group) => group.category === state.selectedCategory);
    const hasMoreThanTwoGroups = visibleGroups.length > 2;
    return `
      <div class="page home-page">
        ${renderHeaderStatus()}
        <div class="home-header">
          <div class="brand-block">
            <div class="brand-logo">
              <img src="${ASSETS.brandLogo}" alt="Thiên Quang Smarttools" />
            </div>
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
                (category) => `
                  <button class="category-card ${category.id === state.selectedCategory ? "active" : ""}" type="button" data-category="${category.id}">
                    <div class="category-icon-shell">
                      <img class="category-icon" src="${getAsset("categories", category.assetId)}" alt="${category.name}" />
                    </div>
                    <div class="category-name">${category.name}</div>
                    <div class="category-count">${category.count}</div>
                    ${category.id === state.selectedCategory ? '<div class="category-accent"></div>' : ""}
                  </button>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>Nhóm sản phẩm chính</h2>
            ${
              hasMoreThanTwoGroups
                ? `<button class="section-action" type="button" data-action="open-group-list">Xem tất cả ›</button>`
                : ""
            }
          </div>
          ${
            visibleGroups.length
              ? `
          <div class="home-group-strip">
            ${visibleGroups
              .map(
                (group) => `
                  <button class="home-group-card" type="button" data-group="${group.id}" data-group-category="${group.category || "xay-to"}">
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
          `
              : `
          <div class="home-group-empty">Danh mục này đang cập nhật nhóm sản phẩm chính.</div>
          `
          }
        </section>

        ${renderBottomNav("home")}
      </div>
    `;
  }

  async function renderGroupList() {
    const currentCategory = getCategoryById(state.selectedCategory);
    const visibleGroups = productGroups.filter((group) => group.category === state.selectedCategory);
    return `
      <div class="page group-browser-page">
        ${renderHeaderStatus()}
        <div class="page-header">
          <div class="page-header-left">
            <button class="back-btn" type="button" data-action="back-home" aria-label="Quay lại">
              <img src="${ASSETS.icons.back}" alt="" />
            </button>
            <div>
              <div class="page-header-title">${currentCategory ? currentCategory.name : "Nhóm sản phẩm"}</div>
              <div class="page-header-subtitle">${visibleGroups.length}+ nhóm sản phẩm chính</div>
            </div>
          </div>
        </div>

        <div class="group-browser-grid">
          ${visibleGroups
            .map(
              (group) => `
                <button class="home-group-card group-browser-card" type="button" data-group="${group.id}" data-group-category="${group.category || "xay-to"}">
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

        ${renderBottomNav("home")}
      </div>
    `;
  }

  async function renderProductList() {
    const productFilterOptions = availableFilterOptions();
    const listData = await API.getProductListData(window.CATALOG_DATA, SERVICE, {
      selectedCategory: state.selectedCategory,
      selectedGroup: state.selectedGroup,
      activeFilter: state.activeFilter,
      filterOptions: productFilterOptions
    });
    const grid = listData.products;
    const currentGroup = getGroupById(state.selectedGroup);
    return `
      <div class="page product-list-page">
        ${renderHeaderStatus()}
        <div class="page-header">
          <div class="page-header-left">
            <button class="back-btn" type="button" data-action="back-home" aria-label="Quay lại">
              <img src="${ASSETS.icons.back}" alt="" />
            </button>
            <div>
              <div class="page-header-title">${currentGroup ? currentGroup.name : "Danh sách sản phẩm"}</div>
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

        <div class="toast ${isAddToastVisible && totalQuoteItems() ? "" : "hidden"}">
          <span>✓ Đã thêm</span>
          <strong>${totalQuoteItems()} sản phẩm</strong>
        </div>

        ${renderBottomNav("quotes")}
        ${renderFilterSheet()}
      </div>
    `;
  }

  function renderFilterSheet() {
    const groupFilter = groupFilters[state.selectedGroup];
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
          <div class="sheet-section-label">${groupFilter ? groupFilter.label : "Loại sản phẩm"}</div>
          <div class="filter-options">
            ${availableFilterOptions()
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
              <div class="quote-meta-row">
                <div class="quote-meta-code">${product.code}</div>
                <div class="quote-meta-label-fixed">Th&#224;nh ti&#7873;n</div>
                <div class="quote-meta-label">ThÃ nh tiá»n</div>
              </div>
              <div class="quote-amount-row">
                <div class="quote-amount-price">${SERVICE.formatPrice(product.price)}</div>
                <div class="quote-amount-total">${SERVICE.formatPrice(product.price * qty)}</div>
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
    } else if (state.currentScreen === "group-list") {
      root.innerHTML = await renderGroupList();
    } else if (state.currentScreen === "product-list") {
      root.innerHTML = await renderProductList();
    } else {
      root.innerHTML = await renderQuoteList();
    }
    state.isLoading = false;
    bindEvents();
    syncHeroAutoplay();
    trackCurrentScreen();
  }

  function bindEvents() {
    bindHeroDots();

    root.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => void selectHomeCategory(button.dataset.category));
    });

    root.querySelectorAll("[data-group]").forEach((button) => {
      button.addEventListener("click", () =>
        void openProductList(button.dataset.groupCategory || "xay-to", button.dataset.group)
      );
    });

    root.querySelectorAll('[data-action="open-group-list"]').forEach((button) => {
      button.addEventListener("click", () => void openGroupList(state.selectedCategory));
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
        if (action === "call") {
          trackEvent("tap_contact_cta", { channel: "zalo" });
          window.open("https://zalo.me", "_blank", "noopener");
        }
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
    hideAddToast();
  });

  void render();
})();
