$rel = Invoke-RestMethod -Uri 'https://api.github.com/repos/yourok/torrserver/releases/latest' -Headers @{ "User-Agent" = "Mozilla/5.0" }
$rel.assets | Where-Object { $_.name -like '*win*' } | Select-Object name, size, browser_download_url | Format-Table -AutoSize
