export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#f8f5f0]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-[#166534] border-t-transparent rounded-full animate-spin" />
        <div className="text-2xl font-semibold tracking-tight text-[#166534]">
          Finding the best climbs near you...
        </div>
        <p className="text-[#5c6666]">This usually takes just a second or two</p>
      </div>
    </div>
  );
}
