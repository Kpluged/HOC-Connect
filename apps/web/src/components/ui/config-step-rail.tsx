import { cn } from "@/lib/cn";

export type ConfigStep = {
  label: string;
  state: "complete" | "current" | "upcoming";
};

export function ConfigStepRail({ steps }: { steps: ConfigStep[] }) {
  return (
    <nav aria-label="Configuration progress" className="min-w-0 max-w-full overflow-hidden">
      <ol className="flex w-full min-w-0 gap-1 overflow-x-auto pb-2 lg:grid lg:overflow-visible lg:pb-0">
        {steps.map((step, index) => (
          <li className="min-w-32 flex-1 lg:min-w-0" key={step.label}>
            <div
              aria-current={step.state === "current" ? "step" : undefined}
              className={cn(
                "border-t-2 border-contrast-low pt-3 text-sm text-contrast-medium lg:min-h-16",
                step.state === "current" &&
                  "border-primary font-semibold text-primary",
                step.state === "complete" && "text-contrast-high",
              )}
            >
              <span className="tabular-nums mr-2 text-xs">
                {String(index + 1).padStart(2, "0")}
              </span>
              {step.label}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
