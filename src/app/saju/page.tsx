import { getIsLoggedIn } from "@/lib/auth-session";
import OracleLanding from "@/components/landing/OracleLanding";
import { landingMetadata } from "@/lib/landing-pages";

export const metadata = landingMetadata("saju");

export default async function SajuLandingPage() {
  const isLoggedIn = await getIsLoggedIn();
  return <OracleLanding slug="saju" isLoggedIn={isLoggedIn} />;
}
