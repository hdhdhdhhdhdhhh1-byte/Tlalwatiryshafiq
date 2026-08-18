import React, { useState, useEffect } from 'react';
import { ALL_WORLD_COUNTRIES, getCountryFlag } from '../data/countries';
import { Globe, Edit3, List, Search } from 'lucide-react';

interface CountrySelectFieldProps {
  label?: string;
  value: string;
  onChange: (country: string) => void;
  required?: boolean;
  className?: string;
  allowAllOption?: boolean;
  allOptionLabel?: string;
  helperText?: string;
}

export const CountrySelectField: React.FC<CountrySelectFieldProps> = ({
  label = 'الدولة',
  value,
  onChange,
  required = false,
  className = '',
  allowAllOption = false,
  allOptionLabel = '🌍 جميع دول العالم',
  helperText
}) => {
  // Check if current value exists in the predefined world countries list
  const isValueInList = ALL_WORLD_COUNTRIES.some((c) => c.name === value) || (allowAllOption && value === 'all');
  
  // If the value is not in the list and not empty, default to manual mode
  const [isManualInput, setIsManualInput] = useState<boolean>(!isValueInList && value !== '' && value !== 'all');
  const [searchFilter, setSearchFilter] = useState('');

  // Group countries by region for structured select optgroups
  const arabCountries = ALL_WORLD_COUNTRIES.filter((c) => c.region === 'الوطن العربي');
  const otherCountries = ALL_WORLD_COUNTRIES.filter((c) => c.region !== 'الوطن العربي');

  const filteredArab = searchFilter.trim()
    ? arabCountries.filter((c) => c.name.includes(searchFilter) || c.code.toLowerCase().includes(searchFilter.toLowerCase()))
    : arabCountries;

  const filteredOther = searchFilter.trim()
    ? otherCountries.filter((c) => c.name.includes(searchFilter) || c.code.toLowerCase().includes(searchFilter.toLowerCase()))
    : otherCountries;

  const currentFlag = getCountryFlag(value);

  return (
    <div className={`space-y-1.5 ${className}`} dir="rtl">
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-xs font-bold text-[#193B4D]">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <button
          type="button"
          onClick={() => {
            setIsManualInput(!isManualInput);
            if (!isManualInput && (!value || value === 'all')) {
              onChange('');
            } else if (isManualInput && !value) {
              onChange('المملكة العربية السعودية');
            }
          }}
          className="text-[11px] font-semibold text-[#1687C7] hover:text-[#145273] flex items-center gap-1 transition px-1 py-0.5 rounded-md hover:bg-[#E7F7FD]"
        >
          {isManualInput ? (
            <>
              <List className="w-3 h-3" />
              <span>اختيار من قائمة الدول ({ALL_WORLD_COUNTRIES.length})</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3 h-3" />
              <span>كتابة الدولة يدوياً</span>
            </>
          )}
        </button>
      </div>

      {isManualInput ? (
        <div className="relative">
          <input
            type="text"
            required={required}
            value={value === 'all' ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="اكتب اسم دولتك أو إقامتك (مثال: الجزائر، كندا، مكة المكرمة...)"
            list="world-countries-datalist"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FBFF] border border-[#D8E8F2] text-xs text-[#193B4D] placeholder-[#6C8795] focus:outline-hidden focus:border-[#1687C7] focus:ring-2 focus:ring-[#1687C7]/15"
          />
          <datalist id="world-countries-datalist">
            {ALL_WORLD_COUNTRIES.map((c, idx) => (
              <option key={`datalist-${c.code}-${idx}`} value={c.name}>
                {c.flag} {c.name}
              </option>
            ))}
          </datalist>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
            {currentFlag}
          </div>
        </div>
      ) : (
        <div className="relative">
          <select
            required={required}
            value={value}
            onChange={(e) => {
              if (e.target.value === '__CUSTOM_MANUAL__') {
                setIsManualInput(true);
                onChange('');
              } else {
                onChange(e.target.value);
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6FBFF] border border-[#D8E8F2] text-xs text-[#193B4D] focus:outline-hidden focus:border-[#1687C7] focus:ring-2 focus:ring-[#1687C7]/15"
          >
            {allowAllOption && (
              <option value="all">{allOptionLabel} ({ALL_WORLD_COUNTRIES.length} دولة)</option>
            )}

            <optgroup label="🌟 الدول العربية">
              {filteredArab.map((c, idx) => (
                <option key={`select-arab-${c.code}-${idx}`} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </optgroup>

            <optgroup label="🌍 باقي دول العالم">
              {filteredOther.map((c, idx) => (
                <option key={`select-other-${c.code}-${idx}`} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </optgroup>

            <option value="__CUSTOM_MANUAL__">
              ✍️ دولة أخرى (كتابة الاسم يدوياً)...
            </option>
          </select>
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-[#6C8795] mt-1">{helperText}</p>
      )}
    </div>
  );
};
