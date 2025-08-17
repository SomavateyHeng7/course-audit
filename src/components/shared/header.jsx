import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="bg-white">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <span className="sr-only">Course Audit</span>
            <Image src="/image/logo.png" alt="EduTrack Logo" width={32} height={32} priority />
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
