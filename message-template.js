window.CATALOG_MESSAGE_TEMPLATE = {
  title: "YÊU CẦU BÁO GIÁ - THIÊN QUANG SMARTTOOLS",
  emptyNoteFallback: "(không có)",
  labels: {
    itemCount: "Số sản phẩm",
    productCode: "Mã SP",
    unitPrice: "Đơn giá",
    quantity: "Số lượng",
    lineTotal: "Thành tiền",
    subtotal: "Tạm tính tham khảo",
    customerNote: "Ghi chú khách"
  },
  build({ entries, totalItems, totalPrice, note, formatPrice }) {
    const lines = [
      this.title,
      "",
      `${this.labels.itemCount}: ${totalItems}`,
      ""
    ];

    entries.forEach((entry, index) => {
      lines.push(
        `${index + 1}. ${entry.product.name}`,
        `- ${this.labels.productCode}: ${entry.product.id}`,
        `- ${this.labels.unitPrice}: ${formatPrice(entry.product.price)}`,
        `- ${this.labels.quantity}: ${entry.qty}`,
        `- ${this.labels.lineTotal}: ${formatPrice(entry.product.price * entry.qty)}`,
        ""
      );
    });

    lines.push(`${this.labels.subtotal}: ${formatPrice(totalPrice)}`);
    lines.push("");
    lines.push(`${this.labels.customerNote}: ${note || this.emptyNoteFallback}`);
    return lines.join("\n");
  }
};
