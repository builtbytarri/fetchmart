"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DownloadModal } from './download-modal';

const AnimatedNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const defaultTextColor = 'text-gray-300';
  const hoverTextColor = 'text-white';
  const textSizeClass = 'text-sm';

  return (
    <Link href={href} className={`group relative inline-block overflow-hidden h-5 flex items-center ${textSizeClass}`}>
      <div className="flex flex-col transition-transform duration-400 ease-out transform group-hover:-translate-y-1/2">
        <span className={defaultTextColor}>{children}</span>
        <span className={hoverTextColor}>{children}</span>
      </div>
    </Link>
  );
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isOpen) {
      setHeaderShapeClass('rounded-xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass('rounded-full');
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const logoElement = (
    <Link href="/home" className="flex items-center">
      <Image
        src="/images/logo.png"
        alt="FetchMart"
        width={140}
        height={40}
        className="h-8 w-auto"
        priority
      />
    </Link>
  );

  const navLinksData = [
    { label: 'Home', href: '/home' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const shopNowButton = (
    <div className="relative group w-full sm:w-auto">
       <div className="absolute inset-0 -m-2 rounded-full
                     hidden sm:block
                     bg-[#4CAF50]
                     opacity-40 filter blur-lg pointer-events-none
                     transition-all duration-300 ease-out
                     group-hover:opacity-60 group-hover:blur-xl group-hover:-m-3"></div>
       <button 
         onClick={() => setIsModalOpen(true)}
         className="relative z-10 px-4 py-2 sm:px-3 text-xs sm:text-sm font-semibold text-white bg-gradient-to-br from-[#4CAF50] to-[#388E3C] rounded-full hover:from-[#66BB6A] hover:to-[#4CAF50] transition-all duration-200 w-full sm:w-auto inline-block text-center"
       >
         Shop Now
       </button>
    </div>
  );

  return (
    <>
      <header className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-20
                         flex flex-col items-center
                         pl-6 pr-6 py-3 backdrop-blur-md
                         ${headerShapeClass}
                         bg-[#1f1f1f85]
                         w-[calc(100%-2rem)] sm:w-auto
                         transition-[border-radius] duration-0 ease-in-out`}>

        <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-10">
          <div className="flex items-center mr-4 sm:mr-8">
             {logoElement}
          </div>

          <nav className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-sm">
            {navLinksData.map((link) => (
              <AnimatedNavLink key={link.href} href={link.href}>
                {link.label}
              </AnimatedNavLink>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            {shopNowButton}
          </div>

          <button className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none" onClick={toggleMenu} aria-label={isOpen ? 'Close Menu' : 'Open Menu'}>
            {isOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            )}
          </button>
        </div>

        <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                         ${isOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
          <nav className="flex flex-col items-center space-y-4 text-base w-full">
            {navLinksData.map((link) => (
              <a key={link.href} href={link.href} className="text-gray-300 hover:text-white transition-colors w-full text-center">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col items-center space-y-4 mt-4 w-full">
            {shopNowButton}
          </div>
        </div>
      </header>

      <DownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
