export const generateTransactionId = () => {
  // You can use any unique ID generation strategy, e.g., UUID
  return `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};
