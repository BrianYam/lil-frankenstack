import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { PaginationDots } from '@/components/ui/pagination-dots';
import { cn } from '@/lib/utils';

interface CarouselProps {
  images: string[];
  isLoading?: boolean;
  autoRotate?: boolean;
  autoRotateInterval?: number;
  className?: string;
}

export function ImageCarousel({
  images,
  isLoading = false,
  autoRotate = true,
  autoRotateInterval = 5000,
  className,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Auto-cycle through images unless user is hovering
  useEffect(() => {
    if (!autoRotate || images.length <= 1 || isLoading || isHovering) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    }, autoRotateInterval);
    
    return () => clearInterval(interval);
  }, [images.length, isLoading, isHovering, autoRotate, autoRotateInterval]);

  const goToNextImage = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  }, [images.length]);

  const goToPrevImage = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  }, [images.length]);

  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentIndex === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={image}
            alt={`Image ${index + 1}`}
            fill
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}
      
      {/* Navigation arrows */}
      <div className="absolute inset-x-0 top-1/2 flex justify-between items-center px-4 -translate-y-1/2 z-20">
        <button 
          onClick={goToPrevImage}
          className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/50 transition-colors"
          aria-label="Previous image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button 
          onClick={goToNextImage}
          className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/50 transition-colors"
          aria-label="Next image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      
      {/* Indicator dots */}
      <div className="absolute bottom-4 left-0 right-0 z-20">
        <PaginationDots
          total={images.length}
          activeIndex={currentIndex}
          onDotClick={setCurrentIndex}
        />
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}
