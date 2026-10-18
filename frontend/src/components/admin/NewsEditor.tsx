'use client';

import { marked } from 'marked';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { api, errMsg, LANG_LABEL, type MediaItem } from '@/lib/admin-api';
import { sized, thumb } from '@/lib/media';
import { MediaPicker } from './media';
import { Loading, PageTitle, Toast } from './ui';

type Lang = 'vi' | 'en' | 'ja';
type Tr = { title: string; excerpt: string; body: string };
interface NewsForm {
  slug: string;
  coverImage: string | null;
  gallery: string[];
  published: boolean;
  publishedAt: string; // yyyy-mm-ddThh:mm (giờ VN)
  translations: Record<Lang, Tr>;
}

// Xem trước: bỏ HTML thô giống như trên website
const previewRenderer = new marked.Renderer();
previewRenderer.html = () => '';

const emptyTr = (): Tr => ({ title: '', excerpt: '', body: '' });

// Bỏ dấu tiếng Việt → slug
const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);

const toLocalInput = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + 7 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => new Date(`${v}:00+07:00`).toISOString();

export default function NewsEditor({ id }: { id?: number }) {
  const router = useRouter();
  const [form, setForm] = useState<NewsForm | null>(null);
  const [lang, setLang] = useState<Lang>('vi');
  const [preview, setPreview] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<null | 'cover' | 'gallery' | 'body'>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [toast, setToast] = useState<{ msg: string; tone?: 'ok' | 'error' }>({ msg: '' });

  useEffect(() => {
    if (!id) {
      setForm({ slug: '', coverImage: null, gallery: [], published: true, publishedAt: toLocalInput(new Date().toISOString()), translations: { vi: emptyTr(), en: emptyTr(), ja: emptyTr() } });
      return;
    }
    api<{ slug: string; coverImage: string | null; gallery: string[]; published: boolean; publishedAt: string; translations: ({ lang: Lang } & Tr)[] }>(`/admin/news/${id}`)
      .then((n) => {
        const translations = { vi: emptyTr(), en: emptyTr(), ja: emptyTr() };
        n.translations.forEach((t) => (translations[t.lang] = { title: t.title, excerpt: t.excerpt, body: t.body }));
        setForm({ slug: n.slug, coverImage: n.coverImage, gallery: n.gallery, published: n.published, publishedAt: toLocalInput(n.publishedAt), translations });
      })
      .catch((e) => setToast({ msg: errMsg(e), tone: 'error' }));
  }, [id]);

  const tr = form?.translations[lang];
  const previewHtml = useMemo(() => (preview && tr ? (marked.parse(tr.body, { async: false, renderer: previewRenderer }) as string) : ''), [preview, tr]);

  if (!form || !tr) return <Loading />;

  const setTr = (patch: Partial<Tr>) => {
    setForm((f) => {
      if (!f) return f;
      const next = { ...f, translations: { ...f.translations, [lang]: { ...f.translations[lang], ...patch } } };
      if (lang === 'vi' && patch.title !== undefined && !slugTouched) next.slug = slugify(patch.title);
      return next;
    });
  };

  // Ảnh chọn từ thư viện → ảnh đại diện, thư viện ảnh của bài, hoặc chèn vào nội dung tại vị trí con trỏ
  function onPicked(items: MediaItem[]) {
    if (!form || !items.length) return;
    if (picker === 'cover') setForm({ ...form, coverImage: items[0].url });
    if (picker === 'gallery') setForm({ ...form, gallery: [...form.gallery, ...items.map((m) => m.url).filter((u) => !form.gallery.includes(u))] });
    if (picker === 'body' && tr) {
      const md = items.map((m) => `![${(m.alt || '').replace(/[[\]]/g, '')}](${m.url})`).join('\n\n');
      const el = bodyRef.current;
      const at = el ? el.selectionStart : tr.body.length;
      const before = tr.body.slice(0, at);
      const after = tr.body.slice(at);
      setTr({ body: `${before}${before && !before.endsWith('\n\n') ? '\n\n' : ''}${md}\n\n${after}` });
    }
  }

  const moveGallery = (i: number, d: -1 | 1) => {
    const g = [...form.gallery];
    const j = i + d;
    if (j < 0 || j >= g.length) return;
    [g[i], g[j]] = [g[j], g[i]];
    setForm({ ...form, gallery: g });
  };

  async function save() {
    if (!form) return;
    const translations: Partial<Record<Lang, Tr>> = {};
    (['vi', 'en', 'ja'] as Lang[]).forEach((l) => {
      if (form.translations[l].title.trim()) translations[l] = form.translations[l];
    });
    if (!translations.vi) {
      setLang('vi');
      return setToast({ msg: 'Cần có tiêu đề tiếng Việt', tone: 'error' });
    }
    setSaving(true);
    try {
      const body = { ...form, publishedAt: fromLocalInput(form.publishedAt), translations };
      const saved = await api<{ id: number }>(id ? `/admin/news/${id}` : '/admin/news', { method: id ? 'PUT' : 'POST', json: body });
      setToast({ msg: 'Đã lưu bài viết' });
      if (!id) router.replace(`/admin/news/${saved.id}`);
    } catch (e) {
      setToast({ msg: errMsg(e), tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle
        title={id ? 'Sửa bài viết' : 'Viết bài mới'}
        actions={
          <>
            {id && (
              <a className="a-btn a-btn--ghost" href={`/${lang}/tin-tuc/${form.slug}`} target="_blank" rel="noopener">
                <Icon name="external" /> Xem trên web
              </a>
            )}
            <button className="a-btn a-btn--primary" onClick={save} disabled={saving}>
              {saving ? 'Đang lưu…' : 'Lưu bài'}
            </button>
          </>
        }
      />

      <div className="a-editor">
        <div className="a-panel">
          <div className="a-tabs a-tabs--lang" role="tablist">
            {(['vi', 'en', 'ja'] as Lang[]).map((l) => (
              <button key={l} role="tab" aria-selected={lang === l} className={lang === l ? 'is-active' : undefined} onClick={() => setLang(l)}>
                {LANG_LABEL[l]}
                {form.translations[l].title ? ' ✓' : l === 'vi' ? ' *' : ''}
              </button>
            ))}
          </div>
          {lang !== 'vi' && <p className="a-hint">Để trống tiêu đề nếu chưa có bản dịch — website sẽ hiển thị bản tiếng Việt.</p>}

          <label className="a-field">
            <span>Tiêu đề{lang === 'vi' && ' *'}</span>
            <input value={tr.title} onChange={(e) => setTr({ title: e.target.value })} maxLength={250} lang={lang} />
          </label>
          <label className="a-field">
            <span>Tóm tắt (hiển thị ở danh sách và kết quả tìm kiếm Google)</span>
            <textarea rows={3} value={tr.excerpt} onChange={(e) => setTr({ excerpt: e.target.value })} maxLength={600} lang={lang} />
          </label>
          <div className="a-field">
            <div className="a-field__row">
              <span>Nội dung</span>
              <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setPicker('body')} disabled={preview}>
                <Icon name="image" /> Chèn ảnh
              </button>
              <div className="a-seg">
                <button type="button" className={!preview ? 'is-active' : undefined} onClick={() => setPreview(false)}>
                  Soạn
                </button>
                <button type="button" className={preview ? 'is-active' : undefined} onClick={() => setPreview(true)}>
                  Xem trước
                </button>
              </div>
            </div>
            {preview ? (
              <div className="a-preview md" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <textarea ref={bodyRef} className="a-mono" rows={18} value={tr.body} onChange={(e) => setTr({ body: e.target.value })} lang={lang} />
            )}
            <p className="a-hint">
              Định dạng Markdown: <code>## Tiêu đề mục</code> · <code>**in đậm**</code> · <code>- gạch đầu dòng</code> · <code>&gt; trích dẫn</code> · <code>[chữ](https://link)</code>
            </p>
          </div>
        </div>

        <aside className="a-editor__side">
          <div className="a-panel">
            <h2 className="a-h2">Xuất bản</h2>
            <label className="a-check">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              <span>Hiển thị trên website</span>
            </label>
            <label className="a-field">
              <span>Ngày đăng (giờ VN)</span>
              <input type="datetime-local" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} />
            </label>
            <label className="a-field">
              <span>Đường dẫn (slug)</span>
              <input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm({ ...form, slug: slugify(e.target.value) });
                }}
              />
              <small className="a-hint">/tin-tuc/{form.slug || '…'}</small>
            </label>
          </div>

          <div className="a-panel">
            <h2 className="a-h2">Ảnh đại diện</h2>
            {form.coverImage ? (
              <div className="a-cover">
                <img src={sized(form.coverImage, 800)} alt="" />
                <button type="button" className="a-icon-btn a-icon-btn--danger" onClick={() => setForm({ ...form, coverImage: null })} title="Bỏ ảnh">
                  <Icon name="x" />
                </button>
              </div>
            ) : null}
            <button type="button" className="a-upload" onClick={() => setPicker('cover')}>
              <Icon name="image" />
              <span>{form.coverImage ? 'Đổi ảnh' : 'Chọn từ thư viện ảnh'}</span>
            </button>
          </div>

          <div className="a-panel">
            <h2 className="a-h2">Thư viện ảnh ({form.gallery.length})</h2>
            <div className="a-gallery">
              {form.gallery.map((g, i) => (
                <div key={g + i}>
                  <img src={thumb(g)} alt="" />
                  <button type="button" className="a-icon-btn a-icon-btn--danger" onClick={() => setForm({ ...form, gallery: form.gallery.filter((_, j) => j !== i) })} title="Bỏ khỏi bài">
                    <Icon name="x" />
                  </button>
                  <div className="a-gallery__move">
                    <button type="button" onClick={() => moveGallery(i, -1)} disabled={i === 0} aria-label="Lên trước">
                      ‹
                    </button>
                    <button type="button" onClick={() => moveGallery(i, 1)} disabled={i === form.gallery.length - 1} aria-label="Ra sau">
                      ›
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="a-upload" onClick={() => setPicker('gallery')}>
              <Icon name="plus" />
              <span>Thêm ảnh từ thư viện</span>
            </button>
          </div>
        </aside>
      </div>
      <MediaPicker
        open={picker !== null}
        multiple={picker !== 'cover'}
        title={picker === 'cover' ? 'Chọn ảnh đại diện' : picker === 'gallery' ? 'Thêm ảnh vào thư viện của bài' : 'Chèn ảnh vào nội dung'}
        onClose={() => setPicker(null)}
        onSelect={onPicked}
      />
      <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast({ msg: '' })} />
    </>
  );
}
