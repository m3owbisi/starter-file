export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[#f59e0b]" />
          <div className="absolute inset-1.5 animate-spin rounded-full border-[3px] border-transparent border-t-[#fbbf24]" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#f59e0b]/20 to-[#fbbf24]/20" />
        </div>
        <p className="text-sm text-bodydark animate-pulse">
          loading messages...
        </p>
      </div>
    </div>
  );
}
