import { CommentKind } from '../types/community';

export const commentKindLabels: Record<CommentKind, string> = {
  literary: 'Литературно',
  history: 'Исторически',
  moral: 'Нравственно',
  performance: 'Исполнение',
};

export const commentKindOptions: Array<{ value: CommentKind; label: string }> = [
  { value: 'literary', label: 'Литературный взгляд' },
  { value: 'history', label: 'Историческая справка' },
  { value: 'moral', label: 'Нравственная ремарка' },
  { value: 'performance', label: 'Исполнение / звучание' },
];