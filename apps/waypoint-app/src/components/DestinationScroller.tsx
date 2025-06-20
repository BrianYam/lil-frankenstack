"use client";
import { useState, useRef } from 'react';
import { Container } from '@/components/ui/container';
import { Spinner } from '@/components/ui/spinner';
import { PaginationDots } from '@/components/ui/pagination-dots';
import { DestinationCard } from '@/components/destinations/DestinationCard';
import { useDestinations } from '@/components/destinations/destination-helpers';

export function DestinationScroller() {
  const { destinations, isLoading } = useDestinations();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
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
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <Container>
        <h2 className="text-3xl font-bold text-center mb-10 text-indigo-700">
          Explore Famous Destinations
        </h2>
        
        {/* Scrollable destination cards */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {destinations.map((destination, index) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              isActive={activeIndex === index}
              onClick={() => scrollToDestination(index)}
            />
          ))}
        </div>

        {/* Navigation dots */}
        <div className="mt-6">
          <PaginationDots
            total={destinations.length}
            activeIndex={activeIndex}
            onDotClick={scrollToDestination}
          />
        </div>
      </Container>
    </section>
  );
}