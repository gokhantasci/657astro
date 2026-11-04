param([ValidateSet('gelistirme','onizleme','hepsi')][string]$Kip='hepsi')
$ErrorActionPreference='Stop'
$projeKoku=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$nodeYolu=(Get-Command node.exe).Source
$astroKoku=Join-Path $projeKoku 'node_modules/astro'
$astroPaketYolu=Join-Path $astroKoku 'package.json'
if(-not (Test-Path -LiteralPath $astroPaketYolu)){throw 'Önce npm ci çalıştırın.'}
$astroPaket=Get-Content -LiteralPath $astroPaketYolu -Raw | ConvertFrom-Json
$astroYolu=Join-Path $astroKoku $astroPaket.bin.astro
if(-not (Test-Path -LiteralPath $astroYolu)){throw 'Önce npm ci çalıştırın.'}
$logKoku=Join-Path $projeKoku 'artifacts'
New-Item -ItemType Directory -Force -Path $logKoku | Out-Null
$secimler=@()
if($Kip -in @('gelistirme','hepsi')){$secimler+=@{Ad='gelistirme';Komut='dev';Port=4321}}
if($Kip -in @('onizleme','hepsi')){$secimler+=@{Ad='onizleme';Komut='preview';Port=4322}}
foreach($secim in $secimler){
 $port=$secim.Port
 $dinleyen=Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
 if($dinleyen){
  $surec=Get-CimInstance Win32_Process -Filter "ProcessId=$($dinleyen.OwningProcess)"
  if($surec.CommandLine -notlike "*$projeKoku*"){throw "$port portunu başka bir uygulama kullanıyor; durdurulmadı."}
 }else{
  if($secim.Komut -eq 'preview' -and -not (Test-Path -LiteralPath (Join-Path $projeKoku 'dist/index.html'))){throw 'Önizleme için önce npm run build çalıştırın.'}
  $sunucuArgumanlari=if($secim.Komut -eq 'preview'){@((Join-Path $projeKoku 'scripts/onizleme.mjs'),'--port',"$port")}else{@($astroYolu,$secim.Komut,'--host','127.0.0.1','--port',"$port")}
  Start-Process -FilePath $nodeYolu -ArgumentList $sunucuArgumanlari -WorkingDirectory $projeKoku -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logKoku "$($secim.Ad).log") -RedirectStandardError (Join-Path $logKoku "$($secim.Ad)-error.log") | Out-Null
 }
 $adres="http://127.0.0.1:$port/"
 $hazir=$false
 for($deneme=0;$deneme -lt 30;$deneme++){
  try{if((Invoke-WebRequest -Uri $adres -TimeoutSec 2).StatusCode -eq 200){$hazir=$true;break}}catch{}
  Start-Sleep -Milliseconds 250
 }
 if(-not $hazir){throw "Sunucu hazır olmadı. $logKoku altındaki günlükleri inceleyin."}
 Write-Output "$($secim.Ad): $adres"
}
