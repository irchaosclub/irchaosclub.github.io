// contentlayer.config.ts
import { defineDocumentType, makeSource } from 'contentlayer/source-files'
import rehypeHighlight from 'rehype-highlight'

export const Post = defineDocumentType(() => ({
    name: 'Post',
    // supports both content/foo/index.md and content/bar.md
    filePathPattern: '**/*.md',
    contentType: 'markdown',
    fields: {
        title: { type: 'string', required: true },
        date: { type: 'date', description: 'Publish date', required: true },

        // optional front-matter you already use:
        authors: { type: 'list', of: { type: 'string' }, required: false },
        tags: { type: 'list', of: { type: 'string' }, required: false },
        description: { type: 'string', required: false },
        readingTime: { type: 'number', required: false },
        external: { type: 'string', required: false },
    },
    computedFields: {
        slug: {
            type: 'string',
            // normalized and no trailing /index (Windows-safe)
            resolve: (doc) =>
                doc._raw.flattenedPath.replace(/\\/g, '/').replace(/\/index$/i, ''),
        },
    },
}))

export default makeSource({
    contentDirPath: 'content',
    documentTypes: [Post],
    // cast avoids Windows/vfile type collisions
    markdown: { rehypePlugins: [rehypeHighlight as unknown as any] },
})
