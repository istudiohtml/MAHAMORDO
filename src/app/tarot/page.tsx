import { getIsLoggedIn } from "@/lib/auth-session";
import OracleLanding from "@/components/landing/OracleLanding";
import { landingMetadata } from "@/lib/landing-pages";

export const metadata = landingMetadata("tarot");

export default async function TarotLandingPage() {
  const isLoggedIn = await getIsLoggedIn();
  return <OracleLanding slug="tarot" isLoggedIn={isLoggedIn} />;
}
