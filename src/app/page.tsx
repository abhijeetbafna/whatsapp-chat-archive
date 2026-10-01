import Link from 'next/link';
import { Upload, Lock, Search, Image as ImageIcon, FileArchive, ArrowRight } from 'lucide-react';
import { YourArchivesSection } from '../components/archive/YourArchivesSection';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#0c1317] text-slate-900 dark:text-[#e9edef] transition-colors">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-[#222e35] bg-white/80 dark:bg-[#111b21]/80 backdrop-blur-md transition-colors">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <FileArchive size={20} />
            </div>
            <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-[#e9edef]">WhatsApp Chat Archive</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/archives"
              className="text-sm font-semibold text-slate-600 dark:text-[#8696a0] hover:text-slate-900 dark:hover:text-[#e9edef] transition-colors"
            >
              Library
            </Link>
            <ThemeToggle />
            <Link 
              href="/import" 
              className="inline-flex h-9 items-center justify-center rounded-full bg-slate-900 dark:bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500 focus:ring-offset-2"
            >
              Import Chat
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white dark:bg-[#0c1317] pt-24 pb-20 sm:pt-32 sm:pb-28 transition-colors">
          <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-emerald-50/60 dark:from-emerald-950/20 to-white dark:to-[#0c1317]"></div>
          <div className="container relative mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
            
            <div className="mb-6 inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
              <Lock className="mr-2 h-4 w-4" />
              Private by design — stays on your device.
            </div>
            
            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 dark:text-[#e9edef] sm:text-6xl md:text-7xl">
              Turn your WhatsApp exports into{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                beautiful archives
              </span>
            </h1>
            
            <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-[#8696a0] sm:text-xl">
              Import `.zip` or `.txt` chat exports directly in your browser. Read conversations with rich media,
              search full text, view shared documents, and export to PDF.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/import"
                className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-8 text-base font-medium text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/30 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
              >
                <Upload className="mr-2 h-5 w-5" />
                Import a Chat
              </Link>
              
              <Link
                href="/archives"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 dark:border-[#222e35] bg-white dark:bg-[#111b21] px-8 text-base font-medium text-slate-700 dark:text-[#e9edef] shadow-xs transition-colors hover:bg-slate-50 dark:hover:bg-[#202c33] focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                Go to Library
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Local Archives Section */}
        <section className="bg-slate-50 dark:bg-[#111b21] py-12 border-t border-slate-200 dark:border-[#222e35] transition-colors">
          <YourArchivesSection />
        </section>

        {/* Steps Section */}
        <section className="border-t border-slate-200 dark:border-[#222e35] bg-slate-50/50 dark:bg-[#0c1317] py-20 transition-colors">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-[#e9edef] sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-[#8696a0]">
                Three simple steps to read your messages in a familiar WhatsApp interface.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 dark:border-[#222e35] bg-white dark:bg-[#111b21] p-8 shadow-xs transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold">
                  1
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-[#e9edef]">Export from WhatsApp</h3>
                <p className="mt-3 text-slate-600 dark:text-[#8696a0]">
                  Open WhatsApp on your phone, choose a chat, tap More &gt; Export Chat, and select &quot;Attach Media&quot;.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-[#222e35] bg-white dark:bg-[#111b21] p-8 shadow-xs transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold">
                  2
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-[#e9edef]">Import into Archive</h3>
                <p className="mt-3 text-slate-600 dark:text-[#8696a0]">
                  Drag and drop the exported `.zip` file here. Everything stays in your browser, completely offline and private.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-[#222e35] bg-white dark:bg-[#111b21] p-8 shadow-xs transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold">
                  3
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-[#e9edef]">Read and Search</h3>
                <p className="mt-3 text-slate-600 dark:text-[#8696a0]">
                  Search, explore media, jump through dates and preserve the conversation forever.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white dark:bg-[#0c1317] py-24 sm:py-32 transition-colors">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-y-16 md:grid-cols-2 md:gap-x-12 md:gap-y-24 lg:gap-x-20">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#202c33] text-slate-700 dark:text-emerald-400">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-slate-900 dark:text-[#e9edef]">Lightning fast search</h3>
                <p className="mt-4 text-lg text-slate-600 dark:text-[#8696a0]">
                  Find exact messages, sender names, or filenames instantly. The search runs completely locally in your browser for maximum privacy.
                </p>
              </div>
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#202c33] text-slate-700 dark:text-emerald-400">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-slate-900 dark:text-[#e9edef]">Media-rich experience</h3>
                <p className="mt-4 text-lg text-slate-600 dark:text-[#8696a0]">
                  Images, videos, voice notes, and documents are automatically extracted and matched to their messages in the conversation.
                </p>
              </div>
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#202c33] text-slate-700 dark:text-emerald-400">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-slate-900 dark:text-[#e9edef]">Total privacy</h3>
                <p className="mt-4 text-lg text-slate-600 dark:text-[#8696a0]">
                  We don&apos;t upload your messages to any server. The processing happens securely inside your own web browser.
                </p>
              </div>
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#202c33] text-slate-700 dark:text-emerald-400">
                  <FileArchive className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-slate-900 dark:text-[#e9edef]">Local archives</h3>
                <p className="mt-4 text-lg text-slate-600 dark:text-[#8696a0]">
                  Close the app and come back later. Your parsed archives are saved in your browser&apos;s local storage for easy access.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-[#222e35] bg-slate-50 dark:bg-[#111b21] py-12 transition-colors">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <div className="flex items-center gap-2 text-slate-900 dark:text-[#e9edef]">
            <FileArchive size={20} />
            <span className="font-semibold">WhatsApp Chat Archive</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-[#8696a0] max-w-md md:text-right">
            This is an independent third-party archive tool and is not affiliated with or endorsed by WhatsApp or Meta.
          </p>
        </div>
      </footer>
    </div>
  );
}
