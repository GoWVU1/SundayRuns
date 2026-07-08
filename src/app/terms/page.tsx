import Link from "next/link";
import { HeaderMark } from "@/components/Logo";

export default function TermsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-cream">
      <div className="flex items-center gap-3 bg-navy px-5 py-3.5">
        <Link href="/signup" className="font-display text-xl text-gold">
          ←
        </Link>
        <HeaderMark />
        <span className="font-display text-lg tracking-wide text-cream">TERMS &amp; CONDITIONS</span>
      </div>
      <div className="h-1 bg-gold" />

      <div className="flex flex-col gap-4 px-5 pt-5 pb-8 text-[13px] leading-relaxed text-navy">
        <p className="text-xs text-muted">Last updated July 2026</p>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-display text-base tracking-wide">1. WHAT THIS IS</h2>
          <p>
            Sunday Runs is an informal, invite-only club for pickup basketball and an optional fantasy
            football side-league among its members. It&apos;s run by a volunteer commissioner, not a
            company — creating an account just means you&apos;re part of the group.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-display text-base tracking-wide">2. ASSUMPTION OF RISK</h2>
          <p>
            Pickup basketball carries a real risk of injury. By claiming a spot and playing, you accept
            that risk for yourself. The club, the commissioner, and this app provide no insurance,
            medical coverage, or liability protection — you&apos;re responsible for your own health and
            safety on the court.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-display text-base tracking-wide">3. YOUR ACCOUNT</h2>
          <p>
            Your phone number is your login — no email, no verification codes. The commissioner (and
            anyone else with admin access) can see your name, phone number, tier, and attendance
            history, and can reset your password, change your tier, or remove your account if needed.
            You can delete your own account at any time from My Account.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-display text-base tracking-wide">4. SHOWING UP</h2>
          <p>
            Claiming a spot is a commitment to the rest of the group. Repeated no-shows may affect your
            priority tier. Be respectful on and off the court — the commissioner can remove members for
            serious or repeated misconduct.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-display text-base tracking-wide">5. FANTASY FOOTBALL</h2>
          <p>
            If you join the fantasy league, its own rules — dues, standings, and the season-loser
            punishment — are covered separately in the league contract, available to fantasy members
            inside the app. Fantasy participation is optional and independent of basketball access.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-display text-base tracking-wide">6. YOUR DATA</h2>
          <p>
            We store your name, phone number, and your activity in the club (RSVPs, attendance, guest
            invites, and fantasy results if applicable) solely to run Sunday Runs. Nothing is sold or
            shared outside the group.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-display text-base tracking-wide">7. CHANGES</h2>
          <p>
            The commissioner may update these terms as the club evolves. Continuing to use Sunday Runs
            after a change means you accept the update.
          </p>
        </section>

        <p className="mt-2 text-xs text-muted">
          Creating an account means you&apos;ve read and agree to the above.
        </p>
      </div>
    </div>
  );
}
