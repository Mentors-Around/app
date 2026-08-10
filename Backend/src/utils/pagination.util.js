import { PAGINATION } from "../constants/app.constants.js";

/**
 * Parse page & limit from query params with safe bounds.
 */
export const parsePagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build standard paginated response shape from mongoose-paginate-v2 result.
 */
export const buildPaginatedResponse = (paginateResult) => ({
  results: paginateResult.docs ?? paginateResult.results,
  pagination: {
    total: paginateResult.totalDocs ?? paginateResult.total,
    pages: paginateResult.totalPages ?? paginateResult.pages,
    page: paginateResult.page,
    limit: paginateResult.limit,
    next: paginateResult.nextPage ?? paginateResult.next ?? null,
    prev: paginateResult.prevPage ?? paginateResult.prev ?? null,
    hasPrev: paginateResult.hasPrevPage ?? false,
    hasNext: paginateResult.hasNextPage ?? false,
  },
});

/**
 * Build paginated response from a raw mongoose count + docs query.
 */
export const buildManualPagination = ({ docs, total, page, limit }) => {
  const pages = Math.ceil(total / limit);
  return {
    results: docs,
    pagination: {
      total,
      pages,
      page,
      limit,
      next: page < pages ? page + 1 : null,
      prev: page > 1 ? page - 1 : null,
      hasPrev: page > 1,
      hasNext: page < pages,
    },
  };
};

/**
 * Mongoose-paginate-v2 customLabels to normalize field names.
 */
export const defaultPaginateOptions = {
  lean: true,
  leanWithId: true,
  customLabels: {
    docs: "results",
    totalDocs: "total",
    totalPages: "pages",
    nextPage: "next",
    prevPage: "prev",
    pagingCounter: "fromIndex",
    hasPrevPage: "hasPrev",
    hasNextPage: "hasNext",
  },
};
