import type { ReactNode } from 'react';
import { titleCase } from '../../../utils/titleCase';

interface HallAtriumProps {
  children?: ReactNode;
}

export default function HallAtrium({ children }: HallAtriumProps) {
  return (
    <header className="hall-atrium">
      <div className="hall-atrium-dome" aria-hidden="true" />
      <div className="hall-atrium-kicker">
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        Храм · Музей · Архив
      </div>
      <h1 className="hall-atrium-title gold-gradient gold-glow-text">
        {titleCase('Храм русской поэзии')}
      </h1>
      <p className="hall-atrium-lead">
        Центральный атриум пантеона. Четыре крыла — четыре эпохи русской словесности.
      </p>
      <p className="hall-atrium-note">
        Это музейный вестибюль: тёплый камень, золотые рамы, кураторские ниши. Иммерсивный
        объём (купол, прогулка) наращивается отдельными проходами — без спешки и без
        «космических» заглушек.
      </p>
      {children}
    </header>
  );
}
