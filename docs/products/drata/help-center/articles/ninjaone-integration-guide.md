# NinjaOne Integration Guide

Source: https://help.drata.com/en/articles/13554422-ninjaone-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-09-16
Fetched: 2026-11-22
Description: In this article, you learn how to sync NinjaOne device compliance data with Drata.

## Article text

Having secure devices plays a major role in meeting compliance requirements. Drata supports many Mobile Device Management solutions (MDMs), like NinjaOne, in addition to providing our agent.

## Prerequisites & Data Access

1. Make sure you have admin access to your company's NinjaOne account.
2. Your NinjaOne account has access to NinjaOne public v2 API.
3. Your NinjaOne account has the ability to create **Device Custom Fields** and scripts in the **Script Library**.
4. We currently support computers. Mobile and tablet devices are not supported.
5. The NinjaOne agent is installed on monitored endpoints (including `ninjarmm-cli` on macOS/Linux and support for `Ninja-Property-Set` on Windows).

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| Device inventory | Provide the list of all enrolled devices | Device inventory |
| Groups and associated device IDs | Retrieve complete compliance information for each device | Groups and associated device IDs |
| Device queries | Retrieve information about volumes, antivirus, patches, software, and custom fields | Installed software verification |

## Step-by-Step Setup

### Step 1: Configure NinjaOne Custom Fields

NinjaOne does not collect FDE (Full Disk Encryption Status) or Screen Lock information by default. To gather this information for compliance purposes, Drata asks that you enable some scripts in NinjaOne to collect this information from your devices and write to custom fields readable by Drata.

Drata expects the following **device custom fields** with exact API keys:

- `dratafdestatus`: Full disk encryption status (FDE).
   - Expected values: PASS, FAIL, UNKNOWN.
- `dratafdeevidence`: Free-text evidence describing how the status was determined.
- `dratascreenlockenabled`: Screen lock status.
   - Expected values: true, false, unknown (lowercase).
- `dratascreenlockevidence`: Free-text evidence.
- `dratascreenlocktime`: Screen lock timeout in **minutes** (integer).

#### Recommended field types in NinjaOne

- `dratafdestatus`: text or list field (string) restricted to PASS / FAIL / UNKNOWN.
- `dratafdeevidence`: multiline text.
- `dratascreenlockenabled`: text or list with true / false / unknown.
- `dratascreenlockevidence`: multiline text.
- `dratascreenlocktime`: numeric (integer) for minutes.

These names above are validated directly against NinjaOne constants, so the name must match exactly or Drata will treat the data as missing.

### Step 2: Drata Scripts in NinjaOne

The following are the scripts customers can copy and paste into NinjaOne to populate the custom fields above. These can be added by performing the following steps in the NinjaOne console:

1. Sign in as an administrator.
2. Navigate to **Administration → Script Library** (in some versions: *Configuration → Automation → Scripts*).
3. Create a new script for each of the files below:
   - Select the appropriate **OS type** (Windows / Mac / Linux).
   - Language:
      - **`.sh`**: Shell / Bash.
      - **`.ps1`**: PowerShell.
   - Run as **System/root** (required to read system policies and write custom fields).
4. Paste the contents of the corresponding .ninjaone file into the script editor.
5. Save with a clear name, for example:
   - `Drata - FDE (macOS) / Drata - FDE (Ubuntu)`
   - `Drata - Screen Lock (macOS) / Drata - Screen Lock (Ubuntu) / Drata - Screen Lock (Windows)`

**Copy and paste the scripts as they are displayed below:**

**▸ `Drata-FDE-mac.sh` → macOS, disk encryption (FileVault)**

```
#!/usr/bin/env bash
set -euo pipefail

CLI="/Applications/NinjaRMMAgent/programdata/ninjarmm-cli"
FIELD_STATUS="dratafdestatus"
FIELD_EVIDENCE="dratafdeevidence"

if [[ ! -x "$CLI" ]]; then
  echo "ERROR: ninjarmm-cli not found at $CLI"
  exit 1
fi

status="UNKNOWN"
parts=()
ev(){ parts+=("$*"); }

# --------------------------------------------
# 1) Primary signal: fdesetup (FileVault)
# --------------------------------------------
out="$(/usr/bin/fdesetup status 2>&1 || true)"
ev "fdesetup_status=$(echo "$out" | tr '\n' ' ')"

if echo "$out" | /usr/bin/grep -qi "FileVault is On"; then
  status="PASS"
elif echo "$out" | /usr/bin/grep -qi "FileVault is Off"; then
  status="FAIL"
else
  # Do NOT guess — leave UNKNOWN and record why
  ev "filevault_status_undetermined"
fi

# --------------------------------------------
# 2) Corroborating signal: the data volume's FileVault state.
#
# `diskutil info /` is not usable here. On APFS, / is the sealed read-only system
# volume and its "Encrypted:" field reads No whether or not FileVault is on, so it
# carries no signal. The data volume reports FileVault directly.
# --------------------------------------------
fv_volume=""
data_info="$(/usr/sbin/diskutil info /System/Volumes/Data 2>/dev/null || true)"
if [[ -n "${data_info:-}" ]]; then
  fv_volume="$(printf '%s\n' "$data_info" \
    | /usr/bin/awk -F: '/FileVault/ {gsub(/^[ \t]+|[ \t]+$/, "", $2); print $2; exit}')"
fi

if [[ -n "${fv_volume:-}" ]]; then
  ev "diskutil_data_filevault=${fv_volume}"
else
  # Pre-Catalina layouts have no /System/Volumes/Data. Absence is not disagreement.
  ev "diskutil_data_filevault="
fi

# --------------------------------------------
# 3) Disagreement guard.
#
# Only downgrades when both signals are readable and actually conflict. fdesetup stays
# the decider; this exists so the status can never contradict its own evidence.
# --------------------------------------------
if [[ -n "${fv_volume:-}" ]]; then
  fv_lc="$(printf '%s' "$fv_volume" | /usr/bin/tr '[:upper:]' '[:lower:]')"
  case "$fv_lc" in
    yes*) vol_state="on" ;;
    no*)  vol_state="off" ;;
    *)    vol_state="" ;;
  esac

  if [[ "$status" == "PASS" && "$vol_state" == "off" ]]; then
    status="UNKNOWN"
    ev "signals_disagree fdesetup=on volume=off"
  elif [[ "$status" == "FAIL" && "$vol_state" == "on" ]]; then
    status="UNKNOWN"
    ev "signals_disagree fdesetup=off volume=on"
  fi
fi

# --------------------------------------------
# Final: write NinjaOne custom fields
# --------------------------------------------
evidence="$(printf '%s; ' "${parts[@]}")"
evidence="${evidence%; }"

printf '%s' "$status"   | "$CLI" set --stdin "$FIELD_STATUS"   >/dev/null 2>&1 || true
printf '%s' "$evidence" | "$CLI" set --stdin "$FIELD_EVIDENCE" >/dev/null 2>&1 || true

echo "$FIELD_STATUS=$status"
echo "$FIELD_EVIDENCE=$evidence"
```

**▸ `Drata-FDE-ubuntu.sh` → Ubuntu/Linux, disk encryption (LUKS/dm-crypt)**

```
#!/usr/bin/env bash
set -euo pipefail

CLI="/opt/NinjaRMMAgent/programdata/ninjarmm-cli"
FIELD_STATUS="dratafdestatus"
FIELD_EVIDENCE="dratafdeevidence"

if [[ ! -x "$CLI" ]]; then
  echo "ERROR: ninjarmm-cli not found at $CLI"
  exit 1
fi

status="UNKNOWN"
evidence_parts=()
ev(){ evidence_parts+=("$*"); }

if command -v systemd-detect-virt >/dev/null 2>&1; then
  virt="$(systemd-detect-virt 2>/dev/null || true)"
  if [[ -n "$virt" && "$virt" != "none" ]]; then
    ev "virt=${virt}"
    ev "vm_detected_marking_unknown"
    status="UNKNOWN"
    evidence="$(IFS='; '; echo "${evidence_parts[*]}")"
    printf '%s' "$status"   | "$CLI" set --stdin "$FIELD_STATUS"   >/dev/null 2>&1
    printf '%s' "$evidence" | "$CLI" set --stdin "$FIELD_EVIDENCE" >/dev/null 2>&1
    echo "$FIELD_STATUS=$status"
    echo "$FIELD_EVIDENCE=$evidence"
    exit 0
  fi
fi

root_src="$(findmnt -no SOURCE / 2>/dev/null || true)"
root_fstype="$(findmnt -no FSTYPE / 2>/dev/null || true)"
ev "findmnt:/ src=${root_src:-} fstype=${root_fstype:-}"

if ! command -v lsblk >/dev/null 2>&1; then
  ev "lsblk_not_found"
  status="UNKNOWN"
else
  # Resolve root block device
  root_dev=""
  if [[ "${root_src:-}" == /dev/* ]]; then
    root_dev="$root_src"
  fi

  if [[ -z "$root_dev" ]]; then
    # Try resolve from mountpoint
    root_dev="$(findmnt -no SOURCE / 2>/dev/null | head -n 1 || true)"
    [[ "$root_dev" != /dev/* ]] && root_dev=""
  fi

  if [[ -z "$root_dev" ]]; then
    ev "could_not_resolve_root_block_device"
    status="UNKNOWN"
  else
    # Check if there is a dm-crypt layer in the chain
    chain="$(lsblk -o NAME,TYPE,FSTYPE,MOUNTPOINT -pr "$root_dev" 2>/dev/null || true)"
    ev "lsblk_chain:${root_dev} => $(echo "$chain" | tr '\n' '|')"

    if echo "$chain" | awk '{print $2}' | grep -qi '^crypt$'; then
      status="PASS"
      ev "detected_crypt_layer"
    else
      # Secondary: if root is a mapper, try cryptsetup status to confirm LUKS
      if [[ "$root_dev" == /dev/mapper/* ]] && command -v cryptsetup >/dev/null 2>&1; then
        map="$(basename "$root_dev")"
        cs="$(cryptsetup status "$map" 2>&1 || true)"
        ev "cryptsetup_status:${map} => ${cs}"
        if echo "$cs" | grep -qiE 'type:\s*luks'; then
          status="PASS"
          ev "confirmed_luks"
        else
          status="FAIL"
          ev "no_crypt_layer_and_not_luks"
        fi
      else
        status="FAIL"
        ev "no_crypt_layer_detected_for_root"
      fi
    fi
  fi
fi

evidence="$(IFS='; '; echo "${evidence_parts[*]}")"

printf '%s' "$status"   | "$CLI" set --stdin "$FIELD_STATUS"   >/dev/null 2>&1
printf '%s' "$evidence" | "$CLI" set --stdin "$FIELD_EVIDENCE" >/dev/null 2>&1

echo "$FIELD_STATUS=$status"
echo "$FIELD_EVIDENCE=$evidence"

```

**▸ `Drata-ScreenLock-mac.sh` → macOS, screen lock**

```
#!/usr/bin/env bash
set -euo pipefail

CLI="/Applications/NinjaRMMAgent/programdata/ninjarmm-cli"
FIELD_ENABLED="dratascreenlockenabled"
FIELD_EVIDENCE="dratascreenlockevidence"
FIELD_TIME="dratascreenlocktime"

if [[ ! -x "$CLI" ]]; then
  echo "ERROR: ninjarmm-cli not found at $CLI"
  exit 1
fi

enabled="unknown"
# Empty means "no value". dratascreenlocktime is a numeric field in NinjaOne, so the
# string "unknown" cannot be written to it — an empty write clears it instead of
# leaving a stale number next to an unknown status.
timeout_minutes=""
lock_delay_secs=""
parts=()

ev(){ parts+=("$*"); }

write_fields_and_exit() {
  local evidence
  evidence="$(printf '%s; ' "${parts[@]}")"
  evidence="${evidence%; }"

  printf '%s' "$enabled"         | "$CLI" set --stdin "$FIELD_ENABLED"  >/dev/null 2>&1 || true
  printf '%s' "$evidence"        | "$CLI" set --stdin "$FIELD_EVIDENCE" >/dev/null 2>&1 || true
  printf '%s' "$timeout_minutes" | "$CLI" set --stdin "$FIELD_TIME"     >/dev/null 2>&1 || true

  echo "$FIELD_ENABLED=$enabled"
  echo "$FIELD_EVIDENCE=$evidence"
  echo "$FIELD_TIME=${timeout_minutes:-}"
  exit 0
}

# Run a command in the console user's GUI context. launchctl asuser needs root;
# NinjaOne runs as root on macOS.
as_user() {
  local u="$1"; shift
  local uid_local
  uid_local="$(/usr/bin/id -u "$u" 2>/dev/null)" || return 1
  /bin/launchctl asuser "$uid_local" /usr/bin/sudo -u "$u" "$@"
}

# sysadminctl prefixes its output with a timestamp and "sysadminctl[pid:tid]", and
# writes the answer to stderr.
clean_sysadminctl() {
  printf '%s\n' "$1" \
    | /usr/bin/sed 's/.*sysadminctl\[[0-9:]*\][[:space:]]*//' \
    | /usr/bin/tr -d '\r' \
    | /usr/bin/grep -i 'screenlock' \
    | /usr/bin/head -1 || true
}

# Echoes ":". Unrecognised output stays unknown rather than
# being guessed as disabled.
interpret_lock() {
  local lc
  lc="$(printf '%s' "$1" | /usr/bin/tr '[:upper:]' '[:lower:]')"
  case "$lc" in
    "") echo "unknown:" ; return ;;
    *"is off"*|*"is disabled"*|*"delay is off"*) echo "false:" ; return ;;
    *immediate*) echo "true:0" ; return ;;
  esac
  if [[ "$lc" =~ ([0-9]+)[[:space:]]*second ]]; then
    echo "true:${BASH_REMATCH[1]}"; return
  fi
  if [[ "$lc" =~ ([0-9]+)[[:space:]]*minute ]]; then
    echo "true:$(( ${BASH_REMATCH[1]} * 60 ))"; return
  fi
  echo "unknown:"
}

# ------------------------------------------------------------------
# Console user
# ------------------------------------------------------------------
console_user="$(/usr/bin/stat -f%Su /dev/console 2>/dev/null || true)"
ev "console_user=${console_user:-}"

have_user=0
if [[ -n "${console_user:-}" && "$console_user" != "root" && "$console_user" != "loginwindow" ]]; then
  have_user=1
  ev "console_uid=$(/usr/bin/id -u "$console_user" 2>/dev/null || echo '')"
else
  ev "no_active_console_user"
fi

# ------------------------------------------------------------------
# 1) Screen lock status, from sysadminctl
#
# Screen lock is a per-user setting, so only the console user's context decides.
# The root reading is recorded as evidence but never decides: run as root with no
# GUI session it reports root's own setting, which would produce a confident wrong
# "false" for the logged-in user. No console user means no setting to read, so the
# status stays unknown rather than being guessed as disabled.
# ------------------------------------------------------------------
raw_root="$(/usr/sbin/sysadminctl -screenLock status 2>&1 || true)"
line_root="$(clean_sysadminctl "$raw_root")"
ev "sysadminctl_root=${line_root:-} (evidence only)"

if [[ "$have_user" -eq 1 ]]; then
  raw_user="$(as_user "$console_user" /usr/sbin/sysadminctl -screenLock status 2>&1 || true)"
  line_user="$(clean_sysadminctl "$raw_user")"
  ev "sysadminctl_user=${line_user:-}"

  result="$(interpret_lock "${line_user:-}")"
  enabled="${result%%:*}"
  lock_delay_secs="${result#*:}"
  [[ "$enabled" == "unknown" ]] && ev "user_context_read_failed"
fi

# ------------------------------------------------------------------
# 2) Idle wait, for the lock timeout. Still readable via the currentHost domain.
# ------------------------------------------------------------------
idle=""
if [[ "$have_user" -eq 1 ]]; then
  idle_ch="$(as_user "$console_user" /usr/bin/defaults -currentHost read com.apple.screensaver idleTime 2>/dev/null || true)"
  idle_u="$(as_user "$console_user" /usr/bin/defaults read com.apple.screensaver idleTime 2>/dev/null || true)"
  ev "idleTime currentHost=${idle_ch:-} user=${idle_u:-}"
  idle="${idle_ch:-$idle_u}"
fi

if [[ "${idle:-}" =~ ^[0-9]+$ && "${lock_delay_secs:-}" =~ ^[0-9]+$ ]]; then
  total_secs=$(( idle + lock_delay_secs ))
  timeout_minutes=$(( (total_secs + 59) / 60 ))
else
  ev "screenlock_time_undetermined"
fi

# ------------------------------------------------------------------
# 3) Context only. pmset displaysleep is NOT screen lock.
# ------------------------------------------------------------------
display_sleep="$(/usr/bin/pmset -g 2>/dev/null | /usr/bin/awk '/ displaysleep /{print $2; exit}' || true)"
[[ -n "${display_sleep:-}" ]] && ev "pmset_displaysleep=${display_sleep}"

write_fields_and_exit
```

**▸ `Drata-ScreenLock-ubuntu.sh` → Ubuntu/Linux (GNOME), screen lock**

```
#!/usr/bin/env bash
set -euo pipefail

# ============================================
# NinjaOne Custom Fields (Linux path per NinjaOne docs)
# ============================================
CLI="/opt/NinjaRMMAgent/programdata/ninjarmm-cli"
FIELD_ENABLED="dratascreenlockenabled"
FIELD_EVIDENCE="dratascreenlockevidence"
FIELD_TIME="dratascreenlocktime"

# If you set DEBUG=1 in NinjaOne, we append extra runtime details to evidence
DEBUG="${DEBUG:-0}"

# ============================================
# Guards
# ============================================
if [[ ! -x "$CLI" ]]; then
  echo "ERROR: ninjarmm-cli not found/executable at: $CLI"
  exit 1
fi

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "ERROR: This script must run as root (EUID=0)."
  exit 1
fi

enabled="unknown"
timeout_minutes="unknown"
evidence_parts=()
gui_user=""        # track whether we had a GUI session to evaluate
gnome_attempted=0  # track whether we attempted GNOME evaluation

log_ev() { evidence_parts+=("$*"); }

# gsettings returns "uint32 300" sometimes
parse_seconds() {
  local val="${1:-}"
  if [[ "$val" =~ ^uint32\ ([0-9]+)$ ]]; then
    echo "${BASH_REMATCH[1]}"
  elif [[ "$val" =~ ^([0-9]+)$ ]]; then
    echo "${BASH_REMATCH[1]}"
  else
    echo ""
  fi
}

# ============================================
# Find active GUI session user (GNOME)
# ============================================
get_active_gui_user() {
  if command -v loginctl >/dev/null 2>&1; then
    while read -r sid uid user seat tty; do
      [[ -z "${sid:-}" ]] && continue
      [[ "${user:-}" == "root" ]] && continue

      local active type class
      active="$(loginctl show-session "$sid" -p Active --value 2>/dev/null || true)"
      type="$(loginctl show-session "$sid" -p Type --value 2>/dev/null || true)"      # x11/wayland/tty/unspecified
      class="$(loginctl show-session "$sid" -p Class --value 2>/dev/null || true)"    # user/greeter/...

      if [[ "$active" == "yes" && ( "$type" == "x11" || "$type" == "wayland" ) && "$class" == "user" ]]; then
        echo "$user"
        return 0
      fi
    done /dev/null | awk '{print $1,$2,$3,$4,$5}')
  fi

  # Fallback: who (works sometimes in X11)
  who 2>/dev/null | awk '$2 ~ /^:/ {print $1; exit}'
}

# ============================================
# GNOME read with proper DBus/XDG context
# ============================================
read_gnome_lock_settings() {
  local user="$1"
  local uid
  uid="$(id -u "$user" 2>/dev/null || true)"
  [[ -z "$uid" ]] && return 1

  local xdg="/run/user/$uid"
  local bus="unix:path=/run/user/$uid/bus"

  if [[ ! -d "$xdg" ]]; then
    log_ev "gnome_user=$user but XDG_RUNTIME_DIR missing ($xdg)"
    return 1
  fi

  if ! command -v gsettings >/dev/null 2>&1; then
    log_ev "gnome_user=$user gsettings_not_found"
    return 1
  fi

  local lock_enabled idle_delay lock_delay
  lock_enabled="$(sudo -u "$user" XDG_RUNTIME_DIR="$xdg" DBUS_SESSION_BUS_ADDRESS="$bus" \
    gsettings get org.gnome.desktop.screensaver lock-enabled 2>/dev/null || true)"

  idle_delay="$(sudo -u "$user" XDG_RUNTIME_DIR="$xdg" DBUS_SESSION_BUS_ADDRESS="$bus" \
    gsettings get org.gnome.desktop.session idle-delay 2>/dev/null || true)"

  lock_delay="$(sudo -u "$user" XDG_RUNTIME_DIR="$xdg" DBUS_SESSION_BUS_ADDRESS="$bus" \
    gsettings get org.gnome.desktop.screensaver lock-delay 2>/dev/null || true)"

  log_ev "gnome_user=$user lock-enabled=${lock_enabled:-} idle-delay=${idle_delay:-} lock-delay=${lock_delay:-}"

  # If we cannot read lock_enabled, return failure -> keep unknown
  if [[ -z "${lock_enabled:-}" ]]; then
    log_ev "gnome_lock_enabled_unreadable"
    return 1
  fi

  if [[ "$lock_enabled" == "true" ]]; then
    local idle_secs lock_secs
    idle_secs="$(parse_seconds "$idle_delay")"
    lock_secs="$(parse_seconds "$lock_delay")"

    # If idle-delay is 0, GNOME idle is disabled -> treat as NOT compliant (screen lock wont trigger by idle)
    if [[ -z "$idle_secs" || "$idle_secs" -le 0 ]]; then
      enabled="false"
      timeout_minutes="unknown"
      log_ev "gnome_idle_disabled_or_unreadable"
      return 0
    fi

    enabled="true"
    lock_secs="${lock_secs:-0}"
    local total_secs=$(( idle_secs + lock_secs ))
    timeout_minutes=$(( total_secs / 60 ))
    return 0

  elif [[ "$lock_enabled" == "false" ]]; then
    enabled="false"
    timeout_minutes="unknown"
    return 0
  fi

  # Any other output -> unknown
  log_ev "gnome_lock_enabled_unexpected_value=$lock_enabled"
  return 1
}

# ============================================
# We ONLY evaluate GNOME (desktop) and if no GUI session exists we report UNKNOWN
# ============================================
gui_user="$(get_active_gui_user || true)"
if [[ -n "${gui_user:-}" ]]; then
  gnome_attempted=1
  read_gnome_lock_settings "$gui_user" || true
else
  log_ev "no_active_gui_user_session_detected"
fi

# If GNOME was attempted but still unknown, note it explicitly
if [[ "$gnome_attempted" -eq 1 && "$enabled" == "unknown" ]]; then
  log_ev "gnome_attempted_but_result_unknown"
fi

# DEBUG (optional)
if [[ "$DEBUG" == "1" ]]; then
  log_ev "debug whoami=$(whoami) display=${DISPLAY:-}"
  if command -v loginctl >/dev/null 2>&1; then
    log_ev "debug loginctl_sessions=$(loginctl list-sessions --no-legend 2>/dev/null | tr '\n' '|' || true)"
  fi
fi

# Build evidence
evidence="$(IFS='; '; echo "${evidence_parts[*]}")"

# Write back to NinjaOne custom fields
printf '%s' "$enabled"         | "$CLI" set --stdin "$FIELD_ENABLED"  >/dev/null 2>&1
printf '%s' "$evidence"        | "$CLI" set --stdin "$FIELD_EVIDENCE" >/dev/null 2>&1
printf '%s' "$timeout_minutes" | "$CLI" set --stdin "$FIELD_TIME"     >/dev/null 2>&1

echo "$FIELD_ENABLED=$enabled"
echo "$FIELD_EVIDENCE=$evidence"
echo "$FIELD_TIME=$timeout_minutes"

```

**▸ `Drata-ScreenLock-win.ps1` → Windows, screen lock**

```
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Set-Field([string]$Name, [string]$Value) {
  try {
    Ninja-Property-Set $Name $Value
    Write-Host "SUCCESS: Set $Name = $Value"
  } catch {
    Write-Host "ERROR setting $Name : $($_.Exception.Message)"
  }
}

function Get-RegValueSafe([string]$Path, [string]$Name) {
  try {
    $item = Get-ItemProperty -Path $Path -ErrorAction Stop
    if ($null -ne $item.PSObject.Properties[$Name]) { return $item.$Name }
    return $null
  } catch { return $null }
}

function To-IntSafe($v) {
  if ($null -eq $v) { return $null }
  try {
    if ($v -is [int]) { return $v }
    if ($v -is [long]) { return [int]$v }
    if ($v -is [uint32]) { return [int]$v }
    $s = [string]$v
    if ($s -match '^\d+$') { return [int]$s }
    return $null
  } catch { return $null }
}

function Get-LoggedOnUserSID {
  try {
    $explorer = $null
    try {
      $explorer = Get-CimInstance Win32_Process -Filter "Name='explorer.exe'" -ErrorAction Stop | Select-Object -First 1
    } catch {
      $explorer = Get-WmiObject -Class Win32_Process -Filter "Name='explorer.exe'" -ErrorAction Stop | Select-Object -First 1
    }

    if ($explorer) {
      $owner = $explorer.GetOwner()
      if ($owner -and $owner.User) {
        $username = "$($owner.Domain)\$($owner.User)"
        $user = New-Object System.Security.Principal.NTAccount($username)
        $sid = $user.Translate([System.Security.Principal.SecurityIdentifier]).Value
        return @{ Username = $owner.User; SID = $sid }
      }
    }
  } catch { }
  return $null
}

$enabled = "unknown"
$parts = New-Object System.Collections.Generic.List[string]
$source = "None"
$timeoutMinutes = "unknown"

# Track whether there was an interactive user session we could have checked
$hadLoggedOnUser = $false

try {
  # 0) MDM/Intune Policy CSP (PolicyManager)
  $mdmPath = "HKLM:\SOFTWARE\Microsoft\PolicyManager\current\device\DeviceLock"
  $mdmRaw = Get-RegValueSafe $mdmPath "MaxInactivityTimeDeviceLock"
  $mdm = To-IntSafe $mdmRaw
  $parts.Add("MDM.DeviceLock.MaxInactivityTimeDeviceLock=$mdmRaw")
  if ($null -ne $mdm -and $mdm -gt 0) {
    $enabled="true"
    $source="MDM(DeviceLock.MaxInactivityTimeDeviceLock)"
    # MaxInactivityTimeDeviceLock is in minutes
    $timeoutMinutes = $mdm
  }

  # 1) System policy (GPO-like)
  if ($enabled -eq "unknown") {
    $sysPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System"
    $inactRaw = Get-RegValueSafe $sysPath "InactivityTimeoutSecs"
    $inact = To-IntSafe $inactRaw
    $parts.Add("SystemPolicy.InactivityTimeoutSecs=$inactRaw")
    if ($null -ne $inact -and $inact -gt 0) {
      $enabled="true"
      $source="SystemPolicy(InactivityTimeoutSecs)"
      $timeoutMinutes = [math]::Ceiling($inact / 60)
    }
  }

  # 2) Screen saver policy (GPO-enforced)
  if ($enabled -eq "unknown") {
    $ssPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Control Panel\Desktop"
    $ssActiveRaw  = Get-RegValueSafe $ssPath "ScreenSaveActive"
    $ssSecureRaw  = Get-RegValueSafe $ssPath "ScreenSaverIsSecure"
    $ssTimeoutRaw = Get-RegValueSafe $ssPath "ScreenSaveTimeOut"

    $ssActive  = To-IntSafe $ssActiveRaw
    $ssSecure  = To-IntSafe $ssSecureRaw
    $ssTimeout = To-IntSafe $ssTimeoutRaw

    $parts.Add("ScreenSaverPolicy.ScreenSaveActive=$ssActiveRaw")
    $parts.Add("ScreenSaverPolicy.ScreenSaverIsSecure=$ssSecureRaw")
    $parts.Add("ScreenSaverPolicy.ScreenSaveTimeOut=$ssTimeoutRaw")

    if ($null -ne $ssTimeout -and $ssTimeout -gt 0 -and $ssActive -eq 1 -and $ssSecure -eq 1) {
      $enabled="true"
      $source="ScreenSaverPolicy(Active+Secure+Timeout)"
      $timeoutMinutes = [math]::Ceiling($ssTimeout / 60)
    }
  }

  # 3) User-level screen saver settings (logged-on user's registry)
  if ($enabled -eq "unknown") {
    $loggedOnUser = Get-LoggedOnUserSID
    if ($loggedOnUser) {
      $hadLoggedOnUser = $true

      # Mount HKU if not already available
      if (-not (Test-Path "HKU:\")) {
        New-PSDrive -Name HKU -PSProvider Registry -Root HKEY_USERS -ErrorAction SilentlyContinue | Out-Null
      }

      $userPath = "HKU:\$($loggedOnUser.SID)\Control Panel\Desktop"
      $userActiveRaw  = Get-RegValueSafe $userPath "ScreenSaveActive"
      $userSecureRaw  = Get-RegValueSafe $userPath "ScreenSaverIsSecure"
      $userTimeoutRaw = Get-RegValueSafe $userPath "ScreenSaveTimeOut"

      $userActive  = To-IntSafe $userActiveRaw
      $userSecure  = To-IntSafe $userSecureRaw
      $userTimeout = To-IntSafe $userTimeoutRaw

      $parts.Add("LoggedOnUser=$($loggedOnUser.Username)")
      $parts.Add("UserScreenSaver.ScreenSaveActive=$userActiveRaw")
      $parts.Add("UserScreenSaver.ScreenSaverIsSecure=$userSecureRaw")
      $parts.Add("UserScreenSaver.ScreenSaveTimeOut=$userTimeoutRaw")

      if ($null -ne $userTimeout -and $userTimeout -gt 0 -and $userActive -eq 1 -and $userSecure -eq 1) {
        $enabled="true"
        $source="UserScreenSaver(Active+Secure+Timeout)"
        # ScreenSaveTimeOut is in seconds
        $timeoutMinutes = [math]::Ceiling($userTimeout / 60)
      }
    } else {
      $parts.Add("UserScreenSaver.NoLoggedOnUser")
    }
  }

  # If we couldn't find any device-level policy AND no interactive user session exists,
  # report UNKNOWN rather than FALSE (avoids false negatives when device is at login screen)
  if ($enabled -eq "unknown") {
    if ($hadLoggedOnUser -eq $false -and $source -eq "None") {
      $enabled = "unknown"
      $timeoutMinutes = "unknown"
      $source = "NoLoggedOnUserAndNoDevicePolicy"
    } else {
      # If user exists but settings don't enforce lock, treat as non-compliant
      $enabled = "false"
    }
  }
}
catch {
  $enabled = "unknown"
  $source = "Error"
  $timeoutMinutes = "unknown"
  $parts.Clear()
  $parts.Add("Error: $($_.Exception.Message)")
}

$evidence = "source=$source; " + ($parts -join "; ")

Set-Field "dratascreenlockenabled" $enabled
Set-Field "dratascreenlockevidence" $evidence
Set-Field "dratascreenlocktime" $timeoutMinutes

Write-Host "dratascreenlockenabled=$enabled"
Write-Host "dratascreenlockevidence=$evidence"
Write-Host "dratascreenlocktime=$timeoutMinutes"

```

**Specific options for Linux screen lock (`Drata-ScreenLock-ubuntu.sh`):**

- Optional environment variable DEBUG=1 to add more details into `dratascreenlockevidence`.

**For all scripts, it is recommended to:**

- Log standard output in NinjaOne for troubleshooting.
- Keep evidence text in English (consistent with other Drata connectors).

### Step 3: Connect NinjaOne to Drata

1. In Drata, go to Connections page.
2. Search for and select NinjaOne.
3. When connecting:
   - Choose either Standard region or Custom domain based on your NinjaOne setup.
   - Enter either the NinjaOne region you are using, or the full subdomain or host name.
4. Click Save & Test Connection.

You will be redirected to a NinjaOne OAuth page. Review that the account details are correct and you are signed in to NinjaOne with the right account.

### Step 4: Enable NinjaOne and Verify the Connection

1. In Drata, navigate to Settings → Internal Security page.
2. Under Workstation Configuration Monitoring, toggle:
   - **Automated via NinjaOne MDM**: ON
   - **Automated via Drata Agent**: OFF (optional)

Note: If both are ON, Drata Agent data takes precedence.

## Related articles

- [Jamf Integration Guide](jamf-integration-guide.md)
- [JumpCloud Integration Guide (MDM)](jumpcloud-integration-guide-mdm.md)
- [Vetty Integration Guide](vetty-integration-guide.md)
- [UKG Ready Integration Guide](ukg-ready-integration-guide.md)
- [Microsoft Intune Integration guide](microsoft-intune-integration-guide.md)
