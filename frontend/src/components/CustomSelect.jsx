import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ value, onChange, options, placeholder, required }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm transition-shadow cursor-pointer text-left"
      >
        <span className={!selectedOption ? 'text-slate-400 dark:text-slate-500' : ''}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform duration-200 text-slate-400 dark:text-slate-500 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Hidden input for HTML form validation if needed */}
      {required && (
        <input 
          type="text" 
          required={required} 
          value={value} 
          onChange={() => {}} 
          className="absolute opacity-0 pointer-events-none -z-10 w-0 h-0"
        />
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {placeholder && (
            <div
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                value === '' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-semibold' : 'text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange({ target: { value: '' } });
                setIsOpen(false);
              }}
            >
              {placeholder}
            </div>
          )}
          {options.map(opt => (
            <div
              key={opt.value}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                value === opt.value
                  ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange({ target: { value: opt.value } });
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
