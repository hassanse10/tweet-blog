import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticleById, getTranslation, getRelatedArticles } from '../../../../lib/db';
import ArticleContent from '../../../components/ArticleContent';
import LanguageSwitcher from '../../../components/LanguageSwitcher';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://1minai.site';
const SUPPORTED = ['de', 'es'];

const NO_TRANSLATION = {
  de: 'Übersetzung in Bearbeitung — englische Version wird angezeigt',
  es: 'Traducción en curso — mostrando versión en inglés',
};

export async function generateMetadata({ params }) {
  const { lang, id } = params;
  if (!SUPPORTED.includes(lang)) return {};

  const article = getArticleById(Number(id));
  if (!article) return {};

  const translation = getTranslation(Number(id), lang);
  const headline = translation?.headline || article.summary.split('\n').find(Boolean) || 'AI Update';

  let sections = [];
  try { sections = translation?.sections ? JSON.parse(translation.sections) : []; } catch {}
  const description = sections[0]?.body?.slice(0, 160) || article.summary.split('\n').filter(Boolean).slice(1).join(' ').slice(0, 160);

  return {
    title: `${headline} | AI Digest`,
    description,
    alternates: {
      canonical: `${BASE_URL}/${lang}/article/${id}`,
      languages: {
        en: `${BASE_URL}/article/${id}`,
        de: `${BASE_URL}/de/article/${id}`,
        es: `${BASE_URL}/es/article/${id}`,
      },
    },
  };
}

export default function LangArticlePage({ params }) {
  const { lang, id } = params;
  if (!SUPPORTED.includes(lang)) notFound();

  const article = getArticleById(Number(id));
  if (!article) notFound();

  const translation = getTranslation(Number(id), lang);
  const related = getRelatedArticles(article.id, article.category, 3);

  // Merge translation into article object for ArticleContent
  let displayArticle = { ...article };
  if (translation) {
    let sections = [];
    let faqs = [];
    try { sections = JSON.parse(translation.sections); } catch {}
    try { faqs = JSON.parse(translation.faqs); } catch {}
    const body = sections.map((s) => s.body).join('\n\n');
    displayArticle = {
      ...article,
      summary: `${translation.headline}\n\n${body}`,
      sections: translation.sections,
      faqs: translation.faqs,
    };
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/${lang}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← {lang === 'de' ? 'Alle Artikel' : 'Todos los artículos'}
        </Link>
        <LanguageSwitcher articleId={article.id} currentLang={lang} />
      </div>

      {!translation && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
          {NO_TRANSLATION[lang]}
        </div>
      )}

      <ArticleContent article={displayArticle} related={related} />
    </>
  );
}
