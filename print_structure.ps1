
param(
    [string]$Root = (Get-Location).Path
)

# Directories to analyze
$targetDirs = @("frontend", "backend", "owner-app")

# Exclusion lists
$ignoreDirs = @("node_modules", ".git", ".next", ".turbo", "dist", "build", "coverage", "public", ".vercel", ".idea", ".vscode", "test_runs", "artifacts")
$ignoreFiles = @("package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "README.md", ".gitignore", ".env", ".eslintrc.json", "tsconfig.json", "next.config.js", "next.config.mjs", "postcss.config.js", "tailwind.config.ts", "tailwind.config.js", "jest.config.js", "docker-compose.yml", "Dockerfile", ".prettierrc", "nodemon.json", "nest-cli.json", "LICENSE", ".dockerignore")
$ignoreExts = @(".yaml", ".yml", ".json", ".map", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".ttf", ".woff", ".woff2", ".eot", ".mp4", ".webm", ".log", ".txt", ".sql")

function Print-Tree {
    param (
        [string]$Path,
        [string]$Indent = "",
        [bool]$IsLast = $true
    )

    $name = Split-Path $Path -Leaf
    
    # Print current item
    if ($Indent -eq "") {
        Write-Host $name -ForegroundColor Cyan
    }
    else {
        if ($IsLast) { 
            $marker = "\--" 
        }
        else { 
            $marker = "+--" 
        }
        Write-Host "$Indent$marker $name"
    }

    # Calculate indent for children
    if ($Indent -eq "") {
        $addIndent = ""
    }
    elseif ($IsLast) {
        $addIndent = "    "
    }
    else {
        $addIndent = "|   "
    }
    $childIndent = $Indent + $addIndent
    
    # Get children
    $items = Get-ChildItem -Path $Path -Force -ErrorAction SilentlyContinue | 
    Where-Object { 
        # Filter Logic
        $isIgnoredDir = $_.PSIsContainer -and ($ignoreDirs -contains $_.Name)
        $isIgnoredFile = -not $_.PSIsContainer -and ($ignoreFiles -contains $_.Name -or $ignoreExts -contains $_.Extension)
            
        -not $isIgnoredDir -and -not $isIgnoredFile
    } | 
    Sort-Object { -not $_.PSIsContainer }, Name

    $count = $items.Count
    for ($i = 0; $i -lt $count; $i++) {
        Print-Tree -Path $items[$i].FullName -Indent $childIndent -IsLast ($i -eq $count - 1)
    }
}

Write-Host "Project Source Structure" -ForegroundColor Green
Write-Host "========================"

foreach ($target in $targetDirs) {
    $fullPath = Join-Path $Root $target
    if (Test-Path $fullPath) {
        Print-Tree -Path $fullPath
        Write-Host "" # Newline between projects
    }
    else {
        Write-Host "Directory not found: $target" -ForegroundColor Red
    }
}
