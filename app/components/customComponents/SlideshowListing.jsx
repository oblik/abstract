import dynamic from "next/dynamic";

const SlideshowListingCarousel = dynamic(() => import("@/app/components/customComponents/SlideshowListingCarousel"), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64 text-gray-400">Loading slideshow...</div>,
});

export default function SlideshowListing() {
  return <SlideshowListingCarousel />;
}
