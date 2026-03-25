import { describe, it, expect } from 'vitest';
import { calculateInvoice, calculateTotal, calculateTax } from '../../src/accounting.js';

describe('Accounting Logic (Unit Tests)', () => {
  it('should ensure that 2 + 2 is always 4 using calculateTotal', () => {
    const items = [
      { price: 2.00, quantity: 1 },
      { price: 2.00, quantity: 1 }
    ];
    expect(calculateTotal(items)).toBe(4.00);
  });

  it('should handle decimals correctly in tax calculations', () => {
    const amount = 100.00;
    const taxRate = 0.16; // 16% IVA
    expect(calculateTax(amount, taxRate)).toBe(16.00);
    
    // Test with complex decimals
    const complexAmount = 33.33;
    const complexTax = calculateTax(complexAmount, taxRate);
    // 33.33 * 0.16 = 5.3328 -> Should be 5.33
    expect(complexTax).toBe(5.33);
  });

  it('should calculate full invoice correctly', () => {
    const items = [
      { price: 10.50, quantity: 2 }, // 21.00
      { price: 5.25, quantity: 1 }  // 5.25
    ];
    // Subtotal: 26.25
    // Tax (16%): 4.20
    // Total: 30.45
    const invoice = calculateInvoice(items);
    expect(invoice.subtotal).toBe(26.25);
    expect(invoice.tax).toBe(4.20);
    expect(invoice.total).toBe(30.45);
  });
});
