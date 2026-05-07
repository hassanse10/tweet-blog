'use client';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = ['Research', 'Product', 'Safety', 'Business', 'News'];

export default function FilterBar({ sources }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSource = searchParams.get('source') || '';
  const activeCategory = searchParams.get('category') || '';

  function setParam(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/?${params.toString()}`);
  }

  const pill = (active, onClick, label) => (
    <button
      key={label}
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Source</span>
        {pill(!activeSource, () => setParam('source', ''), 'All')}
        {sources.map((s) => pill(activeSource === s, () => setParam('source', activeSource === s ? '' : s), s))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Category</span>
        {pill(!activeCategory, () => setParam('category', ''), 'All')}
        {CATEGORIES.map((c) => pill(activeCategory === c, () => setParam('category', activeCategory === c ? '' : c), c))}
      </div>
    </div>
  );
}
