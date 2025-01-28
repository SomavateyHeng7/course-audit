'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

const NavBar = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const router = useRouter();

    const handleSearch = (path) => {
        router.push(path);
    }

    return (
        <nav>
        <div className="nav__content">
            <div className="nav__logo">
            <Image
                src="/images/logo.svg"
                alt="Logo"
                width={128}
                height={30}
            />
            </div>
            <div className="nav__links">
            <Link href="/about">
                <a>About</a>
            </Link>
            <Link href="/contact">
                <a>Contact</a>
            </Link>
            </div>
        </nav>
        <header className="header">
        <div className="header__content">
            <div className="header__logo">
            <Image
                src="/images/logo.svg"
                alt="Logo"
                width={128}
                height={30}
            />
            </div>
            <div className="header__links">
            <Link href="/about">
                <a>About</a>
            </Link>
            <Link href="/contact">
                <a>Contact</a>
            </Link>
            </div>
        </div>
        </header>
    );
}