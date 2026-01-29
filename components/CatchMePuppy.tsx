"use client";

import { useEffect, useState } from "react";

export default function CatchMePuppy() {
    const [position, setPosition] = useState({ x: 50, y: 50 });
    const [isVisible, setIsVisible] = useState(true);
    const [message, setMessage] = useState("Catch me if you can! 🐕");

    const moveToRandomPosition = () => {
        const newX = Math.random() * (window.innerWidth - 80);
        const newY = Math.random() * (window.innerHeight - 80);
        setPosition({ x: newX, y: newY });
    };

    const handleMouseEnter = () => {
        // Puppy escapes when mouse gets close
        moveToRandomPosition();
        setMessage("Too slow! 😄");
        setTimeout(() => setMessage("Catch me if you can! 🐕"), 1500);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        // Puppy escapes when clicked
        moveToRandomPosition();
        setMessage("Nice try! 🏃");
        setTimeout(() => setMessage("Catch me if you can! 🐕"), 1500);
    };

    useEffect(() => {
        // Puppy randomly moves every 3 seconds
        const interval = setInterval(() => {
            moveToRandomPosition();
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    if (!isVisible) return null;

    return (
        <>
            {/* Floating Message - Positioned below header */}
            <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <div className="bg-purple-600/90 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-2xl border border-purple-400/50">
                    <p className="text-white font-bold text-xs sm:text-sm">{message}</p>
                </div>
            </div>

            {/* Cute Puppy */}
            <div
                className="fixed z-40 cursor-pointer transition-all duration-300 hover:scale-110"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
                onMouseEnter={handleMouseEnter}
                onClick={handleClick}
            >
                <div className="relative animate-bounce">
                    <svg
                        width="70"
                        height="80"
                        viewBox="0 0 200 240"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="drop-shadow-2xl filter"
                    >
                        {/* Glow effect */}
                        <circle cx="100" cy="120" r="90" fill="url(#puppyGlow)" opacity="0.2" />

                        {/* Body - Dark gray */}
                        <ellipse cx="100" cy="160" rx="50" ry="60" fill="#4A5568" />

                        {/* White chest */}
                        <ellipse cx="100" cy="170" rx="25" ry="45" fill="#F7FAFC" />

                        {/* Head - White/cream */}
                        <circle cx="100" cy="80" r="45" fill="#F7FAFC" />

                        {/* Dark patches on head */}
                        <ellipse cx="70" cy="70" rx="25" ry="35" fill="#2D3748" transform="rotate(-15 70 70)" />
                        <ellipse cx="130" cy="70" rx="25" ry="35" fill="#2D3748" transform="rotate(15 130 70)" />

                        {/* Ears - Floppy */}
                        <ellipse cx="60" cy="60" rx="18" ry="35" fill="#2D3748" transform="rotate(-25 60 60)" />
                        <ellipse cx="140" cy="60" rx="18" ry="35" fill="#2D3748" transform="rotate(25 140 60)" />

                        {/* Paw print on forehead */}
                        <ellipse cx="100" cy="55" rx="8" ry="10" fill="#9CA3AF" opacity="0.6" />
                        <circle cx="95" cy="48" r="3" fill="#9CA3AF" opacity="0.6" />
                        <circle cx="105" cy="48" r="3" fill="#9CA3AF" opacity="0.6" />

                        {/* Eyes - Big and cute */}
                        <ellipse cx="85" cy="75" rx="12" ry="15" fill="white" />
                        <ellipse cx="115" cy="75" rx="12" ry="15" fill="white" />

                        {/* Eye pupils - Blue */}
                        <circle cx="85" cy="77" r="8" fill="#3B82F6" />
                        <circle cx="115" cy="77" r="8" fill="#3B82F6" />

                        {/* Eye highlights */}
                        <circle cx="82" cy="73" r="4" fill="white" />
                        <circle cx="112" cy="73" r="4" fill="white" />
                        <circle cx="87" cy="79" r="2" fill="white" opacity="0.7" />
                        <circle cx="117" cy="79" r="2" fill="white" opacity="0.7" />

                        {/* Nose - Dark brown */}
                        <ellipse cx="100" cy="100" rx="10" ry="8" fill="#2D3748" />

                        {/* Snout highlight */}
                        <ellipse cx="100" cy="95" rx="15" ry="12" fill="#E2E8F0" />

                        {/* Mouth */}
                        <path d="M 100 100 L 100 108" stroke="#2D3748" strokeWidth="2" />
                        <path d="M 100 108 Q 90 112 85 110" stroke="#2D3748" strokeWidth="2" fill="none" />
                        <path d="M 100 108 Q 110 112 115 110" stroke="#2D3748" strokeWidth="2" fill="none" />

                        {/* Red collar */}
                        <ellipse cx="100" cy="125" rx="35" ry="8" fill="#DC2626" />
                        <ellipse cx="100" cy="123" rx="35" ry="6" fill="#EF4444" />

                        {/* Collar buckle */}
                        <rect x="95" y="120" width="10" height="8" rx="2" fill="#D1D5DB" />
                        <rect x="97" y="122" width="6" height="4" rx="1" fill="#9CA3AF" />

                        {/* Front paws */}
                        <ellipse cx="75" cy="210" rx="15" ry="20" fill="#4A5568" />
                        <ellipse cx="125" cy="210" rx="15" ry="20" fill="#4A5568" />

                        {/* Paw pads */}
                        <ellipse cx="75" cy="218" rx="10" ry="8" fill="#F7FAFC" />
                        <ellipse cx="125" cy="218" rx="10" ry="8" fill="#F7FAFC" />

                        {/* Spots on body */}
                        <ellipse cx="80" cy="150" rx="12" ry="15" fill="#2D3748" opacity="0.6" />
                        <ellipse cx="120" cy="165" rx="10" ry="12" fill="#2D3748" opacity="0.6" />

                        {/* Tail - Wagging */}
                        <path
                            d="M 50 155 Q 30 140 25 160 Q 22 175 28 185"
                            stroke="#2D3748"
                            strokeWidth="12"
                            fill="none"
                            strokeLinecap="round"
                        >
                            <animateTransform
                                attributeName="transform"
                                attributeType="XML"
                                type="rotate"
                                from="-15 50 155"
                                to="15 50 155"
                                dur="0.4s"
                                repeatCount="indefinite"
                                direction="alternate"
                            />
                        </path>

                        {/* Gradient definitions */}
                        <defs>
                            <radialGradient id="puppyGlow">
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                    </svg>

                    {/* Sparkle effects */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-300 rounded-full animate-ping" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-300 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
                </div>
            </div>
        </>
    );
}
