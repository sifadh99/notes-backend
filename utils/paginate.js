module.exports = (q) => {
  const page = Math.max(parseInt(q.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};