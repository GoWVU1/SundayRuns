import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const ARTICLE_I_BODY = `Section 1.1 – League Dues
Each League Member ("Owner") shall tender an entry fee in the amount of twenty-five United States Dollars ($25.00) prior to the commencement of the draft. Payment of such dues is a condition precedent to participation in the League and its associated competitions.

Section 1.2 – League Platform
The League shall be hosted and operated via the ESPN Fantasy Football platform. All gameplay, scoring, and roster management shall be conducted in accordance with the tools and parameters available on said platform, unless otherwise modified by this Agreement.

Section 1.3 – Roster Composition
Each Owner shall maintain a starting lineup comprised of the following positional designations: one (1) Quarterback (QB), two (2) Running Backs (RB), two (2) Wide Receivers (WR), one (1) Tight End (TE), two (2) FLEX positions (RB/WR/TE eligible), one (1) Team Defense/Special Teams (D/ST), and seven (7) bench players.

Section 1.4 – Injured List (IL) Designation
Each team shall be entitled to utilize up to three (3) Injured List (IL) roster positions for players so designated by ESPN. Only players marked as IR, OUT, or otherwise eligible under ESPN’s IL rules may be placed in these slots.

Section 1.5 – Scoring System
The League shall utilize a Point-Per-Reception (PPR) scoring format. Scoring categories and point values shall be governed by the standard settings established by ESPN, unless amended by vote or Commissioner declaration.

Section 1.6 – Regular Season Duration
The regular season shall consist of thirteen (13) scoring weeks. All regular season standings shall be determined by win-loss record during this period.

Section 1.7 – Playoff Structure
The postseason shall consist of five (5) qualifying teams. The two (2) division winners shall receive the No. 1 and No. 2 seeds, ranked by overall regular season record. The Nos. 3 and 4 seeds shall be awarded to the non-division-winning teams with the next best records. The No. 5 seed shall be awarded to the remaining team with the highest value of Points For (PF) plus one-half (½) of Points Against (PA), subject to the exception noted in Section 1.9.

The Wild Card Round shall consist of a one-week matchup between the No. 4 and No. 5 seeds. The winners shall proceed to the Semifinal Round (one-week duration), and the Championship shall be contested over a two-week period.

Section 1.8 – Draft Structure
The League draft shall consist of sixteen (16) rounds. The draft order shall be determined randomly, unless otherwise agreed to by a majority vote of Owners.

Section 1.9 – Tie-Breaking and Seeding Adjustments
In the event that the team qualifying for the fifth (5th) seed based on the PF + ½ PA calculation is already eligible for a higher playoff seed (Nos. 1–4) by virtue of record, then the fifth seed shall be awarded to the next eligible team as determined by record. Where two or more teams share an identical record, ESPN’s default tie-breaking procedures shall be used to determine seeding and qualification.`;

const ARTICLE_II_BODY = `Section 2.1 – Roster Control and Competitive Integrity

Each League Member ("Owner") hereby agrees to maintain an active and competitive roster throughout the duration of the Fantasy Football League season. "Active and competitive" shall be defined as the act of submitting a lineup that does not include any player who is declared inactive, on a bye week, on Injured Reserve (IR), or otherwise unavailable for NFL play during the scoring week.

While Owners retain full discretion to bench players for legitimate strategic reasons, such discretion must not extend to intentionally submitting non-competitive lineups. This obligation remains in full force and effect regardless of the Owner’s position in league standings or likelihood of playoff qualification. A failure to comply with this provision may, at the sole discretion of the League Commissioner, result in remedial measures, including but not limited to: lineup adjustments, point forfeiture, or other sanctions deemed reasonably necessary to preserve league integrity.

Section 2.2 – Trade Veto Procedure

Any trade entered into by two or more Owners shall be subject to veto by the non-involved Owners, pursuant to the following procedure:

A veto may only be initiated by a written notice (including text message) sent to the League Commissioner within twenty-four (24) hours following the formal acceptance and announcement of the trade.

Upon receipt of such notice, the Commissioner shall immediately initiate a vote among all non-involved Owners via the designated League group chat or other agreed-upon communication medium.

If fifty percent (50%) or more of the non-involved Owners vote to veto the trade within forty-eight (48) hours of the vote being initiated, the trade shall be nullified and rendered void ab initio.

If no such veto threshold is met within forty-eight (48) hours, or if no veto request is received within twenty-four (24) hours of trade acceptance, the trade shall be processed and finalized by the Commissioner.

All decisions made in accordance with this section shall be final and binding, subject only to Commissioner oversight for good-faith enforcement.`;

const ARTICLE_III_BODY = `Section 3.1 – Payout Plan
The League shall distribute monetary prizes to the top three (3) finishers in accordance with the following schedule:

First Place: One Hundred Forty Dollars ($140.00);
Second Place: Thirty-Five Dollars ($35.00);
Third Place: Twenty-Five Dollars ($25.00).

Such prizes shall be payable no later than thirty (30) calendar days following the conclusion of the League Championship, provided all League dues have been paid in full and no breach of this Agreement has occurred by the recipient.

Section 3.2 – Determination of League Loser
The individual designated as the “League Loser” shall be the Owner whose team accrues the fewest total points in the consolation ladder during the postseason, as modified by a point adjustment system. For purposes of this determination, each team participating in the consolation ladder shall receive a bonus of twenty-five (25) points for each seed position above the lowest seed. The Owner with the lowest aggregate score after application of this adjustment shall be deemed the League Loser and shall be subject to the punishment requirements set forth herein.

Section 3.3 – Punishment Obligation and Enforcement
The League Loser shall be required to complete a punishment as prescribed below. The following timelines and enforcement mechanisms shall govern:

(a) The League Loser shall commence, in good faith, verifiable steps toward the initiation of the selected punishment within sixty (60) days following the conclusion of the fantasy football season.

(b) The League Loser shall fully complete the selected punishment no later than three hundred thirty (330) days following the League draft date for that season.

(c) In the event the League Loser fails to meet the deadlines in subsections (a) or (b), the following sanctions shall apply: a liquidated penalty of Ten Dollars ($10.00), due and payable to the League upon breach of the deadline; accrual of interest on said penalty at a rate of ten percent (10%) per annum, calculated from the sixtieth (60th) day following the end of the fantasy season and continuing until the date of full satisfaction; and potential expulsion from the League, subject to a majority vote of all non-losing League Members, such vote to be binding and final.

Section 3.4 – Selection and Limitations
The League Loser shall be required to select and complete one (1) of the enumerated punishments set forth herein. The following restrictions shall govern the selection process:

(a) The selected punishment shall be subject to a single veto by a three-fourths (¾) supermajority vote of the non-losing League Members, such vote to be conducted within seven (7) days of the League Loser’s declared selection.
(b) No League Loser shall be permitted to select a punishment that was completed by the League Loser in the immediately preceding League year.
(c) No League Loser shall select the same punishment they personally selected in any prior League year.

Section 3.5 – Enumerated Punishments

3.5.1 – ACT Examination Requirement
The League Loser shall register for and complete an official paper-based ACT examination, including the Test Information Release (TIR) package, at a testing center within fifteen (15) miles of the League Loser’s primary residence (or the nearest alternative). A composite score of twenty-one (21) or higher is required. A score of seventeen (17)–twenty (20) requires a follow-up practice ACT with a composite of at least 21. A score of sixteen (16) or below requires retaking the official ACT under the same conditions. All score reports, including the TIR, must be provided to the League for verification.

3.5.2 – PACER Test Requirement
The League Loser shall complete the FitnessGram® 20-meter PACER Test per the official manual, at a public park, with the official PACER audio cadence played via portable speaker at maximum volume throughout. A minimum score of seventy-five (75) laps is required, with every attempt fully recorded on video. If 75 is not reached, a new attempt shall be made at least once every three (3) calendar days until a qualifying video is submitted.

3.5.3 – Twenty-Four (24) Hours in Waffle House
The League Loser shall spend twenty-four (24) consecutive hours within a Waffle House® location, livestreamed publicly and continuously on Twitch® from the time of seating, with credentials provided to the League beforehand. One (1) hour is deducted from the required duration for each waffle consumed on-site.

3.5.4 – “Hot Ones” Challenge
The League Loser shall complete a mock “Hot Ones” interview-style challenge: at least ten (10) rounds, each with a different official Hot Ones™ sauce on a wing (or non-meat substitute), followed by 3–5 questions from an interviewer. Non-losing League Members may each submit questions for one round; the final round is composed collectively by the League. If offered the chance to complete this challenge as part of a real media interview, the League Loser must select this punishment unless it was picked by the prior year’s Loser or already completed by the current Loser previously. Completion requires a full video submitted to the League group chat.

3.5.5 – Bodybuilding Competition
The League Loser shall register for and compete in an officially sanctioned bodybuilding competition (OCB, IFBB, or similar), in Men’s Physique, Men’s Classic Physique, or Men’s Bodybuilding. A complete, unedited video of the participation — including final placement, if applicable — must be submitted to the League.

Section 3.6 – Reimbursement of Costs Associated with Punishment
Each Owner contributes Five Dollars ($5.00) of their annual dues to a collective “Reimbursement Bank.” Disbursements reimburse the League Loser for the minimum objectively necessary cost of completing their punishment, upon submission of proof of completion (test scores, video, livestream links, receipts, or registration confirmations) and itemized cost evidence. Non-essential upgrades or personal expenditures (flavored waffles, hashbrowns, sodas, upgraded gear, apparel, etc.) are excluded and borne solely by the League Loser. Reimbursements cannot exceed the Bank’s balance; any excess cost is the Loser’s sole responsibility. Remaining funds roll over to the next League year. A full accounting of the Bank is provided to all Owners between the annual draft and the start of Week One.

Section 3.7 – Collection and Enforcement of League Dues
All dues are due in full (Zelle® or cash — no partial payments) prior to Week One. Unpaid balances after Week Thirteen (13) accrue daily compounding interest at five percent (5%) per day, deposited into the Reimbursement Bank. Any Owner unpaid before the start of Playoffs is immediately and irrevocably eliminated from playoff contention, forfeits any claim to Reimbursement Bank funds, is subject to expulsion (reinstatable only by unanimous vote of paying Owners), and continues to accrue interest.

Section 3.8 – Disbursement of Prizes and Reimbursements
Prize payouts are distributed within thirty (30) calendar days following the League Championship, contingent on full payment of dues by all Owners. If dues are outstanding, payouts may be delayed or reduced; any remaining Reimbursement Bank funds are applied first to the First Place prize, then Second, then Third. Punishment reimbursements are issued within thirty (30) calendar days of the League Manager receiving all required proof and documentation.

References: PF = Points For. PA = Points Against. ESPN tie-breaking rules: support.espn.com (Playoff Seeding / How Regular Season Standings Tiebreakers Work). FitnessGram PACER Test Manual: nova.edu/projectrise. Hot Ones official sauces: heatonist.com.`;

const sql = postgres(databaseUrl, { max: 1, prepare: false });

try {
  await sql.begin(async (tx) => {
    await tx`alter table fantasy_contract_articles drop constraint if exists fantasy_contract_articles_article_number_check`;
    await tx`delete from fantasy_contract_articles where article_number = 4`;
    await tx`alter table fantasy_contract_articles add constraint fantasy_contract_articles_article_number_check check (article_number between 1 and 3)`;

    await tx`
      update fantasy_contract_articles set title = 'Article I · Game Rules & Structure', body = ${ARTICLE_I_BODY}, updated_at = now()
      where article_number = 1
    `;
    await tx`
      update fantasy_contract_articles set title = 'Article II · In-Season Conduct', body = ${ARTICLE_II_BODY}, updated_at = now()
      where article_number = 2
    `;
    await tx`
      update fantasy_contract_articles set title = 'Article III · Loser Punishments & Payouts', body = ${ARTICLE_III_BODY}, updated_at = now()
      where article_number = 3
    `;
  });
  console.log("Contract seeded successfully.");
} catch (err) {
  console.error("Seed failed:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
