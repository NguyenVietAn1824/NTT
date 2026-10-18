'use client';

import { useState } from 'react';
import type { Dict, Lang } from '@/content';
import type { AlbumItem, VideoItem } from '@/lib/api';
import { fmtDate, fmtDuration } from '@/lib/format';
import { srcSet } from '@/lib/media';
import Icon from './Icon';
import Lightbox from './Lightbox';
import { videoSrc } from '@/lib/endpoint';

type T = Dict['libraryPage'];

// ---------- Video ----------
function VideoCard({ v, t, lang, onOpen, large }: { v: VideoItem; t: T; lang: Lang; onOpen: () => void; large?: boolean }) {
  return (
    <article className={`vcard${large ? ' vcard--large' : ''}`}>
      <button type="button" className="vcard__media" onClick={onOpen} aria-label={`${t.watch}: ${v.title} (${fmtDuration(v.duration)})`}>
        {v.poster ? <img src={v.poster} alt="" loading={large ? 'eager' : 'lazy'} /> : <span className="vcard__noposter" />}
        <span className="vcard__play">
          <Icon name="play" />
        </span>
        <span className="vcard__dur">{fmtDuration(v.duration)}</span>
        {large && <span className="vcard__badge">{t.featured}</span>}
      </button>
      <div className="vcard__body">
        <h3>{v.title}</h3>
        {v.description && <p>{v.description}</p>}
        {v.recordedAt && (
          <time dateTime={v.recordedAt}>
            <Icon name="calendar" /> {fmtDate(v.recordedAt, lang)}
          </time>
        )}
      </div>
    </article>
  );
}

// ---------- Album ----------
function AlbumGrid({ a, t, lang, onOpen }: { a: AlbumItem; t: T; lang: Lang; onOpen: (i: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? a.photos : a.photos.slice(0, 9);
  return (
    <section className="album" aria-labelledby={`album-${a.id}`}>
      <header className="album__head">
        <div>
          <h3 id={`album-${a.id}`}>{a.title}</h3>
          <p>
            {a.date && (
              <>
                <Icon name="calendar" /> {fmtDate(a.date, lang)} ·{' '}
              </>
            )}
            {a.photos.length} {t.photos}
          </p>
        </div>
        <button type="button" className="btn btn--outline" onClick={() => onOpen(0)}>
          <Icon name="image" /> {t.viewAlbum}
        </button>
      </header>
      <ul className="album__grid">
        {shown.map((p, i) => (
          <li key={p.id} className={i === 0 ? 'is-big' : undefined}>
            <button type="button" onClick={() => onOpen(i)} aria-label={p.alt || `${a.title} ${i + 1}`}>
              <img src={i === 0 ? p.url : p.thumb} srcSet={srcSet(p.url)} sizes={i === 0 ? '(max-width: 900px) 100vw, 50vw' : '(max-width: 900px) 50vw, 25vw'} alt={p.alt} loading="lazy" />
            </button>
            {!expanded && i === shown.length - 1 && a.photos.length > shown.length && (
              <button type="button" className="album__more" onClick={() => setExpanded(true)}>
                +{a.photos.length - shown.length}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Library({ videos, albums, t, lang }: { videos: VideoItem[]; albums: AlbumItem[]; t: T; lang: Lang }) {
  const [video, setVideo] = useState<number | null>(null);
  const [photo, setPhoto] = useState<{ album: number; index: number } | null>(null);
  const [featured, ...rest] = videos;
  const current = photo ? albums[photo.album] : null;

  return (
    <>
      <nav className="lib-tabs" aria-label={t.hero.title}>
        <div className="container">
          {videos.length > 0 && (
            <a href="#videos">
              <Icon name="play" /> {t.tabs.videos} <span>{videos.length}</span>
            </a>
          )}
          {albums.length > 0 && (
            <a href="#albums">
              <Icon name="image" /> {t.tabs.albums} <span>{albums.reduce((n, a) => n + a.photos.length, 0)}</span>
            </a>
          )}
        </div>
      </nav>

      {videos.length > 0 && (
        <section className="section" id="videos">
          <div className="container">
            <header className="section-head">
              <p className="eyebrow">{t.tabs.videos}</p>
              <h2>{t.videosTitle}</h2>
            </header>
            <VideoCard v={featured} t={t} lang={lang} onOpen={() => setVideo(0)} large />
            {rest.length > 0 && (
              <div className="vgrid">
                {rest.map((v, i) => (
                  <VideoCard key={v.id} v={v} t={t} lang={lang} onOpen={() => setVideo(i + 1)} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {albums.length > 0 && (
        <section className="section section--mist" id="albums">
          <div className="container">
            <header className="section-head">
              <p className="eyebrow">{t.tabs.albums}</p>
              <h2>{t.albumsTitle}</h2>
            </header>
            {albums.map((a, ai) => (
              <AlbumGrid key={a.id} a={a} t={t} lang={lang} onOpen={(index) => setPhoto({ album: ai, index })} />
            ))}
          </div>
        </section>
      )}

      {!videos.length && !albums.length && (
        <section className="section">
          <div className="container">
            <p className="empty">{t.empty}</p>
          </div>
        </section>
      )}

      {video !== null && (
        <Lightbox
          count={videos.length}
          index={video}
          onIndex={setVideo}
          onClose={() => setVideo(null)}
          t={t}
          label={videos[video].title}
          caption={
            <>
              <strong>{videos[video].title}</strong>
              {videos[video].description && <span>{videos[video].description}</span>}
            </>
          }
        >
          <video
            key={videos[video].id}
            className="lb__video"
            src={videoSrc(videos[video].url)}
            poster={videos[video].poster || undefined}
            controls
            autoPlay
            playsInline
            preload="auto"
          />
        </Lightbox>
      )}

      {photo && current && (
        <Lightbox
          count={current.photos.length}
          index={photo.index}
          onIndex={(index) => setPhoto({ ...photo, index })}
          onClose={() => setPhoto(null)}
          t={t}
          label={current.title}
          caption={
            <>
              <strong>{current.title}</strong>
              {current.photos[photo.index].alt && <span>{current.photos[photo.index].alt}</span>}
            </>
          }
        >
          <img
            key={current.photos[photo.index].id}
            className="lb__img"
            src={current.photos[photo.index].url}
            srcSet={srcSet(current.photos[photo.index].url)}
            sizes="100vw"
            alt={current.photos[photo.index].alt}
          />
        </Lightbox>
      )}
    </>
  );
}
