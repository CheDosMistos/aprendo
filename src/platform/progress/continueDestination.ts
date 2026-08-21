import type { CourseProgressSummary } from './types.ts';

export interface ContinueContentItem {
  contentId: string;
  route: string;
}

export function resolveContinueDestination(
  summary: CourseProgressSummary | null | undefined,
  orderedContent: readonly ContinueContentItem[],
  courseRoute: string,
): string {
  const firstContentRoute = orderedContent[0]?.route ?? courseRoute;
  const lastExecution = summary?.lastExecution;

  if (!lastExecution) return firstContentRoute;

  const currentIndex = orderedContent.findIndex(
    (item) => item.contentId === lastExecution.contentId,
  );

  if (currentIndex === -1) {
    const completed = new Set(summary?.completedContentIds ?? []);
    return orderedContent.find((item) => !completed.has(item.contentId))?.route ?? firstContentRoute;
  }

  if (lastExecution.nextAction === 'stop') return courseRoute;
  if (lastExecution.nextAction === 'repeat') return orderedContent[currentIndex]?.route ?? firstContentRoute;

  return orderedContent[currentIndex + 1]?.route ?? courseRoute;
}
