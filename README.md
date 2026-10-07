# Monk Defense — Prototype

Prototype playable (canvas) untuk game biksu defensif.

## Jalankan
- Lokal: jalankan server statis di folder ini (mis. `python3 -m http.server`) lalu buka `http://localhost:8000`.
- GitHub Pages: upload semua isi folder ke repo, lalu Settings > Pages > Deploy from branch (root). Buka URL-nya di HP.

## Struktur
- `index.html`, `style.css` — halaman dan styling
- `game.js` — seluruh logika game (aturan, AI musuh, input, render)
- `assets.js` — daftar aset (path PNG + aspect ratio)
- `assets/` — sprite, kartu, dan ikon intensi

## Kontrol
Swipe atas/bawah = gerak, kiri/kanan = putar. Drag kartu ke atas = pakai, drag ke bawah = buang semua kartu.
Keyboard: panah, 1-3 untuk kartu, D untuk discard.
