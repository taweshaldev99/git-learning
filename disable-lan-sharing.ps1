# Reverts enable-lan-sharing-keep-public.ps1: removes the firewall rule that
# opened TCP 5000, so nobody on the network can reach the tracker again.
# Needs admin (right-click -> Run with PowerShell as administrator).
#
# This does NOT touch your network's Public/Private classification, because the
# enable script does not change it either. Nothing else about your firewall or
# network settings is modified.
#
# Run this whenever you leave a network you trust.
#
# NOTE: keep this file pure ASCII. Windows PowerShell 5.1 reads .ps1 as ANSI,
# so smart quotes or dashes saved as UTF-8 break parsing before line 1 runs.

$log = 'D:\git_learning\data\lan-setup.log'
$out = @()

try {
    $rule = Get-NetFirewallRule -DisplayName 'Git Challenge Tracker' -ErrorAction SilentlyContinue
    if ($rule) {
        Remove-NetFirewallRule -DisplayName 'Git Challenge Tracker' -ErrorAction Stop
        $out += "firewall rule removed - the tracker is no longer reachable from the network"
        Write-Host ""
        Write-Host "  Sharing disabled." -ForegroundColor Green
        Write-Host "  The tracker still works for you at http://localhost:5000"
        Write-Host ""
    }
    else {
        $out += "no rule found - sharing was already off"
        Write-Host ""
        Write-Host "  Sharing was already off. Nothing to change." -ForegroundColor Yellow
        Write-Host ""
    }
    $out += "RESULT: OK"
}
catch {
    $out += "RESULT: FAILED - $($_.Exception.Message)"
    Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Did you run this as administrator?" -ForegroundColor Yellow
}

$out | Out-File $log -Encoding utf8
Read-Host "Press Enter to close"
