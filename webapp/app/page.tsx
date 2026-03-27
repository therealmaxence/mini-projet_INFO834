import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 text-xl font-bold tracking-tighter">
            ChatApp.
          </Link>
        </div>
        <div className="flex flex-1 justify-end gap-x-4">
          <Link
            href="/login"
            className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600 transition-colors py-2 px-3"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-3xl py-32 sm:py-48 lg:py-56 text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl">
              Conversations, <br /> stripped of the noise.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-500 max-w-xl mx-auto">
              A lightning-fast, beautifully minimal messaging platform designed for deep focus and seamless connection. No clutter. Just chat.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/register"
                className="rounded-full bg-black px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all hover:scale-105"
              >
                Start chatting for free
              </Link>
            </div>
          </div>
        </div>

        {/* Minimal Feature Grid */}
        <div className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-gray-500">Everything you need</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Simplicity at its core.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                
                {/* Feature 1 */}
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <svg className="h-5 w-5 flex-none text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Real-time Sync
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">Messages are delivered instantly across all your devices with zero lag.</p>
                  </dd>
                </div>

                {/* Feature 2 */}
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <svg className="h-5 w-5 flex-none text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    End-to-End Secure
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">Your privacy is paramount. Every conversation is locked down and encrypted.</p>
                  </dd>
                </div>

                {/* Feature 3 */}
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <svg className="h-5 w-5 flex-none text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                    Clean Interface
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">A distraction-free environment that lets you focus entirely on the conversation.</p>
                  </dd>
                </div>

              </dl>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white py-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} ChatApp Inc. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}