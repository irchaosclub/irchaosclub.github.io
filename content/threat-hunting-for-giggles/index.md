---
title: "Threat hunting for shits and giggles"
date: 2024-11-28
authors: ["humpty/tony"]
tags: ["threat hunting", "reverse engineering", "dotnet"]
description: "Analyzing XWorm and tracking related infrastructure with hunt.io"
readingTime: 10
---

I'll start by saying this post is _not_ endorsed by [hunt.io](https://hunt.io/). I just happen to be a really big fan of what they're doing.
## Some hackers suck at OpSec
Not all hackers are the smartest. If you've ever played with [Shodan](https://shodan.io) or [Censys](https://censys.com), you've most likely come across open directories. What's an open dir? It's essentially when you expose the entire root of your website. It'll typically look something like this:

![Open directory example](/images/threat-hunting-for-giggles/open-directory-example.png)

As you'll see in this blogpost, sometimes hacker expose their entire `/home/user` directory which leads to some pretty interesting findings such as valid SSH keys, cobaltstrike configs and malware sample ripe with debug info. What a time to be alive!
## hunt.io
Here's how [hunt.io](https://hunt.io/) defines itself:
> Hunt.io is a service that provides threat intelligence data about observed network scanning and cyberattacks. This data is collected by a worldwide distributed network of sensors. All interactions with sensors are registered, analyzed, and used to create network host profiles.

One of their services, however, is specifically interesting from a "poking and proding the internet for fun" perspective. That's their [AttackCapture](https://hunt.io/features/attackcapture) service.
I've been using it for roughly 2 years and to be perfectly honest, I love it. It's simple, intuitive and it gives me just enough information for free that can I [FAFO](https://en.wiktionary.org/wiki/FAFO#English) on the internet.
When first logging in, you're greeted by a handy dandy dashboard that gives you some general information about the current landscape. This includes new C2s that have been ID'd, new open directories, new blogposts and all the stuff to keep you up to date with the "latest news" threat wise. It's obviously not exhaustive but I find it a simple and pretty useful.

![Hunt.io dashboard](/images/threat-hunting-for-giggles/hunt-io-dashboard.png)

If you take a look on the left of the image, you'll notice we have three main tabs which each contain a few goodies:
1. Search By IP Address
2. Advanced Search
3. AttackCapture
4. C2 Infrastructure
5. IOC Hunter
6. Global Sensors
7. Feeds
We'll focus on the one that gives us open dirs for now :)
### AttackCapture
When clicking on the AttackCapture tab, you'll land on a page that's chock-full of information. We get IP addresses/URLs, a number of file, a trigger and a first seen value. To the best of my knowledge (which ain't much), they're always ordered from newest to oldest.
![AttackCapture page](/images/threat-hunting-for-giggles/attackcapture-page.png)
### Triggers
Before delving too deep into the information provided to us, I think it's fair to establish what a trigger is. While I couldn't find official documentation describing how it works, I'm fairly confident it's simply, as the title suggests, what triggered that URL to be flagged as potentially malicious. We'll often notice the following categories:

- **hash_match**: When one or more of the files matches a known and catalogued hash. Although this is _usually_ reliable, [it's not perfect](https://detect-respond.blogspot.com/2022/04/stop-using-hashes-for-detection-and.html).
- Keyword found: When specific filename keywords match known offensive tools. This is probably the most unreliable off all triggers for the simple reason that filenames such as `Cover Vitamins&Nucleic Acid Colour.pdf` will match for tools like [Nuclei](https://github.com/projectdiscovery/nuclei). Just to be clear, I'm not shitting on their detection. I'm just saying this trigger is the most false positive prone one.
- Triage Community: These are simply IPs/domains that were submitted by the community as being known to be malicious. These tend to be pretty reliable (until some jackass decides to spam garbage I guess)
- urlhaus: As the name suggests, it's IPs/domains found by [urlhaus](https://urlhaus.abuse.ch/)
- IOC IPs from Abuse.ch: Same as urlhaus, it's all from [abuse.ch](https://abuse.ch/)
- tweet: You get the idea by now
- Cobalt Strike Scan Signature: Infra identified as a Cobalt Strike C2

I won't enumerate all of them but hopefully you've got a good idea of what all that means by now. If not, go grab a coffee or something.
P.S.: If someone at hunt.io is reading this, please normalize the casing of your triggers. It looks weird.
### Reviewing an entry

Upon clicking one of the IPs/domains, you'll see a nice list of files which you can interact with. More so, you'll also notice a bit of context such as the origin of the IP/domain and the total size of the directory.
![File listing view](/images/threat-hunting-for-giggles/file-listing-view.png)

More so, you'll notice you get a shit ton of tags (sometimes) that nudge you at why these files are potentially malicious. If you click on the three dots to the right, you'll also get presented a few options of things you can do with those files.
![File options menu](/images/threat-hunting-for-giggles/file-options-menu.png)

From there, we can copy the raw file URL (the one that actually points to the C2) but that's not always good. Maybe since it's been scanned, the malicious actors have taken it down. This is where the `Download File or Share` comes in pretty darn handy. TL;DR, hunt.io saves those files (and their copies if they change overtime) to an S3 bucket which allows us to get access to that file even if it "doesn't exist anymore". You can also download it as a password protected zip to make sure your AV doesn't come screaming at you for downloading malware.

Funnily enough, the Chrome.exe kinda reminded me of [an article](https://www.sonicwall.com/blog/fake-google-chrome-website-tricks-users-into-installing-malware) I saw online a little while back about threat actors (TAs) running a campaign to try and fool people into "downloading chrome" by convincing people to run an executable. In the article, the show that the malicious domain is `hxxps://google[.]tw[.]cn/` which could easily fool a ton of people.

Why not dive into it?
## Chrome.exe

Before going straight into reverse engineering, I think it's worth taking a bit of time to comprehend the context behind the binary we've collected. You obviously won't be able to understand _exactly_ what it does from the get-go but it'll most likely give us a few points such as where we should start, which tools we should use, if there's any clear signs that this is malware and stuff like that. It's not obligatory but I feel like it's good practice.
### Doing a bit of recon
To fully understand exactly what we're dealing with, let's load the binary into a solid tool that my [MRE certification](https://www.mosse-institute.com/certifications/mre-certified-reverse-engineer.html) taught me about: [PEStudio](https://www.winitor.com/download2). Simply put, PEStudio parses [PE files](https://en.wikipedia.org/wiki/Portable_Executable#:~:text=The%20Portable%20Executable%20(PE)%20format,systems%2C%20and%20in%20UEFI%20environments.) and it's header to establish what the file does (from a static perspective). This gives us insight into if the file imports or exports function, the binary type, plaintext strings, which sections are present and a ton more info. Very useful too, highly recommend it. Now lets load Chrome.exe into it.
![PEStudio overview](/images/threat-hunting-for-giggles/pestudio-overview.png)

While reviewing the results, a few things stood out. First, it's a well documented piece of malware. [VirtusTotal](https://virustotal.com) flags it as being detected by 57 AVs. Interestingly enough, however, is that's it's flagged as various strains that although somewhat similar work in different ways. These would be: Jalapeno, Bladabindi, XWorm, AsyncRAT & XWorm. We also notice a few mentions of MSIL which is good news because this would point towards a .NET binary which tends to be fairly easy to reverse engineer thanks to DNSpy. Finally, we also notice they've all been flagged somewhat recently (except for SentinelOne which seems to have been aware of it for 227 days).
![VirusTotal detections](/images/threat-hunting-for-giggles/virustotal-detections.png)
### DNSpy
Before delving in the actual reverse engineering, I think it's worth understand _why_ DNSpy works. In essence, for those who aren't aware, [DNSpy](https://github.com/dnSpy/dnSpy) is a tool that can be leveraged to reverse engineer [.NET](https://dotnet.microsoft.com/en-us/) binaries.

Unlike traditional compiled programs that get turned into raw machine code, .NET applications are compiled into Microsoft Intermediate Language (MSIL). MSIL is like a "blueprint" for the program, containing detailed instructions about how the application should run, as well as a ton of metadata about its structure. This metadata includes things like class names, methods, and even strings, making it easier to reverse-engineer than something written in C++ or assembly. MSIL essentially, to my understanding, One may be tempted to think MSIL is similar to assembly but in reality it's closer to bytecode than it is to x86 assembly. While it’s not as high-level as raw source code, it’s definitely more abstract and structured than assembly. Think of it as an intermediate step between source code and machine code.

When you open a .NET binary in DNSpy, it reads the MSIL and decompiles it back into high-level code—usually C# or VB.NET. That essentially gives us code that’s often so close to the original, you’d think it was the developer’s source file. DNSpy doesn’t stop there, though. Its built-in debugger lets you run and manipulate the binary, giving you insight into what the code does at runtime. This combination of static analysis and dynamic debugging makes it an incredibly powerful tool, especially when you're trying to deobfuscate complex methods.

This works because .NET binaries rely on the Common Language Runtime (CLR) to translate MSIL into machine code at runtime. Since the MSIL is still intact inside the binary, DNSpy can peel it apart, function by function, and give you everything you need to understand what the program is doing. That’s why DNSpy is a go-to tool for analyzing malicious .NET software—it turns the malware author’s convenience into your advantage.

### Loading Chrome.exe into DNSpy
Upon loading your file into DNSpy and expanding it, you'll first typically notice entries in yellow. These are the "custom" namespaces used by the binary. In our case, we notice two of them:
1. My
2. Stub
If we expand both, we're presented a big lists of classes and methods to those classes. The values in orange are methods, the ones in dark green are classes, the ones in orange methods and the ones in purple class fields. If you've got a pair of eyes you will quickly notice all of the names have been obfuscated.
![DNSpy obfuscated view](/images/threat-hunting-for-giggles/dnspy-obfuscated-view.png)

I'll spare you the details but what I typically like doing when reversing a .NET binary is:
1. Rename simply methods that are easy to understand
2. Rename obfuscated imports
3. Rename based on patterns that are simply to understand (configs for example)
A trick I picked up from [LaureWired](https://www.youtube.com/@lauriewired) is to prepend the malware code with `mw_` to clearly identify what's library code and what's malware code. This tends to make my life easier throughout the reversing process. After a bit of deobfuscation, this is what we end up with.

Upon starting my analysis, I quickly realized the sample was full of obfuscated garbage methods that either only returned an int or returned a random string.
One nice feature DNSpy offers, is "analysis" where it'll show you all the references made from and to a given asset. This is super helpful as we can quickly triage which values are garbage and which aren't to then delete the useless ones making the
overall script much cleaner. By leveraging this, we can easily go from classes like these:
![Garbage methods before cleanup](/images/threat-hunting-for-giggles/garbage-methods-before.png)

To classes like these:
![Garbage methods after cleanup](/images/threat-hunting-for-giggles/garbage-methods-after.png)


### Finding the C2 config
So after a bit of messing around I ended up finding that the main function starts by manipulating these values
![Main function values](/images/threat-hunting-for-giggles/main-function-values.png)

Which, after a bit of tracking, we quickly realise are values stored statically here. It's fairly easy, to determine these are encrypted however. I initially thought it could just be plain ol' base64 values but it gave me junk when I tried decoding it the first time.
![Encrypted values](/images/threat-hunting-for-giggles/encrypted-values.png)

By tracking the methods invoked against those values, we end up finding calls to a decryption method that reads those values (after being base64 decoded) and runs them through a simple AES implementation

Essentially, the code decrypts an AES-encrypted string by creating a decryption key from the MD5 hash the value used to create a named mutex. It uses this key in AES's ECB mode to decrypt the data, converting the Base64 string to bytes, decrypting it, and then returning the result as a readable string.
![AES decryption method](/images/threat-hunting-for-giggles/aes-decryption-method.png)

With a bit of ChatGPT we can easily decrypt and see exactly where the C2 is. This also gives us important data to create detection rules!

```
mw_IPAddress: 103.230.121.124
mw_socketPort: 7000
mw_AESKey: <123456789>
mw_XwormTag: <Xwormmm>
mw_malwareName: GoogleChrome
mw_driveInfectionFilename: USB.exe
mw_InstallPath :%AppData%
mw_localFilename: Chrome.exe
mw_logFile: %temp%\Log.tmp
mw_sleepTimeInSeconds: 10
```

### Communications

After reviewing how the malware communicates with it's C2 I noticed a few interesting things. First and foremost, the sample communicates over TCP, it's able to leverage a pool of IPs until it finds one that works and supports making healthchecks by making a "ping" and "pong" request
![Communications code](/images/threat-hunting-for-giggles/communications-code.png)

Now digging into the supported commands, we see quite a few. I won't go into all of them but here's the full list without the detailed explanation:
- `ping/pong`: Used for healthcheck purposes
- `rec`: Restarts the malware
- `close`: Full shutdown (without wipe) of the malware
- `uninstall`: Uninstalls the malware
- `update`: Updates the malware
- `DW`: Downloads and executes a PS1 script
- `FM`: Loads gzip compressed shellcode
- `LN`: Downloads an executable and runs it
- `Urlopen`: Opens a URL in the victims browser
- `Urlhide`: "Silently" (non-browser) downloads a file
- `PCShutdown`: Shuts down the computer
- `PCRestart`: Restarts the computer
- `RunShell`: Runs an arbitrary command sent by the C2 via [Interaction.Shell](https://learn.microsoft.com/en-us/dotnet/api/microsoft.visualbasic.interaction.shell?view=net-9.0)
- `StartDDos`: Self explanatory
- `StopDDos`: Self explanatory
- `StartReport`: Start monitoring and reporting periodically the current running processes
- `StopReport`: Self explanatory
- `Xchat`: Not sure
- `Hosts`: Exfiltrates the `\\drivers\\etc\\hosts` file
- `Shosts`: Writes data to the hosts file
- `DDos`: Just replies with `DDos` (unimplemented maybe?)
- `ngrok`: Not sure
- `plugin`: Gets currently installed plugins
- `savePlugins`: Install a new plugin
- `RemotePlugins`: Removes a plugin
- `OfflineGet`: Exfiltrates the log file
- `$Cap`: Takes a screenshot

Since this analysis is getting somewhat lengthy I'll split it in a few parts. In the next posts we'll review:
- It's capabilities and how it achieves them
- Analyzing it in a dynamic environment
- Creating detection rules based on the IOCs we've found