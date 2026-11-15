export function success(res, data, status = 200, message) {
  return res.status(status).json({ success: true, ...(message && { message }), data });
}

export async function list(res, model, filter, query, options = {}) {
  const { page = 1, limit = 20 } = query;
  let cursor = model.find(filter).sort(options.sort || { createdAt: -1 })
    .skip((page - 1) * limit).limit(limit);
  if (options.populate) cursor = cursor.populate(options.populate);
  const [data, total] = await Promise.all([cursor.exec(), model.countDocuments(filter)]);
  return res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
