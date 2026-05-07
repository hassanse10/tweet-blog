'use client';

const GRADIENTS = {
  OpenAI:      'from-gray-900 via-gray-800 to-gray-700',
  Anthropic:   'from-orange-700 to-orange-500',
  HuggingFace: 'from-yellow-400 to-amber-500',
  DeepMind:    'from-blue-600 to-cyan-500',
  Mistral:     'from-orange-500 to-red-500',
  'Meta AI':   'from-blue-700 to-blue-500',
};
const DEFAULT_GRADIENT = 'from-indigo-600 to-purple-600';

const SOURCE_ICONS = {
  OpenAI:      '⬛',
  Anthropic:   '🔶',
  HuggingFace: '🤗',
  DeepMind:    '🔷',
  Mistral:     '🌪️',
};

export default function ArticleImage({ src, author, alt = '', className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`w-full object-cover ${className}`}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling?.style.removeProperty('display'); }}
      />
    );
  }

  const gradient = GRADIENTS[author] || DEFAULT_GRADIENT;
  const icon = SOURCE_ICONS[author] || '📰';

  return (
    <div
      className={`w-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2 ${className}`}
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-white/80 text-xs font-semibold tracking-widest uppercase">{author}</span>
    </div>
  );
}
