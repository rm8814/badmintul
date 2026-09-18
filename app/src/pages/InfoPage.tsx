type InfoPageProps = {
  title: string
  eyebrow: string
  description: string
}

export default function InfoPage({ title, eyebrow, description }: InfoPageProps) {
  return <main className="min-h-screen bg-brand-bg text-neutral-900"><nav className="border-b border-neutral-200/70 bg-white px-5 py-4 sm:px-8"><div className="content-container flex items-center justify-between"><a className="text-xl font-extrabold tracking-tight" href="/">badmintul<span className="text-brand-primary">.</span></a><a className="rounded-control border border-brand-primary px-4 py-2 text-sm font-bold text-brand-primary" href="/login">Masuk</a></div></nav><section className="content-container px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-2xl rounded-card-lg border border-border-subtle bg-surface p-6 shadow-card sm:p-10"><p className="text-sm font-bold uppercase tracking-[.2em] text-brand-accent">{eyebrow}</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight">{title}</h1><p className="mt-4 leading-7 text-content-muted">{description}</p><div className="mt-8 rounded-card border border-brand-warning/30 bg-brand-warning/10 p-5 text-sm text-neutral-700"><p className="font-bold text-neutral-900">Halaman ini sedang disiapkan.</p><p className="mt-2 leading-6">Konten resmi akan ditambahkan setelah mendapat persetujuan. Untuk pertanyaan sementara, hubungi tim badmintul melalui kanal support yang tersedia.</p></div><a className="mt-8 inline-block rounded-control bg-brand-primary px-5 py-3 font-bold text-white" href="/">Kembali ke beranda</a></div></section></main>
}
