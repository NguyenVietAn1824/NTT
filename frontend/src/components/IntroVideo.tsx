'use client';

import { useRef, useState } from 'react';
import type { VideoItem } from '@/lib/api';
import { fmtDuration } from '@/lib/format';
import Icon from './Icon';
import { videoSrc } from '@/lib/endpoint';

// Video giới thiệu: hiện ảnh bìa + nút phát; chỉ tải video khi người xem bấm (trang chủ không phải tải ~47MB)
export default function IntroVideo({ video, t }: { video: VideoItem; t: { play: string; label: string } }) {
  const introVideo = { ...video, duration: fmtDuration(video.duration), width: video.width || 16, height: video.height || 9 };
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <figure className="intro-video reveal">
      <div className="intro-video__frame" style={{ aspectRatio: `${introVideo.width} / ${introVideo.height}` }}>
        {playing ? (
          <video
            ref={ref}
            src={videoSrc(introVideo.url)}
            poster={introVideo.poster || undefined}
            controls
            autoPlay
            playsInline
            preload="auto"
            aria-label={t.label}
          />
        ) : (
          <button type="button" className="intro-video__cover" onClick={() => setPlaying(true)} aria-label={`${t.play} (${introVideo.duration})`}>
            {introVideo.poster && <img src={introVideo.poster} alt="" loading="lazy" />}
            <span className="intro-video__play">
              <Icon name="play" />
            </span>
            <span className="intro-video__meta">
              <strong>{t.play}</strong>
              <span>
                <Icon name="clock" /> {introVideo.duration}
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="intro-video__caption">{introVideo.title}</figcaption>
    </figure>
  );
}
