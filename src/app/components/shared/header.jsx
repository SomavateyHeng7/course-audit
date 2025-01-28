'use client';
import Image from "next/image";
import Link from "next/link";

const Header = () => {
    const router = useRouter();

    const handleRedirect = (path) => {
        router.push(path);
    }

    return (
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
};

export default Header;