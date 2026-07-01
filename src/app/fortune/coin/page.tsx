import { redirect } from "next/navigation";

export default function FortuneCoinRedirect() {
  redirect("/dashboard/coin");
}
