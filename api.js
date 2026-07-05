window.CATALOG_API = {
  async delay(ms = 80) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  async getHomeData(data) {
    await this.delay();
    return {
      categories: data.categories,
      productGroups: data.productGroups
    };
  },

  async getProductListData(data, service, params) {
    await this.delay();
    const products = service.filteredProducts(
      data.products,
      params.selectedCategory,
      params.selectedGroup,
      params.activeFilter
    );
    const currentGroup = data.productGroups.find((group) => group.id === params.selectedGroup);

    return {
      products,
      activeFilter: params.activeFilter,
      activeFilterLabel: service.currentFilterLabel(data.filterOptions, params.activeFilter),
      totalCountLabel:
        params.activeFilter === "all"
          ? currentGroup?.count || `${products.length} sản phẩm`
          : `${products.length} sản phẩm phù hợp`
    };
  },

  async getQuoteData(data, service, state) {
    await this.delay();
    const entries = service.quoteEntries(data.products, state.quote);
    return {
      entries,
      totalItems: service.totalQuoteItems(entries),
      totalPrice: service.totalQuotePrice(entries)
    };
  }
};
