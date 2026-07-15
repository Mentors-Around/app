const SIZES = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' };

const Spinner = ({ size = 'md', className = '' }) => (
  <span
    role="status"
    aria-label="Loading"
    className={`inline-block ${SIZES[size]} border-2 border-current/30 border-t-current rounded-full animate-spin ${className}`}
  />
);

export default Spinner;
