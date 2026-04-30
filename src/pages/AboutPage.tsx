import AboutHero from '../components/about/AboutHero';
import ContactBlock from '../components/about/ContactBlock';
import MissionSection from '../components/about/MissionSection';
import OfferGrid from '../components/about/OfferGrid';
import SocialLinks from '../components/about/SocialLinks';
import YouTubeFeature from '../components/about/YouTubeFeature';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050505] pb-20 pt-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <AboutHero />
        <MissionSection />
        <OfferGrid />
        <YouTubeFeature />
        <SocialLinks />
        <ContactBlock />
        <div className="mt-12 border-t border-luxury-dark-300 pt-8 text-center">
          <p className="text-luxury-gray-light">
            Проект развивается как архив, редакция и пространство внимательного чтения.
          </p>
        </div>
      </div>
    </div>
  );
}