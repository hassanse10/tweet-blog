'use client';
import { useState } from 'react';

export default function RatingButtons({ articleId, initialRating = 0 }) {
  const [rating, setRating] = useState(initialRating);
  const [loading, setLoading] = useState(false);

  async function vote(delta) {
    if (loading) return;
    setLoading(true);
    setRating((r) => r + delta); // optimistic
    try {
      const res = await fetch(`/api/articles/${articleId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      if (res.ok) {
        const data = await res.json();
        setRating(data.rating);
      }
    } catch {
      setRating((r) => r - delta); // revert on error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => vote(1)}
        disabled={loading}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 text-sm font-medium transition disabled:opacity-50"
      >
        👍 <span>{rating >= 0 ? rating : 0}</span>
      </button>
      <button
        onClick={() => vote(-1)}
        disabled={loading}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-sm font-medium transition disabled:opacity-50"
      >
        👎
      </button>
    </div>
  );
}
