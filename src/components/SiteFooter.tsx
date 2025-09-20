export default function SiteFooter() {
  return (
    <footer className="bg-slate-100 border-t border-slate-200 py-8 mt-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center text-sm text-slate-600">
          <p>© 2025 Abilitix. All rights reserved.</p>
          <p className="mt-2">
            <a href="https://abilitix.com.au/abilitix-privacy-policy/" className="hover:text-slate-800 underline">Privacy Policy</a>
            <span className="mx-2">•</span>
            <a href="https://abilitix.com.au/abilitix-pilot-terms-of-use/" className="hover:text-slate-800 underline">Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  );
}