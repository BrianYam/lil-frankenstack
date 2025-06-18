import Image from 'next/image';
import { Destination } from './destination-helpers';
import { cn } from '../../lib/utils';

interface DestinationCardProps {
  destination: Destination;
  isActive: boolean;
  onClick: () => void;
}

export function DestinationCard({ destination, isActive, onClick }: Readonly<DestinationCardProps>) {
  return (
    <button
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      aria-pressed={isActive}
      type="button"
      className={cn(
        "flex-shrink-0 w-80 rounded-xl overflow-hidden shadow-lg text-left",
        "transition-all duration-300 snap-center cursor-pointer",
        "transform hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-blue-400",
        isActive && "ring-4 ring-blue-500 scale-105"
      )}
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
    </button>
  );
}
