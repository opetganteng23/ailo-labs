import { redirect } from "next/navigation";

/** Public accounts are gone: visitors join as members instead (no login needed). */
export default function RegisterPage() {
  redirect("/join");
}
