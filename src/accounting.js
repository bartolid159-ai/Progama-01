export function calculateTotal(items) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return Number(subtotal.toFixed(2));
}

export function calculateTax(amount, taxRate = 0.16) {
  const tax = amount * taxRate;
  return Number(tax.toFixed(2));
}

export function calculateInvoice(items, taxRate = 0.16) {
  const subtotal = calculateTotal(items);
  const tax = calculateTax(subtotal, taxRate);
  return {
    subtotal,
    tax,
    total: Number((subtotal + tax).toFixed(2))
  };
}