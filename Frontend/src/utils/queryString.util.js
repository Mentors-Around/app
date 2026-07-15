// src/utils/queryString.util.js
// Builds clean query strings for paginated/filterable list endpoints,
// dropping empty/undefined values so axios params stay tidy.

export const buildParams = (params = {}) => {
  const clean = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    clean[key] = value;
  }
  return clean;
};

export const parsePageParams = (searchParams) => ({
  page: Number(searchParams.get('page')) || 1,
  limit: Number(searchParams.get('limit')) || 10,
  search: searchParams.get('search') || '',
});
