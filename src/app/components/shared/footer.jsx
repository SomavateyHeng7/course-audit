'use client';
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
    return (
        <footer className="footer">
        <div className="footer__content">
            <div className="footer__logo">
            <Image
                src="/images/logo.svg"
                alt="Logo"
                width={128}
                height={30}
            />
            </div>
            <div className="footer__links">
            <Link href="/about">
                <a>About</a>
            </Link>
            <Link href="/contact">
                <a>Contact</a>
            </Link>
            </div>
        </div>
        </footer>
    );
};

export default Footer;