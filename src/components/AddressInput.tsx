"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import type { AddressSuggestion } from "@/types";

interface AddressInputProps {
  id?: string;
  label: string;
  placeholder?: string;
  value: AddressSuggestion | null;
  onChange: (suggestion: AddressSuggestion | null) => void;
}

export function AddressInput({ id: idProp, label, placeholder, value, onChange }: AddressInputProps) {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const listboxId = `${inputId}-listbox`;

  const [inputText, setInputText] = useState(value?.fullAddress ?? "");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync display text when value changes externally
  useEffect(() => {
    setInputText(value?.fullAddress ?? "");
  }, [value]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = await res.json() as { suggestions: AddressSuggestion[] };
      setSuggestions(data.suggestions ?? []);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch {
      // Network failure — silently ignore, user can keep typing
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setInputText(text);
    onChange(null); // clear the resolved suggestion while typing

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300);
  }

  function selectSuggestion(suggestion: AddressSuggestion) {
    setInputText(suggestion.fullAddress);
    onChange(suggestion);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  // Close listbox on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const activeOptionId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">
        {label}
      </label>
      <div
        className={[
          "flex rounded-lg border-2 overflow-hidden transition-colors",
          isOpen ? "border-accent" : "border-border",
        ].join(" ")}
      >
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          placeholder={placeholder ?? "City, state or address"}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={[
            "flex-1 px-4 py-3 text-base text-text-primary bg-surface outline-none",
            "placeholder:text-text-muted",
          ].join(" ")}
        />
        {isLoading && (
          <span className="flex items-center px-3 bg-surface" aria-hidden="true">
            <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </span>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className={[
            "absolute z-50 w-full mt-1 rounded-lg border-2 border-border bg-surface shadow-lg",
            "max-h-60 overflow-y-auto",
          ].join(" ")}
        >
          {suggestions.map((suggestion, index) => {
            const isActive = index === activeIndex;
            return (
              <li
                key={suggestion.id}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before click registers
                  selectSuggestion(suggestion);
                }}
                className={[
                  "px-4 py-3 cursor-pointer text-sm transition-colors",
                  "border-b border-border last:border-b-0",
                  isActive
                    ? "bg-accent-subtle text-accent"
                    : "text-text-primary hover:bg-surface-raised",
                ].join(" ")}
              >
                <p className="font-semibold leading-tight">{suggestion.displayName}</p>
                <p className="text-text-muted text-xs mt-0.5 leading-tight">{suggestion.fullAddress}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
