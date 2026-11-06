/** ₹ amounts in Indian digit grouping (₹1,20,000). */
export const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`
