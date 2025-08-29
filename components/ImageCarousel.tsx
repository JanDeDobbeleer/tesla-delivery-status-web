import React, { useState, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface CarouselImage {
    src: string;
    alt: string;
    label: string;
}

interface ImageCarouselProps {
    images: CarouselImage[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    const goToPrevious = useCallback(() => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    }, [currentIndex, images.length]);

    const goToNext = useCallback(() => {
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    }, [currentIndex, images.length]);

    const goToSlide = (slideIndex: number) => {
        setCurrentIndex(slideIndex);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null) {
            return;
        }

        const touchEndX = e.changedTouches[0].clientX;
        const touchDiff = touchStartX - touchEndX;
        const minSwipeDistance = 50; // Minimum distance in pixels for a swipe gesture

        if (touchDiff > minSwipeDistance) {
            // Swiped left
            goToNext();
        } else if (touchDiff < -minSwipeDistance) {
            // Swiped right
            goToPrevious();
        }

        setTouchStartX(null); // Reset for the next swipe
    };
    
    if (!images || images.length === 0) {
        return null;
    }

    return (
        <div 
            className="h-64 w-full relative group bg-gray-100 dark:bg-black/20"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Image container with cross-fade effect */}
            <div className="w-full h-full">
                {images.map((image, index) => (
                    <img
                        key={image.src}
                        src={image.src}
                        alt={image.alt}
                        className={`absolute inset-0 w-full h-full object-contain p-2 transition-opacity duration-500 ease-in-out ${
                            index === currentIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                        loading={index === 0 ? 'eager' : 'lazy'} // Eagerly load the first image
                        draggable="false" // Prevent default browser drag behavior which interferes with swipe
                    />
                ))}
            </div>

            {/* View Label */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/40 text-white text-xs font-semibold rounded-full backdrop-blur-sm pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                {images[currentIndex].label}
            </div>

            {/* Left Arrow */}
            <button
                onClick={goToPrevious}
                className="absolute top-1/2 left-3 -translate-y-1/2 z-10 p-2 bg-black/30 rounded-full text-white hover:bg-black/50 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-90"
                aria-label="Previous image"
            >
                <ChevronLeftIcon className="w-5 h-5" />
            </button>

            {/* Right Arrow */}
            <button
                onClick={goToNext}
                className="absolute top-1/2 right-3 -translate-y-1/2 z-10 p-2 bg-black/30 rounded-full text-white hover:bg-black/50 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-90"
                aria-label="Next image"
            >
                <ChevronRightIcon className="w-5 h-5" />
            </button>
            
            {/* Indicator Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
                {images.map((_, slideIndex) => (
                    <button
                        key={slideIndex}
                        onClick={() => goToSlide(slideIndex)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            currentIndex === slideIndex ? 'bg-gray-800 dark:bg-white scale-125 ring-2 ring-gray-800/50 dark:ring-white/50' : 'bg-gray-800/50 dark:bg-white/50 hover:bg-gray-800 dark:hover:bg-white'
                        }`}
                        aria-label={`Go to image ${slideIndex + 1}`}
                        aria-current={currentIndex === slideIndex}
                    />
                ))}
            </div>
        </div>
    );
};

export default ImageCarousel;