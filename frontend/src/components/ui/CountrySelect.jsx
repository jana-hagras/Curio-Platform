import { useState, useEffect, useRef, useCallback } from 'react';
import { FiChevronDown, FiSearch, FiX, FiGlobe } from 'react-icons/fi';
import { userService } from '../../services/userService';
import './Input.css';

let cachedCountries = null;

export default function CountrySelect({ value, onChange, error, label = 'Country', required = false }) {
  const [countries, setCountries] = useState(cachedCountries || []);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  // Fetch countries from API
  useEffect(() => {
    if (cachedCountries) return;
    userService.getCountries()
      .then(res => {
        const list = res.data?.countries || [];
        cachedCountries = list;
        setCountries(list);
      })
      .catch(() => {
        // Fallback
        setCountries(['Egypt', 'United States', 'United Kingdom', 'Germany', 'France']);
      });
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Filtered countries
  const filtered = countries.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIndex >= 0 && highlightIndex < filtered.length) {
      e.preventDefault();
      handleSelect(filtered[highlightIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
  }, [isOpen, highlightIndex, filtered]);

  // Scroll highlighted into view
  useEffect(() => {
    if (listRef.current && highlightIndex >= 0) {
      const items = listRef.current.children;
      if (items[highlightIndex]) {
        items[highlightIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex]);

  const handleSelect = (country) => {
    onChange({ target: { name: 'country', value: country } });
    setIsOpen(false);
    setSearch('');
    setHighlightIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { name: 'country', value: '' } });
  };

  return (
    <div
      className={`input-group input-full ${error ? 'input-error' : ''}`}
      ref={wrapperRef}
      style={{ position: 'relative' }}
    >
      {label && (
        <label className="input-label">
          {label} {required && <span style={{ color: 'var(--error)' }}>*</span>}
        </label>
      )}

      {/* Selected value / trigger */}
      <div
        className="input-field"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          minHeight: 44,
          paddingRight: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <FiGlobe size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
            {value || 'Select your country'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-tertiary)', padding: 2, display: 'flex',
              }}
            >
              <FiX size={14} />
            </button>
          )}
          <FiChevronDown
            size={16}
            style={{
              color: 'var(--text-tertiary)',
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'none',
            }}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 999,
            background: 'var(--surface-primary)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            marginTop: 4,
            maxHeight: 280,
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeInUp 0.15s ease',
          }}
        >
          {/* Search */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--surface-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FiSearch size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setHighlightIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search countries..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 14,
                color: 'var(--text-primary)',
                width: '100%',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          {/* List */}
          <div
            ref={listRef}
            style={{
              overflowY: 'auto',
              maxHeight: 220,
              padding: '4px 0',
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: '16px 12px', color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center' }}>
                No countries found
              </div>
            ) : (
              filtered.map((country, i) => (
                <div
                  key={country}
                  onClick={() => handleSelect(country)}
                  style={{
                    padding: '10px 16px',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: i === highlightIndex
                      ? 'var(--surface-secondary)'
                      : country === value
                        ? 'rgba(212, 168, 67, 0.08)'
                        : 'transparent',
                    color: country === value ? 'var(--gold-primary)' : 'var(--text-primary)',
                    fontWeight: country === value ? 600 : 400,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={() => setHighlightIndex(i)}
                >
                  {country}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
}
