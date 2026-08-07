import { HomeRedirect } from "@/components/common/home-redirect";

/**
 * `proxy.ts` sends anyone with a session here, since the role is not readable
 * server-side. This resolves the user client-side and forwards to their portal.
 */
export default function Home() {
  return <HomeRedirect />;
}
