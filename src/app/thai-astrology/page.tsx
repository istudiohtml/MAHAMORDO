import { getIsLoggedIn } from "@/lib/auth-session";
import OracleLanding from "@/components/landing/OracleLanding";
import { landingMetadata } from "@/lib/landing-pages";

export const metadata = landingMetadata("thai-astrology");

export default async function ThaiAstrologyLandingPage() {
  const isLoggedIn = await getIsLoggedIn();
  return <OracleLanding slug="thai-astrology" isLoggedIn={isLoggedIn} />;
}
