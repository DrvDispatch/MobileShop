param(
    [string]$Root = (Get-Location).Path,
    [int]$MaxDepth = 4
)

# Configuration
$targetDirs = @("frontend", "backend", "owner-app")
$excludeDirs = @("node_modules", ".git", ".next", ".turbo", "dist", "build", "coverage", "public", ".vercel", "postgres", "nginx", "assets", "prisma/migrations", "generated")
$allowedExts = @(".ts", ".tsx", ".js", ".jsx", ".css", ".scss", ".prisma", ".html")
$excludeFiles = @("package.json", "package-lock.json", "tsconfig.json", "next-env.d.ts", ".env", "README.md", "next.config.js", "next.config.ts", "postcss.config.js")

function Show-Tree {
    param (
        [string]$Path,
        [string]$Indent = "",
        [bool]$IsLast = $true,
        [int]$CurrentDepth = 0
    )

    if ($CurrentDepth -gt $MaxDepth) { return }

    $item = Get-Item -Path $Path
    $name = $item.Name
    
    # Skip if it's an excluded directory
    if ($item.PSIsContainer) {
        if ($excludeDirs -contains $name -or $excludeDirs -contains (Split-Path $Path -Leaf)) {
            return
        }
    }
    
    # Filter files
    if (-not $item.PSIsContainer) {
        $ext = [System.IO.Path]::GetExtension($name)
        if ($allowedExts -notcontains $ext -or $excludeFiles -contains $name) {
            return
        }
    }

    # Format naming with ASCII tree markers
    $marker = ""
    if ($Indent -ne "") {
        if ($IsLast) {
            $marker = "\-- "
        }
        else {
            $marker = "+-- "
        }
    }
    
    # USE Write-Output instead of Write-Host for file capturing
    Write-Output "$Indent$marker$name"

    # If it's a directory, process children
    if ($item.PSIsContainer) {
        $addIndent = ""
        if ($Indent -ne "") {
            if ($IsLast) {
                $addIndent = "    "
            }
            else {
                $addIndent = "|   "
            }
        }
        $newIndent = $Indent + $addIndent
        
        $children = Get-ChildItem -Path $Path -Force -ErrorAction SilentlyContinue | Where-Object {
            $fileName = $_.Name
            $isDir = $_.PSIsContainer
            
            if ($isDir) {
                -not ($excludeDirs -contains $fileName)
            }
            else {
                $ext = $_.Extension
                ($allowedExts -contains $ext) -and (-not ($excludeFiles -contains $fileName))
            }
        } | Sort-Object { -not $_.PSIsContainer }, Name

        $count = $children.Count
        for ($i = 0; $i -lt $count; $i++) {
            Show-Tree -Path $children[$i].FullName -Indent $newIndent -IsLast ($i -eq $count - 1) -CurrentDepth ($CurrentDepth + 1)
        }
    }
}

Write-Output "Project Source Hierarchy"
Write-Output "======================="
Write-Output "Showing up to depth: $MaxDepth"

foreach ($dir in $targetDirs) {
    $fullPath = Join-Path $Root $dir
    if (Test-Path $fullPath) {
        Write-Output "`n[$dir]"
        Show-Tree -Path $fullPath -CurrentDepth 0
    }
}
