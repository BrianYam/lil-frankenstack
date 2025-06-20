interface PaginationDotsProps {
  total: number;
  activeIndex: number;
  onDotClick: (index: number) => void;
}

export function PaginationDots({ total, activeIndex, onDotClick }: PaginationDotsProps) {
  if (total <= 1) return null;
  
  return (
    <div className="flex justify-center gap-2 mt-6">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`w-3 h-3 rounded-full transition-colors ${
            activeIndex === index ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          aria-label={`Go to item ${index + 1}`}
        />
      ))}
    </div>
  );
}
