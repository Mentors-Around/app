import { useOverlay, useOverlayRefs } from '../../contexts/OverlayContext';

const SortDropdown = ({ value, onChange }) => {
  const { activeOverlayId, toggleOverlay, closeOverlay } = useOverlay();
  const sortDropdownRefs = useOverlayRefs('student-sort-dropdown');
  const isOpen = activeOverlayId === 'student-sort-dropdown';

  const options = [
    { value: 'highestrated', label: 'Highest Rated' },
    { value: 'pricelowtohigh', label: 'Price: Low to High' },
    { value: 'pricehightolow', label: 'Price: High to Low' },
    { value: 'mostreviews', label: 'Most Reviews' },
    { value: 'mostexperienced', label: 'Most Experienced' },
  ];

  const currentOption = options.find(o => o.value === value);

  return (
    <div className="relative">
      <button
        ref={sortDropdownRefs.triggerRef}
        onClick={() => toggleOverlay('student-sort-dropdown')}
        className="flex items-center gap-3 bg-white border-2 border-slate-200 rounded-lg py-2 px-4 text-sm font-bold text-navy hover:border-navy transition outline-none min-w-[200px] justify-between"
      >
        <span className="flex items-center gap-2">
          <i className="fa-solid fa-arrow-down-a-z text-slate-400" />
          {currentOption?.label}
        </span>
        <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div ref={sortDropdownRefs.overlayRef} className="absolute top-full right-0 mt-2 w-full bg-white rounded-lg shadow-brand-xl border border-slate-100 overflow-hidden z-20 py-1 animate-slide-up-sm">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); closeOverlay(); }}
              className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition ${
                value === opt.value ? 'bg-slate-50 text-navy' : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
export default SortDropdown;
