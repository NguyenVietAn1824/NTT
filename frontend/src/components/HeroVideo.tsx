'use client';

import { useState } from 'react';
import type { VideoItem } from '@/lib/api';
import Icon from './Icon';
import Lightbox from './Lightbox';
import { videoSrc } from '@/lib/endpoint';

// Nút "▶ Xem video" ở hero: mở video giới thiệu toàn màn hình
export default function HeroVideo({ video, label, t }: { video: VideoItem; label: string; t: { close: string; prev: string; next: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="hero-play" onClick={() => setOpen(true)}>
        <span className="hero-play__icon">
          <Icon name="play" />
        </span>
        <span>{label}</span>
      </button>
      {open && (
        <Lightbox count={1} index={0} onIndex={() => {}} onClose={() => setOpen(false)} t={t} label={video.title} caption={<strong>{video.title}</strong>}>
          <video className="lb__video" src={videoSrc(video.url)} poster={video.poster || undefined} controls autoPlay playsInline preload="auto" />
        </Lightbox>
      )}
    </>
  );
}
