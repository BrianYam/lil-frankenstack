"use client";
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Spinner } from '@/components/ui/spinner';
import { PaginationDots } from '@/components/ui/pagination-dots';

// Fallback images for when the API fails to fetch images
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=1200',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200'
];

export function HeroSection() {
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        // Fetch multiple images for the background carousel
        const promises = Array(3).fill(null).map(() => 
          fetch('/api/unsplash').then(res => res.json())
        );
        
        const responses = await Promise.all(promises);
        const imageUrls = responses
          .filter(data => data.urls?.full)
          .map(data => data.urls.full);
        
        if (imageUrls.length > 0) {
          setBackgroundImages(imageUrls);
        } else {
          setBackgroundImages(FALLBACK_IMAGES);
        }
      } catch (error) {
        console.error('Failed to fetch background images:', error);
        setBackgroundImages(FALLBACK_IMAGES);
      } finally {
        setLoading(false);
      }
    };

    fetchBackgrounds();
  }, []);

  // Auto-cycle through images unless user is hovering
  useEffect(() => {
    if (backgroundImages.length <= 1 || loading || isHovering) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, [backgroundImages, loading, isHovering]);

  const goToNextImage = useCallback(() => {
    if (backgroundImages.length <= 1) return;
    setCurrentImageIndex(prevIndex => 
      prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
    );
  }, [backgroundImages.length]);

  const goToPrevImage = useCallback(() => {
    if (backgroundImages.length <= 1) return;
    setCurrentImageIndex(prevIndex => 
      prevIndex === 0 ? backgroundImages.length - 1 : prevIndex - 1
    );
  }, [backgroundImages.length]);

  return (
    <section 
      className="relative h-[600px] overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {backgroundImages.length > 0 && (
        <>
          {backgroundImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                currentImageIndex === index ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={image}
                alt={`Travel background ${index + 1}`}
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
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <PaginationDots 
              total={backgroundImages.length}
              activeIndex={currentImageIndex}
              onDotClick={setCurrentImageIndex}
            />
          </div>
        </>
      )}
      
      <div className="absolute inset-0 bg-black/30">
        <Container className="relative z-10 h-full flex items-center">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
              WayPoint: Your Smart Travel Companion
            </h1>
            <p className="text-xl text-blue-100 mb-8 drop-shadow-md">
              Real-time travel planning that adapts to weather, events, and your preferences
            </p>
            <div className="space-x-4">
              <Button
                variant="default"
                size="pillLg"
                className="bg-white text-blue-600 hover:bg-blue-50 transform hover:scale-105 duration-300"
              >
                Get Started
              </Button>
              <Button
                variant="outline" 
                size="pillLg"
                className="text-white border-2 border-white hover:bg-white/20"
              >
                Learn More
              </Button>
            </div>
          </div>
        </Container>
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
          <Spinner size="lg" variant="light" />
        </div>
      )}
    </section>
  );
}
