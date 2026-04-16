"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import type { IGif } from "@giphy/js-types";

const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY);

interface GifPickerProps {
  onSelect: (gif: IGif, url: string) => void;
  onClose: () => void;
}

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [width, setWidth] = useState(560);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
      setWidth(containerRef.current.offsetWidth);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const fetchGifs = useCallback(
    (offset: number) =>
      debouncedQuery.trim()
        ? gf.search(debouncedQuery, { offset, limit: 18 })
        : gf.trending({ offset, limit: 18 }),
    [debouncedQuery]
  );

  const handleGifClick = useCallback(
    (gif: IGif, e: React.SyntheticEvent<HTMLElement>) => {
      e.preventDefault();
      const url = gif.images.fixed_height.url || gif.images.original.url;
      onSelect(gif, url);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <div
      className="gif-picker-backdrop"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="GIF Picker"
    >
      <div className="gif-picker">
        {/* Header */}
        <div className="gif-picker__header">
          <span className="gif-picker__title">GIFs</span>
          <button className="gif-picker__close" onClick={onClose} aria-label="Close GIF picker">
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="gif-picker__search">
          <span className="gif-picker__search-icon">⌕</span>
          <input
            ref={inputRef}
            type="text"
            className="gif-picker__input"
            placeholder="Search GIFs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="gif-picker__clear" onClick={() => setQuery("")} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        {/* Label */}
        <div className="gif-picker__label">
          {debouncedQuery ? `Results for "${debouncedQuery}"` : "Trending"}
        </div>

        {/* Grid */}
        <div className="gif-picker__grid" ref={containerRef}>
          <Grid
            key={debouncedQuery}
            width={width || 560}
            columns={5}
            fetchGifs={fetchGifs}
            onGifClick={handleGifClick}
            noLink
            hideAttribution
          />
        </div>
      </div>

      <style>{`
        .gif-picker-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(2px);
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .gif-picker {
          width: 700px;
          max-width: 100vw;
          max-height: 90vh;
          background: #1f2c34;
          border-radius: 12px 12px 0 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.4);
          animation: slideUp 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .gif-picker__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px 12px;
          background: #2a3942;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .gif-picker__title {
          font-size: 15px;
          font-weight: 600;
          color: #00a884;
          letter-spacing: 0.4px;
        }

        .gif-picker__close {
          background: rgba(255, 255, 255, 0.07);
          border: none;
          color: #8696a0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }

        .gif-picker__close:hover {
          background: rgba(255, 255, 255, 0.13);
          color: #e9edef;
        }

        .gif-picker__search {
          position: relative;
          display: flex;
          align-items: center;
          margin: 12px 16px 6px;
        }

        .gif-picker__search-icon {
          position: absolute;
          left: 13px;
          color: #8696a0;
          font-size: 20px;
          pointer-events: none;
          line-height: 1;
        }

        .gif-picker__input {
          width: 100%;
          background: #2a3942;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: #e9edef;
          font-size: 14px;
          padding: 10px 38px 10px 40px;
          outline: none;
          transition: border-color 0.15s;
        }

        .gif-picker__input::placeholder {
          color: #8696a0;
        }

        .gif-picker__input:focus {
          border-color: #00a884;
        }

        .gif-picker__clear {
          position: absolute;
          right: 10px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #8696a0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }

        .gif-picker__clear:hover {
          background: rgba(255, 255, 255, 0.18);
          color: #e9edef;
        }

        .gif-picker__label {
          padding: 4px 18px 8px;
          font-size: 11px;
          font-weight: 500;
          color: #8696a0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .gif-picker__grid {
          flex: 1;
          overflow-y: auto;
          max-height: 480px;
          padding: 0 6px 6px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
        }

        .gif-picker__grid::-webkit-scrollbar {
          width: 4px;
        }

        .gif-picker__grid::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .gif-picker__grid img {
          border-radius: 6px;
          cursor: pointer;
          transition: transform 0.12s, opacity 0.12s;
        }

        .gif-picker__grid img:hover {
          transform: scale(1.04);
          opacity: 0.88;
        }

        .gif-picker__footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 8px;
          background: #2a3942;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 11px;
          color: #8696a0;
        }

        .gif-picker__footer strong {
          color: #00a884;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}