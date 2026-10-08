import { bunny, type BunnyVideo } from "@/lib/bunny-stream";

/**
 * The film that plays inside a package card on the English home page (`components/packages-section.tsx`), by the
 * card's key. A card without an entry keeps its still picture (`public/packages/<key>.webp`). All are 16:9 clips on
 * Bunny Stream (library 750681); a clip that is not ready yet (Bunny still encoding it, no MP4 renditions) simply leaves
 * the picture showing.
 */
export const PACKAGE_FILMS: Partial<Record<string, BunnyVideo>> = {
  socialAds: bunny("bfcc7c3b-7b93-4a42-8ee2-5a19e5010d8c"),
  corporate: bunny("6f440f38-5b5b-4fd6-8b41-d56688a30ab4"),
  tvAds: bunny("360b7a78-a7f5-4acf-808f-93f560eca261"),
  productVideos: bunny("ca79ed29-dfe0-4594-aa66-769d9701a410"),
  motionGraphics: bunny("f3940b7f-7cbc-424f-a484-9f689ef13cc6"),
  brandMascots: bunny("b633c834-4cd0-4d14-8207-8fe5a61e3e8a"),
  launchVideos: bunny("f7556ae8-ed63-43d5-b11a-4de81b3382f8"),
  ugcAds: bunny("03a3e5bb-fc72-4dfc-889c-fd1d7756a391"),
  musicVideos: bunny("e1561aba-3712-4fbe-a709-f6e3e7adb65b"),
  explainerVideos: bunny("12f1759a-23f3-4d1a-8723-66639b9d348f"),
  realEstate: bunny("c2a94cde-3bd4-46e8-8520-c58adf837b3c"),
};
