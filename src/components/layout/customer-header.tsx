'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function CustomerHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">호텔어라운드</span>
          <span className="text-sm text-muted">평창</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/products" className="text-sm text-foreground hover:text-primary transition-colors">
            숙박권
          </Link>
          <Link href="/voucher" className="text-sm text-foreground hover:text-primary transition-colors">
            내 바우처
          </Link>
          <Link href="/reservation" className="text-sm text-foreground hover:text-primary transition-colors">
            예약 확인
          </Link>
        </nav>

        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <nav className="flex flex-col px-4 py-2">
            <Link href="/products" className="py-3 text-sm border-b border-border" onClick={() => setMenuOpen(false)}>
              숙박권
            </Link>
            <Link href="/voucher" className="py-3 text-sm border-b border-border" onClick={() => setMenuOpen(false)}>
              내 바우처
            </Link>
            <Link href="/reservation" className="py-3 text-sm" onClick={() => setMenuOpen(false)}>
              예약 확인
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
