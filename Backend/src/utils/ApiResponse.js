function decoratePagination(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const arrayField = obj.results || obj.docs || obj.items;
  if (Array.isArray(arrayField)) {
    if (!obj.results) obj.results = arrayField;
    if (!obj.docs) obj.docs = arrayField;
    if (!obj.items) obj.items = arrayField;

    const totalCount = obj.total !== undefined ? obj.total : (obj.totalDocs !== undefined ? obj.totalDocs : undefined);
    if (totalCount !== undefined) {
      obj.total = totalCount;
      obj.totalDocs = totalCount;
    }

    const pagesCount = obj.pages !== undefined ? obj.pages : (obj.totalPages !== undefined ? obj.totalPages : undefined);
    if (pagesCount !== undefined) {
      obj.pages = pagesCount;
      obj.totalPages = pagesCount;
    }
  }

  if (obj.pagination && typeof obj.pagination === 'object') {
    const p = obj.pagination;
    const totalCount = p.total !== undefined ? p.total : (p.totalDocs !== undefined ? p.totalDocs : undefined);
    if (totalCount !== undefined) {
      p.total = totalCount;
      p.totalDocs = totalCount;
    }

    const pagesCount = p.pages !== undefined ? p.pages : (p.totalPages !== undefined ? p.totalPages : undefined);
    if (pagesCount !== undefined) {
      p.pages = pagesCount;
      p.totalPages = pagesCount;
    }
  }

  return obj;
}

class ApiResponse {
  constructor(statusCode, data, message = "Success", meta = null) {
    this.statusCode = statusCode;
    this.data = decoratePagination(data);
    this.message = message;
    this.success = statusCode < 400;
    if (meta) this.meta = meta;
  }

  static ok(data, message = "Success", meta = null) {
    return new ApiResponse(200, data, message, meta);
  }

  static created(data, message = "Created successfully") {
    return new ApiResponse(201, data, message);
  }

  static noContent() {
    return new ApiResponse(204, null, "No content");
  }
}

export default ApiResponse;
