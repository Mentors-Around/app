// src/utils/cn.util.js
// Tiny classnames combiner — avoids pulling in clsx/tailwind-merge as a dep
// for a one-liner. Falsy values are dropped.
export const cn = (...classes) => classes.filter(Boolean).join(' ');
