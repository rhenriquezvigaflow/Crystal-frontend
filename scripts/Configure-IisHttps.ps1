#Requires -Version 5.1
#Requires -RunAsAdministrator

[CmdletBinding()]
param(
    [string]$SiteName = "",
    [string]$PhysicalPath = "C:\inetpub\wwwroot\CrystalScada",
    [string]$HostName = $env:COMPUTERNAME,
    [ValidateRange(1, 65535)]
    [int]$HttpsPort = 443,
    [string]$CertificateThumbprint = "",
    [string]$PfxPath = "",
    [SecureString]$PfxPassword,
    [switch]$CreateSelfSignedCertificate,
    [switch]$OpenFirewall,
    [string]$ExportCerPath = "",
    [switch]$DeployWebConfig,
    [string]$SourceWebConfig = "C:\WebCrystalScada\crystal-frontend\dist\web.config"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Normalize-Thumbprint {
    param([string]$Value)
    return ($Value -replace "\s", "").ToUpperInvariant()
}

function Resolve-IisSite {
    param(
        [string]$RequestedSiteName,
        [string]$RequestedPhysicalPath
    )

    if ($RequestedSiteName) {
        $site = Get-Website -Name $RequestedSiteName -ErrorAction SilentlyContinue
        if (-not $site) {
            throw "No existe el sitio IIS '$RequestedSiteName'. Revise con: Get-Website"
        }
        return $site
    }

    $targetPath = [System.IO.Path]::GetFullPath(
        [Environment]::ExpandEnvironmentVariables($RequestedPhysicalPath)
    ).TrimEnd("\")

    $matches = @(
        Get-Website | Where-Object {
            $candidatePath = [System.IO.Path]::GetFullPath(
                [Environment]::ExpandEnvironmentVariables($_.PhysicalPath)
            ).TrimEnd("\")
            $candidatePath -ieq $targetPath
        }
    )

    if ($matches.Count -ne 1) {
        $available = (Get-Website | ForEach-Object {
            "'$($_.Name)' -> $($_.PhysicalPath)"
        }) -join [Environment]::NewLine
        throw @"
No se pudo identificar un unico sitio IIS para '$targetPath'.
Indique -SiteName. Sitios disponibles:
$available
"@
    }

    return $matches[0]
}

function Test-CertificateDnsName {
    param(
        [System.Security.Cryptography.X509Certificates.X509Certificate2]$Certificate,
        [string]$ExpectedHostName
    )

    $dnsNames = @(
        $Certificate.DnsNameList | ForEach-Object { $_.Unicode }
    )
    if ($dnsNames -icontains $ExpectedHostName) {
        return $true
    }

    $certificateDnsName = $Certificate.GetNameInfo(
        [System.Security.Cryptography.X509Certificates.X509NameType]::DnsName,
        $false
    )
    return $certificateDnsName -ieq $ExpectedHostName
}

function Find-CertificateForHost {
    param([string]$ExpectedHostName)

    return @(
        Get-ChildItem Cert:\LocalMachine\My |
            Where-Object {
                $_.HasPrivateKey -and
                $_.NotBefore -le (Get-Date) -and
                $_.NotAfter -gt (Get-Date) -and
                (Test-CertificateDnsName -Certificate $_ -ExpectedHostName $ExpectedHostName)
            } |
            Sort-Object NotAfter -Descending
    ) | Select-Object -First 1
}

$HostName = $HostName.Trim().TrimEnd(".").ToLowerInvariant()
if (-not $HostName) {
    throw "HostName no puede estar vacio."
}

$certificateSourceCount = @(
    [bool]$CertificateThumbprint,
    [bool]$PfxPath,
    [bool]$CreateSelfSignedCertificate
).Where({ $_ }).Count

if ($certificateSourceCount -gt 1) {
    throw "Use solo una fuente: -CertificateThumbprint, -PfxPath o -CreateSelfSignedCertificate."
}

Import-Module WebAdministration
$site = Resolve-IisSite -RequestedSiteName $SiteName -RequestedPhysicalPath $PhysicalPath

$certificate = $null
if ($PfxPath) {
    $resolvedPfxPath = (Resolve-Path -LiteralPath $PfxPath).Path
    if (-not $PfxPassword) {
        $PfxPassword = Read-Host "Contrasena del PFX" -AsSecureString
    }
    $certificate = Import-PfxCertificate `
        -FilePath $resolvedPfxPath `
        -CertStoreLocation Cert:\LocalMachine\My `
        -Password $PfxPassword |
        Where-Object { $_.HasPrivateKey } |
        Select-Object -First 1
} elseif ($CreateSelfSignedCertificate) {
    $certificate = New-SelfSignedCertificate `
        -DnsName $HostName `
        -CertStoreLocation Cert:\LocalMachine\My `
        -FriendlyName "Crystal SCADA HTTPS" `
        -NotAfter (Get-Date).AddYears(1) `
        -KeyAlgorithm RSA `
        -KeyLength 2048 `
        -HashAlgorithm SHA256 `
        -KeyExportPolicy Exportable `
        -Type SSLServerAuthentication
} elseif ($CertificateThumbprint) {
    $normalizedThumbprint = Normalize-Thumbprint -Value $CertificateThumbprint
    $certificate = Get-Item "Cert:\LocalMachine\My\$normalizedThumbprint" -ErrorAction SilentlyContinue
} else {
    $certificate = Find-CertificateForHost -ExpectedHostName $HostName
}

if (-not $certificate) {
    throw @"
No se encontro un certificado con clave privada para '$HostName'.
Importe un PFX, indique -CertificateThumbprint o use -CreateSelfSignedCertificate.
"@
}
if (-not $certificate.HasPrivateKey) {
    throw "El certificado seleccionado no tiene clave privada y no puede usarse en IIS."
}
if ($certificate.NotAfter -le (Get-Date)) {
    throw "El certificado seleccionado esta vencido desde $($certificate.NotAfter)."
}
if (-not (Test-CertificateDnsName -Certificate $certificate -ExpectedHostName $HostName)) {
    throw "El certificado no incluye '$HostName' en CN/SAN. No se creara un binding invalido."
}

$bindingInformation = "*:${HttpsPort}:$HostName"
$binding = Get-WebBinding -Name $site.Name -Protocol "https" |
    Where-Object { $_.bindingInformation -ieq $bindingInformation } |
    Select-Object -First 1

if (-not $binding) {
    New-WebBinding `
        -Name $site.Name `
        -Protocol "https" `
        -IPAddress "*" `
        -Port $HttpsPort `
        -HostHeader $HostName `
        -SslFlags 1

    $binding = Get-WebBinding -Name $site.Name -Protocol "https" |
        Where-Object { $_.bindingInformation -ieq $bindingInformation } |
        Select-Object -First 1
}

if (-not $binding) {
    throw "IIS no devolvio el binding HTTPS recien creado."
}

$binding.AddSslCertificate($certificate.Thumbprint, "My")

if ($OpenFirewall) {
    $firewallRuleName = "Crystal SCADA HTTPS $HttpsPort"
    $existingRule = Get-NetFirewallRule -DisplayName $firewallRuleName -ErrorAction SilentlyContinue
    if (-not $existingRule) {
        New-NetFirewallRule `
            -DisplayName $firewallRuleName `
            -Direction Inbound `
            -Action Allow `
            -Protocol TCP `
            -LocalPort $HttpsPort `
            -Profile Domain,Private
    }
}

if ($ExportCerPath) {
    $resolvedExportPath = [System.IO.Path]::GetFullPath($ExportCerPath)
    $exportDirectory = Split-Path -Parent $resolvedExportPath
    if (-not (Test-Path -LiteralPath $exportDirectory)) {
        New-Item -ItemType Directory -Path $exportDirectory -Force | Out-Null
    }
    Export-Certificate -Cert $certificate -FilePath $resolvedExportPath -Force | Out-Null
}

$deployedWebConfigPath = ""
if ($DeployWebConfig) {
    $resolvedSourceWebConfig = (Resolve-Path -LiteralPath $SourceWebConfig).Path
    $sitePhysicalPath = [System.IO.Path]::GetFullPath(
        [Environment]::ExpandEnvironmentVariables($site.PhysicalPath)
    )
    if (-not (Test-Path -LiteralPath $sitePhysicalPath -PathType Container)) {
        throw "La ruta fisica del sitio no existe: $sitePhysicalPath"
    }

    $deployedWebConfigPath = Join-Path $sitePhysicalPath "web.config"
    if ($resolvedSourceWebConfig -ine $deployedWebConfigPath) {
        Copy-Item `
            -LiteralPath $resolvedSourceWebConfig `
            -Destination $deployedWebConfigPath `
            -Force
    }
}

$freshBinding = Get-WebBinding -Name $site.Name -Protocol "https" |
    Where-Object { $_.bindingInformation -ieq $bindingInformation } |
    Select-Object -First 1

Write-Host ""
Write-Host "HTTPS configurado en IIS."
Write-Host "Sitio:       $($site.Name)"
Write-Host "URL:         https://${HostName}:$HttpsPort"
Write-Host "Certificado: $($certificate.Thumbprint)"
Write-Host "Vence:       $($certificate.NotAfter)"
Write-Host "Binding:     $($freshBinding.bindingInformation)"
if ($ExportCerPath) {
    Write-Host "CER publico: $resolvedExportPath"
}
if ($DeployWebConfig) {
    Write-Host "web.config:  $deployedWebConfigPath"
}
Write-Host ""
Write-Host "Siguiente paso: valide la URL sin usar -k ni ignorar errores."
