---
title: "Supper is served"
date: 2025-06-29
authors: ["humpty/tony"]
tags: ["threat hunting", "reverse engineering", "C", "scavenger"]
description: "A deep dive into Supper (Interlock RAT) a fileless Windows backdoor linked to Vice Society clarifying public report errors and detailing its C2 protocol, encryption, self-deletion, and reverse shell behavior."
readingTime: 25
spotifyTrack: "12Ypr3PCVJ2i7Uwz93q1Vl"
---

Some thanks in alphabetical order for all those who supported this blogpost:
- [AptAmoeba](https://github.com/AptAmoeba)
- [Bakki](https://sillywa.re/)
- [Deluks](https://deluks2006.github.io/)
- [Dingusxmcgee](https://blog.dingusxmcgee.com/)
- [Josh](https://invokere.com/)
- Sean
- [Struppigel](https://x.com/struppigel)
- Xorist
- .Koozy
- And more generally the [InvokeRe community](https://invokere.com/) for being so encouraging

As part of my morning routine, I’ll usually check out what’s new in Malpedia. I’ve found the information posted there to be curated enough that I can usually make something useful out of the latest information that’s been added. Following my read on Supper, a somewhat new malware also known as the "Interlock Rat", I kind of got nerd sniped by the fact it was [known](https://www.fortinet.com/blog/threat-research/ransomware-roundup-interlock) to be operated by a somewhat well-established entity ([Vanilla Tempest/Vice Society](https://malpedia.caad.fkie.fraunhofer.de/actor/vanilla_tempest)). 

Information was a bit scarce on the actual backdoor, as most reports focused on the TTPs related to Vice Society’s operation rather than the backdoor itself.

After playing a bit with the sample, I quickly realized that some crucial information about it was missing. Some sources were reporting erroneous capabilities and omitting fairly critical information.

A Threat Intelligence firm, in their online blog, has mistakenly labeled Supper as being able to `Download a file from the C2 and save it on the disk` is actually a **reverse shell implementation** and what they identified as `Run rundll32.exe %temp%\[random int].dll,run %temp%\tmp[random int].dll` is actually a mechanism to erase itself from the filesystem. 

Simply put, **the report is mistaken**.

![The two misidentified capabilities](/images/supper-is-served/wrong-claims.png)

This specific blog post is written out of frustration from the lack of information about malware in public reports. Oftentimes, companies will leave out important contextual information that could help us better protect ourselves, which leaves us (defenders) either needing to reverse the sample ourselves or hoping they got their shit right so we can follow their lead. This situation **makes me want to eat rocks**.

In this article, I aim to explain clearly how Supper works by including technical details so that other defenders, like myself, can build better detection rules and why including **proofs to back claims**  is important to avoid making mistakes.

![](/images/supper-is-served/meme.png)
# Summary
The information publicly available on Supper essentially consists of this:
> Supper is a 64-bit Windows backdoor and tunnelling utility first observed in the wild in July 2024. This malware operates as both a Remote Access Trojan (RAT) and a SOCKS5 proxy, offering threat actors persistent access to infected systems and the ability to route arbitrary traffic through victim environments.

It does, however, miss the fact that the sample **is meant to operate in memory**, meaning it's essentially fileless. As my analysis shows, it actually only drops (on demand) a single file which is its encrypted config to file `C:\Users\<username>\AppData\Local\Temp\e35r4g.log`. 

When communicating, it starts by sending an HTTPS packet containing a small header and a JSON payload in the following format:
```json
{
	"iptarget": "49.12.69.80", // C2 IP
	"domain": "WORKGROUP", // Network hostname
	"pcname": "SIRIUSWIN11MRE", // Local hostname
	"runas": 1, // Integrity level
	"typef": 2, // Hardcoded value
	"veros": 15 // OS version
}
```
Once a victim has "announced" itself, it then falls back to a custom protocol composed of a 12-byte header that contains the encryption key for the 8-byte payload that follows it.  
Moreover, all of the commands executed by this malware sample are executed through `cmd.exe`.
# Header information/Context

Upon being loaded in [Detect-It-Easy](https://github.com/horsicq/Detect-It-Easy) , we can reasonably assess that it is most likely a 64-bit PE file, weighing in at approximately 176 KiB. A closer inspection of the PE headers reveals the following:
- The binary has the **DLL characteristic flag** enabled (`IMAGE_NT_HEADERS->IMAGE_FILE_HEADER->Characteristics`), suggesting it was likely intended to operate as a dynamic library.
- It lacks any **DLLCharacteristics** flags (`IMAGE_NT_HEADERS->IMAGE_OPTIONAL_HEADER->DllCharacteristics`), which may indicate an absence of certain security-related features (e.g., ASLR, DEP).
- The sample imports **four DLLs** (`Sections->Import`), which may imply basic system-level functionality and networking capability:
	- `ADVAPI32.dll`
	- `KERNEL32.dll`
	- `msvcrt.dll`
	- `WS2_32.dll`
![View of the sample's Imports in Detect-It-Easy](/images/supper-is-served/DIE-Import-view.png)
- It exposes a **single export** named `start`, accessible through the library name `socks.dll`. This detail—along with the export naming—may suggest that the file was originally named or intended to be used as **`socks.dll`**.
![View of the sample's Exports in Detect-It-Easy](/images/supper-is-served/DIE-Export-view.png)
# Decompilation
Before going too deep into the technical details of this specific sample I think it's worth talking about DLLs in general. I aim at having this blog be interesting for both entry-level analysts **and** more seasoned ones so if you're already familiar with how DLLs work, feel free to skip the next section.
## DllMain

Upon loading the binary, we're dropped into the `_start` function. We quickly notice that something seems off due to how empty it is. If you're primarily used to analyzing executables (as opposed to DLLs), this layout may initially be a bit confusing.
![Pre-analysis view of the sample's "DLLMain" function](/images/supper-is-served/DllMain-preanalysis.png)
What is most likely happening here is the presence of simple boilerplate code for DLLs. With a bit of digging in MSDN, we can readily find an [example](https://learn.microsoft.com/en-us/windows/win32/dlls/dllmain) of what such a structure typically looks like. `DllMain` serves as an initialization routine for a given DLL and is invoked via `LoadLibrary`. Microsoft defines DLLMain as such:
>An optional entry point into a dynamic-link library (DLL). When the system starts or terminates a process or thread, it calls the entry-point function for each loaded DLL using the first thread of the process. The system also calls the entry-point function for a DLL when it is loaded or unloaded using the [**LoadLibrary**](https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-loadlibrarya) and [**FreeLibrary**](https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-freelibrary) functions.

If the initialization is successful and the `fdwReason` parameter is set to `DLL_PROCESS_ATTACH` the function should return `TRUE` to indicate success, or `FALSE` otherwise.
```c
// DLLMain example from MSDN
BOOL WINAPI DllMain(
    HINSTANCE hinstDLL,  // handle to DLL module
    DWORD fdwReason,     // reason for calling function
    LPVOID lpvReserved )  // reserved
{
    // Perform actions based on the reason for calling.
    switch( fdwReason ) 
    { 
        case DLL_PROCESS_ATTACH:
         // Initialize once for each new process.
         // Return FALSE to fail DLL load.
            break;

        case DLL_THREAD_ATTACH:
         // Do thread-specific initialization.
            break;

        case DLL_THREAD_DETACH:
         // Do thread-specific cleanup.
            break;

        case DLL_PROCESS_DETACH:
        
            if (lpvReserved != nullptr)
            {
                break; // do not do cleanup if process termination scenario
            }
            
         // Perform any necessary cleanup.
            break;
    }
    return TRUE;  // Successful DLL_PROCESS_ATTACH.
}
```

Based on this, we can reasonably extrapolate that the code we’re observing likely resembles the following:
```c
BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) 
{ 
	switch (fdwReason) 
	{
		case DLL_PROCESS_ATTACH:
			return TRUE;
	}
	
	// Initialize random number generator 
	srand((unsigned int)_time64(NULL)); 
	// Store the HINSTANCE in a global for further use
	g_hInstance = hinstDLL; 
	return TRUE; 
}
```
## Initial thread execution
When loading the exported `start` function, we find ourselves navigating through some boilerplate code. To keep things simple, let’s break down what the “entry point” of this sample does.

After initializing the Winsock DLL through [`WSAStartup`](https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-wsastartup), the sample spawns a thread via [`_beginthread`](https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/beginthread-beginthreadex?view=msvc-170) .
![Exported start routine where we can see a call to "_beginthread"](/images/supper-is-served/start-preanalysis.png)
Understanding _how_ the function is invoked in this context is particularly useful, as it provides a reference for what behavior is expected. Since it is called via `_beginthread`, we can reasonably infer the following about `sub_100024a0`:
- It most likely uses either the `__cdecl` or `__clrcall` calling convention, given that `_beginthread` is used instead of `_beginthreadex`.
- The function is expected to receive a single argument, which should be a `void*` pointing to an argument list passed by `_beginthread` through its `_ArgList` parameter.

With this understanding, we can apply the necessary adjustments to `sub_100024a0` so that its High Level Intermediary Level ([HLIL](https://docs.binary.ninja/dev/bnil-hlil.html)) representation more accurately reflects this format:
![](/images/supper-is-served/beginthread-init-comms.png)
From there, we observe that the sample sleeps for a randomized duration and initiates communication with the C2 using a `sessionId` of `0xFFFF` (we'll revisit this detail later).
## Communications
The communication function relies on custom structures and involves the additional complexity of the Windows Sockets API which makes it a bit harder to analyze.

If we break down what this function does into a few bullet points, it looks something like this:
1. It checks if the payload is empty
    - If so, it returns `-1`
2.  It waits indefinitely for its global communication mutex
3. It checks whether the `SessionId` is either uninitialized (`0xFFFF`) or less than the maximum supported number of victims (`0x3FFFF`)
    - If so, it creates a new payload header, encrypts the payload, and masks the header
4. It communicates the encrypted header to the C2
5. It then validates that the `SessionId` table is not empty **and** that the current `SessionId` exceeds the supported maximum or if the session (victim) table is empty
6. It proceeds to send the payload
7. If everything is as expected, releases the global communications mutex
![The function that showcases the encryption routine of both the payload and the header before communicating to the C2](/images/supper-is-served/mw_communicatetoc2.png)
### Payload encryption
The _Supper_ malware implements a custom, stateful stream cipher operating in two distinct phases. First, it generates a 4-byte key by calling `rand()` twice to populate a `uint16_t` array. It then initializes an internal state using the first byte of this key.

During encryption, each byte of the payload is XORed with both the evolving state and a cyclically selected key byte (i.e., `position & 3`). The internal state evolves on a per-byte basis according to the formula:  
`state = (position + previous_state * 2) & 0xFF`,  
which causes each encrypted byte to depend on both its position and the preceding state value. This feedback mechanism ensures that even small changes in the plaintext produce cascading effects throughout the ciphertext.

The 12-byte network header embeds the encryption key, allowing the attacker to decrypt the payload using the same algorithm in reverse.

**Step-by-step process:**
1. Generate 4-byte random key and initialize state with first key byte
2. For each data byte: evolve state using `(position + state*2) & 0xFF`
3. Encrypt byte using: `data[i] ^ evolved_state ^ key[i%4]`
4. State carries forward to next byte
![The payload encryption routine used by Supper](/images/supper-is-served/payload-xor.png)
### Header masking
As, what is most likely, an attempt at evading network detection tools, the author of this sample has chosen to do a two step approach to obfuscate the header. It starts by XORing they keys used for the encryption with `0x4D4D4D4D` specifically and then proceeds to XOR the rest of the header with `0x4D4D4D4D4D4D4D`
![The header encryption routine including the decryption key](/images/supper-is-served/header-xor.png)
## C2 capabilities
After preparing itself to communicate, it's now ready to execute the commands it supports. Supper starts off by preparing it's global mutexes (thread safety baby!) and attempts to connect to the C2. If it fails to do so, it just returns. If not, we move into the good stuff.
To keep things a bit short, we'll focus on the more interesting functionalities. Here's a 10 000 foot overview of the capabilities:

| Command ID | Capability                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| 0x0        | Send health-check to C2 and reset connection                                                              |
| 0x1        | Continue receiving data                                                                                   |
| 0x2        | Terminate session if completed                                                                            |
| 0x3        | Spawns revshell                                                                                           |
| 0x4        | Unused                                                                                                    |
| 0x5        | Self-delete from being on disk                                                                            |
| 0x6        | Dump C2 config to file (encrypted)                                                                        |
| 0x7        | Update the C2 config                                                                                      |
| 0x8        | Cleanup & restart the "main" thread                                                                       |
| 0x9        | Execute a (single) command through `cmd.exe` and exfiltrate the output back to the C2 (command execution) |
### Initial connection
Once the malware knows it's got a steady foot after establishing network connectivity, it'll start by sending an initial "ack" to the C2 to establish a confirmation of infection and identify the victim with a timeout.

Before doing so however, it gathers the OS version and maps it to a custom value:
![The routine used to gather information on the victim host through multiple Windows APIs](/images/supper-is-served/os-version-mapping.png)
Where each version corresponds to this table:

| Custom ID | Real OS version                     | Condition                                                                            |
| --------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| 0x0       | Default fallback                    | N/A                                                                                  |
| 0x1       | Windows XP                          | `dwMajorVersion == 5 && dwMinorVersion == 1`                                         |
| 0x2       | Windows Server 2003 / XP x64        | `dwMajorVersion == 5 && dwMinorVersion == 2`                                         |
| 0x3       | Windows 2000                        | `dwMajorVersion == 5 && dwMinorVersion == 0`                                         |
| 0x4       | Windows Vista (workstation)         | `dwMajorVersion == 6 && dwMinorVersion == 0` && product type check                   |
| 0x5       | Windows 7 (workstation)             | `dwMajorVersion == 6 && dwMinorVersion == 1` && product type check                   |
| 0x6       | Windows 8 (workstation)             | `dwMajorVersion == 6 && dwMinorVersion == 2` && product type check                   |
| 0x7       | Windows 8.1 (workstation)           | `dwMajorVersion == 6 && dwMinorVersion == 3` && product type check                   |
| 0x8       | Windows 8 (server)                  | `dwMajorVersion == 6 && dwMinorVersion == 2` && product type _not_ checked           |
| 0x9       | Windows 8.1 (server)                | `dwMajorVersion == 6 && dwMinorVersion == 3` and product type is **not** workstation |
| 0xA       | Generic Windows 6.x fallback        | `dwMajorVersion == 6` but no minor version match (fallback case)                     |
| 0xC       | Windows 10 (build ≥ 14393)          | `dwMajorVersion == 10 && dwMinorVersion == 0 && dwBuildNumber >= 14393`              |
| 0xD       | Windows 10 (build > 17762)          | `dwBuildNumber > 17762`                                                              |
| 0xE       | Windows 11 (build > 20347)          | `dwBuildNumber > 20347`                                                              |
| 0xF       | Windows 10 fallback (build < 22000) | `dwMajorVersion == 10 && dwMinorVersion == 0 && dwBuildNumber < 0x55f0`              |
It then proceeds with it's current integrity level (the decompilation here is a but wonky, not sure why but the you get the idea) with the default value of "UNTRUSTED":
![The routine used to gather information on the current integrity level of the running sample through multiple Windows APIs](/images/supper-is-served/integrity-level-mapping.png)
Where each integrity level corresponds to this mapping:

| Custom ID       | Real integrity level |
| --------------- | -------------------- |
| UNTRUSTED (0x0) | 0x0                  |
| LOW (0x1)       | 0x1000               |
| MEDIUM (0x2)    | 0x2000               |
| HIGH (0x3)      | 0x3000               |
| SYSTEM (0x4)    | 0x4000               |
It then fetches two important pieces of information:
- The network hostname of the victim with a default/fallback value of `WORKGROUP`
- The local hostname of the victim with a default/fallback value of `SIRIUSWIN11MRE`
Finally, it slaps all of this together into a JSON string formatted as such: 

```json
{
	"iptarget": "49.12.69.80", // C2 IP
	"domain": "WORKGROUP", // Network hostname
	"pcname": "SIRIUSWIN11MRE", // Local hostname
	"runas": 1, // Integrity level
	"typef": 2, // Hardcoded value
	"veros": 15 // OS version
}
```
Finally, the malware prepends a magic header of `0xDF691155` and sends the entire payload to the C2, using a timeout value of 300 seconds.

After this initial transmission, something notable occurs. _Supper_ receives an additional command that triggers one of three behaviors:
1. Deletes its presence from the filesystem while remaining resident in memory
2. Continues execution without erasing itself
3. **Exits immediately**

The third option, arguably the most interesting, is most likely a **kill switch**, designed to halt further activity in the event the Threat Actor (TA) decides to terminate the campaign.
![HLIL representation of how Supper builds the initial connection payload to identify itself](/images/supper-is-served/id-payload-prep.png)
### Self-deletion
Once it has made contact with the C2, the malware shifts its focus to establishing persistence. The method it uses to accomplish this is fairly clever.

By inspecting the global variables, we begin to notice a familiar pattern, it's an **embedded PE file**!
![Hexadecimal representation of the embedded PE file](/images/supper-is-served/embedded-pe-hex.png)
After extracting the raw bytes, saving them into a new file and opening it up in Detect-It-Easy we quickly see that it's a small DLL called "main.dll" with a single export called `run`.
![Analysis of the embedded PE file in Detect-It-Easy that showcases it's properties](/images/supper-is-served/DIE-embedded-dll.png)
Since it's a DLL, and similarly to our main payload, we see that it's DLLMain starts by sleeping for a bit.
![DLLMain of the embedded PE](/images/supper-is-served/dllmain-embedded-pe.png)
It's single export, `run`, a just a [thunk](https://en.wikipedia.org/wiki/Thunk) for `remove`.
![](/images/supper-is-served/remove-thunk.png)

If we go back into our original sample, we see it does a few things with that embedded little DLL. Simply put, it does the following:

1. It starts by retrieving its current file path using `GetModuleFileNameA`, referencing its own `DOS_Header`
2. It generates a new file path containing a random value
3. It opens this new file
4. Writes the embedded DLL into it
5. Constructs a command-line string that runs the embedded DLL via `rundll32.exe`, specifying the random path, the `run` export, and finally **its own path** as an argument
6. It then executes this new command—effectively wiping itself in the process
![HLIL representation of how Supper leverages it's embedded PE to self-delete from the filesystem](/images/supper-is-served/wipe-self-from-fs.png)
**At this point, we can reasonably conclude that the sample transitions to living entirely in memory.**
### Reverse shell
To execute a "proper" reverse shell, Supper does a few cool tricks to keep everything fileless.
#### Preparing it's child process
Before running any command, it'll start creating a new session and creating a child process running `cmd.exe` while **saving it's `stdin` and `stdout` handles to a custom structure** (this is important for the next steps). We can also note that the child process is create with the `CREATE_NO_WINDOW` (`0x08000000`) `dwCreationFlag` which makes sure that no window pops up.
![](/images/supper-is-served/child-process-spawn.png)
#### IO forwarding
Once the child has spawned successfully, it triggers a new thread that will act take care of forwarding the IO from the child process back to the C2.
![HLIL representation of the IO forwarding routine](/images/supper-is-served/io-forwarder.png)
#### Code execution
It then continues by setting the reverse shell code page to `65001` (UTF-8) and starts writing the command directly to the IO of the child process through `mw_WriteFile`
![](/images/supper-is-served/page-code-change.png)
#### Public report confusion
The `WriteFile` here seems to have confused a few analysts as a few reports mentioned this as a capability to "download and execute a file" while it's actually not writing anything to a file. It's simply leveraging `WriteFile` as a way to "type" into `cmd.exe`.
Once no more bytes need to be written to the child process, the program just goes back into listening mode.
![](/images/supper-is-served/bad-guess-writefile.png)
### Config dump
The dump process is fairly simple. It does the following:
1.  Build a file path to `C:\Users\<username>\AppData\Local\Temp\e35r4g.log`
2. It opens the file
3. Converts a list of embedded IPs into their binary representation
4. Compare each observed IP (in the arguments of this function) to the list of embedded IPs
5. Adds the "allowed" (embedded) IPs to a buffer
6. Encrypts the header with the known custom encryption routine, dumps the encryption key at the top of the file and writes the encrypted payload
Interestingly enough, this means that should a victim get a hold on this file they could **decrypt the config by using the key at the top of the file**.
![](/images/supper-is-served/config_dump.png)
### Command execution
The way Supper does command execution is fairly simple.
1. It starts by creating a log path with the format `C:\Users\Public\{ulong_value}.log` 
2. It creates the command string through `cmd.exe /c {command} 1> {logpath} 2>&1` which essentially sums up to "run this command, save `stdout` to the log file and ignore the rest"
3. It creates the new process
4. Waits for it to finish
5. Reads the child process' output & saves it into a buffer (in memory)
6. Wipes the log file
![](/images/supper-is-served/exec-cmd-and-log.png)

## General execution
If the initial call to it's "main" routine fails, Supper will try 3 more times to get itself running. Failures could be a few things including lack of network connectivity or errors when trying to interact with the filesystem.
![Initial loop that retries if "mw_main" fails](/images/supper-is-served/first-retry-loop.png)
If after 3 attempts it still fails, it moves into trying to leverage it's local config at `C:\Users\<username>\AppData\Local\Temp\e35r4g.log` by decrypting it with the key located at the first 4 bytes of the file.
![HLIL representation of the config dump load and decryption](/images/supper-is-served/config-read.png)
Once the static config is loaded, it retries to spawn the "main" routine once per IP. If it fails at this once again, it leverages the variable `exponentialBackoff` that stores a retry count which is used to determine how long it should sleep before trying once more.
![View of the full "start" routine that retries with an exponential backoff on multiple failed attempts to spawn "mw_main"](/images/supper-is-served/global-loop.png)
# IOCs & Rules

## IOCs

- 64.94.84.85
- 49.12.69.80
- 96.62.214.11
## Yara
This specific Yara rule was built with flexibility in mind. I tried to focus on functionality rather than simplicity so I'm not looking for strings that can easily be changed such as the ones in the header or the magic number is uses.

```yara
rule Supper_Backdoor {
    meta:
        author = "Cedric Brisson"
        date = "2025-06-28"
        version = "1.0"
        description = "Detects Supper backdoor based on PE characteristics and strings"
        reference = "https://c-b.io/2025-06-29+-+Supper+is+served"
        hash = "61f8224108602eb1f74cb525731c9937c2ffd9a7654cb0257624507c0fdb5610"
        tlp = "WHITE"
        severity = "Critical"

    strings:
        // Atomic parts of the original $header_xor_routine
        // Looks for the specific XOR key 0x4D4D4D4D used with an immediate arithmetic opcode
        // xor xmm1, dword 0x4d4d4d4d
        // movq xmm1, qword that points to 0x4d4d4d4d4d4d4d4d
        // pxor xmm0, xmm1
        // movq qword[rcx], xmm0
        $code_xor_key = { 81 ?? ?? 4d 4d 4d 4d }
        $code_pxor_movq = { 66 0f ef ?? [0-8] 66 0f d6 }
        $code_movq_from_mem = { f3 0f 7e 0d }

        // Atomic parts of the original $payload_encryption_routine
        // movzx ecx, byte ptr [eax+ebx]
        // and ecx, 3
        // xor dl, byte ptr [esi+ecx]
        $code_payload_lookup = { 0f b6 14 03 }
        $code_payload_and = { 41 83 e1 03 }
        $code_payload_xor = { 42 32 14 0e }

        $str1 = "chcp 650"
        $str2 = "cmd.exe /c"

    condition:
    (
      // High confidence: find XOR key and part of the encryption routine
        ( $code_xor_key and 1 of ( $code_payload_*) ) and

      // Medium confidence: Find a unique textual string and any code snippet
        (1 of ($str*) and 1 of ($code_*) )
    )
}
```