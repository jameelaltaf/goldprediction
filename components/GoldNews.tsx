'use client';

import { useState, useEffect } from 'react';
import type { NewsArticle } from '@/types';

export default function GoldNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [source, setSource]     = useState('');

  useEffect(() => {
    fetch('/api/news')
      .then((r) => r.json())
      .then((d) => { setArticles(d.articles ?? []); setSource(d.source ?? ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="gold-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📰</span>
          <div>
            <h2 className="text-lg font-bold text-white">Gold Market News</h2>
            <p className="text-xs text-gray-500">Latest headlines affecting gold prices</p>
          </div>
        </div>
        {source && <span className="text-xs text-gray-600 px-2 py-1 rounded-lg bg-gray-800/50 border border-gray-700">{source}</span>}
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center text-gray-500 text-sm">
          <svg className="animate-spin w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Fetching latest gold news…
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="text-center py-8 text-gray-600 text-sm">No news available right now.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {articles.map((article, i) => (
          <a key={i} href={article.link || '#'} target={article.link !== '#' ? '_blank' : undefined}
             rel="noopener noreferrer"
             className="rounded-xl p-4 bg-black/30 border border-gray-800 hover:border-yellow-400/30 hover:bg-yellow-400/5 transition-all group block">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0 text-sm">
                📄
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white group-hover:text-yellow-300 transition-colors leading-snug line-clamp-2 mb-2">
                  {article.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 truncate max-w-[120px]">
                    {article.source}
                  </span>
                  <span>·</span>
                  <span>{article.timeAgo}</span>
                  {article.link && article.link !== '#' && (
                    <>
                      <span>·</span>
                      <span className="text-yellow-600 group-hover:text-yellow-400">↗</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
