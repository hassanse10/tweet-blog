'use client';

import Link from 'next/link';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'es', label: 'ES' },
];

function href(code, articleId) {
  const prefix = code === 'en' ? '' : `/${code}`;
  if (articleId) return `${prefix}/article/${articleId}`;
  return prefix || '/';
}

export default function LanguageSwitcher({ articleId, currentLang = 'en' }) {
  return (
    <div className="flex gap-1">
      {LANGS.map(({ code, label }) => (
        <Link
          key={code}
          href={href(code, articleId)}
          className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
            currentLang === code
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
