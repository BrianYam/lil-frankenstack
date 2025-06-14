"use client";
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

type Destination = {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  description: string;
};

export function DestinationScroller() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch destinations data with dynamic images from Unsplash
  useEffect(() => {
    const fetchDestinationImages = async () => {
      // Base destination data with specific fallback images for each destination
      const destinationsData: Destination[] = [
        {
          id: '1',
          name: 'Santorini',
          location: 'Greece',
          imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=800',
          description: 'Famous for its stunning sunsets, white-washed buildings and blue domes'
        },
        {
          id: '2',
          name: 'Kyoto',
          location: 'Japan',
          imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=800',
          description: 'Known for its classical Buddhist temples, gardens, imperial palaces, and traditional wooden houses'
        },
        {
          id: '3',
          name: 'Machu Picchu',
          location: 'Peru',
          imageUrl: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=800',
          description: 'An ancient Incan citadel set high in the Andes Mountains, known for its sophisticated dry-stone walls'
        },
        {
          id: '4',
          name: 'Venice',
          location: 'Italy',
          imageUrl: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?q=80&w=800',
          description: 'Famous for its canals, gondolas, and historic architecture spanning the artistic styles'
        },
        {
          id: '5',
          name: 'Bora Bora',
          location: 'French Polynesia',
        //   imageUrl: 'https://images.unsplash.com/photo-1589197331516-4d84b72efd56?q=80&w=800',
          imageUrl: 'https://images.unsplash.com/photo-1633381685199-99c89e48b8b3?q=80&w=800',
          description: 'Known for its turquoise lagoons, overwater bungalows, and lush tropical slopes'
        },
        {
          id: '6',
          name: 'Grand Canyon',
          location: 'USA',
          imageUrl: 'https://images.unsplash.com/photo-1534868489953-ef37c20abb25?q=80&w=800',
          description: 'A steep-sided canyon carved by the Colorado River, known for its visually overwhelming size'
        },
      ];
      
      try {
        // Fetch images for each destination
        const destinationsWithImages = await Promise.all(
          destinationsData.map(async (destination) => {
            try {
              // Add the destination name as a query parameter to get more relevant images
              const response = await fetch(`/api/unsplash?query=${destination.name} ${destination.location}`);
              if (!response.ok) throw new Error('Failed to fetch image');
              
              const imageData = await response.json();
              return {
                ...destination,
                imageUrl: imageData.urls.regular || destination.imageUrl // Fallback image
              };
            } catch (error) {
              console.error(`Error fetching image for ${destination.name}:`, error);
              // Provide fallback image if the API call fails
              return destination;
            }
          })
        );
        
        setDestinations(destinationsWithImages);
      } catch (error) {
        console.error('Error fetching destination images:', error);
        // If everything fails, use destinations without images and show a fallback
        setDestinations(destinationsData);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDestinationImages();
  }, []);

  const scrollToDestination = (index: number) => {
    setActiveIndex(index);
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const targetElement = container.children[index] as HTMLElement;
      if (targetElement) {
        const scrollLeft = targetElement.offsetLeft - (container.clientWidth / 2) + (targetElement.clientWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="animate-pulse">Loading destinations...</div>
      </div>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-10 text-indigo-700">Explore Famous Destinations</h2>
        
        {/* Scrollable destination cards */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {destinations.map((destination, index) => (
            <div 
              key={destination.id}
              onClick={() => scrollToDestination(index)}
              className={`flex-shrink-0 w-80 rounded-xl overflow-hidden shadow-lg transition-all duration-300 snap-center cursor-pointer transform hover:-translate-y-2 ${activeIndex === index ? 'ring-4 ring-blue-500 scale-105' : ''}`}
            >
              <div className="relative h-56 w-full">
                <Image
                  src={destination.imageUrl}
                  alt={destination.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-cover"
                />
              </div>
              <div className="p-5 bg-white">
                <h3 className="text-xl font-semibold text-indigo-700">{destination.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{destination.location}</p>
                <p className="text-gray-700">{destination.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2 mt-6">
          {destinations.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToDestination(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                activeIndex === index ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label={`Go to destination ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}