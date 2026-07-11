# Hall of Poets 2.0 — auto installer for Windows PowerShell
# Запускать из папки куда распаковали hall-v2.zip
# Пример: C:\Users\Fedor\Downloads\hall-v2\INSTALL_HALL.ps1

$ErrorActionPreference = "Stop"

$RepoRoot = "C:\Users\Fedor\Projects\TheLegendaryPoet"
$HallSrc = Join-Path $PSScriptRoot "src\components\hall"
$HallDst = Join-Path $RepoRoot "src\components\hall"

Write-Host "=== THE LEGENDARY POET — Hall 2.0 installer ===" -ForegroundColor Cyan

if (-not (Test-Path $RepoRoot)) {
    Write-Host "Репо не найдено в $RepoRoot" -ForegroundColor Yellow
    Write-Host "Клонирую..."
    New-Item -ItemType Directory -Force -Path "C:\Users\Fedor\Projects" | Out-Null
    Set-Location "C:\Users\Fedor\Projects"
    git clone https://github.com/FedorMilovanov/TheLegendaryPoet.git
}

Set-Location $RepoRoot

Write-Host "1/4 Копирую src/components/hall/ ..."
New-Item -ItemType Directory -Force -Path $HallDst | Out-Null
Copy-Item "$HallSrc\*" $HallDst -Recurse -Force

Write-Host "2/4 npm install ..."
npm install

$answer = Read-Host "Установить пост-эффекты для кино-картинки? (y/N)"
if ($answer -eq "y" -or $answer -eq "Y") {
    npm i @react-three/postprocessing postprocessing
    Write-Host "Не забудь в src/components/hall/HallOfPoets.tsx поставить: const USE_POSTPROCESSING = true" -ForegroundColor Yellow
}

Write-Host "3/4 Проверка HomePage.tsx"
$homePage = Get-Content "src/pages/HomePage.tsx" -Raw
if ($homePage -match "HeroSection") {
    Write-Host ""
    Write-Host "ВНИМАНИЕ: вручную замени в src/pages/HomePage.tsx:" -ForegroundColor Yellow
    Write-Host "  import HallOfPoets from '@/components/hall/HallOfPoets'"
    Write-Host "  <HallOfPoets />   вместо   <HeroSection />"
    Write-Host ""
    Read-Host "Нажми Enter когда сделаешь"
}

Write-Host "4/4 Build check ..."
npm run build

Write-Host ""
Write-Host "Готово! Локальный запуск: npm run dev" -ForegroundColor Green
Write-Host "Коммит: git add .; git commit -m 'feat: Hall of Poets 2.0'; git push origin main"
