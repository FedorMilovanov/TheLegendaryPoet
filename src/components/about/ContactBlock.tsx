import { Mail } from 'lucide-react';

export default function ContactBlock() {
  return (
    <section className="luxury-card rounded-2xl p-8 text-center">
      <Mail size={40} className="mx-auto mb-4 text-luxury-gold" />
      <h3 className="mb-2 font-serif text-2xl font-bold text-white">Связаться с нами</h3>
      <p className="mb-4 text-luxury-gray-light">Есть вопросы, предложения или хотите добавить поэта? Напишите нам.</p>
      <a href="mailto:contact@legendarypoet.com" className="inline-flex items-center gap-2 text-luxury-gold transition-colors hover:text-luxury-gold-light">
        contact@legendarypoet.com
      </a>
    </section>
  );
}