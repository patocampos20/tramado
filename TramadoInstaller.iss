; =============================================================================
;  Tramado — Pattern Studio
;  Script de instalación profesional para Inno Setup 6.x
;  Generado para: Windows 10/11 x64
;  Desarrollador:  Patricio Campos
;  Idea General:   Carolina Campos
;  Versión:        1.3.0
; =============================================================================
;
; INSTRUCCIONES DE USO
; ─────────────────────────────────────────────────────────────────────────────
; 1. Instala Inno Setup 6 desde:  https://jrsoftware.org/isdl.php
; 2. Compila el ejecutable primero desde el proyecto Electron:
;       npm run build && npx electron-builder --win
; 3. El ejecutable portable se generará en:  .\release\Tramado 1.3.0.exe
;    (o también puedes copiar el contenido de .\release\win-unpacked\ si usas nsis)
; 4. Abre Inno Setup Compiler y carga este archivo .iss
; 5. Presiona F9 (Compile) o usa Build > Compile
; 6. El instalador final se generará en:  .\installer_output\TramadoSetup_1.3.0.exe
; =============================================================================

#define MyAppName      "Tramado"
#define MyAppFullName  "Tramado — Pattern Studio"
#define MyAppVersion   "1.3.0"
#define MyAppPublisher "Carolina Campos"
#define MyAppURL       "https://tramado.app"
#define MyAppExeName   "Tramado.exe"
#define MyAppId        "{A7B3C9D1-E2F4-4A6B-8C0D-1E2F3A4B5C6D}"
;
; IMPORTANTE: Cambia la ruta de abajo para que apunte a donde está tu
; carpeta desempaquetada de Electron (release\win-unpacked)
; Si estás usando el .exe portable, reemplaza la carpeta por el archivo.
;
#define MySourceDir    "release\win-unpacked"

[Setup]
; Identificador único de la aplicación (no cambiar entre versiones)
AppId={{#MyAppId}
AppName={#MyAppFullName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppFullName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
AppCopyright=Copyright © 2026 Carolina Campos

; Destino de instalación por defecto
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppFullName}
DisableProgramGroupPage=yes

; Idioma y apariencia
ShowLanguageDialog=no

; Privilegios (user = sin necesitar administrador)
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

; Compresión y formato de salida
OutputDir=installer_output
OutputBaseFilename=TramadoSetup_{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes

; Ícono del instalador
; SetupIconFile=public\favicon.ico  ; Descomenta si tienes un .ico

; Metadatos de Windows
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppFullName} Installer
VersionInfoCopyright=Copyright © 2026 Carolina Campos
VersionInfoProductName={#MyAppFullName}
VersionInfoProductVersion={#MyAppVersion}

; Imagen lateral del wizard (opcional)
; WizardImageFile=installer_assets\wizard_banner.bmp
; WizardSmallImageFile=installer_assets\wizard_small.bmp

; Requisitos mínimos de Windows
MinVersion=10.0.17763

[Languages]
Name: "spanish";  MessagesFile: "compiler:Languages\Spanish.isl"

[CustomMessages]
spanish.AppIsRunning=Tramado está ejecutándose actualmente. Por favor ciérralo antes de continuar con la instalación.
spanish.AssocTitle=Asociar archivos .tramado con Tramado
spanish.AssocDesc=Abrir archivos .tramado (Patrones de Tramado) automáticamente con esta aplicación

[Tasks]
; Accesos directos
Name: "desktopicon";    Description: "{cm:CreateDesktopIcon}";         GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startmenuicon";  Description: "Crear acceso directo en el Menú Inicio"; GroupDescription: "{cm:AdditionalIcons}"
; Asociación de archivos .tramado
Name: "assocfiles";     Description: "{cm:AssocFileExtUserInstall,.tramado,Tramado Pattern Studio}"; GroupDescription: "Asociación de archivos:"

[Files]
; Copia todos los archivos del directorio desempaquetado de Electron
Source: "{#MySourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; Si prefieres usar el .exe portable en lugar de win-unpacked, descomenta la línea siguiente
; y comenta el Source de arriba:
; Source: "release\Tramado 1.3.0.exe"; DestDir: "{app}"; DestName: "{#MyAppExeName}"; Flags: ignoreversion

[Icons]
; Ícono en Menú de Inicio
Name: "{group}\{#MyAppFullName}";  Filename: "{app}\{#MyAppExeName}";  Comment: "Diseño de patrones textiles"
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"

; Ícono en el Escritorio (solo si se seleccionó la tarea)
Name: "{autodesktop}\{#MyAppFullName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; Comment: "Diseño de patrones textiles"

[Registry]
; ─────────────────────────────────────────────────────────────────────────────
; ASOCIACIÓN DE ARCHIVOS .tramado
; Esto permite que al hacer doble clic en un archivo .tramado, Windows abra
; Tramado automáticamente y le pase la ruta del archivo como argumento.
; ─────────────────────────────────────────────────────────────────────────────

; 1. Registrar la extensión .tramado
Root: HKA;  Subkey: "Software\Classes\.tramado";                           ValueType: string;  ValueName: "";         ValueData: "TramadoProject";                    Flags: uninsdeletevalue;  Tasks: assocfiles

; 2. Registrar el tipo de archivo "TramadoProject"
Root: HKA;  Subkey: "Software\Classes\TramadoProject";                     ValueType: string;  ValueName: "";         ValueData: "Tramado Pattern Studio Project";     Flags: uninsdeletekey;    Tasks: assocfiles
Root: HKA;  Subkey: "Software\Classes\TramadoProject\DefaultIcon";         ValueType: string;  ValueName: "";         ValueData: "{app}\{#MyAppExeName},0";            Tasks: assocfiles
Root: HKA;  Subkey: "Software\Classes\TramadoProject\shell\open\command";  ValueType: string;  ValueName: "";         ValueData: """{app}\{#MyAppExeName}"" ""%1""";   Tasks: assocfiles

; 3. Notificar a Windows Shell que los tipos de archivo cambiaron
Root: HKA;  Subkey: "Software\Classes\TramadoProject\shell\open";         ValueType: string;  ValueName: "FriendlyAppName";  ValueData: "Tramado Pattern Studio";     Tasks: assocfiles

; Registrar la app en "Programas predeterminados"
Root: HKA;  Subkey: "Software\{#MyAppPublisher}\{#MyAppName}";            ValueType: string;  ValueName: "InstallPath";      ValueData: "{app}";                      Flags: uninsdeletekey

[Run]
; Ejecutar la app después de instalar (opcional)
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#MyAppFullName}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Limpiar archivos generados por la app (caché, configuración temporal)
Type: filesandordirs; Name: "{localappdata}\tramado"

[Code]
// ─────────────────────────────────────────────────────────────────────────────
// Verificar si la app está corriendo antes de instalar/desinstalar
// ─────────────────────────────────────────────────────────────────────────────
function IsAppRunning(): Boolean;
var
  WbemLocator, WbemServices, WbemObjectSet: Variant;
  i: Integer;
begin
  Result := False;
  try
    WbemLocator := CreateOleObject('WbemScripting.SWbemLocator');
    WbemServices := WbemLocator.ConnectServer('', 'root\CIMV2', '', '');
    WbemObjectSet := WbemServices.ExecQuery('SELECT * FROM Win32_Process WHERE Name="Tramado.exe"');
    if not VarIsNull(WbemObjectSet) and not VarIsEmpty(WbemObjectSet) then
      Result := (WbemObjectSet.Count > 0);
  except
    Result := False;
  end;
end;

function InitializeSetup(): Boolean;
begin
  Result := True;
  if IsAppRunning() then begin
    MsgBox(CustomMessage('AppIsRunning'), mbError, MB_OK);
    Result := False;
  end;
end;

function InitializeUninstall(): Boolean;
begin
  Result := True;
  if IsAppRunning() then begin
    MsgBox(CustomMessage('AppIsRunning'), mbError, MB_OK);
    Result := False;
  end;
end;

// Notificar a Windows Shell para que actualice los íconos de archivos .tramado
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then begin
    RegWriteStringValue(HKA, 'Software\Classes\.tramado', '', 'TramadoProject');
  end;
end;
