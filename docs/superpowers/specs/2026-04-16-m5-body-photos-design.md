# M5 — Body Photos Design Spec

**Status:** Approved
**Date:** 2026-04-16
**Branch:** `m5-body-photos`
**Depends on:** M0 (schema), M1 (auth), M6 (XP system)

## 1. Cíl

Upload, zpracování a prohlížení progress fotek. Uživatel může fotit svou transformaci v 4 pózách (front/side/back/other), prohlížet v gridu/timeline/před×po, a sledovat vizuální změny v čase.

## 2. Scope

| Feature | Popis |
|---------|-------|
| Upload pipeline | HEIC→JPEG client, sharp resize+EXIF strip server, thumbnail, auth-gated serving |
| Grid view | Miniatury grouped by week, tap → fullscreen |
| Timeline view | Chronologické karty s datem + pose |
| Před × Po view | Dva date pickery, side-by-side + overlay slider |
| Delete | Smazání fotek + souborů + XP reversal |

## 3. Upload Pipeline

### 3.1 Client-side

1. User vybere soubor(y) přes `<input type="file" accept="image/*" capture="environment">`
2. Pokud HEIC/HEIF → `heic2any` konvertuje na JPEG blob (client-side, neposílat HEIC na server)
3. Preview v upload dialogu
4. User vybere: pose (front/side/back/other), datum (default = dnes)
5. `POST /api/photos` s `FormData`: file blob + pose + takenAt

### 3.2 Server-side

`POST /api/photos` (multipart):

1. Auth check (`requireSessionUser`)
2. `Request.formData()` — Next.js App Router native, žádný multer
3. Validace:
   - File size ≤ 10 MB
   - MIME type: image/jpeg, image/png, image/webp (HEIC already converted client-side)
   - Pose: one of `front | side | back | other`
   - takenAt: valid YYYY-MM-DD
4. Processing (sharp):
   - Resize: max 2048×2048, keeping aspect ratio, JPEG quality 85
   - EXIF strip: `sharp().rotate()` (auto-orient) then strip metadata
   - Thumbnail: 400×400 max, JPEG quality 75
5. Storage:
   - Directory: `./uploads/{userId}/`
   - Full: `{uuid}.jpg`
   - Thumb: `{uuid}_thumb.jpg`
   - Create directory if not exists (`mkdir -p`)
6. DB insert into `bodyPhotos`:
   - `storageKey` = `{userId}/{uuid}` (bez .jpg — přípona je implicitní)
   - `weekStart` = computed from `takenAt` via `toWeekStart()`
   - `widthPx`, `heightPx` = z sharp metadata po resize
   - `byteSize` = full image byte size
7. XP award: `photo_uploaded` (+15 XP)
8. Response: `{ id, thumbUrl, fullUrl, xpDelta, ... }`

### 3.3 Serving

`GET /api/photos/[id]` — full resolution image
`GET /api/photos/[id]/thumb` — thumbnail

Oba:
1. Auth check
2. DB lookup + ownership check
3. Read file from `./uploads/{storageKey}.jpg` (nebo `_thumb.jpg`)
4. Response: image/jpeg stream, headers:
   - `Cache-Control: private, max-age=86400` (1 den, private)
   - `Content-Type: image/jpeg`
   - `Content-Disposition: inline`

### 3.4 Delete

`DELETE /api/photos/[id]`:
1. Auth + ownership check
2. Delete files (full + thumb) from disk
3. Delete DB row
4. XP reversal: `-15` via `awardXp({ event: 'photo_uploaded', ... })` s negativním delta
5. Response: `{ deleted: true, xpDelta }`

## 4. Storage

```
uploads/
  {userId}/
    {uuid}.jpg          ← full (max 2048px, EXIF stripped)
    {uuid}_thumb.jpg    ← thumbnail (max 400px)
```

- `./uploads` v `.gitignore` (už je)
- UUID v4 pro filenames — žádné user-controlled cesty
- Fáze 2+: `FileStorage` interface s S3 implementací (zatím jen disk)

## 5. View Modes

### 5.1 Grid

Default view. Miniatury v CSS gridu (3 sloupce na mobile, 4+ na desktop).

- Grouped by week (header = "Týden od 14.4.")
- Thumbnail image + pose badge overlay (malý F/S/B/O v rohu)
- Tap → fullscreen lightbox (swipe between photos)
- Stav: `GET /api/photos?view=grid` — vrací všechny fotky, cursor pagination

### 5.2 Timeline

Vertikální timeline, větší karty.

- Karta: datum, pose label, thumbnail (větší než grid), note
- Chronologicky DESC (nejnovější nahoře)
- Stav: stejná data jako grid, jen jiný layout

### 5.3 Před × Po (Before/After)

Side-by-side porovnání dvou dat.

- Dva date pickery (from / to)
- Pose filtr (front/side/back/all)
- Layout: dvě fotky vedle sebe (mobile: stacked vertically)
- Overlay slider: CSS `clip-path` s draggable divider — levá strana = before, pravá = after
- Fallback: pokud pro vybrané datum/pózu neexistuje fotka → "Žádná fotka" placeholder

## 6. UI Struktura

### 6.1 SegmentControl rozšíření

```
Body | Výživa | Síla | Fotky
```

`/progress/photos` jako 4. tab.

### 6.2 `/progress/photos` layout

```
┌──────────────────────────────┐
│  SegmentControl              │
├──────────────────────────────┤
│  View switcher [Grid|Time|B&A]│
├──────────────────────────────┤
│                              │
│  [active view content]       │
│                              │
│                              │
├──────────────────────────────┤
│              [+] Upload FAB  │
└──────────────────────────────┘
```

### 6.3 Upload Sheet

BottomSheet (existující Radix dialog):
- File input (camera / gallery)
- Preview (po výběru)
- Pose picker: 4 buttony (Front / Side / Back / Other)
- Date picker: default = dnes
- Upload button + progress bar
- Multi-upload: one at a time, ale sheet zůstane otevřený pro další

### 6.4 Fullscreen Lightbox

- Overlay přes celou stránku
- Swipe left/right pro navigaci
- Pinch-to-zoom (CSS `touch-action: manipulation` + transform)
- Close: tap X nebo swipe down
- Info overlay: datum, pose, note
- Delete button (s confirm dialogem)

## 7. API Endpoints

| Method | Route | Popis |
|--------|-------|-------|
| GET | `/api/photos` | List fotek, cursor pagination, `?pose=` filtr |
| POST | `/api/photos` | Upload (multipart FormData) |
| GET | `/api/photos/[id]` | Full resolution image stream |
| GET | `/api/photos/[id]/thumb` | Thumbnail image stream |
| DELETE | `/api/photos/[id]` | Smazat fotku + soubory + XP reversal |
| GET | `/api/photos/dates` | Distinct dates s fotkami (pro Before/After pickery) |

### GET `/api/photos` response

```json
{
  "items": [
    {
      "id": 42,
      "takenAt": "2026-04-16",
      "weekStart": "2026-04-14",
      "pose": "front",
      "thumbUrl": "/api/photos/42/thumb",
      "fullUrl": "/api/photos/42",
      "widthPx": 1200,
      "heightPx": 1600,
      "note": null,
      "createdAt": "2026-04-16T10:30:00Z"
    }
  ],
  "nextCursor": "41"
}
```

### GET `/api/photos/dates` response

```json
{
  "dates": ["2026-04-16", "2026-04-09", "2026-04-02"]
}
```

## 8. Nové závislosti

```json
{
  "sharp": "^0.33",
  "heic2any": "^0.0.4"
}
```

`sharp` je native addon (libvips) — nainstaluje se s prebuild binaries pro macOS. Žádný problém pro lokální dev.

## 9. Nové soubory

```
src/lib/photo-storage.ts                   — read/write/delete files, path helpers
src/lib/photo-processing.ts                — sharp resize, EXIF strip, thumbnail
src/lib/queries/photos.ts                  — DB queries (list, getById, insert, delete)

src/app/api/photos/route.ts                — GET (list) + POST (upload)
src/app/api/photos/[id]/route.ts           — GET (full image) + DELETE
src/app/api/photos/[id]/thumb/route.ts     — GET (thumbnail)
src/app/api/photos/dates/route.ts          — GET (distinct dates)

src/app/(app)/progress/photos/page.tsx     — server component wrapper
src/components/photos/PhotosPageClient.tsx  — main client component
src/components/photos/PhotoGrid.tsx         — grid view
src/components/photos/PhotoTimeline.tsx     — timeline view
src/components/photos/BeforeAfter.tsx       — before/after comparison
src/components/photos/UploadSheet.tsx       — upload bottom sheet
src/components/photos/Lightbox.tsx          — fullscreen viewer
src/components/photos/PoseBadge.tsx         — F/S/B/O badge overlay
```

## 10. Modifikace existujících souborů

- `src/components/ui/SegmentControl.tsx` — přidat "Fotky" tab
- `src/app/(app)/dashboard/page.tsx` — volitelně: "Poslední fotka" widget (low priority, skip pro MVP)

## 11. Testování

### Unit testy
- `photo-storage.ts` — path generation, read/write/delete (mock fs)
- `photo-processing.ts` — resize dimensions, EXIF strip verification

### Integration testy
- `POST /api/photos` — upload flow, DB insert, file creation
- `GET /api/photos` — pagination, pose filter
- `DELETE /api/photos/[id]` — file cleanup, XP reversal
- Ownership: cizí fotka → 404

### E2E
- Upload fotku → zobrazí se v gridu → tap → fullscreen → delete

## 12. Neřešit v M5

- Timelapse view (animace fotek jako video)
- AI auto-detection pose (front/side/back)
- AI auto-alignment (scale + rotate)
- Automatická anonymizace obličeje
- Video progress
- S3/cloud storage (Fáze 2+)
- Multi-file upload (one at a time v této verzi)
- Dashboard "poslední fotka" widget
