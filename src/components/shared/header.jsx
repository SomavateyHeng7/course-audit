import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Course Audit</span>
            <h1 className="text-2xl font-bold">Course Audit</h1>
          </Link>
        </div>
        <div className="flex flex-1 justify-end">
          <Link
            href="/settings"
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Settings <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </nav>
    </header>
  );
} 
