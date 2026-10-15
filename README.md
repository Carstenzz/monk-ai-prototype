# Monk Defense — Prototype

Prototype playable (canvas) untuk game biksu defensif — versi arena 2D 3×5 dengan 4 arah hadap.

## Jalankan
- Lokal: `python3 -m http.server` di folder ini, lalu buka `http://localhost:8000`.
- GitHub Pages: upload semua isi folder ke repo, Settings > Pages > Deploy from branch (root).

## Struktur
- `index.html`, `style.css` — halaman dan styling
- `game.js` — logika game (aturan, AI musuh, spawn grapple, input, render)
- `assets.js` — daftar aset (path PNG + aspect ratio)
- `assets/` — sprite, kartu, ikon intensi

## Kontrol
Swipe atas/bawah/kiri/kanan = jalan 1 tile (arah hadap tidak berubah). Putar hadap: tap biksu, lalu tap tile di sebelahnya (di tepi arena, tap area luar untuk menghadap ke luar). 5 kartu tetap (pull, swap, push, twist, throw): drag ke atas = pakai, lalu cooldown 4 giliran per kartu. Tombol bawah = tunggu 1 giliran.
Keyboard: panah = jalan, Shift+panah = putar hadap, 1-5 untuk kartu, Spasi/W = tunggu.
