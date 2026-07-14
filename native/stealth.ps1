# stealth.ps1 — Native Win32 bridge for screen-share transparency
# Persistent process: reads commands from stdin, writes results to stdout.
# Commands: "STEALTH_ON:<hwnd>" | "STEALTH_OFF:<hwnd>" | "PING"
#
# Why two flags?
#   WDA_EXCLUDEFROMCAPTURE — tells WGC/DWM to exclude the window from capture streams.
#   WS_EX_NOREDIRECTIONBITMAP — removes the DWM software backing bitmap for this window.
#   Together: when WGC tries to fill the excluded area, the DWM has NO bitmap to fall back to
#   → the region becomes a transparent hole showing the desktop behind. No black box.

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class StealthWin32 {
    public const uint WDA_NONE              = 0x00000000;
    public const uint WDA_EXCLUDEFROMCAPTURE = 0x00000011;
    public const int  GWL_EXSTYLE           = -20;
    public const int  WS_EX_NOREDIRECTIONBITMAP = 0x00200000;

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetWindowDisplayAffinity(IntPtr hWnd, uint dwAffinity);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

    [DllImport("user32.dll")]
    public static extern bool IsWindow(IntPtr hWnd);
}
"@ -ErrorAction Stop

# Signal ready to parent process
[Console]::WriteLine('READY')
[Console]::Out.Flush()

try {
    while ($true) {
        $line = [Console]::ReadLine()
        if ($null -eq $line) { break }
        $line = $line.Trim()
        if ($line -eq '') { continue }

        if ($line -eq 'PING') {
            [Console]::WriteLine('PONG')
            [Console]::Out.Flush()
            continue
        }

        $parts   = $line -split ':', 2
        $cmd     = $parts[0].Trim()
        $hwndStr = if ($parts.Length -ge 2) { $parts[1].Trim() } else { '0' }

        try {
            $hwnd = [IntPtr]::new([long]$hwndStr)

            if (-not [StealthWin32]::IsWindow($hwnd)) {
                [Console]::WriteLine("ERROR:Invalid HWND $hwndStr")
                [Console]::Out.Flush()
                continue
            }

            if ($cmd -eq 'STEALTH_ON') {
                # Step 1: Remove the DWM backing bitmap — no software copy = nothing to fill with black
                $exStyle = [StealthWin32]::GetWindowLong($hwnd, [StealthWin32]::GWL_EXSTYLE)
                [StealthWin32]::SetWindowLong($hwnd, [StealthWin32]::GWL_EXSTYLE, `
                    $exStyle -bor [StealthWin32]::WS_EX_NOREDIRECTIONBITMAP) | Out-Null

                # Step 2: Tell WGC to exclude this window from all capture streams
                [StealthWin32]::SetWindowDisplayAffinity($hwnd, [StealthWin32]::WDA_EXCLUDEFROMCAPTURE) | Out-Null

                [Console]::WriteLine('OK:STEALTH_ON')

            } elseif ($cmd -eq 'STEALTH_OFF') {
                # Restore: re-enable capture and restore DWM backing bitmap
                [StealthWin32]::SetWindowDisplayAffinity($hwnd, [StealthWin32]::WDA_NONE) | Out-Null

                $exStyle = [StealthWin32]::GetWindowLong($hwnd, [StealthWin32]::GWL_EXSTYLE)
                [StealthWin32]::SetWindowLong($hwnd, [StealthWin32]::GWL_EXSTYLE, `
                    $exStyle -band (-bnot [StealthWin32]::WS_EX_NOREDIRECTIONBITMAP)) | Out-Null

                [Console]::WriteLine('OK:STEALTH_OFF')

            } else {
                [Console]::WriteLine("ERROR:Unknown command $cmd")
            }

        } catch {
            [Console]::WriteLine("ERROR:$($_.Exception.Message)")
        }

        [Console]::Out.Flush()
    }
} catch {
    [Console]::Error.WriteLine("Fatal: $($_.Exception.Message)")
    exit 1
}
