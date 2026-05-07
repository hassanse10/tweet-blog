import Link from 'next/link';
import { notFound } from 'next/navigation';
import { searchArticlesWithTranslations } from '../../lib/db';
import LanguageSwitcher from '../components/LanguageSwitcher';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://1minai.site';
const SUPPORTED = ['de', 'es'];

const META = {
  de: { title: 'KI-Nachrichten', description: 'Die neuesten KI-Nachrichten von OpenAI, Anthropic, Google und mehr.' },
  es: { title: 'Noticias de IA', description: 'Las últimas noticias de IA de OpenAI, Anthropic, Google y más.' },
};

const PAGINATION = {
  de: { prev: '← Vorherige', next: 'Nächste →' },
  es: { prev: '← Anterior', next: 'Siguiente →' },
};

export async function generateMetadata({ params }) {
  const lang = params.lang;
  if (!SUPPORTED.includes(lang)) return {};
  return {
    title: `${META[lang].title} | AI Digest`,
    description: META[lang].description,
    alternates: {
      canonical: `${BASE_URL}/${lang}`,
      languages: { en: BASE_URL, de: `${BASE_URL}/de`, es: `${BASE_URL}/es` },
    },
  };
}

function formatDate(d, lang) {
  return new Date(d).toLocaleDateString(lang === 'de' ? 'de-DE' : 'es-ES', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function LangHomePage({ params, searchParams }) {
  const { lang } = params;
  if (!SUPPORTED.includes(lang)) notFound();

  const page = Math.max(1, parseInt(searchParams?.page || '1', 10));
  const { articles, pages } = searchArticlesWithTranslations(lang, { page, limit: 20 });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{META[lang].title}</h1>
          <p className="text-sm text-gray-500 mt-1">{META[lang].description}</p>
        </div>
        <LanguageSwitcher currentLang={lang} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {articles.map((a) => {
          const headline = a.translated_headline || a.summary.split('\n').find(Boolean) || 'Article';
          const excerpt = a.summary.split('\n').filter(Boolean).slice(1).join(' ').slice(0, 120);
          return (
            <Link key={a.id} href={`/${lang}/article/${a.id}`}
              className="block p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">{headline}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{excerpt}</p>
              <p className="text-xs text-gray-400">{a.author} · {formatDate(a.created_at, lang)}</p>
            </Link>
          );
        })}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {page > 1 && (
            <Link href={`/${lang}?page=${page - 1}`}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 transition-colors">
              {PAGINATION[lang].prev}
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">{page} / {pages}</span>
          {page < pages && (
            <Link href={`/${lang}?page=${page + 1}`}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 transition-colors">
              {PAGINATION[lang].next}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
