window.CATALOG_SERVICE = {
  formatPrice(value) {
    return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
  },

  quoteEntries(products, quote) {
    return Object.entries(quote)
      .map(([id, qty]) => {
        const product = products.find((item) => item.id === id);
        return product && qty > 0 ? { product, qty } : null;
      })
      .filter(Boolean);
  },

  totalQuoteItems(entries) {
    return entries.reduce((sum, entry) => sum + entry.qty, 0);
  },

  totalQuotePrice(entries) {
    return entries.reduce((sum, entry) => sum + entry.product.price * entry.qty, 0);
  },

  filteredProducts(products, selectedCategory, selectedGroup, activeFilter) {
    return products
      .filter((product) => {
        const categoryMatch = product.category === selectedCategory;
        const groupMatch = product.group === selectedGroup;
        const filterMatch = activeFilter === "all" ? true : product.subtype === activeFilter;
        return categoryMatch && groupMatch && filterMatch;
      })
      .slice(0, 6);
  },

  currentFilterLabel(filterOptions, activeFilter) {
    const match = filterOptions.find((option) => option.id === activeFilter);
    return match ? match.label : "Tất cả";
  },

  buildZaloMessage(template, entries, totalItems, totalPrice, note) {
    return template.build({
      entries,
      totalItems,
      totalPrice,
      note,
      formatPrice: this.formatPrice
    });
  }
};
