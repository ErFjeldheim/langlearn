import { notFound } from "next/navigation";
import Link from "next/link";
import { getLesson } from "@/lib/curriculum";
import LessonChatClient from "@/components/lesson-chat-client";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();

  return (
    <div className="flex h-dvh flex-col">
      <LessonChatClient lesson={lesson} />
      <Link
        href="/lessons"
        className="sr-only"
        aria-label="Volver a las lecciones"
      >
        Volver
      </Link>
    </div>
  );
}
