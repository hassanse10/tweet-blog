'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ArticleContent from './ArticleContent';

export default function ArticleStack({ initialArticle, initialRelated }) {
  const [articles, setArticles] = useState([
    { article: initialArticle, related: initialRelated },
  ]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);
  const articleRefs = useRef([]);

  const loadNext = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const shownIds = articles.map((a) => a.article.id);
    const category = initialArticle.category;

    try {
      const res = await fetch(
        `/api/articles/next?category=${encodeURIComponent(category)}&exclude=${shownIds.join(',')}`
      );
      const { article } = await res.json();

      if (!article) {
        setHasMore(false);
      } else {
        setArticles((prev) => [...prev, { article, related: [] }]);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [articles, loading, hasMore, initialArticle.category]);

  // Sentinel observer — load next when bottom is reached
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadNext(); },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadNext]);

  // URL updater — update address bar as each article enters viewport
  useEffect(() => {
    const observers = articleRefs.current.map((ref, i) => {
      if (!ref) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            const a = articles[i]?.article;
            if (a?.slug) window.history.replaceState({}, '', `/article/${a.slug}`);
          }
        },
        { rootMargin: '-30% 0px -30% 0px' }
      );
      obs.observe(ref);
      return obs;
    });
    return () => observers.forEach((obs) => obs?.disconnect());
  }, [articles]);

  return (
    <div className="space-y-8">
      {articles.map(({ article, related }, i) => (
        <div key={article.id} ref={(el) => (articleRefs.current[i] = el)}>
          <ArticleContent article={article} related={related} />
        </div>
      ))}

      {/* Sentinel + loading indicator */}
      <div ref={sentinelRef} className="py-4 text-center">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Loading next article…
          </div>
        )}
        {!hasMore && !loading && (
          <p className="text-sm text-gray-400">You've reached the end of this category.</p>
        )}
      </div>
    </div>
  );
}
