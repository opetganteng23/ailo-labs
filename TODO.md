# AILO Web - TODO

Rules: see [CLAUDE.md](CLAUDE.md). `[ ]` belum · `[~]` sedang dikerjakan · `[x]` selesai · `[!]` perlu keputusan user.
Sumber: `AILO_Evaluasi_Menyeluruh_dan_Rencana_Perbaikan.md` (evaluasi 30 Sep 2026).

## Keputusan user untuk evaluasi ini
- Header halaman dalam: tetap logo + Back (bukan nav lengkap), tapi satu komponen yang seragam.
- Research & Projects: halaman editor penuh (drawer dihapus), sama seperti News.
- Team Board: checkbox "Include in Team Board" di Members **dan** tambah manual di menu Team tetap ada.
- Kategori Team awal: Dosen, Peneliti, Peneliti Mahasiswa, Peneliti Alumni, Honorary Advisory Board (bisa dikelola admin).

## P0 - Critical
- [x] §15 Label "Valid until" saja (keterangan jadi helper text kecil) - DONE & VERIFIED on live (commit 633a049): reviewed a fresh pending applicant, label reads "Valid until" with "Empty = no expiry" helper text
- [x] §3 Join: tolak nama/email yang sudah terdaftar (backend, checked both on step 1 and on final submit) + pesan "Anda sudah menjadi member" - DONE & VERIFIED on live (633a049): tried a known member's name and a known member's email separately, both blocked with the message
- [x] §4 Contact Us sekali kirim: form hilang (sessionStorage-backed, survives reload in the same tab), confirmation + "cek email", tombol "Kembali ke Home"; also added confirmation email to sender + notice to admin - DONE & VERIFIED on live (633a049): sent a real message, confirmation shown with only "Kembali ke Home", persists after reloading the tab
- [x] §5 Balas pesan admin: loading (useActionState + useFormStatus spinner), sukses/gagal panel, penerima, status Sent, waktu kirim - DONE & VERIFIED on live (633a049): replied to the test message, saw "Reply berhasil dikirim. Recipient: ... Status: Sent Sent: ..."
- [x] §9 Logo tanpa kotak/latar di semua tempat - DONE & VERIFIED on live (633a049): checked computed background-color is transparent on admin sidebar, auth card, minimal header (Join), homepage header and footer. Left as-is: favicon (needs a raster icon) and the member card's own white ID-badge slot (intentional card design, not a stray background)
- [x] §6 (moved up, same code change) Message status NEW/OPENED/REPLIED/CLOSED + reply timeline - DONE & VERIFIED on live (633a049): status went New -> Opened (on click) -> Replied after sending, timeline showed the reply
- [x] Bugfix found while testing §15/§3 above: `/admin/members` and `/admin/research` compared a Mongoose ObjectId to a string with `===` (always false), so clicking any member/research row other than the tab's first item silently showed "Select an applicant to review" / never opened the edit drawer. Fixed both to compare via `String(_id) === id` - DONE & VERIFIED on live (c842069): opened an approved member and a pending member by their distinct IDs via fresh hard navigation, both showed the correct detail panel; opened a research item's edit drawer via its ID link, drawer opened with its data
- [x] §12-14 Team Board dari Members: checkbox "Include in Team Board" + kategori pada member yang approved (`setMemberTeamBoardAction`); toggle membuat/menonaktifkan (bukan menghapus) profil Team terkait; menu Team manual tetap ada; sinkron dua arah dengan toggle "Active" di form Team dan saat profil Team dihapus - DONE & VERIFIED on live (f3bd248): checkbox muncul di member approved; sebelum dicentang member TIDAK ada di /team publik; setelah dicentang + pilih kategori + Save, langsung muncul di /team; setelah dicentang-lagi (uncheck) + Save, langsung hilang lagi dari /team
- [x] §7-8 Header & footer: header interior sudah 1 komponen (`SiteHeader`, dipakai di semua halaman non-home) + `MinimalSiteHeader` untuk Join/Booking - ini sudah dari batch sebelumnya. Untuk footer: homepage.html (statis) dan `SiteFooter.tsx` masih 2 file terpisah (arsitektur homepage pakai template HTML + route.ts, bukan React page - migrasi penuh ke satu komponen berisiko tinggi untuk sesi ini), tapi kontennya sekarang disamakan persis (brand lockup, nomor telepon, format alamat 2 baris) dan bug kontras ditemukan+diperbaiki: `logo-horizontal.png` teksnya hitam, tidak kebaca di footer gelap - dibuat `logo-horizontal-light.png` (teks putih, ikon tetap warna) dipakai di kedua footer - DONE & VERIFIED on live (f3bd248): dicek dengan screenshot, wordmark "AILO" sekarang putih dan jelas terbaca di kedua footer (home & interior), teks (nomor telepon, alamat 2 baris) identik di keduanya. Follow-up dicatat di bawah untuk migrasi homepage yang sebenarnya. Catatan terpisah (bukan bug kode): kolom ADDRESS di /contact masih menampilkan placeholder "(SAMPLE, replace with real address)" - itu data di Admin -> Settings yang perlu diisi admin, bukan sesuatu yang perlu diperbaiki di kode.
- [x] §1 Editor lengkap: justify, H1-H4, font size/family, warna teks, highlight, code block, nested list - ditambahkan: Heading 1 & 4 (sudah ada H2/H3), align Justify, dropdown Font family (Default/Serif/Monospace) & Font size (Default/Small/Normal/Large/X-Large) lewat `@tiptap/extension-text-style`'s bundled Color/FontFamily/FontSize, swatch warna teks & highlight (native `<input type=color>` + tombol reset), toggle Code block, tombol Indent/Outdent untuk nested list (skema list sudah mendukung nested sejak awal via `@tiptap/extension-list-keymap` yang ikut ter-bundle di StarterKit, sekarang ada tombolnya juga) - verified: typecheck+lint+build pass; not yet re-checked on live
- [x] §1 Gambar di editor: resize proporsional, align/posisi, caption, alt text, hapus - node kustom `Figure` (`src/components/richtext/Figure.ts`) menggantikan `@tiptap/extension-image` bawaan: figcaption yang bisa diketik langsung (placeholder "Add a caption…"), toolbar mengambang saat gambar dipilih/di-hover berisi align kiri/tengah/kanan, pilihan lebar 25/50/75/100% (tetap proporsional karena tinggi otomatis), tombol edit alt text (prompt), tombol hapus; ada aturan parseHTML mundur-kompatibel untuk `<img>` polos dari konten lama. `sanitizeRichText` diperluas (figure/figcaption/mark/pre/code/span/h1, style color/background-color/font-family/font-size/width tervalidasi regex, class dibatasi ke align-kiri/tengah/kanan) - dicek manual: XSS lewat `<script>`, `onerror=`, `url(javascript:)`, dan CSS `expression()` tetap terblokir; atribut `data-type` sengaja tetap diizinkan supaya figure yang tersimpan bisa dikenali lagi saat draft dibuka ulang untuk diedit - verified: typecheck+lint+build pass + skrip node manual untuk sanitizer; not yet re-checked on live
- [x] §20 Editor mobile: toolbar scroll horizontal, tombol ramah sentuh - di bawah 640px toolbar tidak lagi menumpuk ke banyak baris, tapi geser horizontal (touch-scroll), tombol diperbesar untuk disentuh, toolbar gambar mengambang selalu terlihat (bukan hover, karena hover tidak ada di layar sentuh) - verified: typecheck+lint+build pass; not yet re-checked on live
- [ ] §16-18 Audit responsive 1920/1440/1366/1024/768/430/390/375/320 semua halaman publik
- [x] Bugfix (dilaporkan user 30 Sep): News summary dibatasi 280 karakter, artikel "Telkom Indonesia dan Telkom University..." terpotong di tengah kalimat - dinaikkan ke 500 - DONE & VERIFIED on live (23da3d2)
- [~] Bugfix (dilaporkan user 30 Sep, lanjutan): user menunjukkan screenshot section "Latest from the lab" di HOMEPAGE masih tampil gradient teal polos (bukan foto), padahal halaman /news yang sebenarnya sudah benar (sudah dicek Playwright, foto tampil). Penyebab: homepage pakai generator kartu berita terpisah di `src/app/route.ts` (`buildNewsCards`) untuk mengisi `public/homepage.html`, dan fungsi itu tidak pernah menyertakan cover image sama sekali (beda dengan `buildProjectCards`/`buildTeamCards` yang sudah benar) - ini bug lama, bukan regresi dari kerja hari ini. Sudah diperbaiki di kode (`route.ts` sekarang select `images` dan set `background-image` sama seperti /news), belum di-build/deploy/verifikasi live.
- [x] Bugfix ditemukan saat investigasi di atas: pesan error "An item with the same name or email already exists." (dibuat khusus untuk Members) muncul juga untuk Research/Projects/News saat terjadi duplicate slug, padahal resource itu tidak punya field name/email - `withFlash()` di `src/lib/flash.ts` sekarang membaca field mana yang bentrok dari MongoDB (`keyPattern`) dan menyusun pesannya sesuai itu (mis. "same slug already exists") - DONE & VERIFIED on live (a436313): typecheck+lint+build pass, dicek deploy log server

## P1 - High
- [ ] Follow-up dari §7-8: migrasi `public/homepage.html` + `src/app/route.ts` (template string + marker replace) jadi Next.js page.tsx biasa, supaya header/footer homepage benar-benar 1 komponen React yang sama dengan halaman lain, bukan HTML statis yang disalin manual. Pekerjaan besar & berisiko tinggi (836 baris HTML + 304 baris logic template), sengaja tidak dikerjakan di sesi evaluasi ini - hanya kontennya yang disamakan.
- [ ] §10-11 CMS seragam News/Research/Projects: List + Board, status Draft/Review/Published/Archived, search/filter/sort, preview
- [ ] §19 Admin & dosen mobile: header + tombol menu, sidebar jadi drawer
- [ ] §24 Loading state di semua tombol aksi (pending state)
- [ ] §21-23 Design system: skala tipografi & spacing sebagai variabel, rapikan nilai acak
- [ ] §26 Cek sisa API yang mengembalikan pesan teknis
- [ ] §27 Toast Warning & Info (selain Success/Error)

## P2 - Enhancement
- [ ] §13 Halaman kelola kategori Team
- [ ] §25 Komponen empty state seragam dengan tombol aksi

## Selesai sebelumnya (ringkas)
- [x] 20 temuan QA (Laporan Evaluasi Website AILO Official.pdf) - commit 8b51506 dst, dites Playwright di live
- [x] Dashboard dosen, booking pakai kartu member + QR pass, Join tanpa password, header Back - commit 40e6286..3b75ea9, dites end-to-end di live
- [x] Bug toast tidak muncul setelah server action (cookie ter-encode dua kali) - 0f9dd58
- [x] Slot booking yang sudah lewat hari ini dinonaktifkan - 87335e4
- [x] Mail server: APP_EMAIL/APP_PASSWORD diisi di .env server, SMTP OK

## Data uji di produksi (hapus kalau sudah tidak dipakai)
- Member + akun dosen "Rizky Fadhillah (QA Test)" rizkyfadhillahx@gmail.com, kartu AILO-2026-0001, password dosen `QaTest-2026!`. Team Board untuk member ini sudah dikembalikan ke OFF setelah pengujian §12-14 (tidak tampil di /team saat ini).
- Booking QA 30 Sep 2026 09:00-10:00 (approved)
- Contact message "QA Test Contact" / "QA test message - safe to ignore" - replied to during §5/§6 test, can be closed/deleted
- (Cleaned up) test pending applicant "QA ValidUntil Test ..." - rejected during verification, no longer in the database
