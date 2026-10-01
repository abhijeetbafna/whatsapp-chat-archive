import Link from 'next/link';
import { Upload, Lock, Search, Image as ImageIcon, FileArchive, ArrowRight } from 'lucide-react';
import { YourArchivesSection } from '../components/archive/YourArchivesSection';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <FileArchive size={20} />
            </div>
            <span className="text-xl font-semibold tracking-tight text-slate-900">WhatsApp Chat Archive</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/archives"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Library
            </Link>
            <Link 
              href="/import" 
              className="inline-flex h-9 items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Import Chat
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white pt-24 pb-20 sm:pt-32 sm:pb-28">
          <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-emerald-50/60 to-white"></div>
          <div className="container relative mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
            
            <div className="mb-6 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
              <Lock className="mr-2 h-4 w-4" />
              Private by design — stays on your device.
            </div>
            
            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
              Preserve your conversations.<br className="hidden sm:block" />
              <span className="text-emerald-600">Browse them like a chat.</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Import your WhatsApp exports and turn them into private, searchable, media-rich conversation archives that you can browse in a familiar interface.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/import" 
                className="group flex h-14 items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 text-lg font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Upload className="h-5 w-5" />
                Import a WhatsApp chat
                <ArrowRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/archives"
                className="flex h-14 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 text-lg font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <FileArchive className="h-5 w-5 text-slate-500" />
                <span>View Library</span>
              </Link>
            </div>
            <p className="mt-4 hidden text-sm text-slate-500 sm:block">No account required • 100% Offline & Private</p>

          </div>
        </section>

        {/* Existing Archives Section (Requirement 8) */}
        <YourArchivesSection />

        {/* How it works */}
        <section className="bg-slate-50 py-24 sm:py-32">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Turn your static export file into a beautiful archive in seconds.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:mt-24 md:grid-cols-3">
              {/* Step 1 */}
              <div className="relative flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Export your chat</h3>
                <p className="mt-3 text-slate-600">
                  Export a conversation from WhatsApp on your phone, choosing to include media if you want.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Import it here</h3>
                <p className="mt-3 text-slate-600">
                  Upload the WhatsApp ZIP file. Your file is processed entirely in your browser.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Browse your archive</h3>
                <p className="mt-3 text-slate-600">
                  Search, explore media, jump through dates and preserve the conversation forever.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white py-24 sm:py-32">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-y-16 md:grid-cols-2 md:gap-x-12 md:gap-y-24 lg:gap-x-20">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-slate-900">Lightning fast search</h3>
                <p className="mt-4 text-lg text-slate-600">
                  Find exact messages, sender names, or filenames instantly. The search runs completely locally in your browser for maximum privacy.
                </p>
              </div>
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-slate-900">Media-rich experience</h3>
                <p className="mt-4 text-lg text-slate-600">
                  Images, videos, voice notes, and documents are automatically extracted and matched to their messages in the conversation.
                </p>
              </div>
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-slate-900">Total privacy</h3>
                <p className="mt-4 text-lg text-slate-600">
                  We don&apos;t upload your messages to any server. The processing happens securely inside your own web browser.
                </p>
              </div>
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <FileArchive className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-slate-900">Local archives</h3>
                <p className="mt-4 text-lg text-slate-600">
                  Close the app and come back later. Your parsed archives are saved in your browser&apos;s local storage for easy access.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <div className="flex items-center gap-2 text-slate-900">
            <FileArchive size={20} />
            <span className="font-semibold">WhatsApp Chat Archive</span>
          </div>
          <p className="text-sm text-slate-500 max-w-md md:text-right">
            This is an independent third-party archive tool and is not affiliated with or endorsed by WhatsApp or Meta.
          </p>
        </div>
      </footer>
    </div>
  );
}
