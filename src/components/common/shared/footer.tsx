export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
       <footer className="py-12 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="font-montserrat text-sm text-gray-500 dark:text-gray-400">
            Copyright &copy; {currentYear} EduTrack. All rights reserved. Powered by sleepless night.
          </p>
        </div>
      </footer>
  );
}
