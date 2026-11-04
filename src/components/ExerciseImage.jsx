import { useEffect, useState } from 'react';
import { IMAGE_BASE } from '../data/useExercises.js';
import BodyMap from './BodyMap.jsx';
import { TARGET_TO_SLUGS } from '../core/muscles.js';

// Alterna les dues fotos (posició inicial i final) cada ~800 ms per simular un vídeo en bucle.
// Exercicis propis (o si les fotos fallen): mapa muscular gran.
export default function ExerciseImage({ ex, primary = [], secondary = [] }) {
  const imgs = ex?.images || [];
  const [i, setI] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (imgs.length < 2) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % imgs.length), 800);
    return () => clearInterval(t);
  }, [imgs.length]);

  if (!imgs.length || failed) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-bg p-3">
        <BodyMap mode="mini" slugs={primary.flatMap((t) => TARGET_TO_SLUGS[t] || [])}
          secondarySlugs={secondary.flatMap((t) => TARGET_TO_SLUGS[t] || [])} maxWidth={120} />
      </div>
    );
  }
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white">
      {imgs.map((src, k) => (
        <img key={src} src={IMAGE_BASE + src} alt="" loading="lazy" decoding="async"
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ${k === i ? 'opacity-100' : 'opacity-0'}`} />
      ))}
    </div>
  );
}
