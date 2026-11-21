import Discover from "@/components/Discover";
import SiteHome from "@/components/SiteHome";

/** Phones get the app-style Discover screen; desktops get the website. */
export default function Home() {
  return (
    <>
      <div className="lg:hidden">
        <Discover />
      </div>
      <div className="hidden lg:block">
        <SiteHome />
      </div>
    </>
  );
}
