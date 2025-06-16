import { useState, useEffect } from 'react';

export type Destination = {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  description: string;
};

// Default destinations with fallback images
export const DEFAULT_DESTINATIONS: Destination[] = [
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

export function useDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchDestinationImages = async () => {
      try {
        // Fetch images for each destination
        const destinationsWithImages = await Promise.all(
          DEFAULT_DESTINATIONS.map(async (destination) => {
            try {
              // Add the destination name as a query parameter to get more relevant images
              const response = await fetch(`/api/unsplash?query=${destination.name} ${destination.location}`);
              if (!response.ok) throw new Error('Failed to fetch image');
              
              const imageData = await response.json();
              return {
                ...destination,
                imageUrl: imageData.urls?.regular || destination.imageUrl // Fallback image
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
        // If everything fails, use destinations without images
        setDestinations(DEFAULT_DESTINATIONS);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDestinationImages();
  }, []);
  
  return { destinations, isLoading };
}
