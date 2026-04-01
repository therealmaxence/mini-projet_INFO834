import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-gray-900/5">
        
        {/* 404 Content */}
        <div className="space-y-4">
          <h1 className="text-9xl font-black text-gray-200">404</h1>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Page not found
          </h2>
          <p className="text-base text-gray-600">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or perhaps it never existed at all.
          </p>
        </div>
        
        {/* Action Button */}
        <div className="pt-6">
          <Link
            href="/home" // Adjust this to your main dashboard or home route
            className="inline-flex w-full justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
          >
            Take me home
          </Link>
        </div>
        
      </div>
    </div>
  );
}