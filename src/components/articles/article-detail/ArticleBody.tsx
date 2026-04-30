interface ArticleBodyProps {
  paragraphs: string[];
}

export default function ArticleBody({ paragraphs }: ArticleBodyProps) {
  return (
    <div className="space-y-6 font-serif text-xl leading-[1.9] text-cyan-50/78">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
