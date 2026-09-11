'use client';

import { useState } from 'react';
import { useDarkMode } from '@/lib/hooks/useDarkMode';

const DOTS = 'dots';

const getPageRange = (current: number, total: number, siblingCount: number): (number | string)[] => {
    const totalNumbers = siblingCount * 2 + 5;

    if (total <= totalNumbers) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const left = Math.max(current - siblingCount, 1);
    const right = Math.min(current + siblingCount, total);
    const showLeftDots = left > 2;
    const showRightDots = right < total - 1;

    if (!showLeftDots && showRightDots) {
        const leftRange = 3 + 2 * siblingCount;
        const arr = Array.from({ length: leftRange }, (_, i) => i + 1);
        return [...arr, DOTS, total];
    }

    if (showLeftDots && !showRightDots) {
        const rightRange = 3 + 2 * siblingCount;
        const arr = Array.from({ length: rightRange }, (_, i) => total - rightRange + 1 + i);
        return [1, DOTS, ...arr];
    }

    const middle = Array.from({ length: right - left + 1 }, (_, i) => left + i);
    return [1, DOTS, ...middle, DOTS, total];
};

interface PaginationProps {
    currentPage: number; // 0-based
    totalPages: number;
    onPageChange: (page: number) => void; // 0-based
    siblingCount?: number;
    className?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1,
    className = '',
}: PaginationProps) {
    const { isDark } = useDarkMode();
    const [inputValue, setInputValue] = useState<string>('');

    if (totalPages <= 1) return null;

    const current = currentPage + 1; // 1-based cho hiển thị
    const pages = getPageRange(current, totalPages, siblingCount);

    const baseBtn =
        'inline-flex items-center justify-center h-10 min-w-[40px] px-3 rounded-full text-sm font-medium transition-all duration-200 ease-out select-none';
    const normalBtn = isDark
        ? 'text-gray-300 hover:bg-white/5 hover:text-white'
        : 'text-gray-600 hover:bg-black/5 hover:text-gray-900';
    const activeBtn =
        'bg-accent text-white shadow-lg shadow-accent/25 ring-2 ring-accent/30 scale-[1.03] cursor-default';
    const disabledBtn = 'opacity-30 cursor-not-allowed pointer-events-none';

    const navBtnClass = (disabled: boolean) =>
        `${baseBtn} ${normalBtn} ${disabled ? disabledBtn : 'hover:-translate-y-0.5'}`;

    const goToInputPage = () => {
        const parsed = parseInt(inputValue, 10);
        if (!isNaN(parsed)) {
            const target = Math.min(Math.max(parsed, 1), totalPages) - 1;
            onPageChange(target);
        }
        setInputValue('');
    };

    return (
        <nav
            className={`flex flex-wrap items-center justify-center gap-1.5 mt-8 ${className}`}
            aria-label="Phân trang"
        >
            <button
                type="button"
                className={navBtnClass(currentPage === 0)}
                onClick={() => onPageChange(0)}
                disabled={currentPage === 0}
                aria-label="Về trang đầu"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
            </button>

            <button
                type="button"
                className={navBtnClass(currentPage === 0)}
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
                aria-label="Trang trước"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {pages.map((page, idx) => {
                if (page === DOTS) {
                    return (
                        <span
                            key={`dots-${idx}`}
                            className={`inline-flex items-center justify-center h-10 min-w-[28px] text-sm ${
                                isDark ? 'text-gray-600' : 'text-gray-400'
                            }`}
                        >
                            &#8230;
                        </span>
                    );
                }

                const pageNum = page as number;
                const isActive = pageNum === current;
                return (
                    <button
                        key={pageNum}
                        type="button"
                        className={`${baseBtn} ${isActive ? activeBtn : normalBtn}`}
                        onClick={() => onPageChange(pageNum - 1)}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        {pageNum}
                    </button>
                );
            })}

            <button
                type="button"
                className={navBtnClass(currentPage >= totalPages - 1)}
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                aria-label="Trang sau"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            <button
                type="button"
                className={navBtnClass(currentPage >= totalPages - 1)}
                onClick={() => onPageChange(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
                aria-label="Đến trang cuối"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
            </button>

            <div
                className={`flex items-center gap-2 ml-1.5 pl-3 ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                } border-l`}
            >
                <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Đi tới
                </span>
                <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') goToInputPage();
                    }}
                    placeholder={`1-${totalPages}`}
                    aria-label="Nhập số trang"
                    className={`w-16 h-9 px-2 rounded-full text-sm text-center font-medium outline-none transition-all duration-200 ${
                        isDark
                            ? 'bg-gray-800 text-gray-100 border border-gray-700 focus:border-accent focus:ring-2 focus:ring-accent/30'
                            : 'bg-white text-gray-800 border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/30 shadow-sm'
                    } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                />
                <button
                    type="button"
                    onClick={goToInputPage}
                    aria-label="Xác nhận đi tới trang"
                    className="inline-flex items-center justify-center h-9 px-4 rounded-full text-sm font-semibold text-white bg-accent shadow-md shadow-accent/25 transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0"
                >
                    Đi
                </button>
            </div>
        </nav>
    );
}
