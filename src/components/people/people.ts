// src/components/people/people.ts
import type { Person } from "./PersonCard";

export const PEOPLE: Person[] = [
    {
        name: "Humpty/Tony",
        role: "SOC Analyst | Malware reverse engineer",
        bio:
            "Security analyst focused on detection, response, and malware reverse engineering. " +
            "Shares research and experiments on Humpty’s RE Blog.\n\n Founder of IRCC.",
        links: {
            website: "https://c-b.io",
            github: "https://github.com/cyb3rjerry",
            twitter: "https://x.com/cyb3rjerry",
            email: "mailto:humpty@irchaos.club",
            linkedin: "https://www.linkedin.com/in/cedric-brisson/"
        },
    },
    {
        name: "grepStrength",
        role: "GRC | CTI Escapee | Security Analyst | Malware Researcher",
        bio:
            "Professionally works as a GRC engineer (you read that right) who focuses on validating security controls, network configurations, and reverse engineering software to assess their risk. Personally enjoys blogging about various cyber topics, especially malware research. Will one day create a sigma rule that works.",
        links: {
            website: "https://grepstrength.dev/",
            github: "https://github.com/grepstrength",
            linkedin: "https://www.linkedin.com/in/kelvin-winborne/"
        }
    }
];
