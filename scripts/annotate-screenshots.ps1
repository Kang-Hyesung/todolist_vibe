param(
    [string]$RootPath = "."
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = (Resolve-Path $RootPath).Path
$screenshotsDir = Join-Path $root "screenshots"
$outputDir = Join-Path $screenshotsDir "annotated"

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

function Get-StyleColor {
    param([string]$Kind)

    switch ($Kind) {
        "create" { return [System.Drawing.Color]::FromArgb(11, 132, 243) }   # blue
        "read"   { return [System.Drawing.Color]::FromArgb(22, 163, 74) }    # green
        "update" { return [System.Drawing.Color]::FromArgb(245, 158, 11) }   # orange
        "delete" { return [System.Drawing.Color]::FromArgb(225, 29, 72) }    # red
        default  { return [System.Drawing.Color]::FromArgb(55, 65, 81) }     # slate
    }
}

function Draw-Callout {
    param(
        [System.Drawing.Graphics]$Graphics,
        [hashtable]$Callout
    )

    $borderColor = Get-StyleColor -Kind $Callout.Kind
    $fillColor = [System.Drawing.Color]::FromArgb(38, $borderColor.R, $borderColor.G, $borderColor.B)
    $box = $Callout.Box
    $label = $Callout.Label
    $bx = [int]$box[0]
    $by = [int]$box[1]
    $bw = [int]$box[2]
    $bh = [int]$box[3]
    $lx = [int]$label[0]
    $ly = [int]$label[1]

    $boxPen = New-Object System.Drawing.Pen($borderColor, 4)
    $boxBrush = New-Object System.Drawing.SolidBrush($fillColor)
    $boxRect = New-Object System.Drawing.Rectangle($bx, $by, $bw, $bh)

    $Graphics.FillRectangle($boxBrush, $boxRect)
    $Graphics.DrawRectangle($boxPen, $boxRect)

    $font = New-Object System.Drawing.Font("Segoe UI", 17, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $text = "{0}. {1}" -f $Callout.Index, $Callout.Text
    $size = $Graphics.MeasureString($text, $font)
    $labelWidth = [int][Math]::Ceiling($size.Width) + 24
    $labelHeight = [int][Math]::Ceiling($size.Height) + 16
    $labelRect = New-Object System.Drawing.Rectangle($lx, $ly, $labelWidth, $labelHeight)

    $labelBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 255, 255, 255))
    $labelPen = New-Object System.Drawing.Pen($borderColor, 3)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 28, 28))

    $Graphics.FillRectangle($labelBg, $labelRect)
    $Graphics.DrawRectangle($labelPen, $labelRect)
    $Graphics.DrawString($text, $font, $textBrush, $lx + 12, $ly + 7)

    $startX = if ($lx -gt ($bx + $bw / 2)) { $lx } else { $lx + $labelWidth }
    $startY = $ly + [int]($labelHeight / 2)
    $endX = $bx + [int]($bw / 2)
    $endY = $by + [int]($bh / 2)

    $arrowPen = New-Object System.Drawing.Pen($borderColor, 4)
    $arrowHead = New-Object System.Drawing.Drawing2D.AdjustableArrowCap(7, 10, $true)
    $arrowPen.CustomEndCap = $arrowHead
    $Graphics.DrawLine($arrowPen, $startX, $startY, $endX, $endY)

    $arrowHead.Dispose()
    $arrowPen.Dispose()
    $textBrush.Dispose()
    $labelPen.Dispose()
    $labelBg.Dispose()
    $font.Dispose()
    $boxBrush.Dispose()
    $boxPen.Dispose()
}

$specs = @(
    @{
        Source = "home.png"
        Target = "home-onboarding-annotated.png"
        Callouts = @(
            @{ Index = 1; Kind = "read";   Text = "좌측 메뉴";          Box = @(6, 63, 222, 320); Label = @(240, 352) },
            @{ Index = 2; Kind = "read";   Text = "컨텍스트 선택기";     Box = @(1546, 9, 344, 40); Label = @(1250, 14) },
            @{ Index = 3; Kind = "read";   Text = "검색/필터 툴바";      Box = @(248, 132, 1460, 95); Label = @(900, 74) },
            @{ Index = 4; Kind = "read";   Text = "스코프 탭";           Box = @(248, 226, 760, 52); Label = @(532, 168) },
            @{ Index = 5; Kind = "read";   Text = "이슈 목록 테이블";     Box = @(248, 278, 1615, 355); Label = @(855, 644) },
            @{ Index = 6; Kind = "create"; Text = "이슈 생성(상단)";     Box = @(1750, 132, 120, 42); Label = @(1495, 80) },
            @{ Index = 7; Kind = "update"; Text = "인라인 상태/우선순위"; Box = @(1240, 306, 432, 332); Label = @(1240, 651) },
            @{ Index = 8; Kind = "create"; Text = "새 이슈 만들기";      Box = @(1706, 657, 170, 40); Label = @(1420, 703) }
        )
    },
    @{
        Source = "issues.png"
        Target = "issues-crud-annotated.png"
        Callouts = @(
            @{ Index = 1; Kind = "read";   Text = "이슈 검색/필터";       Box = @(248, 132, 1460, 95); Label = @(914, 72) },
            @{ Index = 2; Kind = "create"; Text = "이슈 생성(상단)";      Box = @(1750, 132, 120, 42); Label = @(1500, 78) },
            @{ Index = 3; Kind = "read";   Text = "스코프 탭/프리셋";      Box = @(248, 226, 760, 52); Label = @(520, 165) },
            @{ Index = 4; Kind = "read";   Text = "이슈 목록 조회";        Box = @(248, 278, 1615, 355); Label = @(888, 645) },
            @{ Index = 5; Kind = "update"; Text = "상태/우선순위 즉시수정"; Box = @(1240, 306, 432, 332); Label = @(1246, 650) },
            @{ Index = 6; Kind = "update"; Text = "행 액션 메뉴";          Box = @(1826, 304, 35, 332); Label = @(1610, 272) },
            @{ Index = 7; Kind = "create"; Text = "새 이슈 만들기";        Box = @(1706, 657, 170, 40); Label = @(1420, 704) },
            @{ Index = 8; Kind = "read";   Text = "좌측 내비게이션";       Box = @(6, 63, 222, 320); Label = @(238, 344) }
        )
    },
    @{
        Source = "projects.png"
        Target = "projects-crud-annotated.png"
        Callouts = @(
            @{ Index = 1; Kind = "read";   Text = "프로젝트 목록/필터";    Box = @(246, 82, 282, 842); Label = @(540, 110) },
            @{ Index = 2; Kind = "create"; Text = "프로젝트 생성";         Box = @(266, 277, 245, 43); Label = @(535, 300) },
            @{ Index = 3; Kind = "read";   Text = "프로젝트 상세 조회";     Box = @(541, 82, 991, 672); Label = @(926, 770) },
            @{ Index = 4; Kind = "update"; Text = "수정 진입/탭";          Box = @(1118, 83, 376, 42); Label = @(1038, 33) },
            @{ Index = 5; Kind = "update"; Text = "운영 제어 폼";          Box = @(1556, 83, 304, 531); Label = @(1325, 166) },
            @{ Index = 6; Kind = "update"; Text = "변경 저장";             Box = @(1581, 528, 258, 40); Label = @(1320, 543) },
            @{ Index = 7; Kind = "delete"; Text = "프로젝트 삭제";         Box = @(1581, 571, 258, 34); Label = @(1310, 590) },
            @{ Index = 8; Kind = "read";   Text = "전역 컨텍스트 선택";     Box = @(1546, 9, 344, 40); Label = @(1250, 14) }
        )
    },
    @{
        Source = "workspaces.png"
        Target = "workspaces-crud-annotated.png"
        Callouts = @(
            @{ Index = 1; Kind = "read";   Text = "워크스페이스 목록/필터"; Box = @(246, 82, 282, 842); Label = @(540, 110) },
            @{ Index = 2; Kind = "create"; Text = "워크스페이스 생성";      Box = @(266, 277, 245, 43); Label = @(530, 300) },
            @{ Index = 3; Kind = "read";   Text = "워크스페이스 상세 조회";  Box = @(541, 82, 991, 672); Label = @(884, 770) },
            @{ Index = 4; Kind = "update"; Text = "수정 진입/화면 이동";    Box = @(1115, 83, 370, 42); Label = @(1000, 33) },
            @{ Index = 5; Kind = "update"; Text = "운영 제어 폼";          Box = @(1554, 83, 306, 510); Label = @(1320, 156) },
            @{ Index = 6; Kind = "update"; Text = "변경 저장";             Box = @(1581, 397, 258, 40); Label = @(1305, 418) },
            @{ Index = 7; Kind = "delete"; Text = "워크스페이스 삭제";      Box = @(1581, 440, 258, 35); Label = @(1240, 465) },
            @{ Index = 8; Kind = "read";   Text = "전역 컨텍스트 선택";     Box = @(1546, 9, 344, 40); Label = @(1250, 14) }
        )
    }
)

foreach ($spec in $specs) {
    $src = Join-Path $screenshotsDir $spec.Source
    if (-not (Test-Path $src)) {
        throw "Missing screenshot: $src"
    }

    $dst = Join-Path $outputDir $spec.Target
    $sourceImage = [System.Drawing.Image]::FromFile($src)
    $canvas = New-Object System.Drawing.Bitmap($sourceImage)
    $sourceImage.Dispose()

    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    foreach ($callout in $spec.Callouts) {
        Draw-Callout -Graphics $graphics -Callout $callout
    }

    $canvas.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $canvas.Dispose()

    Write-Output ("Generated: {0}" -f $dst)
}

