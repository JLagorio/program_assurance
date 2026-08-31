/**
 * Chunk 9d of the CCI spine — the test execution engine.
 *
 * `campaigns.ts` says what T&E work was opened, what was executed and what each
 * objective was DECLARED to have proved. This module is the layer underneath
 * that declaration: the written Procedure (TP-), the Run of it against a named
 * build (TR-), and the per-step record of what the operator actually observed.
 *
 * Invariants held here:
 *  - `TestObjective.result` is never shadowed. There is no parallel "executed
 *    result" field anywhere; `resolvedObjectiveResult` is the single accessor,
 *    it takes each procedure's latest `Complete` run and rolls the objective up
 *    to the WORST of them, it falls back to the declared seed value, and it
 *    always reports which one it used. A declared result is an assertion; a run
 *    is a fact, and the product's job is to show when the two disagree rather
 *    than quietly pick one.
 *  - Recency decides which run speaks for a procedure, never which procedure
 *    speaks for the objective. Where two procedures hang off one objective,
 *    both have to hold, so the half that happened to run last cannot carry the
 *    half that failed.
 *  - Nothing about a run's outcome is stored. `runVerdict` is derived from the
 *    step records every time, so recording a step moves the objective, the
 *    campaign rollup and the regression table together.
 *  - `campaigns.ts` is deliberately NOT modified, so the dependency edge runs
 *    one way only: `test-execution -> campaigns + spine`. There is no cycle.
 *  - A run reaches `Complete` only when every step of its procedure carries a
 *    record that is not "Not run". `setRunState` refuses the transition
 *    otherwise and leaves the state alone — an unfinished run must not become
 *    the thing an objective's result is taken from.
 *  - Regression comparison needs two DECISIVE observations. A step is compared
 *    against its prior run only when both records are Pass or Fail; an
 *    Inconclusive or an un-run step is not evidence of a regression or of a
 *    fix, and inventing a fifth state to hide that would be worse than
 *    omitting the row.
 *  - Nothing here reads a clock. Timestamps are display strings ordered by a
 *    pure parse, so the server and client renders agree.
 */

import { useSyncExternalStore } from "react";

import type { Tone } from "@/components/app/ui";
import {
  eventsByCampaign,
  objectiveById,
  objectivesForEvent,
  type ObjectiveResult,
} from "@/lib/campaigns";
import type { RunState, StepResult, VerificationMethod } from "@/lib/spine";

export type { RunState, StepResult, VerificationMethod };

export type ProcedureStep = {
  id: string; // "TP-0101-S1"
  n: number;
  /** What the operator does. */
  action: string;
  /** The pass criterion, stated so it can be judged rather than felt. */
  expected: string;
  /** What has to be captured for the step to count as evidenced. */
  collect: string;
};

export type TestProcedure = {
  id: string; // TP-
  title: string;
  /** TO- the procedure executes. One procedure proves one objective. */
  objective: string;
  method: VerificationMethod;
  /** CN- ids the procedure is written against. */
  nodes: string[];
  preconditions: string[];
  steps: ProcedureStep[];
  /** Minutes of wall clock, including any mandated soak. */
  duration: number;
  author: string;
  version: string;
};

export type StepRecord = {
  step: string; // "TP-0101-S1"
  result: StepResult;
  observed: string;
  evidence: string[]; // EVD-
  at: string; // "MMM DD, YYYY HH:MM"
};

export type TestRun = {
  id: string; // TR-
  procedure: string; // TP-
  event: string | null; // TE-
  operator: string;
  /** "—" when the run was unwitnessed. */
  witness: string;
  state: RunState;
  started: string;
  /** "—" while planned or in progress. */
  completed: string;
  /** The build under test, as a string until feature 7 gives it a BLD- object. */
  build: string;
  /** Configuration deviations in force during the run. */
  configuration: string;
  /** CN- actually exercised, which is not always every node the procedure names. */
  nodes: string[];
  records: StepRecord[];
  /** TR- this run re-executes, or null. */
  retestOf: string | null;
  /** FND- raised by this run. */
  findings: string[];
  notes: string;
};

/* ------------------------------------------------------------- procedures */

export const procedures: TestProcedure[] = [
  {
    id: "TP-0101",
    title: "Privileged SSH interfaces accept only PIV-derived multifactor authentication",
    objective: "TO-101",
    method: "Test",
    nodes: ["CN-0110", "CN-0114", "CN-0120", "CN-0124"],
    preconditions: [
      "gcs-app-01 and gcs-app-02 are at CM baseline BL-2026.08.1 and have not been rebooted since the last Ansible run.",
      "A test PIV credential issued by DoD ID CA-59 and a matching reader are staged at the assessor position.",
      "A privileged test account svc-tne-priv exists in the enclave directory with no local password set.",
      "iDRAC console access is available in case the run locks the assessor out of SSH.",
    ],
    steps: [
      {
        id: "TP-0101-S1",
        n: 1,
        action:
          "On each host, as root, capture the RUNNING authentication configuration: sshd -T | egrep '^(gssapiauthentication|kerberosauthentication|passwordauthentication|pubkeyauthentication|authenticationmethods|permitrootlogin)'.",
        expected:
          "Every host returns gssapiauthentication no, kerberosauthentication no, passwordauthentication no, permitrootlogin no and authenticationmethods publickey,keyboard-interactive:pam. The file on disk is not the criterion — sshd -T is.",
        collect:
          "sshd-T-<host>-<date>.txt for gcs-app-01 and gcs-app-02, each with its sha256 recorded in the run log.",
      },
      {
        id: "TP-0101-S2",
        n: 2,
        action:
          "From the assessor workstation attempt ssh -o PreferredAuthentications=password svc-tne-priv@<host> against both hosts and supply the directory password.",
        expected:
          "Both attempts are refused before a shell is allocated and /var/log/secure shows no Accepted password line for the attempt window.",
        collect:
          "Terminal transcript with timestamps plus the matching /var/log/secure extract from each host.",
      },
      {
        id: "TP-0101-S3",
        n: 3,
        action:
          "Obtain a Kerberos TGT with kinit svc-tne-priv, then attempt ssh -vv -o PreferredAuthentications=gssapi-with-mic svc-tne-priv@<host> against both hosts.",
        expected:
          "Both attempts fail with Permission denied (publickey,keyboard-interactive) and the server's advertised method list does not contain gssapi-with-mic at all.",
        collect:
          "ssh -vv transcript per host showing the advertised authentication method list, and the krb5 ticket cache listing.",
      },
      {
        id: "TP-0101-S4",
        n: 4,
        action:
          "Authenticate with the test PIV credential using ssh -I /usr/lib64/opensc-pkcs11.so svc-tne-priv@<host>, then read /var/log/sssd/p11_child.log for the session.",
        expected:
          "The session opens only after the certificate chains to DoD ID CA-59 and the OCSP responder answers good; a PIN-less attempt with the same credential is refused.",
        collect:
          "p11_child.log extract for the authentication, the presented certificate chain, and the OCSP request/response pair.",
      },
    ],
    duration: 90,
    author: "Marcus Hale",
    version: "v1.4",
  },
  {
    id: "TP-0102",
    title: "Interactive session lock after 15 minutes of inactivity — RHEL 9 ground segment",
    objective: "TO-102",
    method: "Test",
    nodes: ["CN-0120", "CN-0122", "CN-0110", "CN-0113"],
    preconditions: [
      "The operator lock policy is applied by the rhel9-desktop-lock Ansible role at its Aug 2026 revision.",
      "A non-privileged operator account ops-tne is signed in at both a text console and a GNOME session on gcs-app-02.",
      "An NTP-synchronised timestamp source is at hand; the criterion is 15 minutes, not 'about fifteen'.",
    ],
    steps: [
      {
        id: "TP-0102-S1",
        n: 1,
        action:
          "Read the enforced lock settings on gcs-app-02: grep -R lock-after-time /etc/tmux.conf /etc/tmux.conf.d/ and gsettings get org.gnome.desktop.session idle-delay.",
        expected:
          "set -g lock-after-time 900 is present in the system tmux configuration and idle-delay returns uint32 900.",
        collect: "gcs-app-02_lock_settings.txt containing both command outputs verbatim.",
      },
      {
        id: "TP-0102-S2",
        n: 2,
        action:
          "Leave the ops-tne tmux session idle at a text console for 16 minutes with no keyboard or network input, timing from the last keystroke.",
        expected:
          "The pane is replaced by the lock prompt within 900 s of the last keystroke, measured from the client_activity reading to the lock event, and the pane contents are not readable behind it.",
        collect:
          "The tmux lock event timestamp for the session and the client_activity reading establishing the last keystroke, plus timestamped screen captures at 14:00 and 15:30 elapsed showing the pane before and after the lock.",
      },
      {
        id: "TP-0102-S3",
        n: 3,
        action:
          "Confirm the graphical lock is enforced as policy, not preference: dconf read /org/gnome/desktop/screensaver/lock-enabled, then list and cat /etc/dconf/db/local.d/locks/.",
        expected:
          "lock-enabled reads true and a lock file names both /org/gnome/desktop/session/idle-delay and /org/gnome/desktop/screensaver/lock-enabled, so the operator cannot override either.",
        collect:
          "dconf dump /org/gnome/desktop/ output and a listing of /etc/dconf/db/local.d/locks/ with file contents.",
      },
      {
        id: "TP-0102-S4",
        n: 4,
        action: "From the locked GNOME session press a key and attempt to resume the desktop.",
        expected:
          "Resuming requires the account's PIV PIN or password; the session does not unlock on keypress alone and the desktop behind the lock screen is not revealed.",
        collect:
          "Screen recording of the unlock attempt and the corresponding gdm authentication entries from journalctl.",
      },
    ],
    duration: 75,
    author: "Priya Raman",
    version: "v2.0",
  },
  {
    id: "TP-0104",
    title: "Audit record offload latency to the enterprise aggregator",
    objective: "TO-104",
    method: "Test",
    nodes: ["CN-0130", "CN-0131", "CN-0132"],
    preconditions: [
      "gcs-db-01 is forwarding through rsyslog 8.2102 with the disk-assisted queue configured in /etc/rsyslog.d/30-aggregator.conf.",
      "The assessor holds read access to the enterprise aggregator's search API for the atlas-prod index.",
      "The run spans more than 24 hours by design; the change window on gcs-db-01 must be held open for the duration.",
    ],
    steps: [
      {
        id: "TP-0104-S1",
        n: 1,
        action:
          "Generate 500 marker audit records on gcs-db-01 with logger -p authpriv.notice 'TE-0043 MARKER <uuid>' and record each marker's auditd event id and generation time.",
        expected:
          "All 500 markers appear in /var/log/audit/audit.log within 60 seconds of generation, with no gap in the event id sequence.",
        collect:
          "Marker manifest (uuid, event id, generation timestamp) and the audit.log extract covering the generation window.",
      },
      {
        id: "TP-0104-S2",
        n: 2,
        action:
          "Read the rsyslog queue state immediately after generation: rsyslogd -N1, the impstats snapshot for the aggregator action, and du -sh /var/spool/rsyslog.",
        expected:
          "The queue is draining rather than growing, the spool is below 512 MB, and impstats reports zero discarded messages and no queue-full condition.",
        collect:
          "impstats snapshot, spool size reading, and the rsyslogd -N1 configuration check output.",
      },
      {
        id: "TP-0104-S3",
        n: 3,
        action:
          "24 hours after generation, query the aggregator for each marker uuid and record which are retrievable.",
        expected:
          "All 500 markers are retrievable at the aggregator within 24 hours of generation.",
        collect:
          "Aggregator query export listing each marker uuid with its ingest timestamp, plus the query string used.",
      },
      {
        id: "TP-0104-S4",
        n: 4,
        action:
          "Compute generation-to-aggregator latency for every retrieved marker and take the p50, p95 and maximum.",
        expected: "p95 latency is at or under the 24-hour offload statement the CCI carries.",
        collect: "Latency histogram CSV and the summary statistics with the sample size stated.",
      },
      {
        id: "TP-0104-S5",
        n: 5,
        action:
          "Sever the aggregator link for four hours with an nftables drop rule, generate 100 further markers, then restore the link.",
        expected:
          "Spooled records replay after restoration and the aggregator's count for the outage window equals the count generated locally — nothing lost, nothing duplicated.",
        collect:
          "Before/after counts on both sides, the nftables rule with its apply and remove timestamps, and the replay reconciliation sheet.",
      },
    ],
    duration: 1740,
    author: "Nadia Fournier",
    version: "v1.1",
  },
  {
    id: "TP-0106",
    title: "Keycloak administrative console requires PIV-derived multifactor",
    objective: "TO-101",
    method: "Demonstration",
    nodes: ["CN-0220", "CN-0221", "CN-0222", "CN-0223"],
    preconditions: [
      "keycloak-idp is at 24.0.5 on OpenJDK 21.0.3 with the Bouncy Castle FIPS provider active.",
      "A spare test certificate is available that can be revoked during the run without affecting operations.",
      "The x509 browser flow is bound to the atlas realm and the assessor can reach the admin console from the management VLAN.",
    ],
    steps: [
      {
        id: "TP-0106-S1",
        n: 1,
        action:
          "From the management VLAN open the admin console and authenticate as a realm administrator with username and password only.",
        expected:
          "The password step completes but the console is not reached; the flow advances to the X.509 authenticator and stops there.",
        collect:
          "Browser HAR file for the login flow and the Keycloak event log entries for the attempt.",
      },
      {
        id: "TP-0106-S2",
        n: 2,
        action:
          "Authenticate the same account through the x509 browser flow with the test PIV credential.",
        expected:
          "The console loads only after certificate validation, and the event log records LOGIN with identity_provider x509 and the certificate subject DN.",
        collect: "Keycloak admin event export for the session and the presented certificate chain.",
      },
      {
        id: "TP-0106-S3",
        n: 3,
        action:
          "Inspect the browser and direct-grant authentication flows bound to the master and atlas realms.",
        expected:
          "No enabled execution allows password-only access to a realm-management role, and direct grant is disabled for any account holding realm-admin.",
        collect: "Realm partial export (JSON) including the authentication flow bindings.",
      },
      {
        id: "TP-0106-S4",
        n: 4,
        action:
          "Exercise the revocation path: query the configured OCSP responder for the test credential's serial, then revoke the spare test certificate and attempt a login with it.",
        expected:
          "The responder returns a signed good response inside the authenticator's timeout for the valid credential, and the login with the revoked certificate is refused.",
        collect:
          "OCSP request/response pair for both serials and the Keycloak server log covering both attempts.",
      },
    ],
    duration: 60,
    author: "Victor Amsel",
    version: "v1.0",
  },
  {
    id: "TP-0110",
    title: "Untrusted-enclave information flow to mission-api internal endpoints",
    objective: "TO-110",
    method: "Test",
    nodes: ["CN-0215", "CN-0210", "CN-0310"],
    preconditions: [
      "A jump host sits on the tactical edge VLAN behind edge-sw-a1 and holds no credential for the mission enclave.",
      "mission-api 2.14.0 is deployed at image digest sha256:72591e57 and the enclave gateway is at its Aug 2026 rule set.",
      "The safety officer has confirmed the edge VLAN is not carrying live exercise traffic during the window.",
    ],
    steps: [
      {
        id: "TP-0110-S1",
        n: 1,
        action:
          "From the untrusted jump host resolve the mission-api service address, establish a TLS session on TCP 443, then traceroute to it.",
        expected:
          "The handshake completes only through the enclave gateway; the pod address is not reachable directly and the trace shows the gateway hop.",
        collect: "openssl s_client transcript, traceroute output, and the resolved address record.",
      },
      {
        id: "TP-0110-S2",
        n: 2,
        action:
          "Issue GET /metrics from the untrusted jump host with no credential and no client certificate.",
        expected:
          "HTTP 403 from the gateway with no Prometheus exposition body returned; the response carries no build labels, target list or process metrics.",
        collect: "Full HTTP request and response capture including headers and body length.",
      },
      {
        id: "TP-0110-S3",
        n: 3,
        action: "Issue GET /debug/pprof/heap from the same position with no credential.",
        expected:
          "HTTP 403 or 404; the profiling endpoints are not routable from outside the enclave and no heap profile is returned.",
        collect: "Full HTTP request and response capture.",
      },
      {
        id: "TP-0110-S4",
        n: 4,
        action:
          "Read the enclave gateway flow log for the attempt window and correlate every request above to a decision record.",
        expected:
          "Every cross-zone request in the window produced a decision record naming the source address within five minutes, and each denial raised the configured alert.",
        collect:
          "Gateway flow-log extract for the window and the alert queue entries with their delivery timestamps.",
      },
    ],
    duration: 120,
    author: "Wes Duarte",
    version: "v1.3",
  },
  {
    id: "TP-0111",
    title: "Tactical edge management-plane transport cryptography",
    objective: "TO-111",
    method: "Test",
    nodes: ["CN-0310", "CN-0313"],
    preconditions: [
      "Console access to edge-sw-a1 is available so the run cannot be locked out by its own findings.",
      "edge-sw-a1 is running IOS-XE 17.9.4a and the management workstation sits on the management VRF.",
      "A maintenance window is open on the tactical edge segment; the switch may be reloaded if required.",
    ],
    steps: [
      {
        id: "TP-0111-S1",
        n: 1,
        action: "Over the console capture show running-config | section line vty from edge-sw-a1.",
        expected:
          "Every vty line shows transport input ssh with no telnet, an access-class bound to the management ACL, and exec-timeout 10 0.",
        collect: "Console session transcript saved as edge-sw-a1_vty_config.txt with the run id.",
      },
      {
        id: "TP-0111-S2",
        n: 2,
        action:
          "From the management workstation attempt telnet 10.42.7.11 23 and record what the device returns.",
        expected: "Connection refused; no banner, no Username prompt, no negotiation.",
        collect: "Terminal transcript with timestamps and a tcpdump capture of the attempt.",
      },
      {
        id: "TP-0111-S3",
        n: 3,
        action:
          "Enumerate the SSH algorithms the device offers with nmap --script ssh2-enum-algos and an ssh -vv proposal capture.",
        expected:
          "Only FIPS 140-3 approved key exchange, cipher and MAC algorithms are offered — no diffie-hellman-group14-sha1, no hmac-sha1, no 3des-cbc.",
        collect:
          "ssh2-enum-algos output saved as edge-sw-a1_ssh_algos.txt and the ssh -vv transcript.",
      },
      {
        id: "TP-0111-S4",
        n: 4,
        action:
          "Attempt an snmpwalk with a v2c community string, then repeat the query with an SNMPv3 authPriv user on the management VRF.",
        expected:
          "The v2c attempt times out with no response; the v3 authPriv query returns sysDescr, showing v3 is the only accepted path.",
        collect: "Both snmpwalk transcripts and the device's show snmp user output.",
      },
    ],
    duration: 75,
    author: "Wes Duarte",
    version: "v1.2",
  },
  {
    id: "TP-0112",
    title: "Ground-segment and database transport cryptography configuration inspection",
    objective: "TO-111",
    method: "Inspection",
    nodes: ["CN-0110", "CN-0120", "CN-0130", "CN-0132"],
    preconditions: [
      "The CM system can export the as-deployed configuration files for the three ground-segment hosts at a named baseline.",
      "The platform metrics store retains at least seven days of pg_stat_ssl samples.",
    ],
    steps: [
      {
        id: "TP-0112-S1",
        n: 1,
        action:
          "On gcs-app-01, gcs-app-02 and gcs-db-01 capture update-crypto-policies --show and sshd -T | egrep '^(ciphers|macs|kexalgorithms)'.",
        expected:
          "Every host reports the FIPS policy rather than DEFAULT, and no cbc cipher, sha1 MAC or diffie-hellman-group1 key exchange appears on any of the three.",
        collect:
          "gcs-crypto-policy-2026-08-24.txt with one capture block per host and the sha256 of each block.",
      },
      {
        id: "TP-0112-S2",
        n: 2,
        action:
          "Inspect postgresql.conf and pg_hba.conf on gcs-db-01 as exported from the CM baseline.",
        expected:
          "ssl = on, ssl_min_protocol_version = TLSv1.3, and every mission-api role entry is hostssl with clientcert=verify-full; no plain host entry exists for a mission role.",
        collect:
          "Both configuration files as exported, labelled with the CM baseline id they came from.",
      },
      {
        id: "TP-0112-S3",
        n: 3,
        action:
          "Query the last seven days of pg_stat_ssl samples for any session from a mission-api service account recorded with ssl false.",
        expected:
          "Zero non-TLS sessions from a mission service account across the whole sample window.",
        collect: "Metrics query export with the sample window and row count stated.",
      },
    ],
    duration: 45,
    author: "Nadia Fournier",
    version: "v1.1",
  },
  {
    id: "TP-0120",
    title: "Degraded-communications continuity of security functions",
    objective: "TO-120",
    method: "Demonstration",
    nodes: ["CN-0300", "CN-0310", "CN-0313", "CN-0215", "CN-0220"],
    preconditions: [
      "The AO's representative is present for the whole window; this is a demonstration, not an unwitnessed test.",
      "A four-hour DDIL window is approved on the tactical edge segment and the operator position is staffed throughout.",
      "The tactical edge position holds a valid cached authorization decision before the uplink is severed.",
    ],
    steps: [
      {
        id: "TP-0120-S1",
        n: 1,
        action:
          "Shut the primary uplink on edge-sw-a1 (interface TenGigabitEthernet1/0/1, shutdown) and start the four-hour window, recording the time on the shared clock.",
        expected:
          "The tactical edge segment loses enclave reachability within 30 seconds and the degraded-mode banner is raised on the operator console; no security function restarts or crashes.",
        collect:
          "Switch console transcript showing the shutdown timestamp and operator console captures at T+0 and T+2 minutes.",
      },
      {
        id: "TP-0120-S2",
        n: 2,
        action:
          "During the window, authenticate an operator at the tactical edge position on the cached credential and attempt one authorized and one unauthorized action.",
        expected:
          "The authorized action succeeds against the cached authorization decision and the unauthorized action is refused with the same denial the connected mode produces.",
        collect:
          "Operator terminal transcript and the local policy decision log for both attempts.",
      },
      {
        id: "TP-0120-S3",
        n: 3,
        action:
          "At T+3h read the local audit spool: auditctl -s for the backlog and lost counters, and ausearch over the window against the generated count.",
        expected:
          "lost stays at 0, the backlog stays below the configured limit, and the spooled record count equals the count generated during the window.",
        collect: "auditctl -s readings at T+0, T+1h and T+3h, plus the ausearch record count.",
      },
      {
        id: "TP-0120-S4",
        n: 4,
        action:
          "Read the in-use key epoch at T+0 and T+4h, then force a key rollover while still in the degraded state.",
        expected:
          "The in-use key stays valid for the whole window AND a forced rollover either completes locally or fails closed with a logged, recoverable error — it must never continue silently on an expired key.",
        collect: "Key epoch readings at both times and the HSM rollover attempt log.",
      },
      {
        id: "TP-0120-S5",
        n: 5,
        action:
          "Restore the uplink (no shutdown) and, once the enclave is reachable, reconcile the spooled audit records against the aggregator.",
        expected:
          "The aggregator's count for the window equals the locally generated count, the sequence has no holes, and replay completes within 15 minutes of link restoration.",
        collect:
          "Aggregator query export for the window and the local-versus-aggregator sequence reconciliation sheet.",
      },
    ],
    duration: 300,
    author: "Amara Bell",
    version: "v1.1",
  },
  {
    id: "TP-0121",
    title: "Local audit spool integrity across a simulated DDIL window",
    objective: "TO-120",
    method: "Analysis",
    nodes: ["CN-0310", "CN-0313", "CN-0130", "CN-0131"],
    preconditions: [
      "The Jul 2026 Sierra Vista exercise capture is available and its peak generation rate has been measured.",
      "A replay harness can drive the collector at a controlled multiple of the measured rate.",
    ],
    steps: [
      {
        id: "TP-0121-S1",
        n: 1,
        action:
          "Take the auditd and rsyslog spool configuration from the tactical edge collector and the ground aggregator and compute worst-case retention hours at the measured 95th-percentile generation rate.",
        expected:
          "Computed retention at p95 generation is at least the 72-hour DDIL planning window on every collector examined.",
        collect:
          "ddil-spool-retention-2026-08.xlsx with the input rates and the queries they were taken from.",
      },
      {
        id: "TP-0121-S2",
        n: 2,
        action:
          "Replay the Jul 2026 exercise capture through the collector at 1.5x the measured peak rate and sample the spool every minute.",
        expected:
          "No record is dropped at 1.5x peak: lost stays 0 and the spool high-water mark stays under 70% of the configured limit.",
        collect:
          "Replay harness log, per-minute auditctl -s samples, and the spool high-water reading.",
      },
      {
        id: "TP-0121-S3",
        n: 3,
        action:
          "Compare the replayed record set at the aggregator against the source capture record for record.",
        expected:
          "Every record in the source capture is present at the aggregator with its original timestamp and sequence, and no record is duplicated.",
        collect: "ddil-replay-diff-2026-08-07.csv and the record counts from both sides.",
      },
    ],
    duration: 240,
    author: "Priya Raman",
    version: "v1.0",
  },
];

export const procedureById = new Map(procedures.map((p) => [p.id, p]));

const proceduresByObjective = new Map<string, TestProcedure[]>();
for (const p of procedures) {
  const list = proceduresByObjective.get(p.objective);
  if (list) list.push(p);
  else proceduresByObjective.set(p.objective, [p]);
}

/* ------------------------------------------------------------------- runs */

/**
 * The seed run log. Read runs through `runsForProcedure`, `runsForEvent` or
 * `runById` so session edits from `recordStep` / `setRunState` are resolved;
 * this array is the unpatched baseline, exactly as `compositionNodes` is.
 */
export const testRuns: TestRun[] = [
  {
    id: "TR-0113",
    procedure: "TP-0121",
    event: "TE-0038",
    operator: "Amara Bell",
    witness: "—",
    state: "Complete",
    started: "Aug 06, 2026 13:00",
    completed: "Aug 07, 2026 16:20",
    build:
      "Jul 2026 Sierra Vista exercise capture, 18.4 GB, replayed against collector build 2026.07.3",
    configuration:
      "Analysis only, no production change. Replay harness at 1.5x the measured p95 generation rate of 612 records per second.",
    nodes: ["CN-0310", "CN-0313", "CN-0130", "CN-0131"],
    records: [
      {
        step: "TP-0121-S1",
        result: "Pass",
        observed:
          "Computed worst-case retention at p95 generation: 96 hours on the tactical edge collector and 141 hours on the ground aggregator, both above the 72-hour planning window.",
        evidence: ["EVD-8830"],
        at: "Aug 06, 2026 15:42",
      },
      {
        step: "TP-0121-S2",
        result: "Pass",
        observed:
          "At 1.5x peak for six hours, lost stayed at 0 and the spool high-water mark reached 61% of the configured limit.",
        evidence: ["EVD-8830"],
        at: "Aug 07, 2026 11:05",
      },
      {
        step: "TP-0121-S3",
        result: "Pass",
        observed:
          "Record-for-record diff over 13.2 million records: every source record present at the aggregator with its original timestamp and sequence, zero duplicates.",
        evidence: ["EVD-8830"],
        at: "Aug 07, 2026 16:08",
      },
    ],
    retestOf: null,
    findings: [],
    notes:
      "The analysis half of TO-120, executed inside the TE-0038 window. This is what the declared Met on TO-120 was written against; the live demonstration in TR-0114 is what disagrees with it.",
  },
  {
    id: "TR-0101",
    procedure: "TP-0101",
    event: "TE-0041",
    operator: "Joel Barrantes",
    witness: "Nadia Fournier",
    state: "Complete",
    started: "Aug 13, 2026 09:15",
    completed: "Aug 13, 2026 11:40",
    build: "atlas-gcs-2026.08.2 — RHEL 9.4 golden image r14, kernel 5.14.0-427.28.1.el9_4",
    configuration:
      "Both hosts at CM baseline BL-2026.08.1. No deviations in force; the Ansible drift job last ran Aug 12 23:00 and reported no changes.",
    nodes: ["CN-0110", "CN-0114", "CN-0120", "CN-0124"],
    records: [
      {
        step: "TP-0101-S1",
        result: "Fail",
        observed:
          "gcs-app-01 returned gssapiauthentication yes and kerberosauthentication yes; gcs-app-02 returned yes for both as well. passwordauthentication no and permitrootlogin no were correct on both. The golden image ships the GSSAPI directives enabled and nothing in the Ansible role turns them off.",
        evidence: ["EVD-8841"],
        at: "Aug 13, 2026 09:38",
      },
      {
        step: "TP-0101-S2",
        result: "Pass",
        observed:
          "Both hosts refused the password attempt at the protocol level; /var/log/secure shows Connection closed by authenticating user svc-tne-priv with no Accepted password line in the window.",
        evidence: ["EVD-8841"],
        at: "Aug 13, 2026 10:02",
      },
      {
        step: "TP-0101-S3",
        result: "Fail",
        observed:
          "With a valid TGT, gcs-app-01 advertised gssapi-with-mic in its method list and completed the authentication to a privileged shell without the PIV credential ever being presented. gcs-app-02 behaved identically. This is the condition filed as FND-2214.",
        evidence: ["EVD-8841"],
        at: "Aug 13, 2026 10:31",
      },
      {
        step: "TP-0101-S4",
        result: "Pass",
        observed:
          "PIV authentication succeeded on both hosts; p11_child.log records the chain to DoD ID CA-59 and an OCSP good response at 210 ms. The PIN-less attempt was refused.",
        evidence: ["EVD-8841"],
        at: "Aug 13, 2026 11:24",
      },
    ],
    retestOf: null,
    findings: ["FND-2214"],
    notes:
      "First execution of TP-0101 v1.4 under TE-0041 with the assessor observing. The GSSAPI path is the whole finding: the interface accepts an authentication that is not PIV-derived, and it does so on both hosts.",
  },
  {
    id: "TR-0102",
    procedure: "TP-0102",
    event: "TE-0041",
    operator: "Joel Barrantes",
    witness: "Nadia Fournier",
    state: "Complete",
    started: "Aug 13, 2026 13:05",
    completed: "Aug 13, 2026 15:50",
    build: "atlas-gcs-2026.08.2 — RHEL 9.4 golden image r14, GNOME 40.4, tmux 3.2a",
    configuration:
      "gcs-app-02 only. Desktop package set at the Jul 2026 revision; the rhel9-desktop-lock role had last applied Aug 09.",
    nodes: ["CN-0120", "CN-0122"],
    records: [
      {
        step: "TP-0102-S1",
        result: "Fail",
        observed:
          "No lock-after-time directive exists in /etc/tmux.conf or /etc/tmux.conf.d/ on gcs-app-02; the grep returned nothing. gsettings returned uint32 900 for idle-delay, so the graphical half of the policy was present and the terminal half was not.",
        evidence: ["EVD-8841"],
        at: "Aug 13, 2026 13:22",
      },
      {
        step: "TP-0102-S2",
        result: "Fail",
        observed:
          "The tmux pane was still unlocked and fully readable at 15:30 elapsed and again at 22:00 elapsed when the step was abandoned. client_activity had not advanced since 13:31. Filed as FND-2258.",
        evidence: ["EVD-8841"],
        at: "Aug 13, 2026 14:05",
      },
      {
        step: "TP-0102-S3",
        result: "Pass",
        observed:
          "lock-enabled read true and /etc/dconf/db/local.d/locks/00-screensaver locked both /org/gnome/desktop/session/idle-delay and /org/gnome/desktop/screensaver/lock-enabled. An override attempt as ops-tne was rejected by dconf.",
        evidence: ["EVD-8841"],
        at: "Aug 13, 2026 15:12",
      },
      {
        step: "TP-0102-S4",
        result: "Pass",
        observed:
          "The GNOME lock screen demanded the account PIN; keypress alone returned to the lock prompt and the desktop was not exposed. gdm-password logged one authentication per unlock.",
        evidence: [],
        at: "Aug 13, 2026 15:44",
      },
    ],
    retestOf: null,
    findings: ["FND-2258"],
    notes:
      "S4 was demonstrated to the assessor but the screen recording was never filed, so the step is recorded Pass with no artifact behind it. That gap is why this run reports an unevidenced step.",
  },
  {
    id: "TR-0105",
    procedure: "TP-0106",
    event: null,
    operator: "Victor Amsel",
    witness: "Nadia Fournier",
    state: "Complete",
    started: "Aug 18, 2026 10:00",
    completed: "Aug 18, 2026 12:25",
    build: "keycloak-idp 24.0.5 on OpenJDK 21.0.3+9, Bouncy Castle FIPS 1.0.2.4",
    configuration:
      "atlas realm at export rev 2026-08-14. The OCSP responder was inside its scheduled maintenance freeze for the whole window.",
    nodes: ["CN-0220", "CN-0221", "CN-0222", "CN-0223"],
    records: [
      {
        step: "TP-0106-S1",
        result: "Pass",
        observed:
          "Password-only authentication stopped at the X.509 authenticator; the console was never reached and the event log recorded LOGIN_ERROR at the certificate step.",
        evidence: ["EVD-8891"],
        at: "Aug 18, 2026 10:24",
      },
      {
        step: "TP-0106-S2",
        result: "Pass",
        observed:
          "The x509 flow admitted the test PIV credential and the event log recorded identity_provider x509 with subject CN=TNE.TEST.1234567890, OU=USA, O=U.S. Government.",
        evidence: ["EVD-8891", "EVD-8892"],
        at: "Aug 18, 2026 10:58",
      },
      {
        step: "TP-0106-S3",
        result: "Pass",
        observed:
          "The realm export shows direct grant disabled on both realms and no enabled execution reaching realm-management without the x509 authenticator. Reviewed line by line with the identity platform owner.",
        evidence: ["EVD-8892"],
        at: "Aug 18, 2026 11:40",
      },
      {
        step: "TP-0106-S4",
        result: "Inconclusive",
        observed:
          "The OCSP responder was inside a scheduled maintenance freeze for the entire window, so neither the good response nor the revoked-certificate refusal could be exercised. The authenticator's configured responder URL and 3-second timeout were read from the realm export, but a configuration reading is not the revocation behaviour this step asks for. Recorded Inconclusive rather than Pass; it must be re-run against a live responder before the TRR package closes.",
        evidence: ["EVD-8892"],
        at: "Aug 18, 2026 12:18",
      },
    ],
    retestOf: null,
    findings: [],
    notes:
      "Carried on the TRR readiness checklist rather than a numbered event: the identity platform sits outside the TE-0041 asset scope and TE-0046 had not opened yet.",
  },
  {
    id: "TR-0115",
    procedure: "TP-0110",
    event: "TE-0044",
    operator: "Wes Duarte",
    witness: "—",
    state: "Aborted",
    started: "Aug 19, 2026 21:00",
    completed: "Aug 19, 2026 21:40",
    build: "mission-api 2.14.0 — sha256:72591e57, enclave gateway rule set 2026.08.14",
    configuration:
      "Tactical edge VLAN. The segment was found to be carrying live Sierra Vista exercise traffic, which the procedure's third precondition forbids.",
    nodes: ["CN-0310"],
    records: [
      {
        step: "TP-0110-S1",
        result: "Pass",
        observed:
          "TLS session to the mission-api service address completed through the enclave gateway; traceroute showed the gateway hop and the pod address did not answer directly.",
        evidence: ["EVD-8866"],
        at: "Aug 19, 2026 21:22",
      },
    ],
    retestOf: null,
    findings: [],
    notes:
      "Aborted 40 minutes in. The safety officer stopped the run over the live exercise traffic; the one completed step is retained because it was validly executed. Re-executed as TR-0103 the following night.",
  },
  {
    id: "TR-0103",
    procedure: "TP-0110",
    event: "TE-0044",
    operator: "Wes Duarte",
    witness: "Nadia Fournier",
    state: "Complete",
    started: "Aug 20, 2026 20:10",
    completed: "Aug 21, 2026 01:35",
    build: "mission-api 2.14.0 — sha256:72591e57, enclave gateway rule set 2026.08.14",
    configuration:
      "Tactical edge VLAN confirmed clear of exercise traffic by the safety officer at 20:05. Gateway rule set unchanged from the aborted attempt.",
    nodes: ["CN-0215", "CN-0210", "CN-0310"],
    records: [
      {
        step: "TP-0110-S1",
        result: "Pass",
        observed:
          "Same result as the aborted attempt: the handshake completed only through the gateway and the pod address was unreachable from the edge VLAN.",
        evidence: ["EVD-8866"],
        at: "Aug 20, 2026 20:31",
      },
      {
        step: "TP-0110-S2",
        result: "Fail",
        observed:
          'GET /metrics returned HTTP 200 with a 41 KB Prometheus exposition body from the untrusted enclave, with no credential presented. The body carried go_memstats, the build label mission_api_build_info{version="2.14.0"} and the full scrape target list. This is FND-2263.',
        evidence: ["EVD-8866", "EVD-8893"],
        at: "Aug 20, 2026 21:14",
      },
      {
        step: "TP-0110-S3",
        result: "Pass",
        observed:
          "GET /debug/pprof/heap returned HTTP 403 from the gateway with an empty body; the profiling routes are not published on the external listener.",
        evidence: ["EVD-8866"],
        at: "Aug 20, 2026 22:02",
      },
      {
        step: "TP-0110-S4",
        result: "Fail",
        observed:
          "Only the /debug/pprof attempt produced a decision record with an alert. The three /metrics requests were logged as allows and raised nothing, so the flow that actually crossed the boundary is the one nobody was told about.",
        evidence: ["EVD-8893"],
        at: "Aug 21, 2026 01:12",
      },
    ],
    retestOf: "TR-0115",
    findings: ["FND-2263"],
    notes:
      "The adversarial objective of TE-0044. The metrics endpoint is reachable from the untrusted enclave and the flow log records it as permitted, so the second failure follows from the first rather than being independent of it.",
  },
  {
    id: "TR-0106",
    procedure: "TP-0104",
    event: "TE-0043",
    operator: "Tom Okafor",
    witness: "Nadia Fournier",
    state: "Complete",
    started: "Aug 21, 2026 10:00",
    completed: "Aug 22, 2026 14:35",
    build: "atlas-gcs-2026.08.2 — PostgreSQL 15.6-1PGDG.rhel9, rsyslog 8.2102, auditd 3.0.7",
    configuration:
      "gcs-db-01 at CM baseline BL-2026.08.1 with the disk-assisted rsyslog queue at its delivered size: 1 GB spool, 100k in-memory, two worker threads.",
    nodes: ["CN-0130", "CN-0131", "CN-0132"],
    records: [
      {
        step: "TP-0104-S1",
        result: "Pass",
        observed:
          "All 500 markers were present in audit.log within 12 seconds of generation, with a contiguous event id sequence from 1183422 to 1183921.",
        evidence: ["EVD-8852"],
        at: "Aug 21, 2026 10:24",
      },
      {
        step: "TP-0104-S2",
        result: "Pass",
        observed:
          "impstats reported 0 discarded and no queue-full condition; the spool held 214 MB and was draining at roughly 40 records per second.",
        evidence: ["EVD-8852"],
        at: "Aug 21, 2026 10:41",
      },
      {
        step: "TP-0104-S3",
        result: "Fail",
        observed:
          "At the 24-hour query only 118 of the 500 markers were retrievable at the aggregator. The remaining 382 were still queued on gcs-db-01. This is the condition behind FND-2240.",
        evidence: ["EVD-8852", "EVD-8896"],
        at: "Aug 22, 2026 10:07",
      },
      {
        step: "TP-0104-S4",
        result: "Fail",
        observed:
          "Measured across the markers that had arrived by the end of the run: p50 21h 40m, p95 36h 12m, maximum 38h 05m. The p95 exceeds the 24-hour statement by more than half again.",
        evidence: ["EVD-8896"],
        at: "Aug 22, 2026 13:52",
      },
      {
        step: "TP-0104-S5",
        result: "Pass",
        observed:
          "Across the four-hour link outage the spool grew to 361 MB, nothing was discarded, and after restoration the aggregator count for the outage window matched the 100 markers generated locally with no duplicates.",
        evidence: ["EVD-8896"],
        at: "Aug 22, 2026 14:30",
      },
    ],
    retestOf: null,
    findings: ["FND-2240"],
    notes:
      "The queue is durable but slow: nothing is lost, and nothing arrives on time either. The declared objective result of Partially met credits the durability; this run's verdict does not, because offload latency is the criterion the CCI actually states.",
  },
  {
    id: "TR-0110",
    procedure: "TP-0110",
    event: "TE-0044",
    operator: "Wes Duarte",
    witness: "Nadia Fournier",
    state: "Complete",
    started: "Aug 22, 2026 08:30",
    completed: "Aug 22, 2026 10:45",
    build: "mission-api 2.14.0 — sha256:72591e57, enclave gateway rule set 2026.08.21",
    configuration:
      "Gateway rule set updated Aug 21 18:00 to add cross-zone decision logging and alerting. The mission-api listener itself is unchanged pending the 2.14.1 rebuild.",
    nodes: ["CN-0215", "CN-0210", "CN-0310"],
    records: [
      {
        step: "TP-0110-S1",
        result: "Pass",
        observed: "Unchanged from TR-0103: gateway-only reachability, pod address not routable.",
        evidence: ["EVD-8866"],
        at: "Aug 22, 2026 08:44",
      },
      {
        step: "TP-0110-S2",
        result: "Fail",
        observed:
          "Still HTTP 200 with the full exposition body. The gateway change addressed logging, not the route; the remediation for FND-2263 is the 2.14.1 rebuild that moves /metrics onto the internal listener, and it has not shipped.",
        evidence: ["EVD-8893"],
        at: "Aug 22, 2026 09:12",
      },
      {
        step: "TP-0110-S3",
        result: "Pass",
        observed: "HTTP 403, unchanged.",
        evidence: ["EVD-8893"],
        at: "Aug 22, 2026 09:38",
      },
      {
        step: "TP-0110-S4",
        result: "Pass",
        observed:
          "Every cross-zone request in the window now carries a decision record naming the source address, and the two denials raised alerts at 09:41 and 09:43 — inside the five-minute criterion. The permitted /metrics requests appear in the flow log as allows, which is what the step asks for.",
        evidence: ["EVD-8893", "EVD-8895"],
        at: "Aug 22, 2026 10:31",
      },
    ],
    retestOf: "TR-0103",
    findings: [],
    notes:
      "Partial-remediation retest requested by the red cell lead so the TE-0044 report could separate the logging defect from the exposure defect. The logging half is fixed; the exposure half is not.",
  },
  {
    id: "TR-0112",
    procedure: "TP-0112",
    event: "TE-0043",
    operator: "Nadia Fournier",
    witness: "—",
    state: "Complete",
    started: "Aug 24, 2026 09:00",
    completed: "Aug 24, 2026 11:30",
    build: "atlas-gcs-2026.08.2 — RHEL 9.4, PostgreSQL 15.6-1PGDG.rhel9",
    configuration:
      "Configuration exported from CM baseline BL-2026.08.1 for all three hosts; no live change made. Executed inside the TE-0043 change window while the data platform team held it open.",
    nodes: ["CN-0110", "CN-0120", "CN-0130", "CN-0132"],
    records: [
      {
        step: "TP-0112-S1",
        result: "Pass",
        observed:
          "All three hosts report FIPS from update-crypto-policies --show. sshd -T on each returns aes256-gcm@openssh.com,aes128-gcm@openssh.com for ciphers and hmac-sha2-512,hmac-sha2-256 for MACs; no cbc cipher, no sha1 MAC, no group1 key exchange.",
        evidence: ["EVD-8897"],
        at: "Aug 24, 2026 09:36",
      },
      {
        step: "TP-0112-S2",
        result: "Pass",
        observed:
          "postgresql.conf sets ssl = on and ssl_min_protocol_version = TLSv1.3. pg_hba.conf carries three hostssl entries for the mission roles, each with clientcert=verify-full, and no plain host entry for any mission role.",
        evidence: ["EVD-8897"],
        at: "Aug 24, 2026 10:22",
      },
      {
        step: "TP-0112-S3",
        result: "Pass",
        observed:
          "Seven days of pg_stat_ssl samples, 20,160 rows, returned zero sessions with ssl false from a mission service account.",
        evidence: ["EVD-8897"],
        at: "Aug 24, 2026 11:14",
      },
    ],
    retestOf: null,
    findings: [],
    notes:
      "The ground-segment half of TO-111 is clean. The objective still resolves to Not met because the tactical edge half is not, which is precisely why two procedures hang off one objective.",
  },
  {
    id: "TR-0109",
    procedure: "TP-0102",
    event: "TE-0041",
    operator: "Joel Barrantes",
    witness: "Nadia Fournier",
    state: "Complete",
    started: "Aug 25, 2026 14:00",
    completed: "Aug 25, 2026 16:35",
    build: "atlas-gcs-2026.08.2 — RHEL 9.4 golden image r14, GNOME 40.4, tmux 3.2a",
    configuration:
      "gcs-app-02 after the Aug 22 desktop package update (gnome-shell 40.4-24 to 40.4-26) and the Aug 24 rhel9-desktop-lock role run that added the tmux directive.",
    nodes: ["CN-0120", "CN-0122"],
    records: [
      {
        step: "TP-0102-S1",
        result: "Pass",
        observed:
          "/etc/tmux.conf.d/10-lock.conf now carries set -g lock-after-time 900, applied by the rhel9-desktop-lock role on Aug 24. gsettings still returns uint32 900.",
        evidence: ["EVD-8898"],
        at: "Aug 25, 2026 14:18",
      },
      {
        step: "TP-0102-S2",
        result: "Pass",
        observed:
          "The pane locked 897 s after the last keystroke — 14:57 elapsed, inside the 900 s criterion — and the contents were not readable behind the prompt. client_activity fixed the last keystroke and the lock event timestamp was read from the tmux server log.",
        evidence: ["EVD-8898"],
        at: "Aug 25, 2026 14:52",
      },
      {
        step: "TP-0102-S3",
        result: "Fail",
        observed:
          "Regression against TR-0102. lock-enabled still reads true, but /etc/dconf/db/local.d/locks/ is now empty — the Aug 22 gnome-shell update replaced /etc/dconf/db/local.d and the lock file was not restored. As ops-tne, gsettings set org.gnome.desktop.session idle-delay 0 succeeded, so an operator can now switch the graphical lock off entirely.",
        evidence: ["EVD-8898", "EVD-8899"],
        at: "Aug 25, 2026 15:47",
      },
      {
        step: "TP-0102-S4",
        result: "Pass",
        observed:
          "With the lock still enabled by default, resuming required the account PIN and the desktop was not exposed. The screen recording was filed this time.",
        evidence: ["EVD-8899"],
        at: "Aug 25, 2026 16:24",
      },
    ],
    retestOf: "TR-0102",
    findings: [],
    notes:
      "The retest the remediation asked for fixed the terminal lock and broke the graphical one. S3 passed in TR-0102 and fails here — the package update, not the remediation, is what moved it.",
  },
  {
    id: "TR-0108",
    procedure: "TP-0101",
    event: "TE-0041",
    operator: "Joel Barrantes",
    witness: "Nadia Fournier",
    state: "Complete",
    started: "Aug 26, 2026 09:05",
    completed: "Aug 26, 2026 11:20",
    build: "atlas-gcs-2026.08.2 — RHEL 9.4 golden image r14, openssh-server 8.7p1-38.el9",
    configuration:
      "gcs-app-02 carries deviation DEV-0042: the sshd baseline change was applied there first as a canary. gcs-app-01 is unchanged at BL-2026.08.1.",
    nodes: ["CN-0110", "CN-0114", "CN-0120", "CN-0124"],
    records: [
      {
        step: "TP-0101-S1",
        result: "Fail",
        observed:
          "gcs-app-02 now returns gssapiauthentication no and kerberosauthentication no. gcs-app-01 still returns yes for both. The step is written against every host in scope, so one canary host passing does not carry it.",
        evidence: ["EVD-8841", "EVD-8890"],
        at: "Aug 26, 2026 09:26",
      },
      {
        step: "TP-0101-S2",
        result: "Pass",
        observed: "Unchanged from TR-0101: password authentication refused on both hosts.",
        evidence: ["EVD-8890"],
        at: "Aug 26, 2026 09:58",
      },
      {
        step: "TP-0101-S3",
        result: "Fail",
        observed:
          "gcs-app-02 refused the GSSAPI attempt with Permission denied (publickey,keyboard-interactive) and no longer advertises gssapi-with-mic. gcs-app-01 still completed to a privileged shell on the Kerberos ticket alone, so FND-2214 stands.",
        evidence: ["EVD-8890"],
        at: "Aug 26, 2026 10:34",
      },
      {
        step: "TP-0101-S4",
        result: "Pass",
        observed:
          "PIV authentication succeeded on both hosts with an OCSP good response; the canary change did not disturb the certificate path.",
        evidence: [],
        at: "Aug 26, 2026 11:12",
      },
    ],
    retestOf: "TR-0101",
    findings: ["FND-2214"],
    notes:
      "Retest after the canary rollout. Nothing regressed and nothing is fixed at the objective's scope: the fix exists on one of the two hosts the procedure is written against, and the p11_child capture for S4 was not filed.",
  },
  {
    id: "TR-0107",
    procedure: "TP-0104",
    event: "TE-0043",
    operator: "Tom Okafor",
    witness: "—",
    state: "In progress",
    started: "Aug 27, 2026 09:00",
    completed: "—",
    build:
      "atlas-gcs-2026.08.2 — PostgreSQL 15.6-1PGDG.rhel9, rsyslog 8.2102 with the retuned queue",
    configuration:
      "gcs-db-01 with deviation DEV-0047 in force: the disk-assisted queue was raised to a 4 GB spool with eight worker threads on Aug 26 as the first remediation step for FND-2240.",
    nodes: ["CN-0130", "CN-0131", "CN-0132"],
    records: [
      {
        step: "TP-0104-S1",
        result: "Pass",
        observed:
          "500 markers generated at 09:12, all present in audit.log within nine seconds, event ids 1204880 to 1205379 contiguous.",
        evidence: ["EVD-8904"],
        at: "Aug 27, 2026 09:21",
      },
      {
        step: "TP-0104-S2",
        result: "Pass",
        observed:
          "With eight workers the queue drained at roughly 310 records per second and the spool peaked at 46 MB. impstats reports 0 discarded.",
        evidence: ["EVD-8904"],
        at: "Aug 27, 2026 09:44",
      },
      {
        step: "TP-0104-S3",
        result: "Not run",
        observed: "—",
        evidence: [],
        at: "—",
      },
      {
        step: "TP-0104-S4",
        result: "Not run",
        observed: "—",
        evidence: [],
        at: "—",
      },
      {
        step: "TP-0104-S5",
        result: "Not run",
        observed: "—",
        evidence: [],
        at: "—",
      },
    ],
    retestOf: "TR-0106",
    findings: [],
    notes:
      "Still running. S3 cannot be recorded until the 24-hour query on Aug 28 09:12 and S4 depends on it; the outage step is scheduled for the Aug 29 change window. The early indicators are good, which is exactly why the run must not be marked Complete before the latency is measured.",
  },
  {
    id: "TR-0114",
    procedure: "TP-0120",
    event: null,
    operator: "Amara Bell",
    witness: "Nadia Fournier",
    state: "Complete",
    started: "Aug 27, 2026 08:00",
    completed: "Aug 27, 2026 19:40",
    build: "edge-sw-a1 IOS-XE 17.9.4a; mission-api 2.14.0; keycloak-idp 24.0.5",
    configuration:
      "Four-hour DDIL window 09:00 to 13:00 with the AO's representative present. The Sierra Vista HSM partition was inside its quarterly maintenance freeze for the whole window.",
    nodes: ["CN-0300", "CN-0310", "CN-0313", "CN-0215", "CN-0220"],
    records: [
      {
        step: "TP-0120-S1",
        result: "Pass",
        observed:
          "Uplink shut at 09:00:12. Enclave reachability was lost at 09:00:31 and the degraded-mode banner raised on the operator console at 09:00:38. No security process restarted; the local policy daemon stayed up for the whole window.",
        evidence: ["EVD-8830", "EVD-8901"],
        at: "Aug 27, 2026 09:06",
      },
      {
        step: "TP-0120-S2",
        result: "Pass",
        observed:
          "The operator authenticated on the cached credential at 09:41. The authorized action completed; the unauthorized action was refused with the identical denial string the connected mode produces, checked against the T-1 day connected capture.",
        evidence: ["EVD-8901"],
        at: "Aug 27, 2026 09:58",
      },
      {
        step: "TP-0120-S3",
        result: "Pass",
        observed:
          "At T+3h: lost 0, backlog 8,412 against a limit of 65,536, and ausearch counted 42,905 records against 42,905 generated. The T+0 and T+1h readings were consistent with it.",
        evidence: ["EVD-8901"],
        at: "Aug 27, 2026 12:11",
      },
      {
        step: "TP-0120-S4",
        result: "Inconclusive",
        observed:
          "The first clause held: the key epoch read 0x2F1A at T+0 and 0x2F1A at T+4h, so the in-use key survived the window. The second clause was never exercised — the Sierra Vista HSM partition was inside its quarterly maintenance freeze and the forced rollover could not be attempted at all. Reading the rollover schedule out of configuration is not the same as watching a rollover fail closed, so this is Inconclusive rather than Pass. It needs re-running against a partition outside the freeze before TC-0028 reports.",
        evidence: ["EVD-8901"],
        at: "Aug 27, 2026 13:22",
      },
      {
        step: "TP-0120-S5",
        result: "Pass",
        observed:
          "Uplink restored at 13:00:04. Replay completed at 13:09:51, inside the 15-minute criterion. The aggregator's window count of 42,905 matched the local count exactly and the sequence reconciliation found no holes and no duplicates.",
        evidence: ["EVD-8901", "EVD-8902"],
        at: "Aug 27, 2026 19:28",
      },
    ],
    retestOf: null,
    findings: [],
    notes:
      "Directed re-demonstration for TC-0028's final report. It is deliberately not filed under TE-0038: that event was a table-top walkthrough on Aug 06 to 07 and this was a live four-hour DDIL window, so attaching it there would misstate what was executed.",
  },
  {
    id: "TR-0111",
    procedure: "TP-0111",
    event: "TE-0044",
    operator: "Wes Duarte",
    witness: "—",
    state: "Complete",
    started: "Aug 28, 2026 09:40",
    completed: "Aug 28, 2026 11:15",
    build: "edge-sw-a1 — IOS-XE 17.9.4a after the Aug 26 maintenance reload, ROMMON 17.9.1r",
    configuration:
      "Unchanged vty configuration: the change request to drop telnet slipped to the Sep 03 change board. The switch was reloaded on Aug 26 for the 17.9.4a maintenance rebuild.",
    nodes: ["CN-0310", "CN-0313"],
    records: [
      {
        step: "TP-0111-S1",
        result: "Fail",
        observed:
          "line vty 0 4 still shows transport input telnet ssh. No change has been applied, so FND-2231 is unchanged.",
        evidence: ["EVD-8846"],
        at: "Aug 28, 2026 09:52",
      },
      {
        step: "TP-0111-S2",
        result: "Fail",
        observed:
          "telnet 10.42.7.11 23 connected and returned the banner and Username prompt, exactly as in TR-0104.",
        evidence: ["EVD-8846"],
        at: "Aug 28, 2026 10:08",
      },
      {
        step: "TP-0111-S3",
        result: "Fail",
        observed:
          "Regression against TR-0104. ssh2-enum-algos now returns diffie-hellman-group14-sha1 and hmac-sha1 alongside the approved set. The Aug 26 maintenance reload reverted ip ssh server algorithm kex and ip ssh server algorithm mac to platform defaults: the hardening lines were applied to the running configuration in June and never written to startup-config.",
        evidence: ["EVD-8894", "EVD-8903"],
        at: "Aug 28, 2026 10:41",
      },
      {
        step: "TP-0111-S4",
        result: "Pass",
        observed:
          "Unchanged: v2c times out, v3 authPriv returns sysDescr, one v3 user and no community strings configured.",
        evidence: ["EVD-8903"],
        at: "Aug 28, 2026 11:04",
      },
    ],
    retestOf: "TR-0104",
    findings: [],
    notes:
      "Two failures the device already had and one it did not. The algorithm reversion is a write-memory defect rather than a configuration defect, and it would have gone unseen without the retest.",
  },
  {
    id: "TR-0104",
    procedure: "TP-0111",
    event: "TE-0044",
    operator: "Wes Duarte",
    witness: "—",
    state: "Complete",
    started: "Aug 21, 2026 09:20",
    completed: "Aug 21, 2026 12:05",
    build: "edge-sw-a1 — IOS-XE 17.9.4a, ROMMON 17.9.1r",
    configuration:
      "Maintenance window open on the tactical edge segment. Console access through the terminal server; no configuration change made during the run.",
    nodes: ["CN-0310", "CN-0313"],
    records: [
      {
        step: "TP-0111-S1",
        result: "Fail",
        observed:
          "line vty 0 4 shows transport input telnet ssh. The access-class and exec-timeout 10 0 were both present and correct, but telnet is accepted. This is FND-2231.",
        evidence: ["EVD-8846"],
        at: "Aug 21, 2026 09:41",
      },
      {
        step: "TP-0111-S2",
        result: "Fail",
        observed:
          "telnet 10.42.7.11 23 connected, returned the DoD notice banner and a Username prompt. tcpdump shows the banner and the typed username in cleartext on the wire.",
        evidence: ["EVD-8846", "EVD-8894"],
        at: "Aug 21, 2026 10:16",
      },
      {
        step: "TP-0111-S3",
        result: "Pass",
        observed:
          "ssh2-enum-algos returned only ecdh-sha2-nistp384 and ecdh-sha2-nistp256 for key exchange, aes256-gcm and aes128-gcm for ciphers, and hmac-sha2-256/512 for MACs. No sha1 MAC and no cbc cipher were offered.",
        evidence: ["EVD-8894"],
        at: "Aug 21, 2026 11:08",
      },
      {
        step: "TP-0111-S4",
        result: "Pass",
        observed:
          "The v2c snmpwalk timed out with no response after three retries; the v3 authPriv query returned sysDescr for IOS-XE 17.9.4a. show snmp user lists one v3 user and no v1/v2c community.",
        evidence: ["EVD-8894"],
        at: "Aug 21, 2026 11:52",
      },
    ],
    retestOf: null,
    findings: ["FND-2231"],
    notes:
      "Executed from the management VRF during the TE-0044 window. The cryptography the device does offer is correct; the problem is that it also offers a path with none.",
  },
  {
    id: "TR-0116",
    procedure: "TP-0104",
    event: "TE-0043",
    operator: "Tom Okafor",
    witness: "—",
    state: "Planned",
    started: "—",
    completed: "—",
    build: "atlas-gcs-2026.08.2 — pending the POAM-0071 aggregator ingest capacity uplift",
    configuration:
      "Scheduled for the Sep 08 change window, after the aggregator ingest capacity uplift lands. No configuration is in force yet.",
    nodes: ["CN-0130", "CN-0131", "CN-0132"],
    records: [],
    retestOf: null,
    findings: [],
    notes:
      "Confirmation run for the POA&M closure evidence on FND-2240. Nothing has been recorded, so its verdict is Not run rather than an optimistic blank.",
  },
];

/* ------------------------------------------------------------------ clock */

const monthIndex: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

/**
 * "MMM DD, YYYY HH:MM" to a sortable integer. "—" and anything unparseable
 * sort first, which is what a not-yet-started run should do. No Date object is
 * constructed anywhere, so the server and the client agree.
 */
function stamp(value: string): number {
  const m = /^([A-Z][a-z]{2}) (\d{2}), (\d{4}) (\d{2}):(\d{2})$/.exec(value);
  if (!m) return 0;
  const month = monthIndex[m[1] ?? ""] ?? 0;
  if (!month) return 0;
  const day = Number(m[2] ?? "0");
  const year = Number(m[3] ?? "0");
  const hour = Number(m[4] ?? "0");
  const minute = Number(m[5] ?? "0");
  return (((year * 100 + month) * 100 + day) * 100 + hour) * 100 + minute;
}

/* ------------------------------------------------------------------ store */

type RunPatch = { state?: RunState; completed?: string; records?: StepRecord[] };

const overrides = new Map<string, RunPatch>();
const listeners = new Set<() => void>();
let cache: TestRun[] | null = null;
let version = 0;

function snapshot(): TestRun[] {
  if (cache) return cache;
  cache =
    overrides.size === 0
      ? testRuns
      : testRuns.map((r) => {
          const patch = overrides.get(r.id);
          return patch ? { ...r, ...patch } : r;
        });
  return cache;
}

function emit() {
  cache = null;
  version += 1;
  for (const l of listeners) l();
}

function subscribeRuns(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Bumps on every recorded step or state change, for downstream memo keys. */
export function runLogVersion(): number {
  return version;
}

export function useTestRuns(): TestRun[] {
  return useSyncExternalStore(subscribeRuns, snapshot, snapshot);
}

/* -------------------------------------------------------------- selectors */

export function runById(runId: string): TestRun | null {
  return snapshot().find((r) => r.id === runId) ?? null;
}

export function proceduresForObjective(objectiveId: string): TestProcedure[] {
  return proceduresByObjective.get(objectiveId) ?? [];
}

/** Execution order. A run that has not started yet sorts last, not first. */
function byExecutionOrder(a: TestRun, b: TestRun): number {
  const sa = stamp(a.started);
  const sb = stamp(b.started);
  if (sa === 0 || sb === 0) {
    if (sa !== sb) return sa === 0 ? 1 : -1;
    return a.id.localeCompare(b.id);
  }
  const d = sa - sb;
  return d !== 0 ? d : a.id.localeCompare(b.id);
}

/**
 * Completion order, most recent first — the mirror of `byExecutionOrder`, with
 * the same guard applied to the other end of the run. A run completed through
 * `setRunState` carries no parsable `completed` when none of its step records
 * was stamped, and that run is the one just finished rather than the oldest
 * there is, so it sorts FIRST. Ties break on the id, and no clock is read, so
 * the server and the client agree.
 */
function byCompletionRecency(a: TestRun, b: TestRun): number {
  const sa = stamp(a.completed);
  const sb = stamp(b.completed);
  if (sa === 0 || sb === 0) {
    if (sa !== sb) return sa === 0 ? -1 : 1;
    return b.id.localeCompare(a.id);
  }
  const d = sb - sa;
  return d !== 0 ? d : b.id.localeCompare(a.id);
}

export function runsForProcedure(procedureId: string): TestRun[] {
  return snapshot()
    .filter((r) => r.procedure === procedureId)
    .sort(byExecutionOrder);
}

export function runsForEvent(eventId: string): TestRun[] {
  return snapshot()
    .filter((r) => r.event === eventId)
    .sort(byExecutionOrder);
}

/** Every run of every procedure written against the objective, in execution order. */
export function runsForObjective(objectiveId: string): TestRun[] {
  return proceduresForObjective(objectiveId)
    .flatMap((p) => runsForProcedure(p.id))
    .sort(byExecutionOrder);
}

/** TO- ids a campaign covers, through its events. Deduplicated, order preserved. */
export function objectivesForCampaign(campaignId: string): string[] {
  const seen: string[] = [];
  for (const event of eventsByCampaign(campaignId)) {
    for (const objective of objectivesForEvent(event.id)) {
      if (!seen.includes(objective.id)) seen.push(objective.id);
    }
  }
  return seen;
}

/** Procedures written against any objective the campaign covers. */
export function proceduresForCampaign(campaignId: string): TestProcedure[] {
  return objectivesForCampaign(campaignId).flatMap((id) => proceduresForObjective(id));
}

/** Every run under a campaign, through objective and procedure. Execution order. */
export function runsForCampaign(campaignId: string): TestRun[] {
  return proceduresForCampaign(campaignId)
    .flatMap((p) => runsForProcedure(p.id))
    .sort(byExecutionOrder);
}

/* ---------------------------------------------------------------- verdict */

export type RunVerdict = {
  run: string;
  /** Derived from the step records, never stored. */
  result: ObjectiveResult;
  pass: number;
  fail: number;
  inconclusive: number;
  notRun: number;
  /** Steps recorded with a result but no collected artifact. */
  unevidenced: number;
  /** One sentence stating why the verdict is what it is. */
  basis: string;
};

export function runVerdict(runId: string): RunVerdict | null {
  const run = runById(runId);
  if (!run) return null;
  const procedure = procedureById.get(run.procedure);
  if (!procedure) return null;

  const byStep = new Map(run.records.map((r) => [r.step, r]));
  let pass = 0;
  let fail = 0;
  let inconclusive = 0;
  let notRun = 0;
  let unevidenced = 0;
  let firstFail: ProcedureStep | null = null;
  let firstInconclusive: ProcedureStep | null = null;

  for (const step of procedure.steps) {
    const record = byStep.get(step.id);
    const result: StepResult = record?.result ?? "Not run";
    if (result === "Pass") {
      pass += 1;
    } else if (result === "Fail") {
      fail += 1;
      if (!firstFail) firstFail = step;
    } else if (result === "Inconclusive") {
      inconclusive += 1;
      if (!firstInconclusive) firstInconclusive = step;
    } else {
      notRun += 1;
    }
    if (result !== "Not run" && (record?.evidence.length ?? 0) === 0) unevidenced += 1;
  }

  const total = procedure.steps.length;
  const tail =
    unevidenced > 0
      ? ` ${unevidenced} recorded ${unevidenced === 1 ? "step carries" : "steps carry"} no collected artifact.`
      : "";

  let result: ObjectiveResult;
  let basis: string;
  if (fail > 0) {
    result = "Not met";
    basis = `Not met — ${firstFail?.id ?? "a step"} failed; ${fail} of ${total} steps failed and a single failed step denies the objective.${tail}`;
  } else if (inconclusive > 0) {
    result = "Partially met";
    basis = `Partially met — no step failed, but ${firstInconclusive?.id ?? "a step"} is inconclusive, so the run cannot carry the objective on its own.${tail}`;
  } else if (total > 0 && pass === total) {
    result = "Met";
    basis = `Met — all ${total} steps passed.${tail}`;
  } else if (pass > 0) {
    result = "Partially met";
    basis = `Partially met — ${pass} of ${total} steps passed and ${notRun} ${notRun === 1 ? "has" : "have"} not been run.${tail}`;
  } else {
    result = "Not run";
    basis =
      total === 0
        ? "Not run — the procedure declares no steps to record."
        : `Not run — none of the ${total} steps has been recorded.`;
  }

  return { run: run.id, result, pass, fail, inconclusive, notRun, unevidenced, basis };
}

/* ------------------------------------------------ declared versus executed */

/**
 * Weakest result first. An objective is met only if every procedure written
 * for it is met, so the rollup takes the worst of its contributors rather than
 * the most recent of them.
 */
const objectiveResultRank: Record<ObjectiveResult, number> = {
  "Not met": 0,
  "Partially met": 1,
  "Not run": 2,
  Met: 3,
};

/**
 * The objective's result AS EXECUTED. There is no stored "executed result"
 * field anywhere — `TestObjective.result` stays the single declared value in
 * `campaigns.ts` — and this is the only accessor that reconciles the two.
 *
 * Each procedure written for the objective contributes its OWN latest
 * `Complete` run, and the objective takes the worst of those contributions;
 * recency decides which run speaks for a procedure, never which procedure
 * speaks for the objective. Two procedures hang off one objective precisely
 * because both have to hold, so a clean re-inspection of one half must not
 * carry an objective the other half proved failed. It falls back to the
 * declared value when nothing has completed, and always reports which it used.
 */
export function resolvedObjectiveResult(objectiveId: string): {
  result: ObjectiveResult;
  source: "Run" | "Declared";
  /** The run that decides the rollup. The full attribution is in `basis`. */
  run: string | null;
  basis: string;
} {
  const declared = objectiveById.get(objectiveId);
  const declaredResult: ObjectiveResult = declared?.result ?? "Not run";
  const procs = proceduresForObjective(objectiveId);

  const contributors: { procedure: string; run: TestRun; verdict: RunVerdict }[] = [];
  for (const p of procs) {
    const latest = runsForProcedure(p.id)
      .filter((r) => r.state === "Complete")
      .sort(byCompletionRecency)[0];
    if (!latest) continue;
    const verdict = runVerdict(latest.id);
    if (verdict) contributors.push({ procedure: p.id, run: latest, verdict });
  }

  const worst = [...contributors].sort(
    (a, b) => objectiveResultRank[a.verdict.result] - objectiveResultRank[b.verdict.result],
  )[0];
  if (worst) {
    const result = worst.verdict.result;
    const named = contributors
      .map(
        (c) =>
          `${c.run.id} (${c.procedure}, completed ${c.run.completed}) returned ${c.verdict.result}`,
      )
      .join("; ");
    const unexecuted = procs
      .filter((p) => !contributors.some((c) => c.procedure === p.id))
      .map((p) => p.id);
    const gap = unexecuted.length
      ? ` ${unexecuted.join(", ")} ${unexecuted.length === 1 ? "has" : "have"} no completed run, so this is a partial picture.`
      : "";
    const single = contributors.length === 1;
    const lead = single
      ? `Taken from ${worst.run.id} (${worst.procedure}, completed ${worst.run.completed}), which returned ${result}.`
      : `Rolled up across ${contributors.length} procedures — ${named}. The objective takes the worst of them, ${result}, decided by ${worst.run.id}; every procedure written for the objective has to hold for it to be met.`;
    const basis =
      result === declaredResult
        ? `${lead} This agrees with the declared result.${gap}`
        : `${lead} The campaign record still declares ${objectiveId} ${declaredResult}; the declared value is an assertion and ${single ? "this run is" : "these runs are"} what was observed.${gap}`;
    return { result, source: "Run", run: worst.run.id, basis };
  }

  if (procs.length === 0) {
    return {
      result: declaredResult,
      source: "Declared",
      run: null,
      basis: `No procedure is written for ${objectiveId}, so the declared result of ${declaredResult} stands with nothing executed behind it.`,
    };
  }

  const names = procs.map((p) => p.id).join(", ");
  const openRun = procs
    .flatMap((p) => runsForProcedure(p.id))
    .find((r) => r.state === "In progress");
  return {
    result: declaredResult,
    source: "Declared",
    run: null,
    basis: openRun
      ? `No run of ${names} has completed — ${openRun.id} is still in progress — so the declared result of ${declaredResult} stands.`
      : `${names} ${procs.length === 1 ? "is" : "are"} written but no run has completed, so the declared result of ${declaredResult} stands.`,
  };
}

/** True when the run log contradicts the campaign record for this objective. */
export function objectiveDisagrees(objectiveId: string): boolean {
  const resolved = resolvedObjectiveResult(objectiveId);
  if (resolved.source !== "Run") return false;
  return resolved.result !== (objectiveById.get(objectiveId)?.result ?? "Not run");
}

/* -------------------------------------------------------------- regression */

export type RegressionRow = {
  procedure: string;
  step: string;
  priorRun: string;
  priorResult: StepResult;
  currentRun: string;
  currentResult: StepResult;
  state: "Regressed" | "Fixed" | "Still failing" | "Still passing";
};

function decisive(result: StepResult): result is "Pass" | "Fail" {
  return result === "Pass" || result === "Fail";
}

/**
 * Every step of every retest of the procedure, compared against the run it
 * re-executes. Only steps with a decisive record on BOTH sides appear: an
 * Inconclusive or an un-run step is not evidence of a regression or of a fix,
 * and inventing a fifth state to hide that would be worse than omitting it.
 */
export function regressions(procedureId: string): RegressionRow[] {
  const procedure = procedureById.get(procedureId);
  if (!procedure) return [];
  const rows: RegressionRow[] = [];

  for (const run of runsForProcedure(procedureId)) {
    if (!run.retestOf) continue;
    const prior = runById(run.retestOf);
    if (!prior || prior.procedure !== procedureId) continue;
    const priorByStep = new Map(prior.records.map((r) => [r.step, r]));
    const currentByStep = new Map(run.records.map((r) => [r.step, r]));

    for (const step of procedure.steps) {
      const before = priorByStep.get(step.id);
      const after = currentByStep.get(step.id);
      if (!before || !after) continue;
      if (!decisive(before.result) || !decisive(after.result)) continue;
      const state =
        before.result === "Pass" && after.result === "Fail"
          ? "Regressed"
          : before.result === "Fail" && after.result === "Pass"
            ? "Fixed"
            : before.result === "Fail"
              ? "Still failing"
              : "Still passing";
      rows.push({
        procedure: procedureId,
        step: step.id,
        priorRun: prior.id,
        priorResult: before.result,
        currentRun: run.id,
        currentResult: after.result,
        state,
      });
    }
  }

  return rows;
}

/** The regression rows for every procedure a campaign covers, in one table. */
export function regressionsForCampaign(campaignId: string): RegressionRow[] {
  return proceduresForCampaign(campaignId).flatMap((p) => regressions(p.id));
}

export const regressionStateTone: Record<RegressionRow["state"], Tone> = {
  Regressed: "danger",
  Fixed: "success",
  "Still failing": "warning",
  "Still passing": "neutral",
};

/* --------------------------------------------------------- campaign rollup */

export type CampaignExecution = {
  campaign: string;
  objectives: number;
  withProcedure: number;
  run: number;
  complete: number;
  met: number;
  partiallyMet: number;
  notMet: number;
  notRun: number;
  unevidencedSteps: number;
  /** Objectives that have no procedure written — the plan gap. */
  unproceduredObjectives: string[];
};

export function campaignExecution(campaignId: string): CampaignExecution {
  const objectiveIds = objectivesForCampaign(campaignId);
  const out: CampaignExecution = {
    campaign: campaignId,
    objectives: objectiveIds.length,
    withProcedure: 0,
    run: 0,
    complete: 0,
    met: 0,
    partiallyMet: 0,
    notMet: 0,
    notRun: 0,
    unevidencedSteps: 0,
    unproceduredObjectives: [],
  };

  const countedRuns = new Set<string>();

  for (const objectiveId of objectiveIds) {
    const procs = proceduresForObjective(objectiveId);
    if (procs.length === 0) out.unproceduredObjectives.push(objectiveId);
    else out.withProcedure += 1;

    const runs = procs.flatMap((p) => runsForProcedure(p.id));
    if (runs.some((r) => r.state !== "Planned")) out.run += 1;
    if (runs.some((r) => r.state === "Complete")) out.complete += 1;

    for (const run of runs) {
      if (countedRuns.has(run.id)) continue;
      countedRuns.add(run.id);
      out.unevidencedSteps += runVerdict(run.id)?.unevidenced ?? 0;
    }

    const resolved = resolvedObjectiveResult(objectiveId);
    if (resolved.result === "Met") out.met += 1;
    else if (resolved.result === "Partially met") out.partiallyMet += 1;
    else if (resolved.result === "Not met") out.notMet += 1;
    else out.notRun += 1;
  }

  return out;
}

/* --------------------------------------------------------------- mutation */

function emptyRecord(stepId: string): StepRecord {
  return { step: stepId, result: "Not run", observed: "—", evidence: [], at: "—" };
}

/**
 * Record (or amend) one step of a run. Unknown runs, and steps the run's
 * procedure does not declare, are ignored rather than invented.
 */
export function recordStep(runId: string, step: string, patch: Partial<StepRecord>): void {
  const run = runById(runId);
  if (!run) return;
  const procedure = procedureById.get(run.procedure);
  if (!procedure || !procedure.steps.some((s) => s.id === step)) return;

  const existing = run.records.find((r) => r.step === step);
  const base = existing ?? emptyRecord(step);
  const next: StepRecord = {
    step,
    result: patch.result ?? base.result,
    observed: patch.observed ?? base.observed,
    evidence: patch.evidence ?? base.evidence,
    at: patch.at ?? base.at,
  };

  const order = new Map(procedure.steps.map((s, i) => [s.id, i]));
  const records = existing
    ? run.records.map((r) => (r.step === step ? next : r))
    : [...run.records, next].sort((a, b) => (order.get(a.step) ?? 0) - (order.get(b.step) ?? 0));

  overrides.set(runId, { ...overrides.get(runId), records });
  emit();
}

/**
 * Move a run's state. A run reaches "Complete" only when every step of its
 * procedure carries a record that is not "Not run"; the transition is refused
 * otherwise and the state is left exactly as it was. On a successful
 * completion the run's `completed` timestamp is taken from its latest step
 * record — or, when no record carries one, from the run's own start — rather
 * than from a clock, so it stays SSR-stable. A completion that can be stamped
 * from neither is still allowed: `recordStep` accepts an undated record by
 * design, and `byCompletionRecency` ranks the result as the newest completion
 * rather than the oldest.
 */
export function setRunState(runId: string, state: RunState): void {
  const run = runById(runId);
  if (!run || run.state === state) return;

  if (state === "Complete") {
    if (completionBlockedBy(runId) !== null) return;

    const patch: RunPatch = { state };
    if (run.completed === "—") {
      let latest = "—";
      let best = 0;
      for (const record of run.records) {
        const value = stamp(record.at);
        if (value > best) {
          best = value;
          latest = record.at;
        }
      }
      if (latest === "—" && stamp(run.started) !== 0) latest = run.started;
      if (latest !== "—") patch.completed = latest;
    }
    overrides.set(runId, { ...overrides.get(runId), ...patch });
    emit();
    return;
  }

  overrides.set(runId, { ...overrides.get(runId), state });
  emit();
}

/** Why `setRunState(id, "Complete")` would refuse, or null when it would not. */
export function completionBlockedBy(runId: string): string | null {
  const run = runById(runId);
  if (!run) return "No such run.";
  const procedure = procedureById.get(run.procedure);
  if (!procedure) return "The run names a procedure that does not exist.";
  if (procedure.steps.length === 0) return "The procedure declares no steps to record.";
  const byStep = new Map(run.records.map((r) => [r.step, r]));
  const unrecorded = procedure.steps.filter(
    (s) => (byStep.get(s.id)?.result ?? "Not run") === "Not run",
  );
  if (unrecorded.length === 0) return null;
  return `${unrecorded.length} of ${procedure.steps.length} steps have no result recorded (${unrecorded
    .map((s) => s.id)
    .join(", ")}).`;
}

/* ------------------------------------------------------------------ tones */

export const stepResultTone: Record<StepResult, Tone> = {
  Pass: "success",
  Fail: "danger",
  Inconclusive: "warning",
  "Not run": "neutral",
};

export const runStateTone: Record<RunState, Tone> = {
  Planned: "neutral",
  "In progress": "info",
  Complete: "success",
  Aborted: "danger",
};
