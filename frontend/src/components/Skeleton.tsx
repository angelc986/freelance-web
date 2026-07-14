export default function Skeleton({
  className = "",
  width,
  height,
  rounded = "rounded-xl",
}: {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`skeleton ${rounded} ${className}`}
      style={{ width, height }}
    />
  );
}

export function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
      <Skeleton width="44px" height="44px" rounded="rounded-xl" />
      <Skeleton width="60%" height="28px" />
      <Skeleton width="70%" height="16px" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <Skeleton width="48px" height="48px" rounded="rounded-2xl" />
      <Skeleton width="55%" height="20px" />
      <Skeleton width="100%" height="14px" />
      <Skeleton width="80%" height="14px" />
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-3 px-6 py-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton width="36px" height="36px" rounded="rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton width="65%" height="14px" />
            <Skeleton width="40%" height="12px" />
          </div>
          <Skeleton width="70px" height="22px" rounded="rounded-full" />
        </div>
      ))}
    </div>
  );
}
