param(
    [Parameter(Mandatory=$true)][string]$PayloadPath,
    [string]$LogPath = ""
)

$ErrorActionPreference = "Stop"

function Write-PhnLog([string]$Message) {
    try {
        if ([string]::IsNullOrWhiteSpace($LogPath)) { return }
        $stamp = [DateTime]::Now.ToString("yyyy-MM-dd HH:mm:ss.fff")
        Add-Content -LiteralPath $LogPath -Value "$stamp [WPF] $Message" -Encoding UTF8
    } catch {}
}

try {
    Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase, System.Xaml
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class PhnWin32 {
    public const int GWL_EXSTYLE = -20;
    public const int WS_EX_TRANSPARENT = 0x00000020;
    public const int WS_EX_TOOLWINDOW = 0x00000080;
    public const int WS_EX_NOACTIVATE = 0x08000000;
    public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    public const uint SWP_NOMOVE = 0x0002;
    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_NOACTIVATE = 0x0010;
    public const uint SWP_SHOWWINDOW = 0x0040;
    [DllImport("user32.dll", EntryPoint="GetWindowLongPtr", SetLastError=true)]
    public static extern IntPtr GetWindowLongPtr(IntPtr hWnd, int nIndex);
    [DllImport("user32.dll", EntryPoint="SetWindowLongPtr", SetLastError=true)]
    public static extern IntPtr SetWindowLongPtr(IntPtr hWnd, int nIndex, IntPtr dwNewLong);
    [DllImport("user32.dll", SetLastError=true)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    [DllImport("user32.dll")]
    public static extern bool SetProcessDpiAwarenessContext(IntPtr dpiContext);
    public static readonly IntPtr DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 = new IntPtr(-4);
}
"@
} catch {
    Write-PhnLog "assembly load failed: $($_.Exception.Message)"
    exit 20
}
try { [void][PhnWin32]::SetProcessDpiAwarenessContext([PhnWin32]::DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2) } catch {}

try {
    $Payload = Get-Content -LiteralPath $PayloadPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    Write-PhnLog "payload parse failed: $($_.Exception.Message)"
    exit 21
}

function Parse-Color([string]$Value, [string]$Fallback) {
    try { return [System.Windows.Media.ColorConverter]::ConvertFromString($Value) } catch {}
    return [System.Windows.Media.ColorConverter]::ConvertFromString($Fallback)
}
function Brush([System.Windows.Media.Color]$Color, [double]$Opacity = 1.0) {
    $a = [Math]::Max(0,[Math]::Min(255,[int][Math]::Round(255*$Opacity)))
    $c = [System.Windows.Media.Color]::FromArgb([byte]$a,$Color.R,$Color.G,$Color.B)
    return [System.Windows.Media.SolidColorBrush]::new($c)
}
function Mix-Color([System.Windows.Media.Color]$A, [System.Windows.Media.Color]$B, [double]$T) {
    $t = [Math]::Max(0,[Math]::Min(1,$T))
    return [System.Windows.Media.Color]::FromArgb(
        255,
        [byte][Math]::Round($A.R + ($B.R-$A.R)*$t),
        [byte][Math]::Round($A.G + ($B.G-$A.G)*$t),
        [byte][Math]::Round($A.B + ($B.B-$A.B)*$t)
    )
}
function Gradient-Brush([System.Windows.Media.Color]$A, [System.Windows.Media.Color]$B, [double]$Angle = 0) {
    $g = [System.Windows.Media.LinearGradientBrush]::new()
    $g.StartPoint = [System.Windows.Point]::new(0,0)
    $g.EndPoint = if ($Angle -eq 90) { [System.Windows.Point]::new(0,1) } else { [System.Windows.Point]::new(1,1) }
    $g.GradientStops.Add([System.Windows.Media.GradientStop]::new($A,0))
    $g.GradientStops.Add([System.Windows.Media.GradientStop]::new($B,1))
    return $g
}
function Ease([string]$Name) {
    switch ($Name) {
        "quad-in" { $e=[System.Windows.Media.Animation.QuadraticEase]::new(); $e.EasingMode="EaseIn"; return $e }
        "quad-out" { $e=[System.Windows.Media.Animation.QuadraticEase]::new(); $e.EasingMode="EaseOut"; return $e }
        "cubic-in" { $e=[System.Windows.Media.Animation.CubicEase]::new(); $e.EasingMode="EaseIn"; return $e }
        "cubic-out" { $e=[System.Windows.Media.Animation.CubicEase]::new(); $e.EasingMode="EaseOut"; return $e }
        "quint-out" { $e=[System.Windows.Media.Animation.QuinticEase]::new(); $e.EasingMode="EaseOut"; return $e }
        "quint-in" { $e=[System.Windows.Media.Animation.QuinticEase]::new(); $e.EasingMode="EaseIn"; return $e }
        "back-out" { $e=[System.Windows.Media.Animation.BackEase]::new(); $e.Amplitude=0.32; $e.EasingMode="EaseOut"; return $e }
        "expo-out" { $e=[System.Windows.Media.Animation.ExponentialEase]::new(); $e.Exponent=6; $e.EasingMode="EaseOut"; return $e }
        default { $e=[System.Windows.Media.Animation.CubicEase]::new(); $e.EasingMode="EaseOut"; return $e }
    }
}
function DA([double]$From,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    $a=[System.Windows.Media.Animation.DoubleAnimation]::new($From,$To,[TimeSpan]::FromMilliseconds($Ms))
    $a.BeginTime=[TimeSpan]::FromMilliseconds($Delay)
    $a.EasingFunction=Ease $EaseName
    $a.FillBehavior=[System.Windows.Media.Animation.FillBehavior]::HoldEnd
    return $a
}
function DA-To([double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    $a=[System.Windows.Media.Animation.DoubleAnimation]::new()
    $a.To=$To
    $a.Duration=[System.Windows.Duration]::new([TimeSpan]::FromMilliseconds($Ms))
    $a.BeginTime=[TimeSpan]::FromMilliseconds($Delay)
    $a.EasingFunction=Ease $EaseName
    $a.FillBehavior=[System.Windows.Media.Animation.FillBehavior]::HoldEnd
    return $a
}
function Begin-FromCurrent($Target,[System.Windows.DependencyProperty]$Property,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    # Commit the current composed value before replacing a running/held animation.
    # This prevents exit transitions from jumping back to a dependency property's
    # base value when an earlier HoldEnd animation is still attached.
    $current=[double]$Target.GetValue($Property)
    $Target.BeginAnimation($Property,$null)
    $Target.SetValue($Property,$current)
    $Target.BeginAnimation($Property,(DA $current $To $Ms $EaseName $Delay),[System.Windows.Media.Animation.HandoffBehavior]::SnapshotAndReplace)
}
function Begin-Opacity($Target,[double]$From,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    $Target.BeginAnimation([System.Windows.UIElement]::OpacityProperty,(DA $From $To $Ms $EaseName $Delay))
}
function Begin-TX([System.Windows.Media.TranslateTransform]$T,[double]$From,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    $T.BeginAnimation([System.Windows.Media.TranslateTransform]::XProperty,(DA $From $To $Ms $EaseName $Delay))
}
function Begin-TY([System.Windows.Media.TranslateTransform]$T,[double]$From,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    $T.BeginAnimation([System.Windows.Media.TranslateTransform]::YProperty,(DA $From $To $Ms $EaseName $Delay))
}
function Begin-SX([System.Windows.Media.ScaleTransform]$T,[double]$From,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    $T.BeginAnimation([System.Windows.Media.ScaleTransform]::ScaleXProperty,(DA $From $To $Ms $EaseName $Delay))
}
function Begin-SY([System.Windows.Media.ScaleTransform]$T,[double]$From,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    $T.BeginAnimation([System.Windows.Media.ScaleTransform]::ScaleYProperty,(DA $From $To $Ms $EaseName $Delay))
}
function Begin-Width($Target,[double]$From,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    $Target.BeginAnimation([System.Windows.FrameworkElement]::WidthProperty,(DA $From $To $Ms $EaseName $Delay))
}
function Begin-OpacityTo($Target,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    Begin-FromCurrent $Target ([System.Windows.UIElement]::OpacityProperty) $To $Ms $EaseName $Delay
}
function Begin-TXTo([System.Windows.Media.TranslateTransform]$T,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    Begin-FromCurrent $T ([System.Windows.Media.TranslateTransform]::XProperty) $To $Ms $EaseName $Delay
}
function Begin-TYTo([System.Windows.Media.TranslateTransform]$T,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    Begin-FromCurrent $T ([System.Windows.Media.TranslateTransform]::YProperty) $To $Ms $EaseName $Delay
}
function Begin-SXTo([System.Windows.Media.ScaleTransform]$T,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    Begin-FromCurrent $T ([System.Windows.Media.ScaleTransform]::ScaleXProperty) $To $Ms $EaseName $Delay
}
function Begin-SYTo([System.Windows.Media.ScaleTransform]$T,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    Begin-FromCurrent $T ([System.Windows.Media.ScaleTransform]::ScaleYProperty) $To $Ms $EaseName $Delay
}
function Begin-WidthTo($Target,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    Begin-FromCurrent $Target ([System.Windows.FrameworkElement]::WidthProperty) $To $Ms $EaseName $Delay
}
function Begin-OpacityToClose($Target,[double]$To,[int]$Ms,[string]$EaseName="cubic-out",[int]$Delay=0) {
    $prop=[System.Windows.UIElement]::OpacityProperty
    $current=[double]$Target.GetValue($prop)
    $Target.BeginAnimation($prop,$null)
    $Target.SetValue($prop,$current)
    $a=DA $current $To $Ms $EaseName $Delay
    $a.Add_Completed({ Close-Overlay })
    $Target.BeginAnimation($prop,$a,[System.Windows.Media.Animation.HandoffBehavior]::SnapshotAndReplace)
}
function KF([double]$Value,[int]$AtMs,[string]$EaseName="cubic-out") {
    return @{ Value=$Value; Time=$AtMs; Ease=$EaseName }
}
function Begin-Keyframes($Target,[System.Windows.DependencyProperty]$Property,[object[]]$Frames) {
    $anim=[System.Windows.Media.Animation.DoubleAnimationUsingKeyFrames]::new()
    $anim.FillBehavior=[System.Windows.Media.Animation.FillBehavior]::HoldEnd
    foreach($frame in $Frames) {
        $key=[System.Windows.Media.Animation.EasingDoubleKeyFrame]::new()
        $key.Value=[double]$frame.Value
        $key.KeyTime=[System.Windows.Media.Animation.KeyTime]::FromTimeSpan([TimeSpan]::FromMilliseconds([int]$frame.Time))
        $key.EasingFunction=Ease ([string]$frame.Ease)
        $anim.KeyFrames.Add($key)
    }
    $Target.BeginAnimation($Property,$anim)
}
function Begin-OpacityFrames($Target,[object[]]$Frames) { Begin-Keyframes $Target ([System.Windows.UIElement]::OpacityProperty) $Frames }
function Begin-SXFrames([System.Windows.Media.ScaleTransform]$Target,[object[]]$Frames) { Begin-Keyframes $Target ([System.Windows.Media.ScaleTransform]::ScaleXProperty) $Frames }
function Begin-SYFrames([System.Windows.Media.ScaleTransform]$Target,[object[]]$Frames) { Begin-Keyframes $Target ([System.Windows.Media.ScaleTransform]::ScaleYProperty) $Frames }
function Begin-PulseOpacity($Target,[double]$Low,[double]$High,[int]$Ms,[int]$Delay=0) {
    $a=[System.Windows.Media.Animation.DoubleAnimation]::new($Low,$High,[TimeSpan]::FromMilliseconds($Ms))
    $a.BeginTime=[TimeSpan]::FromMilliseconds($Delay);$a.AutoReverse=$true;$a.RepeatBehavior=[System.Windows.Media.Animation.RepeatBehavior]::Forever;$a.EasingFunction=Ease "quad-out";$a.FillBehavior=[System.Windows.Media.Animation.FillBehavior]::HoldEnd
    $Target.BeginAnimation([System.Windows.UIElement]::OpacityProperty,$a)
}
function Begin-PulseScale([System.Windows.Media.ScaleTransform]$Target,[double]$Low,[double]$High,[int]$Ms,[int]$Delay=0) {
    foreach($prop in @([System.Windows.Media.ScaleTransform]::ScaleXProperty,[System.Windows.Media.ScaleTransform]::ScaleYProperty)) {
        $a=[System.Windows.Media.Animation.DoubleAnimation]::new($Low,$High,[TimeSpan]::FromMilliseconds($Ms))
        $a.BeginTime=[TimeSpan]::FromMilliseconds($Delay);$a.AutoReverse=$true;$a.RepeatBehavior=[System.Windows.Media.Animation.RepeatBehavior]::Forever;$a.EasingFunction=Ease "quad-out";$a.FillBehavior=[System.Windows.Media.Animation.FillBehavior]::HoldEnd
        $Target.BeginAnimation($prop,$a)
    }
}
function Begin-TXFrames([System.Windows.Media.TranslateTransform]$Target,[object[]]$Frames) { Begin-Keyframes $Target ([System.Windows.Media.TranslateTransform]::XProperty) $Frames }
function Begin-TYFrames([System.Windows.Media.TranslateTransform]$Target,[object[]]$Frames) { Begin-Keyframes $Target ([System.Windows.Media.TranslateTransform]::YProperty) $Frames }
function New-Text([string]$Text,[double]$Size,[System.Windows.Media.Brush]$Foreground,[string]$Weight="Normal") {
    $t=[System.Windows.Controls.TextBlock]::new()
    $t.Text=$Text
    $t.FontFamily=[System.Windows.Media.FontFamily]::new("Segoe UI Variable Text, Segoe UI")
    $t.FontSize=$Size*1.5
    $t.Foreground=$Foreground
    $t.VerticalAlignment="Center"
    $t.TextTrimming="CharacterEllipsis"
    $t.TextWrapping="NoWrap"
    if ($Weight -eq "SemiBold") { $t.FontWeight=[System.Windows.FontWeights]::SemiBold }
    elseif ($Weight -eq "Bold") { $t.FontWeight=[System.Windows.FontWeights]::Bold }
    return $t
}
function New-RoundedBorder([double]$Radius,[System.Windows.Media.Brush]$Background) {
    $b=[System.Windows.Controls.Border]::new(); $b.CornerRadius=[System.Windows.CornerRadius]::new($Radius); $b.Background=$Background; return $b
}
function Add-Transform($Element,[double]$OriginX=.5,[double]$OriginY=.5) {
    $group=[System.Windows.Media.TransformGroup]::new()
    $scale=[System.Windows.Media.ScaleTransform]::new(1,1)
    $translate=[System.Windows.Media.TranslateTransform]::new(0,0)
    $group.Children.Add($scale); $group.Children.Add($translate)
    $Element.RenderTransform=$group
    $Element.RenderTransformOrigin=[System.Windows.Point]::new($OriginX,$OriginY)
    return @{ Scale=$scale; Translate=$translate }
}
function Enable-MotionCache($Element,[double]$RenderScale=1.35) {
    try {
        $cache=[System.Windows.Media.BitmapCache]::new()
        $cache.RenderAtScale=$RenderScale
        $cache.EnableClearType=$false
        $Element.CacheMode=$cache
    } catch {}
}
function Icon-Xbox([System.Windows.Media.Brush]$Brush,[double]$Size=42) {
    # Xbox sphere mark with a more faithful carved X silhouette.
    $g=[System.Windows.Controls.Grid]::new(); $g.Width=$Size; $g.Height=$Size
    $disc=[System.Windows.Shapes.Ellipse]::new(); $disc.Width=$Size; $disc.Height=$Size; $disc.Fill=$Brush; $g.Children.Add($disc)|Out-Null
    $cutBrush=Brush $Accent 1
    foreach($spec in @(@(-44,-$Size*.05),@(44,-$Size*.05),@(-44,$Size*.16),@(44,$Size*.16))) {
        $r=[System.Windows.Shapes.Rectangle]::new(); $r.Width=$Size*.13; $r.Height=$Size*.52; $r.RadiusX=$Size*.06; $r.RadiusY=$Size*.06; $r.Fill=$cutBrush
        $r.HorizontalAlignment='Center'; $r.VerticalAlignment='Center'; $r.Margin=[System.Windows.Thickness]::new(0,[double]$spec[1],0,0)
        $r.RenderTransform=[System.Windows.Media.RotateTransform]::new([double]$spec[0],$r.Width/2,$r.Height/2); $g.Children.Add($r)|Out-Null
    }
    return $g
}
function Icon-PlayStation([System.Windows.Media.Brush]$Brush,[double]$Size=24) {
    $t=[System.Windows.Controls.TextBlock]::new()
    $t.Text='PS'
    $t.FontFamily=[System.Windows.Media.FontFamily]::new('Segoe UI Black, Segoe UI')
    $t.FontSize=$Size*1.28
    $t.FontWeight=[System.Windows.FontWeights]::Black
    $t.Foreground=$Brush
    $t.HorizontalAlignment='Center';$t.VerticalAlignment='Center';$t.TextAlignment='Center'
    return $t
}
function Icon-Trophy([System.Windows.Media.Brush]$Brush,[double]$Size=28) {
    $g=[System.Windows.Controls.Grid]::new(); $g.Width=$Size; $g.Height=$Size
    $cup=[System.Windows.Controls.Border]::new(); $cup.Width=$Size*.48; $cup.Height=$Size*.38; $cup.CornerRadius=[System.Windows.CornerRadius]::new($Size*.06,$Size*.06,$Size*.16,$Size*.16); $cup.Background=$Brush; $cup.VerticalAlignment="Top"; $cup.Margin=[System.Windows.Thickness]::new(0,$Size*.16,0,0); $g.Children.Add($cup)|Out-Null
    $stem=[System.Windows.Shapes.Rectangle]::new(); $stem.Width=$Size*.10; $stem.Height=$Size*.24; $stem.Fill=$Brush; $stem.VerticalAlignment="Center"; $stem.Margin=[System.Windows.Thickness]::new(0,$Size*.30,0,0); $g.Children.Add($stem)|Out-Null
    $base=[System.Windows.Controls.Border]::new(); $base.Width=$Size*.42; $base.Height=$Size*.10; $base.CornerRadius=[System.Windows.CornerRadius]::new($Size*.04); $base.Background=$Brush; $base.VerticalAlignment="Bottom"; $base.Margin=[System.Windows.Thickness]::new(0,0,0,$Size*.10); $g.Children.Add($base)|Out-Null
    return $g
}
function Make-IconCircle([System.Windows.Media.Brush]$Bg,[System.Windows.Media.Brush]$Fg,[string]$Glyph,[double]$Size=54) {
    $b=New-RoundedBorder ($Size/2) $Bg; $b.Width=$Size; $b.Height=$Size
    $t=[System.Windows.Controls.TextBlock]::new(); $t.Text=$Glyph; $t.FontFamily=[System.Windows.Media.FontFamily]::new("Segoe Fluent Icons, Segoe MDL2 Assets"); $t.FontSize=$Size*.36; $t.Foreground=$Fg; $t.HorizontalAlignment="Center"; $t.VerticalAlignment="Center"; $t.TextAlignment="Center"
    $b.Child=$t; return $b
}
function Kind-Glyph([string]$Kind) {
    # Segoe Fluent/MDL2 monochrome glyphs: visual only, no input behavior.
    switch($Kind) {
        "achievement" { return [char]0xE7D0 }
        "message" { return [char]0xE8BD }
        "invite" { return [char]0xE8FA }
        "friend" { return [char]0xE716 }
        "download" { return [char]0xE896 }
        "screenshot" { return [char]0xE722 }
        "controller" { return [char]0xE7FC }
        "warning" { return [char]0xE7BA }
        "community" { return [char]0xE902 }
        default { return [char]0xE946 }
    }
}
function New-FluentGlyph([string]$Kind,[System.Windows.Media.Brush]$Brush,[double]$Size=24) {
    if($Kind -eq "achievement") {
        $trophy=Icon-Trophy $Brush ([Math]::Max(22,$Size*.95))
        $trophy.HorizontalAlignment="Center";$trophy.VerticalAlignment="Center"
        return $trophy
    }
    $t=[System.Windows.Controls.TextBlock]::new()
    $t.Text=[string](Kind-Glyph $Kind)
    $t.FontFamily=[System.Windows.Media.FontFamily]::new("Segoe Fluent Icons, Segoe MDL2 Assets")
    $t.FontSize=$Size*1.5
    $t.Foreground=$Brush
    $t.HorizontalAlignment="Center"; $t.VerticalAlignment="Center"
    $t.TextAlignment="Center"
    return $t
}
function New-PayloadImage([string]$Source,[double]$Width,[double]$Height,[double]$Radius=8) {
    if ([string]::IsNullOrWhiteSpace($Source)) { return $null }
    $img = $null
    # Strategy 1: local file via UriSource
    try {
        if (Test-Path -LiteralPath $Source) {
            $resolved=(Resolve-Path -LiteralPath $Source).Path
            $bitmap=[System.Windows.Media.Imaging.BitmapImage]::new()
            $bitmap.BeginInit()
            $bitmap.CacheOption=[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
            $bitmap.CreateOptions=[System.Windows.Media.Imaging.BitmapCreateOptions]::IgnoreImageCache
            $bitmap.UriSource=[Uri]::new($resolved,[UriKind]::Absolute)
            $bitmap.EndInit(); $bitmap.Freeze()
            $img=[System.Windows.Controls.Image]::new(); $img.Source=$bitmap; $img.Width=$Width; $img.Height=$Height; $img.Stretch="UniformToFill"; [System.Windows.Media.RenderOptions]::SetBitmapScalingMode($img,[System.Windows.Media.BitmapScalingMode]::HighQuality)
            $clip=[System.Windows.Media.RectangleGeometry]::new([System.Windows.Rect]::new(0,0,$Width,$Height),$Radius,$Radius); $img.Clip=$clip
            Write-PhnLog "image loaded uri file: $resolved"
            return $img
        }
    } catch {
        Write-PhnLog "image load failed uri file: $Source :: $($_.Exception.Message)"
    }
    # Strategy 2: local file bytes
    try {
        if (Test-Path -LiteralPath $Source) {
            $resolved=(Resolve-Path -LiteralPath $Source).Path
            $bytes=[System.IO.File]::ReadAllBytes($resolved)
            $stream=[System.IO.MemoryStream]::new($bytes)
            $bitmap=[System.Windows.Media.Imaging.BitmapImage]::new()
            $bitmap.BeginInit()
            $bitmap.CacheOption=[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
            $bitmap.CreateOptions=[System.Windows.Media.Imaging.BitmapCreateOptions]::IgnoreImageCache
            $bitmap.StreamSource=$stream
            $bitmap.EndInit(); $bitmap.Freeze()
            $img=[System.Windows.Controls.Image]::new(); $img.Source=$bitmap; $img.Width=$Width; $img.Height=$Height; $img.Stretch="UniformToFill"; [System.Windows.Media.RenderOptions]::SetBitmapScalingMode($img,[System.Windows.Media.BitmapScalingMode]::HighQuality)
            $clip=[System.Windows.Media.RectangleGeometry]::new([System.Windows.Rect]::new(0,0,$Width,$Height),$Radius,$Radius); $img.Clip=$clip
            Write-PhnLog "image loaded bytes file: $resolved"
            return $img
        }
    } catch {
        Write-PhnLog "image load failed bytes file: $Source :: $($_.Exception.Message)"
    }
    # Strategy 3: remote/file URI directly
    try {
        $uri=[Uri]::new($Source,[UriKind]::RelativeOrAbsolute)
        $bitmap=[System.Windows.Media.Imaging.BitmapImage]::new()
        $bitmap.BeginInit()
        $bitmap.CacheOption=[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
        $bitmap.CreateOptions=[System.Windows.Media.Imaging.BitmapCreateOptions]::IgnoreImageCache
        $bitmap.UriSource=$uri
        $bitmap.EndInit(); $bitmap.Freeze()
        $img=[System.Windows.Controls.Image]::new(); $img.Source=$bitmap; $img.Width=$Width; $img.Height=$Height; $img.Stretch="UniformToFill"; [System.Windows.Media.RenderOptions]::SetBitmapScalingMode($img,[System.Windows.Media.BitmapScalingMode]::HighQuality)
        $clip=[System.Windows.Media.RectangleGeometry]::new([System.Windows.Rect]::new(0,0,$Width,$Height),$Radius,$Radius); $img.Clip=$clip
        Write-PhnLog "image loaded uri direct: $Source"
        return $img
    } catch {
        Write-PhnLog "image load failed uri direct: $Source :: $($_.Exception.Message)"
    }
    return $null
}
function New-PayloadImageMulti([string[]]$Sources,[double]$Width,[double]$Height,[double]$Radius=8) {
    foreach($candidate in $Sources){
        if([string]::IsNullOrWhiteSpace($candidate)){ continue }
        $img = New-PayloadImage $candidate $Width $Height $Radius
        if($img){ return $img }
    }
    return $null
}
function New-BrandImage([string]$FileName,[double]$Width,[double]$Height) {
    try {
        $pluginRoot=Split-Path $PSScriptRoot -Parent
        $path=Join-Path (Join-Path $pluginRoot "assets\brands") $FileName
        if(-not (Test-Path -LiteralPath $path)){ return $null }
        $bytes=[System.IO.File]::ReadAllBytes($path)
        $stream=[System.IO.MemoryStream]::new($bytes)
        $bitmap=[System.Windows.Media.Imaging.BitmapImage]::new()
        $bitmap.BeginInit();$bitmap.CacheOption=[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad;$bitmap.StreamSource=$stream;$bitmap.EndInit();$bitmap.Freeze()
        $img=[System.Windows.Controls.Image]::new();$img.Source=$bitmap;$img.Width=$Width;$img.Height=$Height;$img.Stretch="Uniform";[System.Windows.Media.RenderOptions]::SetBitmapScalingMode($img,[System.Windows.Media.BitmapScalingMode]::HighQuality)
        return $img
    } catch { return $null }
}
function New-ArtTile([string]$Source,[double]$Size,[double]$Radius,[System.Windows.Media.Brush]$FallbackBg,[System.Windows.Media.Brush]$FallbackFg,[string]$FallbackGlyph) {
    $tile=New-RoundedBorder $Radius $FallbackBg; $tile.Width=$Size; $tile.Height=$Size
    $img=New-PayloadImageMulti @($Source,$script:ImageRemote) $Size $Size $Radius
    if($img -ne $null) { $tile.Child=$img }
    else {
        if($FallbackGlyph -eq ([string][char]0xE7D0)) {
            $glyph=Icon-Trophy $FallbackFg ($Size*.84);$glyph.HorizontalAlignment="Center";$glyph.VerticalAlignment="Center";$tile.Child=$glyph
        } else {
            $glyph=[System.Windows.Controls.TextBlock]::new();$glyph.Text=$FallbackGlyph;$glyph.FontFamily=[System.Windows.Media.FontFamily]::new("Segoe Fluent Icons, Segoe MDL2 Assets");$glyph.FontSize=$Size*.32;$glyph.Foreground=$FallbackFg;$glyph.HorizontalAlignment="Center";$glyph.VerticalAlignment="Center";$glyph.TextAlignment="Center";$tile.Child=$glyph
        }
    }
    return $tile
}
function Add-Columns($Grid,[double[]]$Widths) {
    foreach($w in $Widths) { $c=[System.Windows.Controls.ColumnDefinition]::new(); if($w -lt 0){$c.Width=[System.Windows.GridLength]::new(1,[System.Windows.GridUnitType]::Star)} else {$c.Width=[System.Windows.GridLength]::new($w)}; $Grid.ColumnDefinitions.Add($c) }
}

$theme=[string]$Payload.theme
if ([string]::IsNullOrWhiteSpace($theme)) { $theme="xbox" }
$kind=[string]$Payload.kind
$title=[string]$Payload.title
$body=[string]$Payload.body
$subtitle=[string]$Payload.subtitle
$image=[string]$Payload.image
$imageRemote=[string]$Payload.image_remote
$script:ImageRemote=$imageRemote
$duration=[int]$Payload.duration_ms
if ($duration -lt 2000) { $duration=2000 }
if ($kind -eq "achievement") { Write-PhnLog "achievement payload image=$image remote=$imageRemote title=$title" }
$defaults=@{
    xbox=@("#107C10","#107C10","#FFFFFF")
    playstation=@("#5C9DFF","#15161A","#FFFFFF")
    gog=@("#B65CFF","#21182A","#FFFFFF")
    epic=@("#FFFFFF","#17181B","#FFFFFF")
    nintendo=@("#E60012","#FFF9F3","#252525")
    android16=@("#A8C7FA","#20242C","#F7F9FC")
    glass=@("#A9DDFF","#506071","#FFFFFF")
}
if (-not $defaults.ContainsKey($theme)) { $theme="xbox" }
$pal=$defaults[$theme]
$Accent=Parse-Color $pal[0] "#107C10"
$Background=Parse-Color $pal[1] "#171717"
$Text=Parse-Color $pal[2] "#FFFFFF"
$White=[System.Windows.Media.Colors]::White
$Black=[System.Windows.Media.Colors]::Black
$AccentLight=Mix-Color $Accent $White .30
$AccentDark=Mix-Color $Accent $Black .28
$SurfaceLight=Mix-Color $Background $White .08
$Subtle=Mix-Color $Text $Background .36
$AccentBrush=Brush $Accent
$TextBrush=Brush $Text
$SubtleBrush=Brush $Subtle .92
$BgBrush=Brush $Background .97

$window=[System.Windows.Window]::new()
$window.WindowStyle="None"
$window.ResizeMode="NoResize"
$window.ShowInTaskbar=$false
$window.ShowActivated=$false
$window.Topmost=$true
$window.Background=[System.Windows.Media.Brushes]::Transparent
$window.AllowsTransparency=$true
$window.Focusable=$false
$window.UseLayoutRounding=$false
$window.SnapsToDevicePixels=$false
[System.Windows.Media.TextOptions]::SetTextFormattingMode($window,[System.Windows.Media.TextFormattingMode]::Ideal)
[System.Windows.Media.TextOptions]::SetTextRenderingMode($window,[System.Windows.Media.TextRenderingMode]::Grayscale)
$window.IsHitTestVisible=$false
$window.SizeToContent="Manual"
$window.WindowStartupLocation="Manual"

$root=[System.Windows.Controls.Grid]::new()
$root.Background=[System.Windows.Media.Brushes]::Transparent
$root.IsHitTestVisible=$false
$root.UseLayoutRounding=$false
$root.SnapsToDevicePixels=$false
[System.Windows.Media.TextOptions]::SetTextFormattingMode($root,[System.Windows.Media.TextFormattingMode]::Ideal)
[System.Windows.Media.TextOptions]::SetTextRenderingMode($root,[System.Windows.Media.TextRenderingMode]::Grayscale)
$window.Content=$root
$globalMotion=Add-Transform $root
$motion="theme"

$position=[string]$Payload.position
if ([string]::IsNullOrWhiteSpace($position)) {$position="bottom-right"}
$margin=34.0
function Place-Window([double]$W,[double]$H) {
    $window.Width=$W; $window.Height=$H
    $sw=[System.Windows.SystemParameters]::PrimaryScreenWidth; $sh=[System.Windows.SystemParameters]::PrimaryScreenHeight
    switch($position) {
        "top-left" { $window.Left=$margin; $window.Top=$margin }
        "top-center" { $window.Left=($sw-$W)/2; $window.Top=$margin }
        "top-right" { $window.Left=$sw-$W-$margin; $window.Top=$margin }
        "bottom-left" { $window.Left=$margin; $window.Top=$sh-$H-$margin }
        "bottom-center" { $window.Left=($sw-$W)/2; $window.Top=$sh-$H-$margin }
        default { $window.Left=$sw-$W-$margin; $window.Top=$sh-$H-$margin }
    }
}

$closed=$false
function Close-Overlay {
    if ($script:closed) { return }; $script:closed=$true
    try { if($script:swapTimer){$script:swapTimer.Stop()} } catch {}
    try { if($script:exitTimer){$script:exitTimer.Stop()} } catch {}
    try { if($script:exitGuard){$script:exitGuard.Stop()} } catch {}
    try { if($script:safety){$script:safety.Stop()} } catch {}
    try { if($script:player){$script:player.Stop(); $script:player.Close()} } catch {}
    try { $window.Close() } catch {}
    try { $window.Dispatcher.BeginInvokeShutdown([System.Windows.Threading.DispatcherPriority]::Background) } catch {}
}

$enterMs=500; $exitMs=380
$enterAction={}; $exitAction={ Close-Overlay }
$swapAction=$null
try {$renderTier=[System.Windows.Media.RenderCapability]::Tier -shr 16} catch {$renderTier=-1}

# Shared helpers for per-theme cards.
function Create-TextStack([string]$Heading,[string]$Detail,[double]$Width,[double]$TitleSize=18,[double]$BodySize=13) {
    $stack=[System.Windows.Controls.StackPanel]::new(); $stack.Orientation="Vertical"; $stack.VerticalAlignment="Center"; $stack.Width=$Width
    if($kind -eq "download") {
        $h=New-Text "Download complete" 13.5 $TextBrush "SemiBold"; $h.MaxWidth=$Width
        $game=New-Text ($(if(-not [string]::IsNullOrWhiteSpace($body)){$body}else{"Steam game"})) 12.5 $TextBrush "SemiBold"; $game.MaxWidth=$Width; $game.Margin=[System.Windows.Thickness]::new(0,3,0,0)
        $stack.Children.Add($h)|Out-Null;$stack.Children.Add($game)|Out-Null
        return @{Stack=$stack; Heading=$h; Detail=$game}
    }
    $h=New-Text $Heading $TitleSize $TextBrush "SemiBold"; $h.MaxWidth=$Width
    $d=New-Text $Detail $BodySize $SubtleBrush "Normal"; $d.MaxWidth=$Width; $d.Margin=[System.Windows.Thickness]::new(0,4,0,0)
    $stack.Children.Add($h)|Out-Null; if(-not [string]::IsNullOrWhiteSpace($Detail)){$stack.Children.Add($d)|Out-Null}
    return @{Stack=$stack; Heading=$h; Detail=$d}
}


if ($theme -eq "xbox") {
    # Xbox One: start immediately on the real Xbox mark, then expand the sphere
    # into the capsule. No loader/concentric-circle prelude.
    Place-Window 640 170
    $stage=[System.Windows.Controls.Canvas]::new();$stage.Width=600;$stage.Height=120;$stage.HorizontalAlignment='Center';$stage.VerticalAlignment='Center';$root.Children.Add($stage)|Out-Null
    $banner=New-RoundedBorder 50 (Brush $Accent);$banner.Width=100;$banner.Height=100;$banner.Opacity=0;$bannerT=Add-Transform $banner 0 .5;[System.Windows.Controls.Canvas]::SetLeft($banner,250);[System.Windows.Controls.Canvas]::SetTop($banner,10);$stage.Children.Add($banner)|Out-Null
    $clip=[System.Windows.Controls.Grid]::new();$clip.ClipToBounds=$false;$banner.Child=$clip
    $leftHost=[System.Windows.Controls.Grid]::new();$leftHost.Width=100;$leftHost.Height=100;$leftHost.HorizontalAlignment='Left';$leftHost.VerticalAlignment='Center';$clip.Children.Add($leftHost)|Out-Null
    $xboxLogo=New-BrandImage 'xbox-white.png' 60 60
    if($xboxLogo -eq $null){$xboxLogo=New-Text 'X' 30 (Brush $White 1) 'Bold'}
    $xboxLogo.HorizontalAlignment='Center';$xboxLogo.VerticalAlignment='Center';$xboxLogo.Opacity=0;$logoT=Add-Transform $xboxLogo;$leftHost.Children.Add($xboxLogo)|Out-Null
    $content=[System.Windows.Controls.Grid]::new();$content.Width=440;$content.Height=100;$content.HorizontalAlignment='Left';$content.Margin=[System.Windows.Thickness]::new(112,0,0,0);$rowA=[System.Windows.Controls.RowDefinition]::new();$rowA.Height=[System.Windows.GridLength]::new(1,[System.Windows.GridUnitType]::Star);$rowB=[System.Windows.Controls.RowDefinition]::new();$rowB.Height=[System.Windows.GridLength]::new(1,[System.Windows.GridUnitType]::Star);$content.RowDefinitions.Add($rowA);$content.RowDefinitions.Add($rowB);$clip.Children.Add($content)|Out-Null
    $titleText=if($kind -eq 'achievement'){'Achievement unlocked'}else{$title}
    $detailText=if($kind -eq 'achievement'){$title}elseif($body){$body}else{$subtitle}
    $titleEl=New-Text $titleText 16.5 (Brush $White .98) 'SemiBold';$titleEl.HorizontalAlignment='Left';$titleEl.VerticalAlignment='Bottom';$titleEl.Margin=[System.Windows.Thickness]::new(0,0,0,4);$titleEl.TextAlignment='Left';$titleEl.TextWrapping='Wrap';$titleEl.Width=420;$titleEl.Opacity=0;$titleT=Add-Transform $titleEl;[System.Windows.Controls.Grid]::SetRow($titleEl,0);$content.Children.Add($titleEl)|Out-Null
    $detailEl=New-Text $detailText 15 (Brush $White .98) 'Medium';$detailEl.HorizontalAlignment='Left';$detailEl.VerticalAlignment='Top';$detailEl.Margin=[System.Windows.Thickness]::new(0,4,0,0);$detailEl.TextAlignment='Left';$detailEl.TextWrapping='Wrap';$detailEl.Width=420;$detailEl.Opacity=0;$detailT=Add-Transform $detailEl;[System.Windows.Controls.Grid]::SetRow($detailEl,1);$content.Children.Add($detailEl)|Out-Null
    $kindArt=$null
    if($kind -ne 'achievement'){
        if(-not [string]::IsNullOrWhiteSpace($image) -or -not [string]::IsNullOrWhiteSpace($imageRemote)){$kindArt=New-PayloadImageMulti @($image,$imageRemote) 72 72 22}
        if($kindArt -eq $null){$kindArt=New-FluentGlyph $kind (Brush $White .98) 28}
        if($kindArt){$kindArt.HorizontalAlignment='Center';$kindArt.VerticalAlignment='Center';$kindArt.Opacity=0;$leftHost.Children.Add($kindArt)|Out-Null}
    }
    $enterMs=1800;$exitMs=1150
    $enterAction={
        Begin-Opacity $banner 0 1 100 'linear' 0
        Begin-Opacity $xboxLogo 0 1 140 'quad-out' 25
        Begin-SXFrames $logoT.Scale @((KF .78 0),(KF 1.08 180 'back-out'),(KF 1 280 'quad-out'))
        Begin-SYFrames $logoT.Scale @((KF .78 0),(KF 1.08 180 'back-out'),(KF 1 280 'quad-out'))
        Begin-Width $banner 100 600 520 'quint-out' 150;Begin-TX $bannerT.Translate 0 -250 520 'quint-out' 150
        if($kindArt){Begin-OpacityTo $xboxLogo 0 110 'cubic-in' 500;Begin-Opacity $kindArt 0 1 150 'quad-out' 560}
        Begin-Opacity $titleEl 0 1 180 'quad-out' 520;Begin-TY $titleT.Translate 10 0 240 'quint-out' 500
        Begin-Opacity $detailEl 0 1 180 'quad-out' 700;Begin-TY $detailT.Translate 10 0 240 'quint-out' 680
    }
    $exitAction={
        Begin-OpacityTo $detailEl 0 140 'cubic-in' 0;Begin-TYTo $detailT.Translate -10 180 'cubic-in' 0
        Begin-OpacityTo $titleEl 0 130 'cubic-in' 70;Begin-TYTo $titleT.Translate -10 180 'cubic-in' 60
        if($kindArt){Begin-OpacityTo $kindArt 0 110 'cubic-in' 120;Begin-Opacity $xboxLogo 0 1 120 'quad-out' 180}
        Begin-WidthTo $banner 100 500 'quint-in' 210;Begin-TXTo $bannerT.Translate 0 500 'quint-in' 210
        Begin-SXFrames $logoT.Scale @((KF 1 420),(KF 1.08 600 'back-out'),(KF .12 910 'quint-in'));Begin-SYFrames $logoT.Scale @((KF 1 420),(KF 1.08 600 'back-out'),(KF .12 910 'quint-in'))
        Begin-OpacityToClose $banner 0 130 'cubic-in' 900
    }
}
elseif ($theme -eq "playstation") {
    # PS5-inspired toast: no blue bar, real PlayStation mark, achievement art left,
    # and the white ring is concentric with the logo badge itself.
    Place-Window 640 156
    $card=New-RoundedBorder 18 (Gradient-Brush ([System.Windows.Media.Color]::FromArgb(248,35,37,43)) ([System.Windows.Media.Color]::FromArgb(248,42,44,51)) 0);$card.Width=590;$card.Height=90;$card.HorizontalAlignment='Center';$card.VerticalAlignment='Center';$card.Opacity=0;$ct=Add-Transform $card;$root.Children.Add($card)|Out-Null
    $grid=[System.Windows.Controls.Grid]::new();$grid.Margin=[System.Windows.Thickness]::new(18,10,18,10);Add-Columns $grid @(64,-1,64);$card.Child=$grid
    $left=New-RoundedBorder 9 (Brush ([System.Windows.Media.Color]::FromArgb(255,28,30,36)) 1);$left.Width=52;$left.Height=52;$left.HorizontalAlignment='Center';$left.VerticalAlignment='Center';$left.Opacity=0;$leftT=Add-Transform $left;[System.Windows.Controls.Grid]::SetColumn($left,0);$grid.Children.Add($left)|Out-Null
    $art=New-PayloadImageMulti @($image,$imageRemote) 52 52 9
    if($art){$left.Child=$art}elseif($kind -eq 'achievement'){$left.Child=Icon-Trophy (Brush $White .98) 44}else{$left.Child=New-FluentGlyph $kind (Brush $White .98) 25}
    $detail=if($kind -eq 'achievement'){'Trophy earned!'}elseif($kind -eq 'download' -and $subtitle){$subtitle}elseif($body){$body}else{$subtitle}
    $copy=Create-TextStack $title $detail 390 17 13;$copy.Stack.Margin=[System.Windows.Thickness]::new(14,0,10,0);$copy.Stack.Opacity=0;$copyT=Add-Transform $copy.Stack;[System.Windows.Controls.Grid]::SetColumn($copy.Stack,1);$grid.Children.Add($copy.Stack)|Out-Null
    $badgeHost=[System.Windows.Controls.Grid]::new();$badgeHost.Width=54;$badgeHost.Height=54;$badgeHost.HorizontalAlignment='Center';$badgeHost.VerticalAlignment='Center';[System.Windows.Controls.Grid]::SetColumn($badgeHost,2);$grid.Children.Add($badgeHost)|Out-Null
    $ring=[System.Windows.Controls.Border]::new();$ring.Width=42;$ring.Height=42;$ring.CornerRadius=[System.Windows.CornerRadius]::new(21);$ring.BorderThickness=[System.Windows.Thickness]::new(2);$ring.BorderBrush=Brush $White .80;$ring.HorizontalAlignment='Center';$ring.VerticalAlignment='Center';$ring.Opacity=0;$ringT=Add-Transform $ring;$badgeHost.Children.Add($ring)|Out-Null
    $badge=New-RoundedBorder 21 (Brush $White .98);$badge.Width=42;$badge.Height=42;$badge.HorizontalAlignment='Center';$badge.VerticalAlignment='Center';$badge.Opacity=0;$badgeT=Add-Transform $badge;$badgeHost.Children.Add($badge)|Out-Null
    $psLogo=New-BrandImage 'playstation-black.png' 29 24
    if($psLogo){$psLogo.HorizontalAlignment='Center';$psLogo.VerticalAlignment='Center';$badge.Child=$psLogo}else{$badge.Child=New-Text 'PS' 11 (Brush $Black 1) 'Bold'}
    $enterMs=1000;$exitMs=500
    $enterAction={Begin-Opacity $card 0 1 190 'quad-out' 0;Begin-TX $ct.Translate 18 0 380 'quint-out' 0;Begin-Opacity $left 0 1 170 'quad-out' 90;Begin-SXFrames $leftT.Scale @((KF .80 70),(KF 1.06 330 'back-out'),(KF 1 500 'quad-out'));Begin-SYFrames $leftT.Scale @((KF .80 70),(KF 1.06 330 'back-out'),(KF 1 500 'quad-out'));Begin-Opacity $copy.Stack 0 1 220 'quad-out' 240;Begin-TX $copyT.Translate 12 0 350 'quint-out' 220;Begin-Opacity $badge 0 1 170 'quad-out' 420;Begin-SXFrames $badgeT.Scale @((KF .70 390),(KF 1.08 610 'back-out'),(KF 1 760 'quad-out'));Begin-SYFrames $badgeT.Scale @((KF .70 390),(KF 1.08 610 'back-out'),(KF 1 760 'quad-out'));Begin-OpacityFrames $ring @((KF 0 0),(KF .78 560 'quad-out'),(KF 0 990 'quad-out'));Begin-SXFrames $ringT.Scale @((KF .92 540),(KF 1.90 1000 'quint-out'));Begin-SYFrames $ringT.Scale @((KF .92 540),(KF 1.90 1000 'quint-out'))}
    $exitAction={Begin-OpacityTo $copy.Stack 0 140 'cubic-in' 0;Begin-OpacityTo $badge 0 140 'cubic-in' 30;Begin-SXTo $leftT.Scale .90 210 'cubic-in' 60;Begin-SYTo $leftT.Scale .90 210 'cubic-in' 60;Begin-TXTo $ct.Translate 14 300 'cubic-in' 0;Begin-OpacityToClose $card 0 280 'cubic-in' 40}
}
elseif ($theme -eq "gog") {
    # GOG Galaxy: rail defines the true left origin. No bottom line. The soft sheen
    # starts at the rail and travels across the card rather than appearing at center.
    Place-Window 630 158
    $card=New-RoundedBorder 18 (Gradient-Brush ([System.Windows.Media.Color]::FromArgb(250,37,28,48)) ([System.Windows.Media.Color]::FromArgb(250,48,36,60)) 0);$card.Width=590;$card.Height=112;$card.HorizontalAlignment='Center';$card.VerticalAlignment='Center';$card.Opacity=0;$ct=Add-Transform $card;$root.Children.Add($card)|Out-Null
    $ov=[System.Windows.Controls.Grid]::new();$ov.ClipToBounds=$true;$ov.Clip=[System.Windows.Media.RectangleGeometry]::new([System.Windows.Rect]::new(0,0,590,112),18,18);$card.Child=$ov
    $grid=[System.Windows.Controls.Grid]::new();Add-Columns $grid @(9,94,-1);$ov.Children.Add($grid)|Out-Null
    $rail=[System.Windows.Controls.Border]::new();$rail.Background=Gradient-Brush $Accent (Mix-Color $Accent $White .25) 90;$rail.CornerRadius=[System.Windows.CornerRadius]::new(0);$rail.Opacity=0;[System.Windows.Controls.Grid]::SetColumn($rail,0);$grid.Children.Add($rail)|Out-Null
    $slot=[System.Windows.Controls.Grid]::new();$slot.Margin=[System.Windows.Thickness]::new(14,0,6,0);[System.Windows.Controls.Grid]::SetColumn($slot,1);$grid.Children.Add($slot)|Out-Null
    $iconSize=if($kind -eq 'achievement'){66}else{62}
    $icon=New-ArtTile $image $iconSize 15 (Brush ([System.Windows.Media.Color]::FromArgb(255,68,45,82)) 1) $TextBrush (Kind-Glyph $kind);$icon.HorizontalAlignment='Center';$icon.VerticalAlignment='Center';$icon.Opacity=0;$iconT=Add-Transform $icon;$slot.Children.Add($icon)|Out-Null
    $heading=if($kind -eq 'achievement'){'Achievement unlocked'}else{$title};$detail=if($kind -eq 'achievement'){$title}elseif($kind -eq 'download' -and $subtitle){$subtitle}elseif($body){$body}else{$subtitle}
    $copy=Create-TextStack $heading $detail 446 17 13;$copy.Stack.Margin=[System.Windows.Thickness]::new(8,0,20,0);$copy.Stack.Opacity=0;$copyT=Add-Transform $copy.Stack;[System.Windows.Controls.Grid]::SetColumn($copy.Stack,2);$grid.Children.Add($copy.Stack)|Out-Null
    $shine=[System.Windows.Controls.Border]::new();$shine.Width=56;$shine.Height=150;$shine.Background=Brush $White .07;$shine.Opacity=0;$shine.HorizontalAlignment='Left';$shine.RenderTransform=[System.Windows.Media.SkewTransform]::new(-18,0);$ov.Children.Add($shine)|Out-Null;$shineT=Add-Transform $shine -110 0
    $enterMs=1040;$exitMs=500
    $enterAction={Begin-Opacity $card 0 1 200 'quad-out' 0;Begin-TX $ct.Translate 26 0 420 'quint-out' 0;Begin-Opacity $rail 0 1 170 'quad-out' 60;Begin-Opacity $icon 0 1 190 'quad-out' 110;Begin-SXFrames $iconT.Scale @((KF .72 80),(KF 1.08 350 'back-out'),(KF 1 540 'quad-out'));Begin-SYFrames $iconT.Scale @((KF .72 80),(KF 1.08 350 'back-out'),(KF 1 540 'quad-out'));Begin-Opacity $copy.Stack 0 1 240 'quad-out' 250;Begin-TX $copyT.Translate 12 0 360 'quint-out' 230;Begin-TX $shineT.Translate -110 690 820 'cubic-out' 0;Begin-OpacityFrames $shine @((KF 0 0),(KF 0 70),(KF .46 230 'quad-out'),(KF .20 610),(KF 0 900 'quad-out'))}
    $exitAction={Begin-OpacityTo $copy.Stack 0 150 'cubic-in' 0;Begin-TXTo $copyT.Translate -8 200 'cubic-in' 0;Begin-SXTo $iconT.Scale .90 210 'cubic-in' 50;Begin-SYTo $iconT.Scale .90 210 'cubic-in' 50;Begin-TXTo $ct.Translate 18 300 'cubic-in' 0;Begin-OpacityToClose $card 0 280 'cubic-in' 30}
}
elseif ($theme -eq "epic") {
    # Epic: no accent outline around the text slab. Icon tile is black at 40%
    # with white artwork/glyph so the icon always remains readable.
    Place-Window 610 150
    $stage=[System.Windows.Controls.Canvas]::new();$stage.Width=570;$stage.Height=108;$stage.HorizontalAlignment='Center';$stage.VerticalAlignment='Center';$root.Children.Add($stage)|Out-Null
    $panel=New-RoundedBorder 10 (Brush $Black .48);$panel.Width=430;$panel.Height=80;$panel.Opacity=0;$panelT=Add-Transform $panel 0 .5;$panelT.Scale.ScaleX=.06;[System.Windows.Controls.Canvas]::SetLeft($panel,88);[System.Windows.Controls.Canvas]::SetTop($panel,14);$stage.Children.Add($panel)|Out-Null
    $pg=[System.Windows.Controls.Grid]::new();$pg.Margin=[System.Windows.Thickness]::new(58,10,18,10);$panel.Child=$pg
    $detail=if($kind -eq 'download' -and $subtitle){$subtitle}elseif($body){$body}else{'Unlocked'};$copy=Create-TextStack $title $detail 335 17 13;$copy.Stack.Opacity=0;$pg.Children.Add($copy.Stack)|Out-Null
    $tile=New-RoundedBorder 10 (Gradient-Brush ([System.Windows.Media.Color]::FromArgb(250,25,26,30)) ([System.Windows.Media.Color]::FromArgb(250,33,34,39)) 0);$tile.Width=80;$tile.Height=80;$tile.Opacity=0;$tileT=Add-Transform $tile;[System.Windows.Controls.Canvas]::SetLeft($tile,246);[System.Windows.Controls.Canvas]::SetTop($tile,14);$stage.Children.Add($tile)|Out-Null
    $tg=[System.Windows.Controls.Grid]::new();$tile.Child=$tg;$art=New-PayloadImageMulti @($image,$imageRemote) 70 70 8
    if($art){$art.Margin=[System.Windows.Thickness]::new(5);$tg.Children.Add($art)|Out-Null}elseif($kind -eq 'achievement'){$tr=Icon-Trophy (Brush $White .98) 60;$tr.HorizontalAlignment='Center';$tr.VerticalAlignment='Center';$tg.Children.Add($tr)|Out-Null}else{$tg.Children.Add((New-FluentGlyph $kind (Brush $White .98) 27))|Out-Null}
    $enterMs=920;$exitMs=650
    $enterAction={Begin-Opacity $tile 0 1 180 'quad-out' 0;Begin-SXFrames $tileT.Scale @((KF .78 0),(KF 1.08 280 'back-out'),(KF 1 450 'quad-out'));Begin-SYFrames $tileT.Scale @((KF .78 0),(KF 1.08 280 'back-out'),(KF 1 450 'quad-out'));Begin-TX $tileT.Translate 0 -204 350 'quint-out' 200;Begin-Opacity $panel 0 1 120 'quad-out' 480;Begin-SX $panelT.Scale .06 1 290 'quint-out' 480;Begin-Opacity $copy.Stack 0 1 210 'quad-out' 600}
    $exitAction={Begin-OpacityTo $copy.Stack 0 150 'cubic-in' 0;Begin-SXTo $panelT.Scale .06 240 'cubic-in' 100;Begin-OpacityTo $panel 0 130 'cubic-in' 220;Begin-TXTo $tileT.Translate 0 300 'cubic-in' 320;Begin-SXTo $tileT.Scale .90 190 'cubic-in' 420;Begin-SYTo $tileT.Scale .90 190 'cubic-in' 420;Begin-OpacityToClose $tile 0 170 'cubic-in' 510}
}
elseif ($theme -eq "nintendo") {
    # Nintendo: the icon tile is now intentionally taller/larger than the main text
    # card, while the text panel becomes slightly slimmer. This keeps the playful
    # hierarchy the user requested without breaking the proportions.
    $Background=[System.Windows.Media.Color]::FromArgb(255,250,249,247);$Text=[System.Windows.Media.Color]::FromArgb(255,31,31,33);$Accent=[System.Windows.Media.Color]::FromArgb(255,230,0,18);$TextBrush=Brush $Text;$SubtleBrush=Brush ([System.Windows.Media.Color]::FromArgb(255,91,91,96)) 1
    Place-Window 642 164
    $stage=[System.Windows.Controls.Canvas]::new();$stage.Width=602;$stage.Height=116;$stage.HorizontalAlignment='Center';$stage.VerticalAlignment='Center';$root.Children.Add($stage)|Out-Null
    $card=New-RoundedBorder 22 (Brush $Background 1);$card.Width=496;$card.Height=82;$card.Opacity=0;$cardT=Add-Transform $card 0 .5;$cardT.Scale.ScaleX=.08;[System.Windows.Controls.Canvas]::SetLeft($card,86);[System.Windows.Controls.Canvas]::SetTop($card,17);$stage.Children.Add($card)|Out-Null
    $cg=[System.Windows.Controls.Grid]::new();$cg.Margin=[System.Windows.Thickness]::new(78,8,20,8);$card.Child=$cg
    $detail=if($kind -eq 'download' -and $subtitle){$subtitle}elseif($body){$body}else{$subtitle};$copy=Create-TextStack $title $detail 372 16.5 12.5;$copy.Heading.Foreground=$TextBrush;$copy.Detail.Foreground=$SubtleBrush;$copy.Stack.Opacity=0;$copyT=Add-Transform $copy.Stack;$cg.Children.Add($copy.Stack)|Out-Null
    $tile=New-RoundedBorder 28 (Brush $Accent 1);$tile.Width=90;$tile.Height=90;$tile.Opacity=0;$tileT=Add-Transform $tile;[System.Windows.Controls.Canvas]::SetLeft($tile,67);[System.Windows.Controls.Canvas]::SetTop($tile,12);$stage.Children.Add($tile)|Out-Null
    $tg=[System.Windows.Controls.Grid]::new();$tile.Child=$tg;$art=New-PayloadImageMulti @($image,$imageRemote) 66 66 18
    if($art){$art.HorizontalAlignment='Center';$art.VerticalAlignment='Center';$tg.Children.Add($art)|Out-Null}elseif($kind -eq 'achievement'){$tr=Icon-Trophy (Brush $White .98) 58;$tr.HorizontalAlignment='Center';$tr.VerticalAlignment='Center';$tg.Children.Add($tr)|Out-Null}else{$tg.Children.Add((New-FluentGlyph $kind (Brush $White .98) 29))|Out-Null}
    $enterMs=980;$exitMs=540
    $enterAction={Begin-Opacity $tile 0 1 170 'quad-out' 0;Begin-SXFrames $tileT.Scale @((KF .54 0),(KF 1.15 310 'back-out'),(KF .97 480 'quad-out'),(KF 1 650 'quad-out'));Begin-SYFrames $tileT.Scale @((KF .54 0),(KF 1.15 310 'back-out'),(KF .97 480 'quad-out'),(KF 1 650 'quad-out'));Begin-Opacity $card 0 1 130 'quad-out' 230;Begin-SXFrames $cardT.Scale @((KF .08 210),(KF .82 520 'quint-out'),(KF 1.02 720 'back-out'),(KF 1 850 'quad-out'));Begin-Opacity $copy.Stack 0 1 210 'quad-out' 430;Begin-TX $copyT.Translate 14 0 320 'quint-out' 420}
    $exitAction={Begin-OpacityTo $copy.Stack 0 140 'cubic-in' 0;Begin-TXTo $copyT.Translate -10 190 'cubic-in' 0;Begin-SXTo $cardT.Scale .08 270 'quint-in' 100;Begin-OpacityTo $card 0 120 'cubic-in' 310;Begin-SXTo $tileT.Scale .55 220 'quint-in' 290;Begin-SYTo $tileT.Scale .55 220 'quint-in' 290;Begin-OpacityToClose $tile 0 150 'cubic-in' 340}
}
elseif ($theme -eq "android16") {
    # Android/Material: squircle first, then an anchored tonal pill morphs open.
    Place-Window 590 142
    $stage=[System.Windows.Controls.Canvas]::new();$stage.Width=540;$stage.Height=96;$stage.HorizontalAlignment="Center";$stage.VerticalAlignment="Center";$root.Children.Add($stage)|Out-Null
    $panel=New-RoundedBorder 30 (Gradient-Brush $Background (Mix-Color $Background $Accent .10) 0);$panel.Width=510;$panel.Height=88;$panel.Opacity=0;$pt=Add-Transform $panel .075 .5;$pt.Scale.ScaleX=.12;$panel.BorderThickness=[System.Windows.Thickness]::new(1);$panel.BorderBrush=Brush (Mix-Color $Background $Text .22) .34;[System.Windows.Controls.Canvas]::SetLeft($panel,15);[System.Windows.Controls.Canvas]::SetTop($panel,4);$stage.Children.Add($panel)|Out-Null
    $pg=[System.Windows.Controls.Grid]::new();$pg.Margin=[System.Windows.Thickness]::new(78,8,20,8);$panel.Child=$pg;$detail=if($kind -eq "download" -and $subtitle){$subtitle}elseif($body){$body}else{$subtitle};$copy=Create-TextStack $title $detail 405 16 13;$copy.Stack.Opacity=0;$pg.Children.Add($copy.Stack)|Out-Null
    $icon=New-RoundedBorder 19 (Brush (Mix-Color $Background $Accent .30));$icon.Width=56;$icon.Height=56;$icon.Opacity=0;$it=Add-Transform $icon;[System.Windows.Controls.Canvas]::SetLeft($icon,30);[System.Windows.Controls.Canvas]::SetTop($icon,20);$stage.Children.Add($icon)|Out-Null
    $ig=[System.Windows.Controls.Grid]::new();$icon.Child=$ig;$art=New-PayloadImageMulti @($image,$imageRemote) 56 56 19;if($art){$ig.Children.Add($art)|Out-Null}elseif($kind -eq 'achievement'){$tr=Icon-Trophy $AccentBrush 48;$tr.HorizontalAlignment='Center';$tr.VerticalAlignment='Center';$ig.Children.Add($tr)|Out-Null}else{$gl=New-FluentGlyph $kind $AccentBrush 24;$ig.Children.Add($gl)|Out-Null}
    $sweep=[System.Windows.Controls.Border]::new();$sweep.Width=54;$sweep.Height=84;$sweep.Opacity=0;$sweep.Background=Brush $White .08;$sweep.RenderTransform=[System.Windows.Media.SkewTransform]::new(-16,0);[System.Windows.Controls.Canvas]::SetLeft($sweep,24);[System.Windows.Controls.Canvas]::SetTop($sweep,6);$stage.Children.Add($sweep)|Out-Null;$swT=Add-Transform $sweep
    $enterMs=820;$exitMs=520
    $enterAction={Begin-Opacity $icon 0 1 180 "quad-out" 0;Begin-SXFrames $it.Scale @((KF .76 0),(KF 1.09 320 "back-out"),(KF 1 500 "quad-out"));Begin-SYFrames $it.Scale @((KF .76 0),(KF 1.09 320 "back-out"),(KF 1 500 "quad-out"));Begin-Opacity $panel 0 1 140 "quad-out" 110;Begin-SXFrames $pt.Scale @((KF .12 100),(KF .78 390 "quint-out"),(KF 1.02 620 "back-out"),(KF 1 760 "quad-out"));Begin-Opacity $copy.Stack 0 1 220 "quad-out" 430;Begin-OpacityFrames $sweep @((KF 0 0),(KF .36 220 "quad-out"),(KF .18 520),(KF 0 800 "quad-out"));Begin-TX $swT.Translate -20 470 700 "cubic-out" 130}
    $exitAction={Begin-OpacityTo $copy.Stack 0 150 "cubic-in" 0;Begin-SXTo $pt.Scale .12 350 "quint-in" 100;Begin-SXTo $it.Scale .82 270 "cubic-in" 250;Begin-SYTo $it.Scale .82 270 "cubic-in" 250;Begin-OpacityTo $panel 0 160 "cubic-in" 330;Begin-OpacityToClose $icon 0 180 "cubic-in" 340}
}
else {
    # Playhub: one glass surface only. No nested translucent rectangle and no
    # residual primitive. The lens leads, the single panel blooms from it, then closes cleanly.
    Place-Window 650 150
    $stage=[System.Windows.Controls.Canvas]::new();$stage.Width=610;$stage.Height=108;$stage.HorizontalAlignment='Center';$stage.VerticalAlignment='Center';$root.Children.Add($stage)|Out-Null
    $panel=New-RoundedBorder 30 (Gradient-Brush ([System.Windows.Media.Color]::FromArgb(165,$Background.R,$Background.G,$Background.B)) ([System.Windows.Media.Color]::FromArgb(70,255,255,255)) 0);$panel.Width=88;$panel.Height=96;$panel.Opacity=0;$panel.BorderThickness=[System.Windows.Thickness]::new(1);$panel.BorderBrush=Brush $White .30;[System.Windows.Controls.Canvas]::SetLeft($panel,44);[System.Windows.Controls.Canvas]::SetTop($panel,6);$stage.Children.Add($panel)|Out-Null
    $shadow=[System.Windows.Media.Effects.DropShadowEffect]::new();$shadow.BlurRadius=18;$shadow.ShadowDepth=6;$shadow.Opacity=.22;$shadow.Color=[System.Windows.Media.Colors]::Black;$panel.Effect=$shadow
    $pg=[System.Windows.Controls.Grid]::new();$pg.ClipToBounds=$true;$pg.Margin=[System.Windows.Thickness]::new(94,10,22,10);$panel.Child=$pg
    $detail=if($kind -eq 'download' -and $subtitle){$subtitle}elseif($body){$body}else{$subtitle};$copy=Create-TextStack $title $detail 390 16.5 12.5;$copy.Stack.Opacity=0;$copyT=Add-Transform $copy.Stack;$pg.Children.Add($copy.Stack)|Out-Null
    $lens=New-RoundedBorder 27 (Gradient-Brush ([System.Windows.Media.Color]::FromArgb(170,255,255,255)) ([System.Windows.Media.Color]::FromArgb(104,$Accent.R,$Accent.G,$Accent.B)) 0);$lens.Width=76;$lens.Height=76;$lens.Opacity=0;$lensT=Add-Transform $lens;$lens.BorderThickness=[System.Windows.Thickness]::new(1);$lens.BorderBrush=Brush $White .34;[System.Windows.Controls.Canvas]::SetLeft($lens,50);[System.Windows.Controls.Canvas]::SetTop($lens,16);$stage.Children.Add($lens)|Out-Null
    $lg=[System.Windows.Controls.Grid]::new();$lens.Child=$lg;$art=New-PayloadImageMulti @($image,$imageRemote) 58 58 18
    if($art){$art.HorizontalAlignment='Center';$art.VerticalAlignment='Center';$lg.Children.Add($art)|Out-Null}elseif($kind -eq 'achievement'){$tr=Icon-Trophy (Brush $Text .92) 50;$tr.HorizontalAlignment='Center';$tr.VerticalAlignment='Center';$lg.Children.Add($tr)|Out-Null}else{$lg.Children.Add((New-FluentGlyph $kind (Brush $Text .92) 24))|Out-Null}
    $enterMs=1040;$exitMs=610
    $enterAction={Begin-Opacity $lens 0 1 180 'quad-out' 0;Begin-SXFrames $lensT.Scale @((KF .58 0),(KF 1.10 320 'back-out'),(KF 1 500 'quad-out'));Begin-SYFrames $lensT.Scale @((KF .58 0),(KF 1.10 320 'back-out'),(KF 1 500 'quad-out'));Begin-Width $panel 88 550 520 'quint-out' 360;Begin-Opacity $panel 0 1 170 'quad-out' 610;Begin-TX $lensT.Translate 0 8 520 'quint-out' 360;Begin-Opacity $copy.Stack 0 1 220 'quad-out' 690;Begin-TX $copyT.Translate 16 0 320 'quint-out' 670}
    $exitAction={Begin-OpacityTo $copy.Stack 0 140 'cubic-in' 0;Begin-TXTo $copyT.Translate -10 190 'cubic-in' 0;Begin-OpacityTo $panel 0 120 'cubic-in' 110;Begin-WidthTo $panel 88 320 'quint-in' 250;Begin-TXTo $lensT.Translate 0 260 'quint-in' 390;Begin-SXTo $lensT.Scale .56 200 'cubic-in' 430;Begin-SYTo $lensT.Scale .56 200 'cubic-in' 430;Begin-OpacityToClose $lens 0 140 'cubic-in' 500}
}
$window.Add_SourceInitialized({
    try {
        $helper=[System.Windows.Interop.WindowInteropHelper]::new($window)
        $hwnd=$helper.Handle
        $style=[PhnWin32]::GetWindowLongPtr($hwnd,[PhnWin32]::GWL_EXSTYLE).ToInt64()
        $style=$style -bor [PhnWin32]::WS_EX_TRANSPARENT -bor [PhnWin32]::WS_EX_TOOLWINDOW -bor [PhnWin32]::WS_EX_NOACTIVATE
        [void][PhnWin32]::SetWindowLongPtr($hwnd,[PhnWin32]::GWL_EXSTYLE,[IntPtr]::new($style))
        [void][PhnWin32]::SetWindowPos($hwnd,[PhnWin32]::HWND_TOPMOST,0,0,0,0,[PhnWin32]::SWP_NOMOVE -bor [PhnWin32]::SWP_NOSIZE -bor [PhnWin32]::SWP_NOACTIVATE -bor [PhnWin32]::SWP_SHOWWINDOW)
        $source=[System.Windows.Interop.HwndSource]::FromHwnd($hwnd)
        $script:inputRejectHook=[System.Windows.Interop.HwndSourceHook]{
            param([IntPtr]$h,[int]$msg,[IntPtr]$wp,[IntPtr]$lp,[ref]$handled)
            if($msg -eq 0x0084){$handled.Value=$true;return [IntPtr](-1)} # HTTRANSPARENT
            if($msg -eq 0x0021){$handled.Value=$true;return [IntPtr](3)}  # MA_NOACTIVATE
            return [IntPtr]::Zero
        }
        $source.AddHook($script:inputRejectHook)
    } catch { Write-PhnLog "extended style error: $($_.Exception.Message)" }
})

# Audio stays independent from rendering and never opens an input/focus surface.
# MediaPlayer.Volume is limited to 0..1. For 101..200%, the plugin switches to a
# pre-mastered +6.02 dB target WAV. Each boosted asset is peak-limited to 98% full
# scale and ships with its measured clean RMS gain. The player then interpolates
# from the level that exactly matches 100% to the clean boosted master at 200%,
# keeping the slider monotonic without hard digital clipping/crackling.
$script:player=$null
try {
    $soundPath=[string]$Payload.sound_path
    $boostPath=[string]$Payload.sound_boost_path
    $boostGainDb=[double]$Payload.sound_boost_gain_db
    $volume=[int]$Payload.sound_volume
    $volume=[Math]::Max(0,[Math]::Min(200,$volume))
    if ($volume -gt 0 -and -not [string]::IsNullOrWhiteSpace($soundPath) -and (Test-Path -LiteralPath $soundPath)) {
        $playPath=$soundPath
        $playerLevel=[Math]::Min(1.0,$volume/100.0)
        $usingBoost=$false
        if($volume -gt 100 -and $boostGainDb -gt 0 -and -not [string]::IsNullOrWhiteSpace($boostPath) -and (Test-Path -LiteralPath $boostPath)){
            $playPath=$boostPath
            $t=[Math]::Max(0.0,[Math]::Min(1.0,($volume-100)/100.0))
            # Never drive MediaPlayer to its exact 1.0 endpoint in the boosted branch.
            # On the target Windows audio path that final endpoint can trigger an
            # audible level anomaly. 0.92 keeps clean headroom while the pre-mastered
            # WAV still provides the >100% gain. Interpolate in dB so every step from
            # 100 to 200 remains strictly monotonic and continuous.
            $maxPlayerLevel=0.92
            $maxPlayerDb=20.0*[Math]::Log10($maxPlayerLevel)
            $maxNetGainDb=[Math]::Max(0.0,$boostGainDb+$maxPlayerDb)
            $desiredGainDb=$maxNetGainDb*$t
            $playerLevel=[Math]::Pow(10.0,(($desiredGainDb-$boostGainDb)/20.0))
            $playerLevel=[Math]::Max(0.0,[Math]::Min($maxPlayerLevel,$playerLevel))
            $usingBoost=$true
        }
        $soundUri=[Uri]::new((Resolve-Path -LiteralPath $playPath).Path,[UriKind]::Absolute)
        $script:player=[System.Windows.Media.MediaPlayer]::new()
        $script:player.Volume=$playerLevel
        $script:player.Open($soundUri)
        $script:player.Play()
        Write-PhnLog "audio volume requested=$volume level=$playerLevel boosted=$usingBoost cleanGainDb=$boostGainDb endpointCap=0.92 path=$playPath"
    }
} catch { Write-PhnLog "audio error: $($_.Exception.Message)" }

function Apply-GlobalEnterMotion {
    switch($motion) {
        "slide" {
            $gx=0;$gy=0
            if($position -like "*left"){$gx=-58}elseif($position -like "*right"){$gx=58}elseif($position -like "top*"){$gy=-46}else{$gy=46}
            Begin-TX $globalMotion.Translate $gx 0 430 "quint-out" 0; Begin-TY $globalMotion.Translate $gy 0 430 "quint-out" 0
        }
        "pop" { Begin-SX $globalMotion.Scale .88 1 440 "back-out" 0; Begin-SY $globalMotion.Scale .88 1 440 "back-out" 0 }
        "fade" { Begin-Opacity $root 0 1 280 "quad-out" 0 }
        "glass" { Begin-Opacity $root 0 1 340 "quad-out" 0; Begin-SX $globalMotion.Scale .95 1 520 "quint-out" 0; Begin-SY $globalMotion.Scale .95 1 520 "quint-out" 0 }
    }
}
function Apply-GlobalExitMotion {
    switch($motion) {
        "slide" {
            $gx=0;$gy=0
            if($position -like "*left"){$gx=-42}elseif($position -like "*right"){$gx=42}elseif($position -like "top*"){$gy=-34}else{$gy=34}
            Begin-TXTo $globalMotion.Translate $gx 320 "cubic-in" 0; Begin-TYTo $globalMotion.Translate $gy 320 "cubic-in" 0
        }
        "pop" { Begin-SXTo $globalMotion.Scale .92 330 "cubic-in" 0; Begin-SYTo $globalMotion.Scale .92 330 "cubic-in" 0 }
        "fade" { Begin-OpacityTo $root 0 300 "cubic-in" 0 }
        "glass" { Begin-OpacityTo $root 0 360 "cubic-in" 0; Begin-SXTo $globalMotion.Scale .96 360 "cubic-in" 0; Begin-SYTo $globalMotion.Scale .96 360 "cubic-in" 0 }
    }
}

# The window is shown inactive; all visual motion is handled by WPF animations.
$window.Show()
$window.Topmost=$true
Apply-GlobalEnterMotion
& $enterAction

# Xbox-style title swap is scheduled independently so the UI thread is never blocked.
if ($swapAction -ne $null -and $duration -gt 2700) {
    $script:swapTimer=[System.Windows.Threading.DispatcherTimer]::new([System.Windows.Threading.DispatcherPriority]::Normal)
    $script:swapTimer.Interval=[TimeSpan]::FromMilliseconds([Math]::Min(1650,[Math]::Max(1200,$enterMs+260)))
    $script:swapTimer.Add_Tick({ $script:swapTimer.Stop(); & $swapAction })
    $script:swapTimer.Start()
}

# Duration controls the requested total presentation time, but enter and exit are
# never truncated. If a very short duration is selected, hold time contracts first.
$hold=[Math]::Max(220,$duration-$enterMs-$exitMs)
$script:exitStarted=$false
$script:exitTimer=[System.Windows.Threading.DispatcherTimer]::new([System.Windows.Threading.DispatcherPriority]::Normal)
$script:exitTimer.Interval=[TimeSpan]::FromMilliseconds($enterMs+$hold)
$script:exitTimer.Add_Tick({
    $script:exitTimer.Stop()
    if($script:exitStarted -or $script:closed){return}
    $script:exitStarted=$true
    try {
        Apply-GlobalExitMotion
        & $exitAction
        # Completion handlers are authoritative. This guard only recovers from a
        # WPF animation callback that fails to fire; it runs after the full exit.
        $script:exitGuard=[System.Windows.Threading.DispatcherTimer]::new([System.Windows.Threading.DispatcherPriority]::Background)
        $script:exitGuard.Interval=[TimeSpan]::FromMilliseconds($exitMs+900)
        $script:exitGuard.Add_Tick({$script:exitGuard.Stop();if(-not $script:closed){Write-PhnLog "exit completion guard";Close-Overlay}})
        $script:exitGuard.Start()
    } catch { Write-PhnLog "exit animation error: $($_.Exception.Message)"; Close-Overlay }
})
$script:exitTimer.Start()

# Hard safety only; later than the complete enter/hold/exit timeline plus guard.
$script:safety=[System.Windows.Threading.DispatcherTimer]::new([System.Windows.Threading.DispatcherPriority]::Background)
$script:safety.Interval=[TimeSpan]::FromMilliseconds($enterMs+$hold+$exitMs+2600)
$script:safety.Add_Tick({$script:safety.Stop();if(-not $script:closed){Write-PhnLog "safety close";Close-Overlay}})
$script:safety.Start()

Write-PhnLog "show v7.0 theme=$theme kind=$kind requested=$duration enter=$enterMs hold=$hold exit=$exitMs renderTier=$renderTier"
[void]$window.Dispatcher.InvokeAsync({})
[System.Windows.Threading.Dispatcher]::Run()
exit 0
