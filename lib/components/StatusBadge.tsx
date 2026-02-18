import { cn } from "@/lib/utils";

type Status = "todo" | "in_progress" | "done" | "blocked" | "idle" | "working" | "waiting" | "scheduled" | "completed" | "cancelled";
type Stage = "idea" | "scripting" | "thumbnail" | "filming" | "editing" | "published" | "archived";

const statusColors: Record<string, string> = {
  // Task statuses
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
  // Agent statuses
  idle: "bg-slate-100 text-slate-600",
  working: "bg-green-100 text-green-700",
  waiting: "bg-yellow-100 text-yellow-700",
  // Event statuses
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const stageColors: Record<Stage, string> = {
  idea: "bg-purple-100 text-purple-700",
  scripting: "bg-blue-100 text-blue-700",
  thumbnail: "bg-pink-100 text-pink-700",
  filming: "bg-orange-100 text-orange-700",
  editing: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-slate-100 text-slate-500",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
  idle: "Idle",
  working: "Working",
  waiting: "Waiting",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

const stageLabels: Record<Stage, string> = {
  idea: "Idea",
  scripting: "Scripting",
  thumbnail: "Thumbnail",
  filming: "Filming",
  editing: "Editing",
  published: "Published",
  archived: "Archived",
};

interface StatusBadgeProps {
  status?: Status;
  stage?: Stage;
  className?: string;
}

export function StatusBadge({ status, stage, className }: StatusBadgeProps) {
  if (stage) {
    return (
      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", stageColors[stage], className)}>
        {stageLabels[stage]}
      </span>
    );
  }

  if (status) {
    return (
      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[status], className)}>
        {statusLabels[status] || status}
      </span>
    );
  }

  return null;
}
