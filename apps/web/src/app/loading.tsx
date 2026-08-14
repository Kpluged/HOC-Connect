import { BrandMark } from "@/components/ui/brand-mark";

export default function Loading() {
  return (
    <div
      aria-label="Loading HOC Elite Wheels"
      className="fixed inset-0 z-50 grid place-items-center bg-canvas"
      role="status"
    >
      <BrandMark className="room-enter" size="large" />
    </div>
  );
}
