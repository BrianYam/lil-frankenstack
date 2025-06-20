import { HeroSection } from '@/components/HeroSection';
import { DestinationScroller } from '@/components/DestinationScroller';

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <DestinationScroller />
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-indigo-700">Plan Your Next Adventure</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Discover new destinations, create personalized itineraries, and make memories that last a lifetime. Our smart travel planner helps you find the perfect spots based on your preferences.
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors">
            Start Planning
          </button>
        </div>
      </section>
    </main>
  );
}
