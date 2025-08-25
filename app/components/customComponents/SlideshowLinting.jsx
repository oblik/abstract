import dynamic from "next/dynamic";

const SlideshowLintingCarousel = dynamic(() => import("@/app/components/customComponents/SlideshowLintingCarousel"), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64 text-gray-400">Loading slideshow...</div>,
});

export default function SlideshowLinting() {
  return <SlideshowLintingCarousel />;
}
