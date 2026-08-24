import { getBateriaContent } from '@courses/bateria/contentRegistry';
export { validateCourseSkill } from '@courses/courseSkillRegistry';

export interface TrackableContent {
  courseId: string;
  contentId: string;
  title: string;
}

export function isKnownCourse(courseId: string): boolean {
  return courseId === 'bateria';
}

export async function resolveTrackableContent(
  courseId: string,
  contentId: string,
): Promise<TrackableContent | null> {
  if (courseId !== 'bateria') return null;

  const entries = await getBateriaContent();
  const entry = entries.find((candidate) => candidate.data.contentId === contentId);

  if (!entry || entry.data.kind === 'unit') return null;

  return {
    courseId: entry.data.courseId,
    contentId: entry.data.contentId,
    title: entry.data.title,
  };
}
