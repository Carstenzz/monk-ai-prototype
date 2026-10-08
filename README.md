# Monk Defense — Prototype

Prototype playable (canvas) untuk game biksu defensif.

## Jalankan
- Lokal: `python3 -m http.server` di folder ini, lalu buka `http://localhost:8000`.
- GitHub Pages: upload semua isi folder ke repo, Settings > Pages > Deploy from branch (root).

## Struktur
- `index.html`, `style.css` — halaman dan styling
- `game.js` — logika game (aturan, AI musuh, spawn grapple, input, render)
- `assets.js` — daftar aset (path PNG + aspect ratio)
- `assets/` — sprite, kartu, ikon intensi

## Kontrol
Swipe atas/bawah = gerak, kiri/kanan = putar. Drag kartu ke atas = pakai, drag ke bawah = buang semua.
Keyboard: panah, 1-3 untuk kartu, D untuk discard.
