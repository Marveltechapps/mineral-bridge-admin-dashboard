export interface Course {
  id?: string;
  title: string;
  lessons: number;
  status: 'Published' | 'Draft';
  certified: boolean;
}
