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
- [ ] §1 Editor lengkap: justify, H1-H4, font size/family, warna teks, highlight, code block, nested list
- [ ] §1 Gambar di editor: resize proporsional, align/posisi, caption, alt text, hapus
- [x] §2 Research & Projects jadi halaman editor penuh (admin + dosen), drawer dihapus - `ResearchForm`/`ProjectForm` (dulu `ResearchDrawer`/`ProjectDrawer`) sekarang halaman penuh dengan layout 2 kolom yang sama dengan News (`admin2-editor-grid`: konten utama + sidebar Publishing/Cover image/checklist "Ready to publish"); rute baru `/admin/{research,projects}/new` dan `/{id}`, sama untuk `/dosen/{research,projects}/new` dan `/{id}`; overlay/panel dihapus total - DONE & VERIFIED on live (949369a): dibuat 1 research dan 1 project QA test lewat halaman penuh (tanpa overlay), keduanya berhasil tersimpan, muncul di list, bisa dibuka lagi lewat link per-baris (bukan hanya item pertama), checklist "Ready to publish" ter-update sesuai isian, tombol "+" per kolom di Project Board mengarah ke halaman penuh dengan status default terisi - lalu dihapus lagi (bersih, tidak ada data uji tersisa)
- [ ] §20 Editor mobile: toolbar scroll horizontal, tombol ramah sentuh
- [ ] §16-18 Audit responsive 1920/1440/1366/1024/768/430/390/375/320 semua halaman publik

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
