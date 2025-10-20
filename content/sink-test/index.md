---
title: "Markdown Sink Test"
date: "2025-10-19"
authors: ["Cedric"]
tags: ["test", "markdown", "site"]
description: "Exhaustive test of markdown features: headings, images, code, tables, lists, footnotes, etc."
---

> Quick note: put a local image at **/public/images/sink-test/coveo-logo.png** so the local image test shows something.

## Headings
### H3 level
#### H4 level

## Images
Local (from `/public`):
![Coveo Logo](/images/sink-test/coveo-logo.png "Local image from /public")

External:
![Placeholder 600x200](https://placehold.co/600x200/png?text=External+Image "External placeholder")

Image with title + alt:
![Alt describes the image clearly](/images/sink-test/coveo-logo.png "Title shows on hover")

## Links
Inline: [Go to home](/)

Reference: [Contentlayer site][contentlayer]

Autolink: https://cloud.umami.is

[contentlayer]: https://www.contentlayer.dev

## Lists
- Unordered 1
- Unordered 2
  - Nested A
  - Nested B
    - Nested C

1. Ordered one
2. Ordered two
   1. Sub-one
   2. Sub-two

## Task list (GFM)
- [x] Works completed
- [ ] Pending item
- [ ] Another unchecked

## Emphasis, code, strike, smallcaps-ish
- *Italic* and **bold** and ***both***.
- Inline code: `console.log("hello")`
- Strikethrough: ~~deprecated~~

## Blockquote
> This is a blockquote with multiple lines.
>
> - Can contain lists
> - And **emphasis**

## Code blocks

Plain (no language):
```
SELECT * FROM events WHERE user_id = 42;
```

JavaScript:
```js
export function greet(name) {
  console.log(`Hello, ${name}!`);
}
greet("world");
```

Bash:
```bash
curl -sSL https://example.com/install.sh | bash
```

Diff:
```diff
- const mode = "dev";
+ const mode = "prod";
```

Very long line (tests overflow/scroll):
```txt
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
```

## Tables (GFM)
| Feature        | Supported | Notes                                      |
|----------------|-----------|--------------------------------------------|
| Tables         | Yes       | Should render as `<table>`                 |
| Task Lists     | Yes       | Needs GFM                                  |
| Strikethrough  | Yes       | Needs GFM                                  |
| Footnotes      | Yes       | Needs GFM                                  |

Wide table (tests horizontal scrolling):

| Col 1 | Col 2 | Col 3 | Col 4 | Col 5 | Col 6 | Col 7 | Col 8 |
|------:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:------|
| 1     | 2     | 3     | 4     | 5     | 6     | 7     | 8     |
| 9     | 10    | 11    | 12    | 13    | 14    | 15    | 16    |

## Footnotes (GFM)
Here is a statement with a footnote.[^1] And another one.[^another]

[^1]: This is the first footnote.
[^another]: Footnote with **bold** and `inline code`.

## Details / Summary (HTML)
<details>
  <summary>Click to expand details</summary>
  <p>This uses raw HTML elements inside markdown.</p>
  <ul>
    <li>List item A</li>
    <li>List item B</li>
  </ul>
</details>

## Figure + Caption (HTML)
<figure>
  <img src="/images/sink-test/coveo-logo.png" alt="Coveo mark" />
  <figcaption><em>Figure:</em> Local image with caption.</figcaption>
</figure>

## Horizontal rule
---
