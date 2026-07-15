// src/utils/format.util.js

export const formatCurrency = (amountInRupees, { showSign = false } = {}) => {
  const value = Number(amountInRupees) || 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
  if (!showSign) return formatted;
  return value < 0 ? `-${formatted}` : `+${formatted}`;
};

export const formatNumber = (n) => new Intl.NumberFormat('en-IN').format(Number(n) || 0);

export const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const truncate = (str = '', maxLen = 100) =>
  str.length > maxLen ? `${str.slice(0, maxLen).trimEnd()}…` : str;

export const capitalize = (str = '') => str.charAt(0).toUpperCase() + str.slice(1);

/** 'query_auto_expired' -> 'Query auto expired' */
export const humanizeEnum = (value = '') =>
  capitalize(String(value).replace(/_/g, ' '));

export const formatPhone = (phone = '') => {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return phone;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
};

export const formatFileSize = (bytes = 0) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};
