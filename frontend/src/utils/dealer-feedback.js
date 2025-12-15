// Simple localStorage-backed dealer feedback store
const keyFor = (address) => `ft_dealer_reviews_${String(address || '').toLowerCase()}`;

export const getDealerReviews = (address) => {
  if (!address) return [];
  try {
    const raw = localStorage.getItem(keyFor(address));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read dealer reviews', e);
    return [];
  }
};

export const addDealerReview = (address, review) => {
  if (!address || !review) return [];
  const list = getDealerReviews(address);
  const normalized = {
    from: review.from || 'anonymous',
    rating: Number(review.rating) || 0,
    comment: review.comment || '',
    timestamp: review.timestamp || Date.now()
  };
  list.unshift(normalized);
  try {
    localStorage.setItem(keyFor(address), JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save dealer review', e);
  }
  return list;
};

export const clearDealerReviews = (address) => {
  try {
    localStorage.removeItem(keyFor(address));
  } catch (e) {
    console.warn('Failed to clear dealer reviews', e);
  }
};
