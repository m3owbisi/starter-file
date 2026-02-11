export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[#8b5cf6]" />
          <div className="absolute inset-1.5 animate-spin rounded-full border-[3px] border-transparent border-t-[#a78bfa]" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#8b5cf6]/20 to-[#a78bfa]/20" />
        </div>
        <p className="text-sm text-bodydark animate-pulse">
          preparing model interface...
        </p>
      </div>
    </div>
  );
}
