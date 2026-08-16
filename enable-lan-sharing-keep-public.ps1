# Shares the tracker on the current network WITHOUT reclassifying that network
# as trusted. Needs admin (right-click -> Run with PowerShell as administrator).
#
# Use this one on work, campus, or shared networks. It opens TCP 5000 inbound on
# every profile (including Public) but only to machines on your own subnet, so
# nothing outside the local network can connect, and Windows keeps treating the
# network as untrusted for everything else (discovery, file sharing, etc).
#
# Because the rule applies on every profile, it does NOT close itself when you
# move to an untrusted network. Run disable-lan-sharing.ps1 when you leave a
# network you trust.
#
# Undo with: .\disable-lan-sharing.ps1
#
# NOTE: keep this file pure ASCII. Windows PowerShell 5.1 reads .ps1 as ANSI,
# so smart quotes or dashes saved as UTF-8 break parsing before line 1 runs.

$log = 'D:\git_learning\data\lan-setup.log'
$out = @()

try {
    $net = Get-NetConnectionProfile -InterfaceAlias 'Wi-Fi' -ErrorAction Stop | Select-Object -First 1
    $out += "network '$($net.Name)' left as $($net.NetworkCategory) - not reclassified"

    Remove-NetFirewallRule -DisplayName 'Git Challenge Tracker' -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName 'Git Challenge Tracker' `
        -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow `
        -Profile Any -RemoteAddress LocalSubnet | Out-Null
    $out += "firewall rule added: TCP 5000 inbound, ALL profiles, local subnet only"

    $ip = Get-NetIPAddress -AddressFamily IPv4 |
          Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
          Select-Object -First 1 -ExpandProperty IPAddress

    $out += "RESULT: OK"
    $out += "share this URL: http://${ip}:5000"

    Write-Host ""
    Write-Host "  Sharing enabled." -ForegroundColor Green
    Write-Host "  Send your friends:  http://${ip}:5000"
    Write-Host ""
    Write-Host "  This address changes when you switch networks." -ForegroundColor Yellow
    Write-Host "  The tracker window prints the current one at startup."
    Write-Host ""
}
catch {
    $out += "RESULT: FAILED - $($_.Exception.Message)"
    Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Did you run this as administrator?" -ForegroundColor Yellow
}

$out | Out-File $log -Encoding utf8
Read-Host "Press Enter to close"
