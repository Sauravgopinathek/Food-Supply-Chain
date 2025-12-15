// frontend/src/utils/buyer-history.js
// Simple localStorage-backed buyer history store

const keyFor = (batchId) => `ft_buyers_${batchId}`;

export const getBuyerHistory = (batchId) => {
  if (!batchId) return [];
  try {
    const raw = localStorage.getItem(keyFor(batchId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read buyer history', e);
    return [];
  }
};

export const addBuyerEntry = (batchId, entry) => {
  if (!batchId || !entry) return;
  const list = getBuyerHistory(batchId);
  const normalized = {
    address: entry.address || entry.account || entry.from || 'unknown',
    name: entry.name || '',
    note: entry.note || '',
    timestamp: entry.timestamp || Date.now()
  };
  list.unshift(normalized); // newest first
  try {
    localStorage.setItem(keyFor(batchId), JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save buyer history', e);
  }
  return list;
};

export const clearBuyerHistory = (batchId) => {
  try {
    localStorage.removeItem(keyFor(batchId));
  } catch (e) {
    console.warn('Failed to clear buyer history', e);
  }
};
