import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/lib/store';
import { useEffect, useState, memo } from 'react';
import { ScrollingTitle } from './ScrollingTitle';

interface MangaCardProps {
  title: string;
  link: string;
  thumb: string;
  desc?: string;
  large?: boolean;
  score?: string;
  flag?: string;
  chapterCount?: number;
}

function MangaCardInner({ title, link, thumb, desc, score, flag, chapterCount }: MangaCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [mounted, setMounted] = useState(false);
  const isFav = isFavorite(link);

  useEffect(() => { setMounted(true); }, []);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ title, link, thumb, desc });
  };

  // Parse score dari desc kalau score prop tidak ada
  const displayScore = score && score !== 'N/A'
    ? score
    : desc?.replace('Score: ', '') || 'N/A';

  const displayFlag = flag || '🇯🇵';

  return (
    <Link href={`/manga?url=${encodeURIComponent(link)}`} className="group flex flex-col w-full flex-shrink-0 snap-start relative">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-[#1A1D24] shadow-sm">
        <Image
          src={thumb}
          alt={title}
          fill
          className="object-cover"
          referrerPolicy="no-referrer"
          sizes="(max-width: 768px) 50vw, 33vw"
          unoptimized
          loading="lazy"
        />
        {/* Bendera negara */}
        <div className="absolute top-2 left-2 z-10 text-base leading-none">{displayFlag}</div>

        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-[#1A1D24]/60 backdrop-blur-md flex items-center justify-center shadow-sm"
        >
          <Heart
            className={`w-3.5 h-3.5 ${mounted && isFav ? 'fill-gray-500 text-gray-500' : 'text-gray-300'}`}
            strokeWidth={mounted && isFav ? 0 : 2}
          />
        </button>

        <div className="absolute inset-x-2 bottom-2 bg-[#1A1D24]/80 backdrop-blur-lg rounded-2xl p-2.5 border border-white/5">
          <ScrollingTitle text={title} className="font-bold text-white text-sm" />
          {/* Rating + Chapter count */}
          <div className="flex items-center justify-between mt-1 gap-1">
            <span className="text-[10px] text-yellow-400 font-bold flex items-center gap-0.5">
              ⭐ {displayScore !== 'N/A' ? displayScore : '—'}
            </span>
            {chapterCount !== undefined && chapterCount > 0 && (
              <span className="text-[10px] text-gray-400 font-medium">
                {chapterCount} Ch
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// memo supaya ga re-render kalau props sama
export const MangaCard = memo(MangaCardInner);
