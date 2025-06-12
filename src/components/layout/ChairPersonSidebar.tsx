import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, User, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChairPersonSidebar() {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col justify-between shadow-md">
      <div>
        {/* Logo and Role */}
        <div className="flex flex-col items-center py-8">
          <Image src="/image/title.png" alt="EduTrack Logo" width={64} height={64} className="mb-2" />
          <div className="flex flex-col items-center bg-[#e6f4f1] rounded-xl p-4 w-40">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2 border-2 border-[#4bb89e]">
              <User className="w-8 h-8 text-[#4bb89e]" />
            </div>
            <span className="font-bold text-lg text-gray-700">CHAIRPERSON</span>
          </div>
        </div>
        {/* Navigation */}
        <div className="px-8 mt-8">
          <div className="mb-4">
            <span className="font-bold text-gray-700 text-md">OVERVIEW</span>
          </div>
          <nav className="flex flex-col gap-2">
            <Link href="/chairperson/curriculum" className="flex items-center gap-3 text-[#4bb89e] hover:bg-[#e6f4f1] px-3 py-2 rounded-lg font-medium transition">
              <LayoutDashboard className="w-5 h-5" />
              Curriculum
            </Link>
            <Link href="/profile" className="flex items-center gap-3 text-gray-700 hover:bg-[#e6f4f1] px-3 py-2 rounded-lg font-medium transition">
              <User className="w-5 h-5" />
              Profile
            </Link>
          </nav>
        </div>
      </div>
      {/* Log Out Button */}
      <div className="px-8 pb-8">
        <Button onClick={handleLogout} className="w-full flex items-center gap-2 bg-[#4bb89e] hover:bg-[#399e85] text-white font-semibold py-2 rounded-lg">
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
