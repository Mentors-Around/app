// src/utils/date.util.js

export const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export const formatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

/** "3 hours ago", "in 2 days" */
export const timeAgo = (isoString) => {
  if (!isoString) return '';
  const diffMs = new Date(isoString).getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);

  const units = [
    ['year', 31536000], ['month', 2592000], ['day', 86400],
    ['hour', 3600], ['minute', 60], ['second', 1],
  ];
  for (const [unit, secs] of units) {
    if (abs >= secs || unit === 'second') {
      const value = Math.round(diffSec / secs);
      return new Intl.RelativeTimeFormat('en-IN', { numeric: 'auto' }).format(value, unit);
    }
  }
  return '';
};

/** Countdown timer text + urgency flag, e.g. for query/payment deadlines */
export const getCountdown = (deadlineIso) => {
  if (!deadlineIso) return { expired: true, isUrgent: false, text: 'No deadline' };
  const deadline = new Date(deadlineIso).getTime();
  const now = Date.now();
  if (now >= deadline) return { expired: true, isUrgent: false, text: 'Expired' };

  const diffMs = deadline - now;
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  return {
    expired: false,
    isUrgent: hours < 2,
    text: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
  };
};

export const isFuture = (isoString) => !!isoString && new Date(isoString).getTime() > Date.now();
