export interface Course {
  title: string;
  lessons: number;
  status: 'Published' | 'Draft';
  certified: boolean;
}
