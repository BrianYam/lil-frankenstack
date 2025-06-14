"use client";
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';

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
          // Fallback images in case API fails
          setBackgroundImages([
            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200',
            'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=1200',
            'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200'
          ]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch background images:', error);
        // Set fallback images
        setBackgroundImages([
          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200',
          'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=1200',
          'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200'
        ]);
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
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {backgroundImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full transition-transform ${
                  currentImageIndex === index 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
      
      <div className="absolute inset-0 bg-black/30">
        <div className="container mx-auto px-4 relative z-10 h-full flex items-center">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
              WayPoint: Your Smart Travel Companion
            </h1>
            <p className="text-xl text-blue-100 mb-8 drop-shadow-md">
              Real-time travel planning that adapts to weather, events, and your preferences
            </p>
            <div className="space-x-4">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors transform hover:scale-105 duration-300">
                Get Started
              </button>
              <button className="text-white border-2 border-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
    </section>
  );
}
