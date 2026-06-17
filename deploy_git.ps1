# Git Deployment Helper Script for CROKED

Write-Host "Checking if Git is installed..." -ForegroundColor Cyan
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Warning "Git was not found in your system PATH."
    Write-Host "Please ensure Git is installed (https://git-scm.com/) and added to your environment PATH, then rerun this script." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Initializing Git repository (if not already initialized)..." -ForegroundColor Cyan
git init

Write-Host "Untracking AI agent metadata files (if previously committed)..." -ForegroundColor Cyan
git rm --cached frontend/AGENTS.md frontend/CLAUDE.md 2>$null

Write-Host "Staging files (matching .gitignore rules)..." -ForegroundColor Cyan
git add .

Write-Host "Staged files status:" -ForegroundColor Cyan
git status -s

Write-Host "Creating deployment readiness commit..." -ForegroundColor Cyan
git commit -m "feat: complete production deployment readiness and integrate Angel One SmartAPI"

$remoteUrl = Read-Host "Enter your Git remote repository URL (e.g., https://github.com/user/repo.git) [Leave empty to skip pushing]"
if ($remoteUrl.Trim()) {
    # Check if origin already exists
    $existingRemote = git remote | Where-Object { $_ -eq "origin" }
    if ($existingRemote) {
        git remote set-url origin $remoteUrl
    } else {
        git remote add origin $remoteUrl
    }
    
    Write-Host "Pushing code to remote origin (main branch)..." -ForegroundColor Cyan
    git branch -M main
    git push -u origin main
}

Write-Host "Git deployment helper completed successfully!" -ForegroundColor Green
Read-Host "Press Enter to exit"
